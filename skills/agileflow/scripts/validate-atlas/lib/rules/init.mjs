import path from 'node:path';
import { collectFiles, exists, findLine, readText, rel } from '../fs-utils.mjs';

/** init 文档首行分层标签（盘点·* / P0 / P1；亦接受 L0–L6） */
const LAYER_TAG = /^>\s*\*\*(盘点·[^|*]+|L\d(?:\.\d)?|P0|P1|分层导航)\*\*/m;

/** 覆盖范围固定块标题 */
const COVERAGE_HEADING = '## 覆盖范围（init）';

/**
 * 校验单个 init markdown 文件格式
 * @param {string} projectRoot
 * @param {string} filePath
 * @param {string} content
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateInitFile(projectRoot, filePath, content, reporter) {
  const relPath = rel(projectRoot, filePath);
  const baseName = path.basename(filePath);

  const needsLayerTag = !['README.md', 'LAYERS.md'].includes(baseName);

  if (needsLayerTag && !LAYER_TAG.test(content.split('\n').slice(0, 5).join('\n'))) {
    reporter.add({
      severity: 'warn',
      rule: 'INIT-F001',
      file: relPath,
      line: 1,
      message: '文首缺少分层标签，应为 `> **盘点·业务** · …` 或 `> **P0** · …`。',
    });
  }

  if (baseName === 'p0-business.md') {
    const requiredSections = [
      { pattern: /^## 项目解决什么问题/m, name: '## 项目解决什么问题' },
      { pattern: /^## 实体 ↔ 功能对照/m, name: '## 实体 ↔ 功能对照' },
      { pattern: /^## 核心术语/m, name: '## 核心术语' },
      { pattern: /^## 信息来源/m, name: '## 信息来源' },
    ];
    for (const sec of requiredSections) {
      if (!sec.pattern.test(content)) {
        reporter.add({
          severity: 'error',
          rule: 'INIT-B001',
          file: relPath,
          message: `p0-business 缺少必写节「${sec.name}」。`,
        });
      }
    }
  }

  if (/p1-(frontend|backend)\.md$/.test(baseName)) {
    const sections = ['## 开发速查', '## 资产索引', '## 一、目录结构', '## 二、写法规范', '## 三、代码模板', '## 五、新功能自检'];
    for (const sec of sections) {
      if (!content.includes(sec)) {
        reporter.add({
          severity: 'error',
          rule: 'INIT-C001',
          file: relPath,
          message: `codebase 文档缺少「${sec}」（模式 B 五段式结构）。`,
        });
      }
    }
  }

  if (baseName === 'api-catalog.md' && !content.includes(COVERAGE_HEADING)) {
    reporter.add({
      severity: 'error',
      rule: 'INIT-A001',
      file: relPath,
      message: 'api-catalog.md 文首缺少「## 覆盖范围（init）」块。',
    });
  }

  if (filePath.includes(`${path.sep}entities${path.sep}`)) {
    if (!/^## 业务用途/m.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'INIT-E001',
        file: relPath,
        message: '实体文档缺少「## 业务用途」（禁止只有字段字典）。',
      });
    }
  }

  if (/\{[^}]+\}/.test(content) && content.includes('✅')) {
    reporter.add({
      severity: 'warn',
      rule: 'INIT-P001',
      file: relPath,
      message: '文档含 `{…}` 占位符且标记 ✅，可能是 AI 幻觉未填内容。',
    });
  }
}

/**
 * 校验 atlas/init/ 目录与文档格式
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateInit(projectRoot, reporter) {
  const initRoot = path.join(projectRoot, 'atlas', 'init');
  if (!exists(initRoot)) return;

  const readmePath = path.join(initRoot, 'README.md');
  const readme = readText(readmePath);
  if (!readme) {
    reporter.add({
      severity: 'error',
      rule: 'INIT-R001',
      file: 'atlas/init/README.md',
      message: 'init 缺少 README.md（必有：业务沙盘 + 覆盖范围）。',
    });
  } else {
    if (!readme.includes(COVERAGE_HEADING)) {
      reporter.add({
        severity: 'error',
        rule: 'INIT-R002',
        file: 'atlas/init/README.md',
        line: findLine(readme, /## 覆盖范围/),
        message: 'README 缺少「## 覆盖范围（init）」块（P0 必过项）。',
      });
    }
    const scopeMatch = readme.match(/盘点模式[：:]\s*(local|dependencies|full|局部|依赖|完整)/i);
    if (!scopeMatch) {
      reporter.add({
        severity: 'info',
        rule: 'INIT-R004',
        file: 'atlas/init/README.md',
        line: findLine(readme, /## 覆盖范围/),
        message: 'README 覆盖范围建议声明「盘点模式：local|dependencies|full」；旧版无此字段按 full 兼容。',
      });
    } else if (!/任务锚点[：:]\s*\S+/.test(readme) && !/(full|完整)/i.test(scopeMatch[1])) {
      reporter.add({
        severity: 'error',
        rule: 'INIT-R005',
        file: 'atlas/init/README.md',
        line: findLine(readme, /盘点模式/),
        message: 'local/dependencies 盘点必须声明非空「任务锚点」。',
      });
    }
    if (scopeMatch && !/(full|完整)/i.test(scopeMatch[1]) && !/覆盖路径[：:]\s*\S+/.test(readme)) {
      reporter.add({
        severity: 'error',
        rule: 'INIT-R006',
        file: 'atlas/init/README.md',
        line: findLine(readme, /盘点模式/),
        message: 'local/dependencies 盘点必须声明非空「覆盖路径」。',
      });
    }
    if (!/三大业务闭环|业务闭环/.test(readme)) {
      reporter.add({
        severity: 'warn',
        rule: 'INIT-R003',
        file: 'atlas/init/README.md',
        message: 'README 建议含「三大业务闭环」沙盘结构，不应仅为文件索引。',
      });
    }
  }

  const mdFiles = collectFiles(initRoot, '.md');
  for (const file of mdFiles) {
    const content = readText(file);
    if (content) validateInitFile(projectRoot, file, content, reporter);
  }

  const forbidden = path.join(initRoot, 'components-catalog.md');
  if (exists(forbidden)) {
    reporter.add({
      severity: 'error',
      rule: 'INIT-X001',
      file: 'atlas/init/components-catalog.md',
      message: '禁止创建平行 components-catalog（资产索引应在 codebase/p1-*.md）。',
    });
  }
}
