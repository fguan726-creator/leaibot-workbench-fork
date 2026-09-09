import assert from 'node:assert/strict'
import { verifySourceSearch } from './permission-source-search-assertions.mjs'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
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
  throw new Error('未找到 Playwright。')
}

const { chromium } = loadPlaywright()
const baseUrl = process.env.PERMISSION_QA_BASE_URL || 'http://localhost:5173/admin-vue'
const browserErrors = []
const failedResponses = []
const screenshots = []

function attachDiagnostics(page) {
  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) browserErrors.push(`console: ${message.text()}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`)
  })
}

async function openModule(page, label) {
  await page.locator('.permission-module-rail button').filter({ hasText: label }).click()
  await page.getByRole('heading', { name: label, exact: true }).waitFor()
}

async function screenshot(page, name) {
  const file = path.join(os.tmpdir(), `leaibot-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  screenshots.push(file)
}

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => {
  localStorage.clear()
  localStorage.setItem('preview_user', 'qa-admin')
})
const page = await context.newPage()
attachDiagnostics(page)
await page.goto(`${baseUrl}/agent/permissions`, { waitUntil: 'domcontentloaded' })
await page.locator('.permission-page-vue').waitFor()

await openModule(page, '审批列表')
const approvalsBefore = await page.locator('.approval-table tbody tr').count()

await openModule(page, '用户管理')
let firstRow = page.locator('.user-management-table tbody tr').first()
await firstRow.getByRole('button', { name: '编辑', exact: true }).click()
let editor = page.locator('.user-editor-modal')
await editor.waitFor()
assert.equal(await editor.getByText('用户身份', { exact: true }).count(), 1, '用户编辑应按用户身份分区')
assert.equal(await editor.getByText('租户与账号设置', { exact: true }).count(), 1, '用户编辑应按租户与账号设置分区')
assert.equal(await editor.getByText('用户 ITCode', { exact: false }).count() > 0, true, '内部用户应展示用户 ITCode')
assert.equal(await editor.getByText('用户直线经理', { exact: false }).count() > 0, true, '内部用户应展示必填直线经理')
assert.equal(await editor.getByText('申请人直线经理', { exact: false }).count(), 0, '用户主档不得展示申请人经理')
assert.equal(await editor.locator('.tenant-multi-options:not(.organization-multi-options) input').count() > 1, true, '所属租户必须支持多选')
assert.equal(await editor.locator('.tenant-multi-options:not(.organization-multi-options) input:checked').count(), 1, '历史单租户数据应归一化为多选状态')
assert.equal(await editor.getByText('申请单号', { exact: true }).count(), 0, '编辑页不得展示手工申请单号字段')
for (const removedField of ['用户显示名称', '用户账号', '内部 AD 账户', '是否绑定 ITCode']) {
  assert.equal(await editor.getByText(removedField, { exact: false }).count(), 0, `用户基本信息不得展示 ${removedField}`)
}
assert.equal(await editor.locator('.organization-multi-options input').count() > 1, true, '所属组织必须支持多选')
assert.equal(await editor.locator('.organization-multi-options input:checked').count(), 1, '历史单组织数据应归一化为多选状态')
await editor.locator('.organization-multi-options label').nth(1).click()
assert.equal(await editor.locator('.organization-multi-options input:checked').count(), 2, '所属组织应允许同时选择多个组织')

const mobileInput = editor.locator('input[placeholder="请输入手机号"]')
await mobileInput.fill('13800000001')
await editor.getByRole('button', { name: '保存基本信息', exact: true }).click()
await editor.getByText('用户基本信息已保存。', { exact: true }).waitFor()
assert.equal(await editor.locator('.organization-multi-options input:checked').count(), 2, '保存后必须保留多个所属组织')
assert.equal(await editor.getByRole('button', { name: '进入编辑', exact: true }).count(), 1, '基本信息保存后应进入只读详情')
await editor.getByRole('button', { name: '关闭', exact: true }).click()

firstRow = page.locator('.user-management-table tbody tr').first()
await firstRow.getByRole('button', { name: '禁用', exact: true }).click()
const statusDialog = page.locator('.direct-status-modal')
await statusDialog.waitFor()
await statusDialog.getByText('该操作由系统管理员直接执行，不生成审批申请。', { exact: true }).waitFor()
await statusDialog.locator('textarea').fill('浏览器验收：管理员直接禁用')
await statusDialog.getByRole('button', { name: '确认禁用', exact: true }).click()
await firstRow.getByText('已禁用', { exact: true }).waitFor()

await openModule(page, '审批列表')
assert.equal(await page.locator('.approval-table tbody tr').count(), approvalsBefore, '直接禁用不得新增审批记录')

await openModule(page, '用户管理')
const permissionRow = page.locator('.user-management-table tbody tr').nth(1)
await permissionRow.getByRole('button', { name: '编辑', exact: true }).click()
editor = page.locator('.user-editor-modal')
await editor.waitFor()
await editor.getByRole('button', { name: '已分配角色', exact: true }).click()
const addRoleButton = editor.getByRole('button', { name: '添加角色', exact: true })
await addRoleButton.click()
const roleDialog = page.getByRole('dialog', { name: '添加角色', exact: true })
await roleDialog.waitFor()
assert.equal(await roleDialog.locator('.modal-search-input').first().evaluate((element) => element === document.activeElement), true, '用户管理添加角色必须自动聚焦搜索框')
assert.equal(await roleDialog.getAttribute('aria-modal'), 'true', '用户管理添加角色必须复用标准模态语义')
const activeRoleRow = roleDialog.locator('.role-picker-row').filter({ hasText: '商品运营' }).first()
await activeRoleRow.click()
const activeRoleCheckbox = activeRoleRow.locator('.role-picker-check input')
if (await activeRoleCheckbox.isChecked()) await activeRoleCheckbox.uncheck()
const functionCheckbox = roleDialog.locator('.role-detail-drawer input[type=checkbox]:not(:disabled)').first()
await functionCheckbox.waitFor()
if (await functionCheckbox.isChecked()) await functionCheckbox.uncheck()
assert.equal(await activeRoleCheckbox.isChecked(), false, '取消角色后必须保留详情供重新选择')
await functionCheckbox.check()
assert.equal(await activeRoleCheckbox.isChecked(), true, '用户管理勾选功能权限必须自动选择对应角色')
await functionCheckbox.uncheck()
assert.equal(await activeRoleCheckbox.isChecked(), true, '用户管理取消功能权限不得自动取消对应角色')
await activeRoleCheckbox.uncheck()
await roleDialog.getByRole('button', { name: '数据权限', exact: false }).click()
const dataCheckbox = roleDialog.locator('.data-dataset-item input[type=checkbox]:not(:disabled)').first()
await dataCheckbox.waitFor()
if (await dataCheckbox.isChecked()) await dataCheckbox.uncheck()
await dataCheckbox.check()
assert.equal(await activeRoleCheckbox.isChecked(), true, '用户管理勾选数据权限必须自动选择对应角色')
await screenshot(page, 'user-management-add-role-1440')
await verifySourceSearch(roleDialog)
await roleDialog.getByRole('button', { name: '确认', exact: true }).click()
assert.equal(await addRoleButton.evaluate((element) => element === document.activeElement), true, '确认添加角色后必须恢复触发按钮焦点')
assert.equal(await editor.getByRole('button', { name: '提交权限变更申请', exact: true }).count(), 1, '角色、功能或数据权限变化必须进入权限变更申请')
await editor.getByRole('button', { name: '基本信息', exact: true }).click()

const tenantOptions = editor.locator('.tenant-multi-options:not(.organization-multi-options) label')
const checkedBefore = await editor.locator('.tenant-multi-options:not(.organization-multi-options) input:checked').count()
let changedTenant = false
for (let index = 0; index < await tenantOptions.count(); index += 1) {
  const checkbox = tenantOptions.nth(index).locator('input')
  if (!await checkbox.isChecked()) {
    await tenantOptions.nth(index).click()
    changedTenant = true
    break
  }
}
assert.equal(changedTenant, true, '必须存在可新增的租户')
await editor.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangyi44')
await editor.getByRole('button', { name: '提交权限变更申请', exact: true }).click()
const successNotice = editor.locator('.approval-feedback')
await successNotice.waitFor()
const noticeText = await successNotice.textContent() || ''
const ticket = noticeText.match(/AP-\d{8}-\d{3}/)?.[0]
assert.ok(ticket, '权限变更提交后必须展示系统生成的申请单号')
assert.equal(await editor.locator('.tenant-multi-options:not(.organization-multi-options) input:checked').count(), checkedBefore, '审批完成前用户当前生效租户必须保持不变')
await editor.getByText('已有权限变更正在审批', { exact: true }).waitFor()
await editor.getByRole('button', { name: '进入编辑', exact: true }).click()
await editor.getByRole('button', { name: '已分配角色', exact: true }).click()
assert.equal(await editor.getByRole('button', { name: '添加角色', exact: true }).count(), 0, '存在待审批申请时角色编辑入口必须锁定')
await editor.getByRole('button', { name: '基本信息', exact: true }).click()
assert.equal(await editor.locator('.tenant-multi-options:not(.organization-multi-options) input:not(:disabled)').count(), 0, '存在待审批申请时租户权限必须锁定')
assert.equal(await editor.getByRole('button', { name: '保存基本信息', exact: true }).count(), 1, '待审批期间仍应允许保存基本信息')
await screenshot(page, 'user-management-pending-1440')
await editor.getByRole('button', { name: '取消', exact: true }).click()

await openModule(page, '审批列表')
assert.equal(await page.locator('.approval-table tbody tr').count(), approvalsBefore + 1, '权限变更必须新增一条审批记录')
await page.getByText(ticket, { exact: true }).waitFor()
await page.getByText('权限变更', { exact: true }).first().waitFor()

await openModule(page, '用户管理')
await page.locator('.user-management-table tbody tr').last().getByRole('button', { name: '编辑', exact: true }).click()
editor = page.locator('.user-editor-modal')
await editor.waitFor()
assert.equal(await editor.locator('.field-label.required').filter({ hasText: /^用户名/ }).count(), 1, '外部用户应展示用户名')
assert.equal(await editor.locator('.field-label.required').filter({ hasText: /^关联人 ITCode/ }).count(), 1, '外部用户应展示必填关联人 ITCode')
assert.equal(await editor.locator('.field-label.required').filter({ hasText: /^用户直线经理/ }).count(), 0, '外部用户不得展示用户直线经理')
await editor.getByRole('button', { name: '取消', exact: true }).click()

await page.setViewportSize({ width: 1280, height: 800 })
await openModule(page, '用户管理')
await page.locator('.user-management-table tbody tr').nth(2).getByRole('button', { name: '编辑', exact: true }).click()
editor = page.locator('.user-editor-modal')
await editor.waitFor()
const editorBox = await editor.boundingBox()
assert.ok(editorBox && editorBox.x >= 0 && editorBox.x + editorBox.width <= 1280, '1280 视口下用户编辑弹窗不得横向溢出')
assert.equal(await editor.locator('.sticky-actions').isVisible(), true, '长内容下底部操作必须可达')
await screenshot(page, 'user-management-1280')

assert.deepEqual(browserErrors, [], `浏览器控制台出现错误：${browserErrors.join('; ')}`)
await context.close()
await browser.close()
console.log(JSON.stringify({ screenshots, browserErrors, failedResponses }, null, 2))
