/**
 * 同步总控 skill 树到目标目录（allowlist）
 * 先写临时目录再 rename；失败时尽量从 bak 恢复
 */
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT, readPackageMeta } from './package-meta.mjs';

const TOP_ALLOW = [
  'SKILL.md',
  'majorflow.md',
  'QUICKSTART.md',
  'TROUBLESHOOTING.md',
  'package.json',
  'phases',
  'templates',
  'presets',
  'tools',
];

function shouldSkipValidateChild(name) {
  if (name === 'fixtures') return true;
  if (name.startsWith('test-')) return true;
  if (name.startsWith('sync-fixture')) return true;
  if (name === 'build-role-layers.mjs') return true;
  return false;
}

function copyFilteredValidateAtlas(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (shouldSkipValidateChild(ent.name)) continue;
    const from = path.join(src, ent.name);
    const to = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'lib') fs.cpSync(from, to, { recursive: true });
      else copyFilteredValidateAtlas(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function copyScripts(srcRoot, destRoot) {
  const scriptsDest = path.join(destRoot, 'scripts');
  fs.mkdirSync(scriptsDest, { recursive: true });
  const vaSrc = path.join(srcRoot, 'scripts', 'validate-atlas.mjs');
  if (fs.existsSync(vaSrc)) fs.copyFileSync(vaSrc, path.join(scriptsDest, 'validate-atlas.mjs'));
  const vaDir = path.join(srcRoot, 'scripts', 'validate-atlas');
  if (fs.existsSync(vaDir)) {
    copyFilteredValidateAtlas(vaDir, path.join(scriptsDest, 'validate-atlas'));
  }
  const fe = path.join(srcRoot, 'scripts', 'fe-pixel');
  if (fs.existsSync(fe)) fs.cpSync(fe, path.join(scriptsDest, 'fe-pixel'), { recursive: true });
  const runtime = path.join(srcRoot, 'scripts', 'runtime');
  if (fs.existsSync(runtime)) {
    fs.cpSync(runtime, path.join(scriptsDest, 'runtime'), { recursive: true });
  }
}

function populateSkillTree(packageRoot, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of TOP_ALLOW) {
    const from = path.join(packageRoot, name);
    if (!fs.existsSync(from)) continue;
    fs.cpSync(from, path.join(destDir, name), { recursive: true });
  }
  copyScripts(packageRoot, destDir);
  const meta = readPackageMeta();
  fs.writeFileSync(
    path.join(destDir, '.agileflow-installed.json'),
    `${JSON.stringify({ version: meta.version, installedAt: new Date().toISOString() }, null, 2)}\n`,
  );
}

/**
 * @param {{ packageRoot?: string, destDir: string, backup?: boolean }} opts
 */
export function syncSkillTree(opts) {
  const packageRoot = path.resolve(opts.packageRoot || PACKAGE_ROOT);
  const destDir = path.resolve(opts.destDir);
  // 目标即源码（在 AgileFlow 仓库自身 init --root .）：跳过，避免先删后装毁掉唯一源
  if (destDir === packageRoot) return;
  const backup = opts.backup !== false;
  fs.mkdirSync(path.dirname(destDir), { recursive: true });

  // 先建临时目录，成功后才动旧目录（不留 .bak 时也不会中途丢旧版）
  const tmp = `${destDir}.tmp-${process.pid}-${Date.now()}`;
  try {
    populateSkillTree(packageRoot, tmp);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    throw err;
  }

  let bak = null;
  if (fs.existsSync(destDir)) {
    if (backup) {
      bak = `${destDir}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      fs.renameSync(destDir, bak);
    } else {
      fs.rmSync(destDir, { recursive: true, force: true });
    }
  }

  try {
    fs.renameSync(tmp, destDir);
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (bak && fs.existsSync(bak) && !fs.existsSync(destDir)) {
      try {
        fs.renameSync(bak, destDir);
      } catch {
        /* ignore */
      }
    }
    throw err;
  }
}
