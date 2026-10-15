import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const origin = process.env.SCENARIO_QA_ORIGIN
assert.match(origin || '', /^http:\/\/(127\.0\.0\.1|localhost):\d+$/, 'Only an explicit localhost test origin is allowed')
const output = process.env.SCENARIO_QA_OUTPUT || path.join(os.tmpdir(), 'scenario-catalog-retry-browser')
const phase = process.env.SCENARIO_CATALOG_QA_PHASE || 'all'
assert.ok(['all', 'red'].includes(phase))
mkdirSync(output, { recursive: true })
const ids = ['capability-update-failure-demo', 'employee-certification-insight']
const report = { origin, phase, passed: false, cases: [], checks: [], runs: [], errors: [], consoleErrors: [], apiRequests: [], unexpectedRequests: [] }
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
let page
const check = (name, value, detail) => report.checks.push({ name, passed: Boolean(value), ...(detail === undefined ? {} : { detail }) })

async function createFromCatalog(name, confirmation = false) {
  await page.goto(origin + '/admin-vue/agent/scenario-package-create', { waitUntil: 'domcontentloaded' })
  const create = page.locator('.scenario-package-create')
  await create.waitFor()
  const checkbox = create.getByLabel('执行前需要确认', { exact: true })
  assert.equal(await checkbox.count(), 1)
  assert.equal(await checkbox.isChecked(), false)
  if (confirmation) await checkbox.check()
  await create.getByRole('textbox', { name: /技能包名称/ }).fill(name)
  await create.getByRole('button', { name: '下一步', exact: true }).click()
  const composer = create.locator('.scenario-composer')
  await composer.waitFor()
  // Reproduce the ordinary user path: add the unfiltered real catalog's first row.
  // No store imports, storage fixtures, manually supplied sample outputs or seed packages.
  const first = composer.locator('[data-skill-id]:visible').first()
  assert.equal(await first.getAttribute('data-skill-id'), ids[0])
  assert.match(await first.innerText(), /运营查询（更新失败示例）/)
  assert.match(await first.innerText(), /v1\.0\.0/)
  await first.getByRole('button').click()
  await composer.getByRole('searchbox', { name: '搜索 Skill' }).fill(ids[1])
  const second = composer.locator(`[data-skill-id="${ids[1]}"]`)
  assert.match(await second.innerText(), /v1\.0\.0/)
  await second.getByRole('button').click()
  await composer.getByRole('button', { name: '整理布局', exact: true }).click()
  await composer.getByRole('button', { name: '适应', exact: true }).click()
  await composer.locator(`[data-output-port="${ids[0]}"]`).click()
  await composer.locator(`[data-input-port="${ids[1]}"]`).click()
  assert.equal(await composer.locator('[data-edge-id]').count(), 1)
  for (const id of ids) {
    await composer.locator(`[data-step-id="${id}"] .composer-node-select`).click()
    assert.equal(await composer.getByLabel('执行前需要确认', { exact: true }).count(), 0)
  }
  await page.screenshot({ path: path.join(output, `${name}-composition.png`), fullPage: true })
  await create.getByRole('button', { name: '下一步', exact: true }).click()
  await waitForTrial()
  return create
}

async function waitForTrial() {
  await page.locator('#scenario-package-panel-3').waitFor({ state: 'visible' })
  await page.waitForFunction(() => {
    const panel = document.querySelector('#scenario-package-panel-3')
    const run = document.querySelector('#scenario-trial-fixed-heading [data-trial-run]')
    return run && !run.disabled && run.textContent.trim() === '重新试运行' && panel.querySelector('[data-trial-status]')
  })
}

async function snapshot(name) {
  const panel = page.locator('#scenario-package-panel-3')
  const result = { name, status: await panel.locator('[data-trial-status]').innerText(), nodes: [], nextEnabled: await page.locator('.scenario-package-actions').getByRole('button', { name: '下一步', exact: true }).isEnabled() }
  for (const id of ids) {
    const node = panel.locator(`[data-test-node="${id}"]`)
    await node.locator('[data-node-select]').click()
    const detail = panel.locator(`[data-selected-node="${id}"]`)
    const errors = detail.locator('[data-node-error]')
    result.nodes.push({ id, status: await node.locator('.test-report-status').innerText(),
      feedback: await detail.getByRole('region', { name: '本轮反馈', exact: true }).innerText(),
      input: await detail.getByRole('region', { name: '收到的输入', exact: true }).innerText(),
      error: await errors.count() ? await errors.innerText() : '',
      downstream: await detail.getByRole('region', { name: '直接下游接收结果', exact: true }).innerText() })
  }
  report.runs.push(result)
  await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true })
  return result
}

function firstRunChecks(run) {
  check(`${run.name}: first catalog node succeeds`, run.nodes[0].status === '本轮无错误' && !run.nodes[0].error, run.nodes[0])
  check(`${run.name}: first node has actual labelled mock feedback`, /模拟/.test(run.nodes[0].feedback) && !/未生成输出/.test(run.nodes[0].feedback))
  check(`${run.name}: second node retains intentional first-run failure`, run.nodes[1].status === '试运行报错' && /缺少已认证和待补充材料的人数分类/.test(run.nodes[1].error) && /模拟样例：职场 A 共有 3 名员工。/.test(run.nodes[1].feedback) && !/上游.*尚未完成|没有本地样例/.test(run.nodes[1].error), run.nodes[1])
  check(`${run.name}: initial failure prevents submission`, !run.nextEnabled)
}

function successfulRetryChecks(run, first) {
  check(`${run.name}: rerun completes both nodes`, run.nodes.every(node => node.status === '本轮无错误' && !node.error), run.nodes)
  check(`${run.name}: complete report enables next step`, /所有执行节点均无错误/.test(run.status) && run.nextEnabled, run.status)
  check(`${run.name}: retry replaces incomplete second feedback`, run.nodes[1].feedback !== first.nodes[1].feedback && /模拟样例/.test(run.nodes[1].feedback) && !/未生成输出/.test(run.nodes[1].feedback))
  const upstreamOutput = run.nodes[0].feedback.replace(/^本轮反馈\s*/, '').trim()
  check(`${run.name}: second node actually receives the first node output`, Boolean(upstreamOutput) && run.nodes[1].input.includes(upstreamOutput))
  check(`${run.name}: upstream transfer is received`, /已接收/.test(run.nodes[0].downstream) && !/未接收/.test(run.nodes[0].downstream))
}

async function reachSubmission(name) {
  const next = page.locator('.scenario-package-actions').getByRole('button', { name: '下一步', exact: true })
  if (!await next.isEnabled()) { check(`${name}: reaches submission review`, false, 'Next remains disabled'); return }
  await next.click()
  const submitPanel = page.locator('#scenario-package-panel-4')
  await submitPanel.waitFor({ state: 'visible' })
  check(`${name}: reaches submission review`, /允许提交审核/.test(await submitPanel.innerText()))
  check(`${name}: submission action enabled`, await page.locator('.scenario-package-actions').getByRole('button', { name: '提交审核', exact: true }).isEnabled())
  check(`${name}: submission still does not grant runtime permission`, /提交审核不会授予运行权限/.test(await submitPanel.innerText()))
  await page.screenshot({ path: path.join(output, name + '-submission-ready.png'), fullPage: true })
}

try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
  context.setDefaultTimeout(15000)
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
      report.unexpectedRequests.push({ url: request.url(), method: request.method() }); return route.abort()
    }
    if (url.pathname.startsWith('/api/')) {
      if (!['/api/admin/me', '/api/harness/menu'].includes(url.pathname)) {
        report.unexpectedRequests.push({ url: request.url(), method: request.method() }); return route.abort()
      }
      report.apiRequests.push({ path: url.pathname, method: request.method(), mocked: true })
      const body = url.pathname === '/api/admin/me' ? { admin: { username: 'catalog-retry-browser-qa' } } : { permissions: ['*'], menus: ['dashboard'] }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    }
    return route.continue()
  })
  page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()) })
  const create = await createFromCatalog('目录首项直接重试')
  const first = await snapshot('01-direct-initial')
  firstRunChecks(first)
  await create.locator('[data-trial-run]:visible').click()
  await waitForTrial()
  const retry = await snapshot('02-direct-retry')
  successfulRetryChecks(retry, first)
  await reachSubmission('direct-retry')
  report.cases.push('Real catalog first item -> certification node: initial demonstration failure, direct retry, submission readiness')

  if (phase === 'all') {
    await createFromCatalog('目录首项返回编排重试')
    const initial = await snapshot('03-return-initial')
    firstRunChecks(initial)
    await create.getByRole('button', { name: '返回编排', exact: true }).click()
    await create.locator('.scenario-composer').waitFor({ state: 'visible' })
    assert.equal(await create.locator('[data-edge-id]').count(), 1)
    await create.getByRole('button', { name: '下一步', exact: true }).click()
    await waitForTrial()
    const returned = await snapshot('04-return-next-retry')
    successfulRetryChecks(returned, initial)
    await reachSubmission('return-next-retry')
    report.cases.push('A separate new composition repeats the intentional initial failure; return to composition -> next performs a successful rerun and enables review submission')

    await createFromCatalog('目录首项整体确认', true)
    const unconfirmed = await snapshot('05-workflow-unconfirmed')
    check('Workflow confirmation blocks every node without output', unconfirmed.nodes.every(node => node.status === '试运行报错' && /整个工作流.*确认/.test(node.error) && /未生成输出/.test(node.feedback)))
    check('Unconfirmed workflow cannot submit', !unconfirmed.nextEnabled)
    assert.equal(await create.locator('[data-node-confirm]').count(), 0)
    await create.locator('[data-workflow-confirm]:visible').click()
    await waitForTrial()
    const confirmed = await snapshot('06-workflow-confirmed-retry')
    successfulRetryChecks(confirmed, unconfirmed)
    await reachSubmission('confirmed-retry')
    await page.locator('#scenario-package-panel-4').getByText('本轮记录与测试设置', { exact: true }).click()
    check('Review presents the actual global confirmation', /已确认整个工作流/.test(await page.locator('#scenario-package-panel-4').innerText()))
    await create.getByRole('tab', { name: '1. 场景定义', exact: true }).click()
    await create.getByRole('textbox', { name: /场景描述/ }).fill('仅分析本周已授权职场记录，修改范围后必须重新确认。')
    await create.getByRole('button', { name: '下一步', exact: true }).click()
    await create.getByRole('button', { name: '下一步', exact: true }).click()
    await waitForTrial()
    const changed = await snapshot('07-changed-scope-unconfirmed')
    check('Changing workflow scope invalidates earlier confirmation', changed.nodes.every(node => /整个工作流.*确认/.test(node.error)) && !changed.nextEnabled)
    check('Changed scope asks for a fresh global confirmation', await create.locator('[data-workflow-confirm]:visible').count() === 1)
    report.cases.push('Global confirmation remains required for the whole workflow, is reported truthfully and expires on scope changes; no per-node confirmation is restored')
  }
  report.missingFixtureObserved = report.runs.some(run => run.nodes.some(node => /没有本地样例/.test(node.error)))
  check('No created package is persisted or submitted by the browser verification', await page.evaluate(() => localStorage.getItem('leai_scenario_skill_packages_v1')) === null)
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.consoleErrors, [])
  assert.deepEqual(report.unexpectedRequests, [])
  assert.ok(report.checks.every(item => item.passed), 'Catalog retry regression: ' + report.checks.filter(item => !item.passed).map(item => item.name).join('; '))
  report.passed = true
} catch (error) {
  report.failure = error.stack || String(error)
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
  report.limitations = ['All packages were composed through the real local UI catalog; no fixture or sample output was injected.', 'Only mocked auth GETs are allowed. No real business API, backend login, approval or deployment was performed.']
  writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}
