import assert from 'node:assert/strict'
import test, { after, afterEach } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { createRenderer, h, nextTick, reactive, ssrContextKey } from 'vue'
import { scenarioPmPermissions } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }
const host = createHttpServer()
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'error', server: { middlewareMode: true, hmr: { server: host } } })
const [{ default: Create }, { default: Trial }, { useAppStore }, { useScenarioSkillPackagesStore }, domain] = await Promise.all([
  server.ssrLoadModule('/src/views/agent/ScenarioSkillPackageCreateView.vue'),
  server.ssrLoadModule('/src/views/agent/ScenarioPackageTrialPanel.vue'),
  server.ssrLoadModule('/src/stores/app.ts'),
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'),
  server.ssrLoadModule('/src/domain/scenarioSkillPackages.js'),
])
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null })
const mounted = []
afterEach(() => { for (const app of mounted.splice(0)) app.unmount() })
after(async () => {
  await server.close()
  host.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})

function scope() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const account = useAppStore()
  account.user = 'workflow-editor'
  account.permissions = scenarioPmPermissions([])
  const store = useScenarioSkillPackagesStore()
  account.permissions = scenarioPmPermissions(store.selectableSkills)
  return { pinia, account, store }
}

function mount(component, current, props = {}, emit = () => {}) {
  let state
  const app = renderer.createApp({ setup() {
    state = component.setup(reactive(props), { expose() {}, emit })
    return () => h('div')
  } })
  app.provide(ssrContextKey, {})
  app.use(current.pinia)
  app.mount({})
  mounted.push(app)
  return state
}

async function workflow(current, props = {}) {
  const state = mount(Create, current, props)
  if (!props.draft) {
    state.chain.value = ['workplace-segment-operations', 'employee-certification-insight'].map((id, index) => domain.createPinnedScenarioStep(current.store.selectableSkills.find(skill => skill.id === id), {
      id: `workflow-node-${index}`, predecessorId: index ? `workflow-node-${index - 1}` : null,
      task: index ? '汇总职场认证数据。' : '分析职场人群经营表现。', expectedOutput: ''
    }))
  }
  await nextTick()
  const trial = mount(Trial, current, {
    get draft() { return state.currentDraft() },
    get skills() { return state.publishedSkills.value },
    get actor() { return state.actor.value },
    get modelValue() { return state.testRequest.value },
    get report() { return state.testReport.value },
    get requiresConfirmation() { return state.form.value.requiresConfirmation },
    get disabled() { return !state.canEditDraft.value },
    simulate: current.store.simulateDraft
  }, (event, value) => {
    if (event === 'update:modelValue') state.testRequest.value = value
    if (event === 'update:report') state.testReport.value = value
    if (event === 'running') state.trialRunning.value = value
    if (event === 'edit-chain') state.returnToComposition(value)
  })
  // Wire the real child's public method just as the parent template ref does in the browser.
  if (state.trialPanel) state.trialPanel.value = { runTrial: trial.runTrial }
  return { state, trial }
}

test('failed trial -> return to composition -> next runs the complete retry fixture and unlocks review', async () => {
  const { state, trial } = await workflow(scope())
  state.activeStep.value = 3
  await trial.runTrial()
  const failed = state.testReport.value
  assert.deepEqual(failed.nodes.map(node => node.status), ['completed', 'blocked'])
  assert.equal(state.trialGate.value.ok, false)
  const configuration = JSON.parse(JSON.stringify(state.chain.value))

  trial.returnToChain()
  assert.equal(state.activeStep.value, 2)
  await state.goNext()
  assert.equal(state.activeStep.value, 3)
  assert.notEqual(state.testReport.value.id, failed.id, 'returning to the trial must execute again instead of displaying its cached failure')
  assert.deepEqual(state.testReport.value.nodes.map(node => node.status), ['completed', 'completed'])
  assert.equal(state.testRequest.value.mockDataPhase, 'retry')
  assert.equal(state.trialGate.value.ok, true)
  assert.deepEqual(JSON.parse(JSON.stringify(state.chain.value)), configuration, 'retry must not rewrite node tasks or graph connections')
  await state.goNext()
  assert.equal(state.activeStep.value, 4)
})

test('first entry starts a fresh trial and tab re-entry also replaces an earlier failed report', async () => {
  const { state } = await workflow(scope())
  state.activeStep.value = 2
  await state.goNext()
  assert.deepEqual(state.testReport.value?.nodes.map(node => node.status), ['completed', 'blocked'])
  assert.equal(state.testRequest.value.mockDataPhase, undefined)
  const firstId = state.testReport.value.id
  state.returnToComposition()
  await state.goToStep(3)
  assert.notEqual(state.testReport.value.id, firstId)
  assert.equal(state.trialGate.value.ok, true)
})

test('returning to trial never treats an unconfirmed workflow as successful mock data', async () => {
  const { state, trial } = await workflow(scope())
  state.form.value.requiresConfirmation = true
  await nextTick()
  state.activeStep.value = 3
  await trial.runTrial()
  state.returnToComposition()
  await state.goNext()
  assert.equal(state.testRequest.value.mockDataPhase, 'retry')
  assert.equal(state.testReport.value.status, 'blocked')
  assert.equal(state.trialGate.value.ok, false)
  assert.ok(state.testReport.value.nodes.every(node => node.status === 'blocked' && node.output === ''))
})

test('legacy node choices migrate to the workflow field, can be cleared, and survive a draft round trip', async () => {
  const current = scope()
  const source = JSON.parse(JSON.stringify(current.store.findPackage('seed-workplace-certification-operations')))
  current.account.permissions = ['*']
  delete source.requiresConfirmation
  source.steps[1].requiresConfirmation = true
  const { state } = await workflow(current, { draft: { ...source, baseUpdatedAt: source.updatedAt } })
  assert.equal(state.form.value.requiresConfirmation, true)
  assert.equal(state.currentDraft().requiresConfirmation, true)
  assert.ok(state.currentDraft().steps.every(step => !step.requiresConfirmation))
  state.form.value.requiresConfirmation = false
  await nextTick()
  await state.savePackageDraft()
  const saved = current.store.findPackage(source.id)
  assert.equal(saved.requiresConfirmation, false)
  assert.ok(saved.steps.every(step => !step.requiresConfirmation))
  const reopened = mount(Create, current, { draft: current.store.editableDraft(saved.id, state.actor.value) })
  assert.equal(reopened.form.value.requiresConfirmation, false)
  assert.equal(reopened.currentDraft().requiresConfirmation, false)
})

test('confirmation stays scoped to semantic configuration and actor while canvas movement is harmless', async () => {
  const current = scope()
  const { state } = await workflow(current)
  state.form.value.requiresConfirmation = true
  await nextTick()
  state.testRequest.value.workflowConfirmed = true
  await nextTick()
  state.chain.value[0].position = { x: 300, y: 240 }
  await nextTick()
  assert.equal(state.testRequest.value.workflowConfirmed, true)
  state.chain.value[0].task = '改为分析其他经营人群。'
  await nextTick()
  assert.equal(state.testRequest.value.workflowConfirmed, false)
  state.testRequest.value.workflowConfirmed = true
  await nextTick()
  state.form.value.description = '本次改为另一个业务范围。'
  await nextTick()
  assert.equal(state.testRequest.value.workflowConfirmed, false)
  state.testRequest.value.workflowConfirmed = true
  await nextTick()
  state.testRequest.value.activeOptionalStepIds = ['workflow-node-1']
  await nextTick()
  assert.equal(state.testRequest.value.workflowConfirmed, false)
  state.testRequest.value.workflowConfirmed = true
  await nextTick()
  current.account.permissions = current.account.permissions.filter(permission => !permission.startsWith('data:'))
  await nextTick()
  assert.equal(state.testRequest.value.workflowConfirmed, false)
})

test('restoring an editor does not reuse an earlier execution confirmation or erase intrinsic approval', async () => {
  const current = scope()
  const source = JSON.parse(JSON.stringify(current.store.findPackage('seed-workplace-certification-operations')))
  current.account.permissions = ['*']
  source.requiresConfirmation = true
  source.testRequest = { ...source.testRequest, workflowConfirmed: true }
  source.steps[0].requiresApproval = true
  const { state } = await workflow(current, { draft: { ...source, baseUpdatedAt: source.updatedAt } })
  assert.equal(state.testRequest.value.workflowConfirmed, false)
  assert.equal(state.currentDraft().steps[0].requiresApproval, true)
})
