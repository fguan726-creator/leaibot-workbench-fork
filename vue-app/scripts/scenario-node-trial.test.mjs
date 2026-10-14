import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinnedScenarioStep, evaluateScenarioTrialForSubmit, submitScenarioPackage } from '../src/domain/scenarioSkillPackages.js'
import { runScenarioSimulation, isScenarioSimulationCurrent } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor } from './helpers/scenarioActors.mjs'

const catalog = [
  ['employee-certification-insight', 'v1.0.0', '认证查询'],
  ['workplace-segment-operations', 'v1.2.0', '人群分析'],
  ['enterprise-customer-followup', 'v1.0.0', '跟进建议']
].map(([id, version, name]) => ({ id, version, name, menu: name, online: version, status: 'published', onlineStatus: 'published', permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] } }))
const actor = scenarioPmActor('creator', catalog)
function trial({ conditional = false, blocked = false, manual = true, legacy = false } = {}) {
  const steps = catalog.map((skill, index) => createPinnedScenarioStep(skill, { id: `n${index}`, predecessorId: index ? `n${index - 1}` : null, task: skill.name, expectedOutput: `预期：${skill.name}` }))
  if (conditional) Object.assign(steps[1], { kind: 'conditional', required: false, condition: '需要深入分析时' })
  if (blocked) steps[0].requiresApproval = true
  if (legacy) steps.forEach(step => { delete step.predecessorId })
  const draft = { id: 'node-trial', name: '节点测试', description: '查询认证并生成人群分析与跟进建议', targetAudience: '运营', ownerId: actor.id, steps }
  const testRequest = { input: '检查人群 A', expectedOutput: '', activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [], sampleOutputs: manual ? { n0: '认证结果 A', n1: '分析结果 B', n2: '跟进建议 C' } : {} }
  const testReport = runScenarioSimulation(draft, catalog, testRequest, actor, '2026-09-10T02:00:00.000Z')
  return { ...draft, testRequest, testReport }
}

test('each node records its fixed Skill version and real sample source; direct transfers retain exact sent and received contents', () => {
  const draft = trial()
  const nodes = draft.testReport.nodes
  assert.equal(nodes[0].skillId, catalog[0].id)
  assert.equal(nodes[0].pinnedVersion, catalog[0].version)
  assert.equal(nodes[0].outputSource, 'manual')
  assert.deepEqual(nodes[0].downstream.map(({ nodeId, status, sentValue, receivedValue }) => ({ nodeId, status, sentValue, receivedValue })), [{ nodeId: 'n1', status: 'received', sentValue: '认证结果 A', receivedValue: '认证结果 A' }])
  assert.deepEqual(nodes[1].downstream.map(t => t.nodeId), ['n2'])
  assert.deepEqual(nodes[2].downstream, [])
  assert.deepEqual(nodes[2].inputs.filter(i => i.source === 'upstream').map(i => i.nodeId), ['n0', 'n1'], 'all connected ancestors remain available; direct-edge display must not erase inherited input')
  assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
  assert.equal(submitScenarioPackage(draft, actor, undefined, catalog).status, 'review')
})

test('versioned fixtures are labelled fixtures without claiming business correctness', () => {
  const nodes = trial({ manual: false }).testReport.nodes
  assert.ok(nodes.every(node => node.outputSource === 'fixture'))
  assert.ok(nodes.every(node => !Object.hasOwn(node, 'score') && !Object.hasOwn(node, 'feedbackCorrect')))
})

test('a blocked node cannot report a successful transfer and dependent nodes retain their own errors', () => {
  const draft = trial({ blocked: true })
  assert.deepEqual(draft.testReport.nodes.map(n => n.status), ['blocked', 'blocked', 'blocked'])
  assert.equal(draft.testReport.nodes[0].outputSource, 'none')
  assert.match(draft.testReport.nodes[0].errors.join(' '), /审批/)
  assert.equal(draft.testReport.nodes[0].downstream[0].status, 'blocked')
  assert.equal(draft.testReport.nodes[0].downstream[0].receivedValue, '')
  assert.match(draft.testReport.nodes[1].errors.join(' '), /上游/)
  assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, false)
  assert.ok(!evaluateScenarioTrialForSubmit(draft, catalog).reasons.some(reason => reason.includes('反馈来源不一致')))
})

test('skipped conditions show skipped transfers while later nodes still receive completed ancestor output', () => {
  const draft = trial({ conditional: true })
  const [a, b, c] = draft.testReport.nodes
  assert.equal(a.downstream[0].status, 'skipped')
  assert.equal(a.downstream[0].sentValue, '')
  assert.equal(a.downstream[0].receivedValue, '')
  assert.equal(b.downstream[0].status, 'skipped')
  assert.equal(b.outputSource, 'none')
  assert.equal(b.output, '')
  assert.deepEqual(c.inputs.filter(i => i.source === 'upstream').map(i => i.value), [a.output])
  assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
})

test('legacy linear drafts acquire explicit trace results without changing their stored topology', () => {
  const draft = trial({ legacy: true })
  assert.deepEqual(draft.testReport.nodes.map(n => n.downstream.map(t => t.nodeId)), [['n1'], ['n2'], []])
  assert.ok(draft.steps.every(step => step.predecessorId === undefined))
  assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
})

const corruptions = {
  'missing upstream': d => { d.testReport.nodes[1].inputs = d.testReport.nodes[1].inputs.filter(i => i.source !== 'upstream') },
  'altered upstream payload': d => { d.testReport.nodes[1].inputs[1].value = '另一份结果' },
  'invented source': d => { d.testReport.nodes[1].inputs.push({ source: 'upstream', nodeId: 'ghost', name: '伪造来源', value: 'x' }) },
  'duplicate source': d => { d.testReport.nodes[1].inputs.push({ ...d.testReport.nodes[1].inputs[1] }) },
  'wrong ordering': d => { d.testReport.nodes[2].inputs.reverse() },
  'invalid output type': d => { d.testReport.nodes[0].output = 1 },
  'invalid input type': d => { d.testReport.nodes[1].inputs = {} },
  'invalid receipt type': d => { d.testReport.nodes[1].inputs[1].value = 1 },
  'wrong Skill version': d => { d.testReport.nodes[0].pinnedVersion = 'v999' },
  'wrong Skill identity': d => { d.testReport.nodes[0].skillId = 'other' },
  'false sample source': d => { d.testReport.nodes[0].outputSource = 'fixture' },
  'altered manual feedback': d => {
    d.testReport.nodes[2].output = '改动后的反馈，与手工样例不符'
  },
  'missing direct transfer': d => { d.testReport.nodes[0].downstream = [] },
  'altered transfer receipt': d => { d.testReport.nodes[0].downstream[0].receivedValue = '不一致' },
  'transfer to wrong node': d => { d.testReport.nodes[0].downstream[0].nodeId = 'n2' },
  'duplicated direct transfer': d => { d.testReport.nodes[0].downstream.push({ ...d.testReport.nodes[0].downstream[0] }) },
  'false blocked transfer': d => { d.testReport.nodes[0].downstream[0].status = 'blocked' },
  'unrecorded historical trace': d => { d.testReport.nodes.forEach(n => { delete n.downstream }) }
}
for (const [name, corrupt] of Object.entries(corruptions)) {
  test(`submission rejects ${name} without rewriting evidence`, () => {
    const draft = trial()
    corrupt(draft)
    const before = structuredClone(draft)
    assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, false)
    assert.throws(() => submitScenarioPackage(draft, actor, undefined, catalog), /试运行|传递/)
    assert.deepEqual(draft, before)
  })
}

test('a skipped node cannot carry fabricated output or leak it downstream', () => {
  for (const patch of [
    d => { d.testReport.nodes[1].output = '虚构结果' },
    d => { d.testReport.nodes[2].inputs.push({ source: 'upstream', nodeId: 'n1', name: '人群分析', value: '虚构结果' }) },
    d => { d.testReport.nodes[1].inputs = [{ source: 'run', name: '本次运行输入', value: d.testRequest.input }] }
  ]) {
    const draft = trial({ conditional: true }); patch(draft)
    assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, false)
  }
})

test('historical fingerprint reports are stale and only a fresh retry resolves modified requests', () => {
  const draft = trial()
  const old = { ...draft.testReport, fingerprint: draft.testReport.fingerprint.replace('v2-', 'v1-') }
  assert.equal(isScenarioSimulationCurrent(old, draft, catalog, draft.testRequest), false)
  draft.testRequest.sampleOutputs.n0 = '修改后的反馈'
  assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, false)
  draft.testReport = runScenarioSimulation(draft, catalog, draft.testRequest, actor)
  assert.equal(draft.testReport.nodes[1].inputs[1].value, '修改后的反馈')
  assert.equal(evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
})
