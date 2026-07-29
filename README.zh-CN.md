# AgileFlow

[English](README.md) | **中文**

<p align="center">
  <strong>让 AI 不只是「写完代码」，而是交出一份可验证、可追踪、可接手的交付包。</strong>
</p>

<p align="center">
  面向 AI 编程 Agent 的多阶段交付 Skill 与 CLI。<br>
  你只管说要解决什么；它负责选择流程、保存交付资料、验证结果和断点续跑。
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agileflow/cli"><img src="https://img.shields.io/npm/v/@agileflow/cli.svg?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="skills/agileflow/templates/validate-atlas-gate.md"><img src="https://img.shields.io/badge/checks-9%20automatic-brightgreen?style=flat-square" alt="9 automatic checks"></a>
  <img src="https://img.shields.io/badge/routing-/af-7c3aed?style=flat-square" alt="semantic routing">
  <img src="https://img.shields.io/badge/flow-extensible-2563eb?style=flat-square" alt="extensible flow">
  <img src="https://img.shields.io/badge/agents-multi--role-0891b2?style=flat-square" alt="multi-agent">
  <img src="https://img.shields.io/badge/runtime-receipts-f97316?style=flat-square" alt="runtime receipts">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT"></a>
</p>

```bash
npx @agileflow/cli@latest init
/af 做一个支持微信和支付宝退款的订单 API，后面都交给你
```

> **重要：** AgileFlow 的核心不是一套提示词。
>
> **AgileFlow = 一个 `/af` 入口 + 可调整的交付流程 + 自动质量检查 + 可恢复的 `atlas/` 交付包。**

**导航：** [演示](#demo-一次会话长什么样) · [痛点](#problems-它解决什么问题) · [上手](#quick-start-1-分钟上手) · [核心能力](#moves-四个核心能力) · [对比](#compare-和-openspec-与-superpowers) · [进阶](#deeper-工作原理与扩展)

---

## Demo: 一次会话长什么样

```text
你   /af 做一个支持微信和支付宝退款的订单 API，后面都交给你
AI   → 判断这是一个需要完整交付的新功能
     → 整理需求与可验收条件
     → 补齐接口方案、异常边界和开发任务
     → 自动检查资料是否完整，通过后开始编码
     → 运行测试并记录真实命令与结果
     → 输出验收结论和仍需人工处理的事项
你   打开 atlas/ —— 需求、方案、实现记录和验收结果都在，可以直接交接

改天  /af
AI   → 读取已保存的进度，从上次停下的位置继续
```

> `/af` 是发给 **AI 聊天** 的指令，**不是**终端命令。安装时请用 `npx @agileflow/cli`，不要用 npm 上无关的同名包 `npx agileflow`。

---

## Problems: 它解决什么问题

| 普通 AI 编程 | AgileFlow |
|--------------|-----------|
| 需求和验收只在聊天里 | 落盘 `REQ-*.md` + BDD AC |
| 先写码，方案和边界缺失 | `write-code` 不过，禁止写业务码 |
| 口头「测过了」 | 检查真实命令、exit code、验收报告 |
| 勾了任务却没文件 | todo · T 文档 · 证据 · 验收交叉校验 |
| 多个 Agent 做了什么说不清 | 自动保存任务分工和执行记录 |
| 对话断了无法继续 | 自动保存进度，下次从断点继续 |
| 修改后仍沿用旧的成功结果 | 检查结果绑定文件内容；内容变化就重新验证 |

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

没说明由谁做决定时，Agent 会先问你：

| 你怎么说 | 效果 |
|----------|------|
| **后面都交给你** | AI 在自动检查通过后继续，尽量不打断你 |
| **关键决定让我确认** | 到需求、方案等关键节点时等你确认 |

两种方式的质量标准相同。交给 AI 只减少打断，**不会减少文档或跳过测试**。

只想给当前项目装：

```bash
cd YOUR_PROJECT
npx @agileflow/cli@latest init --root .   # → {项目}/skills/（单份，各宿主共用）
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

只发 `/af`（无正文）→ 读进度，从断点继续。

---

## Moves: 四个核心能力

### 1. `/af` 语义自动路由

不必背阶段命令。

| 你的表达 | 默认路由 |
|----------|----------|
| 「做一个退款 API」 | 完整交付：需求 → 方案 → 开发 → 验收 |
| 「修登录超时」「补单测」 | 直接处理当前问题 |
| 「先研究瓶颈」 | 只分析并给建议，不改代码 |
| 只发 `/af` /「继续」 | 断点续跑 |

高级用户仍可用 `/af-req` `/af-sol` `/af-dev` `/af-test` 直达阶段；直接进入某个阶段也不会跳过前置条件和自动检查。

### 2. 可扩展 `flow.yaml`

`atlas/flow.yaml` 是项目执行图：可插步骤、依赖、并行波、自定义产物。  
普通用户不需要修改它。需要定制流程时，`prompt` 可写短名（`req`/`model`/`sol`/`dev`）、`null`（由当前 Agent 处理），或**已有角色文件路径**（如 `atlas/role/role-security.md`）。

改 flow 后运行 `update --step-skills-only` 刷新 `/af-*` 指令；再 **abandon 旧 Run + start 新 Run**，确保新流程重新验证。

### 3. 自动质量检查

9 项检查覆盖需求、方案、开发证据和验收；全部通过才算完成。

每次成功结果都会绑定当前任务、流程版本和文件内容。修改文件、回退阶段或更换流程后，旧结果立即失效并重新检查。

检查只验证已有证据，**不会替 Agent 编造证据**。

### 4. `atlas/` 交付包与执行记录

`atlas/` 保存需求、方案、任务、验收结果和多个 Agent 的执行记录。

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
| 你带走 | 活的 `specs/` | 计划 + 代码纪律 | **`atlas/` 交付包 + 验收结果 + 执行记录** |

不是互斥：可用 OpenSpec 管长期规格、Superpowers 强化执行，再让 AgileFlow 守交付边界。

---

## 适合 · 不适合

**适合：** 要交给客户 / 测试 / 下一位开发 / 审计；功能跨需求·接口·实现·验收；团队要统一「完成」的机器判定；长任务跨会话要可靠恢复。

**不适合：** 一次性问答；一行文案；不准备维护任何仓库内文档；指望它替代测试框架、CI 或产品判断。

AgileFlow 是 Agent 的**交付协议与校验层**，不是云端任务平台。

---

## Deeper: 工作原理与扩展

### 为什么不会轻易「假完成」

正式流程创建 `atlas/runs/<runId>/`。每阶段闭环：

```text
角色 Agent 产出 → 登记文件 → 记录执行 → 自动检查 → 保存结果 → 推进进度
```

- 检查通过 = **当前 Run / attempt / flow / 产物** 对应的有效 PASS，不是「历史上通过过」。
- 存在 Run 时只认 Runtime JSONL 回执；旧 Markdown PASS 不能兜底。
- 密钥、审批、真机等进入 `humanTodo.md`，不冒充 PASS。

<details>
<summary>九项自动检查及其内部名称</summary>

| 内部名称 | 阻止什么 |
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

### 多 Agent 怎么协作

当前会话负责协调：读取流程、分配任务、运行检查、推进状态。

需求、建模、方案和开发内容由对应角色 Agent 产出，并把过程写入 `agileflow-dispatch.json`。

宿主不支持子 Agent 时会明确提示降级运行，**质量检查标准不降低**。

### 如何扩展

| 层 | 改哪里 | 能做什么 |
|----|--------|----------|
| 步骤 | `atlas/flow.yaml` | 插入安全审查、设计评审等 |
| 依赖 / 并行 | `depends` · `outputs` | 并行波与产物等待 |
| 角色 / 提示词 | `prompt` + `atlas/role/*.md` | 短名、当前 Agent 处理、或指定提示词路径 |
| 聊天指令 | `update --step-skills-only` | 把新 `af-*` 步同步到各宿主的 `/af-*` 指令 |
| 校验 | gate / validator | 把团队完成标准变成 `exit ≠ 0` |

**`prompt` 三种写法：**

| `prompt` | 谁干、读什么 |
|----------|----------------|
| `req` / `model` / `sol` / `dev` | 对应角色 Agent；使用默认说明，或项目覆盖 `atlas/role/role-{key}.md` |
| `null` | 当前 Agent 处理，按 step id 读对应 `phases/*.md` |
| `atlas/role/role-xxx.md` | 对应角色 Agent；**路径文件须已存在**（团队自定义角色） |

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

改完 flow **必须刷新聊天指令**，宿主才会出现 `/af-security-review`：

```bash
npx @agileflow/cli@latest update --step-skills-only --root .
# → 生成/更新 .cursor|claude|…/skills/af-security-review/SKILL.md
# → flow 里删掉的自定义步，对应指令也会被清掉
```

然后再换 Run（改 flow 不能偷渡旧 PASS）：

```bash
npx @agileflow/cli run abandon --reason "新增安全审查步骤" --root .
npx @agileflow/cli run start --change security-review --step af-req --root .
```

> **Flow 变化 = `update --step-skills-only` 刷新指令 + abandon 旧 Run + start 新 Run。**
>
> 只改 yaml 不 update，聊天里不会多出新 `/af-*`；只 update 不换 Run，旧回执仍可能绑在旧 `flowDigest` 上。

新增步骤 / 依赖 / 产物路径：改 `flow.yaml` 即可。  
需要验文件内容、命令结果或跨文档追踪：必须扩 validator，不能只靠提示词。  
流程协调、`write-code` 前置与 Runtime 结果记录约束不会因扩展自动消失。

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
| 自动检查细则 | [validate-atlas-gate.md](skills/agileflow/templates/validate-atlas-gate.md) |
| 排错 | [TROUBLESHOOTING.md](skills/agileflow/TROUBLESHOOTING.md) |
| 端到端复测 | [AGENT-RETEST.md](AGENT-RETEST.md) |

产品源在 `skills/agileflow/`，npm 包：[`@agileflow/cli`](https://www.npmjs.com/package/@agileflow/cli)。

---

## License

MIT · [Issues](https://github.com/aiKeeo/AgileFlow/issues) / PR 欢迎。
