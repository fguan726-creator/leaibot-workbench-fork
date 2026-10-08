import { getScenarioNodeContract, getScenarioNodeInputs } from './scenarioNodeContracts.js'
import { getScenarioTrialTransfers } from './scenarioTrialTrace.js'
import { getScenarioMockDataFailure } from './scenarioTrialMockData.js'

/**
 * @typedef {'available'|'expired'|'unavailable'|'emergency_disabled'|'update_available'} DependencyState
 * @typedef {'required'|'conditional'} ScenarioStepKind
 * @typedef {'menu'|'skill'|'data'|'action'} PermissionBucket
 * @typedef {{ id?: string, permissions?: string[]|Partial<Record<PermissionBucket|'policy', string[]>> }} ScenarioActor
 * @typedef {{ id: string, name?: string, menu: string, version: string, status: string, onlineStatus: string, online: string, description?: string, inputDescription?: string, outputDescription?: string, permissions?: Partial<Record<PermissionBucket, string[]>> }} PublishedSkill
 * @typedef {{ id: string, skillId: string, name: string, menu: string, pinnedVersion: string, currentPublishedVersion: string, hasNewerPublishedVersion?: boolean, kind: ScenarioStepKind, condition?: string, task?: string, fixedRequirements?: string, expectedOutput?: string, inputDescription?: string, required: boolean, requiresConfirmation?: boolean, requiresApproval?: boolean, predecessorId?: string|null, position?: { x: number, y: number }, dependencyState: DependencyState, permissions: Partial<Record<PermissionBucket, string[]>> }} PinnedScenarioStep
 * @typedef {{ id: string, name: string, description: string, targetAudience: string, ownerId: string, steps: PinnedScenarioStep[], status?: string, version?: string, onlineStatus?: 'unpublished'|'published'|'disabled', publishedSnapshot?: ScenarioPackageDraft, updatedAt?: string, baseUpdatedAt?: string, approvedAt?: string, publishedAt?: string, health?: ScenarioPackageHealth, submittedAt?: string, submittedBy?: string, submitterId?: string, revisionEditors?: string[], reviewedAt?: string, reviewedBy?: string, reviewNote?: string, auditEvents?: ScenarioAuditEvent[], testReport?: import('./scenarioPackageTesting.js').ScenarioSimulationReport, testRequest?: import('./scenarioPackageTesting.js').ScenarioSimulationRequest }} ScenarioPackageDraft
 * @typedef {{ status: 'healthy'|'upgrade_required'|'degraded'|'paused', explanations: string[], blockedStepIds: string[], degradedStepIds: string[] }} ScenarioPackageHealth
 * @typedef {{ ok: boolean, canSelfApprove: boolean, reasons: string[] }} ScenarioPolicyResult
 * @typedef {{ status: 'ready'|'degraded'|'blocked', effectiveSteps: PinnedScenarioStep[], skippedSteps: PinnedScenarioStep[], missingPermissions: { stepId: string, bucket: PermissionBucket, permission: string }[], missingEvidence: { stepId: string, type: 'confirmation'|'approval' }[], missingPackagePermission?: string, explanations: string[] }} ScenarioRuntimeResult
 * @typedef {{ type: 'submitted'|'approved'|'published'|'rejected'|'withdrawn'|'disabled'|'enabled', actorId: string, at: string, note?: string }} ScenarioAuditEvent
 */

const PERMISSION_BUCKETS = ['menu', 'skill', 'data', 'action']

const hasPolicyPermission = (actor, permission) => {
  const permissions = actor?.permissions
  if (Array.isArray(permissions)) return permissions.includes('*') || permissions.includes(permission)
  const values = permissions?.policy || []
  return values.includes('*') || values.includes(permission)
}

const hasActorId = actor => typeof actor?.id === 'string' && Boolean(actor.id.trim())

/**
 * Authoring capability is independent of review responsibility and requires both authoring grants.
 * @param {ScenarioActor} actor
 * @returns {boolean}
 */
export function canAuthorScenarioPackage(actor) {
  return hasActorId(actor)
    && hasPolicyPermission(actor, 'scenario-package:create')
    && hasPolicyPermission(actor, 'scenario-package:compose:cross-menu')
}

/**
 * Governance roles follow policy permissions; an admin can separately hold authoring capability.
 * @param {ScenarioActor} actor
 * @returns {'admin'|'pm'|'viewer'}
 */
export function scenarioPackageRole(actor) {
  if (hasPolicyPermission(actor, 'scenario-package:review')) return 'admin'
  if (hasPolicyPermission(actor, 'scenario-package:create') && hasPolicyPermission(actor, 'scenario-package:compose:cross-menu')) return 'pm'
  return 'viewer'
}

const hasBucketPermission = (actor, bucket, permission) => {
  const permissions = actor?.permissions
  if (Array.isArray(permissions)) return permissions.includes('*') || permissions.includes(permission)
  const values = permissions?.[bucket] || []
  return values.includes('*') || values.includes(permission)
}

const stepLabel = (step) => step.name || step.skillId

const onlineVersionOf = (skill) => typeof skill?.online === 'string' ? skill.online.trim() : ''

const isPublishedOnlineSkill = (skill) => (
  skill?.onlineStatus === 'published'
  && onlineVersionOf(skill) !== ''
  && onlineVersionOf(skill) !== '未发布'
)

const hasCompletePermissionSnapshot = (permissions) => PERMISSION_BUCKETS.every((bucket) => (
  Array.isArray(permissions?.[bucket])
  && permissions[bucket].length > 0
  && permissions[bucket].every((permission) => typeof permission === 'string' && permission.trim())
))

const isUnavailable = (step) => (
  step.dependencyState === 'expired'
  || step.dependencyState === 'unavailable'
  || step.dependencyState === 'emergency_disabled'
  || step.status === 'draft'
  || step.status === 'unpublished'
  || step.onlineStatus === 'draft'
  || step.online === '未发布'
)

const clonePosition = (position) => (
  position && Number.isFinite(position.x) && Number.isFinite(position.y)
    ? { x: position.x, y: position.y }
    : undefined
)

const cloneStep = (step) => {
  const { position, ...fields } = step
  const copiedPosition = clonePosition(position)
  return {
    ...fields,
    ...(copiedPosition ? { position: copiedPosition } : {}),
    permissions: Object.fromEntries(
      PERMISSION_BUCKETS.map((bucket) => [bucket, [...(step.permissions?.[bucket] || [])]])
    )
  }
}

/** Copy the plain, JSON-compatible test request or report without sharing nested snapshots.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function cloneScenarioTestSnapshot(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

const simulationText = value => typeof value === 'string' ? value : ''
const simulationIds = value => [...new Set((Array.isArray(value) ? value : []).filter(item => typeof item === 'string'))].sort()
const permissionSnapshot = permissions => Object.fromEntries(['menu', 'skill', 'data', 'action'].map(bucket => [bucket, simulationIds(permissions?.[bucket])]))

/** Copy and normalize only the declared test request, without granting any real permission. */
export function normalizeScenarioSimulationRequest(request) {
  return {
    input: simulationText(request?.input),
    ...(request?.mockDataMode === 'mixed-feedback' ? { mockDataMode: 'mixed-feedback' } : {}),
    ...(request?.mockDataMode === 'mixed-feedback' && request?.mockDataPhase === 'retry' ? { mockDataPhase: 'retry' } : {}),
    expectedOutput: simulationText(request?.expectedOutput),
    activeOptionalStepIds: simulationIds(request?.activeOptionalStepIds),
    confirmedStepIds: simulationIds(request?.confirmedStepIds),
    approvedStepIds: simulationIds(request?.approvedStepIds),
    sampleOutputs: Object.fromEntries(Object.entries(request?.sampleOutputs || {})
      .filter(([, value]) => typeof value === 'string')
      .sort(([left], [right]) => left.localeCompare(right)))
  }
}

function stepSemantics(step, index, steps, legacy) {
  return {
    id: step.id, skillId: step.skillId, name: step.name, menu: step.menu,
    pinnedVersion: step.pinnedVersion, currentPublishedVersion: step.currentPublishedVersion,
    kind: step.kind, required: step.required, condition: simulationText(step.condition),
    task: step.task, fixedRequirements: simulationText(step.fixedRequirements), expectedOutput: simulationText(step.expectedOutput), inputDescription: simulationText(step.inputDescription),
    requiresConfirmation: step.requiresConfirmation === true, requiresApproval: step.requiresApproval === true,
    predecessorId: legacy ? steps[index - 1]?.id || null : step.predecessorId,
    dependencyState: step.dependencyState, hasNewerPublishedVersion: step.hasNewerPublishedVersion === true,
    permissions: permissionSnapshot(step.permissions)
  }
}

// A deterministic local change detector, not an authorization token or signed execution attestation.
function fingerprintOf(value) {
  const source = JSON.stringify(value)
  let hash = 14695981039346656037n
  for (let index = 0; index < source.length; index += 1) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(source.charCodeAt(index))) * 1099511628211n)
  }
  const version = value.request?.mockDataMode === 'mixed-feedback' ? 'v3' : 'v2'
  return `scenario-simulation-${version}-${hash.toString(16).padStart(16, '0')}`
}

/**
 * Track semantic configuration and only its referenced catalog entries, excluding layout and review metadata.
 * @param {ScenarioPackageDraft} draft
 * @param {PublishedSkill[]} skills
 * @param {import('./scenarioPackageTesting.js').ScenarioSimulationRequest} request
 */
export function getScenarioTestFingerprint(draft, skills, request) {
  // Match submission's authoritative metadata without reading or copying report snapshots.
  const sourceSteps = rebuildDraftFromCatalog({ ...draft, testReport: undefined, testRequest: undefined }, skills).draft.steps
  const legacy = sourceSteps.every(step => step.predecessorId === undefined)
  const resolved = resolveScenarioChain(sourceSteps)
  const catalog = new Map((skills || []).map(skill => [skill.id, skill]))
  return fingerprintOf({
    name: draft?.name, description: draft?.description, targetAudience: draft?.targetAudience, ownerId: draft?.ownerId,
    chainValid: resolved.ok,
    steps: resolved.steps.map((step, index, steps) => stepSemantics(step, index, steps, legacy)),
    catalog: simulationIds(sourceSteps.map(step => step.skillId)).map(id => {
      const skill = catalog.get(id)
      return skill ? {
        id, name: skill.name, menu: skill.menu, version: skill.version, online: skill.online,
        status: skill.status, onlineStatus: skill.onlineStatus,
        description: simulationText(skill.description), inputDescription: simulationText(skill.inputDescription), outputDescription: simulationText(skill.outputDescription),
        permissions: permissionSnapshot(skill.permissions)
      } : { id, missing: true }
    }),
    request: normalizeScenarioSimulationRequest(request)
  })
}

/** @param {import('./scenarioPackageTesting.js').ScenarioSimulationReport|null|undefined} report @param {ScenarioPackageDraft} draft @param {PublishedSkill[]} skills @param {import('./scenarioPackageTesting.js').ScenarioSimulationRequest} request */
export function isScenarioSimulationCurrent(report, draft, skills, request) {
  return Boolean(report?.mode === 'simulation' && report.executionPerformed === false
    && report.fingerprint === getScenarioTestFingerprint(draft, skills, request))
}

/**
 * Require a current, complete local trial before submission; this is not real execution evidence.
 * @param {ScenarioPackageDraft} draft
 * @param {PublishedSkill[]} skills
 * @returns {{ok:boolean,reasons:string[]}}
 */
export function evaluateScenarioTrialForSubmit(draft, skills) {
  const report = draft?.testReport
  if (!report) return { ok: false, reasons: ['请先完成当前编排的模拟试运行，再提交审核。'] }
  const request = draft.testRequest || report.request
  const reasons = []
  if (!request || !report.request
    || !isScenarioSimulationCurrent(report, draft, skills, request)
    || !isScenarioSimulationCurrent(report, draft, skills, report.request)) {
    reasons.push('试运行报告与当前编排、输入或 Skill 目录不一致，请重新试运行。')
  }
  if (!['completed', 'attention'].includes(report.status)) {
    reasons.push('试运行存在错误或未完成，请返回编排修改并重新试运行。')
  }
  const chain = resolveScenarioChain(draft.steps || [])
  const mockFailure = getScenarioMockDataFailure(chain.steps, request)
  if (mockFailure) reasons.push(`${mockFailure.reason}${mockFailure.suggestion}`)
  const nodes = Array.isArray(report.nodes) ? report.nodes : []
  const active = new Set(request?.activeOptionalStepIds || [])
  if (!chain.ok || !chain.steps.length || nodes.length !== chain.steps.length
    || nodes.some((node, index) => node?.id !== chain.steps[index]?.id)) {
    reasons.push('试运行报告未完整覆盖当前链路，请重新试运行。')
  } else {
    for (const [index, step] of chain.steps.entries()) {
      const node = nodes[index]
      const expectedStatus = step.kind === 'conditional' && !active.has(step.id) ? 'skipped' : 'completed'
      if (expectedStatus === 'completed' && !getScenarioNodeContract(step).task.trim()) {
        reasons.push(`节点“${stepLabel(step)}”尚未填写“本节点任务”，请返回编排补充处理对象、业务范围和动作，再重新试运行。`)
      }
      const hasResult = expectedStatus === 'skipped' || (
        typeof node.output === 'string' && node.output.trim()
        && Array.isArray(node.inputs) && node.inputs.some(input => input?.source === 'run'
          && typeof input.value === 'string' && input.value.trim() && input.value === request?.input)
      )
      if (node.status !== expectedStatus || (node.errors?.length || 0) > 0 || !hasResult) {
        reasons.push(`节点“${stepLabel(step)}”的试运行存在错误或结果不完整，请修改后重新试运行。`)
      }
      const manualOutput = simulationText(request?.sampleOutputs?.[step.id])
      const failedFixture = mockFailure?.nodeId === step.id && node.output === mockFailure.output
      const expectedSource = node.status !== 'completed' ? (failedFixture ? 'fixture' : 'none') : manualOutput.trim() ? 'manual' : 'fixture'
      if (node.skillId !== step.skillId || node.pinnedVersion !== step.pinnedVersion || node.outputSource !== expectedSource
        || (expectedSource === 'manual' && node.output !== manualOutput)) {
        reasons.push(`节点“${stepLabel(step)}”的试运行版本或反馈来源不一致，请重新试运行。`)
      }
      const expectedInputs = expectedStatus === 'skipped' ? [] : [
        { source: 'run', nodeId: undefined, value: request?.input },
        ...getScenarioNodeInputs(chain.steps, step.id).filter(input => input.kind === 'upstream')
          .map(input => nodes.find(source => source.id === input.nodeId))
          .filter(source => source?.status === 'completed')
          .map(source => ({ source: 'upstream', nodeId: source.id, value: source.output }))
      ]
      const inputs = Array.isArray(node.inputs) ? node.inputs : []
      if (inputs.length !== expectedInputs.length || expectedInputs.some((expected, inputIndex) => {
        const actual = inputs[inputIndex]
        return !actual || actual.source !== expected.source || actual.nodeId !== expected.nodeId || actual.value !== expected.value
      }) || (expectedStatus === 'skipped' && node.output !== '')) {
        reasons.push(`节点“${stepLabel(step)}”的试运行输入传递不完整或内容不一致，请重新试运行。`)
      }
      const expectedTransfers = getScenarioTrialTransfers(chain.steps, nodes, node.id)
      if (!Array.isArray(node.downstream) || node.downstream.length !== expectedTransfers.length
        || expectedTransfers.some((expected, transferIndex) => {
          const actual = node.downstream[transferIndex]
          return expected.status === 'blocked' || !actual
            || ['nodeId', 'name', 'status', 'sentValue', 'receivedValue'].some(key => actual[key] !== expected[key])
        })) {
        reasons.push(`节点“${stepLabel(step)}”的下游传递记录缺失或不一致，请重新试运行。`)
      }
    }
  }
  return { ok: reasons.length === 0, reasons }
}

// Older in-memory records may still carry removed fields; never restore them in an edited package.
const omitRetiredScenarioFields = (packageItem) => {
  const snapshot = { ...packageItem }
  delete snapshot.trigger
  delete snapshot.completionCriteria
  if (snapshot.testReport) snapshot.testReport = cloneScenarioTestSnapshot(snapshot.testReport)
  if (snapshot.testRequest) snapshot.testRequest = cloneScenarioTestSnapshot(snapshot.testRequest)
  return snapshot
}

/**
 * Resolve a single connected execution chain without using canvas coordinates as ordering.
 * Undefined predecessors are supported only when the entire record uses the legacy array model.
 * Invalid chains retain their supplied order for inspection and must not be executed.
 * @param {PinnedScenarioStep[]} steps
 * @returns {{ ok: boolean, reasons: string[], steps: PinnedScenarioStep[] }}
 */
export function resolveScenarioChain(steps) {
  const copied = steps.map(cloneStep)
  const reasons = []
  const ids = copied.map((step) => step.id)
  if (ids.some((id) => typeof id !== 'string' || !id.trim()) || new Set(ids).size !== ids.length) {
    return { ok: false, reasons: ['步骤 ID 必须稳定且唯一'], steps: copied }
  }
  const explicitCount = copied.filter((step) => step.predecessorId !== undefined).length
  if (explicitCount === 0) return { ok: true, reasons, steps: copied }
  if (explicitCount !== copied.length) {
    return { ok: false, reasons: ['请为所有节点完整声明前序连接，不能混合旧顺序与画布连接。'], steps: copied }
  }

  const byId = new Map(copied.map((step) => [step.id, step]))
  const successors = new Map()
  const roots = []
  for (const step of copied) {
    const predecessor = step.predecessorId
    if (predecessor === null) {
      roots.push(step)
    } else if (typeof predecessor !== 'string' || !predecessor.trim()) {
      reasons.push(`节点“${stepLabel(step)}”的前序连接无效。`)
    } else if (predecessor === step.id) {
      reasons.push(`节点“${stepLabel(step)}”不能连接自身。`)
    } else if (!byId.has(predecessor)) {
      reasons.push(`节点“${stepLabel(step)}”引用的前序节点不存在。`)
    } else if (successors.has(predecessor)) {
      reasons.push(`节点“${stepLabel(byId.get(predecessor))}”只能连接一个后继节点，不能分叉。`)
    } else {
      successors.set(predecessor, step)
    }
  }
  if (reasons.length) return { ok: false, reasons, steps: copied }
  if (roots.length !== 1) reasons.push('执行链必须只有一个起点，请连接所有节点。')

  // Inspect every component, including cycles disconnected from an otherwise valid root.
  const checked = new Set()
  for (const step of copied) {
    const path = new Set()
    let current = step
    while (current && !checked.has(current.id)) {
      if (path.has(current.id)) {
        reasons.push('执行链存在环路，请断开循环连接。')
        break
      }
      path.add(current.id)
      current = current.predecessorId === null ? undefined : byId.get(current.predecessorId)
    }
    for (const id of path) checked.add(id)
  }
  if (reasons.length) return { ok: false, reasons: [...new Set(reasons)], steps: copied }

  const ordered = []
  let current = roots[0]
  while (current) {
    ordered.push(current)
    current = successors.get(current.id)
  }
  if (ordered.length !== copied.length) {
    return { ok: false, reasons: ['请将所有节点连接为一条完整执行链。'], steps: copied }
  }
  return { ok: true, reasons, steps: ordered }
}

/**
 * Create an immutable version-pinned step from an eligible published Skill.
 * @param {PublishedSkill} skill
 * @param {Partial<PinnedScenarioStep>} [options]
 * @returns {PinnedScenarioStep}
 */
export function createPinnedScenarioStep(skill, options = {}) {
  if (!isPublishedOnlineSkill(skill)) {
    throw new Error('仅已发布且已上线的 Skill 可以加入场景技能包')
  }

  const kind = options.kind || (options.required === false ? 'conditional' : 'required')
  const required = kind === 'required'
  const publishedVersion = onlineVersionOf(skill)
  const position = clonePosition(options.position)

  return {
    id: options.id || skill.id,
    skillId: skill.id,
    name: skill.name || skill.id,
    menu: skill.menu,
    pinnedVersion: publishedVersion,
    currentPublishedVersion: options.currentPublishedVersion || skill.currentPublishedVersion || publishedVersion,
    kind,
    condition: options.condition,
    task: options.task ?? skill.description ?? `使用${skill.name || skill.id}完成本节点任务`,
    fixedRequirements: options.fixedRequirements ?? '',
    expectedOutput: options.expectedOutput ?? skill.outputDescription ?? '',
    inputDescription: options.inputDescription ?? skill.inputDescription ?? '',
    required,
    requiresConfirmation: options.requiresConfirmation === true,
    requiresApproval: options.requiresApproval === true,
    ...(options.predecessorId !== undefined ? { predecessorId: options.predecessorId } : {}),
    ...(position ? { position } : {}),
    dependencyState: options.dependencyState || 'available',
    permissions: Object.fromEntries(
      PERMISSION_BUCKETS.map((bucket) => [bucket, [...(options.permissions?.[bucket] || skill.permissions?.[bucket] || [])]])
    )
  }
}

/** @param {PinnedScenarioStep[]} steps */
export function deriveScenarioMenus(steps) {
  return [...new Set(steps.map((step) => step.menu).filter(Boolean))]
}

/**
 * Check the package definition independently of the submitter or reviewer role.
 * @param {ScenarioPackageDraft} draft
 * @returns {string[]}
 */
function packageDefinitionReasons(draft) {
  const chain = resolveScenarioChain(draft?.steps || [])
  const steps = chain.steps
  const reasons = [...chain.reasons]
  const requiredSceneFields = [
    ['技能包名称', draft?.name],
    ['场景描述', draft?.description],
    ['目标人群', draft?.targetAudience]
  ]
  for (const [label, value] of requiredSceneFields) {
    if (!value?.trim()) reasons.push(`请填写${label}`)
  }
  const skillIds = steps.map((step) => step.skillId).filter(Boolean)
  if (new Set(skillIds).size < 2) reasons.push('场景技能包至少需要两个不同的 Skills')
  if (deriveScenarioMenus(steps).length < 2) reasons.push('场景技能包至少需要两个菜单')
  if (steps.some((step) => !step.skillId?.trim())) reasons.push('每个步骤必须声明 Skill ID')
  if (steps.some((step) => !step.pinnedVersion?.trim() || !step.currentPublishedVersion?.trim())) {
    reasons.push('每个步骤必须保留完整版本快照')
  }
  if (steps.some((step) => step.kind === 'conditional' && !step.condition?.trim())) {
    reasons.push('条件分支必须配置条件')
  }
  if (steps.some((step) => (
    (step.kind === 'required' && step.required !== true)
    || (step.kind === 'conditional' && step.required !== false)
    || !['required', 'conditional'].includes(step.kind)
  ))) {
    reasons.push('步骤类型 kind 与必需属性 required 必须保持一致')
  }
  if (steps.some((step) => !hasCompletePermissionSnapshot(step.permissions))) {
    reasons.push('每个步骤必须包含 menu、skill、data、action 四类非空权限快照')
  }
  if (!steps.some((step) => step.required === true)) {
    reasons.push('场景技能包至少需要一个必需步骤')
  }
  return reasons
}

/**
 * Evaluate creation and submission gates; submission never grants self-approval.
 * @param {ScenarioPackageDraft} draft
 * @param {ScenarioActor} actor
 * @param {ScenarioPackageDraft} [previous] Trusted stored record, never a client-supplied draft snapshot.
 * @returns {ScenarioPolicyResult}
 */
export function evaluatePackageForPublish(draft, actor, previous) {
  const reasons = packageDefinitionReasons(draft)
  const skillIds = (draft?.steps || []).map(step => step.skillId).filter(Boolean)
  const maintainingExisting = previous && previous.id === draft?.id && previous.ownerId === draft?.ownerId
    && scenarioPackageActions(previous, actor).includes('edit')
  if (!maintainingExisting && !canAuthorScenarioPackage(actor)) {
    if (!hasPolicyPermission(actor, 'scenario-package:create')) {
      reasons.push('缺少场景技能包创建技能包权限')
    }
    if (!hasPolicyPermission(actor, 'scenario-package:compose:cross-menu')) {
      reasons.push('缺少跨菜单编排权限')
    }
  }

  for (const skillId of new Set(skillIds)) {
    if (!hasPolicyPermission(actor, `skill:${skillId}:metadata:read`)) {
      reasons.push(`缺少 Skill 元数据读取权限：${skillId}`)
    }
    if (!hasPolicyPermission(actor, `skill:${skillId}:reference`)) {
      reasons.push(`缺少 Skill 引用权限：${skillId}`)
    }
  }

  const ownerId = typeof draft?.ownerId === 'string' ? draft.ownerId : ''
  const actorId = typeof actor?.id === 'string' ? actor.id : ''
  if (!ownerId.trim()) reasons.push('技能包主责任人不能为空')
  if (!actorId.trim()) reasons.push('当前提交账号不能为空')
  const isOwner = Boolean(ownerId.trim() && actorId.trim() && ownerId === actorId)
  if (previous) {
    if (!maintainingExisting) reasons.push('当前账号或状态不允许维护该场景技能包，且不能更换原所有者')
    if (!draft.baseUpdatedAt || draft.baseUpdatedAt !== previous.updatedAt) reasons.push('场景技能包已更新或缺少编辑版本，请重新打开编辑')
  } else {
    if (!isOwner) reasons.push('仅包所有者可以提交审核')
  }

  return {
    ok: reasons.length === 0,
    canSelfApprove: false,
    reasons
  }
}

/**
 * Calculate immutable package health without replacing a pinned Skill version.
 * @param {PinnedScenarioStep[]} steps
 * @returns {ScenarioPackageHealth}
 */
export function evaluatePackageHealth(steps) {
  const explanations = []
  const blockedStepIds = []
  const degradedStepIds = []
  let hasUpgrade = false

  for (const step of steps) {
    if (isUnavailable(step)) {
      if (step.required) {
        blockedStepIds.push(step.id)
        explanations.push(`必需步骤“${stepLabel(step)}”的依赖已过期或不可用，场景包已暂停。`)
      } else {
        degradedStepIds.push(step.id)
        explanations.push(`可选分支“${stepLabel(step)}”的依赖已过期或不可用，已降级跳过。`)
      }
    }
    if (step.dependencyState === 'update_available' || step.hasNewerPublishedVersion === true) {
      hasUpgrade = true
      explanations.push(`Skill“${stepLabel(step)}”有可用新版本 ${step.currentPublishedVersion}，仍固定使用 ${step.pinnedVersion}。`)
    }
  }

  const status = blockedStepIds.length > 0
    ? 'paused'
    : degradedStepIds.length > 0
      ? 'degraded'
      : hasUpgrade
        ? 'upgrade_required'
        : 'healthy'

  return { status, explanations, blockedStepIds, degradedStepIds }
}

const requiredPermissions = (step, caller) => PERMISSION_BUCKETS.flatMap((bucket) => (
  (step.permissions?.[bucket] || [])
    .filter((permission) => !hasBucketPermission(caller, bucket, permission))
    .map((permission) => ({ stepId: step.id, bucket, permission }))
))

const missingStepEvidence = (steps, evidence) => {
  const confirmedStepIds = new Set(evidence?.confirmedStepIds || [])
  const approvedStepIds = new Set(evidence?.approvedStepIds || [])
  return steps.flatMap((step) => [
    ...(step.requiresConfirmation && !confirmedStepIds.has(step.id)
      ? [{ stepId: step.id, type: 'confirmation' }]
      : []),
    ...(step.requiresApproval && !approvedStepIds.has(step.id)
      ? [{ stepId: step.id, type: 'approval' }]
      : [])
  ])
}

const hasAuditEvent = (packageItem, type) => (packageItem?.auditEvents || []).some((event) => (
  event?.type === type
  && typeof event.actorId === 'string'
  && event.actorId.trim()
  && typeof event.at === 'string'
  && event.at.trim()
))

const blockedRuntimeResult = (steps, explanations, extras = {}) => ({
  status: 'blocked',
  effectiveSteps: [],
  skippedSteps: steps.map(cloneStep),
  missingPermissions: [],
  missingEvidence: [],
  explanations,
  ...extras
})

/**
 * Check declared runtime requests and permission boundaries without executing Skills.
 * @param {{ steps: PinnedScenarioStep[] }} packageItem
 * @param {ScenarioActor} caller
 * @param {string[]} activeOptionalStepIds
 * @param {string[]} requestedSkillIds
 * @param {{ confirmedStepIds?: string[], approvedStepIds?: string[] }} evidence
 * @returns {ScenarioRuntimeResult}
 */
export function evaluateRuntimeAccess(packageItem, caller, activeOptionalStepIds = [], requestedSkillIds = [], evidence = {}) {
  packageItem = getScenarioRuntimePackage(packageItem)
  const chain = resolveScenarioChain(packageItem?.steps || [])
  const steps = chain.steps
  const declaredSkillIds = new Set(steps.map((step) => step.skillId))
  const undeclared = requestedSkillIds.find((skillId) => !declaredSkillIds.has(skillId))
  if (undeclared) throw new Error(`运行时请求了未声明的 Skill：${undeclared}`)
  if (!chain.ok) return blockedRuntimeResult(steps, chain.reasons)

  const activeOptional = new Set(activeOptionalStepIds)
  const candidateSteps = steps.filter((step) => step.required || activeOptional.has(step.id))
  if (packageItem?.status !== 'published') {
    return blockedRuntimeResult(candidateSteps, ['技能包尚未发布，不能运行。'])
  }
  if (!hasAuditEvent(packageItem, 'approved')) {
    return blockedRuntimeResult(candidateSteps, ['技能包缺少独立的审批审计证据，不能运行。'])
  }
  const approval = [...packageItem.auditEvents].reverse().find(event => event.type === 'approved')
  if (typeof approval?.actorId !== 'string' || !approval.actorId.trim()
    || typeof approval.at !== 'string' || !approval.at.trim()) {
    return blockedRuntimeResult(candidateSteps, ['技能包缺少有效的最新审批审计证据，不能运行。'])
  }
  if ([packageItem.ownerId, packageItem.submittedBy, packageItem.submitterId, ...revisionEditorIds(packageItem)]
    .some(id => typeof id === 'string' && id.trim() === approval.actorId.trim())) {
    return blockedRuntimeResult(candidateSteps, ['技能包的审批审计来自本人，须由其他管理员审核后才能运行。'])
  }
  if (!hasAuditEvent(packageItem, 'published')) {
    return blockedRuntimeResult(candidateSteps, ['技能包缺少独立的发布审计证据，不能运行。'])
  }
  const packageUsePermission = `scenario-package:${packageItem.id}:use`
  if (!packageItem?.id || !hasPolicyPermission(caller, packageUsePermission)) {
    return blockedRuntimeResult(candidateSteps, ['最终调用方缺少精确的技能包使用权限。'], {
      missingPackagePermission: packageUsePermission
    })
  }
  const health = evaluatePackageHealth(steps)
  if (health.status === 'paused') {
    return blockedRuntimeResult(candidateSteps, health.explanations)
  }

  const unavailableOptionalIds = new Set(
    candidateSteps.filter((step) => !step.required && isUnavailable(step)).map((step) => step.id)
  )
  const runnableSteps = candidateSteps.filter((step) => !unavailableOptionalIds.has(step.id))
  const missingPermissions = runnableSteps.flatMap((step) => requiredPermissions(step, caller))
  const missingEvidence = missingStepEvidence(runnableSteps, evidence)
  const requiredMissing = missingPermissions.filter(({ stepId }) => steps.find((step) => step.id === stepId)?.required)
  const requiredEvidenceMissing = missingEvidence.filter(({ stepId }) => steps.find((step) => step.id === stepId)?.required)

  if (requiredMissing.length > 0 || requiredEvidenceMissing.length > 0) {
    return {
      status: 'blocked',
      effectiveSteps: [],
      skippedSteps: candidateSteps.map(cloneStep),
      missingPermissions,
      missingEvidence,
      explanations: [
        ...health.explanations,
        ...(requiredMissing.length ? ['必需步骤缺少调用权限，执行在开始前已阻断。'] : []),
        ...(requiredEvidenceMissing.length ? ['必需步骤缺少确认或审批证据，执行在开始前已阻断。'] : [])
      ]
    }
  }

  const optionalFailedIds = new Set([
    ...unavailableOptionalIds,
    ...missingPermissions.map(({ stepId }) => stepId),
    ...missingEvidence.map(({ stepId }) => stepId)
  ])
  const effectiveSteps = candidateSteps.filter((step) => !optionalFailedIds.has(step.id)).map(cloneStep)
  const skippedSteps = candidateSteps.filter((step) => optionalFailedIds.has(step.id)).map(cloneStep)
  const degraded = skippedSteps.length > 0

  return {
    status: degraded ? 'degraded' : 'ready',
    effectiveSteps,
    skippedSteps,
    missingPermissions,
    missingEvidence,
    explanations: degraded
      ? [
          ...health.explanations,
          ...skippedSteps
            .filter((step) => !unavailableOptionalIds.has(step.id))
            .map((step) => {
              const evidenceTypes = missingEvidence
                .filter((item) => item.stepId === step.id)
                .map((item) => item.type === 'confirmation' ? '确认证据' : '审批证据')
              return evidenceTypes.length
                ? `可选分支“${stepLabel(step)}”缺少${evidenceTypes.join('或')}，已降级跳过。`
                : `可选分支“${stepLabel(step)}”缺少权限，已降级跳过。`
            })
        ]
      : health.explanations
  }
}

/**
 * Rebuild mutable step metadata from the authoritative online catalog while preserving the requested pin.
 * @param {ScenarioPackageDraft} draft
 * @param {PublishedSkill[]} authoritativeSkills
 */
export function rebuildDraftFromCatalog(draft, authoritativeSkills) {
  const catalog = new Map((authoritativeSkills || []).map((skill) => [skill.id, skill]))
  const reasons = []
  const steps = (draft?.steps || []).map((step) => {
    const currentSkill = catalog.get(step.skillId)
    if (!currentSkill || !isPublishedOnlineSkill(currentSkill)) {
      reasons.push(`Skill“${stepLabel(step)}”已禁用、撤回或不再发布，请移除后重新选择。`)
      return cloneStep({ ...step, dependencyState: 'unavailable' })
    }

    const currentPublishedVersion = onlineVersionOf(currentSkill)
    if (step.pinnedVersion !== currentPublishedVersion) {
      reasons.push(`Skill“${currentSkill.name || currentSkill.id}”固定版本 ${step.pinnedVersion} 与当前线上版本 ${currentPublishedVersion} 不一致，请重新选择并重新评估。`)
    }

    return cloneStep({
      ...step,
      skillId: currentSkill.id,
      name: currentSkill.name || currentSkill.id,
      menu: currentSkill.menu,
      currentPublishedVersion,
      dependencyState: step.pinnedVersion === currentPublishedVersion
        ? step.dependencyState || 'available'
        : 'update_available',
      permissions: currentSkill.permissions || {}
    })
  })

  return {
    draft: { ...omitRetiredScenarioFields(draft), steps },
    reasons
  }
}

/**
 * Check the immutable review identity and pending-state gates for either decision.
 * @param {ScenarioPackageDraft} packageItem
 * @param {ScenarioActor} actor
 */
export function evaluateScenarioPackageReview(packageItem, actor) {
  const reasons = []
  if (packageItem?.status !== 'review') reasons.push('仅待审核状态的场景技能包可以审核')
  const actorId = typeof actor?.id === 'string' ? actor.id.trim() : ''
  const ownerId = typeof packageItem?.ownerId === 'string' ? packageItem.ownerId.trim() : ''
  const submittedBy = typeof packageItem?.submittedBy === 'string' ? packageItem.submittedBy.trim() : ''
  if (!actorId) reasons.push('当前审核账号不能为空')
  if (scenarioPackageRole(actor) !== 'admin') reasons.push('缺少场景技能包审核权限')
  if (actorId && [ownerId, submittedBy, packageItem?.submitterId?.trim(), ...revisionEditorIds(packageItem)].includes(actorId)) {
    reasons.push('不能审核本人创建、编辑或提交的场景技能包，请由其他管理员审核')
  }
  const latestEvent = packageItem?.auditEvents?.filter(event => !['disabled', 'enabled'].includes(event.type)).at(-1)
  if (!ownerId || !submittedBy || !packageItem?.submittedAt?.trim()
    || latestEvent?.type !== 'submitted' || latestEvent.actorId !== packageItem.submittedBy
    || latestEvent.at !== packageItem.submittedAt) {
    reasons.push('缺少有效的提交审核记录')
  }
  return { ok: reasons.length === 0, reasons }
}

/** Return a detached, non-recursive record of the independently published version. */
export function scenarioPublishedSnapshot(packageItem) {
  const source = packageItem?.publishedSnapshot || (['published', 'disabled'].includes(packageItem?.status) ? packageItem : null)
  if (!source || source.id !== packageItem.id || source.ownerId !== packageItem.ownerId) return undefined
  const snapshot = cloneScenarioTestSnapshot(source)
  delete snapshot.publishedSnapshot
  delete snapshot.baseUpdatedAt
  snapshot.status = 'published'
  snapshot.onlineStatus = 'published'
  return snapshot
}

/** Workflow revisions never replace the reviewed version selected for runtime. */
export function getScenarioRuntimePackage(packageItem) {
  if (!packageItem?.publishedSnapshot) return packageItem
  const snapshot = scenarioPublishedSnapshot(packageItem)
  return snapshot
    ? { ...snapshot, status: packageItem.onlineStatus === 'published' ? 'published' : 'disabled' }
    : { ...packageItem, status: 'disabled' }
}

function hasIndependentPublishedEvidence(packageItem) {
  const snapshot = scenarioPublishedSnapshot(packageItem)
  const approval = snapshot?.auditEvents?.filter(event => event.type === 'approved').at(-1)
  return Boolean(snapshot?.version && approval?.actorId?.trim() && approval?.at?.trim()
    && ![snapshot.ownerId, snapshot.submittedBy, snapshot.submitterId, ...revisionEditorIds(snapshot)].includes(approval.actorId)
    && snapshot.auditEvents.some(event => event.type === 'published' && event.actorId?.trim() && event.at?.trim()))
}

/** All list actions and lifecycle mutations share this permission/state policy. */
export function scenarioPackageActions(packageItem, actor) {
  if (!packageItem) return []
  const actions = ['view']
  const isOwner = hasActorId(actor) && actor.id === packageItem.ownerId
  const isAdmin = hasActorId(actor) && scenarioPackageRole(actor) === 'admin'
  const canMaintain = (isOwner && canAuthorScenarioPackage(actor))
    || (isAdmin && (['published', 'disabled'].includes(packageItem.status) || hasIndependentPublishedEvidence(packageItem)))
  if (packageItem.status === 'review' && hasActorId(actor)
    && (isOwner || actor.id === packageItem.submittedBy) && (canAuthorScenarioPackage(actor) || isAdmin)) {
    actions.push('withdraw')
    return actions
  }
  if (canMaintain && ['draft', 'rejected', 'published', 'disabled'].includes(packageItem.status)) actions.push('edit')
  if (evaluateScenarioPackageReview(packageItem, actor).ok) actions.push('approve', 'reject')
  if (hasActorId(actor) && scenarioPackageRole(actor) === 'admin' && hasIndependentPublishedEvidence(packageItem)) {
    const onlineStatus = packageItem.onlineStatus || packageItem.status
    if (onlineStatus === 'published') actions.push('disable')
    if (onlineStatus === 'disabled') actions.push('enable')
  }
  return actions
}

function revisionEditorIds(packageItem) {
  return Array.isArray(packageItem?.revisionEditors)
    ? packageItem.revisionEditors.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim())
    : []
}

function nextRevisionEditors(previous, actor) {
  const earlier = previous && !['published', 'disabled'].includes(previous.status) ? revisionEditorIds(previous) : []
  return [...new Set([...earlier, actor.id])]
}

function nextPackageVersion(version) {
  const match = /^(v?)(\d+)\.(\d+)\.(\d+)$/.exec(version || '')
  return match ? `${match[1]}${match[2]}.${match[3]}.${Number(match[4]) + 1}` : `${version || 'v1'}.1`
}

/** Editable snapshots contain no publication authority and never mutate the original. */
export function editableScenarioPackageDraft(packageItem, actor) {
  if (!scenarioPackageActions(packageItem, actor).includes('edit')) return null
  const isPublishedRevision = ['published', 'disabled'].includes(packageItem.status)
  return cloneScenarioTestSnapshot({
    id: packageItem.id, name: packageItem.name, description: packageItem.description,
    targetAudience: packageItem.targetAudience, ownerId: packageItem.ownerId, steps: packageItem.steps,
    status: packageItem.status,
    version: isPublishedRevision ? nextPackageVersion(packageItem.version) : packageItem.version,
    baseUpdatedAt: packageItem.updatedAt,
    ...(!isPublishedRevision ? { testReport: packageItem.testReport, testRequest: packageItem.testRequest } : {})
  })
}

/**
 * Save unfinished authoring content without granting any client-supplied publication authority.
 * Submission remains responsible for definition, reference-permission and current-trial validation.
 * @param {ScenarioPackageDraft} draft
 * @param {ScenarioActor} actor
 * @param {string} now
 * @param {ScenarioPackageDraft} [previous]
 */
export function saveScenarioPackageDraft(draft, actor, now, previous) {
  if (!hasActorId(actor) || draft?.ownerId !== (previous?.ownerId || actor.id)) {
    throw new Error('不能更换原包所有者，仅原创建人或授权管理员可以维护')
  }
  if (!previous && !canAuthorScenarioPackage(actor)) {
    throw new Error('保存草稿需要创建技能包和跨菜单编排权限')
  }
  if (!previous && draft.baseUpdatedAt) throw new Error('原场景技能包不存在，请重新打开当前版本')
  if (typeof draft.id !== 'string' || !draft.id.trim()) throw new Error('技能包 ID 不能为空')
  if (typeof draft.name !== 'string' || !draft.name.trim()) throw new Error('请填写技能包名称后保存草稿')
  if (previous && (previous.id !== draft.id || !scenarioPackageActions(previous, actor).includes('edit'))) {
    throw new Error('当前状态不允许保存草稿，待审核内容不能编辑')
  }
  if (previous && (!draft.baseUpdatedAt || draft.baseUpdatedAt !== previous.updatedAt)) {
    throw new Error('场景技能包已更新或缺少编辑版本，请重新打开编辑后保存')
  }
  const steps = (Array.isArray(draft.steps) ? draft.steps : []).map(cloneStep)
  const snapshot = previous ? scenarioPublishedSnapshot(previous) : null
  return {
    ...(previous ? cloneScenarioTestSnapshot(previous) : {}),
    id: draft.id,
    name: draft.name.trim(),
    description: typeof draft.description === 'string' ? draft.description : '',
    targetAudience: typeof draft.targetAudience === 'string' ? draft.targetAudience : '',
    ownerId: previous?.ownerId || actor.id,
    revisionEditors: nextRevisionEditors(previous, actor),
    version: previous ? ['published', 'disabled'].includes(previous.status) ? nextPackageVersion(previous.version) : previous.version : 'v1.0.0',
    status: 'draft',
    onlineStatus: previous?.onlineStatus || (previous?.status === 'published' || previous?.status === 'disabled' ? previous.status : 'unpublished'),
    publishedSnapshot: snapshot || undefined,
    steps,
    health: evaluatePackageHealth(steps),
    updatedAt: now,
    auditEvents: cloneScenarioTestSnapshot(previous?.auditEvents || []),
    // Retained diagnostics are evidence only when the submission fingerprint still matches.
    testReport: cloneScenarioTestSnapshot(draft.testReport),
    testRequest: cloneScenarioTestSnapshot(draft.testRequest)
  }
}

/** Apply only lifecycle changes allowed by the current trusted record. */
export function transitionScenarioPackage(packageItem, actor, action, now) {
  if (!['disable', 'enable', 'withdraw'].includes(action) || !scenarioPackageActions(packageItem, actor).includes(action)) {
    return { ok: false, reasons: ['当前账号或场景技能包状态不允许此操作'] }
  }
  const result = cloneScenarioTestSnapshot(packageItem)
  result.updatedAt = now
  if (action === 'withdraw') {
    result.status = 'draft'
    result.auditEvents = [...(result.auditEvents || []), { type: 'withdrawn', actorId: actor.id, at: now }]
    for (const field of ['submittedAt', 'submittedBy', 'submitterId', 'reviewedAt', 'reviewedBy', 'reviewNote', 'approvedAt', 'publishedAt']) delete result[field]
    return { ok: true, reasons: [], package: result }
  }
  result.auditEvents = [...(result.auditEvents || []), { type: action === 'disable' ? 'disabled' : 'enabled', actorId: actor.id, at: now }]
  result.publishedSnapshot = scenarioPublishedSnapshot(packageItem)
  result.onlineStatus = action === 'disable' ? 'disabled' : 'published'
  if (['published', 'disabled'].includes(result.status)) result.status = result.onlineStatus
  return { ok: true, reasons: [], package: result }
}

/**
 * Submit a fresh draft or an owner's rejected revision, preserving only trusted history.
 * @param {ScenarioPackageDraft} draft
 * @param {ScenarioActor} actor
 * @param {string} now
 * @param {PublishedSkill[]} authoritativeSkills
 * @param {ScenarioPackageDraft} [previous]
 */
export function submitScenarioPackage(draft, actor, now, authoritativeSkills, previous) {
  if (!previous && draft?.baseUpdatedAt) throw new Error('原场景技能包不存在，请重新打开当前版本')
  if (previous && draft?.ownerId !== previous.ownerId) {
    throw new Error('不能更换原包所有者，仅原创建人或授权管理员可以重新提交审核')
  }
  if (previous && (previous.id !== draft.id || !scenarioPackageActions(previous, actor).includes('edit'))) {
    throw new Error('当前状态或账号不允许修订场景技能包，待审核内容不能编辑')
  }
  if (previous && (!draft.baseUpdatedAt || draft.baseUpdatedAt !== previous.updatedAt)) {
    throw new Error('场景技能包已更新或缺少编辑版本，请重新打开编辑后提交')
  }
  const rebuilt = rebuildDraftFromCatalog(draft, authoritativeSkills)
  const policy = evaluatePackageForPublish(rebuilt.draft, actor, previous)
  const health = evaluatePackageHealth(rebuilt.draft.steps)
  const trial = evaluateScenarioTrialForSubmit(draft, authoritativeSkills)
  const reasons = [...rebuilt.reasons, ...policy.reasons, ...(health.status === 'paused' ? health.explanations : []), ...trial.reasons]
  if (!draft?.id?.trim()) reasons.push('技能包 ID 不能为空')
  if (reasons.length) throw new Error(`无法提交场景技能包：${[...new Set(reasons)].join('；')}`)
  const resolved = resolveScenarioChain(rebuilt.draft.steps)
  /** @type {ScenarioAuditEvent[]} */
  const auditEvents = [...(previous?.auditEvents || []).map(event => ({ ...event })), { type: 'submitted', actorId: actor.id, at: now }]
  return {
    id: draft.id,
    name: draft.name,
    description: draft.description,
    targetAudience: draft.targetAudience,
    ownerId: previous?.ownerId || actor.id,
    revisionEditors: nextRevisionEditors(previous, actor),
    version: previous ? ['published', 'disabled'].includes(previous.status) ? nextPackageVersion(previous.version) : previous.version : 'v1.0.0',
    onlineStatus: previous?.onlineStatus || (previous?.status === 'published' || previous?.status === 'disabled' ? previous.status : 'unpublished'),
    ...(previous && scenarioPublishedSnapshot(previous) ? { publishedSnapshot: scenarioPublishedSnapshot(previous) } : {}),
    steps: resolved.steps,
    status: 'review',
    health,
    updatedAt: now,
    submittedAt: now,
    submittedBy: actor.id,
    testReport: cloneScenarioTestSnapshot(draft.testReport),
    testRequest: cloneScenarioTestSnapshot(draft.testRequest || draft.testReport.request),
    auditEvents
  }
}

/**
 * Publish only a submitted package approved by a different authorized administrator.
 * @param {ScenarioPackageDraft} draft
 * @param {ScenarioActor} actor
 * @param {string} now
 * @param {PublishedSkill[]} authoritativeSkills
 * @param {string} [note]
 */
export function publishScenarioPackage(draft, actor, now, authoritativeSkills, note = '') {
  const decision = evaluateScenarioPackageReview(draft, actor)
  if (!decision.ok) throw new Error(`无法审核场景技能包：${decision.reasons.join('；')}`)
  const rebuilt = rebuildDraftFromCatalog(draft, authoritativeSkills)
  if (rebuilt.reasons.length) {
    throw new Error(`无法发布场景技能包：${rebuilt.reasons.join('；')}`)
  }
  const resolved = resolveScenarioChain(rebuilt.draft.steps)
  const resolvedDraft = { ...rebuilt.draft, steps: resolved.steps }
  const reasons = packageDefinitionReasons(resolvedDraft)
  if (reasons.length) throw new Error(`无法发布场景技能包：${reasons.join('；')}`)
  const health = evaluatePackageHealth(resolvedDraft.steps)
  if (health.status === 'paused') {
    throw new Error(`无法发布场景技能包：${health.explanations.join('；')}`)
  }
  const trial = evaluateScenarioTrialForSubmit(draft, authoritativeSkills)
  if (!trial.ok) throw new Error(`无法发布场景技能包：${trial.reasons.join('；')}`)

  /** @type {ScenarioAuditEvent[]} */
  const auditEvents = [
    ...(draft.auditEvents || []).map(event => ({ ...event })),
    { type: 'approved', actorId: actor.id, at: now, ...(note.trim() ? { note: note.trim() } : {}) },
    { type: 'published', actorId: actor.id, at: now }
  ]
  const published = {
    ...resolvedDraft,
    steps: resolvedDraft.steps.map(cloneStep),
    version: draft.version || 'v1.0.0',
    status: 'published',
    updatedAt: now,
    approvedAt: now,
    publishedAt: now,
    reviewedAt: now,
    reviewedBy: actor.id,
    reviewNote: note.trim(),
    health,
    auditEvents
  }
  delete published.publishedSnapshot
  delete published.baseUpdatedAt
  const onlineStatus = draft.onlineStatus === 'disabled' ? 'disabled' : 'published'
  return { ...published, status: onlineStatus, onlineStatus, publishedSnapshot: scenarioPublishedSnapshot(published) }
}

/** @param {ScenarioPackageDraft} packageItem @param {ScenarioActor} actor @param {string} reason @param {string} now */
export function rejectScenarioPackage(packageItem, actor, reason, now) {
  const decision = evaluateScenarioPackageReview(packageItem, actor)
  if (!decision.ok) throw new Error(`无法审核场景技能包：${decision.reasons.join('；')}`)
  const note = typeof reason === 'string' ? reason.trim() : ''
  if (!note) throw new Error('请填写驳回原因')
  /** @type {ScenarioAuditEvent[]} */
  const auditEvents = [...(packageItem.auditEvents || []).map(event => ({ ...event })), { type: 'rejected', actorId: actor.id, at: now, note }]
  return {
    ...omitRetiredScenarioFields(packageItem),
    steps: packageItem.steps.map(cloneStep),
    status: 'rejected',
    updatedAt: now,
    reviewedAt: now,
    reviewedBy: actor.id,
    reviewNote: note,
    auditEvents
  }
}

/** Create deterministic POC seed data for UI state initialisation. */
export function createSeedScenarioPackages() {
  const customer = createPinnedScenarioStep({
    id: 'seed-customer-query', name: '客户查询', menu: '客户管理', version: '1.0.0',
    status: 'published', onlineStatus: 'published', online: '1.0.0'
  }, { id: 'seed-customer', required: true })
  const order = createPinnedScenarioStep({
    id: 'seed-order-export', name: '订单导出', menu: '订单管理', version: '1.0.0',
    status: 'published', onlineStatus: 'published', online: '1.0.0'
  }, { id: 'seed-order', required: false })
  return [{
    id: 'seed-sales-service',
    name: '销售服务包',
    description: '当销售运营需要汇总指定客户情况并准备订单明细时使用；仅查询和导出当前授权范围内的数据，不修改客户资料或订单。',
    targetAudience: '企业销售运营',
    ownerId: 'pm-li',
    status: 'draft',
    steps: [customer, order]
  }]
}
