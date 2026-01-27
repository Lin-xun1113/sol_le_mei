use anchor_lang::prelude::*;
use crate::state::Graveyard;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    /// 当前管理员
    #[account(
        constraint = current_authority.key() == graveyard.authority @ ErrorCode::NotAuthority
    )]
    pub current_authority: Signer<'info>,

    /// CHECK: 新管理员地址
    pub new_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"graveyard"],
        bump = graveyard.bump
    )]
    pub graveyard: Account<'info, Graveyard>,
}

pub fn handler(ctx: Context<TransferAuthority>) -> Result<()> {
    let graveyard = &mut ctx.accounts.graveyard;
    let old_authority = graveyard.authority;
    
    graveyard.authority = ctx.accounts.new_authority.key();

    msg!(
        "Authority transferred from {} to {}",
        old_authority,
        graveyard.authority
    );

    Ok(())
}
