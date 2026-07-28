# 角色提示词（Subagent）

> **这些文件是给子代理的，不是给总控自己照着写的。**
> **首启强制**把本目录落到项目 `atlas/role/`（可改 = 项目自定义）。
> 总控派活前 **只读** `atlas/role/role-*.md`，再 **用宿主 Subagent/Task 发出去**。
> **产物形态**见 `atlas/template/`；**角色行为**见 `atlas/role/`。两者独立。
> 跨 IDE 派活 → [orchestrator-core §宿主义务](../orchestrator-core.md#宿主义务)

## 加载顺序（硬规则）

```
1. 首启已落盘 atlas/role/（缺 → --bootstrap-scaffold 或闸门 DIR-ROLE）
2. 读当前 flow step 的 `prompt`，调用 resolveRolePrompt(projectRoot, promptPath)：
   · 内置路径（如 atlas/role/role-req.md）且 custom（哈希 ≠ baseline）→ Read 项目文件**全文**
   · 内置路径且默认（assembled）→ skill templates/role/layers/{key}/ 拼装 core+return（按需 +quality/examples）
   · 其他项目 Role/Skill Markdown 路径 → Read 指定文件**全文**
3. 追加薄「本次任务」块（只列路径 + gate，禁止贴上游正文）→ buildTaskEnvelope
4. 【必须】调用宿主多 Agent API 发给 Subagent
5. 收回报 → 总控写 atlas/agileflow-dispatch.json → validate-atlas --gate
```

实现：`scripts/validate-atlas/lib/role-prompt.mjs`（`resolveRolePrompt` · `assembleSkillLayers` · `buildTaskEnvelope`）

| flow `prompt` | 文件（stamp / custom 全文） | layers 目录 |
|---------------|---------------------------|-------------|
| `atlas/role/role-req.md` | `role-req.md` | `layers/req/` |
| `atlas/role/role-model.md` | `role-model.md` | `layers/model/` |
| `atlas/role/role-sol.md` | `role-sol.md` | `layers/sol/` |
| `atlas/role/role-dev.md` | `role-dev.md` | `layers/dev/` |

阶段 0 init / 阶段 5 tests：无角色派活，**总控直接做**。

## 自定义 role → 文档闸门自动失效

首启 `--bootstrap-scaffold` 会写入 `atlas/role/.agileflow-role-baseline.json`（各 `role-*.md` stamp 的 sha256）。

**相对 baseline 内容有改动** → 该 role 视为用户自定义；派活 **verbatim 全文**；`validate-atlas --gate` **跳过**对应阶段默认**文档格式**闸门（REQ-*/MOD-*/SOL-*/DEV-* 等），输出 info `ROLE-CUSTOM-SKIP`。

**仍硬挡**：`af-env`、`dir`、**ORCH 派活台账**、runnable/smoke 等流程闸门。

重置「默认 assembled」：从 skill 恢复 stamp 后执行
`node <skill>/scripts/validate-atlas.mjs --refresh-role-baseline --root .`

### 默认 vs custom 派活体积

| 模式 | prompt 来源 | 典型 dev 体积 |
|------|------------|---------------|
| **assembled** | `layers/{key}/core+return` + 薄任务块 | ~2KB / 次（quality/examples 按需） |
| **custom** | `atlas/role/role-*.md` 全文 + 任务块 | 用户文件大小 |

## 首启落盘（强制）

```bash
node <skill>/scripts/validate-atlas.mjs --bootstrap-scaffold --root .
```

- 复制 skill `templates/role/role-*.md` → `atlas/role/`（**已有文件不覆盖**）
- 创建 `humanTodo.md` / `todo.md` 骨架 / 空派活台账 / **role baseline**
- 改 `atlas/role/role-*.md` = 定制本项目 Subagent 行为

## 可改 / 不可删

| 可改 | 须保留意图 |
|------|------------|
| 身份措辞、工作流细节、额外必读、项目约束 | `## 硬禁止`（env/todo/跨阶段） |
| 加严自检 | `## 验收 gate` 名（可加严，不可改成「不用 gate」） |

## 骨架（每个 role 文件）

`## 身份` · `## 必读` · `## 产物` · `## 验收 gate` · `## 硬禁止` · `## 工作流` · `## 返回给总控`

总控与派活表 → [orchestrator-core](../orchestrator-core.md) · [orchestrator-ref](../orchestrator-ref.md)
