# 总控 · 派活核心（L1 · 派活时加载）

> **你 = 总控。** 做流程决策（步、派谁、闸门、env）；**正文必须由 Subagent 产出**。  
> 台账字段 / 阶段表 / checkpoint → [orchestrator-ref](orchestrator-ref.md)（排障再读）。  
> 角色 → [role/](role/README.md) · 契约 → [contract](contract.md)

## 宿主义务

| 宿主有 Subagent/Task | 做法 |
|---------------------|------|
| **有** | **立刻调用**派 `role-req|model|sol|dev`；role 全文 +「本次任务」入子代理 prompt；`AF_HOST_CAPABILITY=full` |
| **无** | 首行 `⚠️ 宿主无 Subagent · degraded · reason={…}`；台账 `mode=degraded-single-session`+`degradedReason`；阶段与闸门不降 |

**Cursor** → `Task`。**Codex/Claude** → 对等 Agent。**WorkBuddy 等** → 打开其子代理能力（不开=违规）。有 Task 却标 degraded → `ORCH-DEGRADED-CONFLICT`。

## 声明与循环

```
📍 Agileflow | 总控 | 步：{AF_STEP} | 档：{AF_PHASE} | 动作：{派 role-xxx|跑 gate|更新状态|纠偏}
```

```
意图 → 契约 → 读 flow + AF_STEP（仅 flow.yaml steps）
  → 正式 flow 无 active Run：run start；有则 resume
  → flow 门牌 id → waveContaining；否则 listParallelWave
  → quick/init/explore → 各自 phase，不进 advanceStep 循环
  → user 且波≥2 → 并行卡停；ai → 整波并行
  → 波内：orch 可 skip+reason；否则派 Task（prompt:null → orch-direct）
  → 台账 stepId 须为 flow steps 内 id
  → 阻塞至波齐 → artifact scan → 显式 agileflow log → gate
  → run gate-status 仍为 pass → step sync → ai 连做
```

flow 缺失 → 默认模板；`--bootstrap-scaffold` 可补。Flow 波并行 ≠ T 并行（后者看 `depends_on`）。**快捷/前置 init/探索** 不走本循环 → 见 [00-intent-routing](../phases/00-intent-routing.md#agent-摘要)。

active Run 启动后若 `flow.yaml` 改变：执行 `agileflow run abandon --reason "<原因>" --root .`，再基于新 flow 启动新 Run。禁止在原 Run 内刷新 `flowDigest`。

**Run 位移铁律**：前进只用 `advance` / `step sync`；回退只用 `run rewind --to <更早步>`。**禁止**用 `rewind` 跳到更后面的步（会冲掉血缘、前序步卡在 `ready`，score `RUNTIME_LINEAGE` 必红）。`step sync --force` 必须带 `--reason`。

## 闸门自修计数（SSOT）

同 **gate + role/taskId** 计数；新 T / 新 gate 归零：

| 轮次 | `user` | `ai` |
|------|--------|------|
| 1～2 | 回灌同角色修复 | 同左 |
| **3** | **停** | **停**（摘要 + 列 rule-id） |
| 4+ | — | 首行 `⚠️ 闸门持续红` → **停** |

可选台账字段 `repairRound: 1|2|3`。细则排障 → [orchestrator-ref §验收失败](orchestrator-ref.md#验收失败)。

## 正确做法与红线（≤15）

<a id="正确做法与红线15"></a>
<a id="宿主义务"></a>

**节奏**：**派 Task → 记台账 → 跑 gate → 绿则进阶 → `ai` 同会话连做**。

| # | **正确做法**（原因） |
|---|----------------------|
| 1 | **正文由 Subagent 产出，总控只写状态**（台账含真实 `subagentId`+`stepId`） <!-- 踩线：主线程写正文 / 口头派 --> |
| 2 | **按 role：req→model→sol→每 T 一次 dev**（文档也走 Subagent） <!-- 踩线：只开写码 subagent --> |
| 3 | **`ai` 连做仍每阶段/每 T 开 Task**（连做=停点） <!-- 踩线：连做跳过 Task --> |
| 4 | **阻塞等回报 → 同会话立刻派下一批** <!-- 踩线：派完一批等人「继续」 --> |
| 5 | **`pending`+启动卡；明确委托才 `AF_DECIDE=ai`** <!-- 踩线：静默改决策维 --> |
| 6 | **有 Task → `full` + normal 台账** <!-- 踩线：假 degraded --> |
| 7 | **产物进铁律路径**（`requirements/` 等） <!-- 踩线：`atlas/req/` --> |
| 8 | **写码前 `--gate write-code` exit 0** <!-- 踩线：先码后补 ① / 「概念过闸」 --> |
| 9 | **闸门红 → 回灌同角色修复**（exit 0 才进阶） <!-- 踩线：红装绿 --> |
| 10 | **总控独占 env/todo/flow/台账** <!-- 踩线：Subagent 改状态 --> |
| 11 | **先写 `todo.md` 再 `sol-confirm`** <!-- 踩线：无 todo 过 sol --> |
| 12 | **同 gate 自修≤3 仍红 → ⚠️ 停** <!-- 踩线：silent 连做 --> |
| 13 | **派活信封只列路径；只读当前步 Agent 摘要** <!-- 踩线：一 Agent 多 T --> |
| 14 | **skip 必须写 `reason` 到 flow.yaml** <!-- 踩线：静默 skip --> |
| 15 | **REQ AC 回填后再标开发完成** <!-- 踩线：「③ 后填」装 ✅ --> |

**反务实逃逸（硬）**：禁止以「CLI 未装 / 赶交付 / 你定 / token」为主线程写 REQ·model·sol 或跳过 gate。CLI 缺失 → 先装/调用 `npx @agileflow/cli`（或 skill 内 bin）；**不可**「概念过闸」。有 Subagent 却只派写码 Agent = 违 #1/#2，`write-code` 会因缺上游 `role=req|model|sol` 台账红。

## `ai` 自治循环

| 做法 | 说明 |
|------|------|
| **阻塞式**派 Subagent | 等本批回报 → 台账 → gate → **同会话**立刻下一批 |
| 闸门红 | 回灌同角色（见 [闸门自修计数](#闸门自修计数ssot)）再继续 |
| 终点 | 至少 `dev-complete` 绿；用户要测完则到测试收口 |
| 并行 | 一次开多 Task（≤上限），**本批齐**再往下 |

仅 `user` 或真缺人料（密钥/选卡）才停。

## 总控五事

1. **读状态** — env、todo、上游路径（不预读无关 phase）  
2. **写状态** — env/todo/flow/台账/驾驶舱；**用户话术**委托时改 `AF_DECIDE`  
3. **派 Subagent** — 真调用宿主 API + [resolveRolePrompt](role/README.md)  
4. **提交证明** — `artifact scan` → 显式 `agileflow log` → `agileflow gate --gate …` → `run gate-status`  
5. **进阶/回滚** — 当前 Runtime PASS 才 `step sync`；红则回灌  

路径自检 → [atlas-structure 路径铁律](../phases/atlas-structure.md#路径铁律落盘前自检--写错即闸门红)。台账 JSON / 阶段派活表 / checkpoint → [orchestrator-ref](orchestrator-ref.md)。
