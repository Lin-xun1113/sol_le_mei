use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("用户仍然活着，无法执行死亡判定")]
    StillAlive,

    #[msg("用户已经死亡")]
    AlreadyDead,

    #[msg("无效的模式")]
    InvalidMode,

    #[msg("超时时间太短")]
    TimeoutTooShort,

    #[msg("资金不足")]
    InsufficientFunds,

    #[msg("只有受益人可以提取")]
    NotBeneficiary,

    #[msg("此用户不是 Feast 模式")]
    NotFeastMode,

    #[msg("数值溢出")]
    Overflow,

    #[msg("RIP 数量必须大于 0")]
    InvalidAmount,

    #[msg("不能给自己发 RIP")]
    CannotRipSelf,

    #[msg("没有可领取的奖励")]
    NoRewardToClaim,

    #[msg("用户还未死亡，无法领取奖励")]
    UserNotDead,

    #[msg("只有账户所有者可以执行此操作")]
    NotOwner,

    #[msg("只有管理员可以执行此操作")]
    NotAuthority,

    #[msg("Vault 必须为空才能关闭账户")]
    VaultNotEmpty,

    #[msg("冷却期未结束，3天后才能复活或自救")]
    CooldownNotEnded,

    #[msg("游戏轮次不匹配，该 RIP 记录已失效")]
    InvalidGameRound,
}
