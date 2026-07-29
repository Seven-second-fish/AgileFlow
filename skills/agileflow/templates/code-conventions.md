# 写法锚点（AI 写码规范）

> **目的**：让 AI **少读、抄路径、少造轮子**——按项目既有写法与**可复用资产**写码。  
> **视觉标记**：重要规则可用 🔴🟠🟢🔵 前置，便于扫读。  
> **模式 B / 模式 A**：首次 init **须 AskQuestion** 选定（见 [00-project-init](../phases/00-project-init.md) / [init-askquestion](contract.md)）；**禁止**静默默认 B。已写入 `init/README`「写法锚点模式」或目录已定型后不再问。
>
> **模式 B（常用）**：**FE / BE 分文件**；每文件内 **资产索引靠前**（AI 第一眼用得上）。**不建**平行 catalog。
> **模式 A**：另建 `atlas/conventions/`。
> living document：可先 🌱；③ 后 refresh 模板 + 资产行。

---

## 对抗式要点（为何这样排）

| 风险 | 定稿 |
|------|------|
| 资产藏文末 | AI 读不全 → **资产索引必须紧接「开发速查」之后** |
| 多文件货架 | 不知道读谁 → **每端一文件**；可选 `codebase/README` 两行指路 |
| FE/BE 揉表 | 搜错 → **`p1-frontend` ≠ `p1-backend`** |
| 每次读全书 | 成本高被跳过 → **先资产表 → 按需只读一个模板小节 + 一个参考页** |

---

## 两种落盘模式（二选一，禁止双份）

| | **模式 B** | **模式 A** |
|---|-------------------|------------------------|
| **文件** | 每端一文件（见下） | `atlas/conventions/frontend|backend-patterns.md` |
| **brownfield** | `init/codebase/p1-frontend.md` + `p1-backend.md`（有则建；单端可只建一端） | codebase 仅 §一 + conventions |
| **greenfield** | `solution/code-patterns-frontend.md` + `code-patterns-backend.md` | conventions 🌱 |
| **dev ## 契约 → ### 复用** | 本端锚点：`资产索引`行 + `§3.x` 参考页 | `conventions §2.x` |

**禁止**：另建 `components-catalog.md` / `utils-catalog.md`；**禁止**把组件清单写进 `p1-architecture`。

### 目录（清晰分层）

```
atlas/init/codebase/
├── README.md              # 可选·极短：FE读谁 / BE读谁 / 写码顺序
├── p1-frontend.md         # 仅前端
└── p1-backend.md          # 仅后端
# 小程序可另 p1-weapp.md（同前端章结构），勿与 backend 合并

atlas/solution/            # greenfield 无 init
├── code-patterns-frontend.md
└── code-patterns-backend.md
```

---

## 单文件结构（模式 B · AI 阅读顺序）

> **两端同构**，表头按端区分。旧「纯五段式」升级为本结构：速查 + **资产靠前** + 一～五。

```markdown
# {前端|后端}写法锚点

## 开发速查（AI 写码 · 30 秒 · 勿跳过）
| 我要 | 只看 |
|------|------|
| 有没有现成积木 | **下方「资产索引」** |
| 怎么抄一种页/接口 | 「三、代码模板」**对应一小节** |
| 目录 | 「一、目录结构」 |
| 命名/分层 | 「二、写法规范」（必要时） |

## 资产索引（库存 · 新建前必查 · 本文件最有用）
### 6.1 …（见下方 FE/BE 表头；标题可用「组件与 hooks」或「服务与基类」）
### 6.2 公共方法
> 扫描范围：… TopN：… 无则写「无」，禁止空章装样子。

## 一、目录结构
## 二、写法规范
## 三、代码模板（按需只读一节；含 参考 path:行号 + 真实代码块）
## 四、典型链路（BE 常要 2~4 条 mermaid；FE 可短/可无）
## 五、新功能自检
- [ ] 已查「资产索引」
- [ ] 本 T 构思齐：全端主流程+边界+实现说明（逻辑块怎么做编号 ≥2）
- [ ] 若抄写：已打开模板参考页/类
```

### FE 资产索引表头

**`### 组件与 hooks`**

| 资产 | 控件类型 | 路径（可复制） | 参考页 | 适用/禁止 |
|------|----------|----------------|--------|-----------|

**`### 公共方法`**

| 方法 | 路径 | 参考页 | 能力 |
|------|------|--------|------|

### BE 资产索引表头

**`### 服务与基类`**

| 资产 | 能力标签 | 路径.方法 | 参考调用 | 适用/禁止 |
|------|----------|-----------|----------|-----------|

**`### 公共方法 / 支撑`**

| 方法 | 路径 | 参考调用 | 能力 |
|------|------|----------|------|

### 前后端 §三 四类模板（按需读一节）

| 前端 §三 | 后端 §三 |
|----------|----------|
| 3.1 表单 | 3.1 分页列表 |
| 3.2 表格/列表 | 3.2 详情 |
| 3.3 弹窗/抽屉 | 3.3 创建/更新 |
| 3.4 request/service | 3.4 幂等/状态变更（有则写） |

每条须含：`参考：{path}:{行号}` · `适用` · `禁止偏离`（2~3 条）· **真实代码块**

---

## 文档状态

| 状态 | 含义 | dev ② 行为 |
|------|------|------------|
| 🌱 | §二有；资产可「待建设」；§三待补 | 按 architecture+§二；**③ 后 refresh 资产+§三** |
| 📝 | 资产或 §三 部分有 | 有则对齐；缺的按 §二 |
| ✅ | 资产可用 + 四类 §三 齐 | 严格对齐路径与模板 |

---

## 生命周期

```
brownfield init:  定任务锚点 → 默认 local；跨模块证据才 dependencies；明确要求/仓库级高影响才 full
                  → **范围内 P0**（business短 + architecture主干 + 资产TopN + 目标API）
                  → 自检 A 过 → AskQuestion（可注明 P1 待补）
                  → 有余力/要抄写 → **P1**；其余 **P2** refresh
greenfield sol:   code-patterns-frontend|backend 🌱
                  （资产写「待建设」；§三待补）
dev ①:            Read 本端锚点 → 写主流程+边界+实现说明（完整质量） → 按需 Read §3.x
dev ③ 后:         新建可复用组件/Util → 追加资产索引一行；典型功能 refresh §三
init: refresh codebase → 更新资产 + §三§四
```

### brownfield · init 步骤 6

→ [init.md](init.md)

1. 有 FE → 写满 `p1-frontend.md`（**资产索引靠前** + §一~§五）  
2. 有 BE → 写满 `p1-backend.md`（同上）  
3. 资产：路径可复制 + 参考页/参考调用；TopN；显式「无」亦可  
4. §三每模板 path:行号 + 真实代码；BE §四序列图对照源码  

### greenfield · sol

建 `code-patterns-frontend|backend.md` 🌱：速查 + 资产「待建设」+ §一§二；**不建** `atlas/init/`。

### dev 首个典型功能后

③ ✅ 且为首个列表/表单/CRUD → refresh **本端**资产索引 + §三 + README 记录。

---

## AI 最小动作链（省力 · 强制）

```
1. 看 T 头 [FE]|[BE]|[MP] → Read 本端 p1-* 或 code-patterns-*（一份）
2. 写 ①：全端 → 主流程+边界+实现说明（逻辑块怎么做编号 ≥2）。见 [dev-granularity](dev-granularity.md)
3. 禁纯 #### + 一行 **改**；禁止表写复用却平行实现
4. ③ 后新建可复用资产 → 追加资产索引一行
```

**刻意不做**：每个 T 通读 architecture + 双端锚点 + 全部模板；也不为「复用」另开盘点大表。

---

## dev 硬规则

**① 构思**：主流程（3～8，`> 入口：`）+ 边界（≥2，挂第 N 步）+ 实现说明（目的+做什么+怎么做编号）；BE 入口写 POST/回调，FE 写用户动作。

**② 写码前**：

1. 已 Read **本端**锚点（至少含资产索引）  
2. 全端按 `## 实现说明` 落点写码  
3. 禁止平行再造资产索引里已有的积木

**禁止**：

- ❌ 有本端锚点却不读就写码  
- ❌ 因「你定」/快速压成两句空步骤  
- ❌ 资产索引无路径（只有「有公共组件」）  
- ❌ 另起 catalog 与 p1 双维护  
- ❌ 把资产表只放在文末  
- ❌ greenfield 首功能后永不 refresh  
- ❌ 锚点里写 REQ/AC/todo  

---

## init 内分工

→ [init.md](init.md)。greenfield to-be → `solution/architecture.md`。

---

## 模式 A 附录（仅显式选用）

```
atlas/conventions/
├── README.md
├── frontend-patterns.md   # 同：速查+资产靠前+模板
└── backend-patterns.md
```

init `codebase/p1-*` 仅 §一目录，链到 conventions。  
格式示例 → [code-pattern-scan.md](../examples/code-pattern-scan.md)
