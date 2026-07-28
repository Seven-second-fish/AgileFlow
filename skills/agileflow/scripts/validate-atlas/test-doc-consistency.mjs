#!/usr/bin/env node
/**
 * 文档交叉一致性（防文案互相打架 / 防旧文件回潮）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');

let failed = 0;

function read(rel) {
  return fs.readFileSync(path.join(skillRoot, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(skillRoot, rel));
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL  ${msg}`);
    failed += 1;
  } else {
    console.log(`ok    ${msg}`);
  }
}

function mustInclude(rel, needle, label = needle) {
  assert(read(rel).includes(needle), `${rel} 须含「${label}」`);
}

function mustNotInclude(rel, needle, label = needle) {
  assert(!read(rel).includes(needle), `${rel} 禁止残留「${label}」`);
}

function mustExist(rel) {
  assert(exists(rel), `须存在 ${rel}`);
}

function mustNotExist(rel) {
  assert(!exists(rel), `须已删除 ${rel}`);
}

// —— 新 SSOT 必须存在 ——
mustExist('templates/contract.md');
mustExist('templates/dev.md');
mustExist('templates/solution.md');
mustExist('templates/init.md');
mustExist('templates/req.md');
mustExist('templates/uid.md');
mustExist('templates/model.md');
mustExist('templates/orchestrator-core.md');
mustExist('templates/orchestrator-ref.md');
mustExist('templates/orchestrator.md');

// —— KILL 清单不得回潮 ——
const killed = [
  'templates/stage-delegation.md',
  'templates/flow-modes.md',
  'templates/askquestion-gate.md',
  'templates/requirement-askquestion.md',
  'templates/subagent-contracts.md',
  'templates/visual-markers.md',
  'templates/dev-quickstart.md',
  'templates/dev-rationale.md',
  'templates/solution-core.md',
  'templates/solution-architecture.md',
  'phases/parallel-orchestration.md',
  'phases/task-tracking.md',
  'examples/fast-means-parallel.md',
];
for (const rel of killed) mustNotExist(rel);

// —— L0 / LOAD 分层 ——
mustInclude('SKILL.md', 'L0 五条');
mustInclude('SKILL.md', '## LOAD');
mustInclude('SKILL.md', 'WHEN flow-step af-req:');
mustInclude('SKILL.md', 'WHEN pre-flow af-init:');
mustInclude('SKILL.md', 'WHEN quick:');
mustInclude('SKILL.md', 'WHEN dispatch: templates/orchestrator-core.md');
mustInclude('SKILL.md', 'NEVER preload:');
mustInclude('templates/contract.md', '行为矩阵（ai vs user');
mustInclude('templates/contract.md', '必守边界');
mustInclude('templates/contract.md', '默认问人');
mustInclude('phases/01-requirement.md', 'contract §4');
mustInclude('phases/01-requirement.md', '## Agent 摘要');
mustInclude('phases/01-requirement.md', 'agent-摘要');
mustNotInclude('phases/01-requirement.md', '## 决策差异');
mustNotInclude('SKILL.md', 'AF_FLOW');
mustNotInclude('templates/contract.md', 'AF_FLOW');
mustNotInclude('templates/contract.md', '默认不问启动');
mustNotInclude('templates/contract.md', '默认不问：');

// —— 话术上下文（消双义）——
mustInclude('templates/contract.md', '后面都你定');
mustInclude('SKILL.md', '中途 AI 接管');
mustInclude('SKILL.md', 'contract §3');

// —— ai 连做 / user 闸门 ——
mustInclude('SKILL.md', '同会话连做');
mustInclude('templates/contract.md', '同会话连做');
mustInclude('templates/orchestrator-core.md', '自治循环');
mustInclude('templates/orchestrator-core.md', '阻塞式');
mustInclude('templates/orchestrator-core.md', '派完一批等人「继续」');
mustInclude('templates/contract.md', 'AF_DECIDE');
mustInclude('templates/orchestrator-core.md', 'AF_DECIDE');

// —— AC 收口 ——
mustInclude('templates/orchestrator-ref.md', 'REQ AC 回填');
mustInclude('scripts/validate-atlas/lib/phase-spec.mjs', 'req-ac-backfill');

// —— 并行在 04 ——
mustInclude('phases/04-development.md', '## 并行阶段-4');
mustInclude('phases/04-development.md', '自动并行');
mustInclude('phases/04-development.md', '必扫描');

// —— 多 Agent ——
mustInclude('SKILL.md', '多 Agent');
mustInclude('templates/orchestrator-core.md', 'WorkBuddy');
mustInclude('templates/orchestrator-core.md', '宿主义务');
mustInclude('templates/orchestrator.md', '用户话术');
mustInclude('templates/orchestrator-core.md', 'subagentId');
mustInclude('templates/orchestrator-core.md', '只开写码 subagent');
mustInclude('templates/orchestrator-core.md', 'AF_DECIDE');
mustInclude('SKILL.md', '每 T 一次 dev'); // 正向：文档也走 Subagent / 每 T

// —— 路径铁律 ——
mustInclude('SKILL.md', 'flow.yaml');
mustInclude('SKILL.md', '铁律路径');
mustInclude('phases/atlas-structure.md', '路径铁律');
mustInclude('templates/orchestrator-core.md', '铁律路径');

// —— 角色 ——
mustInclude('templates/role/README.md', 'atlas/role');
mustInclude('templates/role/README.md', 'baseline');
mustInclude('templates/validate-atlas-gate.md', 'ROLE-CUSTOM');
mustInclude('templates/role/README.md', 'resolveRolePrompt');
mustInclude('templates/orchestrator-ref.md', 'resolveRolePrompt');
mustExist('scripts/validate-atlas/lib/role-prompt.mjs');
mustExist('templates/role/layers/dev/core.md');
mustExist('templates/role/layers/req/return.md');
mustInclude('templates/role/role-dev.md', 'AF-ROLE: assembled');
mustInclude('templates/contract.md', 'AF_HOST_CAPABILITY');
mustInclude('scripts/validate-atlas/lib/af-env.mjs', "AF_HOST_CAPABILITY: new Set(['full', 'degraded', 'pending'])");
mustInclude('scripts/validate-atlas/lib/rule-hints.mjs', 'ORCH-DEGRADED-REASON');
mustInclude('scripts/validate-atlas/lib/rule-hints.mjs', 'AF-ENV-CAPABILITY-PENDING');
mustInclude('templates/orchestrator-ref.md', 'checkpoint 协议');
mustInclude('phases/05-testing.md', '测试失败回退');
mustInclude('phases/change-management.md', '影响面判定');
mustNotInclude('phases/00-intent-routing.md', '../phases/05-testing.md');
mustInclude('templates/orchestrator-ref.md', '一次派活');
mustInclude('SKILL.md', 'atlas/role/');
mustInclude('SKILL.md', 'bootstrap-scaffold');

// —— 派活台账路径（项目 atlas/，非 .cursor/）——
mustInclude('SKILL.md', 'atlas/agileflow-dispatch.json');
mustInclude('templates/orchestrator-ref.md', 'atlas/agileflow-dispatch.json');
const dispatchDocFiles = [
  'SKILL.md',
  'templates/orchestrator.md',
  'templates/orchestrator-core.md',
  'templates/orchestrator-ref.md',
  'templates/validate-atlas-gate.md',
  'TROUBLESHOOTING.md',
  'templates/role/README.md',
  'QUICKSTART.md',
];
for (const rel of dispatchDocFiles) {
  mustNotInclude(rel, '.cursor/agileflow-dispatch', '.cursor/agileflow-dispatch');
  mustNotInclude(rel, 'atlas/.agileflow-dispatch.json', 'atlas/.agileflow-dispatch.json');
}
mustInclude('templates/orchestrator-ref.md', 'skill 目录', 'skill 目录说明');

// —— 闸门 ——
mustInclude('templates/validate-atlas-gate.md', '硬挡');
mustInclude('templates/validate-atlas-gate.md', '--gate req-confirm');
mustInclude('scripts/validate-atlas/lib/reporter.mjs', 'error 与 warn 均使校验失败');

// —— 质量 / 测试 ——
mustInclude('phases/04-development.md', '## 质量要求');
mustInclude('phases/05-testing.md', '证据来源：阶段4③复用');
mustInclude('phases/01-requirement.md', 'contract §4');

// —— 加载指向 contract / orch-core ——
mustInclude('SKILL.md', 'templates/contract.md');
mustInclude('SKILL.md', 'templates/dev.md');
mustInclude('SKILL.md', 'templates/orchestrator-core.md');

// —— 禁止旧路径字符串残留在关键文件 ——
mustNotInclude('SKILL.md', 'stage-delegation.md');
mustNotInclude('SKILL.md', 'flow-modes.md');
mustNotInclude('SKILL.md', 'askquestion-gate.md');
mustNotInclude('SKILL.md', 'dev-quickstart.md');
mustNotInclude('SKILL.md', 'parallel-orchestration.md');
mustNotInclude('SKILL.md', 'subagent-contracts.md');
mustNotInclude('phases/01-requirement.md', 'stage-delegation.md');
mustNotInclude('phases/04-development.md', 'parallel-orchestration.md');

mustInclude('phases/atlas-structure.md', '路径铁律');
mustExist('phases/atlas-structure.md');
mustInclude('templates/orchestrator-core.md', '正确做法与红线（≤15）');
mustInclude('SKILL.md', '正确做法与红线15');
mustInclude('SKILL.md', '红线（≤15');
mustNotInclude('templates/orchestrator-core.md', '## 反模式\n\n| 禁止 | 正确 |');
mustNotInclude('templates/orchestrator-core.md', '### 反模式（禁止 · 唯一表）');
mustInclude('SKILL.md', '一处定义、他处只链');
mustInclude('SKILL.md', '@agileflow/cli');
mustInclude('SKILL.md', '/af-');
mustInclude('SKILL.md', 'WHEN routing af:');
mustInclude('SKILL.md', 'WHEN routing af-explore: cli/snippets/l0-routing.md');
mustInclude('phases/00-intent-routing.md', '默认入口 `/af`');
mustInclude('phases/00-intent-routing.md', '万能自动路由');
mustInclude('phases/00-intent-routing.md', 'agileflow context --json');
mustInclude('phases/00-intent-routing.md', 'routeId');
mustInclude('phases/00-intent-routing.md', 'flow.stepIds');
mustInclude('phases/00-intent-routing.md', '| `af-revise` |');
mustInclude('phases/00-intent-routing.md', 'REQ 是否已确认不影响入口选择');
assert(
  read('phases/00-intent-routing.md').split(/\r?\n/).length <= 130,
  '00-intent-routing.md 须保持 ≤130 行的纯路由职责',
);
for (const removedSection of [
  '## 斜杠门牌细则',
  '## §atlas/',
  '## init 判定',
  '## §dev 入口分支',
  '## §TEMP',
  '## §建模按需判定',
  '## ① 豁免判定',
  '## 决策权判定',
  '## ② 读取项目状态',
  '## 路由决策表',
  '## 进入阶段后的行为',
]) {
  mustNotInclude('phases/00-intent-routing.md', removedSection);
}
mustNotInclude('phases/00-intent-routing.md', '跨 2+ 文件或 >20 行');
mustNotInclude('phases/00-intent-routing.md', '| `/af-req` |');
mustInclude('SKILL.md', '路径锚点');
mustInclude('SKILL.md', '不是**工作区项目根');
mustInclude('TROUBLESHOOTING.md', '00-intent-routing');
mustNotInclude('cli/workflows/_skeleton.mjs', 'Read 项目内 **agileflow** skill');
mustInclude('phases/quick-commands.md', 'agileflow log');
mustInclude('phases/quick-commands.md', 'AF-CMD');
mustInclude('phases/quick-commands.md', '≠ 免留痕');
mustNotInclude('scripts/validate-atlas/index.mjs', 'ensureAfCommandForGate');
mustNotInclude('scripts/validate-atlas/lib/workflow.mjs', 'ensureAfCommandForGate');
mustInclude('templates/validate-atlas-gate.md', '回执单权威');
mustInclude('templates/orchestrator-core.md', 'artifact scan');
mustInclude('templates/orchestrator-core.md', 'run abandon');
mustNotInclude('scripts/validate-atlas/lib/rules/af-commands.mjs', '闸门自动留痕');
mustInclude('cli/snippets/l0-flow.md', '不免留痕');
mustNotInclude('templates/flow.yaml', 'atlas/requirements/ui/prototypes/');
mustNotInclude('templates/flow.yaml', 'atlas/solution/code-patterns-*.md');
mustNotInclude('templates/flow.yaml', 'atlas/logs/fe-smoke-report.json');
mustInclude('templates/flow.yaml', '勿列入 outputs');
mustInclude('scripts/validate-atlas/lib/gate-receipts.mjs', 'AGILEFLOW_GATE_RESULT');
mustInclude('cli/snippets/l0-flow.md', '收尾留痕');
mustInclude('cli/snippets/l0-flow.md', 'agileflow/cli log');
mustInclude('cli/snippets/l0-flow.md', 'REQ-TITLE-SUBSTANCE');
mustInclude('templates/role/layers/req/quality.md', 'REQ-TITLE-SUBSTANCE');
mustInclude('templates/role/layers/req/quality.md', 'REQ-AC-MIN-ROWS');
mustInclude('bin/agileflow.mjs', 'agileflow log');
mustInclude('QUICKSTART.md', 'update --step-skills-only');
mustInclude('QUICKSTART.md', '/af 做一个');
mustInclude('tools/agent-retest/SCENARIOS.md', 'AGENT-RETEST.md');
mustInclude('tools/agent-retest/PROMPT.ai.md', '/af ');
mustNotInclude('tools/agent-retest/PROMPT.ai.md', '/agileflow ');
mustInclude('tools/agent-retest/PROMPT.ai.md', 'agileflow/cli log');
mustInclude('scripts/agent-retest/score.mjs', 'AF_COMMANDS');
mustInclude('../../AGENT-RETEST.md', 'AF_COMMANDS');
mustInclude('../../AGENT-RETEST.md', 'E16');
{
  const repoRoot = path.resolve(skillRoot, '..', '..');
  const retestMd = fs.readFileSync(path.join(repoRoot, 'AGENT-RETEST.md'), 'utf8');
  assert(retestMd.includes('## A ·'), 'AGENT-RETEST.md 须含 A 静态场景');
  assert(retestMd.includes('## B ·'), 'AGENT-RETEST.md 须含 B 门牌冒烟');
  assert(retestMd.includes('### B2'), 'AGENT-RETEST.md 须含 B2 /af 需求');
  assert(retestMd.includes('红了必须治本'), 'AGENT-RETEST.md 须含复测治本铁律');
  assert(retestMd.includes('### R10'), 'AGENT-RETEST.md 须含 R10 禁向前 rewind');
  assert(retestMd.includes('### R11'), 'AGENT-RETEST.md 须含 R11 force+reason');
  assert(!retestMd.includes('L3-R1'), 'AGENT-RETEST.md 不应再主推 L 编号');
}
mustNotInclude('QUICKSTART.md', '`req: 做登录`');
mustInclude('package.json', '"name": "@agileflow/cli"');
mustExist('bin/agileflow.mjs');
mustInclude('templates/contract.md', 'AF_TEMPLATE');
mustNotInclude('phases/04-development.md', 'dev-quickstart');
mustNotInclude('phases/05-testing.md', '（权威）');
mustNotInclude('phases/05-testing.md', '../phases/05-testing.md](../phases/05-testing.md)（权威）');
mustInclude('TROUBLESHOOTING.md', 'validate-atlas-gate');
mustInclude('templates/dev.md', '闸门 SSOT');

// —— Skill frontmatter 仅允许官方字段；版本以 package.json 为 SSOT ——
{
  const skill = read('SKILL.md');
  assert(!skill.startsWith('\uFEFF'), 'SKILL.md 禁止 UTF-8 BOM');
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)?.[1] || '';
  const keys = [...frontmatter.matchAll(/^([a-zA-Z0-9_-]+):/gm)].map((match) => match[1]);
  assert(
    keys.length === 2 && keys.includes('name') && keys.includes('description'),
    `SKILL.md frontmatter 仅允许 name/description（当前：${keys.join(', ') || '无'}）`,
  );
}

// —— 禁止旧「模式」/ AF_FLOW 残留 ——
const noModeBanFiles = [
  'templates/todo.md',
  'examples/dev-glance-login/atlas/todo.md',
  'examples/dev-glance-login/atlas/README.md',
];
for (const rel of noModeBanFiles) {
  mustNotInclude(rel, '模式：快速');
  mustNotInclude(rel, '模式：严谨');
  mustNotInclude(rel, 'AF_FLOW');
}

const fixturesTodoRoot = path.join(skillRoot, 'scripts/validate-atlas/fixtures');
for (const name of fs.readdirSync(fixturesTodoRoot)) {
  const todoRel = path.join('scripts/validate-atlas/fixtures', name, 'atlas/todo.md');
  const abs = path.join(skillRoot, todoRel);
  if (!fs.existsSync(abs)) continue;
  mustNotInclude(todoRel, '模式：快速');
  mustNotInclude(todoRel, '模式：严谨');
  mustNotInclude(todoRel, 'AF_FLOW');
}

mustInclude('templates/validate-atlas-gate.md', 'dev-complete');
mustInclude('templates/validate-atlas-gate.md', '台账溯源审计');
mustInclude('templates/validate-atlas-gate.md', 'L1 脚本硬挡');
mustInclude('scripts/validate-atlas/lib/phase-spec.mjs', "'dispatch-ledger'");
mustNotInclude('scripts/validate-atlas/lib/phase-spec.mjs', 'ai/fast');

// —— SSOT 白名单：标记只出现在 owner 文件 ——
const ssotMarkers = [
  { needle: '行为矩阵（ai vs user', owner: 'templates/contract.md' },
  { needle: '闸门 SSOT', owner: 'templates/dev.md' },
  { needle: '正确做法与红线（≤15）', owner: 'templates/orchestrator-core.md' },
];
const ssotScanRoots = ['SKILL.md', 'phases', 'templates'];
function collectMdFiles(relDir) {
  const abs = path.join(skillRoot, relDir);
  if (!fs.statSync(abs).isDirectory()) return [relDir];
  const out = [];
  for (const name of fs.readdirSync(abs)) {
    if (!name.endsWith('.md')) continue;
    out.push(path.join(relDir, name));
  }
  return out;
}
const mdForSsot = [];
for (const root of ssotScanRoots) {
  const abs = path.join(skillRoot, root);
  if (!fs.existsSync(abs)) continue;
  if (fs.statSync(abs).isFile()) mdForSsot.push(root);
  else mdForSsot.push(...collectMdFiles(root));
}
for (const { needle, owner } of ssotMarkers) {
  for (const rel of mdForSsot) {
    if (rel === owner) continue;
    if (read(rel).includes(needle)) {
      assert(false, `${rel} 禁止重复 SSOT 标记「${needle}」（唯一 owner: ${owner}）`);
    }
  }
  assert(read(owner).includes(needle), `${owner} 须含 SSOT 标记「${needle}」`);
}

// —— Markdown 相对链接存在性 ——
const linkScanFiles = [
  'SKILL.md',
  'QUICKSTART.md',
  'TROUBLESHOOTING.md',
  ...collectMdFiles('phases'),
  'templates/contract.md',
  'templates/orchestrator.md',
  'templates/orchestrator-core.md',
  'templates/orchestrator-ref.md',
  'templates/dev.md',
  'templates/validate-atlas-gate.md',
  'templates/todo.md',
];
const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
function resolveLink(fromRel, raw) {
  const target = raw.split('#')[0].trim();
  if (!target || /^https?:\/\//i.test(target) || /^mailto:/i.test(target)) return null;
  if (/[{}]/.test(target)) return null;
  const fromDir = path.dirname(fromRel);
  const resolved = path.normalize(path.join(skillRoot, fromDir, target));
  if (!resolved.startsWith(skillRoot)) return 'outside';
  return path.relative(skillRoot, resolved);
}
for (const rel of linkScanFiles) {
  if (!exists(rel)) continue;
  const content = read(rel);
  let m;
  while ((m = linkRe.exec(content)) !== null) {
    const [, , href] = m;
    const resolved = resolveLink(rel, href);
    if (resolved === null || resolved === 'outside') continue;
    assert(exists(resolved), `${rel} 链接目标不存在: (${href}) → ${resolved}`);
  }
}

// —— 脚本仍在 ——
mustInclude('scripts/validate-atlas/lib/af-env.mjs', "AF_TIER: new Set(['full'])");
mustInclude('scripts/validate-atlas/lib/rules/directory.mjs', 'DIR-TODO-PATH');

// —— phase Agent 摘要分区 ——
for (const rel of [
  'phases/00-intent-routing.md',
  'phases/00-project-init.md',
  'phases/01-requirement.md',
  'phases/02-modeling.md',
  'phases/03-solution-design.md',
  'phases/04-development.md',
  'phases/05-testing.md',
  'phases/atlas-structure.md',
  'phases/change-management.md',
  'phases/quick-commands.md',
]) {
  mustInclude(rel, '## Agent 摘要');
  mustInclude(rel, 'agent-摘要');
}

// —— 旧门牌教法不得回潮（用户可见）——
mustNotInclude('QUICKSTART.md', '`req: ');
mustNotInclude('phases/02-modeling.md', 'AF_STEP=model');
mustNotInclude('phases/02-modeling.md', 'AF_STEP=sol');
mustInclude('phases/02-modeling.md', 'AF_STEP=af-mod');

if (failed) {
  console.error(`\n${failed} consistency check(s) failed`);
  process.exit(1);
}
console.log('\nall doc-consistency checks passed');
