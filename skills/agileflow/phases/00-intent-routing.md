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
| 2 | 修改、调整或同步已有 REQ/model/solution/dev，且不是新增/重做 | `af-revise` |
| 3 | 其他维护意图符合快捷边界 | 对应快捷 id |
| 4 | 不知道目标、需要先分析方向 | `af-explore` |
| 5 | 推倒重来、改技术栈、增加新 T，或修改 Flow 编排 | 进入 `change-management` 判级 |
| 6 | “继续/下一步/接着做” | `context.suggestedSteps` |
| 7 | 明确的新交付 | 当前 Flow 第一个应执行的 step；无状态时通常为 `af-req` |
| 8 | 仍无法唯一判断 | 只问一个阻塞性问题 |

快捷边界只读 [quick-commands.md](quick-commands.md#agent-摘要)；纠偏只读
[change-management.md](change-management.md#agent-摘要)。不要在这里复制其规则。

### 已有内容修订

用户没有写 `/af-revise`，但表达以下意图时也必须自动命中 `af-revise`：

- “已有需求有几处出入，帮我修改”
- “调整 REQ-001 的 AC”
- “把现有方案、构思或代码同步一下”

REQ 是否已确认不影响入口选择。先进入 `af-revise`，再由其按影响面决定
L0/L1/L2 或升级完整 Flow。只有新增 REQ/T、改技术栈、重做阶段或推倒方向时，
才绕过 revise 进入完整流程。

## 默认入口 `/af`（万能自动路由）

`/af` 没有自己的阶段，也不写 `AF_STEP=af`。它只做三件事：

1. 执行 `agileflow context --json --root .`。
2. 按上表得到 `routeId` 和 `reason`。
3. 切入该门牌；后续加载、派活、落盘和闸门全部由目标门牌负责。

消息同时含 `/af` 和更具体的 `/af-*` 时，以更具体门牌为准。

## 状态合并

`agileflow context --json` 是路由状态的只读入口：

- `projectType`：greenfield / brownfield
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

`af-explore` 只在目标尚不明确时使用：

1. 只读代码、日志和现有 atlas。
2. 返回发现摘要与 2～4 个方向。
3. 最多探索两轮；选定方向后重新执行路由。
4. 不写 env、Flow、REQ 或业务源码；可选记录 `atlas/logs/explore-*.md`。

已有明确交付目标时不得先走探索。

## 路由结果

首行只需：

```text
📍 Agileflow | routeId: {id} | reason: {依据}
```

随后立即按目标门牌执行。Flow id、`prompt`、`depends`、`outputs` 以
`atlas/flow.yaml` 为准；阶段规则由门牌按需读取，不在本文件预加载。
