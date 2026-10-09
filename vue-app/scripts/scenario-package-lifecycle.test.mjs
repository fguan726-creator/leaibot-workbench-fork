import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import * as domain from '../src/domain/scenarioSkillPackages.js'
import { scenarioPmActor, scenarioPmPermissions } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }

const owner = scenarioPmActor('lifecycle-owner', ['employee-certification-insight', 'workplace-segment-operations'], ['lifecycle-package'])
const reviewer = { id: 'independent-reviewer', permissions: ['scenario-package:review'] }
const stranger = { id: 'stranger', permissions: ['scenario-package:create', 'scenario-package:compose:cross-menu'] }
const copy = value => JSON.parse(JSON.stringify(value))
const server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'silent', server: { middlewareMode: true } })
const [{ useScenarioSkillPackagesStore }, { useSkillHubStore }] = await Promise.all([
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'),
  server.ssrLoadModule('/src/stores/skillHub.ts')
])
after(async () => {
  await server.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})

function withTrial(draft, catalog) {
  const testRequest = {
    input: '检查当前节点的输入和输出', expectedOutput: '各节点返回对应处理结果',
    activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [],
    sampleOutputs: Object.fromEntries(draft.steps.map(step => [step.id, `${step.id} 的模拟结果`]))
  }
  return { ...draft, testRequest, testReport: runScenarioSimulation(draft, catalog, testRequest, owner) }
}

function fixture() {
  setActivePinia(createPinia())
  const store = useScenarioSkillPackagesStore()
  const hub = useSkillHubStore()
  const steps = store.selectableSkills.filter(item => ['employee-certification-insight', 'workplace-segment-operations'].includes(item.id))
    .map((item, index, skills) => domain.createPinnedScenarioStep(item, {
      id: item.id, predecessorId: index ? skills[index - 1].id : null,
      task: `分析${item.name}的当前业务信息`
    }))
  owner.permissions = scenarioPmPermissions(steps, ['lifecycle-package'])
  const draft = withTrial({ id: 'lifecycle-package', ownerId: owner.id, name: '原版场景', description: '分析当前授权对象的情况', targetAudience: '运营人员', steps }, store.selectableSkills)
  return { store, hub, draft }
}

function publishedFixture() {
  const context = fixture()
  context.store.submitDraft(context.draft, owner)
  context.published = context.store.approvePackage(context.draft.id, reviewer)
  return context
}

test('lifecycle actions follow owner permissions and independent review, not administrator identity alone', () => {
  const { store, draft } = fixture()
  store.submitDraft(draft, owner)
  assert.equal(typeof store.actionsFor, 'function', 'the store must enforce the shared action policy')
  assert.deepEqual(store.actionsFor(draft.id, owner), ['view', 'withdraw'])
  assert.deepEqual(store.actionsFor(draft.id, reviewer), ['view', 'approve', 'reject'])
  assert.deepEqual(store.actionsFor(draft.id, stranger), ['view'])
  assert.equal(store.editableDraft(draft.id, owner), null)
  store.approvePackage(draft.id, reviewer)
  assert.deepEqual(store.actionsFor(draft.id, owner), ['view', 'edit'])
  assert.deepEqual(store.actionsFor(draft.id, reviewer), ['view', 'edit', 'disable'])
  assert.deepEqual(store.actionsFor(draft.id, { ...owner, permissions: [] }), ['view'])
  assert.equal(store.editableDraft(draft.id, stranger), null)
})

test('opening or cancelling edits cannot mutate the published package or its trusted audit snapshot', () => {
  const { store, published } = publishedFixture()
  const before = copy(store.findPackage(published.id))
  const draft = store.editableDraft(published.id, owner)
  assert.equal(draft.baseUpdatedAt, before.updatedAt)
  draft.name = '未保存修改'
  draft.steps[0].permissions.menu.push('forged:permission')
  assert.deepEqual(copy(store.findPackage(published.id)), before)
  const read = store.findPackage(published.id)
  read.publishedSnapshot.auditEvents[0].actorId = 'forged'
  read.publishedSnapshot.steps[0].task = 'forged'
  assert.deepEqual(copy(store.findPackage(published.id)), before)
})

test('published revisions keep the old version runnable through review and rejection until independent approval', () => {
  const { store, published } = publishedFixture()
  const oldTask = published.steps[0].task
  const edited = store.editableDraft(published.id, owner)
  edited.name = '新版场景'
  edited.steps[0].task = '新版只分析新增业务对象'
  const queued = store.submitDraft(withTrial(edited, store.selectableSkills), owner)
  assert.equal(queued.status, 'review')
  assert.equal(queued.version, 'v1.0.1')
  assert.equal(queued.onlineStatus, 'published')
  assert.equal(queued.publishedSnapshot.version, 'v1.0.0')
  assert.deepEqual(store.actionsFor(published.id, owner), ['view', 'withdraw'])
  assert.equal(store.disablePackage(published.id, owner).ok, false)
  assert.equal(store.prepareRunPlan(published.id, owner).version, 'v1.0.0')
  assert.equal(store.prepareRunPlan(published.id, owner).steps[0].task, oldTask)
  assert.equal(domain.evaluateRuntimeAccess(queued, owner).effectiveSteps[0].task, oldTask)
  store.rejectPackage(published.id, reviewer, '补充范围')
  assert.equal(store.prepareRunPlan(published.id, owner).status, 'ready')
  const rejectedDraft = store.editableDraft(published.id, owner)
  store.submitDraft(withTrial(rejectedDraft, store.selectableSkills), owner)
  const updated = store.approvePackage(published.id, reviewer)
  assert.equal(updated.version, 'v1.0.1')
  assert.equal(updated.publishedSnapshot.version, 'v1.0.1')
  assert.equal(store.prepareRunPlan(published.id, owner).steps[0].task, '新版只分析新增业务对象')
  assert.equal(updated.auditEvents.filter(event => event.type === 'approved').length, 2)
})

test('pending review stays read-only until its owner withdraws the exact viewed submission', () => {
  const { store, draft } = fixture()
  const submitted = store.submitDraft(draft, owner)
  const before = copy(store.findPackage(draft.id))
  assert.deepEqual(store.actionsFor(draft.id, owner), ['view', 'withdraw'])
  assert.equal(store.editableDraft(draft.id, owner), null)
  assert.throws(() => store.submitDraft({ ...draft, baseUpdatedAt: submitted.updatedAt }, owner), /状态|账号|审核/)
  assert.equal(store.withdrawPackage(draft.id, reviewer, submitted.updatedAt).ok, false)
  assert.equal(store.withdrawPackage(draft.id, owner).ok, false)
  assert.equal(store.withdrawPackage(draft.id, owner, 'stale').ok, false)
  assert.deepEqual(copy(store.findPackage(draft.id)), before)
  const result = store.withdrawPackage(draft.id, owner, submitted.updatedAt)
  assert.equal(result.ok, true)
  assert.equal(result.package.status, 'draft')
  assert.equal(result.package.submittedBy, undefined)
  assert.equal(result.package.auditEvents.at(-1).type, 'withdrawn')
  assert.ok(store.editableDraft(draft.id, owner))
  assert.equal(store.withdrawPackage(draft.id, owner, result.package.updatedAt).ok, false)
})

test('only package administrators can disable or enable and approval cannot silently re-enable a disabled package', () => {
  const { store, published } = publishedFixture()
  assert.equal(store.disablePackage(published.id, stranger).ok, false)
  assert.equal(store.enablePackage(published.id, reviewer).ok, false)
  assert.equal(store.disablePackage(published.id, reviewer).ok, true)
  assert.equal(store.prepareRunPlan(published.id, owner).status, 'blocked')
  assert.equal(store.disablePackage(published.id, reviewer).ok, false)
  const edited = store.editableDraft(published.id, owner)
  edited.steps[0].task = '修改后的禁用版任务'
  store.submitDraft(withTrial(edited, store.selectableSkills), owner)
  assert.deepEqual(store.actionsFor(published.id, owner), ['view', 'withdraw'])
  assert.equal(store.enablePackage(published.id, owner).ok, false)
  const result = store.approvePackage(published.id, reviewer)
  assert.equal(result.status, 'disabled')
  assert.equal(result.onlineStatus, 'disabled')
  assert.equal(result.publishedSnapshot.version, 'v1.0.1')
  assert.equal(store.prepareRunPlan(published.id, owner).status, 'blocked')
  assert.equal(store.enablePackage(published.id, reviewer).ok, true)
  assert.equal(store.prepareRunPlan(published.id, owner).steps[0].task, '修改后的禁用版任务')
})

test('disabling during revision review preserves independent review and enabling uses the previous reviewed version', () => {
  const { store, published } = publishedFixture()
  const edited = store.editableDraft(published.id, owner)
  edited.name = '审核中新版'
  store.submitDraft(withTrial(edited, store.selectableSkills), owner)
  assert.equal(store.disablePackage(published.id, reviewer).ok, true)
  assert.equal(store.findPackage(published.id).status, 'review')
  assert.equal(store.reviewDecision(published.id, reviewer).ok, true)
  assert.equal(store.enablePackage(published.id, reviewer).ok, true)
  assert.equal(store.prepareRunPlan(published.id, owner).version, 'v1.0.0')
  assert.equal(store.findPackage(published.id).status, 'review')
})

test('revision submission rejects stale baselines, forged ownership or audits and stale trials without mutation', () => {
  const { store, published } = publishedFixture()
  const baseline = copy(store.findPackage(published.id))
  const edited = store.editableDraft(published.id, owner)
  for (const patch of [{ baseUpdatedAt: undefined }, { baseUpdatedAt: 'old' }, { ownerId: stranger.id }]) {
    assert.throws(() => store.submitDraft(withTrial({ ...edited, ...patch }, store.selectableSkills), owner))
    assert.deepEqual(copy(store.findPackage(published.id)), baseline)
  }
  assert.throws(() => store.submitDraft({ ...edited, steps: edited.steps.map(step => ({ ...step, task: 'changed' })) }, owner), /试运行/)
  const forged = withTrial({ ...edited, publishedSnapshot: { status: 'published' }, auditEvents: [{ type: 'approved', actorId: owner.id }] }, store.selectableSkills)
  store.submitDraft(forged, owner)
  assert.throws(() => store.approvePackage(published.id, owner), /本人|其他管理员/)
  assert.deepEqual(copy(store.findPackage(published.id).publishedSnapshot), baseline.publishedSnapshot)
  assert.throws(() => store.submitDraft(withTrial(edited, store.selectableSkills), owner), /审核|状态|更新|版本/)
})

test('approval rechecks trial fingerprint after a same-version catalog permission change and leaves review untouched', () => {
  const { store, hub, draft } = fixture()
  store.submitDraft(draft, owner)
  const before = copy(store.findPackage(draft.id))
  const skill = hub.items.find(item => item.name === draft.steps[0].skillId)
  skill.permissions = { menu: ['menu:new'], skill: ['skill:new'], data: ['data:new'], action: ['action:new'] }
  assert.throws(() => store.approvePackage(draft.id, reviewer), /试运行|一致/)
  assert.deepEqual(copy(store.findPackage(draft.id).auditEvents), before.auditEvents)
  assert.equal(store.findPackage(draft.id).status, 'review')
})

test('published snapshot dependency health refreshes independently of an edited revision', () => {
  const { store, hub, published } = publishedFixture()
  const edited = store.editableDraft(published.id, owner)
  store.submitDraft(withTrial(edited, store.selectableSkills), owner)
  hub.items.find(item => item.name === published.steps[0].skillId).onlineStatus = 'disabled'
  const current = store.findPackage(published.id)
  assert.equal(current.publishedSnapshot.health.status, 'paused')
  assert.equal(store.prepareRunPlan(published.id, owner).status, 'blocked')
})

test('a lifecycle change invalidates an already-open edit even if its workflow status remains editable', () => {
  const { store, published } = publishedFixture()
  const edited = store.editableDraft(published.id, owner)
  const changed = store.disablePackage(published.id, reviewer)
  assert.ok(Date.parse(changed.package.updatedAt) > Date.parse(edited.baseUpdatedAt))
  const before = copy(store.findPackage(published.id))
  assert.throws(() => store.submitDraft(withTrial(edited, store.selectableSkills), owner), /已更新|编辑版本/)
  assert.deepEqual(copy(store.findPackage(published.id)), before)
})

test('publication always requires a current complete trial, including independently submitted records', () => {
  const { store, draft } = fixture()
  const queued = store.submitDraft(draft, owner)
  assert.throws(() => domain.publishScenarioPackage({ ...queued, testReport: undefined }, reviewer, new Date().toISOString(), store.selectableSkills), /试运行/)
  assert.throws(() => domain.publishScenarioPackage({ ...queued, name: '审批前被改名' }, reviewer, new Date().toISOString(), store.selectableSkills), /试运行|一致/)
  assert.equal(store.findPackage(draft.id).status, 'review')
})

test('the legacy resubmit entry also rejects missing or stale revision baselines', () => {
  const { store, draft } = fixture()
  store.submitDraft(draft, owner)
  store.rejectPackage(draft.id, reviewer, '完善说明')
  const edited = store.editableDraft(draft.id, owner)
  const before = copy(store.findPackage(draft.id))
  for (const baseUpdatedAt of [undefined, 'outdated']) {
    assert.throws(() => store.resubmitDraft({ ...edited, baseUpdatedAt }, owner), /编辑版本|已更新/)
    assert.deepEqual(copy(store.findPackage(draft.id)), before)
  }
  assert.equal(store.resubmitDraft(edited, owner).status, 'review')
})

for (const action of ['approvePackage', 'rejectPackage']) {
  test(`${action} binds confirmation to the viewed submission and rejects a replacement submission`, () => {
    const { store, draft } = fixture()
    const first = store.submitDraft(draft, owner)
    store.rejectPackage(draft.id, reviewer, '补充业务范围')
    const editing = store.editableDraft(draft.id, owner)
    editing.name = '驳回后新提交'
    const second = store.submitDraft(withTrial(editing, store.selectableSkills), owner)
    const before = copy(store.findPackage(draft.id))
    assert.throws(() => store[action](draft.id, reviewer, '审核说明', first.updatedAt), /已更新|重新打开|提交版本/)
    assert.deepEqual(copy(store.findPackage(draft.id)), before)
    const result = store[action](draft.id, reviewer, '审核说明', second.updatedAt)
    assert.equal(result.status, action === 'approvePackage' ? 'published' : 'rejected')
    assert.equal(result.name, '驳回后新提交')
  })
}
