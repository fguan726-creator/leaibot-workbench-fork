import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  createPinnedScenarioStep,
  cloneScenarioTestSnapshot,
  evaluatePackageForPublish,
  evaluatePackageHealth,
  evaluateRuntimeAccess as evaluateScenarioRuntimeAccess,
  rebuildDraftFromCatalog,
  publishScenarioPackage,
  submitScenarioPackage,
  rejectScenarioPackage,
  evaluateScenarioPackageReview,
  scenarioPackageActions,
  scenarioPackageRole,
  editableScenarioPackageDraft,
  saveScenarioPackageDraft,
  transitionScenarioPackage,
  scenarioPublishedSnapshot,
  getScenarioRuntimePackage,
  resolveScenarioChain
} from '../domain/scenarioSkillPackages.js'
import { useSkillHubStore, type SkillHubItem } from './skillHub'
import { useAppStore } from './app'
import { buildScenarioRunPlan } from '../domain/scenarioRunPlan.js'
import { getScenarioTestFingerprint, runScenarioSimulation, type ScenarioSimulationReport, type ScenarioSimulationRequest } from '../domain/scenarioPackageTesting.js'
import { readScenarioPackageState, writeScenarioPackageState, type ScenarioPackageStoredState } from '../services/scenarioPackageStorage'

export type ScenarioDependencyState = 'available' | 'expired' | 'unavailable' | 'emergency_disabled' | 'update_available'
export type ScenarioStepKind = 'required' | 'conditional'
export type ScenarioPermissionBucket = 'menu' | 'skill' | 'data' | 'action'

export interface ScenarioSkillPermissionSnapshot {
  menu: string[]
  skill: string[]
  data: string[]
  action: string[]
}

export interface ScenarioSelectableSkill {
  id: string
  name: string
  menu: string
  version: string
  status: 'published'
  onlineStatus: 'published'
  online: string
  description?: string
  inputDescription?: string
  outputDescription?: string
  permissions: ScenarioSkillPermissionSnapshot
}

export interface ScenarioPinnedStep {
  id: string
  skillId: string
  name: string
  menu: string
  pinnedVersion: string
  currentPublishedVersion: string
  kind: ScenarioStepKind
  condition?: string
  task?: string
  fixedRequirements?: string
  expectedOutput?: string
  inputDescription?: string
  required: boolean
  requiresConfirmation?: boolean
  requiresApproval?: boolean
  predecessorId?: string | null
  position?: { x: number; y: number }
  dependencyState: ScenarioDependencyState
  permissions: ScenarioSkillPermissionSnapshot
}

export interface ScenarioPackageHealth {
  status: 'healthy' | 'upgrade_required' | 'degraded' | 'paused'
  explanations: string[]
  blockedStepIds: string[]
  degradedStepIds: string[]
}

export interface ScenarioPackageAuditEvent {
  type: 'submitted' | 'approved' | 'published' | 'rejected' | 'withdrawn' | 'disabled' | 'enabled'
  actorId: string
  at: string
  note?: string
}

export interface ScenarioSkillPackage {
  id: string
  name: string
  description: string
  targetAudience: string
  ownerId: string
  version: string
  status: 'draft' | 'review' | 'rejected' | 'published' | 'disabled'
  onlineStatus?: 'unpublished' | 'published' | 'disabled'
  publishedSnapshot?: ScenarioSkillPackage
  steps: ScenarioPinnedStep[]
  health: ScenarioPackageHealth
  updatedAt: string
  degradationNote?: string
  approvedAt?: string
  publishedAt?: string
  submittedAt?: string
  submittedBy?: string
  revisionEditors?: string[]
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
  auditEvents?: ScenarioPackageAuditEvent[]
  testReport?: ScenarioSimulationReport
  testRequest?: ScenarioSimulationRequest
}

export interface ScenarioSkillPackageDraft {
  id: string
  name: string
  description: string
  targetAudience: string
  ownerId: string
  version?: string
  status?: ScenarioSkillPackage['status']
  baseUpdatedAt?: string
  steps: ScenarioPinnedStep[]
  testReport?: ScenarioSimulationReport
  testRequest?: ScenarioSimulationRequest
}

export interface ScenarioPackageActor {
  id: string
  permissions: string[] | (Partial<ScenarioSkillPermissionSnapshot> & { policy?: string[] })
}

export type ScenarioPackageAction = 'view' | 'edit' | 'withdraw' | 'approve' | 'reject' | 'disable' | 'enable'
export interface ScenarioPackageMutationResult {
  ok: boolean
  reasons: string[]
  package?: ScenarioSkillPackage
}

export interface ScenarioPackagePolicyEvaluation {
  ok: boolean
  canSelfApprove: boolean
  reasons: string[]
}

export interface ScenarioDraftEvaluation {
  ok: boolean
  reasons: string[]
  eligibilityReasons: string[]
  draft: ScenarioSkillPackageDraft
  policy: ScenarioPackagePolicyEvaluation
  health: ScenarioPackageHealth
}

const explicitPermissionSnapshots: Record<string, ScenarioSkillPermissionSnapshot> = {
  'employee-certification-insight': {
    menu: ['menu:employee-management'],
    skill: ['skill:employee-certification-insight'],
    data: ['data:employee-certification:read'],
    action: ['action:employee-certification-insight:run']
  },
  'workplace-segment-operations': {
    menu: ['menu:operations'],
    skill: ['skill:workplace-segment-operations'],
    data: ['data:workplace-segment:read'],
    action: ['action:workplace-segment-operations:run']
  },
  'enterprise-customer-followup': {
    menu: ['menu:enterprise-customers'],
    skill: ['skill:enterprise-customer-followup'],
    data: ['data:enterprise-customer:read'],
    action: ['action:enterprise-customer-followup:run']
  }
}

function clonePermissions(permissions: ScenarioSkillPermissionSnapshot): ScenarioSkillPermissionSnapshot {
  return {
    menu: [...permissions.menu],
    skill: [...permissions.skill],
    data: [...permissions.data],
    action: [...permissions.action]
  }
}

function permissionSnapshotFor(item: SkillHubItem): ScenarioSkillPermissionSnapshot {
  const suppliedSnapshot = (item as SkillHubItem & { permissions?: Partial<ScenarioSkillPermissionSnapshot> }).permissions
  if (suppliedSnapshot) {
    return {
      menu: [...(suppliedSnapshot.menu || [])],
      skill: [...(suppliedSnapshot.skill || [])],
      data: [...(suppliedSnapshot.data || [])],
      action: [...(suppliedSnapshot.action || [])]
    }
  }
  const knownSnapshot = explicitPermissionSnapshots[item.name]
  if (knownSnapshot) return clonePermissions(knownSnapshot)

  return {
    menu: [`menu:${item.category}`],
    skill: [`skill:${item.name}`],
    data: [`data:${item.name}:read`],
    action: [`action:${item.name}:run`]
  }
}

// Version-specific contracts for the existing demo catalog; never reuse across a new pin.
const publishedScenarioContracts: Record<string, { version: string; description: string; input: string; output: string }> = {
  'product-knowledge': { version: 'v1.0.7', description: '识别用户产品知识查询需求，返回配置参数、性能差异和可选机型说明。', input: '产品名称、使用需求或对比对象', output: '配置参数、性能差异和可选机型说明' },
  'voucher-recommend': { version: 'v0.1.3', description: '识别虚拟品充值、会员充值和券包权益推荐需求，输出推荐卡片。', input: '用户权益需求、充值类型和适用范围', output: '可选券包与权益推荐卡片' },
  'gmv-daily-summary': { version: 'v1.2.0', description: '汇总每日 GMV、订单量和渠道贡献，生成标准运营日报。', input: '统计日期、渠道和可访问的数据范围', output: '包含 GMV、订单量和渠道贡献的运营日报' },
  'employee-certification-insight': { version: 'v1.0.0', description: '输入职场员工的认证筛选条件，输出认证状态、待处理原因和可跟进名单。', input: '职场员工认证筛选条件', output: '认证状态、待处理原因和可跟进名单' },
  'workplace-segment-operations': { version: 'v1.2.0', description: '输入认证人群范围与经营时间，输出人群规模、转化表现和运营建议。', input: '认证人群范围与经营时间', output: '人群规模、转化表现和运营建议' },
  'enterprise-customer-followup': { version: 'v1.0.0', description: '输入企业客户及跟进目标，输出下一步跟进建议、重点事项和沟通要点。', input: '企业客户及跟进目标', output: '下一步跟进建议、重点事项和沟通要点' }
}

/** Convert only published Skill Hub records into a scenario-safe selection catalog. */
export function createSelectableScenarioSkills(items: SkillHubItem[]): ScenarioSelectableSkill[] {
  return items
    .filter((item) => (
      item.onlineStatus === 'published'
      && item.online !== '未发布'
    ))
    .map((item) => {
      const publishedContract = item.publishedContract?.version === item.online ? item.publishedContract : undefined
      const demoContract = publishedScenarioContracts[item.name]?.version === item.online ? publishedScenarioContracts[item.name] : undefined
      return {
        id: item.name,
        name: item.cnName,
        menu: item.category,
        version: item.online,
        status: 'published',
        onlineStatus: 'published',
        online: item.online,
        description: publishedContract ? publishedContract.description : demoContract?.description || `使用${item.cnName || item.name}完成本节点任务`,
        inputDescription: publishedContract ? publishedContract.input : demoContract?.input || '',
        outputDescription: publishedContract ? publishedContract.output : demoContract?.output || '',
        permissions: permissionSnapshotFor(item)
      }
    })
}

function createSeedScenarioPackages(selectableSkills: ScenarioSelectableSkill[], catalog: SkillHubItem[], currentOwnerId: string): ScenarioSkillPackage[] {
  const authorFor = (id: string): ScenarioPackageActor => ({ id, permissions: [
    'scenario-package:create', 'scenario-package:compose:cross-menu',
    ...catalog.flatMap(item => [`skill:${item.name}:metadata:read`, `skill:${item.name}:reference`, ...Object.values(permissionSnapshotFor(item)).flat()])
  ] })
  const findSelectableSkill = (id: string) => {
    const skill = selectableSkills.find((item) => item.id === id)
    if (!skill) throw new Error(`场景技能包缺少 POC Skill：${id}`)
    return skill
  }
  const certification = createPinnedScenarioStep(
    findSelectableSkill('employee-certification-insight'),
    { id: 'workplace-certification', required: true }
  ) as ScenarioPinnedStep
  const operations = createPinnedScenarioStep(
    { ...findSelectableSkill('workplace-segment-operations'), version: 'v1.1.0', online: 'v1.1.0', description: undefined, inputDescription: '', outputDescription: '' },
    {
      id: 'workplace-segment-operations',
      required: true,
      currentPublishedVersion: 'v1.2.0',
      dependencyState: 'update_available'
    }
  ) as ScenarioPinnedStep
  const enterpriseFollowup = createPinnedScenarioStep(
    findSelectableSkill('enterprise-customer-followup'),
    {
      id: 'enterprise-customer-followup',
      kind: 'conditional',
      condition: '当认证人群需要企业客户服务时',
      required: false
    }
  ) as ScenarioPinnedStep
  const steps = [certification, operations, enterpriseFollowup]
  const reviewSteps = [
    certification,
    createPinnedScenarioStep(findSelectableSkill('workplace-segment-operations'), { id: operations.id, required: true }) as ScenarioPinnedStep,
    enterpriseFollowup
  ].map(step => ({ ...step, task: step.task || `使用${step.name}分析当前授权对象并汇总结果`, permissions: clonePermissions(step.permissions) }))
  const publishedAt = '2026-09-04T09:30:00.000Z'

  const seededPackages: ScenarioSkillPackage[] = [{
    id: 'seed-workplace-certification-operations',
    name: '职场人群认证经营管理',
    description: '当运营人员需要了解指定职场人群的认证状态、分析经营机会并准备企业客户跟进建议时使用；仅分析当前授权范围内的数据，不修改认证结果或直接联系客户。',
    targetAudience: '认证运营与企业客户运营人员',
    ownerId: 'pm-li',
    version: 'v1.0.0',
    status: 'published',
    steps,
    health: evaluatePackageHealth(steps) as ScenarioPackageHealth,
    updatedAt: publishedAt,
    approvedAt: publishedAt,
    publishedAt,
    submittedAt: publishedAt,
    submittedBy: 'pm-li',
    reviewedAt: publishedAt,
    reviewedBy: 'admin',
    auditEvents: [
      { type: 'submitted', actorId: 'pm-li', at: publishedAt },
      { type: 'approved', actorId: 'admin', at: publishedAt },
      { type: 'published', actorId: 'admin', at: publishedAt }
    ]
  }, {
    id: 'seed-scenario-pending-review',
    name: '职场人群经营协作（审核示例）',
    description: '审核示例：当需要结合职场认证与人群经营情况制定客户跟进计划时使用；仅生成授权数据范围内的分析与建议，不修改认证结果或发送客户消息。',
    targetAudience: '认证运营与企业客户运营人员',
    ownerId: 'pm-li',
    version: 'v1.0.0',
    status: 'review',
    steps: reviewSteps,
    health: evaluatePackageHealth(reviewSteps) as ScenarioPackageHealth,
    updatedAt: publishedAt,
    submittedAt: publishedAt,
    submittedBy: 'pm-li',
    auditEvents: [{ type: 'submitted', actorId: 'pm-li', at: publishedAt }]
  }]
  const originalExamples = seededPackages.map((packageItem): ScenarioSkillPackage => {
    if (packageItem.status === 'published') {
      return { ...packageItem, onlineStatus: 'published', publishedSnapshot: scenarioPublishedSnapshot(packageItem) as ScenarioSkillPackage }
    }
    const testRequest: ScenarioSimulationRequest = {
      input: '模拟查询职场人群认证情况并分析经营机会。',
      expectedOutput: '输出认证状态、经营建议与客户跟进要点。',
      activeOptionalStepIds: packageItem.steps.filter(step => !step.required).map(step => step.id),
      confirmedStepIds: [], approvedStepIds: [],
      sampleOutputs: Object.fromEntries(packageItem.steps.map(step => [step.id, `${step.name}的模拟分析结果。`]))
    }
    return {
      ...packageItem, onlineStatus: 'unpublished', testRequest,
      testReport: runScenarioSimulation(packageItem, selectableSkills, testRequest, authorFor(packageItem.ownerId), publishedAt)
    }
  })

  const submittedAt = '2026-09-03T08:00:00.000Z'
  const changedAt = '2026-09-10T08:00:00.000Z'
  // The fallback identity only prevents self-review when a PM account happens to be named admin.
  const reviewerFor = (creator: string) => ({ id: creator === 'admin' ? 'zhangrui' : 'admin', permissions: ['scenario-package:review'] })
  const createDraftExample = (id: string, name: string, creator: string, exampleSteps: ScenarioPinnedStep[] = reviewSteps): ScenarioSkillPackage => ({
    id, name, ownerId: creator, version: 'v1.0.0', status: 'draft', onlineStatus: 'unpublished',
    description: '当运营人员需要分析指定职场人群的认证状态、经营表现并准备客户跟进建议时使用；仅处理授权范围内的数据，不修改认证结果或发送客户消息。',
    targetAudience: '认证运营与企业客户运营人员',
    steps: cloneScenarioTestSnapshot(exampleSteps),
    health: evaluatePackageHealth(exampleSteps) as ScenarioPackageHealth,
    updatedAt: submittedAt, auditEvents: []
  })
  const createReviewExample = (draft: ScenarioSkillPackage, skills = selectableSkills): ScenarioSkillPackage => {
    const creator = authorFor(draft.ownerId)
    const testRequest: ScenarioSimulationRequest = {
      input: '按场景配置检查节点执行与结果传递。', expectedOutput: '输出节点分析结果与客户跟进建议。',
      activeOptionalStepIds: draft.steps.filter(step => !step.required).map(step => step.id),
      confirmedStepIds: [], approvedStepIds: [],
      sampleOutputs: Object.fromEntries(draft.steps.map(step => [step.id, `${step.name}的模拟分析结果。`]))
    }
    const tested = { ...draft, testRequest, testReport: runScenarioSimulation(draft, skills, testRequest, creator, submittedAt) }
    return submitScenarioPackage(tested, creator, submittedAt, skills) as ScenarioSkillPackage
  }
  const createPublishedExample = (draft: ScenarioSkillPackage, skills = selectableSkills): ScenarioSkillPackage => (
    publishScenarioPackage(createReviewExample(draft, skills), reviewerFor(draft.ownerId), publishedAt, skills) as ScenarioSkillPackage
  )

  // These dependencies were published before they were disabled in the existing Skill catalog.
  // Reconstruct their historical snapshots locally, without making them selectable again.
  const createHistoricalSkill = (id: string): ScenarioSelectableSkill => {
    const item = catalog.find(skill => skill.name === id)
    if (!item || item.online === '未发布') throw new Error(`缺少场景包历史 Skill：${id}`)
    return {
      id, name: item.cnName || item.name, menu: item.category, version: item.online,
      status: 'published', onlineStatus: 'published', online: item.online,
      description: item.desc, inputDescription: '本次场景的查询范围', outputDescription: `${item.cnName}结果`,
      permissions: permissionSnapshotFor(item)
    }
  }
  const historicalWeather = createHistoricalSkill('weather-query')
  const historicalInventory = createHistoricalSkill('legacy-inventory-alert')
  const historicalCatalog = [...selectableSkills, historicalWeather, historicalInventory]
  const degradedDraft = createDraftExample('seed-scenario-degraded', '职场活动运营分析', 'pm-li', [
    ...reviewSteps.slice(0, 2),
    createPinnedScenarioStep(historicalWeather, {
      id: 'activity-weather', kind: 'conditional', condition: '需要安排线下职场活动时', required: false
    }) as ScenarioPinnedStep
  ])
  degradedDraft.description = '当需要分析职场认证人群与经营表现、制定线下运营活动计划时使用；天气查询为可选分支，不可用时仍可输出核心人群分析。'
  const pausedDraft = createDraftExample('seed-scenario-paused', '企业客户库存预警协同', 'pm-li', [
    createPinnedScenarioStep(findSelectableSkill('enterprise-customer-followup'), { id: 'customer-followup', required: true }) as ScenarioPinnedStep,
    createPinnedScenarioStep(historicalInventory, { id: 'inventory-alert', required: true }) as ScenarioPinnedStep
  ])
  pausedDraft.description = '当需要结合企业客户跟进目标与库存预警制定供货建议时使用；库存预警属于核心链路，依赖不可用时暂停整个技能包。'
  const dependencyExamples = [degradedDraft, pausedDraft].map(draft => {
    const published = createPublishedExample(draft, historicalCatalog)
    const currentSteps = published.steps.map(step => ({
      ...step,
      dependencyState: [historicalWeather.id, historicalInventory.id].includes(step.skillId)
        ? 'emergency_disabled' as const : step.dependencyState
    }))
    const current = { ...published, steps: currentSteps, health: evaluatePackageHealth(currentSteps) as ScenarioPackageHealth, updatedAt: changedAt }
    delete current.publishedSnapshot
    return { ...current, publishedSnapshot: scenarioPublishedSnapshot(current) as ScenarioSkillPackage }
  })

  const ownExamples: ScenarioSkillPackage[] = []
  for (const ownerId of new Set(['pm-li', ...(currentOwnerId ? [currentOwnerId] : [])])) {
    const id = `seed-scenario-own-${encodeURIComponent(ownerId)}`
    ownExamples.push(createDraftExample(`${id}-draft`, '职场人群认证分析（草稿）', ownerId))
    ownExamples.push(createReviewExample(createDraftExample(`${id}-review`, '职场人群经营协作（待审核）', ownerId)))
    ownExamples.push(rejectScenarioPackage(
      createReviewExample(createDraftExample(`${id}-rejected`, '企业客户跟进分析（已驳回）', ownerId)),
      reviewerFor(ownerId), '请在场景描述中补充适用的客户范围，以及不适用的情况。', publishedAt
    ) as ScenarioSkillPackage)
    ownExamples.push(createPublishedExample(createDraftExample(`${id}-published`, '职场人群经营分析（已发布）', ownerId)))
    const disabled = transitionScenarioPackage(
      createPublishedExample(createDraftExample(`${id}-disabled`, '职场运营综合分析（已禁用）', ownerId)),
      reviewerFor(ownerId), 'disable', changedAt
    ) as ScenarioPackageMutationResult
    if (!disabled.ok || !disabled.package) throw new Error('无法初始化已禁用的场景包示例')
    ownExamples.push(disabled.package)
  }
  return cloneScenarioTestSnapshot([...originalExamples, ...dependencyExamples, ...ownExamples])
}

const sortedRecord = (value: unknown): unknown => Array.isArray(value) ? value.map(sortedRecord)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortedRecord(item)]))
    : value

/** Reconstruct the complete released V1 record; an ID alone never establishes seed provenance. */
function isUnchangedLegacyAuthorSeed(item: ScenarioSkillPackage, defaults: ScenarioSkillPackage[], skills: ScenarioSelectableSkill[]): boolean {
  const specialReview = item.id === 'seed-scenario-review-by-zhangrui' && item.ownerId === 'zhangrui'
  const prefix = `seed-scenario-own-${encodeURIComponent(item.ownerId)}-`
  const state = specialReview ? 'review' : item.id.startsWith(prefix) ? item.id.slice(prefix.length) : ''
  if (!['draft', 'review', 'rejected', 'published', 'disabled'].includes(state)) return false
  const template = defaults.find(record => record.id === `seed-scenario-own-pm-li-${state}`)
  if (!template || item.id === template.id) return false
  const expected = cloneScenarioTestSnapshot(template) as ScenarioSkillPackage
  // This is the historical V1 review identity, not a role inferred from a username.
  const reviewerId = item.ownerId === 'admin' ? 'zhangrui' : 'admin'
  const restoreLegacyIdentity = (record: ScenarioSkillPackage) => {
    // Released V1 seeds predate revision-editor tracking; retain their exact historical shape.
    delete record.revisionEditors
    record.id = item.id
    record.ownerId = item.ownerId
    if (specialReview) record.name = '职场客户协同（待审核）'
    if (record.submittedBy) record.submittedBy = item.ownerId
    if (record.reviewedBy) record.reviewedBy = reviewerId
    record.auditEvents?.forEach(event => { event.actorId = event.type === 'submitted' ? item.ownerId : reviewerId })
    if (record.testReport) {
      record.testReport.testerId = item.ownerId
      record.testReport.fingerprint = getScenarioTestFingerprint(record, skills, record.testReport.request)
      record.testReport.id = `simulation-${record.testReport.createdAt}-${record.testReport.fingerprint.slice(-16)}`
    }
  }
  restoreLegacyIdentity(expected)
  if (expected.publishedSnapshot) restoreLegacyIdentity(expected.publishedSnapshot)
  return JSON.stringify(sortedRecord(item)) === JSON.stringify(sortedRecord(expected))
}

export const useScenarioSkillPackagesStore = defineStore('scenarioSkillPackages', () => {
  const app = useAppStore()
  const skillHub = useSkillHubStore()
  const selectableSkills = computed(() => createSelectableScenarioSkills(skillHub.items))
  const initialSeedCatalog = cloneScenarioTestSnapshot(skillHub.items)
  const initialSeedSkills = createSelectableScenarioSkills(initialSeedCatalog)
  const currentAuthorId = () => scenarioPackageRole({ id: app.user || '', permissions: app.permissions }) === 'pm' ? app.user || '' : ''
  const defaultSeeds = createSeedScenarioPackages(initialSeedSkills, initialSeedCatalog, '')
  const storedPackages = ref<ScenarioSkillPackage[]>(createSeedScenarioPackages(selectableSkills.value, skillHub.items, currentAuthorId()))
  const seededOwners = new Set(['pm-li', ...(currentAuthorId() ? [currentAuthorId()] : [])])
  function migrateLegacyState(state: ScenarioPackageStoredState): ScenarioPackageStoredState {
    if (state.schemaVersion !== 1) return state
    const packages = state.packages.filter(item => !isUnchangedLegacyAuthorSeed(item, defaultSeeds, initialSeedSkills))
    const ids = new Set(packages.map(item => item.id))
    return { schemaVersion: 2, packages: [...packages, ...defaultSeeds.filter(item => !ids.has(item.id))], seededOwners: ['pm-li'] }
  }
  function readLatestState() {
    const state = readScenarioPackageState()
    return state ? migrateLegacyState(state) : null
  }
  let persisted = readScenarioPackageState()
  if (persisted?.schemaVersion === 1) {
    const migrated = migrateLegacyState(persisted)
    try { writeScenarioPackageState(migrated); persisted = migrated }
    catch { /* Preserve the original state if upgrading storage fails; explicit writes still report failure. */ }
  }
  let persistedIds = new Set(persisted?.packages.map(item => item.id) || [])
  if (persisted) {
    const restoredIds = new Set(persisted.packages.map(item => item.id))
    storedPackages.value = [...persisted.packages, ...storedPackages.value.filter(item => !restoredIds.has(item.id))]
    if (persisted.schemaVersion === 2) persisted.seededOwners.forEach(ownerId => seededOwners.add(ownerId))
  }
  // Login can finish after store creation. Add new-account examples once; preserve all existing edits and submissions.
  watch([() => app.user, () => app.permissions], () => {
    const ownerId = currentAuthorId()
    if (!ownerId || seededOwners.has(ownerId)) return
    const existingIds = new Set(storedPackages.value.map(item => item.id))
    storedPackages.value.push(...createSeedScenarioPackages(initialSeedSkills, initialSeedCatalog, ownerId).filter(item => !existingIds.has(item.id)))
    seededOwners.add(ownerId)
  }, { deep: true })

  function clonePackage(packageItem: ScenarioSkillPackage): ScenarioSkillPackage {
    return {
      ...packageItem,
      revisionEditors: packageItem.revisionEditors ? [...packageItem.revisionEditors] : undefined,
      publishedSnapshot: packageItem.publishedSnapshot ? clonePackage(packageItem.publishedSnapshot) : undefined,
      testReport: cloneScenarioTestSnapshot(packageItem.testReport),
      testRequest: cloneScenarioTestSnapshot(packageItem.testRequest),
      steps: packageItem.steps.map((step) => ({
        ...step,
        position: step.position && Number.isFinite(step.position.x) && Number.isFinite(step.position.y)
          ? { x: step.position.x, y: step.position.y }
          : undefined,
        permissions: clonePermissions(step.permissions)
      })),
      health: {
        ...packageItem.health,
        explanations: [...packageItem.health.explanations],
        blockedStepIds: [...packageItem.health.blockedStepIds],
        degradedStepIds: [...packageItem.health.degradedStepIds]
      },
      auditEvents: packageItem.auditEvents?.map((event) => ({ ...event }))
    }
  }

  function refreshStep(step: ScenarioPinnedStep): ScenarioPinnedStep {
    const currentSkill = skillHub.items.find((item) => item.name === step.skillId)
    const isOnline = currentSkill?.onlineStatus === 'published' && currentSkill.online !== '未发布'
    const preservedExpiredState = step.dependencyState === 'expired'

    if (!currentSkill || !isOnline) {
      return {
        ...step,
        dependencyState: preservedExpiredState ? 'expired' : currentSkill?.onlineStatus === 'disabled' ? 'emergency_disabled' : 'unavailable',
        permissions: clonePermissions(step.permissions)
      }
    }

    const currentPublishedVersion = currentSkill.online
    const preservedUnavailableState = ['unavailable', 'emergency_disabled'].includes(step.dependencyState)
      && currentPublishedVersion !== step.pinnedVersion
    return {
      ...step,
      currentPublishedVersion,
      dependencyState: preservedExpiredState || preservedUnavailableState
        ? step.dependencyState
        : currentPublishedVersion === step.pinnedVersion
          ? 'available'
          : 'update_available',
      permissions: clonePermissions(step.permissions)
    }
  }

  function refreshPackage(packageItem: ScenarioSkillPackage): ScenarioSkillPackage {
    const steps = packageItem.steps.map(refreshStep)
    return clonePackage({
      ...packageItem,
      steps,
      publishedSnapshot: packageItem.publishedSnapshot ? refreshPackage(packageItem.publishedSnapshot) : undefined,
      health: evaluatePackageHealth(steps) as ScenarioPackageHealth
    })
  }

  const packages = computed(() => storedPackages.value.map(refreshPackage))

  function nextWriteTime(current?: ScenarioSkillPackage) {
    return new Date(Math.max(Date.now(), (Date.parse(current?.updatedAt || '') || 0) + 1)).toISOString()
  }

  function commitPackages(next: ScenarioSkillPackage[], owners = [...seededOwners]) {
    writeScenarioPackageState({ packages: next, seededOwners: owners })
    storedPackages.value = next
    persistedIds = new Set(next.map(item => item.id))
  }

  function commitPackage(next: ScenarioSkillPackage) {
    const latest = readLatestState()
    let currentPackages = storedPackages.value
    if (latest) {
      const current = currentPackages.find(item => item.id === next.id)
      const saved = latest.packages.find(item => item.id === next.id)
      const latestIds = new Set(latest.packages.map(item => item.id))
      currentPackages = [...latest.packages, ...currentPackages.filter(item => !latestIds.has(item.id) && !persistedIds.has(item.id))]
      if ((saved && saved.updatedAt !== current?.updatedAt) || (!saved && persistedIds.has(next.id))) {
        // Refresh the local view so reopening edits reads the version that actually reached storage.
        storedPackages.value = currentPackages
        persistedIds = latestIds
        throw new Error('场景技能包已在其他页面更新，请重新打开当前版本后操作')
      }
    }
    const packages = currentPackages.some(item => item.id === next.id)
      ? currentPackages.map(item => item.id === next.id ? clonePackage(next) : item)
      : [clonePackage(next), ...currentPackages]
    const owners = [...new Set([...seededOwners, ...(latest?.seededOwners || [])])]
    commitPackages(packages, owners)
    owners.forEach(ownerId => seededOwners.add(ownerId))
  }

  function actionsFor(id: string, actor: ScenarioPackageActor): ScenarioPackageAction[] {
    return scenarioPackageActions(storedPackages.value.find(item => item.id === id), actor) as ScenarioPackageAction[]
  }

  function editableDraft(id: string, actor: ScenarioPackageActor): (ScenarioSkillPackageDraft & { baseUpdatedAt: string }) | null {
    return editableScenarioPackageDraft(findPackage(id), actor) as (ScenarioSkillPackageDraft & { baseUpdatedAt: string }) | null
  }

  function changeLifecycle(id: string, actor: ScenarioPackageActor, action: 'disable' | 'enable' | 'withdraw', expectedUpdatedAt?: string): ScenarioPackageMutationResult {
    const current = storedPackages.value.find(item => item.id === id)
    if (!current) return { ok: false, reasons: ['场景技能包不存在'] }
    if (action === 'withdraw' && (!expectedUpdatedAt || expectedUpdatedAt !== current.updatedAt)) {
      return { ok: false, reasons: ['场景技能包已更新，请重新打开当前版本后撤回'] }
    }
    const result = transitionScenarioPackage(current, actor, action, nextWriteTime(current)) as ScenarioPackageMutationResult
    if (!result.ok || !result.package) return result
    const next = result.package
    try {
      commitPackage(next)
    } catch (error) {
      return { ok: false, reasons: [error instanceof Error ? error.message : '场景技能包保存失败'] }
    }
    return { ok: true, reasons: [], package: clonePackage(next) }
  }

  const disablePackage = (id: string, actor: ScenarioPackageActor) => changeLifecycle(id, actor, 'disable')
  const enablePackage = (id: string, actor: ScenarioPackageActor) => changeLifecycle(id, actor, 'enable')
  const withdrawPackage = (id: string, actor: ScenarioPackageActor, expectedUpdatedAt: string) => changeLifecycle(id, actor, 'withdraw', expectedUpdatedAt)

  function evaluateDraft(draft: ScenarioSkillPackageDraft, actor: ScenarioPackageActor): ScenarioDraftEvaluation {
    const rebuilt = rebuildDraftFromCatalog(draft, selectableSkills.value) as {
      draft: ScenarioSkillPackageDraft
      reasons: string[]
    }
    const eligibilityReasons = rebuilt.reasons
    const resolved = resolveScenarioChain(rebuilt.draft.steps)
    const reconciledDraft = { ...rebuilt.draft, steps: resolved.steps } as ScenarioSkillPackageDraft
    const current = storedPackages.value.find(item => item.id === draft.id)
    const policy = evaluatePackageForPublish(reconciledDraft, actor, current) as ScenarioPackagePolicyEvaluation
    const health = evaluatePackageHealth(reconciledDraft.steps) as ScenarioPackageHealth
    const reasons = [...new Set([
      ...eligibilityReasons,
      ...policy.reasons,
      ...(health.status === 'paused' ? health.explanations : [])
    ])]

    return {
      ok: eligibilityReasons.length === 0 && policy.ok && health.status !== 'paused',
      reasons,
      eligibilityReasons,
      draft: reconciledDraft,
      policy,
      health
    }
  }

  function simulateDraft(draft: ScenarioSkillPackageDraft, request: ScenarioSimulationRequest, actor: ScenarioPackageActor): ScenarioSimulationReport {
    const current = storedPackages.value.find(item => item.id === draft.id)
    return runScenarioSimulation(draft, selectableSkills.value, request, actor, new Date().toISOString(), current)
  }

  function saveDraft(draft: ScenarioSkillPackageDraft, actor: ScenarioPackageActor): ScenarioSkillPackage {
    const current = storedPackages.value.find(item => item.id === draft.id)
    const saved = saveScenarioPackageDraft(draft, actor, nextWriteTime(current), current) as ScenarioSkillPackage
    commitPackage(saved)
    return clonePackage(saved)
  }

  function submitDraft(draft: ScenarioSkillPackageDraft, actor: ScenarioPackageActor): ScenarioSkillPackage {
    const current = storedPackages.value.find(item => item.id === draft.id)
    const submitted = submitScenarioPackage(
      draft,
      actor,
      nextWriteTime(current),
      selectableSkills.value,
      current
    ) as ScenarioSkillPackage
    commitPackage(submitted)
    return clonePackage(submitted)
  }

  function reviewDecision(packageId: string, actor: ScenarioPackageActor): { ok: boolean; reasons: string[] } {
    const current = storedPackages.value.find(item => item.id === packageId)
    return current ? evaluateScenarioPackageReview(current, actor) : { ok: false, reasons: ['场景技能包不存在'] }
  }

  function approvePackage(id: string, actor: ScenarioPackageActor, note = '', expectedUpdatedAt?: string): ScenarioSkillPackage {
    const current = storedPackages.value.find(item => item.id === id)
    if (!current) throw new Error(`场景技能包不存在：${id}`)
    if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== current.updatedAt) throw new Error('场景技能包已更新，请重新打开当前提交版本后审核')
    const published = publishScenarioPackage(current, actor, nextWriteTime(current), selectableSkills.value, note) as ScenarioSkillPackage
    commitPackage(published)
    return clonePackage(published)
  }

  function rejectPackage(id: string, actor: ScenarioPackageActor, reason: string, expectedUpdatedAt?: string): ScenarioSkillPackage {
    const current = storedPackages.value.find(item => item.id === id)
    if (!current) throw new Error(`场景技能包不存在：${id}`)
    if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== current.updatedAt) throw new Error('场景技能包已更新，请重新打开当前提交版本后审核')
    const rejected = rejectScenarioPackage(current, actor, reason, nextWriteTime(current)) as ScenarioSkillPackage
    commitPackage(rejected)
    return clonePackage(rejected)
  }

  function resubmitDraft(draft: ScenarioSkillPackageDraft, actor: ScenarioPackageActor): ScenarioSkillPackage {
    const current = storedPackages.value.find(item => item.id === draft.id)
    if (!current || current.status !== 'rejected') throw new Error('仅已驳回的原场景技能包可以重新提交')
    return submitDraft(draft, actor)
  }

  function findPackage(id: string) {
    const found = storedPackages.value.find((item) => item.id === id)
    return found ? refreshPackage(found) : undefined
  }

  function evaluateRuntimeAccess(
    packageId: string,
    caller: ScenarioPackageActor,
    activeOptionalStepIds: string[] = [],
    requestedSkillIds: string[] = [],
    evidence: { confirmedStepIds?: string[]; approvedStepIds?: string[] } = {}
  ) {
    const packageItem = findPackage(packageId)
    if (!packageItem) throw new Error(`场景技能包不存在：${packageId}`)
    return evaluateScenarioRuntimeAccess(
      packageItem,
      caller,
      activeOptionalStepIds,
      requestedSkillIds,
      evidence
    )
  }

  function resetToInitialMock() {
    const ownerId = currentAuthorId()
    commitPackages(createSeedScenarioPackages(selectableSkills.value, skillHub.items, ownerId), ['pm-li', ...(ownerId ? [ownerId] : [])])
    seededOwners.clear()
    seededOwners.add('pm-li')
    if (ownerId) seededOwners.add(ownerId)
  }

  function prepareRunPlan(
    packageId: string,
    caller: ScenarioPackageActor,
    request: { input?: string; activeOptionalStepIds?: string[]; evidence?: { confirmedStepIds?: string[]; approvedStepIds?: string[] } } = {}
  ) {
    const packageItem = findPackage(packageId)
    if (!packageItem) throw new Error(`场景技能包不存在：${packageId}`)
    return buildScenarioRunPlan(getScenarioRuntimePackage(packageItem), caller, request)
  }

  return {
    packages,
    selectableSkills,
    actionsFor,
    editableDraft,
    withdrawPackage,
    simulateDraft,
    disablePackage,
    enablePackage,
    evaluateDraft,
    saveDraft,
    submitDraft,
    reviewDecision,
    approvePackage,
    rejectPackage,
    resubmitDraft,
    evaluateRuntimeAccess,
    prepareRunPlan,
    findPackage,
    resetToInitialMock
  }
})
