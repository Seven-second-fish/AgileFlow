# Atlas 校验（AI 流程闸门）

> **实现**：`scripts/validate-atlas/`（随 skill 安装）· 规范：`lib/phase-spec.mjs`
> **硬挡**：error 与 warn **同等失败**（exit ≠ 0）。没有「可继续知债」。
> **ORCH-*（派活台账）**：`--gate req-confirm|mod-confirm|sol-confirm|dev-step1-literal|write-code|dev-complete|test-entry` 验路径覆盖 + **台账溯源审计**（`subagentId` / dev `taskId`）。`write-code` / `dev-complete` / `test-entry` **额外硬验上游**：盘上已有 REQ/model/sol 产物且步未 skip 时，台账须有对应 `role=req|model|sol` + 真 `subagentId`（有源码无 `atlas/dev/T-*.md` → `ORCH-NO-DEV-ARTIFACT`）。`--only req` 等模块单跑**不**验台账，不可替代对应 gate。
> **禁止概念过闸**：CLI 未装须先 `npx @agileflow/cli` / 本地 bin；**不可**口头「概念 PASS」。`AF_DECIDE=ai` /「你定」只少停点，**不**免派活、不免除 gate。
> **AF-CMD-*（指令留痕）**：主闸门只读硬验 `atlas/logs/af-commands.md` 的**本步门牌**（`/af-req` 等；裸 `/af` 不算）。须先显式执行 `npx @agileflow/cli log --door /af-… --summary … --route … --root .`；gate 不自动补，FAIL 不得制造 ✅。`AF_DECIDE=ai` **不免**留痕。
> **REQ 质量硬指标（L1）**：`REQ-TITLE-SUBSTANCE`（禁 666/junk）· `REQ-SCOPE-MINLEN` · `REQ-AC-MIN-ROWS`（≥2）· `REQ-AC-CELL-MINLEN`；禁自创大纲冒充（缺 `## 范围提示` / BDD 表 → `REQ-SCOPE`/`REQ-AC-表头`）。
> **degraded**：只免真实 `subagentId`，**不免**质量与 paths 覆盖；须 `orch-direct` entries +（有 Cursor/Qoder 时）`af-allow-degraded.md`。
> **回执单权威**：有 current Run 时只认 `atlas/runs/<runId>/receipts.jsonl`，绑定 `runId`、step attempt、flow digest 与该步已登记产物摘要；legacy MD 即使 PASS 也无效。只有从未建立 current Run 的旧项目才兼容 `atlas/logs/af-gate-receipts.md`。validator 只读，`agileflow gate` 在校验结束后按真实最终状态提交回执。
> **flow.yaml**：`atlas/flow.yaml` 某步 `skip: true` 时，对应 `req-confirm|mod-confirm|sol-confirm|test-entry` **短路为 PASS**（`FLOW-STEP-SKIP`）；`write-code` / doc-first **不**再硬要已 skip 步的产物。约定 → [flow.md](flow.md)。
> **ROLE-CUSTOM-SKIP**：`atlas/role/role-*.md` 相对 `.agileflow-role-baseline.json` 已改 → 跳过该阶段**文档格式**闸门（info，不 fail）；**ORCH 仍硬挡**。重置 baseline：`--refresh-role-baseline --root .`
> **契约也是硬规则**：`user` 该停就停；`ai` 闸门绿该连做就连做——不是可选自觉。
> **路径**：勿写死 `skills/agileflow`。用下方探测或 `AGILEFLOW_SKILL_ROOT`。

## 闸门覆盖（不过 = 硬挡）

### 分级（读 gate 时对照）

| 级别 | 谁验 | 典型项 |
|------|------|--------|
| **L1 脚本硬挡** | `validate-atlas --gate` exit 0 | ORCH-*（含 `ORCH-DEGRADED-*`）、`AF-ENV-*`（含 `AF-ENV-NO-RECEIPT`）、REQ 质量硬指标、dir、write-code、dev-step1-literal、dev-complete、test-entry、todo 三段式、`DOC-FIRST-*`、`SOL-F-THIN` |
| **L2 流程契约** | 总控 + [contract §4](../templates/contract.md#4-停点总表) / [SKILL 裁决表](../SKILL.md) | AskQuestion 停点、`ai` 连做、`user` 阶段闸门、TodoWrite 展开 |
| **L3 质量可读** | role 模板 + 人审 + dev-granularity | 构思厚度、字面量、AC 映射语义、驾驶舱可读性 |

> L1 失败 = 禁止勾 ✅ / 进阶。L2 违规 = 流程失败（不可用「脚本管不到」跳过）。L3 由闸门字面量与 role 共同约束，过 L1 仍须满足 L3 才宜交付。

| 闸门/规则 | 失败效果 |
|-----------|----------|
| `atlas/agileflow.env`、**`atlas/agileflow-dispatch.json`（ORCH-*）**、`write-code`（`anti-skip` 别名）、`dev-step1-literal`、`dev-complete`(+runnable)、`test-entry`(+smoke)、`sol-confirm`（architecture + 有 REQ 须 F + REQ 已确认 + model 或正式跳过 + 栈来源）、todo 三段式/假进度、字面量/空壳/占位 | exit ≠ 0 → 禁止勾 ✅ / 进阶；报错含修复动作 |
| 契约停/连做（AskQuestion、TodoWrite） | 按 [SKILL 裁决表](../SKILL.md) 执行；违规 = 流程失败，禁止用「脚本管不到」当借口跳过 |

## 脚本不可用时的降级（必读）

当 `node` 命令不存在、脚本路径探测失败、或脚本运行时抛出异常时（exit ≠ 0 但非校验失败）：

1. Agent 须在回复**首行**标注：`⚠️ validate-atlas 不可用（原因：{node未安装/路径未找到/运行时错误}）· 以下为 Agent 自检，建议抽查`
2. **禁止** `ai` 同回复连做下一阶段——降级模式下**每阶段须停**等用户确认或显式「继续」
3. 降级为**人工逐项声明**（禁止笼统「全部通过」），须按当前 `--gate` 列出每项及结果，例如：
   ```
   降级自检（gate=sol-confirm）：
   - [ ] architecture.md 含技术栈/模块/本地验证 → {✅/❌ + 一句依据}
   - [ ] features/F-*.md 与 REQ 对齐 → {✅/❌}
   - [ ] contracts 文件名合规 → {✅/❌}
   …
   ```
4. 降级模式下勾①/✅ 须额外标注 `（人工降级·脚本不可用）`
5. **禁止因脚本不可用而跳过校验项本身——只降级校验手段，不降级校验标准**

## 字面量校验完整清单

| 检查项 | 要求 | 不过规则 |
|--------|------|---------|
| 段标题 | 全端：`## 摘要` `## 主流程` `## 边界` `## 实现说明` `## 结果`；禁 `## 步骤` | DEV-SEC-* · DEV-BAN-步骤 |
| 主流程 | `> 入口：` + 编号 3～8 步；含代码落点 | DEV-FLOW-* |
| 边界 | ≥2 条，挂「第 N 步」或 `method()` | DEV-EDGE-* |
| 实现说明 | `### path` 【新写/改动】含 **目的** + **做什么** + **怎么做**（逻辑块编号 ≥2 且含 →/错误码/返回/toast）；摘要「做」对齐 ### 标题 | DEV-IMPL-* · DEV-DO-对齐 |
| 链 sol | BE 链 API；FE 链 UI（调 API 时）；dev 禁字段映射表 | DEV-LINK-* · DEV-BAN-映射 |
| 代码落点 | OOP→反引号内含 `.`；函数式→`` `func()` ``；路径型→`` `path/` ``；**禁单单词反引号**（如 `` `Service` `` `` `todo` ``） | DEV-LIT-代码落点 |
| 禁形旧标题 | 禁 `## 一、目标` `## 五、可执行方案` | DEV-BAN-* |
| JSON 复贴 | dev 内大段 JSON → error | DEV-COPY-JSON |
| 文档长度 | 去空格后 ≥ 500 字 | DEV-FAKE-过短 |
| 假标题 | 纯文本"范围/步骤"无 `##` | DEV-FAKE-标题 |
| 禁冗余段 | 禁止 dev `## 范围` `## 做法` `## 异常` `## AC`；禁止 F `## 联调卡`；禁「写码后填」当构思 | DEV-BAN-* · DEV-STUB-* · SOL-F-BAN-* |
| UI 字段绑定 | UI 契约链 API 须 `## 字段绑定` 表 | SOL-UI-BIND |

## 如何找到脚本（可移植）

```bash
# 1) 环境变量（任选）
#    export AGILEFLOW_SKILL_ROOT=/path/to/agileflow   # bash
#    $env:AGILEFLOW_SKILL_ROOT="C:\path\to\agileflow" # PowerShell

# 2) 打印 skill 根（从已定位到的 validate-atlas.mjs 调用）
node <任意已知的 validate-atlas.mjs> --print-skill-root

# 3) 打印本机可复制命令
node <skill>/scripts/validate-atlas.mjs --print-cmd --gate sol-confirm --root .

# 4) 在 skill 目录用 npm
cd <skill> && npm run validate:sol
```

探测顺序：`AGILEFLOW_SKILL_ROOT` → 本脚本所在 skill → 项目 `skills/agileflow`（旧路径 `.cursor/skills/agileflow` 兼容）→ `~/.cursor/skills/agileflow`。

## agileflow.env（流程状态 · AI 维护）

路径：`atlas/agileflow.env`（模板 `templates/agileflow.env`）。**不是密钥**，须进库。

| 键 | 用途 |
|----|------|
| `AF_PHASE` | 当前阶段；须与产物推断一致，否则 `AF-ENV-PHASE` |
| `AF_DECIDE` | `ai` / `user` / `pending`（`pending` → `AF-ENV-BOOT`；`user` 决定技术栈要不要先问） |
| `AF_TIER` | `full` |
| `AF_STACK_SOURCE` | `pending` / `ai_record` / `askquestion` / `user_said` / `repo` |

进阶或改决策后**先改 env 再跑闸门**；报错信息含修复动作。

## Agent 必须执行的命令

| 时机 | 闸门 | 不过 → | 修复（回派 role key） |
|------|------|--------|----------------------|
| init 落盘 · AskQuestion 前 | `init-confirm` | 禁止 init 确认 | 总控 |
| REQ 落盘 · 确认卡前 | `req-confirm` | 禁止 REQ 确认 | `req`（**须**派活台账 role=req） |
| model 落盘 · 确认前 | `mod-confirm` | 禁止进 sol | `model`（**须**台账 role=model） |
| 方案+todo · 闸门前 | `sol-confirm` | 禁止进 dev（**须** env + architecture + **有 REQ 则须 F-*.md** + REQ 已确认 + 建模已确认或正式跳过判定 + 栈来源按决策权落地；**总控须先写 todo**） | `sol`（todo 缺 → 总控补写；**须**台账 role=sol） |
| **勾①前** | `dev-step1-literal --dev-file atlas/dev/T-xxx-*.md` | **禁止勾①** | `dev` · 子阶段①（**须**台账 role=dev + taskId） |
| **派②前（Write 源码前）** | `write-code` + [写码闸门自检表](dev.md#写码闸门write-前) | AF 项目+有源码须 REQ→sol→dev① 格式全过；不过 → 禁止写码 | `dev` · 子阶段②（有 dev 文件时须台账） |
| **勾①/②/③ 后（任意时刻）** | `--only todo`（规则 `TODO-CHECK-*`） | 勾了无文件 / **勾①未过构思格式** / 勾③无可运行 / 先码后补空壳 → **失败** | `dev`（对应子阶段）；状态总控维护 |
| **单 T 勾③前** | 该 T `## 结果` 含可运行证据 + `--only todo` | 禁止勾③ | `dev` · 子阶段③ |
| **全部 T 齐 · 开发✅前** | `dev-complete` | 禁止 ✅（须可运行证据 + **REQ AC 已回填**） | `dev` · 子阶段③ |
| **进阶段 5 前** | `test-entry` | 禁止 AC 归档 | 总控 |
| **验收归档前** | `req-trace` | 链不完整 → **失败** | 总控按断链回派 |

列出：`--list-gates`

## 可运行证据（runnable · 硬挡）

写入每个 T 的 **## 结果**，须同时可 grep 到：

1. **编译**：`编译` / `build` / `package` / `mvn` / `gradle` / `cargo` / `go build` / `dotnet` / `make` / `cmake` / `webpack` / `构建` / …
2. **启或冒烟**：`启动` / `health` / `冒烟` / `curl` / `serve` / `dev server` / `docker` / `运行` / …
3. **结果**：`exit 0` / `✅` / `通过` / `PASS` / `UP` / `BUILD SUCCESS` / `成功` / `完成`

禁止空表或只写「③ 验收后填写」。

## 勾选证据（todo `TODO-CHECK-*` · 硬挡）

> 堵「AI 自主 / 委托交付」时空跑勾选：checkbox 是承诺，不是装饰。

| 勾选态 | 脚本要求 |
|--------|----------|
| 勾 ① | 对应 `atlas/dev/T-xxx-*.md` **必须存在** |
| 勾 ② | ① 已勾 + 构思文件存在 |
| 勾 ③ | ② 已勾 + 该文件「## 结果」含可运行证据 |
| 流程进度「开发实现 ✅」 | 每个 T 的 ①②③ 均已勾且证据过关 |

`sol-confirm` 阶段 ①②③ 应仍为 `[ ]`，不触发本表；一旦勾选（任意 phase）即硬挡。

## 入场日志（smoke · 硬挡）

`atlas/logs/` 下至少一个文件名含 `smoke|compile|probe|test-entry|fe-smoke|be-smoke`，正文含通过痕迹。

## 像素对比（有强制原型时 · 硬挡）

规则与目录 → [fe-pixel-compare](../tools/fe-pixel-compare.md)。
闸门读 `atlas/tests/fe-pixel/report.json`（`dev-complete` / `test-entry`）。

## 回复格式（勾①时）

```
字面量校验：## 摘要 · ## 主流程 · ## 边界 · ## 实现说明 · 代码落点 已命中
validate: exit 0 — <print-cmd 给出的命令>
```

勾③ / 开发✅ 时另报：`dev-complete` / `runnable` exit 0。
