## L0 摘要（前置 · 不进 flow.yaml steps）

- brownfield 渐进盘点；**总控直做**（无 role Subagent）
- 默认 `local`；跨模块证据升级 `dependencies`；用户明确要求或仓库级高影响才 `full`
- 复用 `context.init` 已确认覆盖；新任务落到未覆盖模块时只补局部扫描
- **禁止**写 `AF_STEP=af-init`、禁止 advanceStep、禁止主链派活台账
- 产物：`atlas/init/`；闸门 `init-confirm` 绿后进主链第一个 flow 步
- greenfield **跳过**本阶段
