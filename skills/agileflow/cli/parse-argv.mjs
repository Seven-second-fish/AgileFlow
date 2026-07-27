/**
 * 轻量 argv 解析（无依赖）
 */

/**
 * `--root` 无值时 parseArgv 会得到 true；禁止 resolve("true")
 * @param {Record<string, string|boolean>} flags
 */
export function assertRootFlag(flags) {
  if (flags.root === true) {
    console.error('--root 需要路径参数');
    process.exit(1);
  }
}

/**
 * @param {string[]} argv process.argv.slice(2)
 * @returns {{ cmd: string|null, flags: Record<string, string|boolean>, rest: string[] }}
 */
export function parseArgv(argv) {
  const flags = {};
  const rest = [];
  let cmd = null;
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (!cmd && !a.startsWith('-')) {
      cmd = a;
      i += 1;
      continue;
    }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
        i += 1;
        continue;
      }
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
      continue;
    }
    if (a === '-h') {
      flags.help = true;
      i += 1;
      continue;
    }
    rest.push(a);
    i += 1;
  }
  return { cmd, flags, rest };
}

/**
 * 从 flags + rest 拼回传给 validate-atlas 的 argv（去掉子命令）
 * @param {{ flags: Record<string, string|boolean>, rest: string[] }} parsed
 * @param {{ defaultRoot?: string }} [opts]
 */
export function toValidateArgs(parsed, opts = {}) {
  const out = [];
  const flags = { ...parsed.flags };
  if (!flags.root && opts.defaultRoot) flags.root = opts.defaultRoot;
  for (const [k, v] of Object.entries(flags)) {
    if (
      k === 'help' ||
      k === 'force' ||
      k === 'commands-only' ||
      k === 'step-skills-only' ||
      k === 'skill-sync'
    ) {
      continue;
    }
    if (v === true) out.push(`--${k}`);
    else out.push(`--${k}`, String(v));
  }
  out.push(...parsed.rest);
  return out;
}

/**
 * update 模式：全量 / 仅门牌 skill / 仅 agileflow 厚树
 * @param {Record<string, string|boolean>} flags
 */
export function resolveUpdateModes(flags) {
  const deprecatedCommandsOnly = Boolean(flags['commands-only']) && !flags['skill-sync'];
  const stepSkillsOnly =
    (Boolean(flags['step-skills-only']) || Boolean(flags['commands-only'])) && !flags['skill-sync'];
  const skillSyncOnly =
    Boolean(flags['skill-sync']) && !flags['step-skills-only'] && !flags['commands-only'];
  return { stepSkillsOnly, skillSyncOnly, deprecatedCommandsOnly };
}

/** @typedef {'user'|'project'} InstallScope */

/**
 * @param {string|boolean|undefined} raw
 * @param {readonly string[]} allTools
 */
export function parseToolsList(raw, allTools) {
  if (raw === true || raw === undefined || raw === '') return [...allTools];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * init 落盘目标：无 --root → 用户 HOME + 全部宿主；有 --root → 项目统一 skills/（tools 仅影响旧路径清理，默认全部）
 * @param {Record<string, string|boolean>} flags
 * @param {readonly string[]} allTools
 */
export function resolveInitContext(flags, allTools) {
  if (flags.root === true) {
    assertRootFlag(flags);
  }
  const hasProjectRoot = typeof flags.root === 'string' && String(flags.root).length > 0;
  if (!hasProjectRoot) {
    return {
      scope: /** @type {InstallScope} */ ('user'),
      installRoot: process.env.HOME || process.env.USERPROFILE || os.homedir(),
      tools: flags.tools ? parseToolsList(flags.tools, allTools) : [...allTools],
    };
  }
  return {
    scope: /** @type {InstallScope} */ ('project'),
    installRoot: String(flags.root),
    tools: flags.tools ? parseToolsList(flags.tools, allTools) : [...allTools],
  };
}
