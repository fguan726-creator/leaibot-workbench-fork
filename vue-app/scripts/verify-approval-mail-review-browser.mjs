import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
let playwright
for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { playwright = require(candidate); break } catch {}
}
if (!playwright) throw new Error('Playwright required')
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5176/admin-vue'
const out = path.join(os.tmpdir(), 'approval-mail-review-qa')
await fs.mkdir(out, { recursive: true })
const browser = await playwright.chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
context.setDefaultTimeout(15000)
await context.route('**/api/admin/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
const errors = []
context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
const page = await context.newPage()
const key = 'leaibot-approval-mail-mock-rows'
async function saved(tab, ticket) { return tab.evaluate(({ key, ticket }) => JSON.parse(localStorage.getItem(key)).find(row => row.id === ticket), { key, ticket }) }
async function assertSimplifiedApproval(tab) {
  const body = tab.locator('.approval-workspace-body')
  assert.equal(await body.getByText('业务负责人审批进度', { exact: true }).count(), 0)
  assert.equal(await body.locator('.business-progress-panel, .business-task-card').count(), 0)
  assert.equal(await body.locator(':scope > section').first().locator('b').first().textContent(), '完整审批链路')
  await body.getByText('基本信息', { exact: true }).waitFor()
  assert.equal(await body.locator('.approval-detail-grid dt').filter({ hasText: /^业务负责人$/ }).count(), 1)
  assert.ok(await body.locator('.approval-full-route-list').getByText('业务负责人审批', { exact: true }).count())
}
try {
  await page.goto(base + '/agent/permissions?module=approval')
  await page.locator('tbody tr').filter({ hasText: '申请人直线经理审批' }).getByRole('button', { name: '审批', exact: true }).first().click()
  await page.getByText('完整权限范围', { exact: true }).waitFor()
  await assertSimplifiedApproval(page)
  await page.screenshot({ path: path.join(out, 'account-simplified.png'), fullPage: true })
  const popup = context.waitForEvent('page')
  await page.getByRole('button', { name: '审批邮件演示', exact: true }).click()
  const mail = await popup
  await mail.waitForLoadState()
  await mail.locator('.mail-tab[data-mail-role="applicant-manager"]').click()
  const guestUrl = await mail.getByRole('link', { name: '无账号审批', exact: true }).getAttribute('href')
  const accountUrl = await mail.getByRole('link', { name: '有账号审批', exact: true }).getAttribute('href')
  assert.ok(guestUrl.includes('/mail-approval/review?'))
  assert.ok(accountUrl.includes('/agent/permissions?'))
  const ticket = new URL(guestUrl).searchParams.get('ticket')
  const before = await saved(page, ticket)
  assert.equal(before.nodeType, 'applicant-manager')
  const guest = await context.newPage()
  // No login is used by the independent page; removing the preview session must not redirect it.
  await page.evaluate(() => localStorage.removeItem('preview_user'))
  await guest.goto(guestUrl)
  await guest.getByRole('heading', { name: '邮件审批', exact: true }).waitFor()
  await assertSimplifiedApproval(guest)
  assert.equal(await guest.locator('.permission-module-rail').count(), 0)
  assert.equal(await guest.getByText('完整权限范围', { exact: true }).count(), 0)
  assert.equal(await guest.getByRole('button', { name: '添加角色', exact: true }).count(), 0)
  assert.equal(await guest.evaluate(() => localStorage.getItem('preview_user')), null)
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844]]) {
    await guest.setViewportSize({ width, height })
    const layout = await guest.evaluate(() => {
      const footer = document.querySelector('.standalone-approval-content .modal-actions').getBoundingClientRect()
      const body = document.querySelector('.approval-workspace-body')
      return { footerBottom: footer.bottom, footerTop: footer.top, viewport: innerHeight, scrollable: body.scrollHeight > body.clientHeight, overflow: getComputedStyle(body).overflowY }
    })
    assert.ok(layout.footerTop >= 0 && layout.footerBottom <= height, 'Footer stays in viewport')
    assert.equal(layout.overflow, 'auto')
    assert.ok(layout.scrollable, 'Long content has its own scroll area')
    const overflow = await guest.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    assert.ok(overflow <= 1, 'No horizontal overflow at ' + width + ': ' + overflow)
    await guest.screenshot({ path: path.join(out, 'guest-' + width + '.png'), fullPage: true })
    await guest.locator('.approval-workspace-body').evaluate(el => { el.scrollTop = el.scrollHeight })
    await guest.screenshot({ path: path.join(out, 'guest-bottom-' + width + '.png'), fullPage: true })
    await guest.locator('.approval-workspace-body').evaluate(el => { el.scrollTop = 0 })
  }
  await guest.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('请选择审批结果，例如同意或驳回。').waitFor()
  const twin = await context.newPage()
  await twin.goto(guestUrl)
  await twin.getByRole('button', { name: '同意', exact: true }).click()
  await guest.getByRole('button', { name: '同意', exact: true }).click()
  await guest.locator('.approval-decision-panel textarea').fill('无账号领导演示通过')
  await guest.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('审批已提交，当前节点处理完成。您可以关闭此页面。').waitFor()
  await twin.getByText('当前节点无需您处理', { exact: false }).waitFor()
  assert.equal(await twin.getByRole('button', { name: '提交审批', exact: true }).count(), 0)
  const after = await saved(guest, ticket)
  assert.equal(after.approvalLogs.length, before.approvalLogs.length + 1)
  assert.deepEqual(after.permissionSnapshot, before.permissionSnapshot, 'Guest cannot edit permission snapshot')
  await guest.reload()
  assert.equal(await guest.getByRole('button', { name: '提交审批', exact: true }).count(), 0)
  await page.getByText('申请已在其他页面更新', { exact: false }).waitFor()
  await page.goto(accountUrl)
  await page.getByRole('button', { name: '查看', exact: true }).first().click()
  await page.getByText('完整权限范围', { exact: true }).waitFor()
  await mail.locator('.mail-tab[data-mail-role="target-manager"]').click()
  const targetGuestUrl = await mail.getByRole('link', { name: '无账号审批', exact: true }).getAttribute('href')
  const targetAccountUrl = await mail.getByRole('link', { name: '有账号审批', exact: true }).getAttribute('href')
  await guest.goto(targetGuestUrl)
  await guest.getByRole('button', { name: '同意', exact: true }).click()
  await guest.evaluate(key => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('演示存储暂不可用')
      return original.call(this, name, value)
    }
  }, key)
  await guest.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('演示存储暂不可用', { exact: true }).waitFor()
  assert.equal((await saved(page, ticket)).nodeType, 'target-manager', 'Storage failure does not advance the request')
  await guest.reload()
  await page.goto(targetAccountUrl)
  await page.getByRole('button', { name: '审批', exact: true }).click()
  await page.getByText('完整权限范围', { exact: true }).waitFor()
  await page.getByRole('button', { name: '添加角色', exact: true }).waitFor()
  await page.getByRole('button', { name: '同意', exact: true }).click()
  await page.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('当前节点无需您处理', { exact: false }).waitFor()
  assert.equal((await saved(page, ticket)).nodeType, 'business')
  await mail.locator('.mail-tab[data-mail-role^="business-owner:"]').first().click()
  const ownerUrl = await mail.getByRole('link', { name: '无账号审批', exact: true }).getAttribute('href')
  await guest.goto(ownerUrl)
  await assertSimplifiedApproval(guest)
  await guest.getByRole('button', { name: '同意', exact: true }).click()
  await guest.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('请选择至少一个所属组织，便于后台按组织授权。').waitFor()
  await guest.getByRole('button', { name: '驳回', exact: true }).click()
  await guest.locator('.approval-decision-panel textarea').fill('请补充申请说明')
  await guest.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('审批已提交，当前节点处理完成。您可以关闭此页面。').waitFor()
  assert.equal((await saved(page, ticket)).statusKey, 'rejected')
  await assertSimplifiedApproval(guest)
  await guest.screenshot({ path: path.join(out, 'guest-rejected.png'), fullPage: true })
  await page.goto(accountUrl)
  await page.getByRole('button', { name: '查看', exact: true }).click()
  await page.getByText('完整权限范围', { exact: true }).waitFor()
  // A separate fixture verifies successful business-owner confirmation and final execution.
  const successUrl = new URL(ownerUrl)
  const successTicket = ticket + '-business-success'
  successUrl.searchParams.set('ticket', successTicket)
  await page.evaluate(({ key, ticket, successTicket }) => {
    const rows = JSON.parse(localStorage.getItem(key))
    const source = rows.find(row => row.id === ticket)
    const row = structuredClone(source)
    row.id = successTicket
    row.statusKey = 'pending'
    row.status = '待我审批'
    row.nodeType = 'business'
    row.node = '业务负责人审批'
    row.businessApprovalTasks.forEach(task => { task.status = 'pending'; task.organizations = [] })
    row.approverItcode = row.businessApprovalTasks[0].approver
    row.handlers = [row.approverItcode]
    localStorage.setItem(key, JSON.stringify([row, ...rows]))
  }, { key, ticket, successTicket })
  await guest.goto(successUrl.href)
  await guest.getByRole('button', { name: '同意', exact: true }).click()
  await guest.locator('.approval-business-form button').first().click()
  await guest.getByRole('button', { name: '提交审批', exact: true }).click()
  await guest.getByText('审批已提交，当前节点处理完成。您可以关闭此页面。').waitFor()
  assert.equal((await saved(page, successTicket)).statusKey, 'done')
  await guest.reload()
  await guest.getByText('当前节点无需您处理', { exact: false }).waitFor()
  // Invalid and expired links never expose applicant data or a submit control.
  const bad = new URL(guestUrl)
  bad.searchParams.set('token', 'invalid')
  await guest.goto(bad.href)
  await guest.getByRole('heading', { name: '暂时无法查看申请' }).waitFor()
  assert.equal(await guest.locator('.approval-workspace-modal').count(), 0)
  if (process.env.APPROVAL_SERVER_QA_BASE_URL) {
    const server = await browser.newContext()
    const serverPage = await server.newPage()
    const serverUrl = process.env.APPROVAL_SERVER_QA_BASE_URL + '/mail-approval/review' + new URL(targetGuestUrl).search
    await serverPage.goto(serverUrl)
    const validRow = await saved(page, ticket)
    validRow.nodeType = 'target-manager'
    validRow.statusKey = 'pending'
    validRow.approverItcode = validRow.targetManager
    await serverPage.evaluate(({ key, row }) => localStorage.setItem(key, JSON.stringify([row])), { key, row: validRow })
    await serverPage.reload()
    await serverPage.getByRole('heading', { name: '暂时无法查看申请' }).waitFor()
    assert.equal(await serverPage.locator('.approval-workspace-modal').count(), 0, 'Server mode rejects even a valid locally forged preview record')
    assert.equal(await serverPage.evaluate(() => localStorage.getItem('preview_user')), null)
    await server.close()
  }
  await page.evaluate(({ key, ticket }) => {
    const rows = JSON.parse(localStorage.getItem(key))
    rows.find(row => row.id === ticket).guestApprovalLinks['applicant-manager'].expiresAt = 1
    localStorage.setItem(key, JSON.stringify(rows))
  }, { key, ticket })
  await guest.goto(guestUrl)
  await guest.getByText('审批链接已过期，请联系申请人重新获取。').waitFor()
  assert.equal(await guest.locator('.approval-workspace-modal').count(), 0)
  assert.deepEqual(errors, [])
  console.log('PASS: shared approval, both demo entries, guest isolation, unchanged permissions, cross-tab sync, duplicate guard, validation, expiry and 3 viewports')
} catch (error) {
  await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true })
  console.error('Browser errors:', errors)
  throw error
} finally { await browser.close() }
