/**
 * 门牌 skill 共享安装：skills/{id}/SKILL.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderDoorplateSkill, GENERATED_MARK } from '../generate.mjs';
import { bodyForEntry } from '../body-for-entry.mjs';
import { readPackageMeta } from '../package-meta.mjs';

/**
 * @param {string} filePath
 * @param {boolean} force
 */
function mayOverwrite(filePath, force) {
  if (force || !fs.existsSync(filePath)) return true;
  const text = fs.readFileSync(filePath, 'utf8');
  return text.includes(GENERATED_MARK);
}

/**
 * 写入 catalog 中各步的门牌 skill
 * @param {{ skillsRoot: string, catalog: import('../catalog.mjs').CatalogEntry[], force?: boolean }} opts
 */
export function installDoorplateSkills(opts) {
  const skillsRoot = path.resolve(opts.skillsRoot);
  const force = Boolean(opts.force);
  const version = readPackageMeta().version;
  fs.mkdirSync(skillsRoot, { recursive: true });

  const written = [];
  const skipped = [];

  for (const entry of opts.catalog) {
    const dir = path.join(skillsRoot, entry.id);
    const filePath = path.join(dir, 'SKILL.md');
    if (!mayOverwrite(filePath, force)) {
      skipped.push(filePath);
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    const body = bodyForEntry(entry);
    fs.writeFileSync(filePath, renderDoorplateSkill(entry, body, version), 'utf8');
    written.push(filePath);
  }

  return { written, skipped };
}

/**
 * 删除 catalog 外、CLI 生成的孤儿门牌 skill 目录
 * @param {string} skillsRoot
 * @param {Set<string>} keepIds
 */
export function pruneDoorplateSkills(skillsRoot, keepIds) {
  const root = path.resolve(skillsRoot);
  if (!fs.existsSync(root)) return [];
  const removed = [];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    if (name.name === 'agileflow') continue;
    if (!name.name.startsWith('af-')) continue;
    if (keepIds.has(name.name)) continue;
    const dir = path.join(root, name.name);
    const skillMd = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue;
    const text = fs.readFileSync(skillMd, 'utf8');
    if (!text.includes(GENERATED_MARK)) continue;
    const entries = fs.readdirSync(dir);
    if (entries.length !== 1 || entries[0] !== 'SKILL.md') continue;
    fs.rmSync(dir, { recursive: true, force: true });
    removed.push(dir);
  }
  return removed;
}

/**
 * 删除旧版 command 文件（迁移）
 * @param {string} projectRoot
 * @param {'cursor'|'claude'} host
 */
export function cleanupLegacyCommands(projectRoot, host) {
  const root = path.resolve(projectRoot);
  const paths =
    host === 'cursor'
      ? [path.join(root, '.cursor', 'commands')]
      : host === 'claude'
        ? [path.join(root, '.claude', 'commands', 'af')]
        : [];
  const removed = [];
  for (const cmdDir of paths) {
    if (!fs.existsSync(cmdDir)) continue;
    for (const name of fs.readdirSync(cmdDir)) {
      if (!name.endsWith('.md')) continue;
      const stem = name.slice(0, -3);
      if (!stem.startsWith('af-')) continue;
      const fp = path.join(cmdDir, name);
      const text = fs.readFileSync(fp, 'utf8');
      if (!text.includes(GENERATED_MARK)) continue;
      fs.unlinkSync(fp);
      removed.push(fp);
    }
  }
  return removed;
}

/**
 * 判断目录是否为 CLI 同步的 agileflow 厚 skill
 * @param {string} dir
 */
function isCliSyncedAgileflow(dir) {
  return fs.existsSync(path.join(dir, '.agileflow-installed.json'));
}

/**
 * 删除某 skills 根下 CLI 生成的 agileflow 树、历史 .bak 与门牌（宿主路径迁移用）
 * @param {string} skillsRoot
 */
export function cleanupLegacyGeneratedSkills(skillsRoot) {
  const root = path.resolve(skillsRoot);
  if (!fs.existsSync(root)) return [];
  const removed = [];

  const agileflowDir = path.join(root, 'agileflow');
  if (fs.existsSync(agileflowDir) && isCliSyncedAgileflow(agileflowDir)) {
    fs.rmSync(agileflowDir, { recursive: true, force: true });
    removed.push(agileflowDir);
  }

  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    // agileflow.bak-*：旧版 CLI 重装备份（命名为 CLI 独有），会污染宿主 skill 菜单
    if (name.isDirectory() && name.name.startsWith('agileflow.bak-')) {
      const bakDir = path.join(root, name.name);
      fs.rmSync(bakDir, { recursive: true, force: true });
      removed.push(bakDir);
      continue;
    }
    if (!name.isDirectory() || !name.name.startsWith('af-')) continue;
    const dir = path.join(root, name.name);
    const skillMd = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) continue;
    const text = fs.readFileSync(skillMd, 'utf8');
    if (!text.includes(GENERATED_MARK)) continue;
    const entries = fs.readdirSync(dir);
    if (entries.length !== 1 || entries[0] !== 'SKILL.md') continue;
    fs.rmSync(dir, { recursive: true, force: true });
    removed.push(dir);
  }

  return removed;
}
