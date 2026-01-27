use anchor_lang::prelude::*;
use crate::state::{UserProfile, RipRecord, DeathRecord, Graveyard};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct ClaimRipReward<'info> {
    /// RIP 发送者 (领取奖励)
    #[account(mut)]
    pub claimer: Signer<'info>,

    /// 死者的 UserProfile
    #[account(
        seeds = [b"user_profile", deceased_owner.key().as_ref()],
        bump = deceased_profile.bump,
        constraint = deceased_profile.is_dead @ ErrorCode::UserNotDead,
        constraint = deceased_profile.mode == 1 @ ErrorCode::NotFeastMode,
    )]
    pub deceased_profile: Account<'info, UserProfile>,

    /// CHECK: 死者钱包地址
    pub deceased_owner: UncheckedAccount<'info>,

    /// Death Record
    #[account(
        mut,
        seeds = [b"death", deceased_owner.key().as_ref()],
        bump = death_record.bump,
        constraint = death_record.total_reward > 0 @ ErrorCode::NoRewardToClaim,
    )]
    pub death_record: Account<'info, DeathRecord>,

    /// RIP 记录
    #[account(
        mut,
        seeds = [b"rip", claimer.key().as_ref(), deceased_owner.key().as_ref()],
        bump = rip_record.bump,
        constraint = rip_record.rip_amount > 0 @ ErrorCode::NoRewardToClaim,
    )]
    pub rip_record: Account<'info, RipRecord>,

    /// Graveyard PDA (奖励来源)
    #[account(
        mut,
        seeds = [b"graveyard"],
        bump = graveyard.bump
    )]
    pub graveyard: Account<'info, Graveyard>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimRipReward>) -> Result<()> {
    // 验证游戏轮次匹配
    require!(
        ctx.accounts.rip_record.target_round == ctx.accounts.death_record.deceased_round,
        ErrorCode::InvalidGameRound
    );

    // 首先读取所有需要的数据 (不可变借用)
    let user_rips = ctx.accounts.rip_record.rip_amount as u64;
    let total_rips = ctx.accounts.death_record.total_rips as u64;
    let total_reward = ctx.accounts.death_record.total_reward;
    let already_claimed = ctx.accounts.rip_record.claimed_reward;
    
    require!(total_rips > 0, ErrorCode::NoRewardToClaim);

    // 按比例计算奖励 (防止精度损失，先乘后除)
    let entitled_reward = total_reward
        .checked_mul(user_rips)
        .ok_or(ErrorCode::Overflow)?
        .checked_div(total_rips)
        .ok_or(ErrorCode::Overflow)?;

    // 扣除已领取的部分
    let claimable = entitled_reward
        .checked_sub(already_claimed)
        .ok_or(ErrorCode::NoRewardToClaim)?;

    require!(claimable > 0, ErrorCode::NoRewardToClaim);

    // 检查 Graveyard 余额
    let graveyard_balance = ctx.accounts.graveyard.to_account_info().lamports();
    require!(graveyard_balance >= claimable, ErrorCode::InsufficientFunds);

    // 从 Graveyard 转账给 claimer
    **ctx.accounts.graveyard.to_account_info().try_borrow_mut_lamports()? -= claimable;
    **ctx.accounts.claimer.to_account_info().try_borrow_mut_lamports()? += claimable;

    // 更新 RIP 记录
    let rip_record = &mut ctx.accounts.rip_record;
    rip_record.claimed_reward = rip_record.claimed_reward
        .checked_add(claimable)
        .ok_or(ErrorCode::Overflow)?;

    // 更新 Death Record
    let death_record = &mut ctx.accounts.death_record;
    death_record.distributed_reward = death_record.distributed_reward
        .checked_add(claimable)
        .ok_or(ErrorCode::Overflow)?;

    // 更新 Graveyard
    let graveyard = &mut ctx.accounts.graveyard;
    graveyard.reward_pool = graveyard.reward_pool
        .checked_sub(claimable)
        .ok_or(ErrorCode::Overflow)?;

    msg!(
        "Claimed {} lamports! Claimer: {} | Deceased: {} | RIPs: {}/{}",
        claimable,
        ctx.accounts.claimer.key(),
        ctx.accounts.deceased_owner.key(),
        user_rips,
        total_rips
    );

    Ok(())
}
