import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import test, { after, beforeEach } from 'node:test'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const key = 'leai_scenario_skill_packages_v1'
const previousStorage = globalThis.localStorage
const data = new Map()
let failWrite = false
globalThis.localStorage = { getItem: name => data.get(name) ?? null, setItem(name, value) { if (failWrite) throw new Error('QuotaExceededError'); data.set(name, value) }, removeItem: name => data.delete(name) }
const options = { root: new URL('..', import.meta.url).pathname, logLevel: 'silent', server: { middlewareMode: true } }
// Exercise actual released V1 factory output without checking a large copy of the seed records into source.
const legacyPaths = ['/src/stores/scenarioSkillPackages.ts', '/src/stores/skillHub.ts', '/src/services/skillCapabilityChanges.js', '/src/domain/scenarioSkillPackages.js', '/src/domain/scenarioPackageTesting.js']
const legacyServer = await createServer({ ...options, plugins: [{ name: 'released-v1-seed-fixture', enforce: 'pre', transform(code, id) {
  const path = legacyPaths.find(path => id.endsWith(path))
  if (!path) return
  const released = execFileSync('git', ['show', `b1cdf2c0:vue-app${path}`], { cwd: options.root, encoding: 'utf8' })
  return path === '/src/stores/scenarioSkillPackages.ts' ? released.replace('function createSeedScenarioPackages(', 'export function createSeedScenarioPackages(') : released
} }] })
const [{ createSeedScenarioPackages, createSelectableScenarioSkills }, { useSkillHubStore: useLegacyHub }] = await Promise.all([
  legacyServer.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'), legacyServer.ssrLoadModule('/src/stores/skillHub.ts')
])
setActivePinia(createPinia())
const legacyCatalog = JSON.parse(JSON.stringify(useLegacyHub().items))
const legacySkills = createSelectableScenarioSkills(legacyCatalog)
const legacySeeds = ownerId => JSON.parse(JSON.stringify(createSeedScenarioPackages(legacySkills, legacyCatalog, ownerId)))
await legacyServer.close()

const server = await createServer(options)
const [{ useAppStore }, { useScenarioSkillPackagesStore }, { useSkillHubStore }, { evaluateScenarioTrialForSubmit }] = await Promise.all([
  server.ssrLoadModule('/src/stores/app.ts'), server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'), server.ssrLoadModule('/src/stores/skillHub.ts'), server.ssrLoadModule('/src/domain/scenarioSkillPackages.js')
])
beforeEach(() => { data.clear(); failWrite = false })
after(async () => { await server.close(); if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage })
const pmPermissions = ['scenario-package:create', 'scenario-package:compose:cross-menu', ...legacySkills.flatMap(skill => [
  `skill:${skill.id}:metadata:read`, `skill:${skill.id}:reference`, ...Object.values(skill.permissions).flat()
])]
const pm = id => ({ id, permissions: pmPermissions })
const admin = id => ({ id, permissions: ['scenario-package:review'] })

function fixture(actor = admin('admin'), updateCatalog = () => {}) {
  setActivePinia(createPinia())
  const account = useAppStore(); account.user = actor.id; account.permissions = [...actor.permissions]
  updateCatalog(useSkillHubStore().items)
  return { account, store: useScenarioSkillPackagesStore() }
}

function cacheV1(ownerId, mutate = records => records) {
  const packages = mutate(legacySeeds(ownerId))
  data.set(key, JSON.stringify({ schemaVersion: 1, packages, seededOwners: [ownerId] }))
  return packages
}

function matches(item, state) {
  if (['draft', 'review', 'rejected', 'disabled'].includes(state)) return item.status === state
  return item.status === 'published' && item.health.status === (state === 'published' ? 'healthy' : state)
}

test('default examples cover current states with PM authors and independent admin review', () => {
  const { store } = fixture()
  for (const state of ['draft', 'review', 'rejected', 'published', 'upgrade_required', 'paused', 'disabled']) {
    assert.ok(store.packages.some(item => matches(item, state) && item.ownerId === 'pm-li'), state)
  }
  assert.ok(store.packages.every(item => item.ownerId === 'pm-li'))
  for (const item of store.packages) {
    if (item.submittedBy) assert.equal(item.submittedBy, 'pm-li')
    if (item.reviewedBy) assert.equal(item.reviewedBy, 'admin')
    if (item.testReport) assert.equal(item.testReport.testerId, 'pm-li')
    if (item.status === 'review') assert.equal(evaluateScenarioTrialForSubmit(item, store.selectableSkills).ok, true)
  }
})

for (const actor of [admin('admin'), admin('some-reviewer'), { id: 'superuser', permissions: ['*'] }, { id: 'reader', permissions: [] }]) {
  test(`${actor.id} does not receive author examples without an exclusive PM author role`, () => {
    const { store } = fixture(actor)
    assert.ok(store.packages.every(item => item.ownerId !== actor.id))
    store.resetToInitialMock()
    assert.ok(store.packages.every(item => item.ownerId !== actor.id))
  })
}

test('author examples follow permissions including asynchronous permission loading, never the account name', async () => {
  const { account, store } = fixture({ id: '', permissions: [] })
  account.user = 'admin'; await nextTick()
  assert.ok(store.packages.every(item => item.ownerId !== 'admin'))
  account.permissions = [...pmPermissions]; await nextTick()
  assert.ok(store.packages.some(item => item.ownerId === 'admin' && item.status === 'draft'))
  const count = store.packages.length
  account.permissions = [...pmPermissions]; await nextTick()
  assert.equal(store.packages.length, count)
  assert.ok(store.packages.every(item => item.ownerId !== 'zhangrui'))
})

for (const ownerId of ['admin', 'zhangrui', 'arbitrary-owner', 'pm-li']) {
  test(`untouched released V1 examples for ${ownerId} migrate to canonical PM samples durably`, () => {
    cacheV1(ownerId)
    data.set('another-module', 'keep me')
    const { store } = fixture()
    assert.ok(store.packages.every(item => item.ownerId === 'pm-li'))
    assert.equal(new Set(store.packages.map(item => item.id)).size, store.packages.length)
    const persisted = JSON.parse(data.get(key))
    assert.equal(persisted.schemaVersion, 2)
    assert.equal(data.get('another-module'), 'keep me')
    assert.deepEqual(fixture().store.packages.map(item => item.id), store.packages.map(item => item.id))
  })
}

for (const [label, mutate] of [
  ['description', item => { item.description += ' 用户补充' }],
  ['node task', item => { item.steps[0].task += ' 用户补充' }],
  ['trial result', item => { item.testReport.nodes[0].output += ' 用户补充' }],
  ['trial fingerprint', item => { item.testReport.fingerprint += '-changed' }],
  ['audit history', item => { item.auditEvents.push({ type: 'submitted', actorId: 'admin', at: '2026-09-11T00:00:00.000Z' }) }],
  ['unknown metadata', item => { item.userNote = '必须保留' }]
]) {
  test(`a V1 seed with changed ${label} remains the user's record`, () => {
    let edited
    cacheV1('admin', records => { edited = records.find(item => item.id === 'seed-scenario-own-admin-review'); mutate(edited); return records })
    fixture()
    assert.deepEqual(JSON.parse(data.get(key)).packages.find(item => item.id === edited.id), edited)
  })
}

test('cross-page V1 input cannot resurrect retired seeds during a later package save', () => {
  cacheV1('admin')
  const { store } = fixture(pm('migration-author'))
  cacheV1('admin') // An older page writes its unchanged cached seeds after this page has loaded.
  store.saveDraft({ id: 'real-user-draft', name: '真实用户草稿', description: '', targetAudience: '', ownerId: 'migration-author', steps: [] }, pm('migration-author'))
  const persisted = JSON.parse(data.get(key))
  assert.equal(persisted.schemaVersion, 2)
  assert.ok(persisted.packages.every(item => item.ownerId !== 'admin'))
  assert.equal(persisted.packages.find(item => item.id === 'real-user-draft').ownerId, 'migration-author')
})

test('a different catalog cannot establish that a legacy example is unchanged', () => {
  const old = cacheV1('admin')
  fixture(admin('admin'), items => { items.find(item => item.name === 'employee-certification-insight').cnName += '（更新）' })
  const persisted = JSON.parse(data.get(key))
  for (const item of old.filter(item => item.ownerId === 'admin')) assert.deepEqual(persisted.packages.find(record => record.id === item.id), item)
})

test('an edited canonical PM example wins over the replacement for an untouched wrong-owner seed', () => {
  const edited = legacySeeds('pm-li').find(item => item.id === 'seed-scenario-own-pm-li-review')
  edited.description += ' 必须保留的用户内容'
  cacheV1('admin', records => [...records, edited])
  fixture()
  const persisted = JSON.parse(data.get(key))
  assert.deepEqual(persisted.packages.find(item => item.id === edited.id), edited)
  assert.ok(persisted.packages.every(item => item.ownerId !== 'admin'))
})

test('a failed schema upgrade keeps the original disk and records and can retry without losing user input', () => {
  const legacy = cacheV1('admin')
  const before = data.get(key)
  data.set('another-module', 'keep me')
  failWrite = true
  const { store } = fixture(pm('migration-author'))
  assert.equal(data.get(key), before)
  assert.ok(legacy.every(item => store.findPackage(item.id)))
  const draft = { id: 'retry-user-draft', name: '未丢失的输入', ownerId: 'migration-author', description: '', targetAudience: '', steps: [] }
  assert.throws(() => store.saveDraft(draft, pm('migration-author')), /保存失败/)
  assert.equal(data.get(key), before)
  assert.equal(store.findPackage(draft.id), undefined)
  assert.equal(draft.name, '未丢失的输入')
  failWrite = false
  store.saveDraft(draft, pm('migration-author'))
  const persisted = JSON.parse(data.get(key))
  assert.equal(persisted.schemaVersion, 2)
  assert.ok(persisted.packages.every(item => item.ownerId !== 'admin'))
  assert.equal(persisted.packages.find(item => item.id === draft.id).name, draft.name)
  assert.equal(data.get('another-module'), 'keep me')
})
