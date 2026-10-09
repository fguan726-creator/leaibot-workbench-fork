import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { evaluateScenarioTrialForSubmit } from '../src/domain/scenarioSkillPackages.js'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor, scenarioPmPermissions } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'silent', server: { middlewareMode: true } })
const [{ useAppStore }, { useSkillHubStore }, { useScenarioSkillPackagesStore }] = await Promise.all([
  server.ssrLoadModule('/src/stores/app.ts'),
  server.ssrLoadModule('/src/stores/skillHub.ts'),
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts')
])
after(async () => {
  await server.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})
const copy = value => JSON.parse(JSON.stringify(value))
const actor = (id, store) => scenarioPmActor(id, [...store.selectableSkills, ...store.packages.flatMap(item => item.steps)], store.packages.map(item => item.id))
const reviewer = { id: 'independent-reviewer', permissions: ['scenario-package:review'] }

function fixture(username = 'seed-test-user') {
  setActivePinia(createPinia())
  const account = useAppStore()
  account.user = username
  account.permissions = scenarioPmPermissions([])
  const hub = useSkillHubStore()
  const beforeSkills = copy(hub.items)
  const store = useScenarioSkillPackagesStore()
  return { account, hub, beforeSkills, store, current: actor(username, store) }
}

function matches(item, state) {
  if (['draft', 'review', 'rejected', 'disabled'].includes(state)) return item.status === state
  return item.status === 'published' && item.health.status === (state === 'published' ? 'healthy' : state)
}

function findState(store, state, ownerId) {
  const record = store.packages.find(item => matches(item, state) && (ownerId === undefined || item.ownerId === ownerId))
  assert.ok(record, `initial data is missing ${state}${ownerId === undefined ? '' : ` owned by ${ownerId}`}`)
  return record
}

function withTrial(draft, store, current) {
  const testRequest = {
    input: '核验当前场景的节点处理与传递结果。', expectedOutput: '得到所有已启用节点的模拟结果。',
    activeOptionalStepIds: draft.steps.filter(step => !step.required).map(step => step.id),
    confirmedStepIds: draft.steps.filter(step => step.requiresConfirmation).map(step => step.id),
    approvedStepIds: draft.steps.filter(step => step.requiresApproval).map(step => step.id),
    sampleOutputs: Object.fromEntries(draft.steps.map(step => [step.id, `${step.name}的手工模拟输出。`]))
  }
  return { ...draft, testRequest, testReport: runScenarioSimulation(draft, store.selectableSkills, testRequest, current) }
}

test('initial data demonstrates every existing package state without changing the Skill catalog', () => {
  const { store, hub, beforeSkills } = fixture()
  for (const state of ['draft', 'review', 'rejected', 'published', 'upgrade_required', 'degraded', 'paused', 'disabled']) {
    findState(store, state)
  }
  assert.deepEqual(copy(hub.items), beforeSkills)
  assert.equal(new Set(store.packages.map(item => item.id)).size, store.packages.length)
})

for (const username of ['admin', 'zhangrui', 'pm-li']) {
  test(`${username} with explicit PM permissions gets own author examples without a username role shortcut`, () => {
    const { store, current } = fixture(username)
    for (const state of ['draft', 'rejected', 'published', 'disabled']) {
      const own = findState(store, state, username)
      assert.ok(store.actionsFor(own.id, current).includes('edit'))
      const editing = store.editableDraft(own.id, current)
      assert.equal(editing.ownerId, username)
      assert.equal(editing.baseUpdatedAt, own.updatedAt)
    }
    const ownReview = findState(store, 'review', username)
    assert.deepEqual(store.actionsFor(ownReview.id, current), ['view', 'withdraw'])
    assert.equal(store.editableDraft(ownReview.id, current), null)
    assert.throws(() => store.approvePackage(ownReview.id, current), /本人|其他管理员/)
    const otherReview = store.packages.find(item => item.status === 'review' && item.ownerId !== reviewer.id && item.submittedBy !== reviewer.id)
    assert.ok(otherReview, 'a distinct owner must provide the administrator review example')
    assert.ok(!store.actionsFor(otherReview.id, current).includes('approve'))
    assert.ok(store.actionsFor(otherReview.id, reviewer).includes('approve'))
    assert.ok(store.actionsFor(otherReview.id, reviewer).includes('reject'))
    assert.deepEqual(store.actionsFor(otherReview.id, { id: username, permissions: [] }), ['view'])
    assert.equal(store.withdrawPackage(ownReview.id, reviewer, ownReview.updatedAt).ok, false)
  })
}

test('review examples carry current successful trials and immutable independent submission identities', () => {
  const { store, current } = fixture()
  for (const item of store.packages.filter(item => item.status === 'review')) {
    assert.equal(item.ownerId, item.submittedBy)
    const submitted = item.auditEvents.at(-1)
    assert.equal(submitted.type, 'submitted')
    assert.equal(submitted.actorId, item.ownerId)
    assert.equal(submitted.at, item.submittedAt)
    const trial = evaluateScenarioTrialForSubmit(item, store.selectableSkills)
    assert.equal(trial.ok, true, `${item.name}: ${trial.reasons.join('；')}`)
    assert.equal(item.testReport.testerId, item.ownerId)
  }
  const other = store.packages.find(item => item.status === 'review' && item.ownerId !== current.id)
  assert.ok(other)
  assert.equal(store.approvePackage(other.id, reviewer, '', other.updatedAt).status, 'published')
})

test('published and disabled examples have distinct approval evidence and use the reviewed snapshot at runtime', () => {
  const { store, current } = fixture()
  const healthy = findState(store, 'published')
  const disabled = findState(store, 'disabled')
  for (const item of store.packages.filter(item => ['published', 'disabled'].includes(item.status))) {
    const snapshot = item.publishedSnapshot
    assert.ok(snapshot, `${item.name} must retain its reviewed version`)
    const approval = snapshot.auditEvents.filter(event => event.type === 'approved').at(-1)
    assert.ok(approval?.actorId)
    assert.notEqual(approval.actorId, snapshot.ownerId)
    assert.notEqual(approval.actorId, snapshot.submittedBy)
    assert.ok(snapshot.auditEvents.some(event => event.type === 'published'))
  }
  assert.equal(store.prepareRunPlan(healthy.id, current).status, 'ready')
  assert.equal(store.prepareRunPlan(disabled.id, current).status, 'blocked')
  assert.ok(!store.actionsFor(healthy.id, current).includes('disable'))
  assert.ok(store.actionsFor(healthy.id, reviewer).includes('disable'))
  assert.ok(store.actionsFor(disabled.id, reviewer).includes('enable'))
})

test('degraded and paused examples reference existing disabled Skills and remain stable through health refreshes', () => {
  const { store, hub, beforeSkills, current } = fixture()
  const disabledIds = new Set(hub.items.filter(item => item.onlineStatus === 'disabled').map(item => item.name))
  const degraded = findState(store, 'degraded')
  const paused = findState(store, 'paused')
  const optionalUnavailable = degraded.steps.filter(step => !step.required && disabledIds.has(step.skillId))
  const requiredUnavailable = paused.steps.filter(step => step.required && disabledIds.has(step.skillId))
  assert.ok(optionalUnavailable.length > 0, 'degraded example needs an actually disabled optional dependency')
  assert.ok(requiredUnavailable.length > 0, 'paused example needs an actually disabled required dependency')
  assert.ok(optionalUnavailable.every(step => step.dependencyState === 'emergency_disabled'))
  assert.ok(requiredUnavailable.every(step => step.dependencyState === 'emergency_disabled'))
  const activeOptional = optionalUnavailable.map(step => step.id)
  assert.equal(store.evaluateRuntimeAccess(degraded.id, current, activeOptional).status, 'degraded')
  assert.equal(store.prepareRunPlan(paused.id, current).status, 'blocked')
  for (let read = 0; read < 3; read += 1) {
    assert.equal(store.findPackage(degraded.id).publishedSnapshot.health.status, 'degraded')
    assert.equal(store.findPackage(paused.id).publishedSnapshot.health.status, 'paused')
  }
  assert.deepEqual(copy(hub.items), beforeSkills)
  assert.ok(store.selectableSkills.every(skill => !disabledIds.has(skill.id)))
})

test('late login and switching accounts add the correct own examples without overwriting prior real submissions or edited examples', async () => {
  const { account, store } = fixture(null)
  account.user = 'late-user-a'
  await nextTick()
  const current = actor('late-user-a', store)
  const ownDraft = findState(store, 'draft', current.id)
  const realDraft = {
    ...store.editableDraft(ownDraft.id, current), id: 'user-created-package-outside-seeds',
    name: '用户实际创建的场景包', baseUpdatedAt: undefined
  }
  const real = store.submitDraft(withTrial(realDraft, store, current), current)
  const ownPublished = findState(store, 'published', current.id)
  assert.equal(store.disablePackage(ownPublished.id, reviewer).ok, true)
  const changedExample = copy(store.findPackage(ownPublished.id))
  const realBefore = copy(store.findPackage(real.id))
  account.user = null
  await nextTick()
  account.user = 'late-user-b'
  await nextTick()
  for (const state of ['draft', 'review', 'rejected', 'published', 'disabled']) findState(store, state, 'late-user-b')
  assert.deepEqual(copy(store.findPackage(real.id)), realBefore)
  account.user = 'late-user-a'
  await nextTick()
  const countAfterReturn = store.packages.length
  assert.deepEqual(copy(store.findPackage(real.id)), realBefore)
  assert.deepEqual(copy(store.findPackage(ownPublished.id)), changedExample)
  account.permissions = ['scenario-package:create', 'scenario-package:compose:cross-menu']
  await nextTick()
  assert.equal(store.packages.length, countAfterReturn)
})

test('reset restores all initial states for the current account after switching accounts', async () => {
  const { store, account, hub, beforeSkills } = fixture('first-seed-account')
  account.user = 'reset-seed-account'
  await nextTick()
  store.resetToInitialMock()
  for (const state of ['draft', 'review', 'rejected', 'published', 'upgrade_required', 'degraded', 'paused', 'disabled']) findState(store, state)
  for (const state of ['draft', 'review', 'rejected', 'published', 'disabled']) findState(store, state, account.user)
  const countAfterReset = store.packages.length
  account.user = null
  await nextTick()
  account.user = 'reset-seed-account'
  await nextTick()
  assert.equal(store.packages.length, countAfterReset)
  assert.deepEqual(copy(hub.items), beforeSkills)
})

test('switching accounts after a core Skill is disabled creates own examples without restoring that Skill or losing live dependency health', async () => {
  const { store, account, hub } = fixture('before-core-disable')
  const core = hub.items.find(item => item.name === 'employee-certification-insight')
  assert.ok(core)
  core.onlineStatus = 'disabled'
  const disabledCatalog = copy(hub.items)
  const previousRecords = copy(store.packages)
  account.user = 'after-core-disable'
  await assert.doesNotReject(nextTick(), 'initializing another account must not fail when its example dependencies are now disabled')
  const own = store.packages.filter(item => item.ownerId === account.user)
  for (const state of ['draft', 'review', 'rejected', 'published', 'disabled']) {
    assert.ok(own.some(item => item.status === state), `new account is missing its ${state} example`)
  }
  for (const item of own) {
    const unavailableStep = item.steps.find(step => step.skillId === core.name)
    assert.ok(unavailableStep, 'the historical example must preserve the original declared dependency')
    assert.equal(unavailableStep.dependencyState, 'emergency_disabled')
    assert.equal(item.health.status, 'paused')
    if (item.publishedSnapshot) {
      assert.equal(item.publishedSnapshot.health.status, 'paused')
      assert.equal(store.prepareRunPlan(item.id, actor(account.user, store)).status, 'blocked')
    }
  }
  assert.deepEqual(copy(hub.items), disabledCatalog)
  assert.equal(store.selectableSkills.some(item => item.id === core.name), false)
  for (const previous of previousRecords) assert.deepEqual(copy(store.findPackage(previous.id)), previous)
})
