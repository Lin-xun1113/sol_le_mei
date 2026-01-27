# Sol了没 - Solana Blinks 说明

## 什么是 Blinks?

**Blinks (Blockchain Links)** 是 Solana 生态的一项技术，允许用户在 Twitter/X 等社交平台上直接执行链上操作，无需离开当前页面。

**工作原理**:
1. 用户发布包含 Action URL 的推文
2. 支持 Blinks 的钱包/浏览器扩展检测到 URL
3. 渲染交互式按钮替代普通链接
4. 用户点击按钮 → 钱包弹出签名请求
5. 交易上链

---

## 已实现的 Blinks

### 1. 💓 签到 Blink

**端点**: `/api/actions/heartbeat`

**功能**: 用户在 Twitter 上一键签到续命

**URL 格式**:
```
https://你的域名/api/actions/heartbeat
```

**推文示例**:
```
我又活过了一天 💓 #Sol了没

solana-action:https://你的域名/api/actions/heartbeat
```

**按钮显示**:
- 图标: 心脏
- 标题: Sol了没 - 签到续命
- 按钮文字: 💓 签到续命

**调用流程**:
```
GET /api/actions/heartbeat
  → 返回 Action 元数据

POST /api/actions/heartbeat
  Body: { account: "用户钱包地址" }
  → 返回未签名的 heartbeat 交易
```

---

### 2. 🕯️ 发送 RIP Blink

**端点**: `/api/actions/rip`

**功能**: 给指定用户发送悼念/祈祷

**URL 格式**:
```
https://你的域名/api/actions/rip?target=目标钱包地址
```

**推文示例**:
```
为 @某用户 祈祷续命 🕯️ #Sol了没

solana-action:https://你的域名/api/actions/rip?target=8xK2...3nFp
```

**按钮显示**:
- 图标: 蜡烛
- 标题: Sol了没 - 发送 RIP
- 输入框: 目标用户钱包地址
- 按钮文字: 🕯️ 发送 RIP

**调用流程**:
```
GET /api/actions/rip
  → 返回带参数输入的 Action 元数据

POST /api/actions/rip?target=xxx
  Body: { account: "发送者钱包地址" }
  → 返回未签名的 send_rip 交易
```

---

### 3. 🦅 捡漏 Blink

**端点**: `/api/actions/loot`

**功能**: 捡走已死亡用户的遗产

**URL 格式**:
```
https://你的域名/api/actions/loot?target=死者钱包地址
```

**推文示例**:
```
🦅 发现一具尸体！来吃席！ #Sol了没

solana-action:https://你的域名/api/actions/loot?target=8xK2...3nFp
```

**按钮显示**:
- 图标: 秃鹫/宝箱
- 标题: Sol了没 - 秃鹫捡漏
- 输入框: 已死亡用户的钱包地址
- 按钮文字: 🦅 捡漏

---

## 文件结构

```
app/src/app/api/actions/
├── heartbeat/
│   └── route.ts      # 签到 Blink
├── rip/
│   └── route.ts      # 发送 RIP Blink
└── loot/
    └── route.ts      # 捡漏 Blink
```

---

## actions.json 配置

位置: `app/public/actions.json`

```json
{
  "rules": [
    {
      "pathPattern": "/api/actions/**",
      "apiPath": "/api/actions/**"
    }
  ]
}
```

---

## 测试 Blinks

### 开发环境测试

1. 启动 Next.js 开发服务器:
```bash
cd app && npm run dev
```

2. 使用 [dial.to](https://dial.to) 测试:
```
https://dial.to/?action=solana-action:http://localhost:3000/api/actions/heartbeat
```

### 生产环境

1. 部署到 Vercel 或其他平台
2. 确保 HTTPS
3. 在 Twitter 上发布包含 Action URL 的推文
4. 需要 Phantom/Solflare 等支持 Blinks 的钱包

---

## CORS 配置

Blinks 端点需要正确的 CORS 头:

```typescript
import { ACTIONS_CORS_HEADERS } from "@solana/actions";

// 每个响应都需要包含
return Response.json(payload, {
  headers: ACTIONS_CORS_HEADERS,
});
```

---

## 错误处理

| 错误场景       | 返回信息                             |
| -------------- | ------------------------------------ |
| 用户未注册     | "用户未注册，请先在网站注册后再签到" |
| 目标地址无效   | "Invalid target address"             |
| 目标用户未注册 | "目标用户未注册 Sol了没"             |
| 给自己发 RIP   | "不能给自己发 RIP 哦，臭不要脸的！"  |
| 遗产已被捡完   | "遗产已被瓜分完毕，你来晚了！"       |

---

## 扩展建议

### 可添加的 Blinks

1. **注册 Blink**: 在 Twitter 上直接注册
2. **存款 Blink**: 一键存入固定金额
3. **查看状态 Blink**: 显示用户当前状态（只读，不需要签名）
