import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  beginCapabilityUpdate,
  completeCapabilityUpdate as completeCapabilityUpdateRecord,
  failCapabilityUpdate as failCapabilityUpdateRecord,
  formatShanghaiMinute,
  getSeedCapabilityUpdate,
  hydrateCapabilityUpdate,
  ignoreCapabilityUpdate as ignoreCapabilityUpdateRecord,
  mergeCapabilityDraft,
  mergeCapabilitySubmission,
  resolveSkillHubAllowedActions,
  retryCapabilityUpdateTask as retryCapabilityUpdateTaskRecord,
  skillHubMutationDecision,
  transitionCapabilityEdit
} from '@/services/skillCapabilityChanges.js'

export type SkillStatus = 'draft' | 'review' | 'approved' | 'published' | 'disabled' | 'rejected'
export type OnlineStatus = 'unpublished' | 'published' | 'disabled'
export type WorkflowStatus = SkillStatus
export type CapabilityUpdateStatus = 'none' | 'available' | 'preparing' | 'processing' | 'processing_with_available' | 'failed' | 'ignored' | 'resolved'
export type CapabilityChangeKind = 'enhancement' | 'breaking' | 'permission'
export type SkillHubActionCode = 'view_change' | 'start_update' | 'ignore_update' | 'continue_update' | 'view_update_error' | 'retry_update' | 'edit' | 'view' | 'evaluate' | 'test' | 'submit_review' | 'withdraw_review' | 'approve' | 'reject' | 'publish' | 'enable' | 'disable' | 'delete'

export interface SkillHubAllowedAction {
  code: SkillHubActionCode
  enabled: boolean
  payload?: Record<string, string>
}

export interface SkillHubActor {
  role: 'admin' | 'pm'
  user: string
}

export interface SkillContextBinding {
  contextId: string
  menuPath: string
  name: string
  version: string
}

export interface SkillAffectedContext {
  contextId: string
  menuPath: string
  name: string
  currentVersion: string
  targetVersion: string
}

export interface SkillOptionalContext {
  contextId: string
  menuPath: string
  name: string
  version: string
  summary: string
}

export interface CapabilityUpdateTask {
  id: string
  kind?: 'initial' | 'additional_change'
  status: 'generating' | 'succeeded' | 'failed'
  startedAt?: string
  completedAt?: string
  error?: string
  phase?: string
  errorCode?: string
  retryAdvice?: string
  rollback?: Record<string, unknown>
}

export interface SkillCapabilityChange {
  id: string
  kind: CapabilityChangeKind
  objectType: 'API' | '字段' | '数据维度' | '操作' | '工具' | '权限点'
  name: string
  before: string
  after: string
  impact: string
}

export interface SkillCapabilityUpdate {
  recordId: string
  flowRevision?: string
  status: CapabilityUpdateStatus
  hasDraftEdits?: boolean
  pendingDecisionCount?: number
  activeUpdateChangeRecordIds?: string[]
  contextId: string
  menuPath: string
  baseMenu: string
  currentContextCodes: string[]
  currentCapabilityVersion: string
  targetCapabilityVersion: string
  detectedAt: string
  summary: string
  count: number
  notificationState: string
  reportMarkdown: string
  technicalDetails: string[]
  affectedContexts: SkillAffectedContext[]
  optionalContexts: SkillOptionalContext[]
  changes: SkillCapabilityChange[]
  pendingUpdate?: Partial<SkillCapabilityUpdate>
  pendingUpdates?: Array<Partial<SkillCapabilityUpdate>>
  activeTaskUpdate?: Partial<SkillCapabilityUpdate>
  task?: CapabilityUpdateTask
  resolution?: {
    action: 'ignored'
    operator: string
    handledAt: string
    reason: string
  }
  history?: SkillCapabilityHistoryRecord[]
}

export interface SkillCapabilityHistoryRecord {
  recordId: string
  currentCapabilityVersion: string
  targetCapabilityVersion: string
  detectedAt: string
  summary: string
  changes: SkillCapabilityChange[]
}

export interface SkillDraftForm {
  name: string
  cnName: string
  menu: string
  scene: string
  input: string
  output: string
}

export interface SkillDraftSnapshot {
  form: SkillDraftForm
  selectedContextCodes: string[]
  contextBindings?: SkillContextBinding[]
  clarifyMessages: unknown[]
  summaryItems: Array<{ label: string; text: string }>
  summaryUpdated: string
  aiTuned: boolean
  evaluationCapabilityVersion?: string
  baselineContextSeeded?: boolean
  savedAt: string
}

export interface SkillPublishedContract {
  version: string
  description: string
  input: string
  output: string
}

export interface SkillHubItem {
  name: string
  cnName: string
  platform: string
  desc: string
  version: string
  editVersion?: string
  editStatus?: SkillStatus
  workflowStatus: WorkflowStatus
  onlineStatus: OnlineStatus
  online: string
  status: SkillStatus
  statusText: string
  category: string
  tags: string[]
  owner: string
  reviewer?: string
  reviewTime?: string
  reviewNote?: string
  updated: string
  submittedAt?: string
  score?: string
  draft?: SkillDraftSnapshot
  publishedContract?: SkillPublishedContract
  capabilityUpdate?: SkillCapabilityUpdate
}

type SkillCreatePayload = {
  name: string
  cnName: string
  desc: string
  category: string
  owner: string
  score: string
  tags?: string[]
  draft?: SkillDraftSnapshot
  actor?: SkillHubActor
}

type SkillDraftPayload = Omit<SkillCreatePayload, 'score'> & {
  draft: SkillDraftSnapshot
}

type SeedSkillHubItem = Omit<SkillHubItem, 'workflowStatus' | 'onlineStatus'>

const defaultItems: SeedSkillHubItem[] = [
  { name: 'capability-update-failure-demo', cnName: '运营查询（更新失败示例）', platform: 'lexiang', desc: '演示数据：查看能力更新失败原因、重试恢复或忽略更新。重试仅生成示例草稿，不查询真实数据，不改变线上版本；刷新可重新体验。', version: 'v1.0.0', online: 'v1.0.0', status: 'published', statusText: '已发布', category: '乐享运营', tags: ['查询', '演示'], owner: 'admin', updated: '2026-09-17 10:00' },
  { name: 'capability-draft-demo', cnName: '运营查询草稿', platform: 'lexiang', desc: '聚合运营查询条件并输出业务标签、异常原因和处理建议。', version: 'v0.1.0', online: '未发布', status: 'draft', statusText: '草稿', category: '乐享运营', tags: ['查询', '草稿'], owner: 'admin', updated: '2026-08-21 09:10' },
  { name: 'operations-insight-draft', cnName: '运营洞察草稿', platform: 'lexiang', desc: '汇总运营指标并生成异常归因建议，当前仍处于草稿编辑阶段。', version: 'v0.2.0', online: '未发布', status: 'draft', statusText: '草稿', category: '乐享运营', tags: ['运营', '草稿'], owner: 'admin', updated: '2026-08-20 16:30' },
  { name: 'workplace-employee-review-analysis', cnName: '职场员工审核数据分析', platform: 'lexiang', desc: '职场员工审核数据分析 Skill，支持认证方式分布、通过率趋势、失败原因和待审核积压分析。', version: 'v1.0.0', online: '未发布', status: 'rejected', statusText: '已驳回', category: '在职员工管理', tags: ['认证', '统计'], owner: 'admin', reviewer: 'admin', reviewTime: '2026-06-10 14:20', reviewNote: '驳回：请补充业务边界、测试用例或审批材料后重新提交。', updated: '2026-06-10 14:20' },
  { name: 'low-stock-auto-offline', cnName: '低库存自动下架', platform: 'lexiang', desc: '低库存自动下架 Skill，根据库存阈值和活动排除条件生成下架建议。', version: 'v0.3.0', online: '未发布', status: 'review', statusText: '待审批', category: '乐享运营', tags: ['库存', '商品'], owner: 'admin', updated: '2026-06-10 11:36', submittedAt: '2026-06-10 11:36', score: '0.782' },
  { name: 'product-knowledge', cnName: '产品知识问答', platform: 'lexiang', desc: '识别用户产品知识查询需求，返回配置参数、性能差异和可选机型说明。', version: 'v1.0.7', online: 'v1.0.7', status: 'published', statusText: '已发布', category: '乐享运营', tags: ['查询', '商品', '+2'], owner: 'product-pm', updated: '2026-06-06 18:42' },
  { name: 'voucher-recommend', cnName: '券包权益推荐', platform: 'lexiang', desc: '识别虚拟品充值、会员充值和券包权益推荐需求，输出推荐卡片。', version: 'v0.1.3', online: 'v0.1.3', status: 'published', statusText: '已发布', category: '乐享运营', tags: ['权益', '推荐'], owner: 'growth-pm', updated: '2026-06-06 12:13' },
  { name: 'driver-download-guide', cnName: '驱动下载指导', platform: 'lexiang', desc: '联想驱动下载指导 Skill，支持驱动查询、版本差异对比和安装说明生成。', version: 'v1.0.0', online: '未发布', status: 'review', statusText: '待审批', category: '乐享运营', tags: ['下载', '驱动'], owner: 'service-pm', updated: '2026-06-05 16:45', submittedAt: '2026-06-05 16:45', score: '0.801' },
  { name: 'lenovo-order-detail-query', cnName: '订单明细查询', platform: 'lexiang,aiadmin', desc: '联想商城订单明细查询助手，支持自然语言查询订单状态和售后发货信息。', version: 'v1.0.0', online: '未发布', status: 'approved', statusText: '已审批', category: '乐享运营', tags: ['订单'], owner: 'ops-pm', updated: '2026-06-02 17:15' },
  { name: 'customer-profile-export', cnName: '客户画像导出', platform: 'lexiang', desc: '根据授权范围生成企业客户画像与跟进摘要，已审批待发布。', version: 'v1.1.0', online: '未发布', status: 'approved', statusText: '已审批', category: '企业客户管理', tags: ['客户', '画像'], owner: 'admin', reviewer: 'admin', reviewTime: '2026-08-20 15:20', reviewNote: '审批通过：可进入发布流程。', updated: '2026-08-20 15:20' },
  { name: 'gmv-daily-summary', cnName: 'GMV 日报汇总', platform: 'lexiang', desc: '汇总每日 GMV、订单量和渠道贡献，生成标准运营日报。', version: 'v1.2.0', online: 'v1.2.0', status: 'published', statusText: '已发布', category: '乐享运营', tags: ['GMV', '日报'], owner: 'admin', updated: '2026-08-20 14:10' },
  { name: 'weather-query', cnName: '实时天气查询', platform: 'lexiang', desc: '根据用户指定地点查询实时天气数据，支持默认城市和运营活动场景。', version: 'v1.0.0', online: 'v1.0.0', status: 'disabled', statusText: '已禁用', category: '乐享运营', tags: ['工具'], owner: 'admin', updated: '2026-06-02 11:16' },
  { name: 'legacy-inventory-alert', cnName: '旧版库存预警', platform: 'lexiang', desc: '按历史库存阈值生成预警清单，当前已禁用并暂停参与任务匹配。', version: 'v0.9.0', online: 'v0.9.0', status: 'disabled', statusText: '已禁用', category: '乐享运营', tags: ['库存', '预警'], owner: 'admin', updated: '2026-08-20 13:40' },
  { name: 'employee-certification-insight', cnName: '职场认证状态查询', platform: 'lexiang', desc: '输入职场员工的认证筛选条件，输出认证状态、待处理原因和可跟进名单。', version: 'v1.0.0', online: 'v1.0.0', status: 'published', statusText: '已发布', category: '在职员工管理', tags: ['认证', '查询'], owner: 'admin', updated: '2026-09-04 10:00' },
  { name: 'workplace-segment-operations', cnName: '职场人群经营分析', platform: 'lexiang', desc: '输入认证人群范围与经营时间，输出人群规模、转化表现和运营建议。', version: 'v1.2.0', online: 'v1.2.0', status: 'published', statusText: '已发布', category: '乐享运营', tags: ['人群', '经营'], owner: 'admin', updated: '2026-09-04 10:00' },
  { name: 'enterprise-customer-followup', cnName: '企业客户跟进建议', platform: 'lexiang', desc: '输入企业客户及跟进目标，输出下一步跟进建议、重点事项和沟通要点。', version: 'v1.0.0', online: 'v1.0.0', status: 'published', statusText: '已发布', category: '企业客户管理', tags: ['企业客户', '跟进'], owner: 'admin', updated: '2026-09-04 10:00' }
]

export function skillHubStatusLabel(status: SkillStatus) {
  return {
    draft: '草稿',
    review: '待审批',
    approved: '已审批待发布',
    published: '已发布',
    disabled: '已禁用',
    rejected: '已驳回'
  }[status]
}

function nowMinute() {
  return formatShanghaiMinute(new Date())
}

function capturePublishedContract(item: SkillHubItem): SkillPublishedContract {
  return {
    version: item.online,
    description: typeof item.desc === 'string' ? item.desc : '',
    input: typeof item.draft?.form?.input === 'string' ? item.draft.form.input : '',
    output: typeof item.draft?.form?.output === 'string' ? item.draft.form.output : ''
  }
}

function cloneDefaultItems() {
  return defaultItems.map(item => hydrateItem({ ...item, tags: [...item.tags] }))
}

function hydrateItem(item: SeedSkillHubItem | SkillHubItem): SkillHubItem {
  const seededUpdate = getSeedCapabilityUpdate(item.name) as SkillCapabilityUpdate | undefined
  const { capabilityUpdate, draft, status, editStatus, workflowStatus, onlineStatus } = hydrateCapabilityUpdate(item, seededUpdate)
  return {
    ...item,
    status,
    statusText: skillHubStatusLabel(status),
    editStatus,
    workflowStatus,
    onlineStatus,
    tags: Array.isArray(item.tags) ? item.tags : [],
    draft,
    capabilityUpdate
  }
}

function loadItems() {
  return cloneDefaultItems()
}

export const useSkillHubStore = defineStore('skillHub', () => {
  const items = ref<SkillHubItem[]>(loadItems())

  function persist() {
    // POC changes stay in memory so a full refresh restores the seeded demo.
  }

  function resetToInitialMock() {
    items.value = cloneDefaultItems()
  }

  function upsertSubmittedSkill(payload: SkillCreatePayload) {
    const updated = nowMinute()
    const name = payload.name.trim()
    const nextItem: SkillHubItem = {
      name,
      cnName: payload.cnName.trim(),
      platform: 'lexiang',
      desc: payload.desc.trim() || `${payload.cnName || name} Skill，已从 Skill 创建流程提交审核。`,
      version: 'v1.0.0',
      online: '未发布',
      onlineStatus: 'unpublished',
      status: 'review',
      workflowStatus: 'review',
      statusText: skillHubStatusLabel('review'),
      category: payload.category || '未分类',
      tags: payload.tags?.length ? payload.tags : ['待审批'],
      owner: payload.owner || 'admin',
      updated,
      submittedAt: updated,
      score: payload.score,
      draft: payload.draft,
      reviewer: undefined,
      reviewTime: undefined,
      reviewNote: `提交审核：综合评分 ${payload.score}，等待管理员审批。`
    }
    const index = items.value.findIndex(item => item.name === name)
    const current = index >= 0 ? items.value[index] : undefined
    const decision = skillHubMutationDecision(current, payload.actor || payload.owner, 'submit_review', Number(payload.score || 0))
    if (!decision.allowed) throw new Error(decision.reason)
    let submittedItem = nextItem
    if (index >= 0) {
      const existing = current as SkillHubItem
      nextItem.owner = existing.owner
      const isCapabilityUpdate = existing.capabilityUpdate?.status === 'processing' && existing.online !== '未发布'
      submittedItem = isCapabilityUpdate
        ? mergeCapabilitySubmission(existing, nextItem, updated)
        : { ...existing, ...nextItem }
      items.value.splice(index, 1)
    }
    items.value.unshift(submittedItem)
    persist()
    return items.value[0]
  }

  function upsertDraftSkill(payload: SkillDraftPayload) {
    const updated = nowMinute()
    const name = payload.name.trim()
    const nextItem: SkillHubItem = {
      name,
      cnName: payload.cnName.trim(),
      platform: 'lexiang',
      desc: payload.desc.trim() || `${payload.cnName || name} Skill 草稿，可返回需求澄清继续编辑。`,
      version: 'v0.1.0',
      online: '未发布',
      onlineStatus: 'unpublished',
      status: 'draft',
      workflowStatus: 'draft',
      statusText: skillHubStatusLabel('draft'),
      category: payload.category || '未分类',
      tags: payload.tags?.length ? payload.tags : ['草稿'],
      owner: payload.owner || 'admin',
      updated,
      draft: payload.draft,
      submittedAt: undefined,
      score: undefined,
      reviewer: undefined,
      reviewTime: undefined,
      reviewNote: '草稿已保存：可从 Skill Hub 返回需求澄清阶段继续编辑。'
    }
    const index = items.value.findIndex(item => item.name === name)
    const current = index >= 0 ? items.value[index] : undefined
    const decision = skillHubMutationDecision(current, payload.actor || payload.owner, 'edit')
    if (!decision.allowed) throw new Error(decision.reason)
    if (index >= 0) {
      const existing = current as SkillHubItem
      nextItem.owner = existing.owner
      const isCapabilityUpdate = existing.capabilityUpdate?.status === 'processing' && existing.online !== '未发布'
      items.value[index] = isCapabilityUpdate
        ? mergeCapabilityDraft(existing, nextItem, payload.draft, updated)
        : { ...existing, ...nextItem }
    } else {
      items.value.unshift(nextItem)
    }
    persist()
    return nextItem
  }

  function findSkill(name: string) {
    return items.value.find(item => item.name === name)
  }

  function startCapabilityUpdate(name: string) {
    const target = findSkill(name)
    if (!target?.capabilityUpdate || target.capabilityUpdate.status === 'resolved') return target
    const index = items.value.findIndex(item => item.name === name)
    items.value[index] = beginCapabilityUpdate(target, nowMinute())
    persist()
    return items.value[index]
  }

  function completeCapabilityUpdate(name: string, draft: SkillDraftSnapshot) {
    const index = items.value.findIndex(item => item.name === name)
    if (index < 0) return
    items.value[index] = completeCapabilityUpdateRecord(items.value[index], draft, nowMinute())
    persist()
    return items.value[index]
  }

  function failCapabilityUpdate(name: string, error: string) {
    const index = items.value.findIndex(item => item.name === name)
    if (index < 0) return
    items.value[index] = failCapabilityUpdateRecord(items.value[index], error, nowMinute())
    persist()
    return items.value[index]
  }

  function retryCapabilityUpdateTask(name: string) {
    const index = items.value.findIndex(item => item.name === name)
    if (index < 0) return
    items.value[index] = retryCapabilityUpdateTaskRecord(items.value[index], nowMinute())
    persist()
    return items.value[index]
  }

  function ignoreCapabilityUpdate(name: string, operator: string, reason = '') {
    const index = items.value.findIndex(item => item.name === name)
    if (index < 0) return
    items.value[index] = ignoreCapabilityUpdateRecord(items.value[index], { operator, reason }, nowMinute())
    persist()
    return items.value[index]
  }

  function updateCapabilityEditStatus(item: SkillHubItem, status: 'draft' | 'approved' | 'rejected' | 'published', reviewer = 'admin') {
    const index = items.value.findIndex(row => row.name === item.name)
    if (index < 0) return
    const current = items.value[index]
    const next = transitionCapabilityEdit(current, status, reviewer, nowMinute())
    if (status === 'published' && current.capabilityUpdate?.status === 'processing'
      && current.editStatus === 'approved' && next.capabilityUpdate?.status === 'resolved') {
      next.publishedContract = capturePublishedContract(next)
    }
    items.value[index] = next
    persist()
  }

  function allowedActionsFor(item: SkillHubItem, actor: SkillHubActor) {
    return resolveSkillHubAllowedActions(item, actor) as SkillHubAllowedAction[]
  }

  function removeSkill(name: string) {
    const index = items.value.findIndex(item => item.name === name)
    if (index < 0) return false
    items.value.splice(index, 1)
    persist()
    return true
  }

  function updateStatus(item: SkillHubItem, status: SkillStatus, reviewer = 'admin') {
    const target = items.value.find(row => row.name === item.name)
    if (!target) return
    // Enabling an existing online version must never capture a newer editing draft.
    const isInitialPublication = status === 'published' && target.workflowStatus === 'approved'
      && (!target.online || target.online === '未发布')
    const updated = nowMinute()
    target.status = status
    target.workflowStatus = status
    target.statusText = skillHubStatusLabel(status)
    target.updated = updated
    if (status === 'draft') {
      target.submittedAt = undefined
      target.reviewer = undefined
      target.reviewTime = undefined
      target.reviewNote = '已撤回为草稿，可继续编辑、评估并重新提交。'
    }
    if (status === 'review') {
      target.submittedAt = updated
      target.reviewer = undefined
      target.reviewTime = undefined
      target.reviewNote = `提交审核：综合评分 ${target.score || '-'}，等待管理员审批。`
    }
    if (status === 'approved') {
      target.reviewer = reviewer
      target.reviewTime = updated
      target.reviewNote = '审批通过：可进入发布或上传流程。'
    }
    if (status === 'rejected') {
      target.reviewer = reviewer
      target.reviewTime = updated
      target.reviewNote = '驳回：请补充业务边界、测试用例或审批材料后重新提交。'
    }
    if (status === 'published') {
      target.online = target.online && target.online !== '未发布' ? target.online : target.version
      target.onlineStatus = 'published'
      if (isInitialPublication) target.publishedContract = capturePublishedContract(target)
      target.reviewNote = '已发布：当前版本可被工作台调用。'
    }
    if (status === 'disabled') {
      target.onlineStatus = 'disabled'
      target.reviewNote = '已禁用：暂停参与任务匹配。'
    }
    persist()
  }

  return {
    items,
    findSkill,
    startCapabilityUpdate,
    completeCapabilityUpdate,
    failCapabilityUpdate,
    retryCapabilityUpdateTask,
    ignoreCapabilityUpdate,
    updateCapabilityEditStatus,
    allowedActionsFor,
    resetToInitialMock,
    removeSkill,
    upsertDraftSkill,
    upsertSubmittedSkill,
    updateStatus
  }
})
