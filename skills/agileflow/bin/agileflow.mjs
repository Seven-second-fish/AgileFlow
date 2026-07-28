#!/usr/bin/env node
/**
 * @agileflow/cli — 入口
 *   agileflow init|update|gate|step|run|artifact …
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { assertRootFlag, parseArgv, toValidateArgs } from '../cli/parse-argv.mjs';
import { resolveProjectSkillRoot } from '../cli/resolve-project-skill-root.mjs';
import { readPackageMeta } from '../cli/package-meta.mjs';
import { maybeNotifyUpdate } from '../cli/update-check.mjs';
import {
  recordRuntimeGateReceipt,
  runtimeGateStatus,
} from '../scripts/runtime/receipts.mjs';
import { runtimeArtifactStatus } from '../scripts/runtime/artifacts.mjs';
import {
  loadActiveRun,
  loadCurrentPointer,
  loadRun,
} from '../scripts/runtime/run-state.mjs';
import {
  appendGateReceipt,
  printGateResultTrailer,
} from '../scripts/validate-atlas/lib/gate-receipts.mjs';

/**
 * 输出用户第一眼即可执行的 CLI 帮助。
 * 除命令索引外，直接展示“项目 Role 路径 → Flow step → 门牌”的最小扩展示例。
 */
function printHelp() {
  const { name, version } = readPackageMeta();
  console.log(`
${name} v${version}  (bin: agileflow)

用法:
  agileflow init [--root 项目目录] [--tools cursor,claude,codex,workbuddy,codebuddy,qoder] [--force]
    无 --root：全局/用户级 → ~/ 下各宿主 skills（.cursor/.claude/…）
    有 --root：项目级 → 只装到 {项目}/skills/（agileflow + af-* 全在这）
    默认先删旧 agileflow 再写入（--force 可省略，兼容旧用法）
  agileflow update [--root .] [--step-skills-only] [--skill-sync] [--tools …]
  agileflow gate|--gate …     运行只读 validator，并按最终结果提交对应回执
  agileflow log --door /af-req --summary … --route req [--root .]
    追加 atlas/logs/af-commands.md（/af* 强制留痕；闸门硬验）
  agileflow step sync [--root .]
  agileflow context [--json] [--root .]   只读输出路由所需项目状态
  agileflow validate --only bugs [--root .]   校验缺陷需求追踪与关闭证据
  agileflow run start --change <id> [--step af-req] [--profile standard] [--root .]
  agileflow run status [--json] [--root .]
  agileflow run gate-status --gate req-confirm [--json] [--root .]
  agileflow run rewind --to af-sol --reason "契约变化" [--root .]
  agileflow run complete [--root .]
  agileflow run abandon --reason "flow 已变更" [--root .]
  agileflow artifact record <path> [--id REQ-001] [--type requirement] [--root .]
  agileflow artifact scan [--json] [--root .]
  agileflow --help

示例:
  npx @agileflow/cli@latest init          # 带 @latest 才会绕过 npx 旧缓存
  npx @agileflow/cli@latest init --root .
  agileflow gate --gate write-code --root .
  agileflow log /af-req 做一个登录 --route req --root .
  agileflow update --step-skills-only --root .

自定义阶段（id 就是门牌，prompt 直接写项目 Role 路径）:
  1. 新建 atlas/role/role-security-review.md
  2. 在 atlas/flow.yaml 的 steps 中插入:
       - id: af-security-review
         mode: strict
         prompt: atlas/role/role-security-review.md
         depends:
           - atlas/solution/architecture.md
         outputs:
           - atlas/security/review.md
  3. 生成门牌:
       agileflow update --step-skills-only --root .
  4. 使用:
       /af-security-review

  prompt: null 表示该步由总控直接执行；新配置只写明确的项目文件路径。
`.trim());
}

/**
 * @param {string} skillRoot
 * @param {string[]} validateArgv
 */
function runGate(skillRoot, validateArgv) {
  const script = path.join(skillRoot, 'scripts', 'validate-atlas.mjs');
  const childEnv = {
    ...process.env,
    AGILEFLOW_SKILL_ROOT: skillRoot,
    AGILEFLOW_GATE_WRAPPER: '1',
  };
  const r = spawnSync(process.execPath, [script, ...validateArgv], {
    encoding: 'utf8',
    env: childEnv,
  });
  const validatorStatus = r.status === null ? 1 : r.status;
  const gateIndex = validateArgv.indexOf('--gate');
  const gateId = gateIndex >= 0 ? validateArgv[gateIndex + 1] : null;
  const rootIndex = validateArgv.indexOf('--root');
  const projectRoot =
    rootIndex >= 0 && validateArgv[rootIndex + 1]
      ? path.resolve(validateArgv[rootIndex + 1])
      : process.cwd();
  const json = validateArgv.includes('--json');
  let finalPassed = validatorStatus === 0;
  let runtimeStatus = null;
  if (gateId) {
    const activeRun = loadActiveRun(projectRoot);
    const pointer = loadCurrentPointer(projectRoot);
    const currentRun = pointer?.runId ? loadRun(projectRoot, pointer.runId) : null;
    if (activeRun) {
      const preflight = runtimeArtifactStatus(projectRoot, gateId);
      const receiptPassed = finalPassed && preflight.valid;
      recordRuntimeGateReceipt(projectRoot, {
        gateId,
        passed: receiptPassed,
        failureReason: finalPassed ? preflight.reason : 'validator-failed',
        validatorVersion: readPackageMeta().version,
      });
      runtimeStatus = runtimeGateStatus(projectRoot, gateId);
      finalPassed = finalPassed && runtimeStatus.valid;
    } else if (currentRun) {
      runtimeStatus = {
        active: true,
        valid: false,
        reason: `run-${currentRun.status}`,
        runId: currentRun.runId,
      };
      finalPassed = false;
    } else {
      appendGateReceipt(projectRoot, { gateId, passed: finalPassed });
    }
  }

  if (json) {
    let payload;
    try {
      payload = JSON.parse(r.stdout || '{}');
    } catch {
      payload = {
        gateId,
        passed: false,
        issues: [
          {
            severity: 'error',
            rule: 'GATE-JSON-INVALID',
            file: '(cli)',
            message: 'validator 未返回合法 JSON',
          },
        ],
      };
      finalPassed = false;
    }
    payload.passed = finalPassed;
    if (runtimeStatus) {
      payload.runtime = runtimeStatus;
      if (!runtimeStatus.valid) {
        payload.issues = Array.isArray(payload.issues) ? payload.issues : [];
        payload.issues.push({
          severity: 'error',
          rule: `RUNTIME-${String(runtimeStatus.reason).toUpperCase()}`,
          file: 'atlas/runs/',
          message: `validator 结果不能提交为当前 Run PASS：${runtimeStatus.reason}`,
        });
      }
    }
    console.log(JSON.stringify(payload, null, 2));
  } else {
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    if (runtimeStatus && !runtimeStatus.valid) {
      console.error(`❌ Runtime 回执无效：${runtimeStatus.reason}`);
    }
    if (gateId) printGateResultTrailer(gateId, finalPassed);
  }
  process.exit(finalPassed ? 0 : 1);
}

async function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgv(argv);
  const { cmd, flags } = parsed;

  if (!cmd || flags.help || cmd === 'help' || cmd === '--help') {
    // 无子命令但带 --gate 等 → 透传
    if (!cmd && (flags.gate || flags['list-gates'] || flags['print-skill-root'] || flags['bootstrap-scaffold'])) {
      assertRootFlag(flags);
      const root = path.resolve(String(flags.root || process.cwd()));
      const skillRoot = resolveProjectSkillRoot(root);
      runGate(skillRoot, toValidateArgs(parsed, { defaultRoot: root }));
      return;
    }
    maybeNotifyUpdate(readPackageMeta().version);
    printHelp();
    process.exit(0);
  }

  assertRootFlag(flags);
  const root = path.resolve(String(flags.root || process.cwd()));

  if (cmd === 'init') {
    maybeNotifyUpdate(readPackageMeta().version);
    const { runInit } = await import('../cli/init.mjs');
    await runInit(argv.slice(1));
    return;
  }
  if (cmd === 'update') {
    maybeNotifyUpdate(readPackageMeta().version);
    const { runUpdate } = await import('../cli/init.mjs');
    await runUpdate(argv.slice(1));
    return;
  }
  if (cmd === 'gate' || cmd === 'validate') {
    const skillRoot = resolveProjectSkillRoot(root);
    const sub = parseArgv(argv.slice(1));
    // 支持：agileflow gate write-code  与  agileflow gate --gate write-code
    if (sub.cmd && !sub.flags.gate) {
      sub.flags.gate = sub.cmd;
      sub.cmd = null;
    }
    assertRootFlag(sub.flags);
    const gateRoot = path.resolve(String(sub.flags.root || root));
    runGate(resolveProjectSkillRoot(gateRoot), toValidateArgs(sub, { defaultRoot: gateRoot }));
    return;
  }
  if (cmd === 'step') {
    const stepArgv = argv.slice(1);
    const subParsed = parseArgv(stepArgv);
    const action = subParsed.cmd || (stepArgv.includes('sync') ? 'sync' : null);
    if (action === 'sync' || stepArgv[0] === 'sync' || (!subParsed.cmd && flags.sync)) {
      const { runStepSync } = await import('../cli/step-sync.mjs');
      // 去掉 leading sync
      const syncArgs = stepArgv[0] === 'sync' ? stepArgv.slice(1) : stepArgv.filter((a) => a !== 'sync');
      await runStepSync(syncArgs);
      return;
    }
    console.error('用法: agileflow step sync [--root .]');
    process.exit(1);
  }
  if (cmd === 'log') {
    const { runAfLog } = await import('../cli/af-log.mjs');
    await runAfLog(argv.slice(1));
    return;
  }
  if (cmd === 'context') {
    const { runContextCommand } = await import('../cli/runtime-command.mjs');
    await runContextCommand(argv.slice(1));
    return;
  }
  if (cmd === 'run') {
    const { runRuntimeCommand } = await import('../cli/runtime-command.mjs');
    await runRuntimeCommand(argv.slice(1));
    return;
  }
  if (cmd === 'artifact') {
    const { runArtifactCommand } = await import('../cli/runtime-command.mjs');
    await runArtifactCommand(argv.slice(1));
    return;
  }

  // 未知子命令：若像 validate flags，尝试透传
  if (cmd.startsWith('--')) {
    const skillRoot = resolveProjectSkillRoot(root);
    runGate(skillRoot, toValidateArgs(parsed, { defaultRoot: root }));
    return;
  }

  console.error(`未知命令: ${cmd}\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
