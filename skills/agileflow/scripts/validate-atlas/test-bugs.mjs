/**
 * atlas/bugs 缺陷账本校验回归。
 *
 * 目的：钉死“先关联 REQ/AC、再修复；有回归证据才可关闭”的最小闭环，
 * 同时保证没有 bugs/ 的轻微修复项目不被强制文档化。
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Reporter } from './lib/reporter.mjs';
import { validateBugs } from './lib/rules/bugs.mjs';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bin = path.join(skillRoot, 'bin', 'agileflow.mjs');

function project() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'af-bugs-'));
}

function validate(root) {
  const reporter = new Reporter();
  validateBugs(root, reporter);
  return reporter;
}

function writeRegistry(root, rows) {
  const bugsRoot = path.join(root, 'atlas', 'bugs');
  fs.mkdirSync(bugsRoot, { recursive: true });
  fs.writeFileSync(
    path.join(bugsRoot, 'README.md'),
    [
      '# 缺陷追踪',
      '',
      '| Bug ID | 缺陷 | 来源批次 | 严重度 | REQ 判定 | 关联 REQ/AC | 归因 | 处理路径 | 回归测试 | 状态 | 详情 |',
      '|--------|------|----------|--------|----------|-------------|------|----------|----------|------|------|',
      ...rows,
      '',
    ].join('\n'),
  );
}

const noBugs = project();
assert.equal(validate(noBugs).passed(), true, '没有 bugs/ 时保持零文档路径');

const missingReadme = project();
fs.mkdirSync(path.join(missingReadme, 'atlas', 'bugs'), { recursive: true });
assert.ok(
  validate(missingReadme).getIssues().some((issue) => issue.rule === 'BUG-README-MISSING'),
  '创建 bugs/ 后必须有 README 状态总表',
);

const emptyRegistry = project();
writeRegistry(emptyRegistry, []);
assert.ok(
  validate(emptyRegistry).getIssues().some((issue) => issue.rule === 'BUG-TABLE-EMPTY'),
  '没有缺陷时不应预建空 bugs/ 目录',
);

const invalidClosed = project();
writeRegistry(invalidClosed, [
  '| BUG-001 | 登录跳转错误 | 用户反馈-01 | P1 | 已覆盖 | — | 实现错误 | revise 修复 | — | 已关闭 | — |',
]);
const invalidClosedIssues = validate(invalidClosed).getIssues();
assert.ok(
  invalidClosedIssues.some((issue) => issue.rule === 'BUG-REQ-TRACE'),
  '已关闭前必须关联 REQ + AC',
);
assert.ok(
  invalidClosedIssues.some((issue) => issue.rule === 'BUG-CLOSE-EVIDENCE'),
  '已关闭前必须有回归证据',
);

const splitWithoutReq = project();
writeRegistry(splitWithoutReq, [
  '| BUG-001 | 增加短信登录 | 用户反馈-01 | — | 新需求 | — | 新需求 | /af-req | — | 已转需求 | — |',
]);
assert.ok(
  validate(splitWithoutReq).getIssues().some((issue) => issue.rule === 'BUG-SPLIT-REQ'),
  '已转需求必须链接拆出的 REQ',
);

const duplicate = project();
writeRegistry(duplicate, [
  '| BUG-001 | A | 用户反馈-01 | P2 | 待覆盖 | — | 待归因 | — | — | 待核对需求 | — |',
  '| BUG-001 | B | 用户反馈-01 | P2 | 待覆盖 | — | 待归因 | — | — | 待核对需求 | — |',
]);
assert.ok(
  validate(duplicate).getIssues().some((issue) => issue.rule === 'BUG-ID-DUPLICATE'),
  'Bug ID 不得复用',
);

const valid = project();
writeRegistry(valid, [
  '| BUG-001 | 登录跳转错误 | 用户反馈-01 | P1 | 已覆盖 | REQ-001 / AC-001-03 | 实现错误 | revise 修复 | `atlas/tests/REQ-001-验收报告.md` | 已关闭 | [详情](BUG-001-login.md) |',
  '| BUG-002 | 增加短信登录 | 用户反馈-01 | — | 新需求 | REQ-002 | 新需求 | /af-req | — | 已转需求 | — |',
]);
fs.writeFileSync(
  path.join(valid, 'atlas', 'bugs', 'BUG-001-login.md'),
  '# BUG-001：登录跳转错误\n',
);
assert.equal(validate(valid).passed(), true, '完整需求追踪与回归证据可关闭');

const invalidCli = spawnSync(
  process.execPath,
  [bin, 'validate', '--only', 'bugs', '--root', invalidClosed],
  { encoding: 'utf8' },
);
assert.equal(invalidCli.status, 1, '用户命令须挡住无追踪、无证据的已关闭 Bug');
assert.match(
  `${invalidCli.stdout}\n${invalidCli.stderr}`,
  /BUG-REQ-TRACE|BUG-CLOSE-EVIDENCE/,
  '用户命令返回明确 Bug 规则编号',
);

const validCli = spawnSync(
  process.execPath,
  [bin, 'validate', '--only', 'bugs', '--root', valid],
  { encoding: 'utf8' },
);
assert.equal(validCli.status, 0, validCli.stderr || validCli.stdout);

console.log('bugs tests passed');
