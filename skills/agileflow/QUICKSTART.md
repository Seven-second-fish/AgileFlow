# AgileFlow 快速上手

> 安装约 1 分钟。普通使用只需要记住：在聊天里输入 `/af`，然后说清楚你想完成什么。

## 30 秒开始

```bash
# 安装一次
npx @agileflow/cli@latest init
```

重启或重新加载你的 AI 编程工具，然后在聊天中输入：

```text
/af 做一个用户登录 API
```

AgileFlow 会自己判断这是新功能、维护、探索还是旧项目改造，并选择合适的处理方式。
你不需要先学习需求、方案、开发、测试分别对应什么命令。

如果希望 AI 尽量连续完成：

```text
/af 做一个用户登录 API，后面都交给你，只有真正需要我时再问
```

如果希望关键决定都由你确认：

```text
/af 做一个用户登录 API，每个关键决定先让我确认
```

两种方式的质量标准相同，区别只是确认次数。

## 你只需要会这四种表达

| 你说 | AgileFlow 会做什么 |
|------|--------------------|
| `/af` + 目标 | 开始或处理一项工作 |
| `/af` | 读取已有进度并继续 |
| `先分析，不要修改` | 只调查并给出结构化建议 |
| `后面都交给你` / `这一步我来确认` | 随时切换决定方式 |

修 bug、补测试、改文案、重构和性能优化也可以直接说人话：

```text
/af 修复登录超时
/af 给订单服务补单元测试
/af 首页标题改成“工作台”
```

不必先判断该用 `/af-fix`、`/af-ut` 还是其他高级命令。

## 第一次任务会发生什么

以“做一个登录 API”为例：

| 顺序 | AgileFlow 做什么 | 你会看到什么 |
|------|------------------|--------------|
| 1 | 确认目标与验收方式 | 需求摘要；信息不足时只问关键问题 |
| 2 | 设计边界和实现方式 | API、数据、安全与任务拆分 |
| 3 | 实现并运行检查 | 代码、编译结果、相关测试 |
| 4 | 对照验收条件验证 | PASS、失败原因或需要你处理的事项 |
| 5 | 保存交付证据 | `atlas/` 中可接手的需求、方案和验收记录 |

完整对话与文件变化见
[端到端交互实录](examples/flow-interaction.md#完整实录从一句话到可交付结果)。

## 三种常见用法

### 新功能

```text
/af 做一个微信支付回调模块，需要处理并发和幂等，后面都交给你
```

AgileFlow 会依次明确验收标准、形成方案、实现并验证。需要密钥、审批或真实设备时，
会清楚告诉你需要提供什么。

### 修改已有项目

```text
/af 修改登录模块的超时处理
```

AgileFlow 默认只分析登录模块及直接边界；发现真实跨模块依赖才扩大到直接上下游。
只有你明确要求完整盘点，或任务确实影响整个仓库时，才扫描全项目。

### 先听建议

```text
/af 先分析这个项目为什么慢，给我几个方向，不要修改
```

AgileFlow 只读代码和现有资料，返回证据、候选方向、利弊和建议。默认不创建文档，
也不修改代码。

## 中断后继续

关闭对话不会丢失已经保存的进度。打开新对话后输入：

```text
/af
```

AgileFlow 会读取仓库中的任务状态，从尚未完成的位置继续，不需要你重新解释。

如果上次停在需要你提供资源的地方，先完成该事项，再说：

```text
已配置支付测试密钥，继续
```

## 常见问题

### 修一行 bug 也会生成很多文档吗？

不会。明确的小修复会直接修改并验证；只有发现它涉及新需求、接口变化、安全风险或
多个模块时，才升级为完整交付流程。

### 我不懂技术方案，怎么选？

直接说“你推荐一个并说明理由”。AgileFlow 会比较可行方向并给出建议；如果你已经
授权直接实施，它会选择后继续，不会因为你“不知道怎么做”就停在讨论阶段。

### AI 为什么停下来了？

通常只有三种原因：

1. 需要你决定产品方向。
2. 需要你提供密钥、账号、审批或真实设备。
3. 自动检查失败，当前结果还不能安全进入下一步。

打开 [排障指南](TROUBLESHOOTING.md)，先看“现在谁需要行动”。

### 根目录为什么多了 `atlas/`？

它是交付资料目录，保存需求、方案、任务进度、验收报告和可恢复状态。团队项目通常
应该提交主要内容；`atlas/logs/` 和本地临时产物可以按团队约定忽略。不要直接忽略
整个 `atlas/`。

---

## 高级使用：项目安装与内部机制

> 从这里开始面向维护者和希望定制流程的高级用户。普通使用可以停在上面。

### 安装到单个项目

```bash
cd YOUR_PROJECT
npx @agileflow/cli@latest init --root .
# → skills/agileflow/ + skills/af-*/

# 只补缺失的 atlas 基础文件，不覆盖已有内容
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

| 安装方式 | 位置 | 适用场景 |
|----------|------|----------|
| `init` | 各宿主的用户级 skills 目录 | 一次安装，多个项目共用 |
| `init --root .` | `{项目}/skills/` | 团队希望项目自带同一版本 |

用户级目录：

| 宿主 | 目录 |
|------|------|
| Cursor | `~/.cursor/skills/` |
| Claude | `~/.claude/skills/` |
| Codex | `~/.agents/skills/` |
| WorkBuddy | `~/.workbuddy/skills/` |
| CodeBuddy | `~/.codebuddy/skills/` |
| Qoder | `~/.qoder/skills/` |

> Codex 的当前官方目录是 `~/.agents/skills/`；`~/.codex/skills/` 仅作为旧路径清理。
> `--tools workbuddy` 或 `codebuddy` 会同时安装到两种宿主目录。

不要使用裸命令 `npx agileflow`，npm 上存在无关同名包。安装和更新请使用
`npx @agileflow/cli@latest`；`@latest` 可以避免 npx 继续复用旧缓存。

### `atlas/` 中的主要内容

| 路径 | 用途 |
|------|------|
| `flow.yaml` | 项目的执行步骤、依赖和预期产物 |
| `todo.md` | 当前任务和开发进度 |
| `humanTodo.md` | 需要人提供的密钥、资源、审批或真机操作 |
| `requirements/` | 可验收的需求 |
| `solution/` | 架构、接口和实现边界 |
| `dev/` | 每个开发任务的设计、实现与运行结果 |
| `tests/` | 最终验收报告 |
| `runs/` | 当前执行的产物摘要和可信检查回执 |
| `agileflow-dispatch.json` | 多 Agent 的内部执行记录 |

`agileflow.env`、`AF_STEP`、`AF_DECIDE` 和执行记录属于内部协议。普通用户不需要
手动维护；排障或扩展流程时再查看。

### 查看和排查 Runtime

正式流程会创建一个 Run。检查通过记录会绑定当前 Run、步骤、流程版本和产物摘要；
产物或 `flow.yaml` 变化后，旧记录自动失效。

```bash
agileflow run status --json --root .
agileflow artifact scan --root .
agileflow gate req-confirm --root .
agileflow run gate-status --gate req-confirm --json --root .
```

修改执行图后，旧 Run 不再适用：

```bash
agileflow run abandon --reason "flow 已变更" --root .
```

### 修改提示词或增加步骤

| 目标 | 修改位置 | 生效方式 |
|------|----------|----------|
| 修改角色提示词 | `atlas/role/role-*.md` | 下一次该步骤使用新提示词 |
| 增加流程步骤 | `atlas/flow.yaml` | 增加 `id`、`prompt`、`depends`、`outputs` |
| 刷新聊天命令 | — | `update --step-skills-only` |

新步骤示例：

```yaml
- id: af-security-review
  mode: strict
  prompt: atlas/role/role-security-review.md
  depends:
    - atlas/solution/
  outputs:
    - atlas/security/review.md
```

刷新：

```bash
npx @agileflow/cli@latest update --step-skills-only --root .
```

默认步骤 id 为：

```text
af-req → af-mod → af-sol → af-dev → af-test
```

这些是高级直达命令。普通用户继续使用 `/af` 即可。

### AgileFlow 仓库开发者

- 产品源位于 `skills/agileflow/`。
- 不要提交 `.cursor/.claude/.agents/.workbuddy/.codebuddy/.qoder/skills/` 生成副本。
- 修改源代码后运行：

  ```bash
  cd skills/agileflow
  npm run test:validate
  ```

- Agent 端到端复测见 [AGENT-RETEST.md](../../AGENT-RETEST.md)。

## 更多资料

- 产品介绍：[README.zh-CN.md](../../README.zh-CN.md)
- 连贯示例：[flow-interaction.md](examples/flow-interaction.md)
- 排障：[TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- 内部流程规则：[majorflow.md](majorflow.md)
- 变更管理：[change-management.md](phases/change-management.md)
