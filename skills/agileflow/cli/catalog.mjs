/**
 * 门牌 skill catalog（内置）
 * scope: flow=受 flow.yaml 管理 | pre-flow/routing/quick=主链外 | alias=门牌别名
 */

/** @typedef {'flow'|'pre-flow'|'routing'|'quick'|'alias'} AfScope */

/**
 * @typedef {object} CatalogEntry
 * @property {string} id
 * @property {string} prefix
 * @property {string} description
 * @property {AfScope} scope
 * @property {'full'|'quick'|'pre-flow'|'routing'} kind
 * @property {string|null} phaseRel
 * @property {string|null} gate
 * @property {string[]} [aliases]
 * @property {string} [aliasOf] canonical flow step id（scope=alias）
 * @property {boolean} [custom] 来自项目 flow.yaml 自定义步
 * @property {boolean} [inDefaultFlow] 默认 templates/flow.yaml 内置
 */

/** @type {CatalogEntry[]} */
export const BUILTIN_CATALOG = [
  {
    id: 'af-init',
    prefix: '/af-init',
    description: '项目盘点（brownfield）',
    scope: 'pre-flow',
    kind: 'pre-flow',
    phaseRel: 'phases/00-project-init.md',
    gate: 'init-confirm',
  },
  {
    id: 'af',
    prefix: '/af',
    description: '万能自动路由（默认入口）',
    scope: 'routing',
    kind: 'routing',
    phaseRel: 'phases/00-intent-routing.md',
    gate: null,
  },
  {
    id: 'af-explore',
    prefix: '/af-explore',
    description: '探索支路（非正式阶段）',
    scope: 'routing',
    kind: 'routing',
    phaseRel: null,
    gate: null,
  },
  {
    id: 'af-req',
    prefix: '/af-req',
    description: '需求阶段',
    scope: 'flow',
    kind: 'full',
    inDefaultFlow: true,
    phaseRel: 'phases/01-requirement.md',
    gate: 'req-confirm',
  },
  {
    id: 'af-mod',
    prefix: '/af-mod',
    description: '建模阶段',
    scope: 'flow',
    kind: 'full',
    inDefaultFlow: true,
    phaseRel: 'phases/02-modeling.md',
    gate: 'mod-confirm',
    aliases: ['af-model'],
  },
  {
    id: 'af-sol',
    prefix: '/af-sol',
    description: '方案阶段',
    scope: 'flow',
    kind: 'full',
    inDefaultFlow: true,
    phaseRel: 'phases/03-solution-design.md',
    gate: 'sol-confirm',
  },
  {
    id: 'af-dev',
    prefix: '/af-dev',
    description: '开发阶段',
    scope: 'flow',
    kind: 'full',
    inDefaultFlow: true,
    phaseRel: 'phases/04-development.md',
    gate: 'write-code',
  },
  {
    id: 'af-test',
    prefix: '/af-test',
    description: '验收（可分层）',
    scope: 'flow',
    kind: 'full',
    inDefaultFlow: true,
    phaseRel: 'phases/05-testing.md',
    gate: 'test-entry',
  },
  {
    id: 'af-tests',
    prefix: '/af-tests',
    description: '验收全量阶段 5',
    scope: 'alias',
    kind: 'full',
    aliasOf: 'af-test',
    phaseRel: 'phases/05-testing.md',
    gate: 'test-entry',
  },
  {
    id: 'af-fix',
    prefix: '/af-fix',
    description: '快捷修 bug',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
  {
    id: 'af-refactor',
    prefix: '/af-refactor',
    description: '快捷重构',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
  {
    id: 'af-tweak',
    prefix: '/af-tweak',
    description: '快捷微调',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
  {
    id: 'af-perf',
    prefix: '/af-perf',
    description: '快捷性能',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
  {
    id: 'af-chore',
    prefix: '/af-chore',
    description: '快捷杂务',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
  {
    id: 'af-ut',
    prefix: '/af-ut',
    description: '快捷补测',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
  {
    id: 'af-revise',
    prefix: '/af-revise',
    description: '快捷修订已有设计+代码',
    scope: 'quick',
    kind: 'quick',
    phaseRel: 'phases/quick-commands.md',
    gate: null,
  },
];

const BUILTIN_IDS = new Set(BUILTIN_CATALOG.map((e) => e.id));
for (const e of BUILTIN_CATALOG) {
  for (const a of e.aliases || []) BUILTIN_IDS.add(a);
}

/** 安全的 step id：与斜杠同名，须 af- 前缀 */
export const SAFE_STEP_ID = /^af-[a-z][a-z0-9_-]*$/i;

/**
 * @param {string} id
 */
export function isBuiltinId(id) {
  return BUILTIN_IDS.has(id);
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function isSafeStepId(id) {
  return typeof id === 'string' && SAFE_STEP_ID.test(id) && !id.includes('..');
}

/**
 * flow 步 canonical id（alias 门牌 → 真实 stepId）
 * @param {CatalogEntry} entry
 * @returns {string}
 */
export function canonicalStepId(entry) {
  if (entry.scope === 'alias' && entry.aliasOf) return entry.aliasOf;
  return entry.id;
}

/**
 * @param {string} id
 * @returns {CatalogEntry|undefined}
 */
export function getBuiltin(id) {
  return BUILTIN_CATALOG.find((e) => e.id === id || (e.aliases || []).includes(id));
}

/**
 * 自定义 flow 步 → catalog 条目
 * @param {{ id: string, mode?: string, outputs?: string[] }} step
 * @returns {CatalogEntry}
 */
export function customEntryFromStep(step) {
  const outs = Array.isArray(step.outputs) ? step.outputs.join(', ') : '';
  return {
    id: step.id,
    prefix: `/${step.id}`,
    description: `自定义步 ${step.id}${step.mode ? ` (${step.mode})` : ''}${outs ? ` → ${outs}` : ''}`,
    scope: 'flow',
    kind: 'full',
    custom: true,
    phaseRel: null,
    gate: null,
  };
}

/**
 * catalog → scopes 摘要（写入 agileflow-cli.json）
 * @param {CatalogEntry[]} catalog
 */
export function catalogScopesSummary(catalog) {
  /** @type {Record<string, { scope: AfScope, aliasOf?: string, gate?: string|null }>} */
  const scopes = {};
  for (const e of catalog) {
    scopes[e.id] = {
      scope: e.scope,
      ...(e.aliasOf ? { aliasOf: e.aliasOf } : {}),
      ...(e.gate !== undefined ? { gate: e.gate } : {}),
    };
  }
  return scopes;
}

/**
 * 命令文件名 / Cursor name（id 已是 af-req，禁止再拼 af-）
 * @param {string} id
 */
export function commandStem(id) {
  return id;
}
