import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const origin = process.env.SCENARIO_QA_ORIGIN || 'http://127.0.0.1:19468'
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/)
const output = process.env.SCENARIO_QA_OUTPUT || path.join(os.tmpdir(), 'scenario-application-qa')
const focusedMissingTask = process.env.SCENARIO_QA_FOCUS === 'missing-task'
mkdirSync(output, { recursive: true })
const report = { origin, cases: [], errors: [], unexpectedRequests: [], apiRequests: [], geometry: [], passed: false }
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' })
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
      report.unexpectedRequests.push({ url: request.url(), method: request.method() })
      return route.abort()
    }
    if (url.pathname.startsWith('/api/')) {
      report.apiRequests.push({ path: url.pathname, method: request.method() })
      if (!['/api/admin/me', '/api/harness/menu'].includes(url.pathname)) {
        report.unexpectedRequests.push({ url: request.url(), method: request.method() })
        return route.abort()
      }
      const body = url.pathname === '/api/admin/me' ? { admin: { username: 'scenario-application-browser-qa' } }
        : { permissions: ['*'], menus: ['dashboard'] }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    }
    return route.continue()
  })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => report.errors.push(error.message))
  await page.goto(origin + '/admin-vue/agent/skills?tab=packages', { waitUntil: 'domcontentloaded' })
  const packages = page.locator('#skill-hub-panel-packages')
  const ai = page.locator('#ai-panel')
  const row = id => packages.locator(`[data-package-id="${id}"]`)
  const apply = id => row(id).getByRole('button', { name: '应用', exact: true })
  const assistant = () => ai.locator('.ai-msg.assistant').last()
  const packageStorage = () => page.evaluate(() => localStorage.getItem('leai_scenario_skill_packages_v1'))
  await packages.waitFor({ state: 'visible' })

  if (!focusedMissingTask) {
  for (const id of ['seed-scenario-own-pm-li-rejected', 'seed-scenario-degraded', 'seed-scenario-paused', 'seed-scenario-own-pm-li-disabled']) {
    assert.equal(await apply(id).count(), 1, `Each package exposes its application state: ${id}`)
    assert.equal(await apply(id).isDisabled(), true, `Unavailable package cannot apply: ${id}`)
    assert.ok((await apply(id).getAttribute('title'))?.trim(), `Unavailable package explains why: ${id}`)
  }
  assert.equal(await apply('seed-scenario-own-pm-li-published').isEnabled(), true)
  assert.equal(await apply('seed-workplace-certification-operations').isEnabled(), true)
  const originalSeedStorage = await packageStorage()
  for (const [id, status] of [['seed-scenario-own-pm-li-draft', '草稿'], ['seed-scenario-own-pm-li-review', '待审核']]) {
    assert.equal(await apply(id).isEnabled(), true, `Unpublished ${status} supports a local POC application`)
    await apply(id).click()
    await ai.waitFor({ state: 'visible' })
    const text = await assistant().innerText()
    assert.match(text, new RegExp(status))
    assert.match(text, /未审核|尚未审核|尚未通过审核/)
    assert.match(text, /当前/)
    assert.match(text, /POC 应用测试完成/)
    assert.match(text, /未调用真实 Skill 或业务接口/)
    assert.doesNotMatch(text, /应用测试未完成/)
    await page.screenshot({ path: path.join(output, `00-${id}-application.png`), fullPage: true })
  }
  assert.equal(await packageStorage(), originalSeedStorage, 'Applying unpublished seeds must not persist new package state')
  const runtimeGates = await page.evaluate(async () => {
    const { useScenarioSkillPackagesStore } = await import('/admin-vue/src/stores/scenarioSkillPackages.ts')
    const { evaluateRuntimeAccess } = await import('/admin-vue/src/domain/scenarioSkillPackages.js')
    return ['seed-scenario-own-pm-li-draft', 'seed-scenario-own-pm-li-review'].map(id => {
      const item = useScenarioSkillPackagesStore().findPackage(id)
      return { id, status: item.status, gate: evaluateRuntimeAccess(item, { id: 'scenario-application-browser-qa', permissions: ['*'] }) }
    })
  })
  assert.ok(runtimeGates.every(item => item.gate.status === 'blocked' && item.gate.explanations.some(reason => /尚未发布/.test(reason))))
  report.cases.push('Unpublished draft/review packages open the AI assistant for explicitly unreviewed current-revision POC tests without changing package storage; actual runtime remains blocked until publication')
  report.cases.push('Published and upgrade-needed packages remain available; unpublished rejected, paused and disabled packages remain disabled with reasons')

  await apply('seed-workplace-certification-operations').click()
  await ai.waitFor({ state: 'visible' })
  await assistant().filter({ hasText: /应用测试/ }).waitFor()
  const upgradeText = await assistant().innerText()
  assert.match(upgradeText, /模拟|POC/)
  assert.match(upgradeText, /未调用|未执行真实/)
  assert.match(upgradeText, /v1\.0\.0/)
  assert.match(upgradeText, /跳过|未命中|未激活/)
  assert.match(upgradeText, /POC 应用测试完成/)
  assert.doesNotMatch(upgradeText, /应用测试未完成/)
  await page.screenshot({ path: path.join(output, '01-upgrade-pinned-application.png'), fullPage: true })
  report.cases.push('Applying an upgrade-needed package opens the AI assistant with pinned-version local sample results and a normal unselected condition skip')

  // Construct complete historical records from the real in-memory seed shape.
  // These are isolated local fixtures; no backend package or account is changed.
  await page.evaluate(async () => {
    const { useScenarioSkillPackagesStore } = await import('/admin-vue/src/stores/scenarioSkillPackages.ts')
    const stored = JSON.parse(JSON.stringify(useScenarioSkillPackagesStore().packages))
    const source = stored.find(item => item.id === 'seed-scenario-own-pm-li-published')
    if (!source?.publishedSnapshot) throw new Error('Missing complete published source fixture')
    const cloneFor = (id, name) => {
      const item = structuredClone(source)
      item.id = id
      item.name = name
      item.publishedSnapshot.id = id
      item.publishedSnapshot.name = name
      return item
    }
    const confirmed = cloneFor('browser-scenario-confirm', '需整体确认的应用测试')
    confirmed.status = 'draft'
    confirmed.onlineStatus = 'unpublished'
    confirmed.requiresConfirmation = true
    delete confirmed.publishedSnapshot
    // A successful authoring trial must never count as this application's confirmation.
    for (const item of [confirmed]) {
      if (item.testRequest) item.testRequest.workflowConfirmed = true
      if (item.testReport) item.testReport.request.workflowConfirmed = true
    }
    const stale = cloneFor('browser-scenario-stale', '确认期间状态变化')
    stale.requiresConfirmation = stale.publishedSnapshot.requiresConfirmation = true
    const crossTab = cloneFor('browser-scenario-cross-tab', '跨标签确认状态变化')
    crossTab.requiresConfirmation = crossTab.publishedSnapshot.requiresConfirmation = true
    const revision = cloneFor('browser-scenario-revision', '未审核的新修订')
    revision.status = 'draft'
    revision.onlineStatus = 'published'
    revision.version = 'v9.0.0'
    revision.steps[0].name = '当前草稿专属节点'
    revision.steps[0].task = '仅在当前草稿中测试的新修订任务'
    revision.publishedSnapshot.name = '原已审核固定版本'
    if (revision.testReport) revision.testReport.nodes.forEach(node => { if (node.output) node.output = 'STALE_APPROVED_SAMPLE_DO_NOT_REUSE' })
    const reviewRevision = structuredClone(revision)
    reviewRevision.id = 'browser-scenario-review-revision'
    reviewRevision.name = '待审核的当前修订'
    reviewRevision.status = 'review'
    reviewRevision.version = 'v9.1.0'
    reviewRevision.steps[0].name = '当前待审核专属节点'
    reviewRevision.publishedSnapshot.id = reviewRevision.id
    const rejectedRevision = structuredClone(revision)
    rejectedRevision.id = 'browser-scenario-rejected-revision'
    rejectedRevision.name = '已驳回的新修订'
    rejectedRevision.status = 'rejected'
    rejectedRevision.publishedSnapshot.id = rejectedRevision.id
    const versionChange = structuredClone(revision)
    versionChange.id = 'browser-scenario-version-change'
    versionChange.name = '确认期间草稿版本变化'
    versionChange.requiresConfirmation = true
    versionChange.publishedSnapshot.id = versionChange.id
    const disabledDraft = structuredClone(revision)
    disabledDraft.id = 'browser-scenario-disabled-draft'
    disabledDraft.onlineStatus = 'disabled'
    disabledDraft.publishedSnapshot.id = disabledDraft.id
    const oldPausedDraft = structuredClone(revision)
    oldPausedDraft.id = 'browser-scenario-old-paused-draft'
    oldPausedDraft.publishedSnapshot.id = oldPausedDraft.id
    oldPausedDraft.publishedSnapshot.steps[0].dependencyState = 'expired'
    const pausedDraft = structuredClone(stored.find(item => item.id === 'seed-scenario-degraded'))
    pausedDraft.id = 'browser-scenario-paused-draft'
    pausedDraft.status = 'draft'
    pausedDraft.publishedSnapshot.id = pausedDraft.id
    const approval = cloneFor('browser-scenario-approval', '缺少独立节点审批')
    approval.steps[0].requiresApproval = approval.publishedSnapshot.steps[0].requiresApproval = true
    const fixtures = [confirmed, stale, crossTab, revision, reviewRevision, rejectedRevision, versionChange, disabledDraft, oldPausedDraft, pausedDraft, approval]
    localStorage.setItem('leai_scenario_skill_packages_v1', JSON.stringify({ schemaVersion: 2, packages: [...stored, ...fixtures], seededOwners: ['pm-li'] }))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await packages.waitFor({ state: 'visible' })
  assert.equal(await apply('browser-scenario-approval').isDisabled(), true)
  assert.match(await apply('browser-scenario-approval').getAttribute('title'), /审批/)
  assert.equal(await apply('browser-scenario-paused-draft').isDisabled(), true)
  const originalFixtureStorage = await packageStorage()
  for (const [id, title, version, node, status] of [
    ['browser-scenario-revision', '未审核的新修订', 'v9.0.0', '当前草稿专属节点', '草稿'],
    ['browser-scenario-review-revision', '待审核的当前修订', 'v9.1.0', '当前待审核专属节点', '待审核'],
    ['browser-scenario-disabled-draft', '未审核的新修订', 'v9.0.0', '当前草稿专属节点', '草稿'],
    ['browser-scenario-old-paused-draft', '未审核的新修订', 'v9.0.0', '当前草稿专属节点', '草稿']
  ]) {
    assert.equal(await apply(id).isEnabled(), true)
    await apply(id).click()
    const revisionText = await assistant().innerText()
    for (const value of [title, version, node, status]) assert.ok(revisionText.includes(value), `Current revision must be visible: ${value}`)
    assert.match(revisionText, /未审核|尚未审核|尚未通过审核/)
    assert.match(revisionText, /POC 应用测试完成/)
    assert.doesNotMatch(revisionText, /原已审核固定版本|STALE_APPROVED_SAMPLE_DO_NOT_REUSE|应用测试未完成/)
    await page.screenshot({ path: path.join(output, `01-${id}-current-revision.png`), fullPage: true })
  }
  assert.equal(await apply('browser-scenario-rejected-revision').isEnabled(), true)
  await apply('browser-scenario-rejected-revision').click()
  const rejectedText = await assistant().innerText()
  assert.match(rejectedText, /原已审核固定版本/)
  assert.doesNotMatch(rejectedText, /v9\.0\.0|当前草稿专属节点|已驳回的新修订/)
  assert.equal(await packageStorage(), originalFixtureStorage, 'Application must preserve current revisions, approval audit and snapshots byte-for-byte')
  report.cases.push('Draft and review revisions test current name/version/chain and reject stale report output, including when their older release is disabled or paused; current paused dependencies and missing node approvals stay blocked; rejected revisions retain old approved-version behavior')

  await ai.getByRole('button', { name: '新开会话', exact: true }).click()
  await apply('browser-scenario-confirm').click()
  const confirm = ai.getByRole('button', { name: '确认并应用测试', exact: true })
  await confirm.waitFor({ state: 'visible' })
  const beforeConfirm = await assistant().innerText()
  assert.match(beforeConfirm, /确认/)
  assert.doesNotMatch(beforeConfirm, /应用测试已完成|应用测试完成/)
  await page.screenshot({ path: path.join(output, '02-workflow-confirmation.png'), fullPage: true })
  await confirm.click()
  await assistant().filter({ hasText: /应用测试/ }).waitFor()
  assert.match(await assistant().innerText(), /POC 应用测试完成/)
  assert.doesNotMatch(await assistant().innerText(), /应用测试未完成/)
  assert.match(await assistant().innerText(), /未调用|未执行真实/)
  report.cases.push('Authoring trial evidence is not reused; explicit workflow confirmation produces local application results')
  assert.match(await assistant().innerText(), /草稿/)
  assert.match(await assistant().innerText(), /未审核|尚未审核|尚未通过审核/)
  assert.equal(await packageStorage(), originalFixtureStorage, 'Confirming a POC test must not approve, publish or mutate its draft')
  await page.screenshot({ path: path.join(output, '03-confirmed-application.png'), fullPage: true })

  await ai.getByRole('button', { name: '新开会话', exact: true }).click()
  await apply('browser-scenario-version-change').click()
  await confirm.waitFor({ state: 'visible' })
  // Model a newer local revision persisted while the previous revision awaits confirmation.
  await page.evaluate(() => {
    const key = 'leai_scenario_skill_packages_v1'
    const state = JSON.parse(localStorage.getItem(key))
    const item = state.packages.find(item => item.id === 'browser-scenario-version-change')
    item.version = 'v9.2.0'
    item.steps[0].task = '确认发起后修改的草稿任务'
    localStorage.setItem(key, JSON.stringify(state))
  })
  await confirm.click()
  assert.match(await assistant().innerText(), /失效|已变化/)
  assert.doesNotMatch(await assistant().innerText(), /POC 应用测试完成/)
  report.cases.push('A changed current draft version/task invalidates its pending confirmation even while the old approved snapshot remains unchanged')
  await page.screenshot({ path: path.join(output, '04-expired-draft-version-confirmation.png'), fullPage: true })

  await ai.getByRole('button', { name: '新开会话', exact: true }).click()
  await apply('browser-scenario-confirm').click()
  await confirm.waitFor({ state: 'visible' })
  const beforePermissionChange = await packageStorage()
  await page.evaluate(async () => {
    const { useAppStore } = await import('/admin-vue/src/stores/app.ts')
    useAppStore().permissions = []
  })
  await confirm.waitFor({ state: 'hidden' })
  assert.match(await assistant().innerText(), /账号或权限已变化/)
  assert.doesNotMatch(await assistant().innerText(), /POC 应用测试完成/)
  assert.equal(await apply('browser-scenario-confirm').isDisabled(), true)
  await page.evaluate(async () => {
    const { useAppStore } = await import('/admin-vue/src/stores/app.ts')
    useAppStore().permissions = ['*']
  })
  assert.equal(await confirm.count(), 0, 'Restoring permissions must not revive the previous confirmation')
  assert.equal(await packageStorage(), beforePermissionChange)
  report.cases.push('Revoked permissions remove the pending draft confirmation and disable application; restoring permissions does not revive that ticket or mutate the draft')

  await ai.getByRole('button', { name: '新开会话', exact: true }).click()
  await apply('browser-scenario-stale').click()
  await confirm.waitFor({ state: 'visible' })
  await page.evaluate(async () => {
    const { useScenarioSkillPackagesStore } = await import('/admin-vue/src/stores/scenarioSkillPackages.ts')
    const { useAppStore } = await import('/admin-vue/src/stores/app.ts')
    const app = useAppStore()
    useScenarioSkillPackagesStore().disablePackage('browser-scenario-stale', { id: app.user, permissions: app.permissions })
  })
  assert.equal(await apply('browser-scenario-stale').isDisabled(), true)
  await confirm.click()
  const staleText = await assistant().innerText()
  assert.match(staleText, /已变化|失效|已禁用|不可用|重新应用|不能应用/)
  assert.doesNotMatch(staleText, /应用测试已完成|应用测试完成/)
  report.cases.push('Disabling the package after confirmation is requested invalidates the old action and produces no successful application')
  await page.screenshot({ path: path.join(output, '04-expired-state-confirmation.png'), fullPage: true })

  await ai.getByRole('button', { name: '新开会话', exact: true }).click()
  await apply('browser-scenario-cross-tab').click()
  await confirm.waitFor({ state: 'visible' })
  const otherTab = await context.newPage()
  otherTab.on('pageerror', error => report.errors.push(error.message))
  await otherTab.goto(origin + '/admin-vue/agent/skills?tab=packages', { waitUntil: 'domcontentloaded' })
  await otherTab.locator('#skill-hub-panel-packages').waitFor({ state: 'visible' })
  await otherTab.evaluate(async () => {
    const { useScenarioSkillPackagesStore } = await import('/admin-vue/src/stores/scenarioSkillPackages.ts')
    const { useAppStore } = await import('/admin-vue/src/stores/app.ts')
    const app = useAppStore()
    useScenarioSkillPackagesStore().disablePackage('browser-scenario-cross-tab', { id: app.user, permissions: app.permissions })
  })
  await otherTab.close()
  await confirm.click()
  const crossTabText = await assistant().innerText()
  assert.match(crossTabText, /已变化|失效|已禁用|不可用|重新应用|不能应用/)
  assert.doesNotMatch(crossTabText, /应用测试已完成|应用测试完成/)
  report.cases.push('A real package disable in another tab is re-read before confirmation; stale in-memory state cannot authorize application')
  await page.screenshot({ path: path.join(output, '05-cross-tab-state-confirmation.png'), fullPage: true })

  for (const width of [1600, 1280]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.waitForTimeout(300)
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, panelWidth: document.querySelector('#ai-panel').getBoundingClientRect().width, panelOverflow: document.querySelector('#ai-panel').scrollWidth - document.querySelector('#ai-panel').clientWidth }))
    report.geometry.push(geometry)
    assert.equal(geometry.documentOverflow, 0)
    assert.equal(geometry.panelOverflow, 0)
    await page.screenshot({ path: path.join(output, `06-ai-application-${width}.png`), fullPage: true })
  }
  }

  // Unfinished drafts are saved legitimately; missing task content must not become successful fixture output.
  await page.evaluate(async () => {
    const { useScenarioSkillPackagesStore } = await import('/admin-vue/src/stores/scenarioSkillPackages.ts')
    const stored = JSON.parse(JSON.stringify(useScenarioSkillPackagesStore().packages))
    const source = structuredClone(stored.find(item => item.id === 'seed-scenario-own-pm-li-published'))
    source.id = 'browser-scenario-missing-task'
    source.name = '尚未配置节点任务的草稿'
    source.status = 'draft'
    source.onlineStatus = 'unpublished'
    source.steps[0].task = '   '
    delete source.publishedSnapshot
    localStorage.setItem('leai_scenario_skill_packages_v1', JSON.stringify({ schemaVersion: 2, packages: [...stored, source], seededOwners: ['pm-li'] }))
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await packages.waitFor({ state: 'visible' })
  const beforeMissingTask = await packageStorage()
  assert.equal(await apply('browser-scenario-missing-task').isDisabled(), true)
  assert.match(await apply('browser-scenario-missing-task').getAttribute('title'), /任务/)
  const missingTaskPreview = await page.evaluate(async () => {
    const { useScenarioSkillPackagesStore } = await import('/admin-vue/src/stores/scenarioSkillPackages.ts')
    const { useAppStore } = await import('/admin-vue/src/stores/app.ts')
    const account = useAppStore()
    return useScenarioSkillPackagesStore().applicationPreview('browser-scenario-missing-task', { id: account.user, permissions: account.permissions }, { workflowConfirmed: true })
  })
  assert.equal(missingTaskPreview.status, 'blocked')
  assert.ok(missingTaskPreview.issues.some(issue => /任务/.test(issue)))
  assert.ok(missingTaskPreview.nodes.every(node => node.output === ''))
  assert.doesNotMatch(missingTaskPreview.summary, /POC 应用测试完成/)
  assert.equal(await packageStorage(), beforeMissingTask)
  await row('browser-scenario-missing-task').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(output, '07-incomplete-draft-task-blocked.png'), fullPage: true })
  report.cases.push('An explicitly blank task in an active draft node disables application with a task explanation; the actual preview returns blocked without samples or package mutation')
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
