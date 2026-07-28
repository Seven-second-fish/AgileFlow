## L0 摘要（快捷轨 · 非 flow 步）

- **不受** `AF_STEP` / 主链闸门 / 派活台账 / flow skip 管理
- 读 `phases/quick-commands.md` 执行；无 Subagent、无确认卡
- 改码 → 编译 + 相关测试；收尾首行 `✅`
- **强制留痕**：`npx @agileflow/cli log --door /af-fix --summary … --route fix --root .`（写入 `af-commands.md`）
- 越界 → 首行升级声明 → 完整 flow 轨或 `/af-revise`
- 快捷轨独立于完整 Flow；所有项目都可使用
