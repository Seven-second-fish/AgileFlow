import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { collectFiles, exists, rel, readText } from '../fs-utils.mjs';
import { loadAfEnv } from '../af-env.mjs';
import { validateFlowScope } from '../scope.mjs';
import { isStepSkipped } from '../flow.mjs';
import { detectBusinessSource } from '../brownfield.mjs';

/** 派活台账（与 agileflow.env 同级，项目 atlas/ 内） */
export const DISPATCH_LEDGER_REL = 'atlas/agileflow-dispatch.json';

/** 旧路径（可读以迁移；warn 硬挡，bootstrap 不再写入） */
export const DISPATCH_LEDGER_LEGACY_RELS = [
  'atlas/.agileflow-dispatch.json',
  '.cursor/agileflow-dispatch.json',
];

/** Subagent 派活提示（Cursor 宿主用 Task 工具） */
const DISPATCH_SUBAGENT_HINT = '须先派 Subagent 派 role-{role}（Cursor=Task）';

/** @typedef {'req-confirm'|'mod-confirm'|'sol-confirm'|'dev-step1-literal'|'write-code'|'dev-complete'|'test-entry'} DispatchGateId */

/** 写码/收口闸门：须连带验上游 role 派活（防 Hy3 类「只派写码、跳过 req/model/sol」） */
const WRITE_CODE_CHAIN_GATES = new Set(['write-code', 'dev-complete', 'test-entry']);

/**
 * 闸门路径也须校验台账 stepId 在 flow.yaml steps 内（与 validateFlowScope 一致）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function reportLedgerFlowScope(projectRoot, reporter) {
  for (const issue of validateFlowScope(projectRoot)) {
    if (issue.rule !== 'ORCH-STEP-NOT-IN-FLOW') continue;
    reporter.add({
      severity: issue.level === 'error' ? 'error' : 'warn',
      rule: issue.rule,
      file: issue.file,
      message: issue.message,
      fix: issue.fix,
    });
  }
}

/**
 * 解析台账 JSON（优先权威路径；旧路径可读但 gate warn 硬挡）
 * @param {string} projectRoot
 * @returns {{ ok: true, ledger: { version?: number, mode?: string, entries: object[] }, legacyFrom?: string } | { ok: false, reason: 'missing'|'invalid', error?: string }}
 */
export function loadDispatchLedger(projectRoot) {
  const candidates = [DISPATCH_LEDGER_REL, ...DISPATCH_LEDGER_LEGACY_RELS];
  for (let i = 0; i < candidates.length; i++) {
    const relPath = candidates[i];
    const abs = path.join(projectRoot, relPath);
    if (!exists(abs)) continue;
    try {
      const raw = fs.readFileSync(abs, 'utf8');
      const ledger = JSON.parse(raw);
      if (!ledger || typeof ledger !== 'object') {
        return { ok: false, reason: 'invalid', error: '根对象须为 JSON 对象' };
      }
      if (!Array.isArray(ledger.entries)) {
        return { ok: false, reason: 'invalid', error: '缺少 entries 数组' };
      }
      const legacyFrom = i > 0 ? relPath : undefined;
      return { ok: true, ledger, legacyFrom };
    } catch (e) {
      return { ok: false, reason: 'invalid', error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { ok: false, reason: 'missing' };
}

/**
 * 创建空台账结构
 * @param {'normal'|'degraded-single-session'} [mode]
 */
export function createEmptyLedger(mode = 'normal') {
  return {
    version: 1,
    mode,
    entries: [],
  };
}

/**
 * 台账是否处于无 Subagent 降级模式（跳过 ORCH 校验）
 * @param {unknown} ledger
 */
export function isDegradedDispatchMode(ledger) {
  return ledger?.mode === 'degraded-single-session';
}

/**
 * 将台账 paths 模式转为 RegExp（`*` 按段通配，如 `REQ-001-*.md`、`model/**`）
 * @param {string} pattern 如 atlas/requirements/REQ-001-*.md
 */
function pathPatternToRegExp(pattern) {
  const norm = String(pattern).replace(/\\/g, '/').replace(/^\.\//, '');
  if (norm.includes('*')) {
    const escaped = norm.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  }
  return new RegExp(`^${norm.replace(/[.+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/**
 * 判断 ledger entry 的 paths 是否覆盖目标文件
 * @param {{ paths?: string[] }} entry
 * @param {string} targetRel 相对项目根，正斜杠
 */
function entryCoversPath(entry, targetRel) {
  const paths = entry.paths ?? [];
  return paths.some((p) => pathPatternToRegExp(p).test(targetRel));
}

/**
 * 从 dev 文件名提取 Tid（T-001-login-BE.md → T-001）
 * @param {string} devFileAbs
 * @param {string} projectRoot
 */
function extractTaskIdFromDevFile(devFileAbs, projectRoot) {
  const base = path.basename(devFileAbs);
  const m = base.match(/^(T-\d+)/);
  return m ? m[1] : null;
}

/**
 * 列出 atlas/dev 下合规 T 级 dev 文件（相对路径）
 * @param {string} projectRoot
 */
function listDevTaskFiles(projectRoot) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return [];
  return fs
    .readdirSync(devRoot)
    .filter((f) => /^T-\d+-.+\.md$/.test(f) && !f.includes('README'))
    .map((f) => rel(projectRoot, path.join(devRoot, f)).replace(/\\/g, '/'));
}

/**
 * 列出 REQ 文件（相对路径）
 * @param {string} projectRoot
 */
function listReqFiles(projectRoot) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return [];
  return collectFiles(reqRoot, '.md')
    .filter((f) => /REQ-\d+/.test(path.basename(f)))
    .map((f) => rel(projectRoot, f).replace(/\\/g, '/'));
}

/**
 * 列出 model 落盘文件（相对路径；无 model/ 目录则空）
 * @param {string} projectRoot
 */
function listModelDispatchTargets(projectRoot) {
  const modelRoot = path.join(projectRoot, 'atlas', 'model');
  if (!exists(modelRoot)) return [];
  return collectFiles(modelRoot, '.md')
    .filter((f) => !f.replace(/\\/g, '/').includes('/temp/'))
    .map((f) => rel(projectRoot, f).replace(/\\/g, '/'));
}

/**
 * 列出 sol 落盘关键文件（architecture + F-*.md + contracts）
 * @param {string} projectRoot
 */
function listSolDispatchTargets(projectRoot) {
  const solRoot = path.join(projectRoot, 'atlas', 'solution');
  if (!exists(solRoot)) return [];
  /** @type {string[]} */
  const targets = [];
  const arch = path.join(solRoot, 'architecture.md');
  if (exists(arch)) {
    targets.push(rel(projectRoot, arch).replace(/\\/g, '/'));
  }
  const featRoot = path.join(solRoot, 'features');
  if (exists(featRoot)) {
    for (const f of collectFiles(featRoot, '.md')) {
      if (/F-\d+/.test(path.basename(f))) {
        targets.push(rel(projectRoot, f).replace(/\\/g, '/'));
      }
    }
  }
  const contractRoot = path.join(solRoot, 'contracts');
  if (exists(contractRoot)) {
    for (const f of collectFiles(contractRoot, '.md')) {
      targets.push(rel(projectRoot, f).replace(/\\/g, '/'));
    }
  }
  return targets;
}

/**
 * 查找匹配 role 的台账条目
 * @param {Array<{ role?: string, taskId?: string|null }>} entries
 * @param {string} role
 */
function entriesForRole(entries, role) {
  return entries.filter((e) => e.role === role);
}

/**
 * 降级台账：须 degradedReason；校验 allow 文件；返回 true 表示可继续（仍要验 path 覆盖）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ degradedReason?: string }} ledger
 * @returns {boolean}
 */
function validateDegradedLedger(projectRoot, reporter, ledger) {
  const reason = String(ledger.degradedReason ?? '').trim();
  if (!reason) {
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DEGRADED-REASON',
      file: DISPATCH_LEDGER_REL,
      message:
        '降级单会话模式须填写 degradedReason（为何宿主无 Subagent/Task）；缺则禁止跳过 ORCH 校验。',
    });
    return false;
  }

  const envLoaded = loadAfEnv(projectRoot);
  if (envLoaded.ok && envLoaded.state.hostCapability === 'full') {
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DEGRADED-CONFLICT',
      file: DISPATCH_LEDGER_REL,
      message:
        'AF_HOST_CAPABILITY=full 但台账 mode=degraded-single-session → 滥用降级或 env 未同步；须 normal + subagentId。',
    });
    return false;
  }

  const home = os.homedir();
  const inFixture = projectRoot.includes(`${path.sep}fixtures${path.sep}`);
  const cursorish =
    exists(path.join(projectRoot, '.cursor')) ||
    exists(path.join(projectRoot, '.claude')) ||
    exists(path.join(projectRoot, '.qoder')) ||
    (!inFixture &&
      (exists(path.join(home, '.cursor', 'skills')) ||
        exists(path.join(home, '.claude', 'skills')) ||
        exists(path.join(home, '.qoder', 'skills'))));
  const allowPath = path.join(projectRoot, 'atlas', 'logs', 'af-allow-degraded.md');
  if (cursorish && !exists(allowPath)) {
    reporter.add({
      severity: 'error',
      rule: 'ORCH-DEGRADED-UNPROVEN',
      file: DISPATCH_LEDGER_REL,
      message:
        '检测到 Cursor/Claude/Qoder skill 目录：疑似具备 Subagent，禁止口头 degraded。须落盘 atlas/logs/af-allow-degraded.md（写明宿主确无 Task 的证据）。',
    });
    return false;
  }

  if (exists(allowPath)) {
    const allowText = readText(allowPath) || '';
    const compact = allowText.replace(/\s/g, '');
    const hasEvidence = /无\s*(Task|Subagent)|没有\s*(Task|Subagent)|不具备.*(Task|Subagent)|宿主确无/i.test(
      allowText,
    );
    if (compact.length < 40 || !hasEvidence) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-DEGRADED-ALLOW-THIN',
        file: 'atlas/logs/af-allow-degraded.md',
        message:
          'af-allow-degraded.md 过薄或未写明「无 Task/Subagent」证据（去空白≥40 且含无 Task/Subagent 陈述）。',
      });
      return false;
    }
  }

  reporter.add({
    severity: 'info',
    rule: 'ORCH-DISPATCH-DEGRADED',
    file: DISPATCH_LEDGER_REL,
    message: `降级单会话：免真实 subagentId，但仍须 orch-direct/角色 entries + paths 覆盖（reason: ${reason.slice(0, 80)}）`,
  });
  return true;
}

/**
 * 若权威路径已读但旧路径仍存在，提示删除 stale 文件
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function warnStaleLegacyLedgers(projectRoot, reporter) {
  for (const staleRel of DISPATCH_LEDGER_LEGACY_RELS) {
    if (!exists(path.join(projectRoot, staleRel))) continue;
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DISPATCH-STALE-LEGACY',
      file: staleRel,
      message: `检测到旧路径台账 ${staleRel} 仍存在；已读 ${DISPATCH_LEDGER_REL}，请删除旧文件避免混淆`,
    });
  }
}

/**
 * 校验派活台账是否满足当前闸门
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ gateId: DispatchGateId, devFile?: string }} ctx
 */
export function validateDispatchLedger(projectRoot, reporter, ctx) {
  const loaded = loadDispatchLedger(projectRoot);
  const gateId = ctx.gateId;

  if (!loaded.ok) {
    if (loaded.reason === 'missing') {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-NO-DISPATCH',
        file: DISPATCH_LEDGER_REL,
        message:
          '缺少派活台账 atlas/agileflow-dispatch.json：总控须先派 Subagent，收回报后写入台账再跑 gate',
      });
      return;
    }
    reporter.add({
      severity: 'error',
      rule: 'ORCH-DISPATCH-INVALID',
      file: DISPATCH_LEDGER_REL,
      message: `派活台账 JSON 无效：${loaded.error ?? 'parse error'}`,
    });
    return;
  }

  const { ledger, legacyFrom } = loaded;
  if (legacyFrom) {
    reporter.add({
      severity: 'warn',
      rule: 'ORCH-DISPATCH-LEGACY-PATH',
      file: legacyFrom,
      message: `派活台账在旧路径 ${legacyFrom}；须迁移到 ${DISPATCH_LEDGER_REL}（warn 硬挡，与 agileflow.env 同级）`,
    });
  } else {
    warnStaleLegacyLedgers(projectRoot, reporter);
  }
  if (isDegradedDispatchMode(ledger)) {
    if (!validateDegradedLedger(projectRoot, reporter, ledger)) {
      return;
    }
    const entries = ledger.entries ?? [];
    if (entries.length === 0) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-DEGRADED-NO-ENTRIES',
        file: DISPATCH_LEDGER_REL,
        message:
          'degraded 仍须有 entries（role=orch-direct 或对应角色）且 paths 覆盖本闸门产物；禁止空台账交垃圾。',
      });
      return;
    }
    reportLedgerFlowScope(projectRoot, reporter);
    validateEntryProvenance(reporter, entries, { degraded: true });
    runPathChecksForGate(projectRoot, reporter, entries, gateId, ctx.devFile, { degraded: true });
    return;
  }

  const entries = ledger.entries ?? [];

  reportLedgerFlowScope(projectRoot, reporter);
  validateEntryProvenance(reporter, entries);
  runPathChecksForGate(projectRoot, reporter, entries, gateId, ctx.devFile, {});
}

/**
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {object[]} entries
 * @param {string} gateId
 * @param {string} [devFile]
 * @param {{ degraded?: boolean }} [opts]
 */
function runPathChecksForGate(projectRoot, reporter, entries, gateId, devFile, opts = {}) {
  if (gateId === 'req-confirm') {
    validatePathDispatch(projectRoot, reporter, entries, 'req', 'req-confirm', listReqFiles, opts);
    return;
  }
  if (gateId === 'mod-confirm') {
    validatePathDispatch(projectRoot, reporter, entries, 'model', 'mod-confirm', listModelDispatchTargets, opts);
    return;
  }
  if (gateId === 'sol-confirm') {
    validatePathDispatch(projectRoot, reporter, entries, 'sol', 'sol-confirm', listSolDispatchTargets, opts);
    return;
  }
  if (gateId === 'dev-step1-literal') {
    validateDevDispatch(projectRoot, reporter, entries, devFile);
    return;
  }
  // write-code / dev-complete / test-entry：上游 role + dev 全链咬合
  if (WRITE_CODE_CHAIN_GATES.has(gateId)) {
    validateUpstreamDispatchForWriteCode(projectRoot, reporter, entries, gateId, opts);
    validateDevDispatch(projectRoot, reporter, entries, devFile);
    validateBusinessSourceNeedsDevArtifact(projectRoot, reporter, gateId, opts);
  }
}

/**
 * 写码/收口：盘上已有 REQ/model/sol 产物时，台账必须有对应 role 派活记录（步未 skip）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {object[]} entries
 * @param {string} gateId
 * @param {{ degraded?: boolean }} [opts]
 */
function validateUpstreamDispatchForWriteCode(projectRoot, reporter, entries, gateId, opts = {}) {
  const label = `${gateId}·上游`;
  if (!isStepSkipped(projectRoot, 'af-req')) {
    validatePathDispatch(projectRoot, reporter, entries, 'req', label, listReqFiles, opts);
  }
  if (!isStepSkipped(projectRoot, 'af-mod')) {
    validatePathDispatch(projectRoot, reporter, entries, 'model', label, listModelDispatchTargets, opts);
  }
  if (!isStepSkipped(projectRoot, 'af-sol')) {
    validatePathDispatch(projectRoot, reporter, entries, 'sol', label, listSolDispatchTargets, opts);
  }
}

/**
 * 已有业务源码却无 atlas/dev/T-*.md → 典型「跳构思直接码」逃逸
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {string} gateId
 * @param {{ degraded?: boolean }} [opts]
 */
function validateBusinessSourceNeedsDevArtifact(projectRoot, reporter, gateId, opts = {}) {
  if (opts.degraded) return;
  if (!detectBusinessSource(projectRoot)) return;
  if (listReqFiles(projectRoot).length === 0) return;
  if (listDevTaskFiles(projectRoot).length > 0) return;
  reporter.add({
    severity: 'error',
    rule: 'ORCH-NO-DEV-ARTIFACT',
    file: DISPATCH_LEDGER_REL,
    message: `${gateId}：已有业务源码且存在 REQ，但 atlas/dev 无 T-*.md → 须先派 role-dev 落盘构思并记台账，禁止无派活直接写码`,
  });
}

/**
 * normal 模式：每条台账须能证明「真派过 Subagent」，禁止主线程写完后补假账
 * degraded：免真实 subagentId，允许 orch-direct 包办正文步
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {Array<{ role?: string, taskId?: string|null, subagentId?: string|null }>} entries
 * @param {{ degraded?: boolean }} [opts]
 */
function validateEntryProvenance(reporter, entries, opts = {}) {
  const degraded = Boolean(opts.degraded);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const stepId = e.stepId != null ? String(e.stepId).trim() : '';
    if (!stepId) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-STEP-ID',
        file: DISPATCH_LEDGER_REL,
        message: `台账 entries[${i}] 缺 stepId（须等于当时 AF_STEP / flow 步 id）——走过的步必须记账`,
      });
    }

    const role = e.role != null ? String(e.role) : '';
    const subId = e.subagentId != null ? String(e.subagentId).trim() : '';
    const isOrchDirect = role === 'orch-direct';

    if (isOrchDirect) {
      if (subId !== 'orch-direct') {
        reporter.add({
          severity: 'error',
          rule: 'ORCH-DIRECT-ID',
          file: DISPATCH_LEDGER_REL,
          message: `台账 entries[${i}] role=orch-direct 时 subagentId 须为字面 "orch-direct"（总控直做步；禁止空串）`,
        });
      }
      if (!degraded && roleNeedsSubagent(role, stepId, e)) {
        reporter.add({
          severity: 'error',
          rule: 'ORCH-DIRECT-FORBIDDEN',
          file: DISPATCH_LEDGER_REL,
          message: `台账 entries[${i}] stepId=${stepId || '?'} 禁止 role=orch-direct：该步须派 Subagent（req/model/sol/dev），总控不得包办正文`,
        });
      }
    } else if (!subId) {
      if (!degraded) {
        reporter.add({
          severity: 'error',
          rule: 'ORCH-NO-SUBAGENT-ID',
          file: DISPATCH_LEDGER_REL,
          message: `台账 entries[${i}] role=${role || '?'} 缺 subagentId（宿主 Subagent/Task 返回的 ID）——禁止主线程包办后补 paths`,
        });
      }
    } else if (!degraded && isObviouslyFakeSubagentId(subId)) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-FAKE-SUBAGENT-ID',
        file: DISPATCH_LEDGER_REL,
        message: `台账 entries[${i}] subagentId=${JSON.stringify(subId)} 像手填假 ID（过短或占位词）——须抄宿主 Task/Subagent 返回值`,
      });
    }

    if (role === 'dev') {
      const tid = e.taskId;
      if (!tid || !/^T-\d+/.test(String(tid))) {
        reporter.add({
          severity: 'error',
          rule: 'ORCH-DEV-NO-TASKID',
          file: DISPATCH_LEDGER_REL,
          message: `台账 entries[${i}] role=dev 缺合法 taskId（如 T-001）——每 T 须独立派活`,
        });
      }
    }
  }
}

/** 正文角色 / 带 prompt 的步不得 orch-direct */
function roleNeedsSubagent(role, stepId, entry) {
  if (['req', 'model', 'sol', 'dev'].includes(role)) return true;
  const sid = String(stepId || entry?.stepId || '');
  return /^(af-)?(req|mod|model|sol|dev)$/i.test(sid);
}

/**
 * 明显手填假 ID（不要求 UUID，兼容各宿主；只挡弱模型占位）
 * @param {string} subId
 */
function isObviouslyFakeSubagentId(subId) {
  const s = String(subId || '').trim();
  if (s.length < 8) return true;
  if (
    /^(fake|xxx+|test|todo|n\/?a|none|null|manual|local|self|orch|main|agent|placeholder|changeme|12345678+|abcdefgh+)$/i.test(
      s,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {Array<{ role?: string, paths?: string[] }>} entries
 * @param {string} role
 * @param {string} gateLabel
 * @param {(root: string) => string[]} listTargets
 * @param {{ degraded?: boolean }} [opts]
 */
function validatePathDispatch(projectRoot, reporter, entries, role, gateLabel, listTargets, opts = {}) {
  const targets = listTargets(projectRoot);
  if (targets.length === 0) return;

  let roleEntries = entriesForRole(entries, role);
  if (opts.degraded) {
    roleEntries = [...roleEntries, ...entriesForRole(entries, 'orch-direct')];
  }
  if (roleEntries.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'ORCH-NO-DISPATCH',
      file: DISPATCH_LEDGER_REL,
      message: opts.degraded
        ? `${gateLabel}：degraded 台账无 role=${role} 或 orch-direct 记录（paths 须覆盖产物）`
        : `${gateLabel}：台账无 role=${role} 派活记录（${DISPATCH_SUBAGENT_HINT.replace('{role}', role)}）`,
    });
    return;
  }

  for (const targetRel of targets) {
    const covered = roleEntries.some((e) => entryCoversPath(e, targetRel));
    if (!covered) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-DISPATCH-MISMATCH',
        file: DISPATCH_LEDGER_REL,
        message: `${gateLabel}：台账未覆盖 ${targetRel}（paths 须含该文件或通配）`,
      });
    }
  }
}

/**
 * dev 闸门：有 dev 文件或指定 devFile 时须匹配 role=dev + taskId/paths
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {Array<{ role?: string, taskId?: string|null, paths?: string[] }>} entries
 * @param {string} [devFileAbs]
 */
function validateDevDispatch(projectRoot, reporter, entries, devFileAbs) {
  /** @type {string[]} */
  let targetRels = [];

  if (devFileAbs) {
    targetRels = [rel(projectRoot, path.resolve(devFileAbs)).replace(/\\/g, '/')];
  } else {
    targetRels = listDevTaskFiles(projectRoot);
  }

  if (targetRels.length === 0) return;

  const devEntries = entriesForRole(entries, 'dev');
  if (devEntries.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'ORCH-NO-DISPATCH',
      file: DISPATCH_LEDGER_REL,
      message: `dev 闸门：台账无 role=dev 派活记录（${DISPATCH_SUBAGENT_HINT.replace('{role}', 'dev')}）`,
    });
    return;
  }

  for (const devRel of targetRels) {
    const tid = extractTaskIdFromDevFile(path.join(projectRoot, devRel), projectRoot);
    const matched = devEntries.some((e) => {
      if (e.taskId && tid && e.taskId === tid) return true;
      return entryCoversPath(e, devRel);
    });
    if (!matched) {
      reporter.add({
        severity: 'error',
        rule: 'ORCH-DISPATCH-MISMATCH',
        file: DISPATCH_LEDGER_REL,
        message: `dev 闸门：台账未覆盖 ${devRel}${tid ? `（taskId=${tid}）` : ''}`,
      });
    }
  }
}
