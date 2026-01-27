# Sol了没 - 部署信息

## Devnet 部署

**部署时间**: 2026-01-24 23:41 (香港时间)

### 程序地址

| 项目              | 地址                                           |
| ----------------- | ---------------------------------------------- |
| **Program ID**    | `7Xt8JnxfvHwJcvBtR6giutcAhbUGVSCevNAXGr3xbaHy` |
| **IDL Account**   | `5AB8KKbKwgd5GgTuH8CLYA9XpUaRvwQXvAUuB3ikHU64` |
| **Graveyard PDA** | (通过 seeds: ["graveyard"] 推导)               |

### 网络配置

```
Cluster: https://api.devnet.solana.com
Network: Solana Devnet
```

### 部署者钱包

```
Upgrade Authority: /home/linxun/.config/solana/id.json
Address: Gm8aiu7y12Y8imng94venvepZjCgWo3PDdWZ2HHLKVsN
```

---

## 测试结果

**测试时间**: 2026-01-24 23:43 (香港时间)

```
  sol_le_mei
    ✔ Initialize Graveyard (5449ms)
    ✔ Register user (Feast Mode, 60s timeout) (3051ms)
    ✔ Heartbeat (sign in) (3780ms)
    ✔ Deposit 0.01 SOL to vault (4243ms)
    ✔ Send RIP to self should fail (479ms)
    ✔ Read user profile (880ms)
    ✔ Flatline should fail (user still alive) (508ms)

  7 passing (18s)
```

### 测试账户状态

```
User Profile:
  Owner: Gm8aiu7y12Y8imng94venvepZjCgWo3PDdWZ2HHLKVsN
  Mode: Feast (吃席模式)
  Is Dead: false
  RIP Count: 0
  Timeout: 60 seconds
  Vault Balance: 0.01 SOL
```

---

## 交易签名

| 操作           | 签名                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------ |
| Deploy         | `5HovQcm8C2M91DcPSjSarNxrXcDAhoA8vTq3haFSUnSJLf6S4WkkiwQ6P8BEYVnTXBsjgM2E96cxFVhCSdkXCGDu` |
| Init Graveyard | `Yi8r5KgES8ShMbEqvdGag92m1MRiwGHBK32Ujrg6QRXD4L9KArBg57SgkyLPJ958sPacZmJ9NQ3quiyeFJTFyWh`  |
| Register       | `4DphgsUdQZzWrvQ6GNPhR3KnSZrcUTb9gHwhHyA3ZDsK69ya4TLAaSQwDrZwn3HC5Ud2G4dzTPtHjZt9h3i5ZLXj` |
| Heartbeat      | `RkvJiDv9HEdhq4kf9FD4Jtsazq81w9ZQETS91Ghvaajsgep79XwyzZpkRF8WeErBEu2nu3uJ2e8uwAgQ9uHqT4q`  |
| Deposit        | `4SPPEP1PJ5efKsZFway9uP8HdhRTZj7m2zsbRcy3ivaEKn6vBvt6K5Zv8nbPcwSqAnd2F7yUMCE5HiRKciWb224B` |

---

## Solana Explorer 链接

- [程序详情](https://explorer.solana.com/address/7Xt8JnxfvHwJcvBtR6giutcAhbUGVSCevNAXGr3xbaHy?cluster=devnet)
- [部署交易](https://explorer.solana.com/tx/5HovQcm8C2M91DcPSjSarNxrXcDAhoA8vTq3haFSUnSJLf6S4WkkiwQ6P8BEYVnTXBsjgM2E96cxFVhCSdkXCGDu?cluster=devnet)

---

## 前端配置

在前端 `.env` 文件中使用:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=7Xt8JnxfvHwJcvBtR6giutcAhbUGVSCevNAXGr3xbaHy
NEXT_PUBLIC_NETWORK=devnet
```
