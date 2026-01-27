# Sol了没 - 合约 V3 变更日志

> 更新时间: 2026-01-25 16:25
> 
> 版本: V3.0 (游戏公平性优化)

---

## 🎯 核心改动概述

| 改动           | V2 行为                 | V3 行为                        |
| -------------- | ----------------------- | ------------------------------ |
| **模式修改**   | 可随时修改              | ❌ **永久锁定**，注册后不可更改 |
| **复活时机**   | 随时 (Vault ≥ 0.01 SOL) | 🕐 **死亡 3 天后**              |
| **复活数据**   | 保留历史                | 🔄 **全部清零**，进入新一轮     |
| **RIP 有效性** | 永久有效                | 🎮 **绑定游戏轮次**，复活后失效 |
| **自己 Loot**  | ❌ 禁止                  | ✅ **3天后无人 Loot 可自救**    |

---

## 📦 账户结构变更

### UserProfile (空间: 104 → 120 bytes)

```diff
 pub struct UserProfile {
     pub owner: Pubkey,
     pub last_pulse: i64,
     pub timeout_seconds: u64,
     pub beneficiary: Pubkey,
     pub mode: u8,
     pub is_dead: bool,
     pub rip_count: u32,
     pub rip_earnings: u64,
+    pub death_time: i64,    // 🆕 死亡时间戳
+    pub game_round: u64,    // 🆕 游戏轮次 (从1开始)
     pub bump: u8,
     pub vault_bump: u8,
 }
```

**新字段说明**:
- `death_time`: 用户死亡时的 Unix 时间戳，用于计算 3 天冷却期
- `game_round`: 当前游戏轮次，每次复活 +1。用于判断 RIP 记录是否有效

---

### RipRecord (空间: 93 → 101 bytes)

```diff
 pub struct RipRecord {
     pub sender: Pubkey,
     pub target: Pubkey,
     pub rip_amount: u32,
     pub claimed_reward: u64,
     pub last_updated: i64,
+    pub target_round: u64,  // 🆕 发送时目标的游戏轮次
     pub bump: u8,
 }
```

**新字段说明**:
- `target_round`: 发送 RIP 时目标用户的 `game_round`。用于验证 RIP 是否与当前轮次匹配

---

### DeathRecord (空间: 69 → 77 bytes)

```diff
 pub struct DeathRecord {
     pub deceased: Pubkey,
     pub total_rips: u32,
     pub total_reward: u64,
     pub distributed_reward: u64,
     pub death_time: i64,
+    pub deceased_round: u64,  // 🆕 死者当时的游戏轮次
     pub bump: u8,
 }
```

**新字段说明**:
- `deceased_round`: 死者死亡时的 `game_round`。领奖时需匹配

---

## 🔄 指令变更

### 1. `update_profile` (⚠️ 签名变更!)

**V2 签名**:
```typescript
await program.methods
  .updateProfile(
    new BN(86400),  // new_timeout
    1               // new_mode  ← 已移除
  )
```

**V3 签名**:
```typescript
await program.methods
  .updateProfile(
    new BN(86400),  // new_timeout (可选)
  )
  .accounts({
    user: wallet.publicKey,
    userProfile: userProfilePDA,
    newBeneficiary: newBeneficiaryPubkey, // 可选
  })
  .rpc();
```

> ⚠️ **重大变更**: `new_mode` 参数已移除。模式注册后永久锁定！

---

### 2. `resurrect` (逻辑变更!)

**V3 新增限制**:
1. 必须死亡超过 **3 天 (259200 秒)**
2. Vault 余额 ≥ 0.01 SOL
3. 复活后数据自动清零:
   - `game_round += 1`
   - `rip_count = 0`
   - `rip_earnings = 0`
   - `death_time = 0`

```typescript
// 前端需检查冷却期
const threeDAys = 3 * 24 * 60 * 60;
const canResurrect = 
  userProfile.isDead && 
  Date.now()/1000 >= userProfile.deathTime.toNumber() + threeDays &&
  vaultBalance >= 0.01 * LAMPORTS_PER_SOL;
```

---

### 3. `loot` (逻辑变更!)

**V3 新增**: 允许死者本人在 3 天后自己 Loot 自己 ("孤魂野鬼自救")

```typescript
// 前端逻辑
const isSelfLoot = looterPubkey.equals(deceasedProfile.owner);
const isExpired = Date.now()/1000 >= deceasedProfile.deathTime.toNumber() + threeDays;

if (isSelfLoot && !isExpired) {
  throw new Error("冷却期未结束，3天后才能自救");
}

// 调用方式不变
await program.methods.loot().accounts({...}).rpc();
```

---

### 4. `send_rip` (逻辑变更!)

**V3 新增**: RIP 绑定游戏轮次

当目标用户复活进入新轮次后，旧的 RipRecord 会自动"重置":
- `rip_amount` 归零
- `claimed_reward` 归零
- `target_round` 更新为新轮次

**前端无需额外处理**，合约自动判断。

---

### 5. `claim_rip_reward` (逻辑变更!)

**V3 新增**: 轮次匹配验证

```rust
require!(
    rip_record.target_round == death_record.deceased_round,
    ErrorCode::InvalidGameRound
);
```

如果 `target_round` 与 `deceased_round` 不匹配，说明这是旧轮次的 RIP，无法领取奖励。

**前端处理**:
```typescript
if (ripRecord.targetRound.toNumber() !== deathRecord.deceasedRound.toNumber()) {
  // 显示: "该 RIP 记录来自上一轮游戏，已失效"
}
```

---

## 🆕 新增错误码

| 错误码             | 说明                              |
| ------------------ | --------------------------------- |
| `CooldownNotEnded` | 冷却期未结束，3天后才能复活或自救 |
| `InvalidGameRound` | 游戏轮次不匹配，该 RIP 记录已失效 |

---

## 📊 游戏轮次机制详解

```
┌─────────────────────────────────────────────────────────────────┐
│                        游戏轮次生命周期                           │
└─────────────────────────────────────────────────────────────────┘

【第 1 轮】game_round = 1
    │
    ├─ register() → game_round = 1
    ├─ 粉丝 send_rip() → RipRecord.target_round = 1
    ├─ heartbeat() 续命...
    ├─ 超时 → flatline() → is_dead = true, death_time = now
    │          DeathRecord.deceased_round = 1
    ├─ loot() → Vault 被瓜分
    │
    └─ 【等待 3 天】
            │
            ├─ 自己 loot() (孤魂自救) 或 别人 loot()
            │
            ├─ claim_rip_reward() → 
            │     检查 RipRecord.target_round == DeathRecord.deceased_round
            │     通过 → 发放奖励
            │
            ├─ deposit() → 存入复活资金
            │
            └─ resurrect() →
                  game_round = 2 (进入第 2 轮)
                  rip_count = 0
                  rip_earnings = 0

【第 2 轮】game_round = 2
    │
    ├─ 新一轮开始，旧 RipRecord (target_round=1) 自动失效
    ├─ 新粉丝 send_rip() → RipRecord.target_round = 2
    │     (旧粉丝再发会覆盖为 target_round=2)
    └─ ...循环...
```

---

## 🔗 前端集成清单

### 1. 更新 IDL

```bash
cp target/idl/sol_le_mei.json app/src/lib/
```

### 2. 更新 TypeScript 类型

**UserProfile**:
```typescript
interface UserProfile {
  owner: PublicKey;
  lastPulse: BN;
  timeoutSeconds: BN;
  beneficiary: PublicKey;
  mode: number;
  isDead: boolean;
  ripCount: number;
  ripEarnings: BN;
  deathTime: BN;     // 🆕
  gameRound: BN;     // 🆕
  bump: number;
  vaultBump: number;
}
```

**RipRecord**:
```typescript
interface RipRecord {
  sender: PublicKey;
  target: PublicKey;
  ripAmount: number;
  claimedReward: BN;
  lastUpdated: BN;
  targetRound: BN;   // 🆕
  bump: number;
}
```

**DeathRecord**:
```typescript
interface DeathRecord {
  deceased: PublicKey;
  totalRips: number;
  totalReward: BN;
  distributedReward: BN;
  deathTime: BN;
  deceasedRound: BN; // 🆕
  bump: number;
}
```

### 3. 更新 UI 组件

| 位置       | 需要修改                       |
| ---------- | ------------------------------ |
| 注册页面   | 提示"模式选择后不可更改"       |
| 设置页面   | 移除模式修改选项               |
| 复活按钮   | 检查 3 天冷却期，显示倒计时    |
| RIP 记录页 | 显示轮次信息，标记失效记录     |
| Loot 页面  | 显示自救选项 (3天后，自己账户) |

### 4. 新增 UI 元素

```tsx
// 复活倒计时组件
const CooldownTimer = ({ deathTime }: { deathTime: number }) => {
  const threeDays = 3 * 24 * 60 * 60;
  const unlockTime = deathTime + threeDays;
  const remaining = unlockTime - Date.now() / 1000;
  
  if (remaining <= 0) return <span>可以复活</span>;
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  return <span>{days}天 {hours}小时后可复活</span>;
};
```

---

## ⚠️ 重要提醒

1. **旧账户不兼容**: V3 增加了账户空间。旧注册账户无法读取，必须使用新钱包测试。

2. **测试环境**: Devnet 程序 ID: `7Xt8JnxfvHwJcvBtR6giutcAhbUGVSCevNAXGr3xbaHy`

3. **IDL 必须更新**: 前端必须使用新的 IDL 文件，否则会出现序列化错误。
