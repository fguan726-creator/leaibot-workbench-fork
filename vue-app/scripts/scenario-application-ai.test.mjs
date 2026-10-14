import assert from 'node:assert/strict'
import test, { after, beforeEach } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

const saved = Object.fromEntries(['window', 'document', 'localStorage', 'fetch'].map(key => [key, globalThis[key]]))
const entries = new Map()
const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)), removeItem: key => entries.delete(key) }
globalThis.localStorage = storage
globalThis.window = { localStorage: storage, innerWidth: 1280, location: { origin: 'http://application.test' } }
globalThis.document = { documentElement: { classList: { add() {}, remove() {} } }, body: { classList: { add() {}, remove() {} } }, querySelector() { return null } }
globalThis.fetch = () => { throw new Error('Scenario application must not call a business or chat API') }
const host = createHttpServer()
const server = await createServer({ root: new URL('..', import.meta.url).pathname, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: { server: host } } })
const { useAIStore } = await server.ssrLoadModule('/src/stores/ai.ts')
const { useAppStore } = await server.ssrLoadModule('/src/stores/app.ts')
const { useScenarioSkillPackagesStore } = await server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts')
beforeEach(() => { entries.clear(); setActivePinia(createPinia()) })
after(async () => {
  await server.close(); host.close()
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete globalThis[key]
    else globalThis[key] = value
  }
})
const copy = value => JSON.parse(JSON.stringify(value))
function fixture(confirmation = false) {
  const initialAccount = useAppStore(); initialAccount.user = 'application-tester'; initialAccount.permissions = ['*']
  const source = useScenarioSkillPackagesStore().packages.find(item => item.status === 'published' && item.health.status === 'upgrade_required')
  assert.ok(source)
  const item = copy(source)
  for (const record of [item, item.publishedSnapshot].filter(Boolean)) {
    record.id = 'application-ai-fixture'; record.requiresConfirmation = confirmation
  }
  storage.setItem('leai_scenario_skill_packages_v1', JSON.stringify({ schemaVersion: 2, packages: [item], seededOwners: [] }))
  setActivePinia(createPinia())
  const app = useAppStore(); app.user = 'application-tester'; app.permissions = ['*']
  return { app, scenario: useScenarioSkillPackagesStore(), ai: useAIStore(), id: item.id }
}
const confirmationAction = ai => ai.messages.flatMap(message => message.actionItems || []).find(action => action.type === 'scenario_application_confirm')

test('applying a reviewed package opens a local preview without changing the composer or package', () => {
  const { ai, scenario, id } = fixture()
  const before = copy(scenario.findPackage(id))
  ai.inputText = '保留我的未发送问题'
  assert.equal(ai.applyScenarioPackage(id).ok, true)
  assert.equal(ai.open, true)
  assert.equal(ai.inputText, '保留我的未发送问题')
  assert.equal(ai.messages.length, 2)
  assert.match(ai.messages[1].text, /技能包应用测试/)
  assert.match(ai.messages[1].text, /POC|模拟|样例/)
  assert.match(ai.messages[1].text, /未调用真实/)
  assert.match(ai.messages[1].text, /v1\.1\.0/)
  assert.deepEqual(copy(scenario.findPackage(id)), before)
})

test('unpublished, paused and disabled packages cannot enter application through the store API', () => {
  const { ai, scenario } = fixture()
  for (const item of scenario.packages.filter(item => item.status === 'review' && !item.publishedSnapshot || item.status === 'disabled' || item.health.status === 'paused')) {
    assert.equal(ai.applyScenarioPackage(item.id).ok, false, item.id)
  }
  assert.equal(ai.messages.length, 0)
})

test('one explicit workflow confirmation produces one preview and cannot be replayed', async () => {
  const { ai, id } = fixture(true)
  assert.equal(ai.applyScenarioPackage(id).ok, true)
  const action = confirmationAction(ai)
  assert.ok(action)
  assert.match(ai.messages.at(-1).text, /确认/)
  await ai.runTaskAction(action, 'agent.skills')
  assert.match(ai.messages.at(-1).text, /应用测试完成|应用测试已完成|模拟测试完成/)
  const count = ai.messages.length
  await ai.runTaskAction(action, 'agent.skills')
  assert.equal(ai.messages.length, count)
  assert.equal(confirmationAction(ai), undefined)
})

test('disabling a package while its confirmation is pending cannot produce a successful preview', async () => {
  const { ai, scenario, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai)
  assert.equal(scenario.disablePackage(id, { id: 'other-reviewer', permissions: ['*'] }).ok, true)
  await ai.runTaskAction(action, 'agent.skills')
  assert.doesNotMatch(ai.messages.at(-1).text, /应用测试完成|模拟测试完成/)
  assert.match(ai.messages.at(-1).text, /变化|失效|重新|禁用/)
  assert.equal(confirmationAction(ai), undefined)
})

test('switching accounts expires even a confirmation restored to the original account later', async () => {
  const { ai, app, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai)
  app.user = 'another-account'; app.user = 'application-tester'
  const count = ai.messages.length
  await ai.runTaskAction(action, 'agent.skills')
  assert.equal(ai.messages.length, count)
  assert.equal(confirmationAction(ai), undefined)
})

test('new and restored conversations cannot reuse the old workflow confirmation', async () => {
  const { ai, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai), previous = ai.localConvId
  ai.newConversation()
  await ai.runTaskAction(action, 'agent.skills')
  assert.equal(ai.messages.length, 0)
  ai.restoreConversation(previous)
  const count = ai.messages.length
  await ai.runTaskAction(action, 'agent.skills')
  assert.equal(ai.messages.length, count)
  assert.equal(confirmationAction(ai), undefined)
})

test('cancelling an application removes its confirmation without simulating nodes', async () => {
  const { ai, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const confirm = confirmationAction(ai)
  const cancel = ai.messages.at(-1).actionItems.find(action => action.type === 'scenario_application_cancel')
  assert.ok(cancel)
  await ai.runTaskAction(cancel, 'agent.skills')
  assert.match(ai.messages.at(-1).text, /已取消/)
  const count = ai.messages.length
  await ai.runTaskAction(confirm, 'agent.skills')
  assert.equal(ai.messages.length, count)
})

test('confirmation reads cross-tab persisted state and rejects a newly disabled package', async () => {
  const { ai, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai)
  const state = JSON.parse(storage.getItem('leai_scenario_skill_packages_v1'))
  const item = state.packages.find(item => item.id === id)
  item.status = 'disabled'
  item.onlineStatus = 'disabled'
  storage.setItem('leai_scenario_skill_packages_v1', JSON.stringify(state))
  await ai.runTaskAction(action, 'agent.skills')
  assert.match(ai.messages.at(-1).text, /失效/)
  assert.equal(confirmationAction(ai), undefined)
  assert.equal(ai.applyScenarioPackage(id).ok, false)
})

test('changing a published snapshot in another tab invalidates the previous confirmation', async () => {
  const { ai, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai)
  const state = JSON.parse(storage.getItem('leai_scenario_skill_packages_v1'))
  const item = state.packages.find(item => item.id === id)
  item.version = 'v2.0.0'
  item.publishedSnapshot.version = 'v2.0.0'
  storage.setItem('leai_scenario_skill_packages_v1', JSON.stringify(state))
  await ai.runTaskAction(action, 'agent.skills')
  assert.match(ai.messages.at(-1).text, /失效/)
  assert.doesNotMatch(ai.messages.at(-1).text, /POC 应用测试完成/)
})

test('permission revocation expires pending confirmation immediately', async () => {
  const { ai, app, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai)
  app.permissions = []
  const count = ai.messages.length
  await ai.runTaskAction(action, 'agent.skills')
  assert.equal(ai.messages.length, count)
  assert.equal(confirmationAction(ai), undefined)
  assert.equal(ai.applyScenarioPackage(id).ok, false)
})

test('expired workflow confirmation cannot be used', async () => {
  const { ai, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai), realNow = Date.now
  const later = realNow() + 16 * 60 * 1000
  Date.now = () => later
  try {
    await ai.runTaskAction(action, 'agent.skills')
    assert.match(ai.messages.at(-1).text, /失效/)
    assert.equal(confirmationAction(ai), undefined)
  } finally { Date.now = realNow }
})

test('reloading stored conversation strips confirmation buttons and cannot replay the old action', async () => {
  const { ai, id } = fixture(true)
  ai.applyScenarioPackage(id)
  const action = confirmationAction(ai), conversation = ai.localConvId
  setActivePinia(createPinia())
  const restored = useAIStore()
  restored.restoreConversation(conversation)
  assert.equal(confirmationAction(restored), undefined)
  const count = restored.messages.length
  await restored.runTaskAction(action, 'agent.skills')
  assert.equal(restored.messages.length, count)
})

test('applying while the assistant is busy leaves the conversation and pending draft unchanged', () => {
  const { ai, id } = fixture()
  ai.inputText = '我的待发送问题'
  ai.loading = true
  assert.equal(ai.applyScenarioPackage(id).ok, false)
  assert.equal(ai.messages.length, 0)
  assert.equal(ai.inputText, '我的待发送问题')
})
