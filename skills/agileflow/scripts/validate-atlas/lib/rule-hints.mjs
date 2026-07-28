/**
 * 闸门错误码 → 白话说明 + 谁负责修（用户可见友好提示）
 * @type {Record<string, { plain: string, who: 'ai' | 'user' | 'both' }>}
 */
export const RULE_HINTS = {
  'BUG-REQ-TRACE': {
    plain: 'Bug 修复前未关联明确 REQ + AC；先补齐需求对账，不能直接改代码',
    who: 'ai',
  },
  'BUG-TEST-TRACE': {
    plain: 'Bug 已进入待回归，但还没有回归测试或人工验证证据',
    who: 'ai',
  },
  'BUG-CLOSE-EVIDENCE': {
    plain: 'Bug 标记已关闭但缺验证证据；代码改完不等于缺陷关闭',
    who: 'ai',
  },
  'SOL-API-NO-JSON': {
    plain: 'API 契约只有表格、没有 JSON 示例',
    who: 'ai',
  },
  'SOL-API-NO-RES': {
    plain: 'API 契约缺少成功响应 JSON 示例',
    who: 'ai',
  },
  'SOL-F-REQ-TRACE': {
    plain: '功能文档没写对应哪个需求（← REQ-xxx）',
    who: 'ai',
  },
  'SOL-F-BOUND': {
    plain: '功能边界缺「做」或「不做」',
    who: 'ai',
  },
  'SOL-F-EXPOSE': {
    plain: '功能文档缺「暴露面」行',
    who: 'ai',
  },
  'SOL-CONTRACTS-缺': {
    plain: '方案引用了 API/UI 编号，但 contracts 目录缺对应文件',
    who: 'ai',
  },
  'SOL-UI-BIND': {
    plain: 'UI 契约链了 API 但没写「字段绑定」表',
    who: 'ai',
  },
  'SOL-C001-FAT': {
    plain: '多个 API 揉在一个 API.md 里，应拆成 API-001-名称.md',
    who: 'ai',
  },
  'SOL-A-SEC-栈': {
    plain: 'architecture.md 缺「技术栈」节',
    who: 'ai',
  },
  'SOL-A-RUN': {
    plain: 'architecture.md 缺「本地验证」/启动命令',
    who: 'ai',
  },
  'REQ-UID-断链': {
    plain: '需求引用了 UI 线框，但 ui/ 目录没有对应 UID 文件',
    who: 'ai',
  },
  'REQ-AC-空单元格': {
    plain: '验收标准（AC）表有空格',
    who: 'ai',
  },
  'TODO-CHECK-①无文件': {
    plain: '勾了构思①，但 dev/T-xxx.md 文件不存在',
    who: 'ai',
  },
  'TODO-CHECK-③无可运行': {
    plain: '勾了③，但 dev 结果里没写编译/启动/冒烟证据',
    who: 'ai',
  },
  'FE-SMOKE-NO-REPORT': {
    plain: '有前端目录但缺 fe-smoke-report.json（须 Playwright 逐页冒烟+截图；小程序用 H5）',
    who: 'ai',
  },
  'FE-SMOKE-REPORT-FAIL': {
    plain: 'Playwright fe-smoke 报告未通过（有页 FAIL）',
    who: 'ai',
  },
  'FE-SMOKE-NO-SHOT': {
    plain: 'fe-smoke 报告缺截图路径',
    who: 'ai',
  },
  'FE-SMOKE-SHOT-MISSING': {
    plain: '截图文件不存在（atlas/logs/fe-smoke-shots/）',
    who: 'ai',
  },
  'FE-SMOKE-NO-REVIEW': {
    plain: '缺 fe-smoke-visual-review.md（总控须 Read 截图后写目视 PASS）',
    who: 'ai',
  },
  'FE-SMOKE-REVIEW-FAIL': {
    plain: '目视记录未声明 screenshotsReviewed 或有页未 PASS',
    who: 'ai',
  },
  'FE-SMOKE-NO-PAGES': {
    plain: 'fe-smoke 报告无有效页面结果',
    who: 'ai',
  },
  'FE-SMOKE-REPORT-JSON': {
    plain: 'fe-smoke-report.json 无法解析',
    who: 'ai',
  },
  'DEV-LIT-代码落点': {
    plain: 'dev 里缺少可定位的代码落点（须 Class.method 或 path/）',
    who: 'ai',
  },
  'DEV-FLOW-入口': {
    plain: '主流程缺 `> 入口：…` 声明',
    who: 'ai',
  },
  'DEV-FLOW-最少': {
    plain: '主流程编号步骤少于 3 条',
    who: 'ai',
  },
  'DEV-FLOW-最多': {
    plain: '主流程超过 8 步，应拆 T 或下沉实现说明',
    who: 'ai',
  },
  'DEV-FLOW-落点': {
    plain: '主流程步骤里缺少 handler/路径等代码落点',
    who: 'ai',
  },
  'DEV-EDGE-存在': {
    plain: '缺 ## 边界 节或边界为空',
    who: 'ai',
  },
  'DEV-EDGE-最少': {
    plain: '边界少于 2 条（完整质量）',
    who: 'ai',
  },
  'DEV-EDGE-挂钩': {
    plain: '边界未挂「第 N 步」或 method()',
    who: 'ai',
  },
  'DEV-EDGE-处理': {
    plain: '边界未写清怎么处理（错误码/toast/return 等）',
    who: 'ai',
  },
  'DEV-IMPL-块': {
    plain: '实现说明缺【新写】或【改动】块',
    who: 'ai',
  },
  'DEV-IMPL-字段': {
    plain: '实现说明某块缺 **目的** / **做什么** / **怎么做**',
    who: 'ai',
  },
  'DEV-IMPL-怎么做': {
    plain: '逻辑块怎么做未编号≥2步',
    who: 'ai',
  },
  'DEV-IMPL-怎么做语义': {
    plain: '怎么做假厚：编号步缺少「条件 → 动作」箭头',
    who: 'ai',
  },
  'DEV-IMPL-落点': {
    plain: '实现说明里缺少文件/方法落点',
    who: 'ai',
  },
  'DEV-DO-对齐': {
    plain: '摘要「做」点名的类/路径未出现在实现说明 ### 标题',
    who: 'ai',
  },
  'DEV-STEP-FULL-须步骤表': {
    plain: '已废弃：全端用主流程+边界+实现说明',
    who: 'ai',
  },
  'DEV-BAN-ATOM': {
    plain: '禁旧原子步骤表，须用叙述五段式',
    who: 'ai',
  },
  'DEV-BAN-HASH': {
    plain: '禁 #### 薄写，须用叙述五段式',
    who: 'ai',
  },
  'DEV-BAN-步骤': {
    plain: '禁 ## 步骤 旧格式，须用 主流程+边界+实现说明',
    who: 'ai',
  },
  'DEV-STUB-先码后补': {
    plain: 'dev 是空壳或「写码后填」，构思不合格',
    who: 'ai',
  },
  'DEV-COPY-JSON': {
    plain: 'dev 里粘贴了大段 API JSON，应只链 contracts',
    who: 'ai',
  },
  'SKIP-CODE-无architecture': {
    plain: '已有业务代码，但缺 architecture.md / features',
    who: 'ai',
  },
  'DOC-FIRST-触发': {
    plain: '已启用 AgileFlow 且有业务码——须先过 REQ→sol→dev① 全链',
    who: 'ai',
  },
  'DOC-FIRST-无REQ': {
    plain: '已有业务代码，但还没有合规需求文档',
    who: 'ai',
  },
  'DOC-FIRST-无T': {
    plain: '写码前 todo 须有 ### T-xxx 任务头',
    who: 'ai',
  },
  'DOC-FIRST-无dev': {
    plain: '写码前每 T 须有合规 dev 构思且过 literal ①',
    who: 'ai',
  },
  'ORCH-NO-DISPATCH': {
    plain: '未派 Subagent 或未记派活台账：总控禁止包办 REQ/model/sol/dev',
    who: 'ai',
  },
  'ORCH-NO-DEV-ARTIFACT': {
    plain: '已有业务源码却无 atlas/dev/T-*.md：须先派 role-dev 落盘构思再写码',
    who: 'ai',
  },
  'AF-CMD-MISSING': {
    plain: '缺 atlas/logs/af-commands.md（/af* 须在 gate 前显式留痕）',
    who: 'ai',
  },
  'AF-CMD-EMPTY': {
    plain: 'af-commands.md 还没有有效日志行；本步收尾先 agileflow log',
    who: 'ai',
  },
  'AF-CMD-FORMAT': {
    plain: 'af-commands 行格式不对（须 [门牌][摘要][日期][→路由][状态]）',
    who: 'ai',
  },
  'AF-CMD-NO-STEP': {
    plain: '本步闸门要本步门牌（裸 /af 不够；ai≠免留痕）',
    who: 'ai',
  },
  'REQ-TITLE-SUBSTANCE': {
    plain: 'REQ 标题无实质（666/纯数字/junk）；须可理解功能名',
    who: 'ai',
  },
  'REQ-SCOPE-MINLEN': {
    plain: '范围内/外过短；各须≥16字写清边界',
    who: 'ai',
  },
  'REQ-AC-MIN-ROWS': {
    plain: 'AC 表至少 2 行（成功+失败/边界）',
    who: 'ai',
  },
  'REQ-AC-CELL-MINLEN': {
    plain: 'AC 单元格过短或 Then 无可观测断言',
    who: 'ai',
  },
  'SOL-F-THIN': {
    plain: 'F 卡过薄：边界/暴露面/全文不够',
    who: 'ai',
  },
  'ORCH-DEGRADED-NO-ENTRIES': {
    plain: 'degraded 仍须 entries+paths 覆盖产物',
    who: 'ai',
  },
  'ORCH-DEGRADED-ALLOW-THIN': {
    plain: 'af-allow-degraded.md 过薄或未写无 Task 证据',
    who: 'ai',
  },
  'AF-ENV-NO-RECEIPT': {
    plain: '进度已确认但缺对应 gate PASS 回执',
    who: 'ai',
  },
  'ORCH-FAKE-SUBAGENT-ID': {
    plain: 'subagentId 像手填假值（过短/占位词）；须抄宿主返回 ID',
    who: 'ai',
  },
  'ORCH-DIRECT-FORBIDDEN': {
    plain: 'req/model/sol/dev 步禁止 orch-direct 包办正文',
    who: 'ai',
  },
  'ORCH-DEGRADED-UNPROVEN': {
    plain: '有 .cursor 等却口头 degraded；须 af-allow-degraded.md',
    who: 'ai',
  },
  'TODO-CHECK-②无写码证据': {
    plain: '勾了②但无业务源码且无 write-code PASS 回执',
    who: 'ai',
  },
  'AF-SKILL-SKEW': {
    plain: '项目 skill 副本版本 ≠ 当前闸门；init --root . 重装同步',
    who: 'ai',
  },
  'ORCH-NO-SUBAGENT-ID': {
    plain: '台账缺 subagentId：像主线程写完再补假账，须真派 Subagent 并抄回 ID',
    who: 'ai',
  },
  'ORCH-DEV-NO-TASKID': {
    plain: 'dev 台账缺 taskId：每 T 须独立派 role-dev',
    who: 'ai',
  },
  'ROLE-CUSTOM-SKIP': {
    plain: 'atlas/role 相对 baseline 已自定义，跳过该阶段默认文档格式闸门（ORCH 仍硬挡）',
    who: 'ai',
  },
  'ORCH-DISPATCH-MISMATCH': {
    plain: '派活台账 paths/taskId 未覆盖本次产物文件',
    who: 'ai',
  },
  'ORCH-DISPATCH-INVALID': {
    plain: 'atlas/agileflow-dispatch.json 格式无效',
    who: 'ai',
  },
  'ORCH-DISPATCH-LEGACY-PATH': {
    plain: '派活台账仍在旧路径；可读但 warn 硬挡，须迁移到 atlas/agileflow-dispatch.json',
    who: 'ai',
  },
  'ORCH-DISPATCH-STALE-LEGACY': {
    plain: '权威台账已存在，但旧路径文件未删；请清理避免混淆',
    who: 'ai',
  },
  'ORCH-DISPATCH-SKIP': {
    plain: '降级单会话跳过派活校验（须 degradedReason 且 capability≠full）',
    who: 'ai',
  },
  'ORCH-DEGRADED-REASON': {
    plain: 'degraded 模式缺 degradedReason → 禁止跳过 ORCH',
    who: 'ai',
  },
  'ORCH-DEGRADED-CONFLICT': {
    plain: 'AF_HOST_CAPABILITY=full 却用 degraded 台账 → 须改 normal 或改 env',
    who: 'ai',
  },
  'DOC-FIRST-dev数不符': {
    plain: 'dev 文件数与 todo 中 T 头数不一致',
    who: 'ai',
  },
  'DOC-FIRST-OK': {
    plain: '文档先行校验通过，可以写码',
    who: 'ai',
  },
  'SKIP-MODEL-无判定': {
    plain: '跳过了建模但没有写「建模判定：跳过」行',
    who: 'ai',
  },
  'FLOW-ID-RESERVED': {
    plain: 'step id 不能用 fix/revise 等快捷保留字',
    who: 'ai',
  },
  'FLOW-STRICT-SKIP': {
    plain: 'strict 步不能擅自 skip；reason 须含用户原话/意图 cue',
    who: 'ai',
  },
  'FLOW-SKIP-REASON': {
    plain: 'flow 步 skip=true 但缺 reason',
    who: 'ai',
  },
  'AF-ENV-STEP-MISSING': {
    plain: '有 flow.yaml 时须维护 AF_STEP（当前步 id）',
    who: 'ai',
  },
  'AF-ENV-STEP': {
    plain: 'AF_STEP 与 flow 或产物推断不一致',
    who: 'ai',
  },
  'AF-ENV-STEP-PHASE': {
    plain: 'AF_STEP 与 AF_PHASE 未同步（须 AF_PHASE=bandForStep）',
    who: 'ai',
  },
  'ORCH-STEP-ID': {
    plain: '台账每条须有 stepId（当时走到的 flow 步名）',
    who: 'ai',
  },
  'ORCH-STEP-NOT-IN-FLOW': {
    plain: '台账 stepId 不在 flow.yaml steps 中',
    who: 'ai',
  },
  'AF-ENV-STEP-DRIFT': {
    plain: 'AF_STEP 含非 flow steps 的 id（init/快捷/探索不得写入）',
    who: 'ai',
  },
  'ORCH-DIRECT-ID': {
    plain: '总控直做步 role=orch-direct 时 subagentId 须为 orch-direct',
    who: 'ai',
  },
  'AF-ENV-BOOT': {
    plain: '还没选谁决策（启动卡未答）',
    who: 'user',
  },
  'AF-ENV-CAPABILITY-PENDING': {
    plain: '总控首条须声明 AF_HOST_CAPABILITY=full|degraded',
    who: 'ai',
  },
  'DIR-TODO-PATH': {
    plain: 'todo 写错位置（应在 atlas/todo.md 根，不是 solution/todo.md）',
    who: 'ai',
  },
};

/**
 * @param {string} rule
 * @returns {{ plain: string, who: string } | null}
 */
export function getRuleHint(rule) {
  const hit = RULE_HINTS[rule];
  if (hit) {
    const whoLabel =
      hit.who === 'ai' ? 'AI 自修后重跑闸门' : hit.who === 'user' ? '需要你选/确认' : 'AI + 你配合';
    return { plain: hit.plain, who: whoLabel };
  }
  const prefix = rule.split('-').slice(0, 2).join('-');
  if (prefix.startsWith('SOL-')) {
    return { plain: '方案/契约文档不合规', who: 'AI 自修后重跑闸门' };
  }
  if (prefix.startsWith('DEV-') || prefix.startsWith('TODO-')) {
    return { plain: '开发任务文档或勾选证据不合规', who: 'AI 自修后重跑闸门' };
  }
  if (prefix.startsWith('REQ-')) {
    return { plain: '需求文档不合规', who: 'AI 自修后重跑闸门' };
  }
  return null;
}
