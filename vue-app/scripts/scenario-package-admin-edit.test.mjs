import assert from 'node:assert/strict'
import test from 'node:test'
import * as domain from '../src/domain/scenarioSkillPackages.js'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'

const at = '2026-10-08T08:00:00.000Z'
const later = '2026-10-08T08:01:00.000Z'
const skills = ['customer', 'orders'].map(id => ({
  id, name: id, menu: id, version: 'v1.0.0', online: 'v1.0.0', status: 'published', onlineStatus: 'published',
  permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] }
}))
const referencePermissions = skills.flatMap(skill => [`skill:${skill.id}:metadata:read`, `skill:${skill.id}:reference`])
const runtimePermissions = skills.flatMap(skill => Object.values(skill.permissions).flat())
const creator = { id: 'creator', permissions: ['scenario-package:create', 'scenario-package:compose:cross-menu', ...referencePermissions, ...runtimePermissions, 'scenario-package:existing-package:use'] }
const editor = { id: 'editing-admin', permissions: ['scenario-package:review', ...referencePermissions, ...runtimePermissions] }
const reviewer = { id: 'independent-admin', permissions: ['scenario-package:review'] }
const readonlyReviewer = { id: 'review-only-admin', permissions: ['scenario-package:review'] }
const unrelated = { ...creator, id: 'unrelated-creator' }
const copy = value => structuredClone(value)

function draft() {
  return {
    id: 'existing-package', ownerId: creator.id, name: '客户订单分析', description: '分析授权客户和订单', targetAudience: '运营人员',
    steps: skills.map((skill, index) => domain.createPinnedScenarioStep(skill, {
      id: skill.id, predecessorId: index ? skills[index - 1].id : null, task: '分析本次授权业务对象', expectedOutput: '返回该业务对象的分析结果'
    }))
  }
}

function tested(value, actor = creator, previous) {
  const testRequest = { input: '分析授权业务对象', expectedOutput: '返回各节点分析结果', activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [],
    sampleOutputs: { customer: '客户样例分析结果', orders: '订单样例分析结果' } }
  return { ...value, testRequest, testReport: runScenarioSimulation(value, skills, testRequest, actor, at, previous) }
}

function online(status = 'published') {
  const queued = domain.submitScenarioPackage(tested(draft()), creator, at, skills)
  const published = domain.publishScenarioPackage(queued, reviewer, later, skills)
  return status === 'disabled' ? domain.transitionScenarioPackage(published, reviewer, 'disable', later).package : published
}

for (const status of ['published', 'disabled']) {
  test(`an administrator opens an isolated ${status} revision without taking ownership or changing runtime`, () => {
    const current = online(status); const before = copy(current)
    const editing = domain.editableScenarioPackageDraft(current, editor)
    assert.ok(editing)
    assert.equal(editing.ownerId, creator.id)
    assert.equal(editing.version, 'v1.0.1')
    assert.equal(editing.baseUpdatedAt, current.updatedAt)
    editing.name = '修改中的名称'
    assert.deepEqual(current, before)
    const saved = domain.saveScenarioPackageDraft(editing, editor, later, current)
    assert.equal(saved.ownerId, creator.id)
    assert.equal(saved.status, 'draft')
    assert.equal(saved.version, 'v1.0.1')
    assert.equal(saved.onlineStatus, status)
    assert.deepEqual(saved.publishedSnapshot, before.publishedSnapshot)
    assert.deepEqual(domain.getScenarioRuntimePackage(saved), domain.getScenarioRuntimePackage(before))
  })
}

test('review authority permits maintenance of an existing package without granting creation or reference permissions', () => {
  const current = online()
  const editing = domain.editableScenarioPackageDraft(current, readonlyReviewer)
  assert.ok(editing)
  assert.equal(domain.saveScenarioPackageDraft(editing, readonlyReviewer, later, current).ownerId, creator.id)
  const ownNew = { ...draft(), id: 'new-package', ownerId: readonlyReviewer.id }
  assert.equal(domain.canAuthorScenarioPackage(readonlyReviewer), false)
  assert.throws(() => domain.saveScenarioPackageDraft(ownNew, readonlyReviewer, later), /权限/)
  assert.equal(domain.evaluatePackageForPublish(ownNew, readonlyReviewer).ok, false)
  const policy = domain.evaluatePackageForPublish(editing, readonlyReviewer, current)
  assert.equal(policy.ok, false)
  assert.ok(policy.reasons.some(reason => /元数据读取权限|引用权限/.test(reason)))
  assert.throws(() => domain.submitScenarioPackage(tested(editing, editor, current), readonlyReviewer, later, skills, current), /元数据读取权限|引用权限/)
})

test('administrators maintain published revisions through draft or rejection but cannot edit another creators never-published drafts', () => {
  const fresh = domain.saveScenarioPackageDraft(draft(), creator, at)
  const freshReview = domain.submitScenarioPackage(tested(draft()), creator, at, skills)
  const freshRejected = domain.rejectScenarioPackage(freshReview, reviewer, '补充业务范围', later)
  for (const record of [fresh, freshRejected]) {
    assert.equal(domain.editableScenarioPackageDraft(record, editor), null)
    assert.ok(domain.editableScenarioPackageDraft(record, creator))
    assert.throws(() => domain.saveScenarioPackageDraft({ ...draft(), baseUpdatedAt: record.updatedAt }, editor, later, record), /状态|账号/)
  }
  const current = online()
  const saved = domain.saveScenarioPackageDraft(domain.editableScenarioPackageDraft(current, editor), editor, later, current)
  assert.ok(domain.editableScenarioPackageDraft(saved, editor))
  const pending = domain.submitScenarioPackage(tested(domain.editableScenarioPackageDraft(saved, editor), editor, saved), editor, at, skills, saved)
  const rejected = domain.rejectScenarioPackage(pending, reviewer, '补充业务边界', later)
  assert.ok(domain.editableScenarioPackageDraft(rejected, editor))
  assert.equal(domain.saveScenarioPackageDraft(domain.editableScenarioPackageDraft(rejected, editor), editor, at, rejected).version, 'v1.0.1')
})

test('administrator simulation and submission use the actual actor plus a trusted current record', () => {
  const current = online()
  const editing = domain.editableScenarioPackageDraft(current, editor)
  const ready = tested(editing, editor, current)
  assert.equal(ready.testReport.status, 'completed')
  assert.equal(ready.testReport.testerId, editor.id)
  const submitted = domain.submitScenarioPackage(ready, editor, later, skills, current)
  assert.equal(submitted.ownerId, creator.id)
  assert.equal(submitted.submittedBy, editor.id)
  assert.equal(submitted.auditEvents.at(-1).actorId, editor.id)
  assert.equal(submitted.status, 'review')
  assert.equal(submitted.version, 'v1.0.1')
  assert.equal(submitted.onlineStatus, 'published')
  assert.deepEqual(submitted.publishedSnapshot, current.publishedSnapshot)
  assert.throws(() => domain.submitScenarioPackage(ready, editor, later, skills), /所有者|负责人|权限|不存在/)
  assert.throws(() => domain.publishScenarioPackage(submitted, editor, later, skills), /本人|编辑|其他管理员/)
  const approved = domain.publishScenarioPackage(submitted, reviewer, later, skills)
  assert.equal(approved.ownerId, creator.id)
  assert.equal(approved.publishedSnapshot.version, 'v1.0.1')
})

test('administrator edits reject missing or stale baselines, forged ownership, identity and trial evidence', () => {
  const current = online(); const before = copy(current)
  const editing = domain.editableScenarioPackageDraft(current, editor)
  for (const patch of [{ baseUpdatedAt: undefined }, { baseUpdatedAt: 'stale' }, { id: 'other-id' }, { ownerId: editor.id }]) {
    const changed = { ...editing, ...patch }
    assert.throws(() => domain.saveScenarioPackageDraft(changed, editor, later, current))
    assert.throws(() => domain.submitScenarioPackage(tested(changed, editor, current), editor, later, skills, current))
  }
  assert.throws(() => domain.submitScenarioPackage(editing, editor, later, skills, current), /试运行/)
  const ready = tested(editing, editor, current)
  assert.throws(() => domain.submitScenarioPackage({ ...ready, description: '试运行后变化' }, editor, later, skills, current), /试运行/)
  assert.equal(domain.editableScenarioPackageDraft(current, unrelated), null)
  assert.equal(domain.editableScenarioPackageDraft(current, { id: 'admin', role: 'admin', permissions: [] }), null)
  assert.deepEqual(current, before)
})

test('pending content stays read-only and only its creator or actual submitter may withdraw', () => {
  const current = online('disabled')
  const editing = domain.editableScenarioPackageDraft(current, editor)
  const pending = domain.submitScenarioPackage(tested(editing, editor, current), editor, later, skills, current)
  for (const actor of [creator, editor, reviewer]) {
    assert.equal(domain.scenarioPackageActions(pending, actor).includes('edit'), false)
    assert.equal(domain.editableScenarioPackageDraft(pending, actor), null)
  }
  for (const actor of [creator, editor]) {
    assert.ok(domain.scenarioPackageActions(pending, actor).includes('withdraw'))
    const result = domain.transitionScenarioPackage(pending, actor, 'withdraw', at)
    assert.equal(result.ok, true)
    assert.equal(result.package.status, 'draft')
    assert.equal(result.package.ownerId, creator.id)
    assert.equal(result.package.version, pending.version)
    assert.equal(result.package.onlineStatus, 'disabled')
    assert.deepEqual(result.package.publishedSnapshot, pending.publishedSnapshot)
    assert.deepEqual(result.package.testReport, pending.testReport)
    assert.equal(result.package.submittedAt, undefined)
    assert.equal(result.package.submittedBy, undefined)
    assert.deepEqual(result.package.auditEvents.at(-1), { type: 'withdrawn', actorId: actor.id, at })
  }
  for (const actor of [reviewer, unrelated, { id: '', permissions: ['*'] }]) {
    assert.equal(domain.scenarioPackageActions(pending, actor).includes('withdraw'), false)
    assert.equal(domain.transitionScenarioPackage(pending, actor, 'withdraw', at).ok, false)
  }
  assert.equal(domain.transitionScenarioPackage(pending, { id: creator.id, permissions: [] }, 'withdraw', at).ok, false)
})

test('admin contributors cannot approve a revision later submitted by the creator and client input cannot erase that history', () => {
  const current = online()
  const edited = domain.saveScenarioPackageDraft(domain.editableScenarioPackageDraft(current, editor), editor, later, current)
  const ownerDraft = domain.editableScenarioPackageDraft(edited, creator)
  const pending = domain.submitScenarioPackage(tested({ ...ownerDraft, revisionEditors: [] }), creator, at, skills, edited)
  assert.deepEqual(pending.revisionEditors, [editor.id, creator.id])
  assert.equal(domain.evaluateScenarioPackageReview(pending, editor).ok, false)
  assert.throws(() => domain.rejectScenarioPackage(pending, editor, '由本人审核', later), /本人|编辑|其他管理员/)
  const approved = domain.publishScenarioPackage(pending, reviewer, later, skills)
  assert.deepEqual(approved.publishedSnapshot.revisionEditors, [editor.id, creator.id])
  const ownerNext = domain.saveScenarioPackageDraft(domain.editableScenarioPackageDraft(approved, creator), creator, at, approved)
  assert.deepEqual(ownerNext.revisionEditors, [creator.id], 'only the new revision starts a fresh contributor set')
  const nextReview = domain.submitScenarioPackage(tested(domain.editableScenarioPackageDraft(ownerNext, creator)), creator, later, skills, ownerNext)
  assert.equal(domain.evaluateScenarioPackageReview(nextReview, editor).ok, true, 'the administrator did not edit the next revision')
})

test('client-supplied editor history cannot grant publication or deny an unrelated administrator review', () => {
  const submitted = domain.submitScenarioPackage(tested({ ...draft(), revisionEditors: [reviewer.id] }), creator, at, skills)
  assert.deepEqual(submitted.revisionEditors, [creator.id])
  assert.equal(domain.evaluateScenarioPackageReview(submitted, reviewer).ok, true)
  const saved = domain.saveScenarioPackageDraft({ ...draft(), revisionEditors: [reviewer.id] }, creator, at)
  assert.deepEqual(saved.revisionEditors, [creator.id])
})

test('runtime and enable gates reject an approval authored by a contributor to the published revision', () => {
  const published = online()
  published.publishedSnapshot.revisionEditors = [reviewer.id]
  assert.equal(domain.evaluateRuntimeAccess(published, creator).status, 'blocked')
  const disabled = { ...published, status: 'disabled', onlineStatus: 'disabled' }
  assert.equal(domain.scenarioPackageActions(disabled, reviewer).includes('enable'), false)
})
