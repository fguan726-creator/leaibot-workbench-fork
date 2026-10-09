import assert from 'node:assert/strict'
import test from 'node:test'
import * as domain from '../src/domain/scenarioSkillPackages.js'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'

const at = '2026-09-11T12:00:00.000Z'
const later = '2026-09-11T12:01:00.000Z'
const authorPermissions = ['scenario-package:create', 'scenario-package:compose:cross-menu']
const catalog = ['customer-query', 'order-query'].map(id => ({
  id, name: id, menu: `menu-${id}`, version: 'v1.0.0', online: 'v1.0.0', status: 'published', onlineStatus: 'published',
  permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}:read`], action: [`action:${id}:run`] }
}))
// A PM gets only explicit authoring, reference and runtime permissions, never a policy wildcard.
const pm = {
  id: 'product-manager',
  permissions: {
    policy: [...authorPermissions, 'scenario-package:role-package:use', ...catalog.flatMap(skill => [`skill:${skill.id}:metadata:read`, `skill:${skill.id}:reference`])],
    menu: ['menu:customer-query', 'menu:order-query'],
    skill: ['skill:customer-query', 'skill:order-query'],
    data: ['data:customer-query:read', 'data:order-query:read'],
    action: ['action:customer-query:run', 'action:order-query:run']
  }
}
const reviewer = { id: 'platform-reviewer', permissions: ['scenario-package:review'] }
const copy = value => JSON.parse(JSON.stringify(value))

test('standalone domain examples are owned by a PM rather than an administrator', () => {
  assert.ok(domain.createSeedScenarioPackages().every(item => item.ownerId === 'pm-li'))
})

function draft() {
  return {
    id: 'role-package', ownerId: pm.id, name: '客户订单联合分析', description: '分析授权客户与订单情况', targetAudience: '客户运营人员',
    steps: catalog.map((skill, index) => domain.createPinnedScenarioStep(skill, { id: skill.id, predecessorId: index ? catalog[index - 1].id : null, task: '分析本次授权对象的业务情况' }))
  }
}

function tested(input = draft(), actor = pm) {
  const testRequest = {
    input: '分析当前授权范围', expectedOutput: '返回节点逐一分析结果', activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [],
    sampleOutputs: { 'customer-query': '客户样例分析结果', 'order-query': '订单样例分析结果' }
  }
  return { ...input, testRequest, testReport: runScenarioSimulation(input, catalog, testRequest, actor, at) }
}

function queued() {
  return domain.submitScenarioPackage(tested(), pm, at, catalog)
}

function published() {
  return domain.publishScenarioPackage(queued(), reviewer, later, catalog)
}

test('package responsibilities follow policy permissions rather than usernames or supplied role labels', () => {
  assert.equal(typeof domain.scenarioPackageRole, 'function')
  const cases = [
    [{ id: 'admin', permissions: authorPermissions }, 'pm'],
    [{ id: 'pm-li', permissions: ['*'], role: 'pm' }, 'admin'],
    [{ id: 'someone', permissions: ['scenario-package:review'] }, 'admin'],
    [{ id: 'someone', permissions: [...authorPermissions, 'scenario-package:review'] }, 'admin'],
    [{ id: 'admin', permissions: [], role: 'admin' }, 'viewer'],
    [{ id: 'someone', permissions: ['scenario-package:create'] }, 'viewer'],
    [{ id: 'someone', permissions: ['scenario-package:compose:cross-menu'] }, 'viewer'],
    [{ id: 'someone', permissions: { policy: ['*'] } }, 'admin'],
    [{ id: 'someone', permissions: { policy: [...authorPermissions, 'scenario-package:review'] } }, 'admin'],
    [{ id: 'someone', permissions: { policy: authorPermissions, menu: ['*'] } }, 'pm'],
    [{ id: 'someone', permissions: { menu: ['*'], skill: ['*'], data: ['*'], action: ['*'] } }, 'viewer'],
    [{}, 'viewer']
  ]
  for (const [actor, expected] of cases) assert.equal(domain.scenarioPackageRole(actor), expected, JSON.stringify(actor))
})

test('authoring capability requires a valid actor and both policy permissions independently of review responsibility', () => {
  assert.equal(typeof domain.canAuthorScenarioPackage, 'function')
  for (const permissions of [authorPermissions, ['*'], [...authorPermissions, 'scenario-package:review'], { policy: ['*'] }, { policy: authorPermissions }]) {
    assert.equal(domain.canAuthorScenarioPackage({ id: 'current-author', permissions }), true)
    for (const id of [undefined, null, '', '   ', 123]) {
      assert.equal(domain.canAuthorScenarioPackage({ id, permissions }), false)
    }
  }
  for (const permissions of [[], ['scenario-package:review'], ['scenario-package:create'], ['scenario-package:compose:cross-menu'], { menu: ['*'], skill: ['*'], data: ['*'], action: ['*'] }]) {
    assert.equal(domain.canAuthorScenarioPackage({ id: 'admin', permissions, role: 'admin' }), false)
  }
  assert.equal(domain.canAuthorScenarioPackage(undefined), false)
})

test('the PM can save unfinished work but missing either authoring permission denies PM and admin save, edit and submission', () => {
  const incomplete = { ...draft(), description: '', targetAudience: '', steps: [] }
  const saved = domain.saveScenarioPackageDraft(incomplete, pm, at)
  assert.equal(saved.status, 'draft'); assert.equal(saved.ownerId, pm.id)
  for (const reviewPermissions of [[], ['scenario-package:review']]) {
    for (const missing of authorPermissions) {
      const actor = copy(pm); actor.permissions.policy = [...actor.permissions.policy.filter(permission => permission !== missing), ...reviewPermissions]
      assert.equal(domain.scenarioPackageActions(saved, actor).includes('edit'), false)
      assert.equal(domain.editableScenarioPackageDraft(saved, actor), null)
      assert.throws(() => domain.saveScenarioPackageDraft(incomplete, actor, at), /权限|PM/)
      assert.equal(domain.evaluatePackageForPublish(draft(), actor).ok, false)
      assert.throws(() => domain.submitScenarioPackage(tested(), actor, at, catalog), /权限|PM/)
    }
  }
})

test('administrators with wildcard or combined permissions can save, edit and submit their own content for independent review', () => {
  for (const permissions of [
    ['*'],
    [...Object.values(pm.permissions).flat(), 'scenario-package:review'],
    { ...pm.permissions, policy: ['*'] },
    { ...pm.permissions, policy: [...pm.permissions.policy, 'scenario-package:review'] }
  ]) {
    const admin = { id: 'author-admin', permissions }
    const ownDraft = { ...draft(), ownerId: admin.id }
    assert.equal(domain.scenarioPackageRole(admin), 'admin', 'authoring does not remove governance capability')
    assert.equal(domain.evaluatePackageForPublish(ownDraft, admin).ok, true)
    const saved = domain.saveScenarioPackageDraft({ ...ownDraft, description: '', targetAudience: '', steps: [] }, admin, at)
    assert.equal(saved.status, 'draft'); assert.equal(saved.ownerId, admin.id)
    const reopened = domain.editableScenarioPackageDraft(saved, admin)
    assert.equal(reopened.id, saved.id); assert.equal(reopened.baseUpdatedAt, saved.updatedAt)
    const review = domain.submitScenarioPackage(tested({ ...reopened, ...ownDraft }, admin), admin, later, catalog, saved)
    assert.equal(review.status, 'review'); assert.equal(review.submittedBy, admin.id)
    assert.deepEqual(domain.scenarioPackageActions(review, admin), ['view', 'withdraw'])
    assert.equal(domain.editableScenarioPackageDraft(review, admin), null)
    assert.throws(() => domain.saveScenarioPackageDraft({ ...ownDraft, baseUpdatedAt: review.updatedAt }, admin, later, review), /待审核|状态/)
    assert.throws(() => domain.submitScenarioPackage(tested({ ...ownDraft, baseUpdatedAt: review.updatedAt }, admin), admin, later, catalog, review), /待审核|状态/)
    assert.throws(() => domain.publishScenarioPackage(review, admin, later, catalog), /本人|其他管理员/)
    assert.throws(() => domain.rejectScenarioPackage(review, admin, '需完善', later), /本人|其他管理员/)
    const approved = domain.publishScenarioPackage(review, reviewer, later, catalog)
    assert.equal(approved.reviewedBy, reviewer.id)
    for (const status of ['draft', 'rejected', 'published', 'disabled']) {
      const record = { ...approved, status }
      assert.equal(domain.scenarioPackageActions(record, admin).includes('edit'), true, status)
      const before = structuredClone(record)
      const editing = domain.editableScenarioPackageDraft(record, admin)
      assert.equal(editing.ownerId, admin.id); assert.equal(editing.baseUpdatedAt, record.updatedAt)
      const revised = domain.saveScenarioPackageDraft({ ...editing, name: '本人修订' }, admin, later, record)
      assert.equal(revised.name, '本人修订'); assert.equal(revised.status, 'draft')
      assert.deepEqual(record, before, 'editing must not mutate the trusted record')
      if (['published', 'disabled'].includes(status)) {
        assert.equal(revised.version, 'v1.0.1')
        assert.equal(revised.publishedSnapshot.name, record.name)
      }
    }
  }
})

test('admin authoring retains other-owner, reference, current-trial, version and edit-conflict checks', () => {
  const admin = { ...copy(pm), id: 'author-admin' }
  admin.permissions.policy.push('scenario-package:review')
  const ownDraft = { ...draft(), ownerId: admin.id }
  const savedByPm = domain.saveScenarioPackageDraft(draft(), pm, at)
  assert.deepEqual(domain.scenarioPackageActions(savedByPm, admin), ['view'])
  assert.equal(domain.editableScenarioPackageDraft(savedByPm, admin), null)
  assert.throws(() => domain.saveScenarioPackageDraft({ ...ownDraft, baseUpdatedAt: savedByPm.updatedAt }, admin, later, savedByPm), /所有者/)
  assert.throws(() => domain.submitScenarioPackage(tested(ownDraft, admin), admin, later, catalog, savedByPm), /所有者/)
  const noReference = copy(admin)
  noReference.permissions.policy = noReference.permissions.policy.filter(permission => permission !== 'skill:customer-query:reference')
  assert.equal(domain.evaluatePackageForPublish(ownDraft, noReference).ok, false)
  assert.throws(() => domain.submitScenarioPackage(tested(ownDraft, admin), noReference, at, catalog), /引用权限/)
  assert.throws(() => domain.submitScenarioPackage(ownDraft, admin, at, catalog), /试运行/)
  const ready = tested(ownDraft, admin)
  assert.throws(() => domain.submitScenarioPackage({ ...ready, description: '试运行后修改了场景' }, admin, at, catalog), /试运行/)
  assert.throws(() => domain.submitScenarioPackage(ready, admin, at, catalog.map(skill => ({ ...skill, online: 'v1.0.1' }))), /版本|试运行/)
  const saved = domain.saveScenarioPackageDraft(ownDraft, admin, at)
  const editing = domain.editableScenarioPackageDraft(saved, admin)
  assert.throws(() => domain.saveScenarioPackageDraft({ ...editing, baseUpdatedAt: 'stale' }, admin, later, saved), /已更新|编辑版本/)
  assert.throws(() => domain.submitScenarioPackage(tested({ ...editing, baseUpdatedAt: 'stale' }, admin), admin, later, catalog, saved), /已更新|编辑版本/)
})

test('PM authoring capability never grants review or lifecycle management', () => {
  const review = queued()
  const otherPm = { ...pm, id: 'different-product-manager' }
  const online = published()
  const disabled = domain.transitionScenarioPackage(online, reviewer, 'disable', later).package
  for (const actor of [pm, otherPm, { id: 'admin', permissions: [] }]) {
    assert.ok(!domain.scenarioPackageActions(review, actor).includes('approve'))
    assert.ok(!domain.scenarioPackageActions(review, actor).includes('reject'))
    assert.throws(() => domain.publishScenarioPackage(review, actor, later, catalog), /权限|本人|管理员/)
    assert.throws(() => domain.rejectScenarioPackage(review, actor, '需完善', later), /权限|本人|管理员/)
    assert.equal(domain.transitionScenarioPackage(online, actor, 'disable', later).ok, false)
    assert.equal(domain.transitionScenarioPackage(disabled, actor, 'enable', later).ok, false)
  }
})

test('a historical administrator-owned submission stays read-only and owner or submitter self-review remains forbidden', () => {
  const review = queued()
  const promotedOwner = { id: pm.id, permissions: ['*'] }
  assert.deepEqual(domain.scenarioPackageActions(review, promotedOwner), ['view', 'withdraw'])
  assert.equal(domain.editableScenarioPackageDraft(review, promotedOwner), null)
  assert.throws(() => domain.publishScenarioPackage(review, promotedOwner, later, catalog), /本人|其他管理员/)
  assert.throws(() => domain.rejectScenarioPackage(review, promotedOwner, '说明', later), /本人|其他管理员/)
  for (const field of ['submittedBy', 'submitterId']) {
    assert.equal(domain.evaluateScenarioPackageReview({ ...review, [field]: reviewer.id }, reviewer).ok, false)
  }
})

test('PM authoring through independent admin approval preserves publication and explicit runtime boundaries', () => {
  const saved = domain.saveScenarioPackageDraft(draft(), pm, at)
  const editing = domain.editableScenarioPackageDraft(saved, pm)
  const review = domain.submitScenarioPackage(tested(editing), pm, later, catalog, saved)
  assert.deepEqual(domain.scenarioPackageActions(review, pm), ['view', 'withdraw'])
  assert.deepEqual(domain.scenarioPackageActions(review, reviewer), ['view', 'approve', 'reject'])
  const online = domain.publishScenarioPackage(review, reviewer, later, catalog)
  assert.equal(online.ownerId, pm.id); assert.equal(online.reviewedBy, reviewer.id)
  assert.deepEqual(domain.scenarioPackageActions(online, pm), ['view', 'edit'])
  assert.deepEqual(domain.scenarioPackageActions(online, reviewer), ['view', 'edit', 'disable'])
  assert.equal(domain.evaluateRuntimeAccess(online, pm).status, 'ready')
  assert.equal(domain.evaluateRuntimeAccess(online, reviewer).status, 'blocked', 'review permission must not become package-use permission')
  const caller = copy(pm); caller.permissions.policy = ['scenario-package:role-package:use']
  assert.equal(domain.scenarioPackageRole(caller), 'viewer')
  assert.equal(domain.evaluateRuntimeAccess(online, caller).status, 'ready', 'authoring responsibility must not restrict an otherwise authorized business caller')
  const disabled = domain.transitionScenarioPackage(online, reviewer, 'disable', later)
  assert.equal(disabled.ok, true); assert.equal(domain.evaluateRuntimeAccess(disabled.package, pm).status, 'blocked')
  assert.equal(domain.transitionScenarioPackage(disabled.package, reviewer, 'enable', later).ok, true)
})

test('being a PM never grants author access to another PM package or replaces reference permission checks', () => {
  const saved = domain.saveScenarioPackageDraft(draft(), pm, at)
  const other = { ...pm, id: 'other-pm' }
  assert.deepEqual(domain.scenarioPackageActions(saved, other), ['view'])
  assert.equal(domain.editableScenarioPackageDraft(saved, other), null)
  assert.throws(() => domain.saveScenarioPackageDraft({ ...draft(), ownerId: other.id, baseUpdatedAt: saved.updatedAt }, other, later, saved), /所有者/)
  const withoutReference = copy(pm)
  withoutReference.permissions.policy = withoutReference.permissions.policy.filter(permission => permission !== 'skill:customer-query:reference')
  assert.equal(domain.scenarioPackageRole(withoutReference), 'pm')
  assert.equal(domain.evaluatePackageForPublish(draft(), withoutReference).ok, false)
  assert.throws(() => domain.submitScenarioPackage(tested(), withoutReference, at, catalog), /引用权限/)
})
