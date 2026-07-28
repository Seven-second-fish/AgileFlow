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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(__dirname, '..', 'bin', 'agileflow.mjs');

const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-empty-'));
const emptyBefore = fs.readdirSync(emptyRoot);
const emptyContext = buildProjectContext(emptyRoot);
assert.equal(emptyContext.projectType, 'greenfield');
assert.deepEqual(emptyContext.suggestedSteps, ['af-req']);
assert.equal(emptyContext.source, 'default');
assert.deepEqual(fs.readdirSync(emptyRoot), emptyBefore);
console.log('ok   empty context is greenfield and remains read-only');

const brownfieldRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-context-brownfield-'));
fs.mkdirSync(path.join(brownfieldRoot, 'src'), { recursive: true });
fs.writeFileSync(path.join(brownfieldRoot, 'src', 'app.js'), 'export const app = true;\n');
const brownfieldContext = buildProjectContext(brownfieldRoot);
assert.equal(brownfieldContext.projectType, 'brownfield');
assert.deepEqual(brownfieldContext.suggestedSteps, ['af-init']);
console.log('ok   brownfield without Flow suggests af-init');

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
