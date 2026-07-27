/**
 * 安装副本 vs 当前执行 skill 版本偏斜（弱模型跟新文档跑旧闸门）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, readText } from './fs-utils.mjs';

/**
 * 当前正在执行的 validate-atlas 所属 skill 根
 */
export function runningSkillRoot() {
  if (process.env.AGILEFLOW_SKILL_ROOT) {
    return path.resolve(process.env.AGILEFLOW_SKILL_ROOT);
  }
  // lib/skill-version.mjs → lib → validate-atlas → scripts → skill
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}

/**
 * @param {string} skillDir
 * @returns {string|null}
 */
export function readSkillPackageVersion(skillDir) {
  const pkg = path.join(skillDir, 'package.json');
  if (!exists(pkg)) return null;
  try {
    const j = JSON.parse(readText(pkg) || '{}');
    return j.version ? String(j.version) : null;
  } catch {
    return null;
  }
}

/**
 * 项目内已安装 skill 的 .agileflow-installed.json 版本
 * @param {string} projectRoot
 * @returns {{ version: string|null, path: string|null }}
 */
export function readInstalledSkillVersion(projectRoot) {
  const candidates = [
    path.join(projectRoot, '.cursor', 'skills', 'agileflow', '.agileflow-installed.json'),
    path.join(projectRoot, '.claude', 'skills', 'agileflow', '.agileflow-installed.json'),
    path.join(projectRoot, '.qoder', 'skills', 'agileflow', '.agileflow-installed.json'),
    path.join(projectRoot, '.agents', 'skills', 'agileflow', '.agileflow-installed.json'),
    path.join(projectRoot, '.workbuddy', 'skills', 'agileflow', '.agileflow-installed.json'),
    path.join(projectRoot, '.codebuddy', 'skills', 'agileflow', '.agileflow-installed.json'),
  ];
  for (const p of candidates) {
    if (!exists(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      return { version: j.version ? String(j.version) : null, path: p };
    } catch {
      return { version: null, path: p };
    }
  }
  // 无 installed 标记时读项目副本 package.json
  for (const rel of [
    ['.cursor', 'skills', 'agileflow'],
    ['.claude', 'skills', 'agileflow'],
    ['.qoder', 'skills', 'agileflow'],
    ['.workbuddy', 'skills', 'agileflow'],
    ['.codebuddy', 'skills', 'agileflow'],
  ]) {
    const dir = path.join(projectRoot, ...rel);
    const v = readSkillPackageVersion(dir);
    if (v) return { version: v, path: path.join(dir, 'package.json') };
  }
  return { version: null, path: null };
}

/**
 * 偏斜时向 reporter 加 warn（硬挡）或仅 console
 * @param {string} projectRoot
 * @param {import('./reporter.mjs').Reporter} [reporter]
 * @returns {{ skew: boolean, running?: string, installed?: string }}
 */
export function warnSkillVersionSkew(projectRoot, reporter) {
  const runningRoot = runningSkillRoot();
  const runningVer = readSkillPackageVersion(runningRoot);
  const installed = readInstalledSkillVersion(projectRoot);
  if (!runningVer || !installed.version) {
    return { skew: false };
  }
  if (runningVer === installed.version) {
    return { skew: false, running: runningVer, installed: installed.version };
  }
  const msg = `项目 skill 副本 v${installed.version} ≠ 当前执行闸门 v${runningVer} → 弱模型易跟新文档跑旧规则。请 npx @agileflow/cli@latest init --root .（默认先删旧再装）或设 AGILEFLOW_SKILL_ROOT 指向新 skill。`;
  if (reporter) {
    reporter.add({
      severity: 'warn',
      rule: 'AF-SKILL-SKEW',
      file: installed.path || 'atlas/',
      message: msg,
    });
  } else {
    console.warn(`⚠️ AF-SKILL-SKEW ${msg}`);
  }
  return { skew: true, running: runningVer, installed: installed.version };
}
