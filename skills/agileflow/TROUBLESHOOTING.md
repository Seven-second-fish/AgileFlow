# AgileFlow 排障指南

遇到问题时先不要手改 `atlas/` 状态，也不要为了继续而跳过检查。按下面三步处理：

1. 找到最后一条带 `❌` 或错误码的消息。
2. 看消息写的是“需要你”还是“由 AI 修复”。
3. 把完整报错交给 AI；不要只截取错误码。

## 现在谁需要行动？

| 你看到的情况 | 谁处理 | 下一步 |
|--------------|--------|--------|
| 明确写着“需要你确认” | 你 | 选择方向或说明偏好 |
| 要求密钥、账号、审批、真机 | 你 | 完成后回复“已配置/已完成” |
| 出现 `[REQ-*]`、`[SOL-*]`、`[DEV-*]` 等错误码 | AI | 保留完整报错，让 AI 修复并重新检查 |
| AI 没有继续，也没有说明原因 | AI | 让它说明当前步骤、阻塞原因和下一步 |
| 同一错误反复出现 | AI | 读取实际文件与 Runtime 事件，定位根因，不要重复碰运气 |

## 三类最常见问题

### AI 停下来等确认

这通常不是故障。你选择了“关键决定由我确认”，或当前问题确实需要产品判断。

- 希望继续确认：直接回答当前问题。
- 希望 AI 接管剩余决定：说“后面都交给你，只有真正需要我时再问”。
- AI 已被授权接管却仍反复等待：让它检查决定方式并按已通过的步骤自动继续。

### 自动检查失败

检查失败表示当前交付证据还不完整，不等于业务代码一定完全错误。

```text
请读取完整报错，修复对应文件，重新运行同一项检查。
不要跳过，不要手改成 PASS。
```

常见类别：

| 前缀 | 白话含义 |
|------|----------|
| `REQ-*` | 需求、范围或验收条件不完整 |
| `SOL-*` | 方案、接口或边界不完整 |
| `DEV-*` / `TODO-CHECK-*` | 开发记录、代码或运行证据对不上 |
| `ORCH-*` | 多 Agent 执行记录不完整 |
| `AF-ENV-*` / `FLOW-*` | 当前步骤与项目执行状态不一致 |
| `RUNTIME-*` | 当前 Run 的产物或检查回执已经失效 |

### 关闭对话后不知道从哪里继续

在新对话输入：

```text
/af
```

AgileFlow 会读取当前 Run、`flow.yaml`、`todo.md` 和已有产物，从未完成的位置继续。
如果它无法判断，要求它先只读说明当前状态，不要创建新任务。

## 安装与版本问题

### AI 找不到 AgileFlow 规则

规则通常在用户级 skills 目录或项目的 `skills/agileflow/`，不一定在业务源码目录。
AI 应按 `SKILL.md` 的路径顺序查找 `00-intent-routing`，不能因为在项目根搜索不到就
跳过流程。

重新安装当前项目版本：

```bash
npx @agileflow/cli@latest init --root .
```

### 项目中的 skill 比 CLI 旧

出现 `AF-SKILL-SKEW` 时执行：

```bash
npx @agileflow/cli@latest init --root .
```

安装会更新 `skills/agileflow/` 与相关 `/af-*` 命令。不要使用无作用域的
`npx agileflow`，它是 npm 上的另一个包。

## Runtime 与流程状态

### 改了 `flow.yaml` 后旧 Run 失效

`RUNTIME-FLOW-STALE` 表示当前 Run 仍绑定旧流程。正确处理：

```bash
agileflow run abandon --reason "flow 已变更" --root .
```

然后为这项工作启动新 Run。不要在同一个 Run 中伪造新的 `flowDigest`。

### 产物刚检查过，修改后又失效

`no-registered-artifacts` 或 `artifact-registry-dirty` 表示产物尚未登记，或登记后内容
又发生了变化：

```bash
agileflow artifact scan --root .
agileflow gate --gate <当前检查> --root .
```

先确认内容稳定，再重新检查。

### `step sync` 被拒绝

离开当前步骤前必须有对应的有效 PASS：

```bash
agileflow run gate-status --gate <当前检查> --json --root .
```

前进使用 `step sync`；`rewind` 只用于回到当前或更早步骤。不要用 `rewind` 向前跳。
紧急强制前进也必须提供真实原因，不能把它当作普通路径。

### 管道显示成功，但实际检查失败

`gate | tee` 在未启用 `pipefail` 时可能显示错误的退出码。以 CLI 最后的
`AGILEFLOW_GATE_RESULT` 为准；存在 active Run 时，再查询 `run gate-status`。

## 需要用户资源

密钥、商户号、审批、真机和第三方账号会记录在 `atlas/humanTodo.md`。

- 没有资源时，AgileFlow 应明确标记阻塞，不能伪造 PASS。
- 配置完成后回复“已配置 xxx，继续”。
- 不要把真实密钥写入 `atlas/` 或提交到 Git。

---

## 维护者错误码索引

> 以下内容用于精确定位内部协议问题。普通用户通常只需把完整报错交给 AI。

### 需求与方案

| 错误码 | 原因 | 修复 |
|--------|------|------|
| `REQ-TITLE-SUBSTANCE` | 标题没有实际含义 | 使用明确的功能名称 |
| `REQ-SCOPE*` | 范围过短或缺少范围外说明 | 补充做什么、不做什么 |
| `REQ-AC-*` | 验收表缺列、空单元格或不可观测 | 补充可执行条件和结果 |
| `REQ-UID-断链` | REQ 引用了不存在的 UI 说明 | 补齐 UID 或移除错误引用 |
| `SOL-F-REQ-TRACE` | 功能方案没有回溯需求 | 增加对应 REQ 引用 |
| `SOL-API-NO-JSON` | API 契约没有请求/响应示例 | 补充真实 JSON 示例 |
| `SOL-F-THIN` | 功能方案只有空壳 | 补充边界、暴露面和明确不做项 |
| `SOL-A-SEC-*` / `SOL-A-RUN` | 架构缺安全或本地验证说明 | 按模板补齐 |

### 开发与验收

| 错误码 | 原因 | 修复 |
|--------|------|------|
| `TODO-CHECK-*` | 任务状态与文件或证据不一致 | 先补真实文件和运行结果，再更新状态 |
| `DEV-AC-UNIT` | 验收条件没有对应测试路径 | 写明 `src/test/` 或 `test/unit/` 中的真实测试 |
| `SKIP-CODE-*` / `DOC-FIRST-*` | 在需求和方案就绪前写码 | 回到最早缺口补齐，再重新检查 |
| `SKIP-测试进度假` / `TST-R-PASS` | 标记验收完成但没有 PASS | 运行测试并生成验收报告 |
| `dev 文件数 ≠ T 头数` | 多个任务被合并成一个开发记录 | 每个任务使用独立开发文件 |

### 多 Agent 与执行记录

| 错误码 | 原因 | 修复 |
|--------|------|------|
| `ORCH-NO-DISPATCH` / `ORCH-DISPATCH-MISMATCH` | 缺执行记录或未覆盖实际产物 | 使用真实 Agent 结果补齐记录 |
| `ORCH-NO-SUBAGENT-ID` | 缺真实 Agent 标识 | 使用宿主返回的真实 id，禁止编造 |
| `ORCH-FAKE-SUBAGENT-ID` / `ORCH-DIRECT-FORBIDDEN` | 假装分工或不允许协调器包办 | 重新执行真实分工 |
| `ORCH-DEGRADED-*` | 降级模式与宿主能力或记录冲突 | 说明真实限制并覆盖实际产物 |
| `AF-CMD-MISSING` / `AF-CMD-EMPTY` / `AF-CMD-NO-STEP` | 完成步骤后缺少命令索引记录 | 用实际步骤运行 `agileflow log` |

### 状态与回执

| 错误码 | 原因 | 修复 |
|--------|------|------|
| `AF-ENV-BOOT` | 还没确定决定方式 | 回答首次选择，或要求重选 |
| `AF-ENV-CAPABILITY-PENDING` | 尚未记录宿主能力 | 根据可用工具设置真实能力 |
| `AF-ENV-PHASE` / `AF-ENV-STEP*` | 当前步骤与产物不一致 | 从 Run 和 flow 恢复状态，不凭感觉手改 |
| `AF-ENV-NO-RECEIPT` | 标记完成但没有有效检查回执 | 运行对应 gate |
| `RUNTIME-LINEAGE` | 前序步骤缺少可信通过记录 | 从最早缺口合法重建，不用 rewind 前进 |

完整规则与修复提示：

- [validate-atlas-gate](templates/validate-atlas-gate.md)
- `scripts/validate-atlas/lib/rule-hints.mjs`
- [Agent 执行规则](SKILL.md#裁决表冲突时以此为准)
- [连贯交互示例](examples/flow-interaction.md)

仍无法解决时，请提供：完整报错、`agileflow run status --json --root .` 输出，以及
相关 `atlas/runs/<runId>/events.jsonl` 片段。不要提交密钥。
