#!/usr/bin/env node
/**
 * fixtures 回归测试（在 skill 内运行）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { detectBrownfield } from './lib/brownfield.mjs';
import { resolveSkillRoot, resolveValidateScript } from './lib/skill-path.mjs';
import { loadCustomRoles } from './lib/rules/role-custom.mjs';
import { bootstrapAtlasScaffold } from './lib/atlas-scaffold.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');
const cli = path.join(skillRoot, 'scripts', 'validate-atlas.mjs');
const fixtures = path.join(__dirname, 'fixtures');

const cases = [
  {
    name: 'unknown --only → 参数错误',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'typo-module'],
    fail: true,
    assertStdout: 'ARG-ONLY-UNKNOWN',
  },
  {
    name: '--json → stdout 为可解析 JSON',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'todo', '--json'],
    fail: false,
    assertJson: true,
  },
  {
    name: 'bad-flat-todo → 开发完成格式',
    args: ['--root', path.join(fixtures, 'bad-flat-todo'), '--only', 'todo'],
    fail: true,
  },
  {
    name: 'bad-fake-checkboxes → 空跑勾①②③应失败',
    args: ['--root', path.join(fixtures, 'bad-fake-checkboxes'), '--only', 'todo'],
    fail: true,
    assertStdout: 'TODO-CHECK-①无文件',
  },
  {
    name: 'bad-fake-checkboxes → 假开发完成应失败',
    args: ['--root', path.join(fixtures, 'bad-fake-checkboxes'), '--only', 'todo'],
    fail: true,
    assertStdout: 'TODO-CHECK-',
  },
  {
    name: 'good-runnable → todo 勾选证据应通过',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'todo'],
    fail: false,
  },
  {
    name: 'bad-req-uid-missing → UID 断链应失败',
    args: ['--root', path.join(fixtures, 'bad-req-uid-missing'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-UID-断链',
  },
  {
    name: 'bad-req-empty-ac → AC 表空单元格应失败',
    args: ['--root', path.join(fixtures, 'bad-req-empty-ac'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-AC-空单元格',
  },
  {
    name: 'bad-req-title-666 → 标题无实质应失败',
    args: ['--root', path.join(fixtures, 'bad-req-title-666'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-TITLE-SUBSTANCE',
  },
  {
    name: 'bad-req-freestyle-outline → 自创大纲缺范围提示/BDD 应失败',
    args: ['--root', path.join(fixtures, 'bad-req-freestyle-outline'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-',
  },
  {
    name: 'bad-req-no-title-name → 标题无名称应失败',
    args: ['--root', path.join(fixtures, 'bad-req-no-title-name'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-F002',
  },
  {
    name: 'bad-req-filename-only → 文件名无后缀应失败',
    args: ['--root', path.join(fixtures, 'bad-req-filename-only'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-F001',
  },
  {
    name: 'bad-req-empty-scope → 范围内外空应失败',
    args: ['--root', path.join(fixtures, 'bad-req-empty-scope'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-SCOPE',
  },
  {
    name: 'bad-req-ac-no-sep → 缺表分隔线应失败',
    args: ['--root', path.join(fixtures, 'bad-req-ac-no-sep'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-AC-分隔线',
  },
  {
    name: 'bad-req-ac-col-mismatch → 列数不对齐应失败',
    args: ['--root', path.join(fixtures, 'bad-req-ac-col-mismatch'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-AC-列对齐',
  },
  {
    name: 'bad-req-placeholder → 占位符应失败',
    args: ['--root', path.join(fixtures, 'bad-req-placeholder'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-PLACEHOLDER',
  },
  {
    name: 'bad-req-dir-name → atlas/req/ 应为 requirements/',
    args: ['--root', path.join(fixtures, 'bad-req-dir-name'), '--only', 'dir'],
    fail: true,
    assertStdout: 'DIR-NAME-REQ',
  },
  {
    name: 'bad-sol-todo-path → solution/todo.md 禁止',
    args: ['--root', path.join(fixtures, 'bad-sol-todo-path'), '--only', 'dir'],
    fail: true,
    assertStdout: 'DIR-TODO-PATH',
  },
  {
    name: 'bad-sol-fat-contract → API.md 揉包禁止',
    args: ['--root', path.join(fixtures, 'bad-sol-fat-contract'), '--only', 'sol'],
    fail: true,
    assertStdout: 'SOL-C001-FAT',
  },
  {
    name: 'bad-sol-api-table-only → 纯表格 API 应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-api-table-only'), '--only', 'sol'],
    fail: true,
    assertStdout: 'SOL-API-NO-JSON',
  },
  {
    name: 'bad-standard-thin-hash → 禁 ## 步骤 旧格式',
    args: ['--root', path.join(fixtures, 'bad-standard-thin-hash'), '--only', 'dev'],
    fail: true,
    assertStdout: 'DEV-BAN-步骤',
  },
  {
    name: 'bad-model-silent-skip → 无正式建模判定应失败',
    args: ['--root', path.join(fixtures, 'bad-model-silent-skip'), '--phase', '2', '--only', 'dir'],
    fail: true,
    assertStdout: 'DIR-2-model',
  },
  {
    name: 'bad-model-silent-skip → sol 闸门须挡静默跳过',
    args: ['--root', path.join(fixtures, 'bad-model-silent-skip'), '--only', 'doc-first'],
    fail: true,
    assertStdout: 'SKIP-MODEL-无判定',
  },
  {
    name: 'bad-thin-dev → 字面量校验',
    args: ['--root', path.join(fixtures, 'bad-thin-dev'), '--only', 'dev'],
    fail: true,
  },
  {
    name: 'good-runnable → dev 多文件应通过（防 filePath 回归）',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'dev'],
    fail: false,
  },
  {
    name: 'good-dev 字面量+段结构',
    args: ['--dev-file', path.join(fixtures, 'good-dev/atlas/dev/T-001-login-BE.md')],
    fail: false,
  },
  {
    name: 'bad-dev-todo-merged → dev 下应拆 per-T 文件',
    args: ['--root', path.join(fixtures, 'bad-dev-todo-merged'), '--only', 'dev'],
    fail: true,
    assertStdout: 'DEV-COVERAGE',
  },
  {
    name: 'bad-dev-no-purpose → 步骤缺用户/系统/改应失败',
    args: ['--dev-file', path.join(fixtures, 'bad-dev-no-purpose/atlas/dev/T-001-login-BE.md')],
    fail: true,
  },
  {
    name: 'bad-dev-paste-api → 契约粘贴 JSON 应失败',
    args: ['--dev-file', path.join(fixtures, 'bad-dev-paste-api/atlas/dev/T-001-login-BE.md')],
    fail: true,
  },
  {
    name: 'bad-full-no-flow-table → ## 步骤 旧格式应失败',
    args: ['--dev-file', path.join(fixtures, 'bad-full-no-flow-table/atlas/dev/T-001-login-BE.md'), '--tier', 'full'],
    fail: true,
    assertStdout: 'DEV-BAN-步骤',
  },
  {
    name: 'good-full-flow-table → BE 五段式应通过',
    args: ['--dev-file', path.join(fixtures, 'good-full-flow-table/atlas/dev/T-001-login-BE.md'), '--tier', 'full'],
    fail: false,
  },
  {
    name: 'good-fe-narrative-flow → FE/MP 五段式应通过',
    args: ['--dev-file', path.join(fixtures, 'good-fe-narrative-flow/atlas/dev/T-007-plan-MP.md')],
    fail: false,
  },
  {
    name: 'bad-dev-empty-result → 空结果占位符应失败',
    args: ['--root', path.join(fixtures, 'bad-dev-empty-result'), '--only', 'dev'],
    fail: true,
    assertStdout: 'DEV-RESULT-PLACEHOLDER',
  },
  {
    name: 'bad-dev-stub-backfill → 范围/做法+写码后填应失败',
    args: ['--root', path.join(fixtures, 'bad-dev-stub-backfill'), '--only', 'dev'],
    fail: true,
    assertStdout: 'DEV-STUB-先码后补',
  },
  {
    name: 'bad-dev-stub-backfill → 构思闸门①须挡',
    args: [
      '--gate',
      'dev-step1-literal',
      '--dev-file',
      path.join(fixtures, 'bad-dev-stub-backfill/atlas/dev/T-001-login-BE.md'),
    ],
    fail: true,
    assertStdout: 'DEV-BAN-做法',
  },
  {
    name: 'bad-dev-empty-summary → 摘要 bullet 空内容应失败',
    args: ['--root', path.join(fixtures, 'bad-dev-empty-summary'), '--only', 'dev'],
    fail: true,
    assertStdout: 'DEV-SUMMARY-结构',
  },
  {
    name: 'good-runnable → runnable 应通过',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'runnable'],
    fail: false,
  },
  {
    name: 'bad-tests-no-logs → 阶段 5 缺 atlas/logs/',
    args: ['--root', path.join(fixtures, 'bad-tests-no-logs'), '--phase', '5', '--only', 'dir'],
    fail: true,
    assertStdout: 'DIR-5-logs',
  },
  {
    name: 'bad-no-smoke → smoke 应失败',
    args: ['--root', path.join(fixtures, 'bad-no-smoke'), '--only', 'smoke'],
    fail: true,
  },
  {
    name: 'good-runnable → smoke 应通过',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'smoke'],
    fail: false,
  },
  {
    name: 'bad-no-fe-smoke → 有 FE 无 Playwright 报告应失败',
    args: ['--root', path.join(fixtures, 'bad-no-fe-smoke'), '--only', 'smoke'],
    fail: true,
    assertStdout: 'FE-SMOKE-NO-REPORT',
  },
  {
    name: 'good-fe-smoke → Playwright+截图+目视应通过',
    args: ['--root', path.join(fixtures, 'good-fe-smoke'), '--only', 'smoke'],
    fail: false,
  },
  {
    name: 'list-gates',
    args: ['--list-gates'],
    fail: false,
  },
  {
    name: 'print-skill-root',
    args: ['--print-skill-root'],
    fail: false,
  },
  {
    name: 'bad-no-pixel → 有强制原型无报告应失败',
    args: ['--root', path.join(fixtures, 'bad-no-pixel'), '--only', 'pixel'],
    fail: true,
  },
  {
    name: 'good-pixel → report PASS 应通过',
    args: ['--root', path.join(fixtures, 'good-pixel'), '--only', 'pixel'],
    fail: false,
  },
  {
    name: 'good-pixel → ui/README 索引不误判为 UID',
    args: ['--root', path.join(fixtures, 'good-pixel'), '--only', 'req'],
    fail: false,
  },
  {
    name: 'bad-stale-pixel → 未覆盖全部强制原型应失败',
    args: ['--root', path.join(fixtures, 'bad-stale-pixel'), '--only', 'pixel'],
    fail: true,
  },
  {
    name: 'orphan-proto-only → 目录散图不阻塞闸门',
    args: ['--root', path.join(fixtures, 'orphan-proto-only'), '--only', 'pixel'],
    fail: false,
  },
  {
    name: 'bad-sol-missing-features → sol 缺 features/ 和 README',
    args: ['--root', path.join(fixtures, 'bad-sol-missing-features'), '--phase', '3', '--only', 'dir'],
    fail: true,
    assertStdout: 'DIR-3-solution-features',
  },
  {
    name: 'bad-sol-missing-features → SOL-FEATURES-000 有 REQ 无 F',
    args: ['--root', path.join(fixtures, 'bad-sol-missing-features'), '--phase', '3', '--only', 'sol'],
    fail: true,
    assertStdout: 'SOL-FEATURES-000',
  },
  {
    name: 'bad-orch-no-dispatch → req-confirm 无台账应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-no-dispatch'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'ORCH-NO-DISPATCH',
  },
  {
    name: 'bad-orch-no-subagent-id → 缺 subagentId 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-no-subagent-id'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'ORCH-NO-SUBAGENT-ID',
  },
  {
    name: 'bad-orch-degraded-no-reason → 缺 degradedReason 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-degraded-no-reason'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'ORCH-DEGRADED-REASON',
  },
  {
    name: 'bad-orch-degraded-conflict-full → full+capability 却 degraded 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-degraded-conflict-full'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'ORCH-DEGRADED-CONFLICT',
  },
  {
    name: 'bad-orch-no-subagent-id → dev-complete 收口仍验 subagentId',
    args: ['--root', path.join(fixtures, 'bad-orch-no-subagent-id'), '--gate', 'dev-complete'],
    fail: true,
    assertStdout: 'ORCH-NO-SUBAGENT-ID',
  },
  {
    name: 'bad-orch-mismatch-req → req-confirm paths 未覆盖 REQ 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-mismatch-req'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'ORCH-DISPATCH-MISMATCH',
  },
  {
    name: 'bad-orch-legacy-path → req-confirm 旧路径台账 warn 硬挡',
    args: ['--root', path.join(fixtures, 'bad-orch-legacy-path'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'ORCH-DISPATCH-LEGACY-PATH',
  },
  {
    name: 'bad-orch-no-model → mod-confirm 无 role=model 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-no-model'), '--gate', 'mod-confirm'],
    fail: true,
    assertStdout: 'ORCH-NO-DISPATCH',
  },
  {
    name: 'bad-orch-dev-mismatch → write-code dev 台账未覆盖应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-dev-mismatch'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'ORCH-DISPATCH-MISMATCH',
  },
  {
    name: 'bad-orch-write-code-no-upstream → write-code 缺 role=req 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-write-code-no-upstream'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'ORCH-NO-DISPATCH',
  },
  {
    name: 'bad-orch-no-dev-artifact → write-code 有源码无 T 应失败',
    args: ['--root', path.join(fixtures, 'bad-orch-no-dev-artifact'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'ORCH-NO-DEV-ARTIFACT',
  },
  {
    name: 'bad-orch-legacy-dev-step1 → dev-step1 旧路径 warn 硬挡',
    args: [
      '--gate',
      'dev-step1-literal',
      '--root',
      path.join(fixtures, 'bad-orch-legacy-dev-step1'),
      '--dev-file',
      path.join(fixtures, 'bad-orch-legacy-dev-step1/atlas/dev/T-007-plan-MP.md'),
    ],
    fail: true,
    assertStdout: 'ORCH-DISPATCH-LEGACY-PATH',
  },
  {
    name: 'good-req-custom-role → req custom 跳过 REQ 格式闸门',
    args: ['--root', path.join(fixtures, 'good-req-custom-role'), '--gate', 'req-confirm'],
    fail: false,
    assertStdout: 'ROLE-CUSTOM-SKIP',
    assertNotStdout: 'REQ-F002',
  },
  {
    name: 'bad-req-default-role → 默认 role 仍挡坏 REQ',
    args: ['--root', path.join(fixtures, 'bad-req-default-role'), '--gate', 'req-confirm'],
    fail: true,
    assertStdout: 'REQ-F002',
  },
  {
    name: 'good-dev-custom-literal → dev custom 跳过 literal ORCH 仍检',
    args: [
      '--gate',
      'dev-step1-literal',
      '--root',
      path.join(fixtures, 'good-dev-custom-literal'),
      '--dev-file',
      path.join(fixtures, 'good-dev-custom-literal/atlas/dev/T-001-login-BE.md'),
    ],
    fail: false,
    assertStdout: 'ROLE-CUSTOM-SKIP',
    assertNotStdout: 'DEV-BAN-做法',
  },
  {
    name: 'good-sol-custom-todo → sol custom 跳过 TODO-FORMAT',
    args: ['--root', path.join(fixtures, 'good-sol-custom-todo'), '--gate', 'sol-confirm'],
    fail: false,
    assertStdout: 'ROLE-CUSTOM-SKIP',
    assertNotStdout: 'TODO-FORMAT-缺①',
  },
  {
    name: 'bad-sol-custom-still-checks → sol custom 仍挡 TODO-CHECK',
    args: ['--root', path.join(fixtures, 'bad-sol-custom-still-checks'), '--only', 'todo'],
    fail: true,
    assertStdout: 'TODO-CHECK-',
  },
  {
    name: 'good-model-custom → model custom 跳过 MOD 格式闸门',
    args: ['--root', path.join(fixtures, 'good-model-custom'), '--only', 'model'],
    fail: false,
    assertStdout: 'ROLE-CUSTOM-SKIP',
    assertNotStdout: 'MOD-R002',
  },
  {
    name: 'good-sol-confirm → 阶段3有T无dev 应通过',
    args: ['--root', path.join(fixtures, 'good-sol-confirm'), '--gate', 'sol-confirm'],
    fail: false,
  },
  {
    name: 'bad-sol-user-pending → user未问栈应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-user-pending'), '--gate', 'sol-confirm'],
    fail: true,
  },
  {
    name: 'good-sol-confirm → 仅 af-env 应通过',
    args: ['--root', path.join(fixtures, 'good-sol-confirm'), '--only', 'af-env', '--phase', '3'],
    fail: false,
  },
  {
    name: 'good-sol-confirm → write-code 有 T 无 dev 应失败（首笔写码亦须 dev①）',
    args: ['--root', path.join(fixtures, 'good-sol-confirm'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'DOC-FIRST-无dev',
  },
  {
    name: 'bad-sol-f-card → F 联调卡应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-f-card'), '--only', 'sol'],
    fail: true,
  },
  {
    name: 'bad-sol-ui-no-bind → UI 缺字段绑定应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-ui-no-bind'), '--only', 'sol'],
    fail: true,
  },
  {
    name: 'good-template-minimal → req 应通过',
    args: ['--root', path.join(fixtures, 'good-template-minimal'), '--only', 'req'],
    fail: false,
  },
  {
    name: 'good-template-minimal → dev 应通过',
    args: ['--root', path.join(fixtures, 'good-template-minimal'), '--only', 'dev'],
    fail: false,
  },
  {
    name: 'good-template-minimal → dir phase3 无 features 应通过',
    args: ['--root', path.join(fixtures, 'good-template-minimal'), '--only', 'dir', '--phase', '3'],
    fail: false,
  },
  {
    name: 'bad-dual-check → 仅 TMPL 无 legacy REQ-F',
    args: ['--root', path.join(fixtures, 'bad-dual-check'), '--only', 'req'],
    fail: true,
    assertStdout: 'TMPL-AC-BULLET',
    assertNotStdout: 'REQ-F005',
  },
  {
    name: 'good-template-standard → sol 应通过',
    args: ['--root', path.join(fixtures, 'good-template-standard'), '--only', 'sol'],
    fail: false,
  },
  {
    name: 'bad-template-dev-no-anchor → dev 缺锚点应失败',
    args: ['--root', path.join(fixtures, 'bad-template-dev-no-anchor'), '--only', 'dev'],
    fail: true,
    assertStdout: 'TMPL-DEV-FLOW-ANCHOR',
  },
  {
    name: 'bad-skip-code → write-code 有业务码无 architecture 应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'SKIP-CODE-无architecture',
  },
  {
    name: 'bad-skip-code → write-code README 冒充 T 应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'SKIP-README冒充T',
  },
  {
    name: 'bad-skip-code → write-code 闸门应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--gate', 'write-code'],
    fail: true,
    assertStdout: 'SKIP-',
  },
  {
    name: 'bad-skip-code → anti-skip 别名与 write-code 同结果',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--gate', 'anti-skip'],
    fail: true,
    assertStdout: 'SKIP-CODE-无architecture',
  },
  {
    name: 'bad-skip-code → integrity 档不查 SKIP-CODE',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'doc-first'],
    fail: true,
    assertStdout: 'SKIP-README冒充T',
    assertNotStdout: 'SKIP-CODE-无architecture',
  },
  {
    name: 'bad-skip-code → README 揉方案应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'sol'],
    fail: true,
    assertStdout: 'SOL-README-MASH',
  },
  {
    name: 'bad-skip-code → 假测试进度应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'doc-first'],
    fail: true,
    assertStdout: 'SKIP-测试',
  },
];

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log('PASS: ' + name);
    passed++;
  } else {
    console.log('FAIL: ' + name + (detail ? ' | ' + detail : ''));
    failed++;
  }
}

for (const c of cases) {
  const result = spawnSync(process.execPath, [cli, ...c.args], {
    encoding: 'utf8',
    cwd: skillRoot,
  });
  const exitCode = result.status ?? 1;
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  let good = c.fail ? exitCode !== 0 : exitCode === 0;
  if (good && c.assertStdout && !out.includes(c.assertStdout)) good = false;
  if (good && c.assertNotStdout && out.includes(c.assertNotStdout)) good = false;
  if (good && c.assertJson) {
    try {
      JSON.parse(result.stdout || '');
    } catch {
      good = false;
    }
  }
  if (good) {
    console.log('PASS: ' + c.name);
    passed++;
  } else {
    console.log('FAIL: ' + c.name + ' | exit=' + exitCode);
    if (result.stderr) console.log(result.stderr.slice(0, 400));
    if (result.stdout) console.log(result.stdout.slice(0, 400));
    failed++;
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-bf-'));
try {
  fs.mkdirSync(path.join(tmp, 'packages'), { recursive: true });
  check('空 packages/ → greenfield', detectBrownfield(tmp) === false);

  fs.mkdirSync(path.join(tmp, 'atlas', 'init'), { recursive: true });
  check('空 atlas/init/ → greenfield', detectBrownfield(tmp) === false);

  fs.writeFileSync(path.join(tmp, 'atlas', 'init', 'README.md'), '# init\n');
  check('有 atlas/init/README.md → brownfield', detectBrownfield(tmp) === true);

  fs.rmSync(path.join(tmp, 'atlas'), { recursive: true, force: true });
  fs.writeFileSync(path.join(tmp, 'packages', 'app.ts'), 'export {}\n');
  check('packages 内有 .ts → brownfield', detectBrownfield(tmp) === true);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

check(
  'skill-path 可解析 validate 脚本',
  fs.existsSync(resolveValidateScript(skillRoot)) &&
    resolveSkillRoot(skillRoot).replace(/\\/g, '/').includes('agileflow')
);

const bootstrapRoot = path.join(fixtures, 'good-req-custom-role');
const beforeCustom = [...loadCustomRoles(bootstrapRoot)];
bootstrapAtlasScaffold(bootstrapRoot);
const afterCustom = [...loadCustomRoles(bootstrapRoot)];
check(
  'bootstrap 不重置已有 custom role baseline',
  beforeCustom.includes('req') && afterCustom.includes('req'),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
