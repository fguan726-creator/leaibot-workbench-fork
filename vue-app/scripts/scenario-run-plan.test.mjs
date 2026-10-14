import assert from 'node:assert/strict'
import test from 'node:test'
import { buildScenarioRunPlan as buildPlan } from '../src/domain/scenarioRunPlan.js'

const caller = { id: 'operator', permissions: ['*'] }
const at = '2026-09-09T03:00:00.000Z'
const node = (id, overrides = {}) => ({
  id, skillId: `skill-${id}`, name: `节点 ${id}`, menu: `菜单 ${id}`,
  pinnedVersion: 'v1.0.0', currentPublishedVersion: 'v1.0.0',
  predecessorId: { a: null, b: 'a', c: 'b' }[id],
  kind: 'required', required: true, dependencyState: 'available',
  task: `职责 ${id}`, fixedRequirements: `要求 ${id}`, expectedOutput: `预期输出 ${id}`, inputDescription: `输入要求 ${id}`,
  permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] },
  ...overrides
})
const packageOf = (steps = [node('a'), node('b')], overrides = {}) => ({
  id: 'package-1', version: 'v2.0.0', status: 'published', steps,
  auditEvents: [{ type: 'approved', actorId: 'reviewer', at }, { type: 'published', actorId: 'reviewer', at }],
  ...overrides
})
const stepIds = plan => plan.steps.map(step => step.id)
const upstream = step => step.inputSources.filter(source => source.kind === 'upstream')

test('prepares published node contracts without merging the user request into their duties', () => {
  const plan = buildPlan(packageOf(), caller, { input: '本次仅分析上海地区' })
  assert.equal(plan.executionPerformed, false)
  assert.equal(plan.packageId, 'package-1')
  assert.equal(plan.version, 'v2.0.0')
  assert.equal(plan.status, 'ready')
  assert.equal(plan.requestInput, '本次仅分析上海地区')
  assert.deepEqual(plan.steps.map(({ task, fixedRequirements, expectedOutput }) => ({ task, fixedRequirements, expectedOutput })), [
    { task: '职责 a', fixedRequirements: '要求 a', expectedOutput: '预期输出 a' },
    { task: '职责 b', fixedRequirements: '要求 b', expectedOutput: '预期输出 b' }
  ])
  assert.equal(plan.steps[0].skillId, 'skill-a')
  assert.equal(plan.steps[0].pinnedVersion, 'v1.0.0')
  assert.equal(plan.steps[0].inputSources.find(source => source.kind === 'run')?.status, 'provided')
  assert.equal(plan.steps[0].inputSources.find(source => source.kind === 'run')?.description, '输入要求 a')
})

test('uses connected order and retains the declared upstream even when storage and canvas order differ', () => {
  const plan = buildPlan(packageOf([
    node('c', { position: { x: 0, y: 0 } }),
    node('a', { position: { x: 900, y: 0 } }),
    node('b', { position: { x: 450, y: 0 } })
  ]), caller)
  assert.deepEqual(stepIds(plan), ['a', 'b', 'c'])
  assert.deepEqual(upstream(plan.steps[1]).map(({ nodeId, status }) => ({ nodeId, status })), [{ nodeId: 'a', status: 'pending' }])
  assert.equal(upstream(plan.steps[2]).some(source => source.nodeId === 'b' && source.status === 'pending'), true)
})

test('supports legacy array ordering and supplies duties without inventing optional requirements', () => {
  const legacy = ['b', 'a'].map(id => {
    const step = node(id)
    for (const key of ['predecessorId', 'task', 'fixedRequirements', 'expectedOutput']) delete step[key]
    return step
  })
  const plan = buildPlan(packageOf(legacy), caller)
  assert.deepEqual(stepIds(plan), ['b', 'a'])
  for (const step of plan.steps) {
    assert.ok(step.task.trim())
    assert.equal(step.fixedRequirements, '')
    assert.equal(step.expectedOutput, '')
  }
  assert.equal(upstream(plan.steps[1]).some(source => source.nodeId === 'b'), true)
})

for (const [name, fixture, actor, request] of [
  ['unpublished package', () => packageOf(undefined, { status: 'draft' }), caller, {}],
  ['missing approval audit', () => packageOf(undefined, { auditEvents: [{ type: 'published', actorId: 'reviewer', at }] }), caller, {}],
  ['missing publication audit', () => packageOf(undefined, { auditEvents: [{ type: 'approved', actorId: 'reviewer', at }] }), caller, {}],
  ['missing package permission', () => packageOf(), { id: 'operator', permissions: [] }, {}],
  ['missing required node permissions', () => packageOf(), { id: 'operator', permissions: ['scenario-package:package-1:use'] }, {}],
  ['missing confirmation evidence', () => packageOf([node('a', { requiresConfirmation: true }), node('b')]), caller, {}],
  ['missing approval evidence', () => packageOf([node('a', { requiresApproval: true }), node('b')]), caller, {}],
  ['unavailable required node', () => packageOf([node('a', { dependencyState: 'expired' }), node('b')]), caller, {}],
  ['disconnected chain', () => packageOf([node('a'), node('b', { predecessorId: null })]), caller, {}],
  ['cyclic chain', () => packageOf([node('a', { predecessorId: 'b' }), node('b')]), caller, {}],
  ['mixed legacy and explicit chain', () => packageOf([node('a'), node('b', { predecessorId: undefined })]), caller, {}]
]) {
  test(`does not expose executable steps for ${name}`, () => {
    const plan = buildPlan(fixture(), actor, request)
    assert.equal(plan.status, 'blocked')
    assert.equal(plan.executionPerformed, false)
    assert.deepEqual(plan.steps, [])
    assert.ok(plan.explanations.length > 0)
  })
}

test('passes node-specific confirmation and approval evidence to the existing gate', () => {
  const item = packageOf([node('a', { requiresConfirmation: true, requiresApproval: true }), node('b')])
  const plan = buildPlan(item, caller, { evidence: { confirmedStepIds: ['a'], approvedStepIds: ['a'] } })
  assert.equal(plan.status, 'ready')
  assert.deepEqual(stepIds(plan), ['a', 'b'])
  assert.equal(buildPlan(item, caller, { evidence: { confirmedStepIds: ['b'], approvedStepIds: ['b'] } }).status, 'blocked')
})

test('marks inactive conditional upstreams as skipped instead of inventing an available output', () => {
  const item = packageOf([node('a'), node('b', { kind: 'conditional', required: false, condition: '需要补充材料' }), node('c')])
  const plan = buildPlan(item, caller, { input: '用户未要求补充材料' })
  assert.deepEqual(stepIds(plan), ['a', 'c'])
  const source = upstream(plan.steps[1]).find(entry => entry.nodeId === 'b')
  assert.equal(source?.status, 'skipped')
  assert.equal(source?.conditional, true)
  assert.deepEqual(upstream(plan.steps[1]).map(({ nodeId, status }) => ({ nodeId, status })), [
    { nodeId: 'a', status: 'pending' }, { nodeId: 'b', status: 'skipped' }
  ], 'the skipped ancestor must remain declared alongside the other connected ancestors')
})

test('keeps activated conditional upstreams pending because this function never executes them', () => {
  const item = packageOf([node('a'), node('b', { kind: 'conditional', required: false, condition: '需要补充材料' }), node('c')])
  const plan = buildPlan(item, caller, { activeOptionalStepIds: ['b'] })
  assert.deepEqual(stepIds(plan), ['a', 'b', 'c'])
  assert.equal(upstream(plan.steps[2]).find(source => source.nodeId === 'b')?.status, 'pending')
  assert.equal(plan.executionPerformed, false)
})

test('returns no executable nodes when an activated optional node lacks evidence', () => {
  const item = packageOf([node('a'), node('b', {
    kind: 'conditional', required: false, condition: '需要补充材料', requiresApproval: true
  }), node('c')])
  const plan = buildPlan(item, caller, { activeOptionalStepIds: ['b'] })
  assert.equal(plan.status, 'blocked')
  assert.deepEqual(stepIds(plan), [])
  assert.ok(plan.explanations.length)
})

test('distinguishes missing run input from supplied input without changing permission readiness', () => {
  for (const request of [{}, { input: '' }, { input: '   ' }]) {
    const plan = buildPlan(packageOf(), caller, request)
    assert.equal(plan.status, 'ready')
    assert.equal(plan.steps[0].inputSources.find(source => source.kind === 'run')?.status, 'missing')
    assert.equal(plan.requestInput, request.input || '')
  }
})

test('returns only plan declarations without leaking permissions or carrying actual results', () => {
  const item = packageOf([node('a', { result: { secret: 'actual result must not transfer' }, artifact: 'artifact-1' }), node('b')])
  const plan = buildPlan(item, caller, { input: '本次输入' })
  for (const step of plan.steps) {
    assert.deepEqual(Object.keys(step).sort(), ['expectedOutput', 'fixedRequirements', 'id', 'inputSources', 'name', 'pinnedVersion', 'skillId', 'task'])
    for (const source of step.inputSources) {
      assert.equal('output' in source || 'result' in source || 'artifact' in source || 'value' in source, false)
      if (source.kind === 'upstream') assert.equal(source.status, 'pending')
    }
  }
  assert.equal(JSON.stringify(plan).includes('actual result must not transfer'), false)
})

test('isolates the plan, its input declarations and all subsequent plans from caller mutation', () => {
  const item = packageOf()
  const request = { input: '初始输入', activeOptionalStepIds: [], evidence: { confirmedStepIds: [], approvedStepIds: [] } }
  const before = structuredClone(item)
  const first = buildPlan(item, caller, request)
  first.steps[0].task = '篡改职责'
  first.steps[1].inputSources[0].description = '篡改输入说明'
  first.steps[1].inputSources.push({ kind: 'run', name: '恶意输入', status: 'provided' })
  first.explanations.push('篡改原因')
  assert.deepEqual(item, before)
  item.steps[0].task = '外部新职责'
  request.input = '外部新输入'
  assert.equal(first.requestInput, '初始输入')
  const second = buildPlan(packageOf(), caller, { input: '初始输入' })
  assert.equal(second.steps[0].task, '职责 a')
  assert.equal(second.steps[1].inputSources.some(source => source.name === '恶意输入'), false)
  assert.equal(second.steps[1].inputSources.some(source => source.description === '篡改输入说明'), false)
  assert.equal(second.explanations.includes('篡改原因'), false)
})
