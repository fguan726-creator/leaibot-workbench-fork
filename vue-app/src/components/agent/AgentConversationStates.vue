<template>
  <section v-if="recordedItems.length" :class="{ 'conversation-cards': isCards }" class="conversation-states" :aria-label="isCards ? 'Thinking 处理过程' : 'AI 会话状态'">
    <button type="button" class="conversation-state-summary" :aria-expanded="displayExpanded" :aria-controls="listId" @click="toggleExpanded">
      <span class="summary-orb" :class="{ 'is-running': isCards ? process.busy : runningCount > 0, 'is-playback': autoExpandRunning, 'is-failed': isCards && ['failed', 'partial'].includes(process.state), 'is-done': isCards && process.state === 'done' }" aria-hidden="true"></span>
      <b>处理过程</b>
      <span class="state-summary-text" role="status" aria-live="polite" aria-atomic="true">{{ summaryText }}</span>
      <span class="state-toggle">{{ displayExpanded ? '收起' : '展开' }}</span>
    </button>
    <ol v-if="isCards || expanded" :id="listId" class="conversation-state-list">
      <li v-for="item in visibleItems" :key="item.id" class="conversation-state" :class="`status-${item.status}`">
        <button v-if="isCards" type="button" class="state-card-toggle" :disabled="!item.detail" :aria-expanded="item.detail ? Boolean(cardExpandedState[item.id]) : undefined" @click="toggleCard(item.id)">
          <span class="state-card-icon" aria-hidden="true"><AgentActivityIcon :name="agentActivityIcon(item.title, item.kind)" /></span>
          <span class="state-card-content">
            <span class="state-title-row"><b :title="item.title">{{ item.title }}</b><span>{{ statusLabel(item.status) }}</span></span>
            <span v-if="item.detail" class="state-card-detail" :class="{ 'is-expanded': cardExpandedState[item.id] }">{{ item.detail }}</span>
          </span>
          <span v-if="item.status === 'running' && process.busy" class="process-running-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        <template v-else>
          <span class="state-title-row"><b>{{ item.title }}</b><span>{{ statusLabel(item.status) }}<span v-if="autoExpandRunning && item.status === 'running'" class="process-running-dots" aria-hidden="true"><i></i><i></i><i></i></span></span></span>
          <p v-if="item.detail">{{ item.detail }}</p>
        </template>
      </li>
    </ol>
    <button v-if="!isCards && expanded && autoExpandRunning && !showHistory && visibleItems.length < recordedItems.length" type="button" class="process-history-toggle" :aria-controls="listId" @click="showHistory = true">展开历史（{{ recordedItems.length }}）</button>
  </section>
</template>

<script setup>
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue'
import AgentActivityIcon from './AgentActivityIcon.vue'
import { agentActivityIcon } from '@/utils/agentActivityIcons'
import { describeAgentProcess } from '@/utils/agentProcess'

const props = defineProps({
  items: { type: Array, default: () => [] },
  autoExpandRunning: { type: Boolean, default: false },
  presentation: { type: String, default: 'timeline' },
  cardsExpanded: { type: Boolean, default: undefined },
  cardExpanded: { type: Object, default: undefined }
})
const emit = defineEmits(['update:cards-expanded', 'update:card-expanded'])
const expanded = ref(false)
const isCards = computed(() => props.presentation === 'cards')
const displayExpanded = computed(() => isCards.value ? (props.cardsExpanded ?? expanded.value) : expanded.value)
const localCardExpanded = reactive({})
const cardExpandedState = computed(() => props.cardExpanded ?? localCardExpanded)
const process = computed(() => describeAgentProcess(props.items))
const showHistory = ref(false)
const listId = `agent-process-${getCurrentInstance()?.uid}`
const recordedItems = computed(() => props.items.filter(item => item.kind !== 'confirm' && (!isCards.value || item.kind !== 'follow_up')))
const runningCount = computed(() => recordedItems.value.filter(item => item.status === 'running').length)
const playbackState = computed(() => {
  if (isCards.value || !props.autoExpandRunning) return 'manual'
  if (recordedItems.value.some(item => item.status === 'failed' || item.status === 'blocked')) return 'failed'
  if (runningCount.value) return 'running'
  if (recordedItems.value.length && recordedItems.value.every(item => item.status === 'done')) return 'done'
  return 'waiting'
})
const visibleItems = computed(() => {
  if (isCards.value) {
    if (displayExpanded.value) return recordedItems.value
    const active = recordedItems.value.filter(item => ['running', 'failed', 'blocked'].includes(item.status))
    const waiting = recordedItems.value.filter(item => item.status === 'pending')
    const current = new Set([...active, ...waiting].slice(0, 3))
    return current.size ? recordedItems.value.filter(item => current.has(item)) : recordedItems.value.slice(-3)
  }
  if (!props.autoExpandRunning || showHistory.value) return recordedItems.value
  const active = recordedItems.value.filter(item => ['running', 'failed', 'blocked'].includes(item.status))
  const waiting = recordedItems.value.filter(item => item.status === 'pending')
  const current = new Set([...active, ...waiting].slice(0, 3))
  return recordedItems.value.filter(item => current.has(item))
})
watch(playbackState, state => {
  if (state === 'manual' || state === 'waiting') return
  showHistory.value = false
  expanded.value = state !== 'done'
}, { immediate: true })

function toggleExpanded() {
  expanded.value = !displayExpanded.value
  showHistory.value = expanded.value
  if (isCards.value) emit('update:cards-expanded', expanded.value)
}

function toggleCard(id) {
  const next = !cardExpandedState.value[id]
  localCardExpanded[id] = next
  emit('update:card-expanded', { ...cardExpandedState.value, [id]: next })
}

const summaryText = computed(() => {
  if (isCards.value) return `${process.value.label} · ${process.value.detail}`
  const counts = { running: 0, pending: 0, failed: 0, done: 0, blocked: 0 }
  recordedItems.value.forEach(item => { if (item.status in counts) counts[item.status] += 1 })
  if (counts.running) return `${counts.running} 项进行中${counts.pending ? ` · ${counts.pending} 项等待` : ''}`
  if (counts.failed) return `${counts.failed} 项失败`
  if (counts.blocked) return `${counts.blocked} 项需处理`
  if (counts.pending) return `${counts.pending} 项等待中`
  return `已完成 ${counts.done} 项`
})

function statusLabel(status) {
  if (isCards.value && status === 'running' && !process.value.busy) return process.value.state === 'cancelled' ? '停止前记录' : '未完成'
  return { pending: '等待中', running: '进行中', done: '已完成', failed: '失败', blocked: '需处理', cancelled: '已停止', skipped: '未执行' }[status] || '已记录'
}
</script>

<style scoped>
.conversation-states { min-width: 0; width: 100%; color: var(--color-text-secondary); }
.conversation-state-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; width: 100%; padding: 8px 0; border: 0; border-radius: var(--radius-sm); background: transparent; color: inherit; font: inherit; font-size: 12px; text-align: left; cursor: pointer; }
.conversation-state-summary b { color: var(--color-text); font-size: 13px; font-weight: 600; }
.state-summary-text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.state-toggle { color: var(--color-primary); white-space: nowrap; }
.conversation-state-summary:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.summary-orb { flex: 0 0 8px; width: 8px; height: 8px; border-radius: 9999px; background: var(--color-text-tertiary); }
.summary-orb.is-running { background: var(--color-primary); animation: process-pulse 1s ease-in-out infinite; }
.summary-orb.is-playback { animation: none; }
.conversation-state-list { display: grid; gap: 12px; margin: 0; padding: 12px; max-height: 24rem; overflow-y: auto; list-style: none; border-left: 1px solid var(--color-border); }
.conversation-state { min-width: 0; }
.state-title-row { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; line-height: 1.5; }
.state-title-row b { min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.state-title-row > span { white-space: nowrap; }
.conversation-state p { margin: 4px 0 0; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
.status-failed .state-title-row { color: var(--color-danger); }
.process-running-dots { display: inline-flex; gap: 4px; margin-left: 4px; vertical-align: middle; }
.process-running-dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: process-step-dot 1s ease-in-out infinite; }
.process-running-dots i:nth-child(2) { animation-delay: .14s; }
.process-running-dots i:nth-child(3) { animation-delay: .28s; }
.process-history-toggle { padding: 4px 0; border: 0; background: transparent; color: var(--color-primary); font: inherit; font-size: 12px; cursor: pointer; }
.process-history-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
@keyframes process-pulse { 50% { opacity: .4; } }
@keyframes process-step-dot { 50% { opacity: .3; } }
@media (prefers-reduced-motion: reduce) { .summary-orb.is-running, .process-running-dots i { animation: none; } }

.conversation-cards .conversation-state-summary { flex-wrap: nowrap; gap: var(--space-2, 8px); font-size: var(--text-xs, 12px); }
.conversation-cards .conversation-state-summary b { font-size: var(--text-sm, 13px); white-space: nowrap; }
.conversation-cards .state-summary-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conversation-cards .state-toggle { flex: 0 0 auto; padding: var(--space-1, 4px) var(--space-2, 8px); border: 1px solid color-mix(in srgb, var(--color-primary) 24%, transparent); border-radius: var(--radius-full, 9999px); background: var(--color-surface); }
.conversation-cards .summary-orb { flex: 0 0 var(--icon-md, 18px); width: var(--icon-md, 18px); height: var(--icon-md, 18px); border: var(--space-1, 4px) solid color-mix(in srgb, var(--color-primary) 18%, transparent); border-top-color: var(--color-primary); background: transparent; }
.conversation-cards .summary-orb.is-running { animation: process-spin .9s linear infinite; }
.conversation-cards .summary-orb.is-failed { border-color: var(--color-danger); }
.conversation-cards .summary-orb.is-done { border-color: var(--color-success); }
.conversation-cards .conversation-state-list { gap: var(--space-2, 8px); padding: 0; border: 0; }
.conversation-cards .conversation-state { border: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent); border-radius: var(--radius-md); background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface)); }
.state-card-toggle { display: grid; grid-template-columns: var(--space-6, 24px) minmax(0, 1fr) auto; align-items: start; gap: var(--space-2, 8px); width: 100%; padding: var(--space-2, 8px) var(--space-3, 12px); border: 0; border-radius: inherit; background: transparent; color: inherit; text-align: left; font: inherit; cursor: pointer; }
.state-card-toggle:disabled { cursor: default; opacity: 1; }
.state-card-toggle:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
.state-card-icon { width: var(--space-6, 24px); height: var(--space-6, 24px); display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-primary); }
.state-card-content { min-width: 0; display: grid; gap: var(--space-1, 4px); }
.state-card-detail { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: var(--text-xs, 12px); line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
.state-card-detail.is-expanded { display: block; }
.conversation-cards .state-title-row { align-items: center; flex-wrap: nowrap; gap: var(--space-2, 8px); min-width: 0; font-size: var(--text-xs, 12px); }
.conversation-cards .state-title-row b { min-width: 0; flex: 1; color: var(--color-text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conversation-cards .state-title-row > span { font-size: var(--text-caption, 11px); }
.conversation-cards .status-done { background: color-mix(in srgb, var(--color-success) 5%, var(--color-surface)); }
.conversation-cards .status-blocked { background: color-mix(in srgb, var(--color-warning) 6%, var(--color-surface)); }
.conversation-cards .status-failed { background: color-mix(in srgb, var(--color-danger) 5%, var(--color-surface)); }
.conversation-cards .status-failed .state-card-icon { color: var(--color-danger); }
.conversation-cards .status-blocked .state-card-icon { color: var(--color-warning); }
.conversation-cards .status-cancelled, .conversation-cards .status-skipped { background: var(--color-surface-subtle); }
@keyframes process-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .conversation-cards .summary-orb.is-running { animation: none; } }
</style>
