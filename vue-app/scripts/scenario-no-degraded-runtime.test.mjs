import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluatePackageHealth, evaluateRuntimeAccess } from '../src/domain/scenarioSkillPackages.js'
import { buildScenarioRunPlan } from '../src/domain/scenarioRunPlan.js'

const caller = { id: 'operator', permissions: ['*'] }
const at = '2026-10-14T06:00:00.000Z'
const node = (id, patch = {}) => ({
  id, skillId: `skill-${id}`, name: `节点${id}`, menu: `菜单${id}`, predecessorId: id === 'a' ? null : 'a',
  pinnedVersion: 'v1.0.0', currentPublishedVersion: 'v1.0.0', kind: id === 'a' ? 'required' : 'conditional', required: id === 'a', condition: id === 'a' ? '' : '用户需要补充时',
  dependencyState: 'available', permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] }, ...patch
})
const packageOf = (patch = {}) => ({
  id: 'no-degraded-run', ownerId: 'owner', version: 'v1.0.0', status: 'published', steps: [node('a'), node('b')],
  auditEvents: [{ type: 'approved', actorId: 'reviewer', at }, { type: 'published', actorId: 'reviewer', at }], ...patch
})

for (const state of ['expired', 'unavailable', 'emergency_disabled']) {
  test(`an ${state} declared optional dependency pauses the package even before its condition is active`, () => {
    const item = packageOf({ steps: [node('a'), node('b', { dependencyState: state })] })
    const before = structuredClone(item)
    assert.equal(evaluatePackageHealth(item.steps).status, 'paused')
    assert.deepEqual(evaluatePackageHealth(item.steps).blockedStepIds, ['b'])
    for (const activeOptionalStepIds of [[], ['b']]) {
      const access = evaluateRuntimeAccess(item, caller, activeOptionalStepIds)
      assert.equal(access.status, 'blocked')
      assert.deepEqual(access.effectiveSteps, [])
      assert.deepEqual(buildScenarioRunPlan(item, caller, { activeOptionalStepIds }).steps, [])
    }
    assert.deepEqual(item, before)
  })
}

for (const bucket of ['menu', 'skill', 'data', 'action']) {
  test(`missing optional ${bucket} permission blocks every activated step`, () => {
    const item = packageOf()
    const permissions = {
      policy: ['scenario-package:no-degraded-run:use'], menu: ['menu:a', 'menu:b'], skill: ['skill:a', 'skill:b'], data: ['data:a', 'data:b'], action: ['action:a', 'action:b']
    }
    permissions[bucket] = permissions[bucket].filter(value => !value.endsWith(':b'))
    const actor = { id: caller.id, permissions }
    const active = evaluateRuntimeAccess(item, actor, ['b'])
    assert.equal(active.status, 'blocked')
    assert.deepEqual(active.effectiveSteps, [])
    assert.deepEqual(active.missingPermissions.map(item => item.stepId), ['b'])
    assert.equal(evaluateRuntimeAccess(item, actor).status, 'ready')
  })
}

for (const [flag, evidenceName] of [['requiresConfirmation', 'confirmedStepIds'], ['requiresApproval', 'approvedStepIds']]) {
  test(`optional ${flag} failure cannot silently remove the branch and run the remainder`, () => {
    const item = packageOf({ steps: [node('a'), node('b', { [flag]: true })] })
    assert.equal(evaluateRuntimeAccess(item, caller).status, 'ready')
    const plan = buildScenarioRunPlan(item, caller, { activeOptionalStepIds: ['b'], evidence: { workflowConfirmed: true } })
    assert.equal(plan.status, 'blocked')
    assert.deepEqual(plan.steps, [])
    const confirmed = buildScenarioRunPlan(item, caller, { activeOptionalStepIds: ['b'], evidence: { [evidenceName]: ['b'] } })
    assert.equal(confirmed.status, 'ready')
    assert.deepEqual(confirmed.steps.map(step => step.id), ['a', 'b'])
  })
}

test('a healthy inactive condition remains a normal skip without weakening the published version boundary', () => {
  const snapshot = packageOf({ steps: [node('a'), node('b', { dependencyState: 'expired' })] })
  const editing = { ...packageOf(), status: 'draft', onlineStatus: 'published', publishedSnapshot: structuredClone(snapshot) }
  assert.equal(evaluateRuntimeAccess(editing, caller).status, 'blocked')
  assert.deepEqual(editing.publishedSnapshot, snapshot)
  const healthy = buildScenarioRunPlan(packageOf(), caller)
  assert.equal(healthy.status, 'ready')
  assert.deepEqual(healthy.steps.map(step => step.id), ['a'])
})
