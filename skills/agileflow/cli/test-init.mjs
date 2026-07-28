#!/usr/bin/env node
/**
 * CLI init / update / prune 冒烟
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isNewerVersion } from './update-check.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(__dirname, '..', 'bin', 'agileflow.mjs');
// 测试中禁用新版探测（不联网、不派后台进程）
process.env.AGILEFLOW_NO_UPDATE_CHECK = '1';

function run(args, cwd) {
  const r = spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: 'utf8',
    env: process.env,
  });
  return r;
}

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL', msg);
    process.exit(1);
  }
  console.log('ok  ', msg);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-cli-'));
console.log('tmp', tmp);

// isNewerVersion 单元断言（新版提醒的比较器）
assert(isNewerVersion('1.2.0', '1.1.9'), 'isNewerVersion 1.2.0 > 1.1.9');
assert(!isNewerVersion('1.1.1', '1.1.1'), 'isNewerVersion 同版本 false');
assert(!isNewerVersion('1.1.0', '1.1.1'), 'isNewerVersion 旧版本 false');
assert(!isNewerVersion('', '1.1.1'), 'isNewerVersion 空入参 false');

// 模拟项目内旧 skill（统一 skills/）
fs.mkdirSync(path.join(tmp, 'skills', 'agileflow'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'skills', 'agileflow', 'OLD.txt'), 'old');
// 模拟旧宿主路径安装（CLI 同步标记）+ 历史 .bak 污染
fs.mkdirSync(path.join(tmp, '.cursor', 'skills', 'agileflow'), { recursive: true });
fs.writeFileSync(path.join(tmp, '.cursor', 'skills', 'agileflow', '.agileflow-installed.json'), '{}');
fs.mkdirSync(path.join(tmp, '.cursor', 'skills', 'agileflow.bak-2026-01-01T00-00-00-000Z'), { recursive: true });
fs.mkdirSync(path.join(tmp, '.claude', 'skills', 'agileflow.bak-2026-01-02T00-00-00-000Z'), { recursive: true });

let r = run(['--help'], tmp);
assert(r.status === 0, 'help exit 0');
assert((r.stdout || '').includes('@agileflow/cli'), 'help 含包名');
assert((r.stdout || '').includes('--step-skills-only'), 'help 含 step-skills-only');
assert((r.stdout || '').includes('run abandon'), 'help 含 run abandon');
assert((r.stdout || '').includes('agileflow context'), 'help 含只读 context 命令');
assert((r.stdout || '').includes('validate --only bugs'), 'help 含缺陷账本校验命令');
assert((r.stdout || '').includes('无 --root'), 'help 说明无 root 为 user init');
assert((r.stdout || '').includes('{项目}/skills/') || (r.stdout || '').includes('skills/'), 'help 说明项目级 skills/');
assert((r.stdout || '').includes('@agileflow/cli@latest'), 'help 示例带 @latest（绕过 npx 旧缓存）');
assert((r.stdout || '').includes('atlas/role/role-security-review.md'), 'help 展示明确项目 Role 路径');
assert((r.stdout || '').includes('id 就是门牌'), 'help 说明 flow id 即门牌');
assert((r.stdout || '').includes('/af-security-review'), 'help 展示自定义门牌用法');

// 用户级 init（隔离 HOME）
const fakeHome = path.join(tmp, 'fakehome');
fs.mkdirSync(fakeHome, { recursive: true });
r = spawnSync(process.execPath, [bin, 'init'], {
  cwd: tmp,
  encoding: 'utf8',
  env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome },
});
if (r.status !== 0) {
  console.error('user init stdout', r.stdout);
  console.error('user init stderr', r.stderr);
}
assert(r.status === 0, 'user init exit 0');
assert(fs.existsSync(path.join(fakeHome, '.cursor', 'skills', 'agileflow', 'SKILL.md')), 'user cursor skill');
assert(fs.existsSync(path.join(fakeHome, '.agents', 'skills', 'af-dev', 'SKILL.md')), 'user codex doorplate');
assert(fs.existsSync(path.join(fakeHome, '.qoder', 'skills', 'agileflow', 'SKILL.md')), 'user qoder skill');
assert(fs.existsSync(path.join(fakeHome, '.workbuddy', 'skills', 'agileflow', 'SKILL.md')), 'user workbuddy skill');
assert(fs.existsSync(path.join(fakeHome, '.codebuddy', 'skills', 'af', 'SKILL.md')), 'user codebuddy doorplate');
assert(!fs.existsSync(path.join(tmp, 'atlas', 'agileflow-cli.json')), 'user init 不写项目 cli.json');

// 项目级 init：无需 --force；只装到 skills/
r = run(['init', '--root', tmp], tmp);
if (r.status !== 0) {
  console.error('init stdout', r.stdout);
  console.error('init stderr', r.stderr);
  console.error('init error', r.error);
}
assert(r.status === 0, 'project init exit 0');
assert(fs.existsSync(path.join(tmp, 'skills', 'af-req', 'SKILL.md')), 'skills/af-req SKILL.md');
assert(fs.existsSync(path.join(tmp, 'skills', 'af', 'SKILL.md')), 'skills/af SKILL.md');
assert(fs.existsSync(path.join(tmp, 'skills', 'agileflow', 'SKILL.md')), 'skills/agileflow skill');
assert(!fs.existsSync(path.join(tmp, 'skills', 'agileflow', 'OLD.txt')), '默认已删旧 skill 残留');
assert(
  !fs.readdirSync(path.join(tmp, 'skills')).some((n) => n.startsWith('agileflow.bak-')),
  '默认不留 agileflow.bak-*',
);
assert((r.stdout || '').includes('skills/') || (r.stdout || '').includes('已删除旧'), 'init 输出说明项目 skills/');
assert(fs.existsSync(path.join(tmp, 'skills', 'agileflow', 'scripts', 'validate-atlas.mjs')), 'validate script');
assert(!fs.existsSync(path.join(tmp, '.cursor', 'skills', 'agileflow', 'SKILL.md')), '项目级不写 .cursor/skills');
assert(!fs.existsSync(path.join(tmp, '.cursor', 'skills', 'agileflow')), '旧 .cursor/skills/agileflow 已清理');
assert(
  !fs.existsSync(path.join(tmp, '.cursor', 'skills', 'agileflow.bak-2026-01-01T00-00-00-000Z')),
  '旧 .cursor 下 agileflow.bak-* 已清理',
);
assert(
  !fs.existsSync(path.join(tmp, '.claude', 'skills', 'agileflow.bak-2026-01-02T00-00-00-000Z')),
  '被去重宿主（claude）旧 bak 也清理',
);
assert(!fs.existsSync(path.join(tmp, '.claude', 'skills', 'agileflow', 'SKILL.md')), '项目级不写 .claude/skills');
assert(!fs.existsSync(path.join(tmp, '.cursor', 'commands', 'af-req.md')), '无 legacy cursor command');
assert(fs.existsSync(path.join(tmp, 'atlas', 'agileflow-cli.json')), 'cli.json');
const installedFlowTemplate = fs.readFileSync(
  path.join(tmp, 'skills', 'agileflow', 'templates', 'flow.yaml'),
  'utf8',
);
assert(installedFlowTemplate.includes('prompt: atlas/role/role-req.md'), '安装包 flow 模板暴露明确 Role 路径');
assert(!installedFlowTemplate.includes('prompt: req\n'), '安装包 flow 模板不生成 prompt 短名');

const cliJson = JSON.parse(fs.readFileSync(path.join(tmp, 'atlas', 'agileflow-cli.json'), 'utf8'));
assert(cliJson.delivery === 'skills', 'delivery=skills');

const reqBody = fs.readFileSync(path.join(tmp, 'skills', 'af-req', 'SKILL.md'), 'utf8');
assert(reqBody.includes('generated by @agileflow/cli'), 'generated mark');
assert(reqBody.includes('name: af-req'), 'frontmatter name');
assert(reqBody.includes('req-confirm'), 'req-confirm');
assert(reqBody.includes('/af-req'), 'body 含 /af-req');
assert(reqBody.includes('agileflow'), '引用 agileflow skill');
assert(!/手打 `req:/.test(reqBody) && !reqBody.includes('等同 req:'), '无旧 req: 门牌教法');
assert(reqBody.includes('flow.yaml'), 'flow 门牌含 flow.yaml');
assert(reqBody.includes('stepId=`af-req`') || reqBody.includes('stepId=af-req'), 'flow 门牌含 stepId');
assert(reqBody.includes('当前 step 的 `prompt`'), 'flow 门牌要求读取当前 step.prompt');

const fixBody = fs.readFileSync(path.join(tmp, 'skills', 'af-fix', 'SKILL.md'), 'utf8');
assert(fixBody.includes('非 flow 步') || fixBody.includes('快捷'), 'quick 门牌声明非 flow');
assert(!fixBody.includes('agileflow-dispatch.json'), 'quick 无台账');
assert(!fixBody.includes('write-code'), 'quick 无 write-code');

const afBody = fs.readFileSync(path.join(tmp, 'skills', 'af', 'SKILL.md'), 'utf8');
assert(afBody.includes('自动路由') || afBody.includes('万能'), 'af 门牌声明自动路由');
assert(!afBody.includes('探索支路（非 flow 步）'), 'af 门牌 description 不应标为探索支路');
assert(afBody.includes('非 flow') || afBody.includes('非 flow 步'), 'af 门牌非 flow');
assert(afBody.includes('禁止') && afBody.includes('AF_STEP=af'), 'af 门牌禁止写 AF_STEP=af');
assert(afBody.includes('skill 根'), 'af 门牌含 skill 根定位');
assert(afBody.includes('agileflow skill 根'), 'af 门牌 Read 指向 skill 根');
assert(afBody.includes('agileflow context --json'), 'af 门牌通过只读 context 获取路由上下文');
assert(afBody.includes('自动路由 `af-revise`'), 'af 门牌把已有需求/方案修改自动路由到 af-revise');
assert(afBody.includes('批量缺陷') && afBody.includes('不直接进 `af-test`'), 'af 门牌把批量缺陷先路由到 revise 归因');
assert(!afBody.includes('Read 项目内 **agileflow** skill'), 'af 门牌不再写「项目内」误导路径');
assert(cliJson.scopes?.af?.scope === 'routing', 'cli.json scopes af routing');
assert(afBody.includes('同级') && afBody.includes('agileflow'), 'af 门牌说明同级 agileflow');

const exploreBody = fs.readFileSync(path.join(tmp, 'skills', 'af-explore', 'SKILL.md'), 'utf8');
assert(exploreBody.includes('最多两轮'), 'explore 门牌内含完整的探索收口规则');
assert(!exploreBody.includes('只读这一份路由 SSOT'), 'explore 门牌不为一个小分支加载整份路由文档');

const testsBody = fs.readFileSync(path.join(tmp, 'skills', 'af-tests', 'SKILL.md'), 'utf8');
assert(testsBody.includes('af-test'), 'af-tests alias 指向 af-test');
assert(testsBody.includes('stepId=`af-test`') || testsBody.includes('stepId=af-test'), 'af-tests 台账用 af-test');

assert(cliJson.scopes?.['af-fix']?.scope === 'quick', 'cli.json scopes quick');
assert(cliJson.scopes?.['af-req']?.scope === 'flow', 'cli.json scopes flow');
assert(cliJson.scopes?.['af-tests']?.aliasOf === 'af-test', 'cli.json af-tests aliasOf');

r = run(['gate', '--list-gates', '--root', tmp], tmp);
assert(r.status === 0, 'gate --list-gates');

r = run(['gate', 'write-code', '--root', tmp], tmp);
assert(r.status !== 0, 'gate 位置参数 write-code 能转发（无 atlas 期望非 0）');
assert((r.stdout || r.stderr || '').includes('write-code') || (r.stdout || '').includes('闸门'), 'gate 位置参数命中 write-code');

r = run(['init', '--root'], tmp);
assert(r.status === 1, 'bare --root 拒绝');
assert((r.stderr || '').includes('--root 需要路径参数'), 'bare --root 提示');

r = run(['--list-gates', '--root'], tmp);
assert(r.status === 1, '透传 bare --root 拒绝');

// 非法 flow id 不落盘门牌 skill
const evilFlow = path.join(tmp, 'atlas', 'flow.yaml');
fs.mkdirSync(path.dirname(evilFlow), { recursive: true });
fs.writeFileSync(
  evilFlow,
  `version: 1
steps:
  - id: ../evil
    mode: strict
    prompt: null
    depends: []
    outputs: []
  - id: af-req
    mode: strict
    prompt: req
    depends: []
    outputs:
      - atlas/requirements/
`,
  'utf8',
);
r = run(['update', '--step-skills-only', '--root', tmp], tmp);
assert(r.status === 0, '非法 id 时 update 仍成功（跳过）');
assert(!fs.existsSync(path.join(tmp, 'skills', 'af-../evil', 'SKILL.md')), '无路径穿越门牌');
assert(!fs.readdirSync(path.join(tmp, 'skills')).some((n) => n.includes('evil')), '无 evil 门牌目录');

// 自定义 flow + step-skills-only
const flowPath = path.join(tmp, 'atlas', 'flow.yaml');
fs.writeFileSync(
  flowPath,
  `version: 1
steps:
  - id: af-research
    mode: strict
    prompt: null
    depends: []
    outputs:
      - atlas/logs/research.md
  - id: af-req
    mode: strict
    prompt: req
    depends: []
    outputs:
      - atlas/requirements/
`,
  'utf8',
);

r = run(['update', '--step-skills-only', '--root', tmp], tmp);
assert(r.status === 0, 'update --step-skills-only');
assert(fs.existsSync(path.join(tmp, 'skills', 'af-research', 'SKILL.md')), 'af-research 生成');
const researchBody = fs.readFileSync(path.join(tmp, 'skills', 'af-research', 'SKILL.md'), 'utf8');
assert(researchBody.includes('mode/prompt/depends/outputs'), '自定义门牌读取完整 step 配置');

// --commands-only 别名仍可用
r = run(['update', '--commands-only', '--root', tmp], tmp);
assert(r.status === 0, 'update --commands-only alias');
assert((r.stderr || '').includes('弃用') || (r.stdout || '').includes('弃用'), 'commands-only deprecation warn');

// 去掉 research
fs.writeFileSync(
  flowPath,
  `version: 1
steps:
  - id: af-req
    mode: strict
    prompt: req
    depends: []
    outputs:
      - atlas/requirements/
`,
  'utf8',
);
r = run(['update', '--step-skills-only', '--root', tmp], tmp);
assert(r.status === 0, 'update prune');
assert(!fs.existsSync(path.join(tmp, 'skills', 'af-research', 'SKILL.md')), 'af-research 已删');

// 旧 command 迁移清理
const legacyCmd = path.join(tmp, '.cursor', 'commands', 'af-req.md');
fs.mkdirSync(path.dirname(legacyCmd), { recursive: true });
fs.writeFileSync(legacyCmd, '<!-- generated by @agileflow/cli v9 -->\nlegacy', 'utf8');
r = run(['update', '--root', tmp], tmp);
assert(r.status === 0, 'update 清理 legacy command');
assert(!fs.existsSync(legacyCmd), 'legacy command 已删');

console.log('\nall cli tests passed');
