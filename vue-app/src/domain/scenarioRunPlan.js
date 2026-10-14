import { evaluateRuntimeAccess, resolveScenarioChain } from './scenarioSkillPackages.js'
import { getScenarioNodeContract, getScenarioNodeInputs } from './scenarioNodeContracts.js'

/**
 * @typedef {import('./scenarioSkillPackages.js').PinnedScenarioStep} PinnedScenarioStep
 * @typedef {import('./scenarioSkillPackages.js').ScenarioActor} ScenarioActor
 * @typedef {import('./scenarioSkillPackages.js').ScenarioAuditEvent} ScenarioAuditEvent
 * @typedef {{ id: string, version: string, status: string, requiresConfirmation?: boolean, steps: PinnedScenarioStep[], auditEvents?: ScenarioAuditEvent[] }} ScenarioRunPackage
 * @typedef {{ input?: string, activeOptionalStepIds?: string[], evidence?: { workflowConfirmed?: boolean, confirmedStepIds?: string[], approvedStepIds?: string[] } }} ScenarioRunRequest
 * @typedef {{ kind: 'run'|'upstream', nodeId?: string, name: string, description: string, conditional?: boolean, status: 'provided'|'missing'|'pending'|'skipped' }} ScenarioRunInputSource
 * @typedef {{ id: string, skillId: string, name: string, pinnedVersion: string, task: string, fixedRequirements: string, expectedOutput: string, inputSources: ScenarioRunInputSource[] }} ScenarioRunPlanStep
 * @typedef {{ executionPerformed: false, packageId: string, version: string, status: 'ready'|'blocked', explanations: string[], requestInput: string, steps: ScenarioRunPlanStep[] }} ScenarioRunPlan
 */

/**
 * Prepare an isolated declaration of permitted work without executing any Skill.
 * `ready` describes the existing access checks, not execution or input availability.
 * User input stays separate from the node contract; upstream outputs remain pending
 * or skipped because this interface never produces or consumes actual artifacts.
 * @param {ScenarioRunPackage} packageItem
 * @param {ScenarioActor} caller
 * @param {ScenarioRunRequest} [request]
 * @returns {ScenarioRunPlan}
 */
export function buildScenarioRunPlan(packageItem, caller, request = {}) {
  const requestInput = typeof request.input === 'string' ? request.input : ''
  const chain = resolveScenarioChain(packageItem?.steps || [])
  /** @type {ScenarioRunPlan} */
  const plan = {
    executionPerformed: false,
    packageId: packageItem?.id || '',
    version: packageItem?.version || '',
    status: 'blocked',
    explanations: [...chain.reasons],
    requestInput,
    steps: []
  }
  if (!chain.ok) return plan

  const access = evaluateRuntimeAccess(
    packageItem,
    caller,
    request.activeOptionalStepIds || [],
    [],
    request.evidence || {}
  )
  plan.status = access.status
  plan.explanations = [...access.explanations]
  if (access.status === 'blocked') return plan

  const effectiveIds = new Set(access.effectiveSteps.map(step => step.id))
  plan.steps = access.effectiveSteps.map(step => {
    const contract = getScenarioNodeContract(step)
    return {
      id: step.id,
      skillId: step.skillId,
      name: step.name,
      pinnedVersion: step.pinnedVersion,
      task: contract.task,
      fixedRequirements: contract.fixedRequirements,
      expectedOutput: contract.expectedOutput,
      inputSources: getScenarioNodeInputs(chain.steps, step.id).map(source => ({
        kind: source.kind,
        ...(source.nodeId !== undefined ? { nodeId: source.nodeId } : {}),
        name: source.name,
        description: source.description,
        ...(source.conditional !== undefined ? { conditional: source.conditional } : {}),
        status: source.kind === 'run'
          ? requestInput.trim() ? 'provided' : 'missing'
          : effectiveIds.has(source.nodeId) ? 'pending' : 'skipped'
      }))
    }
  })
  return plan
}
