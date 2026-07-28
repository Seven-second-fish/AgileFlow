# 前端 Playwright 冒烟（强制 · 截图 + AI 目视）

> **用途**：对**任意可在浏览器打开的前端**做页面冒烟——逐路由打开、收集 `console.error` / `pageerror`、截图、总控目视（非白屏 / 无报错层）。  
> **范例脚本**：[examples/fe-smoke/fe-smoke.mjs](../examples/fe-smoke/fe-smoke.mjs)  
> **不替代**：可运行闸门 编译/启动、BE 接口冒烟、阶段 5 细 AC、微信开发者工具真机。  
> **硬门槛**：项目存在 `frontend/` / `miniprogram/` / `web/` 等 FE 目录时，`test-entry` **必须**过本套证据；**禁止跳过仍标 PASS**。

---

## 适用范围（通用，不绑框架）

| 前端形态 | 怎么测 |
|----------|--------|
| Web / SPA（React、Vue、Vite、Next 静态导出等） | **正常 `dev` / `preview` 启动** → Playwright 打开 `FE_BASE_URL` |
| 管理后台 / PC 站 | 同上；`routerMode` 多为 `history` |
| 小程序（Taro / uni-app 等） | **必须**用其 **H5**（`dev:h5` / H5 产物）再测；**禁止**无 H5 声称已过本门槛 |
| 纯原生 weapp / 无法起 H5 | **不得标测试 PASS** → humanTodo「补 H5 构建」；人工/开发者工具另验 weapp |

**原则**：脚本只认「浏览器里能打开的 URL」，不认框架名。H5 PASS ≠ weapp 真机已测。

---

## 过关三件套（缺一不可）

| # | 证据 | 说明 |
|---|------|------|
| 1 | `atlas/logs/fe-smoke-report.json` | `ok === true`；每非 skip 页有结果 |
| 2 | `atlas/logs/fe-smoke-shots/{id}.png` | 脚本自动截；report 内 `screenshot` 路径须存在 |
| 3 | `atlas/logs/fe-smoke-visual-review.md` | 总控 **Read 每张图** 后写；`screenshotsReviewed: true` + 每页 `PASS` |

闸门规则：`FE-SMOKE-*`（见 validate-atlas `smoke` 模块）。仅有 `be-smoke` / curl 关键词 **不够**。

---

## 对抗式审查

| 点 | 结论 |
|----|------|
| 通用 Web FE | ✅ 启动后配 `FE_BASE_URL` + `pages.json` |
| 路由差异 | ✅ `routerMode`：`history` / `hash`（Taro H5）/ `path` |
| 读 console | ✅ 落盘 `atlas/logs/fe-smoke.*` |
| 截图 + AI 目视 | ✅ 脚本截图；Node 不看图；总控 Read 图写 review |
| 小程序 | ⚠️ **仅 H5**；无 H5 → 不得 PASS |
| 无 FE 服务 | ❌ 须先启动；脚本不替你起服务 |
| 登录态 | ✅ 可选 API 登录 + localStorage |
| 替代全量 E2E | ❌ 只验「能开、不炸、目视正常」 |
| **浏览器二进制** | ✅ **镜像优先**（见下）；只装 chromium |
| AskQuestion 跳过 | ❌ **已取消**；有 FE 时不可「跳过仍过」 |

**有强制原型时**：另须 [fe-pixel-compare](fe-pixel-compare.md)（`test:pixel-fe`），与本门槛并行不互替。

---

## 安装 Chromium（镜像优先 · 防硬性门槛）

> **权威仅此节**。其他文件只链到这里，禁止再抄一套命令。  
> npm 包镜像 ≠ 浏览器二进制；`registry.npmmirror.com` **不解** `playwright install` 慢的问题。

### Agent 必须

1. 首次跑 FE 冒烟前：若本机尚无 Playwright Chromium → **先装**，再跑脚本  
2. 安装命令 **默认带国内镜像**（见下）；超时/404 → 清掉 host 再试官方一次  
3. **只装 `chromium`**；已装过则跳过（`npx playwright install chromium` 幂等）  
4. 禁止默默挂在官方 CDN 上超过 ~2 分钟还不换镜像/回退  
5. Chromium 未装成功 → 冒烟未执行 → **FAIL**，禁止跳过装浏览器仍标 PASS

### 推荐命令

**PowerShell（Windows）**：

```powershell
$env:PLAYWRIGHT_DOWNLOAD_HOST="https://cdn.npmmirror.com/binaries/playwright"
npx playwright install chromium
# 若失败：
Remove-Item Env:PLAYWRIGHT_DOWNLOAD_HOST -ErrorAction SilentlyContinue
npx playwright install chromium
```

**bash / macOS / Linux**：

```bash
PLAYWRIGHT_DOWNLOAD_HOST=https://cdn.npmmirror.com/binaries/playwright npx playwright install chromium
# 若失败：
unset PLAYWRIGHT_DOWNLOAD_HOST && npx playwright install chromium
```

**项目脚本（推荐写入 package.json）**：

```json
"smoke:fe:install": "node scripts/fe-smoke-install.mjs"
```

范例：[examples/fe-smoke/fe-smoke-install.mjs](../examples/fe-smoke/fe-smoke-install.mjs)。  
备用镜像：`https://npmmirror.com/mirrors/playwright`。

---

## 何时跑（强制，不问「是否跳过」）

命中**任一**且存在 FE 目录：

1. **阶段 5 · `test-entry` 前**（硬挡）  
2. 用户前缀 **`test:smoke-fe`** / **`test:smoke`**（有 FE）  
3. F/MVP 切片可运行后进测试验收前（须已齐本套证据）

`ai` / `user` **无差别**：有 FE 就必须跑；不得发卡「跳过 Playwright」。

---

## 配置约定（项目侧）

| 项 | 约定 |
|----|------|
| 脚本 | `scripts/fe-smoke.mjs`（从 exemplar 复制） |
| 清单 | `scripts/fe-smoke.pages.json` |
| 产出 | `fe-smoke.log` + `fe-smoke-report.json` + `fe-smoke-shots/*.png` + `fe-smoke-visual-review.md` |

### `fe-smoke.pages.json` 结构

```json
{
  "routerMode": "history",
  "basePath": "",
  "baseUrl": "http://127.0.0.1:5173",
  "tokenKey": "token",
  "userKey": "user",
  "pages": [
    { "id": "home", "path": "/", "readySelector": "body", "needsAuth": false },
    { "id": "login", "path": "/login", "readySelector": "body", "needsAuth": false }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `routerMode` | `history` / `hash`（小程序 H5 常用）/ `path` |
| `pages[].path` | Web：`/xxx`；小程序 H5：常 `pages/xxx/index` |
| `readySelector` | 默认 `body`；建议业务根节点 |
| `needsAuth` | true 时需登录注入，否则 SKIP（SKIP 页不计入目视必过页） |

### 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `FE_BASE_URL` | json `baseUrl` 或 `http://127.0.0.1:5173` | Vite 常 5173；小程序 H5 常 10086 |
| `FE_SMOKE_USER` / `FE_SMOKE_PASS` | 空 | 可选登录 |
| `FE_SMOKE_LOGIN_URL` | `{BASE}/api/v1/auth/login` | 登录 API |
| `FE_SMOKE_TOKEN_KEY` / `USER_KEY` | json 或 `token` / `user` | localStorage 键 |
| `FE_SMOKE_IGNORE` | React DevTools 提示 | console 忽略子串，`\|` 分隔 |

### Playwright 脚本通过（单页）

导航成功 + 无 `pageerror` + 无未忽略 `console.error` + `readySelector` 可见 + 已截图。  
`blankSuspect` 为启发式（可见文本过短），**不单独挡闸门**；总控目视须覆盖。

---

## AI 目视协议（总控）

脚本跑绿后，总控必须：

1. **Read** `atlas/logs/fe-smoke-shots/` 下 report 引用的每张 PNG（用读图能力，看画面）  
2. 按页判断：非白屏、非整页空白壳、无明显 error overlay / 未捕获异常文案、路由内容已挂载  
3. 写 `atlas/logs/fe-smoke-visual-review.md`：

```markdown
# FE Smoke Visual Review

screenshotsReviewed: true

| page | status | notes |
|------|--------|-------|
| home | PASS | 首页标题与列表可见 |
| login | PASS | 表单与按钮可见，无报错层 |
```

任一眼见异常 → 该行 `FAIL` → 修 FE → 重跑脚本 → 重目视。  
**禁止**未 Read 图就写 `screenshotsReviewed: true`。

---

## 证据铁律（防假 PASS）

| 规则 | 说明 |
|------|------|
| **无报告 = 未跑** | 须存在 `fe-smoke-report.json` 且 `ok === true` |
| **无截图 = 未跑完** | 每非 skip 页截图文件须在盘上 |
| **无目视 = 未验收** | 须 `fe-smoke-visual-review.md` 且每页 PASS |
| **H5 ≠ weapp** | 不得用 H5 PASS 声称「小程序控制台无错」 |
| **禁止用户跳过** | 与「这个才算过」一致；不能起 H5 → FAIL + humanTodo，不标 PASS |

---

## Agent 执行清单

```
1. 确认 FE 目录存在；小程序 → 启动 H5（不能起则 humanTodo，停）
2. 无 Chromium → smoke:fe:install / fe-smoke-install.mjs（镜像优先）
3. 无 pages.json → 按路由/app.config 生成（H5 用 hash）
4. 前端已监听 → node scripts/fe-smoke.mjs
5. Read fe-smoke-report.json；ok 否 → 修 → 重跑
6. Read 每张 fe-smoke-shots/*.png → 写 fe-smoke-visual-review.md
7. validate-atlas --gate test-entry（有 FE 时 FE-SMOKE-* 须绿）
```

---

## 正误

**✅** Web：`npm run dev` → Playwright → 截图 → 目视  
**✅** 小程序：`dev:h5` → Playwright → 截图 → 目视（勿冒充 weapp）  
**✅** 安装浏览器：镜像优先；只装 chromium  
**❌** AskQuestion「跳过 Playwright」仍标 PASS  
**❌** 只有 be-smoke / mvn test 无 FE 报告  
**❌** 未 Read 截图就写 screenshotsReviewed  
**❌** 用 H5 PASS 否认微信开发者工具（mp）报错  
**❌** 在 05 / orchestrator 再复制一套安装命令（只链本文）
