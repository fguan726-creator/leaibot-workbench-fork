import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { createPinnedScenarioStep, evaluateScenarioTrialForSubmit } from '../src/domain/scenarioSkillPackages.js'
import { createScenarioSimulationRequest, getScenarioVersionSample, runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }
const httpHost = createHttpServer()
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), logLevel: 'error', server: { middlewareMode: true, hmr: { server: httpHost } }, appType: 'custom' })
const { useScenarioSkillPackagesStore } = await server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts')
after(async () => {
  await server.close()
  httpHost.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})

function fixture() {
  setActivePinia(createPinia())
  const catalog = JSON.parse(JSON.stringify(useScenarioSkillPackagesStore().selectableSkills))
  const actor = scenarioPmActor('catalog-trial-owner', catalog)
  const selected = ['capability-update-failure-demo', 'employee-certification-insight'].map(id => catalog.find(skill => skill.id === id))
  assert.ok(selected.every(Boolean), 'the screenshot Skills must come from the real selectable catalog')
  const draft = {
    id: 'catalog-retry', name: '运营查询与职场认证', ownerId: actor.id,
    description: '汇总运营数据，再检查职场认证状态。', targetAudience: '运营人员',
    steps: selected.map((skill, index) => createPinnedScenarioStep(skill, {
      id: `catalog-node-${index}`, predecessorId: index ? 'catalog-node-0' : null,
      task: skill.description, expectedOutput: ''
    }))
  }
  return { catalog, actor, draft, request: { ...createScenarioSimulationRequest(draft), mockDataMode: 'mixed-feedback' } }
}

function run(state) {
  state.draft.testRequest = state.request
  state.draft.testReport = runScenarioSimulation(state.draft, state.catalog, state.request, state.actor)
  return state.draft.testReport
}

test('every default selectable POC Skill has an explicit sample for its published version', () => {
  const state = fixture()
  const { catalog } = state
  assert.ok(catalog.length >= 7)
  for (const skill of catalog) {
    const sample = getScenarioVersionSample(skill.id, skill.version)
    assert.ok(sample, `${skill.id}@${skill.version} is selectable but has no trial fixture`)
    assert.match(sample.output, /模拟样例/)
    const companion = catalog.find(other => other.id !== skill.id && other.menu !== skill.menu)
    assert.ok(companion, 'the catalog must offer a valid cross-menu trial')
    state.draft.steps = [skill, companion].map((item, index) => createPinnedScenarioStep(item, {
      id: `catalog-node-${index}`, predecessorId: index ? 'catalog-node-0' : null, task: item.description
    }))
    state.request = { ...createScenarioSimulationRequest(state.draft), mockDataMode: 'mixed-feedback', mockDataPhase: 'retry' }
    const report = run(state)
    assert.equal(report.nodes[0].status, 'completed', `${skill.id}@${skill.version} must work in the authoring trial, not only the application getter`)
    assert.equal(report.nodes[0].outputSource, 'fixture')
    assert.equal(report.nodes[0].output, sample.output)
  }
})

test('the screenshot catalog combination preserves first-run feedback and completes on retry', () => {
  const state = fixture()
  const originalSteps = structuredClone(state.draft.steps)
  const first = run(state)
  assert.deepEqual(first.nodes.map(node => node.status), ['completed', 'blocked'])
  assert.match(first.nodes[0].output, /模拟样例.*运营/)
  assert.match(first.nodes[1].errors.join(' '), /缺少已认证和待补充材料/)
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, state.catalog).ok, false)

  state.request = { ...state.request, mockDataPhase: 'retry' }
  const retry = run(state)
  assert.deepEqual(retry.nodes.map(node => node.status), ['completed', 'completed'])
  assert.ok(retry.nodes.every(node => node.outputSource === 'fixture' && node.errors.length === 0))
  assert.equal(retry.executionPerformed, false)
  assert.equal(retry.nodes[1].inputs.find(input => input.source === 'upstream').value, retry.nodes[0].output)
  assert.equal(retry.nodes[0].downstream[0].receivedValue, retry.nodes[0].output)
  assert.equal(evaluateScenarioTrialForSubmit(state.draft, state.catalog).ok, true)
  assert.deepEqual(state.draft.steps, originalSteps)
  assert.deepEqual(first.nodes.map(node => node.status), ['completed', 'blocked'])
})

for (const [label, change, expected] of [
  ['unknown version', state => {
    const skill = state.catalog.find(item => item.id === 'capability-update-failure-demo')
    skill.version = skill.online = 'v9.9.9'
    state.draft.steps[0] = createPinnedScenarioStep(skill, { id: 'catalog-node-0', predecessorId: null, task: skill.description })
  }, /没有本地样例/],
  ['missing permissions', state => { state.actor.permissions = [] }, /权限/],
  ['disabled dependency', state => { state.catalog.find(item => item.id === 'capability-update-failure-demo').onlineStatus = 'disabled' }, /禁用/],
  ['workflow confirmation', state => { state.draft.requiresConfirmation = true }, /整个工作流尚未完成模拟确认/]
]) {
  test(`the demo fixture cannot bypass ${label}`, () => {
    const state = fixture()
    change(state)
    state.request.mockDataPhase = 'retry'
    const report = run(state)
    assert.equal(report.status, 'blocked')
    assert.match(report.nodes.flatMap(node => node.errors).join(' '), expected)
    assert.ok(report.nodes.every(node => node.status === 'blocked' && node.output === ''))
    assert.equal(evaluateScenarioTrialForSubmit(state.draft, state.catalog).ok, false)
  })
}

test('the demo sample is isolated by exact Skill id and returned as a detached copy', () => {
  const sample = getScenarioVersionSample('capability-update-failure-demo', 'v1.0.0')
  assert.ok(sample)
  sample.output = 'changed by caller'
  assert.notEqual(getScenarioVersionSample('capability-update-failure-demo', 'v1.0.0').output, sample.output)
  assert.equal(getScenarioVersionSample('unknown-demo', 'v1.0.0'), undefined)
  assert.equal(getScenarioVersionSample('capability-update-failure-demo', 'v1.0.1'), undefined)
})
