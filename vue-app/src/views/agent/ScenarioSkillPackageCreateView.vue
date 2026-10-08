<template>
  <div class="scenario-package-create" :class="{ 'is-definition': activeStep === 1, 'is-composition': activeStep === 2, 'is-trial': activeStep === 3, 'is-review': activeStep === 4, 'has-workspace-surface': activeStep <= 2 }" data-page-flow="scenario-package-create">
    <ContentPageHeader
      :title="draft ? '编辑场景技能包' : '创建场景技能包'"
      description="围绕业务场景编排已发布 Skill，逐个检查节点执行、结果传递与反馈，再提交管理员审核。"
    />

    <nav class="scenario-package-tabs" role="tablist" aria-label="创建场景技能包步骤">
      <button
        v-for="step in steps"
        :id="`scenario-package-tab-${step.id}`"
        :key="step.id"
        :ref="element => setTabRef(step.id, element)"
        class="scenario-package-tab"
        :class="{ 'is-active': activeStep === step.id, 'is-complete': activeStep > step.id }"
        type="button"
        role="tab"
        :aria-controls="`scenario-package-panel-${step.id}`"
        :aria-selected="activeStep === step.id"
        :aria-label="step.label"
        :aria-current="activeStep === step.id ? 'step' : undefined"
        :tabindex="activeStep === step.id ? 0 : -1"
        :disabled="submitting || savingDraft || trialRunning || !canEditDraft || step.id > maxVisitedStep"
        @click="goToStep(step.id)"
        @keydown="handleTabKeydown($event, step.id)"
      >
        {{ step.label }}
      </button>
    </nav>

    <div v-show="activeStep === 3" id="scenario-trial-fixed-heading" class="scenario-trial-fixed-heading"></div>
    <div v-show="activeStep === 4" class="scenario-trial-fixed-heading scenario-review-fixed-heading">
      <SectionHeader
        class="scenario-review-section-heading"
        title="提交审核"
        description="核对适用场景、固定版本链路、执行配置和降级规则，提交后由其他管理员审核，审核通过后发布。"
      >
        <template #meta><span>技能包版本 {{ draft?.version || 'v1.0.0' }}</span></template>
      </SectionHeader>
    </div>
    <main ref="bodySection" class="scenario-package-body">
      <div v-if="displayedValidationErrors.length" class="scenario-package-alert" role="alert" aria-live="assertive" tabindex="0">
        <strong>请先处理以下问题</strong>
        <ul>
          <li v-for="error in displayedValidationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <section
        v-show="activeStep === 1"
        id="scenario-package-panel-1"
        ref="definitionSection"
        class="scenario-package-panel scenario-package-definition-panel"
        :inert="!canEditDraft || undefined"
        role="tabpanel"
        aria-labelledby="scenario-package-tab-1"
        tabindex="-1"
      >
        <SectionHeader
          class="scenario-package-definition-heading"
          title="场景定义"
          :description="draft ? '修改后需重新试运行、提交审核。已有已审核版本保持当前状态，新内容通过审核后生效。' : '说明技能包的适用场景与使用边界，便于匹配用户需求。预填示例可修改。'"
        />

        <div class="scenario-definition-layout">
          <div class="scenario-package-form-grid">
            <label class="scenario-package-field">
              <span><b aria-hidden="true">* </b>技能包名称 <b>必填</b></span>
              <input v-model="form.name" type="text" autocomplete="off" required placeholder="例如：职场人群认证经营管理">
            </label>
            <label class="scenario-package-field">
              <span><b aria-hidden="true">* </b>目标人群 <b>必填</b></span>
              <input v-model="form.targetAudience" type="text" autocomplete="off" required placeholder="说明主要使用者或服务对象">
            </label>
            <label class="scenario-package-field scenario-package-field-wide">
              <span><b aria-hidden="true">* </b>场景描述 <b>必填</b></span>
              <textarea v-model="form.description" rows="7" required aria-describedby="scenario-description-help" placeholder="例如：当运营人员需要分析已认证人群的经营表现并确定跟进对象时使用。请说明适用任务、预期结果及不适用范围。"></textarea>

            </label>
          </div>
          <aside class="scenario-definition-aside" aria-label="场景定义说明">
            <section class="scenario-definition-guide">
              <h3>填写说明</h3>
              <p id="scenario-description-help">写明适用的业务场景、用户需求、预期结果和使用边界，作为判断是否调用该场景包的依据。</p>
            </section>
            <dl class="scenario-package-field scenario-package-static-field">
              <dt>主责任人</dt>
              <dd>{{ ownerId }}</dd>
              <dd><small>主责任人为当前创建账号，提交后由其他管理员审核。</small></dd>
            </dl>
          </aside>
        </div>
      </section>

      <section
        v-show="activeStep === 2"
        id="scenario-package-panel-2"
        ref="compositionSection"
        class="scenario-package-panel scenario-package-composition-panel"
        :inert="!canEditDraft || undefined"
        role="tabpanel"
        aria-labelledby="scenario-package-tab-2"
        tabindex="-1"
      >
        <p v-if="hasDependencyUpgrade" class="scenario-package-version-note" role="status">
          如需使用新版本，请移除对应旧节点，从左侧重新加入该 Skill，重新连接并核对节点配置，再试运行、提交其他管理员审核。旧审核版本在此期间保持原状态。
        </p>
        <ScenarioSkillPackageComposer v-model="chain" :skills="publishedSkills" ref="composer" :trial-errors="trialErrors" :trial-suggestions="trialSuggestions" :trial-stale="!!testReport && !isTestCurrent" />
      </section>

      <section
        v-show="activeStep === 3"
        id="scenario-package-panel-3"
        ref="testingSection"
        class="scenario-package-panel"
        :inert="!canEditDraft || undefined"
        role="tabpanel"
        aria-labelledby="scenario-package-tab-3"
        tabindex="-1"
      >
        <ScenarioPackageTrialPanel
          header-target="#scenario-trial-fixed-heading"
          v-model="testRequest"
          v-model:report="testReport"
          :draft="currentDraft()"
          :skills="publishedSkills"
          :actor="actor"
          :simulate="scenarioStore.simulateDraft"
          :disabled="!canEditDraft"
          @running="trialRunning = $event"
          @edit-chain="returnToComposition"
        />
        <details class="scenario-package-trial-checks">
          <summary>权限和版本检查</summary>
          <div class="scenario-package-section-head">
            <div>
              <h3>权限和版本检查</h3>
              <p>试运行和提交审核时检查当前权限、链路与固定版本。</p>
            </div>
            <button class="btn btn-secondary" type="button" @click="recomputeEvaluation">重新评估</button>
          </div>

          <div class="scenario-package-evaluations">
            <article
              v-for="card in evaluationCards"
              :key="card.key"
              class="scenario-package-evaluation"
              :class="`is-${card.tone}`"
            >
              <div class="scenario-package-evaluation-head">
                <h3>{{ card.title }}</h3>
                <span>{{ card.status }}</span>
              </div>
              <p>{{ card.detail }}</p>
              <ul v-if="card.lines.length">
                <li v-for="line in card.lines" :key="line">{{ line }}</li>
              </ul>
            </article>
          </div>

          <button
            v-if="liveEligibilityReasons.length"
            class="btn btn-secondary scenario-package-return-selection"
            type="button"
            @click="returnToComposition"
          >返回链路编排</button>

          <div class="scenario-package-snapshots">
            <h3>依赖版本快照明细</h3>
            <div class="scenario-package-snapshot-table" role="region" aria-label="依赖版本快照明细" tabindex="0">
              <table>
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>所属菜单</th>
                    <th>固定版本</th>
                    <th>当前发布版本</th>
                    <th>依赖状态</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="step in evaluatedSteps" :key="step.id">
                    <td>{{ step.name }}</td>
                    <td>{{ step.menu }}</td>
                    <td><code>{{ step.pinnedVersion }}</code></td>
                    <td><code>{{ step.currentPublishedVersion }}</code></td>
                    <td>{{ dependencyStateLabel(step.dependencyState) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="scenario-package-version-note">
              已审核版本继续使用原固定版本。升级需返回编排，移除旧节点并重新加入当前已发布 Skill，重新连线和核对配置，通过试运行与独立审核后切换。必需依赖过期或不可用时暂停，可选步骤则降级跳过。
            </p>
          </div>
        </details>
      </section>

      <section
        v-show="activeStep === 4"
        id="scenario-package-panel-4"
        ref="submissionSection"
        class="scenario-package-panel"
        role="tabpanel"
        aria-labelledby="scenario-package-tab-4"
        tabindex="-1"
      >


        <div class="scenario-package-review-grid">
          <article>
            <h3>场景摘要</h3>
            <dl>
              <div><dt>技能包名称</dt><dd>{{ form.name || '-' }}</dd></div>
              <div><dt>场景描述</dt><dd>{{ form.description || '-' }}</dd></div>
              <div><dt>目标人群</dt><dd>{{ form.targetAudience || '-' }}</dd></div>
              <div><dt>主责任人</dt><dd>{{ ownerId }}</dd></div>
            </dl>
          </article>
          <article>
            <h3>提交范围</h3>
            <dl>
              <div><dt>涉及菜单</dt><dd>{{ selectedMenus.join('、') || '-' }}</dd></div>
              <div><dt>固定链路</dt><dd>{{ resolvedChain.ok ? resolvedChain.steps.map(step => `${step.name} ${step.pinnedVersion}${step.kind === 'conditional' ? `（条件：${step.condition}）` : '（核心步骤）'}`).join(' → ') || '-' : '链路尚未连接完整，请返回编排页检查。' }}</dd></div>
              <div><dt>自动评估</dt><dd>{{ submissionEvaluation.ok && dependencyHealth.status !== 'paused' ? '允许提交审核' : '存在阻断项' }}</dd></div>
              <div><dt>降级规则</dt><dd>必需步骤不可用时暂停；可选步骤不可用时跳过并说明原因。</dd></div>
            </dl>
          </article>
        </div>

        <ScenarioTestReportSummary class="scenario-package-node-review review-trial-report" :report="testReport" :stale="!!testReport && !isTestCurrent" />

        <ScenarioNodeContractSummary class="scenario-package-node-review" :steps="evaluatedSteps" />

        <aside class="scenario-package-runtime-notice">
          <strong>提交审核不会授予运行权限</strong>
          <p>最终调用方仍需具备实际的菜单、Skill、数据和操作权限；每次调用都应由服务端或运行器重新校验。</p>
        </aside>

        <p v-if="submitError" class="scenario-package-submit-error" role="alert">{{ submitError }}</p>
      </section>
    </main>

    <footer class="scenario-package-actions">
      <button class="btn btn-secondary" type="button" :disabled="submitting || savingDraft || trialRunning" @click="emit('cancel')">取消</button>
      <div>
        <button class="btn btn-secondary" type="button" :disabled="submitting || savingDraft || trialRunning || !canEditDraft" @click="savePackageDraft">{{ savingDraft ? '正在保存…' : '保存草稿' }}</button>
        <button v-if="activeStep > 1" class="btn btn-secondary" type="button" :disabled="submitting || savingDraft || trialRunning" @click="goPrevious">上一步</button>
        <button v-if="activeStep < 4" class="btn btn-primary" type="button" :disabled="submitting || savingDraft || trialRunning || !canEditDraft || (activeStep === 3 && !trialGate.ok)" @click="goNext">下一步</button>
        <button
          v-else
          class="btn btn-primary"
          type="button"
          :disabled="submitting || savingDraft || trialRunning || !trialGate.ok || !canEditDraft || !submissionEvaluation.ok || dependencyHealth.status === 'paused'"
          @click="submitPackage"
        >{{ submitting ? '正在提交…' : draft ? '重新提交审核' : '提交审核' }}</button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ContentPageHeader from '@/components/content/ContentPageHeader.vue'
import SectionHeader from '@/components/content/SectionHeader.vue'
import ScenarioSkillPackageComposer from './ScenarioSkillPackageComposer.vue'
import ScenarioNodeContractSummary from './ScenarioNodeContractSummary.vue'
import ScenarioPackageTrialPanel from './ScenarioPackageTrialPanel.vue'
import ScenarioTestReportSummary from './ScenarioTestReportSummary.vue'
import { createScenarioSimulationRequest, isScenarioSimulationCurrent, evaluateScenarioTrialForSubmit, type ScenarioSimulationReport, type ScenarioSimulationRequest } from '@/domain/scenarioPackageTesting.js'
import { useAppStore } from '@/stores/app'
import {
  useScenarioSkillPackagesStore,
  type ScenarioDependencyState,
  type ScenarioDraftEvaluation,
  type ScenarioPackageHealth,
  type ScenarioPinnedStep,
  type ScenarioSkillPackage,
  type ScenarioSkillPackageDraft
} from '@/stores/scenarioSkillPackages'
import {
  evaluatePackageForPublish,
  canAuthorScenarioPackage,
  resolveScenarioChain
} from '@/domain/scenarioSkillPackages.js'

type StepId = 1 | 2 | 3 | 4
type EvaluationTone = 'pass' | 'warn' | 'block'
type PolicyEvaluation = { ok: boolean; canSelfApprove: boolean; reasons: string[] }
type EvaluationCard = {
  key: 'composition' | 'dependency' | 'chain' | 'runtime'
  title: string
  status: '通过' | '提醒' | '阻断'
  tone: EvaluationTone
  detail: string
  lines: string[]
}

const emit = defineEmits<{
  cancel: []
  saved: [item: ScenarioSkillPackage]
  submitted: [item: ScenarioSkillPackage]
}>()
const props = defineProps<{ draft?: ScenarioSkillPackageDraft }>()

const appStore = useAppStore()
const scenarioStore = useScenarioSkillPackagesStore()

const steps: Array<{ id: StepId; label: string }> = [
  { id: 1, label: '1. 场景定义' },
  { id: 2, label: '2. Skill 链路编排' },
  { id: 3, label: '3. 试运行' },
  { id: 4, label: '4. 提交审核' }
]

const activeStep = ref<StepId>(1)
const maxVisitedStep = ref<StepId>(1)
const form = ref({
  name: props.draft?.name ?? '职场人群认证经营管理',
  description: props.draft?.description ?? '适用于企业运营人员需要了解职场人群认证情况、分析人群经营表现并确定跟进对象的场景。当用户提出认证人群经营分析、运营复盘或客户跟进需求时使用，输出认证分析、经营建议和跟进对象清单。不用于办理认证或直接执行客户触达。',
  targetAudience: props.draft?.targetAudience ?? '企业运营人员、职场人群运营负责人'
})
const chain = ref<ScenarioPinnedStep[]>(cloneSteps(props.draft?.steps || []))
const testReport = ref<ScenarioSimulationReport | null>(props.draft?.testReport ? JSON.parse(JSON.stringify(props.draft.testReport)) : null)
const testRequest = ref<ScenarioSimulationRequest>(props.draft?.testRequest
  ? JSON.parse(JSON.stringify(props.draft.testRequest))
  : testReport.value ? JSON.parse(JSON.stringify(testReport.value.request)) : createScenarioSimulationRequest({ ...form.value, steps: chain.value }))
testRequest.value.approvedStepIds = []
const isTestCurrent = computed(() => isScenarioSimulationCurrent(testReport.value, currentDraft(), publishedSkills.value, testRequest.value))
const trialRunning = ref(false)
const trialGate = computed(() => evaluateScenarioTrialForSubmit(currentDraft(), publishedSkills.value))
const trialErrors = computed<Record<string, string[]>>(() => Object.fromEntries(
  (testReport.value?.nodes || []).filter(node => node.status === 'blocked').map(node => [node.id, node.errors?.length ? node.errors : node.issues])
))
const trialSuggestions = computed<Record<string, string[]>>(() => Object.fromEntries(
  (testReport.value?.nodes || []).filter(node => node.status === 'blocked').map(node => [node.id, node.suggestions || []])
))
const submitting = ref(false)
const savingDraft = ref(false)
const submitError = ref('')
const validationErrors = ref<string[]>([])
const tabElements = new Map<StepId, HTMLButtonElement>()
const bodySection = ref<HTMLElement | null>(null)
const definitionSection = ref<HTMLElement | null>(null)
const compositionSection = ref<HTMLElement | null>(null)
const testingSection = ref<HTMLElement | null>(null)
const composer = ref<InstanceType<typeof ScenarioSkillPackageComposer> | null>(null)
const submissionSection = ref<HTMLElement | null>(null)
const draftId = props.draft?.id || `scenario-package-${Date.now().toString(36)}`
const draftBaseUpdatedAt = props.draft?.baseUpdatedAt

const emptyPolicyEvaluation = (): PolicyEvaluation => ({ ok: false, canSelfApprove: false, reasons: [] })
const emptyHealthEvaluation = (): ScenarioPackageHealth => ({
  status: 'healthy',
  explanations: [],
  blockedStepIds: [],
  degradedStepIds: []
})

const submissionEvaluation = ref<PolicyEvaluation>(emptyPolicyEvaluation())
const policyEvaluation = ref<PolicyEvaluation>(emptyPolicyEvaluation())
const chainEvaluation = ref<PolicyEvaluation>(emptyPolicyEvaluation())
const dependencyHealth = ref<ScenarioPackageHealth>(emptyHealthEvaluation())
const evaluatedDraft = ref<ScenarioSkillPackageDraft | null>(null)
const liveEligibilityReasons = ref<string[]>([])

const editingActorId = appStore.user || ''
const ownerId = computed(() => props.draft?.ownerId || appStore.user || '')
const actor = computed(() => ({ id: appStore.user || '', permissions: appStore.permissions }))
const editAccessError = computed(() => {
  if (!actor.value.id) return '请登录后创建或编辑场景技能包。'
  if (actor.value.id !== editingActorId) return '登录账号已变化，请返回列表后重新打开编辑。'
  if (!props.draft) return canAuthorScenarioPackage(actor.value)
    ? '' : '缺少创建技能包或跨菜单编排权限。'
  if (!scenarioStore.actionsFor(draftId, actor.value).includes('edit')) return '当前状态或权限不允许编辑，待审核内容暂不可编辑。'
  if (scenarioStore.findPackage(draftId)?.updatedAt !== draftBaseUpdatedAt) return '技能包状态已更新，请返回列表后重新打开编辑。'
  return ''
})
const canEditDraft = computed(() => !editAccessError.value)
const hasDependencyUpgrade = computed(() => chain.value.some(step => {
  const current = scenarioStore.selectableSkills.find(skill => skill.id === step.skillId)
  return current && current.online !== step.pinnedVersion
}))
const displayedValidationErrors = computed(() => [...new Set([
  ...(editAccessError.value ? [editAccessError.value] : []),
  ...validationErrors.value
])])
const publishedSkills = computed(() => (
  scenarioStore.selectableSkills.filter(skill => skill.onlineStatus === 'published')
))
const selectedSkillIds = computed(() => chain.value.map(step => step.skillId))
const selectedMenus = computed(() => [...new Set(chain.value.map(step => step.menu))])
const selectedMenuCount = computed(() => selectedMenus.value.length)
const resolvedChain = computed(() => resolveScenarioChain(chain.value))
const evaluatedSteps = computed(() => evaluatedDraft.value?.steps || chain.value)
const unavailableSelectedSteps = computed(() => {
  const availableIds = new Set(publishedSkills.value.map(skill => skill.id))
  return chain.value.filter(step => !availableIds.has(step.skillId))
})

const compositionReasons = computed(() => (
  policyEvaluation.value.reasons.filter(reason => !chainEvaluation.value.reasons.includes(reason))
))

const evaluationCards = computed<EvaluationCard[]>(() => {
  const compositionOk = compositionReasons.value.length === 0
  const dependencyTone: EvaluationTone = liveEligibilityReasons.value.length || dependencyHealth.value.status === 'paused'
    ? 'block'
    : dependencyHealth.value.status === 'healthy'
      ? 'pass'
      : 'warn'
  const dependencyStatus = dependencyTone === 'block' ? '阻断' : dependencyTone === 'warn' ? '提醒' : '通过'

  return [
    {
      key: 'composition',
      title: '跨菜单编排权限',
      status: compositionOk ? '通过' : '阻断',
      tone: compositionOk ? 'pass' : 'block',
      detail: compositionOk ? `当前账号 ${actor.value.id} 具备本次编排和提交权限。` : '当前账号不能提交本次跨菜单编排。',
      lines: compositionReasons.value
    },
    {
      key: 'dependency',
      title: '依赖版本快照',
      status: dependencyStatus,
      tone: dependencyTone,
      detail: dependencyTone === 'pass' ? '所有步骤均保留明确的固定版本和当前发布版本。' : '检测到需要关注的版本或依赖状态。',
      lines: [...liveEligibilityReasons.value, ...dependencyHealth.value.explanations]
    },
    {
      key: 'chain',
      title: '链路完整性',
      status: chainEvaluation.value.ok ? '通过' : '阻断',
      tone: chainEvaluation.value.ok ? 'pass' : 'block',
      detail: chainEvaluation.value.ok ? '必需链路、条件和声明范围完整。' : '当前执行链未满足提交要求。',
      lines: chainEvaluation.value.reasons
    },
    {
      key: 'runtime',
      title: '运行时权限',
      status: '提醒',
      tone: 'warn',
      detail: '提交审核不会授予最终调用方任何新增权限。',
      lines: ['最终调用方仍需具备实际的菜单、Skill、数据和操作权限，并在每次调用时重新校验。']
    }
  ]
})

function cloneSteps(stepsToClone: ScenarioPinnedStep[]): ScenarioPinnedStep[] {
  return stepsToClone.map(step => ({
    ...step,
    requiresApproval: false,
    position: step.position ? { ...step.position } : undefined,
    permissions: {
      menu: [...step.permissions.menu],
      skill: [...step.permissions.skill],
      data: [...step.permissions.data],
      action: [...step.permissions.action]
    }
  }))
}

function executionSteps(): ScenarioPinnedStep[] {
  return cloneSteps(chain.value).map(step => {
    const publishedSkill = publishedSkills.value.find(skill => skill.id === step.skillId && skill.online === step.pinnedVersion)
    return {
      ...step,
      task: step.task?.trim() ? step.task : publishedSkill?.description?.trim() || '',
      condition: step.kind === 'conditional' ? step.condition?.trim() : undefined
    }
  })
}

function currentDraft(): ScenarioSkillPackageDraft {
  return {
    id: draftId,
    ...(draftBaseUpdatedAt ? { baseUpdatedAt: draftBaseUpdatedAt } : {}),
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    targetAudience: form.value.targetAudience.trim(),
    ownerId: ownerId.value,
    testRequest: testRequest.value,
    ...(testReport.value ? { testReport: testReport.value } : {}),
    steps: executionSteps()
  }
}

function recomputeEvaluation() {
  const evaluation = scenarioStore.evaluateDraft(currentDraft(), actor.value) as ScenarioDraftEvaluation
  evaluatedDraft.value = evaluation.draft
  liveEligibilityReasons.value = evaluation.eligibilityReasons
  const accessReasons = editAccessError.value ? [editAccessError.value] : []
  policyEvaluation.value = {
    ...evaluation.policy,
    ok: evaluation.policy.ok && !accessReasons.length,
    reasons: [...accessReasons, ...evaluation.policy.reasons]
  }
  submissionEvaluation.value = {
    ok: evaluation.ok && !accessReasons.length,
    canSelfApprove: false,
    reasons: [...accessReasons, ...evaluation.reasons]
  }
  chainEvaluation.value = evaluatePackageForPublish(
    evaluation.draft,
    { id: evaluation.draft.ownerId, permissions: ['*'] }
  ) as PolicyEvaluation
  dependencyHealth.value = evaluation.health
}

function setTabRef(step: StepId, element: unknown) {
  if (element instanceof HTMLButtonElement) tabElements.set(step, element)
  else tabElements.delete(step)
}

function focusTab(step: StepId) {
  void nextTick(() => tabElements.get(step)?.focus())
}

function focusSection(section: StepId) {
  const targets: Record<StepId, HTMLElement | null> = {
    1: definitionSection.value,
    2: compositionSection.value,
    3: testingSection.value,
    4: submissionSection.value
  }
  void nextTick(() => {
    targets[section]?.focus({ preventScroll: true })
    bodySection.value?.scrollTo({ top: 0 })
  })
}

function showValidation(errors: string[], section: StepId) {
  activeStep.value = section
  validationErrors.value = errors
  focusSection(section)
  return false
}

function validateStep(step: StepId) {
  if (editAccessError.value) return showValidation([editAccessError.value], 1)
  if (step === 1) {
    const missing = [
      ['技能包名称', form.value.name],
      ['场景描述', form.value.description],
      ['目标人群', form.value.targetAudience]
    ].filter(([, value]) => !value.trim()).map(([label]) => `请填写${label}`)
    if (missing.length) return showValidation(missing, 1)
  }
  if (step === 2) {
    const errors: string[] = []
    if (new Set(selectedSkillIds.value).size < 2) errors.push('请至少选择两个不同的已发布 Skill')
    if (selectedMenuCount.value < 2) errors.push('请至少选择来自两个一级菜单的 Skill')
    if (unavailableSelectedSteps.value.length) errors.push('请移除已禁用、撤回或不再发布的 Skill')
    errors.push(...resolvedChain.value.reasons)
    if (errors.length) return showValidation(errors, 2)
    if (!chain.value.some(item => item.required)) {
      return showValidation(['请至少设置一个必需步骤'], 2)
    }
    const missingConditions = chain.value.filter(item => item.kind === 'conditional' && !item.condition?.trim())
    if (missingConditions.length) {
      return showValidation(
        missingConditions.map(item => `请为条件步骤“${item.name}”填写触发条件`),
        2
      )
    }
  }
  if (step === 3) {
    const errors = [...submissionEvaluation.value.reasons, ...trialGate.value.reasons]
    if (errors.length) return showValidation([...new Set(errors)], 3)
  }
  validationErrors.value = []
  return true
}

function goNext() {
  if (submitting.value || savingDraft.value || trialRunning.value) return
  if (activeStep.value === 3) recomputeEvaluation()
  if (!validateStep(activeStep.value)) return
  const next = Math.min(4, activeStep.value + 1) as StepId
  if (next >= 3) recomputeEvaluation()
  activeStep.value = next
  maxVisitedStep.value = Math.max(maxVisitedStep.value, next) as StepId
  focusSection(next)
}

function goPrevious() {
  if (submitting.value || savingDraft.value || trialRunning.value) return
  validationErrors.value = []
  const previous = Math.max(1, activeStep.value - 1) as StepId
  activeStep.value = previous
  focusSection(previous)
}

function goToStep(step: StepId) {
  if (submitting.value || savingDraft.value || trialRunning.value || !canEditDraft.value || step > maxVisitedStep.value) return
  validationErrors.value = []
  if (step >= 3) recomputeEvaluation()
  if (step === 4 && !validateStep(3)) return
  activeStep.value = step
  focusTab(step)
  void nextTick(() => bodySection.value?.scrollTo({ top: 0 }))
}

function handleTabKeydown(event: KeyboardEvent, step: StepId) {
  const reachableSteps = steps.filter(item => item.id <= maxVisitedStep.value)
  const currentIndex = reachableSteps.findIndex(item => item.id === step)
  if (currentIndex < 0) return

  let target: StepId | null = null
  if (event.key === 'ArrowLeft') {
    target = reachableSteps[(currentIndex - 1 + reachableSteps.length) % reachableSteps.length]?.id || null
  } else if (event.key === 'ArrowRight') {
    target = reachableSteps[(currentIndex + 1) % reachableSteps.length]?.id || null
  } else if (event.key === 'Home') {
    target = reachableSteps[0]?.id || null
  } else if (event.key === 'End') {
    target = reachableSteps[reachableSteps.length - 1]?.id || null
  }

  if (!target) return
  event.preventDefault()
  goToStep(target)
}

function returnToComposition(stepId?: string | Event) {
  if (trialRunning.value) return
  validationErrors.value = []
  activeStep.value = 2
  focusSection(2)
  if (typeof stepId === 'string') void nextTick(() => composer.value?.focusNode(stepId))
}

function dependencyStateLabel(state: ScenarioDependencyState) {
  const labels: Record<ScenarioDependencyState, string> = {
    available: '可用',
    update_available: '有新版本，保持固定版本',
    expired: '已过期',
    unavailable: '不可用',
    emergency_disabled: '紧急停用'
  }
  return labels[state]
}

async function submitPackage() {
  if (submitting.value || savingDraft.value || trialRunning.value || !validateStep(1)) return
  submitError.value = ''
  recomputeEvaluation()
  if (!validateStep(2) || !validateStep(3)) return
  submitting.value = true
  try {
    const submitted = scenarioStore.submitDraft(currentDraft(), actor.value)
    emit('submitted', submitted)
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '提交失败，请检查自动评估后重试。'
    showValidation([submitError.value], 4)
  } finally {
    submitting.value = false
  }
}

async function savePackageDraft() {
  if (submitting.value || savingDraft.value || trialRunning.value || !canEditDraft.value) return
  if (!form.value.name.trim()) return showValidation(['请填写技能包名称后保存草稿'], 1)
  savingDraft.value = true
  submitError.value = ''
  validationErrors.value = []
  try {
    const saved = scenarioStore.saveDraft({ ...currentDraft(), steps: cloneSteps(chain.value) }, actor.value)
    emit('saved', saved)
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败，请重试。'
    showValidation([message], activeStep.value)
  } finally {
    savingDraft.value = false
  }
}

watch([form, chain, canEditDraft, publishedSkills], () => {
  if (!canEditDraft.value) return
  const input = createScenarioSimulationRequest({ ...form.value, steps: executionSteps() }).input
  if (testRequest.value.input !== input || Object.keys(testRequest.value.sampleOutputs || {}).length) {
    testRequest.value = { ...testRequest.value, input, sampleOutputs: {} }
  }
}, { deep: true, immediate: true })

watch([form, chain, actor, testReport, testRequest], () => {
  submitError.value = ''
  evaluatedDraft.value = null
  liveEligibilityReasons.value = []
}, { deep: true })
</script>

<style scoped>
.scenario-package-trial-checks { margin-top: 24px; padding: 16px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.scenario-package-trial-checks > summary { cursor: pointer; color: var(--color-text-secondary); font-size: var(--text-sm); }
.scenario-package-trial-checks[open] > summary { margin-bottom: 16px; }
.scenario-package-trial-checks > summary:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.scenario-package-create {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  color: var(--color-text);
  container-type: inline-size;
}


.scenario-package-tabs {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
  padding: 4px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.scenario-package-tab {
  min-width: 0;
  min-height: 36px;
  padding: 8px 12px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
  line-height: 1.5;
  cursor: pointer;
}
.scenario-package-tab:hover:not(:disabled):not(.is-active) {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}
.scenario-package-tab.is-active {
  color: var(--color-surface);
  background: var(--color-primary);
}
.scenario-package-tab:disabled {
  color: var(--color-text-tertiary);
  background: transparent;
  cursor: not-allowed;
}

.scenario-package-tab:focus-visible,
.scenario-package-alert:focus-visible,
.scenario-package-panel:focus-visible,
.scenario-package-snapshot-table:focus-visible,
.scenario-package-field input:focus,
.scenario-package-field textarea:focus {
  outline: none;
  box-shadow: var(--focus-ring);
}

.scenario-package-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 0 24px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.scenario-package-node-review {
  margin-top: 20px;
}

.scenario-package-alert {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background: var(--color-danger-subtle);
  color: var(--color-danger);
  font-size: 13px;
  line-height: 1.6;
}

.scenario-package-alert ul,
.scenario-package-evaluation ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.scenario-package-panel {
  box-sizing: border-box;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.has-workspace-surface .scenario-package-body {
  margin-top: 16px;
  border-top: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border-right: 1px solid var(--color-border-subtle);
  border-left: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}

.is-definition .scenario-package-body {
  padding: 24px 0;
}

.scenario-package-definition-panel {
  width: 100%;
  margin: 0;
  padding: 0 24px;
  border: 0;
  border-radius: 0;
}

.scenario-package-definition-heading {
  margin-bottom: 16px;
}


.scenario-package-section-head,
.scenario-package-evaluation-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px 16px;
}

.scenario-package-section-head {
  margin-bottom: 20px;
}

.scenario-package-section-head > div {
  min-width: 0;
}

.scenario-package-section-head h2,
.scenario-package-evaluation h3,
.scenario-package-snapshots h3,
.scenario-package-review-grid h3 {
  margin: 0;
  color: var(--color-text);
}

.scenario-package-section-head h2 {
  font-size: 16px;
  line-height: 1.5;
}

.scenario-package-section-head p,
.scenario-package-evaluation p,
.scenario-package-runtime-notice p {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.scenario-package-section-head > span {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.6;
}

.scenario-package-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.scenario-package-field {
  display: grid;
  min-width: 0;
  gap: 8px;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 500;
}

.scenario-package-field-wide {
  grid-column: 1 / -1;
}

.scenario-package-field b {
  color: var(--color-danger);
  font-size: 12px;
  font-weight: 500;
}

.scenario-package-create .scenario-package-field input,
.scenario-package-create .scenario-package-field textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: 1.5;
  box-shadow: none;
}

.scenario-package-create .scenario-package-field textarea {
  min-height: 88px;
  resize: vertical;
}

.scenario-package-create .scenario-package-field input {
  height: var(--control-height-md);
  padding-block: 0;
}

.scenario-package-static-field,
.scenario-package-static-field dd {
  margin: 0;
}

.scenario-package-static-field dd {
  font-weight: 400;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.scenario-package-create .scenario-package-field input:focus,
.scenario-package-create .scenario-package-field textarea:focus {
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}

.scenario-package-field small {
  color: var(--color-text-tertiary);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
}

.scenario-package-composition-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.scenario-package-composition-panel > .scenario-package-version-note {
  flex: 0 0 auto;
  margin: 0 0 12px;
}

.is-composition .scenario-package-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  scrollbar-gutter: auto;
}

.is-composition .scenario-package-alert {
  flex: 0 0 auto;
  min-height: 0;
  max-height: 30%;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.scenario-package-evaluation h3,
.scenario-package-snapshots h3,
.scenario-package-review-grid h3 {
  font-size: var(--text-base);
  line-height: 1.5;
}

.scenario-package-version-note {
  margin: 12px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--text-xs);
  line-height: 1.6;
}

.scenario-package-evaluations {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.scenario-package-evaluation {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--color-border-subtle);
  border-left-width: 3px;
  border-radius: var(--radius-md);
}

.scenario-package-evaluation.is-pass {
  border-left-color: var(--color-success);
  background: var(--color-success-subtle);
}

.scenario-package-evaluation.is-warn {
  border-left-color: var(--color-warning);
  background: var(--color-warning-subtle);
}

.scenario-package-evaluation.is-block {
  border-left-color: var(--color-danger);
  background: var(--color-danger-subtle);
}

.scenario-package-evaluation-head span {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
}

.scenario-package-evaluation ul {
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.scenario-package-snapshots {
  margin-top: 20px;
}

.scenario-package-return-selection {
  margin-top: 16px;
}

.scenario-package-snapshot-table {
  margin-top: 12px;
  overflow-x: auto;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.scenario-package-snapshot-table table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: 12px;
}

.scenario-package-snapshot-table th,
.scenario-package-snapshot-table td {
  padding: 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  text-align: left;
}

.scenario-package-snapshot-table th {
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.scenario-package-snapshot-table tr:last-child td {
  border-bottom: 0;
}

.scenario-package-review-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.scenario-package-review-grid article {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
}

.scenario-package-review-grid dl {
  display: grid;
  gap: 12px;
  margin: 12px 0 0;
}

.scenario-package-review-grid dl div {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  font-size: 12px;
  line-height: 1.6;
}

.scenario-package-review-grid dt {
  color: var(--color-text-tertiary);
}

.scenario-package-review-grid dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text);
}

.scenario-package-runtime-notice {
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  background: var(--color-warning-subtle);
}

.scenario-package-runtime-notice strong {
  font-size: 13px;
}

.scenario-package-submit-error {
  margin: 12px 0 0;
  color: var(--color-danger);
  font-size: 13px;
}

.scenario-package-actions {
  position: sticky;
  z-index: 2;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 60px;
  padding: 12px 20px;
  box-sizing: border-box;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-surface);
}

.has-workspace-surface .scenario-package-actions {
  border: 1px solid var(--color-border-subtle);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  padding-inline: 24px;
}

.scenario-package-actions > div {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-height: 640px) {
  .is-composition .scenario-package-body {
    display: block;
    overflow-y: auto;
  }

  .scenario-package-composition-panel {
    height: 520px;
  }

  .is-composition .scenario-package-alert {
    max-height: 160px;
  }
}

@container (max-width: 1039px) {
  .scenario-package-evaluations,
  .scenario-package-review-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@container (max-width: 719px) {
  .is-composition .scenario-package-body { padding: 16px; }
  .scenario-package-tabs {
    gap: 8px;
    padding: 4px;
  }

  .scenario-package-panel:not(.scenario-package-composition-panel) {
    padding: 16px;
  }

  .scenario-package-panel.scenario-package-definition-panel {
    padding-block: 0;
  }

  .scenario-package-section-head {
    flex-direction: column;
    align-items: stretch;
  }

  .scenario-package-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .scenario-package-field-wide {
    grid-column: auto;
  }

  .scenario-package-actions {
    padding: 12px 16px;
  }

  .scenario-package-actions > div {
    justify-content: flex-end;
  }
}

.scenario-package-create > .content-page-header { flex-shrink: 0; }
.scenario-package-static-field { grid-column: 1 / -1; padding-top: 16px; border-top: 1px solid var(--color-border-subtle); }
.scenario-package-definition-panel { text-align: left; }
.scenario-definition-layout { display: grid; grid-template-columns: minmax(0, 1fr) 288px; gap: 24px; align-items: start; }
.scenario-definition-layout .scenario-package-form-grid { align-content: start; }
.scenario-definition-layout textarea { min-height: 200px; resize: vertical; }
.scenario-definition-aside { display: grid; gap: 24px; min-width: 0; padding: 20px; background: var(--color-surface-subtle); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.scenario-definition-guide h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: var(--color-text); }
.scenario-definition-guide p { margin: 0; font-size: 13px; line-height: 1.7; color: var(--color-text-secondary); }
.scenario-definition-aside .scenario-package-static-field { margin: 0; }
@container (max-width: 1039px) {
  .scenario-definition-layout { grid-template-columns: minmax(0, 1fr); }
  .scenario-definition-aside { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .scenario-definition-aside .scenario-package-static-field { grid-column: auto; border-top: 0; border-left: 1px solid var(--color-border-subtle); padding: 0 0 0 24px; }
}
@container (max-width: 479px) {
  .scenario-definition-aside { grid-template-columns: minmax(0, 1fr); }
  .scenario-definition-aside .scenario-package-static-field { border-left: 0; border-top: 1px solid var(--color-border-subtle); padding: 16px 0 0; }
}
@container (max-width: 719px) { .scenario-package-form-grid { grid-template-columns: minmax(0, 1fr); } }
.is-trial .scenario-package-body { padding-bottom: 0; }
.is-trial #scenario-package-panel-3 { border-bottom: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
:is(.is-trial, .is-review) .scenario-package-actions {
  padding: 16px 20px 20px;
  border: 1px solid var(--color-border-subtle);
  border-top: 0;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
:is(.is-trial, .is-review) .scenario-package-actions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  border-top: 1px solid var(--color-border-subtle);
}
:is(.is-trial, .is-review) .scenario-package-actions .btn { height: 36px; min-height: 36px; min-width: 92px; padding: 0 16px; }

.scenario-trial-fixed-heading { flex: 0 0 auto; margin-top: 16px; padding: 20px; background: var(--color-surface); border: 1px solid var(--color-border-subtle); border-bottom: 0; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
.scenario-trial-fixed-heading :deep(.content-section-header) { margin: 0; }
.is-trial .scenario-package-body { padding-top: 0; padding-bottom: 0; background: var(--color-surface); border-inline: 1px solid var(--color-border-subtle); }
.is-trial #scenario-package-panel-3 { border: 0; border-radius: 0; padding-top: 0; }
.is-review .scenario-package-body { padding-top: 0; padding-bottom: 0; background: var(--color-surface); border-inline: 1px solid var(--color-border-subtle); }
.is-review #scenario-package-panel-4 { border: 0; border-radius: 0; padding-top: 0; }
.is-review .scenario-package-review-grid { gap: 16px; }
.is-review .scenario-package-review-grid article { padding: 16px; }
.is-review .scenario-package-node-review { margin-top: 24px; }
.is-review :deep(.test-report-navigation),
.is-review :deep(.test-report-detail) { max-height: none; overflow: visible; }

.review-trial-report :deep(.test-report-detail) { padding: 20px; gap: 20px; }
.review-trial-report :deep(.test-report-detail > .test-report-detail-heading) { padding: 12px 16px; align-items: center; background: var(--color-surface-subtle); border-radius: var(--radius-md); }
.review-trial-report :deep(.test-report-detail > .test-report-detail-heading h3) { font-size: 16px; }
.review-trial-report :deep(.test-report-detail > .test-report-detail-heading .test-report-status) { padding: 4px 8px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-surface); }
.review-trial-report :deep(.test-report-detail-section) { padding-top: 20px; gap: 16px; }
.review-trial-report :deep(.test-report-detail-section > .test-report-fields) { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.review-trial-report :deep(.test-report-detail-section > .test-report-fields > div) { padding: 12px 16px; background: var(--color-surface-subtle); border-radius: var(--radius-md); gap: 8px; }
.review-trial-report :deep(.test-report-detail-section > .test-report-fields > div:nth-child(n+3)) { grid-column: 1 / -1; padding: 0; background: transparent; }
.review-trial-report :deep(.test-report-fields dt),
.review-trial-report :deep(.test-report-comparison dt) { font-size: 12px; color: var(--color-text-secondary); }
.review-trial-report :deep(.test-report-value-list > li:has(> strong)) { padding: 12px 16px; border-left: 2px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-subtle); gap: 8px; }
.review-trial-report :deep(.test-report-value-list strong) { font-weight: 600; }
.review-trial-report :deep(.test-report-comparison) { gap: 16px; }
.review-trial-report :deep(.test-report-comparison > div) { padding: 16px; gap: 12px; background: var(--color-surface); }
.review-trial-report :deep(.test-report-comparison > div:last-child) { border-color: var(--color-primary); background: var(--color-primary-subtle); }
.review-trial-report :deep(.test-report-comparison dt) { font-weight: 600; color: var(--color-text); }
@container (max-width: 719px) {
  .review-trial-report :deep(.test-report-detail) { padding: 16px; }
  .review-trial-report :deep(.test-report-detail-section > .test-report-fields) { grid-template-columns: minmax(0, 1fr); }
}
</style>
