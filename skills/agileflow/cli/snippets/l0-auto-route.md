## L0 摘要（万能自动路由 · 非 flow 步）

- **默认入口**：执行 `agileflow context --json --root .`，用“用户意图 + 状态”得到唯一 `routeId`
- **具体门牌优先**：消息含 `/af-*` 时直接命中；`/agileflow` 文字仍兼容为 `/af`
- **已有内容要改**：修改/调整/同步已有 REQ、model、solution、dev 时自动路由 `af-revise`；是否已确认不改变入口
- **只在无法唯一判断或需放弃 active Run 时提问**，不弹阶段菜单
- **不写** `AF_STEP=af`；落地到真实步（`af-req`/`af-fix`/…）后才维护 env/台账/闸门
- 首行：`📍 Agileflow | routeId: {id} | reason: {一句依据}`
- **留痕**：路由落地并**完成本步**后，用**落地门牌**显式写 `agileflow log --door /af-req|… --summary … --route {结果} --root .`（可另记一行 `/af` 入口，但**不能**单靠入口行过后续 confirm）。`ai` ≠ 免留痕；gate 只读校验，不自动补。
