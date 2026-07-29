# 阶段 0：项目盘点（init — 仅 brownfield）

> 文档模板：[templates/init.md](../templates/init.md)
> 扫描与验收：[templates/init.md](../templates/init.md)
> 路由入口：[00-intent-routing.md](00-intent-routing.md#agent-摘要)

<a id="agent-摘要"></a>

## Agent 摘要

**入口**：`/af-init [local|dependencies|full] [任务/模块]`，或 brownfield 首次接手。
greenfield **跳过**本阶段。

**目标**：围绕当前交付所需范围做 as-is 盘点 → `atlas/init/`；默认从任务相关
模块开始，只在证据表明跨模块或仓库级风险时扩大。

| 模式 | 默认触发 | 扫描边界 |
|------|----------|----------|
| `local`（默认） | 目标明确的新交付或维护任务 | 目标模块、入口文件、直接数据/API/测试 |
| `dependencies` | 局部扫描发现真实跨模块调用或共享契约 | local + 直接上下游模块 |
| `full` | 用户明确要求；或确认属于仓库级高影响变更 | 全仓 P0，按需 P1/P2 |

**无任务锚点**：不得静默全扫；只问一个问题，让用户给任务/模块，或明确选择
`full`。已有已确认覆盖且包含本次目标 → 直接复用，不重复 init。

**执行顺序**：
```
① brownfield 判定 → ①b 定范围 → ② 按范围扫描 → 必要时升级范围
→ ②b 写法锚点 → ③ 落盘覆盖元数据 → ④ 自检 → ⑤ 确认
```

**所有模式必建**：`README.md`、`p0-business.md`，但只描述已扫描范围；涉及 REST/
持久化时，只创建目标相关的 API、规则和数据文档，禁止为了凑完整而全仓扫描。

**写法锚点**：`AF_DECIDE=ai` → 模式 B 直接落盘；`user` 且无记录 → AskQuestion → 停。

**后置**：当前任务所需覆盖已确认 → 可 `/af-req` 或 brownfield 下
`/af-sol`/`/af-dev`。以后任务落到未覆盖模块时，再补一次局部/依赖扫描。

**首行**：`📍 Agileflow | af-init:{local|dependencies|full} | 锚点：{任务/模块} | 原因：{范围依据}`


## 本阶段做什么

对 **已有代码 / 可运行应用** 做与当前任务成比例的 **as-is 盘点**，落盘
`atlas/init/`。局部模式只回答当前任务所需的业务、规则、运行方式、API、模块、
数据和写法；不是默认生成全仓百科。

**分层阅读** → [init.md §盘点层模型](../templates/init.md#盘点层模型init-阅读导航--非测试层)

**不回答**：本次任务、AC、接口设计、改动决策（分别在 requirements / solution / dev）。

## 何时执行 / 何时跳过

| 执行 init ✅ | 跳过 init ❌ |
|--------------|--------------|
| **brownfield** 且本次目标不在已确认覆盖内 | **greenfield**：纯从零、新系统、空仓库脚手架、用户明确「不需要 init」 |
| `/af-init local|dependencies|full` | 仅 Skill/文档仓库且用户只做流程验证（可选 init，非强制） |
| 首次接触 brownfield 且有明确任务/模块 | 已确认 init 的覆盖路径包含本次目标 |
| `/af-init refresh …` 按指定范围刷新 | 纯答疑/review；符合边界的维护任务直接走快捷轨 |

**铁律**：greenfield 不创建 `atlas/init/`；brownfield 在进 `/af-dev`/`/af-sol`
前须有**覆盖本次目标**的已确认或进行中 init，不要求与本次任务无关的全仓盘点。

### 三级扫描选择

1. **默认 local**：用户给出具体任务、模块、目录、接口或错误位置。
2. **升级 dependencies**：读到真实跨模块调用、共享类型/契约、共同数据表、全局配置
   或目标模块无法单独解释；首行说明升级证据，不问用户。
3. **升级 full**：用户明确要求完整盘点；或 dependencies 已确认变更跨越仓库核心边界
   （如仓库级迁移、平台升级、中央权限/资金规则的全局改造）。不得仅因“仓库有代码”
   或“涉及登录模块”直接 full。
4. **禁止降级冒充**：选择 local 不是少读目标链路；目标模块的入口、直接调用、数据、
   测试和写法锚点仍须读清。

### 用户跳过 init 处理

brownfield 用户显式要求跳过时：

1. AskQuestion：「检测到已有代码库。跳过 init 可能导致写法锚点缺失。确认跳过？」
2. 用户确认 → 在 todo.md 标注 `init: 用户跳过（风险已知）`
3. 后续 dev 阶段写法锚点检查：无 init/code-patterns 时标注 `⚠️ 无写法锚点（init 被跳过）`，不阻塞但提示风险
4. **须 AskQuestion 确认并留痕**，不静默跳过

---

## 目录结构（按需创建，无则不建）

```
atlas/init/
├── README.md                 # 必有：业务沙盘（三大闭环）+ 30min 路线；技术入口 → LAYERS.md
├── LAYERS.md                 # 推荐：盘点层导航 + 按任务跳转
├── p0-business.md            # brownfield 必建：旅程、页面↔API、实体↔功能对照
├── p0-domain-math.md         # 推荐必建：领域计算公式/规则（补 业务↔数据断层）
├── p0-environment.md         # 有运行时/依赖
├── p0-integrations.md        # 有外部集成（OAuth/JWT/第三方 API/Mock）
├── p0-repository.md          # 有 git
├── p0-quickstart.md          # 可选：手把手 curl/联调（小白 onboarding）
├── p1-tech-stack.md
├── p1-architecture.md        # 模块一览 + 模块依赖图（mermaid）+ 跨模块调用表
├── p1-errors.md              # 有 REST：错误码 + 业务前置自检表
├── p1-testing.md             # 有集成测试：Ac* ↔ 模块 ↔ API 索引
├── codebase/                 # 写法锚点唯一位置（勿把 p1-* 散落在 init 根下）
│   └── p1-frontend.md / p1-backend.md  # 速查→资产索引靠前→§一~§五（见 code-conventions）
└── data/                     # 有持久化
    ├── README.md             # 场景→碰表清单（盘点·数据入口）
    ├── api-catalog.md        # 有 REST：已覆盖范围的 API 速查（盘点·接口）
    ├── schema-overview.md    # ER 图 + migration 演进
    ├── entities/             # ⭐ 业务用途 + 关键字段 + 碰表
    ├── relations/            # 联查路径；复杂场景独立文
    └── state-machines/       # 无状态机则不存在
```

命名与文内标签 → [init.md](../templates/init.md)。
术语 → 项目根 **`atlas/glossary.md`**（**勿**在 `init/` 再建 `glossary/`）。

---

## 执行流程

```
① brownfield 判定 → ①b 选择 local/dependencies/full → ② 按范围扫描
→ 证据触发时升级 → ②b 写法锚点 → ③ 按模板落盘 → ④ 自检 → ⑤ 确认
```

> **②b**：首次需要落 `codebase/` 且写法模式未记录 → AskQuestion（[init-askquestion](../templates/contract.md#init-写法锚点模式首次全量--落盘-codebase-前)）→ **停**；用户选定后下条再 ③。可跳过条件见下方「写法锚点」。

### ① brownfield 判定

命中 **任一** → brownfield；正式交付前须有覆盖本次目标的 init：

- 存在业务源码目录（如 `src/`、`apps/`、`server/`、`internal/` 等 **且含业务逻辑**）
- 存在 DB migration / DDL / ORM Entity / Prisma schema
- 存在可运行应用配置（`docker-compose`、`application.yml` + 主入口）
- 用户明确「已有项目」「接手」「二次开发」

命中 **全部** → greenfield，**跳过本阶段**：

- 用户明确：从零、新系统、脚手架、完整交付（无既有业务代码）
- 仓库无上述业务资产，仅将新建 atlas/ 与源码

**歧义** → AskQuestion：brownfield（须 init）/ greenfield（跳过 init）。

### ①b 盘点范围与复用

先读 `agileflow context --json` 的 `init`：

- `scope=full` 且已确认 → 全部任务可复用。
- `scope=local|dependencies` 且本次目标落在 `targets/coveredPaths` → 直接复用。
- 本次目标不在覆盖内 → 新一轮 `local` 增量扫描；保留已有内容，只扩覆盖元数据。
- `init` 缺失且用户目标明确 → `local`。
- `init` 缺失且没有目标 → 问任务/模块；用户明确“全仓盘点”才 `full`。

README 的 `## 覆盖范围（init）` 是累积登记表。每次 local/dependencies 扫描追加
一个 `### {任务锚点}` 记录，不覆盖旧记录；每条必须写可机读元数据：

```markdown
- 盘点模式：local | dependencies | full
- 任务锚点：{用户任务或目标模块}
- 覆盖路径：`src/auth`, `src/session`
- 未覆盖：{明确列出}
- 升级依据：无 | {从 local/dependencies 扩大的代码证据}
```

### ② 按范围扫描（范围内仍按固定顺序）

> `local` 只读目标模块和直接边界；`dependencies` 再读直接上下游；`full` 才按
> [init-scan-checklist 大仓分级 P0/P1/P2](../templates/init.md#大仓分级) 执行。
> 所有模式都是**范围内 P0 过即可确认**，不得把未扫描区域写成已覆盖。

| 顺序 | 读什么 | 提取什么 | 落盘 |
|------|--------|----------|------|
| 0 | 定任务锚点 + 写覆盖范围 | 用户目标 / 指定模块；full 才选全仓主路径 | `README` 覆盖范围块 |
| 1 | 目标相关 README/docs/REQ/路由/Entity/Enum | 范围内业务、旅程、术语、**实体↔功能** | **`p0-business.md`** + 按需 glossary |
| 2 | `git remote`、分支 | 仓库策略 | `p0-repository.md`（无 git 跳过） |
| 3 | docker-compose、`.env.example`、启动脚本 | 启动命令、依赖 | `p0-environment.md` |
| 3b | 外部集成配置、Mock 开关、鉴权 | JWT/OAuth/第三方 | **`p0-integrations.md`**（有则建） |
| 4 | 目标模块的 package/pom；full 才汇总全仓 | 技术栈 | `p1-tech-stack.md` |
| 5 | 目标模块 + **直接 Service 跨模块调用**；dependencies 扩上下游 | 模块与真实依赖 | **`p1-architecture.md`** |
| 6 | 高频组件/Util **Top8～15** + 典型页/Controller | **资产索引** + 模板 | `codebase/p1-frontend.md` / `codebase/p1-backend.md` |
| 6b | 典型 API **内部调用链**（P1；2～4 条） | mermaid | **codebase §四** |
| 7 | 目标链路触达的 migration、Entity | 表、FK、业务用途 | `data/entities/` … |
| 7b | 目标 Controller 路由；dependencies 加直接调用方 | 方法、鉴权、碰表 | **`data/api-catalog.md`** |
| 7c | migration 顺序 | ER + 演进 | **`schema-overview.md`**（可 P1） |
| 7d | Calculator/Util（有计算；主域） | 公式 | **`p0-domain-math.md`** |
| 7e | 集成测试（P2/有则） | 测试索引 | **`p1-testing.md`** |
| 7f | BizException（P1 主路径即可） | 错误码 | **`p1-errors.md`** |
| 8 | — | 沙盘 + 覆盖范围 | **`README.md`**、**`LAYERS.md`**（LAYERS 可 P1） |

**业务扫描须读尽以下来源（有则读，无则跳过并在 p0-business 标注）**：

- 根 README、docs/、CHANGELOG 产品向描述
- 已有 `atlas/requirements/REQ-*.md`（仅摘业务价值/用户角色，不抄 AC）
- 前端：路由表、菜单配置、页面 title
- 后端：包名、模块划分、Controller/Service 命名
- 数据：Entity 名、核心表 — 辅助理解领域，**须写清业务用途**
- **术语**：docs 词汇表、代码 Enum/常量注释、字段 comment、内部 wiki 缩写表

**步骤 5 · p1-architecture** → 按 [init-scan-checklist §p1-architecture](../templates/init.md#步骤-5-p1-architecture) **总体形态/模块依赖/跨模块调用/模块一览** 写满。

**步骤 6 · codebase** → [大仓分级](../templates/init.md#大仓分级) + [§codebase](../templates/init.md#步骤-6-codebase)：P0 先资产索引；P1 再金牌模板/序列图。

**步骤 7 · 实体** → 按 [init-scan-checklist §实体](../templates/init.md#步骤-7-data) **业务用途～字段与约束等** 逐实体写满。

**步骤 7d · 领域规则** → 按 [init-scan-checklist §p0-domain-math](../templates/init.md#步骤-7d-p0-domain-math) **规则总览/公式/依赖/易误解/交叉链** 写满。

**术语落盘**（与 [SKILL 裁决表](../SKILL.md#裁决表冲突时以此为准) 一致）：

| 内容 | 落盘位置 |
|------|----------|
| 完整术语表 | **`atlas/glossary.md`**（唯一权威） |
| `p0-business`「核心术语」 | 仅 3~5 个总览词 + 链接 glossary；p0 须链 glossary，不单写 p0 |

> **自动维护**：init refresh / REQ 新增时扫描新术语 → 追加 `atlas/glossary.md`（`<!-- auto -->`）。见 [glossary.md](../templates/glossary.md#自动扫描规则)。

**仓库完全无业务描述** → 仍建 `p0-business.md`，「未找到/待补充」列出；**AskQuestion 确认前**提示用户口述或贴文档链接补全（**含易混淆的内部术语**）。

**写法锚点（步骤 6/6b）**：

> 目的：dev 按既有写法写码。详见 [code-conventions.md](../templates/code-conventions.md)。
> **`AF_DECIDE=ai` / 默认**：直接 **模式 B**，落盘时写 `写法锚点模式：B`，**不问**。
> **`user` 且**尚无模式记录、无 `conventions/`、无 `codebase/p1-*`、原话未点明 → 才 AskQuestion → 停。

```yaml
title: "init 写法锚点模式"
questions:
  - id: init_anchor_mode
    prompt: "写法锚点文档怎么组织？"
    options:
      - id: mode_b
        label: "模式 B：FE/BE 分文件 codebase/p1-*；不建 conventions/"
      - id: mode_a
        label: "模式 A：另建 atlas/conventions/"
```

| 选项 | 落盘 |
|------|------|
| mode_b | `p1-architecture` + `codebase/p1-frontend|backend`；**不建** `conventions/` |
| mode_a | 建 `atlas/conventions/`；约定进 conventions |

已有记录 / 目录可推断 / 原话已点明 → 不问。

其余规则：

1. 从真实代码摘录 §三、§四；标注 `path:行号`；**序列图须与源码一致**
2. **`p0-domain-math.md`**：集中领域公式，避免新人读 15 个 entity 拼逻辑
3. greenfield 不 init；写法种子在 **`/af-sol`** → `solution/code-patterns-*.md`

### ③ 落盘

- 严格按 [init.md](../templates/init.md) 写模板正文
- README 覆盖块写 `盘点模式/任务锚点/覆盖路径/未覆盖/升级依据`
- local/dependencies 只追加或更新本次覆盖，禁止删掉其他已确认覆盖
- 每个文件首行：`> **盘点·业务** · …` / `> **P0** · …` / `> **P1** · …`（见分层模型）
- `README.md` 状态先标 **草稿**

### ④ 落盘自检

[init-scan-checklist 落盘自检](../templates/init.md#init-落盘自检)：**P0（A 组）全 ✅** 即可确认；大仓不要求 P2 齐。覆盖范围块必有。

### ⑤ 结束处理（按决策权）

| 决策权 | 动作 |
|--------|------|
| **`user`** | [init 确认卡](../templates/contract.md#init-确认阶段-0-收尾) → **停** |
| **`ai`** | 标 README **已确认** + AI 决策记录 → 闸门绿 → **可连做**下一阶段（不问） |
---

## 增量 refresh（REQ 开发完毕后）

**时机**（满足 **任一** 后 AskQuestion，不自动静默改 init）：

1. 该 REQ 关联 **全部** 开发任务步骤 **③ ✅**（`atlas/todo.md`）
2. 阶段 5 **AC 验收归档** 该 REQ 验收报告完成且 REQ 标 **已实现**
3. **阶段 4 入口**发现 `src/` mtime 晚于 init，且用户选择 refresh

**前提**：本次实现已改变 as-is（新表/新实体/新目录/环境变更等）。仅改文案/UI 样式且无结构变化 → 可 AskQuestion 后选「跳过」。

**方式**：

| 用户 / 选项 | 动作 |
|-------------|------|
| `/af-init refresh business` | 重读 README/docs/REQ/路由，更新 `p0-business.md`、`p0-domain-math.md`、`atlas/glossary.md` + README |
| `/af-init refresh data` | 重扫 migration + Entity，增删改 `data/**`（含 api-catalog 碰表列） |
| `/af-init refresh codebase` | 更新本端 `p1-frontend|backend`（资产 + §三）；**大仓只补当前模块/主路径**，扩覆盖范围声明 |
| `/af-init refresh conventions` | **仅模式 A**：更新 `atlas/conventions/` |
| `/af-init refresh environment` | 更新 `p0-environment.md`、`p1-tech-stack.md` |
| `/af-init` 或 `/af-init refresh` | 默认按当前任务做 local 增量；无任务锚点先问 |
| `/af-init full` / `/af-init refresh full` | 全量重扫 |
| [增量 refresh 卡片](../templates/contract.md#init-增量-refreshreq-开发完毕后) | 按用户选择范围执行 |

**做法**：REQ/model **设计阶段**只写 model/（to-be），不更新 init；实现未落地前不 refresh init。

每次 refresh 后：

1. 更新受影响文件 + 首行「最后验证」日期
2. `README.md` 追加「刷新记录」行
3. 可选：状态改回 **已确认**

---

## 与 model/ 的分工

| | init/ | model/ |
|---|-------|--------|
| 语义 | as-is 现有 | to-be 设计 |
| 时机 | 接手 / 实现后 refresh | REQ 确认后建模 |
| 实体 | 从代码/DB 扫出 | 从需求设计 |

---

## 前置 / 后置

| | |
|---|---|
| **前置** | brownfield 判定通过 |
| **后置** | 当前目标的 init 覆盖已确认 → 可进入阶段 1 `/af-req`，或 brownfield 下直接 `/af-sol`/`/af-dev`（须满足各阶段前置） |

---

## 首行声明

`📍 Agileflow | af-init:{local|dependencies|full} | 锚点：{任务/模块} | 原因：{范围依据}`

refresh 时加：`操作：{局部|依赖|完整|增量 data|…} | 触发：{首次|REQ-xxx 开发完毕}`

---

## 做法与红线

- greenfield 不创建 `atlas/init/`（原因：init 只描述 as-is）
- brownfield 在**本次扫描范围内**必建/更新 **p0-business.md**
- 有 REST/API 时只记录目标链路的 **api-catalog** 与相关领域规则；full 才追求全仓覆盖
- 序列图/公式与源码一致（init 须 as-is）
- 实体须写业务用途与用户怎么用，不只写字段
- init 不写任务、AC、open-questions、decisions、接口设计
- REQ 设计阶段不改 init
- 扫描落盘后再写业务代码
- 默认 local；有代码证据才 dependencies；明确要求或仓库级高影响才 full
- 覆盖元数据必须诚实，未扫区域不得写成已覆盖
- init 确认后同回复不进 dev 写码
- 无 git/无 DB 不建 p0-repository / data/ 占位文件
- conventions 与 codebase 不双份维护
