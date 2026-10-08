import { scenarioPmPermissions } from './helpers/scenarioActors.mjs'
import assert from 'node:assert/strict'
import test, { after, afterEach } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { createRenderer, createSSRApp, h, nextTick, reactive, ssrContextKey } from 'vue'
import { renderToString } from 'vue/server-renderer'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }
const root = fileURLToPath(new URL('../', import.meta.url))
const httpHost = createHttpServer()
const seedPlugin = {
  name: 'scenario-direct-submit-test-seeds', enforce: 'pre',
  transform(source, id) {
    if (!id.endsWith('/src/stores/scenarioSkillPackages.ts')) return
    // Existing drafts are injected only in this test process; no product action creates them.
    return `let scenarioPackageTestSeeds
export function seedScenarioPackagesForTest(store, seeds) {
  scenarioPackageTestSeeds = seeds
  try { store.resetToInitialMock() } finally { scenarioPackageTestSeeds = undefined }
}
${source.replaceAll("createSeedScenarioPackages(selectableSkills.value, skillHub.items, currentAuthorId())", "(scenarioPackageTestSeeds || createSeedScenarioPackages(selectableSkills.value, skillHub.items, currentAuthorId()))").replaceAll("createSeedScenarioPackages(selectableSkills.value, skillHub.items, ownerId)", "(scenarioPackageTestSeeds || createSeedScenarioPackages(selectableSkills.value, skillHub.items, ownerId))")}`
  },
}
const server = await createServer({ root, plugins: [seedPlugin], logLevel: 'error', server: { middlewareMode: true, hmr: { server: httpHost } }, appType: 'custom' })
const [{ default: Create }, { default: Trial }, { useAppStore }, { useScenarioSkillPackagesStore, seedScenarioPackagesForTest }, domain, simulation] = await Promise.all([
  server.ssrLoadModule('/src/views/agent/ScenarioSkillPackageCreateView.vue'),
  server.ssrLoadModule('/src/views/agent/ScenarioPackageTrialPanel.vue'),
  server.ssrLoadModule('/src/stores/app.ts'),
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'),
  server.ssrLoadModule('/src/domain/scenarioSkillPackages.js'),
  server.ssrLoadModule('/src/domain/scenarioPackageTesting.js'),
])
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null })
const mounted = []
const copy = value => JSON.parse(JSON.stringify(value))
const reviewer = { id: 'independent-direct-submit-reviewer', permissions: ['scenario-package:review'] }
afterEach(() => { for (const host of mounted.splice(0).reverse()) host.unmount() })
after(async () => {
  await server.close()
  httpHost.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})

function scope() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const account = useAppStore()
  account.user = 'direct-submit-creator'
  account.permissions = scenarioPmPermissions([])
  const store = useScenarioSkillPackagesStore()
  account.permissions = scenarioPmPermissions(store.selectableSkills)
  return { pinia, account, store }
}

function mount(component, props, pinia, emit = () => {}) {
  let state
  const host = renderer.createApp({ setup() {
    state = component.setup(props, { expose() {}, emit })
    return () => h('div')
  } })
  host.provide(ssrContextKey, {})
  host.use(pinia)
  host.mount({})
  mounted.push(host)
  return state
}

function configure(create, store) {
  create.chain.value = ['employee-certification-insight', 'workplace-segment-operations'].map((id, index) => {
    const skill = store.selectableSkills.find(item => item.id === id)
    return domain.createPinnedScenarioStep(skill, {
      id: `direct-${index}`, predecessorId: index ? 'direct-0' : null,
      task: index ? '根据认证结果分析人群经营机会。' : '查询本周认证状态并汇总待处理对象。',
      expectedOutput: index ? '经营建议与跟进对象。' : '认证状态与待处理对象清单。',
    })
  })
}

function mountTrial(create, pinia) {
  return mount(Trial, reactive({
    get draft() { return create.currentDraft() },
    get skills() { return create.publishedSkills.value },
    get actor() { return create.actor.value },
    get modelValue() { return create.testRequest.value },
    get report() { return create.testReport.value },
    get disabled() { return !create.canEditDraft.value },
  }), pinia, (event, value) => {
    if (event === 'update:modelValue') create.testRequest.value = value
    if (event === 'update:report') create.testReport.value = value
    if (event === 'running') create.trialRunning.value = value
  })
}

async function fixture() {
  const current = scope()
  const events = []
  const create = mount(Create, reactive({}), current.pinia, (...event) => events.push(event))
  configure(create, current.store)
  await nextTick()
  const trial = mountTrial(create, current.pinia)
  create.goNext()
  create.goNext()
  assert.equal(create.activeStep.value, 3)
  await trial.runTrial()
  await nextTick()
  assert.equal(create.trialGate.value.ok, true)
  create.goNext()
  await nextTick()
  assert.equal(create.activeStep.value, 4)
  return { ...current, create, trial, events }
}

test('a qualified trial submits directly to independent review without any owner declaration interaction', async () => {
  const { create, store, events } = await fixture()
  assert.equal(create.submissionEvaluation.value.ok, true)
  assert.equal(create.testReport.value.executionPerformed, false)
  await create.submitPackage()
  assert.equal(events.length, 1, 'qualified submission must not need an additional declaration')
  assert.equal(events[0][0], 'submitted')
  const submitted = events[0][1]
  assert.equal(submitted.status, 'review')
  assert.equal(submitted.ownerId, 'direct-submit-creator')
  assert.deepEqual(submitted.auditEvents.map(event => event.type), ['submitted'])
  assert.equal(store.findPackage(submitted.id).status, 'review')
  const beforeReview = copy(store.findPackage(submitted.id))
  assert.equal(store.reviewDecision(submitted.id, create.actor.value).ok, false)
  assert.throws(() => store.approvePackage(submitted.id, create.actor.value), /本人|自己|其他管理员/)
  assert.deepEqual(copy(store.findPackage(submitted.id)), beforeReview)
  assert.equal(store.reviewDecision(submitted.id, reviewer).ok, true)
  assert.equal(store.evaluateRuntimeAccess(submitted.id, create.actor.value).status, 'blocked')
})

test('the rendered final step offers an enabled submit action without a checkbox or owner declaration', async () => {
  const current = scope()
  const PreparedCreate = { ...Create, async setup(props, context) {
    const state = Create.setup(props, context)
    configure(state, current.store)
    await nextTick()
    state.testRequest.value = simulation.createScenarioSimulationRequest(state.currentDraft())
    state.testReport.value = simulation.runScenarioSimulation(state.currentDraft(), state.publishedSkills.value, state.testRequest.value, state.actor.value)
    state.recomputeEvaluation()
    state.activeStep.value = 4
    return state
  } }
  const app = createSSRApp(PreparedCreate)
  app.use(current.pinia)
  const html = await renderToString(app)
  const finalPanelStart = html.indexOf('id="scenario-package-panel-4"')
  assert.ok(finalPanelStart >= 0, 'the final submission panel must render')
  const finalPanel = html.slice(finalPanelStart, html.indexOf('</main>'))
  assert.equal(/type="checkbox"|我是主责任人|勾选提交声明|已核对适用场景/.test(finalPanel), false, 'submission must not render an owner declaration or checkbox')
  const reviewHeader = html.match(/<div\b([^>]*class="[^"]*\bscenario-review-fixed-heading\b[^"]*"[^>]*)>([\s\S]*?)<\/header>/)
  assert.ok(reviewHeader, 'the final step must retain its fixed review heading')
  assert.doesNotMatch(reviewHeader[1], /display:\s*none/, 'the review heading must be visible on the final step')
  assert.equal(reviewHeader[2].match(/<h2\b[^>]*>(.*?)<\/h2>/)?.[1], '提交审核')
  assert.match(html, /aria-label="4\. 提交审核"/)
  const footer = html.slice(html.indexOf('<footer'))
  const submitButton = footer.match(/<button\b([^>]*)>提交审核<\/button>/)
  assert.ok(submitButton, 'the final footer must offer submission')
  assert.doesNotMatch(submitButton[1], /\bdisabled\b/, 'a qualified trial must enable direct submission')
})

for (const invalid of ['missing report', 'blocked node', 'stale configuration']) {
  test(`direct submission still rejects ${invalid}, including a previously visited final tab`, async () => {
    const { create, trial, store, events } = await fixture()
    if (invalid === 'missing report') create.testReport.value = null
    if (invalid === 'blocked node') {
      create.chain.value[1].requiresConfirmation = true
      await nextTick()
      await trial.runTrial()
      assert.equal(create.testReport.value.nodes[1].status, 'blocked')
    }
    if (invalid === 'stale configuration') create.chain.value[0].task += '并区分业务范围。'
    await nextTick()
    assert.equal(create.trialGate.value.ok, false)
    create.goToStep(4)
    assert.equal(create.activeStep.value, 3)
    await create.submitPackage()
    assert.equal(events.length, 0)
    assert.ok(!store.findPackage(create.currentDraft().id))
    assert.ok(create.displayedValidationErrors.value.length > 0)
  })
}

for (const access of ['readonly review', 'nonowner rejected draft']) {
  test(`direct submission preserves ${access} restrictions and stored history`, async () => {
    const { create, store, account, pinia } = await fixture()
    const submitted = store.submitDraft(create.currentDraft(), create.actor.value)
    const record = access === 'nonowner rejected draft'
      ? store.rejectPackage(submitted.id, reviewer, '请补充适用范围')
      : submitted
    if (access === 'nonowner rejected draft') account.user = 'another-account'
    const before = copy(store.findPackage(record.id))
    const events = []
    const view = mount(Create, reactive({ draft: record }), pinia, (...event) => events.push(event))
    await nextTick()
    assert.equal(view.canEditDraft.value, false)
    await view.submitPackage()
    assert.equal(events.length, 0)
    assert.deepEqual(copy(store.findPackage(record.id)), before)
    assert.match(view.displayedValidationErrors.value.join(' '), access === 'readonly review' ? /待审核内容暂不可编辑/ : /当前状态或权限不允许编辑/)
  })
}

async function editFixture(status) {
  const current = await fixture()
  const { create, store, pinia } = current
  const submitted = store.submitDraft(create.currentDraft(), create.actor.value)
  if (status === 'draft') seedScenarioPackagesForTest(store, copy(store.packages).map(item => item.id === submitted.id ? {
    ...item, status: 'draft', submittedAt: undefined, submittedBy: undefined,
    testReport: undefined, testRequest: undefined, auditEvents: [],
  } : item))
  if (status === 'rejected') store.rejectPackage(submitted.id, reviewer, '补充本次场景边界。')
  if (status === 'published' || status === 'disabled') store.approvePackage(submitted.id, reviewer)
  if (status === 'disabled') assert.equal(store.disablePackage(submitted.id, reviewer).ok, true)
  const record = copy(store.findPackage(submitted.id))
  const editable = store.editableDraft(submitted.id, create.actor.value)
  assert.ok(editable, 'an authorized owner must receive an editable snapshot')
  const events = []
  const editing = mount(Create, reactive({ draft: editable }), pinia, (...event) => events.push(event))
  const editingTrial = mountTrial(editing, pinia)
  await nextTick()
  return { ...current, record, editable, editing, editingTrial, events }
}

for (const status of ['draft', 'rejected', 'published', 'disabled']) {
  test(`an owned ${status} package edits through its versioned snapshot and resubmits the same ID after a fresh trial`, async () => {
    const { record, editable, editing, editingTrial, store, events } = await editFixture(status)
    assert.equal(editing.canEditDraft.value, true)
    assert.equal(editable.baseUpdatedAt, record.updatedAt)
    assert.equal(editing.currentDraft().baseUpdatedAt, record.updatedAt)
    editing.form.value.description += '补充本轮修订范围。'
    editing.chain.value[0].task += '并区分已认证和待补充材料的人群。'
    await nextTick()
    assert.deepEqual(copy(store.findPackage(record.id)), record, 'editing must not change the stored revision or online version')
    assert.equal(editing.trialGate.value.ok, false)
    await editing.submitPackage()
    assert.equal(events.length, 0, 'changed configuration must not reuse the previous report')
    editing.goNext()
    editing.goNext()
    assert.equal(editing.activeStep.value, 3)
    await editingTrial.runTrial()
    await nextTick()
    assert.equal(editing.trialGate.value.ok, true)
    await editing.submitPackage()
    assert.equal(events.length, 1)
    assert.equal(events[0][0], 'submitted')
    const revised = store.findPackage(record.id)
    assert.equal(events[0][1].id, record.id)
    assert.equal(revised.status, 'review')
    assert.equal(revised.description, editing.form.value.description)
    assert.deepEqual(revised.auditEvents.slice(0, record.auditEvents.length), record.auditEvents)
    assert.equal(revised.auditEvents.at(-1).type, 'submitted')
    assert.equal(store.packages.filter(item => item.id === record.id).length, 1)
    assert.equal(store.reviewDecision(record.id, editing.actor.value).ok, false)
    if (status === 'published' || status === 'disabled') {
      assert.equal(revised.publishedSnapshot.version, record.version)
      assert.equal(revised.publishedSnapshot.description, record.description)
      assert.equal(revised.onlineStatus, status)
    }
  })
}

test('a previously opened editable snapshot cannot submit after the online status changes', async () => {
  const { record, editing, editingTrial, store, events } = await editFixture('published')
  await editingTrial.runTrial()
  await nextTick()
  assert.equal(editing.trialGate.value.ok, true)
  assert.equal(store.disablePackage(record.id, reviewer).ok, true)
  const disabled = copy(store.findPackage(record.id))
  await nextTick()
  assert.equal(editing.canEditDraft.value, false)
  await editing.submitPackage()
  assert.equal(events.length, 0)
  assert.deepEqual(copy(store.findPackage(record.id)), disabled)
  assert.match(editing.displayedValidationErrors.value.join(' '), /状态已更新.*重新打开编辑/)
})

test('losing creation permissions after a successful trial still blocks direct submission', async () => {
  const { create, store, account, events } = await fixture()
  account.permissions = []
  await nextTick()
  await create.submitPackage()
  assert.equal(events.length, 0)
  assert.ok(!store.findPackage(create.currentDraft().id))
  assert.match(create.displayedValidationErrors.value.join(' '), /权限/)
})

test('an in-flight trial cannot submit the prior successful report', async () => {
  const { create, trial, store, events } = await fixture()
  const pendingTrial = trial.runTrial()
  assert.equal(create.trialRunning.value, true)
  const pendingSubmit = create.submitPackage()
  assert.equal(events.length, 0)
  await Promise.all([pendingTrial, pendingSubmit])
  assert.equal(events.length, 0)
  assert.ok(!store.findPackage(create.currentDraft().id))
})
