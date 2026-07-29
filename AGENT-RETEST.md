# AgileFlow · Agent 复测手册

改完 skill 后：先跑 `cd skills/agileflow && npm run test:validate`，再按改动范围挑下面的 Agent 场景。
**只看本文件**；每条有 **话术**（复制给 Agent）和 **预期**（怎样算过）。

## 场景索引（60 个编号场景）

| ID | 分区 | 门牌/能力 | 层级 | 自动化 |
|----|------|-----------|------|--------|
| A1 | 静态 | test:validate | **P0** | 终端 |
| A2 | 静态 | test:cli | **P0** | 终端 |
| A3 | 静态 | test:docs | **P0** | 终端 |
| B1 | 路由 | `/af` → fix | **P0** | 人工 |
| B2 | 路由 | `/af` 新需求 + 你定 | **P0** | gate req-confirm |
| B3 | 路由 | `/af` 须问谁定 | **P0** | 人工 |
| B4 | 路由 | `/af-req` 须问 | P1 | 人工 |
| B5 | 路由 | 启动卡选 AI（接 B3/B4） | 链接 | 人工 |
| B6 | 路由 | `/af-req` + 你定 | **P0** | gate req-confirm |
| B7 | 路由 | write-code 红 | P1 | gate write-code |
| B8 | 路由 | 显式门牌优先 | **P0** | 人工 |
| B9 | 路由 | 空 `/af` 续进度 | P1 | 人工 |
| B10 | 路由 | 探索（经 `/af`） | P1 | 人工 |
| B11 | 路由 | 多意图拆分 | P1 | 人工 |
| B12 | 路由 | 显式 `/af-explore` | P1 | 人工 |
| B13 | 路由 | `/af 继续` | P2 | 人工 |
| E1 | 行为 | `/af-fix` 真修 | **P0** | 人工 + score AF_COMMANDS |
| E2 | 行为 | `/af-refactor` | P2 | 人工 |
| E3 | 行为 | `/af-tweak` | P2 | 人工 |
| E4 | 行为 | `/af-perf` | P2 | 人工 |
| E5 | 行为 | `/af-chore` | P2 | 人工 |
| E6 | 行为 | `/af-ut` | P2 | 人工 |
| E7 | 行为 | `/af-revise` 同步 | **P0** | 人工 |
| E8 | 行为 | `/af-init` | P1 | gate init-confirm |
| E9 | 行为 | `/af-mod` | P1 | gate mod-confirm |
| E10 | 行为 | `/af-sol` | P1 | gate sol-confirm |
| E11 | 行为 | `/af-dev` | P1 | gate write-code |
| E12 | 行为 | `/af-test` | P1 | gate test-entry |
| E13 | 行为 | fix 越界升级 | **P0** | 人工 |
| E14 | 行为 | `/af-model` alias | P2 | 人工 |
| E15 | 行为 | `/af-tests` alias | P2 | gate test-entry |
| E16 | 行为 | af-commands 留痕 | **P0** | score AF_COMMANDS（全栈默认；快捷加 `--check-af-commands`） |
| E17 | 行为 | mod skip | P1 | prepare model-skip + score |
| F1 | CLI | 自定义步 + update | **P0** | 终端 |
| F2 | CLI | 自定义步执行 | **P0** | 人工 |
| F3 | CLI | skip 短路 | P1 | gate |
| F4 | CLI | 保留字 | P2 | gate |
| F5 | CLI | 多宿主 init | P2 | 终端 |
| C1 | 编排 | custom-flow | P1 | prepare + score |
| C2 | 编排 | parallel-flow | P1 | prepare + score |
| D1 | 全栈 | ai 自治 | 发版 | prepare + score |
| D2 | 全栈 | user 答卡 | 发版 | prepare + score |
| G1 | 决策 | 中途 AI 接管 | P1 | 人工 |
| G2 | 决策 | 重选决策权 | P2 | 人工 |
| G3 | 决策 | user 并行卡 | P2 | 人工 |
| G4 | 决策 | 栈 pending 卡 | P2 | 人工 |
| H1 | 纠偏 | L0 设计调整 | P2 | 人工 |
| H2 | 纠偏 | L1 轻量回溯 | P2 | 人工 |
| H3 | 纠偏 | L2 REQ 变更 | P1 | prepare change-l2 + score |
| R1 | Runtime v2 | 正常 Run + PASS | **P0-runtime** | `test:runtime` + 终端 |
| R2 | Runtime v2 | 产物修改后失效 | **P0-runtime** | `test:runtime` |
| R3 | Runtime v2 | 最新 FAIL 覆盖 PASS | **P0-runtime** | `test:runtime` |
| R4 | Runtime v2 | flow 变更后失效 | P1-runtime | `test:runtime` |
| R5 | Runtime v2 | rewind attempt 隔离 | **P0-runtime** | `test:runtime` |
| R6 | Runtime v2 | 新 Run 隔离 | **P0-runtime** | `test:runtime` |
| R7 | Runtime v2 | scan 幂等 + 路径安全 | P1-runtime | `test:runtime` |
| R8 | Validator | JSON 输出纯净 | P1-runtime | `test:validate` |
| R9 | Validator | 非法 `--only` 拒绝 | P1-runtime | `test:validate` |
| R10 | Runtime v2 | rewind 禁止向前跳 | **P0-runtime** | `test:runtime` |
| R11 | Runtime v2 | force 必须带 reason | **P0-runtime** | `test:runtime` / step-sync |

**P0 最低集（任何改动）**：A1～A3 + B1、B2、B3、B6、B8 + E1、E7、E13、**E16** + F1、F2

**改 Runtime / gate / step-sync 追加**：R1～R6、**R10、R11**；改 artifact 加 R7；改 validator CLI 加 R8、R9。

**发版全栈（D1/D2）额外硬检**：`score.mjs` 默认含 **AF_COMMANDS**（逐个已走阶段的显式成功门牌）与 **RUNTIME_RUN / RUNTIME_LINEAGE / RUNTIME_PROOFS**；零 Runtime 不得过关。闸门侧另有 `AF-CMD-*`。

---

## 复测铁律：红了必须治本（先改 AgileFlow，再重跑场景）

> **禁止**把 score 红、Runtime 红只归因于「Agent 笨 / 截断 / 再跑一遍」。  
> **必须**：读 `events.jsonl` / 回执 / env → 判断是 **产品洞** 还是 **执行偏差** → 产品洞先改代码+单测+手册，再重测。

### 处置流程（强制）

```text
1. 复现：保留工作区，记下 score 红项与 gate-status reason
2. 取证：atlas/runs/<runId>/events.jsonl、receipts.jsonl、run.json.steps、artifacts.json
3. 归类：
   - 产品洞 = API/规则允许了错误状态（须改 skills/agileflow 代码）
   - 执行偏差 = Agent 违规但系统已正确拒绝（补 L0/orch 文案即可）
   - 夹具问题 = 复测脚手架写错（改 prepare/score，不算产品回归）
4. 治本：改代码 → npm run test:runtime（或相关单测）→ 本手册补场景/踩坑表
5. 再跑原场景 score；不得只靠「人工 rewind 救场」宣称通过
```

### 2026-07-24 全量复测 · 根因案（已治本）

| 现象（治标表象） | 具体原因（治本） | 错误处置 | 正确处置（已做） |
|------------------|------------------|----------|------------------|
| D1 `RUNTIME_LINEAGE` 缺 af-req/mod/sol；`steps` 全是 `ready` | **`run rewind` 曾允许跳到更后面的步**。实盘 events 出现 `rewound … to af-mod`，reason=`逐闸修复：进入 af-mod`——用 rewind 当前进，冲掉 `passed` 血缘 | 让 Agent 再 rewind/advance「重建血缘」 | **API 拒绝向前 rewind**（R10）；orch/L0/TROUBLESHOOTING 写明前进只能 advance |
| C1 曾 `advance` `forced:true` | `step sync --force` / advance force **可不写原因**，弱模型滥用跳过回执 | 忽略 | **force 必须 `--reason`，写入 events**（R11） |
| C1 `dev-complete:input-stale` | todo/登记集在 PASS 后变更，未重扫重闸就 `complete`；**检测正确** | 只改文档装绿 | 保持硬检；dirty → scan → 重闸；必要时 **合法 rewind 回当前或更早步** 再前进 |
| H3 默认 score 假红 | `change-l2` 走 `/af-revise`，score 却按 flow 台账验留痕 | 手工加 `--check-af-commands` | **spot 场景默认按快捷门牌验**（`score.mjs`） |
| D1 `DEV-AC-UNIT` | BE AC 映射未写 `src/test/`（规则已支持） | — | 执行层补路径；属规则生效，非洞 |

### 位移铁律（写入预期，R 区也验）

| 动作 | 合法 | 非法 |
|------|------|------|
| 前进 | `advance` / `step sync`（须当前步 Runtime PASS） | `rewind --to` 更后面的 stepId |
| 回退 | `rewind --to` **当前或更早** + `--reason` | 无 reason；或目标在当前步之后 |
| 跳过回执前进 | 禁止默认；仅 `--force --reason "…"` 且记 events | 裸 `--force` |

### 对「测了但没过」的记账要求

手册或 `RESULTS` 里凡写 FAIL/PARTIAL，必须带三列：**红项 · 根因归类 · 代码/文档是否已改**。禁止只写「Agent 跑中 / 未全绿」。

---

## 开测前（所有 Agent 场景通用）

```bash
SKILL=/Users/fangtong.nan/AgileFlow/skills/agileflow

# 1. 建空目录
mkdir -p ~/code/af-test-XXX && cd ~/code/af-test-XXX

# 2. 装 skill（本地开发用这个路径；已发布则 npx @agileflow/cli）
npx "$SKILL" init --root . --tools cursor --force

# 3. 开新 Agent Task，prompt 里写三行：
#    项目根 = 当前目录绝对路径
#    skill = 当前目录/.cursor/skills/agileflow
#    用户原话 = 下面某条的「话术」
```

**铁律**：可以告诉 skill 路径和落盘目录；**不要**教流程、闸门名、下一步点哪个。

辅助文件（可选）：
- 全栈 prompt 模板：`skills/agileflow/tools/agent-retest/PROMPT.ai.md`
- user 模式假用户：`skills/agileflow/tools/agent-retest/USER-SIM.prompt.md`
- prepare / score：`skills/agileflow/scripts/agent-retest/prepare.mjs`、`score.mjs`
- 场景映射：`skills/agileflow/tools/agent-retest/SCENARIOS.md`

---

## A · 静态（终端，不聊 Agent）

| 编号 | 怎么测 | 预期 | 自动化 |
|------|--------|------|--------|
| **A1** | `cd skills/agileflow && npm run test:validate` | 退出码 0 | 终端 |
| **A2** | `npm run test:cli` | 退出码 0；生成 `skills/af`、`skills/af-req` | 终端 |
| **A3** | `npm run test:docs` | 退出码 0 | 终端 |

改 skill **必跑 A1～A3**（P0）。

---

## B · 门牌路由冒烟（Agent，一条命令看反应）

**准备**：空目录已 `init`（见上）。**不要**做完整 App，做到「停点」就停。

### B1 · `/af` 修 bug → 快捷轨

**话术**
```text
/af 修一下登录按钮的 typo，最多改 3 个文件
```

**预期**
- 首行含 `路由：auto → …fix`（或 `af-fix`）+ `依据：…`
- **没有** `atlas/requirements/` 新 REQ
- **没有** `atlas/agileflow.env`（或其中无 `AF_STEP=af`）
- 不弹「选 req / fix / explore」菜单

**自动化**：人工

---

### B2 · `/af` 新需求 + 你定 → 需求轨

**话术**
```text
/af 做一个极简待办 REST API，只要 Java+Spring Boot，不要前端。什么都别问我你定
```

**停点**：`req-confirm` 闸门绿即可（不必继续 mod/dev）。

**预期**
- 首行含 `路由：auto → …req`
- **没有**启动卡
- `AF_DECIDE=ai`
- 有 REQ 文件；台账 `stepId=af-req` 且有真 `subagentId`
- **`atlas/logs/af-commands.md`** 有 `[/af-req]` 本步显式成功行；仅 `[/af]` 入口不够
- `agileflow gate --gate req-confirm --root .` → 退出码 0（含 **AF-CMD-*** 硬验）

**自动化**：`gate req-confirm`（连带 AF-CMD）

---

### B3 · `/af` 新需求、不说谁定 → 必须问

**话术**
```text
/af 做一个极简待办 REST API
```

**停点**：弹出启动卡并**停住**即可。

**预期**
- 首行含 `路由：auto`
- 出现「谁决策 / AI 全权 vs 我来决策」启动卡
- **本轮不写** REQ
- `AF_DECIDE` 未写成 `ai`（通常还没有 env 文件）

**自动化**：人工

---

### B4 · `/af-req` 不说谁定 → 必须问（同 B3，显式门牌）

**话术**
```text
/af-req 做一个极简待办 REST API
```

**预期**：同 **B3**（启动卡 + 停住 + 无 REQ）。

**自动化**：人工

---

### B5 · 选「AI 全权」之后（接 B3/B4）

**话术**（考官代用户回复）
```text
AI 全权 / 你定
```

**预期**
- `AF_DECIDE=ai`
- 继续做需求，**不再**弹启动卡

**自动化**：人工（链接场景，接 B3/B4）

---

### B6 · `/af-req` + 你定（核心冒烟）

**话术**
```text
/af-req 做一个极简待办 REST API。只要 Java+Spring Boot，不要前端。什么都别问我你定
```

**停点**：`req-confirm` 绿。

**预期**：同 **B2**（无启动卡、台账、闸门绿）。

**自动化**：`gate req-confirm`

---

### B7 · 上游不齐不许写码

**准备**：新 init 的空目录（无 sol/todo）。

**话术**（可选，也可只跑命令）
```text
/agileflow gate --gate write-code --root .
```

**预期**：闸门**红**（退出码非 0）。

**自动化**：`gate write-code` 非 0

---

### B8 · 显式门牌优先于 `/af` 自动路由

**话术**
```text
/af-req 做一个极简待办 REST API
```
（或 `/af /af-fix 修 typo`）

**预期**
- 按 **显式** `/af-req` 或 `/af-fix` 执行
- 不因 `/af` 再跑一遍 auto 路由

**自动化**：人工

---

### B9 · 空 `/af` 读进度继续

**准备**：同一目录里需求已做过、`AF_STEP` 指向 mod 或 sol。

**话术**
```text
/af
```

**预期**
- 读 atlas 进度 → **直接进**当前应做步
- 不弹模式菜单；不从头重做 req

**自动化**：人工

---

### B10 · 探索意图（经 `/af`）

**话术**
```text
/af 想优化性能但不知道瓶颈在哪
```

**预期**
- 自动路由 `af-explore`：用户要先调查再决策，尚未授权实施
- 只分析，并结构化呈现证据、核心不确定性、2～4 个方向、建议和路由预览
- **不写**正式 REQ、业务源码或探索文档

**自动化**：人工

---

### B10a · 听取意见（经 `/af`）

**话术**
```text
/af 订单认证继续用 session 还是换 JWT？先给点意见，不要改
```

**预期**
- 自动路由 `af-explore`
- 比较 2～4 个方向及其成本、风险和适用条件
- 默认只在聊天中结构化输出，不写 `atlas/logs/explore-*.md`

**自动化**：人工

---

### B10b · 不知道实现方式但已授权交付

**话术**
```text
/af 我要支持 OAuth 登录，直接帮我实现，我不知道代码怎么写
```

**预期**
- **不得**因“不知道代码怎么写”路由 `af-explore`
- 目标和实施授权已明确，进入正式 Flow 的当前应执行步

**自动化**：人工

---

### B11 · `/af` 多意图拆分

**话术**
```text
/af 加个退款功能，顺便修下登录按钮的 typo
```

**预期**
- 首行声明拆分（先 fix 小 → 再 req 大）
- 不混在一起做

**自动化**：人工

---

### B12 · 显式 `/af-explore`

**话术**
```text
/af-explore 分析订单模块的耦合度和拆分方案
```

**预期**
- 首行含 `explore` 模式（或等价探索声明）
- 只读分析 + 结构化方向选项；**不写**正式 REQ、业务源码或探索文档
- 行为同 **B10**，但走显式门牌而非 auto 路由

**自动化**：人工

---

### B13 · `/af 继续` / `/af 下一步`

**准备**：同一目录 req 已确认（`req-confirm` 绿），`AF_STEP` 仍指向 `af-req` 或应进 mod/sol。

**话术**
```text
/af 继续
```

**预期**
- 读 atlas 进度 → **进 mod 或 sol**（下一 flow 步）
- **不**从头重做 req；不弹模式菜单

**自动化**：人工

---

**改 `/af` 最低 Agent 集（P0）**：**B1、B2、B3、B6、B8**。

---

## E · 指令行为覆盖（每条指令真的做到了）

> **与 B 区的区别**：B 测「路由对不对」，E 测「**执行结果对不对**」。
> **准备**：需要一个有业务源码的目录（brownfield）。建议用 `examples/demo-order-page` 或自建一个含 3~5 个文件的小项目。

### E1 · `/af-fix` 真的修了

**准备**：项目里故意埋一个 typo / 逻辑错误。

**话术**
```text
/af-fix 订单金额计算少了一个分转元的除法
```

**预期**
- 首行 `📍 Agileflow | fix 模式 | …`
- **改了代码**（对应文件 diff 非空）
- 跑了编译/相关测试
- 收尾行 `✅ fix 完成：…`
- **没有**新 REQ / solution / env 变更
- `atlas/logs/af-commands.md` 有 fix 记录（见 **E16**）

**自动化**：人工；可与 **E16** 一并 `score --check-af-commands`

---

### E2 · `/af-refactor` 行为不变

**话术**
```text
/af-refactor 把 OrderService 里的 if-else 提成策略模式
```

**预期**
- 改了代码结构；**外部接口不变**
- 编译 + 已有测试绿
- 没加新依赖

**自动化**：人工

---

### E3 · `/af-tweak` 只动样式/文案

**话术**
```text
/af-tweak 把首页标题改成「订单管理中心」
```

**预期**
- 只改了文案/样式文件
- 无逻辑变更

**自动化**：人工

---

### E4 · `/af-perf` 性能优化

**话术**
```text
/af-perf 订单列表接口太慢，加个分页
```

**预期**
- 改了代码（加分页逻辑）
- 行为不变（原有查询仍正确）
- ≤3 文件

**自动化**：人工

---

### E5 · `/af-chore` 不动业务源码

**话术**
```text
/af-chore 升级 spring-boot 到 3.5.6
```

**预期**
- 只动 pom.xml / build.gradle / CI 配置
- **不动** `src/` 下业务代码

**自动化**：人工

---

### E6 · `/af-ut` 只动测试

**话术**
```text
/af-ut 给 OrderService.calcAmount 补单测
```

**预期**
- 新增/修改了测试文件
- **没动**业务源码
- 测试能跑绿

**自动化**：人工

---

### E7 · `/af-revise` 修订已有设计+代码同步

**准备**：已有确认的 REQ + solution + 部分代码。

**话术**
```text
/af-revise 退款接口从 POST /refund 改成 POST /order/{id}/refund
```

**预期**
- 更新了 solution 里的接口描述（已有文档）
- 同步改了代码
- 编译 + 测试绿
- **没有**新建 REQ / 新增 T

**自动化**：人工

---

### E8 · `/af-init` brownfield 渐进盘点

**准备**：有业务源码但无 `atlas/init/` 的目录。

**话术**
```text
/af-init 修复登录超时
```

**预期**
- 生成 `atlas/init/README.md` + `p0-business.md`
- README 写明 `盘点模式：local`、任务锚点、覆盖路径、未覆盖与升级依据
- 只扫描登录目标模块及直接 API/数据/测试，不扫描无关业务
- 发现真实跨模块调用时可升级 `dependencies`，并写明代码证据
- 只有 `/af-init full`、用户明确全仓盘点或仓库级高影响任务才允许 `full`
- 有写法锚点 `codebase/p1-*.md`（或 AskQuestion 问模式）
- `init-confirm` 闸门绿
- **不生成** REQ / solution
- **链接**：`init-confirm` 绿后 `/af` 应进 flow 第一步（通常 `af-req`），不重复 init
- 后续任务命中已确认覆盖时直接复用；落到未覆盖模块时只补一次 local

**自动化**：`gate init-confirm`

---

### E9 · `/af-mod` 建模落盘

**准备**：已有确认 REQ。

**话术**
```text
/af-mod 用户和订单的实体关系。什么都别问我你定
```

**预期**
- 生成 `atlas/model/` 目录（README + entities/）
- `mod-confirm` 闸门绿
- `AF_STEP` 进到 `af-sol`

**自动化**：`gate mod-confirm`

---

### E10 · `/af-sol` 方案+todo 落盘

**准备**：已有确认 REQ + model（或 model skip）。

**话术**
```text
/af-sol 设计订单模块。你定
```

**预期**
- 生成 `atlas/solution/features/F-*.md` + `architecture.md`
- **`atlas/todo.md`** 有 T 头（三段式 ①②③）
- `sol-confirm` 闸门绿

**自动化**：`gate sol-confirm`

---

### E11 · `/af-dev` 开发一个 T

**准备**：已有确认 solution + todo 有 T 头。

**话术**
```text
/af-dev。你定
```

**预期**
- 生成 `atlas/dev/T-*.md`（构思）
- **写了业务源码**
- `write-code` 闸门绿
- 有可运行证据（编译/启动/冒烟）

**自动化**：`gate write-code`

---

### E12 · `/af-test` 验收

**准备**：开发已完成（todo 全 ✅）。

**话术**
```text
/af-test
```

**预期**
- 生成 `atlas/tests/README.md` + 验收报告
- `test-entry` 闸门绿
- 状态为 PASS 或 BLOCKED-HUMAN

**自动化**：`gate test-entry`

---

### E13 · 快捷越界 → 自动升级

**话术**
```text
/af-fix 把整个支付模块从支付宝换成微信支付
```

**预期**
- 首行声明升级：`fix → 升级完整流程 | 原因：…`
- **不**直接改代码
- 引导进 `/af-req` 或完整轨

**类推**：`/af-refactor 把支付渠道从支付宝全量换成微信支付` → 同样应升级完整流程，不直接改码。

**自动化**：人工

---

### E14 · `/af-model` alias

**准备**：同 **E9**（已有确认 REQ）。

**话术**
```text
/af-model 用户和订单的实体关系。什么都别问我你定
```

**预期**
- 行为同 **E9**
- 台账 `stepId=af-mod`（不是 af-model）
- `mod-confirm` 闸门绿

**自动化**：`gate mod-confirm`

---

### E15 · `/af-tests` alias

**准备**：同 **E12**（开发已完成）。

**话术**
```text
/af-tests
```

**预期**
- 行为同 **E12**（产物进 `atlas/tests/`）
- 台账 `stepId=af-test`
- `test-entry` 闸门绿

**自动化**：`gate test-entry`

---

### E16 · af-commands 留痕（快捷 + 主链）

> 靠自觉必漏 → CLI `agileflow log` + 闸门 `AF-CMD-*` + score `AF_COMMANDS` 三道。

**准备 A（快捷）**：跑完 **E1**（或任意 `/af-fix`…）的同一目录。

**检查**
```bash
# 推荐写入方式（Agent 应收尾执行）
npx @agileflow/cli log --door /af-fix --summary 修登录typo --route fix --root .

grep -E '\[/af' atlas/logs/af-commands.md
node "$SKILL/scripts/agent-retest/score.mjs" --root . --mode ai --check-af-commands
```

**预期（快捷）**
- `atlas/logs/af-commands.md` 存在
- 至少一行合法格式：`[门牌][摘要≤15字][YYYY-MM-DD][→路由][状态]`
- 含快捷门牌（`/af-fix` / `/af-revise` …）

**准备 B（主链 / 全栈）**：跑完 **B2** 或 **D1** 的同一目录。

**预期（主链）**
- 每个已走阶段都有对应 `[/af-req]`/`[/af-sol]`/`[/af-dev]`… 的显式 `✅` 行；裸 `[/af]`、自动补写、空 `logs/` **均不算**
- 对应 confirm / `write-code` / `test-entry` 闸门不过 `AF-CMD-MISSING|EMPTY|NO-STEP`
- **D1/D2**：`score.mjs` **默认**打 `AF_COMMANDS`（不必再传 `--check-af-commands`）

**自动化**：全栈 `score.mjs`；快捷另加 `--check-af-commands`；闸门 `AF-CMD-*`

---

### E17 · mod skip（orch criteria）

**准备**（可选种子）：
```bash
mkdir -p ~/code/af-test-model-skip && cd ~/code/af-test-model-skip
npx "$SKILL" init --root . --tools cursor --force
node "$SKILL/scripts/agent-retest/prepare.mjs" --skill-root "$SKILL" --work-root . --mode ai --scenario model-skip
```

**话术**
```text
/af-req 做一个极简待办 CRUD API，只有 Todo 一张表，无用户系统无状态机。什么都别问我你定
```
（req 确认后继续，或 prepare prompt 含全流程）

**停点**：过 mod 判定后。

**预期**
- `atlas/flow.yaml` 中 `af-mod` 有 `skip: true` + `reason`
- 不生成 `atlas/model/README.md` stub；skip 证明只写在 flow 的 `skip: true + reason`；`mod-confirm` 绿
- `AF_STEP` 进到 `af-sol`

**自动化**：`prepare --scenario model-skip` + `score.mjs`（MODEL_SKIP 检查）

---

**改快捷指令最低集（P0）**：**E1、E7、E13**。

---

## F · CLI 管线（flow.yaml → skill 刷新 → 引用）

> **核心场景**：自定义步能被加进 flow → 刷新成 skill → 作为阶段被 Agent 执行。

### F1 · 自定义步加入 + 刷新

**终端操作**（不需要 Agent）：

```bash
cd ~/code/af-test-XXX

# 1. 在 atlas/flow.yaml 的 steps 最前面插入：
#    - id: af-research
#      mode: strict
#      prompt: null
#      depends: []
#      outputs:
#        - atlas/logs/research-*.md
#      reason: "先调研再写需求"

# 2. 刷新门牌 skill
npx @agileflow/cli update --step-skills-only --root .
# 或：node "$SKILL/bin/agileflow.mjs" update --step-skills-only --root .
```

**预期**
- `.cursor/skills/af-research/SKILL.md` 被生成
- 其 description 含 `af-research`
- 原有 `af-req`/`af-dev` 等 skill 不受影响

**自动化**：终端

---

### F2 · 自定义步能被 `/af-research` 触发

**话术**（新 Agent Task）
```text
/af-research 调研市面上主流的待办清单 App 的核心功能
```

**预期**
- Agent 识别为 flow 步（不是快捷/探索）
- 产物写入 `atlas/logs/research-*.md`
- 台账 `stepId=af-research`
- 做完后 `AF_STEP` 进到下一步（`af-req`）

**自动化**：人工

---

### F3 · 自定义步 skip + 闸门短路

**终端操作**：在 flow.yaml 的 `af-research` 步加 `skip: true` + `reason: 不需要调研`。

**话术**
```text
/af 做一个待办 API。你定
```

**预期**
- 跳过 research 直接进 req
- 不报「缺 research 产物」错误

**自动化**：gate 不红

---

### F4 · 保留字不可占用

**终端操作**：尝试在 flow.yaml 加 `id: af-fix`。

```bash
npx @agileflow/cli gate --root .
```

**预期**：报错 `FLOW-ID-RESERVED`（退出码非 0）。

**自动化**：终端

---

### F5 · 多宿主 init

**终端操作**：
```bash
mkdir -p ~/code/af-test-multi && cd ~/code/af-test-multi
npx "$SKILL" init --root . --tools cursor,claude,codex --force
```

**预期**
- `.cursor/skills/af-req/SKILL.md` 存在
- `.claude/skills/af-req/SKILL.md` 存在
- `.agents/skills/af-dev/SKILL.md` 存在（codex）
- `atlas/agileflow-cli.json` 存在

**自动化**：终端（A2 已部分覆盖；改 adapter 时单列回归）

---

**改 CLI / flow 最低集（P0）**：**F1、F2**。

---

## R · Runtime v2 状态、产物与回执

> 原有 A/B/E/F 继续验证 Agent 行为和旧项目兼容；本区验证 Run 下的“当前证据”。
> 只有从未建立 `atlas/state/current.json` 的项目才走 legacy 模式；一旦有 current Run（含 completed/abandoned），MD PASS 不再回退为权威。

### 共用准备

复用 **B2/B6 已产出 REQ 的项目**，但须在执行 req 闸门前启动 Run：

```bash
AFCLI="$SKILL/bin/agileflow.mjs"
node "$AFCLI" run start --change runtime-retest --step af-req --root .
# Agent 完成 req 产物后：
node "$AFCLI" artifact scan --root .
node "$AFCLI" gate --gate req-confirm --root .
```

快速自动回归：

```bash
cd "$SKILL"
npm run test:runtime
```

### R1 · 正常 Run 只接受当前 PASS

**检查**

```bash
node "$AFCLI" run status --json --root .
node "$AFCLI" run gate-status --gate req-confirm --json --root .
```

**预期**
- `status` 可被 JSON 解析，`active=true`、`currentStep=["af-req"]`
- `gate-status` 退出码 0，`valid=true`、`reason="pass"`
- `atlas/runs/<runId>/` 下有 `run.json`、`artifacts.json`、`receipts.jsonl`

**自动化**：`npm run test:runtime`

---

### R2 · PASS 后修改产物必须失效

**操作**：在 R1 后修改已登记的 REQ 文件，再检查：

```bash
node "$AFCLI" run gate-status --gate req-confirm --json --root .
```

**预期**：退出码非 0，`valid=false`、`reason="artifact-registry-dirty"`；旧 PASS 不可继续用，也不能只重跑 gate 洗白。

**恢复**：重新 `artifact scan`，再跑 `gate req-confirm`，状态恢复为 `pass`。

**自动化**：`npm run test:runtime`

---

### R3 · 最新 FAIL 覆盖历史 PASS

**操作**：R1 PASS 后制造一次真实闸门失败（例如暂时移走必需的 REQ，跑一次 `req-confirm`，随后恢复文件），再查 `gate-status`。

**预期**
- 闸门失败退出码非 0
- 即使历史上有 PASS，当前状态仍为 `reason="latest-not-pass"`
- 修复文件本身不会复活旧 PASS；必须重新执行闸门

**自动化**：`npm run test:runtime`；legacy 同类断言在 `test-gate-receipts.mjs`

---

### R4 · flow.yaml 修改后 PASS 必须失效

**操作**：R1 后修改 `atlas/flow.yaml`（即使只加注释），再查 `gate-status`。

**预期**：退出码非 0，`reason="flow-stale"`；放弃旧 Run 并启动新 Run 后才能接受新 flow。

**恢复**

```bash
node "$AFCLI" run abandon --reason "flow 已变更" --root .
node "$AFCLI" run start --change runtime-retest-v2 --step af-req --root .
```

**自动化**：`npm run test:runtime`

---

### R5 · rewind 增加 attempt，旧回执不能复用

**操作**（合法回退：当前已在更后步时）

```bash
node "$AFCLI" run rewind --to af-req --reason "需求变化复测" --root .
node "$AFCLI" run gate-status --gate req-confirm --json --root .
```

**预期**
- `af-req.attempt` 从 1 变为 2
- 旧回执变为 `reason="attempt-mismatch"`
- 当前 attempt 重新登记产物、重跑闸门后才能 PASS
- 受影响 artifact 标 `invalidated`

**自动化**：`npm run test:runtime`

---

### R10 · rewind 禁止向前跳（治本：血缘不被冲掉）

> 2026-07-24 D1 实盘：Agent 用 `rewind --to af-mod`「进入下一步」→ steps 全 `ready` → `RUNTIME_LINEAGE` 红。根因是 API 曾允许向前 rewind。

**前置**：Run 停在 `af-req`（尚未前进）。

```bash
node "$AFCLI" run rewind --to af-sol --reason "错误地想前进" --root .
```

**预期**
- 退出码非 0
- 报错含「只能回到当前步或更早」或「前进请用 advance」
- `run.json` 的 `currentStep` 仍为 `af-req`，**不得**变成 `af-sol`

**自动化**：`npm run test:runtime`（`rewind rejects forward jumps`）

---

### R11 · force 前进必须带 reason

```bash
# 有 active Run 且缺回执时：
node "$AFCLI" step sync --force --root .          # 须失败：缺 reason
node "$AFCLI" step sync --force --reason "紧急对齐排障" --root .
```

**预期**
- 无 `--reason`：非 0，提示必须提供 reason
- 有 `--reason`：允许强制前进，且 `events.jsonl` 中 `step.advanced` 含 `forced:true` 与 `reason`

**自动化**：`npm run test:runtime` / 手工终端；改 step-sync 时必跑

---

### R6 · 新 Run 不继承旧 Run 回执

**操作**：走到 flow 最终启用步，保证此前所有启用步均 passed 且最终步 Runtime 闸门有效，再完成 Run；随后为另一个 change 启动新 Run。

```bash
node "$AFCLI" run complete --root .
node "$AFCLI" run start --change runtime-retest-next --step af-req --root .
node "$AFCLI" run gate-status --gate req-confirm --json --root .
```

**预期**：新 Run 的 `runId` 不同，`gate-status` 为 `reason="missing-receipt"`。

**自动化**：`npm run test:runtime`

---

### R7 · artifact scan 幂等且不可越出项目根

**操作**

```bash
node "$AFCLI" artifact scan --json --root .
node "$AFCLI" artifact scan --json --root .
node "$AFCLI" artifact record ../outside.txt --root .
```

**预期**
- 同一文件内容连续 scan 不增加 revision
- 文件内容变化后再 scan 才产生新 revision，旧 revision 标为 `superseded`
- `../outside.txt` 被拒绝，且项目外没有写入

**自动化**：`npm run test:runtime`

---

### R8 · `--json` stdout 必须是纯 JSON

**检查**

```bash
node "$AFCLI" gate --root . --only todo --json | node -e \
  "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>JSON.parse(s))"
```

**预期**：解析命令退出码 0；stdout 前后没有标题、提示或日志文本；validator 不修改 AF command log 或任何回执。由 `agileflow gate` wrapper 在校验结束后按最终状态写唯一适用的回执。

**自动化**：`npm run test:validate`

---

### R9 · 非法 `--only` 必须显式失败

**检查**

```bash
node "$AFCLI" gate --root . --only typo-module --json
```

**预期**：退出码非 0，结果包含 `ARG-ONLY-UNKNOWN`；不能静默跳过全部校验后返回成功。

**自动化**：`npm run test:validate`

---

**Runtime 判定原则**：有 current Run 时只认同一 `runId + step attempt + flow digest + 该步 artifact input digest` 的最新 PASS；只有无 current Run 的旧项目才兼容 legacy MD。后续步骤新增产物不得误伤前序 **step-scoped** 证明；已登记产物 dirty / inputDigest 变化 → 当前证明失效。**位移**：前进=advance；回退=rewind（禁向前）；见 R10/R11 与文首「治本」节。

---

## C · 编排（custom-flow / parallel-flow）

先 prepare，再把打印的全文原样给被试：

```bash
SKILL=/Users/fangtong.nan/AgileFlow/skills/agileflow
WORK=~/code/af-test-orchestration-$(date +%Y%m%d)
mkdir -p "$WORK"

# 自定义 flow（含 research、ux-spike…）
node "$SKILL/scripts/agent-retest/prepare.mjs" --skill-root "$SKILL" --work-root "$WORK" --mode ai --scenario custom-flow

# 或并行波（research + competitor 同波）
node "$SKILL/scripts/agent-retest/prepare.mjs" --skill-root "$SKILL" --work-root "$WORK" --mode ai --scenario parallel-flow
```

### C1 · 自定义 flow，不教步名也会走

**话术**：用 prepare 打印的**整段** prompt（不要自己加「先做 research」）。

**预期**（与 `score.mjs` custom-flow 检查对齐）：
- `atlas/logs/research-water.md` 存在，且**修改时间不晚于**第一份 REQ
- `atlas/logs/ux-spike.md` 已落盘
- `af-preflight` 在 flow 中 skip **或** 有 `atlas/logs/preflight.md`
- `af-mod` 在 flow 中 skip **或** 有 `atlas/model/README.md`
- 台账含 `stepId=af-research` 与 `af-ux-spike`
- flow 里其他自定义步有产物 / 台账

**自动化**：`prepare --scenario custom-flow` + `score.mjs`

---

### C2 · 并行波，门牌切入整波

**话术**：parallel-flow 的 prepare prompt（含 `/af-research`）。

**预期**
- 同波做完 `af-research` **和** `af-competitor`（不是只做 research 就停）
- `research-water.md` + `competitor-water.md` 均已落盘
- dispatch 里两步都有记录
- `atlas/runs/<runId>/events.jsonl` 有同一条 `step.advanced.to` 同时包含两步；两个文件分别存在不等于并行

**自动化**：`prepare --scenario parallel-flow` + `score.mjs`

---

收场：
```bash
node "$SKILL/scripts/agent-retest/score.mjs" --root "$WORK" --skill-root "$SKILL" --mode ai --continues 0
```
退出码 0 = 过关。

---

## D · 全栈端到端

```bash
node "$SKILL/scripts/agent-retest/prepare.mjs" --skill-root "$SKILL" --work-root "$WORK" --mode ai
# 或 --mode user（须另开 USER-SIM.prompt.md 答卡）
```

### D1 · 你定（ai）全栈

**话术**（prepare 默认，大意如下）
```text
/af 做一个减肥小程序
java21 springboot3.5.5 taro4 +react +vite
什么都别问我 你定
落到 WORK，一直做到开发完毕
```

**预期**
- 尽量自治到 dev/验收；闸门绿了连做
- 中途等人说「继续」= **失败**（记 continues）
- 每步收尾有 **`agileflow log`**；`atlas/logs/af-commands.md` 含逐步阶段门牌，裸 `/af` 不够
- 必须实际建立 Run、登记 artifact、提交 Runtime 回执；只跑 validator 或只留 legacy MD 不算
- `score.mjs --mode ai --continues 0` 退出码 0；ai 模式不显式传 `--continues` 也判失败

**自动化**：prepare + score（默认硬检留痕）

---

### D2 · 我来决策（user）全栈

**话术**：prepare `--mode user` 打印的全文（含「我来决策」，**不要**写别问我）。

**预期**
- 该问就停；user-sim 答完能续上
- 同样须 **af-commands 留痕**（`AF_COMMANDS`）
- 同样须有当前 Run 与逐步 Runtime 证明
- `score.mjs --mode user` 退出码 0

**自动化**：prepare + score + USER-SIM

---

## G · 决策契约（AF_DECIDE 停点）

### G1 · 中途 AI 接管

**准备**：`AF_DECIDE=user` 或 pending，req 阶段进行中。

**话术**（考官代用户，在 req 中途插入）
```text
后面都你定 / 不想看了 / 剩下你来
```

**预期**
- `AF_DECIDE=ai`
- 后续阶段**不再**弹启动卡
- 仍须过各步闸门

**自动化**：人工

---

### G2 · 重选决策权

**准备**：已有 `AF_DECIDE=ai` 或 `user` 的项目。

**话术**
```text
重选决策权 / 重开启动卡
```

**预期**
- `AF_DECIDE=pending`
- 再弹启动卡并**停住**
- 禁止让用户手改 env

**自动化**：人工

---

### G3 · user 并行卡

**准备**：brownfield；`AF_DECIDE=user`；solution + todo 有 ≥2 个可并行 T。

**话术**
```text
/af-dev
```

**预期**
- 出现**并行启动卡**（候选 ≥2）
- 用户选择后同批 dev（≤3）
- ai 模式**不问**并行卡（对照 **D1**）

**自动化**：人工 + USER-SIM

---

### G4 · 栈 pending 卡

**准备**：`AF_DECIDE=user`；REQ 已确认；栈未写入 env。

**话术**
```text
/af-sol 设计订单模块
```

**停点**：技术栈卡。

**预期**
- 出现技术栈确认卡
- **architecture 落盘前**不停在方案确认
- 落盘后再过 `sol-confirm`

**自动化**：人工 + USER-SIM

---

## H · 纠偏变更（change-management）

### H1 · L0 dev 设计调整

**准备**：dev 进行中，实现细节需改、AC 不变。

**话术**
```text
/dev 里发现排序算法要换成稳定排序，AC 不变
```

**预期**
- 首行 `纠偏：L0`（或等价）
- dev 文件有 `## 设计调整` ≤5 行
- **不**升 L2；**不**先改 REQ

**自动化**：人工

---

### H2 · L1 轻量回溯

**准备**：dev 中发现 sol 需小改（加字段/调参数），AC 不变。

**话术**
```text
/dev 里发现要在 sol 里给 Order 加一个 remark 字段，AC 不变
```

**预期**
- 首行 `纠偏：L1`（或轻量反馈回路）
- 有「待回溯」标记；**不**跑完整 5 步变更
- ③ 前最小同步 sol

**自动化**：人工

---

### H3 · L2 REQ 变更

**准备**（可选种子）：
```bash
mkdir -p ~/code/af-test-change && cd ~/code/af-test-change
npx "$SKILL" init --root . --tools cursor --force
node "$SKILL/scripts/agent-retest/prepare.mjs" --skill-root "$SKILL" --work-root . --mode ai --scenario change-l2
```

**话术**
```text
/af-revise 把 REQ-001 的 AC-2 从「支持微信退款」改成「支持微信和支付宝退款」。我来决策
```
（或 prepare change-l2 打印的全文）

**停点**：影响分析卡。

**预期**
- 首行 `纠偏：L2`（或等价）
- AC-001-01 本行精确包含“微信 + 支付宝”，solution 同步双渠道
- **先**更新已确认 REQ，**再**改 solution/代码
- `atlas/README.md` 含纠偏行与影响分析记录
- 不跳过影响分析直接改码
- `AF_DECIDE` 必须与 prepare 的 `--mode` 一致，不能由第三处规则擅自改权

**自动化**：`prepare --scenario change-l2` + `score.mjs`（CHANGE_L2 检查）

---

## 对 Agent 下命令（复制即用）

```text
按 AGENT-RETEST.md 跑 B2
```

```text
按 AGENT-RETEST.md P0 最低集：A1～A3 + B1/B2/B3/B6/B8 + E1/E7/E13 + F1/F2
```

```text
按 AGENT-RETEST.md 指令覆盖：E1 + E7 + E13 + E16
```

```text
按 AGENT-RETEST.md CLI 管线：F1 + F2
```

```text
按 AGENT-RETEST.md 决策契约：G1
```

```text
按 AGENT-RETEST.md 纠偏：H3
```

```text
按 AGENT-RETEST.md Runtime：R1～R7 + R10 + R11（治本位移）
```

---

## 改 skill 后推荐顺序（P0 / P1 / P2）

### P0 · 任何改动必跑

A1～A3 · B1、B2、B3、B6、B8 · E1、E7、E13、**E16** · F1、F2

### P1 · 按改动类型追加

| 改了什么 | 追加场景 |
|----------|----------|
| 路由 / `/af` / 门牌 | B9～B13、B10、B12 |
| 快捷指令 | E16（加 `--check-af-commands`）；E2～E6 抽 1 条 |
| flow 阶段 / 闸门 / 留痕 | E9～E12、E16、E17；发版跑 **D1** |
| alias / 门牌生成 | E14、E15、F5 |
| CLI / flow.yaml | F3、F4 |
| 决策 / contract | G1；动 user 路径加 D2、G3、G4 |
| 纠偏 / change | H3 |
| 编排 / 并行 | C1 或 C2 |
| init / brownfield | E8（含 init→req 链） |
| Runtime / gate / step-sync | R1～R6、**R10、R11** |
| artifact registry | R2、R7 |
| validator CLI / JSON / `--only` | R8、R9 |
| 复测红项归因 | **先读文首「治本」节**；产品洞改代码后再重测 |

### P2 · 有余力 / 发版前全集

B12、B13 · E2～E6、E14、E15 · F5 · G2～G4 · H1、H2 · R7～R9 · **D1 + D2**

---

## 场景覆盖矩阵（速查）

| 指令 | 路由测试 | 行为测试 | 边界/升级 | 决策/纠偏 |
|------|----------|----------|----------|----------|
| `/af`（auto） | B1～B3、B8、B9、B11、B13 | **E16**（主链留痕） | — | G1 |
| `/af-fix` | B1 | **E1、E16** | **E13** | — |
| `/af-refactor` | — | **E2** | E13 类推 | — |
| `/af-tweak` | — | **E3** | — | — |
| `/af-perf` | — | **E4** | — | — |
| `/af-chore` | — | **E5** | — | — |
| `/af-ut` | — | **E6** | — | — |
| `/af-revise` | — | **E7** | E13 类推 | H3 |
| `/af-init` | — | **E8** | init→req 链 | — |
| `/af-explore` | B10、**B12** | — | — | — |
| `/af-req` | B2～B6 | E9 前置 | — | G1、G4 |
| `/af-mod` | — | **E9、E17** | — | H2 |
| `/af-model` | — | **E14** | — | — |
| `/af-sol` | — | **E10** | — | G4 |
| `/af-dev` | — | **E11** | B7 | G3、H1 |
| `/af-test` | — | **E12** | — | — |
| `/af-tests` | — | **E15** | — | — |
| 自定义步 | F2 | C1 | F3、F4 | — |
| 决策契约 | B3～B5 | D2 | — | **G1～G4** |
| 纠偏 | — | — | — | **H1～H3** |
| Runtime v2 | — | R1、R6、**R10** | R2～R5、R7、**R11** | R8、R9 |

静态全绿 **不能**代替 B/E/F/G/H；Agent 说做完了 **不能**代替闸门 / score。
