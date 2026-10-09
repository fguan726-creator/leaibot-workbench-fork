import assert from 'node:assert/strict'
import test, { after, afterEach } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { createRenderer, createSSRApp, h, nextTick, reactive, ssrContextKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { scenarioPmPermissions } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }
const httpHost = createHttpServer()
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'error', server: { middlewareMode: true, hmr: { server: httpHost } } })
const [{ default: Create }, { useAppStore }, { useScenarioSkillPackagesStore }, domain] = await Promise.all([
  server.ssrLoadModule('/src/views/agent/ScenarioSkillPackageCreateView.vue'),
  server.ssrLoadModule('/src/stores/app.ts'),
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'),
  server.ssrLoadModule('/src/domain/scenarioSkillPackages.js'),
])
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null })
const mounted = []
afterEach(() => { for (const app of mounted.splice(0)) app.unmount() })
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
  account.user = 'draft-ui-owner'
  account.permissions = scenarioPmPermissions([])
  const store = useScenarioSkillPackagesStore()
  account.permissions = scenarioPmPermissions(store.selectableSkills)
  return { pinia, account, store }
}

function mount(current, props = {}) {
  let state
  const events = []
  const app = renderer.createApp({ setup() {
    state = Create.setup(reactive(props), { expose() {}, emit: (...event) => events.push(event) })
    return () => h('div')
  } })
  app.provide(ssrContextKey, {})
  app.use(current.pinia)
  app.mount({})
  mounted.push(app)
  return { state, events }
}

async function htmlFor(current, state) {
  const app = createSSRApp({ ...Create, setup() { return state } })
  app.use(current.pinia)
  return renderToString(app)
}

test('unfinished configuration offers save draft while submission remains gated', async () => {
  const current = scope()
  const { state } = mount(current)
  state.form.value.description = ''
  state.form.value.targetAudience = ''
  const html = await htmlFor(current, state)
  const footer = html.slice(html.indexOf('<footer'))
  const save = footer.match(/<button\b([^>]*)>保存草稿<\/button>/)
  assert.ok(save, 'the existing footer must offer save draft')
  assert.doesNotMatch(save[1], /\bdisabled\b/)
  assert.equal(state.trialGate.value.ok, false)
})

test('save keeps raw fields, positions and incomplete links and returns the persisted draft', async () => {
  const current = scope()
  const { state, events } = mount(current)
  state.form.value.name = '分次编排场景'
  state.form.value.description = ''
  state.form.value.targetAudience = ''
  state.chain.value = [domain.createPinnedScenarioStep(current.store.selectableSkills[0], { id: 'unfinished-node', task: '', expectedOutput: '', predecessorId: null, position: { x: 320, y: 160 } })]
  await nextTick()
  assert.equal(typeof state.savePackageDraft, 'function')
  await state.savePackageDraft()
  assert.equal(events.length, 1)
  assert.equal(events[0][0], 'saved')
  const saved = current.store.findPackage(events[0][1].id)
  assert.equal(saved.status, 'draft')
  assert.equal(saved.description, '')
  assert.equal(saved.targetAudience, '')
  assert.equal(saved.steps[0].task, '', 'placeholder/default execution text must not become a saved user field')
  assert.equal(saved.steps[0].expectedOutput, '')
  assert.deepEqual(saved.steps[0].position, { x: 320, y: 160 })
  assert.equal(saved.steps[0].predecessorId, null)
  assert.equal(saved.auditEvents.some(event => ['submitted', 'approved', 'published'].includes(event.type)), false)
})

test('save errors preserve input and do not emit success or navigate', async () => {
  const current = scope()
  const { state, events } = mount(current)
  state.form.value.name = '保留未存内容'
  current.store.saveDraft = () => { throw new Error('本地保存失败，请释放空间后重试') }
  await state.savePackageDraft()
  assert.deepEqual(events, [])
  assert.equal(state.form.value.name, '保留未存内容')
  assert.match(state.displayedValidationErrors.value.join(' '), /保存失败/)
  assert.equal(state.savingDraft.value, false)
})

test('save is unavailable without creation permission or while a trial runs', async () => {
  const current = scope()
  const { state, events } = mount(current)
  let calls = 0
  current.store.saveDraft = () => { calls++; throw new Error('must not save') }
  state.trialRunning.value = true
  await state.savePackageDraft()
  assert.equal(calls, 0)
  state.trialRunning.value = false
  current.account.permissions = ['scenario-package:review']
  await nextTick()
  assert.equal(state.canEditDraft.value, false)
  const html = await htmlFor(current, state)
  assert.match(html, /<button\b[^>]*disabled[^>]*>保存草稿<\/button>/)
  await state.savePackageDraft()
  assert.equal(calls, 0)
  assert.deepEqual(events, [])
})

test('an empty package name cannot create an unidentifiable draft', async () => {
  const current = scope()
  const { state, events } = mount(current)
  state.form.value.name = '  '
  await state.savePackageDraft()
  assert.deepEqual(events, [])
  assert.match(state.displayedValidationErrors.value.join(' '), /技能包名称/)
})

test('an administrator edits another creator published package without taking its ownership or replacing the live version', async () => {
  const current = scope()
  const original = current.store.findPackage('seed-workplace-certification-operations')
  const before = JSON.parse(JSON.stringify(original))
  current.account.user = 'editing-admin'
  current.account.permissions = ['*']
  const { state, events } = mount(current, { draft: { ...before, baseUpdatedAt: before.updatedAt } })
  assert.equal(state.canEditDraft.value, true)
  assert.equal(state.ownerId.value, 'pm-li')
  assert.equal(state.actor.value.id, 'editing-admin')
  state.form.value.name = '管理员修订后的技能包'
  await state.savePackageDraft()
  assert.equal(events[0]?.[0], 'saved')
  const saved = current.store.findPackage(before.id)
  assert.equal(saved.ownerId, 'pm-li')
  assert.equal(saved.status, 'draft')
  assert.equal(saved.version, 'v1.0.1')
  assert.equal(saved.publishedSnapshot.name, before.name)
  assert.equal(saved.publishedSnapshot.version, 'v1.0.0')
  assert.equal(saved.onlineStatus, 'published')
})

test('changing account locks an opened package editor instead of saving under a different actor', async () => {
  const current = scope()
  const before = JSON.parse(JSON.stringify(current.store.findPackage('seed-workplace-certification-operations')))
  current.account.user = 'editing-admin'
  current.account.permissions = ['*']
  const { state, events } = mount(current, { draft: { ...before, baseUpdatedAt: before.updatedAt } })
  assert.equal(state.canEditDraft.value, true)
  current.account.user = 'another-admin'
  await nextTick()
  assert.equal(state.canEditDraft.value, false)
  await state.savePackageDraft()
  assert.deepEqual(events, [])
  assert.equal(current.store.findPackage(before.id).updatedAt, before.updatedAt)
})
