/**
 * atlas/bugs 缺陷账本校验。
 *
 * 目的：防止 Agent 收到缺陷后只改代码、不核对 REQ/AC、不补回归测试，
 * 或在没有证据时把 Bug 标成已关闭。
 */

import fs from 'node:fs';
import path from 'node:path';
import { exists, readText } from '../fs-utils.mjs';

const BUGS_REL = 'atlas/bugs';
const README_REL = `${BUGS_REL}/README.md`;

const ALLOWED_REQ_DECISIONS = new Set(['已覆盖', '需求漏记', '需求含糊', '新需求']);
const ALLOWED_CAUSES = new Set([
  '实现遗漏',
  '实现错误',
  'solution/model 问题',
  '需求缺陷',
  '测试缺陷',
  '新需求',
]);
const ALLOWED_STATUSES = new Set([
  '待核对需求',
  '待补需求',
  '待修实现',
  '待修测试',
  '待回归',
  '已关闭',
  '阻塞',
  '已转需求',
  '重复',
]);
const UNTRIAGED_STATUSES = new Set(['待核对需求', '阻塞', '重复']);
const REQ_TRACE_STATUSES = new Set(['待修实现', '待修测试', '待回归', '已关闭']);
const TEST_TRACE_STATUSES = new Set(['待回归', '已关闭']);

/**
 * 将 Markdown 表格行拆成单元格。
 * 目的：只解析 bugs/README.md 的稳定表格，不引入额外 Markdown 依赖。
 *
 * @param {string} line
 * @returns {string[]}
 */
function splitCells(line) {
  const raw = line.trim();
  if (!raw.startsWith('|')) return [];
  return raw
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * 去掉 Markdown 装饰后得到可比较文本。
 *
 * @param {string} value
 * @returns {string}
 */
function plainText(value) {
  return String(value || '')
    .replace(/[`*_]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

/**
 * 判断单元格是否仍是空值或占位符。
 *
 * @param {string} value
 * @returns {boolean}
 */
function isBlank(value) {
  const plain = plainText(value);
  return !plain || /^(?:—|-|无|暂无|待补|TODO|TBD)$/i.test(plain);
}

/**
 * 定位缺陷总表并按表头返回数据行。
 *
 * @param {string} content
 * @returns {{ header: string[], rows: Array<{ cells: string[], line: number }> } | null}
 */
function parseBugTable(content) {
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index++) {
    const header = splitCells(lines[index]).map(plainText);
    if (!header.includes('Bug ID') || !header.includes('状态')) continue;
    const separator = splitCells(lines[index + 1]);
    if (
      separator.length !== header.length ||
      !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
    ) {
      return null;
    }
    const rows = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
      const cells = splitCells(lines[rowIndex]);
      if (cells.length === 0) break;
      if (cells.length !== header.length) continue;
      rows.push({ cells, line: rowIndex + 1 });
    }
    return { header, rows };
  }
  return null;
}

/**
 * 从“详情”单元格读取本地 Markdown 链接目标。
 *
 * @param {string} value
 * @returns {string | null}
 */
function detailTarget(value) {
  const match = String(value || '').match(/\]\(([^)#]+)(?:#[^)]+)?\)/);
  return match ? match[1].trim() : null;
}

/**
 * 校验 atlas/bugs/README.md。
 * 目录不存在时直接跳过，保持单个轻微 Bug 的零文档路径。
 *
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateBugs(projectRoot, reporter) {
  const bugsRoot = path.join(projectRoot, BUGS_REL);
  if (!exists(bugsRoot)) return;

  const readmePath = path.join(projectRoot, README_REL);
  if (!exists(readmePath)) {
    reporter.add({
      severity: 'error',
      rule: 'BUG-README-MISSING',
      file: README_REL,
      message: '已创建 atlas/bugs/，但缺少作为状态唯一权威的 README.md。',
    });
    return;
  }

  const content = readText(readmePath) || '';
  const table = parseBugTable(content);
  if (!table) {
    reporter.add({
      severity: 'error',
      rule: 'BUG-TABLE-FORMAT',
      file: README_REL,
      message: '缺陷总表缺少合法表头或分隔线；从 templates/bug.md 复制总表。',
    });
    return;
  }
  if (table.rows.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'BUG-TABLE-EMPTY',
      file: README_REL,
      message: '缺陷总表为空；没有需追踪缺陷时不要预建 atlas/bugs/。',
    });
    return;
  }

  const column = Object.fromEntries(table.header.map((name, index) => [name, index]));
  const requiredColumns = [
    'Bug ID',
    'REQ 判定',
    '关联 REQ/AC',
    '归因',
    '回归测试',
    '状态',
    '详情',
  ];
  const missingColumns = requiredColumns.filter((name) => column[name] === undefined);
  if (missingColumns.length > 0) {
    reporter.add({
      severity: 'error',
      rule: 'BUG-TABLE-COLUMNS',
      file: README_REL,
      message: `缺陷总表缺少列：${missingColumns.join('、')}。`,
    });
    return;
  }

  const seenIds = new Set();
  for (const row of table.rows) {
    const idCell = plainText(row.cells[column['Bug ID']]);
    const idMatch = idCell.match(/\bBUG-\d{3,}\b/i);
    const id = idMatch ? idMatch[0].toUpperCase() : '';
    const reqDecision = plainText(row.cells[column['REQ 判定']]);
    const related = plainText(row.cells[column['关联 REQ/AC']]);
    const cause = plainText(row.cells[column['归因']]);
    const testTrace = row.cells[column['回归测试']];
    const status = plainText(row.cells[column['状态']]);
    const detail = row.cells[column['详情']];

    if (!id) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-ID-FORMAT',
        file: README_REL,
        line: row.line,
        message: 'Bug ID 须为 BUG-001 这类至少三位数字的项目内编号。',
      });
      continue;
    }
    if (seenIds.has(id)) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-ID-DUPLICATE',
        file: README_REL,
        line: row.line,
        message: `${id} 重复；Bug ID 永不复用。`,
      });
    }
    seenIds.add(id);

    if (!ALLOWED_STATUSES.has(status)) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-STATUS',
        file: README_REL,
        line: row.line,
        message: `${id} 状态“${status || '空'}”非法。`,
      });
    }
    if (!UNTRIAGED_STATUSES.has(status) && !ALLOWED_REQ_DECISIONS.has(reqDecision)) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-REQ-DECISION',
        file: README_REL,
        line: row.line,
        message: `${id} 须先完成 REQ 判定：已覆盖、需求漏记、需求含糊或新需求。`,
      });
    }
    if (!UNTRIAGED_STATUSES.has(status) && !ALLOWED_CAUSES.has(cause)) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-CAUSE',
        file: README_REL,
        line: row.line,
        message: `${id} 须填写稳定归因，不能用笼统“Bug”代替根因分类。`,
      });
    }

    if (
      REQ_TRACE_STATUSES.has(status) &&
      (!/\bREQ-\d+\b/i.test(related) || !/\bAC-[A-Za-z0-9-]+\b/i.test(related))
    ) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-REQ-TRACE',
        file: README_REL,
        line: row.line,
        message: `${id} 进入“${status}”前必须关联明确 REQ + AC；需求漏记须先补齐。`,
      });
    }
    if (status === '已转需求' && !/\bREQ-\d+\b/i.test(related)) {
      reporter.add({
        severity: 'error',
        rule: 'BUG-SPLIT-REQ',
        file: README_REL,
        line: row.line,
        message: `${id} 标记“已转需求”时必须链接拆出的 REQ。`,
      });
    }
    if (TEST_TRACE_STATUSES.has(status) && isBlank(testTrace)) {
      reporter.add({
        severity: 'error',
        rule: status === '已关闭' ? 'BUG-CLOSE-EVIDENCE' : 'BUG-TEST-TRACE',
        file: README_REL,
        line: row.line,
        message: `${id} 进入“${status}”前必须填写回归测试或人工验证证据。`,
      });
    }

    const target = detailTarget(detail);
    if (target) {
      const detailPath = path.resolve(bugsRoot, target);
      if (
        !detailPath.startsWith(`${path.resolve(bugsRoot)}${path.sep}`) ||
        !exists(detailPath) ||
        !fs.statSync(detailPath).isFile()
      ) {
        reporter.add({
          severity: 'error',
          rule: 'BUG-DETAIL-LINK',
          file: README_REL,
          line: row.line,
          message: `${id} 详情链接不存在或离开 atlas/bugs/：${target}`,
        });
      }
    }
  }
}
