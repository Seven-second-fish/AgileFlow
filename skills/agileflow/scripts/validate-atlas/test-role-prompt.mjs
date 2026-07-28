#!/usr/bin/env node
/**
 * resolveRolePrompt / assembleSkillLayers 单元测试
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assembleSkillLayers,
  buildTaskEnvelope,
  formatDispatchPrompt,
  resolveRolePrompt,
  validateSkillLayers,
} from './lib/role-prompt.mjs';
import { ensureFlowYaml } from './lib/flow.mjs';
import { hashRoleContent, writeRoleBaselines } from './lib/rules/role-custom.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');
const fixturesRoot = path.join(__dirname, 'fixtures');

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL  ${msg}`);
    failed += 1;
  } else {
    console.log(`ok    ${msg}`);
  }
}

// —— layers 目录完整 ——
const layerCheck = validateSkillLayers(skillRoot);
assert(layerCheck.ok, `skill layers 完整（缺: ${layerCheck.missing.join(', ') || '无'}）`);

// —— assembled 默认比 full custom 短 ——
const devAssembled = assembleSkillLayers('dev', skillRoot);
const devFull = assembleSkillLayers('dev', skillRoot, { includeQuality: true, includeExamples: true });
assert(devAssembled.length < devFull.length, 'dev assembled 默认短于 quality+examples');
assert(devAssembled.includes('硬禁止'), 'dev core 含硬禁止');
assert(!devAssembled.includes('少样本示例'), 'dev 默认不含 examples');

// —— custom fixture：全文 verbatim ——
const customRoot = path.join(fixturesRoot, 'good-req-custom-role');
const customResolved = resolveRolePrompt(customRoot, 'atlas/role/role-req.md', { skillRoot });
assert(customResolved.mode === 'custom', 'good-req-custom-role → custom 模式');
assert(customResolved.body.includes('# 自定义'), 'custom 模式读 atlas 全文');
const legacyResolved = resolveRolePrompt(customRoot, 'req', { skillRoot });
assert(legacyResolved.mode === 'custom', '旧 role 短名仍兼容');

// —— 默认 fixture：assembled ——
const defaultRoot = path.join(fixturesRoot, 'good-sol-confirm');
// 先同步 baseline 到 stamp（若漂移）
const stampReq = fs.readFileSync(path.join(skillRoot, 'templates/role/role-sol.md'), 'utf8');
const atlasSol = path.join(defaultRoot, 'atlas/role/role-sol.md');
if (fs.existsSync(atlasSol)) {
  const current = fs.readFileSync(atlasSol, 'utf8');
  if (hashRoleContent(current) !== hashRoleContent(stampReq) && !/^#\s*自定义/m.test(current.trimStart())) {
    fs.writeFileSync(atlasSol, stampReq);
    writeRoleBaselines(defaultRoot, { force: true });
  }
}
const defaultResolved = resolveRolePrompt(defaultRoot, 'atlas/role/role-sol.md', { skillRoot });
assert(defaultResolved.mode === 'assembled', 'good-sol-confirm sol → assembled 模式');
assert(defaultResolved.body.includes('assembled from skill layers'), 'assembled 来自 layers');

// —— 任意项目 Role/Skill Markdown 路径：全文派发 ——
const pathPromptRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-role-path-'));
const projectSkillPath = path.join(pathPromptRoot, 'skills', 'security-review', 'SKILL.md');
fs.mkdirSync(path.dirname(projectSkillPath), { recursive: true });
fs.writeFileSync(projectSkillPath, '# Security Review Role\n');
const pathResolved = resolveRolePrompt(
  pathPromptRoot,
  'skills/security-review/SKILL.md',
  { skillRoot },
);
assert(pathResolved.mode === 'custom', '项目 Skill 路径 → custom 模式');
assert(pathResolved.body.includes('Security Review Role'), '项目 Skill 路径读取全文');
let traversalRejected = false;
try {
  resolveRolePrompt(pathPromptRoot, '../outside.md', { skillRoot });
} catch {
  traversalRejected = true;
}
assert(traversalRejected, 'prompt 禁止越出项目目录');

// —— 任务信封 ——
const envelope = buildTaskEnvelope({
  phase: 4,
  decide: 'ai',
  summary: '实现 T-001',
  taskId: 'T-001',
  upstreamPaths: ['atlas/solution/features/F-001.md'],
  gate: 'validate-atlas --gate dev-step1-literal --dev-file atlas/dev/T-001.md --root .',
});
assert(envelope.includes('上游路径'), '任务信封含上游路径');
assert(!envelope.includes('Given/When'), '任务信封不贴正文');

const prompt = formatDispatchPrompt('ROLE-BODY', { phase: 1, summary: '写 REQ' });
assert(prompt.startsWith('ROLE-BODY'), 'formatDispatchPrompt 拼接 role + 信封');
assert(prompt.includes('## 本次任务'), 'formatDispatchPrompt 含任务块');

if (failed) {
  console.error(`\n${failed} role-prompt test(s) failed`);
  process.exit(1);
}
console.log('\nall role-prompt tests passed');
