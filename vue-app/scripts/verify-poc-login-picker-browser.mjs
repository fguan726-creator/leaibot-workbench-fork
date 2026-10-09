import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { loadEnv } from 'vite'

const require = createRequire(import.meta.url)
let playwright
for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { playwright = require(candidate); break } catch {}
}
if (!playwright) throw new Error('Playwright is required')
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const output = path.join(os.tmpdir(), 'poc-login-picker-qa')
mkdirSync(output, { recursive: true })
const browser = await playwright.chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
context.setDefaultTimeout(12000)
const page = await context.newPage()
const errors = []
context.on('page', (tab) => tab.on('pageerror', (error) => errors.push(error.message)))
page.on('pageerror', (error) => errors.push(error.message))
const requests = []
context.on('request', (request) => {
  if (request.url().includes('/api/admin/login')) requests.push(request)
})
const key = 'leaibot-account-request-status-rows'
const password = 'Poc123456!'
const localAdminPassword = loadEnv('development', process.cwd(), 'LOCAL_POC_').LOCAL_POC_ADMIN_PASSWORD
const expectedOptionCount = localAdminPassword ? 6 : 5
const accounts = [
  ['noaccess', 'internal', false],
  ['guest01', 'internal', false],
  ['internal-disabled', 'internal', true],
  ['external-noaccess', 'external', false],
  ['external-disabled', 'external', true]
]
let server
async function choose(account, from = '/login?loginType=external') {
  await page.goto(base + from)
  const saved = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))
  const beforeRequests = requests.length
  await page.getByRole('combobox').click()
  assert.equal(await page.getByRole('option').count(), expectedOptionCount)
  await page.getByRole('option').filter({ has: page.locator('small', { hasText: new RegExp('^' + account + '$') }) }).click()
  const internal = accounts.find((row) => row[0] === account)[1] === 'internal'
  await page.waitForURL(internal ? '**/adfs-login?**' : '**/login?**')
  assert.equal(await page.getByRole('combobox').inputValue(), account)
  assert.equal(await page.locator('input[type=password]').inputValue(), password)
  assert.equal(await page.locator('input[type=password]').getAttribute('type'), 'password')
  assert.equal(requests.length, beforeRequests, 'Selection must not submit login')
  assert.equal(await page.getByRole('option').count(), 0)
  assert.deepEqual(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), saved, 'Selection must not reset or persist state')
  assert.ok(!page.url().includes(password))
}
async function submit(type) {
  await page.getByRole('button', { name: type === 'internal' ? 'Submit' : '登录工作台', exact: true }).click()
}
async function assertNoAccess(account, type) {
  await page.waitForURL('**/access-denied?**')
  assert.equal(new URL(page.url()).searchParams.get('userType'), type)
  const expectedTitle = account === 'noaccess'
    ? '当前账号暂无工作台权限，请申请访问权限。'
    : '当前账号因为长时间未登录，权限已被移除，请重新申请'
  await page.getByRole('heading', { name: expectedTitle, exact: true }).waitFor()
  assert.equal(await page.getByLabel('申请人 ITCode').inputValue(), account)
  assert.equal(await page.getByPlaceholder('请输入关联人 ITCode').count(), type === 'external' ? 1 : 0)
}
try {
  for (const [account, type, disabled] of accounts) {
    await choose(account)
    await submit(type)
    if (disabled) {
      await page.getByText('当前账号已禁用，请申请启用后再登录。', { exact: true }).waitFor()
      await page.getByRole('button', { name: '申请启用账号', exact: true }).click()
      await page.waitForURL('**/account-enable-request?**')
      assert.equal(new URL(page.url()).searchParams.get('loginType'), type)
      await page.getByRole('button', { name: '下一步', exact: true }).waitFor()
    } else await assertNoAccess(account, type)
    console.log(account + ': expected login flow passed')
  }
  assert.equal(requests.length, 0, 'Fixtures must not hit production login')
  await choose('guest01', '/login')
  await choose('external-noaccess', '/adfs-login')
  await choose('external-disabled')
  const done = { id: 'QA-ENABLE', typeKey: 'enable', targetItcode: 'internal-disabled', statusKey: 'done', nodeType: 'done' }
  await page.evaluate(({ key, done }) => localStorage.setItem(key, JSON.stringify([done])), { key, done })
  await choose('internal-disabled')
  await submit('internal')
  await assertNoAccess('internal-disabled', 'internal')

  // Keyboard selection must not submit, Escape/Tab/outside must dismiss.
  await page.goto(base + '/login?loginType=external')
  let combo = page.getByRole('combobox')
  await combo.focus()
  await combo.press('ArrowUp')
  if (localAdminPassword) await combo.press('ArrowUp')
  await combo.press('Enter')
  assert.equal(await combo.inputValue(), 'external-disabled')
  assert.equal(await page.locator('input[type=password]').inputValue(), password)
  assert.equal(await page.getByRole('button', { name: '申请启用账号', exact: true }).count(), 0)
  await combo.click()
  await combo.press('Escape')
  assert.equal(await combo.getAttribute('aria-expanded'), 'false')
  await combo.click()
  await combo.press('Tab')
  assert.equal(await combo.getAttribute('aria-expanded'), 'false')
  await combo.click()
  await page.locator('.login-title').click()
  assert.equal(await combo.getAttribute('aria-expanded'), 'false')

  // Wrong password and type must not fall back to preview workspace.
  await choose('guest01')
  await page.locator('input[type=password]').fill('wrong')
  await submit('internal')
  await page.getByText('用户名或密码错误', { exact: true }).waitFor()
  await page.getByRole('combobox').fill('external-noaccess')
  await page.locator('input[type=password]').fill(password)
  await submit('internal')
  await page.getByText('该演示账号属于外部用户，请切换外部用户登录。', { exact: true }).waitFor()
  await page.goto(base + '/login?loginType=external')
  await page.getByRole('combobox').fill('noaccess')
  await page.locator('input[type=password]').fill(password)
  await submit('external')
  await page.getByText('该演示账号属于内部用户，请切换内部用户登录。', { exact: true }).waitFor()
  await page.evaluate((key) => localStorage.setItem(key, 'broken-json'), key)
  await choose('internal-disabled')
  await submit('internal')
  await page.getByText('演示账号状态读取失败，请检查浏览器存储后重试。', { exact: true }).waitFor()
  await page.evaluate((key) => localStorage.removeItem(key), key)

  // Ordinary account still uses server authentication, no real password is stored.
  await page.route('**/api/admin/login', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'QA server rejected' }) }))
  await page.goto(base + '/login?loginType=external')
  await page.getByRole('combobox').fill('ordinary-qa')
  await page.locator('input[type=password]').fill('not-a-real-password')
  await submit('external')
  await page.getByText('QA server rejected', { exact: true }).waitFor()
  assert.equal(requests.length, 1)
  await page.unroute('**/api/admin/login')

  if (localAdminPassword) {
    for (const from of ['/login', '/login?loginType=external', '/adfs-login']) {
      await page.goto(base + from)
      const before = requests.length
      const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: '管理员 · 正常登录 admin' }).click()
      await page.waitForURL((url) => url.pathname === '/admin-vue/login')
      assert.equal(await page.getByRole('combobox').inputValue(), 'admin')
      assert.ok(await page.locator('input[type=password]').inputValue() === localAdminPassword, 'Admin password is filled from local configuration')
      assert.equal(requests.length, before, 'Admin selection must not submit')
      assert.ok(!page.url().includes(localAdminPassword))
      assert.deepEqual(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })), storage)
    }
    await page.route('**/api/admin/login', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'QA admin rejected' }) }))
    await page.locator('input[type=password]').fill('wrong')
    await submit('external')
    await page.getByText('QA admin rejected', { exact: true }).waitFor()
    assert.equal(new URL(page.url()).pathname, '/admin-vue/login')
    await page.unroute('**/api/admin/login')
    await page.route('**/api/admin/login', (route) => route.abort('connectionrefused'))
    await submit('external')
    await page.getByText('登录服务暂不可用，请稍后重试', { exact: true }).waitFor()
    assert.equal(await page.evaluate(() => localStorage.getItem('preview_user')), null)
    await page.unroute('**/api/admin/login')

    // A separate context verifies real backend authentication without contaminating fixtures.
    const adminContext = await browser.newContext()
    try {
      const adminPage = await adminContext.newPage()
      await adminPage.goto(base + '/login?loginType=external')
      await adminPage.getByRole('combobox').click()
      await adminPage.getByRole('option', { name: '管理员 · 正常登录 admin' }).click()
      const response = adminPage.waitForResponse((res) => res.url().includes('/api/admin/login') && res.request().method() === 'POST')
      await adminPage.getByRole('button', { name: '登录工作台', exact: true }).click()
      assert.equal((await response).status(), 200, 'Configured local admin must authenticate against backend')
      await adminPage.waitForURL('**/portal/home')
      const me = await adminContext.request.get(new URL('/api/admin/me', base).href)
      assert.equal(me.status(), 200)
      assert.equal((await me.json()).admin?.username, 'admin')
    } finally { await adminContext.close() }
    console.log('Local admin: three entry points, backend authentication, failure isolation and no password persistence passed')
  }

  for (const width of [1440, 1280]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 720 })
    for (const route of ['/login?loginType=external', '/adfs-login']) {
      await page.goto(base + route)
      await page.getByRole('combobox').click()
      const geometry = await page.locator('.poc-account-popup').evaluate((el) => {
        const rect = el.getBoundingClientRect()
        return { left: rect.left, right: rect.right, bottom: rect.bottom, height: innerHeight, width: innerWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
      })
      assert.ok(geometry.left >= 0 && geometry.right <= geometry.width + 1 && geometry.bottom <= geometry.height + 1 && geometry.overflow <= 1, JSON.stringify(geometry))
      await page.screenshot({ path: path.join(output, (route.includes('adfs') ? 'internal-' : 'external-') + width + '.png') })
    }
  }
  console.log('Selection, keyboard, no auto-login, state retention, failure paths and desktop layout passed')

  // Independently start server-auth mode: query prefill and fixture bypass must be off.
  const port = Number(process.env.POC_SERVER_MODE_QA_PORT || 5189)
  const serverBase = 'http://127.0.0.1:' + port + '/admin-vue'
  let serverOutput = ''
  server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { env: { ...process.env, VITE_AUTH_MODE: 'server' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.on('data', (chunk) => { serverOutput += chunk })
  server.stderr.on('data', (chunk) => { serverOutput += chunk })
  const started = Date.now()
  while (true) {
    if (server.exitCode !== null) throw new Error(serverOutput)
    try { if ((await fetch(serverBase + '/login')).ok) break } catch {}
    if (Date.now() - started > 15000) throw new Error('Server mode did not start: ' + serverOutput)
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  const serverContext = await browser.newContext()
  const serverPage = await serverContext.newPage()
  const posted = []
  await serverPage.route('**/api/admin/login', (route) => {
    posted.push(route.request().postDataJSON().username)
    return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Server authentication required' }) })
  })
  for (const [account, type] of [...accounts, ['admin', 'external']]) {
    await serverPage.goto(serverBase + (type === 'internal' ? '/adfs-login' : '/login?loginType=external') + (type === 'internal' ? '?' : '&') + 'pocAccount=' + account)
    assert.equal(await serverPage.locator('.poc-account-picker').count(), 0)
    const input = serverPage.getByLabel(type === 'internal' ? 'ITCode' : '用户名', { exact: true })
    assert.equal(await input.inputValue(), '')
    assert.equal(await serverPage.locator('input[type=password]').inputValue(), '')
    await input.fill(account)
    await serverPage.locator('input[type=password]').fill(password)
    await serverPage.getByRole('button', { name: type === 'internal' ? 'Submit' : '登录工作台', exact: true }).click()
    await serverPage.getByText('Server authentication required', { exact: true }).waitFor()
  }
  assert.deepEqual(posted, [...accounts.map((row) => row[0]), 'admin'])
  await serverContext.close()
  assert.deepEqual(errors, [])
  console.log('Server mode: no picker, no autofill, all five fixtures and admin authenticated by backend. Screenshots: ' + output)
} finally {
  if (server) server.kill()
  await context.close()
  await browser.close()
}
