use anchor_lang::prelude::*;
use crate::state::UserProfile;
use crate::errors::ErrorCode;

/// 最小超时时间: 60秒
const MIN_TIMEOUT_SECONDS: u64 = 60;

#[derive(Accounts)]
pub struct Register<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Vault PDA for holding user funds
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    /// CHECK: 受益人地址，仅存储
    pub beneficiary: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Register>, timeout_seconds: u64, mode: u8) -> Result<()> {
    require!(timeout_seconds >= MIN_TIMEOUT_SECONDS, ErrorCode::TimeoutTooShort);
    require!(mode <= 1, ErrorCode::InvalidMode);

    let user_profile = &mut ctx.accounts.user_profile;
    let clock = Clock::get()?;

    user_profile.owner = ctx.accounts.user.key();
    user_profile.last_pulse = clock.unix_timestamp;
    user_profile.timeout_seconds = timeout_seconds;
    user_profile.beneficiary = ctx.accounts.beneficiary.key();
    user_profile.mode = mode;
    user_profile.is_dead = false;
    user_profile.rip_count = 0;
    user_profile.rip_earnings = 0;
    user_profile.death_time = 0;
    user_profile.game_round = 1;
    user_profile.bump = ctx.bumps.user_profile;
    user_profile.vault_bump = ctx.bumps.vault;

    msg!("User registered! Mode: {}, Timeout: {}s", mode, timeout_seconds);
    Ok(())
}
