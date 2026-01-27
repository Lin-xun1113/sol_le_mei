use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::state::{UserProfile, RipRecord, Graveyard, RIP_PRICE_LAMPORTS};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct SendRip<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    /// 目标用户的 Profile
    #[account(
        mut,
        seeds = [b"user_profile", target_owner.key().as_ref()],
        bump = target_profile.bump,
    )]
    pub target_profile: Account<'info, UserProfile>,

    /// CHECK: 目标用户的钱包地址 (接收 50% RIP 收入)
    #[account(mut)]
    pub target_owner: SystemAccount<'info>,

    /// 目标用户的 Vault (仅用于验证 PDA)
    /// CHECK: Vault PDA
    #[account(
        seeds = [b"vault", target_owner.key().as_ref()],
        bump = target_profile.vault_bump
    )]
    pub target_vault: SystemAccount<'info>,

    /// Graveyard PDA (接收 50% 协议费)
    #[account(
        mut,
        seeds = [b"graveyard"],
        bump = graveyard.bump
    )]
    pub graveyard: Account<'info, Graveyard>,

    /// RIP 记录 PDA (每个 sender-target 组合唯一)
    #[account(
        init_if_needed,
        payer = sender,
        space = RipRecord::LEN,
        seeds = [b"rip", sender.key().as_ref(), target_owner.key().as_ref()],
        bump
    )]
    pub rip_record: Account<'info, RipRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SendRip>, rip_amount: u32) -> Result<()> {
    let clock = Clock::get()?;

    // 验证
    require!(rip_amount > 0, ErrorCode::InvalidAmount);
    require!(
        ctx.accounts.sender.key() != ctx.accounts.target_owner.key(),
        ErrorCode::CannotRipSelf
    );
    require!(!ctx.accounts.target_profile.is_dead, ErrorCode::AlreadyDead);

    // 计算总费用
    let total_cost = (rip_amount as u64)
        .checked_mul(RIP_PRICE_LAMPORTS)
        .ok_or(ErrorCode::Overflow)?;

    // 50% 给目标用户钱包 (即时到账，不受死亡/Loot 影响)
    let user_share = total_cost / 2;
    // 50% 给项目方
    let protocol_share = total_cost - user_share;

    // 转账给目标用户钱包 (直接到账，不进 Vault)
    let cpi_context_user = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.sender.to_account_info(),
            to: ctx.accounts.target_owner.to_account_info(),
        },
    );
    system_program::transfer(cpi_context_user, user_share)?;

    // 转账给 Graveyard (协议费)
    let cpi_context_protocol = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.sender.to_account_info(),
            to: ctx.accounts.graveyard.to_account_info(),
        },
    );
    system_program::transfer(cpi_context_protocol, protocol_share)?;

    // 更新 Graveyard 协议费
    let graveyard = &mut ctx.accounts.graveyard;
    graveyard.protocol_fees = graveyard.protocol_fees
        .checked_add(protocol_share)
        .ok_or(ErrorCode::Overflow)?;

    // 更新 RIP 记录 (累加)
    let rip_record = &mut ctx.accounts.rip_record;
    let target_profile = &ctx.accounts.target_profile;
    
    if rip_record.sender == Pubkey::default() {
        // 首次初始化
        rip_record.sender = ctx.accounts.sender.key();
        rip_record.target = ctx.accounts.target_owner.key();
        rip_record.rip_amount = rip_amount;
        rip_record.claimed_reward = 0;
        rip_record.target_round = target_profile.game_round;
        rip_record.bump = ctx.bumps.rip_record;
    } else {
        // 累加 (同一轮次内)
        // 如果目标用户已经复活进入新轮次，旧记录失效，需重新开始
        if rip_record.target_round != target_profile.game_round {
            // 新轮次，重置记录
            rip_record.rip_amount = rip_amount;
            rip_record.claimed_reward = 0;
            rip_record.target_round = target_profile.game_round;
        } else {
            // 同轮次，累加
            rip_record.rip_amount = rip_record.rip_amount
                .checked_add(rip_amount)
                .ok_or(ErrorCode::Overflow)?;
        }
    }
    rip_record.last_updated = clock.unix_timestamp;

    // 更新目标用户的 RIP 计数和收入
    let target_profile = &mut ctx.accounts.target_profile;
    target_profile.rip_count = target_profile.rip_count
        .checked_add(rip_amount)
        .ok_or(ErrorCode::Overflow)?;
    target_profile.rip_earnings = target_profile.rip_earnings
        .checked_add(user_share)
        .ok_or(ErrorCode::Overflow)?;

    msg!(
        "RIP x{} sent from {} to {} | Cost: {} lamports | User: {} | Protocol: {}",
        rip_amount,
        ctx.accounts.sender.key(),
        ctx.accounts.target_owner.key(),
        total_cost,
        user_share,
        protocol_share
    );

    Ok(())
}
