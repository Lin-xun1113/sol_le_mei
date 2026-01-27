use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::state::UserProfile;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump,
        constraint = user_profile.owner == user.key() @ ErrorCode::NotBeneficiary,
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Vault PDA
    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = user_profile.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InsufficientFunds);

    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        },
    );

    system_program::transfer(cpi_context, amount)?;

    msg!("Deposited {} lamports to vault", amount);
    Ok(())
}
