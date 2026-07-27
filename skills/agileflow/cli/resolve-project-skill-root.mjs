/**
 * 解析已安装的 agileflow skill 根（供 gate 设 AGILEFLOW_SKILL_ROOT）
 * 顺序：项目内 → 当前 npm 包 → 用户 HOME
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PACKAGE_ROOT } from './package-meta.mjs';

/**
 * @param {string} skillDir
 */
function hasValidateScript(skillDir) {
  return fs.existsSync(path.join(skillDir, 'scripts', 'validate-atlas.mjs'));
}

/**
 * @param {string} base
 * @param {string[][]} rels
 */
function candidatesUnder(base, rels) {
  return rels.map((rel) => path.join(path.resolve(base), ...rel, 'agileflow'));
}

/** 项目内：优先统一 skills/，再兼容旧宿主路径 */
const PROJECT_SKILL_DIRS = [
  ['skills'],
  ['.cursor', 'skills'],
  ['.claude', 'skills'],
  ['.agents', 'skills'],
  ['.codex', 'skills'],
  ['.workbuddy', 'skills'],
  ['.codebuddy', 'skills'],
  ['.qoder', 'skills'],
];

/** 用户 HOME 各宿主（与 init 无 --root 一致） */
const USER_SKILL_DIRS = [
  ['.cursor', 'skills'],
  ['.claude', 'skills'],
  ['.agents', 'skills'],
  ['.codex', 'skills'],
  ['.workbuddy', 'skills'],
  ['.codebuddy', 'skills'],
  ['.qoder', 'skills'],
];

/**
 * @param {string} [projectRoot]
 * @returns {string}
 */
export function resolveProjectSkillRoot(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot);
  const home = os.homedir();

  for (const dir of candidatesUnder(root, PROJECT_SKILL_DIRS)) {
    if (hasValidateScript(dir)) return dir;
  }
  if (hasValidateScript(PACKAGE_ROOT)) return PACKAGE_ROOT;
  for (const dir of candidatesUnder(home, USER_SKILL_DIRS)) {
    if (hasValidateScript(dir)) return dir;
  }
  return PACKAGE_ROOT;
}
