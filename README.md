# Sol了没 (NotDeadYet) - Solana Hackathon Project

> 💀 活着天天签到，死了全网吃席！

## 项目简介

Sol了没 是一个基于 Solana 区块链的"死亡开关"应用，灵感来源于近期爆火的"死了么"App。

**核心玩法**:
- 每日签到证明"活着"
- 超时未签到 → 判定"死亡"
- 死亡后资产被瓜分 (吃席模式) 或转给受益人 (安全模式)

## 项目结构

```
sol_le_mei/
├── programs/sol_le_mei/    # Anchor 智能合约 ✅
├── app/                    # Next.js 前端 (部分完成)
├── target/idl/             # 生成的 IDL
├── docs/                   # 文档
└── tests/                  # 测试
```

## 快速开始

### 环境要求
- Anchor CLI 0.32+
- Solana CLI 2.0+
- Node.js 18+

### 构建合约
```bash
anchor build
```

### 启动前端
```bash
cd app && npm install && npm run dev
```

## 文档

| 文档                                           | 说明               |
| ---------------------------------------------- | ------------------ |
| [项目概述](docs/00_PROJECT_OVERVIEW.md)        | 项目背景和目标     |
| [合约逻辑](docs/01_CONTRACT_LOGIC.md)          | 状态机和指令流程   |
| [合约接口](docs/02_CONTRACT_API.md)            | API Reference      |
| [前端需求](docs/03_FRONTEND_REQUIREMENTS.md)   | 前端开发要求       |
| [玩法说明](docs/04_USER_ROLES_AND_GAMEPLAY.md) | 用户角色和玩法     |
| [Blinks 指南](docs/05_BLINKS_GUIDE.md)         | Solana Blinks 集成 |

## 已完成

- [x] 智能合约 (7 个指令)
- [x] Solana Blinks (3 个端点)
- [ ] 前端 Dashboard
- [ ] Devnet 部署
- [ ] 提交材料

## 黑客松

- **赛道**: Consumer & Entertainment
- **截止**: 2026年1月28日 19:00 (香港时间)
