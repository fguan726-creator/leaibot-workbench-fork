import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'

const previousStorage = globalThis.localStorage
const data = new Map()
globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
const key = 'leai_scenario_skill_packages_v1'
const copy = value => JSON.parse(JSON.stringify(value))
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'silent', server: { middlewareMode: true } })
const [{ useAppStore }, { useSkillHubStore }, { useScenarioSkillPackagesStore }] = await Promise.all([
  server.ssrLoadModule('/src/stores/app.ts'), server.ssrLoadModule('/src/stores/skillHub.ts'), server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts')
])
after(async () => {
  await server.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})
const callerFor = item => ({ id: 'consumer', permissions: [
  `scenario-package:${item.id}:use`, ...item.steps.flatMap(step => ['menu', 'skill', 'data', 'action'].flatMap(bucket => step.permissions[bucket]))
] })
function fixture() {
  data.clear()
  setActivePinia(createPinia())
  useAppStore().user = 'consumer'
  useAppStore().permissions = []
  const hub = useSkillHubStore()
  const store = useScenarioSkillPackagesStore()
  const item = store.packages.find(item => item.status === 'published' && item.health.status === 'upgrade_required')
  assert.ok(item)
  return { hub, store, item, caller: callerFor(item) }
}
function save(items) { data.set(key, JSON.stringify({ schemaVersion: 2, packages: copy(items), seededOwners: ['pm-li'] })) }

test('use-only application of the seeded upgrade example preserves exact historical versions', () => {
  const { store, item, caller } = fixture()
  assert.equal(store.applicationEligibility(item.id, caller).ok, true)
  const result = store.applicationPreview(item.id, caller)
  assert.equal(result.status, 'completed', result.issues.join('；'))
  assert.ok(result.nodes.some(node => node.skillId === 'workplace-segment-operations' && node.pinnedVersion === 'v1.1.0'))
  assert.ok(result.nodes.every(node => node.status !== 'completed' || node.output))
  assert.equal(result.executionPerformed, false)
})

test('application rechecks current dependency state and caller permissions after the entry was opened', () => {
  const { store, item, caller, hub } = fixture()
  assert.equal(store.applicationEligibility(item.id, caller).ok, true)
  assert.equal(store.applicationPreview(item.id, { ...caller, permissions: [] }).status, 'blocked')
  const skill = hub.items.find(skill => skill.name === item.steps[0].skillId)
  hub.updateStatus(skill, 'disabled')
  const result = store.applicationPreview(item.id, caller)
  assert.equal(result.status, 'blocked')
  assert.ok(result.nodes.every(node => node.output === ''))
})

test('application entry and preview reread other-page disabling without overwriting editor data', () => {
  const { store, item, caller } = fixture()
  assert.equal(store.applicationEligibility(item.id, caller).ok, true)
  const saved = copy(item)
  saved.onlineStatus = 'disabled'
  saved.status = 'disabled'
  save([saved])
  assert.equal(store.applicationEligibility(item.id, caller).ok, false)
  assert.equal(store.applicationPreview(item.id, caller, { workflowConfirmed: true }).status, 'blocked')
  assert.equal(store.findPackage(item.id).onlineStatus, 'published', 'application reads must not replace editor state')
  assert.equal(JSON.parse(data.get(key)).packages[0].onlineStatus, 'disabled')
})

test('application scope reads current approved publication while a newer draft remains unreviewed', () => {
  const { store, item, caller } = fixture()
  const saved = copy(item)
  saved.status = 'draft'
  saved.name = '尚未审核的草稿标题'
  saved.version = 'v9.0.0'
  saved.publishedSnapshot.name = '已审核的新发布标题'
  saved.publishedSnapshot.version = 'v2.0.0'
  save([saved])
  const current = store.applicationPackage(item.id)
  assert.equal(current.name, '已审核的新发布标题')
  assert.equal(current.version, 'v2.0.0')
  assert.equal(store.applicationPreview(item.id, caller).version, 'v2.0.0')
  assert.equal(store.findPackage(item.id).version, item.version)
})

test('removed or unreadable previously persisted packages cannot fall back to stale in-memory authority', () => {
  const initial = fixture()
  save([initial.item])
  setActivePinia(createPinia())
  const store = useScenarioSkillPackagesStore()
  assert.equal(store.applicationEligibility(initial.item.id, initial.caller).ok, true)
  for (const stored of [JSON.stringify({ schemaVersion: 2, packages: [], seededOwners: [] }), '{invalid', null]) {
    if (stored === null) data.delete(key)
    else data.set(key, stored)
    assert.equal(store.applicationPackage(initial.item.id), undefined)
    assert.equal(store.applicationEligibility(initial.item.id, initial.caller).ok, false)
    assert.equal(store.applicationPreview(initial.item.id, initial.caller).status, 'blocked')
  }
  assert.equal(store.applicationPreview('missing-package', initial.caller).status, 'blocked')
})

test('publication first observed from another page cannot resurrect after that page deletes it', () => {
  const { store, item, caller } = fixture()
  save([item])
  assert.equal(store.applicationEligibility(item.id, caller).ok, true)
  save([])
  assert.equal(store.applicationEligibility(item.id, caller).ok, false)
  assert.equal(store.applicationPackage(item.id), undefined)
})
