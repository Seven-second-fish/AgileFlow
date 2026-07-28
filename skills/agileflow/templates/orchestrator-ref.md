# 总控 · 参考（L2 · 排障 / 台账字段时加载）

> 派活循环与红线 → [orchestrator-core](orchestrator-core.md)。**日常派活不预读本文。**

自定义 role：`atlas/role/role-*.md` 相对 baseline 有改动 → 该阶段默认文档格式闸门可 `ROLE-CUSTOM-SKIP`；**ORCH / af-env / dir 仍硬挡**。重置：`validate-atlas --refresh-role-baseline --root .`

## 派活台账

文件：`atlas/agileflow-dispatch.json`（与 `agileflow.env` 同级；首启 `--bootstrap-scaffold --root {项目根}` 写入**项目** atlas/，**不是** skill 目录）。

Subagent 回报后、跑 gate 前追加：

```json
{
  "at": "2026-07-19T12:00:00.000Z",
  "phase": "1",
  "role": "req",
  "stepId": "af-req",
  "gate": "req-confirm",
  "subagentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "taskId": null,
  "paths": ["atlas/requirements/REQ-001-login.md"]
}
```

| 字段 | 说明 |
|------|------|
| `role` | `req` \| `model` \| `sol` \| `dev` \| **`orch-direct`** |
| `stepId` | **必填**：当时 flow 步 id（如 `af-req`） |
| `gate` | 本段验收闸门（无内置可空） |
| **`subagentId`** | **必填**（normal）：宿主返回的 ID |
| `taskId` | **dev 必填**（如 `T-001`）；其余 null |
| `paths` | 本子代理落盘路径 |

子代理可回 `<!-- AF-DISPATCH-ACK: … -->` 供抄 `paths`（脚本不校验）。无 Subagent → `"mode":"degraded-single-session"` + `degradedReason` + `degradedAt`。

## 角色加载与派活

```
1. 确认 atlas/role/（缺 → --bootstrap-scaffold；DIR-ROLE）
2. 读当前 flow step 的 prompt（例如 atlas/role/role-req.md）
3. body = resolveRolePrompt(root, promptPath, ctx)
4. prompt = body + buildTaskEnvelope({ 路径-only, gate, Tid… })
5. 【宿主 Subagent/Task】发出
```

**assembled**：从 `templates/role/layers/{key}/` 拼 `core+return`。  
**custom**：`Read atlas/role/role-{key}.md` 全文 verbatim。

### 本次任务块（薄信封）

```markdown
## 本次任务（总控注入）

- 阶段：{N} · 决策：{AF_DECIDE} · 任务一句话：{...}
- 上游路径（Read 读盘，复述正文）：
  - atlas/requirements/REQ-001-*.md
- 产物期望：atlas/requirements/REQ-001-*.md
- 须过 gate：`validate-atlas --gate {xxx} --root {项目根}`
- Dev：Tid T-xxx · 一次派活内 ①→②→③ → [dev-granularity](dev-granularity.md)
```

## 阶段与派活表

| 阶段 | 派谁 | 产物 | 验收 | 绿后 |
|------|------|------|------|------|
| 0 init | 总控 | `atlas/init/` | `init-confirm` | 进主链 |
| 1 af-req | `role-req` | requirements + glossary | `req-confirm` → 总控标已确认 | 见下 |
| 2 af-mod | `role-model`（未 skip） | model/ | `mod-confirm` | 进 sol |
| 3 af-sol | `role-sol` | solution/ + T 头建议 | **总控先写 todo** → `sol-confirm` | 进 dev |
| 4 af-dev | `role-dev`（**每 T 一次**） | dev + 码 + 证据 | 见 ①②③ | 下一 T |
| 5 af-test | 总控 | 验收报告 | `test-entry`；有 FE 须 [Playwright](../tools/fe-smoke-playwright.md) | 完成 |

### 阶段 1 绿后路由

```
req-confirm 绿 → 标 REQ 已确认 → AF_PHASE=2
→ flow 该步 orch：可 skip → 写 skip+reason → AF_PHASE=3 → sol
           须做 → 派 role-model → mod-confirm → AF_PHASE=3
```

init 不在 `flow.steps`：brownfield 先 `00-project-init`。编排权威 → [flow.md](flow.md)。

### 阶段 3 时序

```
派 role-sol → 收回 T 头建议 → 总控写入 atlas/todo.md → sol-confirm 绿 → af-dev
```

### 阶段 4：每 T 一次派活 · 内部分 ①→②→③

**一次派活**：每 T 只派 1 次 `role-dev`；Subagent 本轮内 ①→②→③ 后回报。gate 由总控在回报后跑并勾选。

| 步 | Subagent | 总控 gate | 勾 |
|----|----------|-----------|-----|
| ① | 写 `atlas/dev/T-xxx-*.md`（先不写码） | `dev-step1-literal` | ① |
| ② | 按实现说明写码 + UT | `write-code` + [写码闸门](dev.md#写码闸门write-前) | ② |
| ③ | `## 结果` + AC 映射 | `--only todo`（TODO-CHECK-③） | ③ |
| 全齐 | — | `dev-complete`（含 **REQ AC 回填**） | 开发 ✅ |

红 → 回灌同 T 同角色。并行 → [04 §并行](../phases/04-development.md#并行阶段-4)（开多个 role-dev，不是总控自己写码）。

## 验收失败

> 轮次 SSOT → [orchestrator-core §闸门自修计数](orchestrator-core.md#闸门自修计数ssot)

| 轮次 | `user` | `ai` |
|------|--------|------|
| 1～2 | 报错回灌同角色 | 同左 |
| **3** | **停** | **停** |
| **4+** | — | 首行 `⚠️ 闸门持续红` → **停**，列 rule-id |

计数：同 **gate + role/taskId**；新 T / 新 gate 归零。可选 `repairRound: 1|2|3`。

## checkpoint 协议

回报后 / gate 后立刻更新 `atlas/todo.md` → `## 进行中`：

| 原子步 | checkpoint |
|--------|------------|
| ① 绿 | `T-xxx · 步骤 ① · 日期` |
| ② 首写业务文件 | `T-xxx · 步骤 ② · 日期` |
| ③ 可运行绿 | `T-xxx · 步骤 ③ · 日期` |

新会话：读 checkpoint → 从下一步续。

## 契约分叉

- `ai`：阻塞派活 + 同会话连做；不 AskQuestion（缺人料除外）  
- `user`：缺口/确认卡由总控发 → 再派角色  

## 相关

[orchestrator-core](orchestrator-core.md) · [contract](contract.md) · [SKILL](../SKILL.md) · [validate-atlas-gate](validate-atlas-gate.md) · [04 并行](../phases/04-development.md#并行阶段-4)
