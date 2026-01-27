use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{UserProfile, Graveyard, DeathRecord};
use crate::errors::ErrorCode;

/// 协议费率: 10% of graveyard share
const PROTOCOL_FEE_BPS: u64 = 1000; // 10% in basis points

/// 冷却期: 3天 (秒)
const COOLDOWN_SECONDS: i64 = 3 * 24 * 60 * 60;

#[derive(Accounts)]
pub struct Loot<'info> {
    /// 秃鹫玩家
    #[account(mut)]
    pub looter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_profile", user_profile.owner.as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.is_dead @ ErrorCode::StillAlive,
        constraint = user_profile.mode == 1 @ ErrorCode::NotFeastMode,
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Vault PDA (需要 PDA 签名才能转账)
    #[account(
        mut,
        seeds = [b"vault", user_profile.owner.as_ref()],
        bump = user_profile.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    /// Graveyard PDA
    #[account(
        mut,
        seeds = [b"graveyard"],
        bump = graveyard.bump
    )]
    pub graveyard: Account<'info, Graveyard>,

    /// Death Record PDA
    #[account(
        mut,
        seeds = [b"death", user_profile.owner.as_ref()],
        bump = death_record.bump
    )]
    pub death_record: Account<'info, DeathRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Loot>) -> Result<()> {
    let vault_balance = ctx.accounts.vault.lamports();
    let clock = Clock::get()?;
    
    require!(vault_balance > 0, ErrorCode::InsufficientFunds);

    // 检查是否是孤魂野鬼自己 Loot 自己
    let is_self_loot = ctx.accounts.looter.key() == ctx.accounts.user_profile.owner;
    
    if is_self_loot {
        // 孤魂野鬼自救：必须死亡超过 3 天无人 Loot
        let death_time = ctx.accounts.user_profile.death_time;
        require!(
            clock.unix_timestamp >= death_time + COOLDOWN_SECONDS,
            ErrorCode::CooldownNotEnded
        );
        msg!("Self-loot by abandoned ghost after cooldown period");
    }

    // 计算分成
    // 50% 给 Looter
    let looter_share = vault_balance / 2;
    // 50% 进入 Graveyard
    let graveyard_share = vault_balance - looter_share;
    
    // Graveyard 内部分配: 10% 协议费, 90% 奖励池 (给 RIP 发送者)
    let protocol_fee = graveyard_share * PROTOCOL_FEE_BPS / 10000;
    let reward_pool_share = graveyard_share - protocol_fee;

    // 准备 PDA 签名 seeds
    let user_profile_owner = ctx.accounts.user_profile.owner;
    let vault_bump = ctx.accounts.user_profile.vault_bump;
    let vault_seeds = &[
        b"vault".as_ref(),
        user_profile_owner.as_ref(),
        &[vault_bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    // 使用 CPI 从 Vault 转账给 Looter
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.looter.to_account_info(),
            },
            signer_seeds,
        ),
        looter_share,
    )?;

    // 使用 CPI 从 Vault 转账给 Graveyard
    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.graveyard.to_account_info(),
            },
            signer_seeds,
        ),
        graveyard_share,
    )?;

    // 更新 Graveyard 状态
    let graveyard = &mut ctx.accounts.graveyard;
    graveyard.protocol_fees = graveyard.protocol_fees
        .checked_add(protocol_fee)
        .ok_or(ErrorCode::Overflow)?;
    graveyard.reward_pool = graveyard.reward_pool
        .checked_add(reward_pool_share)
        .ok_or(ErrorCode::Overflow)?;

    // 更新 Death Record - 设置可分配的奖励
    let death_record = &mut ctx.accounts.death_record;
    death_record.total_reward = reward_pool_share;

    msg!(
        "LOOTED! Vault: {} | Looter: {} | Graveyard: {} (Protocol: {}, Rewards: {})",
        vault_balance,
        looter_share,
        graveyard_share,
        protocol_fee,
        reward_pool_share
    );

    Ok(())
}
