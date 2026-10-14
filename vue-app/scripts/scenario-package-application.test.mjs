import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateRuntimeAccess, getScenarioTestFingerprint } from '../src/domain/scenarioSkillPackages.js'

const application = await import('../src/domain/scenarioPackageApplication.js').catch(error => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
  return {}
})
const eligibility = (...args) => {
  assert.equal(typeof application.evaluateScenarioApplicationEligibility, 'function')
  return application.evaluateScenarioApplicationEligibility(...args)
}
const preview = (...args) => {
  assert.equal(typeof application.runScenarioApplicationPreview, 'function')
  return application.runScenarioApplicationPreview(...args)
}
const at = '2026-10-14T08:00:00.000Z'
const step = (id, patch = {}) => ({
  id, name: `节点${id}`, skillId: `skill-${id}`, menu: `菜单${id}`, predecessorId: id === 'a' ? null : 'a',
  pinnedVersion: 'v1.0.0', currentPublishedVersion: 'v1.0.0', kind: 'required', required: true, dependencyState: 'available',
  task: `查询节点${id}的业务数据`, expectedOutput: '这是尚未产生的预期输出，不能当作结果',
  permissions: { menu: [`menu:${id}`], skill: [`skill:${id}`], data: [`data:${id}`], action: [`action:${id}`] }, ...patch
})
const actor = {
  id: 'consumer', permissions: { policy: ['scenario-package:application-demo:use'], menu: ['menu:a', 'menu:b'], skill: ['skill:a', 'skill:b'], data: ['data:a', 'data:b'], action: ['action:a', 'action:b'] }
}
function itemOf(patch = {}) {
  return {
    id: 'application-demo', name: '认证与经营分析', description: '只读取授权数据', targetAudience: '业务用户', ownerId: 'author',
    status: 'published', onlineStatus: 'published', version: 'v1.0.0', updatedAt: at,
    steps: [step('a'), step('b')],
    health: { status: 'healthy', explanations: [], blockedStepIds: [], degradedStepIds: [] },
    auditEvents: [{ type: 'approved', actorId: 'reviewer', at }, { type: 'published', actorId: 'reviewer', at }],
    testReport: {
      mode: 'simulation', executionPerformed: false, status: 'completed',
      nodes: ['a', 'b'].map(id => ({ id, name: `节点${id}`, skillId: `skill-${id}`, pinnedVersion: 'v1.0.0', status: 'completed', output: `${id}的已审核模拟样例：已认证2人、待认证1人。` }))
    }, ...patch
  }
}

test('a use-only actor can apply an independently published package without author or reviewer grants', () => {
  const item = itemOf()
  assert.equal(eligibility(item, actor).ok, true)
  const result = preview(item, actor, {}, at)
  assert.equal(result.status, 'completed')
  assert.equal(result.mode, 'simulation')
  assert.equal(result.executionPerformed, false)
  assert.equal(result.version, 'v1.0.0')
  assert.deepEqual(result.nodes.map(node => node.output), ['a的已审核模拟样例：已认证2人、待认证1人。', 'b的已审核模拟样例：已认证2人、待认证1人。'])
  assert.match(result.summary, /样例|模拟/)
})

for (const status of ['rejected', 'disabled']) {
  test(`${status} without an enabled published snapshot cannot open or run application testing`, () => {
    const item = itemOf({ status, onlineStatus: status === 'disabled' ? 'disabled' : 'unpublished' })
    assert.equal(eligibility(item, actor).ok, false)
    const result = preview(item, actor)
    assert.equal(result.status, 'blocked')
    assert.ok(result.issues.length)
    assert.ok(result.nodes.every(node => node.output === ''))
  })
}

for (const status of ['rejected']) {
  test(`${status} revisions apply only their prior independently approved version and its samples`, () => {
    const old = itemOf()
    const revision = itemOf({ status, version: 'v2.0.0', name: '尚未审核的新名称', publishedSnapshot: structuredClone(old) })
    revision.steps[0].pinnedVersion = 'v2.0.0'
    revision.testReport.nodes[0].output = '尚未审核的修改不能应用'
    const before = structuredClone(revision)
    const result = preview(revision, actor)
    assert.equal(eligibility(revision, actor).ok, true)
    assert.equal(result.status, 'completed')
    assert.equal(result.version, 'v1.0.0')
    assert.equal(result.name, '认证与经营分析')
    assert.equal(result.nodes[0].pinnedVersion, 'v1.0.0')
    assert.equal(result.nodes[0].output, old.testReport.nodes[0].output)
    assert.deepEqual(revision, before)
  })
}

test('disabled, paused and legacy-degraded published records cannot apply', () => {
  const paused = itemOf()
  paused.steps[1].dependencyState = 'expired'
  const disabled = itemOf({ status: 'disabled', onlineStatus: 'disabled', publishedSnapshot: itemOf() })
  const degraded = itemOf({ health: { status: 'degraded', explanations: [], blockedStepIds: [], degradedStepIds: ['b'] } })
  for (const item of [paused, disabled, degraded]) {
    assert.equal(eligibility(item, actor).ok, false)
    assert.equal(preview(item, actor).status, 'blocked')
  }
})

function sealRevisionSample(item) {
  const skills = item.steps.map(step => ({ id: step.skillId, name: step.name, menu: step.menu, version: step.pinnedVersion, online: step.pinnedVersion,
    status: 'published', onlineStatus: 'published', permissions: step.permissions }))
  item.testReport.request = { input: '本次应用测试', expectedOutput: '', activeOptionalStepIds: [], confirmedStepIds: [], approvedStepIds: [], sampleOutputs: {} }
  item.testReport.fingerprint = getScenarioTestFingerprint(item, skills, item.testReport.request)
  return skills
}

for (const status of ['draft', 'review']) {
  test(`${status} can apply the current unpublished revision without creating runtime approval authority`, () => {
    const item = itemOf({ status, onlineStatus: 'unpublished', auditEvents: [] })
    const skills = sealRevisionSample(item)
    const before = structuredClone(item)
    const allowed = eligibility(item, actor)
    assert.equal(allowed.ok, true)
    assert.equal(allowed.packageStatus, status)
    assert.equal(allowed.versionSource, 'current_revision')
    const result = preview(item, actor, {}, at, skills)
    assert.equal(result.status, 'completed')
    assert.equal(result.executionPerformed, false)
    assert.equal(result.packageStatus, status)
    assert.equal(result.versionSource, 'current_revision')
    assert.equal(result.nodes[0].outputSource, 'revision_sample')
    assert.match(result.summary, /未发布.*POC|POC.*未发布/)
    assert.match(result.summary, /当前版本试运行样例/)
    assert.equal(evaluateRuntimeAccess(item, actor).status, 'blocked')
    assert.deepEqual(item, before)
  })

  test(`${status} with an approved older snapshot tests current changes instead of substituting the old release`, () => {
    const item = itemOf({ status, version: 'v2.0.0', name: '正在验证的改动', publishedSnapshot: itemOf(), auditEvents: [] })
    item.steps[0].pinnedVersion = 'v2.0.0'
    item.steps[0].currentPublishedVersion = 'v2.0.0'
    item.testReport.nodes[0].pinnedVersion = 'v2.0.0'
    item.testReport.nodes[0].output = '当前版本的模拟结果'
    const skills = sealRevisionSample(item)
    const result = preview(item, actor, {}, at, skills)
    assert.equal(result.status, 'completed')
    assert.equal(result.name, '正在验证的改动')
    assert.equal(result.version, 'v2.0.0')
    assert.equal(result.nodes[0].pinnedVersion, 'v2.0.0')
    assert.equal(result.nodes[0].output, '当前版本的模拟结果')
    assert.equal(result.nodes[0].outputSource, 'revision_sample')
  })

  test(`${status} preview retains permissions, dependency, graph, global and legacy evidence gates`, () => {
    const base = itemOf({ status, onlineStatus: 'unpublished', auditEvents: [] })
    for (const bucket of ['policy', 'menu', 'skill', 'data', 'action']) {
      const denied = structuredClone(actor)
      denied.permissions[bucket] = []
      assert.equal(eligibility(base, denied).ok, false)
      assert.equal(preview(base, denied).status, 'blocked')
    }
    for (const change of [
      item => { item.steps[1].dependencyState = 'unavailable'; item.steps[1].required = false; item.steps[1].kind = 'conditional'; item.steps[1].condition = '需要时' },
      item => { item.steps[1].predecessorId = 'missing' },
      item => { item.steps[0].permissions.action = [] },
      item => { item.steps[0].requiresApproval = true },
      item => { item.steps[0].requiresConfirmation = true },
      item => { item.status = 'disabled' }
    ]) {
      const item = structuredClone(base)
      change(item)
      assert.equal(eligibility(item, actor).ok, false)
      const result = preview(item, actor, { workflowConfirmed: true })
      assert.equal(result.status, 'blocked')
      assert.ok(result.nodes.every(node => !node.output))
    }
    const confirming = { ...base, requiresConfirmation: true }
    assert.equal(eligibility(confirming, actor).ok, true)
    assert.equal(preview(confirming, actor).status, 'confirmation_required')
  })
}

test('an unconfigured inactive optional draft task stays skipped and blocks only when activated', () => {
  const item = itemOf({ status: 'draft', onlineStatus: 'unpublished' })
  item.steps[1] = { ...item.steps[1], kind: 'conditional', required: false, condition: '需要时', task: '' }
  const skills = sealRevisionSample(item)
  assert.equal(eligibility(item, actor).ok, true)
  const skipped = preview(item, actor, {}, at, skills)
  assert.equal(skipped.status, 'completed')
  assert.equal(skipped.nodes[1].status, 'skipped')
  const active = preview(item, actor, { activeOptionalStepIds: ['b'] }, at, skills)
  assert.equal(active.status, 'blocked')
  assert.ok(active.nodes.every(node => !node.output))
})

for (const status of ['draft', 'review']) {
  test(`${status} current healthy revision is independent of a disabled or paused older release`, () => {
    for (const oldState of ['disabled', 'paused']) {
      const old = itemOf()
      const item = itemOf({ status, version: 'v2.0.0', onlineStatus: oldState === 'disabled' ? 'disabled' : 'published', publishedSnapshot: old })
      if (oldState === 'paused') {
        old.health.status = 'paused'
        old.steps[0].dependencyState = 'unavailable'
      }
      const skills = sealRevisionSample(item)
      assert.equal(eligibility(item, actor).ok, true)
      const result = preview(item, actor, {}, at, skills)
      assert.equal(result.status, 'completed')
      assert.equal(result.versionSource, 'current_revision')
      assert.equal(result.version, 'v2.0.0')
      assert.equal(evaluateRuntimeAccess(item, actor).status, 'blocked', 'the older live release remains unavailable')
    }
  })

  test(`${status} current revision failure must not fall back to a healthy old release`, () => {
    const item = itemOf({ status, publishedSnapshot: itemOf() })
    item.steps[0].dependencyState = 'unavailable'
    assert.equal(eligibility(item, actor).ok, false)
    const result = preview(item, actor)
    assert.equal(result.status, 'blocked')
    assert.equal(result.versionSource, 'current_revision')
    assert.ok(result.nodes.every(node => !node.output))
  })
}

test('unpublished revision samples require a current fingerprint and never borrow an old snapshot report', () => {
  const item = itemOf({ status: 'draft', onlineStatus: 'unpublished', publishedSnapshot: itemOf() })
  const skills = sealRevisionSample(item)
  item.description = '配置语义已经改变'
  for (const catalog of [skills, []]) {
    const result = preview(item, actor, {}, at, catalog)
    assert.equal(result.status, 'blocked')
    assert.ok(result.nodes.every(node => !node.output))
  }
  item.steps[0].skillId = 'employee-certification-insight'
  const fallback = preview(item, actor, {}, at, skills)
  assert.equal(fallback.nodes[0].outputSource, 'version_fixture')
  assert.notEqual(fallback.nodes[0].output, item.publishedSnapshot.testReport.nodes[0].output)
})

test('changing the current revision test request invalidates its earlier report samples', () => {
  const item = itemOf({ status: 'draft', onlineStatus: 'unpublished' })
  const skills = sealRevisionSample(item)
  item.testRequest = { ...item.testReport.request, input: '已改用另一项本次输入' }
  const result = preview(item, actor, {}, at, skills)
  assert.equal(result.status, 'blocked')
  assert.ok(result.nodes.every(node => !node.output))
})

for (const status of ['draft', 'review']) {
  test(`${status} cannot report fixture success for an explicitly unconfigured active node task`, () => {
    for (const task of ['', '   ']) {
      const item = itemOf({ status, onlineStatus: 'unpublished' })
      item.steps[0] = { ...item.steps[0], skillId: 'employee-certification-insight', task }
      delete item.testReport
      assert.equal(eligibility(item, actor).ok, false)
      const result = preview(item, actor)
      assert.equal(result.status, 'blocked')
      assert.ok(result.nodes.every(node => !node.output))
      assert.match(result.issues.join('；'), /任务/)
    }
  })
}

test('available newer versions retain the approved fixed version and samples', () => {
  const item = itemOf()
  item.steps[0].dependencyState = 'update_available'
  item.steps[0].currentPublishedVersion = 'v2.0.0'
  item.steps[0].hasNewerPublishedVersion = true
  assert.equal(eligibility(item, actor).ok, true)
  const result = preview(item, actor)
  assert.equal(result.status, 'completed')
  assert.equal(result.nodes[0].pinnedVersion, 'v1.0.0')
})

test('eligibility and every fresh application recheck exact package use and all required permission buckets', () => {
  for (const bucket of ['policy', 'menu', 'skill', 'data', 'action']) {
    const denied = structuredClone(actor)
    denied.permissions[bucket] = bucket === 'policy' ? ['scenario-package:other:use'] : []
    assert.equal(eligibility(itemOf(), denied).ok, false)
    assert.equal(preview(itemOf(), denied, { workflowConfirmed: true }).status, 'blocked')
  }
  assert.equal(eligibility(itemOf(), { ...actor, id: '' }).ok, false)
})

test('missing, forged-self and missing-publication audits cannot become application authority', () => {
  for (const auditEvents of [[], [{ type: 'approved', actorId: 'author', at }, { type: 'published', actorId: 'author', at }], [{ type: 'approved', actorId: 'reviewer', at }]]) {
    assert.equal(eligibility(itemOf({ auditEvents }), actor).ok, false)
    assert.equal(preview(itemOf({ auditEvents }), actor).status, 'blocked')
  }
})

test('workflow confirmation opens the entry but only explicit current confirmation enables the preview', () => {
  const item = itemOf({ requiresConfirmation: true })
  item.testReport.request = { workflowConfirmed: true }
  const eligible = eligibility(item, actor)
  assert.equal(eligible.ok, true)
  assert.equal(eligible.requiresConfirmation, true)
  for (const workflowConfirmed of [undefined, false, 'true', 1]) {
    const result = preview(item, actor, { workflowConfirmed })
    assert.equal(result.status, 'confirmation_required')
    assert.ok(result.nodes.every(node => node.output === ''))
  }
  assert.equal(preview(item, actor, { workflowConfirmed: true }).status, 'completed')
})

test('legacy node confirmation and approval remain blocked even after a workflow confirmation', () => {
  for (const flag of ['requiresConfirmation', 'requiresApproval']) {
    const item = itemOf({ requiresConfirmation: true })
    item.steps[0][flag] = true
    assert.equal(eligibility(item, actor).ok, false)
    const result = preview(item, actor, { workflowConfirmed: true })
    assert.equal(result.status, 'blocked')
    assert.ok(result.nodes.every(node => node.output === ''))
    assert.match(result.issues.join(' '), /确认|审批/)
  }
})

test('optional conditions skip normally and become subject to fresh permission checks when activated', () => {
  const item = itemOf()
  item.steps[1] = { ...item.steps[1], kind: 'conditional', required: false, condition: '需要经营分析时' }
  const limited = structuredClone(actor)
  limited.permissions.action = ['action:a']
  assert.equal(eligibility(item, limited).ok, true)
  const inactive = preview(item, limited)
  assert.equal(inactive.status, 'completed')
  assert.deepEqual(inactive.nodes.map(node => node.status), ['completed', 'skipped'])
  assert.equal(inactive.nodes[1].output, '')
  assert.equal(preview(item, limited, { activeOptionalStepIds: ['b'] }).status, 'blocked')
})

test('missing or mismatched approved samples report incomplete testing without invented expected outputs', () => {
  for (const change of [
    item => { delete item.testReport },
    item => { item.testReport.mode = 'execution' },
    item => { item.testReport.executionPerformed = true },
    item => { item.testReport.nodes[0].id = 'different-node' },
    item => { item.testReport.nodes[0].skillId = 'different-skill' },
    item => { item.testReport.nodes[0].pinnedVersion = 'v9.0.0' },
    item => { item.testReport.nodes[0].status = 'blocked' },
    item => { item.testReport.nodes[0].output = '   ' }
  ]) {
    const item = itemOf()
    change(item)
    const result = preview(item, actor)
    assert.equal(result.status, 'blocked')
    assert.equal(result.nodes[0].output, '')
    assert.equal(result.nodes[1].output, '', 'missing upstream sample must not report later work complete')
    assert.match(result.issues.join(' '), /样例/)
    assert.ok(result.nodes.every(node => !node.output.includes('预期输出')))
  }
})

test('result mutation never writes back into approved samples or later application results', () => {
  const item = itemOf()
  const before = structuredClone(item)
  const result = preview(item, actor)
  result.nodes[0].output = '修改展示对象'
  assert.deepEqual(item, before)
  assert.equal(preview(item, actor).nodes[0].output, before.testReport.nodes[0].output)
  assert.equal(eligibility(undefined, actor).ok, false)
})

test('known Skills without approved samples use only an explicitly matching local version fixture', () => {
  for (const version of ['v1.1.0', 'v1.2.0']) {
    const item = itemOf()
    item.steps = [{ ...step('a'), skillId: 'workplace-segment-operations', pinnedVersion: version, currentPublishedVersion: 'v1.2.0' }]
    delete item.testReport
    const result = preview(item, actor)
    assert.equal(result.status, 'completed')
    assert.equal(result.nodes[0].pinnedVersion, version)
    assert.equal(result.nodes[0].outputSource, 'version_fixture')
    assert.match(result.nodes[0].output, /模拟样例/)
    assert.match(result.summary, /本地.*版本.*样例/)
    if (version === 'v1.1.0') assert.match(result.nodes[0].output, /v1\.1\.0|历史固定版本/)
  }
  const unknown = itemOf()
  unknown.steps = [{ ...step('a'), skillId: 'workplace-segment-operations', pinnedVersion: 'v0.0.1' }]
  delete unknown.testReport
  assert.equal(preview(unknown, actor).status, 'blocked')
})

test('approved exact-node samples take priority over local fixtures and label their provenance', () => {
  const item = itemOf()
  item.steps = [{ ...step('a'), skillId: 'employee-certification-insight' }]
  item.testReport.nodes = [{ ...item.testReport.nodes[0], skillId: 'employee-certification-insight' }]
  const result = preview(item, actor)
  assert.equal(result.nodes[0].outputSource, 'reviewed_sample')
  assert.equal(result.nodes[0].output, item.testReport.nodes[0].output)
  assert.match(result.summary, /已审核/)
})
