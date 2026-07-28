# atlas/README.md — 人类驾驶舱（强制）

> **每阶段结束必须更新本文件。** 人打开 atlas/ 先读这一份；编号细节链到子目录。  
> 状态与「现在卡点」以本文件 + 各层 README 索引为准。

## 落盘路径

`atlas/README.md`

## 模板

```markdown
# {产品名}

一句话：{用用户原话概括要交付什么}

## 现在
- 阶段：{0 init / 1 需求 / 2 建模 / 3 方案 / 4 开发 / 5 测试}（AF_PHASE={n}）
- 决策：{AI自主|用户决策}
- 进行中：{T-xxx 步骤①/②/③ 或「阶段闸门待确认」}
- 阻塞：{无 | humanTodo 关键项摘要}
- 纠偏：{无 | L{n} → {目标}（L2/L3 必填；见 change-management 纠偏阶梯）}

## 已拍板
- 技术栈：{… 或 见 solution/architecture.md}
- MVP 范围：{REQ-xxx…}
- 其他关键决策：{…}

## 未决
> 与 `atlas/humanTodo.md` 同步；**已决事项必须从两边删除**；用户原话已答清的项禁止写入；禁止与 architecture 已选栈矛盾。

- [ ] …

## 导读
| 我想… | 去哪 |
|-------|------|
| 看需求与验收 | [requirements/README.md](requirements/README.md) |
| 看领域模型 | [model/README.md](model/README.md) |
| 看接口与架构 | [solution/README.md](solution/README.md) |
| 看开发进度 | [todo.md](todo.md) |
| 看缺陷处理 | [bugs/README.md](bugs/README.md)（存在时） |
| 看未决事项 | [humanTodo.md](humanTodo.md) |
```

## 阶段收尾检查

| 时机 | 必须更新的块 |
|------|--------------|
| 阶段 1 结束 | 现在 / 未决 / 导读；已拍板可写 MVP 范围 |
| 阶段 2 结束 | 现在；导读链 model |
| 阶段 3 结束 | 现在 / 已拍板（栈）/ 未决（删已决） |
| 阶段 4 每推进 T 或阶段结束 | 现在（进行中 T）；阻塞 |
| 阶段 5 | 现在 → 测试 |
| L2/L3 纠偏 | 现在（纠偏行 + 阶段/阻塞）；清掉已失效的「已拍板」项 |

**禁止**：用 todo 长文代替本文件；本文件写流程纪律散文。
