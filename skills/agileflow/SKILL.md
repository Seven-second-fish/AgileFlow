---
name: agileflow
description: >-
  多 Agent 强制流程：当前会话=总控，正文由 Subagent 产出，总控只写状态与闸门。
  按 atlas/flow.yaml 步序落盘再写码验收。触发：/af（默认入口）、@agileflow、
  /af-req 等门牌。安装：npx @agileflow/cli@latest init。
---
# Agileflow

> 思想 → [majorflow.md](majorflow.md)。**只有 `atlas/flow.yaml` steps 里的 id 才受流程管理**。本文=L0；细节按 LOAD 再读。

## L0 五条（始终）

1. **flow 启用步才受管** — `AF_STEP`/skip/depends/主链闸门/台账只针对 flow.yaml `steps`；快捷 → [quick-commands](phases/quick-commands.md)；前置 init → [00-project-init](phases/00-project-init.md#agent-摘要)。
2. **总控只路由（flow 步）** — 派 Subagent；记 `atlas/agileflow-dispatch.json`；改 env/todo/**flow**。首启 `--bootstrap-scaffold`。无 Subagent → [orch-core 宿主](templates/orchestrator-core.md#宿主义务)（含 WorkBuddy）。**禁止**「概念过闸」；「你定」≠ 免阶段/免派活。
3. **先落盘再进阶** — flow 步先启动/恢复 Run；产物登记后跑 gate；仅当前 Run、当前输入摘要的最新 PASS 才可勾 ✅ / advanceStep。旧项目无 `atlas/state/current.json` 时兼容旧回执。
4. **决策权控停点** — `AF_DECIDE`；`ai` 绿 → **同会话连做**（**不免**每步 `af-commands` 留痕；仅入口 `/af` 一行不够）；中途 AI 接管 → [contract §3](templates/contract.md#3-话术表必须看上下文)。
5. **一处定义、他处只链**。首行 `📍 … | 步：{AF_STEP} | 档：{AF_PHASE}` · 自修≤3 · 首条写 `AF_HOST_CAPABILITY` · `pending` 问人。

## LOAD（机器解析 · 只读列出的路径）

> **路径锚点**：下列 `phases/*` / `templates/*` 相对 **本 skill 根**（本文件所在目录），**不是**工作区项目根。
> 门牌 `af`/`af-*` 常在用户级（如 `~/.qoder/skills/af`）或项目级；细则在**同级** `agileflow/`。按序：①门牌同级 `../agileflow/` → ②`~/.{cursor,claude,qoder,…}/skills/agileflow/` → ③`{项目根}/.cursor|…/skills/agileflow/`。
> **找不到 → 换路径重试；禁止以「在项目根 Glob 不到」为由跳过流程写码。**

```
WHEN enable: phases/00-intent-routing.md#agent-摘要 | phases/atlas-structure.md#agent-摘要
WHEN decide: templates/contract.md
WHEN routing af: phases/00-intent-routing.md#agent-摘要
WHEN pre-flow af-init: phases/00-project-init.md#agent-摘要 | templates/init.md
WHEN routing af-explore: phases/00-intent-routing.md#探索判定
WHEN flow-step af-req: phases/01-requirement.md#agent-摘要 | templates/req.md
WHEN flow-step af-mod: phases/02-modeling.md#agent-摘要 | templates/model.md
WHEN flow-step af-sol: phases/03-solution-design.md#agent-摘要 | templates/solution.md
WHEN flow-step af-dev: phases/04-development.md#agent-摘要 | templates/dev.md
WHEN flow-step af-test: phases/05-testing.md#agent-摘要
WHEN dispatch: templates/orchestrator-core.md
WHEN dispatch.ref: templates/orchestrator-ref.md
WHEN role: templates/role/README.md
WHEN gate: templates/validate-atlas-gate.md
WHEN quick: phases/quick-commands.md#agent-摘要
WHEN exemplar: examples/dev-exemplar-BE.md | examples/dev-exemplar-FE.md
WHEN change: phases/change-management.md#agent-摘要
NEVER preload: 无关 phase 全文 | orchestrator-ref | contract（非首启/决策变更）
```

## DO / 红线（≤15 · 默认仅 **flow-managed** 步 · 全文 [orch-core](templates/orchestrator-core.md#正确做法与红线15)）

快捷/前置/探索不受下列 Subagent·台账·advance 约束，见各 phase。

1. **正文由 Subagent 产出，总控只写状态**（台账含 `subagentId`+flow `stepId`）
2. **按 role：req→model→sol→每 T 一次 dev** · 3. **`ai` 连做仍开 Task** · 4. **阻塞回报后同会话派下一批**
5. **`pending`+启动卡；明确委托才 `ai`** · 6. **有 Task→`full`+normal 台账** · 7. **铁律路径**（`atlas/requirements/` 等）
8. **写码前 `write-code` exit 0**（快捷轨除外） · 9. **闸门红→回灌同角色** · 10. **总控独占状态文件**
11. **先写 todo 再 `sol-confirm`** · 12. **自修≤3 仍红→停** · 13. **只读当前步 Agent 摘要+链的正文**
14. **skip 必须写 reason 到 flow.yaml** · 15. **REQ AC 回填后再标开发完成**

横切只链：一功能一 REQ · AC=BDD · `atlas/README` · glossary · `atlas/role/`。

## 裁决（冲突时以此为准）

<a id="裁决表冲突时以此为准"></a>

1. `validate-atlas` → 2. `atlas/flow.yaml` → 3. **本文 DO** → 4. [contract](templates/contract.md)·[orch-core](templates/orchestrator-core.md)·phases·templates·`atlas/role/*`

CLI：`npx @agileflow/cli`。索引：[orch](templates/orchestrator.md)·[flow](templates/flow.md)·[dev](templates/dev.md)·[change](phases/change-management.md)。

正式 flow 固定链路：`run start` → 完成本步产物 → `artifact scan` → `log`（本步门牌）→ `gate` → `run gate-status` → `step sync`。`run status --json` 查询当前 Run；特殊产物可用 `artifact record`。有 current Run 时只认 JSONL Runtime 回执，legacy MD 不参与判断。flow 一旦变化，必须 `run abandon --reason "<原因>"` 后新开 Run，禁止在原 Run 偷刷 `flowDigest`。

---

<details>
<summary><b>English Summary</b> (for international users / agents)</summary>

**AgileFlow** is a multi-agent enforced development workflow skill. It structures feature delivery into gated phases: `req → model → sol → dev → test`, orchestrated by `atlas/flow.yaml`.

**Core principles:**
- **Hard gates** (`validate-atlas`): code cannot be written until design docs pass validation
- **Decision authority** (`AF_DECIDE=ai|user`): humans choose how much autonomy the AI gets
- **Orchestrator/Subagent split**: the main session routes & tracks state; subagents produce content
- **Three tracks**: full flow (flow.yaml steps) · quick commands (`/af-fix`…) · pre-flow (`/af-init`, `/af-explore`)

**Quick start:** Type `/af` + describe what you want. The AI auto-routes to the appropriate mode.

**Key files:** `SKILL.md` (this file, L0) → `phases/*.md` (L1, per-phase rules) → `templates/*.md` (L2, doc templates)

**Install:** `npx @agileflow/cli@latest init`

</details>
