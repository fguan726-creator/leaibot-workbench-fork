import assert from 'node:assert/strict'
import test from 'node:test'
import * as domain from '../src/domain/scenarioSkillPackages.js'
import { createScenarioSimulationRequest, runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { buildScenarioRunPlan } from '../src/domain/scenarioRunPlan.js'

const now = '2026-10-14T02:00:00.000Z'
const owner = { id: 'workflow-owner', permissions: ['*'] }
const reviewer = { id: 'workflow-reviewer', permissions: ['scenario-package:review'] }
const catalog = [
  ['employee-certification-insight', 'v1.0.0', '员工管理'],
  ['workplace-segment-operations', 'v1.2.0', '人群经营']
].map(([id, version, menu]) => ({
  id, name: id, version, online: version, menu, status: 'published', onlineStatus: 'published',
  permissions: { menu: [`menu:${menu}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] }
}))
function draftOf(overrides = {}) {
  return {
    id: 'workflow-confirmation', name: '整条工作流执行确认', description: '分析授权范围内的人群认证与经营表现', targetAudience: '业务运营', ownerId: owner.id,
    steps: catalog.map((skill, index) => domain.createPinnedScenarioStep(skill, {
      id: `node-${index}`, predecessorId: index ? 'node-0' : null, task: '分析本节点业务对象', expectedOutput: '输出本节点分析结果'
    })), ...overrides
  }
}
function tested(draft, extra = {}) {
  const testRequest = { ...createScenarioSimulationRequest(draft), ...extra }
  return { ...draft, testRequest, testReport: runScenarioSimulation(draft, catalog, testRequest, owner, now) }
}
function published(draft = draftOf()) {
  return {
    ...draft, status: 'published', onlineStatus: 'published', version: 'v1.0.0', updatedAt: now,
    auditEvents: [{ type: 'approved', actorId: reviewer.id, at: now }, { type: 'published', actorId: reviewer.id, at: now }]
  }
}

test('unconfirmed workflow blocks every simulation node before any sample output is produced', () => {
  const draft = draftOf({ requiresConfirmation: true })
  draft.steps[1] = { ...draft.steps[1], required: false, kind: 'conditional', condition: '需要补充时' }
  const { testReport } = tested(draft, { confirmedStepIds: ['node-0', 'node-1'] })
  assert.equal(testReport.status, 'blocked')
  assert.deepEqual(testReport.nodes.map(node => node.status), ['blocked', 'blocked'])
  assert.ok(testReport.nodes.every(node => node.output === '' && node.inputs.length === 0))
  assert.match(testReport.issues.join(' '), /工作流.*确认|确认.*工作流/)
})

test('one explicit workflow simulation confirmation permits the complete chain without per-node tickets', () => {
  const draft = tested(draftOf({ requiresConfirmation: true }), { workflowConfirmed: true })
  assert.equal(draft.testReport.status, 'completed')
  assert.equal(draft.testReport.request.workflowConfirmed, true)
  assert.deepEqual(draft.testReport.nodes.map(node => node.status), ['completed', 'completed'])
  assert.equal(domain.evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
})

test('workflow setting and confirmation evidence invalidate prior simulation results', () => {
  const draft = tested(draftOf({ requiresConfirmation: false }))
  assert.equal(domain.isScenarioSimulationCurrent(draft.testReport, { ...draft, requiresConfirmation: true }, catalog, draft.testRequest), false)
  const confirmed = tested(draftOf({ requiresConfirmation: true }), { workflowConfirmed: true })
  assert.equal(domain.isScenarioSimulationCurrent(confirmed.testReport, confirmed, catalog, { ...confirmed.testRequest, workflowConfirmed: false }), false)
  assert.equal(createScenarioSimulationRequest(confirmed).workflowConfirmed, false)
  assert.equal(domain.normalizeScenarioSimulationRequest({ workflowConfirmed: 'true' }).workflowConfirmed, false)
})

test('an unchanged legacy workflow without confirmation retains its released fingerprint', () => {
  const draft = draftOf()
  const request = createScenarioSimulationRequest(draft)
  delete request.workflowConfirmed
  // Computed from this fixture with the released f8922c82 implementation.
  assert.equal(domain.getScenarioTestFingerprint(draft, catalog, request), 'scenario-simulation-v2-7764d8b24eec2008')
})

test('saving and reopening preserves whole-workflow choice including explicit cancellation', () => {
  const saved = domain.saveScenarioPackageDraft(draftOf({ requiresConfirmation: true }), owner, now)
  assert.equal(saved.requiresConfirmation, true)
  const editing = domain.editableScenarioPackageDraft(saved, owner)
  assert.equal(editing.requiresConfirmation, true)
  const cancelled = domain.saveScenarioPackageDraft({ ...editing, requiresConfirmation: false }, owner, '2026-10-14T02:01:00.000Z', saved)
  assert.equal(domain.editableScenarioPackageDraft(cancelled, owner).requiresConfirmation, false)
})

test('legacy draft migration folds node confirmation into the workflow without changing source or approval requirements', () => {
  const draft = draftOf()
  draft.steps[1].requiresConfirmation = true
  draft.steps[1].requiresApproval = true
  const before = structuredClone(draft)
  const migrated = domain.saveScenarioPackageDraft(draft, owner, now)
  assert.equal(migrated.requiresConfirmation, true)
  assert.ok(migrated.steps.every(step => step.requiresConfirmation !== true))
  assert.equal(migrated.steps[1].requiresApproval, true)
  assert.deepEqual(draft, before)
  const explicitlyCancelled = domain.saveScenarioPackageDraft({ ...draft, requiresConfirmation: false }, owner, now)
  assert.equal(explicitlyCancelled.requiresConfirmation, false)
  assert.ok(explicitlyCancelled.steps.every(step => step.requiresConfirmation !== true))
})

test('legacy node simulation tickets do not become whole-workflow confirmation', () => {
  const draft = draftOf()
  draft.steps[1].requiresConfirmation = true
  assert.equal(tested(draft, { confirmedStepIds: ['node-1'] }).testReport.status, 'blocked')
  assert.equal(tested(draft, { workflowConfirmed: true }).testReport.status, 'completed')
})

test('submission and independent approval retain workflow requirement without granting runtime confirmation', () => {
  const draft = tested(draftOf({ requiresConfirmation: true }), { workflowConfirmed: true })
  const submitted = domain.submitScenarioPackage(draft, owner, now, catalog)
  assert.equal(submitted.requiresConfirmation, true)
  const result = domain.publishScenarioPackage(submitted, reviewer, now, catalog)
  assert.equal(result.requiresConfirmation, true)
  assert.equal(result.publishedSnapshot.requiresConfirmation, true)
  assert.equal(buildScenarioRunPlan(result, owner).status, 'blocked')
  assert.equal(buildScenarioRunPlan(result, owner, { evidence: { workflowConfirmed: true } }).status, 'ready')
})

test('runtime rejects missing or nonboolean workflow confirmation even with all node confirmations', () => {
  const item = published(draftOf({ requiresConfirmation: true }))
  for (const workflowConfirmed of [undefined, false, 'true', 1]) {
    const plan = buildScenarioRunPlan(item, owner, { evidence: { workflowConfirmed, confirmedStepIds: ['node-0', 'node-1'] } })
    assert.equal(plan.status, 'blocked')
    assert.deepEqual(plan.steps, [])
  }
  assert.equal(buildScenarioRunPlan(item, owner, { evidence: { workflowConfirmed: true } }).steps.length, 2)
})

test('workflow confirmation does not override runtime permissions, approval or legacy node confirmation', () => {
  const item = published(draftOf({ requiresConfirmation: true }))
  const request = { evidence: { workflowConfirmed: true } }
  assert.equal(buildScenarioRunPlan(item, { id: owner.id, permissions: [] }, request).status, 'blocked')
  item.steps[0].requiresApproval = true
  assert.equal(buildScenarioRunPlan(item, owner, request).status, 'blocked')
  item.steps[0].requiresApproval = false
  item.steps[0].requiresConfirmation = true
  assert.equal(buildScenarioRunPlan(item, owner, request).status, 'blocked')
  assert.equal(buildScenarioRunPlan(item, owner, { evidence: { workflowConfirmed: true, confirmedStepIds: ['node-0'] } }).status, 'ready')
})

test('editing and saving a legacy published revision leaves its published confirmation policy unchanged', () => {
  const original = published()
  original.steps[0].requiresConfirmation = true
  original.publishedSnapshot = domain.scenarioPublishedSnapshot(original)
  const before = structuredClone(original)
  const editing = domain.editableScenarioPackageDraft(original, owner)
  assert.equal(editing.requiresConfirmation, true)
  assert.ok(editing.steps.every(step => step.requiresConfirmation !== true))
  const saved = domain.saveScenarioPackageDraft({ ...editing, requiresConfirmation: false }, owner, '2026-10-14T02:01:00.000Z', original)
  assert.deepEqual(saved.publishedSnapshot, before.publishedSnapshot)
  assert.deepEqual(original, before)
  assert.equal(buildScenarioRunPlan(domain.getScenarioRuntimePackage(saved), owner, { evidence: { workflowConfirmed: true } }).status, 'blocked')
  assert.equal(buildScenarioRunPlan(domain.getScenarioRuntimePackage(saved), owner, { evidence: { confirmedStepIds: ['node-0'] } }).status, 'ready')
})

test('workflow simulation confirmation never replaces node approval evidence', () => {
  const draft = draftOf({ requiresConfirmation: true })
  draft.steps[0].requiresApproval = true
  const blocked = tested(draft, { workflowConfirmed: true })
  assert.equal(blocked.testReport.status, 'blocked')
  assert.match(blocked.testReport.issues.join(' '), /审批/)
  assert.equal(tested(draft, { workflowConfirmed: true, approvedStepIds: ['node-0'] }).testReport.status, 'completed')
})
