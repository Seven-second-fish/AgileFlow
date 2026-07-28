import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, readText } from './fs-utils.mjs';
import { isRoleCustom } from './rules/role-custom.mjs';
import {
  loadFlow,
  getFlowStep,
  bandForStep,
  BUILTIN_STEP_GATE,
  resolveFlowPromptPath,
} from './flow.mjs';

/** @typedef {'req'|'model'|'sol'|'dev'} RoleKey */

const ROLE_KEYS = new Set(['req', 'model', 'sol', 'dev']);

/** 各 role 分层规格：always 每次派活必带；onDemand 按需（gate 红 / 首 T 等） */
export const ROLE_LAYER_SPEC = {
  req: { always: ['core', 'return'], onDemand: ['quality'] },
  model: { always: ['core', 'return'], onDemand: ['quality'] },
  sol: { always: ['core', 'return'], onDemand: ['quality'] },
  dev: { always: ['core', 'return'], onDemand: ['quality', 'examples'] },
};

const ROLE_TITLES = {
  req: 'REQ Writer — 阶段 1 需求 Agent',
  model: 'Model Writer — 阶段 2 建模 Agent',
  sol: 'Sol Writer — 阶段 3 方案 Agent',
  dev: 'Dev Worker — 阶段 4 单任务全交付 Agent',
};

/**
 * 定位 skill 根（与 atlas-scaffold 一致）
 * @returns {string}
 */
export function resolveSkillRoot() {
  if (process.env.AGILEFLOW_SKILL_ROOT) return process.env.AGILEFLOW_SKILL_ROOT;
  const here = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(here), '..', '..', '..');
}

/**
 * 读取单层 markdown
 * @param {string} skillRoot
 * @param {RoleKey} roleKey
 * @param {string} layerName
 */
function readLayerFile(skillRoot, roleKey, layerName) {
  const abs = path.join(skillRoot, 'templates', 'role', 'layers', roleKey, `${layerName}.md`);
  if (!exists(abs)) {
    throw new Error(`缺少 role 层文件: templates/role/layers/${roleKey}/${layerName}.md`);
  }
  return readText(abs).trimEnd();
}

/**
 * 从 skill layers 拼装默认 role prompt 正文
 * @param {RoleKey} roleKey
 * @param {string} [skillRoot]
 * @param {{ includeQuality?: boolean, includeExamples?: boolean }} [opts]
 */
export function assembleSkillLayers(roleKey, skillRoot = resolveSkillRoot(), opts = {}) {
  const spec = ROLE_LAYER_SPEC[roleKey];
  if (!spec) throw new Error(`未知 roleKey: ${roleKey}`);

  const { includeQuality = false, includeExamples = false } = opts;
  /** @type {string[]} */
  const layerNames = [...spec.always];
  if (includeQuality) layerNames.push('quality');
  if (includeExamples && spec.onDemand.includes('examples')) layerNames.push('examples');

  const parts = layerNames.map((name) => readLayerFile(skillRoot, roleKey, name));
  const title = ROLE_TITLES[roleKey] ?? roleKey;
  return `# ${title}\n\n<!-- assembled from skill layers: ${layerNames.join(', ')} -->\n\n${parts.join('\n\n---\n\n')}\n`;
}

/**
 * 读取 atlas 侧 role 文件全文（custom 模式）
 * @param {string} projectRoot
 * @param {RoleKey} roleKey
 */
export function readAtlasRoleBody(projectRoot, roleKey) {
  const abs = path.join(projectRoot, 'atlas', 'role', `role-${roleKey}.md`);
  if (!exists(abs)) {
    throw new Error(`缺少 atlas/role/role-${roleKey}.md（先 --bootstrap-scaffold）`);
  }
  return readText(abs);
}

/**
 * 把 flow.yaml 的 prompt 定位到项目内文件。
 * 目的：允许用户直接写 atlas/role/role-*.md 或项目内 Skill 的 SKILL.md，
 * 同时拒绝绝对路径和 ../，避免 prompt 意外读出项目目录。
 * @param {string} projectRoot
 * @param {string} promptPath
 * @returns {string}
 */
function resolveProjectPromptPath(projectRoot, promptPath) {
  const resolved = resolveFlowPromptPath(projectRoot, promptPath);
  if (!resolved.ok) {
    throw new Error(`prompt 路径无效：${String(promptPath || '')}（${resolved.reason}）`);
  }
  if (!exists(resolved.abs)) {
    throw new Error(`prompt 文件不存在：${resolved.rel}`);
  }
  if (!fs.statSync(resolved.abs).isFile()) {
    throw new Error(`prompt 须指向文件而不是目录：${resolved.rel}`);
  }
  return resolved.abs;
}

/**
 * 从显式项目 Role 路径识别内置角色。
 * 目的：默认 Flow 暴露完整路径，但仍保留默认 role 的分层渐进组装能力。
 * 旧 req/model/sol/dev 短名只作为历史配置兼容。
 * @param {string} promptRef
 * @returns {RoleKey|null}
 */
function builtinRoleKeyFromPrompt(promptRef) {
  const raw = String(promptRef || '').trim().replace(/\\/g, '/');
  if (ROLE_KEYS.has(raw)) return /** @type {RoleKey} */ (raw);
  const match = /^atlas\/role\/role-(req|model|sol|dev)\.md$/i.exec(raw);
  return match ? /** @type {RoleKey} */ (match[1].toLowerCase()) : null;
}

/**
 * 解析 flow prompt：
 * - 内置项目 Role 路径 → 未改 stamp 时按 layers 渐进组装，已改时读项目全文；
 * - 其他项目内 Markdown/Skill 文件 → 原样读取并作为自定义提示词；
 * - req/model/sol/dev 短名 → 仅兼容旧 flow。
 * @param {string} projectRoot
 * @param {RoleKey|string} promptRef
 * @param {{ skillRoot?: string, includeQuality?: boolean, includeExamples?: boolean }} [ctx]
 * @returns {{ mode: 'custom'|'assembled', body: string }}
 */
export function resolveRolePrompt(projectRoot, promptRef, ctx = {}) {
  const skillRoot = ctx.skillRoot ?? resolveSkillRoot();
  const rawPrompt = String(promptRef || '').trim();
  // 显式路径必须先验证；旧短名没有路径可验，只保留兼容分支。
  const promptPath = ROLE_KEYS.has(rawPrompt)
    ? null
    : resolveProjectPromptPath(projectRoot, rawPrompt);
  const roleKey = builtinRoleKeyFromPrompt(promptRef);
  if (!roleKey) {
    return { mode: 'custom', body: readText(promptPath) ?? '' };
  }
  if (isRoleCustom(projectRoot, roleKey)) {
    return { mode: 'custom', body: readAtlasRoleBody(projectRoot, roleKey) };
  }
  return {
    mode: 'assembled',
    body: assembleSkillLayers(roleKey, skillRoot, {
      includeQuality: Boolean(ctx.includeQuality),
      includeExamples: Boolean(ctx.includeExamples),
    }),
  };
}

/**
 * @typedef {Object} TaskEnvelopeInput
 * @property {number|string} phase
 * @property {string} [decide]
 * @property {string} [summary]
 * @property {string[]} [upstreamPaths]
 * @property {string[]} [expectedOutputs]
 * @property {string} [gate]
 * @property {string} [taskId]
 * @property {string} [modelVerdict]
 * @property {boolean} [parallel]
 * @property {string} [activeEditsLine]
 * @property {string} [stepId]
 * @property {boolean} [templateMode]
 */

/**
 * 薄任务信封（只列路径与 gate，不贴上游正文）
 * @param {TaskEnvelopeInput} task
 */


/**
 * 从 flow 步生成薄任务信封字段（供 formatDispatchPrompt 使用）
 * @param {string} projectRoot
 * @param {string} stepId
 * @param {Partial<TaskEnvelopeInput>} [extras]
 * @returns {TaskEnvelopeInput}
 */
export function stepToDispatchEnvelope(projectRoot, stepId, extras = {}) {
  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) {
    throw new Error('缺少 atlas/flow.yaml，无法从步生成派活信封');
  }
  const step = getFlowStep(loaded.flow, stepId);
  if (!step) {
    throw new Error(`flow.yaml 中无步 id=${stepId}`);
  }
  const phase = bandForStep(loaded.flow, stepId);
  const gate = BUILTIN_STEP_GATE[stepId]?.gate;
  return {
    stepId,
    phase,
    gate,
    upstreamPaths: Array.isArray(step.depends) ? [...step.depends] : [],
    expectedOutputs: Array.isArray(step.outputs) ? [...step.outputs] : [],
    ...extras,
  };
}

export function buildTaskEnvelope(task) {
  const lines = ['## 本次任务（总控注入）', ''];
  if (task.stepId) lines.push(`- Flow 步：${task.stepId}`);
  lines.push(`- 阶段：${task.phase}`);
  if (task.decide) lines.push(`- 决策：${task.decide}`);
  if (task.summary) lines.push(`- 任务一句话：${task.summary}`);
  if (task.modelVerdict) lines.push(`- 判定：${task.modelVerdict}`);
  if (task.taskId) lines.push(`- Tid：${task.taskId}`);

  if (task.upstreamPaths?.length) {
    lines.push('- 上游路径（Read 工具读盘，禁止复述正文）：');
    for (const p of task.upstreamPaths) lines.push(`  - ${p}`);
  }
  if (task.expectedOutputs?.length) {
    lines.push('- 产物期望：');
    for (const p of task.expectedOutputs) lines.push(`  - ${p}`);
  }
  if (task.gate) lines.push(`- 须过 gate：\`${task.gate}\``);
  if (task.parallel != null) {
    lines.push(`- 并发：${task.parallel ? '是' : '否'}${task.activeEditsLine ? `，active-edits：${task.activeEditsLine}` : ''}`);
  }
  if (task.templateMode) lines.push('- Template：读 `atlas/template/` 对应目录（读盘，勿复述）');

  return `${lines.join('\n')}\n`;
}

/**
 * 拼装完整 Subagent prompt = role 正文 + 任务信封
 * @param {string} roleBody
 * @param {TaskEnvelopeInput} task
 */
export function formatDispatchPrompt(roleBody, task) {
  const envelope = buildTaskEnvelope(task);
  const body = String(roleBody).trimEnd();
  return `${body}\n\n---\n\n${envelope}`;
}

/**
 * 列出某 role 在 skill 侧应有的层文件（供测试 / 文档）
 * @param {RoleKey} roleKey
 */
export function listRequiredLayerFiles(roleKey) {
  const spec = ROLE_LAYER_SPEC[roleKey];
  return [...new Set([...spec.always, ...spec.onDemand])].map(
    (name) => `templates/role/layers/${roleKey}/${name}.md`,
  );
}

/**
 * 校验 skill 侧 layers 目录完整
 * @param {string} [skillRoot]
 * @returns {{ ok: boolean, missing: string[] }}
 */
export function validateSkillLayers(skillRoot = resolveSkillRoot()) {
  /** @type {string[]} */
  const missing = [];
  for (const roleKey of Object.keys(ROLE_LAYER_SPEC)) {
    for (const rel of listRequiredLayerFiles(/** @type {RoleKey} */ (roleKey))) {
      if (!exists(path.join(skillRoot, rel))) missing.push(rel);
    }
  }
  return { ok: missing.length === 0, missing };
}
