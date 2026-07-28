# AgileFlow 快速上手

> **安装约 1 分钟；完整跑完一个功能约 30 分钟**（含落盘、闸门、可运行证据）。下文按实战顺序说明你会遇到什么。

---

## 30 秒速览（只看这里就能开始）

```bash
# 1️⃣ 安装（一次）
npx @agileflow/cli@latest init
```

```
# 2️⃣ 在你的 AI 工具里说：
/af 做一个用户登录 API
```

**完了。** AI 会自动判定模式、引导流程、落盘文档、写码、过闸门。你只需在启动卡选「你定」或「我来」。

| 你只想记一个命令 | 说明 |
|------|------|
| **`/af` + 说人话** | AI 自动匹配模式（快捷/探索/完整流程）并执行 |
| `/af`（无正文） | 读进度 → 从断点继续 |
| `/af-fix 修 xxx` | 快捷修 bug（零文档） |
| `/af-req` `/af-sol` `/af-dev` `/af-test` | Power user 直接指定阶段 |

> 英文：AgileFlow enforces a structured req→model→sol→dev→test pipeline with hard quality gates, while keeping humans in control via `AF_DECIDE`. Just type `/af` + describe what you want.

---

## 1. 安装（1 分钟）

**最轻量（推荐首次）：用户级，全平台一次装好**

```bash
npx @agileflow/cli@latest init
# → ~/.cursor/skills/、~/.agents/skills/、~/.claude/skills/、~/.workbuddy/skills/、~/.codebuddy/skills/、~/.qoder/skills/
# 重启各 IDE / Agent 后全局可用
```

**项目级：只给当前仓库装（统一装到 `{项目}/skills/`）**

```bash
cd YOUR_PROJECT
npx @agileflow/cli@latest init --root .
# → skills/agileflow/ + skills/af-*/（所有宿主共用这一份）
# 默认先删旧再装，不留 .bak；旧 .cursor|.claude|…/skills/ 安装会被顺带清理
# 脚手架（写入 atlas/ 骨架）：
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

> 安装完直接发 `/af` 就能用。下面详细解释各步骤。

| 命令 | 装到哪 | 说明 |
|------|--------|------|
| `init` | 用户 HOME 下各宿主 skills | 全部宿主（cursor+claude+codex+workbuddy+codebuddy+qoder） |
| `init --root .` | `{项目}/skills/`（单份，各宿主共用） | `--tools` 仅影响旧路径清理，默认全部 |

各宿主 skills 根：

| 宿主 | 用户级 | 项目级（`--root .`） |
|------|--------|----------------------|
| Cursor | `~/.cursor/skills/` | `skills/` |
| Claude | `~/.claude/skills/` | `skills/` |
| Codex | `~/.agents/skills/` | `skills/` |
| WorkBuddy | `~/.workbuddy/skills/` | `skills/` |
| CodeBuddy | `~/.codebuddy/skills/` | `skills/` |
| Qoder | `~/.qoder/skills/` | `skills/` |

> **项目级统一 `skills/`**：所有宿主读同一份，不再按宿主分目录；旧路径（`.cursor/skills/` 等）里 CLI 生成的内容会在 init/update 时自动清理。
>
> **Codex 说明**：用户级官方路径为 [`~/.agents/skills/`](https://developers.openai.com/codex/skills)；`~/.codex/skills/` 为旧路径仅清理。
>
> **WorkBuddy / CodeBuddy**：用户级目录不同；`--tools workbuddy` 或 `codebuddy` 会**两边都装**。

改 `atlas/flow.yaml` 后刷新门牌 skill：

```bash
npx @agileflow/cli@latest update --step-skills-only --root .
```

### 开发者（AgileFlow 仓库本身）

- **唯一源**：`skills/agileflow/`（`SKILL.md`、`phases/`、`templates/`、`cli/`、`scripts/`）
- **勿**在仓库内提交 `.cursor/.claude/.agents/.workbuddy/.codebuddy/.qoder/skills/` 副本（已 gitignore）；改源后跑 `npm run test:cli` 验证生成
- 用户/项目侧仍用 `npx @agileflow/cli@latest init` 把 skill materialize 到各宿主目录

**管辖边界**：只有 `atlas/flow.yaml` 的 `steps[]` 受 `AF_STEP`/主链闸门管理；`/af`（自动路由）、`/af-init`、`/af-explore`、快捷 `/af-fix`… 不进 flow steps。详见 [majorflow.md §管辖边界](majorflow.md#管辖边界铁律)。

**不知道用什么命令？** 发 **`/af`** + 你想做的事（或只发 `/af` 让 AI 读进度继续）。legacy：`/agileflow` 文字 ≡ `/af`。

**兼容（仅拷贝总控 skill，无门牌 af-* skill）：**

```bash
git clone https://github.com/aiKeeo/AgileFlow.git
cp -r AgileFlow/skills/agileflow YOUR_PROJECT/skills/
node YOUR_PROJECT/skills/agileflow/scripts/validate-atlas.mjs --bootstrap-scaffold --root YOUR_PROJECT
```

> 勿使用裸命令 `npx agileflow`（npm 上另有同名无关包）。请用 **`npx @agileflow/cli`**。
>
> **为什么 init/update 要带 `@latest`**：npx 首次运行后会把包缓存在 `~/.npm/_npx`，之后一直复用旧版；显式写 `@latest` 才会每次重新解析 dist-tag 拉最新版。已装到项目里的 `agileflow gate/log` 不受影响（跑的是项目内副本，版本应与 skill 一致）。CLI 自带新版提醒（后台探测、不阻塞；`AGILEFLOW_NO_UPDATE_CHECK=1` 可关）。

### Run 状态与可信回执

正式 flow 由 Agent 自动启动或恢复 Run。手动排障时可执行：

```bash
agileflow run start --change add-login --step af-req --root .
agileflow artifact scan --root .
agileflow gate req-confirm --root .
agileflow run gate-status --gate req-confirm --json --root .
agileflow run status --json --root .
# flow 已变化且旧 Run 不再适用：
agileflow run abandon --reason "flow 已变更" --root .
```

启用 Run 后，门禁 PASS 会绑定当前 Run、step attempt、flow 版本和已登记产物摘要；产物或 flow 改动后须重新运行 gate。旧项目没有 `atlas/state/current.json` 时继续兼容原流程。

### 首启脚手架（写入**项目** atlas/，不是 skill 目录）

在**你的业务项目根**执行（`--root` = 项目根）。**可重复执行**（幂等：只补缺失文件，不覆盖已有 role/todo）。

```bash
npx @agileflow/cli gate --bootstrap-scaffold --root .
# 兼容：node skills/agileflow/scripts/validate-atlas.mjs --bootstrap-scaffold --root .
```

**首条 Agent 回复**须写 `agileflow.env` 的 `AF_HOST_CAPABILITY=full|degraded`（据 tool list；`pending` 跑 gate 会红）。

产出（均在 `YOUR_PROJECT/atlas/` 下）：

- `role/role-req|model|sol|dev.md` — **stamp**（默认 assembled 不读正文；改文件 = custom 全文派活）
- skill `role/layers/{key}/` — 默认派活分层源（`resolveRolePrompt`）
- `humanTodo.md` — 需人类协助的事项
- `todo.md` — **流程进度骨架**（sol 阶段总控填入 T 任务头；开发进度看这里）
- `agileflow-dispatch.json` — 派活台账（Subagent 回报后总控追加 entry，再跑 gate）
- `role/.agileflow-role-baseline.json` — role 哈希 baseline（改动 role 后对应文档闸门自动跳过）

### 改提示词 / 加阶段（如何生效）

| 你想做 | 怎么做 | 生效 |
|--------|--------|------|
| 改角色提示词 | 编辑 `atlas/role/role-*.md` | 下次派活用全文；该阶段**文档格式**闸门跳过；ORCH/`write-code` 等仍硬挡 |
| 加流程步 | 在 `atlas/flow.yaml` 插入 `id: af-xxx`（**必须** `af-` 前缀）+ `prompt` + depends/outputs | `npx @agileflow/cli@latest update --step-skills-only` → 生成各宿主 `skills/af-xxx/SKILL.md` |
| `prompt` 写法 | 直接写项目路径 `atlas/role/role-xxx.md`（也可为项目内 Skill 的 `SKILL.md`）；`null` 才是总控直做 | 路径 = 角色提示词来源，不是门牌 id；旧短名仅兼容，不再用于新配置 |
| 刷新门牌 | `update --step-skills-only` | 按当前 flow 增删各宿主 `skills/af-*/SKILL.md`；改 flow 后还须 abandon/start Run |

主链默认 id：`af-req` → `af-mod` → `af-sol` → `af-dev` → `af-test`。例如 `af-req` 明写 `prompt: atlas/role/role-req.md`。

---

## 2. 三句话启动第一个功能

在你配置好 AgileFlow 的 AI 工具中，说：

```
/af 做一个待办清单 API
```

（第一句没说谁决策 → AI 会发**启动卡**问你：AI 全权 vs 我来决策。若说「你定，别问我，直接做完」→ 跳卡写 `AF_DECIDE=ai`。只发 `/af` 且无正文 → AI 读 atlas 进度自动继续或当新需求。）

| 组合 | 体验 |
|------|------|
| **AI 全权**（`AF_DECIDE=ai`） | 很少问；闸门绿后同会话连做；阶段 4 可自动并行 |
| **我来决策**（`AF_DECIDE=user`） | 缺口/确认/阶段闸门须问你；并行须并行卡 |

中途随时可说「后面都你定 / 不想看了」让 AI 接管剩余流程。

| 轮次 | AI 做什么 | **你只需** | 落盘/闸门 |
|:----:|----------|----------|-----------|
| 1 | 发首启卡（若未点明决策） | 选「AI 全权」或「我来决策」 | 写 `atlas/agileflow.env` |
| 2 | 写需求文档（REQ） | `user`：确认需求；`ai`：等交付 | `atlas/requirements/` + `req-confirm` |
| 3 | 写技术方案 + 任务拆解 | `user`：确认方案；`ai`：等交付 | `atlas/solution/` + `sol-confirm` |
| 4 | 逐任务写代码 + 编译 + 冒烟 | `ai`：**阻塞派活同会话循环**；`user`：点卡 | 每 T：`dev/T-*.md` + 闸门 |
| 5 | 跑验收测试，出报告 | 拿到可部署的代码 | `atlas/tests/` + `test-entry` |

> **单档位**（`AF_TIER=full`）：文档与证据厚度不变；差别只在**停点多少**与**是否自动并行**。铁律详见 [contract](templates/contract.md)。

---

## 3. 三种典型用法

### 场景 A：AI 全权交付 Demo（~1 小时）

```
/af 你定，别问我。做一个用户登录 API（JWT + MySQL）
```

AI 会按序落盘 REQ → sol → dev，有 ≥2 无冲突 T 时自动并行，每步过闸门。

### 场景 B：逐步确认核心业务（半天~1 天）

```
/af 我来决策。做一个微信支付回调模块，要处理并发和幂等
```

与 AI 全权的差异只在**停点**，不在文档厚度。

### 场景 C：改已有项目（brownfield）

```
init: 扫描当前项目
```

AI 扫描代码库写入 `atlas/init/`，之后再走正常流程。

---

## 4. 术语速查卡（实战会遇到）

| 你会看到 | 是什么 | 你不用管 |
|----------|--------|----------|
| **atlas/** | 所有项目文档目录 | — |
| **AF_DECIDE** | `ai` 全权 / `user` 你来决策 | env 键名 |
| **启动卡** | 首问：谁决策 | 选一次即可 |
| **①②③** | 每开发任务：构思→写码→验收 | AI 按序做 |
| **T-001-BE** | 一个开发任务切片 | 命名规则 |
| **闸门红** | 检查没过，不能进阶 | `ai`：AI 自修重跑；`user`：可说「继续让 AI 修」 |
| **humanTodo** | 需要你提供的密钥/资源 | 配好后说「已配置」 |
| **继续 agileflow** | 断点续作 | 新对话说这句 |

更多 env/错误码 → [TROUBLESHOOTING](TROUBLESHOOTING.md) · [contract](templates/contract.md)

---

## 5. 常用命令

| 你说 | 效果 |
|------|------|
| `走 agileflow` | 从头开始五阶段流程 |
| `继续 agileflow` | 从上次停的地方接着跑 |
| `/af-req 做登录` | 只做需求澄清 |
| `/af-mod 用户模型` | 只做数据建模 |
| `/af-sol 退款` | 只做技术方案 |
| `/af-dev` | 进入开发实现 |
| `/af-test` | 跑验收测试 |
| `你定 / 别问我` | 切换为 AI 自主决策 |

---

## 6. 常见问题

**Q: 我关掉对话了，怎么接着来？**

打开新对话，说「继续 agileflow」。AI 会读 `atlas/todo.md` 从断点接着做，不用重复解释。

**Q: 需求写到一半发现不对？**

直接说「需求不对，xxx 要改成 yyy」。AI 会触发变更管理，按纠偏阶梯回到对应阶段修改。

**Q: AI 要我提供 API 密钥但我还没申请？**

AI 会把这类事情写入 `atlas/humanTodo.md`。你先去申请，好了回来说「继续 agileflow」，AI 自动解除阻塞。

**Q: 修一行 bug 也要走全流程？**

不用。发 `/af-fix 修 xxx`（或 `/af 修 xxx`）即走快捷轨——零文档、零闸门、直接改。仅当改动超出边界（>3 文件/改 API/动权限）时自动升级为完整流程。

**Q: 闸门报错看不懂？**

报错行末有 `💡 白话说明 · 谁修`；或查 [TROUBLESHOOTING](TROUBLESHOOTING.md)。

**Q: 根目录突然多了 atlas/ 文件夹？**

那是 AgileFlow 的工作目录。**须进库**（团队共享流程状态）：`atlas/agileflow.env`、`atlas/agileflow-dispatch.json`、`atlas/todo.md`、`atlas/requirements/`、`atlas/solution/`、`atlas/dev/` 等。
**可 gitignore**：`atlas/logs/`、本地临时产物。**勿** gitignore 整个 `atlas/`（见 [validate-atlas-gate §env](templates/validate-atlas-gate.md#agileflowenv流程状态--ai-维护)）。

---

## 7. 改完 skill 后怎么复测（Agent 端到端）

→ **[../../AGENT-RETEST.md](../../AGENT-RETEST.md)**（仓库根目录这一份；对会话说「按 AGENT-RETEST.md 复测，模式 ai|user」即可）

静态测仍用：`npm run test:validate`。

---

## 8. 下一步

- 完整工作流 → [README.zh-CN.md](../../README.zh-CN.md)
- 更改管理 → [phases/change-management.md](phases/change-management.md)
