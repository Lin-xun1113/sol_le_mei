# Sol了没 - 合约 V3.1 变更日志

> 更新时间: 2026-01-25 17:08
> 
> 版本: V3.1 (Bug 修复 + RIP 收入分离)

---

## 🔥 本次更新摘要

| 改动                  | 说明                                    |
| --------------------- | --------------------------------------- |
| **Flatline Bug 修复** | Feast 模式用户现在可以正常被超度        |
| **RIP 收入分离**      | RIP 50% 直接到账 KOL 钱包，不再进 Vault |

---

## 🐛 Bug 修复: Flatline AccountNotSystemOwned

### 问题
```
Error: AccountNotSystemOwned (3011) on beneficiary
```

Feast 模式用户的 `beneficiary` 设置为零地址（系统程序 ID），导致 `SystemAccount` 校验失败，无法执行 `flatline`。

### 修复
将 `flatline.rs` 中 `beneficiary` 类型从 `SystemAccount` 改为 `UncheckedAccount`。

**前端无需任何改动**，此修复完全在合约侧。

---

## 💰 RIP 收入分离 (重要!)

### V3 行为 (旧)
```
粉丝 send_rip()
    ↓
50% → KOL Vault (混入遗产)
50% → Graveyard (项目方)

KOL 死亡 → Vault 被 Loot → RIP 收入也被抢
```

### V3.1 行为 (新)
```
粉丝 send_rip()
    ↓
50% → KOL 钱包 ✅ (即时到账)
50% → Graveyard (项目方)

KOL 死亡 → Vault 被 Loot → RIP 收入不受影响 ✅
```

### 前端影响

#### send_rip 指令账户变更

**V3**:
```typescript
targetOwner: UncheckedAccount  // 不需要mut
targetVault: SystemAccount     // mut, 接收50%
```

**V3.1**:
```typescript
targetOwner: SystemAccount     // mut, 接收50% ← 变更!
targetVault: SystemAccount     // 不再mut, 仅验证PDA
```

**IDL 已更新**，前端需重新加载 `app/src/lib/sol_le_mei.json`。

#### UI 建议

在 KOL Dashboard 显示:
- **RIP 总收入**: 从 `userProfile.ripEarnings` 读取 (历史记录)
- **钱包余额**: 包含即时到账的 RIP 收入

---

## 📊 资金流向总结 (V3.1)

```
┌─────────────────────────────────────────────────────────────┐
│                         资金来源                             │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     ┌─────────────────┐             ┌─────────────────┐
     │  Deposit (存款)  │             │  Send RIP (发送) │
     └─────────────────┘             └─────────────────┘
              │                               │
              ▼                    ┌──────────┴──────────┐
     ┌─────────────────┐          ▼                      ▼
     │   用户 Vault    │    ┌───────────┐         ┌───────────────┐
     │   (遗产/押金)    │    │ 50% KOL   │         │ 50% Graveyard │
     └─────────────────┘    │ 钱包直达  │         │ (项目方)       │
              │             └───────────┘         └───────────────┘
              │                  │
              │                  └─ 即时到账，安全！
              │
     ┌────────┴────────┐
     │  Flatline/Loot  │
     │  (死亡/被抢)     │
     └────────┬────────┘
              │
   ┌──────────┴──────────┐
   ▼                     ▼
┌──────────┐    ┌─────────────────┐
│ 50% Looter│    │ 50% → Graveyard │
│ (秃鹫)    │    │ → 10% 协议费     │
└──────────┘    │ → 90% RIP奖池    │
                └─────────────────┘
```

---

## ⚠️ 重要提醒

1. **必须更新 IDL**: 前端需要使用新的 `sol_le_mei.json`
2. **旧账户仍不兼容**: 使用新钱包测试
3. **V3 账户变更仍有效**: `deathTime`, `gameRound`, `targetRound` 等字段
