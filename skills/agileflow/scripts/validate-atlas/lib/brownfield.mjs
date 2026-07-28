import fs from 'node:fs';
import path from 'node:path';
import { exists, readText } from './fs-utils.mjs';

/** 业务源码扩展名（有则倾向 brownfield） */
const CODE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.java', '.kt', '.go', '.py', '.cs', '.vue', '.svelte', '.rs',
]);

/** 候选业务根目录 */
const CANDIDATE_DIRS = [
  'src', 'apps', 'server', 'internal', 'packages',
  'backend', 'frontend', 'miniapp', 'web', 'api',
  'app', 'lib', 'controllers', 'services', 'models',
  'components', 'pages', 'modules', 'routes', 'handlers',
  'middleware', 'utils', 'helpers', 'core', 'domain',
];

const SKIP_DIR = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage',
  '.next', 'out', 'target', 'vendor', 'atlas', '__pycache__',
]);

/**
 * 目录树内是否存在业务源码文件（非空目录名即判定）
 * @param {string} dir
 * @param {number} [depth]
 * @returns {boolean}
 */
function dirHasBusinessCode(dir, depth = 0) {
  if (depth > 4 || !exists(dir)) return false;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      if (dirHasBusinessCode(full, depth + 1)) return true;
    } else if (CODE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * 目录树内源码文件计数（用于 fallback 全量扫描）
 * @param {string} dir
 * @param {number} [depth]
 * @returns {number}
 */
function countBusinessCode(dir, depth = 0) {
  if (depth > 4 || !exists(dir)) return 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  let count = 0;
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      count += countBusinessCode(full, depth + 1);
    } else if (CODE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      count += 1;
    }
    if (count >= 3) return count; // 提前退出
  }
  return count;
}

/**
 * 探测项目内是否已有业务源码（不含 atlas/；与是否 brownfield 解耦）
 * 用于 doc-first：有业务码就必须有合规 sol/dev，堵先码后补
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function detectBusinessSource(projectRoot) {
  for (const name of CANDIDATE_DIRS) {
    if (dirHasBusinessCode(path.join(projectRoot, name))) return true;
  }

  // 根目录零散源码（少见）
  try {
    const top = fs.readdirSync(projectRoot, { withFileTypes: true });
    for (const entry of top) {
      if (!entry.isFile()) continue;
      if (CODE_EXTS.has(path.extname(entry.name).toLowerCase())) return true;
    }
  } catch {
    /* ignore */
  }

  // fallback：候选目录未命中时，按文件类型全量扫描（阈值 3 个业务源码文件）
  const rootCount = countBusinessCode(projectRoot);
  return rootCount >= 3;
}

/**
 * 探测是否 brownfield：须有业务源码文件，或已有实质 init（README）
 * 空 packages/、空 src/、空 atlas/init/ → greenfield（勿仅看目录名）
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function detectBrownfield(projectRoot) {
  const initReadme = path.join(projectRoot, 'atlas', 'init', 'README.md');
  if (exists(initReadme)) {
    try {
      if (fs.statSync(initReadme).size > 0) return true;
    } catch {
      /* fall through */
    }
  }

  return detectBusinessSource(projectRoot);
}

/**
 * 是否已有实质确认的需求。
 * 目的：greenfield 在流程中生成源码后会被源码扫描识别成 brownfield，
 * 已确认 REQ 可证明主链已经启动，不能再错误路由回 init。
 *
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function hasConfirmedRequirement(projectRoot) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return false;
  let files = [];
  try {
    files = fs.readdirSync(reqRoot).filter((name) => /^REQ-\d+/i.test(name) && name.endsWith('.md'));
  } catch {
    return false;
  }
  return files.some((name) =>
    /状态[：:]\s*(已确认|已实现)/.test(readText(path.join(reqRoot, name)) || ''),
  );
}

/**
 * 是否应先进入 pre-flow `af-init`。
 * 目的：集中 brownfield + init 确认 + greenfield 误识别例外，
 * 供 context、Flow 推断和 env 推断共用同一判定。
 *
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function needsProjectInit(projectRoot) {
  if (!detectBrownfield(projectRoot)) return false;
  const initReadme = readText(path.join(projectRoot, 'atlas', 'init', 'README.md')) || '';
  if (/状态[：:]\s*已确认/.test(initReadme)) return false;
  return !hasConfirmedRequirement(projectRoot);
}
