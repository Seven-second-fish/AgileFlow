/**

 * Agileflow 各阶段目录/文件规范（单一来源）

 */



/** @typedef {'0'|'1'|'2'|'3'|'4'|'5'|'all'} PhaseId */



export const PHASE_DIRS = {

  '0': {

    id: 'init',

    dirs: [

      { path: 'init', required: true, brownfieldOnly: true },

      { path: 'init/codebase', required: false, brownfieldOnly: true },

      { path: 'init/data', required: false, brownfieldOnly: true },

    ],

    files: [

      { path: 'init/README.md', required: true },

      { path: 'init/p0-business.md', required: true },

    ],

  },

  '1': {

    id: 'req',

    dirs: [{ path: 'requirements', required: true }],

    files: [

      { path: 'README.md', required: true },

      { path: 'requirements/README.md', required: true },

    ],

  },

  '2': {

    id: 'mod',

    dirs: [

      { path: 'model', required: true },

      { path: 'model/conceptual', required: true },

      { path: 'model/entities', required: true },

    ],

    files: [

      { path: 'README.md', required: true },

      { path: 'model/README.md', required: true },

      { path: 'model/conceptual/entity-relations.md', required: true },

      { path: 'model/conceptual/domain-rules.md', required: true },

    ],

  },

  '3': {

    id: 'sol',

    dirs: [

      { path: 'solution', required: true },

      { path: 'solution/features', required: true },

      { path: 'solution/contracts', required: false },

    ],

    files: [

      { path: 'README.md', required: true },

      { path: 'solution/README.md', required: true },

      { path: 'solution/architecture.md', required: true },

      { path: 'todo.md', required: true },

    ],

  },

  '4': {

    id: 'dev',

    dirs: [{ path: 'dev', required: true }],

    files: [

      { path: 'README.md', required: true },

      { path: 'todo.md', required: true },

    ],

  },

  '5': {

    id: 'test',

    dirs: [
      { path: 'tests', required: true },
      { path: 'logs', required: true },
    ],

    files: [

      { path: 'README.md', required: true },

      { path: 'tests/README.md', required: true },

    ],

  },

};



/**

 * dev 必填段（统一叙述五段式）

 */

export const DEV_SECTIONS = [

  { id: 'summary', heading: '## 摘要' },

  { id: 'flow', heading: '## 主流程' },

  { id: 'edge', heading: '## 边界' },

  { id: 'impl', heading: '## 实现说明' },

  { id: 'result', heading: '## 结果' },

];

/** @deprecated 与 DEV_SECTIONS 相同 */

export const DEV_SECTIONS_FE = DEV_SECTIONS;



/** 主流程最少编号步数 */

export const DEV_MIN_STEPS = 3;



/** @deprecated 兼容旧引用 */

export const DEV_MIN_PURPOSE_STEPS = DEV_MIN_STEPS;



/** 质量定义（keys 兼容旧调用，值相同） */

const UNIFIED_QUALITY = {

  label: '质量要求',

  sections: ['summary', 'flow', 'edge', 'impl', 'result'],

  literalCheck: true,

  fakeHeadingCheck: true,

  minDocLength: 500,

  requireSummary: true,

  requireStructuredSummary: true,

  /** @deprecated 名称遗留；现指叙述五段式厚度，非 4 列流程表 */
  requireFlowTable: true,

};



export const RISK_TIERS = {

  full: UNIFIED_QUALITY,

};



export const AI_GATES = {

  'init-confirm': {

    phase: '0',

    modules: ['af-env', 'dir', 'init', 'doc-first', 'af-commands'],
    docFirstScope: 'integrity',

    when: 'init 落盘完成 · AskQuestion 确认前',

    blocking: true,

    extra: '须维护 atlas/agileflow.env（AF_PHASE=0）',

  },

  'req-confirm': {

    phase: '1',

    modules: ['af-env', 'dir', 'req', 'doc-first', 'dispatch-ledger', 'af-commands'],
    docFirstScope: 'integrity',

    when: 'REQ 落盘 · 需求确认卡前',

    blocking: true,

    extra: '须 AF_PHASE=1；与产物推断一致',

  },

  'mod-confirm': {

    phase: '2',

    modules: ['af-env', 'dir', 'model', 'doc-first', 'dispatch-ledger', 'af-commands'],
    docFirstScope: 'integrity',

    when: 'model 落盘 · 建模确认前',

    blocking: true,

  },

  'sol-confirm': {

    phase: '3',

    modules: ['af-env', 'dir', 'sol', 'todo', 'req-confirmed', 'doc-first', 'dispatch-ledger', 'af-commands'],
    docFirstScope: 'integrity',

    when: '方案+todo 落盘 · 方案确认/阶段闸门前',

    blocking: true,

    extra:

      'agileflow.env + architecture + 有REQ须F-*.md + REQ已确认 + model已确认或正式跳过判定；UI链API须字段绑定；AF_DECIDE=user 须栈来源已问；=ai 须 AI决策记录',

  },

  'dev-step1-literal': {

    phase: '4',

    modules: ['dev-step1-literal', 'dispatch-ledger', 'af-commands'],

    when: '单个 T 的 dev ① 落盘 · 勾 todo ① 前',

    blocking: true,

    extra:

      '全端：摘要五 bullet + 主流程(3～8)+边界(≥2 挂第N步)+实现说明(目的/做什么/怎么做；逻辑块编号≥2)；字面量严检；单档 full 不减厚度',

  },

  'dev-complete': {

    phase: '4',

    modules: ['af-env', 'dir', 'todo', 'dev', 'runnable', 'pixel', 'doc-first', 'req-ac-backfill', 'dispatch-ledger', 'af-commands'],
    docFirstScope: 'integrity',

    when: '全部 T ③ 完成 · 标「开发实现 ✅」前',

    blocking: true,

    extra:
      'AF_PHASE=4；dev 文件数=T 头数；勾①②③须有文件/可运行证据（TODO-CHECK-*）；## 结果可运行；REQ AC 须已回填（禁仍「③ 后填」）；强制原型须 fe-pixel PASS',

  },

  'test-entry': {

    phase: '5',

    modules: ['af-env', 'dir', 'tests', 'todo', 'runnable', 'smoke', 'pixel', 'doc-first', 'req-ac-backfill', 'dispatch-ledger', 'af-commands'],
    docFirstScope: 'integrity',

    when: '进入阶段 5 · 测试入场门禁前',

    blocking: true,

    extra:
      'AF_PHASE=5；同会话增量 / 跨会话全量；REQ AC 须已回填；强制原型须 fe-pixel PASS；有 FE 时须 fe-smoke-report.json + 截图 + visual-review 全 PASS',

  },

  'write-code': {
    phase: 'all',
    modules: ['af-env', 'doc-first', 'dispatch-ledger', 'af-commands'],
    docFirstScope: 'write-code',
    when: 'Write 业务源码前 · 文档先行硬锁（ai/user 无差别）',
    blocking: true,
    extra: '完整 Flow + 有源码 → REQ/sol/dev① 格式全过才绿；快捷轨按自身边界执行',
  },
  'req-trace': {

    phase: '5',

    modules: ['trace'],

    when: '阶段 5 · 验收归档前 · 检查需求追溯链完整性',

    blocking: true,

    extra: 'REQ→F→T→AC→验收报告 链路检查；AC ID 须逐条被 F/dev/tests 引用，缺失阻塞归档',

  },

};

