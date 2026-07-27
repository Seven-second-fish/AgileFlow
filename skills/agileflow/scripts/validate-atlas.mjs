#!/usr/bin/env node
/**
 * Agileflow atlas/ 校验 CLI + AI 流程闸门
 *
 * 用法（skill 可装在项目 skills/、旧路径 .cursor/skills 或 ~/.cursor/skills；可用 AGILEFLOW_SKILL_ROOT）:
 *   node <skill>/scripts/validate-atlas.mjs --gate sol-confirm --root .
 *   node <skill>/scripts/validate-atlas.mjs --bootstrap-scaffold --root .
 *   node <skill>/scripts/validate-atlas.mjs --refresh-role-baseline --root .
 *   node <skill>/scripts/validate-atlas.mjs --print-skill-root
 *   cd <skill> && npm run validate:sol
 */

import path from 'node:path';
import {
  validateAtlas,
  runDevLiteralCheck,
  runGate,
  listGates,
  resolveSkillRoot,
  formatPortableGateCommand,
} from './validate-atlas/index.mjs';
import { bootstrapTemplateTree } from './validate-atlas/lib/template-loader.mjs';
import { bootstrapAtlasScaffold } from './validate-atlas/lib/atlas-scaffold.mjs';
import { writeRoleBaselines } from './validate-atlas/lib/rules/role-custom.mjs';
import { exists } from './validate-atlas/lib/fs-utils.mjs';
import { printGateResultTrailer } from './validate-atlas/lib/gate-receipts.mjs';
import { warnSkillVersionSkew } from './validate-atlas/lib/skill-version.mjs';

function parseBooleanFlag(v) {
  if (v === true || v === undefined) return true;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return Boolean(v);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      let key = arg.slice(2);
      let value = true;
      const eq = key.indexOf('=');
      if (eq !== -1) {
        value = key.slice(eq + 1);
        key = key.slice(0, eq);
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          value = next;
          i++;
        }
      }
      args[key] = value;
    } else {
      args._.push(arg);
    }
  }
  return args;
}

/** 解析 dev 文件路径（--dev-file 优先，其次 --a7）；相对于 --root 解析 */
function resolveDevFilePath(args, root) {
  const raw = args['dev-file'] ?? args.a7;
  if (!raw || raw === true) return null;
  const rawPath = String(raw);
  // 绝对路径保持不变；相对路径按 --root 解析
  if (path.isAbsolute(rawPath)) {
    return path.resolve(rawPath);
  }
  return path.resolve(root, rawPath);
}

function printLiteralCheckResult(filePath, result) {
  console.log(`\n字面量校验 + 段结构：${filePath}`);
  if (result.passed) {
    console.log('✅ 通过（可勾 ①）');
    return;
  }
  console.log('❌ 未通过');
  for (const issue of result.issues) {
    console.log(`  [${issue.rule}] ${issue.message}`);
  }
}

function gateClassLabel(g) {
  const cls = g.class ?? (g.blocking ? 'A' : 'B');
  return `[${cls}档]`;
}

function printGates() {
  const gates = listGates();
  console.log('\nAI 流程闸门（落盘后 / AskQuestion 前 / 勾①前 须跑）：\n');
  for (const [id, g] of Object.entries(gates)) {
    console.log(`  ${id} ${gateClassLabel(g)}`);
    console.log(`    时机: ${g.when}`);
    console.log(`    模块: ${g.modules.join(', ')}`);
    if (g.extra) console.log(`    说明: ${g.extra}`);
    console.log('');
  }
}

function main() {
  const args = parseArgs(process.argv);
  const root = args.root ? String(args.root) : process.cwd();
  const devFilePath = resolveDevFilePath(args, root);

  if (args['list-gates']) {
    printGates();
    process.exit(0);
  }

  if (args['print-skill-root']) {
    const skillRoot = resolveSkillRoot(root);
    console.log(skillRoot);
    process.exit(0);
  }

  if (args['bootstrap-scaffold']) {
    const result = bootstrapAtlasScaffold(root);
    console.log('✅ 写入项目 atlas/（--root 指定目录，非 skill 目录）');
    console.log(
      `   role: 新建 ${result.role.copied.join(', ') || '无'}；已有跳过 ${result.role.skipped.join(', ') || '无'}`
    );
    console.log(
      `   humanTodo: ${result.human.created ? '已创建' : '已存在跳过'} → ${path.relative(root, result.human.path)}`
    );
    console.log(
      `   todo: ${result.todo.created ? '已创建骨架' : '已存在跳过'} → ${path.relative(root, result.todo.path)}`
    );
    console.log(
      `   flow: ${result.flow?.created ? '已创建' : '已存在跳过'} → ${path.relative(root, result.flow?.path || 'atlas/flow.yaml')}`
    );
    console.log(
      `   agileflow-dispatch: ${result.dispatch.created ? '已创建' : '已存在跳过'} → ${path.relative(root, result.dispatch.path)}`
    );
    const baselineLabel = result.roleBaseline.created
      ? '已创建'
      : result.roleBaseline.merged
        ? '已合并新 role 条目'
        : '已存在跳过';
    console.log(
      `   role baseline: ${baselineLabel} → ${path.relative(root, result.roleBaseline.path)}`
    );
    console.log('   Subagent 派活只读 atlas/role/role-*.md（可改本目录自定义）');
    process.exit(0);
  }

  if (args['refresh-role-baseline']) {
    const result = writeRoleBaselines(root, { force: true });
    console.log('✅ 已以当前 atlas/role/role-*.md 重置 baseline');
    console.log(`   → ${path.relative(root, result.path)}`);
    console.log('   之后相对此 baseline 的改动将视为「自定义 role」，跳过对应默认文档闸门');
    process.exit(0);
  }

  if (args['bootstrap-template']) {
    const presetRaw = args['bootstrap-template'] === true ? 'standard' : String(args['bootstrap-template']);
    if (!['minimal', 'standard'].includes(presetRaw)) {
      console.error('❌ --bootstrap-template 须为 minimal 或 standard');
      process.exit(1);
    }
    const envPath = path.join(root, 'atlas', 'agileflow.env');
    if (!exists(envPath)) {
      console.error('❌ bootstrap 须先有 atlas/agileflow.env（先完成 init / 首启）');
      process.exit(1);
    }
    // template 启用时一并暴露 role/humanTodo（不覆盖已有）
    bootstrapAtlasScaffold(root);
    const dest = bootstrapTemplateTree(root, /** @type {'minimal'|'standard'} */ (presetRaw));
    console.log(`✅ 已复制 presets/${presetRaw}/template → ${path.relative(root, dest) || 'atlas/template/'}`);
    console.log('   AF_TEMPLATE=yes · AF_TEMPLATE_PRESET=' + presetRaw);
    console.log('   已确保 atlas/role/ + humanTodo.md（脚手架）');
    process.exit(0);
  }

  if (args['print-cmd'] && args.gate) {
    console.log(
      formatPortableGateCommand(String(args.gate), {
        projectRoot: root,
        devFile: devFilePath ?? undefined,
      })
    );
    process.exit(0);
  }

  if (devFilePath && !args.gate) {
    const result = runDevLiteralCheck(devFilePath, { mode: args.mode ? String(args.mode) : 'auto', tier: args.tier ? String(args.tier) : undefined });
    if (args.json) {
      console.log(JSON.stringify({ file: devFilePath, ...result }, null, 2));
    } else {
      printLiteralCheckResult(devFilePath, result);
    }
    process.exit(result.passed ? 0 : 1);
  }

  if (args.gate) {
    const gateId = String(args.gate);
    const result = runGate(gateId, {
      projectRoot: root,
      devFile: devFilePath ?? undefined,
      mode: args.mode ? String(args.mode) : 'auto',
      tier: args.tier ? String(args.tier) : undefined,
      incremental: parseBooleanFlag(args.incremental),
      brownfield: args.greenfield ? false : args.brownfield !== undefined ? parseBooleanFlag(args.brownfield) : 'auto',
      verbose: parseBooleanFlag(args.verbose),
      autoAfLog: false,
    });
    // 版本偏斜：项目副本 ≠ 当前执行 skill → warn 硬挡
    warnSkillVersionSkew(root, result.reporter);
    const passed = result.reporter.passed() && result.passed;
    if (args.json) {
      console.log(
        JSON.stringify(
          {
            gateId,
            passed,
            class: result.gate.class ?? (result.gate.blocking ? 'A' : 'B'),
            issues: result.reporter.getIssues(),
          },
          null,
          2,
        ),
      );
    } else {
      console.log(`🚧 闸门: ${gateId} ${gateClassLabel(result.gate)}`);
      console.log(`   时机: ${result.gate.when}`);
      result.reporter.print({
        verbose: Boolean(args.verbose),
        successLabel:
          process.env.AGILEFLOW_GATE_WRAPPER === '1'
            ? 'ℹ️ validator 层通过；最终结果以 CLI 尾标与 Runtime 为准'
            : '',
      });
      if (process.env.AGILEFLOW_GATE_WRAPPER !== '1') {
        printGateResultTrailer(result.gateId || gateId, passed);
      }
    }
    process.exit(passed ? 0 : 1);
  }

  const options = {
    projectRoot: root,
    phase: args.phase ?? 'all',
    mode: args.mode ? String(args.mode) : 'auto',
    tier: args.tier ? String(args.tier) : undefined,
    incremental: parseBooleanFlag(args.incremental),
    verbose: parseBooleanFlag(args.verbose),
  };
  if (args.greenfield) options.brownfield = false;
  else if (args.brownfield !== undefined) options.brownfield = parseBooleanFlag(args.brownfield);
  else options.brownfield = 'auto';
  if (args.only) options.only = String(args.only).split(',').map((s) => s.trim());

  if (!args.json) console.log('🔍 Agileflow Atlas 校验');
  const { passed, reporter, mode, tier, brownfield } = validateAtlas(options);
  if (!args.json) {
    console.log(`   根目录: ${root} | 阶段: ${options.phase} | 模式: ${mode} | brownfield: ${brownfield}`);
  }

  if (args.json) {
    console.log(JSON.stringify({
      passed,
      errors: reporter.getIssues().filter((i) => i.severity === 'error'),
      warnings: reporter.getIssues().filter((i) => i.severity === 'warn'),
    }, null, 2));
  } else {
    reporter.print({ verbose: Boolean(args.verbose) });
  }
  process.exit(passed ? 0 : 1);
}

main();
