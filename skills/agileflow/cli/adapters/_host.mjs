/**
 * 各宿主 skills 根目录：用户级（~）与项目级（--root）
 *
 * Codex 官方：项目/用户均为 `.agents/skills/`；`~/.codex/skills/` 仅 legacy 清理
 * WorkBuddy：`~/.workbuddy/skills/`；CodeBuddy：`~/.codebuddy/skills/`（两产品分目录）
 */
import os from 'node:os';
import path from 'node:path';

/** @typedef {'cursor'|'claude'|'codex'|'workbuddy'|'codebuddy'|'qoder'} HostId */
/** @typedef {'user'|'project'} InstallScope */

export const ALL_HOSTS = /** @type {const} */ ([
  'cursor',
  'claude',
  'codex',
  'workbuddy',
  'codebuddy',
  'qoder',
]);

/**
 * 选其一即两边都装（腾讯系两产品目录不同）
 * @type {readonly HostId[]}
 */
export const BUDDY_HOSTS = /** @type {const} */ (['workbuddy', 'codebuddy']);

/**
 * @typedef {Object} HostConfig
 * @property {string} label
 * @property {string[]} projectRel skills 相对项目根
 * @property {string[]} userRel skills 相对用户 HOME
 * @property {'cursor'|'claude'} [legacyCommandHost]
 * @property {string[][]} projectLegacySkillRels
 * @property {string[][]} userLegacySkillRels
 */

/** @type {Record<HostId, HostConfig>} */
export const HOSTS = {
  cursor: {
    label: 'Cursor',
    // 项目级：统一 {项目根}/skills/；用户级：各宿主目录
    projectRel: ['skills'],
    userRel: ['.cursor', 'skills'],
    legacyCommandHost: 'cursor',
    projectLegacySkillRels: [['.cursor', 'skills']],
    userLegacySkillRels: [],
  },
  claude: {
    label: 'Claude Code',
    projectRel: ['skills'],
    userRel: ['.claude', 'skills'],
    legacyCommandHost: 'claude',
    projectLegacySkillRels: [['.claude', 'skills']],
    userLegacySkillRels: [],
  },
  codex: {
    label: 'Codex CLI',
    projectRel: ['skills'],
    userRel: ['.agents', 'skills'],
    projectLegacySkillRels: [['.agents', 'skills'], ['.codex', 'skills']],
    userLegacySkillRels: [['.codex', 'skills']],
  },
  workbuddy: {
    label: 'WorkBuddy',
    projectRel: ['skills'],
    userRel: ['.workbuddy', 'skills'],
    projectLegacySkillRels: [['.workbuddy', 'skills']],
    userLegacySkillRels: [],
  },
  codebuddy: {
    label: 'CodeBuddy',
    projectRel: ['skills'],
    userRel: ['.codebuddy', 'skills'],
    projectLegacySkillRels: [['.codebuddy', 'skills']],
    userLegacySkillRels: [],
  },
  qoder: {
    label: 'Qoder',
    projectRel: ['skills'],
    userRel: ['.qoder', 'skills'],
    projectLegacySkillRels: [['.qoder', 'skills']],
    userLegacySkillRels: [],
  },
};

/**
 * @param {string} base
 * @param {string[]} rel
 */
function joinRel(base, rel) {
  return path.join(path.resolve(base), ...rel);
}

/**
 * @param {HostId} hostId
 * @param {InstallScope} scope
 * @param {string} installRoot 项目 init=项目根；用户 init=HOME（仅 project 用）
 */
export function hostSkillsRoot(hostId, scope, installRoot) {
  const host = HOSTS[hostId];
  if (!host) throw new Error(`未知宿主: ${hostId}`);
  const base = scope === 'user' ? os.homedir() : installRoot;
  // 项目级统一 skills/，与 --tools 无关（只装一份）
  const rel = scope === 'user' ? host.userRel : ['skills'];
  return joinRel(base, rel);
}

/**
 * @param {HostId} hostId
 * @param {InstallScope} scope
 * @param {string} installRoot
 */
export function hostAgileflowDir(hostId, scope, installRoot) {
  return path.join(hostSkillsRoot(hostId, scope, installRoot), 'agileflow');
}

/**
 * @param {HostId} hostId
 * @param {InstallScope} scope
 * @param {string} installRoot
 */
export function hostLegacySkillRoots(hostId, scope, installRoot) {
  const host = HOSTS[hostId];
  if (!host) return [];
  const base = scope === 'user' ? os.homedir() : installRoot;
  const lists = scope === 'user' ? host.userLegacySkillRels : host.projectLegacySkillRels;
  return lists.map((rel) => joinRel(base, rel));
}

/**
 * @param {string} tool
 * @returns {tool is HostId}
 */
export function isKnownHost(tool) {
  return tool in HOSTS;
}

/**
 * workbuddy / codebuddy 互扩：任选其一则两边都装
 * @param {string[]} tools
 * @returns {string[]}
 */
export function expandBuddyHosts(tools) {
  const set = new Set(tools);
  const hitBuddy = BUDDY_HOSTS.some((h) => set.has(h));
  if (!hitBuddy) return tools;
  for (const h of BUDDY_HOSTS) set.add(h);
  const ordered = [];
  const seen = new Set();
  for (const t of tools) {
    if (seen.has(t)) continue;
    seen.add(t);
    ordered.push(t);
    if (BUDDY_HOSTS.includes(/** @type {HostId} */ (t))) {
      for (const h of BUDDY_HOSTS) {
        if (seen.has(h)) continue;
        seen.add(h);
        ordered.push(h);
      }
    }
  }
  return ordered;
}
