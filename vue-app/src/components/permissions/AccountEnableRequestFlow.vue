<template>
  <section class="account-enable-flow" aria-label="启用账号申请流程">
    <nav class="enable-stages" aria-label="申请步骤">
      <button v-if="includeTypeStep" type="button" :disabled="submitting" @click="$emit('back')">1. 选择类型</button>
      <button type="button" :class="{ active: step === 1 }" :aria-current="step === 1 ? 'step' : undefined" :disabled="submitting" @click="goToInfo">{{ includeTypeStep ? '2' : '1' }}. 填写信息</button>
      <button type="button" :class="{ active: step === 2 }" :aria-current="step === 2 ? 'step' : undefined" :disabled="submitting || !reviewReached" @click="review">{{ includeTypeStep ? '3' : '2' }}. 审批执行</button>
    </nav>

    <div v-if="duplicateRequest" class="enable-body">
      <h3>已有启用申请正在审批</h3>
      <p>请查看已有申请进度，无需重复提交。</p>
      <p>申请单号：{{ duplicateRequest.id }}</p>
      <p>审批节点：{{ duplicateRequest.node }}</p>
    </div>
    <form v-else-if="step === 1" id="enable-account-info" class="enable-body" @submit.prevent="review">
      <h3>填写信息</h3>
      <p>根据人员类型填写被申请人信息，申请单号将在提交后自动生成。</p>
      <div class="enable-type-card"><span>03</span><div><b>启用账号</b><small>申请恢复已停用账号，不会自动恢复已清理的工作台权限。</small></div></div>
      <div class="enable-fields application-info-form" :data-form-variant="schema.key">
        <div class="full enable-field">
          <span class="field-label required">人员类型 <em>必填</em></span>
          <div class="enable-person-types" role="radiogroup" aria-label="人员类型">
            <button v-for="type in personTypes" :key="type.key" type="button" role="radio" :aria-checked="modelValue.personType === type.key" :class="{ active: modelValue.personType === type.key }" :disabled="selfService || submitting" @click="update('personType', type.key)">
              <b>{{ type.label }}</b><small>{{ type.description }}</small>
            </button>
          </div>
        </div>
        <label data-info-field="applicantIdentity">
          <span class="field-label">申请人用户名/ITCode <em class="autofill">自动带出</em></span>
          <input :value="modelValue.applicant + ' / ' + modelValue.itcode" readonly aria-label="申请人用户名/ITCode">
        </label>
        <label v-if="schemaHasField(schema, 'targetItcode')" data-info-field="targetItcode">
          <span class="field-label required">被申请人 ITCode <em>必填</em></span>
          <input :value="modelValue.targetItcode" :readonly="selfService" aria-label="被申请人 ITCode" :aria-invalid="!!errors.targetItcode" :class="{ invalid: errors.targetItcode }" placeholder="请输入被申请人 ITCode" @input="update('targetItcode', valueOf($event))">
          <small v-if="errors.targetItcode" class="field-error">{{ errors.targetItcode }}</small>
        </label>
        <label v-if="schemaHasField(schema, 'targetUser')" data-info-field="targetUser">
          <span class="field-label required">被申请人用户名 <em>必填</em></span>
          <input :value="modelValue.targetUser" :readonly="selfService" aria-label="被申请人用户名" :aria-invalid="!!errors.targetUser" :class="{ invalid: errors.targetUser }" placeholder="请输入外部协作人员用户名" @input="update('targetUser', valueOf($event))">
          <small v-if="errors.targetUser" class="field-error">{{ errors.targetUser }}</small>
        </label>
        <label v-if="schemaHasField(schema, 'relatedAccount')" data-info-field="relatedAccount">
          <span class="field-label required">关联人 ITCode <em>必填</em></span>
          <input :value="modelValue.relatedAccount" aria-label="关联人 ITCode" :aria-invalid="!!errors.relatedAccount" :class="{ invalid: errors.relatedAccount }" placeholder="请输入负责对接的内部员工 ITCode" @input="update('relatedAccount', valueOf($event))">
          <small v-if="errors.relatedAccount" class="field-error">{{ errors.relatedAccount }}</small>
          <small v-else class="field-help">用于确认外部协作人员的内部对接关系。</small>
        </label>
        <label class="full" data-info-field="reason">
          <span class="field-label required">申请原因 <em>必填</em></span>
          <textarea :value="modelValue.reason" aria-label="申请原因" :aria-invalid="!!errors.reason" :class="{ invalid: errors.reason }" rows="4" placeholder="请说明启用账号的业务原因、恢复使用范围和期望生效时间。" @input="update('reason', valueOf($event))"></textarea>
          <small v-if="errors.reason" class="field-error">{{ errors.reason }}</small>
        </label>
      </div>
    </form>
    <div v-else class="enable-body">
      <h3>审批执行</h3>
      <p>系统管理员审批通过并完成启用后，请重新登录；登录时会再次检查工作台权限。</p>
      <div class="enable-approval-route">
        <div class="done"><span>1</span><b>申请人提交</b><small>{{ modelValue.applicant }}</small></div>
        <div><span>2</span><b>系统管理员审批</b><small>{{ modelValue.systemApprover }}</small></div>
      </div>
      <div class="enable-summary"><b>将提交的申请</b><p>启用账号 · {{ targetAccount }} · 提交后自动生成申请单号</p></div>
    </div>

    <footer class="enable-actions">
      <p v-if="submitError || errors.identity" class="field-error enable-feedback" role="alert">{{ submitError || errors.identity }}</p>
      <button type="button" class="ghost-btn" :disabled="submitting" @click="back">{{ step === 1 || duplicateRequest ? (includeTypeStep ? '上一步' : '取消') : '上一步' }}</button>
      <button v-if="duplicateRequest" type="button" class="primary-btn" @click="$emit('submitted', { request: duplicateRequest, duplicate: true })">查看申请进度</button>
      <button v-else-if="step === 1" type="submit" form="enable-account-info" class="primary-btn" :disabled="submitting">下一步</button>
      <button v-else type="button" class="primary-btn" :disabled="submitting" @click="submit">{{ submitting ? '正在提交…' : '提交申请' }}</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { resolveApplicationInfoSchema, schemaHasField } from './applicationInfoSchema.js'
import { submitEnableRequest, validateEnableRequest, type AccountEnableRequest, type EnableErrors, type EnableRequestDraft, type EnableSubmission } from '@/services/accountEnableRequest'

const props = withDefaults(defineProps<{
  modelValue: EnableRequestDraft
  step: number
  includeTypeStep?: boolean
  selfService?: boolean
  authorize?: () => string
}>(), { includeTypeStep: false, selfService: false, authorize: () => '' })
const emit = defineEmits<{
  'update:modelValue': [draft: EnableRequestDraft]
  'update:step': [step: number]
  back: []
  submitted: [result: EnableSubmission]
}>()
const personTypes = [
  { key: 'internal', label: '内部人员', description: '联想内部员工或已有正式账号人员。' },
  { key: 'external', label: '外部人员', description: '供应商、外包或临时协作人员，需填写关联人员。' }
]
const schema = computed(() => resolveApplicationInfoSchema('enable', props.modelValue.personType)!)
const targetAccount = computed(() => props.modelValue.personType === 'external' ? props.modelValue.targetUser : props.modelValue.targetItcode)
const errors = ref<EnableErrors>({})
const submitError = ref('')
const submitting = ref(false)
const reviewReached = ref(props.step === 2)
const duplicateRequest = ref<AccountEnableRequest | null>(null)
const valueOf = (event: Event) => (event.target as HTMLInputElement | HTMLTextAreaElement).value

function update(field: keyof EnableRequestDraft, value: string) {
  if (props.selfService && ['personType', 'targetUser', 'targetItcode', 'itcode', 'applicant'].includes(field)) return
  emit('update:modelValue', { ...props.modelValue, [field]: value })
  errors.value = {}
  submitError.value = ''
  reviewReached.value = false
}
function check() {
  submitError.value = props.authorize?.() || ''
  errors.value = validateEnableRequest(props.modelValue)
  return !submitError.value && !Object.keys(errors.value).length
}
function review() {
  if (!check()) { emit('update:step', 1); return }
  reviewReached.value = true
  emit('update:step', 2)
}
function goToInfo() {
  duplicateRequest.value = null
  emit('update:step', 1)
}
function back() {
  if (props.step === 1 || duplicateRequest.value) emit('back')
  else goToInfo()
}
async function submit() {
  if (submitting.value) return
  if (!check()) { emit('update:step', 1); return }
  submitting.value = true
  try {
    // Let the disabled/submitting state render before the synchronous POC persistence.
    await Promise.resolve()
    const result = submitEnableRequest(props.modelValue, window.localStorage)
    if (result.duplicate) duplicateRequest.value = result.request
    else emit('submitted', result)
  } catch {
    submitError.value = '申请暂时无法保存，请检查浏览器存储后重试。'
  } finally { submitting.value = false }
}
</script>

<style scoped>
.account-enable-flow { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; color: var(--color-text); --form-control-radius: var(--radius-md); }
.enable-stages { display: flex; flex-shrink: 0; gap: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 4px; margin-bottom: 16px; }
.enable-stages button { border: 0; border-radius: var(--radius-md); padding: 8px 16px; background: transparent; color: var(--color-text-secondary); font-size: 13px; font-weight: 700; cursor: pointer; }
.enable-stages button.active { background: var(--color-primary); color: var(--color-on-primary); }
.enable-stages button:disabled:not(.active) { color: var(--color-text-tertiary); cursor: not-allowed; }
.enable-body { flex: 1; min-height: 0; overflow-y: auto; padding: 4px; }
.enable-body h3 { margin: 0; font-size: 14px; font-weight: 700; line-height: 1.45; }
.enable-body p { margin: 8px 0 0; color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.enable-type-card { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-primary-subtle); }
.enable-type-card > span { color: var(--color-primary); font-size: 16px; font-weight: 700; }
.enable-type-card b { font-size: 13px; }
.enable-type-card small { display: block; margin-top: 4px; font-size: 12px; color: var(--color-text-secondary); }
.enable-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.enable-fields label, .enable-field { display: grid; gap: 8px; align-content: start; min-width: 0; }
.full { grid-column: 1 / -1; }
.field-label { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }
.field-label.required::before { content: '*'; color: var(--color-danger); }
.field-label em { border-radius: 9999px; padding: 0 8px; background: var(--color-danger-subtle); color: var(--color-danger); font-size: 12px; font-style: normal; }
.field-label em.autofill { color: var(--color-text-secondary); background: var(--color-bg-subtle); }
.enable-fields input, .enable-fields textarea { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 13px; }
.enable-fields input { min-height: var(--control-height-md); padding: 0 12px; }
.enable-fields textarea { padding: 12px; line-height: 1.6; resize: vertical; }
.enable-fields input[readonly] { background: var(--color-bg-subtle); color: var(--color-text-secondary); }
.enable-fields .invalid { border-color: var(--color-danger); }
.field-error { color: var(--color-danger); font-size: 12px; }
.field-help { color: var(--color-text-tertiary); font-size: 12px; }
.enable-person-types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.enable-person-types button { display: grid; gap: 4px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); color: var(--color-text); text-align: left; cursor: pointer; }
.enable-person-types b { font-size: 13px; }
.enable-person-types small { font-size: 12px; line-height: 1.45; color: var(--color-text-tertiary); }
.enable-person-types button.active { border-color: var(--color-primary-border); background: var(--color-primary-subtle); box-shadow: var(--focus-ring); }
.enable-person-types button:disabled { cursor: default; }
.enable-approval-route { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
.enable-approval-route > div { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); }
.enable-approval-route > .done { border-color: var(--color-success); background: var(--color-success-subtle); }
.enable-approval-route span { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 9999px; background: var(--color-primary-subtle); color: var(--color-primary); font-size: 12px; font-weight: 700; }
.enable-approval-route b, .enable-approval-route small { display: block; margin-top: 12px; overflow-wrap: anywhere; }
.enable-approval-route b { font-size: 13px; }
.enable-approval-route small { font-size: 12px; color: var(--color-text-tertiary); }
.enable-summary { margin-top: 20px; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-subtle); font-size: 13px; }
.enable-actions { display: flex; flex-shrink: 0; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 12px; border-top: 1px solid var(--color-border-subtle); padding-top: 12px; }
.enable-feedback { flex-basis: 100%; margin: 0; }
.primary-btn, .ghost-btn { min-height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 16px; background: var(--color-surface); color: var(--color-text-secondary); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-btn { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.primary-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
button:disabled { cursor: not-allowed; }
button:focus-visible, input:focus-visible, textarea:focus-visible { outline: none; box-shadow: var(--focus-ring); }
@media (max-width: 560px) { .enable-fields, .enable-person-types, .enable-approval-route { grid-template-columns: 1fr; } .enable-stages button { flex: 1; padding: 8px; } }
</style>
