<template>
  <div class="ai-messages" id="ai-messages" ref="messagesEl" @scroll.passive="onMessagesScroll">
    <template v-if="showWelcome">
      <div class="ai-msg assistant ai-welcome-msg">
        <div class="bubble ai-message-bubble">
          <div class="ai-empty-state ai-doc-flow">
            <div class="ai-doc-message">
              <p>你好！我是乐享 AI 助手。</p>
              <p>你可以在底部输入框里直接描述要完成的运营任务，例如查数据、生成报告、配置商品或查询知识库。涉及写入或发布时，我会先展示影响范围并等待确认。</p>
            </div>
            <div class="ai-doc-prompt-group" aria-label="推荐提问">
              <button type="button" class="ai-doc-prompt" @click="$emit('quick-send', '帮我说明联想门户工作台当前可以怎么使用')">
                <span><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h10v12H5z"/><path d="M8 8h4M8 11h4"/></svg></span>
                <b>工作台说明</b>
              </button>
              <button type="button" class="ai-doc-prompt" @click="$emit('quick-send', '帮我生成一份运营任务报告草稿，先列出需要的参数')">
                <span><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h5l3 3v11H6z"/><path d="M11 3v3h3M8 10h4M8 13h5"/></svg></span>
                <b>生成报告</b>
              </button>
              <button type="button" class="ai-doc-prompt" @click="$emit('quick-send', '查询知识库，帮我按关键词整理相关条目')">
                <span><svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.2c1.8-.8 3.5-.8 5.2 0v10.5c-1.7-.8-3.4-.8-5.2 0zM10.8 5.2c1.7-.8 3.4-.8 5.2 0v10.5c-1.8-.8-3.5-.8-5.2 0z"/></svg></span>
                <b>查询知识库</b>
              </button>
            </div>
          </div>
          <time class="time ai-message-time ai-welcome-time" :datetime="welcomeAt">
            {{ formatMessageTimestamp(welcomeAt) }}
          </time>
        </div>
      </div>
    </template>

    <template v-for="group in messageGroups" :key="group.key">
      <div v-if="groupProcessItems(group).length" class="ai-msg assistant ai-state-row">
        <AgentConversationStates
          presentation="cards" :items="groupProcessItems(group)"
          :cards-expanded="processExpanded[processKey(group)] ?? false" :card-expanded="processCardsExpanded[processKey(group)] || {}"
          @update:cards-expanded="processExpanded[processKey(group)] = $event" @update:card-expanded="processCardsExpanded[processKey(group)] = $event"
        />
      </div>
      <div class="ai-msg" :class="[group.role, { 'ai-merged-reply': group.role === 'assistant', 'ai-structured-msg': group.parts.some(part => isStructuredMessage(part.msg)) }]">
        <div class="bubble ai-message-bubble">
          <div
            v-for="{ msg, idx } in group.parts" :key="msg.id || `${msg.role}-${msg.at}-${idx}`" :data-agent-message-index="idx" class="ai-answer-part"
            :class="{ 'ai-structured-msg': isStructuredMessage(msg), 'ai-typewriter-msg': isTypewriterMessage(msg), 'ai-typewriter-done': isTypewriterDone(msg, idx) }"
          >
            <div class="ai-answer-body" v-html="renderMsg(msg, idx)"></div>
            <AgentTaskCard
              v-if="msg.task && canShowStructuredContent(msg, idx)"
              :task="msg.task"
              @decision="forwardTaskDecision"
            />
            <details v-else-if="msg.authRequest && canShowStructuredContent(msg, idx)" class="ai-legacy-authorization">
              <summary>
                <b>{{ msg.authRequest.title }}</b>
                <span>{{ msg.authResult ? (msg.authResult.status === 'approved' ? '历史已授权' : '历史已拒绝') : '请求已过期' }}</span>
              </summary>
              <p v-if="!msg.authResult">这是历史请求，已失效；如需继续，请重新发起任务。</p>
              <p v-else>历史授权记录仅供查看，不会重新执行。</p>
              <p v-if="msg.authResult?.detail">{{ msg.authResult.detail }}</p>
              <dl>
                <div><dt>授权内容</dt><dd>{{ msg.authRequest.summary || msg.authRequest.detail }}</dd></div>
                <div><dt>授权范围</dt><dd>{{ msg.authRequest.scope || '原任务范围' }}</dd></div>
                <div><dt>影响说明</dt><dd>{{ msg.authRequest.impact || msg.authRequest.detail }}</dd></div>
              </dl>
            </details>
            <div v-if="msg.artifacts?.length && canShowStructuredContent(msg, idx)" class="ai-report-artifact-list">
              <div v-for="reportId in msg.artifacts" :key="reportId" class="ai-result-card">
                <div class="ai-result-card-head">
                  <span class="ai-result-icon" aria-hidden="true">
                    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h5l3 3v11H6z"/><path d="M11 3v3h3M8 10h4M8 13h5"/></svg>
                  </span>
                  <div>
                    <b>{{ reportDisplayTitle(reportId) }}</b>
                    <em>可展开为临时页签，多开对比</em>
                  </div>
                </div>
                <p>{{ reportArtifact(reportId)?.summary }}</p>
                <div class="ai-result-card-foot">
                  <span class="ai-result-tags">
                    <span v-for="chip in reportChips(reportId)" :key="chip">{{ chip }}</span>
                  </span>
                  <button type="button" class="secondary" @click="$emit('download-report', reportId)">下载</button>
                  <button type="button" @click="$emit('open-report', reportId)">展开报告</button>
                </div>
              </div>
            </div>
            <div v-if="msg.actionItems?.length && canShowStructuredContent(msg, idx)" class="ai-task-actions">
              <div class="ai-task-actions-title">可继续执行</div>
              <div class="ai-task-actions-row">
                <button
                  v-for="item in msg.actionItems"
                  :key="`${item.type}-${item.label}`"
                  type="button"
                  class="ai-task-btn"
                  @click="$emit('run-action', item)"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>
            <div v-if="shouldShowFeedback(msg, idx)" class="ai-reply-feedback" aria-label="回答反馈">
              <button
                type="button"
                class="ai-feedback-btn"
                :class="{ active: feedbackState(feedbackKey(msg, idx)) === 'up' }"
                title="有帮助"
                aria-label="有帮助"
                :aria-pressed="feedbackState(feedbackKey(msg, idx)) === 'up'"
                @click="setFeedback(msg, idx, 'up')"
              >
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 8.3v8.2"/><path d="M3.5 8.8h3v7.4h-3a1 1 0 0 1-1-1V9.8a1 1 0 0 1 1-1Z"/><path d="M6.5 9 10 3.8c.5-.7 1.6-.4 1.6.5v3h3.2a1.6 1.6 0 0 1 1.6 1.9l-1 5.5a2 2 0 0 1-2 1.6H6.5"/></svg>
              </button>
              <button
                type="button"
                class="ai-feedback-btn"
                :class="{ active: feedbackState(feedbackKey(msg, idx)) === 'down' }"
                title="没帮助"
                aria-label="没帮助"
                :aria-pressed="feedbackState(feedbackKey(msg, idx)) === 'down'"
                @click="setFeedback(msg, idx, 'down')"
              >
                <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 11.7V3.5"/><path d="M16.5 11.2h-3V3.8h3a1 1 0 0 1 1 1v5.4a1 1 0 0 1-1 1Z"/><path d="M13.5 11 10 16.2c-.5.7-1.6.4-1.6-.5v-3H5.2a1.6 1.6 0 0 1-1.6-1.9l1-5.5a2 2 0 0 1 2-1.6h6.9"/></svg>
              </button>
            </div>
            <time class="time ai-message-time" :datetime="messageTime(msg).datetime">
              {{ messageTime(msg).label }}
            </time>
          </div>
        </div>
      </div>
    </template>

    <div v-if="liveWithoutReply" class="ai-msg assistant ai-state-row">
      <AgentConversationStates
        presentation="cards" :items="activityItems"
        :cards-expanded="processExpanded[liveProcessKey] ?? false" :card-expanded="processCardsExpanded[liveProcessKey] || {}"
        @update:cards-expanded="processExpanded[liveProcessKey] = $event" @update:card-expanded="processCardsExpanded[liveProcessKey] = $event"
      />
    </div>

    <div v-if="shouldShowLatestTodo" class="ai-msg assistant ai-todo-bubble-row">
      <div class="ai-todo-list-block" :class="{ 'is-complete': isTodoComplete }">
        <div class="ai-todo-card">
          <button
            type="button"
            class="ai-todo-head"
            :aria-expanded="todoExpanded"
            :aria-label="todoExpanded ? '收起 Todo List' : '展开 Todo List'"
            @click="todoExpanded = !todoExpanded"
          >
            <span class="ai-todo-title">
              <span class="ai-todo-orb" aria-hidden="true"></span>
              <b>{{ latestTodoList.title }}</b>
            </span>
            <span class="ai-todo-summary">
              <span class="ai-todo-progress">{{ latestTodoList.done }}/{{ latestTodoList.total }}</span>
              <svg class="ai-todo-toggle-icon" :class="{ 'is-collapsed': !todoExpanded }" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5-5 5 5" /></svg>
            </span>
          </button>
          <div v-show="todoExpanded" class="ai-todo-list">
            <div v-for="item in latestTodoList.items" :key="item.id" class="ai-todo-item" :class="`is-${item.status}`">
              <span class="todo-status" aria-hidden="true"></span>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentExecution" class="ai-execution-row" role="status" aria-live="polite" aria-atomic="true">
      <AgentActivityIcon :name="currentExecution.icon" />
      <span class="ai-current-execution-text">{{ currentExecution.label }}</span>
      <span class="ai-execution-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import AgentConversationStates from '@/components/agent/AgentConversationStates.vue'
import AgentActivityIcon from '@/components/agent/AgentActivityIcon.vue'
import { groupAgentReplies, collectAgentProcessItems, currentAgentExecutionState, currentAgentTaskExecutionState } from '@/utils/agentProcess'
import AgentTaskCard from '@/components/agent/AgentTaskCard.vue'
import { AI_REPORT_ARTIFACTS } from '@/stores/ai'
import { getPageLabel } from '@/stores/app'
import {
  createMessageTimestampResolver,
  formatMessageTimestamp
} from '@/utils/messageTimestamp'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  activityItems: { type: Array, default: () => [] },
  currentPageId: { type: String, default: '' }
})

const emit = defineEmits(['quick-send', 'open-report', 'download-report', 'run-action'])

function forwardTaskDecision(decision) {
  emit('run-action', { type: 'auth_task_decide', label: '任务授权', decision })
}

const messagesEl = ref(null)
const followLatest = ref(true)
const processExpanded = reactive({})
const processCardsExpanded = reactive({})
const messageGroups = computed(() => groupAgentReplies(props.messages))
const liveProcessKey = computed(() => {
  const index = props.messages.findLastIndex(message => message.role === 'user')
  return props.messages[index]?.id || `user-${index}`
})
const liveReplyGroup = computed(() => {
  const group = messageGroups.value.at(-1)
  return group?.role === 'assistant' ? group : null
})
const liveWithoutReply = computed(() => props.loading && props.activityItems.length && !liveReplyGroup.value)
function processKey(group) { return group.turn || group.key }
function groupProcessItems(group) {
  if (group.role !== 'assistant') return []
  return collectAgentProcessItems(group.parts, props.loading && group === liveReplyGroup.value ? props.activityItems : [])
}
function onMessagesScroll() {
  const el = messagesEl.value
  if (el) followLatest.value = el.scrollHeight - el.scrollTop - el.clientHeight < 48
}
const executionClock = ref(Date.now())
let executionTimer
const currentExecution = computed(() => {
  if (props.loading) return currentAgentExecutionState(props.activityItems, true)
  const latest = props.messages.at(-1)
  const taskState = currentAgentTaskExecutionState(latest?.task, executionClock.value)
  if (taskState) return taskState
  if (latest && isTypewriterMessage(latest) && !isTypewriterDone(latest, props.messages.length - 1)) return { label: '正在输出回答', icon: 'write' }
  return null
})
watch(() => props.messages.at(-1)?.task, task => {
  clearInterval(executionTimer)
  executionClock.value = Date.now()
  if (typeof window !== 'undefined' && task?.expiresAt > executionClock.value && task.requests?.some(request => ['running', 'approved'].includes(request.status))) {
    executionTimer = setInterval(() => {
      executionClock.value = Date.now()
      if (executionClock.value >= task.expiresAt) clearInterval(executionTimer)
    }, 1000)
  }
}, { deep: true, immediate: true })
const typewriterText = reactive({})
const typewriterDone = reactive({})
const messageFeedback = reactive({})
const typewriterTimers = new Map()
const todoExpanded = ref(true)
const welcomeAt = ref(new Date().toISOString())
const messageTime = createMessageTimestampResolver()
const showWelcome = computed(() => !props.messages.some(msg => msg.role === 'user' && !msg.demoReportQuery))
const latestTodoMessage = computed(() => [...props.messages]
  .reverse()
  .find(message => message?.role === 'assistant' && message.todoList) || null
)
const latestTodoList = computed(() => latestTodoMessage.value?.todoList || null)
const shouldShowLatestTodo = computed(() => {
  const message = latestTodoMessage.value
  if (!message?.todoList) return false
  const index = props.messages.indexOf(message)
  return !isTypewriterMessage(message) || isTypewriterDone(message, index)
})
const isTodoComplete = computed(() => Boolean(latestTodoList.value && latestTodoList.value.done >= latestTodoList.value.total))

function scrollToBottom() {
  nextTick(() => {
    const el = messagesEl.value
    if (!el || !followLatest.value) return
    const latestIndex = props.messages.length - 1
    const task = props.messages[latestIndex]?.task
    if (task?.expiresAt > Date.now() && task.requests?.some(request => request.status === 'pending')) {
      const message = el.querySelector(`[data-agent-message-index="${latestIndex}"]`)
      const card = message?.querySelector('[data-agent-task-card]')
      if (card) {
        const viewportTop = el.getBoundingClientRect().top + el.clientTop
        const bounds = card.getBoundingClientRect()
        if (bounds.top < viewportTop || bounds.bottom > viewportTop + el.clientHeight) {
          el.scrollTop += bounds.top - viewportTop
        }
        return
      }
    }
    el.scrollTop = el.scrollHeight
  })
}

watch(() => props.messages, scrollToBottom, { deep: true })
watch(() => props.loading, scrollToBottom)
watch(liveProcessKey, () => { followLatest.value = true; scrollToBottom() })
watch(() => props.messages, syncTypewriterMessages, { deep: true, immediate: true })
watch(() => props.messages, (next, previous) => {
  if (next !== previous && !next.length) welcomeAt.value = new Date().toISOString()
})
watch(isTodoComplete, complete => { todoExpanded.value = !complete }, { immediate: true })

onBeforeUnmount(() => {
  clearInterval(executionTimer)
  typewriterTimers.forEach(timer => clearInterval(timer))
  typewriterTimers.clear()
})

function renderMsg(msg, idx) {
  const text = isTypewriterMessage(msg)
    ? (typewriterText[typewriterKey(msg, idx)] ?? '')
    : msg.text
  const visibleText = stripSeedDebugBlocks(text)
  if (msg.role === 'assistant') return renderMarkdown(visibleText)
  return escapeHtml(stripSeedDebugBlocks(msg.text))
}

function isTypewriterMessage(msg) {
  return msg?.role === 'assistant' && msg?.renderMode === 'typewriter'
}

function typewriterKey(msg, idx) {
  return msg.id || `${idx}-${msg.at || ''}-${String(msg.text || '').slice(0, 12)}`
}

function isTypewriterDone(msg, idx) {
  if (!isTypewriterMessage(msg)) return true
  return Boolean(typewriterDone[typewriterKey(msg, idx)])
}

function canShowStructuredContent(msg, idx) {
  return !isTypewriterMessage(msg) || isTypewriterDone(msg, idx)
}

function shouldShowFeedback(msg, idx) {
  return msg?.role === 'assistant' && canShowStructuredContent(msg, idx)
}

function feedbackKey(msg, idx) {
  return msg.id || `${idx}-${msg.at || ''}-${String(msg.text || '').slice(0, 24)}`
}

function feedbackState(key) {
  return messageFeedback[key] || ''
}

function setFeedback(msg, idx, value) {
  const key = feedbackKey(msg, idx)
  messageFeedback[key] = messageFeedback[key] === value ? '' : value
}

function syncTypewriterMessages() {
  props.messages.forEach((msg, idx) => {
    if (!isTypewriterMessage(msg)) return
    const key = typewriterKey(msg, idx)
    if (typewriterDone[key] || typewriterTimers.has(key)) return
    typewriterText[key] = ''
    typewriterDone[key] = false
    let cursor = 0
    const source = stripSeedDebugBlocks(msg.text)
    const timer = window.setInterval(() => {
      cursor = Math.min(cursor + 2, source.length)
      typewriterText[key] = source.slice(0, cursor)
      scrollToBottom()
      if (cursor >= source.length) {
        window.clearInterval(timer)
        typewriterTimers.delete(key)
        typewriterDone[key] = true
        scrollToBottom()
      }
    }, 18)
    typewriterTimers.set(key, timer)
  })
}

function isStructuredMessage(msg) {
  return Boolean(
    msg?.artifacts?.length
    || msg?.activityItems?.length
    || msg?.actionItems?.length
    || msg?.todoList
    || msg?.task
    || msg?.authRequest
  )
}

function reportArtifact(id) {
  return AI_REPORT_ARTIFACTS[id] || null
}

function reportDisplayTitle(id) {
  const report = reportArtifact(id)
  if (!report) return '当前页面 · 数据解读报告'
  const sourceLabel = report.sourcePageLabel || getPageLabel(props.currentPageId) || '当前页面'
  const title = report.title || '数据解读报告'
  const isOverviewReport = report.sourcePage === 'dashboard.overview' || sourceLabel === '运营总览' || /运营总览/.test(title)
  if (isOverviewReport && /风控|策略命中|DPL|限购/i.test(title)) {
    return '运营总览 · 经营指标解读'
  }
  return title.startsWith(`${sourceLabel} ·`) ? title : `${sourceLabel} · ${title}`
}

function reportChips(id) {
  const report = reportArtifact(id)
  const chips = report?.chips || []
  const isOverviewReport = report?.sourcePage === 'dashboard.overview'
    || report?.sourcePageLabel === '运营总览'
    || /运营总览/.test(report?.title || '')
    || getPageLabel(props.currentPageId) === '运营总览'
  if (isOverviewReport) {
    return chips.filter(chip => !/风控|策略命中|DPL|限购/i.test(chip)).slice(0, 3)
  }
  return chips.slice(0, 3)
}

function escapeHtmlText(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function stripSeedDebugBlocks(str) {
  return String(str || '')
    .replace(/<seed:[^>]+\/>/g, '')
    .replace(/<seed:[^>]+>[\s\S]*?(?:<\/seed:[^>]+>|$)/g, '')
    .trim()
}

function escapeHtml(str) {
  return escapeHtmlText(str).replace(/\n/g, '<br>')
}

function renderMarkdown(text) {
  const codeBlocks = []
  const source = String(text || '').replace(/```([\s\S]*?)```/g, (_, content) => {
    const token = `@@AI_CODE_BLOCK_${codeBlocks.length}@@`
    codeBlocks.push(`<pre><code>${escapeHtmlText(content.trim())}</code></pre>`)
    return token
  })
  const lines = escapeHtmlText(source).split('\n')
  const renderedLines = []

  for (let index = 0; index < lines.length;) {
    if (isMarkdownTableStart(lines, index)) {
      const table = renderMarkdownTable(lines, index)
      renderedLines.push(table.html)
      index = table.nextIndex
      continue
    }
    renderedLines.push(lines[index])
    index += 1
  }

  const html = renderedLines.join('\n')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n/g, '<br>')

  return html.replace(/@@AI_CODE_BLOCK_(\d+)@@/g, (_, index) => codeBlocks[Number(index)] || '')
}

function isMarkdownTableStart(lines, index) {
  if (index + 1 >= lines.length || !lines[index].includes('|')) return false
  const headers = splitMarkdownTableRow(lines[index])
  const dividers = splitMarkdownTableRow(lines[index + 1])
  return headers.length >= 2
    && dividers.length === headers.length
    && dividers.every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')))
}

function splitMarkdownTableRow(line) {
  const cells = []
  let cell = ''

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '\\' && line[index + 1] === '|') {
      cell += '|'
      index += 1
      continue
    }
    if (char === '|') {
      cells.push(cell.trim())
      cell = ''
      continue
    }
    cell += char
  }
  cells.push(cell.trim())

  if (line.trim().startsWith('|')) cells.shift()
  if (line.trim().endsWith('|')) cells.pop()
  return cells
}

function renderMarkdownTable(lines, startIndex) {
  const headers = splitMarkdownTableRow(lines[startIndex])
  const dividers = splitMarkdownTableRow(lines[startIndex + 1])
  const alignments = dividers.map(cell => {
    const value = cell.replace(/\s/g, '')
    if (value.startsWith(':') && value.endsWith(':')) return 'center'
    if (value.endsWith(':')) return 'right'
    return 'left'
  })
  const rows = []
  let nextIndex = startIndex + 2

  while (nextIndex < lines.length && lines[nextIndex].trim() && lines[nextIndex].includes('|')) {
    const cells = splitMarkdownTableRow(lines[nextIndex])
    rows.push(headers.map((_, index) => cells[index] || ''))
    nextIndex += 1
  }

  const headerHtml = headers.map((cell, index) => `<th class="is-${alignments[index]}">${cell}</th>`).join('')
  const bodyHtml = rows.map(row => `<tr>${row.map((cell, index) => `<td class="is-${alignments[index]}">${cell}</td>`).join('')}</tr>`).join('')

  return {
    html: `<div class="ai-markdown-table-wrap" role="region" aria-label="AI 回复表格"><table class="ai-markdown-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`,
    nextIndex
  }
}
</script>

<style lang="scss" scoped>
.ai-execution-row { display: flex; align-items: center; gap: var(--space-2, 8px); margin-top: var(--space-1, 4px); padding-block: var(--space-2, 8px); padding-inline: 0; min-width: 0; color: color-mix(in srgb, var(--color-text-secondary) 70%, var(--color-text-tertiary)); font-size: var(--text-md, 14px); font-weight: 400; line-height: var(--line-height-sm, 20px); }
.ai-current-execution-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ai-execution-row :deep(.agent-activity-icon) { width: var(--icon-sm, 16px); height: var(--icon-sm, 16px); flex: 0 0 var(--icon-sm, 16px); }
@media (forced-colors: active) {
  .ai-execution-row { color: CanvasText; }
}
.ai-messages { --agent-message-space-1: 1px; --agent-message-space-2: 2px; --agent-message-space-6: 6px; --agent-message-space-9: 9px; --agent-message-space-10: 10px; }


.ai-message-bubble {
  position: relative;
  margin-bottom: 20px;
}
.ai-merged-reply > .bubble { width: 100%; max-width: 100% !important; }
.ai-answer-part + .ai-answer-part { margin-top: var(--space-3, 12px); padding-top: var(--space-3, 12px); border-top: 1px solid var(--color-border-subtle); }

.ai-message-time {
  position: absolute;
  top: 100%;
  margin-top: 4px;
  color: var(--color-text-tertiary);
  font-size: var(--text-caption, 11px);
  font-variant-numeric: tabular-nums;
  line-height: 16px;
  white-space: nowrap;
}

.ai-msg.user .ai-message-time {
  right: 0;
  text-align: right;
}

.ai-msg.assistant .ai-message-time {
  left: 0;
  text-align: left;
}

.ai-todo-card {
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
}

.ai-msg > .conversation-states {
  max-width: 100%;
  margin: 0 0 var(--agent-message-space-6);
}






:deep(.ai-markdown-table-wrap) {
  width: 100%;
  margin: var(--agent-message-space-10) 0;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  scrollbar-width: thin;
}

:deep(.ai-markdown-table) {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  color: var(--color-text);
  font-size: 12px;
  line-height: 1.5;
}

:deep(.ai-markdown-table th),
:deep(.ai-markdown-table td) {
  padding: 8px var(--agent-message-space-10);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

:deep(.ai-markdown-table th) {
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  font-weight: 650;
}

:deep(.ai-markdown-table td) {
  color: var(--color-text);
}

:deep(.ai-markdown-table tbody tr:nth-child(even) td) {
  background: color-mix(in srgb, var(--color-text) 1.8%, transparent);
}

:deep(.ai-markdown-table tbody tr:hover td) {
  background: color-mix(in srgb, var(--color-primary) 5.5%, transparent);
}

:deep(.ai-markdown-table th:last-child),
:deep(.ai-markdown-table td:last-child) {
  border-right: 0;
}

:deep(.ai-markdown-table tbody tr:last-child td) {
  border-bottom: 0;
}

:deep(.ai-markdown-table .is-center) { text-align: center; }
:deep(.ai-markdown-table .is-right) { text-align: right; }

:global(body.dark-mode) :deep(.ai-markdown-table-wrap) {
  border-color: var(--color-border-subtle);
  background: var(--color-surface);
}

:global(body.dark-mode) :deep(.ai-markdown-table th) {
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
}

:global(body.dark-mode) :deep(.ai-markdown-table td) {
  color: var(--color-text);
}

.ai-todo-card {
  padding: 12px;
}

.ai-todo-list-block {
  width: 100%;
  margin-top: 8px;
  padding: var(--agent-message-space-2) var(--agent-message-space-2) 0;
  animation: ai-card-soft-enter .22s ease both;
}

.ai-todo-list-block .ai-todo-card {
  padding: 0;
  border: 0;
  background: transparent;
}

.ai-todo-list-block.is-complete {
  color: var(--color-primary);
}

.ai-todo-head {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: var(--agent-message-space-10);
  border-bottom: 1px solid rgba(31, 35, 41, .08);
  border-top: 0;
  border-right: 0;
  border-left: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.ai-todo-summary { display: inline-flex; align-items: center; gap: var(--agent-message-space-6); }
.ai-todo-toggle-icon { transition: transform .16s ease; }
.ai-todo-toggle-icon.is-collapsed { transform: rotate(180deg); }
.ai-todo-list-block.is-complete .ai-todo-orb { position: relative; border-color: var(--color-primary); background: var(--color-primary); }
.ai-todo-list-block.is-complete .ai-todo-orb::after { content: ''; position: absolute; left: 4px; top: 2px; width: 4px; height: 8px; border: solid var(--color-surface); border-width: 0 2px 2px 0; transform: rotate(45deg); }

.ai-todo-title {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.ai-todo-title b {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-todo-orb {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  border: 3px solid rgba(51, 112, 255, .18);
  border-top-color: var(--color-primary);
  border-radius: var(--radius-pill, 9999px);
}

.ai-todo-progress {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.ai-todo-list {
  display: grid;
  gap: var(--agent-message-space-9);
  padding-top: var(--agent-message-space-10);
}

.ai-todo-item {
  min-width: 0;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.45;
}

.ai-todo-item span:last-child {
  min-width: 0;
  overflow-wrap: anywhere;
}

.todo-status {
  width: 16px;
  height: 16px;
  margin-top: var(--agent-message-space-1);
  border: 2px solid rgba(31, 35, 41, .22);
  border-radius: var(--radius-pill, 9999px);
  background: var(--color-surface);
}

.ai-todo-item.is-done {
  color: var(--color-text);
}

.ai-todo-item.is-done .todo-status {
  border-color: var(--color-primary);
  background:
    linear-gradient(45deg, transparent 48%, var(--color-surface) 49% 56%, transparent 57%) 5px 7px / 8px 5px no-repeat,
    var(--color-primary);
}

.ai-todo-item.is-running {
  color: var(--color-text);
}

.ai-todo-item.is-running .todo-status {
  border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
  box-shadow: inset 0 0 0 3px var(--color-surface);
  background: var(--color-primary);
}

.ai-legacy-authorization { min-width: 0; margin-top: 12px; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); }
.ai-legacy-authorization summary { cursor: pointer; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.ai-legacy-authorization summary span { margin-left: 8px; color: var(--color-text-secondary); font-size: 12px; }
.ai-legacy-authorization p, .ai-legacy-authorization dl { margin: 12px 0 0; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
.ai-legacy-authorization dl { display: grid; gap: 8px; }
.ai-legacy-authorization dt { color: var(--color-text-secondary); }
.ai-legacy-authorization dd { margin: 4px 0 0; }
.ai-legacy-authorization summary:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.ai-reply-feedback {
  display: flex;
  gap: 4px;
  margin-top: var(--agent-message-space-10);
}

.ai-feedback-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.ai-feedback-btn:hover,
.ai-feedback-btn.active {
  border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.ai-typewriter-msg > .ai-answer-body::after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 1em;
  margin-left: var(--agent-message-space-2);
  vertical-align: -2px;
  border-radius: var(--agent-message-space-2);
  background: currentColor;
  animation: ai-typewriter-cursor .9s steps(2, jump-none) infinite;
}

.ai-typewriter-done > .ai-answer-body::after {
  content: none;
}

.ai-typewriter-done .agent-task-card,
.ai-typewriter-done .ai-legacy-authorization,
.ai-typewriter-done .ai-report-artifact-list,
.ai-typewriter-done .ai-task-actions,
.ai-typewriter-done .ai-todo-list-block {
  animation: ai-card-soft-enter .22s ease both;
}

@keyframes ai-typewriter-cursor {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
}

@keyframes ai-card-soft-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-merged-reply > .ai-message-bubble { min-width: 0; box-sizing: border-box; }
.ai-answer-part, .ai-answer-body { min-width: 0; overflow-wrap: anywhere; }
.ai-merged-reply .ai-message-time { position: static; display: block; margin-top: var(--space-1, 4px); text-align: right; }
.ai-execution-dots { display: inline-flex; gap: var(--space-1, 4px); flex: 0 0 auto; }
.ai-execution-dots i { width: var(--space-1, 4px); height: var(--space-1, 4px); border-radius: var(--radius-pill, 9999px); background: currentColor; animation: ai-execution-pulse 1s ease-in-out infinite; }
.ai-execution-dots i:nth-child(2) { animation-delay: .14s; }
.ai-execution-dots i:nth-child(3) { animation-delay: .28s; }
@keyframes ai-execution-pulse { 50% { opacity: .3; } }
@media (prefers-reduced-motion: reduce) { .ai-execution-dots i, .ai-typewriter-msg > .ai-answer-body::after { animation: none; } }
</style>
