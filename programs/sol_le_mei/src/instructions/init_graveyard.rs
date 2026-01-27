use anchor_lang::prelude::*;
use crate::state::Graveyard;

#[derive(Accounts)]
pub struct InitializeGraveyard<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Graveyard::LEN,
        seeds = [b"graveyard"],
        bump
    )]
    pub graveyard: Account<'info, Graveyard>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeGraveyard>) -> Result<()> {
    let graveyard = &mut ctx.accounts.graveyard;
    
    graveyard.authority = ctx.accounts.authority.key();
    graveyard.reward_pool = 0;
    graveyard.protocol_fees = 0;
    graveyard.bump = ctx.bumps.graveyard;

    msg!("Graveyard initialized! Authority: {}", graveyard.authority);
    Ok(())
}
