use anchor_lang::prelude::*;

/// RIP 单价: 0.001 SOL = 1_000_000 lamports
pub const RIP_PRICE_LAMPORTS: u64 = 1_000_000;

/// 用户档案账户
#[account]
pub struct UserProfile {
    /// 用户钱包地址
    pub owner: Pubkey,
    /// 上次心跳时间戳 (Unix timestamp)
    pub last_pulse: i64,
    /// 超时阈值（秒）
    pub timeout_seconds: u64,
    /// 受益人钱包 (Safeguard Mode 下使用)
    pub beneficiary: Pubkey,
    /// 模式: 0=Safeguard, 1=Feast
    pub mode: u8,
    /// 是否已死亡
    pub is_dead: bool,
    /// 收到的 RIP 总数量
    pub rip_count: u32,
    /// 累计 RIP 收入 (50% 归用户, lamports) - 死后可提取
    pub rip_earnings: u64,
    /// 死亡时间戳 (用于复活冷却期计算)
    pub death_time: i64,
    /// 游戏轮次 (每次复活+1)
    pub game_round: u64,
    /// PDA bump
    pub bump: u8,
    /// Vault bump
    pub vault_bump: u8,
}

impl UserProfile {
    /// 账户大小: 8 + 32 + 8 + 8 + 32 + 1 + 1 + 4 + 8 + 8 + 8 + 1 + 1 = 120 bytes
    pub const LEN: usize = 8 + 32 + 8 + 8 + 32 + 1 + 1 + 4 + 8 + 8 + 8 + 1 + 1;
}

/// 公共墓地奖池 (Feast Mode)
#[account]
pub struct Graveyard {
    /// 管理员 (项目方)
    pub authority: Pubkey,
    /// 奖池总额 - 可分配给 RIP 发送者 (lamports)
    pub reward_pool: u64,
    /// 协议收入累计 - 包含 RIP 50% + Loot 10% (lamports)
    pub protocol_fees: u64,
    /// PDA bump
    pub bump: u8,
}

impl Graveyard {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}

/// RIP 记录账户 (记录谁给谁发过多少个 RIP)
#[account]
pub struct RipRecord {
    /// 发送者
    pub sender: Pubkey,
    /// 目标用户
    pub target: Pubkey,
    /// 发送的 RIP 数量 (可累加)
    pub rip_amount: u32,
    /// 已领取的奖励 (lamports)
    pub claimed_reward: u64,
    /// 最后更新时间戳
    pub last_updated: i64,
    /// 发送时目标用户的游戏轮次
    pub target_round: u64,
    /// Bump
    pub bump: u8,
}

impl RipRecord {
    /// 账户大小: 8 + 32 + 32 + 4 + 8 + 8 + 8 + 1 = 101 bytes
    pub const LEN: usize = 8 + 32 + 32 + 4 + 8 + 8 + 8 + 1;
}

/// 死亡记录 (用于追踪死者的奖励分配)
#[account]
pub struct DeathRecord {
    /// 死者地址
    pub deceased: Pubkey,
    /// 死亡时的总 RIP 数
    pub total_rips: u32,
    /// 可分配的奖励总额 (lamports)
    pub total_reward: u64,
    /// 已分配的奖励 (lamports)
    pub distributed_reward: u64,
    /// 死亡时间
    pub death_time: i64,
    /// 死者当时的游戏轮次
    pub deceased_round: u64,
    /// Bump
    pub bump: u8,
}

impl DeathRecord {
    /// 账户大小: 8 + 32 + 4 + 8 + 8 + 8 + 8 + 1 = 77 bytes
    pub const LEN: usize = 8 + 32 + 4 + 8 + 8 + 8 + 8 + 1;
}
