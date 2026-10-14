import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { fileURLToPath } from 'node:url'
import { scenarioPmActor } from './helpers/scenarioActors.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const host = createHttpServer()
const server = await createServer({ root, server: { middlewareMode: true, hmr: { server: host } }, appType: 'custom', logLevel: 'error' })
after(async () => { await server.close(); host.close() })
const { default: Panel } = await server.ssrLoadModule('/src/views/agent/ScenarioPackageTrialPanel.vue')
const { default: ReportSummary } = await server.ssrLoadModule('/src/views/agent/ScenarioTestReportSummary.vue')
const { createPinnedScenarioStep } = await server.ssrLoadModule('/src/domain/scenarioSkillPackages.js')
const { createScenarioSimulationRequest, runScenarioSimulation, getScenarioTestFingerprint } = await server.ssrLoadModule('/src/domain/scenarioPackageTesting.js')
const skills = [['employee-certification-insight', 'v1.0.0'], ['workplace-segment-operations', 'v1.2.0']].map(([id, version]) => ({ id, version, name: id, menu: id, status: 'published', onlineStatus: 'published', online: version, permissions: { menu: [id], skill: [id], data: [id], action: [id] } }))
const actor = scenarioPmActor('creator', skills)
function props(options = {}) {
  const steps = skills.map((skill, index) => createPinnedScenarioStep(skill, { id: `n${index}`, task: `执行节点 ${index} 的查询分析任务`, expectedOutput: `输出节点 ${index} 的查询结果与分析建议`, predecessorId: index ? 'n0' : null, kind: index === 1 && options.conditional ? 'conditional' : 'required', condition: index === 1 && options.conditional ? '需要分析时' : '', required: !options.conditional || index === 0 }))
  const requiresConfirmation = !options.conditional && options.requiresConfirmation !== false
  const draft = { id: 'run-actions', name: '场景', description: '查询后分析', targetAudience: '运营', ownerId: actor.id, requiresConfirmation, steps }
  return { draft, skills, actor, requiresConfirmation, report: null, modelValue: createScenarioSimulationRequest(draft), disabled: Boolean(options.disabled) }
}
async function setup(values) {
  let state
  const events = []
  const Wrapped = { ...Panel, setup(p, context) { state = Panel.setup(p, context); return state } }
  await renderToString(createSSRApp({ render: () => h(Wrapped, { ...values, 'onUpdate:report': report => events.push(['report', report]), 'onUpdate:modelValue': request => events.push(['request', request]), onRunning: value => events.push(['running', value]) }) }))
  return { state, events, report: () => events.findLast(([key, value]) => key === 'report' && value)?.[1] }
}
test('one workflow confirmation retries every node without creating node confirmations or approvals', async () => {
  const values = props(), before = structuredClone(values)
  const run = await setup(values)
  await run.state.runTrial()
  assert.deepEqual(run.report().nodes.map(node => node.status), ['blocked', 'blocked'])
  await run.state.confirmWorkflowAndRetry()
  assert.equal(run.report().request.workflowConfirmed, true)
  assert.deepEqual(run.report().request.confirmedStepIds, [])
  assert.deepEqual(run.report().request.approvedStepIds, [])
  assert.deepEqual(run.report().nodes.map(node => node.status), ['completed', 'completed'])
  assert.deepEqual(values, before)
})
test('workflow confirmation cannot bypass missing permissions or inherited approval requirements', async () => {
  const values = props()
  values.actor = { ...actor, permissions: actor.permissions.filter(permission => permission !== `skill:${skills[0].id}:reference`) }
  const denied = await setup(values)
  await denied.state.confirmWorkflowAndRetry()
  assert.equal(denied.report().request.workflowConfirmed, true)
  assert.equal(denied.report().nodes[0].status, 'blocked')
  values.actor = actor
  values.draft.steps[1].requiresApproval = true
  values.modelValue.approvedStepIds = ['n1']
  const run = await setup(values)
  await run.state.confirmWorkflowAndRetry()
  assert.equal(run.report().request.workflowConfirmed, true)
  assert.deepEqual(run.report().request.approvedStepIds, [])
  assert.equal(run.report().nodes[0].status, 'completed')
  assert.equal(run.report().nodes[1].status, 'blocked')
})
test('conditional branch can be tested and then skipped again by explicit retry', async () => {
  const values = props({ conditional: true })
  const run = await setup(values)
  await run.state.toggleBranchAndRetry('n1')
  assert.equal(run.report().nodes[1].status, 'completed')
  const again = await setup({ ...values, modelValue: run.report().request })
  await again.state.toggleBranchAndRetry('n1')
  assert.equal(again.report().nodes[1].status, 'skipped')
  assert.deepEqual(again.report().request.activeOptionalStepIds, [])
})
test('changing a conditional branch requires a new workflow confirmation before any sample runs', async () => {
  const values = props({ conditional: true })
  values.requiresConfirmation = true
  values.draft.requiresConfirmation = true
  values.modelValue.workflowConfirmed = true
  const run = await setup(values)
  await run.state.toggleBranchAndRetry('n1')
  assert.equal(run.report().request.workflowConfirmed, false)
  assert.deepEqual(run.report().nodes.map(node => node.status), ['blocked', 'blocked'])
  assert.ok(run.report().nodes.every(node => node.output === '' && node.inputs.length === 0))
  const again = await setup({ ...values, modelValue: run.report().request, report: run.report() })
  await again.state.confirmWorkflowAndRetry()
  assert.equal(again.report().request.workflowConfirmed, true)
  assert.deepEqual(again.report().nodes.map(node => node.status), ['completed', 'completed'])
})
test('new trial discards hidden handwritten sample overrides and records built-in output', async () => {
  const values = props({ requiresConfirmation: false })
  values.modelValue.sampleOutputs.n0 = '过往手工伪造反馈'
  const run = await setup(values)
  await run.state.runTrial()
  assert.deepEqual(run.report().request.sampleOutputs, {})
  assert.equal(run.report().nodes[0].outputSource, 'fixture')
  assert.notEqual(run.report().nodes[0].output, '过往手工伪造反馈')
  assert.deepEqual(run.events.find(([key]) => key === 'request')[1].sampleOutputs, {})
  assert.equal(values.modelValue.sampleOutputs.n0, '过往手工伪造反馈')
})
test('readonly, concurrent and unnecessary confirmation actions cannot change runtime choices', async () => {
  const locked = await setup(props({ disabled: true }))
  await locked.state.confirmWorkflowAndRetry()
  await locked.state.toggleBranchAndRetry('n1')
  await locked.state.runTrial()
  assert.deepEqual(locked.events, [])
  const unnecessary = await setup(props({ requiresConfirmation: false }))
  await unnecessary.state.confirmWorkflowAndRetry()
  await unnecessary.state.toggleBranchAndRetry('n1')
  assert.deepEqual(unnecessary.events, [])
  const confirmed = props()
  confirmed.modelValue.workflowConfirmed = true
  const again = await setup(confirmed)
  await again.state.confirmWorkflowAndRetry()
  assert.deepEqual(again.events, [])
  const run = await setup(props())
  const first = run.state.runTrial()
  await run.state.confirmWorkflowAndRetry()
  await first
  assert.equal(run.events.filter(([key, value]) => key === 'report' && value).length, 1)
  assert.deepEqual(run.report().request.confirmedStepIds, [])
  assert.notEqual(run.report().request.workflowConfirmed, true)
})


test('an old successful report rejected by the current task check asks for a new trial without relabelling its historical nodes', async () => {
  const values = props({ conditional: true })
  values.report = runScenarioSimulation(values.draft, skills, values.modelValue, actor)
  values.draft.steps[0].task = ''
  values.modelValue = createScenarioSimulationRequest(values.draft)
  values.report.request = structuredClone(values.modelValue)
  values.report.fingerprint = getScenarioTestFingerprint(values.draft, skills, values.modelValue)
  values.report.nodes[0].task = ''
  values.report.nodes[0].inputs[0].value = values.modelValue.input
  const before = structuredClone(values.report)
  const html = await renderToString(createSSRApp({ render: () => h(Panel, values) }))
  assert.match(html, /当前报告不满足提交条件，请重新试运行以查看节点报错和修改建议/)
  assert.doesNotMatch(html, /本轮存在错误，不能提交/)
  assert.deepEqual(values.report, before)
})

test('report evidence shows whole-workflow confirmation and preserves truthful legacy and unconfirmed records', async () => {
  const values = props({ requiresConfirmation: false })
  const report = runScenarioSimulation(values.draft, skills, values.modelValue, actor)
  for (const [evidence, expected] of [
    [{ workflowConfirmed: true, confirmedStepIds: [] }, '已确认整个工作流'],
    [{ workflowConfirmed: undefined, confirmedStepIds: ['n1'] }, 'workplace-segment-operations'],
    [{ workflowConfirmed: false, confirmedStepIds: [] }, '无']
  ]) {
    const recorded = { ...report, request: { ...report.request, ...evidence } }
    const before = structuredClone(recorded)
    const html = await renderToString(createSSRApp({ render: () => h(ReportSummary, { report: recorded }) }))
    assert.equal(html.match(/<dt[^>]*>模拟确认<\/dt><dd[^>]*>([^<]*)<\/dd>/)?.[1], expected)
    assert.deepEqual(recorded, before)
  }
})
