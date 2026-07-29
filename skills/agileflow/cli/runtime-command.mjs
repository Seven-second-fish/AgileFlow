import path from 'node:path';
import { parseArgv, assertRootFlag } from './parse-argv.mjs';
import { recordArtifact, scanCurrentStepArtifacts } from '../scripts/runtime/artifacts.mjs';
import {
  abandonActiveRun,
  completeActiveRun,
  rewindActiveRun,
  runSummary,
  startRun,
} from '../scripts/runtime/run-state.mjs';
import { runtimeGateStatus } from '../scripts/runtime/receipts.mjs';
import {
  detectBrownfield,
  needsProjectInit,
  readProjectInitCoverage,
} from '../scripts/validate-atlas/lib/brownfield.mjs';
import {
  inferPhaseFromArtifacts,
  loadAfEnv,
} from '../scripts/validate-atlas/lib/af-env.mjs';
import {
  inferWaveFromFlow,
  listParallelWave,
  listFlowSteps,
  loadFlow,
  parseAfStep,
} from '../scripts/validate-atlas/lib/flow.mjs';

/**
 * 按调用方选择输出结构化 JSON 或简短人类文本。
 * 目的：CLI 命令共用一致的输出方式，避免每个子命令重复分支。
 */
function output(value, json) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else console.log(value);
}

/**
 * 聚合路由需要的只读项目状态。
 * 目的：把 brownfield、Flow、env、Run 与产物推断集中到脚本，
 * 避免入口 Markdown 让 Agent 手工扫描并重复实现状态机。
 *
 * 本函数只读，不创建 atlas、不修正 env、也不启动 Run。
 *
 * @param {string} projectRoot
 */
export function buildProjectContext(projectRoot) {
  const root = path.resolve(projectRoot);
  const brownfield = detectBrownfield(root);
  const flowLoaded = loadFlow(root);
  const envLoaded = loadAfEnv(root);
  const run = runSummary(root);
  const warnings = [];
  const artifactPhase = inferPhaseFromArtifacts(root, brownfield);
  const needsInit = needsProjectInit(root);
  const initCoverage = readProjectInitCoverage(root);

  let inferredSteps = [];
  let readySteps = [];
  let flowStepIds = [];
  if (flowLoaded.ok && flowLoaded.flow) {
    inferredSteps = inferWaveFromFlow(root, flowLoaded.flow, { brownfield });
    readySteps = listParallelWave(root, flowLoaded.flow);
    flowStepIds = listFlowSteps(flowLoaded.flow).map((step) => step.id);
  } else if (!flowLoaded.missing) {
    warnings.push(`flow-invalid: ${flowLoaded.error || 'unknown'}`);
  }

  let envSteps = [];
  let decisionMode = null;
  let hostCapability = null;
  let phase = artifactPhase;
  if (envLoaded.ok) {
    envSteps = parseAfStep(envLoaded.state.step);
    decisionMode = envLoaded.state.decide;
    hostCapability = envLoaded.state.hostCapability;
    phase = envLoaded.state.phase;
  } else if (!envLoaded.missing) {
    warnings.push(`env-invalid: ${(envLoaded.errors || []).join('; ')}`);
  }

  const currentSteps = run.active
    ? [...run.currentStep]
    : envSteps.length > 0
      ? envSteps
      : [];
  const fallbackSteps = [brownfield ? 'af-init' : 'af-req'];
  // init 是 pre-flow，不在 flow.steps；统一判定需要 init 时必须优先返回 af-init。
  const artifactSuggestedSteps =
    needsInit
      ? ['af-init']
      : inferredSteps.length > 0
        ? inferredSteps
        : fallbackSteps;
  const suggestedSteps =
    currentSteps.length > 0
      ? currentSteps
      : artifactSuggestedSteps;
  const source = run.active
    ? 'run'
    : envSteps.length > 0
      ? 'env'
      : needsInit || inferredSteps.length > 0
        ? 'artifacts'
        : 'default';

  return {
    version: 1,
    projectType: brownfield ? 'brownfield' : 'greenfield',
    source,
    currentSteps,
    suggestedSteps,
    readySteps,
    phase,
    decisionMode,
    hostCapability,
    init: {
      ...initCoverage,
      required: needsInit,
      recommendedScope:
        brownfield && initCoverage.scope !== 'full'
          ? 'local'
          : null,
    },
    flow: {
      loaded: Boolean(flowLoaded.ok && flowLoaded.flow),
      stepIds: flowStepIds,
    },
    run,
    warnings,
  };
}

/**
 * 执行 `agileflow context`。
 * 默认输出一行摘要；`--json` 提供给路由 Agent 稳定读取。
 *
 * @param {string[]} argv
 */
export async function runContextCommand(argv) {
  const parsed = parseArgv(argv);
  assertRootFlag(parsed.flags);
  const projectRoot = path.resolve(String(parsed.flags.root || process.cwd()));
  const context = buildProjectContext(projectRoot);
  if (parsed.flags.json) {
    output(context, true);
    return;
  }
  output(
    [
      `项目=${context.projectType}`,
      `建议=${context.suggestedSteps.join(',') || '-'}`,
      `就绪=${context.readySteps.join(',') || '-'}`,
      `来源=${context.source}`,
    ].join(' | '),
    false,
  );
}

export async function runRuntimeCommand(argv) {
  const action = argv[0];
  const parsed = parseArgv(argv.slice(1));
  const { flags, rest } = parsed;
  assertRootFlag(flags);
  const projectRoot = path.resolve(String(flags.root || process.cwd()));
  const json = Boolean(flags.json);

  if (action === 'start') {
    const changeId = flags.change === true ? '' : String(flags.change || rest[0] || '');
    const run = startRun(projectRoot, {
      changeId,
      title: flags.title === true ? undefined : flags.title,
      stepId: flags.step === true ? undefined : flags.step,
      profile: flags.profile === true ? undefined : flags.profile,
      decisionMode: flags.decision === true ? undefined : flags.decision,
    });
    output(json ? run : `Run 已启动：${run.runId} | change=${run.changeId} | step=${run.currentStep.join(',')}`, json);
    return;
  }

  if (action === 'status') {
    const summary = runSummary(projectRoot);
    output(
      json
        ? summary
        : summary.active
          ? `Run：${summary.runId} | change=${summary.changeId} | step=${summary.currentStep.join(',')} | revision=${summary.revision}`
          : '当前没有 active Run',
      json,
    );
    return;
  }

  if (action === 'gate-status') {
    const gateId = String(flags.gate || rest[0] || '');
    if (!gateId) throw new Error('gate-status 需要 --gate <id>');
    const status = runtimeGateStatus(projectRoot, gateId);
    output(json ? status : `${gateId}: ${status.valid ? 'PASS' : 'INVALID'} (${status.reason})`, json);
    if (status.active && !status.valid) process.exitCode = 1;
    return;
  }

  if (action === 'rewind') {
    const targetStep = String(flags.to || rest[0] || '');
    const reason = flags.reason === true ? '' : String(flags.reason || '');
    if (!targetStep) throw new Error('rewind 需要 --to <step>');
    const run = rewindActiveRun(projectRoot, targetStep, { reason });
    output(
      json
        ? run
        : `Run 已回退：${run.runId} → ${run.currentStep.join(',')} | attempt=${run.steps[targetStep].attempt}`,
      json,
    );
    return;
  }

  if (action === 'complete') {
    const completed = await completeActiveRun(projectRoot, {
      reason: flags.reason === true ? undefined : flags.reason,
    });
    output(json ? completed : `Run 已完成：${completed.runId}`, json);
    return;
  }

  if (action === 'abandon') {
    const reason = flags.reason === true ? '' : String(flags.reason || '');
    const abandoned = abandonActiveRun(projectRoot, { reason });
    output(json ? abandoned : `Run 已放弃：${abandoned.runId} | reason=${abandoned.abandonReason}`, json);
    return;
  }

  throw new Error('用法: agileflow run start|status|gate-status|rewind|complete|abandon [options]');
}

export async function runArtifactCommand(argv) {
  const action = argv[0];
  const parsed = parseArgv(argv.slice(1));
  const { flags, rest, cmd } = parsed;
  assertRootFlag(flags);
  const projectRoot = path.resolve(String(flags.root || process.cwd()));
  if (action === 'scan') {
    const items = scanCurrentStepArtifacts(projectRoot);
    if (flags.json) console.log(JSON.stringify({ recorded: items }, null, 2));
    else console.log(`已登记当前 step 产物：${items.length} 个`);
    return;
  }
  if (action !== 'record') {
    throw new Error('用法: agileflow artifact record <path> [...] | artifact scan [--root .]');
  }
  const artifactPath = cmd || rest[0];
  if (!artifactPath) throw new Error('artifact record 需要文件路径');
  const item = recordArtifact(projectRoot, {
    path: artifactPath,
    artifactId: flags.id === true ? undefined : flags.id,
    type: flags.type === true ? undefined : flags.type,
    stepId: flags.step === true ? undefined : flags.step,
  });
  if (flags.json) console.log(JSON.stringify(item, null, 2));
  else console.log(`Artifact 已登记：${item.artifactId}@${item.revision} ${item.digest}`);
}
