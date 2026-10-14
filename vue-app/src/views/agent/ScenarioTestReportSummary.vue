<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import SectionHeader from '@/components/content/SectionHeader.vue'
import type { ScenarioSimulationReport } from '@/domain/scenarioPackageTesting.js'
import { resolveScenarioChain } from '@/domain/scenarioSkillPackages.js'
import type { ScenarioPinnedStep } from '@/stores/scenarioSkillPackages'

const props = defineProps<{
  headerTarget?: string | HTMLElement | null
  report: ScenarioSimulationReport | null
  stale?: boolean
  steps?: ScenarioPinnedStep[]
  activeNodeId?: string | null
  running?: boolean
  headingLevel?: 2 | 3
  resultsOnly?: boolean
}>()
const emit = defineEmits<{ 'select-node': [id: string] }>()

type TrialNode = ScenarioSimulationReport['nodes'][number] & { suggestions?: string[] }
type NodeEntry = { id: string; name: string; step: ScenarioPinnedStep | undefined; node: TrialNode | null }

const internalNodeId = ref('')
const detailElement = ref<HTMLElement | null>(null)
const entries = computed<NodeEntry[]>(() => {
  const reportNodes = props.report?.nodes || []
  if (props.steps !== undefined) {
    const byId = new Map(reportNodes.map(node => [node.id, node]))
    const stepsById = new Map(props.steps.map(step => [step.id, step]))
    return resolveScenarioChain(props.steps).steps.map(orderedStep => {
      const step = stepsById.get(orderedStep.id)!
      return { id: step.id, name: step.name, step, node: byId.get(step.id) || null }
    })
  }
  return reportNodes.map(node => ({ id: node.id, name: node.name, step: undefined, node }))
})
const defaultNodeId = computed(() => entries.value.find(entry => entry.node && nodeErrors(entry.node).length)?.id || entries.value[0]?.id || '')
const selectedEntry = computed(() =>
  entries.value.find(entry => entry.id === props.activeNodeId)
  || entries.value.find(entry => entry.id === internalNodeId.value)
  || entries.value.find(entry => entry.id === defaultNodeId.value)
)
const selectedNode = computed(() => selectedEntry.value?.node || null)
const selectedErrors = computed(() => selectedNode.value ? nodeErrors(selectedNode.value) : [])
const selectedSuggestions = computed(() => {
  if (!selectedErrors.value.length) return []
  const suggestions = selectedNode.value?.suggestions?.filter(value => typeof value === 'string' && value.trim()) || []
  return suggestions.length ? suggestions : ['返回编排检查该节点，按报错原因修改后重新试运行。']
})
const selectedNotices = computed(() => selectedNode.value?.issues.filter(issue => !selectedErrors.value.includes(issue)) || [])
const upstreamInputs = computed(() => selectedNode.value?.inputs.filter(input => input.source === 'upstream') || [])
const startsFromConfiguration = computed(() => Boolean(
  selectedNode.value && selectedNode.value.id === props.report?.nodes[0]?.id
  && !upstreamInputs.value.length
  && selectedNode.value.inputs.some(input => input.source === 'run' && input.value.trim())
))

watch([() => props.report?.id, () => entries.value.map(entry => entry.id).join('\u0000')], ([reportId], previous) => {
  if (reportId !== previous?.[0] || !entries.value.some(entry => entry.id === internalNodeId.value)) {
    internalNodeId.value = defaultNodeId.value
  }
}, { immediate: true })

function selectNode(id: string) {
  internalNodeId.value = id
  emit('select-node', id)
  if (props.resultsOnly) void nextTick(() => {
    const detail = detailElement.value
    if (!detail) return
    // Scroll only the containing workspace, never the document or each column.
    let container = detail.parentElement
    while (container) {
      if (/(auto|scroll)/.test(getComputedStyle(container).overflowY) && container.scrollHeight > container.clientHeight) {
        const top = detail.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 8
        container.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
        break
      }
      container = container.parentElement
    }
  })
}

function statusLabel(status: string) {
  return ({ completed: '本轮无错误', attention: '有提示', blocked: '试运行报错', skipped: '本轮已跳过', pending: '未试运行' } as Record<string, string>)[status] || status
}

function nodeErrors(node: TrialNode) {
  if (node.errors?.length) return node.errors
  return node.status === 'blocked' ? node.issues.length ? node.issues : ['本节点未完成试运行，请返回编排检查。'] : []
}

function nodeStatus(entry: NodeEntry) {
  return entry.node ? nodeErrors(entry.node).length ? 'blocked' : entry.node.status : 'pending'
}

function pinnedVersion(entry: NodeEntry) {
  return entry.node ? entry.node.pinnedVersion || '历史未记录' : entry.step?.pinnedVersion || '未设置'
}

function contractValue(entry: NodeEntry, field: 'task' | 'fixedRequirements' | 'expectedOutput' | 'condition') {
  return (entry.node ? entry.node[field] : entry.step?.[field])?.trim() || ''
}

function outputSourceLabel(node: TrialNode) {
  return node.outputSource ? ({ manual: '手工提供的样例', fixture: '预置样例', none: '未生成输出' })[node.outputSource] : '历史未记录，需重新试运行'
}

function downstreamStatusLabel(status: string) {
  return ({ received: '已接收', blocked: '未接收', skipped: '已跳过' } as Record<string, string>)[status] || status
}

function formatTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function selectedNames(report: ScenarioSimulationReport, ids: string[]) {
  return ids.map(id => report.nodes.find(node => node.id === id)?.name || id).join('、') || '无'
}

function skippedConditionNames(report: ScenarioSimulationReport) {
  return report.nodes.filter(node => node.condition && !report.request.activeOptionalStepIds.includes(node.id)).map(node => node.name).join('、') || '无'
}
</script>

<template>
  <section class="scenario-test-report" :class="{ 'is-results-only': resultsOnly }" aria-label="节点试运行结果" :aria-busy="running ? 'true' : 'false'">
    <Teleport defer :to="headerTarget || 'body'" :disabled="!headerTarget">
      <SectionHeader title="节点试运行结果" :heading-level="headingLevel ?? 3">
        <template #meta>
          <span>模拟数据 · 未调用业务接口</span>
          <span v-if="running" role="status">正在生成本轮结果…</span>
          <span v-else-if="report" class="test-report-status" :class="`is-${report.status}`">{{ statusLabel(report.status) }}</span>
          <span v-else>尚未试运行</span>
        </template>
        <template v-if="$slots.actions" #actions><slot name="actions"></slot></template>
      </SectionHeader>
    </Teleport>
    <slot name="status">
      <p v-if="stale && report" class="test-report-history" role="status">记录已过期，请重新试运行后再提交。</p>
    </slot>

    <div v-if="entries.length" class="test-report-workspace">
      <nav class="test-report-navigation" aria-label="选择试运行节点">
        <ol class="test-report-node-list">
          <li v-for="(entry, index) in entries" :key="entry.id" :data-test-node="entry.id">
            <button
              type="button"
              class="test-report-node-select"
              :class="{ 'is-selected': selectedEntry?.id === entry.id }"
              :data-node-select="entry.id"
              :aria-current="selectedEntry?.id === entry.id ? 'true' : undefined"
              @click="selectNode(entry.id)"
            >
              <span class="test-report-node-order">节点 {{ index + 1 }}</span>
              <strong>{{ entry.name || '未命名节点' }}</strong>
              <span v-if="!resultsOnly" class="test-report-version">固定版本：{{ pinnedVersion(entry) }}</span>
              <span class="test-report-status" :class="`is-${nodeStatus(entry)}`">{{ statusLabel(nodeStatus(entry)) }}</span>
            </button>
          </li>
        </ol>
      </nav>

      <article v-if="selectedEntry" ref="detailElement" :key="selectedEntry.id" class="test-report-detail" :data-selected-node="selectedEntry.id" aria-label="选中节点详情" tabindex="0">
        <div class="test-report-detail-heading">
          <h3>{{ selectedEntry.name || '未命名节点' }}</h3>
          <span class="test-report-status" :class="`is-${nodeStatus(selectedEntry)}`">{{ statusLabel(nodeStatus(selectedEntry)) }}</span>
        </div>
        <details v-if="!resultsOnly" class="test-report-disclosure">
          <summary>节点任务与固定要求</summary>
          <dl class="test-report-fields test-report-disclosure-body">
            <div><dt>本节点任务</dt><dd>{{ contractValue(selectedEntry, 'task') || '未补充' }}</dd></div>
            <div><dt>固定要求</dt><dd>{{ contractValue(selectedEntry, 'fixedRequirements') || '未设置额外要求' }}</dd></div>
            <div v-if="contractValue(selectedEntry, 'condition')"><dt>判断条件</dt><dd>{{ contractValue(selectedEntry, 'condition') }}</dd></div>
          </dl>
        </details>
        <slot v-if="!resultsOnly" name="node-settings" :node="selectedNode" :step="selectedEntry.step" :node-id="selectedEntry.id"></slot>

        <section class="test-report-detail-section" :aria-label="resultsOnly ? '收到的输入' : '执行与收到输入'">
          <h3>{{ resultsOnly ? '收到的输入' : '执行与收到输入' }}</h3>
          <p v-if="!selectedNode" class="test-report-empty">{{ resultsOnly ? '尚未试运行。' : '本节点尚未试运行，暂未记录执行状态与收到的输入。' }}</p>
          <template v-else>
            <dl v-if="!resultsOnly" class="test-report-fields">
              <div><dt>本轮执行状态</dt><dd>{{ statusLabel(nodeStatus(selectedEntry)) }} · 模拟试运行</dd></div>
              <div><dt>本轮固定版本</dt><dd>{{ pinnedVersion(selectedEntry) }}</dd></div>
              <div>
                <dt>收到的输入</dt>
                <dd>
                  <ul v-if="selectedNode.inputs.length" class="test-report-value-list">
                    <li v-for="(input, inputIndex) in selectedNode.inputs" :key="`${input.source}-${input.nodeId || inputIndex}`">
                      <details v-if="input.source === 'run'" class="test-report-disclosure" data-run-basis>
                        <summary>运行依据</summary>
                        <p class="test-report-disclosure-body">{{ input.value || '未提供输入' }}</p>
                      </details>
                      <template v-else>
                        <strong>{{ input.name }}</strong>
                        <small>上游节点输出</small>
                        <p>{{ input.value || '未提供输入' }}</p>
                      </template>
                    </li>
                  </ul>
                  <span v-else>本节点未接收输入。</span>
                </dd>
              </div>
            </dl>
            <template v-else>
              <ul v-if="upstreamInputs.length" class="test-report-value-list">
                <li v-for="(input, inputIndex) in upstreamInputs" :key="input.nodeId || inputIndex">
                  <strong>{{ input.name }}</strong>
                  <p class="test-report-output">{{ input.value || '未提供上游反馈。' }}</p>
                </li>
              </ul>
              <p v-else class="test-report-empty">{{ startsFromConfiguration ? '从场景配置启动。' : selectedNode.status === 'skipped' ? '本轮已跳过，未接收输入。' : '本轮未接收到上游反馈。' }}</p>
            </template>
            <div v-if="selectedErrors.length" class="test-report-error-block" :data-node-error="selectedNode.id" role="alert" aria-label="节点报错与修改建议">
              <div class="test-report-error-group">
                <strong>报错原因</strong>
                <ul class="test-report-issues" aria-label="报错原因"><li v-for="(issue, index) in selectedErrors" :key="index">{{ issue }}</li></ul>
              </div>
              <div class="test-report-error-group">
                <strong>修改建议</strong>
                <ul class="test-report-suggestions" aria-label="修改建议"><li v-for="(suggestion, index) in selectedSuggestions" :key="index">{{ suggestion }}</li></ul>
              </div>
            </div>
            <details v-if="resultsOnly && selectedNotices.length" class="test-report-disclosure">
              <summary>节点提示（{{ selectedNotices.length }}）</summary>
              <div class="test-report-disclosure-body"><ul class="test-report-notices" aria-label="节点提示"><li v-for="(issue, index) in selectedNotices" :key="index">{{ issue }}</li></ul></div>
            </details>
            <ul v-else-if="selectedNotices.length" class="test-report-notices" aria-label="节点提示"><li v-for="(issue, index) in selectedNotices" :key="index">{{ issue }}</li></ul>
            <slot name="node-actions" :node="selectedNode"></slot>
          </template>
        </section>

        <section class="test-report-detail-section" :aria-label="resultsOnly ? '本轮反馈' : '预期输出与本轮反馈对照'">
          <h3>{{ resultsOnly ? '本轮反馈' : '预期输出与本轮反馈对照' }}</h3>
          <p v-if="resultsOnly" class="test-report-output">{{ selectedNode ? selectedNode.output || (selectedNode.status === 'skipped' ? '本轮已跳过，未生成输出。' : '本轮未生成输出。') : '尚未试运行，暂无本轮反馈。' }}</p>
          <dl v-else class="test-report-comparison">
            <div><dt>预期输出</dt><dd>{{ contractValue(selectedEntry, 'expectedOutput') || '未补充' }}</dd></div>
            <div>
              <dt>本轮反馈</dt>
              <dd v-if="!selectedNode">尚未试运行，暂无本轮反馈。</dd>
              <dd v-else>{{ selectedNode.output || (selectedNode.status === 'skipped' ? '本轮已跳过，未生成输出。' : '本轮未生成输出。') }}</dd>
            </div>
          </dl>
          <p v-if="!resultsOnly && selectedNode" class="test-report-notice">反馈来源：{{ outputSourceLabel(selectedNode) }}</p>
          <p v-if="!resultsOnly" class="test-report-notice">请人工核对内容是否符合预期；“本轮无错误”不表示输出内容正确。</p>
        </section>

        <section class="test-report-detail-section" aria-label="直接下游接收结果">
          <h3>直接下游接收结果</h3>
          <p v-if="!selectedNode" class="test-report-empty">本节点尚未试运行，暂无下游接收结果。</p>
          <p v-else-if="selectedNode.downstream === undefined" class="test-report-empty">历史记录未保存下游接收情况，请重新试运行。</p>
          <p v-else-if="!selectedNode.downstream.length" class="test-report-empty">链路结束，本节点没有直接下游。</p>
          <template v-else>
            <ul class="test-report-value-list">
              <li v-for="downstream in selectedNode.downstream" :key="downstream.nodeId" :data-downstream-node="downstream.nodeId">
                <div class="test-report-detail-heading">
                  <strong>{{ downstream.name }}</strong>
                  <span class="test-report-status" :class="`is-${downstream.status}`">{{ downstreamStatusLabel(downstream.status) }}</span>
                </div>
                <dl v-if="!resultsOnly || downstream.status !== 'received'" class="test-report-fields">
                  <div><dt>本节点发送内容</dt><dd>{{ downstream.sentValue || '无发送内容。' }}</dd></div>
                  <div><dt>下游收到内容</dt><dd>{{ downstream.receivedValue || '未接收内容。' }}</dd></div>
                </dl>
                <p v-if="downstream.detail && (!resultsOnly || downstream.status !== 'received')" class="test-report-notice">{{ downstream.detail }}</p>
              </li>
            </ul>
            <p v-if="!resultsOnly" class="test-report-notice">“已接收”仅表示下游收到了样例内容，不代表下游执行成功或内容语义正确。</p>
          </template>
        </section>
      </article>
    </div>
    <p v-else class="test-report-empty">{{ report ? '本轮未生成节点结果，请查看本轮记录并检查链路配置。' : '暂无节点，请先完成节点编排。' }}</p>

    <details v-if="report && !resultsOnly" class="test-report-disclosure test-report-metadata">
      <summary>本轮记录与测试设置</summary>
      <div class="test-report-disclosure-body">
        <dl class="test-report-fields">
          <div><dt>试运行时间</dt><dd>{{ formatTime(report.createdAt) }}</dd></div>
          <div><dt>试运行人</dt><dd>{{ report.testerId || '未记录' }}</dd></div>
          <div><dt>运行依据</dt><dd>{{ report.request.input || '未填写' }}</dd></div>
          <div><dt>整体预期输出</dt><dd>{{ report.request.expectedOutput || '未填写' }}</dd></div>
          <div><dt>本次模拟命中</dt><dd>{{ selectedNames(report, report.request.activeOptionalStepIds) }}</dd></div>
          <div><dt>本次模拟不命中</dt><dd>{{ skippedConditionNames(report) }}</dd></div>
          <div><dt>模拟确认</dt><dd>{{ report.request.workflowConfirmed === true ? '已确认整个工作流' : selectedNames(report, report.request.confirmedStepIds) }}</dd></div>
          <div v-if="report.request.approvedStepIds.length"><dt>历史模拟审批</dt><dd>{{ selectedNames(report, report.request.approvedStepIds) }}</dd></div>
        </dl>
        <p>{{ report.summary }}</p>
        <ul v-if="report.issues.length" class="test-report-notices" :class="{ 'test-report-issues': report.status === 'blocked' }" aria-label="本轮问题与提示"><li v-for="(issue, index) in report.issues" :key="index">{{ issue }}</li></ul>
      </div>
    </details>
  </section>
</template>

<style scoped>
.scenario-test-report { container: scenario-report / inline-size; display: grid; gap: 12px; width: 100%; min-width: 0; color: var(--color-text); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.scenario-test-report :deep(.content-section-header__heading) { flex-basis: auto; }
.scenario-test-report p { margin: 0; }
.test-report-status { color: var(--color-text-secondary); font-size: 12px; font-weight: 500; }
.test-report-status.is-completed, .test-report-status.is-received { color: var(--color-success); }
.test-report-status.is-attention, .test-report-history { color: var(--color-warning); }
.test-report-status.is-blocked, .test-report-issues { color: var(--color-danger); }
.test-report-empty, .test-report-notice, .test-report-fields dt, .test-report-comparison dt { color: var(--color-text-secondary); }
.test-report-notice { font-size: 12px; }
.test-report-workspace { display: grid; grid-template-columns: 240px minmax(0, 1fr); align-items: start; gap: 12px; min-width: 0; }
.test-report-navigation, .test-report-detail { min-width: 0; max-height: 640px; overflow-y: auto; overflow-x: hidden; overscroll-behavior-y: contain; scrollbar-gutter: stable; }
.test-report-node-list { display: grid; gap: 8px; min-width: 0; margin: 0; padding: 4px; list-style: none; }
.test-report-node-list li { min-width: 0; }
.test-report-node-select { display: grid; gap: 4px; width: 100%; min-width: 0; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: inherit; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
.test-report-node-select:hover { background: var(--color-bg-subtle); }
.test-report-node-select.is-selected { border-color: var(--color-primary); background: var(--color-primary-subtle); }
.test-report-node-select:focus-visible, .test-report-disclosure > summary:focus-visible, .test-report-detail:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.test-report-node-select strong { min-width: 0; font-weight: 600; }
.test-report-node-order, .test-report-version { color: var(--color-text-secondary); font-size: 12px; }
.test-report-detail { display: grid; align-content: start; gap: 16px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
.test-report-detail-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; }
.test-report-detail-heading h3, .test-report-detail-section h3 { min-width: 0; margin: 0; color: var(--color-text); font-size: 14px; font-weight: 600; }
.test-report-detail-section { display: grid; gap: 12px; min-width: 0; padding-top: 16px; border-top: 1px solid var(--color-border-subtle); }
.test-report-fields, .test-report-comparison { display: grid; gap: 12px; min-width: 0; margin: 0; }
.test-report-fields > div, .test-report-comparison > div { display: grid; align-content: start; gap: 4px; min-width: 0; }
.test-report-fields dd, .test-report-comparison dd { min-width: 0; margin: 0; white-space: pre-wrap; }
.test-report-comparison { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.test-report-comparison > div { padding: 12px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-subtle); }
.test-report-issues, .test-report-notices, .test-report-suggestions { margin: 0; padding-left: 20px; }
.test-report-error-block { display: grid; gap: 8px; min-width: 0; padding: 12px; border: 1px solid var(--color-danger); border-radius: var(--radius-md); background: var(--color-danger-subtle); }
.test-report-error-group { display: grid; gap: 4px; min-width: 0; }
.test-report-error-group > strong { color: var(--color-danger); font-weight: 600; }
.test-report-suggestions { color: var(--color-text); }
.test-report-notices { color: var(--color-text-secondary); }
.test-report-notices.test-report-issues { color: var(--color-danger); }
.test-report-value-list { display: grid; gap: 12px; min-width: 0; margin: 0; padding: 0; list-style: none; }
.test-report-value-list > li { display: grid; gap: 4px; min-width: 0; }
.test-report-value-list strong { min-width: 0; font-weight: 500; }
.test-report-value-list small { color: var(--color-text-secondary); font-size: 12px; }
.test-report-output { min-width: 0; white-space: pre-wrap; }
.test-report-disclosure { min-width: 0; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.test-report-disclosure > summary { padding: 8px 12px; color: var(--color-text-secondary); cursor: pointer; }
.test-report-disclosure-body { display: grid; gap: 12px; min-width: 0; padding: 12px; border-top: 1px solid var(--color-border-subtle); }
.test-report-metadata .test-report-disclosure-body { max-height: 320px; overflow-y: auto; overscroll-behavior-y: contain; }
@container scenario-report (max-width: 719px) {
  .test-report-workspace, .test-report-comparison { grid-template-columns: minmax(0, 1fr); }
  .test-report-navigation { max-height: 240px; }
  .test-report-detail { padding: 12px; }
}
.is-results-only .test-report-navigation,
.is-results-only .test-report-detail { max-height: none; overflow: visible; scrollbar-gutter: auto; }
.is-results-only .test-report-workspace { align-items: start; }
</style>
