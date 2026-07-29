#!/usr/bin/env node
/**
 * `agileflow context` 只读状态摘要测试。
 * 覆盖空项目默认路由、brownfield 前置、Flow/env 聚合与 CLI JSON 输出。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildProjectContext } from './runtime-command.mjs';
import { Reporter } from '../scripts/validate-atlas/lib/reporter.mjs';
import { validateInit } from '../scripts/validate-atlas/lib/rules/init.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(__dirname, '..', 'bin', 'agileflow.mjs');

const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-empty-'));
const emptyBefore = fs.readdirSync(emptyRoot);
const emptyContext = buildProjectContext(emptyRoot);
assert.equal(emptyContext.projectType, 'greenfield');
assert.deepEqual(emptyContext.suggestedSteps, ['af-req']);
assert.equal(emptyContext.source, 'default');
assert.deepEqual(emptyContext.init, {
  present: false,
  status: 'missing',
  scope: 'none',
  target: '',
  targets: [],
  coveredPaths: [],
  legacy: false,
  required: false,
  recommendedScope: null,
});
assert.deepEqual(fs.readdirSync(emptyRoot), emptyBefore);
console.log('ok   empty context is greenfield and remains read-only');

const brownfieldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-brownfield-'));
fs.mkdirSync(path.join(brownfieldRoot, 'src'), { recursive: true });
fs.writeFileSync(path.join(brownfieldRoot, 'src', 'app.js'), 'export const app = true;\n');
const brownfieldContext = buildProjectContext(brownfieldRoot);
assert.equal(brownfieldContext.projectType, 'brownfield');
assert.deepEqual(brownfieldContext.suggestedSteps, ['af-init']);
assert.equal(brownfieldContext.init.required, true);
assert.equal(brownfieldContext.init.recommendedScope, 'local');
console.log('ok   brownfield without Flow suggests local af-init');

fs.mkdirSync(path.join(brownfieldRoot, 'atlas'), { recursive: true });
fs.writeFileSync(
  path.join(brownfieldRoot, 'atlas', 'flow.yaml'),
  `version: 1
steps:
  - id: af-req
    mode: strict
    prompt: atlas/role/role-req.md
    depends: []
    outputs: [atlas/requirements/]
`,
);
const brownfieldWithFlow = buildProjectContext(brownfieldRoot);
assert.deepEqual(brownfieldWithFlow.suggestedSteps, ['af-init']);
console.log('ok   brownfield pre-flow stays af-init even when Flow exists');

fs.mkdirSync(path.join(brownfieldRoot, 'atlas', 'init'), { recursive: true });
fs.writeFileSync(
  path.join(brownfieldRoot, 'atlas', 'init', 'README.md'),
  `# 局部盘点

## 覆盖范围（init）
- 盘点模式：local
- 任务锚点：登录超时修复
- 覆盖路径：\`src/auth\`, \`src/session\`

## 文档状态
- 状态：已确认
`,
);
const brownfieldLocalInit = buildProjectContext(brownfieldRoot);
assert.equal(brownfieldLocalInit.init.required, false);
assert.equal(brownfieldLocalInit.init.scope, 'local');
assert.equal(brownfieldLocalInit.init.target, '登录超时修复');
assert.deepEqual(brownfieldLocalInit.init.targets, ['登录超时修复']);
assert.deepEqual(brownfieldLocalInit.init.coveredPaths, ['src/auth', 'src/session']);
assert.equal(brownfieldLocalInit.init.recommendedScope, 'local');
assert.deepEqual(brownfieldLocalInit.suggestedSteps, ['af-req']);
console.log('ok   confirmed local init exposes reusable coverage');

fs.writeFileSync(
  path.join(brownfieldRoot, 'atlas', 'init', 'README.md'),
  `# 累积盘点

## 覆盖范围（init）
### 登录超时修复
- 盘点模式：local
- 任务锚点：登录超时修复
- 覆盖路径：\`src/auth\`, \`src/session\`

### 订单权限联动
- 盘点模式：dependencies
- 任务锚点：订单权限联动
- 覆盖路径：\`src/orders\`, \`src/permissions\`

## 文档状态
- 状态：已确认
`,
);
const brownfieldAccumulatedInit = buildProjectContext(brownfieldRoot);
assert.equal(brownfieldAccumulatedInit.init.scope, 'dependencies');
assert.equal(brownfieldAccumulatedInit.init.target, '订单权限联动');
assert.deepEqual(brownfieldAccumulatedInit.init.targets, ['登录超时修复', '订单权限联动']);
assert.deepEqual(
  brownfieldAccumulatedInit.init.coveredPaths,
  ['src/auth', 'src/session', 'src/orders', 'src/permissions'],
);
console.log('ok   incremental init records accumulate without losing prior coverage');

const legacyBrownfieldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-legacy-init-'));
fs.mkdirSync(path.join(legacyBrownfieldRoot, 'src'), { recursive: true });
fs.writeFileSync(path.join(legacyBrownfieldRoot, 'src', 'app.js'), 'export const app = true;\n');
fs.mkdirSync(path.join(legacyBrownfieldRoot, 'atlas', 'init'), { recursive: true });
fs.writeFileSync(
  path.join(legacyBrownfieldRoot, 'atlas', 'init', 'README.md'),
  '# 旧版盘点\n\n## 文档状态\n- 状态：已确认\n',
);
const legacyBrownfieldContext = buildProjectContext(legacyBrownfieldRoot);
assert.equal(legacyBrownfieldContext.init.scope, 'full');
assert.equal(legacyBrownfieldContext.init.legacy, true);
assert.equal(legacyBrownfieldContext.init.recommendedScope, null);
console.log('ok   legacy confirmed init remains full coverage');

const initValidationRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-init-rules-'));
fs.mkdirSync(path.join(initValidationRoot, 'atlas', 'init'), { recursive: true });
fs.writeFileSync(
  path.join(initValidationRoot, 'atlas', 'init', 'README.md'),
  '# 旧版盘点\n\n## 覆盖范围（init）\n\n## 三大业务闭环\n- 登录\n',
);
const legacyInitReporter = new Reporter();
validateInit(initValidationRoot, legacyInitReporter);
assert.equal(legacyInitReporter.passed(), true);
assert(legacyInitReporter.getIssues().some((issue) => issue.rule === 'INIT-R004'));

fs.writeFileSync(
  path.join(initValidationRoot, 'atlas', 'init', 'README.md'),
  '# 局部盘点\n\n## 覆盖范围（init）\n- 盘点模式：local\n\n## 三大业务闭环\n- 登录\n',
);
const invalidScopedInitReporter = new Reporter();
validateInit(initValidationRoot, invalidScopedInitReporter);
assert.equal(invalidScopedInitReporter.passed(), false);
assert(invalidScopedInitReporter.getIssues().some((issue) => issue.rule === 'INIT-R005'));
assert(invalidScopedInitReporter.getIssues().some((issue) => issue.rule === 'INIT-R006'));

fs.writeFileSync(
  path.join(initValidationRoot, 'atlas', 'init', 'README.md'),
  '# 局部盘点\n\n## 覆盖范围（init）\n- 盘点模式：local\n- 任务锚点：登录超时\n- 覆盖路径：`src/auth`\n\n## 三大业务闭环\n- 登录\n',
);
const validScopedInitReporter = new Reporter();
validateInit(initValidationRoot, validScopedInitReporter);
assert.equal(validScopedInitReporter.passed(), true);
console.log('ok   init validation accepts legacy docs and enforces scoped metadata');

const flowRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-flow-'));
fs.mkdirSync(path.join(flowRoot, 'atlas', 'requirements'), { recursive: true });
fs.writeFileSync(
  path.join(flowRoot, 'atlas', 'flow.yaml'),
  `version: 1
steps:
  - id: af-req
    mode: strict
    prompt: atlas/role/role-req.md
    depends: []
    outputs:
      - atlas/requirements/REQ-*.md
  - id: af-sol
    mode: strict
    prompt: atlas/role/role-sol.md
    depends:
      - atlas/requirements/REQ-*.md
    outputs:
      - atlas/solution/README.md
`,
);
fs.writeFileSync(
  path.join(flowRoot, 'atlas', 'agileflow.env'),
  `AF_PHASE=3
AF_STEP=af-sol
AF_DECIDE=ai
AF_TIER=full
AF_STACK_SOURCE=ai_record
AF_HOST_CAPABILITY=full
`,
);
fs.writeFileSync(
  path.join(flowRoot, 'atlas', 'requirements', 'REQ-001-context.md'),
  '# Context\n\n状态：已确认\n',
);
const flowContext = buildProjectContext(flowRoot);
assert.equal(flowContext.source, 'env');
assert.deepEqual(flowContext.currentSteps, ['af-sol']);
assert.deepEqual(flowContext.suggestedSteps, ['af-sol']);
assert(flowContext.readySteps.includes('af-sol'));
assert.deepEqual(flowContext.flow.stepIds, ['af-req', 'af-sol']);
assert.equal(flowContext.decisionMode, 'ai');
console.log('ok   context aggregates Flow, env and ready steps');

const cli = spawnSync(process.execPath, [bin, 'context', '--json', '--root', flowRoot], {
  encoding: 'utf8',
  env: { ...process.env, AGILEFLOW_NO_UPDATE_CHECK: '1' },
});
assert.equal(cli.status, 0);
const cliContext = JSON.parse(cli.stdout);
assert.deepEqual(cliContext.suggestedSteps, ['af-sol']);
assert.equal(cliContext.flow.loaded, true);
console.log('ok   agileflow context --json returns stable JSON');

console.log('\nall context tests passed');
