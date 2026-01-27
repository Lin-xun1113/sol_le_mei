use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::{UserProfile, DeathRecord};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct Flatline<'info> {
    /// 任何人都可以调用此指令
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_profile", user_profile.owner.as_ref()],
        bump = user_profile.bump,
    )]
    pub user_profile: Account<'info, UserProfile>,

    /// CHECK: Vault PDA (需要 PDA 签名才能转账)
    #[account(
        mut,
        seeds = [b"vault", user_profile.owner.as_ref()],
        bump = user_profile.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    /// CHECK: 受益人，用于 Safeguard 模式 (Feast 模式可能为零地址)
    #[account(
        mut,
        constraint = beneficiary.key() == user_profile.beneficiary @ ErrorCode::NotBeneficiary
    )]
    pub beneficiary: UncheckedAccount<'info>,

    /// Death Record PDA (仅 Feast 模式创建)
    #[account(
        init_if_needed,
        payer = caller,
        space = DeathRecord::LEN,
        seeds = [b"death", user_profile.owner.as_ref()],
        bump
    )]
    pub death_record: Account<'info, DeathRecord>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Flatline>) -> Result<()> {
    let user_profile = &mut ctx.accounts.user_profile;
    let death_record = &mut ctx.accounts.death_record;
    
    require!(!user_profile.is_dead, ErrorCode::AlreadyDead);

    // 检查是否超时
    let clock = Clock::get()?;
    let deadline = user_profile.last_pulse
        .checked_add(user_profile.timeout_seconds as i64)
        .ok_or(ErrorCode::Overflow)?;
    
    require!(clock.unix_timestamp > deadline, ErrorCode::StillAlive);

    // 标记死亡
    user_profile.is_dead = true;
    user_profile.death_time = clock.unix_timestamp;

    // 获取 Vault 余额
    let vault_balance = ctx.accounts.vault.lamports();
    
    // Safeguard 模式: 使用 PDA 签名转账给受益人
    if user_profile.mode == 0 {
        if vault_balance > 0 {
            // 准备 PDA 签名 seeds
            let user_profile_owner = user_profile.owner;
            let vault_bump = user_profile.vault_bump;
            let vault_seeds = &[
                b"vault".as_ref(),
                user_profile_owner.as_ref(),
                &[vault_bump],
            ];
            let signer_seeds = &[&vault_seeds[..]];

            // 使用 CPI 从 Vault 转账给受益人
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.beneficiary.to_account_info(),
                    },
                    signer_seeds,
                ),
                vault_balance,
            )?;

            msg!("Safeguard Mode: Transferred {} lamports to beneficiary", vault_balance);
        } else {
            msg!("Safeguard Mode: User declared dead, vault is empty");
        }
    } else {
        // Feast 模式: 创建死亡记录，等待 loot
        death_record.deceased = user_profile.owner;
        death_record.total_rips = user_profile.rip_count;
        death_record.total_reward = 0; // loot 时设置
        death_record.distributed_reward = 0;
        death_record.death_time = clock.unix_timestamp;
        death_record.deceased_round = user_profile.game_round;
        death_record.bump = ctx.bumps.death_record;
        
        msg!(
            "Feast Mode: {} is dead! Vault: {} lamports, Total RIPs: {}",
            user_profile.owner,
            vault_balance,
            user_profile.rip_count
        );
    }

    Ok(())
}
