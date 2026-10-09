import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const candidates = [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)
let playwright
for (const candidate of candidates) {
  try { playwright = require(candidate); break } catch {}
}
if (!playwright) throw new Error('Playwright is required for this browser check')
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const browser = await playwright.chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
context.setDefaultTimeout(15000)
const errors = []
const loginRequests = []
context.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)))
context.on('request', (request) => { if (request.url().endsWith('/api/admin/login')) loginRequests.push(request.url()) })
const page = await context.newPage()
const password = 'Poc123456!'
const key = 'leaibot-account-request-status-rows'

async function login(account, value = password) {
  await page.goto(base + '/login?loginType=external')
  await page.getByLabel('用户名', { exact: true }).fill(account)
  await page.getByLabel('密码', { exact: true }).fill(value)
  await page.getByRole('button', { name: '登录工作台', exact: true }).click()
}

async function assertNoAccess(account) {
  await page.waitForURL('**/access-denied?**')
  assert.equal(new URL(page.url()).searchParams.get('userType'), 'external')
  await page.getByRole('heading', { name: '当前账号因为长时间未登录，权限已被移除，请重新申请', exact: true }).waitFor()
  assert.equal(await page.getByLabel('申请人 ITCode').inputValue(), account)
  assert.equal(await page.getByText('直线经理', { exact: true }).count(), 0)
  await page.getByPlaceholder('请输入关联人 ITCode').waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('preview_user')), null)
}

async function submitPermissionRequest(account) {
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByText('请选择一位业务负责人。', { exact: true }).waitFor()
  await page.getByPlaceholder('请输入关联人 ITCode').fill('wangxt8')
  await page.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangjq4')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('checkbox', { name: 'leaibot-cn', exact: true }).check()
  await page.getByRole('button', { name: '添加角色', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '添加角色', exact: true })
  await dialog.locator('.role-picker-check input').first().check()
  await dialog.getByRole('button', { name: '确认', exact: true }).click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  assert.match(await page.locator('.approval-flow').innerText(), /关联人/)
  assert.doesNotMatch(await page.locator('.approval-flow').innerText(), /直线经理/)
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByRole('heading', { name: '权限申请已进入审批', exact: true }).waitFor()
  const rows = await page.evaluate(() => JSON.parse(localStorage.getItem('leaibot-first-access-applications') || '[]'))
  const row = rows.find((item) => item.targetItcode === account)
  assert.equal(row.applicantPersonType, 'external')
  assert.equal(row.nodeType, 'relation')
  assert.equal(row.relatedAccount, 'wangxt8')
}

try {
  await login('external-noaccess', 'wrong')
  await page.getByText('用户名或密码错误', { exact: true }).waitFor()
  await login('external-noaccess')
  await assertNoAccess('external-noaccess')
  await submitPermissionRequest('external-noaccess')
  console.log('External no-access login and permission application passed')
  await page.getByRole('button', { name: '返回登录页', exact: true }).first().click()
  await page.getByLabel('用户名', { exact: true }).waitFor()

  await login('external-disabled')
  await page.getByText('当前账号已禁用，请申请启用后再登录。', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(os.tmpdir(), 'leaibot-poc-disabled-login.png'), fullPage: true })
  await page.getByRole('button', { name: '申请启用账号', exact: true }).click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByText('请填写申请原因。', { exact: true }).waitFor()
  await page.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
  await page.getByLabel('申请原因', { exact: true }).fill('外部协作恢复，申请启用账号。')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.waitForURL('**/account-request/status?**')
  const statusUrl = page.url()
  const ticket = new URL(statusUrl).searchParams.get('ticket')
  await page.getByText('审核中', { exact: true }).waitFor()

  await login('external-disabled')
  await page.getByRole('button', { name: '申请启用账号', exact: true }).click()
  await page.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
  await page.getByLabel('申请原因', { exact: true }).fill('重复申请检查')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByRole('heading', { name: '已有启用申请正在审批', exact: true }).waitFor()
  assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).filter((row) => row.targetItcode === 'external-disabled').length, key), 1)
  await page.goto(statusUrl)
  console.log('Disabled login, enable application and duplicate prevention passed')

  const admin = await context.newPage()
  await admin.goto(base + '/agent/permissions?module=approval&ticket=' + ticket + '&approver=sunzh4&viewer=approver&identity=system-admin')
  await admin.getByRole('button', { name: '审批', exact: true }).click()
  await admin.getByRole('button', { name: '同意', exact: true }).click()
  await admin.getByRole('button', { name: '提交审批', exact: true }).waitFor({ timeout: 20000 })
  await admin.getByRole('button', { name: '提交审批', exact: true }).click()
  await page.getByText('已完成', { exact: true }).waitFor()
  const completed = await page.evaluate(({key, ticket}) => JSON.parse(localStorage.getItem(key)).find((row) => row.id === ticket), {key, ticket})
  assert.equal(completed.statusKey, 'done')
  await admin.close()
  await page.getByRole('link', { name: '返回登录页', exact: true }).click()
  await page.getByLabel('用户名', { exact: true }).fill('external-disabled')
  await page.getByLabel('密码', { exact: true }).fill(password)
  await page.getByRole('button', { name: '登录工作台', exact: true }).click()
  await assertNoAccess('external-disabled')
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert.ok(overflow <= 1, `Permission application overflows at ${width}px`)
  }
  await page.screenshot({ path: path.join(os.tmpdir(), 'leaibot-poc-enabled-noaccess.png'), fullPage: true })
  await submitPermissionRequest('external-disabled')

  assert.equal(loginRequests.length, 0, 'Fixtures must not call the real login endpoint')
  assert.deepEqual(errors, [], 'No page runtime errors')
  console.log('Browser checks passed: external no-access application; disabled login, validation, duplicate prevention, real approval UI, live progress, re-login and external permission application.')
} catch (error) {
  for (const [index, openPage] of context.pages().entries()) {
    console.error('Failure page:', openPage.url(), (await openPage.locator('body').innerText()).slice(-7000))
    await openPage.screenshot({ path: path.join(os.tmpdir(), `leaibot-poc-failure-${index}.png`), fullPage: true })
  }
  throw error
} finally {
  await browser.close()
}
