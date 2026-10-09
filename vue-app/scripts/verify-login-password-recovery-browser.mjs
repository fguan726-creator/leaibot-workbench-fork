import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  const requests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().includes('/password-recovery/')) requests.push(request.url()) })
  for (const loginType of ['internal', 'external']) {
    await page.goto(base + '/login?loginType=' + loginType)
    await page.locator('#login-screen').waitFor()
    assert.equal(await page.getByRole('button', { name: '忘记密码', exact: true }).count(), 0)
    assert.equal(await page.getByRole('dialog', { name: '找回密码', exact: true }).count(), 0)
    assert.equal(await page.getByRole('button', { name: '申请启用账号', exact: true }).count(), 0)
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(requests, [])
  console.log('Oct 9 confirmed boundary: neither login tab exposes self-service password management; no recovery requests.')
} finally { await browser.close() }
