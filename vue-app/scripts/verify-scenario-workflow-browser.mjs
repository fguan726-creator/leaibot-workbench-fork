import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const origin = process.env.SCENARIO_QA_ORIGIN || 'http://127.0.0.1:19464'
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/)
const output = process.env.SCENARIO_QA_OUTPUT || path.join(os.tmpdir(), 'scenario-workflow-qa')
mkdirSync(output, { recursive: true })
const report = { cases: [], errors: [], unexpectedRequests: [], geometry: [], passed: false }
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, serviceWorkers: 'block' })
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
      report.unexpectedRequests.push({ url: request.url(), method: request.method() })
      return route.abort()
    }
    if (url.pathname.startsWith('/api/')) {
      const body = url.pathname === '/api/admin/me' ? { admin: { username: 'workflow-browser-qa' } }
        : url.pathname === '/api/harness/menu' ? { permissions: ['*'], menus: ['dashboard'] } : {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    }
    return route.continue()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(12000)
  page.on('pageerror', error => report.errors.push(error.message))
  await page.goto(origin + '/admin-vue/agent/scenario-package-create', { waitUntil: 'domcontentloaded' })
  const create = page.locator('.scenario-package-create')
  await create.waitFor()
  const requirement = create.getByLabel('执行前需要确认', { exact: true })
  assert.equal(await requirement.count(), 1)
  assert.equal(await requirement.isChecked(), false)
  await requirement.check()
  await create.getByRole('textbox', { name: /技能包名称/ }).fill('工作流浏览器验收')
  await page.screenshot({ path: path.join(output, '01-definition.png'), fullPage: true })
  const next = create.getByRole('button', { name: '下一步', exact: true })
  await next.click()
  const composer = create.locator('.scenario-composer')
  const ids = ['workplace-segment-operations', 'employee-certification-insight']
  const search = composer.getByRole('searchbox', { name: '搜索 Skill' })
  for (const id of ids) {
    await search.fill(id)
    await composer.locator(`[data-skill-id="${id}"] button`).click()
  }
  await composer.getByRole('button', { name: '整理布局', exact: true }).click()
  await composer.getByRole('button', { name: '适应', exact: true }).click()
  await composer.locator(`[data-output-port="${ids[0]}"]`).click()
  await composer.locator(`[data-input-port="${ids[1]}"]`).click()
  assert.equal(await composer.locator('[data-edge-id]').count(), 1)
  for (const id of ids) {
    await composer.locator(`[data-step-id="${id}"] .composer-node-select`).click()
    assert.equal(await composer.getByLabel('执行前需要确认').count(), 0)
  }
  report.cases.push('First step has one workflow checkbox; both node inspectors have none')
  await page.screenshot({ path: path.join(output, '02-composition.png'), fullPage: true })
  await next.click()
  const status = create.locator('[data-trial-status]')
  await status.filter({ hasText: '本轮存在错误' }).waitFor()
  assert.equal(await create.locator('[data-node-confirm]').count(), 0)
  await create.locator('[data-workflow-confirm]').click()
  await status.filter({ hasText: '所有执行节点均无错误' }).waitFor()
  report.cases.push('Entering trial runs automatically; missing workflow confirmation blocks; one confirmation completes the chain')
  await page.screenshot({ path: path.join(output, '03-workflow-confirmed.png'), fullPage: true })
  await create.getByRole('tab', { name: '1. 场景定义', exact: true }).click()
  await create.getByRole('textbox', { name: /场景描述/ }).fill('分析本月认证人群并汇总经营机会，仅分析当前授权数据。')
  await next.click()
  await next.click()
  await status.filter({ hasText: '本轮存在错误' }).waitFor()
  await create.locator('[data-workflow-confirm]').waitFor()
  report.cases.push('Changing the scenario scope clears the previous workflow confirmation')
  await create.getByRole('tab', { name: '1. 场景定义', exact: true }).click()
  await requirement.uncheck()
  await create.getByRole('button', { name: '保存草稿', exact: true }).click()
  await page.waitForURL('**/agent/skills?**')
  const row = page.locator('tr').filter({ hasText: '工作流浏览器验收' })
  await row.getByRole('button', { name: '编辑', exact: true }).click()
  await create.waitFor()
  assert.equal(await requirement.isChecked(), false)
  await page.reload()
  await create.waitFor()
  assert.equal(await requirement.isChecked(), false)
  report.cases.push('Explicitly clearing the workflow requirement persists through save, edit and reload')

  // A new untouched scenario must retain the initial incomplete-data demonstration.
  await page.goto(origin + '/admin-vue/agent/scenario-package-create')
  await create.waitFor()
  await next.click()
  for (const id of ids) {
    await search.fill(id)
    await composer.locator(`[data-skill-id="${id}"] button`).click()
  }
  await composer.getByRole('button', { name: '整理布局', exact: true }).click()
  await composer.getByRole('button', { name: '适应', exact: true }).click()
  await composer.locator(`[data-output-port="${ids[0]}"]`).click()
  await composer.locator(`[data-input-port="${ids[1]}"]`).click()
  await next.click()
  await status.filter({ hasText: '本轮存在错误' }).waitFor()
  await page.screenshot({ path: path.join(output, '04-first-trial-error.png'), fullPage: true })
  await create.getByRole('button', { name: '返回编排', exact: true }).click()
  await next.click()
  await status.filter({ hasText: '所有执行节点均无错误' }).waitFor()
  report.cases.push('Initial mock failure -> return to composition -> next automatically creates a successful retry report')
  await page.screenshot({ path: path.join(output, '05-return-retry-success.png'), fullPage: true })
  for (const width of [1600, 1280]) {
    await page.setViewportSize({ width, height: 1000 })
    await create.getByRole('tab', { name: '1. 场景定义', exact: true }).click()
    const geometry = await create.evaluate(node => ({
      viewport: window.innerWidth, contentInnerWidth: node.clientWidth,
      overflow: node.scrollWidth - node.clientWidth,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }))
    report.geometry.push(geometry)
    assert.equal(geometry.overflow, 0)
    assert.equal(geometry.documentOverflow, 0)
    await page.screenshot({ path: path.join(output, `06-definition-${width}.png`), fullPage: true })
  }
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.unexpectedRequests, [])
  report.passed = true
} finally {
  await browser.close()
  writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
