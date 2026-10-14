import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinnedScenarioStep, evaluateScenarioTrialForSubmit, getScenarioTestFingerprint, isScenarioSimulationCurrent, normalizeScenarioSimulationRequest, submitScenarioPackage } from '../src/domain/scenarioSkillPackages.js'
import { createScenarioSimulationRequest, runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor } from './helpers/scenarioActors.mjs'

const catalog = [
  ['workplace-segment-operations', 'v1.2.0', '职场人群经营分析'],
  ['employee-certification-insight', 'v1.0.0', '职场认证状态查询']
].map(([id, version, name]) => ({
  id, version, name, menu: name, online: version, status: 'published', onlineStatus: 'published',
  permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] }
}))
const actor = scenarioPmActor('retry-creator', catalog)

function fixture(skills = catalog) {
  const steps = skills.map((skill, index) => createPinnedScenarioStep(skill, {
    id: `retry-node-${index}`, predecessorId: index ? `retry-node-${index - 1}` : null,
    task: `使用${skill.name}完成场景任务。`, expectedOutput: ''
  }))
  const draft = { id: 'retry-scenario', name: '经营与认证测试', description: '分析经营表现后汇总职场认证数据。', targetAudience: '运营人员', ownerId: actor.id, steps }
  const request = { ...createScenarioSimulationRequest(draft), mockDataMode: 'mixed-feedback' }
  return { draft, request }
}

function run(state, currentActor = actor, skills = catalog) {
  state.draft.testRequest = state.request
  state.draft.testReport = runScenarioSimulation(state.draft, skills, state.request, currentActor)
  return state.draft.testReport
}

test('retry phase is copied only for the explicit mixed-feedback mode and exact retry value', () => {
  const legacy = normalizeScenarioSimulationRequest({ input: '场景' })
  assert.deepEqual(normalizeScenarioSimulationRequest({ input: '场景', mockDataPhase: 'retry' }), legacy)
  assert.deepEqual(normalizeScenarioSimulationRequest({ input: '场景', mockDataMode: 'other', mockDataPhase: 'retry' }), legacy)
  const initial = normalizeScenarioSimulationRequest({ input: '场景', mockDataMode: 'mixed-feedback' })
  for (const phase of ['initial', 'success', true, 2, null]) {
    assert.deepEqual(normalizeScenarioSimulationRequest({ ...initial, mockDataPhase: phase }), initial)
  }
  assert.deepEqual(normalizeScenarioSimulationRequest({ ...initial, mockDataPhase: 'retry' }), { ...initial, mockDataPhase: 'retry' })
})

test('first run shows mixed data and a retry produces complete data without requiring configuration edits', () => {
  const state = fixture()
  const originalSteps = structuredClone(state.draft.steps)
  const first = run(state)
  assert.deepEqual(first.nodes.map(node => node.status), ['completed', 'blocked'])
  assert.match(first.nodes[1].errors.join(' '), /缺少已认证和待补充材料/)
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, catalog).ok, false)

  state.request = { ...state.request, mockDataPhase: 'retry' }
  const retry = run(state)
  assert.deepEqual(retry.nodes.map(node => node.status), ['completed', 'completed'])
  assert.ok(retry.nodes.every(node => !node.errors.length))
  assert.match(retry.nodes[1].output, /已认证 2 名、待补充材料 1 名/)
  assert.notEqual(retry.nodes[1].output, first.nodes[1].output)
  assert.equal(retry.nodes[1].inputs.find(input => input.source === 'upstream').value, retry.nodes[0].output)
  assert.deepEqual(retry.nodes[0].downstream.map(({ status, sentValue, receivedValue }) => ({ status, sentValue, receivedValue })), [{ status: 'received', sentValue: retry.nodes[0].output, receivedValue: retry.nodes[0].output }])
  assert.deepEqual(state.draft.steps, originalSteps, 'retry changes only fixture phase and cannot rewrite user configuration')
  assert.deepEqual(first.nodes.map(node => node.status), ['completed', 'blocked'], 'the original failure remains a historical snapshot')
})

test('request, report and submitted snapshot retain retry phase and support later successful runs', () => {
  const state = fixture()
  run(state)
  state.request = { ...state.request, mockDataPhase: 'retry' }
  const report = run(state)
  assert.equal(report.request.mockDataPhase, 'retry')
  assert.equal(state.draft.testRequest.mockDataPhase, 'retry')
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, catalog).ok, true)
  const submitted = submitScenarioPackage(state.draft, actor, undefined, catalog)
  assert.equal(submitted.status, 'review')
  assert.equal(submitted.testRequest.mockDataPhase, 'retry')
  assert.equal(submitted.testReport.request.mockDataPhase, 'retry')
  const restored = JSON.parse(JSON.stringify({ draft: submitted, request: submitted.testRequest }))
  assert.deepEqual(run(restored).nodes.map(node => node.status), ['completed', 'completed'])
  assert.equal(evaluateScenarioTrialForSubmit(restored.draft, catalog).ok, true)
  assert.deepEqual(run(fixture()).nodes.map(node => node.status), ['completed', 'blocked'], 'a fresh scenario still starts with the mixed-data example')
})

test('changing the phase invalidates the old report until a matching retry report exists', () => {
  const state = fixture()
  const initial = run(state)
  const originalFingerprint = getScenarioTestFingerprint(state.draft, catalog, state.request)
  assert.match(originalFingerprint, /^scenario-simulation-v3-/)
  state.request = { ...state.request, mockDataPhase: 'retry' }
  state.draft.testRequest = state.request
  assert.notEqual(getScenarioTestFingerprint(state.draft, catalog, state.request), originalFingerprint)
  assert.equal(isScenarioSimulationCurrent(initial, state.draft, catalog, state.request), false)
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, catalog).ok, false)
  const retried = run(state)
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, catalog).ok, true)
  delete state.draft.testRequest.mockDataPhase
  assert.equal(isScenarioSimulationCurrent(retried, state.draft, catalog, state.draft.testRequest), false)
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, catalog).ok, false, 'request and report must agree about the fixture phase')
})

for (const [label, change, expected] of [
  ['missing permissions', () => ({ actor: { ...actor, permissions: [] } }), /权限/],
  ['wrong owner', () => ({ actor: { ...actor, id: 'another-owner' } }), /所有者|主责任人|账号/],
  ['workflow confirmation', state => { state.draft.requiresConfirmation = true }, /整个工作流尚未完成模拟确认/],
  ['missing task', state => { state.draft.steps[0].task = '' }, /本节点任务尚未填写/],
  ['unknown fixed-version sample', state => {
    const skills = catalog.map((skill, index) => index ? { ...skill, version: 'v9.9.9', online: 'v9.9.9' } : skill)
    Object.assign(state, fixture(skills))
    return { skills }
  }, /没有本地样例/]
]) {
  test(`retry phase does not bypass ${label}`, () => {
    const state = fixture()
    const context = change(state) || {}
    state.request = { ...state.request, mockDataPhase: 'retry' }
    const skills = context.skills || catalog
    const currentActor = context.actor || actor
    const report = run(state, currentActor, skills)
    assert.equal(report.status, 'blocked')
    assert.match(report.nodes.flatMap(node => node.errors).join(' '), expected)
    assert.equal(evaluateScenarioTrialForSubmit(state.draft, skills).ok, false)
    assert.throws(() => submitScenarioPackage(state.draft, currentActor, undefined, skills))
    assert.ok(report.nodes.filter(node => node.status === 'blocked').every(node => node.output === ''), 'actual blockers cannot be relabeled as successful fixture execution')
  })
}
