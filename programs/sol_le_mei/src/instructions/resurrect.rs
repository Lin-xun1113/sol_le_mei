use anchor_lang::prelude::*;
use crate::state::UserProfile;
use crate::errors::ErrorCode;

/// 冷却期: 3天 (秒)
const COOLDOWN_SECONDS: i64 = 3 * 24 * 60 * 60;

/// 复活最低 Vault 余额: 0.01 SOL
pub const RESURRECT_MIN_VAULT: u64 = 10_000_000;

#[derive(Accounts)]
pub struct Resurrect<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.owner == user.key() @ ErrorCode::NotOwner,
        constraint = user_profile.is_dead @ ErrorCode::StillAlive,
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Vault PDA - 需要有余额才能复活
    #[account(
        seeds = [b"vault", user.key().as_ref()],
        bump = user_profile.vault_bump
    )]
    pub vault: SystemAccount<'info>,
}

pub fn handler(ctx: Context<Resurrect>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let vault_balance = ctx.accounts.vault.lamports();
    let clock = Clock::get()?;

    // 检查冷却期 (3 天)
    require!(
        clock.unix_timestamp >= user_profile.death_time + COOLDOWN_SECONDS,
        ErrorCode::CooldownNotEnded
    );

    // 复活需要 Vault 有最低余额 (防止无限刷)
    require!(vault_balance >= RESURRECT_MIN_VAULT, ErrorCode::InsufficientFunds);

    // 秽土转生！进入新一轮游戏
    user_profile.is_dead = false;
    user_profile.last_pulse = clock.unix_timestamp;
    user_profile.game_round = user_profile.game_round
        .checked_add(1)
        .ok_or(ErrorCode::Overflow)?;
    
    // 重置本轮数据
    user_profile.rip_count = 0;
    user_profile.rip_earnings = 0;
    user_profile.death_time = 0;

    msg!(
        "User {} resurrected! Now in game round {}",
        ctx.accounts.user.key(),
        user_profile.game_round
    );

    Ok(())
}
