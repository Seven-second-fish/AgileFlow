# 入口意图路由

> **唯一职责**：把“用户意图 + 项目状态”解析成一个 `routeId`，再交给对应门牌执行。
> 本文件不定义阶段内容、目录、闸门、Role、决策权或测试层；这些规则在目标门牌命中后按需加载。

<a id="agent-摘要"></a>

## Agent 摘要

1. 有明确 `/af-*` 门牌 → 直接命中同名 id；自定义 id 从 `atlas/flow.yaml` 读取。
2. `/af` 或自然语言自动路由 → 先执行：

   ```bash
   agileflow context --json --root .
   ```

3. 结合 context 与用户意图，返回：

   ```text
   routeId: af-xxx
   reason: 一句话依据
   ```

4. 切入对应门牌并停止承担路由职责。`/af`、`/af-explore`、`/af-init` 和快捷轨不是 Flow step，禁止写成 `AF_STEP`。

## 进入与退出

- 用户明确调用 `/af`、`/af-*`、`@agileflow`，或要求交付/修改可运行产物 → 进入路由。
- 纯解释、答疑、代码审查且不要求修改 → 不进入 AgileFlow，直接回答。

## 路由优先级

按以下顺序匹配，命中即停：

| 优先级 | 条件 | routeId |
|--------|------|---------|
| 1 | 明确 `/af-*`，且 id 存在于门牌 catalog 或 `flow.stepIds` | 该 id |
| 2 | 修改、调整或同步已有内容，或一次提交多条缺陷/验收反馈 | `af-revise` |
| 3 | 其他维护意图符合快捷边界 | 对应快捷 id |
| 4 | 用户要先调查/听建议再决策，且目标或方向仍不明确 | `af-explore` |
| 5 | 推倒重来、改技术栈、增加新 T，或修改 Flow 编排 | 进入 `change-management` 判级 |
| 6 | “继续/下一步/接着做” | `context.suggestedSteps` |
| 7 | 明确的新交付 | brownfield 且 init 未覆盖目标 → `af-init`（默认 local）；否则当前 Flow 第一个 step |
| 8 | 仍无法唯一判断 | 只问一个阻塞性问题 |

快捷边界只读 [quick-commands.md](quick-commands.md#agent-摘要)；纠偏只读
[change-management.md](change-management.md#agent-摘要)。不要在这里复制其规则。

### 已有内容修订

用户没有写 `/af-revise`，但表达以下意图时也必须自动命中 `af-revise`：

- “已有需求有几处出入，帮我修改”
- “调整 REQ-001 的 AC”
- “把现有方案、构思或代码同步一下”
- “这里有一批缺陷，全部处理一下”

REQ 是否已确认不影响入口选择。先进入 `af-revise`，再由其按影响面决定
L0/L1/L2 或升级完整 Flow。只有新增 REQ/T、改技术栈、重做阶段或推倒方向时，
才绕过 revise 进入完整流程。

收到缺陷列表不等于需求错误，也不得直接进入 `af-test`。`af-revise` 先逐条归因：
实现偏离、方案/模型问题、需求/AC 问题或新需求，再从最早受影响层处理。

## 默认入口 `/af`（万能自动路由）

`/af` 没有自己的阶段，也不写 `AF_STEP=af`。它只做三件事：

1. 执行 `agileflow context --json --root .`。
2. 按上表得到 `routeId` 和 `reason`。
3. 切入该门牌；后续加载、派活、落盘和闸门全部由目标门牌负责。

消息同时含 `/af` 和更具体的 `/af-*` 时，以更具体门牌为准。

## 状态合并

`agileflow context --json` 是路由状态的只读入口：

- `projectType`、`init`：项目类型，以及 init 的状态、模式、任务锚点、覆盖路径和推荐范围
- `currentSteps`：当前 Run 或 env 中的 step
- `suggestedSteps`：路由建议 step
- `readySteps`：Flow 依赖已经满足的 step
- `flow.stepIds`：当前项目可用的 Flow id，包含自定义阶段
- `decisionMode`、`hostCapability`：只供目标门牌后续使用

路由不得重新手工扫描 REQ/model/solution/todo 来推导阶段。context 无法读取或返回
`warnings` 时，才针对警告处理；不得静默猜状态。

存在 active Run 时：

- 用户说继续 → 使用 `currentSteps`。
- 用户提出另一项新交付 → 询问继续当前 Run，还是先 `run abandon` 后开始新 Run。
- 用户指定当前 Flow 的其他 id → 切入该门牌，由 Run/gate 判断能否前进或是否需要 rewind。

<a id="探索判定"></a>
## 探索路由

`af-explore` 用于“先调查/咨询/决策，暂不实施”的场景。不能只凭“不知道怎么做”
几个字路由；先判断用户此刻要的是**讨论决策**还是**直接交付**。
前提：用户尚未明确授权立即实施。再满足以下任一条件即可进入：
1. 交付目标尚不明确，需要先发现值得解决的问题。
2. 存在两个或更多合理方向，需要比较利弊、成本、风险或适用条件。
3. 用户要求先给意见、建议、可行性评估或最佳方向。
4. 需要先读代码、日志或现有设计，才能决定是否改、改什么。
5. 用户明确说“先分析”“先别改”“先看看有哪些选择”等。
以下情况不得进入：
- 用户已明确交付目标并授权实施，即使用户本人“不知道怎么实现”；走正式 Flow 或快捷轨。
- 纯解释、事实答疑、明确对象的代码/设计审查且不要求修改；直接回答。
- 修改已有需求、方案或代码；优先 `af-revise` 或对应快捷轨。
- 已明确属于 fix/refactor/perf 等维护交付；走对应快捷轨。
进入后：

1. 只读代码、日志和现有 atlas。
2. 在聊天中结构化返回探索目标、现状证据、核心不确定性、2～4 个候选方向、
   初步建议、待用户选择项和下一步路由预览。
3. 最多探索两轮；选定方向后给出结构化探索结论并重新执行路由。
4. 默认不写 env、Flow、REQ、业务源码或探索文档。只有用户明确要求记录，或结论
   确需跨会话交接/审计时，才可说明理由后写 `atlas/logs/explore-*.md`。

## 路由结果

首行只需：

```text
📍 Agileflow | routeId: {id} | reason: {依据}
```

随后立即按目标门牌执行。Flow id、`prompt`、`depends`、`outputs` 以
`atlas/flow.yaml` 为准；阶段规则由门牌按需读取，不在本文件预加载。
