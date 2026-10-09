import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const output = path.join(os.tmpdir(), 'account-enable-shared-qa')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const measurements = []
const key = 'leaibot-account-request-status-rows'
async function setup(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport })
  context.setDefaultTimeout(15000)
  await context.route('**/api/admin/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
  return { context, page: await context.newPage() }
}
async function loginDisabled(page) {
  await page.goto(base + '/login?loginType=external')
  await page.getByLabel('用户名', { exact: true }).fill('external-disabled')
  await page.getByLabel('密码', { exact: true }).fill('Poc123456!')
  await page.getByRole('button', { name: '登录工作台', exact: true }).click()
  await page.getByRole('button', { name: '申请启用账号', exact: true }).click()
  await page.locator('.account-enable-flow').waitFor()
}
async function geometry(page, label) {
  // The existing desktop workspace may scroll vertically at short viewport heights.
  await page.locator('.enable-actions').scrollIntoViewIfNeeded()
  const measurement = await page.locator('.account-enable-flow').evaluate(el => {
    const footer = el.querySelector('.enable-actions').getBoundingClientRect()
    return { width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, footerBottom: footer.bottom, footerRight: footer.right }
  })
  assert.ok(measurement.overflow <= 1, label + ': ' + JSON.stringify(measurement))
  assert.ok(measurement.footerBottom <= measurement.height + 1 && measurement.footerRight <= measurement.width + 1, label)
  measurements.push({ label, ...measurement })
  await page.screenshot({ path: path.join(output, label + '.png'), fullPage: true })
}
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const { context, page } = await setup(viewport)
    await loginDisabled(page)
    const flow = page.locator('.account-enable-flow')
    assert.equal(await flow.getByLabel('被申请人用户名', { exact: true }).inputValue(), 'external-disabled')
    assert.equal(await flow.getByLabel('被申请人用户名', { exact: true }).getAttribute('readonly'), '')
    assert.equal(await flow.getByRole('radio').first().isDisabled(), true)
    assert.equal(await flow.locator('[data-info-field="mobile"], [data-info-field="email"]').count(), 0)
    assert.equal(await flow.getByRole('button', { name: /审批执行/ }).isDisabled(), true)
    await flow.getByRole('button', { name: '下一步', exact: true }).click()
    await flow.getByText('请填写申请原因。', { exact: true }).waitFor()
    await flow.getByText('请填写负责对接的内部员工 ITCode。', { exact: true }).waitFor()
    await flow.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
    await flow.getByLabel('申请原因', { exact: true }).fill('恢复使用，请启用账号。')
    await geometry(page, 'login-info-' + viewport.width)
    await flow.getByRole('button', { name: '下一步', exact: true }).click()
    await flow.getByText('系统管理员审批', { exact: true }).waitFor()
    assert.doesNotMatch(await flow.innerText(), /直线经理审批|业务负责人审批|关联人审批/)
    await geometry(page, 'login-review-' + viewport.width)
    await flow.getByRole('button', { name: '上一步', exact: true }).click()
    assert.equal(await flow.getByLabel('申请原因', { exact: true }).inputValue(), '恢复使用，请启用账号。')
    await context.close()
  }

  for (const personType of ['internal', 'external']) {
    const { context, page } = await setup({ width: 1280, height: 720 })
    await page.goto(base + '/agent/permissions?module=apply')
    await page.locator('.permission-type-grid button').filter({ hasText: '启用账号' }).click()
    await page.getByRole('button', { name: '下一步', exact: true }).click()
    const flow = page.locator('.account-enable-flow')
    await flow.waitFor()
    if (personType === 'external') {
      await flow.getByRole('radio', { name: /外部人员/ }).click()
      await flow.getByLabel('被申请人用户名', { exact: true }).fill('workbench-external')
      await flow.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
    } else {
      await flow.getByLabel('被申请人 ITCode', { exact: true }).fill('workbench-internal')
    }
    await flow.getByLabel('申请原因', { exact: true }).fill('系统内申请启用')
    await geometry(page, 'workbench-info-' + personType)
    await flow.getByRole('button', { name: '下一步', exact: true }).click()
    await geometry(page, 'workbench-review-' + personType)
    await flow.getByRole('button', { name: '提交申请', exact: true }).click()
    await flow.waitFor({ state: 'detached' })
    const rows = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
    assert.equal(rows.length, 1)
    assert.equal(rows[0].personType, personType)
    assert.equal(rows[0].applicantPersonType, 'internal')
    assert.equal(rows[0].nodeType, 'system-admin')
    assert.equal(rows[0].statusKey, 'pending')
    assert.equal(rows[0].relatedAccount, personType === 'external' ? 'wangxt8' : '')
    await context.close()
  }

  const { context, page } = await setup()
  await loginDisabled(page)
  await page.goto(base + '/account-enable-request?account=another-user&loginType=external')
  await page.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
  await page.getByLabel('申请原因', { exact: true }).fill('不应提交')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '请返回登录页重新验证账号状态' }).waitFor()
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null)
  await page.goto(base + '/account-enable-request?account=external-disabled&loginType=internal')
  await page.getByLabel('申请原因', { exact: true }).fill('不应更换人员类型')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '请返回登录页重新验证账号状态' }).waitFor()
  await page.goto(base + '/account-enable-request?account=external-disabled&loginType=external')
  await page.getByLabel('关联人 ITCode', { exact: true }).fill('wangxt8')
  await page.getByLabel('申请原因', { exact: true }).fill('保存失败后重试')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.restoreEnableStorage = () => { Storage.prototype.setItem = original }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'leaibot-account-request-status-rows') throw new Error('QA quota failure')
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: '申请暂时无法保存' }).waitFor()
  assert.equal(await page.evaluate(key => localStorage.getItem(key), key), null)
  assert.equal(await page.getByRole('button', { name: '提交申请', exact: true }).isEnabled(), true)
  await page.evaluate(() => window.restoreEnableStorage())
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.waitForURL('**/account-request/status?**')
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)
  assert.equal(saved[0].reason, '保存失败后重试')
  await context.close()
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'passed', measurements, screenshots: output, errors }, null, 2))
} finally { await browser.close() }
