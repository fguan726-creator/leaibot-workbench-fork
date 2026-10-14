/**
 * AI 面板状态管理
 * 由封板工作台 AI 运行时迁移到 Pinia 的面板状态与核心函数
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getGroupLabel, getPageLabel, pageIdToPath, useAppStore, type SkillApplicationReportData } from '@/stores/app'
import { useScenarioSkillPackagesStore } from '@/stores/scenarioSkillPackages'
import { STORAGE_KEYS, writeBooleanStorage } from '@/constants/storageKeys'
import { createEmployeeCertificationReport } from '@/services/skillApplicationReport'
import { applyTaskDecision, expireTask, updateTaskRequest, type AiTaskBlock, type TaskDecision, type TaskRequest } from '@/stores/aiTaskAuthorization'

type AnyRecord = Record<string, unknown>
type ShortcutLabel = '今日指标' | '查数据' | '商品管理' | '知识库' | 'CMS' | '运营建议'
type MessageRole = 'user' | 'assistant'
type ConversationActivityKind = 'thinking' | 'tool_call' | 'tool_result' | 'follow_up' | 'confirm' | 'streaming' | 'error'
type ConversationActivityStatus = 'pending' | 'running' | 'done' | 'failed' | 'blocked'

interface AttachedFile {
  name: string
  text?: string
  type?: string
  dataUrl?: string
  isImage?: boolean
}

interface TaskAction {
  type: 'report' | 'navigate' | 'skill' | 'prompt' | 'auth_approve' | 'auth_batch_approve' | 'auth_reject' | 'auth_task_decide' | 'skill_tune_confirm' | 'scenario_application_confirm' | 'scenario_application_cancel'
  label: string
  value?: string
  decision?: TaskDecision
}

interface AiMessage {
  id?: string
  role: MessageRole
  text: string
  at: string
  renderMode?: 'typewriter'
  demoReportQuery?: boolean
  demoReportEntry?: boolean
  artifacts?: string[]
  actionItems?: TaskAction[]
  activityItems?: ConversationActivityItem[]
  todoList?: TodoListBlock
  authRequest?: AuthRequestBlock
  authResult?: AuthResultBlock
  task?: AiTaskBlock
}

interface ConversationActivityItem {
  id: string
  kind: ConversationActivityKind
  status: ConversationActivityStatus
  title: string
  detail?: string
}

interface TodoListBlock {
  title: string
  done: number
  total: number
  items: Array<{
    id: string
    text: string
    status: 'done' | 'running' | 'pending'
  }>
}

interface AuthRequestBlock {
  kind?: TaskRequest['kind']
  taskTitle?: string
  title: string
  namespace: string
  command: string
  risk: string
  detail: string
  summary?: string
  scope?: string
  impact?: string
  steps?: string[]
  approveHint?: string
  approveLabel: string
  batchApproveLabel?: string
  rejectLabel: string
}

interface AuthResultBlock {
  status: 'approved' | 'rejected'
  title: string
  detail: string
}

interface ReportArtifact {
  id: string
  conversationId?: string
  messageId?: string
  title: string
  sourcePage: string
  sourcePageLabel: string
  groupLabel: string
  summary: string
  chips: string[]
  content?: string
  previewHtml?: string
  reportData?: SkillApplicationReportData
  createdAt: string
}

interface ComposerPayload {
  pageId: string
  text: string
  userMsg: string
  apiMessage: string
  fileName: string
  shortcut: string
  contextSummary: string
}

const HARNESS_CHAT_ENDPOINT = '/api/harness/chat'

interface QueuedPayload extends ComposerPayload {
  context: AiRuntimeContext
  queueId: string
}

interface ConversationItem {
  id: string
  remoteConvId: string | null
  title: string
  messages: AiMessage[]
  reports?: ReportArtifact[]
  updatedAt: string
}

interface TaskLog {
  id: string
  type: string
  title: string
  pageId: string
  pageLabel: string
  at: string
  status: string
}

interface AppStoreBridge {
  sidebarCollapsed?: boolean
  setSidebarCollapsed?: (value: boolean, options?: { persist?: boolean }) => void
  openTempTab?: (payload: ReportArtifact) => unknown
  ensureStaticTab?: (pageId: string) => void
  setActiveStaticTab?: (pageId: string) => void
}

interface RouterBridge {
  push: (path: string) => unknown
}

interface AiRuntimeContext {
  router?: RouterBridge
  appStore?: AppStoreBridge
}

interface QueryableSkillAuthScenario {
  pageId: string
  skillLabel: string
  groupLabel: string
  aliases: RegExp[]
  summary: string
  scope: string
  steps: string[]
  resultTitle: string
  resultBullets: string[]
}

interface PendingQueryableSkillAuth {
  key: string
  conversationId: string
  payload: ComposerPayload
  scenario: QueryableSkillAuthScenario
  context: AiRuntimeContext
}

interface PendingScenarioApplication {
  packageId: string
  conversationId: string
  scope: string
  messageId: string
  expiresAt: number
}

type ScenarioApplicationPreview = ReturnType<ReturnType<typeof useScenarioSkillPackagesStore>['applicationPreview']>

export const AI_PANEL_DEFAULT_WIDTH             = 380
export const AI_PANEL_COLLAPSED_NAV_EXTRA_WIDTH = 112
const AI_CONVERSATION_STORAGE_KEY        = 'leai_ai_conversations'
const AI_PREVIEW_RESPONSE_DELAY_MS       = import.meta.env.DEV ? 3600 : 0

// 全局 report artifacts 缓存（对应原 AI_REPORT_ARTIFACTS 对象）
export const AI_REPORT_ARTIFACTS: Record<string, ReportArtifact> = {}

const QUERY_ACTION_PATTERN = /查|查询|查看|看一下|分析|汇总|统计|总结|解读|报告|数据|趋势|明细|情况|分布|转化|指标|近\s*(?:\d+|一|二|两|三|四|五|六|七|八|九|十)|上周|本周|今天|今日|昨天|最近/i

const QUERYABLE_SKILL_AUTH_SCENARIOS: QueryableSkillAuthScenario[] = [
  {
    pageId: 'portal.home', skillLabel: '门户工作台首页指标查询', groupLabel: '联想门户工作台',
    aliases: [/当前页面|门户工作台|首页|今日指标|核心指标|异常项|下一步动作|运营指标/i],
    summary: '读取门户工作台首页的今日核心运营指标、异常项和待确认动作，生成只读分析结果。',
    scope: '联想门户工作台首页，仅限本次请求的示例数据。',
    steps: ['读取首页今日核心指标和页面上下文', '识别异常项、影响范围和需要确认的动作', '生成结论、数据摘要和可展开报告卡片'],
    resultTitle: '门户工作台首页指标查询结果',
    resultBullets: ['结果会围绕今日核心指标、异常项和优先动作展开。', '默认只读取当前 POC mock 数据，不修改任何运营配置。', '如后续涉及导出、发布或配置调整，会再次请求授权。']
  },
  {
    pageId: 'dashboard.overview', skillLabel: '运营总览查询', groupLabel: '乐享运营',
    aliases: [/运营总览|运营概览|今日指标|dau|wau|mau|gmv|活跃|经营数据|转化链路/i],
    summary: '读取运营总览核心指标、经营链路和趋势数据，生成只读分析结果。',
    scope: '乐享运营 / 运营总览，仅限本次请求的示例数据。',
    steps: ['读取 DAU、WAU、MAU、GMV 等核心指标', '汇总登录、互动、购买和成交链路', '生成结论、异常提示和可展开报告'],
    resultTitle: '运营总览查询结果',
    resultBullets: ['核心链路会按登录、互动、购买和成交拆解。', '默认只读取看板数据，不改动运营配置。', '如后续涉及导出或发布，会再次请求确认。']
  },
  {
    pageId: 'pipeline.annotate', skillLabel: 'Query 分析查询', groupLabel: '乐享运营',
    aliases: [/query|查询分析|无答案|问答|关键词|query\s*质量/i],
    summary: '读取 Query 明细、无答案样本和知识命中情况，生成查询质量分析。',
    scope: '乐享运营 / Query 分析，仅限本次请求的示例数据。',
    steps: ['读取 Query 聚合和无答案样本', '识别高频问题与知识缺口', '生成补充建议和报告卡片'],
    resultTitle: 'Query 分析查询结果',
    resultBullets: ['结果会聚焦 Query 规模、无答案率和高频缺口。', '只读查询不会修改知识库或发布内容。', '补充知识、发布或导出前会再次确认。']
  },
  {
    pageId: 'pipeline.quality', skillLabel: '质量分析查询', groupLabel: '乐享运营',
    aliases: [/质量分析|服务质量|点踩|badcase|满意度|性能|对话质量/i],
    summary: '读取质量、点踩、性能和对话体验数据，生成质量复盘。',
    scope: '乐享运营 / 质量分析，仅限本次请求的示例数据。',
    steps: ['读取点踩、满意度和性能指标', '定位主要 Badcase 类型', '生成质量结论和优先级建议'],
    resultTitle: '质量分析查询结果',
    resultBullets: ['结果会围绕点踩率、低满意度和 Badcase 类型展开。', '仅分析质量数据，不调整线上策略。', '涉及策略或发布改动时会再次确认。']
  },
  {
    pageId: 'ops.traffic', skillLabel: '流量分析查询', groupLabel: '乐享运营',
    aliases: [/流量分析|入口|访问|流量|渠道|入口质量/i],
    summary: '读取入口流量、访问趋势和渠道表现，生成流量分析。',
    scope: '乐享运营 / 流量分析，仅限本次请求的示例数据。',
    steps: ['读取入口访问和渠道数据', '对比关键入口变化', '生成流量结论和优化建议'],
    resultTitle: '流量分析查询结果',
    resultBullets: ['结果会按入口、渠道和访问质量拆解。', '只读查询不会调整入口配置。', '如需要配置或发布，会单独授权。']
  },
  {
    pageId: 'ops.gmv', skillLabel: 'GMV 分析查询', groupLabel: '乐享运营',
    aliases: [/gmv|成交|客单价|购买转化|爆款商品|热销商品|订单/i],
    summary: '读取 GMV、订单、客单价和商品转化数据，生成交易分析。',
    scope: '乐享运营 / GMV 分析，仅限本次请求的示例数据。',
    steps: ['读取 GMV、购买人数和客单价', '识别转化变化与爆款商品', '生成交易结论和可展开报告'],
    resultTitle: 'GMV 分析查询结果',
    resultBullets: ['结果会突出 GMV、购买转化和商品贡献。', '默认只读取交易统计数据。', '后续导出或运营配置需再次确认。']
  },
  {
    pageId: 'dashboard.geo', skillLabel: 'GEO 看板查询', groupLabel: 'GEO 看板',
    aliases: [/g\s*e\s*o|geo\s*看板|整体数据概览|信源|意图|转化看板|手工上传知识|转化/i],
    summary: '读取 GEO 看板、信源、意图和转化数据，生成只读分析结果。',
    scope: 'GEO 看板及其子菜单，仅限本次请求的示例数据。',
    steps: ['识别当前 GEO 查询维度和时间范围', '读取信源、意图、引用或转化数据', '生成结论、明细摘要和报告卡片'],
    resultTitle: 'GEO 查询结果',
    resultBullets: ['结果会按 GEO 监控数据、信源质量和转化表现组织。', '只读查询不会修改 GEO 配置或知识内容。', '如需要上传知识、发布或导出，会再次请求授权。']
  },
  {
    pageId: 'employee.overview', skillLabel: '职场员工数据查询', groupLabel: '在职员工管理',
    aliases: [/职场员工|员工概览|认证数据|人群画像|认证方式|在职员工|购买转化|爆款商品/i],
    summary: '读取职场员工、认证方式、人群画像、购买转化和 GMV 数据，生成认证分析。',
    scope: '在职员工管理 / 职场员工概览，仅限本次请求的示例数据。',
    steps: ['解析用户输入的时间范围', '读取认证、画像、购买转化和 GMV 数据', '生成结论、明细和可视化报告'],
    resultTitle: '职场员工认证查询结果',
    resultBullets: ['结果会按认证规模、用户画像、购买转化和商品贡献展开。', '只读查询不会修改认证状态。', '修改状态、导出或配置变更需要再次确认。']
  },
  {
    pageId: 'employee.certification', skillLabel: '认证审核数据查询', groupLabel: '在职员工管理',
    aliases: [/认证审核|认证失败|认证成功|待审核|已失效|修改状态|审核数据/i],
    summary: '读取认证审核列表、失败原因和待审核数据，生成审核分析。',
    scope: '在职员工管理 / 职场员工审核，仅限本次请求的示例数据。',
    steps: ['读取认证审核状态分布', '分析失败原因和待处理样本', '生成审核结论和后续动作建议'],
    resultTitle: '认证审核查询结果',
    resultBullets: ['结果会聚焦失败、成功、待审核和已失效状态。', '默认只读，不修改认证状态。', '修改状态前会再次请求授权。']
  },
  {
    pageId: 'lead.dashboard', skillLabel: '线索看板查询', groupLabel: '企业客户管理',
    aliases: [/线索看板|销售线索|转商机|线索趋势|企业客户/i],
    summary: '读取线索看板、来源、阶段和转化数据，生成线索分析。',
    scope: '企业客户管理 / 线索看板，仅限本次请求的示例数据。',
    steps: ['读取线索规模、来源和阶段数据', '分析线索转化和跟进优先级', '生成线索结论和报告卡片'],
    resultTitle: '线索看板查询结果',
    resultBullets: ['结果会围绕线索规模、来源结构和转化效率。', '只读查询不会更改线索归属。', '转派、导出或规则配置需再次确认。']
  },
  {
    pageId: 'lead.pool', skillLabel: '线索池查询', groupLabel: '企业客户管理',
    aliases: [/线索池|线索明细|公海|待跟进|导出线索/i],
    summary: '读取线索池明细、待跟进状态和筛选结果，生成线索池分析。',
    scope: '企业客户管理 / 线索池，仅限本次请求的示例数据。',
    steps: ['读取线索池筛选和明细数据', '识别待跟进和高价值线索', '生成结论、明细摘要和报告卡片'],
    resultTitle: '线索池查询结果',
    resultBullets: ['结果会突出待跟进、高价值和异常线索。', '只读查询不会领取、转派或导出线索。', '执行领取、导出或分配前会再次确认。']
  },
  {
    pageId: 'lead.score', skillLabel: '打分模型查询', groupLabel: '企业客户管理',
    aliases: [/打分模型|评分规则|线索评分|加分|减分|规则命中/i],
    summary: '读取打分模型、规则命中和分值分布，生成评分分析。',
    scope: '企业客户管理 / 打分模型，仅限本次请求的示例数据。',
    steps: ['读取当前评分规则和命中数据', '分析加分、减分和优先级分布', '生成评分结论和优化建议'],
    resultTitle: '打分模型查询结果',
    resultBullets: ['结果会围绕规则命中、分值分布和优先级排序。', '只读查询不会改动规则。', '调整规则前会再次请求授权。']
  }
]

export const useAIStore = defineStore('ai', () => {
  // ---- 面板开关（对应 STATE.aiOpen）----
  const open        = ref(false)
  // ---- 当前会话（对应 STATE.aiConvId / aiLocalConvId / aiLocalMessages）----
  const convId      = ref<string | null>(null)       // 后端 conv_id
  const localConvId = ref(_newLocalId())
  const messages    = ref<AiMessage[]>([])         // [{ role, text, at }]
  // ---- 发送状态 ----
  const loading     = ref(false)
  const queuedMessages = ref<QueuedPayload[]>([])
  const queueNotice = ref('')
  const taskLogs = ref<TaskLog[]>([])
  const activityItems = ref<ConversationActivityItem[]>([])
  const skillTuneConfirmation = ref({ key: '', confirmedAt: 0 })
  const pendingQueryableSkillAuth = new Map<string, PendingQueryableSkillAuth>()
  const previewAuthorizationTasks = new Set<string>()
  // Confirmation tickets live only in this store instance, never in conversation history.
  const pendingScenarioApplications = new Map<string, PendingScenarioApplication>()
  const applicationAccount = useAppStore()
  watch(() => JSON.stringify([applicationAccount.user, applicationAccount.permissions]), () => {
    if (_expireScenarioApplications('账号或权限已变化，请重新应用技能包。')) _persistConversation()
  }, { flush: 'sync' })
  // ---- 面板宽度（内联 style 用）----
  const panelWidth  = ref(AI_PANEL_DEFAULT_WIDTH) // 0 表示用 CSS 默认
  // ---- 是否因 AI 面板展开而自动折叠了侧栏 ----
  const autoCollapsedSidebar = ref(false)
  // ---- 输入框内容 ----
  const inputText   = ref('')
  // ---- 上传的文件 ----
  const attachedFiles = ref<AttachedFile[]>([])
  const attachedFile = computed(() => attachedFiles.value[0] || null)
  // ---- 当前选中的快捷标签 ----
  const activeShortcut = ref('')
  const pendingShortcut = ref('')
  // ---- 快捷标签列表 ----
  const shortcuts = ref<ShortcutLabel[]>(['今日指标', '查数据', '商品管理', '知识库', 'CMS', '运营建议'])
  const shortcutQueries: Record<ShortcutLabel, string> = {
    '今日指标': '查看当前页面的今日核心指标，先给出异常项和需要我确认的下一步动作。',
    '查数据': '基于当前页面查询关键数据，请先说明查询口径、时间范围和可用筛选项。',
    '商品管理': '进入商品管理任务模式，请先确认要配置的商品范围、影响页面和发布前确认步骤。',
    '知识库': '查询知识库并整理相关条目，请按命中内容、缺口和补充建议输出。',
    'CMS': '进入 CMS 配置任务模式，请先确认配置对象、上线范围、回滚方式和审批风险。',
    '运营建议': '基于当前页面数据给出运营建议，请按问题、证据、建议动作和风险确认输出。'
  }

  let activeAbortController: AbortController | null = null
  let stopRequested = false
  let queueSeq = 0

  // ---- 输入框 placeholder ----
  const inputPlaceholder = computed(() => '描述你要查询、生成或配置的任务...')

  // ===== toggleOpen（对应原 toggleAI）=====
  function toggleOpen(forceState?: boolean) {
    const next = typeof forceState === 'boolean' ? forceState : !open.value
    open.value = next

    if (!next) {
      panelWidth.value = AI_PANEL_DEFAULT_WIDTH
      autoCollapsedSidebar.value = false
    }

    writeBooleanStorage(STORAGE_KEYS.aiOpen, next)
  }

  // ===== 恢复 AI 状态（对应原 restoreAIState）=====
  function restoreState() {
    // 每次完整打开工作台都从收起态开始；同一会话内仍保留用户手动展开/收起结果。
    toggleOpen(false)
  }

  // ===== 计算面板最大宽度（对应 aiPanelMaxWidth）=====
  function maxPanelWidth(viewportWidth = window.innerWidth) {
    return Math.max(
      AI_PANEL_DEFAULT_WIDTH,
      Math.min(AI_PANEL_DEFAULT_WIDTH + AI_PANEL_COLLAPSED_NAV_EXTRA_WIDTH, viewportWidth - 320)
    )
  }

  // ===== 设置面板宽度（对应 aiSetPanelWidth）=====
  function setPanelWidth(width: number, appStore?: AppStoreBridge, viewportWidth = window.innerWidth) {
    const maxW  = maxPanelWidth(viewportWidth)
    const nextW = Math.min(Math.max(width, AI_PANEL_DEFAULT_WIDTH), maxW)
    panelWidth.value = nextW

    const atMax = nextW >= maxW - 1
    const canAutoCollapse = viewportWidth <= 1320
    if (atMax && canAutoCollapse && appStore?.setSidebarCollapsed && !appStore.sidebarCollapsed) {
      appStore.setSidebarCollapsed(true, { persist: false })
      autoCollapsedSidebar.value = true
    } else if ((!atMax || !canAutoCollapse) && autoCollapsedSidebar.value && appStore?.setSidebarCollapsed) {
      appStore.setSidebarCollapsed(false, { persist: false })
      autoCollapsedSidebar.value = false
    }
    return nextW
  }

  // ===== 新建会话（对应 newAiConversation）=====
  function newConversation(skipPersist = false) {
    _expireCurrentAuthorizationTasks()
    if (!skipPersist) _persistConversation()
    if (loading.value) stopCurrentResponse()
    convId.value      = null
    localConvId.value = _newLocalId()
    messages.value    = []
    inputText.value   = ''
    attachedFiles.value = []
    queuedMessages.value = []
    queueNotice.value = ''
    activityItems.value = []
  }

  // ===== 发送消息（对应 aiSend：发送 / 排队 / 停止三态）=====
  async function send(pageId: string, context: AiRuntimeContext = {}) {
    const payload = _createComposerPayload(pageId)
    if (payload && _expireScenarioApplications('已开始新的提问，请重新应用技能包以确认本次范围。')) _persistConversation()

    if (loading.value) {
      if (payload) {
        _clearComposerDraft()
        _queuePayload(payload, context)
      } else {
        stopCurrentResponse()
      }
      return
    }

    if (!payload) return

    _clearComposerDraft()
    if (_tryLocalCommand(payload, context)) return
    await _runPayload(payload)
  }

  function _createComposerPayload(pageId: string): ComposerPayload | null {
    const text = inputText.value.trim()
    const files = attachedFiles.value
    if (!text && !files.length) return null
    const contextSummary = _buildPageContext(pageId)
    const pageDataContext = _buildPageDataContext(pageId)

    const fileNames = files.map(file => file.name)
    const attachmentSummary = fileNames.map(name => `附件：${name}`).join('\n')
    const attachmentContent = files.map(file => file.text || `附件：${file.name}`).join('\n\n')
    const userMsg = files.length
      ? (text ? `${attachmentSummary}\n${text}` : attachmentSummary)
      : text
    const apiMessage = files.length
      ? `${contextSummary}\n\n${pageDataContext}\n\n${attachmentContent}\n\n${text || '请分析这些文件'}`
      : `${contextSummary}\n\n${pageDataContext}\n\n${text}`

    return {
      pageId: pageId || '',
      text,
      userMsg,
      apiMessage,
      fileName: fileNames.join('、'),
      shortcut: pendingShortcut.value || activeShortcut.value,
      contextSummary
    }
  }

  function _clearComposerDraft() {
    inputText.value = ''
    attachedFiles.value = []
    pendingShortcut.value = ''
  }

  function _queuePayload(payload: ComposerPayload, context: AiRuntimeContext = {}) {
    queuedMessages.value.push({
      ...payload,
      context,
      queueId: `aiq_${Date.now()}_${++queueSeq}`
    })
    queueNotice.value = `已加入队列 · ${queuedMessages.value.length} 条待发送`
  }

  async function _runPayload(payload: ComposerPayload) {
    _recordMessage('user', payload.userMsg)
    loading.value = true
    stopRequested = false
    activeAbortController = new AbortController()
    _setActivityItems(_baseRunningActivities(payload))
    queueNotice.value = queuedMessages.value.length
      ? `正在回答，队列中还有 ${queuedMessages.value.length} 条`
      : ''

    try {
      if (AI_PREVIEW_RESPONSE_DELAY_MS) {
        await _delay(AI_PREVIEW_RESPONSE_DELAY_MS)
        if (stopRequested) throw new DOMException('Aborted', 'AbortError')
      }

      const body: Record<string, string | null> = {
        message:     payload.apiMessage,
        convId:      convId.value,
        currentPage: payload.pageId || 'portal.home',
        shortcut:    payload.shortcut || activeShortcut.value
      }
      if (payload.fileName) {
        body.file_name = payload.fileName
      }

      const res  = await fetch(HARNESS_CHAT_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
        signal:  activeAbortController.signal
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      _markActivityDone('tool_call')
      _upsertActivity('tool_result', 'done', '工具结果已返回', '已拿到 AI 回复内容，正在整理为可读回答。')
      _upsertActivity('streaming', 'running', '生成回复', '正在输出结论、后续动作和可展开结果。')
      const data = await res.json() as { reply?: string; message?: string; convId?: string; conv_id?: string }
      const reply = data.reply || data.message || '（无回复）'
      convId.value = data.convId || data.conv_id || convId.value
      _markActivityDone('streaming')
      _appendPostReplyActivities(payload, reply)
      _recordAssistantReply(payload, reply)
    } catch (e) {
      if ((e instanceof DOMException && e.name === 'AbortError') || stopRequested) {
        _setActivityItems([
          _createActivity('error', 'blocked', '回答已停止', '当前生成已被手动停止，队列消息会继续按顺序处理。')
        ])
        _recordMessage('assistant', '已停止当前回答。', { activityItems: _snapshotActivities() })
      } else {
        await _delay(850)
        _settleActivity('thinking', 'done')
        _settleActivity('tool_call', 'failed', '接口调用失败', e instanceof Error ? e.message : '远端接口暂不可用。')
        _settleActivity('tool_result', 'failed', '工具结果不可用', '接口失败后未返回大模型结果。')
        _settleActivity('error', 'blocked', '大模型不可用', '未生成本地模拟解读，避免把演示内容误当真实分析。')
        _recordAssistantReply(payload, _mockReply(payload, e))
      }
    } finally {
      _finishResponse()
    }
  }

  function stopCurrentResponse() {
    if (!loading.value || !activeAbortController) return
    stopRequested = true
    activeAbortController.abort()
    queueNotice.value = queuedMessages.value.length
      ? `已停止，准备发送队列 · ${queuedMessages.value.length} 条待发送`
      : '已停止当前回答'
  }

  function _finishResponse() {
    loading.value = false
    activeAbortController = null
    stopRequested = false

    if (queuedMessages.value.length) {
      const next = queuedMessages.value.shift()
      if (!next) return
      queueNotice.value = queuedMessages.value.length
        ? `正在发送队列 · 剩余 ${queuedMessages.value.length} 条`
        : ''
      setTimeout(() => {
        if (!_tryLocalCommand(next, next.context || {})) _runPayload(next)
      }, 0)
    } else {
      queueNotice.value = ''
    }
  }

  function seedDemoReportCards(pageId = '') {
    const reportCatalog: ReportArtifact[] = _scopeDemoReports(_createDemoReports(pageId))
    reportCatalog.forEach(report => { AI_REPORT_ARTIFACTS[report.id] = report })
    const reports = reportCatalog.slice(0, 2)
    if (messages.value.some(msg => msg.demoReportEntry)) return
    _recordMessage('user', '我准备了质量分析和运营总览两份默认报告。点击卡片里的“展开报告”，会从 Agent 区推送到中间工作区动态页签。', {
      demoReportQuery: true
    })
    _recordMessage('assistant', '已准备质量分析和运营总览报告，可点击卡片里的“展开报告”推送到中间工作区动态页签。后续查询生成的报告会继续追加在对应回答中。', {
      demoReportEntry: true,
      artifacts: reports.map(report => report.id)
    })
  }

  function openReportArtifact(id: string, appStore?: AppStoreBridge) {
    const report = AI_REPORT_ARTIFACTS[id]
    const ownerMessage = messages.value.find(message => message.artifacts?.includes(id))
    if (!report || !ownerMessage || !appStore?.openTempTab) return
    report.conversationId = localConvId.value
    report.messageId = ownerMessage.id || ''
    appStore.openTempTab(report)
  }

  async function runTaskAction(action: TaskAction, pageId = '', context: AiRuntimeContext = {}) {
    if (!action) return
    if (action.type === 'scenario_application_confirm' || action.type === 'scenario_application_cancel') {
      _resolveScenarioApplication(action)
      return
    }
    if (action.type === 'report') {
      const report = _createActionReport(pageId, action.value || action.label)
      AI_REPORT_ARTIFACTS[report.id] = report
      _recordTaskLog('report', `生成报告：${report.title}`, pageId || 'portal.home')
      _recordMessage('assistant', `已生成「${report.title}」，可以在顶部动态页签中继续查看。`, {
        artifacts: [report.id]
      })
      context.appStore?.openTempTab?.(report)
      return
    }
    if (action.type === 'navigate') {
      const target = pageIdToPath(action.value || '')
      if (target) {
        context.router?.push(target)
        _recordTaskLog('navigate', `打开页面：${getPageLabel(action.value || '')}`, action.value || '')
        _recordMessage('assistant', `已为你打开「${getPageLabel(action.value || '')}」。`)
      }
      return
    }
    if (action.type === 'skill') {
      context.appStore?.ensureStaticTab?.('agent.skills')
      context.appStore?.setActiveStaticTab?.('agent.skills')
      context.router?.push('/agent/skills')
      _recordTaskLog('skill', '打开 Skill Hub', 'agent.skills')
      _recordMessage('assistant', '已打开 Skill Hub，可以继续查看技能包详情、启停、审批和评价。')
      return
    }
    if (action.type === 'prompt') {
      quickSend(action.value || action.label || '', pageId)
      return
    }
    if (action.type === 'auth_task_decide') {
      if (action.decision) await _decideAuthorizationTask(action.decision, pageId, context)
      return
    }
    if (['auth_approve', 'auth_batch_approve', 'auth_reject'].includes(action.type)) {
      // Historical command-only buttons cannot identify a task or resume execution.
      queueNotice.value = '这条授权记录已失效，请重新发起任务。'
      return
    }
    if (action.type === 'skill_tune_confirm') {
      _recordTaskLog('skill', '确认 Skill 微调完成', pageId || 'agent.skills')
      _resolveSkillTuneConfirmation(action.value || '')
    }
  }

  // ===== 快捷发送（对应 aiQuick）=====
  function quickSend(text: string, pageId: string, context: AiRuntimeContext = {}) {
    inputText.value = text
    send(pageId, context)
  }

  function sendShortcut(label: ShortcutLabel, pageId: string, context: AiRuntimeContext = {}) {
    pendingShortcut.value = label
    quickSend(shortcutQueries[label] || `在「${label}」范围内分析当前页面，并告诉我下一步需要确认什么。`, pageId, context)
  }

  // ===== 快捷标签切换 =====
  function setShortcut(label: string) {
    activeShortcut.value = label
  }

  function shortcutQuery(label: string) {
    return isShortcutLabel(label) ? shortcutQueries[label] : ''
  }

  // ===== 附件 =====
  function attachFile(file: AttachedFile) {
    attachedFiles.value = [...attachedFiles.value, file]
  }
  function clearFile(index?: number) {
    if (typeof index === 'number') {
      attachedFiles.value = attachedFiles.value.filter((_, itemIndex) => itemIndex !== index)
      return
    }
    attachedFiles.value = []
  }

  // ===== 对话历史（localStorage）=====
  function loadConversations(): ConversationItem[] {
    return readJsonArray<ConversationItem>(AI_CONVERSATION_STORAGE_KEY)
  }

  function saveConversations(list: ConversationItem[]) {
    localStorage.setItem(AI_CONVERSATION_STORAGE_KEY, JSON.stringify(list.slice(0, 50)))
  }

  function restoreConversation(id: string) {
    const item = loadConversations().find(c => c.id === id)
    if (!item) return
    _expireCurrentAuthorizationTasks()
    _persistConversation()
    localConvId.value = item.id
    convId.value      = item.remoteConvId || null
    messages.value    = (item.messages || []).map(message => message.task
      ? { ...message, task: expireTask(message.task) }
      : message).map(message => _expireHistoricalScenarioActions(message))
    ;(item.reports || []).forEach(report => {
      AI_REPORT_ARTIFACTS[report.id] = report
    })
    if (!open.value) toggleOpen(true)
  }

  function deleteConversation(id: string) {
    saveConversations(loadConversations().filter(c => c.id !== id))
    if (localConvId.value === id) newConversation(true)
  }

  // ===== 内部工具函数 =====
  function _newLocalId() {
    return `aic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  function _recordMessage(role: MessageRole, text: string, extra: Partial<AiMessage> = {}) {
    if (!text) return
    const task = extra.task || (extra.authRequest ? _taskFromAuthRequest(extra.authRequest) : undefined)
    const message = { id: _newMessageId(role), role, text, at: new Date().toISOString(), ...extra, ...(task ? { task } : {}) }
    messages.value.push(message)
    message.artifacts?.forEach(id => {
      const report = AI_REPORT_ARTIFACTS[id]
      if (!report) return
      report.conversationId = localConvId.value
      report.messageId = message.id || ''
    })
    _persistConversation()
    return message
  }

  function _newMessageId(role: MessageRole) {
    return `msg_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  function _taskFromAuthRequest(request: AuthRequestBlock): AiTaskBlock {
    const id = _newMessageId('assistant')
    const now = Date.now()
    const kind = request.kind || 'unknown'
    return {
      id, conversationId: localConvId.value, title: request.taskTitle || request.title,
      mode: 'preview', createdAt: now, expiresAt: now + 15 * 60 * 1000,
      requests: [{
        id: `${id}:request`, revision: 1, label: request.taskTitle || request.summary || request.title,
        scope: request.scope || '当前页面、本次任务', impact: request.impact || request.detail,
        kind, batchable: kind === 'read', approvalGroup: id, status: 'pending',
        ...(request.steps?.length ? { steps: [...request.steps] } : {}),
        command: request.command, detail: request.detail
      }]
    }
  }

  function _replaceAuthorizationTask(task: AiTaskBlock) {
    if (task.conversationId !== localConvId.value) return
    messages.value = messages.value.map(message => message.task?.id === task.id
      ? { ...message, task, activityItems: undefined }
      : message)
    _persistConversation()
  }

  function _expireCurrentAuthorizationTasks() {
    _expireScenarioApplications('会话已切换，请重新应用技能包。')
    messages.value = messages.value.map(message => message.task
      ? { ...message, task: expireTask(message.task) }
      : message)
    pendingQueryableSkillAuth.clear()
    previewAuthorizationTasks.clear()
  }

  function _scenarioApplicationActor() {
    return { id: applicationAccount.user || '', permissions: applicationAccount.permissions }
  }

  function _scenarioApplicationScope(packageId: string) {
    return JSON.stringify({
      actor: _scenarioApplicationActor(),
      package: useScenarioSkillPackagesStore().applicationPackage(packageId)
    })
  }

  function _isScenarioAction(action: TaskAction) {
    return action.type === 'scenario_application_confirm' || action.type === 'scenario_application_cancel'
  }

  function _expireHistoricalScenarioActions(message: AiMessage): AiMessage {
    if (!message.actionItems?.some(_isScenarioAction)) return message
    return { ...message, actionItems: message.actionItems.filter(action => !_isScenarioAction(action)),
      text: `${message.text}\n\n这条历史确认已失效，请从 Skill Hub 重新应用技能包。` }
  }

  function _expireScenarioApplications(reason: string) {
    if (!pendingScenarioApplications.size) return false
    const messageIds = new Set([...pendingScenarioApplications.values()].map(item => item.messageId))
    pendingScenarioApplications.clear()
    messages.value = messages.value.map(message => messageIds.has(message.id || '')
      ? { ...message, actionItems: message.actionItems?.filter(action => !_isScenarioAction(action)), text: `${message.text}\n\n${reason}` }
      : message)
    return true
  }

  function _scenarioApplicationVersionLabel(preview: Pick<ScenarioApplicationPreview, 'versionSource' | 'packageStatus'>) {
    return preview.versionSource === 'current_revision'
      ? preview.packageStatus === 'draft' ? '当前草稿版本' : '当前待审核版本'
      : '已审核固定版本'
  }

  function _scenarioApplicationText(preview: ScenarioApplicationPreview) {
    const versionLabel = _scenarioApplicationVersionLabel(preview)
    const lines = [
      `### 技能包应用测试：${preview.name}（${preview.version}）`,
      `测试版本：${versionLabel}${preview.versionSource === 'current_revision' ? ' · 未审核、未发布，仅用于应用测试' : ''}。`,
      'POC 样例演示 · 未调用真实 Skill 或业务接口，未读取或修改业务数据。',
      preview.summary
    ]
    if (preview.status === 'confirmation_required') {
      lines.push(`请确认按以下${versionLabel}测试整个工作流；本次不启用未命中的条件分支。`,
        ...preview.nodes.map(node => `- ${node.name} · ${node.pinnedVersion}`))
    } else {
      lines.push(...preview.nodes.map(node => `- ${node.name} · ${node.pinnedVersion}：${node.status === 'completed' ? '样例完成' : node.status === 'skipped' ? '条件未命中，未执行' : '未完成'}${node.output ? `\n  ${node.output}` : ''}`))
    }
    if (preview.issues.length) lines.push(...preview.issues.map(issue => `- ${issue}`))
    return lines.filter(Boolean).join('\n\n')
  }

  /** Explicitly local application rehearsal; ordinary AI chat and draft trials stay independent. */
  function applyScenarioPackage(packageId: string): { ok: boolean, reason?: string } {
    if (loading.value) return { ok: false, reason: 'AI 助手正在处理上一条消息，请完成后再应用技能包。' }
    const scenario = useScenarioSkillPackagesStore()
    const actor = _scenarioApplicationActor()
    const eligibility = scenario.applicationEligibility(packageId, actor)
    if (!eligibility.ok) return { ok: false, reason: eligibility.reasons.join('；') }
    _expireScenarioApplications('已选择新的应用测试，之前的确认已失效。')
    toggleOpen(true)
    const preview = scenario.applicationPreview(packageId, actor, {})
    _recordMessage('user', `应用场景技能包「${eligibility.name}」${eligibility.version}（${_scenarioApplicationVersionLabel(eligibility)}），进行 POC 样例测试。`)
    const key = _newMessageId('assistant')
    const confirmation = preview.status === 'confirmation_required'
    const message = _recordMessage('assistant', _scenarioApplicationText(preview), {
      ...(confirmation ? { actionItems: [
        { type: 'scenario_application_confirm', label: '确认并应用测试', value: key },
        { type: 'scenario_application_cancel', label: '取消测试', value: key }
      ] as TaskAction[] } : {})
    })
    if (confirmation && message?.id) {
      pendingScenarioApplications.set(key, { packageId, conversationId: localConvId.value,
        scope: _scenarioApplicationScope(packageId), messageId: message.id, expiresAt: Date.now() + 15 * 60 * 1000 })
    }
    return { ok: true }
  }

  function _resolveScenarioApplication(action: TaskAction) {
    const key = action.value || '', pending = pendingScenarioApplications.get(key)
    if (!pending || pending.conversationId !== localConvId.value) return
    const message = messages.value.find(item => item.id === pending.messageId)
    if (!message?.actionItems?.some(item => item.type === action.type && item.value === key)) return
    pendingScenarioApplications.delete(key)
    message.actionItems = message.actionItems.filter(item => !_isScenarioAction(item))
    if (action.type === 'scenario_application_cancel') {
      message.text += '\n\n已取消本次应用测试，未执行任何节点。'
      _persistConversation()
      return
    }
    if (Date.now() >= pending.expiresAt || pending.scope !== _scenarioApplicationScope(pending.packageId)) {
      message.text += '\n\n本次确认已失效，技能包版本、状态或权限可能已变化，请重新应用后核对。'
      _persistConversation()
      return
    }
    // Recheck current published state and permissions; this ticket only supplies workflow confirmation.
    const preview = useScenarioSkillPackagesStore().applicationPreview(pending.packageId, _scenarioApplicationActor(), { workflowConfirmed: true })
    message.text += '\n\n已确认本次工作流的 POC 测试范围。'
    _recordMessage('assistant', _scenarioApplicationText(preview))
  }

  async function _decideAuthorizationTask(decision: TaskDecision, pageId: string, context: AiRuntimeContext) {
    if (decision.conversationId !== localConvId.value) return
    const message = messages.value.find(item => item.task?.id === decision.taskId && item.task.conversationId === localConvId.value)
    if (!message?.task) return
    const result = applyTaskDecision(message.task, decision, localConvId.value, Date.now())
    _replaceAuthorizationTask({ ...result.task, notice: result.error })
    if (result.error || !result.acceptedIds.length) return
    _recordTaskLog('auth', `${decision.decision === 'approve' ? '确认' : '拒绝'}示例任务中的 ${result.acceptedIds.length} 项操作`, pageId || 'portal.home')
    const acceptedSelections = result.task.requests.filter(item => result.acceptedIds.includes(item.id))
      .map(item => ({ requestId: item.id, revision: item.revision }))
    for (const { requestId: id, revision } of acceptedSelections) {
      const current = messages.value.find(item => item.task?.id === decision.taskId)?.task
      const request = current?.requests.find(item => item.id === id)
      if (!current || !request || current.conversationId !== localConvId.value) return
      if (decision.decision === 'reject') {
        if (request.command) pendingQueryableSkillAuth.delete(request.command)
        continue
      }
      if (request.revision !== revision || request.status !== 'approved') {
        const changed = request.revision !== revision && ['approved', 'running'].includes(request.status)
          ? updateTaskRequest(current, id, request.revision, 'expired', '操作范围已变化，请重新发起确认。') : current
        _replaceAuthorizationTask({ ...changed, notice: '操作已变化，本次批准不适用于新版请求。' })
        continue
      }
      if (Date.now() >= current.expiresAt) { _replaceAuthorizationTask(expireTask(current)); return }
      const query = request.command ? pendingQueryableSkillAuth.get(request.command) : undefined
      const isPreviewTask = previewAuthorizationTasks.has(current.id)
      if (!isPreviewTask && (!query || query.conversationId !== current.conversationId)) {
        _replaceAuthorizationTask({ ...current, notice: '已记录本次授权；该操作尚未接入执行，没有运行命令或修改数据。' })
        continue
      }
      _replaceAuthorizationTask(updateTaskRequest(current, id, revision, 'running', '正在处理示例数据。'))
      // This delay represents preview progress only; it never invokes a real tool.
      await _delay(180)
      const live = messages.value.find(item => item.task?.id === decision.taskId)?.task
      const liveRequest = live?.requests.find(item => item.id === id)
      if (!live || live.conversationId !== localConvId.value || liveRequest?.revision !== revision || liveRequest.status !== 'running') return
      if (Date.now() >= live.expiresAt) { _replaceAuthorizationTask(expireTask(live)); return }
      try {
        const completed = isPreviewTask || _completeQueryableSkillAuthorization(request.command || '', context)
        _replaceAuthorizationTask(updateTaskRequest(live, id, revision, completed ? 'succeeded' : 'failed', completed
          ? (request.kind === 'export' ? '导出示例已完成，未生成真实文件。' : '示例数据处理完成。')
          : '任务上下文已失效，请重新发起。'))
      } catch {
        _replaceAuthorizationTask(updateTaskRequest(live, id, revision, 'failed', '示例任务处理失败，请重新发起。'))
      }
    }
  }

  function _createPreviewAuthorizationTask(pageId: string): AiTaskBlock {
    const id = _newMessageId('assistant')
    const now = Date.now()
    previewAuthorizationTasks.add(id)
    const scope = `${getPageLabel(pageId) || '当前页面'} · 示例数据 · 本次任务`
    return {
      id, conversationId: localConvId.value, title: '合作伙伴数据查询与汇总', mode: 'preview', createdAt: now, expiresAt: now + 15 * 60 * 1000,
      requests: [
        { label: '查询合作伙伴列表', kind: 'read', impact: '读取示例合作伙伴基本信息。' },
        { label: '查询合作状态', kind: 'read', impact: '读取同一批示例合作伙伴的合作状态。' },
        { label: '汇总业务数据', kind: 'read', impact: '汇总当前范围内的示例统计结果。' },
        { label: '导出结果文件', kind: 'export', impact: '导出本次查询结果，示例不生成真实文件。' }
      ].map((item, index) => ({ ...item, kind: item.kind as TaskRequest['kind'], id: `${id}:${index + 1}`, revision: 1, scope, approvalGroup: id, batchable: item.kind === 'read', status: 'pending' as const }))
    }
  }

  function _resolveSkillTuneConfirmation(key: string) {
    const reverseIndex = [...messages.value].reverse().findIndex(message =>
      message.actionItems?.some(action => action.type === 'skill_tune_confirm' && action.value === key)
    )
    if (reverseIndex !== -1) {
      const targetIndex = messages.value.length - 1 - reverseIndex
      messages.value = messages.value.map((message, index) => index === targetIndex
        ? {
            ...message,
            text: `${message.text}\n\n已确认本轮微调完成，评估结果已同步到左侧 Skill 创建页。`,
            actionItems: undefined
          }
        : message)
    }
    skillTuneConfirmation.value = { key, confirmedAt: Date.now() }
    _persistConversation()
  }

  function _extractExecutableCommand(text: string) {
    const source = String(text || '').trim()
    const bodyCommand = source.match(/python3\s+\/skill\/[^\n]*?--body\s+(['"])[\s\S]*?\1/)
    if (bodyCommand?.[0]) return bodyCommand[0].trim()
    const pythonCommand = source.match(/python3\s+\/skill\/[^\n。；;]+/)
    if (pythonCommand?.[0]) return pythonCommand[0].trim()
    const npmCommand = source.match(/npm\s+run\s+[^\n。；;]+/)
    return npmCommand?.[0]?.trim() || ''
  }

  function _safeParseCommandJson(source: string): AnyRecord | null {
    try {
      const value = JSON.parse(source)
      return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : null
    } catch {
      return null
    }
  }

  function _commandArg(command: string, name: string) {
    return command.match(new RegExp(`--${name}\\s+([^\\s]+)`))?.[1] || ''
  }

  function _commandBody(command: string) {
    const match = command.match(/--body\s+(['"])([\s\S]*?)\1/)
    return match?.[2] ? _safeParseCommandJson(match[2]) : null
  }

  function _periodLabel(periodType: unknown, statDate: string) {
    const period = Number(periodType)
    if (period === 1) return statDate ? `${statDate} 当日` : '当日'
    if (period > 1) return statDate ? `截至 ${statDate} 的近 ${period} 天` : `近 ${period} 天`
    return statDate ? `截至 ${statDate} 的统计周期` : '当前统计周期'
  }

  function _geoBoardLabel(boardType: unknown) {
    const board = Number(boardType)
    if (board === 1) return 'GEO 转化看板'
    if (board === 2) return 'GEO 信源看板'
    if (board === 3) return 'GEO 意图看板'
    return 'GEO 看板'
  }

  function _createReadableAuthRequest(command: string, payload: ComposerPayload): AuthRequestBlock {
    const api = _commandArg(command, 'api')
    const env = _commandArg(command, 'env')
    const body = _commandBody(command)
    const statDate = typeof body?.statDate === 'string' ? body.statDate : ''
    const periodText = _periodLabel(body?.periodType, statDate)
    const boardLabel = _geoBoardLabel(body?.boardType)

    if (command.includes('/skill/geo/scripts/call_script.py')) {
      return {
        title: '确认查询授权',
        namespace: 'ai.query.dashboard.geo',
        command,
        risk: '只读查询确认',
        summary: api === 'geo_conversion_stat'
          ? `允许 AI 助手读取「${boardLabel}」的转化统计数据，查询范围为${periodText}。`
          : `允许 AI 助手调用 GEO 查询能力，读取${env ? env.toUpperCase() : '当前演示环境'}的只读看板数据。`,
        scope: `${boardLabel}；环境：${env ? env.toUpperCase() : '当前演示环境'}；仅限本次任务。`,
        impact: '本次只读取统计数据并生成分析结果，不会修改配置、发布内容或导出文件。',
        steps: ['读取本次查询所需的 GEO 统计数据', '汇总关键指标和异常变化', '生成结论、明细摘要和可展开报告卡片'],
        detail: '授权后继续完成本次只读查询；拒绝后停止任务，当前会话不受影响。',
        approveHint: '可以只授权本次查询，也可以批量授权本轮同类只读查询步骤。',
        approveLabel: '授权',
        batchApproveLabel: '批量授权',
        rejectLabel: '拒绝'
      }
    }

    return {
      title: '确认授权',
      namespace: `ai.task.${payload.pageId || 'portal.home'}`,
      command,
      risk: '需要用户确认',
      summary: '允许 AI 助手读取当前页面相关数据，并继续完成本次任务。',
      scope: '当前会话、本次任务、当前工作台页面上下文',
      impact: '不会自动修改数据、发布内容或导出文件；后续涉及高影响动作时会再次确认。',
      steps: ['读取当前页面与任务口径', '调用所需能力完成处理', '生成结论、明细摘要和后续动作'],
      detail: '授权后继续本次任务；拒绝后停止并保留当前对话状态。',
      approveHint: '可以只授权当前一步，也可以批量授权本轮同类只读步骤。',
      approveLabel: '授权',
      batchApproveLabel: '批量授权',
      rejectLabel: '拒绝'
    }
  }

  function _recordAssistantReply(payload: ComposerPayload, reply: string) {
    const displayReply = _sanitizeModelVendorName(reply)
    const artifacts: string[] = []
    if (_shouldCreateReportArtifact(payload, displayReply)) {
      if (_hasActivityKind('tool_call')) {
        _markActivityDone('tool_call')
      } else {
        _upsertActivity('tool_call', 'done', '生成报告卡片', '已根据当前页面和回复内容生成可展开的报告 artifact。')
      }
      if (!_hasActivityKind('tool_result')) {
        _upsertActivity('tool_result', 'done', '报告结果已就绪', '报告可下载，也可展开到中间工作区。')
      }
      const report = _createReportArtifact(payload, displayReply)
      AI_REPORT_ARTIFACTS[report.id] = report
      artifacts.push(report.id)
    }
    _appendPostReplyActivities(payload, displayReply)
    _recordMessage('assistant', displayReply, {
      renderMode: 'typewriter',
      ...(artifacts.length ? { artifacts } : {}),
      actionItems: _taskActionItems(payload, displayReply),
      activityItems: _snapshotActivities()
    })
  }

  function _tryLocalCommand(payload: ComposerPayload, context: AiRuntimeContext = {}) {
    const text = payload.text || payload.userMsg || ''
    if (/批量授权.*(?:演示|示例)|(?:演示|示例).*批量授权/.test(text)) {
      _recordMessage('user', payload.userMsg)
      _recordMessage('assistant', '授权后将继续执行本次 Skill，完成查询、汇总和结果导出。', {
        task: _createPreviewAuthorizationTask(payload.pageId)
      })
      return true
    }
    if (_tryQueryableSkillAuthorization(payload, context)) return true

    if (_isEmployeeCertificationSkillQuery(text)) {
      return _runEmployeeCertificationSkill(payload)
    }

    if (/全场景串联演示/.test(text)) {
      _recordMessage('user', payload.userMsg)
      const pageLabel = getPageLabel(payload.pageId) || '当前页面'
      _setActivityItems([
        _createActivity('thinking', 'done', '理解演示目标', `已识别为「${pageLabel}」右侧 Agent 对话流全场景走查。`),
        _createActivity('tool_call', 'done', '调用页面能力', '模拟读取页面上下文、报告生成和权限边界。'),
        _createActivity('tool_result', 'done', '能力结果返回', '已生成可审计的结构化输出。'),
        _createActivity('confirm', 'blocked', '等待授权确认', '涉及命令、写入或导出动作时，需要用户批准。')
      ])
      const demoReports = _scopeDemoReports(_createDemoReports(payload.pageId))
      demoReports.forEach(report => {
        if (!AI_REPORT_ARTIFACTS[report.id]) AI_REPORT_ARTIFACTS[report.id] = report
      })
      _recordMessage('assistant', [
        `我会按「${pageLabel}」上下文串联展示完整 Agent 对话流。`,
        '',
        '本次使用示例数据演示任务授权、报告展开和待办清单。',
        '点击授权后继续本次 Skill 的全部步骤，进度和结果在同一任务中更新。'
      ].join('\n'), {
        renderMode: 'typewriter',
        activityItems: _snapshotActivities(),
        task: _createPreviewAuthorizationTask(payload.pageId),
        authRequest: {
          title: '请求执行演示命令',
          namespace: 'agent.demo',
          command: 'python3 scripts/demo_agent_flow.py --dry-run',
          risk: 'POC 高影响动作确认',
          detail: '这是全场景串联演示中的授权卡片。批准或拒绝后，结论会回填到当前卡片，不再追加多余说明气泡。',
          approveLabel: '批准执行',
          rejectLabel: '拒绝'
        },
        artifacts: [demoReports.find(report => report.id.startsWith('demo_skill_report__'))?.id || demoReports[0].id],
        actionItems: [
          { type: 'prompt', label: '继续追问', value: '继续说明这个 Agent 对话流的交互边界。' },
          { type: 'skill', label: '查看 Skill Hub', value: 'agent.skills' }
        ],
        todoList: {
          title: 'Todo List',
          done: 4,
          total: 4,
          items: [
            { id: 'flow-demo-1', text: '展示气泡外过程状态区', status: 'done' },
            { id: 'flow-demo-2', text: '打字机输出回答正文', status: 'done' },
            { id: 'flow-demo-3', text: '展示授权请求与结论回填', status: 'done' },
            { id: 'flow-demo-4', text: '展示结构卡片和独立待办气泡', status: 'done' }
          ]
        }
      })
      _clearActivityItems()
      return true
    }

    if (_isSkillCreateIntent(text)) {
      _recordMessage('user', payload.userMsg)
      _setActivityItems([
        _createActivity('thinking', 'done', '识别创建意图', '当前请求是创建新的 Skill。'),
        _createActivity('tool_call', 'done', '打开 Skill 创建页', '切换到 Skill 创建静态页签。'),
        _createActivity('tool_result', 'done', '页面已打开', '可以继续填写基础配置，或用自然语言补充需求。'),
        _createActivity('follow_up', 'blocked', '等待创建信息', '我会按九要素协助澄清能力定义、输入输出、边界和验收用例。')
      ])
      context.appStore?.ensureStaticTab?.('agent.skillCreate')
      context.appStore?.setActiveStaticTab?.('agent.skillCreate')
      context.router?.push('/agent/skill-create')
      _recordTaskLog('skill', '打开 Skill 创建', 'agent.skillCreate')
      _recordMessage('assistant', '已打开「Skill 创建」。你可以先填写基础配置，也可以继续用自然语言描述要创建的 Skill。', {
        actionItems: [
          { type: 'prompt', label: '补充 Skill 需求', value: '我要创建一个用于职场认证数据分析的 Skill。' },
          { type: 'skill', label: '查看 Skill Hub', value: 'agent.skills' }
        ],
        activityItems: _snapshotActivities()
      })
      _clearActivityItems()
      return true
    }

    const targetPageId = _matchNavigationTarget(text)
    if (targetPageId) {
      const targetPath = pageIdToPath(targetPageId)
      if (targetPath) {
        _recordMessage('user', payload.userMsg)
        _setActivityItems([
          _createActivity('thinking', 'done', '识别导航意图', `匹配到目标页面：${getPageLabel(targetPageId)}。`),
          _createActivity('tool_call', 'done', '执行页面跳转', targetPath),
          _createActivity('tool_result', 'done', '页面已打开', '静态页签已同步到目标页面。'),
          _createActivity('follow_up', 'blocked', '等待下一步问题', '你可以继续围绕当前页面提问或生成报告。')
        ])
        context.appStore?.ensureStaticTab?.(targetPageId)
        context.appStore?.setActiveStaticTab?.(targetPageId)
        context.router?.push(targetPath)
        _recordTaskLog('navigate', `切换页面：${getPageLabel(targetPageId)}`, targetPageId)
        _recordMessage('assistant', `已切换到「${getPageLabel(targetPageId)}」，我会继续围绕这个页面回答。`, {
          actionItems: _taskActionItems({ ...payload, pageId: targetPageId }, ''),
          activityItems: _snapshotActivities()
        })
        _clearActivityItems()
        return true
      }
    }

    if (/skill\s*hub|技能包|技能管理/i.test(text)) {
      _recordMessage('user', payload.userMsg)
      _setActivityItems([
        _createActivity('thinking', 'done', '识别 Skill 任务', '当前请求属于 Skill 管理或创建链路。'),
        _createActivity('tool_call', 'done', '打开 Skill 工作区', '切换到 Skill Hub 静态页签。'),
        _createActivity('tool_result', 'done', '入口已就绪', '可以继续创建、审批或查看 Skill。'),
        _createActivity('confirm', 'blocked', '等待用户选择', '涉及启停、发布或权限动作时，需要先确认影响范围。')
      ])
      context.appStore?.ensureStaticTab?.('agent.skills')
      context.appStore?.setActiveStaticTab?.('agent.skills')
      context.router?.push('/agent/skills')
      _recordTaskLog('skill', '打开 Skill Hub', 'agent.skills')
      _recordMessage('assistant', '已打开 Skill Hub。你可以从顶部入口创建 Skill，也可以在卡片中查看详情、申请、启停和评价。', {
        actionItems: [
          { type: 'navigate', label: '创建 Skill', value: 'agent.skillCreate' },
          { type: 'skill', label: '查看 Skill Hub', value: 'agent.skills' },
          { type: 'navigate', label: '权限管理', value: 'agent.permissions' }
        ],
        activityItems: _snapshotActivities()
      })
      _clearActivityItems()
      return true
    }

    if (/todo|待办|任务清单/i.test(text)) {
      _recordMessage('user', payload.userMsg)
      _setActivityItems([
        _createActivity('thinking', 'done', '理解任务意图', '已根据当前页面和输入内容拆解任务。'),
        _createActivity('tool_call', 'running', '生成 TODO 列表', '正在建立可追踪的步骤清单。'),
        _createActivity('tool_result', 'pending', '等待任务执行', '后续步骤会按完成状态更新。')
      ])
      _recordMessage('assistant', '已创建任务清单，我会按步骤推进并同步完成状态。', {
        activityItems: _snapshotActivities(),
        todoList: _demoTodoList()
      })
      _clearActivityItems()
      return true
    }

    if (/授权|批准|执行命令|高风险|需要确认|python|命令/i.test(text)) {
      const command = _extractExecutableCommand(text)
        || (/python/i.test(text)
          ? 'python3 /skill/geo/scripts/call_script.py --api geo_conversion_stat --env uat --body \'{"statDate":"2026-07-21","periodType":7,"boardType":1}\''
          : 'npm run deploy-preview -- --dry-run')
      const authRequest = _createReadableAuthRequest(command, payload)
      const isReadonlyQuery = authRequest.risk.includes('只读')
      _recordMessage('user', payload.userMsg)
      _setActivityItems([
        _createActivity('thinking', 'done', isReadonlyQuery ? '理解查询请求' : '理解执行请求', isReadonlyQuery ? '已识别为只读数据查询，需要确认读取范围。' : '已识别该任务包含高影响执行动作。'),
        _createActivity('tool_call', 'running', isReadonlyQuery ? '准备查询数据' : '准备执行任务', '授权前不会读取数据或执行任务。'),
        _createActivity('confirm', 'blocked', '等待用户授权', isReadonlyQuery ? '本次为只读查询授权确认。' : '涉及写入、导出、发布或配置变更，需要明确批准。')
      ])
      _recordMessage('assistant', '我已把本次操作整理为可读的授权内容。继续前，请确认授权范围。', {
        activityItems: _snapshotActivities(),
        authRequest
      })
      _clearActivityItems()
      return true
    }

    if (/并行|多个步骤|思考过程|同时进行/i.test(text)) {
      _recordMessage('user', payload.userMsg)
      _setActivityItems([
        _createActivity('thinking', 'running', '理解任务意图', '正在结合页面上下文、快捷标签和附件内容判断任务类型。'),
        _createActivity('tool_call', 'running', '读取参考内容', '正在读取生成所需的参考内容和页面状态。'),
        _createActivity('tool_result', 'pending', '等待工具结果', '工具返回后会继续整理为回复、报告或后续动作。'),
        _createActivity('follow_up', 'pending', '准备追问', '如发现缺少口径，会在生成前提出确认问题。')
      ])
      _recordMessage('assistant', '已进入多步骤并行处理状态。状态卡会展示当前进行中的步骤数量和每一步进度。', {
        activityItems: _snapshotActivities()
      })
      _clearActivityItems()
      return true
    }

    if (_isReportIntent(text)) {
      _recordMessage('user', payload.userMsg)
      _setActivityItems(_reportActivities(payload))
      const reply = _reportIntentReply(payload)
      _recordAssistantReply(payload, reply)
      _clearActivityItems()
      return true
    }

    return false
  }

  function _tryQueryableSkillAuthorization(payload: ComposerPayload, context: AiRuntimeContext = {}) {
    const text = String(payload.text || payload.userMsg || '').trim()
    const scenario = _matchQueryableSkillScenario(payload.pageId, text)
    if (!scenario) return false

    const key = `mock:query-skill:${scenario.pageId}:${_newMessageId('assistant')}`
    pendingQueryableSkillAuth.set(key, { key, conversationId: localConvId.value, payload: { ...payload }, scenario, context })
    _recordMessage('user', payload.userMsg)
    _setActivityItems([
      _createActivity('thinking', 'done', '识别查询型 Skill', `已匹配「${scenario.groupLabel} / ${scenario.skillLabel}」。`),
      _createActivity('tool_call', 'blocked', '等待授权后查询', '授权前不会读取页面数据，也不会生成报告。'),
      _createActivity('confirm', 'blocked', '等待用户授权', '本次为只读查询授权确认。')
    ])
    _recordTaskLog('auth', `请求查询授权：${scenario.skillLabel}`, scenario.pageId)
    _recordMessage('assistant', '请授权本次 Skill 执行，完成后会返回查询结果。', {
      activityItems: _snapshotActivities(),
      authRequest: {
        title: '确认查询授权',
        taskTitle: scenario.skillLabel,
        kind: 'read',
        namespace: `ai.query.${scenario.pageId}`,
        command: key,
        risk: '只读查询确认',
        summary: scenario.summary,
        scope: scenario.scope,
        impact: '读取本次示例数据，生成查询结果与分析报告。',
        steps: scenario.steps,
        detail: '授权后继续完成本次 Skill 的查询与报告步骤。',
        approveHint: '本次授权仅限下方列明的操作和数据范围。',
        approveLabel: '授权',
        batchApproveLabel: '批量授权',
        rejectLabel: '拒绝'
      }
    })
    _clearActivityItems()
    return true
  }

  function _matchQueryableSkillScenario(pageId: string, text: string) {
    const source = String(text || '')
    if (!source || !QUERY_ACTION_PATTERN.test(source)) return null
    if (_isSkillCreateIntent(source) || /权限管理|审批|驳回|发布|启用|禁用|删除|修改状态/.test(source)) return null

    const geoSubPages = ['dashboard.geoSource', 'dashboard.geoIntent', 'dashboard.geoConversion', 'dashboard.geoKnowledge']
    const normalizedPageId = geoSubPages.includes(pageId) ? 'dashboard.geo' : (pageId || 'portal.home')
    const currentPageMatch = QUERYABLE_SKILL_AUTH_SCENARIOS.find(item => item.pageId === normalizedPageId)
    const textMatch = QUERYABLE_SKILL_AUTH_SCENARIOS.find(item => item.aliases.some(pattern => pattern.test(source)))
    return textMatch || currentPageMatch || null
  }

  function _completeQueryableSkillAuthorization(command: string, context: AiRuntimeContext = {}) {
    const pending = pendingQueryableSkillAuth.get(command)
    if (!pending || pending.conversationId !== localConvId.value) return false
    pendingQueryableSkillAuth.delete(command)

    const payload = pending.payload
    const scenario = pending.scenario
    _setActivityItems([
      _createActivity('thinking', 'done', '授权已确认', `已允许读取「${scenario.skillLabel}」所需的只读数据。`),
      _createActivity('tool_call', 'done', `调用 ${scenario.skillLabel}`, '已按本次请求读取示例数据。'),
      _createActivity('tool_result', 'done', '生成查询结果', '已整理结论、数据摘要和可展开报告卡片。')
    ])

    if (_isEmployeeCertificationSkillQuery(payload.text || payload.userMsg || '')) {
      return _runEmployeeCertificationSkill(payload, { recordUser: false })
    }

    _recordTaskLog('skill', `完成授权查询：${scenario.skillLabel}`, scenario.pageId)
    _recordAssistantReply(payload, _queryableSkillAuthorizedReply(payload, scenario))
    _clearActivityItems()

    if (scenario.pageId !== payload.pageId) {
      const targetPath = pageIdToPath(scenario.pageId)
      const runtime = context.appStore || context.router ? context : pending.context
      if (targetPath) {
        runtime.appStore?.ensureStaticTab?.(scenario.pageId)
        runtime.appStore?.setActiveStaticTab?.(scenario.pageId)
        runtime.router?.push(targetPath)
      }
    }
    return true
  }

  function _queryableSkillAuthorizedReply(payload: ComposerPayload, scenario: QueryableSkillAuthScenario) {
    const sourcePageLabel = getPageLabel(scenario.pageId) || getPageLabel(payload.pageId) || scenario.skillLabel
    return [
      `「${scenario.skillLabel}」示例查询已完成。`,
      '',
      '## 查询口径',
      `- 当前菜单：${scenario.groupLabel} / ${sourcePageLabel}`,
      `- 用户问题：${payload.text || payload.userMsg}`,
      '- 权限范围：只读取本次示例数据，不执行写入、发布、导出或配置变更。',
      '',
      `## ${scenario.resultTitle}`,
      ...scenario.resultBullets.map(item => `- ${item}`),
      '',
      '## 后续动作',
      '- 已生成可展开报告卡片，可继续查看完整报告。',
      '- 如后续需要导出、发布、写入或调整配置，AI 助手会再次请求授权。'
    ].join('\n')
  }

  function _isEmployeeCertificationSkillQuery(text: string) {
    const source = String(text || '')
    if (!/认证/.test(source)) return false
    const hasTimeRange = [
      /上周|上一周|上个星期|本周|这周|这个星期/,
      /上月|上个月|本月|这个月|近一个月|最近一个月/,
      /最近|近\s*(?:\d+|一|二|两|三|四|五|六|七|八|九|十)\s*(?:天|日|周|星期)/,
      /\d{1,4}[年/.\-]\d{1,2}(?:月|[/.\-])\d{1,2}日?/,
      /今天|今日|昨天|昨日/
    ].some(pattern => pattern.test(source))
    const dimensions = [
      /职场|员工|人群/,
      /数据|情况|趋势|分析|总结|汇总|看一下|查看|查询/,
      /人群画像|用户画像/,
      /购买转化|认证转化|转化率|认证和转化|认证与转化/,
      /gmv|成交额/i,
      /爆款商品|热销商品|top\s*\d*\s*商品/i
    ]
    const matchedDimensions = dimensions.filter(pattern => pattern.test(source)).length
    return matchedDimensions >= 2 && (hasTimeRange || matchedDimensions >= 4)
  }

  function _runEmployeeCertificationSkill(payload: ComposerPayload, options: { recordUser?: boolean } = {}) {
    if (options.recordUser !== false) _recordMessage('user', payload.userMsg)
    const reportData = createEmployeeCertificationReport({
      prompt: payload.text || payload.userMsg
    })
    _setActivityItems([
      _createActivity('thinking', 'done', '解析查询时间', `已将用户输入解析为 ${reportData.parsedTimeText}。`),
      _createActivity('tool_call', 'done', '调用 presentation-employee-cert', '已按解析后的时间区间读取认证、交易、GMV 和商品维度数据。'),
      _createActivity('tool_result', 'done', '汇总数据明细', '已完成 LenovoID 去重、认证规模、购买转化、GMV 和人群画像计算。'),
      _createActivity('streaming', 'done', '生成查询结果', '查询结论、数据明细和可展开的可视化报告已就绪。')
    ])

    const reply = _employeeCertificationSkillReply(reportData)
    const sourcePage = payload.pageId || 'employee.overview'
    const sourcePageLabel = getPageLabel(sourcePage) || '职场员工概览'
    const metricValue = (label: string) => reportData.metrics.find(item => item.label === label)?.value || '-'
    const report: ReportArtifact = {
      id: `skill_report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: `职场认证与购买转化分析 · ${reportData.dateStart} 至 ${reportData.dateEnd}`,
      sourcePage,
      sourcePageLabel,
      groupLabel: getGroupLabel(sourcePage) || '在职员工管理',
      summary: `${reportData.parsedTimeText}：独立认证用户 ${metricValue('已认证独立用户')} 人，购买转化率 ${metricValue('认证购买转化率')}，GMV ${metricValue('总 GMV')}。`,
      chips: ['职场认证', '购买转化', reportData.dateStart, reportData.dateEnd],
      content: reply,
      reportData,
      createdAt: new Date().toISOString()
    }
    AI_REPORT_ARTIFACTS[report.id] = report
    _recordTaskLog('skill', `查询职场认证与转化：${reportData.dateStart} 至 ${reportData.dateEnd}`, sourcePage)
    _recordMessage('assistant', reply, {
      renderMode: 'typewriter',
      artifacts: [report.id],
      activityItems: _snapshotActivities()
    })
    _clearActivityItems()
    return true
  }

  function _employeeCertificationSkillReply(report: SkillApplicationReportData) {
    const metric = (label: string) => report.metrics.find(item => item.label === label)?.value || '-'
    const metricNote = (label: string) => report.metrics.find(item => item.label === label)?.note || ''
    const totalGmv = Number(metric('总 GMV').replace(/[^\d]/g, '')) || 0
    const totalGmvText = totalGmv >= 10_000
      ? `${(totalGmv / 10_000).toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 万元`
      : metric('总 GMV')
    const topProducts = report.products.slice(0, 3)
    const topRoles = report.roles.slice(0, 3)
    const topIndustries = report.industries.slice(0, 3)
    const peakDays = [...report.dailyTrend].sort((a, b) => b.value - a.value).slice(0, 2)

    return [
      `已按你的查询时间完成分析：**${report.parsedTimeText}**。`,
      '',
      '## 查询结论',
      `- 区间内共有 **${metric('已认证独立用户')} 名独立认证用户**，其中 **${metric('已购用户')} 人**完成购买，认证购买转化率为 **${metric('认证购买转化率')}**。`,
      `- 共产生 **${metricNote('已购用户')}**，总 GMV 为 **${totalGmvText}**，平均客单价为 **${metric('平均客单价')}**。`,
      `- 仍有 **${metric('认证未购池')} 名认证未购用户**，是后续召回和商品推荐的主要增量人群。`,
      '',
      '## 数据明细',
      '| 指标 | 结果 | 说明 |',
      '| --- | ---: | --- |',
      `| 已认证独立用户 | ${metric('已认证独立用户')} 人 | ${report.dayCount} 天累计，按 LenovoID 去重 |`,
      `| 已购用户 | ${metric('已购用户')} 人 | ${metricNote('已购用户')} |`,
      `| 认证购买转化率 | ${metric('认证购买转化率')} | 已购用户 ÷ 已认证独立用户 |`,
      `| 总 GMV | ${totalGmvText} | SMB 渠道支付成功订单 |`,
      `| 平均客单价 | ${metric('平均客单价')} | 总 GMV ÷ 订单笔数 |`,
      `| 认证未购池 | ${metric('认证未购池')} 人 | 可用于后续召回圈选 |`,
      '',
      '## 趋势与人群',
      `- ${peakDays[0]?.label} 为认证峰值，新增 ${peakDays[0]?.value} 人；${peakDays[1]?.label} 次之，新增 ${peakDays[1]?.value} 人。`,
      `- 认证方式以${report.methods[0]?.label}为主，共 ${report.methods[0]?.value} 人，占 ${report.methods[0]?.share}。`,
      `- 岗位人群主要为${topRoles.map(item => `${item.label} ${item.value} 人`).join('、')}；行业前三为${topIndustries.map(item => `${item.label} ${item.value} 人`).join('、')}。`,
      '',
      '## 爆款商品',
      ...topProducts.map((item, index) => `${index + 1}. **${item.label}**：${item.value} 名认证已购用户，占已购用户 ${item.share}。`),
      '',
      '## 对应报告',
      `已生成 **${report.dateStart} 至 ${report.dateEnd}** 的完整可视化报告，包含认证趋势、时段分布、人群画像、购买转化、GMV 和 Top10 商品。点击下方报告卡片中的“展开报告”即可查看。`
    ].join('\n')
  }

  function _matchNavigationTarget(text: string): string | null {
    const source = String(text || '').toLowerCase()
    const analysisSignals = [
      /总结|汇总|数据情况|综合分析/,
      /近两周|最近\s*14\s*天|近\s*14\s*天/,
      /人群画像|用户画像/,
      /购买转化|认证转化|转化率/,
      /爆款商品|热销商品|top\s*\d*\s*商品/
    ]
    const isCompoundAnalysis = analysisSignals.filter(pattern => pattern.test(source)).length >= 2
    const hasExplicitNavVerb = /打开|进入|跳转|切到|切换/.test(source)
    const isShortViewCommand = /^\s*(?:请|帮我|麻烦)?\s*查看/.test(source) && source.length <= 24

    // “查看 GMV”等词可能只是复合分析任务中的一个数据维度，不能据此切走当前会话。
    if (isCompoundAnalysis && !hasExplicitNavVerb) return null

    const entries: Array<[string, string[]]> = [
      ['portal.home', ['联想门户工作台', '首页', 'home']],
      ['dashboard.overview', ['运营总览', '运营概览']],
      ['pipeline.annotate', ['query 分析', 'query分析', '查询分析']],
      ['pipeline.quality', ['质量分析', '质量']],
      ['ops.traffic', ['流量分析', '流量']],
      ['ops.gmv', ['gmv 分析', 'gmv']],
      ['dashboard.geo', ['geo 看板', 'geo概览', '整体数据概览']],
      ['dashboard.geoSource', ['信源分布', '平台信源']],
      ['dashboard.geoIntent', ['意图分布']],
      ['dashboard.geoConversion', ['geo 转化', '转化看板']],
      ['dashboard.geoKnowledge', ['手工上传知识', '上传知识']],
      ['employee.overview', ['职场员工概览', '员工概览']],
      ['employee.certification', ['职场员工审核', '认证审核', '员工认证']],
      ['lead.dashboard', ['线索看板']],
      ['lead.pool', ['线索池']],
      ['lead.score', ['打分模型']],
      ['agent.skills', ['skill hub', '技能包管理']],
      ['agent.skillCreate', ['创建 skill', '创建skill', '创建技能']],
      ['agent.permissions', ['权限管理']]
    ]
    const matched = entries.find(([, aliases]) => aliases.some(alias => source.includes(alias.toLowerCase())))
    return matched && (hasExplicitNavVerb || isShortViewCommand || source.length <= 16) ? matched[0] : null
  }

  function _isSkillCreateIntent(text: string) {
    const source = String(text || '').trim()
    if (!source || /skillhub|skill\s*hub|技能包管理|skill\s*管理|技能管理/i.test(source)) return false
    return /(?:创建|新建|新增|搭建|配置|定义|做|建立|弄).{0,10}(?:skill|技能|能力)/i.test(source)
      || /(?:skill|技能|能力).{0,10}(?:创建|新建|新增|搭建|配置|定义)/i.test(source)
      || /(?:create|new|build).{0,10}skill/i.test(source)
  }

  function _isReportIntent(text: string) {
    return /生成|创建|展开|预览|输出|整理/.test(text || '') && /报告|报表|复盘|分析|总结|解读/.test(text || '')
  }

  function _shouldCreateReportArtifact(payload: ComposerPayload, reply: string) {
    const text = `${payload?.text || payload?.userMsg || ''}\n${reply || ''}`
    if (_isRemoteFailureReply(reply)) return false
    return _isReportIntent(text) || /##|核心结论|建议动作|指标|异常/.test(reply || '')
  }

  function _createReportArtifact(payload: ComposerPayload, reply: string): ReportArtifact {
    const sourcePage = payload.pageId || 'portal.home'
    const sourcePageLabel = getPageLabel(sourcePage) || '当前页面'
    const title = _reportTitle(payload.text || payload.userMsg || '', sourcePageLabel)
    const isSkillApplicationReport = sourcePage === 'agent.skills'
      || sourcePage === 'agent.skillCreate'
      || /presentation-employee-cert|职场员工审核|认证转化/i.test(`${payload.text || ''}\n${reply || ''}`)
    return {
      id: `ai_report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      sourcePage,
      sourcePageLabel,
      groupLabel: getGroupLabel(sourcePage) || 'AI 报告',
      summary: _reportSummary(reply, sourcePageLabel),
      chips: _reportChips(payload.text || reply || '', sourcePageLabel),
      content: _normalizeReportContent(reply, sourcePageLabel, payload),
      ...(isSkillApplicationReport
        ? { reportData: createEmployeeCertificationReport({ prompt: payload.text || payload.userMsg }) }
        : {}),
      createdAt: new Date().toISOString()
    }
  }

  function _buildPageContext(pageId: string) {
    const safePageId = pageId || 'portal.home'
    const pageLabel = getPageLabel(safePageId) || '当前页面'
    const groupLabel = getGroupLabel(safePageId) || '工作台'
    return [
      '【当前工作台上下文】',
      `- 当前页面：${pageLabel}`,
      `- 页面 ID：${safePageId}`,
      `- 所属模块：${groupLabel}`,
      '- 回答要求：先说明口径、影响范围和需要确认的动作；涉及写入、发布、导出时必须等待确认。'
    ].join('\n')
  }

  function _buildPageDataContext(pageId: string) {
    if (pageId !== 'dashboard.overview') return ''
    return [
      '【当前页面可见数据】',
      '- 页面：运营总览；数据日期：2026-06-16。',
      '- 顶部指标：DAU 39.0万，WAU 184.0万，MAU 639.9万，GMV 9801.7万。',
      '- 关键经营链路：登录用户 19.1万，互动用户 10.7万，购买人数 9,212 人，成交 GMV 9801.7万。',
      '- 链路转化：互动转化 55.9%，购买转化 8.6%，客单价 ¥10,640。',
      '- GMV 结构：消费业务 7836.6万，占比 80.0%；SMB 业务 1820.3万，占比 18.6%；政企业务 144.8万，占比 1.5%。',
      '- 平台结构：非官网 6604.4万，占比 67.4%；官网 3197.2万，占比 32.6%；官网客单价 ¥8,911，非官网客单价 ¥11,743。',
      '- 趋势速览：DAU 较首日 +16.7%，互动用户较首日 +50.0%，GMV 较首日 +205.7%。',
      '- 口径限制：只围绕页面展示的运营数据、经营链路、GMV 结构和趋势输出；不要引入风控、策略命中、DPL、限购等无关主题。'
    ].join('\n')
  }

  function _recordTaskLog(type: string, title: string, pageId = '') {
    taskLogs.value.unshift({
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      pageId,
      pageLabel: getPageLabel(pageId) || '当前页面',
      at: new Date().toISOString(),
      status: '已完成'
    })
    taskLogs.value = taskLogs.value.slice(0, 50)
  }

  function _createActivity(
    kind: ConversationActivityKind,
    status: ConversationActivityStatus,
    title: string,
    detail = ''
  ): ConversationActivityItem {
    return {
      id: `act_${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind,
      status,
      title,
      detail
    }
  }

  function _setActivityItems(items: ConversationActivityItem[]) {
    activityItems.value = items
  }

  function _clearActivityItems() {
    activityItems.value = []
  }

  function _snapshotActivities() {
    return activityItems.value.map(item => ({ ...item }))
  }

  function _markActivityDone(kind: ConversationActivityKind) {
    activityItems.value = activityItems.value.map(item =>
      item.kind === kind && item.status !== 'failed'
        ? { ...item, status: 'done' }
        : item
    )
  }

  function _settleActivity(
    kind: ConversationActivityKind,
    status: ConversationActivityStatus,
    title?: string,
    detail?: string
  ) {
    let matched = false
    activityItems.value = activityItems.value.map(item => {
      if (item.kind !== kind) return item
      matched = true
      return {
        ...item,
        status,
        title: title || item.title,
        detail: detail || item.detail
      }
    })
    if (!matched && title) {
      activityItems.value = [...activityItems.value, _createActivity(kind, status, title, detail || '')]
    }
  }

  function _hasActivityKind(kind: ConversationActivityKind) {
    return activityItems.value.some(item => item.kind === kind)
  }

  function _upsertActivity(
    kind: ConversationActivityKind,
    status: ConversationActivityStatus,
    title: string,
    detail = ''
  ) {
    const current = activityItems.value.find(item => item.kind === kind && item.title === title)
    if (current) {
      activityItems.value = activityItems.value.map(item =>
        item.id === current.id ? { ...item, status, detail: detail || item.detail } : item
      )
      return
    }
    activityItems.value = [...activityItems.value, _createActivity(kind, status, title, detail)]
  }

  function _baseRunningActivities(payload: ComposerPayload) {
    const pageLabel = getPageLabel(payload.pageId) || '当前页面'
    return [
      _createActivity('thinking', 'running', '理解任务意图', `结合「${pageLabel}」页面上下文、快捷标签和附件内容判断任务类型。`),
      _createActivity('tool_call', 'running', '调用大模型会话接口', `向 ${HARNESS_CHAT_ENDPOINT} 发送当前消息与页面上下文。`),
      _createActivity('tool_result', 'pending', '等待工具结果', '接口返回后会转换为回复、报告卡片或后续动作。')
    ]
  }

  function _demoTodoList(): TodoListBlock {
    return {
      title: 'Todo List',
      done: 0,
      total: 9,
      items: [
        { id: 'todo-1', text: '校验当前状态与生成前确认', status: 'running' },
        { id: 'todo-2', text: '调用 pre_generate_scripts 生成脚本产物', status: 'pending' },
        { id: 'todo-3', text: '生成 SKILL.md', status: 'pending' },
        { id: 'todo-4', text: '确认脚本输出已写入 SKILL.md', status: 'pending' },
        { id: 'todo-5', text: '生成 evals/evals.json', status: 'pending' },
        { id: 'todo-6', text: '生成 references/api-contracts.md', status: 'pending' },
        { id: 'todo-7', text: '生成 references/call-chain.md', status: 'pending' },
        { id: 'todo-8', text: '生成 references/field-rules.md', status: 'pending' },
        { id: 'todo-9', text: '最终校验所有必需产物', status: 'pending' }
      ]
    }
  }

  function _reportActivities(payload: ComposerPayload) {
    const pageLabel = getPageLabel(payload.pageId) || '当前页面'
    return [
      _createActivity('thinking', 'done', '识别报告意图', `确认要围绕「${pageLabel}」生成分析报告。`),
      _createActivity('tool_call', 'done', '生成报告 artifact', '已创建可展开、可下载的报告卡片。'),
      _createActivity('tool_result', 'done', '报告结果已就绪', '点击展开报告可进入顶部动态页签。'),
      _createActivity('follow_up', 'blocked', '等待补充口径', '可继续补充时间范围、指标口径或异常项。')
    ]
  }

  function _appendPostReplyActivities(payload: ComposerPayload, reply: string) {
    const text = `${payload?.text || ''}\n${reply || ''}`
    if (/确认|是否|需要|范围|审批|导出|发布|写入|配置/.test(text)) {
      _upsertActivity('confirm', 'blocked', '等待用户确认', '涉及范围、权限、导出、发布或配置变更前，需要用户确认。')
    } else {
      _upsertActivity('follow_up', 'blocked', '可继续追问', '可以继续补充条件、要求生成报告，或执行下方推荐动作。')
    }
  }

  function _createActionReport(pageId: string, titleHint = ''): ReportArtifact {
    const sourcePage = pageId || 'portal.home'
    const label = getPageLabel(sourcePage) || '当前页面'
    const title = titleHint || `${label} · 运营分析报告`
    return {
      id: `ai_action_report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      sourcePage,
      sourcePageLabel: label,
      groupLabel: getGroupLabel(sourcePage) || 'AI 报告',
      summary: `围绕「${label}」生成的本地 mock 报告，用于验证 Agent 任务动作到动态页签的交互。`,
      chips: _reportChips(titleHint, label),
      content: `# ${title}

## 核心结论
- 当前报告来自 Agent 任务动作，已按封板项目的动态页签规范打开。
- 静态页签保留业务页面上下文，报告作为动态页签展示。
- 超过 10 个动态页签时，会自动关闭最早打开的非活跃报告。

## 建议动作
- 对比当前页面指标、筛选项和报告摘要是否一致。
- 继续走查下载、关闭、切换和暗色模式下的样式表现。`,
      createdAt: new Date().toISOString()
    }
  }

  function _reportIntentReply(payload: ComposerPayload) {
    const label = getPageLabel(payload.pageId) || '当前页面'
    const query = payload.text || payload.userMsg || '生成报告'
    return `已生成「${label}」的报告草稿。

## 核心结论
- 已根据你的请求「${query}」整理为动态报告卡片。
- 报告会以 Agent 卡片形式出现在对话区，点击“展开报告”进入顶部动态页签。
- 当前为 Vue 预览假数据，重点用于走查报告卡片、页签联动和下载。

## 建议动作
- 先检查报告标题、来源页面和标签是否符合预期。
- 再验证动态页签打开、关闭、最多 10 个的限制和暗色模式样式。`
  }

  function _reportTitle(text: string, pageLabel: string) {
    if (pageLabel === '运营总览' || /运营总览|DAU|WAU|MAU|关键经营链路|GMV结构|经营链路/i.test(text)) {
      if (/漏斗|转化链路|登录|互动|购买/.test(text)) return '运营总览 · 转化链路分析'
      if (/gmv|成交|结构|客单价/i.test(text)) return '运营总览 · GMV 结构解读'
      return '运营总览 · 经营指标解读'
    }
    if (/质量/.test(text)) return '质量分析 · 数据解读报告'
    if (/流量/.test(text)) return '流量分析 · 入口质量报告'
    if (/gmv/i.test(text)) return 'GMV 分析 · 业务贡献报告'
    if (/geo/i.test(text)) return 'GEO 看板 · 汇总分析'
    if (/线索/.test(text)) return '线索看板 · 转化分析'
    if (/风控|限购|dpl/i.test(text)) return '风控概况 · 策略命中分析'
    return `${pageLabel} · 数据解读报告`
  }

  function _reportSummary(reply: string, pageLabel: string) {
    const firstBullet = String(reply || '').split('\n').find(line => /^[-•]\s+/.test(line))
    return firstBullet
      ? firstBullet.replace(/^[-•]\s+/, '').slice(0, 90)
      : `围绕「${pageLabel}」生成的本地动态报告，可用于检查 Agent 卡片和顶部动态页签联动。`
  }

  function _reportChips(text: string, pageLabel: string) {
    const chips = [pageLabel]
    const chipRules: Array<[string, RegExp]> = [
      ['质量', /质量|点踩|差评/],
      ['Query', /query|查询|无答案/i],
      ['流量', /流量|dau|入口/i],
      ['GMV', /gmv|购买|成交/i],
      ['GEO', /geo|信源|意图/i],
      ['线索', /线索|客户|转化/],
      ['风控', /风控|限购|dpl/i],
      ['报告', /报告|报表|复盘|总结|解读/]
    ]
    chipRules.forEach(([chip, reg]) => {
      if (pageLabel === '运营总览' && chip === '风控') return
      if (reg.test(text || '') && !chips.includes(chip)) chips.push(chip)
    })
    return chips.slice(0, 4)
  }

  function _isRemoteFailureReply(reply: string) {
    return /未配置火山引擎|火山引擎暂不可用|火山引擎调用失败|无法完成真实页面解读|接口失败后未返回火山引擎结果/.test(reply || '')
  }

  function _sanitizeModelVendorName(text: string) {
    return _stripSeedDebugBlocks(text)
      .replace(/火山模型/g, '大模型')
      .replace(/火山引擎/g, '大模型')
  }

  function _stripSeedDebugBlocks(text: string) {
    return String(text || '')
      .replace(/<seed:[^>]+\/>/g, '')
      .replace(/<seed:[^>]+>[\s\S]*?(?:<\/seed:[^>]+>|$)/g, '')
      .trim()
  }

  function _normalizeReportContent(reply: string, pageLabel: string, payload: ComposerPayload) {
    if (/^#\s/m.test(reply || '')) return reply
    return `# ${pageLabel} · 数据解读报告

${reply || _reportIntentReply(payload)}

## 来源信息
- 来源页面：${pageLabel}
- 生成方式：AI 对话
- 数据类型：本地 mock 数据`
  }

  function _taskActionItems(payload: ComposerPayload, reply: string): TaskAction[] {
    const text = `${payload?.text || payload?.userMsg || ''}\n${reply || ''}`
    const actions: TaskAction[] = []
    if (_shouldCreateReportArtifact(payload, reply)) {
      actions.push({ type: 'report', label: '重新生成报告', value: `${getPageLabel(payload.pageId) || '当前页面'} · 运营分析报告` })
    }
    actions.push({ type: 'prompt', label: '补充异常项', value: '请补充当前页面需要重点关注的异常项，并按优先级排序。' })
    if (/skill|技能|配置|发布|审批/i.test(text)) {
      actions.push({ type: 'skill', label: '查看 Skill Hub', value: 'agent.skills' })
    }
    if (payload?.pageId && payload.pageId !== 'portal.home') {
      actions.push({ type: 'navigate', label: '回到联想门户工作台', value: 'portal.home' })
    }
    return actions.slice(0, 3)
  }

  function _createDemoReports(pageId: string): ReportArtifact[] {
    const now = new Date().toISOString()
    return [
      {
        id: 'demo_quality_report',
        title: '质量分析 · 数据解读报告',
        sourcePage: 'pipeline.quality',
        sourcePageLabel: '质量分析',
        groupLabel: '乐享运营',
        summary: '用于走查动态页签、报告页头、下载和关闭按钮的质量分析 mock 报告。',
        chips: ['质量分析', '点踩率', '性能', '异常监控'],
        content: `# 质量分析 · 数据解读报告

## 核心结论
- 点踩率维持在 1.42%，售后咨询和商品推荐是主要问题来源。
- 首 token P95 为 2.6s，问答类正文链路存在局部抖动。
- MCP 工具超时样本集中在保修查询与网点查询。

## 建议动作
- 优先补齐售后政策类知识，并对高频未命中 Query 建立标注闭环。
- 将工具超时按场景拆分，单独观察保修查询链路。`,
        createdAt: now
      },
      {
        id: 'demo_ops_preview',
        title: '运营总览 · 数据解读报告',
        sourcePage: pageId || 'dashboard.overview',
        sourcePageLabel: '运营总览',
        groupLabel: '乐享运营',
        summary: '汇总访问、活跃、交易和核心趋势，可展开查看运营总览报告。',
        chips: ['运营总览', '活跃', 'GMV'],
        previewHtml: '<!doctype html><html><body style="font-family:-apple-system,PingFang SC,sans-serif;padding:28px;background:#f6f8fb;color:#1f2329"><h1 style="font-size:22px;margin:0 0 12px">运营总览预览报告</h1><p style="color:#646a73">这是用于走查动态页签 iframe 预览样式的 mock 内容。</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px"><section style="background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:16px"><b>访问用户</b><div style="font-size:26px;font-weight:700;margin-top:8px">128.6万</div></section><section style="background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:16px"><b>活跃会员</b><div style="font-size:26px;font-weight:700;margin-top:8px">42.3万</div></section><section style="background:#fff;border:1px solid #e5e6eb;border-radius:10px;padding:16px"><b>异常预警</b><div style="font-size:26px;font-weight:700;margin-top:8px">7</div></section></div></body></html>',
        createdAt: now
      },
      {
        id: 'demo_geo_saved',
        title: 'GEO 转化看板 · 汇总分析',
        sourcePage: 'dashboard.geoConversion',
        sourcePageLabel: 'GEO 转化看板',
        groupLabel: 'GEO 看板',
        summary: '用于走查下载、长标题截断和跨分组报告来源展示。',
        chips: ['GEO', '转化', '可下载'],
        content: `# GEO 转化看板 · 汇总分析

## 转化概览
- 总转化 3,416，官网承接占比 61.2%。
- 豆包、Kimi、通义是当前主要来源平台。
- 企业线索增长明显，但电商页承接仍需优化。

## 下一步
- 将高转化 Query 沉淀为官方知识条目。
- 对非官网路径做来源归因和内容一致性检查。`,
        createdAt: now
      },
      {
        id: 'demo_query_review',
        title: 'Query 分析 · 质量复盘',
        sourcePage: 'pipeline.annotate',
        sourcePageLabel: 'Query 分析',
        groupLabel: '乐享运营',
        summary: '用于走查 Query 分析来源的动态页签，包含无答案率、意图命中和标注闭环建议。',
        chips: ['Query', '无答案率', '标注闭环'],
        content: `# Query 分析 · 质量复盘

## 核心结论
- 高频无答案 Query 集中在活动政策、驱动下载和企业采购报价。
- 意图命中率稳定，但多意图 Query 的拆解仍不充分。
- 差评样本需要按“知识缺失、意图识别错误、回答不完整”拆分处理。

## 建议动作
- 将活动政策和驱动下载补充为结构化 FAQ。
- 对企业采购报价类 Query 增加信息收集表单。
- 将差评 Query 自动流转到标注队列。`,
        createdAt: now
      },
      {
        id: 'demo_lead_report',
        title: '线索看板 · 转化分析',
        sourcePage: 'lead.dashboard',
        sourcePageLabel: '线索看板',
        groupLabel: '企业客户管理',
        summary: '用于走查企业客户来源的动态页签，关注线索评分、负责人跟进和阶段转化。',
        chips: ['线索', '企业客户', '转化'],
        content: `# 线索看板 · 转化分析

## 核心结论
- 高意向线索主要来自企业采购、方案咨询和 AI 搜索入口。
- 跟进中线索积压在“报价确认”和“方案匹配”两个阶段。
- 部分高分线索缺少负责人，影响首响效率。

## 建议动作
- 将 85 分以上线索自动分配给行业负责人。
- 对报价确认阶段增加提醒和超时升级。
- 在 AI 助手中补充企业采购问询的标准采集字段。`,
        createdAt: now
      },
      ...([
        ['demo_employee_report', '在职员工管理 · 职场员工审核分析', 'employee.certification', '职场员工审核', '在职员工管理', ['员工', '认证', '审核'], '职场员工审核积压集中在劳动合同和个税视频两类材料，需要优化审核分流。'],
        ['demo_gmv_report', 'GMV 分析 · 业务贡献分析', 'ops.gmv', 'GMV 分析', '乐享运营', ['GMV', '购买', '客单价'], '消费商品贡献主要 GMV，SMB 商品增长稳定，政企商品需要提升线索承接。'],
        ['demo_traffic_report', '流量分析 · 入口质量分析', 'ops.traffic', '流量分析', '乐享运营', ['流量', 'DAU', '入口'], 'App 首页和服务频道流量稳定，活动页转化效率低于整体均值。'],
        ['demo_geo_source_report', 'GEO 信源分布 · 引用分析', 'dashboard.geoSource', '各平台信源分布', 'GEO 看板', ['GEO', '信源', '引用'], '官方信源引用稳定，但社区信源内容一致性需要进一步校验。'],
        ['demo_skill_report', 'Skill Hub · 启停状态分析', 'agent.skills', 'Skill Hub', 'AI 助手', ['Skill', '审批', '启停'], '报告生成和知识维护 Skill 使用频次较高，部分 Skill 待审批时间偏长。']
      ] satisfies Array<[string, string, string, string, string, string[], string]>).map(([id, title, sourcePage, sourcePageLabel, groupLabel, chips, summary]) => ({
        id,
        title,
        sourcePage,
        sourcePageLabel,
        groupLabel,
        summary,
        chips,
        content: `# ${title}

## 核心结论
- ${summary}
- 当前报告用于验证 Agent 输出 artifact 到动态页签的打开、切换、关闭和超限逻辑。
- 连续展开超过 10 个报告时，系统会自动关闭最早打开的非活跃动态页签。

## 建议动作
- 保留当前静态业务页上下文，不把报告写入静态页签。
- 检查动态页签标题截断、下载和关闭后的回退行为。
- 后续接入真实数据时，替换这里的 mock content 和 summary。`,
        ...(sourcePage === 'agent.skills' ? { reportData: createEmployeeCertificationReport() } : {}),
        createdAt: now
      }))
    ]
  }

  function _scopeDemoReports(reports: ReportArtifact[]) {
    return reports.map(report => ({
      ...report,
      id: `${report.id}__${localConvId.value}`,
      conversationId: localConvId.value
    }))
  }

  function _persistConversation() {
    if (!messages.value.length) return
    const current = {
      id:           localConvId.value,
      remoteConvId: convId.value || null,
      title:        _convTitle(),
      messages:     messages.value,
      reports:      _currentConversationReports(),
      updatedAt:    new Date().toISOString()
    }
    const list = loadConversations().filter(c => c.id !== current.id)
    saveConversations([current, ...list])
  }

  function _currentConversationReports() {
    const reportIds = new Set(messages.value.flatMap(message => message.artifacts || []))
    return [...reportIds]
      .map(id => AI_REPORT_ARTIFACTS[id])
      .filter((report): report is ReportArtifact => !!report && report.conversationId === localConvId.value)
  }

  function _convTitle() {
    const first = messages.value.find(m => m.role === 'user' && m.text)
    if (!first) return '新会话'
    return first.text.replace(/\s+/g, ' ').replace(/^📎\s*/, '').slice(0, 28) || '新会话'
  }

  function _mockReply(payload: ComposerPayload, error: unknown) {
    const label = payload.shortcut || activeShortcut.value || '当前任务'
    const message = error instanceof Error ? _sanitizeModelVendorName(error.message) : ''
    return [
      `已收到「${label}」请求。`,
      '',
      payload.contextSummary || '',
      '',
      `> ${payload.text || payload.userMsg}`,
      '',
      '- 大模型暂不可用，未完成真实页面解读。',
      '- 我没有生成本地 mock 分析内容，避免把演示兜底误当成真实结论。',
      '',
      message ? `调用失败原因：${message}` : ''
    ].filter(Boolean).join('\n')
  }

  function _delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function isShortcutLabel(label: string): label is ShortcutLabel {
    return shortcuts.value.includes(label as ShortcutLabel)
  }

  function readJsonArray<T>(key: string): T[] {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(value) ? value as T[] : []
    } catch {
      return []
    }
  }

  return {
    open, convId, localConvId, messages, loading,
    queuedMessages, queueNotice, taskLogs, activityItems, skillTuneConfirmation,
    panelWidth, autoCollapsedSidebar,
    inputText, attachedFile, attachedFiles, activeShortcut, shortcuts, inputPlaceholder,
    toggleOpen, restoreState, maxPanelWidth, setPanelWidth,
    newConversation, send, stopCurrentResponse, quickSend, sendShortcut, runTaskAction, applyScenarioPackage,
    setShortcut, shortcutQuery, attachFile, clearFile,
    seedDemoReportCards, openReportArtifact,
    loadConversations, saveConversations, restoreConversation, deleteConversation
  }
})
