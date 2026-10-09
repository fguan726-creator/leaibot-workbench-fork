import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
import * as domain from '../src/domain/scenarioSkillPackages.js'
import { scenarioPmActor } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }

const sim = await import('../src/domain/scenarioPackageTesting.js').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
  return {}
})
const now = '2026-09-10T01:00:00.000Z'
const reviewer = { id: 'reviewer', permissions: ['scenario-package:review'] }
const sampleSkill = (id, version, menu) => ({ id, name: id, menu, version, online: version, status: 'published', onlineStatus: 'published', permissions: { menu: [`menu:${menu}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] } })
const catalog = [
  sampleSkill('employee-certification-insight', 'v1.0.0', '员工管理'),
  sampleSkill('workplace-segment-operations', 'v1.2.0', '人群经营'),
  sampleSkill('enterprise-customer-followup', 'v1.0.0', '企业客户')
]
const actor = scenarioPmActor('creator', catalog, ['simulation-package'])
const draftOf = (skills = catalog.slice(0, 2)) => ({
  id: 'simulation-package', name: '职场经营场景', description: '了解认证情况并分析经营机会，仅生成建议。', targetAudience: '运营人员', ownerId: actor.id,
  steps: skills.map((skill, index) => domain.createPinnedScenarioStep(skill, { id: String.fromCharCode(97 + index), predecessorId: index ? String.fromCharCode(96 + index) : null, task: `任务${index}`, expectedOutput: `预期${index}` }))
})
const requestOf = (overrides = {}) => ({ input: '分析职场A最近两周的认证情况。', expectedOutput: '希望看到人群经营建议。', activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [], sampleOutputs: {}, ...overrides })
const clone = value => JSON.parse(JSON.stringify(value))

test('submission refuses an untested draft without mutating its input', () => {
  const draft = draftOf()
  const before = structuredClone(draft)
  assert.throws(() => domain.submitScenarioPackage(draft, actor, now, catalog), /试运行/)
  assert.deepEqual(draft, before)
})

test('trial submission accepts complete current reports including warnings and explicitly skipped conditions', () => {
  assert.equal(typeof sim.evaluateScenarioTrialForSubmit, 'function')
  for (const withWarnings of [false, true]) {
    const draft = draftOf(catalog)
    draft.steps[1] = { ...draft.steps[1], kind: 'conditional', required: false, condition: '需要人群分析时' }
    if (withWarnings) draft.steps[0].expectedOutput = ''
    draft.testRequest = requestOf()
    draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, now)
    assert.equal(draft.testReport.status, withWarnings ? 'attention' : 'completed')
    assert.deepEqual(draft.testReport.nodes.map(node => node.status), ['completed', 'skipped', 'completed'])
    assert.deepEqual(sim.evaluateScenarioTrialForSubmit(draft, catalog), { ok: true, reasons: [] })
    assert.equal(domain.submitScenarioPackage(draft, actor, now, catalog).status, 'review')
  }
})

test('trial submission rejects stale, blocked, empty and incomplete reports without changing their snapshots', () => {
  const draft = draftOf()
  draft.testRequest = requestOf()
  draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, now)
  const invalid = [
    value => { delete value.testReport },
    value => { value.description += '已修改' },
    value => { value.testRequest.input += '新输入' },
    value => { value.testReport.request.input += '报告被修改' },
    value => { value.testReport.mode = 'execution' },
    value => { value.testReport.executionPerformed = true },
    value => { value.testReport.status = 'blocked' },
    value => { value.testReport.nodes = [] },
    value => { value.testReport.nodes.pop() },
    value => { value.testReport.nodes.reverse() },
    value => { value.testReport.nodes[1].id = value.testReport.nodes[0].id },
    value => { value.testReport.nodes[0].status = 'blocked' },
    value => { value.testReport.nodes[0].status = 'skipped' },
    value => { value.testReport.nodes[0].output = '' },
    value => { value.testReport.nodes[0].inputs = [] },
    value => { value.testReport.nodes[0].errors = ['缺少必需样例输出'] }
  ]
  for (const mutate of invalid) {
    const changed = clone(draft)
    mutate(changed)
    const before = clone(changed)
    assert.equal(sim.evaluateScenarioTrialForSubmit(changed, catalog).ok, false)
    assert.throws(() => domain.submitScenarioPackage(changed, actor, now, catalog), /试运行/)
    assert.deepEqual(changed, before)
  }
  const updatedCatalog = clone(catalog)
  updatedCatalog[0].permissions.data.push('data:new')
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, updatedCatalog).ok, false)
  assert.throws(() => domain.submitScenarioPackage(draft, actor, now, updatedCatalog), /试运行/)
})

test('node errors contain only blocking causes while configuration reminders remain nonblocking', () => {
  const draft = draftOf()
  draft.steps[0].expectedOutput = ''
  draft.steps[0].requiresApproval = true
  const blocked = sim.runScenarioSimulation(draft, catalog, requestOf(), actor, now)
  assert.match(blocked.nodes[0].errors.join(' '), /审批/)
  assert.doesNotMatch(blocked.nodes[0].errors.join(' '), /预期输出/)
  const passing = sim.runScenarioSimulation(draft, catalog, requestOf({ approvedStepIds: ['a'] }), actor, now)
  assert.equal(passing.status, 'attention')
  assert.deepEqual(passing.nodes[0].errors, [])
  assert.match(passing.nodes[0].issues.join(' '), /预期输出/)
})

test('simulation passes only explicit sample outputs to completed downstream nodes without executing Skills', () => {
  assert.equal(typeof sim.runScenarioSimulation, 'function', 'the simulation capability must be implemented')
  const draft = draftOf()
  const request = requestOf({ sampleOutputs: { a: '手工样例：2人已认证、1人待补充。', b: '手工样例：优先跟进待补充人群。' } })
  const report = sim.runScenarioSimulation(draft, catalog, request, actor, now)
  assert.equal(report.mode, 'simulation')
  assert.equal(report.executionPerformed, false)
  assert.equal(report.status, 'completed')
  assert.equal(report.testerId, 'creator')
  assert.equal(report.createdAt, now)
  assert.deepEqual(report.nodes.map(n => n.status), ['completed', 'completed'])
  assert.deepEqual(report.nodes[1].inputs, [
    { name: '本次运行输入', value: '分析职场A最近两周的认证情况。', source: 'run' },
    { name: 'employee-certification-insight', value: '手工样例：2人已认证、1人待补充。', source: 'upstream', nodeId: 'a' }
  ])
  assert.equal(report.nodes[1].output, '手工样例：优先跟进待补充人群。')
  assert.equal(Object.hasOwn(report, 'score'), false)
  assert.equal(Object.hasOwn(report, 'auditEvents'), false)
  assert.match(report.summary, /模拟/)
})

test('default request follows configured scene and nodes without preselecting conditions or approval tickets', () => {
  const draft = draftOf(catalog)
  draft.steps[1] = { ...draft.steps[1], kind: 'conditional', required: false, condition: '需要人群分析时', requiresConfirmation: true, requiresApproval: true }
  const request = sim.createScenarioSimulationRequest(draft)
  assert.ok(request.input.trim())
  assert.ok(request.input.includes(draft.name))
  assert.ok(request.input.includes(draft.description))
  assert.ok(request.input.includes(draft.targetAudience))
  for (const step of draft.steps) {
    assert.ok(request.input.includes(step.task))
    assert.ok(request.input.includes(step.expectedOutput))
  }
  assert.ok(request.input.includes(draft.steps[1].condition))
  assert.ok(request.expectedOutput.trim())
  assert.deepEqual(request.activeOptionalStepIds, [])
  assert.deepEqual(request.confirmedStepIds, [])
  assert.deepEqual(request.approvedStepIds, [])
  assert.deepEqual(request.sampleOutputs, {})
  request.sampleOutputs.a = 'changed'
  assert.deepEqual(sim.createScenarioSimulationRequest(draft).sampleOutputs, {})
})

test('configuration-derived trial follows graph order and updates with configuration without changing historical reports', () => {
  const draft = draftOf()
  draft.steps[0].fixedRequirements = '只使用已认证数据'
  draft.steps.reverse()
  const before = structuredClone(draft)
  const request = sim.createScenarioSimulationRequest(draft)
  assert.ok(request.input.indexOf('任务0') < request.input.indexOf('任务1'))
  assert.ok(request.input.includes('只使用已认证数据'))
  assert.deepEqual(draft, before)
  const report = sim.runScenarioSimulation(draft, catalog, request, actor, now)
  const snapshot = structuredClone(report)
  assert.equal(sim.evaluateScenarioTrialForSubmit({ ...draft, testRequest: request, testReport: report }, catalog).ok, true)
  draft.description = '新的适用场景'
  draft.steps[0].task = '新的节点任务'
  const refreshed = sim.createScenarioSimulationRequest(draft)
  assert.ok(refreshed.input.includes('新的适用场景'))
  assert.ok(refreshed.input.includes('新的节点任务'))
  assert.notEqual(refreshed.input, request.input)
  assert.equal(sim.isScenarioSimulationCurrent(report, draft, catalog, refreshed), false)
  assert.deepEqual(report, snapshot)
  const retry = sim.runScenarioSimulation(draft, catalog, refreshed, actor, now)
  assert.equal(sim.evaluateScenarioTrialForSubmit({ ...draft, testRequest: refreshed, testReport: retry }, catalog).ok, true)
})

test('an empty creation canvas still receives a usable default request', () => {
  for (const draft of [{}, { name: '', description: '', steps: [] }]) {
    const request = sim.createScenarioSimulationRequest(draft)
    assert.ok(request.input.trim())
    assert.deepEqual(request.activeOptionalStepIds, [])
    assert.deepEqual(request.sampleOutputs, {})
  }
})

test('all six known published versions have labelled local samples, never their configured expected output', () => {
  const skills = [
    ...catalog,
    sampleSkill('product-knowledge', 'v1.0.7', '产品'),
    sampleSkill('voucher-recommend', 'v0.1.3', '权益'),
    sampleSkill('gmv-daily-summary', 'v1.2.0', 'GMV')
  ]
  const actor = scenarioPmActor('creator', skills)
  for (const skill of skills) {
    const other = skills.find(candidate => candidate.id !== skill.id)
    const draft = draftOf([skill, other])
    const report = sim.runScenarioSimulation(draft, skills, requestOf(), actor, now)
    assert.equal(report.status, 'completed', skill.id)
    assert.match(report.nodes[0].output, /模拟样例/)
    assert.notEqual(report.nodes[0].output, draft.steps[0].expectedOutput)
    assert.notEqual(report.nodes[0].output, report.request.expectedOutput)
  }
})

test('conditions are selected explicitly; a skipped optional ancestor provides no fictional output', () => {
  const draft = draftOf(catalog)
  draft.steps[1] = { ...draft.steps[1], kind: 'conditional', required: false, condition: '这段文字说永远成立，但模拟不能自行解析' }
  const report = sim.runScenarioSimulation(draft, catalog, requestOf({ sampleOutputs: { a: '样例A', b: '样例B', c: '样例C' } }), actor, now)
  assert.deepEqual(report.nodes.map(n => n.status), ['completed', 'skipped', 'completed'])
  assert.equal(report.nodes[1].output, '')
  assert.deepEqual(report.nodes[2].inputs.filter(i => i.source === 'upstream').map(i => i.nodeId), ['a'])
  const active = sim.runScenarioSimulation(draft, catalog, requestOf({ activeOptionalStepIds: ['b'], sampleOutputs: { a: '样例A', b: '样例B' } }), actor, now)
  assert.deepEqual(active.nodes[2].inputs.filter(i => i.source === 'upstream').map(i => i.value), ['样例A', '样例B'])
})

test('an unknown version blocks without manual output and blocks dependent required nodes', () => {
  const skills = clone(catalog)
  skills[0].online = skills[0].version = 'v9.0.0'
  const draft = draftOf(skills.slice(0, 2))
  const report = sim.runScenarioSimulation(draft, skills, requestOf(), actor, now)
  assert.equal(report.status, 'blocked')
  assert.deepEqual(report.nodes.map(n => n.status), ['blocked', 'blocked'])
  assert.equal(report.nodes[0].output, '')
  assert.equal(report.nodes[1].output, '')
  assert.match(report.nodes[1].issues.join(' '), /上游/)
  const manual = sim.runScenarioSimulation(draft, skills, requestOf({ sampleOutputs: { a: '新版手工样例' } }), actor, now)
  assert.equal(manual.status, 'completed')
  assert.equal(manual.nodes[0].output, '新版手工样例')
})

test('confirmation and approval are node-specific simulation tickets, not true audit evidence', () => {
  const draft = draftOf()
  draft.steps[0].requiresConfirmation = true
  draft.steps[0].requiresApproval = true
  const wrong = sim.runScenarioSimulation(draft, catalog, requestOf({ confirmedStepIds: ['b'], approvedStepIds: ['b'] }), actor, now)
  assert.equal(wrong.nodes[0].status, 'blocked')
  assert.match(wrong.nodes[0].issues.join(' '), /确认/)
  assert.match(wrong.nodes[0].issues.join(' '), /审批/)
  const granted = sim.runScenarioSimulation(draft, catalog, requestOf({ confirmedStepIds: ['a'], approvedStepIds: ['a'] }), actor, now)
  assert.equal(granted.status, 'completed')
  assert.equal(granted.executionPerformed, false)
  const submitted = domain.submitScenarioPackage({ ...draft, testReport: granted }, actor, now, catalog)
  assert.deepEqual(submitted.auditEvents.map(e => e.type), ['submitted'])
  assert.equal(domain.evaluateRuntimeAccess(submitted, actor).status, 'blocked')
})

test('empty expected output remains a reminder without invented quality scores', () => {
  const draft = draftOf()
  draft.steps[0].expectedOutput = ''
  const report = sim.runScenarioSimulation(draft, catalog, requestOf(), actor, now)
  assert.equal(report.status, 'attention')
  assert.equal(report.nodes[0].status, 'completed')
  assert.equal(report.nodes[0].task, '任务0')
  assert.equal(report.nodes[0].expectedOutput, '')
  assert.match(report.nodes[0].issues.join(' '), /预期输出/)
  assert.equal(Object.hasOwn(report.nodes[0], 'score'), false)
  assert.match(report.nodes[0].output, /模拟样例/)
})

test('empty or whitespace tasks block node output and name the required upstream that must be fixed', () => {
  for (const task of ['', ' \n\t ']) {
    const draft = draftOf()
    draft.steps[0].task = task
    const before = structuredClone(draft)
    const report = sim.runScenarioSimulation(draft, catalog, requestOf(), actor, now)
    assert.equal(report.status, 'blocked')
    assert.deepEqual(report.nodes.map(node => node.status), ['blocked', 'blocked'])
    assert.ok(report.nodes.every(node => node.output === '' && node.outputSource === 'none'))
    assert.match(report.nodes[0].errors.join(' '), /本节点任务/)
    assert.doesNotMatch(report.nodes[0].errors.join(' '), /返回编排/)
    assert.match(report.nodes[0].suggestions.join(' '), /返回编排.*本节点任务.*处理对象.*业务范围.*动作/)
    assert.match(report.nodes[1].errors.join(' '), /上游.*employee-certification-insight/)
    assert.match(report.nodes[1].suggestions.join(' '), /先.*employee-certification-insight.*重新试运行/)
    assert.equal(report.nodes[0].downstream[0].status, 'blocked')
    assert.deepEqual(draft, before)
  }
})

test('fixing a task preserves old errors until a new successful trial restores submission eligibility', () => {
  const draft = draftOf()
  draft.steps[0].task = ''
  draft.testRequest = sim.createScenarioSimulationRequest(draft)
  draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, now)
  const oldReport = clone(draft.testReport)
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, catalog).ok, false)
  assert.throws(() => domain.submitScenarioPackage(draft, actor, now, catalog), /试运行/)
  draft.steps[0].task = '查询本周待处理的认证记录，按原因汇总。'
  draft.testRequest = sim.createScenarioSimulationRequest(draft)
  assert.equal(sim.isScenarioSimulationCurrent(draft.testReport, draft, catalog, draft.testRequest), false)
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, catalog).ok, false)
  assert.deepEqual(draft.testReport, oldReport)
  draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, '2026-09-10T01:01:00.000Z')
  assert.equal(draft.testReport.status, 'completed')
  assert.ok(draft.testReport.nodes.every(node => node.errors.length === 0 && node.suggestions.length === 0))
  assert.equal(draft.testReport.nodes[0].downstream[0].receivedValue, draft.testReport.nodes[0].output)
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
  assert.equal(domain.submitScenarioPackage(draft, actor, now, catalog).status, 'review')
  assert.match(oldReport.nodes[0].errors.join(' '), /本节点任务/)
})

test('inactive conditional tasks are skipped but must be filled before that branch is tested', () => {
  const draft = draftOf()
  draft.steps[1] = { ...draft.steps[1], task: '', kind: 'conditional', required: false, condition: '需要人群分析时' }
  draft.testRequest = requestOf()
  draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, now)
  assert.equal(draft.testReport.nodes[1].status, 'skipped')
  assert.deepEqual(draft.testReport.nodes[1].suggestions, [])
  assert.deepEqual(draft.testReport.nodes[1].errors, [])
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
  const active = sim.runScenarioSimulation(draft, catalog, requestOf({ activeOptionalStepIds: ['b'] }), actor, now)
  assert.equal(active.nodes[1].status, 'blocked')
  assert.match(active.nodes[1].suggestions.join(' '), /本节点任务/)
})

test('legacy undefined tasks and reports without suggestions remain readable and eligible without snapshot rewrites', () => {
  const draft = draftOf()
  delete draft.steps[0].task
  draft.testRequest = requestOf()
  draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, now)
  assert.equal(draft.testReport.status, 'completed')
  assert.match(draft.testReport.nodes[0].task, /使用employee-certification-insight完成本节点任务/)
  for (const node of draft.testReport.nodes) delete node.suggestions
  const before = structuredClone(draft)
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, catalog).ok, true)
  assert.equal(domain.submitScenarioPackage(draft, actor, now, catalog).status, 'review')
  assert.deepEqual(draft, before)
  assert.equal(Object.hasOwn(draft.steps[0], 'task'), false)
})

test('historical successful reports with empty tasks cannot bypass the new task gate', () => {
  const draft = draftOf()
  draft.testRequest = requestOf()
  draft.testReport = sim.runScenarioSimulation(draft, catalog, draft.testRequest, actor, now)
  // Recreate a pre-validation snapshot: these nodes previously completed even with an empty task.
  draft.steps[0].task = ''
  draft.testReport.nodes[0].task = ''
  draft.testReport.status = 'attention'
  draft.testReport.nodes[0].issues = ['本节点任务尚未填写，请结合本场景补充。']
  for (const node of draft.testReport.nodes) delete node.suggestions
  draft.testReport.fingerprint = sim.getScenarioTestFingerprint(draft, catalog, draft.testRequest)
  const before = structuredClone(draft)
  assert.equal(sim.isScenarioSimulationCurrent(draft.testReport, draft, catalog, draft.testRequest), true)
  const decision = sim.evaluateScenarioTrialForSubmit(draft, catalog)
  assert.equal(decision.ok, false)
  assert.match(decision.reasons.join(' '), /本节点任务/)
  assert.throws(() => domain.submitScenarioPackage(draft, actor, now, catalog), /本节点任务/)
  assert.deepEqual(draft, before)
})

test('confirmation and legacy approval failures have separate actionable suggestions', () => {
  const draft = draftOf()
  draft.steps[0].requiresConfirmation = true
  draft.steps[1].requiresApproval = true
  const report = sim.runScenarioSimulation(draft, catalog, requestOf(), actor, now)
  assert.match(report.nodes[0].errors.join(' '), /确认/)
  assert.ok(Array.isArray(report.nodes[0].suggestions), 'confirmation errors must include repair suggestions')
  assert.match(report.nodes[0].suggestions.join(' '), /模拟确认并重试/)
  assert.doesNotMatch(report.nodes[0].errors.join(' '), /点击/)
  assert.match(report.nodes[1].errors.join(' '), /审批/)
  assert.match(report.nodes[1].suggestions.join(' '), /审批.*真实审批/)
  assert.doesNotMatch(report.nodes[1].suggestions.join(' '), /试运行设置.*勾选/)
})

test('unavailable fixtures and global gates offer cause-specific repair paths without inventing outputs', () => {
  const newer = clone(catalog.slice(0, 2))
  newer[0].version = newer[0].online = 'v9.0.0'
  const missing = sim.runScenarioSimulation(draftOf(newer), newer, requestOf(), actor, now)
  assert.match(missing.nodes[0].errors.join(' '), /没有本地样例/)
  assert.ok(Array.isArray(missing.nodes[0].suggestions), 'a missing fixture must include a repair suggestion')
  assert.match(missing.nodes[0].suggestions.join(' '), /返回编排.*有试运行数据的 Skill/)
  const cases = [
    [draftOf(), catalog, { id: actor.id, permissions: [] }, /管理员.*权限/],
    [draftOf(), [{ ...catalog[0], onlineStatus: 'disabled' }, catalog[1]], actor, /返回编排.*不可用.*已发布/],
    [draftOf(), [{ ...catalog[0], online: 'v2.0.0' }, catalog[1]], actor, /返回编排.*线上版本/],
    [{ ...draftOf(), steps: draftOf().steps.map(step => ({ ...step, predecessorId: null })) }, catalog, actor, /返回编排.*连接/],
    [draftOf(), catalog, scenarioPmActor('not-owner', catalog), /具备编辑权限.*创建者或管理员.*账号/],
    [draftOf(), [{ ...catalog[0], permissions: { ...catalog[0].permissions, data: [] } }, catalog[1]], actor, /权限快照.*重新选择/],
  ]
  for (const [draft, skills, currentActor, repair] of cases) {
    const report = sim.runScenarioSimulation(draft, skills, requestOf(), currentActor, now)
    assert.equal(report.status, 'blocked')
    assert.ok(report.nodes.every(node => node.output === '' && node.errors.length > 0))
    assert.match(report.nodes[0].suggestions.join(' '), repair)
    assert.ok(report.nodes.every(node => node.suggestions.every(suggestion => typeof suggestion === 'string' && suggestion.trim())))
  }
})

test('blank input blocks while the optional test expectation can remain empty', () => {
  assert.equal(sim.runScenarioSimulation(draftOf(), catalog, requestOf({ input: '  ' }), actor, now).status, 'blocked')
  assert.equal(sim.runScenarioSimulation(draftOf(), catalog, requestOf({ expectedOutput: '' }), actor, now).status, 'completed')
})

test('simulation respects creation, topology, catalog and version gates without mutating its inputs', () => {
  const cases = [
    [draftOf(), catalog, scenarioPmActor('someone-else', catalog)],
    [draftOf(), catalog, { id: actor.id, permissions: [] }],
    [{ ...draftOf(), steps: draftOf().steps.map(s => ({ ...s, predecessorId: null })) }, catalog, actor],
    [draftOf(), [{ ...catalog[0], onlineStatus: 'disabled' }, catalog[1]], actor],
    [draftOf(), [{ ...catalog[0], online: 'v2.0.0' }, catalog[1]], actor],
    [draftOf(), [{ ...catalog[0], permissions: { ...catalog[0].permissions, data: [] } }, catalog[1]], actor]
  ]
  for (const [draft, skills, currentActor] of cases) {
    const before = clone([draft, skills, currentActor])
    const report = sim.runScenarioSimulation(draft, skills, requestOf(), currentActor, now)
    assert.equal(report.status, 'blocked')
    assert.equal(report.nodes.some(n => n.output), false)
    assert.deepEqual(clone([draft, skills, currentActor]), before)
  }
})

test('semantic changes invalidate a report while coordinates, workflow metadata and explicit storage order do not', () => {
  const draft = draftOf()
  const request = requestOf()
  const report = sim.runScenarioSimulation(draft, catalog, request, actor, now)
  assert.equal(sim.isScenarioSimulationCurrent(report, draft, catalog, request), true)
  const cosmetic = clone(draft)
  cosmetic.steps.reverse()
  cosmetic.steps.forEach(s => { s.position = { x: 99, y: 22 } })
  cosmetic.status = 'review'
  cosmetic.updatedAt = 'tomorrow'
  cosmetic.testReport = report
  assert.equal(sim.isScenarioSimulationCurrent(report, cosmetic, [...catalog].reverse(), request), true)
  for (const mutate of [
    d => { d.name += '新版' }, d => { d.description += '新场景' }, d => { d.targetAudience += '销售' }, d => { d.ownerId = 'other' },
    d => { d.steps[0].task += '变更' }, d => { d.steps[0].fixedRequirements = '新增要求' }, d => { d.steps[0].expectedOutput += '新增输出' },
    d => { d.steps[0].inputDescription = '新输入' }, d => { d.steps[0].requiresConfirmation = true }, d => { d.steps[0].requiresApproval = true },
    d => { d.steps[1].kind = 'conditional'; d.steps[1].required = false; d.steps[1].condition = '需要时' },
    d => { d.steps[1].predecessorId = null }, d => { d.steps[0].pinnedVersion = 'v9' }
  ]) {
    const changed = clone(draft)
    mutate(changed)
    assert.equal(sim.isScenarioSimulationCurrent(report, changed, catalog, request), false)
  }
  const rebuiltMetadata = clone(draft)
  rebuiltMetadata.steps[0].name = '被目录重建的旧名称'
  rebuiltMetadata.steps[0].permissions.data.push('untrusted:draft-only')
  assert.equal(sim.isScenarioSimulationCurrent(report, rebuiltMetadata, catalog, request), true)
})

test('only referenced catalog semantics affect freshness and permission ordering is immaterial', () => {
  const draft = draftOf()
  const request = requestOf()
  const report = sim.runScenarioSimulation(draft, catalog, request, actor, now)
  for (const mutate of [
    s => { s[0].online = 'v9' }, s => { s[0].status = 'disabled' }, s => { s[0].onlineStatus = 'disabled' }, s => { s[0].permissions.data.push('data:new') }
  ]) {
    const changed = clone(catalog)
    mutate(changed)
    assert.equal(sim.isScenarioSimulationCurrent(report, draft, changed, request), false)
  }
  const unrelated = clone(catalog)
  unrelated[2].online = 'v9'
  assert.equal(sim.isScenarioSimulationCurrent(report, draft, unrelated, request), true)
  const arranged = clone(catalog)
  arranged[0].permissions.data = [...arranged[0].permissions.data, ...arranged[0].permissions.data]
  assert.equal(sim.isScenarioSimulationCurrent(report, draft, arranged, request), true)
})

test('retrying after same-version catalog changes stays current through submission and publication', () => {
  const draft = draftOf()
  const request = requestOf()
  const original = sim.runScenarioSimulation(draft, catalog, request, actor, now)
  const changedCatalog = clone(catalog)
  changedCatalog[0].name = '新版业务名称'
  changedCatalog[0].permissions.data.push('data:new-scope')
  assert.equal(sim.isScenarioSimulationCurrent(original, draft, changedCatalog, request), false)
  draft.testRequest = request
  draft.testReport = sim.runScenarioSimulation(draft, changedCatalog, request, actor, now)
  const before = clone(draft)
  assert.equal(sim.evaluateScenarioTrialForSubmit(draft, changedCatalog).ok, true)
  const submitted = domain.submitScenarioPackage(draft, actor, now, changedCatalog)
  const published = domain.publishScenarioPackage(submitted, reviewer, now, changedCatalog)
  for (const saved of [submitted, published]) {
    assert.equal(saved.steps[0].name, '新版业务名称')
    assert.ok(saved.steps[0].permissions.data.includes('data:new-scope'))
    assert.equal(sim.isScenarioSimulationCurrent(saved.testReport, saved, changedCatalog, saved.testRequest), true)
  }
  assert.deepEqual(clone(draft), before)
})

test('request edits invalidate reports and stored snapshots never alias later user edits', () => {
  const draft = draftOf()
  const request = requestOf({ sampleOutputs: { a: 'original A' } })
  const report = sim.runScenarioSimulation(draft, catalog, request, actor, now)
  const before = clone(report)
  for (const patch of [{ input: '新输入' }, { expectedOutput: '新期望' }, { sampleOutputs: { a: '新样例' } }, { activeOptionalStepIds: ['b'] }, { confirmedStepIds: ['a'] }, { approvedStepIds: ['a'] }]) {
    assert.equal(sim.isScenarioSimulationCurrent(report, draft, catalog, { ...request, ...patch }), false)
  }
  request.sampleOutputs.a = 'source changed'
  request.confirmedStepIds.push('a')
  draft.steps[0].task = 'source changed'
  assert.deepEqual(report, before)
  assert.equal(sim.isScenarioSimulationCurrent(null, draft, catalog, request), false)
  assert.equal(sim.isScenarioSimulationCurrent({ ...report, executionPerformed: true }, draft, catalog, request), false)
})

let server
after(async () => {
  await server?.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})
test('reports remain isolated and only a successful current retrial allows submission or resubmission', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), logLevel: 'silent', server: { middlewareMode: true } })
  const [{ createPinia, setActivePinia }, module] = await Promise.all([import('pinia'), server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts')])
  setActivePinia(createPinia())
  const store = module.useScenarioSkillPackagesStore()
  const skills = catalog.slice(0, 2).map(s => store.selectableSkills.find(current => current.id === s.id))
  const draft = draftOf(skills)
  const request = requestOf()
  const initialPackages = clone(store.packages)
  assert.throws(() => store.submitDraft(draft, actor), /试运行/)
  assert.deepEqual(clone(store.packages), initialPackages)
  const report = sim.runScenarioSimulation(draft, store.selectableSkills, request, actor, now)
  draft.testReport = report
  draft.testRequest = request
  const rebuilt = domain.rebuildDraftFromCatalog(draft, skills).draft
  rebuilt.testReport.nodes[1].inputs[0].value = 'rebuild mutated'
  rebuilt.testRequest.input = 'rebuilt request changed'
  assert.equal(report.nodes[1].inputs[0].value, request.input)
  assert.equal(draft.testRequest.input, '分析职场A最近两周的认证情况。')
  const submitted = store.submitDraft(draft, actor)
  report.request.input = 'source changed'
  submitted.testReport.nodes[0].issues.push('external issue')
  assert.equal(store.findPackage(draft.id).testReport.request.input, request.input)
  assert.deepEqual(store.findPackage(draft.id).testReport.nodes[0].issues, [])
  submitted.testRequest.confirmedStepIds.push('a')
  assert.deepEqual(store.findPackage(draft.id).testRequest.confirmedStepIds, [])
  const rejected = store.rejectPackage(draft.id, reviewer, '补充场景说明')
  rejected.testReport.request.sampleOutputs.a = 'external sample'
  assert.equal(store.findPackage(draft.id).testReport.request.sampleOutputs.a, undefined)
  const revision = store.editableDraft(draft.id, actor)
  revision.description += '新场景'
  revision.testRequest.input = '改过的试运行输入'
  const rejectedSnapshot = clone(store.findPackage(draft.id))
  assert.throws(() => store.resubmitDraft(revision, actor), /试运行/)
  assert.throws(() => store.resubmitDraft({ ...revision, testReport: undefined }, actor), /试运行/)
  revision.testReport = sim.runScenarioSimulation(revision, store.selectableSkills, { ...revision.testRequest, input: '' }, actor, now)
  assert.throws(() => store.resubmitDraft(revision, actor), /试运行/)
  assert.deepEqual(clone(store.findPackage(draft.id)), rejectedSnapshot)
  revision.testReport = sim.runScenarioSimulation(revision, store.selectableSkills, revision.testRequest, actor, now)
  const resubmitted = store.resubmitDraft(revision, actor)
  assert.equal(sim.isScenarioSimulationCurrent(resubmitted.testReport, revision, skills, revision.testRequest), true)
  resubmitted.testReport.issues.push('external history change')
  const published = store.approvePackage(draft.id, reviewer)
  assert.equal(published.status, 'published')
  assert.equal(published.testReport.issues.includes('external history change'), false)
  assert.equal(published.testRequest.input, '改过的试运行输入')
  assert.equal(published.testReport.request.input, published.testRequest.input)
  assert.equal(sim.isScenarioSimulationCurrent(published.testReport, published, skills, published.testRequest), true)
  const snapshot = clone(store.findPackage(draft.id))
  assert.throws(() => store.resubmitDraft({ ...published, testReport: undefined }, actor), /驳回/)
  assert.throws(() => store.submitDraft({ ...published, testReport: undefined }, actor), /编辑版本|已更新/)
  assert.deepEqual(clone(store.findPackage(draft.id)), snapshot)
  const blockedReport = sim.runScenarioSimulation({ ...draft, id: 'other' }, skills, requestOf({ input: '' }), actor, now)
  assert.throws(() => store.submitDraft({ ...draft, id: 'other', testRequest: blockedReport.request, testReport: blockedReport }, actor), /试运行/)
  assert.equal(store.findPackage('other'), undefined)
})
