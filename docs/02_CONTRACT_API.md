# Sol了没 - 合约接口 (API Reference)

## Program ID
```
7Xt8JnxfvHwJcvBtR6giutcAhbUGVSCevNAXGr3xbaHy
```

## IDL 文件位置
```
target/idl/sol_le_mei.json
app/src/lib/sol_le_mei.json
```

---

## PDA 推导

### TypeScript 示例
```typescript
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("7Xt8JnxfvHwJcvBtR6giutcAhbUGVSCevNAXGr3xbaHy");

// UserProfile PDA
function getUserProfilePDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user_profile"), user.toBuffer()],
    PROGRAM_ID
  );
}

// Vault PDA
function getVaultPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), user.toBuffer()],
    PROGRAM_ID
  );
}

// RipRecord PDA
function getRipRecordPDA(sender: PublicKey, target: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rip"), sender.toBuffer(), target.toBuffer()],
    PROGRAM_ID
  );
}

// Graveyard PDA (全局唯一)
function getGraveyardPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("graveyard")],
    PROGRAM_ID
  );
}
```

---

## 指令接口

### 1. initialize_graveyard

| 属性   | 值           |
| ------ | ------------ |
| 参数   | 无           |
| 调用者 | 项目方管理员 |

**账户列表**:
| 账户名         | 类型          | Writable | Signer | 说明               |
| -------------- | ------------- | -------- | ------ | ------------------ |
| authority      | SystemAccount | ✅        | ✅      | 管理员钱包         |
| graveyard      | Graveyard     | ✅        | ❌      | PDA: ["graveyard"] |
| system_program | Program       | ❌        | ❌      | System Program     |

---

### 2. register

| 属性   | 值                                 |
| ------ | ---------------------------------- |
| 参数   | `timeout_seconds: u64`, `mode: u8` |
| 调用者 | 新用户                             |

**参数说明**:
- `timeout_seconds`: 超时阈值，最小 60 秒，推荐 86400 (24小时)
- `mode`: 0 = Safeguard, 1 = Feast

**账户列表**:
| 账户名         | 类型          | Writable | Signer | 说明                        |
| -------------- | ------------- | -------- | ------ | --------------------------- |
| user           | SystemAccount | ✅        | ✅      | 用户钱包                    |
| user_profile   | UserProfile   | ✅        | ❌      | PDA: ["user_profile", user] |
| vault          | SystemAccount | ✅        | ❌      | PDA: ["vault", user]        |
| beneficiary    | SystemAccount | ❌        | ❌      | 受益人地址                  |
| system_program | Program       | ❌        | ❌      | System Program              |

**TypeScript 调用示例**:
```typescript
await program.methods
  .register(new BN(86400), 1) // 24小时超时, Feast模式
  .accounts({
    user: wallet.publicKey,
    userProfile: userProfilePDA,
    vault: vaultPDA,
    beneficiary: beneficiaryPubkey,
  })
  .rpc();
```

---

### 3. heartbeat

| 属性   | 值         |
| ------ | ---------- |
| 参数   | 无         |
| 调用者 | 已注册用户 |

**账户列表**:
| 账户名       | 类型          | Writable | Signer | 说明                        |
| ------------ | ------------- | -------- | ------ | --------------------------- |
| user         | SystemAccount | ❌        | ✅      | 用户钱包                    |
| user_profile | UserProfile   | ✅        | ❌      | PDA: ["user_profile", user] |

**TypeScript 调用示例**:
```typescript
await program.methods
  .heartbeat()
  .accounts({
    user: wallet.publicKey,
    userProfile: userProfilePDA,
  })
  .rpc();
```

---

### 4. deposit

| 属性   | 值            |
| ------ | ------------- |
| 参数   | `amount: u64` |
| 调用者 | 已注册用户    |

**账户列表**:
| 账户名         | 类型          | Writable | Signer | 说明                        |
| -------------- | ------------- | -------- | ------ | --------------------------- |
| user           | SystemAccount | ✅        | ✅      | 用户钱包                    |
| user_profile   | UserProfile   | ❌        | ❌      | PDA: ["user_profile", user] |
| vault          | SystemAccount | ✅        | ❌      | PDA: ["vault", user]        |
| system_program | Program       | ❌        | ❌      | System Program              |

**TypeScript 调用示例**:
```typescript
await program.methods
  .deposit(new BN(1_000_000_000)) // 1 SOL
  .accounts({
    user: wallet.publicKey,
    userProfile: userProfilePDA,
    vault: vaultPDA,
  })
  .rpc();
```

---

### 5. send_rip

| 属性   | 值                   |
| ------ | -------------------- |
| 参数   | 无                   |
| 调用者 | 任何已连接钱包的用户 |

**账户列表**:
| 账户名         | 类型          | Writable | Signer | 说明                                |
| -------------- | ------------- | -------- | ------ | ----------------------------------- |
| sender         | SystemAccount | ✅        | ✅      | 发送者钱包                          |
| target_profile | UserProfile   | ✅        | ❌      | PDA: ["user_profile", target_owner] |
| target_owner   | SystemAccount | ❌        | ❌      | 目标用户钱包                        |
| rip_record     | RipRecord     | ✅        | ❌      | PDA: ["rip", sender, target_owner]  |
| system_program | Program       | ❌        | ❌      | System Program                      |

**TypeScript 调用示例**:
```typescript
await program.methods
  .sendRip()
  .accounts({
    sender: wallet.publicKey,
    targetProfile: targetProfilePDA,
    targetOwner: targetPubkey,
    ripRecord: ripRecordPDA,
  })
  .rpc();
```

---

### 6. flatline

| 属性   | 值                                          |
| ------ | ------------------------------------------- |
| 参数   | 无                                          |
| 调用者 | 任何人（通常是 Bot 或前端检测到超时后调用） |

**账户列表**:
| 账户名         | 类型          | Writable | Signer | 说明                         |
| -------------- | ------------- | -------- | ------ | ---------------------------- |
| caller         | SystemAccount | ❌        | ✅      | 调用者钱包                   |
| user_profile   | UserProfile   | ✅        | ❌      | PDA: ["user_profile", owner] |
| vault          | SystemAccount | ✅        | ❌      | PDA: ["vault", owner]        |
| beneficiary    | SystemAccount | ✅        | ❌      | user_profile.beneficiary     |
| system_program | Program       | ❌        | ❌      | System Program               |

**TypeScript 调用示例**:
```typescript
const userProfile = await program.account.userProfile.fetch(userProfilePDA);
await program.methods
  .flatline()
  .accounts({
    caller: wallet.publicKey,
    userProfile: userProfilePDA,
    vault: vaultPDA,
    beneficiary: userProfile.beneficiary,
  })
  .rpc();
```

---

### 7. loot

| 属性   | 值                           |
| ------ | ---------------------------- |
| 参数   | 无                           |
| 调用者 | 任何人（Feast 模式下捡漏者） |

**账户列表**:
| 账户名         | 类型          | Writable | Signer | 说明                         |
| -------------- | ------------- | -------- | ------ | ---------------------------- |
| looter         | SystemAccount | ✅        | ✅      | 捡漏者钱包                   |
| user_profile   | UserProfile   | ✅        | ❌      | PDA: ["user_profile", owner] |
| vault          | SystemAccount | ✅        | ❌      | PDA: ["vault", owner]        |
| graveyard      | Graveyard     | ✅        | ❌      | PDA: ["graveyard"]           |
| system_program | Program       | ❌        | ❌      | System Program               |

**TypeScript 调用示例**:
```typescript
await program.methods
  .loot()
  .accounts({
    looter: wallet.publicKey,
    userProfile: deadUserProfilePDA,
    vault: deadUserVaultPDA,
    graveyard: graveyardPDA,
  })
  .rpc();
```

---

## 账户数据结构 (TypeScript Types)

```typescript
interface UserProfile {
  owner: PublicKey;
  lastPulse: BN;          // Unix timestamp
  timeoutSeconds: BN;
  beneficiary: PublicKey;
  mode: number;           // 0 or 1
  isDead: boolean;
  ripCount: number;
  bump: number;
  vaultBump: number;
}

interface Graveyard {
  authority: PublicKey;
  rewardPool: BN;         // lamports
  protocolFees: BN;       // lamports
  bump: number;
}

interface RipRecord {
  sender: PublicKey;
  target: PublicKey;
  timestamp: BN;          // Unix timestamp
  bump: number;
}
```

---

## 读取账户数据

```typescript
// 读取 UserProfile
const userProfile = await program.account.userProfile.fetch(userProfilePDA);
console.log("Is Dead:", userProfile.isDead);
console.log("Last Pulse:", new Date(userProfile.lastPulse.toNumber() * 1000));
console.log("RIP Count:", userProfile.ripCount);

// 读取 Vault 余额
const vaultBalance = await connection.getBalance(vaultPDA);
console.log("Vault Balance:", vaultBalance / 1e9, "SOL");

// 读取 Graveyard
const graveyard = await program.account.graveyard.fetch(graveyardPDA);
console.log("Reward Pool:", graveyard.rewardPool.toNumber() / 1e9, "SOL");

// 检查用户是否注册
const userProfileInfo = await connection.getAccountInfo(userProfilePDA);
const isRegistered = userProfileInfo !== null;
```
