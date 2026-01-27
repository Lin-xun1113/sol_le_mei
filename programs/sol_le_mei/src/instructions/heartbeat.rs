use anchor_lang::prelude::*;
use crate::state::UserProfile;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct Heartbeat<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.owner == user.key() @ ErrorCode::NotOwner,
        constraint = !user_profile.is_dead @ ErrorCode::AlreadyDead,
    )]
    pub user_profile: Account<'info, UserProfile>,
}

pub fn handler(ctx: Context<Heartbeat>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    
    // 检查是否死亡
    require!(!user_profile.is_dead, ErrorCode::AlreadyDead);

    // 更新心跳
    let clock = Clock::get()?;
    user_profile.last_pulse = clock.unix_timestamp;

    msg!("Heartbeat recorded at {}", clock.unix_timestamp);
    Ok(())
}
