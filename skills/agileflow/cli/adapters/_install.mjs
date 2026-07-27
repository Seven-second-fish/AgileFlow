/**
 * 宿主安装：同步 agileflow 厚 skill + 门牌 skills/{id}/SKILL.md
 */
import path from 'node:path';
import { syncSkillTree } from '../sync-skill-tree.mjs';
import {
  installDoorplateSkills,
  pruneDoorplateSkills,
  cleanupLegacyCommands,
  cleanupLegacyGeneratedSkills,
} from './_doorplate.mjs';
import { hostSkillsRoot, hostAgileflowDir, hostLegacySkillRoots, HOSTS } from './_host.mjs';

/**
 * @typedef {Object} InstallHostOpts
 * @property {string} installRoot 项目根或 HOME（由 scope 决定实际落盘基址）
 * @property {import('./_host.mjs').InstallScope} scope
 * @property {import('../catalog.mjs').CatalogEntry[]} catalog
 * @property {import('./_host.mjs').HostId} hostId
 * @property {boolean} [force]
 * @property {boolean} [backup]
 * @property {boolean} [stepSkillsOnly]
 * @property {boolean} [skillSyncOnly]
 */

/**
 * 清理某宿主的旧 command / 旧 skills 路径（含 agileflow.bak-*）；与安装解耦，可单独调用
 * @param {string} installRoot
 * @param {import('./_host.mjs').HostId} hostId
 * @param {import('./_host.mjs').InstallScope} scope
 * @returns {string[]}
 */
export function cleanupHostLegacy(installRoot, hostId, scope) {
  const hostMeta = HOSTS[hostId];
  if (!hostMeta) return [];
  const legacyRemoved = [];
  if (scope === 'project' && hostMeta.legacyCommandHost) {
    legacyRemoved.push(...cleanupLegacyCommands(installRoot, hostMeta.legacyCommandHost));
  }
  for (const legacyRoot of hostLegacySkillRoots(hostId, scope, installRoot)) {
    legacyRemoved.push(...cleanupLegacyGeneratedSkills(legacyRoot));
  }
  return legacyRemoved;
}

/**
 * @param {InstallHostOpts} opts
 */
export function installHost(opts) {
  const scope = opts.scope || 'project';
  const installRoot = path.resolve(opts.installRoot);
  const skillsRoot = hostSkillsRoot(opts.hostId, scope, installRoot);
  const skillDir = hostAgileflowDir(opts.hostId, scope, installRoot);
  const force = Boolean(opts.force);
  const stepSkillsOnly = Boolean(opts.stepSkillsOnly);
  const skillSyncOnly = Boolean(opts.skillSyncOnly);

  if (!stepSkillsOnly) {
    syncSkillTree({ destDir: skillDir, backup: opts.backup !== false });
  }

  let doorplate = { written: [], skipped: [] };
  if (!skillSyncOnly) {
    doorplate = installDoorplateSkills({ skillsRoot, catalog: opts.catalog, force });
  }

  const legacyRemoved = cleanupHostLegacy(installRoot, opts.hostId, scope);

  return {
    skillDir,
    skillsRoot,
    written: doorplate.written,
    skipped: doorplate.skipped,
    legacyRemoved,
  };
}

/**
 * @param {string} installRoot
 * @param {import('./_host.mjs').HostId} hostId
 * @param {import('./_host.mjs').InstallScope} scope
 * @param {Set<string>} keepIds
 */
export function pruneHostDoorplates(installRoot, hostId, scope, keepIds) {
  return pruneDoorplateSkills(hostSkillsRoot(hostId, scope, installRoot), keepIds);
}
