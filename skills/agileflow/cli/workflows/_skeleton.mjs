/**
 * 拼装门牌入口正文
 * entry.id / prefix 已是 af-req、/af-req
 */
import { canonicalStepId } from '../catalog.mjs';

const AFTER_GATE_FULL = `## 闸门绿之前 / 之后
- **跑 gate 前**应留痕：\`npx @agileflow/cli log --door {本门牌} --summary ≤15字 --route {步} --root .\`（写入 \`atlas/logs/af-commands.md\`）
- **\`AF_DECIDE=ai\` ≠ 免留痕**：只免 AskQuestion 停点；每完成一个 flow 步仍须本步门牌一行（仅入口 \`/af\` 一行不够）
- **显式留痕**：先运行 \`agileflow log\` 写本步真实摘要；gate 只读校验，绝不自动制造 ✅
- **结果认最终权威**：须见 CLI 退出码 0 + \`AGILEFLOW_GATE_RESULT=PASS\`；有 current Run 时再确认 \`run gate-status\` 为 \`PASS (pass)\`，禁止读取 legacy MD 冒充当前证明
- **禁止无回执前进**：未绿 confirm 不得 \`step sync\` / 手改 \`AF_STEP\` 跳步
- **质量硬指标**：REQ 禁标题 \`666\`/自创大纲；见 role \`quality.md\` 规则 ID 表（\`REQ-TITLE-SUBSTANCE\` 等）
- \`AF_DECIDE=user\` → 摘要 + 问是否进 flow 下一启用步 → 停
- \`AF_DECIDE=ai\` → 同会话进下一步（按需再 Read 该步一个 phase，勿预读全链）`;

const DEV_PREFLIGHT = `## 入场前（禁止先码）
1. 跑：\`agileflow gate --gate write-code --root .\`（或 \`npx @agileflow/cli gate --gate write-code --root .\`）
2. 红 → 按报错补上游（常见 af-req 或 af-sol）；禁止空跑写码
3. 绿 → 再按 phases/04 派每 T 的 role-dev`;

/**
 * phases/templates 相对 agileflow skill 根，不是工作区项目根
 * 门牌常在用户级 ~/.qoder/skills/af，细则在同级 ../agileflow/
 */
const SKILL_ROOT_SECTION = `## skill 根（读 phases 前必做）
\`phases/*\` / \`templates/*\` 相对 **agileflow skill 根**，**不是**当前工作区项目根。按序找，找到即停：
1. 本会话已加载的 \`af\`/\`af-*\` 门牌目录的**同级** \`agileflow/\`（例：\`…/skills/af\` → Read \`…/skills/agileflow/…\`）
2. 用户级：\`~/.{cursor,claude,qoder,agents,codex,workbuddy,codebuddy}/skills/agileflow/\`
3. 项目级：\`{项目根}/skills/agileflow/\`（旧路径 \`{项目根}/.cursor|…/skills/agileflow/\` 仍可探测）
判定：目录内有 \`SKILL.md\` + \`phases/00-intent-routing.md\`。**找不到 → 换路径重试；禁止以「Glob 工作区搜不到」为由跳过流程写码。** 仍无 → \`npx @agileflow/cli@latest init\`。`;

/**
 * @param {string} rel phase 相对路径
 * @param {string} [suffix] 括号说明
 */
function readUnderSkillRoot(rel, suffix = '（只读这一份）') {
  return `Read **agileflow skill 根**下的 \`${rel}\`${suffix}`;
}

/**
 * flow 步 / alias 的步骤块
 * @param {import('../catalog.mjs').CatalogEntry} entry
 */
function buildFlowSteps(entry) {
  const stepId = canonicalStepId(entry);
  const lines = [];
  if (entry.phaseRel) {
    lines.push(`1. 需要细则时再 ${readUnderSkillRoot(entry.phaseRel)}`);
  }
  lines.push(
    '2. 读项目 `atlas/flow.yaml` 中当前 step 的 `prompt`：路径则加载该项目 Role 并派 Subagent，`null` 则总控直做；记 `atlas/agileflow-dispatch.json`（含 stepId=`' +
      stepId +
      '`）',
  );
  if (entry.gate) {
    lines.push(
      `3. **先留痕再闸门**：\`npx @agileflow/cli log --door ${entry.prefix} --summary ≤15字 --route ${stepId.replace(/^af-/, '')} --root .\``,
    );
    lines.push(`4. 跑闸门：\`agileflow gate --gate ${entry.gate} --root .\``);
  }
  return lines;
}

/**
 * @param {import('../catalog.mjs').CatalogEntry} entry
 */
function buildPreFlowSteps(entry) {
  const lines = [];
  if (entry.phaseRel) {
    lines.push(`1. ${readUnderSkillRoot(entry.phaseRel)}`);
  }
  lines.push('2. **总控直做** brownfield 盘点；写 `atlas/init/`（无 role Subagent）');
  lines.push('3. 跑闸门：`agileflow gate --gate init-confirm --root .`');
  lines.push('4. 绿后进入主链**第一个 flow 步**（不写 `AF_STEP=af-init`）');
  return lines;
}

/**
 * 探索支路（/af-explore）
 */
function buildExploreSteps() {
  return [
    '1. 只读相关代码、日志和现有 atlas，给出发现摘要与 2～4 个方向',
    '2. 用方向 AskQuestion 收敛，最多两轮；不写 env/REQ/源码/flow',
    '3. 选定后重新路由到正式 flow 步或快捷轨',
  ];
}

/**
 * 万能自动路由（/af）
 */
function buildAutoRouteSteps() {
  return [
    `1. ${readUnderSkillRoot('phases/00-intent-routing.md#agent-摘要', '（只读这一份路由 SSOT）')}`,
    '2. 执行 `agileflow context --json --root .`，结合用户意图得到唯一 `routeId`',
    '3. 切入 `routeId` 对应门牌并**按该步规则执行**；首行只写 `routeId + reason`',
    '4. **禁止**写 `AF_STEP=af`；落地到真实步后才维护 env/台账/闸门',
  ];
}

/**
 * @param {import('../catalog.mjs').CatalogEntry} entry
 */
function buildQuickSteps(entry) {
  return [
    `1. ${readUnderSkillRoot('phases/quick-commands.md', '')}，执行 \`${entry.prefix}\` 零文档/修订流程`,
    '2. 验证编译/相关测试；首行收尾 `✅`',
    `3. **强制留痕**：\`npx @agileflow/cli log --door ${entry.prefix} --summary ≤15字 --route ${entry.id.replace(/^af-/, '')} --root .\``,
    '4. **无**下一阶段；做完即停',
  ];
}

/**
 * @param {import('../catalog.mjs').CatalogEntry} entry
 */
function buildEntryFooter(entry) {
  const stepId = canonicalStepId(entry);
  if (entry.scope === 'quick') {
    return `触发 \`${entry.prefix}\` 或选用 **${entry.id}** skill；**非 flow 步**，不受 \`AF_STEP\`/主链闸门管理。不要一上来 Read 整个 agileflow/ 树。`;
  }
  if (entry.scope === 'pre-flow') {
    return `触发 \`${entry.prefix}\` 或选用 **${entry.id}** skill；**不进** \`atlas/flow.yaml\` steps。不要一上来 Read 整个 agileflow/ 树。`;
  }
  if (entry.scope === 'routing') {
    if (entry.id === 'af') {
      return `触发 \`${entry.prefix}\` 或选用 **${entry.id}** skill；**万能自动路由**，**非 flow 步**。不要一上来 Read 整个 agileflow/ 树。`;
    }
    return `触发 \`${entry.prefix}\` 或选用 **${entry.id}** skill；探索支路，**非 flow 步**。不要一上来 Read 整个 agileflow/ 树。`;
  }
  if (entry.scope === 'alias') {
    return `触发 \`${entry.prefix}\` 或 \`/${stepId}\`；与 flow 步 \`${stepId}\` 同义（台账 stepId=\`${stepId}\`）。本步须在 flow.yaml \`steps\` 中启用。`;
  }
  if (entry.custom) {
    return `触发 \`${entry.prefix}\` 或选用 **${entry.id}** skill；自定义 flow 步，须在 \`atlas/flow.yaml\` 的 \`steps\` 中。`;
  }
  return `触发 \`${entry.prefix}\` 或选用 **${entry.id}** skill；本步须在 \`atlas/flow.yaml\` 的 \`steps\` 中启用；stepId=\`${stepId}\`。不要一上来 Read 整个 agileflow/ 树。`;
}

/**
 * @param {object} opts
 * @param {import('../catalog.mjs').CatalogEntry} opts.entry
 * @param {string} [opts.l0]
 * @param {string} [opts.extraSteps]
 */
export function buildBody({ entry, l0, extraSteps }) {
  const lines = [];
  const title = entry.scope === 'alias' ? canonicalStepId(entry) : entry.id;
  lines.push(`# ${entry.id}`);
  lines.push('');
  if (entry.scope === 'alias') {
    lines.push(
      `你正在执行 AgileFlow 门牌 \`${entry.prefix}\`（**alias** → flow 步 \`${canonicalStepId(entry)}\`）。用户附加说明见消息其余部分。`,
    );
  } else if (entry.scope === 'quick') {
    lines.push(`你正在执行 AgileFlow 快捷门牌 \`${entry.prefix}\`（**非 flow 步**）。用户附加说明见消息其余部分。`);
  } else if (entry.scope === 'pre-flow') {
    lines.push(`你正在执行 AgileFlow 前置门牌 \`${entry.prefix}\`（**不进 flow.yaml steps**）。用户附加说明见消息其余部分。`);
  } else if (entry.scope === 'routing' && entry.id === 'af') {
    lines.push(`你正在执行 AgileFlow 万能入口 \`${entry.prefix}\`（**自动路由 · 非 flow 步**）。用户附加说明见消息其余部分。`);
  } else if (entry.scope === 'routing') {
    lines.push(`你正在执行 AgileFlow 探索门牌 \`${entry.prefix}\`（**非 flow 步**）。用户附加说明见消息其余部分。`);
  } else {
    lines.push(`你正在执行 AgileFlow 门牌 \`${entry.prefix}\`（flow 步 id=\`${canonicalStepId(entry)}\`）。用户附加说明见消息其余部分。`);
  }
  lines.push('');
  lines.push(l0 || '');
  lines.push('');
  lines.push(SKILL_ROOT_SECTION);
  lines.push('');
  if (entry.id === 'af-dev') {
    lines.push(DEV_PREFLIGHT);
    lines.push('');
  }
  lines.push('## 本门牌步骤');
  if (extraSteps) {
    lines.push(extraSteps);
  } else if (entry.scope === 'quick') {
    lines.push(...buildQuickSteps(entry));
  } else if (entry.scope === 'pre-flow') {
    lines.push(...buildPreFlowSteps(entry));
  } else if (entry.scope === 'routing' && entry.id === 'af') {
    lines.push(...buildAutoRouteSteps());
  } else if (entry.scope === 'routing') {
    lines.push(...buildExploreSteps());
  } else if (entry.gate || entry.scope === 'flow' || entry.scope === 'alias') {
    lines.push(...buildFlowSteps(entry));
  } else {
    lines.push(`1. 按路由执行门牌 \`${entry.prefix}\``);
    if (entry.phaseRel) {
      lines.push(`2. 细则：${readUnderSkillRoot(entry.phaseRel)}`);
    }
  }
  lines.push('');
  const showAfterGate = (entry.scope === 'flow' || entry.scope === 'alias') && entry.id !== 'af-explore';
  if (showAfterGate && entry.scope !== 'quick') {
    lines.push(AFTER_GATE_FULL);
    lines.push('');
  }
  lines.push('## 入口');
  lines.push(buildEntryFooter(entry));
  return lines.join('\n');
}

/**
 * 自定义步短正文
 * @param {import('../catalog.mjs').CatalogEntry} entry
 * @param {string} [l0]
 */
export function buildCustomBody(entry, l0) {
  const lines = [
    `# ${entry.id}`,
    '',
    `自定义 flow 步门牌 \`${entry.prefix}\`（id=\`${entry.id}\` · scope=flow）。`,
    '',
    l0 || '',
    '',
    SKILL_ROOT_SECTION,
    '',
    '## 本步',
    `- 读项目 \`atlas/flow.yaml\` 中 id=\`${entry.id}\` 的 \`mode/prompt/depends/outputs\``,
    '- `prompt` 是路径：加载该项目 Role 文件并派 Subagent；`prompt: null`：总控直做',
    '- 完成后 `advanceStep`',
    '- **无**专用 confirm 闸门；主链硬挡仍靠下游内置 gate',
    '',
    '## 入口',
    buildEntryFooter(entry),
  ];
  return lines.join('\n');
}

/** @deprecated 使用 body-for-entry.loadL0Snippet */
export function loadL0Snippet() {
  throw new Error('loadL0Snippet moved to body-for-entry.mjs');
}
