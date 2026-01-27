# Sol了没 - 合约更新日志 (v2.0)

> 更新时间: 2026-01-25 00:53
> 
> 部署签名: `5UH1sDfV19728Hz6Sm2k9HUMH9RGixfc6rc9JyJgiVgxP6DRhvLXBmaLz1WWZBKtxGMSMDAtEtjRbaDu3zRwqMPQ`

---

## 🆕 新增指令

### 1. `send_rip` (重大变更!)

**变更**: 从免费改为付费

```typescript
// 旧版 (v1)
await program.methods.sendRip().accounts({...}).rpc();

// 新版 (v2)
await program.methods.sendRip(ripAmount).accounts({...}).rpc();
```

| 参数         | 类型  | 说明            |
| ------------ | ----- | --------------- |
| `rip_amount` | `u32` | 购买的 RIP 数量 |

**费用**: `rip_amount × 0.001 SOL`

**分成**:
- 50% → 目标用户 Vault (死后可提取)
- 50% → 项目方 (Graveyard.protocol_fees)

**新增账户**:
```typescript
{
  // ... 原有账户
  targetVault: vaultPDA,     // 🆕 目标用户的 Vault
  graveyard: graveyardPDA,   // 🆕 Graveyard PDA
}
```

---

### 2. `claim_rip_reward` 🆕

**用途**: RIP 发送者在目标用户死亡后按比例领取奖励

```typescript
await program.methods
  .claimRipReward()
  .accounts({
    claimer: wallet.publicKey,
    deceasedProfile: deceasedProfilePDA,
    deceasedOwner: deceasedPubkey,
    deathRecord: deathRecordPDA,
    ripRecord: ripRecordPDA,
    graveyard: graveyardPDA,
  })
  .rpc();
```

**PDA 推导**:
```typescript
// DeathRecord PDA
const [deathRecordPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("death"), deceasedPubkey.toBuffer()],
  PROGRAM_ID
);
```

**奖励计算**:
```
你的奖励 = (你的 RIP 数 / 死者总 RIP 数) × 奖励池份额
```

---

### 3. `withdraw_protocol_fees` 🆕

**用途**: 项目方提取协议收入

```typescript
await program.methods
  .withdrawProtocolFees(new BN(amount))
  .accounts({
    authority: adminWallet.publicKey,
    graveyard: graveyardPDA,
  })
  .rpc();
```

**权限**: 仅 `graveyard.authority` 可调用

---

### 4. `transfer_authority` 🆕

**用途**: 转移项目方管理员权限

```typescript
await program.methods
  .transferAuthority()
  .accounts({
    currentAuthority: adminWallet.publicKey,
    newAuthority: newAdminPubkey,
    graveyard: graveyardPDA,
  })
  .rpc();
```

---

### 5. `resurrect` 🆕

**用途**: 死亡用户复活重新开始

```typescript
await program.methods
  .resurrect()
  .accounts({
    user: wallet.publicKey,
    userProfile: userProfilePDA,
    vault: vaultPDA,
  })
  .rpc();
```

**条件**:
- 用户必须已死亡 (`is_dead == true`)
- Vault 余额 ≥ 0.01 SOL (防止滥用)

**效果**:
- `is_dead = false`
- `last_pulse = now`
- 保留 `rip_count` 和 `rip_earnings`

---

### 6. `update_profile` 🆕

**用途**: 修改用户设置

```typescript
await program.methods
  .updateProfile(
    new BN(86400),  // 新超时时间 (可选, 传 null 不修改)
    1               // 新模式 (可选, 传 null 不修改)
  )
  .accounts({
    user: wallet.publicKey,
    userProfile: userProfilePDA,
    newBeneficiary: newBeneficiaryPubkey, // 可选
  })
  .rpc();
```

**可修改字段**:
- `timeout_seconds`: 超时时间 (最小 60秒)
- `beneficiary`: 受益人地址
- `mode`: 0=Safeguard, 1=Feast

**条件**: 用户必须活着 (`is_dead == false`)

---

## 🆕 新增账户结构

### DeathRecord

```typescript
interface DeathRecord {
  deceased: PublicKey;       // 死者地址
  totalRips: number;         // 死亡时的总 RIP 数
  totalReward: BN;           // 可分配的奖励总额
  distributedReward: BN;     // 已分配的奖励
  deathTime: BN;             // 死亡时间戳
  bump: number;
}
```

**PDA Seeds**: `["death", deceased_pubkey]`

---

## 🔄 修改的账户结构

### UserProfile

```diff
 interface UserProfile {
   owner: PublicKey;
   lastPulse: BN;
   timeoutSeconds: BN;
   beneficiary: PublicKey;
   mode: number;
   isDead: boolean;
   ripCount: number;
+  ripEarnings: BN;          // 🆕 累计 RIP 收入 (lamports)
   bump: number;
   vaultBump: number;
 }
```

### RipRecord

```diff
 interface RipRecord {
   sender: PublicKey;
   target: PublicKey;
-  timestamp: BN;
+  ripAmount: number;        // 🆕 发送的 RIP 数量 (可累加)
+  claimedReward: BN;        // 🆕 已领取的奖励
+  lastUpdated: BN;          // 🆕 最后更新时间
   bump: number;
 }
```

### Graveyard

```diff
 interface Graveyard {
   authority: PublicKey;
   rewardPool: BN;
-  protocolFees: BN;         // 原: 仅 Loot 10%
+  protocolFees: BN;         // 🆕 包含 RIP 50% + Loot 10%
   bump: number;
 }
```

---

## 📋 完整指令清单 (12 个)

| 指令                     | 调用者     | 说明             |
| ------------------------ | ---------- | ---------------- |
| `initialize_graveyard`   | 项目方     | 初始化公共墓地   |
| `register`               | 新用户     | 创建账户         |
| `heartbeat`              | 已注册用户 | 签到续命         |
| `deposit`                | 已注册用户 | 存入 SOL         |
| `send_rip`               | 任何人     | **付费**发送 RIP |
| `flatline`               | 任何人     | 判定死亡         |
| `loot`                   | 任何人     | 捡漏遗产         |
| `claim_rip_reward`       | RIP 发送者 | 🆕 领取死后奖励   |
| `withdraw_protocol_fees` | 管理员     | 🆕 提取协议费     |
| `transfer_authority`     | 管理员     | 🆕 转移管理权     |
| `resurrect`              | 已死亡用户 | 🆕 复活           |
| `update_profile`         | 活着的用户 | 🆕 修改设置       |

---

## 🔗 PDA 速查表

```typescript
// UserProfile
["user_profile", user_pubkey]

// Vault
["vault", user_pubkey]

// Graveyard (全局唯一)
["graveyard"]

// RipRecord
["rip", sender_pubkey, target_pubkey]

// DeathRecord 🆕
["death", deceased_pubkey]
```

---

## ⚠️ 前端注意事项

1. **send_rip 需要额外账户**: `targetVault` 和 `graveyard`
2. **flatline 需要额外账户**: `deathRecord` (Feast 模式)
3. **loot 需要额外账户**: `deathRecord`
4. **IDL 需要更新**: 复制 `target/idl/sol_le_mei.json` 到前端

```bash
cp target/idl/sol_le_mei.json app/src/lib/
```
