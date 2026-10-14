import { evaluateRuntimeAccess, getScenarioRuntimePackage, resolveScenarioChain } from './scenarioSkillPackages.js'
import { getScenarioVersionSample } from './scenarioPackageTesting.js'

/**
 * @typedef {import('./scenarioSkillPackages.js').ScenarioPackageDraft} ScenarioApplicationPackage
 * @typedef {import('./scenarioSkillPackages.js').ScenarioActor} ScenarioApplicationActor
 * @typedef {{workflowConfirmed?:boolean,activeOptionalStepIds?:string[]}} ScenarioApplicationRequest
 * @typedef {{ok:boolean,reasons:string[],packageId:string,name:string,version:string,requiresConfirmation:boolean}} ScenarioApplicationEligibility
 * @typedef {{id:string,name:string,skillId:string,pinnedVersion:string,status:'completed'|'skipped'|'blocked',output:string,outputSource:'reviewed_sample'|'version_fixture'|'none'}} ScenarioApplicationNode
 * @typedef {{mode:'simulation',executionPerformed:false,status:'completed'|'blocked'|'confirmation_required',packageId:string,name:string,version:string,createdAt:string,summary:string,issues:string[],nodes:ScenarioApplicationNode[]}} ScenarioApplicationPreview
 */

const text = value => typeof value === 'string' ? value : ''
const identity = item => ({ packageId: text(item?.id), name: text(item?.name), version: text(item?.version) })
const confirmationOnly = access => access?.status === 'blocked' && access.missingWorkflowConfirmation === true
  && !access.missingPackagePermission && access.missingPermissions.length === 0 && access.missingEvidence.length === 0

/** Apply runtime policy to the approved version only; never borrow authoring or trial authority. */
function inspectApplication(packageItem, actor, request = {}) {
  const runtime = getScenarioRuntimePackage(packageItem)
  if (!runtime?.id) return { runtime, reasons: ['场景技能包不存在，请重新选择。'], access: null }
  if (!text(actor?.id).trim()) return { runtime, reasons: ['请先登录后再应用场景技能包。'], access: null }
  if (['paused', 'degraded'].includes(runtime.health?.status)) {
    return { runtime, reasons: ['技能包依赖异常，已暂停应用；请恢复依赖后重新检查。'], access: null }
  }
  const activeOptionalStepIds = Array.isArray(request.activeOptionalStepIds)
    ? [...new Set(request.activeOptionalStepIds.filter(id => typeof id === 'string'))] : []
  const access = evaluateRuntimeAccess(runtime, actor, activeOptionalStepIds, [], {
    workflowConfirmed: request.workflowConfirmed === true
  })
  return { runtime, access, reasons: access.status === 'blocked' ? [...access.explanations] : [] }
}

/** Determine entry availability without fabricating any confirmation or approval evidence.
 * @param {ScenarioApplicationPackage|undefined} packageItem
 * @param {ScenarioApplicationActor} actor
 * @returns {ScenarioApplicationEligibility}
 */
export function evaluateScenarioApplicationEligibility(packageItem, actor) {
  const { runtime, access, reasons } = inspectApplication(packageItem, actor)
  const ok = access?.status === 'ready' || confirmationOnly(access)
  return { ...identity(runtime || packageItem), ok, reasons: ok ? [] : reasons, requiresConfirmation: runtime?.requiresConfirmation === true }
}

/** Reuse version-matched approved simulation samples, never execute Skills or invent business results.
 * @param {ScenarioApplicationPackage|undefined} packageItem
 * @param {ScenarioApplicationActor} actor
 * @param {ScenarioApplicationRequest} request
 * @param {string} now
 * @returns {ScenarioApplicationPreview}
 */
export function runScenarioApplicationPreview(packageItem, actor, request = {}, now = new Date().toISOString()) {
  const { runtime, access, reasons } = inspectApplication(packageItem, actor, request)
  const steps = resolveScenarioChain(runtime?.steps || []).steps
  /** @type {ScenarioApplicationPreview} */
  const result = {
    ...identity(runtime || packageItem), mode: 'simulation', executionPerformed: false,
    status: confirmationOnly(access) ? 'confirmation_required' : 'blocked', createdAt: now,
    summary: '', issues: reasons,
    nodes: steps.map(step => ({ id: step.id, name: step.name, skillId: step.skillId, pinnedVersion: step.pinnedVersion, status: 'blocked', output: '', outputSource: 'none' }))
  }
  if (access?.status !== 'ready') {
    result.summary = result.status === 'confirmation_required'
      ? '请先确认整个工作流的本次应用测试范围。确认仅用于 POC 模拟，不代表真实业务执行授权。'
      : '当前不能应用此技能包。未调用真实 Skill，未读取或修改业务数据。'
    return result
  }

  const effectiveIds = new Set(access.effectiveSteps.map(step => step.id))
  const report = runtime.testReport
  const samples = report?.mode === 'simulation' && report.executionPerformed === false
    && ['completed', 'attention'].includes(report.status) && Array.isArray(report.nodes) ? report.nodes : []
  let incomplete = false
  let completed = 0
  let fixtures = 0
  let skipped = 0
  for (const node of result.nodes) {
    if (!effectiveIds.has(node.id)) {
      node.status = 'skipped'
      skipped += 1
      continue
    }
    if (incomplete) {
      result.issues.push(`节点“${node.name}”等待上游模拟样例，当前未完成。`)
      continue
    }
    const sample = samples.find(item => item.id === node.id && item.skillId === node.skillId
      && item.pinnedVersion === node.pinnedVersion && item.status === 'completed' && text(item.output).trim())
    const fixture = sample ? undefined : getScenarioVersionSample(node.skillId, node.pinnedVersion)
    if (!sample && !fixture) {
      incomplete = true
      result.issues.push(`节点“${node.name}”的固定版本 ${node.pinnedVersion} 缺少已审核的成功模拟样例或本地精确版本样例，应用测试未完成。`)
      continue
    }
    node.status = 'completed'
    node.output = sample ? sample.output : fixture.output
    node.outputSource = sample ? 'reviewed_sample' : 'version_fixture'
    if (fixture) fixtures += 1
    completed += 1
  }
  result.status = incomplete ? 'blocked' : 'completed'
  result.summary = `POC 应用测试${incomplete ? '未完成' : '完成'}：展示 ${completed - fixtures} 个已审核试运行样例、${fixtures} 个本地精确版本模拟样例；${skipped} 个条件分支未命中而跳过。未调用真实 Skill，未读取或修改业务数据。`
  return result
}
