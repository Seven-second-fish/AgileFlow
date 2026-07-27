# 决策权契约

> **唯一 SSOT**：首启、决策权、**行为矩阵（ai/user）**、停点、话术、AskQuestion 卡。他处只链本文，禁止再抄表。
> env 字段 → [agileflow.env](agileflow.env) · 派活 → [orchestrator-core](orchestrator-core.md) · 冲突 → [SKILL](../SKILL.md)

---

## 0. 两种决策（人话）

| 决策 | 你感受到的 |
|------|------------|
| **AI 全权**（`AF_DECIDE=ai`） | 很少问；闸门绿后同会话连做；阶段 4 自动扫描并行 |
| **我来决策**（`AF_DECIDE=user`） | 缺口/确认/阶段闸门须问你；并行须并行卡 |

**质量线唯一档位**（`AF_TIER=full`）：sol/dev 厚度、①②③、可运行证据不因决策权而减。

决策权不锁死：中途可让 AI 接管或收回。

---

## 1. env

| 键 | 值 | 控制 |
|----|-----|------|
| `AF_DECIDE` | `ai` / `user` / `pending` | 选型/澄清问不问人、停点多少 |
| `AF_TIER` | `full`（固定） | 文档与闸门质量线 |
| `AF_PHASE` | 0–5 | 当前主阶段（插入步不占号，停在左侧内置步；规则 → [flow §AF_PHASE](flow.md#af_phase-与插入步钉死)） |
| `AF_STACK_SOURCE` | pending / ai_record / … | 技术栈来源 |
| `AF_TEMPLATE` | `no` / `yes` | 文档形态：`no`=legacy（默认）；`yes`=读 `atlas/template/` 走 generic-doc 校验 |
| `AF_HOST_CAPABILITY` | `full` / `degraded` / `pending` | 宿主 Subagent 能力（**总控首条**据 tool list 写；`pending` 跑 gate 红）。`full` 禁止 degraded 台账 |

**铁律**：加速靠少停 + 并发，不是少写文档、不是跳阶段。**「你定」≠ 免派活 / 免 gate / 主线程包办正文。**

---

## 2. 首启（默认问人）

一开始 `AF_DECIDE=pending`。从原话解析：

| 原话 | 动作 |
|------|------|
| **未**点明谁决策（只说做功能/带前缀） | 保持 pending → [启动卡](#71-流程启动卡)→**停** |
| 你定 / 别问我 / 直接做完 / 不用管 / AI自己干 | `AF_DECIDE=ai`；可跳卡 |
| 我来决策 / 逐步问我 | `AF_DECIDE=user`；可跳卡 |

答完启动卡：写 `AF_DECIDE`（禁再 pending）→ 同步 todo「决策委派」→ 进阶段。启动卡本回复必须停。

### 契约重选

说「重选决策权 / 重开启动卡」或闸门选重选 → `AF_DECIDE=pending` → 再发启动卡→停。禁止让用户手改 env。

---

## 3. 话术表（必须看上下文）

| 用户说 | 上下文 | 动作 |
|--------|--------|------|
| 这阶段你定 / 不用问我了 | 任意 | 仅本阶段少问；**不**改全局 `AF_DECIDE` |
| 后面都你定 / 不想看了 / 剩下你来 / 直接做完 / 你接管 | 任意 | **立刻** `AF_DECIDE=ai` → 接管剩余；仍须闸门 |
| 这阶段我来 / 后面都我来 | 任意 | 切回 `user` |
| 重选决策权 / 重开启动卡 | 任意 | [契约重选](#2-首启默认问人) |
| 我自己看，暂停 | 闸门 | pause，不进下一阶段 |

**禁止**：口头答应接管却不改 env。

---

<a id="4-停点总表"></a>
<!-- 锚点 4-停点总表 保留兼容 SKILL/dev 链 -->

## 4. 行为矩阵（ai vs user · 唯一 SSOT）

> 各 `phases/xx.md` **只链本节**，禁止再抄 ai/user 差异表。阶段专属 prompt 见 [§7 AskQuestion 卡册](#7-askquestion-卡册)。

| 场景 | `user` | `ai` |
|------|--------|------|
| **首启** | `AF_DECIDE=pending` → [启动卡](#71-流程启动卡)→停 | 原话明确委托 → 可写 `AF_DECIDE=ai` |
| **阶段内澄清**（REQ 四项等） | 按缺口 AskQuestion | 自决 + 落盘「AI 决策记录」 |
| **技术栈**（阶段 3） | 栈 pending → 技术栈卡→停；**先落盘 architecture 再确认** | role-sol 自选栈 → `AF_STACK_SOURCE=ai_record` |
| **建模跳过**（阶段 2） | 须确认卡 | 自判落盘；自检齐可同条进 sol |
| **阶段结束** | 阶段闸门→停（确认可与闸门合并） | 闸门绿→摘要+自动确认→**同会话连做**（阻塞式派活至回报，不等用户说「继续」） |
| **阶段 4 并行** | 候选 ≥2 → [并行卡](#74-并行启动卡仅-userai-不问) | 进阶段 4 **必扫描**；≥2 自动同批（≤3） |
| **F/MVP 里程碑** | F 相关 T 全 ✅ 且可运行过→**必须**问 | 默认不发 |
| **validate 降级** | 每阶段须停等确认 | 每阶段须停等确认 |
| **快捷指令**（fix:/revise: 等） | 直接执行，无确认卡 | 同左（快捷指令不分 ai/user） |

**阶段 1 收尾 prompt 示例**（仅 user）：`需求澄清已完成。是否继续进入【数据建模】阶段？` → [§7.2](#72-阶段闸门user)

AskQuestion 后 = **本回复结束**；用户答后 **下条必须落盘/进阶**。

---

## 5. 信息充分少问（user）

REQ **四项齐** → 跳过**需求澄清整卡**，仍须确认/闸门。跳过前首行须透明声明：

`四项判定：用户/场景=…；平台=…；MVP=…；清单=…（齐/缺X）`

| 项 | 齐的标准 | 不齐例 |
|----|----------|--------|
| 用户/场景 | 谁在用、解决什么问题 | 仅「做个登录」 |
| 平台 | Web/小程序/App/BE-only | 未说端 |
| MVP 范围 | 首版做/不做什么 | 「全套电商」无裁剪 |
| 功能清单可拆 | ≥1 个可独立验收功能 | 只有形容词 |

原话已覆盖的题禁止复问。`ai`：不问澄清/确认/技术栈/并行/init 锚点。

---

## 6. AI 自主时

跳过阶段内决策卡；须落盘 +「AI 决策记录」；仍不可少：`flow.yaml` 中**启用**步、atlas 落盘、todo①②③、构思①、可运行闸门、每启用阶段 validate exit 0。`AF_DECIDE=ai` ≠ 擅自关 req/sol/test；model 跳过须总控写入 `atlas/flow.yaml`。

`ai`+闸门绿：禁发阶段闸门；摘要；自动标已确认（阶段 1 同步各 REQ）；**同会话阻塞式连做到终点**（禁止派完一批等人说「继续」）。

总控派活细则 → [orchestrator-core 自治循环](orchestrator-core.md#ai-自治循环)。

---

## 7. AskQuestion 卡册

### 7.1 流程启动卡

```yaml
title: "Agileflow 流程启动"
questions:
  - id: decide_mode
    prompt: "关键选型谁定？（中途可说「后面都你定」或「这阶段我来」）"
    options:
      - id: user_decide
        label: "我来决策"
      - id: ai_decide
        label: "AI 全权决策"
```

### 7.2 阶段闸门（user）

> **各 phase 文件只链本节**，不重复 YAML。`ai`+闸门绿 → **跳过**本卡，同会话连做。

```yaml
title: "开发流程确认"
questions:
  - id: continue_next_stage
    prompt: "{当前阶段}已完成。是否进入【{下一阶段}】？"
    options:
      - id: yes
        label: "是，继续"
      - id: no
        label: "否，暂停"
      - id: reselect_contract
        label: "重选决策权"
```

user 阶段 1/3：确认题与 continue 可合并为一张卡（仍本回复停）。

### 7.3 F/MVP 阶段性确认（仅 user；ai 默认不发）

F 相关 T 全 ✅ 且可运行闸门已过 → 必须问：继续 / 先演示 / 有问题先修 / 暂停。可运行未过禁止发本卡。

### 7.4 并行启动卡（仅 user；ai 不问）

候选 ≥2 可并发 T → 问是否本批并行。规则 → [04 §并行](../phases/04-development.md#并行阶段-4)。

### 7.5 其它卡（YAML 要点）

| 卡 | 何时 | 要点 |
|----|------|------|
| 需求缺口 | user 且四项不齐 | 只问缺口；充分则跳过 |
| 需求确认 | user 写完 REQ | 可与闸门合并 |
| 技术栈 | user 且栈 pending | 未落盘 architecture 前禁发方案确认 |
| 建模确认/跳过 | user | ai 自判落盘，禁确认卡 |
| 变更 | 改已确认 REQ | 见 [change](../phases/change-management.md) |

AskQuestion 不可用：编号选项降级 → 停 → 首行 `⚠️ AskQuestion 降级`。

---

## 8. 必守边界

| 须做到 | 说明 |
|--------|------|
| **契约先确认** | 未点明谁决策 → 保持 `pending` + 启动卡；明确委托才写 `AF_DECIDE=ai` |
| **`ai` 少停** | 跳过澄清/技术栈/方案确认/阶段闸门；仍须落盘 + gate + 每阶段真派 Subagent |
| **`user` 该停就停** | 缺口/确认/阶段闸门/并行卡按矩阵发问；AskQuestion 后本回复结束 |
| **发卡即落盘** | 选「继续」后**下条**写下一阶段产物（`ai` 同会话连做除外） |
| **可运行先于演示** | F 里程碑卡或「给用户看」前，须过可运行闸门并写入 `## 结果` |
