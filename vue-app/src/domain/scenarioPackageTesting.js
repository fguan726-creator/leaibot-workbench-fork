import { evaluatePackageForPublish, evaluatePackageHealth, rebuildDraftFromCatalog, resolveScenarioChain, normalizeScenarioSimulationRequest, getScenarioTestFingerprint } from './scenarioSkillPackages.js'
export { getScenarioTestFingerprint, isScenarioSimulationCurrent, evaluateScenarioTrialForSubmit } from './scenarioSkillPackages.js'
import { getScenarioNodeContract, getScenarioNodeInputs } from './scenarioNodeContracts.js'
import { getScenarioTrialTransfers } from './scenarioTrialTrace.js'
import { getScenarioMockDataFailure } from './scenarioTrialMockData.js'

/**
 * @typedef {import('./scenarioSkillPackages.js').ScenarioPackageDraft} ScenarioDraft
 * @typedef {import('./scenarioSkillPackages.js').PublishedSkill} ScenarioSkill
 * @typedef {import('./scenarioSkillPackages.js').PinnedScenarioStep} ScenarioStep
 * @typedef {import('./scenarioSkillPackages.js').ScenarioActor} ScenarioActor
 * @typedef {{input:string, expectedOutput:string, activeOptionalStepIds:string[], confirmedStepIds:string[], approvedStepIds:string[], sampleOutputs:Record<string,string>, mockDataMode?:'mixed-feedback', mockDataPhase?:'retry'}} ScenarioSimulationRequest
 * @typedef {{nodeId:string,name:string,status:'received'|'blocked'|'skipped',sentValue:string,receivedValue:string,detail:string}} ScenarioSimulationTransfer
 * @typedef {{id:string, name:string, skillId?:string, pinnedVersion?:string, outputSource?:'manual'|'fixture'|'none', downstream?:ScenarioSimulationTransfer[], status:'completed'|'skipped'|'blocked', task:string, fixedRequirements:string, expectedOutput:string, condition:string, inputs:Array<{name:string,value:string,source:'run'|'upstream',nodeId?:string}>, output:string, issues:string[], errors?:string[], suggestions?:string[]}} ScenarioSimulationNode
 * @typedef {{id:string, mode:'simulation', executionPerformed:false, fingerprint:string, createdAt:string, testerId:string, status:'completed'|'attention'|'blocked', request:ScenarioSimulationRequest, nodes:ScenarioSimulationNode[], issues:string[], summary:string}} ScenarioSimulationReport
 */

// These are labelled fixtures for exactly the published versions below, never live Skill results.
const VERSION_SAMPLES = {
  'product-knowledge': { version: 'v1.0.7', input: '模拟比较机型 A 与机型 B 的办公适用性。', output: '模拟样例：机型 A 重视便携，机型 B 重视扩展；实际配置与价格需另行查询。' },
  'voucher-recommend': { version: 'v0.1.3', input: '模拟为用户 A 推荐适用的会员权益券包。', output: '模拟样例：券包 A 包含会员权益，券包 B 包含充值权益；未发券或扣费。' },
  'gmv-daily-summary': { version: 'v1.2.0', input: '模拟汇总指定日期的订单量、GMV 与渠道贡献。', output: '模拟样例：样例日期共有 3 笔订单、GMV 900 元，其中渠道 A 贡献 600 元。' },
  'employee-certification-insight': { version: 'v1.0.0', input: '模拟查询职场 A 最近两周的员工认证情况。', output: '模拟样例：职场 A 共有 3 名员工，已认证 2 名、待补充材料 1 名。' },
  'workplace-segment-operations': { version: 'v1.2.0', input: '模拟分析职场 A 已认证人群的经营机会。', output: '模拟样例：已认证人群中 1 人完成购买，建议向待补充材料人群提供认证指引。' },
  'enterprise-customer-followup': { version: 'v1.0.0', input: '模拟为企业客户 A 准备首次跟进计划。', output: '模拟样例：建议先确认企业客户 A 的采购人数与预算，再准备沟通提纲；未发送消息。' },
  'legacy-inventory-alert': { version: 'v0.9.0', input: '模拟检查企业客户 A 相关机型的库存与历史预警阈值。', output: '模拟样例：机型 A 可用库存 3 台，预警阈值 5 台，触发低库存预警；建议核实供货时间后再确认交付。未调整库存、创建补货单或发送通知。' },
  'weather-query': { version: 'v1.0.0', input: '模拟查询活动地点 A 的天气与降水风险。', output: '模拟样例：活动地点 A 天气多云，气温 22℃，降水概率 20%；建议保留室内活动备选安排。未查询真实天气或调整活动计划。' }
}

const text = value => typeof value === 'string' ? value : ''
const unique = values => [...new Set(values)]

/** Keep the authoritative cause visible while pointing to an available repair path. */
function gateSuggestion(reason) {
  if (reason.includes('权限快照')) return `请联系 Skill 管理员补齐提示的权限快照，再返回编排重新选择该 Skill 并试运行。检查项：${reason}`
  if (reason.includes('权限')) return `请联系管理员核实并补齐当前编辑账号的以下权限，再重新试运行：${reason}`
  if (/所有者|主责任人|账号/.test(reason)) return '请由具备编辑权限的创建者或管理员使用自己的账号继续编排和试运行，保留原创建者后再提交审核。'
  if (/依赖|禁用|撤回|不再发布/.test(reason)) return `返回编排，移除提示的不可用 Skill，选择已发布且可用的 Skill，重新连接链路后再试运行。检查项：${reason}`
  if (/版本/.test(reason)) return `返回编排，重新选择提示的 Skill 以固定当前线上版本，再重新试运行。检查项：${reason}`
  if (/连接|执行链|前序|环路|后继|起点/.test(reason)) return `返回编排，按提示修复节点连接，将全部节点连接为一条无环路、无分叉的执行链后重新试运行。检查项：${reason}`
  if (reason.includes('条件')) return '返回编排，选中条件节点并填写判断条件；本次是否命中仍通过节点上的分支测试操作选择，然后重新试运行。'
  if (reason.includes('模拟测试输入')) return '返回场景定义和节点编排，补充场景及节点任务，重新生成运行依据后再试运行。'
  if (reason.startsWith('请填写')) return `返回场景定义，${reason}，然后重新试运行。`
  return `返回编排，按以下检查项补齐节点配置或重新选择 Skill，然后重新试运行：${reason}`
}

/**
 * Derive the trial basis from configured scene and nodes; never require a second task entry.
 * Conditions and simulation tickets always start unselected.
 * @param {{name?:string,description?:string,targetAudience?:string,steps?:ScenarioStep[]}} draft
 * @returns {ScenarioSimulationRequest}
 */
export function createScenarioSimulationRequest(draft) {
  const ordered = resolveScenarioChain(draft?.steps || []).steps
  const input = [
    `场景：${text(draft?.name).trim() || '当前场景'}`,
    text(draft?.description).trim() && `使用场景：${text(draft.description).trim()}`,
    text(draft?.targetAudience).trim() && `目标人群：${text(draft.targetAudience).trim()}`,
    ...ordered.map((step, index) => {
      const contract = getScenarioNodeContract(step)
      return [
        `节点 ${index + 1}：${step.name || step.skillId}（${step.pinnedVersion}）`,
        contract.task.trim() && `任务：${contract.task}`,
        contract.fixedRequirements.trim() && `固定要求：${contract.fixedRequirements}`,
        contract.expectedOutput.trim() && `预期输出：${contract.expectedOutput}`,
        text(step.condition).trim() && `判断条件：${step.condition}`
      ].filter(Boolean).join('\n')
    })
  ].filter(Boolean).join('\n')
  return normalizeScenarioSimulationRequest({
    input,
    expectedOutput: '检查节点顺序、条件跳过和样例输入输出是否符合当前场景。'
  })
}

/**
 * Rehearse a draft using explicit versioned fixtures. No network, real execution, or publication bypass.
 * @param {ScenarioDraft} draft
 * @param {ScenarioSkill[]} skills
 * @param {ScenarioSimulationRequest} request
 * @param {ScenarioActor} actor
 * @param {string} [now]
 * @param {ScenarioDraft} [previous] Trusted stored record for an existing revision.
 * @returns {ScenarioSimulationReport}
 */
export function runScenarioSimulation(draft, skills, request, actor, now = new Date().toISOString(), previous) {
  const copiedRequest = normalizeScenarioSimulationRequest(request)
  const fingerprint = getScenarioTestFingerprint(draft, skills, copiedRequest)
  const rebuilt = rebuildDraftFromCatalog(draft, skills)
  const resolved = resolveScenarioChain(rebuilt.draft.steps)
  const policy = evaluatePackageForPublish(rebuilt.draft, actor, previous)
  const health = evaluatePackageHealth(resolved.steps)
  const gateIssues = unique([
    ...rebuilt.reasons, ...policy.reasons,
    ...(health.status === 'paused' ? health.explanations : []),
    ...(!copiedRequest.input.trim() ? ['请填写本次模拟测试输入。'] : [])
  ])
  const active = new Set(copiedRequest.activeOptionalStepIds)
  const confirmed = new Set(copiedRequest.confirmedStepIds)
  const approved = new Set(copiedRequest.approvedStepIds)
  const byId = new Map(resolved.steps.map(step => [step.id, step]))
  const mockFailure = getScenarioMockDataFailure(resolved.steps, copiedRequest)
  /** @type {Map<string,ScenarioSimulationNode>} */
  const completed = new Map()
  /** @type {ScenarioSimulationNode[]} */
  const nodes = []

  for (const step of resolved.steps) {
    const contract = getScenarioNodeContract(step)
    /** @type {ScenarioSimulationNode} */
    const node = { id: step.id, name: step.name, skillId: step.skillId, pinnedVersion: step.pinnedVersion, outputSource: 'none', downstream: [], status: 'blocked', ...contract, condition: text(step.condition), inputs: [], output: '', issues: [], errors: [], suggestions: [] }
    nodes.push(node)
    if (gateIssues.length) {
      node.issues = [...gateIssues]
      node.errors = [...gateIssues]
      node.suggestions = unique(gateIssues.map(gateSuggestion))
      continue
    }
    if (step.kind === 'conditional' && !active.has(step.id)) {
      node.status = 'skipped'
      node.issues.push('本次未选择该条件命中，跳过此节点；模拟不解析自然语言判断条件。')
      continue
    }

    if (!contract.expectedOutput.trim()) node.issues.push('本节点预期输出尚未填写，样例输出不能代替配置要求。')
    const blocked = []
    const block = (reason, suggestion) => { blocked.push(reason); node.suggestions.push(suggestion) }
    if (!contract.task.trim()) block('本节点任务尚未填写，无法确定本节点要处理的对象和动作。', '返回编排填写“本节点任务”，写清处理对象、业务范围和动作，再重新试运行。')
    if (['expired', 'unavailable', 'emergency_disabled'].includes(step.dependencyState)) block('此节点依赖不可用，不能提供模拟输出。', `返回编排，移除不可用节点“${step.name}”并选择已发布且可用的 Skill，重新连接后再试运行。`)
    if (step.requiresConfirmation && !confirmed.has(step.id)) block('尚未完成本节点的模拟确认。', '请在本节点点击“模拟确认并重试”，或返回编排核实是否需要执行前确认。此操作仅用于模拟，不代表真实执行授权。')
    if (step.requiresApproval && !approved.has(step.id)) block('本节点历史配置要求模拟审批，但尚未提供对应证据。', '本节点保留了历史审批要求；请返回编排按当前支持的执行要求重新配置后试运行。此操作不代表真实审批通过，也不会授予业务操作权限。')

    node.inputs.push({ name: '本次运行输入', value: copiedRequest.input, source: 'run' })
    for (const source of getScenarioNodeInputs(resolved.steps, step.id).filter(item => item.kind === 'upstream')) {
      const prior = completed.get(source.nodeId)
      if (prior) node.inputs.push({ name: source.name, value: prior.output, source: 'upstream', nodeId: source.nodeId })
      else if (byId.get(source.nodeId)?.required || mockFailure?.nodeId === source.nodeId) block(`${byId.get(source.nodeId)?.required ? '必需上游' : '上游'}“${source.name}”尚未完成，缺少可传递的样例输出。`, `请先查看并修复上游节点“${source.name}”的错误，再重新试运行整条链路；本节点需要接收该上游的反馈。`)
    }

    const sample = VERSION_SAMPLES[step.skillId]
    const manualOutput = text(copiedRequest.sampleOutputs[step.id])
    const sampleOutput = sample && sample.version === step.pinnedVersion ? sample.output : ''
    const output = manualOutput.trim() ? manualOutput : sampleOutput
    if (!output) block(`固定版本 ${step.pinnedVersion} 没有本地样例，当前无法试运行。`, '请返回编排选择有试运行数据的 Skill，再重新试运行；不能将预期输出当作已经产生的反馈。')
    node.issues.push(...blocked)
    node.errors = [...blocked]
    if (blocked.length) continue
    if (mockFailure?.nodeId === step.id && sampleOutput) {
      node.output = mockFailure.output
      node.outputSource = 'fixture'
      node.errors.push(mockFailure.reason)
      node.issues.push(mockFailure.reason)
      node.suggestions.push(mockFailure.suggestion)
      continue
    }
    node.status = 'completed'
    node.output = output
    node.outputSource = manualOutput.trim() ? 'manual' : 'fixture'
    completed.set(step.id, node)
  }

  for (const node of nodes) node.downstream = getScenarioTrialTransfers(resolved.steps, nodes, node.id)

  const issues = unique([...gateIssues, ...nodes.filter(node => node.status !== 'skipped').flatMap(node => node.issues)])
  const blocked = gateIssues.length > 0 || nodes.some(node => node.status === 'blocked')
  const status = blocked ? 'blocked' : issues.length ? 'attention' : 'completed'
  const skipped = nodes.filter(node => node.status === 'skipped').length
  return {
    id: `simulation-${now}-${fingerprint.slice(-16)}`,
    mode: 'simulation', executionPerformed: false, fingerprint, createdAt: now, testerId: text(actor?.id), status,
    request: copiedRequest, nodes, issues,
    summary: `模拟测试${status === 'blocked' ? '存在阻断' : status === 'attention' ? '有待检查项' : '完成'}：${completed.size} 个节点使用样例完成，${skipped} 个条件节点跳过。未调用真实 Skill，未读取或写入业务数据；结果仅供配置演练，不代表真实操作已完成。`
  }
}
