<template>
  <section v-if="recordedItems.length" class="conversation-states" aria-label="AI 会话状态">
    <button type="button" class="conversation-state-summary" :aria-expanded="expanded" :aria-controls="listId" @click="toggleExpanded">
      <span class="summary-orb" :class="{ 'is-running': runningCount > 0, 'is-playback': autoExpandRunning }" aria-hidden="true"></span>
      <b>处理过程</b>
      <span class="state-summary-text">{{ summaryText }}</span>
      <span class="state-toggle">{{ expanded ? '收起' : '展开' }}</span>
    </button>
    <ol v-if="expanded" :id="listId" class="conversation-state-list">
      <li v-for="item in visibleItems" :key="item.id" class="conversation-state" :class="`status-${item.status}`">
        <span class="state-title-row"><b>{{ item.title }}</b><span>{{ statusLabel(item.status) }}<span v-if="autoExpandRunning && item.status === 'running'" class="process-running-dots" aria-hidden="true"><i></i><i></i><i></i></span></span></span>
        <p v-if="item.detail">{{ item.detail }}</p>
      </li>
    </ol>
    <button v-if="expanded && autoExpandRunning && !showHistory && visibleItems.length < recordedItems.length" type="button" class="process-history-toggle" :aria-controls="listId" @click="showHistory = true">展开历史（{{ recordedItems.length }}）</button>
  </section>
</template>

<script setup>
import { computed, getCurrentInstance, ref, watch } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  autoExpandRunning: { type: Boolean, default: false }
})
const expanded = ref(false)
const showHistory = ref(false)
const listId = `agent-process-${getCurrentInstance()?.uid}`
const recordedItems = computed(() => props.items.filter(item => item.kind !== 'confirm'))
const runningCount = computed(() => recordedItems.value.filter(item => item.status === 'running').length)
const playbackState = computed(() => {
  if (!props.autoExpandRunning) return 'manual'
  if (recordedItems.value.some(item => item.status === 'failed' || item.status === 'blocked')) return 'failed'
  if (runningCount.value) return 'running'
  if (recordedItems.value.length && recordedItems.value.every(item => item.status === 'done')) return 'done'
  return 'waiting'
})
const visibleItems = computed(() => {
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
  expanded.value = !expanded.value
  showHistory.value = expanded.value
}

const summaryText = computed(() => {
  const counts = { running: 0, pending: 0, failed: 0, done: 0, blocked: 0 }
  recordedItems.value.forEach(item => { if (item.status in counts) counts[item.status] += 1 })
  if (counts.running) return `${counts.running} 项进行中${counts.pending ? ` · ${counts.pending} 项等待` : ''}`
  if (counts.failed) return `${counts.failed} 项失败`
  if (counts.blocked) return `${counts.blocked} 项需处理`
  if (counts.pending) return `${counts.pending} 项等待中`
  return `已完成 ${counts.done} 项`
})

function statusLabel(status) {
  return { pending: '等待中', running: '进行中', done: '已完成', failed: '失败', blocked: '需处理' }[status] || '已记录'
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
</style>
