# Agileflow 排障（短表）

> **用法**：先看报错行末 `💡 白话 · 谁修`；本表 = **白话 + 谁修 + 下一步**（不重复规则定义）。
> **错误码权威**：规则含义与修复动作 → [validate-atlas-gate](templates/validate-atlas-gate.md)；脚本 `lib/rule-hints.mjs`；流程裁决 → [SKILL 裁决表](SKILL.md#裁决表冲突时以此为准)。
> **谁修**：`AI`=自修后重跑闸门（`AF_DECIDE=ai` 勿等人说继续）· `你`=需选卡/提供资源 · `双方`=配合。

## 高频（置顶）

| 问题 | 白话 | 谁修 | 怎么做 |
|------|------|------|--------|
| 闸门红 / `[SOL-*]` | 方案或契约文档不合规 | AI | 贴完整报错；AI 自修后重跑 |
| 闸门红 / `[DEV-*]` `[TODO-CHECK-*]` | dev 文档薄/缺证据/勾了但没文件 | AI | 让 AI 补 dev + 真跑命令写 `## 结果` |
| 闸门红 / `[REQ-*]` | 需求缺 AC/UID/范围 | AI | 补 REQ / 回填 AC 后重跑 |
| `AF-ENV-BOOT` | 还没选谁决策 | 你 | 答启动卡或说「重选决策权」 |
| `AF-ENV-CAPABILITY-PENDING` | 总控未声明宿主能力 | AI | 首条写 `AF_HOST_CAPABILITY=full|degraded` |
| `AF-ENV-PHASE` | env 阶段与产物不一致 | AI | 按报错更新 `AF_PHASE` 后重跑 gate |
| `ORCH-DEGRADED-CONFLICT` | 有 Task 却 degraded 台账 | AI | 改 `normal` 台账 + `subagentId`，或真降级则改 env |
| AI 不写文件、像卡住 | 在等你点阶段闸门卡 | 你 | 点「继续」；要全自动→「后面都你定」 |
| AI 说找不到 `00-intent-routing` / 直接跳流程写码 | 在**工作区项目根** Glob，没找 **skill 根**（常在 `~/.qoder|cursor/skills/agileflow` 或门牌同级） | AI | 按 SKILL LOAD「路径锚点」换路径重试；禁止以搜不到为由跳阶段 |
| `AF-CMD-MISSING` / `AF-CMD-EMPTY` / `AF-CMD-NO-STEP` | `/af*` 做完没显式留痕，或只建了空 `logs/`，或**只写了入口 `/af` 想冒充各步** | AI | 每步先用**本步门牌**跑 `agileflow log` 再 gate；gate 只读，不自动补。`ai` 连做 ≠ 免留痕 |
| `ai` 却每阶段停 | Agent 误用旧纪律 | AI | 提醒按委托**连做**；仍须闸门绿 |
| `ai` 派完一批等人「继续」 | 后台派活后交班 | AI | 改阻塞式 Task；同会话循环到交付 → [orch-core](templates/orchestrator-core.md) |
| 总控包办 REQ/sol/dev / 未开 Subagent | 口头派活或连做误读 | AI | 查是否真派 Subagent；补派 + 记台账；真无 Subagent → `AF_HOST_CAPABILITY=degraded` + `degradedReason` |
| `ORCH-NO-DISPATCH` / `ORCH-DISPATCH-MISMATCH` | 无台账或未覆盖产物路径 | AI | 派 Subagent（Cursor=Task）对应 role → 收回报写台账 → 重跑 gate |
| `ORCH-NO-SUBAGENT-ID` / `ORCH-DEV-NO-TASKID` | 台账缺 Subagent ID 或 dev 缺 taskId | AI | 每条 entry 写宿主返回的 `subagentId`；dev 写 `taskId`（如 T-001）；`dev-complete`/`test-entry` 收口亦验 |
| 改了 `atlas/role/` 仍被 REQ-*/DEV-* 挡 | baseline 未更新或 role 未判 custom | AI | 确认 `.agileflow-role-baseline.json` 存在；自定义后应见 `ROLE-CUSTOM-SKIP`；恢复默认闸门 → `--refresh-role-baseline` |
| 绿场写完 `backend/`/`frontend/` 后闸门全退回 `af-req` / `AF_PHASE=0` | 源码目录触发 brownfield，却无 `atlas/init` 已确认 | AI | 用含「已确认 REQ 逃生」的校验脚本（skill ≥ 本修）；或补 `atlas/init` 盘点；**勿**把可选原型/写法锚点写进 `flow.yaml` outputs |
| `write-code`/`dev-complete` 报 `AF-ENV-STEP` 与波不一致 | 闸门未映射到 `af-dev`，或步 outputs 已齐却 env 仍停在上一步 | AI | 确认 `GATE_TO_STEP` 含 write-code/dev-*；outputs 齐后跑确认闸门应握手；同步 `AF_STEP`/`AF_PHASE` |
| `[DEV-AC-UNIT]` Java/BE 已有 `src/test/` 仍红 | 旧规则只认 `test/unit` | AI | AC 映射表写 `src/test/…` 或 `test/unit/…`；升级 skill 校验 |
| 卡在 `af-req`/`af-sol` 永远做不完 | `flow.yaml` outputs 列了可选 `ui/prototypes/` 或 `code-patterns-*.md` | AI | 从 outputs 删掉（按需落盘即可）；模板默认已注明勿列入 |
| `gate \| tee` 显示 EXIT:0 实际失败 | 未开 `pipefail`，tee 盖住 gate 退出码 | 双方 | 看 CLI 最终尾标；有 current Run 再跑 `run gate-status`，只认 JSONL 当前证明；从未建 Run 的 legacy 项目才看 MD |
| `RUNTIME-FLOW-STALE` / `flow-stale` | active Run 启动后改了 flow | AI | `agileflow run abandon --reason "flow 已变更" --root .`，再启动新 Run；禁止同 Run 刷新 flowDigest |
| `no-registered-artifacts` / `artifact-registry-dirty` | 未 scan，或 scan 后又改了产物 | AI | 先 `agileflow artifact scan --root .`，确认内容稳定后重跑 gate |
| `step sync` 被拒 / 手改 AF_STEP 仍乱 | 前进离开某步无对应 confirm 的 PASS 回执 | AI | 先 `gate` 绿再 sync；紧急才 `--force --reason "…"` |
| `rewind` 报只能回到更早 / 血缘全 ready | 用 rewind「前进」冲掉 passed | AI | **前进用 advance/step sync**；rewind 只回退；禁 `rewind --to` 更后面的步 |
| `RUNTIME_LINEAGE` 缺前序步 | 多次错误 rewind/force 后 steps 停在 ready | AI | 从最早缺口合法 advance 重建；勿 rewind 向前跳 |
| `TODO-CHECK-②无写码证据` | 空勾② | AI | 先 `write-code` 绿再写码；或已有 backend/frontend |
| `ORCH-FAKE-SUBAGENT-ID` / `ORCH-DIRECT-FORBIDDEN` | 假 ID 或 orch-direct 包办 req/sol/dev | AI | 真派 Task；抄回真实 subagentId |
| `ORCH-DEGRADED-UNPROVEN` | 有 .cursor 却口头 degraded | AI | 真无 Task 才写 `atlas/logs/af-allow-degraded.md` |
| `AF-SKILL-SKEW` | 项目 skill 副本落后于当前闸门 | AI | `npx @agileflow/cli@latest init --root .`（默认先删旧再装）或设 `AGILEFLOW_SKILL_ROOT` |
| `REQ-TITLE-SUBSTANCE` / 自创 REQ 大纲 | 标题写 666；或用「## 1. 概述」冒充模板 | AI | 按 `templates/req.md`：`# [REQ-xxx] 名` + `## 范围提示` + BDD 8 列 AC |
| `REQ-SCOPE-MINLEN` / `REQ-AC-MIN-ROWS` / `REQ-AC-CELL-MINLEN` | 范围内外/AC 注水过短 | AI | 范围内外各≥16字；AC≥2行；Then 含可观测断言 |
| `ORCH-DEGRADED-NO-ENTRIES` / `ORCH-DEGRADED-ALLOW-THIN` | degraded 空台账或 allow 文件糊弄 | AI | orch-direct+paths 覆盖产物；allow 写明无 Task |
| `AF-ENV-NO-RECEIPT` | 手改 AF_PHASE/已确认但没跑 gate | AI | 先 `gate --gate req-confirm|sol-confirm` 拿 PASS 回执 |
| `SOL-F-THIN` | F 卡三行空壳 | AI | 边界做/不做≥40字 + 暴露面 + 全文够厚 |

## 全表

| 问题 | 常见原因 | 谁修 | 怎么做 |
|------|----------|------|--------|
| `TODO-CHECK-*` | 勾了①②③但无合规 dev 或无可运行证据 | AI | 先落盘 `dev/T-*.md` 并真跑命令，再勾 |
| `REQ-UID-断链` | REQ 链了 UID，`ui/` 空或不存在 | AI | 先写满 UID，再标 REQ 已确认 |
| `REQ-AC-观测面值` / `REQ-AC-表头` / `REQ-AC-空单元格` | AC 表格式不对或空格 | AI | 按 [05-testing](phases/05-testing.md) 补列 |
| `SOL-F-REQ-TRACE` | F 无 `← REQ-…` 回溯 | AI | 边界从 REQ 提炼并写回溯行 |
| `SOL-API-NO-JSON` | API 契约无 JSON 示例 | AI | 按 template-api 补 jsonc 请求/响应 |
| `dev 文件数 ≠ T 头数` | todo 有多个 T 却合文件或少写 | AI | **一 T 一文件**（BE/FE 拆开） |
| `SKIP-CODE-*` / `DOC-FIRST-*` / `SKIP-README冒充T` / `SKIP-MODEL-无判定` | 先写码无方案/无 F/无建模跳过判定 / REQ 格式未过 | AI | 补 architecture+F+dev；或在 `flow.yaml` 写 model skip+reason（旧项目可 todo「建模判定：跳过⏭️」）；写码前跑 `--gate write-code` |
| `SKIP-方案进度假` / `TODO-CHECK-方案完成无arch` | 勾了方案✅却无 architecture | AI | 先落盘架构与 F |
| `SOL-README-MASH*` | solution README 写了技术栈/API 表 | AI | README 只留索引 |
| `SOL-CONTRACTS-缺` / `SOL-F-EXPOSE` / `SOL-F-BOUND` | 暴露面有编号无文件/边界缺做不做 | AI | 补 contracts；F 写暴露面与边界 |
| `SOL-A-SEC-*` / `SOL-A-RUN` | architecture 缺技术栈/模块/本地验证 | AI | 按模板补三节 |
| `REQ-SCOPE` / `REQ-AC-未回填` | 无范围提示；AC 未回填 | AI | 补范围；③ 回填测法；`dev-complete`/`test-entry` 强制拦 |
| `SKIP-测试进度假` / `TST-R-PASS` | 「测试验收 ✅」但无 PASS | AI | tests/README 写 PASS + 报告 |
| `MOD-*` | model 目录结构/实体不合规 | AI | 按 02-modeling 补 entities/conceptual |
| 说「测过了」但编译不过 | 可运行闸门未真跑 | AI | 要求 `## 结果` 写**命令 + exit code** |
| `ORCH-STEP-ID` / `ORCH-DIRECT-ID` | 台账缺步名，或直做步未标 orch-direct | AI | 每步写 stepId；prompt:null 用 role=orch-direct |
| `AF-ENV-STEP*` / `FLOW-*` | AF_STEP 缺失或与 flow/产物不一致；strict 擅自 skip | AI | 同步 `AF_STEP`+`AF_PHASE`；见 [flow.md](templates/flow.md) |
| 断点找不到进度 | todo 缺失或 checkpoint 空 | 双方 | 读 `AF_STEP`+flow；说「继续 agileflow」→ 从当前步续 |
| 半初始化 atlas（有 role 无 dispatch 等） | scaffold 中断 | AI | 重跑 `--bootstrap-scaffold --root .`（幂等，只补缺失） |
| 跳过首启卡直接写 REQ | env 未 pending | 你 | 说「**重选决策权**」→ 再发启动卡 |
| 想调研却进了 req | 意图是探索 | 你 | 说「先探索」或 `explore:` |
| AI 自主仍要写① / 细 sol·dev | 单档位不减厚；加速靠并发 | — | 正常；见 [contract](templates/contract.md) |
| humanTodo 一直阻塞 | 密钥/资源未提供 | 你 | 配好后说「已配置 xxx」 |
| 并行 Subagent 翻车 | 路径冲突或未过并发启用 | AI | 查 [parallel](phases/04-development.md#并行阶段-4) |
| `⚠️ validate-atlas 不可用` | 无 node / 脚本路径失败 | 双方 | AI 逐项自检；**你建议抽查**；`ai` 模式禁甩「继续」给人 |

```bash
node <skill>/scripts/validate-atlas.mjs --list-gates
node <skill>/scripts/validate-atlas.mjs --gate sol-confirm
```

仍不行：把**完整报错原文**贴给 AI，并打开 `atlas/README.md` / `atlas/todo.md` 看「现在」。停点对照 → [examples/flow-interaction.md](examples/flow-interaction.md)
