# Sol了没 - 合约运行逻辑

## 状态机概览

```
┌─────────────┐     register      ┌─────────────┐
│  未注册      │ ───────────────► │   活着       │
│ (No Account)│                  │  (Alive)    │
└─────────────┘                  └──────┬──────┘
                                        │
                         heartbeat      │ 超时 (timeout)
                         ◄──────────────┤
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │   死亡       │
                                 │  (Dead)     │
                                 └──────┬──────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼ mode=0 (Safeguard)                    ▼ mode=1 (Feast)
            ┌───────────────┐                       ┌───────────────┐
            │ 转给受益人      │                       │ 等待捡漏       │
            │ (Beneficiary) │                       │ (Awaiting Loot)│
            └───────────────┘                       └───────┬───────┘
                                                            │ loot
                                                            ▼
                                                    ┌───────────────┐
                                                    │ 遗产被瓜分     │
                                                    │ (Looted)      │
                                                    └───────────────┘
```

---

## 账户结构

### 1. UserProfile (用户档案)
```rust
pub struct UserProfile {
    pub owner: Pubkey,           // 用户钱包
    pub last_pulse: i64,         // 上次心跳时间戳
    pub timeout_seconds: u64,    // 超时阈值（秒）
    pub beneficiary: Pubkey,     // 受益人钱包
    pub mode: u8,                // 0=Safeguard, 1=Feast
    pub is_dead: bool,           // 是否已死亡
    pub rip_count: u32,          // 收到的 RIP 数量
    pub bump: u8,                // PDA bump
    pub vault_bump: u8,          // Vault PDA bump
}
// PDA Seeds: ["user_profile", user_pubkey]
// 账户大小: 96 bytes
```

### 2. Vault (资金保险库)
```
// 这是一个 System Account (不是自定义账户)
// PDA Seeds: ["vault", user_pubkey]
// 用于存放用户质押的 SOL
```

### 3. Graveyard (公共墓地)
```rust
pub struct Graveyard {
    pub authority: Pubkey,       // 项目方管理员
    pub reward_pool: u64,        // RIP 奖励池 (lamports)
    pub protocol_fees: u64,      // 协议收入 (lamports)
    pub bump: u8,
}
// PDA Seeds: ["graveyard"]
// 全局唯一账户
```

### 4. RipRecord (RIP 记录)
```rust
pub struct RipRecord {
    pub sender: Pubkey,          // 发送者
    pub target: Pubkey,          // 目标用户
    pub timestamp: i64,          // 发送时间
    pub bump: u8,
}
// PDA Seeds: ["rip", sender_pubkey, target_pubkey]
// 每个 sender-target 组合唯一
```

---

## 指令流程详解

### 1. initialize_graveyard
**目的**: 初始化全局公共墓地账户（仅执行一次）

```
调用者: 项目方管理员
前置条件: Graveyard 账户不存在
结果: 创建 Graveyard PDA，authority 设为调用者
```

### 2. register
**目的**: 注册新用户

```
参数:
  - timeout_seconds: u64 (最小 60 秒)
  - mode: u8 (0=Safeguard, 1=Feast)

账户:
  - user: 用户钱包 (Signer, 付款)
  - user_profile: UserProfile PDA (Init)
  - vault: Vault PDA
  - beneficiary: 受益人地址
  - system_program

结果:
  - 创建 UserProfile 账户
  - last_pulse 设为当前时间
  - is_dead = false
  - rip_count = 0
```

### 3. heartbeat
**目的**: 签到续命

```
账户:
  - user: 用户钱包 (Signer)
  - user_profile: UserProfile PDA (Mut)

前置条件:
  - user 是 user_profile.owner
  - is_dead == false

结果:
  - last_pulse 更新为当前时间
```

### 4. deposit
**目的**: 存入资金到 Vault

```
参数:
  - amount: u64 (lamports)

账户:
  - user: 用户钱包 (Signer, 付款)
  - user_profile: UserProfile PDA
  - vault: Vault PDA (Mut)
  - system_program

结果:
  - 从 user 转 amount lamports 到 vault
```

### 5. send_rip
**目的**: 给其他用户发送 RIP（悼念）

```
账户:
  - sender: 发送者钱包 (Signer, 付款 - 账户租金)
  - target_profile: 目标用户的 UserProfile (Mut)
  - target_owner: 目标用户钱包地址
  - rip_record: RipRecord PDA (Init if needed)
  - system_program

前置条件:
  - sender != target_owner
  - target_profile.is_dead == false

结果:
  - 创建/更新 RipRecord
  - target_profile.rip_count += 1
```

### 6. flatline
**目的**: 判定用户死亡，执行遗嘱

```
账户:
  - caller: 任何人 (Signer)
  - user_profile: UserProfile PDA (Mut)
  - vault: Vault PDA (Mut)
  - beneficiary: 受益人钱包 (Mut)
  - system_program

前置条件:
  - is_dead == false
  - current_time > last_pulse + timeout_seconds

结果:
  - is_dead = true
  - 如果 mode == 0 (Safeguard):
    - vault 余额全部转给 beneficiary
  - 如果 mode == 1 (Feast):
    - 资金留在 vault，等待 loot
```

### 7. loot
**目的**: (Feast 模式) 捡漏死者遗产

```
账户:
  - looter: 捡漏者钱包 (Signer)
  - user_profile: 死者的 UserProfile (Mut)
  - vault: 死者的 Vault (Mut)
  - graveyard: Graveyard PDA (Mut)
  - system_program

前置条件:
  - user_profile.is_dead == true
  - user_profile.mode == 1 (Feast)
  - vault 余额 > 0

分配逻辑:
  vault_balance = vault 全部余额
  
  looter_share = vault_balance * 50%
  graveyard_share = vault_balance * 50%
    ├── protocol_fee = graveyard_share * 10%
    └── reward_pool = graveyard_share * 90%

结果:
  - looter 获得 50%
  - graveyard 账户获得 50%
    - graveyard.protocol_fees += 10%
    - graveyard.reward_pool += 90%
  - vault 清空
```

---

## 时间线示例

```
T=0:    用户 A 调用 register(timeout=86400, mode=1)
        → last_pulse = T=0, is_dead = false

T=100:  用户 A 调用 deposit(1 SOL)
        → vault 余额 = 1 SOL

T=200:  用户 B 调用 send_rip(target=A)
        → A.rip_count = 1

T=1000: 用户 A 调用 heartbeat()
        → last_pulse = T=1000

T=90000: (A 已超时，86400秒未签到)
        用户 C 调用 flatline(A)
        → A.is_dead = true
        → vault 资金保留 (因为 mode=1)

T=90001: 用户 D 调用 loot(A)
        → D 获得 0.5 SOL
        → Graveyard 获得 0.5 SOL
          - protocol_fees += 0.05 SOL
          - reward_pool += 0.45 SOL
```

---

## 错误码

| Code | Name              | 说明                           |
| ---- | ----------------- | ------------------------------ |
| 6000 | StillAlive        | 用户仍然活着，无法执行死亡判定 |
| 6001 | AlreadyDead       | 用户已经死亡                   |
| 6002 | InvalidMode       | 无效的模式                     |
| 6003 | TimeoutTooShort   | 超时时间太短 (< 60秒)          |
| 6004 | InsufficientFunds | 资金不足                       |
| 6005 | NotBeneficiary    | 只有受益人可以提取             |
| 6006 | NotFeastMode      | 此用户不是 Feast 模式          |
| 6007 | Overflow          | 数值溢出                       |
