/**
 * 新版本提醒（update-notifier 模式，零依赖）
 * 原则：不阻塞、不联网等待——本次只读上次后台探测的缓存；缓存过期时派 detached 子进程刷新
 * npx 会缓存旧版，文档统一教 `npx @agileflow/cli@latest`；此处兜底提醒仍在跑旧版的用户
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const REGISTRY_LATEST = 'https://registry.npmjs.org/@agileflow%2Fcli/latest';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheFile() {
  return path.join(os.homedir(), '.agileflow', 'update-check.json');
}

/**
 * a 是否为比 b 更新的版本（简易 semver，仅比较数字段）
 * @param {string} a
 * @param {string} b
 */
export function isNewerVersion(a, b) {
  if (!a || !b) return false;
  const pa = String(a).split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(cacheFile(), 'utf8'));
  } catch {
    return null;
  }
}

/** 派 detached 子进程刷新缓存（静默失败；主进程零等待） */
function refreshInBackground() {
  const file = cacheFile();
  const script = [
    `const fs=require('fs'),path=require('path');`,
    `fetch(${JSON.stringify(REGISTRY_LATEST)},{signal:AbortSignal.timeout(5000)})`,
    `.then(r=>r.ok?r.json():null)`,
    `.then(j=>{if(!j||!j.version)return;`,
    `fs.mkdirSync(path.dirname(${JSON.stringify(file)}),{recursive:true});`,
    `fs.writeFileSync(${JSON.stringify(file)},JSON.stringify({latest:j.version,checkedAt:Date.now()}))})`,
    `.catch(()=>{})`,
  ].join('');
  try {
    spawn(process.execPath, ['-e', script], { detached: true, stdio: 'ignore' }).unref();
  } catch {
    /* ignore */
  }
}

/**
 * init/update 等安装类命令入口调用：读缓存提示新版；按需后台刷新
 * @param {string} currentVersion
 */
export function maybeNotifyUpdate(currentVersion) {
  if (
    process.env.AGILEFLOW_NO_UPDATE_CHECK === '1' ||
    process.env.AGILEFLOW_GATE_WRAPPER === '1' ||
    process.env.CI
  ) {
    return;
  }
  const cache = readCache();
  if (cache?.latest && isNewerVersion(cache.latest, currentVersion)) {
    console.error(
      `\n⬆️  @agileflow/cli 有新版本 v${cache.latest}（当前 v${currentVersion}）` +
        `\n   npx 会复用旧缓存；升级请显式带 @latest：npx @agileflow/cli@latest init\n`,
    );
  }
  if (!cache?.checkedAt || Date.now() - cache.checkedAt > CACHE_TTL_MS) {
    refreshInBackground();
  }
}
