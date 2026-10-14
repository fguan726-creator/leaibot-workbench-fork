import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const origin = process.env.SCENARIO_QA_ORIGIN || 'http://127.0.0.1:19466'
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/)
const output = process.env.SCENARIO_QA_OUTPUT || path.join(os.tmpdir(), 'scenario-no-degraded-qa')
mkdirSync(output, { recursive: true })
const report = { cases: [], errors: [], unexpectedRequests: [], geometry: [], passed: false }
const storageKey = 'leai_scenario_skill_packages_v1'
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
      const body = url.pathname === '/api/admin/me' ? { admin: { username: 'scenario-status-browser-qa' } }
        : url.pathname === '/api/harness/menu' ? { permissions: ['*'], menus: ['dashboard'] } : {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    }
    return route.continue()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(12000)
  page.on('pageerror', error => report.errors.push(error.message))
  await page.goto(origin + '/admin-vue/agent/skills?tab=packages', { waitUntil: 'domcontentloaded' })
  const packages = page.locator('#skill-hub-panel-packages')
  await packages.waitFor({ state: 'visible' })
  const cards = packages.locator('.scenario-package-stat')
  const rows = packages.locator('.scenario-package-row')
  assert.equal(await cards.count(), 5)
  assert.doesNotMatch(await packages.innerText(), /降级/)
  assert.equal(await packages.locator('option[value="degraded"]').count(), 0)
  for (const id of ['seed-scenario-degraded', 'seed-scenario-paused']) {
    const target = packages.locator(`[data-package-id="${id}"]`)
    assert.equal(await target.count(), 1, `Keep existing package ${id}`)
    assert.equal((await target.locator('.scenario-package-status').innerText()).trim(), '已暂停')
  }
  report.cases.push('Five scenario summary cards; no degraded filter or label; both existing unavailable-dependency packages remain paused')

  await cards.filter({ hasText: '已暂停' }).click()
  assert.equal(await rows.count(), 2)
  assert.deepEqual((await rows.evaluateAll(nodes => nodes.map(node => node.dataset.packageId))).sort(), ['seed-scenario-degraded', 'seed-scenario-paused'])
  assert.equal(Number(await cards.filter({ hasText: '已暂停' }).locator('strong').innerText()), 2)
  await packages.getByRole('button', { name: '重置', exact: true }).click()
  await packages.getByRole('combobox', { name: '场景技能包状态', exact: true }).selectOption('paused')
  assert.equal(await rows.count(), 2)
  report.cases.push('Paused summary and select filter both include optional and required unavailable dependencies')

  await packages.locator('[data-package-id="seed-scenario-degraded"]').getByRole('button', { name: '详情', exact: true }).click()
  const detail = page.locator('.scenario-package-detail-panel')
  await detail.waitFor({ state: 'visible' })
  await detail.getByRole('heading', { name: /^依赖状态/ }).waitFor()
  assert.doesNotMatch(await detail.innerText(), /降级说明|降级运行|跳过.*继续/)
  assert.match(await detail.innerText(), /暂停/)
  await page.screenshot({ path: path.join(output, '01-optional-dependency-paused.png'), fullPage: true })
  await detail.getByRole('button', { name: '关闭场景技能包详情' }).click()

  // Initial examples stay in memory until the first edit. Persist via the real
  // editor before constructing an older stored record from its complete shape.
  await packages.getByRole('button', { name: '重置', exact: true }).click()
  const editablePackage = rows.filter({ has: page.getByRole('button', { name: '编辑', exact: true }) }).first()
  await editablePackage.getByRole('button', { name: '编辑', exact: true }).click()
  const create = page.locator('.scenario-package-create')
  await create.waitFor({ state: 'visible' })
  await create.getByRole('button', { name: '保存草稿', exact: true }).click()
  await packages.waitFor({ state: 'visible' })

  const expected = await page.evaluate(key => {
    const stored = JSON.parse(localStorage.getItem(key) || 'null')
    if (!stored?.packages) throw new Error('Scenario store did not persist its initial seed records')
    const source = stored.packages.find(item => item.id === 'seed-scenario-degraded')
    if (!source) throw new Error('Missing existing optional-dependency package')
    const legacy = structuredClone(source)
    legacy.id = 'browser-legacy-degraded'
    legacy.name = '保留用户配置的历史技能包'
    legacy.description = '这是历史用户维护的场景描述，刷新后必须完整保留。'
    legacy.version = 'v7.3.1'
    legacy.degradationNote = '历史说明：此条件分支不可用时降级运行，其余节点继续。'
    legacy.health = { status: 'degraded', explanations: [legacy.degradationNote], blockedStepIds: [], degradedStepIds: ['activity-weather'] }
    const auditEvent = { type: 'published', actorId: 'historical-browser-reviewer', at: '2026-10-01T03:04:05.000Z', note: '历史审核发布证据必须保留' }
    legacy.auditEvents = [...(legacy.auditEvents || []), auditEvent]
    if (legacy.publishedSnapshot) {
      legacy.publishedSnapshot.id = legacy.id
      legacy.publishedSnapshot.name = legacy.name
      legacy.publishedSnapshot.description = legacy.description
      legacy.publishedSnapshot.version = legacy.version
      legacy.publishedSnapshot.health = structuredClone(legacy.health)
      legacy.publishedSnapshot.degradationNote = legacy.degradationNote
      legacy.publishedSnapshot.auditEvents = structuredClone(legacy.auditEvents)
    }
    stored.packages.push(legacy)
    localStorage.setItem(key, JSON.stringify(stored))
    return legacy
  }, storageKey)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await packages.waitFor({ state: 'visible' })
  const legacyRow = packages.locator('[data-package-id="browser-legacy-degraded"]')
  await legacyRow.waitFor()
  assert.equal((await legacyRow.locator('.scenario-package-status').innerText()).trim(), '已暂停')
  assert.match(await legacyRow.innerText(), /保留用户配置的历史技能包/)
  assert.match(await legacyRow.innerText(), /v7\.3\.1/)
  await legacyRow.getByRole('button', { name: '详情', exact: true }).click()
  await detail.waitFor({ state: 'visible' })
  assert.match(await detail.innerText(), /这是历史用户维护的场景描述，刷新后必须完整保留。/)
  assert.match(await detail.innerText(), /historical-browser-reviewer/)
  assert.match(await detail.innerText(), /历史审核发布证据必须保留/)
  assert.doesNotMatch(await detail.innerText(), /历史说明：|降级说明|降级运行/)
  await detail.getByRole('heading', { name: /^依赖状态/ }).waitFor()
  const persisted = await page.evaluate(({ key, id }) => JSON.parse(localStorage.getItem(key)).packages.find(item => item.id === id), { key: storageKey, id: expected.id })
  for (const field of ['id', 'name', 'description', 'version', 'ownerId', 'auditEvents', 'publishedSnapshot']) assert.deepEqual(persisted[field], expected[field], `Reading old health must not replace user ${field}`)
  report.cases.push('Historical degraded browser record loads as paused without losing user content, version, owner, audit history or published snapshot; stale degradation note is hidden')
  await page.screenshot({ path: path.join(output, '02-legacy-user-record.png'), fullPage: true })
  await detail.getByRole('button', { name: '关闭场景技能包详情' }).click()

  for (const width of [1600, 1280]) {
    await page.setViewportSize({ width, height: 1000 })
    // The shared sidebar collapses responsively with a brief width transition.
    await page.waitForTimeout(300)
    await packages.getByRole('button', { name: '重置', exact: true }).click()
    await page.locator('#page-content').evaluate(node => node.scrollTo({ top: 0 }))
    const geometry = await packages.evaluate(node => {
      const summary = node.querySelector('.scenario-package-summary')
      const summaryCards = [...summary.querySelectorAll('.scenario-package-stat')]
      const boxes = summaryCards.map(card => { const { x, y, width, height } = card.getBoundingClientRect(); return { x, y, width, height } })
      return { viewport: window.innerWidth, contentInnerWidth: node.clientWidth, overflow: node.scrollWidth - node.clientWidth, documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, summaryOverflow: summary.scrollWidth - summary.clientWidth, columns: getComputedStyle(summary).gridTemplateColumns, cards: boxes }
    })
    report.geometry.push(geometry)
    assert.equal(geometry.overflow, 0)
    assert.equal(geometry.documentOverflow, 0)
    assert.equal(geometry.summaryOverflow, 0)
    assert.equal(geometry.cards.length, 5)
    if (width === 1600) assert.equal(geometry.columns.split(/\s+/).length, 5, 'Five cards must use five desktop tracks without an empty sixth track')
    assert.ok(geometry.cards.every(card => card.width > 0 && card.height > 0 && card.x >= 0 && card.x + card.width <= width))
    await page.screenshot({ path: path.join(output, `03-package-list-${width}.png`), fullPage: true })
  }
  report.cases.push('All five summary cards remain reachable and no page overflow at 1600 and 1280 widths')

  await page.locator('#skill-hub-tab-skills').click()
  const skills = page.locator('#skill-hub-panel-skills')
  await skills.waitFor({ state: 'visible' })
  assert.equal(await skills.locator('.skill-hub-stat').count(), 6, 'Ordinary Skill summaries must remain unchanged')
  const evaluation = skills.getByRole('button', { name: '评估', exact: true }).first()
  await evaluation.waitFor({ state: 'visible' })
  assert.equal(await evaluation.isEnabled(), true)
  await evaluation.click()
  const evaluationDialog = page.getByRole('dialog', { name: 'Skill 评估', exact: true })
  await evaluationDialog.waitFor({ state: 'visible' })
  await page.screenshot({ path: path.join(output, '04-ordinary-skill-evaluation.png'), fullPage: true })
  report.cases.push('Ordinary Skill tab retains six summary cards and its evaluation dialog opens')
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.unexpectedRequests, [])
  report.passed = true
} catch (error) {
  report.failure = error instanceof Error ? error.message : String(error)
  throw error
} finally {
  await browser.close()
  writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
