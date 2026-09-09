import assert from 'node:assert/strict'
import { verifySourceSearch } from './permission-source-search-assertions.mjs'
import { createRequire } from 'node:module'
import path from 'node:path'
import os from 'node:os'

const require = createRequire(import.meta.url)
function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE_PATH,
    'playwright',
    path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
  ].filter(Boolean)
  for (const candidate of candidates) {
    try { return require(candidate) } catch {}
  }
  throw new Error('未找到 Playwright，请安装或通过 PLAYWRIGHT_MODULE_PATH 指定模块目录。')
}
const { chromium } = loadPlaywright()
const baseUrl = process.env.PERMISSION_QA_BASE_URL || 'http://localhost:5174/admin-vue'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
const screenshots = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text())
})
await context.addInitScript(() => {
  localStorage.clear()
  localStorage.setItem('preview_user', 'qa-admin')
})

async function openModule(name) {
  await page.locator('.permission-module-rail').getByRole('button').filter({ hasText: name }).click()
  await page.getByRole('heading', { name, exact: true }).waitFor()
}

async function openProductRole() {
  await openModule('角色管理')
  await page.locator('.role-management-table tbody tr').filter({ hasText: '商品运营' }).getByRole('button', { name: '编辑', exact: true }).click()
  const modal = page.locator('.role-editor-modal')
  await modal.getByRole('button', { name: '数据权限', exact: true }).click()
  return modal
}

async function snapshot(modal, name) {
  const geometry = await modal.evaluate((element) => ({
    width: element.clientWidth, overflow: element.scrollWidth - element.clientWidth,
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }))
  assert.ok(geometry.overflow <= 1 && geometry.pageOverflow <= 1, `${name} 不得横向溢出：${JSON.stringify(geometry)}`)
  const file = path.join(os.tmpdir(), `leaibot-data-tree-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  screenshots.push({ file, geometry })
}

try {
  await page.goto(`${baseUrl}/agent/permissions`, { waitUntil: 'domcontentloaded' })
  await page.locator('.permission-page-vue').waitFor()
  let modal = await openProductRole()
  await verifySourceSearch(modal)
  await modal.locator('.source-search-trigger').first().click()
  await modal.locator('.source-search-box input').first().fill('华北')
  await snapshot(modal, 'source-search-1440')
  await page.setViewportSize({ width: 1280, height: 800 })
  await snapshot(modal, 'source-search-1280')
  await modal.locator('.source-search-trigger').first().click()
  assert.equal(await modal.locator('.data-directory').count(), 4)
  assert.equal(await modal.locator('.data-source').count(), 5)
  assert.equal(await modal.locator('.data-dataset-item').count(), 14)
  assert.equal(await modal.locator('.data-dataset-item input:checked').count(), 2, '商品运营只保留原有两项授权')
  assert.equal(await modal.locator('.data-directory-head input, .data-source-toggle input').count(), 0)
  const source = modal.locator('[data-source-id="ds-ops-region"]')
  assert.deepEqual(await source.locator('.data-dataset-item > span').allTextContents(), ['华东区', '华北区', '华南区', '流量转化', 'GMV 指标'])
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport)
    await snapshot(modal, `role-${viewport.width}`)
  }
  await modal.locator('.modal-close').click()

  await openModule('数据源管理')
  await page.locator('.datasource-table tbody tr').filter({ hasText: '运营指标查询' }).getByRole('button', { name: '编辑', exact: true }).click()
  let editor = page.locator('.datasource-editor-modal')
  await editor.getByPlaceholder('例如：运营指标查询', { exact: true }).fill('运营指标查询（改名验证）')
  await editor.locator('.function-menu-trigger').click()
  await editor.locator('.datasource-menu-cascade').getByRole('button', { name: 'GEO 看板', exact: true }).click()
  await editor.getByRole('button', { name: '保存', exact: true }).click()

  modal = await openProductRole()
  const moved = modal.locator('[data-directory-id="GEO 看板"] [data-source-id="ds-ops-region"]')
  assert.equal(await moved.locator('.data-source-toggle b').textContent(), '运营指标查询（改名验证）')
  assert.equal(await moved.locator('.data-dataset-item').count(), 5, '编辑数据源保留全部叶子')
  assert.equal(await moved.locator('input:checked').count(), 2, '改名和移动后已有授权仍回显')
  assert.equal(await modal.locator('[data-source-id="ds-ops-region"]').count(), 1, '不得在旧目录残留重复来源')
  assert.equal(await modal.locator('.data-dataset-item').count(), 14, '改名移动不得生成额外叶子')
  await snapshot(modal, 'source-moved-1280')
  await modal.locator('.modal-close').click()

  await openModule('数据源管理')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator('.datasource-table tbody tr').filter({ hasText: '运营指标查询（改名验证）' }).getByRole('button', { name: '删除', exact: true }).click()
  modal = await openProductRole()
  assert.equal(await modal.locator('[data-source-id="ds-ops-region"]').count(), 0)
  assert.equal(await modal.locator('.data-dataset-item').count(), 9, '删除数据源清理全部对应叶子')
  assert.equal(await modal.locator('.data-dataset-item input:checked').count(), 0, '已删除授权不得继续回显')
  await modal.locator('.modal-close').click()

  await openModule('数据源管理')
  await page.getByRole('button', { name: '新增数据源', exact: true }).click()
  editor = page.locator('.datasource-editor-modal')
  await editor.locator('.function-menu-trigger').click()
  await editor.locator('.datasource-menu-cascade').getByRole('button', { name: '乐享运营', exact: true }).click()
  await editor.getByPlaceholder('例如：运营指标查询', { exact: true }).fill('新增范围验证')
  await editor.getByPlaceholder('例如：/api/ops/metrics', { exact: true }).fill('/api/mock/test')
  await editor.getByPlaceholder('例如：regionCode', { exact: true }).fill('regionCode')
  await editor.getByPlaceholder('例如：east', { exact: true }).fill('测试范围')
  await editor.getByRole('button', { name: '保存', exact: true }).click()
  modal = await openProductRole()
  const added = modal.locator('.data-source').filter({ hasText: '新增范围验证' })
  assert.equal(await added.locator('.data-dataset-item').count(), 1)
  assert.equal(await added.locator('.data-dataset-item > span').textContent(), '测试范围')
  assert.equal(await added.locator('input:checked').count(), 0, '新增源不自动授予普通角色')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ ok: true, scenarios: ['initial-tree', 'role-scope', 'source-rename-move', 'source-delete', 'source-create'], screenshots, errors }, null, 2))
} finally {
  await context.close()
  await browser.close()
}
