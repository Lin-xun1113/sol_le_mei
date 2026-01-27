# Sol了没 - 项目概述与开发目标

## 项目简介

**Sol了没** (Sol Le Mei / NotDeadYet) 是一个基于 Solana 区块链的"死亡开关"应用，灵感来源于近期爆火的"死了么"App。

### 核心理念
> "活着天天签到，死了全网吃席！"

将传统的"安全确认工具"与区块链的博弈、支付、Meme 文化结合，打造一个既有实用价值（资产保全/遗嘱执行）又具备极强传播属性（Degen 赌局/捡漏游戏）的 Consumer App。

---

## 目标用户

1. **独居人群** - 担心出事无人知晓，需要安全保障
2. **Crypto Degen** - 喜欢博弈、捡漏、PVP 的玩家
3. **Meme 爱好者** - 喜欢黑色幽默和社交传播

---

## 核心玩法

### 1. 链上心跳 (Heartbeat)
用户需要定期发送"心跳"交易证明自己还"活着"。
- 支持通过 **Solana Blinks** 在 Twitter/X 上一键签到
- 连续签到可累积 RIP 计数（社交互动）

### 2. 死亡判定 (Flatline)
当用户超过设定时间未签到，系统判定其"死亡"。

### 3. 遗产分配
根据用户注册时选择的模式：

| 模式 | 名称                 | 死亡后遗产去向           |
| ---- | -------------------- | ------------------------ |
| 0    | Safeguard (安全模式) | 转给预设的受益人钱包     |
| 1    | Feast (吃席模式)     | 进入公共池，任何人可捡漏 |

### 4. 吃席机制 (Feast Mode)
- **Loot (捡漏)**: 第一个调用 `loot` 的人获得 50% 遗产
- **Graveyard (公共墓地)**: 另外 50% 进入公共池
  - 10% → 协议收入（项目方）
  - 90% → RIP 奖励池（空投给发过 RIP 的人）

### 5. RIP 社交
- 用户可以给其他人发送 RIP（悼念/祈祷）
- 发送 RIP 是参与奖励分配的凭证
- 通过 Blink 在 Twitter 上一键发送

---

## 技术栈

| 层级     | 技术                                  |
| -------- | ------------------------------------- |
| 智能合约 | Anchor (Rust) 0.32.1                  |
| 前端     | Next.js 16 + TypeScript + Tailwind    |
| 钱包     | @solana/wallet-adapter                |
| Blinks   | @solana/actions                       |
| 网络     | Solana Devnet (测试) / Mainnet (生产) |

---

## 项目结构

```
sol_le_mei/
├── programs/sol_le_mei/    # Anchor 智能合约
│   └── src/
│       ├── lib.rs          # 入口
│       ├── state.rs        # 账户结构
│       ├── errors.rs       # 错误定义
│       └── instructions/   # 7 个指令
├── app/                    # Next.js 前端
│   └── src/
│       ├── lib/program.ts  # PDA 工具
│       └── app/api/actions/  # Blinks 端点
├── target/idl/             # 生成的 IDL
└── docs/                   # 文档 (本目录)
```

---

## 黑客松信息

- **赛道**: Consumer & Entertainment
- **主办**: Trends + Solana 中文社区
- **截止**: 2026年1月28日 19:00 (香港时间)
