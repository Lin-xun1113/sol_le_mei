use anchor_lang::prelude::*;

declare_id!("3Y9FgmkXC5Ar2DXDXYUTiiyZYwEo4zLh2Fcd3Bg98iJj");

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;

#[program]
pub mod sol_le_mei {
    use super::*;

    /// 初始化公共墓地 (Graveyard)
    pub fn initialize_graveyard(ctx: Context<InitializeGraveyard>) -> Result<()> {
        instructions::init_graveyard::handler(ctx)
    }

    /// 注册新用户，创建 UserProfile 和 Vault
    pub fn register(
        ctx: Context<Register>,
        timeout_seconds: u64,
        mode: u8,
    ) -> Result<()> {
        instructions::register::handler(ctx, timeout_seconds, mode)
    }

    /// 心跳签到，更新 last_pulse
    pub fn heartbeat(ctx: Context<Heartbeat>) -> Result<()> {
        instructions::heartbeat::handler(ctx)
    }

    /// 存入资金到 Vault
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// 发送 RIP (悼念) - 付费版
    /// rip_amount: 购买的 RIP 数量
    /// 费用 = rip_amount * 0.001 SOL
    /// 50% 给目标用户 Vault，50% 给项目方
    pub fn send_rip(ctx: Context<SendRip>, rip_amount: u32) -> Result<()> {
        instructions::send_rip::handler(ctx, rip_amount)
    }

    /// 判定死亡，触发遗嘱执行
    pub fn flatline(ctx: Context<Flatline>) -> Result<()> {
        instructions::flatline::handler(ctx)
    }

    /// (Feast Mode) 秃鹫捡漏 - 50% looter, 50% graveyard
    pub fn loot(ctx: Context<Loot>) -> Result<()> {
        instructions::loot::handler(ctx)
    }

    /// RIP 发送者领取死后奖励 (按 RIP 比例分配)
    pub fn claim_rip_reward(ctx: Context<ClaimRipReward>) -> Result<()> {
        instructions::claim_rip_reward::handler(ctx)
    }

    /// 项目方提取协议费
    pub fn withdraw_protocol_fees(ctx: Context<WithdrawProtocolFees>, amount: u64) -> Result<()> {
        instructions::withdraw_protocol_fees::handler(ctx, amount)
    }

    /// 转移管理员权限
    pub fn transfer_authority(ctx: Context<TransferAuthority>) -> Result<()> {
        instructions::transfer_authority::handler(ctx)
    }

    /// 用户复活 (死后重新开始)
    pub fn resurrect(ctx: Context<Resurrect>) -> Result<()> {
        instructions::resurrect::handler(ctx)
    }

    /// 用户修改设置 (模式永久锁定，不可更改)
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        new_timeout: Option<u64>,
    ) -> Result<()> {
        instructions::update_profile::handler(ctx, new_timeout)
    }
}
