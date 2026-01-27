use anchor_lang::prelude::*;
use crate::state::Graveyard;
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct WithdrawProtocolFees<'info> {
    /// 项目方管理员
    #[account(
        mut,
        constraint = authority.key() == graveyard.authority @ ErrorCode::NotAuthority
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"graveyard"],
        bump = graveyard.bump
    )]
    pub graveyard: Account<'info, Graveyard>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawProtocolFees>, amount: u64) -> Result<()> {
    // 先读取数据
    let protocol_fees = ctx.accounts.graveyard.protocol_fees;
    
    // 检查可提取金额 (不能超过 protocol_fees)
    require!(amount <= protocol_fees, ErrorCode::InsufficientFunds);
    
    // 检查 Graveyard 实际余额
    let graveyard_balance = ctx.accounts.graveyard.to_account_info().lamports();
    require!(graveyard_balance >= amount, ErrorCode::InsufficientFunds);

    // 转账给 authority
    **ctx.accounts.graveyard.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

    // 更新记录
    let graveyard = &mut ctx.accounts.graveyard;
    graveyard.protocol_fees = graveyard.protocol_fees
        .checked_sub(amount)
        .ok_or(ErrorCode::Overflow)?;

    msg!(
        "Withdrawn {} lamports to authority {} | Remaining: {}",
        amount,
        ctx.accounts.authority.key(),
        graveyard.protocol_fees
    );

    Ok(())
}
