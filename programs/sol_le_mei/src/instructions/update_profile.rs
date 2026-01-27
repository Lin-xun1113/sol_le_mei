use anchor_lang::prelude::*;
use crate::state::UserProfile;
use crate::errors::ErrorCode;

/// 最小超时时间: 60秒
const MIN_TIMEOUT_SECONDS: u64 = 60;

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.owner == user.key() @ ErrorCode::NotOwner,
        constraint = !user_profile.is_dead @ ErrorCode::AlreadyDead,
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: 新受益人地址 (可选)
    pub new_beneficiary: Option<UncheckedAccount<'info>>,
}

/// 修改用户设置
/// 注意: 模式 (mode) 一旦选定，终身不可更改
pub fn handler(
    ctx: Context<UpdateProfile>,
    new_timeout: Option<u64>,
) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;

    // 更新超时时间
    if let Some(timeout) = new_timeout {
        require!(timeout >= MIN_TIMEOUT_SECONDS, ErrorCode::TimeoutTooShort);
        user_profile.timeout_seconds = timeout;
        msg!("Timeout updated to {} seconds", timeout);
    }

    // 更新受益人
    if let Some(ref beneficiary) = ctx.accounts.new_beneficiary {
        user_profile.beneficiary = beneficiary.key();
        msg!("Beneficiary updated to {}", beneficiary.key());
    }

    // 模式 (mode) 永久锁定，不可修改

    Ok(())
}
