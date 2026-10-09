import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import * as domain from '../src/domain/scenarioSkillPackages.js'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor, scenarioPmPermissions } from './helpers/scenarioActors.mjs'

const key = 'leai_scenario_skill_packages_v1'
const previousStorage = globalThis.localStorage
const data = new Map()
let failWrite = false
globalThis.localStorage = {
  getItem: name => data.get(name) ?? null,
  setItem(name, value) { if (failWrite) throw new Error('QuotaExceededError'); data.set(name, value) },
  removeItem: name => data.delete(name)
}
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'silent', server: { middlewareMode: true } })
const [{ useScenarioSkillPackagesStore }, { useSkillHubStore }, { useAppStore }] = await Promise.all([
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'), server.ssrLoadModule('/src/stores/skillHub.ts'), server.ssrLoadModule('/src/stores/app.ts')
])
after(async () => { await server.close(); if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage })
const owner = scenarioPmActor('draft-owner', [])
const reviewer = { id: 'draft-reviewer', permissions: ['scenario-package:review'] }
const copy = value => JSON.parse(JSON.stringify(value))

function fixture(reset = true, username = owner.id) {
  if (reset) { data.clear(); failWrite = false }
  setActivePinia(createPinia())
  const app = useAppStore(); app.user = username; app.permissions = username === reviewer.id ? reviewer.permissions : owner.permissions
  const hub = useSkillHubStore()
  const store = useScenarioSkillPackagesStore()
  owner.permissions = scenarioPmPermissions([...store.selectableSkills, ...store.packages.flatMap(item => item.steps)], ['saved-package', ...store.packages.map(item => item.id)])
  const skills = store.selectableSkills.filter(item => ['employee-certification-insight', 'workplace-segment-operations'].includes(item.id))
  const steps = skills.map((skill, index) => domain.createPinnedScenarioStep(skill, { id: skill.id, predecessorId: index ? skills[index - 1].id : null, task: '分析授权业务对象' }))
  const draft = { id: 'saved-package', name: '保存中的场景', description: '跨菜单分析业务情况', targetAudience: '业务运营', ownerId: owner.id, steps }
  return { store, hub, app, draft }
}

function trial(draft, store) {
  const testRequest = { input: '分析当前业务数据', expectedOutput: '节点逐一输出分析结果', sampleOutputs: Object.fromEntries(draft.steps.map(step => [step.id, `${step.id} 的分析结果`])), activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [] }
  return { ...draft, testRequest, testReport: runScenarioSimulation(draft, store.selectableSkills, testRequest, owner) }
}

function publishedFixture() {
  const context = fixture()
  context.store.submitDraft(trial(context.draft, context.store), owner)
  context.published = context.store.approvePackage(context.draft.id, reviewer)
  return context
}

test('save accepts incomplete named drafts, preserves disconnected configuration and strips supplied review authority', () => {
  const { store, draft } = fixture()
  assert.equal(typeof store.saveDraft, 'function', 'named unfinished configuration needs a save operation')
  const saved = store.saveDraft({ ...draft, description: '', targetAudience: '', steps: [], status: 'published', version: 'v99.0.0', onlineStatus: 'published', publishedSnapshot: draft, approvedAt: 'forged', auditEvents: [{ type: 'approved', actorId: reviewer.id }] }, owner)
  assert.equal(saved.status, 'draft'); assert.equal(saved.version, 'v1.0.0'); assert.equal(saved.onlineStatus, 'unpublished')
  assert.equal(saved.publishedSnapshot, undefined); assert.equal(saved.approvedAt, undefined)
  assert.ok(!saved.auditEvents.some(event => ['approved', 'published'].includes(event.type)))
  assert.equal(store.prepareRunPlan(draft.id, owner).status, 'blocked')
  const editing = store.editableDraft(draft.id, owner)
  editing.steps = draft.steps.map(step => ({ ...step, predecessorId: null }))
  const disconnected = store.saveDraft(editing, owner)
  assert.deepEqual(disconnected.steps.map(step => step.predecessorId), [null, null])
  assert.throws(() => store.submitDraft(store.editableDraft(draft.id, owner), owner), /无法提交/)
})

test('save rejects blank names, foreign owners, missing capabilities and obsolete edit baselines without changes', () => {
  const { store, draft } = fixture()
  const before = copy(store.packages)
  for (const invalid of [{ ...draft, id: '' }, { ...draft, name: '  ' }, { ...draft, ownerId: 'other' }]) assert.throws(() => store.saveDraft(invalid, owner))
  for (const permissions of [[], ['scenario-package:create'], ['scenario-package:compose:cross-menu']]) assert.throws(() => store.saveDraft(draft, { ...owner, permissions }))
  assert.deepEqual(copy(store.packages), before)
  store.saveDraft(draft, owner)
  const editing = store.editableDraft(draft.id, owner)
  store.saveDraft({ ...editing, name: '首次保存' }, owner)
  for (const baseUpdatedAt of [undefined, editing.baseUpdatedAt]) assert.throws(() => store.saveDraft({ ...editing, baseUpdatedAt }, owner), /已更新|编辑版本/)
  assert.throws(() => store.saveDraft({ ...editing, ownerId: 'other' }, scenarioPmActor('other', draft.steps)), /所有者|本人/)
  assert.equal(store.findPackage(draft.id).name, '首次保存')
})

test('first published revision save increments once and retains its trusted runnable version through saves and submission', () => {
  const { store, published } = publishedFixture()
  const snapshot = copy(published.publishedSnapshot)
  const editing = store.editableDraft(published.id, owner)
  const saved = store.saveDraft({ ...editing, name: '待完善修订', publishedSnapshot: { ...snapshot, version: 'v99' }, onlineStatus: 'disabled', auditEvents: [] }, owner)
  assert.equal(saved.status, 'draft'); assert.equal(saved.version, 'v1.0.1'); assert.equal(saved.onlineStatus, 'published')
  assert.deepEqual(copy(saved.publishedSnapshot), snapshot)
  assert.equal(store.prepareRunPlan(published.id, owner).version, 'v1.0.0')
  assert.deepEqual(store.actionsFor(published.id, reviewer), ['view', 'edit', 'disable'])
  const again = store.saveDraft(store.editableDraft(published.id, owner), owner)
  assert.equal(again.version, 'v1.0.1')
  const queued = store.submitDraft(trial(store.editableDraft(published.id, owner), store), owner)
  assert.equal(queued.version, 'v1.0.1'); assert.equal(queued.publishedSnapshot.version, 'v1.0.0')
  assert.deepEqual(store.actionsFor(published.id, owner), ['view', 'withdraw'])
  assert.throws(() => store.saveDraft({ ...editing, baseUpdatedAt: queued.updatedAt }, owner), /状态|审核/)
  assert.throws(() => store.approvePackage(published.id, owner), /本人|其他管理员/)
  assert.equal(store.withdrawPackage(published.id, reviewer, queued.updatedAt).ok, false)
})

test('saved disabled revisions stay disabled through review and preserve the same revision after rejection', () => {
  const { store, published } = publishedFixture()
  store.disablePackage(published.id, reviewer)
  const saved = store.saveDraft(store.editableDraft(published.id, owner), owner)
  assert.equal(saved.status, 'draft'); assert.equal(saved.onlineStatus, 'disabled')
  assert.equal(store.prepareRunPlan(published.id, owner).status, 'blocked')
  store.submitDraft(trial(store.editableDraft(published.id, owner), store), owner)
  store.rejectPackage(published.id, reviewer, '补充描述')
  assert.equal(store.saveDraft(store.editableDraft(published.id, owner), owner).version, 'v1.0.1')
  store.submitDraft(trial(store.editableDraft(published.id, owner), store), owner)
  assert.equal(store.approvePackage(published.id, reviewer).status, 'disabled')
})

test('saving a changed draft retains diagnostic reports but stale successful trials cannot authorize submission', () => {
  const { store, draft } = fixture()
  const tested = trial(draft, store)
  store.saveDraft({ ...tested, name: '已改动的名称' }, owner)
  const editing = store.editableDraft(draft.id, owner)
  assert.ok(editing.testReport)
  assert.throws(() => store.submitDraft(editing, owner), /试运行|一致/)
  const failed = trial({ ...editing, steps: editing.steps.map(step => ({ ...step, task: '' })) }, store)
  const saved = store.saveDraft(failed, owner)
  assert.ok(saved.testReport); assert.notEqual(saved.testReport.status, 'passed')
  assert.throws(() => store.submitDraft(store.editableDraft(draft.id, owner), owner))
})

test('saved state survives recreation and account switching without changing ownership or independent review permissions', async () => {
  const { store, draft, app } = fixture()
  store.saveDraft({ ...draft, description: '', steps: [] }, owner)
  app.user = reviewer.id; await nextTick()
  assert.equal(store.findPackage(draft.id).ownerId, owner.id)
  const reloaded = fixture(false, reviewer.id)
  assert.equal(reloaded.store.findPackage(draft.id).description, '')
  assert.deepEqual(reloaded.store.actionsFor(draft.id, reviewer), ['view'])
  assert.ok(reloaded.store.actionsFor(draft.id, owner).includes('edit'))
  reloaded.store.saveDraft({ ...reloaded.store.editableDraft(draft.id, owner), ...draft }, owner)
  reloaded.store.submitDraft(trial(reloaded.store.editableDraft(draft.id, owner), reloaded.store), owner)
  const reviewed = fixture(false, reviewer.id)
  assert.deepEqual(reviewed.store.actionsFor(draft.id, owner), ['view', 'withdraw'])
  assert.deepEqual(reviewed.store.actionsFor(draft.id, reviewer), ['view', 'approve', 'reject'])
  reviewed.store.approvePackage(draft.id, reviewer)
  assert.equal(fixture(false).store.prepareRunPlan(draft.id, owner).status, 'ready')
})

test('malformed and unsupported storage fall back safely and reset replaces saved state durably', () => {
  for (const value of ['{broken', JSON.stringify({ schemaVersion: 0, packages: [] }), JSON.stringify({ schemaVersion: 1, packages: [{ id: 'invalid' }] })]) {
    data.clear(); data.set(key, value)
    const { store } = fixture(false)
    assert.ok(store.packages.length >= 8)
    assert.ok(!store.findPackage('invalid'))
  }
  const { store, draft } = fixture()
  store.saveDraft(draft, owner)
  store.resetToInitialMock()
  assert.equal(fixture(false).store.findPackage(draft.id), undefined)
})

test('separate page instances cannot overwrite a newer saved revision and preserve changes to other packages', () => {
  const { store, draft } = fixture()
  store.saveDraft(draft, owner)
  const oldEdit = store.editableDraft(draft.id, owner)
  const second = fixture(false)
  second.store.saveDraft({ ...second.store.editableDraft(draft.id, owner), name: '另一页面已保存' }, owner)
  assert.throws(() => store.saveDraft({ ...oldEdit, name: '旧页面覆盖' }, owner), /已更新|重新打开/)
  assert.equal(fixture(false).store.findPackage(draft.id).name, '另一页面已保存')
  store.saveDraft({ ...draft, id: 'another-package', name: '独立场景' }, owner)
  const reloaded = fixture(false).store
  assert.equal(reloaded.findPackage(draft.id).name, '另一页面已保存')
  assert.equal(reloaded.findPackage('another-package').name, '独立场景')
  reloaded.resetToInitialMock()
  assert.throws(() => second.store.saveDraft(second.store.editableDraft(draft.id, owner), owner), /已更新|重新打开/)
})

test('administrator revisions preserve ownership, contributors and runtime through storage while using the actual simulation actor', () => {
  const { store, published } = publishedFixture()
  const editor = { id: 'maintenance-admin', permissions: ['scenario-package:review', ...owner.permissions.filter(value => !['scenario-package:create', 'scenario-package:compose:cross-menu'].includes(value))] }
  const editing = store.editableDraft(published.id, editor)
  assert.equal(store.evaluateDraft(editing, editor).ok, true)
  const request = trial(editing, store).testRequest
  const simulated = store.simulateDraft(editing, request, editor)
  assert.notEqual(simulated.status, 'blocked')
  assert.equal(simulated.testerId, editor.id)
  const missingReferences = store.simulateDraft(editing, request, reviewer)
  assert.equal(missingReferences.status, 'blocked')
  assert.ok(missingReferences.issues.some(reason => /引用权限|元数据读取权限/.test(reason)))
  const saved = store.saveDraft({ ...editing, name: '管理员保存的修订' }, editor)
  assert.equal(saved.ownerId, owner.id)
  assert.deepEqual(saved.revisionEditors, [editor.id])
  const reloaded = fixture(false).store
  assert.equal(reloaded.findPackage(published.id).ownerId, owner.id)
  assert.deepEqual(reloaded.findPackage(published.id).revisionEditors, [editor.id])
  assert.equal(reloaded.prepareRunPlan(published.id, owner).version, published.version)
  const revised = reloaded.editableDraft(published.id, editor)
  const retested = reloaded.simulateDraft(revised, request, editor)
  const submitted = reloaded.submitDraft({ ...revised, testRequest: request, testReport: retested }, editor)
  assert.equal(submitted.ownerId, owner.id)
  assert.equal(submitted.submittedBy, editor.id)
  assert.equal(reloaded.reviewDecision(published.id, editor).ok, false)
  assert.equal(reloaded.withdrawPackage(published.id, editor, submitted.updatedAt).ok, true)
  assert.equal(reloaded.findPackage(published.id).version, 'v1.0.1')
})

test('administrator stale saves and withdrawals cannot overwrite a newer page instance', () => {
  const { store, published } = publishedFixture()
  const editor = { id: 'maintenance-admin', permissions: ['*'] }
  const oldEdit = store.editableDraft(published.id, editor)
  const second = fixture(false).store
  second.saveDraft({ ...second.editableDraft(published.id, owner), name: '创建者的新修订' }, owner)
  assert.throws(() => store.saveDraft({ ...oldEdit, name: '过期管理员修订' }, editor), /已更新|重新打开/)
  assert.equal(fixture(false).store.findPackage(published.id).name, '创建者的新修订')
  const review = second.submitDraft(trial(second.editableDraft(published.id, owner), second), owner)
  const another = fixture(false).store
  assert.equal(another.withdrawPackage(published.id, owner, review.updatedAt).ok, true)
  another.submitDraft(trial(another.editableDraft(published.id, owner), another), owner)
  assert.equal(second.withdrawPackage(published.id, owner, review.updatedAt).ok, false)
  assert.equal(fixture(false).store.findPackage(published.id).status, 'review')
})

for (const surface of ['findPackage', 'packages', 'saveDraft result']) {
  test(`${surface} contributor history is detached from the trusted edit and approval record`, () => {
    const { store, published } = publishedFixture()
    const editor = { id: 'maintenance-admin', permissions: ['*'] }
    const saved = store.saveDraft(store.editableDraft(published.id, editor), editor)
    const displayed = surface === 'findPackage' ? store.findPackage(published.id)
      : surface === 'packages' ? store.packages.find(item => item.id === published.id) : saved
    displayed.revisionEditors.splice(0)
    displayed.publishedSnapshot.revisionEditors.push(reviewer.id)
    store.submitDraft(trial(store.editableDraft(published.id, owner), store), owner)
    assert.equal(store.reviewDecision(published.id, editor).ok, false)
    assert.deepEqual(store.findPackage(published.id).revisionEditors, [editor.id, owner.id])
    assert.deepEqual(store.findPackage(published.id).publishedSnapshot.revisionEditors, [owner.id])
    assert.equal(store.prepareRunPlan(published.id, owner).status, 'ready')
  })
}

test('invalid persisted revision contributor arrays are rejected instead of reaching review or runtime checks', () => {
  const { store, draft } = fixture()
  store.saveDraft(draft, owner)
  const raw = data.get(key)
  for (const revisionEditors of [42, 'creator', [42], [''], ['   ']]) {
    const corrupt = JSON.parse(raw)
    corrupt.packages.find(item => item.id === draft.id).revisionEditors = revisionEditors
    data.set(key, JSON.stringify(corrupt))
    assert.equal(fixture(false).store.findPackage(draft.id), undefined)
  }
})

test('corrupted persisted trial structures cannot restore a record that breaks report rendering', () => {
  const { store, draft } = fixture()
  store.saveDraft(trial(draft, store), owner)
  const corrupt = JSON.parse(data.get(key))
  corrupt.packages.find(item => item.id === draft.id).testReport.nodes = null
  data.set(key, JSON.stringify(corrupt))
  assert.equal(fixture(false).store.findPackage(draft.id), undefined)
})

for (const field of ['submittedAt', 'submitterId']) {
  test(`persisted numeric ${field} cannot reach review action evaluation`, () => {
    const { store, draft } = fixture()
    store.submitDraft(trial(draft, store), owner)
    const corrupt = JSON.parse(data.get(key))
    corrupt.packages.find(item => item.id === draft.id)[field] = 42
    data.set(key, JSON.stringify(corrupt))
    const restored = fixture(false).store
    assert.doesNotThrow(() => restored.packages.forEach(item => restored.actionsFor(item.id, reviewer)))
    assert.equal(restored.findPackage(draft.id), undefined)
  })
}

test('persisted optional workflow and node text fields reject non-string values', () => {
  const { store, draft } = fixture()
  store.saveDraft(draft, owner)
  const saved = data.get(key)
  for (const field of ['baseUpdatedAt', 'approvedAt', 'publishedAt', 'submittedBy', 'reviewedAt', 'reviewedBy', 'reviewNote', 'degradationNote']) {
    const corrupt = JSON.parse(saved)
    corrupt.packages.find(item => item.id === draft.id)[field] = { invalid: true }
    data.set(key, JSON.stringify(corrupt))
    assert.equal(fixture(false).store.findPackage(draft.id), undefined, field)
  }
  for (const field of ['condition', 'task', 'fixedRequirements', 'expectedOutput', 'inputDescription']) {
    const corrupt = JSON.parse(saved)
    corrupt.packages.find(item => item.id === draft.id).steps[0][field] = 42
    data.set(key, JSON.stringify(corrupt))
    assert.equal(fixture(false).store.findPackage(draft.id), undefined, field)
  }
})

test('storage failure cannot claim successful save or change workflow, audit and runtime in memory', () => {
  const { store, published } = publishedFixture()
  const before = copy(store.findPackage(published.id))
  const disk = data.get(key)
  failWrite = true
  assert.throws(() => store.saveDraft(store.editableDraft(published.id, owner), owner), /保存|存储/)
  assert.throws(() => store.submitDraft(trial(store.editableDraft(published.id, owner), store), owner), /保存|存储/)
  assert.equal(store.disablePackage(published.id, reviewer).ok, false)
  assert.deepEqual(copy(store.findPackage(published.id)), before)
  assert.equal(data.get(key), disk)
  failWrite = false
  store.submitDraft(trial(store.editableDraft(published.id, owner), store), owner)
  const queued = copy(store.findPackage(published.id))
  failWrite = true
  assert.throws(() => store.approvePackage(published.id, reviewer), /保存|存储/)
  assert.throws(() => store.rejectPackage(published.id, reviewer, '需完善'), /保存|存储/)
  assert.deepEqual(copy(store.findPackage(published.id)), queued)
  failWrite = false
})

test('reenabling the same catalog version clears cached unavailability on the reviewed snapshot without republishing', () => {
  const { store, hub } = fixture()
  const item = store.findPackage('seed-scenario-paused')
  assert.equal(item.health.status, 'paused')
  const dependency = hub.items.find(skill => skill.name === 'legacy-inventory-alert')
  dependency.onlineStatus = 'published'
  const restored = store.findPackage(item.id)
  assert.equal(restored.health.status, 'healthy')
  assert.equal(restored.publishedSnapshot.health.status, 'healthy')
  assert.equal(restored.version, item.version)
  assert.deepEqual(restored.auditEvents, item.auditEvents)
  assert.equal(store.prepareRunPlan(item.id, owner).status, 'ready')
  dependency.onlineStatus = 'disabled'
  assert.equal(store.prepareRunPlan(item.id, owner).status, 'blocked')
})

test('publishing a newer catalog version cannot revive a disabled pinned version in an approved package', () => {
  const { store, hub } = fixture()
  const item = store.findPackage('seed-scenario-paused')
  const dependency = hub.items.find(skill => skill.name === 'legacy-inventory-alert')
  dependency.online = 'v1.0.0'
  dependency.onlineStatus = 'published'
  const restored = store.findPackage(item.id)
  assert.equal(restored.health.status, 'paused')
  assert.equal(restored.publishedSnapshot.health.status, 'paused')
  assert.equal(restored.publishedSnapshot.steps.find(step => step.skillId === dependency.name).pinnedVersion, 'v0.9.0')
  assert.equal(restored.publishedSnapshot.steps.find(step => step.skillId === dependency.name).dependencyState, 'emergency_disabled')
  assert.equal(store.prepareRunPlan(item.id, owner).status, 'blocked')
})

test('a previously available approved pin still shows an upgrade warning when a newer version is published', () => {
  const { store, hub, published } = publishedFixture()
  const dependency = hub.items.find(skill => skill.name === published.steps[0].skillId)
  dependency.online = 'v9.0.0'
  assert.equal(store.findPackage(published.id).health.status, 'upgrade_required')
  assert.equal(store.findPackage(published.id).publishedSnapshot.steps[0].dependencyState, 'update_available')
  assert.equal(store.prepareRunPlan(published.id, owner).status, 'ready')
})

test('dependency recovery never clears expired pins, missing skills or changed version warnings', () => {
  const { store, hub, draft } = fixture()
  store.saveDraft({ ...draft, steps: [{ ...draft.steps[0], dependencyState: 'expired' }, draft.steps[1]] }, owner)
  assert.equal(store.findPackage(draft.id).health.status, 'paused')
  const dependency = hub.items.find(skill => skill.name === draft.steps[0].skillId)
  dependency.onlineStatus = 'disabled'
  assert.equal(store.findPackage(draft.id).health.status, 'paused')
  store.saveDraft(store.editableDraft(draft.id, owner), owner)
  dependency.onlineStatus = 'published'
  assert.equal(store.findPackage(draft.id).steps[0].dependencyState, 'expired')
  const editing = store.editableDraft(draft.id, owner)
  editing.steps[0].dependencyState = 'unavailable'
  store.saveDraft(editing, owner)
  dependency.online = 'v9.0.0'
  assert.equal(store.findPackage(draft.id).health.status, 'paused')
  assert.equal(store.findPackage(draft.id).steps[0].dependencyState, 'unavailable')
  assert.equal(store.findPackage(draft.id).steps[0].pinnedVersion, draft.steps[0].pinnedVersion)
  hub.items.splice(hub.items.indexOf(dependency), 1)
  assert.equal(store.findPackage(draft.id).health.status, 'paused')
})
