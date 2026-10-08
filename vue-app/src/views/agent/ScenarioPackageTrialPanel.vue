<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { evaluateScenarioTrialForSubmit, isScenarioSimulationCurrent, runScenarioSimulation } from '@/domain/scenarioPackageTesting.js'
import type { ScenarioSimulationReport, ScenarioSimulationRequest } from '@/domain/scenarioPackageTesting.js'
import { resolveScenarioChain } from '@/domain/scenarioSkillPackages.js'
import type { ScenarioPackageActor, ScenarioSelectableSkill, ScenarioSkillPackageDraft } from '@/stores/scenarioSkillPackages'
import ScenarioTestReportSummary from './ScenarioTestReportSummary.vue'

const props = defineProps<{
  headerTarget?: string
  draft: ScenarioSkillPackageDraft
  skills: ScenarioSelectableSkill[]
  actor: ScenarioPackageActor
  modelValue: ScenarioSimulationRequest
  report: ScenarioSimulationReport | null
  disabled?: boolean
  simulate?: (draft: ScenarioSkillPackageDraft, request: ScenarioSimulationRequest, actor: ScenarioPackageActor) => ScenarioSimulationReport
}>()
const emit = defineEmits<{
  'update:modelValue': [request: ScenarioSimulationRequest]
  'update:report': [report: ScenarioSimulationReport | null]
  'edit-chain': [stepId?: string]
  running: [running: boolean]
}>()

type TrialNode = ScenarioSimulationReport['nodes'][number] & { errors?: string[] }
const running = ref(false)
const error = ref('')
const activeNodeId = ref('')
let runSequence = 0

const locked = computed(() => props.disabled || running.value)
const orderedSteps = computed(() => {
  const byId = new Map(props.draft.steps.map(step => [step.id, step]))
  return resolveScenarioChain(props.draft.steps).steps.flatMap(step => {
    const source = byId.get(step.id)
    return source ? [source] : []
  })
})
const stale = computed(() => Boolean(props.report && !isScenarioSimulationCurrent(props.report, props.draft, props.skills, props.modelValue)))
const trialDecision = computed(() => evaluateScenarioTrialForSubmit({ ...props.draft, testRequest: props.modelValue, testReport: props.report || undefined }, props.skills))

watch([() => props.report?.id, () => orderedSteps.value.map(step => step.id).join('\u0000')], ([reportId], previous) => {
  const nodeIds = new Set(orderedSteps.value.map(step => step.id))
  if (reportId && reportId !== previous?.[0]) {
    activeNodeId.value = props.report?.nodes.find(node => nodeIds.has(node.id) && nodeHasError(node))?.id || orderedSteps.value[0]?.id || ''
  } else if (!nodeIds.has(activeNodeId.value)) {
    activeNodeId.value = orderedSteps.value[0]?.id || ''
  }
}, { immediate: true })

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function nodeHasError(node: TrialNode) { return node.status === 'blocked' || Boolean(node.errors?.length) }
function copyRequest(): ScenarioSimulationRequest {
  const retry = props.modelValue.mockDataPhase === 'retry' || props.report?.request.mockDataMode === 'mixed-feedback'
  return { ...props.modelValue, mockDataMode: 'mixed-feedback', ...(retry ? { mockDataPhase: 'retry' as const } : {}), activeOptionalStepIds: [...props.modelValue.activeOptionalStepIds], confirmedStepIds: [...props.modelValue.confirmedStepIds], approvedStepIds: [], sampleOutputs: {} }
}
function needsConfirmation(nodeId: string) {
  return Boolean(orderedSteps.value.find(step => step.id === nodeId)?.requiresConfirmation && !props.modelValue.confirmedStepIds.includes(nodeId))
}
function isConditionalNode(nodeId: string) {
  return orderedSteps.value.some(step => step.id === nodeId && step.kind === 'conditional')
}
async function confirmAndRetry(nodeId: string) {
  if (locked.value || !needsConfirmation(nodeId)) return
  const request = copyRequest()
  request.confirmedStepIds = [...new Set([...request.confirmedStepIds, nodeId])]
  await runTrial(request)
}
async function toggleBranchAndRetry(nodeId: string) {
  if (locked.value || !isConditionalNode(nodeId)) return
  const request = copyRequest()
  request.activeOptionalStepIds = request.activeOptionalStepIds.includes(nodeId)
    ? request.activeOptionalStepIds.filter(id => id !== nodeId)
    : [...request.activeOptionalStepIds, nodeId]
  await runTrial(request)
}
function returnToChain(nodeId?: string) {
  if (locked.value) return
  emit('edit-chain', nodeId)
}
async function runTrial(requestOverride?: ScenarioSimulationRequest) {
  if (locked.value) return
  error.value = ''
  const request = requestOverride || copyRequest()
  emit('update:modelValue', clone(request))
  running.value = true
  emit('running', true)
  const sequence = ++runSequence
  try {
    await nextTick()
    // Give the simulated run a visible working state before replacing its result.
    await new Promise(resolve => setTimeout(resolve, 200))
    if (sequence !== runSequence || props.disabled) return
    const report = props.simulate
      ? props.simulate(clone(props.draft), request, clone(props.actor))
      : runScenarioSimulation(clone(props.draft), clone(props.skills), request, clone(props.actor))
    activeNodeId.value = report.nodes.find(nodeHasError)?.id || orderedSteps.value[0]?.id || ''
    emit('update:report', report)
  } catch (cause) {
    emit('update:report', null)
    error.value = cause instanceof Error ? cause.message : '试运行未完成，请检查配置后重试。'
  } finally {
    running.value = false
    if (sequence === runSequence) emit('running', false)
  }
}

onBeforeUnmount(() => {
  runSequence += 1
  if (running.value) emit('running', false)
})
</script>

<template>
  <section class="scenario-trial-panel" aria-label="场景技能包试运行">
    <ScenarioTestReportSummary :header-target="headerTarget" :report="report" :steps="orderedSteps" :stale="stale" :running="running" :active-node-id="activeNodeId" :heading-level="2" results-only @select-node="activeNodeId = $event">
      <template #actions>
        <button class="btn btn-secondary" type="button" :disabled="locked" @click="returnToChain()">返回编排</button>
        <button class="btn btn-primary trial-run-button" data-trial-run type="button" :disabled="locked || !draft.steps.length" @click="runTrial()">{{ running ? '正在试运行…' : report ? '重新试运行' : '开始试运行' }}</button>
      </template>
      <template #status>
        <p v-if="error" class="trial-error" data-trial-status role="alert">{{ error }}</p>
        <p v-else-if="disabled" class="trial-help" data-trial-status>当前仅可查看试运行记录。</p>
        <p v-else-if="!running && stale" class="trial-warning" data-trial-status role="status">配置已变化，请重新试运行后再提交审核。</p>
        <p v-else-if="!running && report && !trialDecision.ok && !report.nodes.some(nodeHasError)" class="trial-warning" data-trial-status role="status">当前报告不满足提交条件，请重新试运行以查看节点报错和修改建议。</p>
        <p v-else-if="!running && report && !trialDecision.ok" class="trial-error" data-trial-status role="alert">本轮存在错误，不能提交。请查看节点提示，返回编排修改后重新试运行。</p>
        <p v-else-if="!running && report && trialDecision.ok" class="trial-success" data-trial-status role="status">本轮试运行已完成，所有执行节点均无错误，可以提交审核。</p>
      </template>
      <template #node-actions="{ node }">
        <div class="trial-node-actions">
          <button v-if="node.status !== 'skipped' && needsConfirmation(node.id)" class="btn btn-secondary" :data-node-confirm="node.id" type="button" :disabled="locked" @click="confirmAndRetry(node.id)">模拟确认并重试</button>
          <button v-if="isConditionalNode(node.id)" class="btn btn-secondary" :data-node-branch="node.id" type="button" :disabled="locked" @click="toggleBranchAndRetry(node.id)">{{ modelValue.activeOptionalStepIds.includes(node.id) ? '跳过此分支重试' : '测试此分支' }}</button>
          <button class="btn btn-secondary" :data-node-edit="node.id" type="button" :disabled="locked" :aria-label="`返回修改节点 ${node.name}`" @click="returnToChain(node.id)">返回修改</button>
        </div>
      </template>
    </ScenarioTestReportSummary>
  </section>
</template>

<style scoped>
.scenario-trial-panel { container-type: inline-size; container-name: scenario-trial; width: 100%; min-width: 0; color: var(--color-text); font-size: var(--text-sm, 13px); line-height: 1.6; overflow-wrap: anywhere; }
.scenario-trial-panel :deep(.content-section-header__heading) { flex-basis: auto; }
.scenario-trial-panel p { margin: 0; }
.trial-help { color: var(--color-text-secondary); font-size: var(--text-xs, 12px); }
.trial-error { color: var(--color-danger); }
.trial-success { color: var(--color-success); }
.trial-warning { color: var(--color-warning); }
.trial-run-button { white-space: nowrap; }
.trial-node-actions { display: flex; flex-wrap: wrap; gap: 8px; }
@container scenario-trial (max-width: 719px) { .trial-run-button { flex: 1 1 auto; } }
</style>
