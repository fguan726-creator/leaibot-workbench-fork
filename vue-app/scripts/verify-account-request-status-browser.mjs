import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
let playwright
for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { playwright = require(candidate); break } catch {}
}
if (!playwright) throw new Error('Playwright is required')
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5176/admin-vue'
const output = path.join(os.tmpdir(), 'account-request-status-qa')
mkdirSync(output, { recursive: true })
const key = 'leaibot-account-request-status-rows'
const row = {
  id: 'AP-20261009-4b45070f-4503-4869-9a90-32aae57ed64a', token: 'QA-status-token',
  typeKey: 'enable', type: '启用账号', applicant: 'internal-disabled', applicantItcode: 'internal-disabled',
  target: 'internal-disabled', personType: 'internal', systemApprover: 'sunzh4',
  node: '系统管理员审批', nodeType: 'system-admin', status: '待我审批', statusKey: 'pending',
  time: '2026-10-09 14:29', reason: '申请恢复账号，以便重新申请工作台权限。',
  logs: [{ node: '申请人提交', detail: '已提交账号启用申请，等待系统管理员审批。', time: '2026-10-09 14:29' }]
}
const browser = await playwright.chromium.launch({ headless: true })
const context = await browser.newContext()
context.setDefaultTimeout(10000)
await context.route('**/api/admin/me', route => route.fulfill({ status: 401, body: '{}' }))
const errors = []
context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
const page = await context.newPage()
const url = base + '/account-request/status?ticket=' + row.id + '&token=' + row.token
const measurements = []
async function seed(value) { await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify([value])), { key, value }) }
async function measure() {
  await page.locator('.application-progress-summary').waitFor()
  return page.evaluate(() => {
    const panel = document.querySelector('.application-progress-summary')
    const main = document.querySelector('main')
    const title = panel.querySelector('h1')
    const rect = panel.getBoundingClientRect()
    return { viewport: innerWidth, width: rect.width, center: rect.x + rect.width / 2,
      overflow: Math.max(document.documentElement.scrollWidth - innerWidth, main.scrollWidth - main.clientWidth),
      font: getComputedStyle(title).fontSize, icon: panel.querySelector('.progress-icon').getBoundingClientRect().width }
  })
}
try {
  await page.goto(base + '/login')
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1040, height: 640 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    for (const personType of ['internal', 'external']) {
      for (const state of ['pending', 'done', 'rejected']) {
        const current = { ...row, personType, statusKey: state,
          status: { pending: '待我审批', done: '已完成', rejected: '已驳回' }[state],
          nodeType: { pending: 'system-admin', done: 'done', rejected: 'rework' }[state],
          node: state === 'done' ? '执行完成' : '系统管理员审批' }
        await seed(current)
        await page.goto(url)
        await page.getByRole('heading', { name: { pending: '账号启用申请已进入审批', done: '账号已启用', rejected: '账号启用申请已驳回' }[state], exact: true }).waitFor()
        assert.equal(await page.locator('.approval-flow li').count(), 2)
        assert.equal(await page.locator('.status-details').getAttribute('open'), null)
        assert.equal(await page.locator('.status-actions a').getAttribute('href'), '/admin-vue/login?loginType=' + personType)
        assert.equal(await page.locator('.status-login-link').count(), 1)
        assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key), [current], 'Progress page is read-only')
        const geometry = await measure()
        assert.equal(geometry.overflow, 0)
        assert.ok(Math.abs(geometry.center - viewport.width / 2) <= 10, 'Centered result with scrollbar allowance')
        measurements.push({ ...geometry, personType, state })
        if (personType === 'internal' && (state === 'pending' || viewport.width === 1040)) {
          await page.screenshot({ path: path.join(output, viewport.width + '-' + state + '.png'), fullPage: true })
        }
      }
    }
  }
  await page.setViewportSize({ width: 1040, height: 640 })
  await seed(row)
  await page.goto(url)
  const enableGeometry = await measure()
  // Same component and content width in the reference permission-application page.
  await page.evaluate(() => localStorage.setItem('leaibot-first-access-applications', JSON.stringify([{
    id: 'PA-QA-reference', applicantItcode: 'noaccess', statusKey: 'pending',
    applicantManager: 'sunll1', businessOwners: ['zhangjq4']
  }])))
  await page.goto(base + '/access-denied?itcode=noaccess&userType=internal')
  await page.getByRole('heading', { name: '权限申请已进入审批', exact: true }).waitFor()
  const reference = await measure()
  assert.equal(reference.overflow, 0)
  assert.ok(Math.abs(reference.center - 520) <= 10)
  assert.equal(reference.width, enableGeometry.width)
  assert.equal(reference.font, enableGeometry.font)
  assert.equal(reference.icon, enableGeometry.icon)
  assert.equal(await page.locator('.approval-flow li').count(), 3)
  await page.screenshot({ path: path.join(output, 'reference-permission.png'), fullPage: true })
  // Long details stay readable and the bottom exit remains reachable.
  await seed({ ...row, reason: '很长的申请原因。'.repeat(80), logs: Array.from({ length: 21 }, (_, i) => ({ node: '处理记录 ' + i, detail: '状态说明。'.repeat(30), time: String(i) })) })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(url)
  await page.locator('summary').focus()
  await page.keyboard.press('Enter')
  assert.notEqual(await page.locator('details').getAttribute('open'), null)
  assert.equal(await page.locator('.status-timeline li').count(), 21)
  assert.equal((await measure()).overflow, 0)
  await page.locator('.status-actions a').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, 'mobile-long-details-bottom.png') })
  await page.locator('.status-actions a').click()
  await page.waitForURL('**/login?loginType=internal')
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('account-status-route')), false)
  // Actual storage event updates an already-open progress page; focus refresh does too.
  await seed(row)
  await page.goto(url)
  const writer = await context.newPage()
  await writer.goto(base + '/login')
  await writer.evaluate(({ key, row }) => localStorage.setItem(key, JSON.stringify([{ ...row, statusKey: 'done', nodeType: 'done', status: '已完成' }])), { key, row })
  await page.getByRole('heading', { name: '账号已启用', exact: true }).waitFor()
  await writer.close()
  await seed({ ...row, status: '已驳回', statusKey: 'rejected', nodeType: 'rework' })
  await page.evaluate(() => dispatchEvent(new Event('focus')))
  await page.getByRole('heading', { name: '账号启用申请已驳回', exact: true }).waitFor()
  await page.goto(url.replace(row.token, 'wrong-token'))
  await page.getByRole('heading', { name: '无法查询该申请进度', exact: true }).waitFor()
  assert.equal(await page.locator('.application-progress-summary').count(), 0)
  // Legacy create requests retain details rather than adopting enable-only semantics.
  await seed({ ...row, typeKey: 'create', type: '创建账号' })
  await page.goto(url)
  await page.getByRole('heading', { name: row.id, exact: true }).waitFor()
  assert.equal(await page.locator('details').count(), 0)
  await page.getByText('创建账号申请进度', { exact: true }).waitFor()
  await page.evaluate(key => localStorage.setItem(key, 'invalid-json'), key)
  await page.reload()
  await page.getByRole('heading', { name: '无法查询该申请进度', exact: true }).waitFor()
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'passed', measurements, reference, screenshots: output, errors }, null, 2))
} finally { await browser.close() }
