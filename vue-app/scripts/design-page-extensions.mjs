import { cpSync, existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const matrixPath = 'references/page-spec-coverage-matrix.md'
const visualPath = 'references/page-visual-acceptance.json'
const matrixEnd = '\n## 4. 当前页面与 Figma 04 / UAT 证据关系'

function requireValue(condition, message) {
  if (!condition) throw new Error(message)
}

function regularTree(root) {
  requireValue(!lstatSync(root).isSymbolicLink(), `设计检查不接受符号链接：${root}`)
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const file = join(root, entry.name)
    requireValue(!entry.isSymbolicLink(), `设计检查不接受符号链接：${file}`)
    if (entry.isDirectory()) regularTree(file)
    else requireValue(entry.isFile(), `设计检查不接受特殊文件：${file}`)
  }
}

function exactKeys(value, allowed, label) {
  requireValue(value && typeof value === 'object' && !Array.isArray(value), `${label} 必须为对象。`)
  for (const key of Object.keys(value)) requireValue(allowed.includes(key), `${label} 不支持字段 ${key}。`)
}

function plainText(value) {
  return typeof value === 'string' && value.trim() === value && value.length > 0 && !/[\r\n|`]/.test(value)
}

function validatePages(extension, visual) {
  exactKeys(extension, ['schemaVersion', 'pages'], '页面扩展')
  requireValue(extension.schemaVersion === 1 && Array.isArray(extension.pages), '页面扩展必须使用 schemaVersion 1 和 pages 数组。')
  requireValue(Array.isArray(visual.pages), '原版视觉登记缺少 pages 数组。')
  const existingIds = new Set(visual.pages.map(page => page.pageId))
  const existingRoutes = new Set(visual.pages.map(page => page.route))
  const ids = new Set()
  const routes = new Set()
  for (const page of extension.pages) {
    exactKeys(page, ['pageId', 'label', 'route', 'pageType', 'components', 'implementation', 'visualStatus', 'remainingStates'], '页面扩展项')
    requireValue(typeof page.pageId === 'string' && /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+$/.test(page.pageId), '页面扩展 pageId 无效。')
    requireValue(typeof page.route === 'string' && /^\/(?:[a-zA-Z0-9-]+\/)*[a-zA-Z0-9-]+$/.test(page.route), `${page.pageId} route 必须为不含 query 的原生页面路径。`)
    requireValue(!ids.has(page.pageId) && !routes.has(page.route), `页面扩展 pageId 或 route 重复：${page.pageId} ${page.route}`)
    requireValue(!existingIds.has(page.pageId) && !existingRoutes.has(page.route), `页面扩展不能覆盖原版已登记页面：${page.pageId} ${page.route}`)
    requireValue(plainText(page.label), `${page.pageId} label 无效。`)
    requireValue(/^T[1-7]$/.test(page.pageType), `${page.pageId} 必须且只能选择一个 T1–T7 页型。`)
    requireValue(Array.isArray(page.components) && page.components.includes('C9') && page.components.every(code => /^C[1-9]$/.test(code)) && new Set(page.components).size === page.components.length, `${page.pageId} components 必须使用不重复的 C1–C9 并包含 C9。`)
    requireValue(page.implementation === 'O1', `${page.pageId} 新页面必须为 O1 Vue 原生实现。`)
    requireValue(page.visualStatus === 'VA-0', `${page.pageId} 新登记必须为 VA-0；本扩展不授予视觉验收结论。`)
    requireValue(Array.isArray(page.remainingStates) && page.remainingStates.length > 0 && page.remainingStates.every(plainText), `${page.pageId} 必须如实登记待验收状态。`)
    ids.add(page.pageId)
    routes.add(page.route)
  }
  return extension.pages
}

/** Use an ephemeral data overlay; never edit the distributed Skill or its checker. */
export function withProjectPageExtensions(projectRoot, skillRoot, runChecker) {
  regularTree(skillRoot)
  const registration = join(projectRoot, 'design-page-extensions.json')
  if (!existsSync(registration)) return runChecker(join(skillRoot, 'scripts/check-consistency.mjs'), [])
  requireValue(lstatSync(registration).isFile() && !lstatSync(registration).isSymbolicLink(), '页面扩展登记必须为普通文件。')
  const extension = JSON.parse(readFileSync(registration, 'utf8'))
  const visual = JSON.parse(readFileSync(join(skillRoot, visualPath), 'utf8'))
  const pages = validatePages(extension, visual)
  if (pages.length === 0) return runChecker(join(skillRoot, 'scripts/check-consistency.mjs'), [])

  const temporary = mkdtempSync(join(tmpdir(), 'portal-design-check-'))
  try {
    const copy = join(temporary, 'portal-workbench-ui-0914')
    cpSync(skillRoot, copy, { recursive: true })
    const matrix = readFileSync(join(copy, matrixPath), 'utf8')
    requireValue(matrix.split(matrixEnd).length === 2, '原版页面矩阵边界不唯一，不能叠加项目登记。')
    const rows = pages.map(page => `| ${page.label} | \`${page.route}\` | ${page.pageType} | ${page.components.join('/')} | ${page.implementation} | [VA-0] | ${page.remainingStates.join('；')} |`)
    writeFileSync(join(copy, matrixPath), matrix.replace(matrixEnd, rows.join('\n') + '\n' + matrixEnd))
    visual.pages.push(...pages.map(page => ({
      pageId: page.pageId, label: page.label, route: page.route, scope: 'visible',
      visualStatus: 'VA-0', captures: [], remainingStates: page.remainingStates,
    })))
    writeFileSync(join(copy, visualPath), JSON.stringify(visual, null, 2) + '\n')
    return runChecker(join(copy, 'scripts/check-consistency.mjs'), pages)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
}
