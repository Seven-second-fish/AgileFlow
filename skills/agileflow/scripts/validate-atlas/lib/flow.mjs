/**
 * atlas/flow.yaml — 加载 / 解析 / 形状校验 / 步状态
 * 约定 → skills/agileflow/templates/flow.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { collectFiles, exists, readText } from './fs-utils.mjs';
import { hasConfirmedRequirement } from './brownfield.mjs';

export const FLOW_REL = 'atlas/flow.yaml';

/** 旧短 id → af-*（load 时 warn+normalize） */
export const LEGACY_TO_AF_STEP = {
  init: 'af-init',
  req: 'af-req',
  model: 'af-mod',
  mod: 'af-mod',
  sol: 'af-sol',
  dev: 'af-dev',
  test: 'af-test',
  tests: 'af-tests',
};

const BUILTIN_IDS = new Set(['af-init', 'af-req', 'af-mod', 'af-sol', 'af-dev', 'af-test']);
const ROLE_KEYS = new Set(['req', 'model', 'sol', 'dev']);
const MODES = new Set(['strict', 'orch']);

/** flow / 斜杠同名：须 af- 前缀 */
export const AF_STEP_ID_RE = /^af-[a-z][a-z0-9_-]*$/i;

/**
 * @param {string} id
 * @returns {string}
 */
export function normalizeStepId(id) {
  const s = String(id || '');
  if (LEGACY_TO_AF_STEP[s]) return LEGACY_TO_AF_STEP[s];
  return s;
}

/**
 * 就地规范化 steps[].id（兼容旧短名）
 * @param {object} flow
 */
export function normalizeFlowStepIds(flow) {
  if (!Array.isArray(flow?.steps)) return;
  for (const step of flow.steps) {
    if (!step || typeof step.id !== 'string') continue;
    const next = normalizeStepId(step.id);
    if (next !== step.id) {
      console.warn(`[agileflow] flow id 已规范化: ${step.id} → ${next}（请改盘为 af-*）`);
      step.id = next;
    }
  }
}

/**
 * 极简 YAML 子集解析（本 skill flow 模板够用；不引入 js-yaml）
 * 支持：顶层标量、steps 对象数组、字符串/null/bool、字符串数组、`|` 块标量
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function parseFlowYaml(text) {
  const lines = String(text || '').replace(/\t/g, '  ').split(/\r?\n/);
  let i = 0;

  /** @returns {string|null} */
  function peek() {
    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        i += 1;
        continue;
      }
      return raw;
    }
    return null;
  }

  /** @param {string} line */
  function indentOf(line) {
    const m = /^( *)/.exec(line);
    return m ? m[1].length : 0;
  }

  /** @param {string} raw */
  function parseScalar(raw) {
    const v = raw.trim();
    if (v === 'null' || v === '~') return null;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === '[]') return [];
    if (v === '{}') return {};
    // flow 风格内联数组：[a, b] 或 [atlas/logs/x.md]
    if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(',').map((part) => {
        const s = part.trim();
        if (
          (s.startsWith('"') && s.endsWith('"')) ||
          (s.startsWith("'") && s.endsWith("'"))
        ) {
          return s.slice(1, -1);
        }
        return s;
      });
    }
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      return v.slice(1, -1);
    }
    if (v !== '' && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return v;
  }

  /** @param {number} baseIndent */
  function parseBlockScalar(baseIndent) {
    const chunks = [];
    i += 1;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        chunks.push('');
        i += 1;
        continue;
      }
      const ind = indentOf(line);
      if (ind <= baseIndent) break;
      chunks.push(line.slice(baseIndent + 2));
      i += 1;
    }
    return chunks.join('\n').replace(/\n+$/, '');
  }

  /** @param {number} baseIndent */
  function parseList(baseIndent) {
    const list = [];
    while (true) {
      const line = peek();
      if (!line) break;
      const ind = indentOf(line);
      if (ind < baseIndent) break;
      const trimmed = line.trim();
      if (!trimmed.startsWith('- ')) break;
      i += 1;
      const rest = trimmed.slice(2);
      const looksLikeMapItem =
        /^[A-Za-z_][\w-]*\s*:/.test(rest) &&
        !rest.startsWith('"') &&
        !rest.startsWith("'");
      if (looksLikeMapItem) {
        const objIndent = ind + 2;
        /** @type {Record<string, unknown>} */
        const obj = {};
        const col = rest.indexOf(':');
        const key = rest.slice(0, col).trim();
        const rawVal = rest.slice(col + 1).trim();
        if (rawVal === '|' || rawVal === '>') {
          obj[key] = parseBlockScalar(ind);
        } else if (rawVal === '') {
          const next = peek();
          if (next && indentOf(next) > ind) {
            if (next.trim().startsWith('- ')) obj[key] = parseList(indentOf(next));
            else Object.assign(obj, parseMap(indentOf(next)));
          } else {
            obj[key] = null;
          }
        } else {
          obj[key] = parseScalar(rawVal);
        }
        Object.assign(obj, parseMap(objIndent));
        list.push(obj);
      } else if (rest === '|' || rest === '>') {
        list.push(parseBlockScalar(ind));
      } else {
        list.push(parseScalar(rest));
      }
    }
    return list;
  }

  /** @param {number} baseIndent */
  function parseMap(baseIndent) {
    /** @type {Record<string, unknown>} */
    const map = {};
    while (true) {
      const line = peek();
      if (!line) break;
      const ind = indentOf(line);
      if (ind < baseIndent) break;
      if (ind > baseIndent && baseIndent > 0) break;
      if (line.trim().startsWith('- ')) break;
      if (ind !== baseIndent && baseIndent === 0 && ind > 0) {
        // 顶层只接受 indent 0；嵌套由递归处理
      }
      if (baseIndent > 0 && ind !== baseIndent) break;
      if (baseIndent === 0 && ind !== 0) break;

      i += 1;
      const trimmed = line.trim();
      const col = trimmed.indexOf(':');
      if (col === -1) continue;
      const key = trimmed.slice(0, col).trim();
      const rawVal = trimmed.slice(col + 1).trim();
      if (rawVal === '|' || rawVal === '>') {
        map[key] = parseBlockScalar(ind);
      } else if (rawVal === '') {
        const next = peek();
        if (!next || indentOf(next) <= ind) {
          map[key] = null;
        } else if (next.trim().startsWith('- ')) {
          map[key] = parseList(indentOf(next));
        } else {
          map[key] = parseMap(indentOf(next));
        }
      } else {
        map[key] = parseScalar(rawVal);
      }
    }
    return map;
  }

  return parseMap(0);
}

/**
 * @param {string} projectRoot
 */
export function loadFlow(projectRoot) {
  const abs = path.join(projectRoot, FLOW_REL);
  if (!exists(abs)) {
    return { ok: false, missing: true, path: FLOW_REL };
  }
  try {
    const flow = parseFlowYaml(readText(abs));
    normalizeFlowStepIds(flow);
    return { ok: true, flow, path: FLOW_REL };
  } catch (e) {
    return {
      ok: false,
      path: FLOW_REL,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * @param {object} flow
 * @param {string} id
 */
export function getFlowStep(flow, id) {
  const steps = Array.isArray(flow?.steps) ? flow.steps : [];
  const want = normalizeStepId(id);
  return steps.find((s) => s && normalizeStepId(s.id) === want) ?? null;
}

/**
 * @param {object|null|undefined} flow
 * @returns {Array<{id:string, mode?:string, prompt?:*, depends?:*, outputs?:*, skip?:boolean, reason?:string}>}
 */
export function listFlowSteps(flow) {
  if (!Array.isArray(flow?.steps)) return [];
  return flow.steps.filter((s) => s && typeof s.id === 'string');
}

/**
 * 内置闸门档 0–5：内置步用自身 phase；自定义步用左侧最近内置步
 * @param {object|null|undefined} flow
 * @param {string} stepId
 */
export function bandForStep(flow, stepId) {
  const want = normalizeStepId(stepId);
  let lastBuiltinPhase = '1';
  for (const step of listFlowSteps(flow)) {
    const sid = normalizeStepId(step.id);
    if (sid === want) {
      const builtin = BUILTIN_STEP_GATE[sid];
      return builtin ? String(builtin.phase) : lastBuiltinPhase;
    }
    const builtin = BUILTIN_STEP_GATE[sid];
    if (builtin) lastBuiltinPhase = String(builtin.phase);
  }
  return lastBuiltinPhase;
}

/**
 * @param {object|null|undefined} flow
 * @param {string} stepId
 */
export function stepIndex(flow, stepId) {
  const want = normalizeStepId(stepId);
  return listFlowSteps(flow).findIndex((s) => normalizeStepId(s.id) === want);
}

/**
 * steps 序上下一步 id（不跳过 skip）
 * @param {object|null|undefined} flow
 * @param {string} stepId
 * @returns {string|null}
 */
export function nextStep(flow, stepId) {
  const steps = listFlowSteps(flow);
  const idx = stepIndex(flow, stepId);
  if (idx < 0 || idx >= steps.length - 1) return null;
  return steps[idx + 1].id;
}

/**
 * 完成或 skip 后 +1：跳过已 mark skip 的步
 * @param {object|null|undefined} flow
 * @param {string} stepId
 * @returns {string|null}
 */
export function nextEnabledStep(flow, stepId) {
  let cur = stepId;
  while (cur) {
    const n = nextStep(flow, cur);
    if (!n) return null;
    if (!isFlowStepSkipped(flow, n)) return n;
    cur = n;
  }
  return null;
}

/**
 * 单条 output 路径/glob 是否已有落盘
 * @param {string} projectRoot
 * @param {string} pattern
 */
export function outputPatternSatisfied(projectRoot, pattern) {
  const p = String(pattern || '').trim();
  if (!p) return false;
  const abs = path.join(projectRoot, p);
  if (p.endsWith('/')) {
    if (!exists(abs)) return false;
    try {
      return fs.readdirSync(abs).some((f) => !f.startsWith('.'));
    } catch {
      return false;
    }
  }
  if (p.includes('*')) {
    const dir = path.dirname(abs);
    const base = path.basename(p);
    const re = new RegExp(`^${base.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    if (!exists(dir)) return false;
    try {
      return fs.readdirSync(dir).some((f) => re.test(f));
    } catch {
      return false;
    }
  }
  return exists(abs);
}

/**
 * 该步 outputs 是否均已满足
 * @param {string} projectRoot
 * @param {object} step
 */
export function stepOutputsSatisfied(projectRoot, step) {
  const outputs = Array.isArray(step?.outputs) ? step.outputs : [];
  if (outputs.length === 0) return true;
  return outputs.every((out) => outputPatternSatisfied(projectRoot, out));
}

/**
 * 快捷/保留 id，禁止当作 flow step 插入（含旧短名与 af-*）
 */
export const FLOW_RESERVED_IDS = new Set([
  'fix',
  'refactor',
  'tweak',
  'perf',
  'chore',
  'ut',
  'revise',
  'explore',
  'init',
  'af-fix',
  'af-refactor',
  'af-tweak',
  'af-perf',
  'af-chore',
  'af-ut',
  'af-revise',
  'af-explore',
  'af-init',
  'af',
]);

/**
 * 解析 AF_STEP：单 id 或逗号分隔的一波
 * @param {string} raw
 * @returns {string[]}
 */
export function parseAfStep(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {string[]} ids
 */
export function formatAfStep(ids) {
  return (ids || []).filter(Boolean).join(',');
}

/**
 * 门牌前缀 → step id（含 mod/model、tests/test 别名）
 * @param {object|null|undefined} flow
 * @param {string} prefix 不含冒号
 * @returns {string|null}
 */
export function resolvePrefixToStepId(flow, prefix) {
  const raw = String(prefix || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/:$/, '')
    .toLowerCase();
  if (!raw) return null;

  const aliases = {
    mod: 'af-mod',
    model: 'af-mod',
    'af-model': 'af-mod',
    tests: 'af-test',
    test: 'af-test',
    'af-tests': 'af-test',
  };
  const want = normalizeStepId(aliases[raw] || raw);

  const hit = listFlowSteps(flow).find((s) => normalizeStepId(s.id) === want || String(s.id).toLowerCase() === raw);
  return hit ? hit.id : null;
}

/**
 * 当前 flow 可喊的门牌（供路由；含别名）
 * @param {object|null|undefined} flow
 * @returns {string[]}
 */
export function listFlowCommandIds(flow) {
  const ids = listFlowSteps(flow).map((s) => s.id);
  const out = new Set(ids);
  const norm = ids.map((id) => normalizeStepId(id));
  if (norm.includes('af-mod')) {
    out.add('af-mod');
    out.add('af-model');
  }
  if (norm.includes('af-test')) {
    out.add('af-test');
    out.add('af-tests');
  }
  return [...out];
}

/**
 * depends 路径是否被某步 outputs 覆盖（简单：规范化后相等或一方含 * 时前缀/glob 粗匹配）
 * @param {string} dependPath
 * @param {string[]} outputPatterns
 */
function dependCoveredByOutputs(dependPath, outputPatterns) {
  const d = String(dependPath || '').replace(/\\/g, '/');
  for (const o of outputPatterns || []) {
    const op = String(o || '').replace(/\\/g, '/');
    if (!op) continue;
    if (d === op) return true;
    if (op.endsWith('/') && d.startsWith(op)) return true;
    if (d.endsWith('/') && op.startsWith(d)) return true;
    // REQ-*.md vs atlas/requirements/REQ-001-x.md
    if (op.includes('*')) {
      const re = new RegExp(
        `^${op.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
      );
      if (re.test(d)) return true;
    }
    if (d.includes('*') && d.replace(/\*.*$/, '') && op.startsWith(d.replace(/\*.*$/, ''))) {
      return true;
    }
  }
  return false;
}

/**
 * 单条 depend 是否已满足（文件在，或仅来自已 skip 上游的 outputs；
 * 或 soft：没有任何一步的 outputs 会产出该路径 → 不挡调度）
 * @param {string} projectRoot
 * @param {object} flow
 * @param {string} dependPath
 */
export function isDependSatisfied(projectRoot, flow, dependPath) {
  if (outputPatternSatisfied(projectRoot, dependPath)) return true;
  for (const step of listFlowSteps(flow)) {
    if (!isFlowStepSkipped(flow, step.id)) continue;
    const outs = Array.isArray(step.outputs) ? step.outputs : [];
    if (dependCoveredByOutputs(dependPath, outs)) return true;
  }
  const producedBySomeone = listFlowSteps(flow).some((s) =>
    dependCoveredByOutputs(dependPath, Array.isArray(s.outputs) ? s.outputs : []),
  );
  // soft depend（如 glossary）：不由任何 step 产出 → 不阻塞就绪
  if (!producedBySomeone) return true;
  return false;
}

/**
 * 步是否可开干：未 skip、产物未齐、depends 均满足
 * @param {string} projectRoot
 * @param {object} flow
 * @param {object} step
 */
export function isStepReady(projectRoot, flow, step) {
  if (!step?.id) return false;
  if (isFlowStepSkipped(flow, step.id)) return false;
  if (stepOutputsSatisfied(projectRoot, step)) return false;
  const depends = Array.isArray(step.depends) ? step.depends : [];
  if (!depends.every((d) => isDependSatisfied(projectRoot, flow, d))) return false;

  // 若更早的未完成步会产出本步 depends，则必须等它（避免 req 未完就开 model）
  const idx = stepIndex(flow, step.id);
  const steps = listFlowSteps(flow);
  for (let i = 0; i < idx; i++) {
    const earlier = steps[i];
    if (isFlowStepSkipped(flow, earlier.id)) continue;
    if (stepOutputsSatisfied(projectRoot, earlier)) continue;
    const earlierOuts = Array.isArray(earlier.outputs) ? earlier.outputs : [];
    const blockedByEarlier = depends.some((d) => dependCoveredByOutputs(d, earlierOuts));
    if (blockedByEarlier) return false;
  }
  return true;
}

/**
 * 当前就绪波（按 flow 书写序）；depends 已满足的未完成步 naturally 互不阻塞 → 可并行
 * @param {string} projectRoot
 * @param {object} flow
 * @returns {string[]}
 */
export function listParallelWave(projectRoot, flow) {
  return listFlowSteps(flow)
    .filter((s) => isStepReady(projectRoot, flow, s))
    .map((s) => s.id);
}

/**
 * 含指定步的就绪波；若该步尚未 ready，则仅返回该步（用于门牌切入时先落到该步）
 * @param {string} projectRoot
 * @param {object} flow
 * @param {string} stepId
 */
export function waveContaining(projectRoot, flow, stepId) {
  const wave = listParallelWave(projectRoot, flow);
  if (wave.includes(stepId)) return wave;
  if (getFlowStep(flow, stepId) && !isFlowStepSkipped(flow, stepId)) {
    return [stepId];
  }
  return wave;
}

/**
 * 从产物推断当前波（id 列表）；全完成则返回最后一格
 * @param {string} projectRoot
 * @param {object} flow
 * @param {{ brownfield?: boolean }} [opts]
 * @returns {string[]}
 */
export function inferWaveFromFlow(projectRoot, flow, opts = {}) {
  const steps = listFlowSteps(flow);
  if (steps.length === 0) return [];

  if (opts.brownfield) {
    const initReadme = readText(path.join(projectRoot, 'atlas', 'init', 'README.md'));
    if (!initReadme || !/状态[：:]\s*已确认/.test(initReadme)) {
      // greenfield 跑 AF 自造 backend/frontend 后会被 detectBrownfield=true；
      // 若已有已确认 REQ，说明主链已过 init 意图，禁止卡回 steps[0]
      if (!hasConfirmedRequirement(projectRoot)) {
        return steps[0] ? [steps[0].id] : [];
      }
    }
  }

  const wave = listParallelWave(projectRoot, flow);
  if (wave.length > 0) return wave;
  return steps[steps.length - 1] ? [steps[steps.length - 1].id] : [];
}

/**
 * 从 flow + 产物推断当前应在的 step id（波的最左；兼容旧调用）
 * @param {string} projectRoot
 * @param {object} flow
 * @param {{ brownfield?: boolean }} [opts]
 * @returns {string|null}
 */
export function inferStepFromFlow(projectRoot, flow, opts = {}) {
  const wave = inferWaveFromFlow(projectRoot, flow, opts);
  return wave[0] ?? null;
}

/**
 * @param {object|null|undefined} flow
 * @param {string} id
 */
export function isFlowStepSkipped(flow, id) {
  const step = getFlowStep(flow, id);
  return Boolean(step && step.skip === true);
}

/**
 * 校验 prompt 是否是安全的项目内 Markdown 路径。
 * 目的：Flow 可以直接引用 atlas/role/*.md 或项目内 Skill 的 SKILL.md，
 * 但不能用绝对路径或 ../ 越出项目。
 * @param {string} projectRoot
 * @param {string} prompt
 * @returns {{ ok: boolean, rel?: string, abs?: string, reason?: string }}
 */
export function resolveFlowPromptPath(projectRoot, prompt) {
  const raw = String(prompt || '').trim();
  if (!raw || path.isAbsolute(raw)) {
    return { ok: false, reason: '须为项目内相对 Markdown 路径' };
  }
  if (!/\.md$/i.test(raw)) {
    return { ok: false, reason: '须指向 .md 文件' };
  }
  const root = path.resolve(projectRoot);
  const abs = path.resolve(root, raw);
  if (abs !== root && !abs.startsWith(`${root}${path.sep}`)) {
    return { ok: false, reason: '不得用 ../ 离开项目目录' };
  }
  return { ok: true, rel: raw.replace(/\\/g, '/'), abs };
}

/**
 * 形状校验；不因 depends/outputs glob 是否落盘而报错
 * @param {string} projectRoot
 * @param {{ add: Function }} reporter
 * @param {{ requireFile?: boolean }} [opts]
 */
export function validateFlowFile(projectRoot, reporter, opts = {}) {
  const requireFile = opts.requireFile !== false;
  const loaded = loadFlow(projectRoot);

  if (loaded.missing) {
    if (requireFile) {
      reporter.add({
        severity: 'warn',
        rule: 'FLOW-MISSING',
        file: FLOW_REL,
        message:
          '缺少 atlas/flow.yaml（已启用 AF）。请 bootstrap 复制 templates/flow.yaml，或总控按 templates/flow.md 落盘。',
      });
    }
    return loaded;
  }

  if (!loaded.ok) {
    reporter.add({
      severity: 'error',
      rule: 'FLOW-PARSE',
      file: FLOW_REL,
      message: `flow.yaml 解析失败：${loaded.error}`,
    });
    return loaded;
  }

  const flow = loaded.flow;
  if (flow.version !== 1) {
    reporter.add({
      severity: 'error',
      rule: 'FLOW-VERSION',
      file: FLOW_REL,
      message: `flow.yaml version 须为 1，当前：${JSON.stringify(flow.version)}`,
    });
  }

  if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'FLOW-STEPS',
      file: FLOW_REL,
      message: 'flow.yaml 须有非空 steps 数组。',
    });
    return loaded;
  }

  const seen = new Set();
  for (const step of flow.steps) {
    if (!step || typeof step !== 'object') {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-STEP',
        file: FLOW_REL,
        message: 'steps 项须为对象。',
      });
      continue;
    }
    const { id, mode, prompt, criteria, depends, outputs, skip, reason } = step;
    if (!id || typeof id !== 'string') {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-ID',
        file: FLOW_REL,
        message: '每步须有字符串 id。',
      });
      continue;
    }
    if (seen.has(id)) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-ID-DUP',
        file: FLOW_REL,
        message: `重复 id：${id}`,
      });
    }
    seen.add(id);

    if (FLOW_RESERVED_IDS.has(String(id).toLowerCase())) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-ID-RESERVED',
        file: FLOW_REL,
        message: `${id} 为保留门牌（af-fix/af-revise/af-explore…），不可用作 flow 步`,
      });
    }

    if (!AF_STEP_ID_RE.test(String(id))) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-ID-AF',
        file: FLOW_REL,
        message: `${id} 须为 af-* 形态（如 af-req、af-research），与斜杠 /${String(id).startsWith('af-') ? id : 'af-…'} 同名`,
      });
    }

    if (!MODES.has(mode)) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-MODE',
        file: FLOW_REL,
        message: `${id}.mode 须为 strict|orch，当前：${JSON.stringify(mode)}`,
      });
    }

    const promptPath =
      typeof prompt === 'string' && !ROLE_KEYS.has(prompt)
        ? resolveFlowPromptPath(projectRoot, prompt)
        : null;
    const promptOk = prompt === null || ROLE_KEYS.has(prompt) || promptPath?.ok === true;
    if (!promptOk) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-PROMPT',
        file: FLOW_REL,
        message: `${id}.prompt 须为 null 或项目内 Markdown 路径（推荐 atlas/role/role-*.md）${promptPath?.reason ? `：${promptPath.reason}` : ''}`,
      });
    }

    // 旧短名仍可读，避免已有项目升级即坏；新模板与文档不再生成短名。
    if (ROLE_KEYS.has(prompt)) {
      const rolePath = path.join(projectRoot, 'atlas', 'role', `role-${prompt}.md`);
      if (!exists(rolePath)) {
        reporter.add({
          severity: 'error',
          rule: 'FLOW-ROLE',
          file: `atlas/role/role-${prompt}.md`,
          message: `${id}.prompt=${prompt} 但缺少 atlas/role/role-${prompt}.md（先 --bootstrap-scaffold）`,
        });
      }
    } else if (promptPath?.ok) {
      const promptFileExists = exists(promptPath.abs);
      if (!promptFileExists || !fs.statSync(promptPath.abs).isFile()) {
        reporter.add({
          severity: 'error',
          rule: 'FLOW-ROLE',
          file: promptPath.rel,
          message: `${id}.prompt 指向的项目文件不存在或不是文件：${promptPath.rel}`,
        });
      }
    }

    if (mode === 'orch') {
      if (!Array.isArray(criteria) || criteria.length === 0) {
        reporter.add({
          severity: 'error',
          rule: 'FLOW-CRITERIA',
          file: FLOW_REL,
          message: `${id} 为 orch，须有非空 criteria`,
        });
      }
    }

    if (!Array.isArray(depends)) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-DEPENDS',
        file: FLOW_REL,
        message: `${id}.depends 须为数组（可空）`,
      });
    }
    if (!Array.isArray(outputs)) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-OUTPUTS',
        file: FLOW_REL,
        message: `${id}.outputs 须为数组`,
      });
    }

    if (skip === true) {
      if (!reason || String(reason).trim() === '') {
        reporter.add({
          severity: 'error',
          rule: 'FLOW-SKIP-REASON',
          file: FLOW_REL,
          message: `${id}.skip=true 须有非空 reason`,
        });
      }
      if (mode === 'strict') {
        const reasonText = String(reason || '').trim();
        const userCue = /用户|原话|要求跳过|确认跳过|用户说|用户要求|用户确认|用户明示|user\s*(said|asked|confirm)/i;
        if (reasonText.length < 8 || !userCue.test(reasonText)) {
          reporter.add({
            severity: 'error',
            rule: 'FLOW-STRICT-SKIP',
            file: FLOW_REL,
            message: `${id} 为 strict：skip 须在 reason 写明用户原话/意图（含「用户」「原话」等 cue）；总控不得擅自 skip`,
          });
        }
      }
    }

    if (!BUILTIN_IDS.has(id)) {
      if (!Array.isArray(outputs) || outputs.length === 0) {
        reporter.add({
          severity: 'error',
          rule: 'FLOW-INSERT-OUT',
          file: FLOW_REL,
          message: `插入步 ${id} 须有非空 outputs（产物落点）`,
        });
      }
    }

    const paths = [...(depends || []), ...(outputs || [])];
    const badPath = paths.find(
      (p) =>
        typeof p === 'string' &&
        (/atlas\/req\//.test(p) ||
          /atlas\/sol\//.test(p) ||
          /atlas\/solution\/todo\.md/.test(p)),
    );
    if (badPath) {
      reporter.add({
        severity: 'error',
        rule: 'FLOW-PATH-IRON',
        file: FLOW_REL,
        message: `${id} 路径违例（铁律）：${badPath}`,
      });
    }
  }

  return loaded;
}

/**
 * 项目内某步是否 skip（无 flow 或解析失败 → false，走旧兜底）
 * @param {string} projectRoot
 * @param {string} stepId
 */
export function isStepSkipped(projectRoot, stepId) {
  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) return false;
  return isFlowStepSkipped(loaded.flow, stepId);
}

/**
 * 内置步 → 默认闸门 / AF_PHASE（自定义步用 bandForStep 映射左侧内置档）
 */
export const BUILTIN_STEP_GATE = {
  'af-init': { gate: 'init-confirm', phase: 0 },
  'af-req': { gate: 'req-confirm', phase: 1 },
  'af-mod': { gate: 'mod-confirm', phase: 2 },
  'af-sol': { gate: 'sol-confirm', phase: 3 },
  'af-dev': { gate: 'write-code', phase: 4 },
  'af-test': { gate: 'test-entry', phase: 5 },
};

/**
 * 闸门 id → flow step id（用于 skip 短路）
 */
export const GATE_TO_STEP = {
  'init-confirm': 'af-init',
  'req-confirm': 'af-req',
  'mod-confirm': 'af-mod',
  'sol-confirm': 'af-sol',
  'dev-step1-literal': 'af-dev',
  'dev-complete': 'af-dev',
  'write-code': 'af-dev',
  'test-entry': 'af-test',
};

/**
 * 从 skill 模板复制默认 flow.yaml（若不存在）
 * @param {string} projectRoot
 * @param {string} skillRoot
 */
export function ensureFlowYaml(projectRoot, skillRoot) {
  const dest = path.join(projectRoot, FLOW_REL);
  if (exists(dest)) return { created: false, path: dest };
  const src = path.join(skillRoot, 'templates', 'flow.yaml');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (exists(src)) {
    fs.copyFileSync(src, dest);
  } else {
    fs.writeFileSync(
      dest,
      'version: 1\nsteps:\n  - id: af-req\n    mode: strict\n    prompt: atlas/role/role-req.md\n    depends: []\n    outputs:\n      - atlas/requirements/\n',
    );
  }
  return { created: true, path: dest };
}
