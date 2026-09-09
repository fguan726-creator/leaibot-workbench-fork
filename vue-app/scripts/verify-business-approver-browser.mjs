import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import path from 'node:path'
import os from 'node:os'

const require = createRequire(import.meta.url)
let playwright
for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { playwright = require(candidate); break } catch {}
}
if (!playwright) throw new Error('未找到 Playwright')
const baseUrl = process.env.PERMISSION_QA_BASE_URL || 'http://localhost:5174/admin-vue'
const browser = await playwright.chromium.launch({ headless: true })
const errors = []
const screenshots = []
const backendFailures = []
try {
  for (const adjustRoles of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.addInitScript(() => localStorage.setItem('preview_user', JSON.stringify({ username: 'qa-admin', name: 'QA', role: 'admin' })))
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => { if (response.status() >= 400) backendFailures.push(`${response.status()} ${response.url()}`) })
    await page.goto(`${baseUrl}/access-denied?itcode=qa-business-${adjustRoles ? 'roles' : 'data'}`)
    const select = page.getByRole('combobox', { name: '业务负责人', exact: true })
    await select.waitFor()
    assert.equal(await select.inputValue(), '', '初始不得预选负责人')
    assert.equal(await select.locator('option:checked').textContent(), '业务负责人', '统一使用简短占位文案')
    assert.match(await select.getAttribute('class'), /is-placeholder/)
    const placeholderColor = await select.evaluate((element) => getComputedStyle(element).color)
    assert.equal(await select.evaluate((element) => element.multiple), false, '只允许单选')
    assert.equal(await select.locator('optgroup').count(), 2)
    assert.deepEqual(await select.locator('optgroup option').evaluateAll((options) => options.map((option) => option.value)), ['zhangjq4', 'huangjq5', 'zhangxy43', 'zhangrui32', 'zhangyi44'])
    await page.getByRole('button', { name: '下一步', exact: true }).click()
    await page.getByText('请选择一位业务负责人。', { exact: true }).waitFor()
    assert.equal(await select.getAttribute('aria-invalid'), 'true')
    await select.selectOption('zhangjq4')
    await select.selectOption('zhangyi44')
    assert.equal(await select.inputValue(), 'zhangyi44', '换选覆盖前一人')
    assert.notEqual(await select.evaluate((element) => getComputedStyle(element).color), placeholderColor, '选中后必须恢复正文文字色')
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 390, height: 844 }]) {
      if (adjustRoles) break
      await page.setViewportSize(viewport)
      await select.scrollIntoViewIfNeeded()
      const file = path.join(os.tmpdir(), `leaibot-business-approver-${viewport.width}.png`)
      await page.screenshot({ path: file, fullPage: true })
      screenshots.push(file)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), '页面不得横向溢出')
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: '下一步', exact: true }).click()
    await page.locator('.tenant-multi-options input').first().check()
    await page.getByRole('button', { name: '选择数据权限', exact: true }).click()
    const dataDialog = page.getByRole('dialog', { name: '选择数据权限', exact: true })
    await dataDialog.locator('.data-dataset-item input').first().check()
    await dataDialog.getByRole('button', { name: '确认', exact: true }).click()
    await page.getByRole('button', { name: '下一步', exact: true }).click()
    await page.getByRole('heading', { name: '确认并提交' }).waitFor()
    assert.equal(await page.locator('.approval-flow article').count(), 3, '经理、唯一业务负责人、自动生效')
    assert.match(await page.locator('.approval-flow').innerText(), /zhangyi44/)
    assert.doesNotMatch(await page.locator('.approval-flow').innerText(), /zhangjq4|huangjq5/)
    await page.getByRole('button', { name: '提交申请', exact: true }).click()
    const application = await page.evaluate(() => JSON.parse(localStorage.getItem('leaibot-first-access-applications'))[0])
    assert.equal(application.businessApprover, 'zhangyi44')
    assert.equal(application.permissionSnapshot.businessApprover, 'zhangyi44')
    assert.deepEqual(application.businessOwners, ['zhangyi44'])
    assert.equal(application.permissionSnapshot.selectedRoleIds.length, 0, '仅数据权限的申请也必须有业务审批')
    const ticket = application.id
    assert.ok(ticket)
    await page.goto(`${baseUrl}/agent/permissions?module=approval`)
    await page.locator('.permission-page-vue').waitFor()
    const row = page.locator('tbody tr').filter({ hasText: ticket }).first()
    await row.waitFor()
    await row.getByRole('button', { name: '审批', exact: true }).click()
    const approval = page.locator('.approval-workspace-modal')
    await approval.waitFor()
    assert.match(await approval.locator('.approval-detail-grid').innerText(), /zhangyi44/)
    if (adjustRoles) {
      await approval.getByRole('button', { name: '添加角色', exact: true }).click()
      const roleDialog = page.getByRole('dialog', { name: '添加角色', exact: true })
      for (const name of ['商品运营', 'GEO 分析师']) {
        await roleDialog.locator('.role-picker-row').filter({ hasText: name }).locator('.role-picker-check input').check()
      }
      await roleDialog.getByRole('button', { name: '确认', exact: true }).click()
    }
    await approval.locator('.approval-result-options button').filter({ hasText: '同意' }).click()
    await approval.getByRole('button', { name: '提交审批', exact: true }).click()
    await approval.waitFor({ state: 'hidden' })
    assert.match(await row.innerText(), /业务负责人/)
    assert.match(await row.innerText(), /zhangyi44/)
    assert.doesNotMatch(await row.innerText(), /已完成/, '经理通过不能提前生效')
    await row.getByRole('button', { name: '审批', exact: true }).click()
    await approval.waitFor()
    assert.equal(await approval.locator('.business-task-card').count(), 1, '即使新增多角色，也只有原先指定的业务负责人')
    assert.match(await approval.locator('.business-task-card').innerText(), /zhangyi44/)
    await approval.locator('.approval-result-options button').filter({ hasText: '同意' }).click()
    await approval.getByRole('button', { name: '提交审批', exact: true }).click()
    await approval.getByText('请选择至少一个所属组织，便于后台按组织授权。', { exact: true }).waitFor()
    await approval.locator('.organization-picker button').first().click()
    await approval.getByRole('button', { name: '提交审批', exact: true }).click()
    await approval.waitFor({ state: 'hidden' })
    assert.match(await row.innerText(), /已完成/, '唯一指定人通过后整单生效')
    await context.close()
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(backendFailures.filter((failure) => !failure.endsWith('/api/admin/me')), [])
  console.log(JSON.stringify({ ok: true, scenarios: ['required-single-select', 'data-only-approval', 'manager-adjusts-multiple-roles', 'selected-owner-completes', 'responsive-1440-1280-390'], screenshots, backendFailures }, null, 2))
} finally {
  await browser.close()
}
