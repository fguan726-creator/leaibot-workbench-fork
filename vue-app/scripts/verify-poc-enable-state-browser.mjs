import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
let playwright
for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { playwright = require(candidate); break } catch {}
}
if (!playwright) throw new Error('Playwright is required for this browser check')
const { chromium } = playwright
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const key = 'leaibot-account-request-status-rows'
const browser = await chromium.launch({ headless: true })
const failures = []
const errors = []

async function submit(page, type) {
  const account = type + '-disabled'
  await page.goto(base + '/agent/permissions?module=apply')
  await page.locator('.permission-type-grid button').filter({ hasText: '启用账号' }).click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  const flow = page.locator('.account-enable-flow')
  if (type === 'external') {
    await flow.getByRole('radio', { name: /外部人员/ }).click()
    await flow.getByLabel('被申请人用户名', { exact: true }).fill(account)
    await flow.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
  } else await flow.getByLabel('被申请人 ITCode', { exact: true }).fill(account)
  await flow.getByLabel('申请原因', { exact: true }).fill('P2 启用状态回归')
  await flow.getByRole('button', { name: '下一步', exact: true }).click()
  await flow.getByRole('button', { name: '提交申请', exact: true }).click()
  await flow.waitFor({ state: 'detached' })
  return page.evaluate(key => JSON.parse(localStorage.getItem(key))[0], key)
}
async function decide(page, request, action = '同意') {
  await page.goto(base + '/agent/permissions?module=approval&ticket=' + request.id + '&approver=sunzh4&viewer=approver&identity=system-admin')
  await page.getByRole('button', { name: '审批', exact: true }).click()
  await page.getByRole('button', { name: action, exact: true }).click()
  await page.getByRole('button', { name: '提交审批', exact: true }).click()
  await page.waitForFunction(({ key, id, status }) => JSON.parse(localStorage.getItem(key)).find(row => row.id === id)?.statusKey === status,
    { key, id: request.id, status: action === '同意' ? 'done' : 'rejected' })
}
async function loginNoAccess(page, type) {
  await page.evaluate(() => localStorage.removeItem('preview_user'))
  await page.goto(base + (type === 'internal' ? '/adfs-login' : '/login?loginType=external'))
  await page.getByRole('combobox').fill(type + '-disabled')
  await page.locator('input[type=password]').fill('Poc123456!')
  await page.getByRole('button', { name: type === 'internal' ? 'Submit' : '登录工作台', exact: true }).click()
  await page.waitForURL('**/portal/home')
  assert.equal(await page.evaluate(() => localStorage.getItem('preview_user')), type + '-disabled')
}
async function assertStatus(page, request) {
  await page.goto(base + '/account-request/status?ticket=' + request.id + '&token=' + request.token)
  await page.getByText('已完成', { exact: true }).waitFor()
}
try {
  for (const type of ['internal', 'external']) {
    for (const scenario of ['retain-history', 'repeat-enable']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
      context.setDefaultTimeout(10000)
      await context.route('**/api/admin/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
      context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)))
      const page = await context.newPage()
      try {
        const request = await submit(page, type)
        if (scenario === 'retain-history') {
          // Seed only unrelated history; the target is submitted and approved through actual UI.
          const originals = await page.evaluate(({ key, request }) => {
            const others = Array.from({ length: 30 }, (_, i) => ({
              ...request, id: 'QA-other-' + i, token: 'QA-token-' + i, targetItcode: 'other-' + i, target: 'other-' + i
            }))
            localStorage.setItem(key, JSON.stringify([...others, request]))
            return others
          }, { key, request })
          await decide(page, request)
          const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
          assert.equal(saved.length, 31, 'Approval must not truncate history')
          assert.deepEqual(saved.slice(0, 30), originals, 'Unrelated requests must stay intact')
          assert.equal(saved[30].statusKey, 'done')
          await assertStatus(page, request)
          await loginNoAccess(page, type)
          await page.reload()
          await page.waitForURL('**/portal/home')
        } else {
          await decide(page, request)
          await loginNoAccess(page, type)
          const repeated = await submit(page, type)
          assert.notEqual(repeated.id, request.id)
          assert.equal(repeated.statusKey, 'pending')
          await loginNoAccess(page, type)
          await decide(page, repeated, '驳回')
          await loginNoAccess(page, type)
          await assertStatus(page, request)
          const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
          assert.equal(saved.find(row => row.id === request.id).statusKey, 'done')
          assert.equal(saved.find(row => row.id === repeated.id).statusKey, 'rejected')
        }
        console.log(type + ' / ' + scenario + ': passed')
      } catch (error) {
        failures.push(type + ' / ' + scenario + ': ' + error.message)
        await page.screenshot({ path: path.join(os.tmpdir(), 'poc-enable-' + type + '-' + scenario + '-failure.png'), fullPage: true })
      } finally { await context.close() }
    }
  }
  assert.deepEqual(errors, [], 'No page runtime errors')
  assert.deepEqual(failures, [], 'P2 browser regressions')
  console.log('Both P2 regressions passed for internal/external accounts with actual submission, approval, rejection, progress lookup and re-login.')
} finally { await browser.close() }
