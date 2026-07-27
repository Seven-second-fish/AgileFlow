# AgileFlow

[English](README.md) | **中文**

<p align="center">
  <strong>让 AI 不只是「写完代码」，而是交出一份可验证、可追踪、可接手的交付包。</strong>
</p>

<p align="center">
  面向 AI 编程 Agent 的多阶段交付 Skill 与 CLI。<br>
  你说一句人话；它负责路由、分工、落盘、闸门和断点续跑。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agileflow/cli"><img src="https://img.shields.io/npm/v/@agileflow/cli.svg?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="skills/agileflow/templates/validate-atlas-gate.md"><img src="https://img.shields.io/badge/gates-9%20hard-brightgreen?style=flat-square" alt="9 hard gates"></a>
  <img src="https://img.shields.io/badge/routing-/af-7c3aed?style=flat-square" alt="semantic routing">
  <img src="https://img.shields.io/badge/flow-extensible-2563eb?style=flat-square" alt="extensible flow">
  <img src="https://img.shields.io/badge/agents-multi--role-0891b2?style=flat-square" alt="multi-agent">
  <img src="https://img.shields.io/badge/runtime-receipts-f97316?style=flat-square" alt="runtime receipts">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT"></a>
</p>

```bash
npx @agileflow/cli@latest init
/af 做一个支持微信和支付宝退款的订单 API，后面都你定
```

> **重要：** AgileFlow 的核心不是一套提示词。
>
> **AgileFlow = `/af` 语义路由 + 可扩展 `flow.yaml` + 多 Agent 分工 + 9 道硬闸门 + Run 级回执 + `atlas/` 证据包。**

**导航：** [演示](#demo-一次会话长什么样) · [痛点](#problems-它解决什么问题) · [上手](#quick-start-1-分钟上手) · [四张硬牌](#moves-四张硬牌) · [对比](#compare-和-openspec-与-superpowers) · [更深](#deeper-机制与扩展)

---

## Demo: 一次会话长什么样

```text
你   /af 做一个支持微信和支付宝退款的订单 API，后面都你定
AI   → 路由：完整交付主链
     → AF_DECIDE=ai（少停点；文档与闸门不减）
     → 创建 Run，进入 af-req
     → Subagent 落盘 requirements/REQ-*.md（BDD AC）
     → 闸门 req-confirm 绿灯 → 方案 / 契约落盘
     → write-code 绿灯后才写业务码
     → 每任务留下 ## 结果（真跑过的命令与 exit code）
     → 验收报告 PASS / FAIL
你   打开 atlas/ —— 证据包齐了，可以交接

改天  /af
AI   → 读 flow.yaml · env · todo · 当前 Run，从断点继续
```

> `/af` 是发给 **AI 聊天** 的门牌，**不是**终端命令。请用 `npx @agileflow/cli`，不要用 npm 上无关的同名包 `npx agileflow`。

---

## Problems: 它解决什么问题

| 普通 AI 编程 | AgileFlow |
|--------------|-----------|
| 需求和验收只在聊天里 | 落盘 `REQ-*.md` + BDD AC |
| 先写码，方案和边界缺失 | `write-code` 不过，禁止写业务码 |
| 口头「测过了」 | 检查真实命令、exit code、验收报告 |
| 勾了任务却没文件 | todo · T 文档 · 证据 · 验收交叉校验 |
| 派了谁、干了啥说不清 | `agileflow-dispatch.json` 台账 |
| 对话断了无法继续 | `todo + env + Run` 断点续跑 |
| 改了产物还拿旧 PASS 顶 | 回执绑定内容摘要；一变即失效 |

最终带走的不是「代码 + 一句完成了」，而是：

```text
代码
+ 可确认的需求
+ 可 Review 的方案与契约
+ 每任务的构思与运行证据
+ 可追踪的验收报告
+ 可恢复的流程状态
= 一份能交接的交付包
```

---

## Quick start: 1 分钟上手

需要 Node.js 20+。

```bash
# 用户级：一次装到 Cursor / Claude / Codex / Qoder / WorkBuddy / CodeBuddy
npx @agileflow/cli@latest init
```

重启或重新加载对应宿主后，在聊天里发：

```text
/af 做一个用户登录 API
```

没写「你定」时，Agent 会先问你：

| 决策方式 | 效果 |
|----------|------|
| **你定** | `AF_DECIDE=ai`：闸门绿后同会话续跑，少打断 |
| **我来** | `AF_DECIDE=user`：关键节点停下来等你确认 |

两种模式的质量标准相同。「你定」只减少停点，**不减文档、不跳测试、不绕闸门**。

只想给当前项目装：

```bash
cd YOUR_PROJECT
npx @agileflow/cli@latest init --root .   # → {项目}/skills/（单份，各宿主共用）
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

只发 `/af`（无正文）→ 读进度，从断点继续。

---

## Moves: 四张硬牌

### 1. `/af` 语义自动路由

不必背阶段命令。

| 你的表达 | 默认路由 |
|----------|----------|
| 「做一个退款 API」 | 完整轨：req → model? → sol → dev → test |
| 「修登录超时」「补单测」 | 快捷轨 |
| 「先研究瓶颈」 | 探索支路 |
| 只发 `/af` /「继续」 | 断点续跑 |

Power user 仍可用 `/af-req` `/af-sol` `/af-dev` `/af-test`；门牌不能绕过 `flow.yaml` 依赖与闸门。

### 2. 可扩展 `flow.yaml`

`atlas/flow.yaml` 是项目执行图：可插步骤、依赖、并行波、自定义产物。  
`prompt` 可写短名（`req`/`model`/`sol`/`dev`）、`null`（总控直做），或**已有角色文件路径**（如 `atlas/role/role-security.md`）。  
改 flow 后跑 `update --step-skills-only` 刷新 `/af-*` 门牌；再 **abandon 旧 Run + start 新 Run**——旧 PASS 不能偷渡。

### 3. 硬闸门 + Run 级回执

9 道闸门；完成 = `exit 0`。  
PASS 绑定 `runId`、step attempt、`flow` 摘要、产物内容摘要。改产物、回退阶段或换 flow → 旧回执立即失效。  
`gate` 只校验，**不替 Agent 补证据**。

### 4. `atlas/` 证据包 + 多 Agent 台账

总控只路由；正文由 Subagent 产出；派活写入 `agileflow-dispatch.json`。  
关掉 IDE 也能交接；内审能回答：**这条需求怎么证明做完了？**

---

## 主链一眼看懂

```text
一句需求 ─▶ req ─▶ model? ─▶ sol ─▶ dev（构思→写码→证据）─▶ test ─▶ 交付
              │         │       │              │
              ▼         ▼       ▼              ▼
           BDD AC    领域模型  契约/边界    ## 结果 真跑过
```

```text
atlas/
├── flow.yaml / agileflow.env / todo.md
├── requirements/ · model/ · solution/ · dev/ · tests/
├── humanTodo.md · agileflow-dispatch.json
└── runs/<runId>/              # 产物登记与 JSONL 回执
```

思想 → [majorflow.md](majorflow.md) · 执行 → [SKILL.md](skills/agileflow/SKILL.md) · 安装细节 → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)

---

## Compare: 和 OpenSpec 与 Superpowers

他们帮你**想清楚、写对**；AgileFlow 管**做完有没有留下证据，机器认不认账**。

| | OpenSpec | Superpowers | **AgileFlow** |
|---|----------|-------------|---------------|
| 管什么 | Spec 怎么演进 | 计划怎么执行（TDD） | **交付包齐不齐、证据在不在** |
| 「完成」 | 软对齐 | Skill + Review | **CLI 硬挡，`exit 0` 才进阶** |
| 你带走 | 活的 `specs/` | 计划 + 代码纪律 | **`atlas/` + 签收 + Run 回执 + 台账** |

不是互斥：可用 OpenSpec 管长期规格、Superpowers 强化执行，再让 AgileFlow 守交付边界。

---

## 适合 · 不适合

**适合：** 要交给客户 / 测试 / 下一位开发 / 审计；功能跨需求·接口·实现·验收；团队要统一「完成」的机器判定；长任务跨会话要可靠恢复。

**不适合：** 一次性问答；一行文案；不准备维护任何仓库内文档；指望它替代测试框架、CI 或产品判断。

AgileFlow 是 Agent 的**交付协议与校验层**，不是云端任务平台。

---

## Deeper: 机制与扩展

### 为什么不会轻易「假完成」

正式流程创建 `atlas/runs/<runId>/`。每阶段闭环：

```text
Subagent 产出 → artifact scan → log（本步门牌）→ gate → run gate-status → step sync
```

- 闸门绿 = **当前 Run / attempt / flow / 产物** 对应的有效 PASS，不是「历史上绿过」。
- 存在 Run 时只认 Runtime JSONL 回执；旧 Markdown PASS 不能兜底。
- 密钥、审批、真机等进入 `humanTodo.md`，不冒充 PASS。

<details>
<summary>九道硬闸门</summary>

| 闸门 | 阻止什么 |
|------|----------|
| `init-confirm` | 旧项目未盘点就进主链 |
| `req-confirm` | REQ / 范围 / BDD AC 不完整 |
| `mod-confirm` | 建模不完整或静默跳过 |
| `sol-confirm` | 架构、契约、边界或 todo 缺失 |
| `dev-step1-literal` | 开发构思空壳 |
| `write-code` | 需求方案未就绪就写业务码 |
| `dev-complete` | 勾完任务却无运行证据 |
| `test-entry` | 未满足测试入场与冒烟 |
| `req-trace` | REQ → F → T → AC → 报告断链 |

</details>

### 多 Agent 怎么分工

当前会话 = 总控：读 flow、派活、跑闸门、推进状态。  
req / model / sol / dev 正文由对应角色 Subagent 产出，写入 `agileflow-dispatch.json`。  
宿主无 Subagent 时进入显式 degraded，**质量闸门不降级**。

### 如何扩展

| 层 | 改哪里 | 能做什么 |
|----|--------|----------|
| 步骤 | `atlas/flow.yaml` | 插入安全审查、设计评审等 |
| 依赖 / 并行 | `depends` · `outputs` | 并行波与产物等待 |
| 角色 / 提示词 | `prompt` + `atlas/role/*.md` | 短名、总控直做、或指定提示词路径 |
| 门牌 | `update --step-skills-only` | 把新 `af-*` 步刷进各宿主 `/af-*` 指令 |
| 校验 | gate / validator | 把团队完成标准变成 `exit ≠ 0` |

**`prompt` 三种写法：**

| `prompt` | 谁干、读什么 |
|----------|----------------|
| `req` / `model` / `sol` / `dev` | Subagent；默认 layers，或项目覆盖 `atlas/role/role-{key}.md` |
| `null` | 总控直做，按 step id 读对应 `phases/*.md` |
| `atlas/role/role-xxx.md` | Subagent；**路径文件须已存在**（团队自定义角色） |

示例：在方案与开发之间加安全审查（指定角色文件）：

```yaml
# 先写好 atlas/role/role-security.md，再挂进 flow
steps:
  - id: af-security-review
    mode: strict
    prompt: atlas/role/role-security.md
    depends:
      - atlas/solution/
    outputs:
      - atlas/logs/security-review.md
```

改完 flow **必须刷门牌**，宿主才会出现 `/af-security-review`：

```bash
npx @agileflow/cli@latest update --step-skills-only --root .
# → 生成/更新 .cursor|claude|…/skills/af-security-review/SKILL.md
# → flow 里删掉的自定义步，对应门牌也会被清掉
```

然后再换 Run（改 flow 不能偷渡旧 PASS）：

```bash
npx @agileflow/cli run abandon --reason "新增安全审查步骤" --root .
npx @agileflow/cli run start --change security-review --step af-req --root .
```

> **Flow 变化 = `update --step-skills-only` 刷门牌 + abandon 旧 Run + start 新 Run。**  
> 只改 yaml 不 update，聊天里不会多出新 `/af-*`；只 update 不换 Run，旧回执仍可能绑在旧 `flowDigest` 上。

新增步骤 / 依赖 / 产物路径：改 `flow.yaml` 即可。  
需要验文件内容、命令结果或跨文档追踪：必须扩 validator，不能只靠提示词。  
总控编排、`write-code` 前置与 Runtime 回执约束不会因扩展自动消失。

<details>
<summary>常用 CLI</summary>

```bash
npx @agileflow/cli@latest init
npx @agileflow/cli@latest update --step-skills-only --root .
npx @agileflow/cli run status --json --root .
npx @agileflow/cli gate --gate write-code --root .
npx @agileflow/cli run gate-status --gate req-confirm --json --root .
npx @agileflow/cli gate --list-gates --root .
npx @agileflow/cli run abandon --reason "flow 已变更" --root .
npx @agileflow/cli run start --change refund-v2 --step af-req --root .
```

WorkBuddy → `~/.workbuddy/skills/`；CodeBuddy → `~/.codebuddy/skills/`。`--tools workbuddy` 或 `codebuddy` 会**两边都装**。

</details>

### 文档导航

| 想了解 | 文档 |
|--------|------|
| 方法论 | [majorflow.md](majorflow.md) |
| Agent 执行规则 | [SKILL.md](skills/agileflow/SKILL.md) |
| 安装与宿主 | [QUICKSTART.md](skills/agileflow/QUICKSTART.md) |
| 闸门细则 | [validate-atlas-gate.md](skills/agileflow/templates/validate-atlas-gate.md) |
| 排错 | [TROUBLESHOOTING.md](skills/agileflow/TROUBLESHOOTING.md) |
| 端到端复测 | [AGENT-RETEST.md](AGENT-RETEST.md) |

产品源在 `skills/agileflow/`，npm 包：[`@agileflow/cli`](https://www.npmjs.com/package/@agileflow/cli)。

---

## License

MIT · [Issues](https://github.com/aiKeeo/AgileFlow/issues) / PR 欢迎。
