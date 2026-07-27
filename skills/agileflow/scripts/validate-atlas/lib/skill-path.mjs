import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists } from './fs-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** 本 skill 根：…/agileflow（scripts/validate-atlas/lib → ../../..） */
const BUNDLED_SKILL_ROOT = path.resolve(__dirname, '..', '..', '..');

/**
 * 解析 agileflow skill 根目录（可移植，禁止写死唯一相对路径）
 * 优先级：AGILEFLOW_SKILL_ROOT → 本脚本所在 skill → 项目 skills/agileflow → 旧路径 .cursor/skills/agileflow → ~/.cursor/skills/agileflow
 * @param {string} [projectRoot]
 * @returns {string}
 */
export function resolveSkillRoot(projectRoot = process.cwd()) {
  const env = process.env.AGILEFLOW_SKILL_ROOT;
  if (env && exists(path.join(env, 'scripts', 'validate-atlas.mjs'))) {
    return path.resolve(env);
  }

  if (exists(path.join(BUNDLED_SKILL_ROOT, 'scripts', 'validate-atlas.mjs'))) {
    return BUNDLED_SKILL_ROOT;
  }

  // 项目级统一 skills/；旧安装仍可能在 .cursor/skills/
  for (const rel of [['skills'], ['.cursor', 'skills']]) {
    const projectSkill = path.join(projectRoot, ...rel, 'agileflow');
    if (exists(path.join(projectSkill, 'scripts', 'validate-atlas.mjs'))) {
      return projectSkill;
    }
  }

  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (home) {
    const userSkill = path.join(home, '.cursor', 'skills', 'agileflow');
    if (exists(path.join(userSkill, 'scripts', 'validate-atlas.mjs'))) {
      return userSkill;
    }
  }

  return BUNDLED_SKILL_ROOT;
}

/**
 * validate-atlas.mjs 绝对路径
 * @param {string} [projectRoot]
 */
export function resolveValidateScript(projectRoot) {
  return path.join(resolveSkillRoot(projectRoot), 'scripts', 'validate-atlas.mjs');
}

/**
 * 生成相对项目根的可复制命令（跨安装位置）
 * @param {string} gateId
 * @param {{ projectRoot?: string, devFile?: string }} [ctx]
 */
export function formatPortableGateCommand(gateId, ctx = {}) {
  const projectRoot = path.resolve(ctx.projectRoot ?? process.cwd());
  const scriptAbs = resolveValidateScript(projectRoot);
  let scriptArg = scriptAbs;
  try {
    const rel = path.relative(projectRoot, scriptAbs);
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      scriptArg = rel.split(path.sep).join('/');
    }
  } catch {
    /* keep abs */
  }

  if (gateId === 'dev-step1-literal') {
    return `node ${scriptArg} --gate dev-step1-literal --dev-file ${ctx.devFile ?? 'atlas/dev/T-xxx-*.md'}`;
  }
  return `node ${scriptArg} --gate ${gateId} --root ${projectRoot === process.cwd() ? '.' : projectRoot}`;
}
