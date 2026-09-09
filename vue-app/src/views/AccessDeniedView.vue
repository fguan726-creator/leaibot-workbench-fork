<template>
  <main v-permission-dialog-footer class="access-denied-page">
    <section class="access-shell">
      <header class="access-header">
        <div class="access-brand">
          <div class="access-logo">L</div>
          <span>联想乐享</span>
        </div>
        <button type="button" class="text-btn" @click="backToLogin">返回登录页</button>
      </header>

      <div v-if="submittedApplication" class="success-panel">
        <span class="success-icon">✓</span>
        <p class="access-eyebrow success">申请已提交</p>
        <h1>首次访问权限申请已进入审批</h1>
        <p>申请单号：<b>{{ submittedApplication.id }}</b>。审批全部通过后，系统会一次性开通所申请的权限。</p>
        <div class="approval-flow">
          <article class="current">
            <span>1</span>
            <b>申请人直线经理</b>
            <small>{{ submittedApplication.applicantManager }}</small>
          </article>
          <article v-for="(owner, index) in submittedApplication.businessOwners" :key="owner">
            <span>{{ index + 2 }}</span>
            <b>业务负责人</b>
            <small>{{ businessApproverLabel(owner) }}</small>
          </article>
          <article>
            <span>{{ submittedApplication.businessOwners.length + 2 }}</span>
            <b>系统自动生效</b>
            <small>全部审批通过后执行</small>
          </article>
        </div>
        <div class="success-actions">
          <button type="button" class="secondary-btn" @click="backToLogin">返回登录页</button>
        </div>
      </div>

      <template v-else>
        <section class="access-intro">
          <p class="access-eyebrow">访问权限未开通</p>
          <h1>当前账号暂无乐享 AI 工作台访问权限</h1>
          <p>您的内部账号已完成认证，无需另行申请账号。请在当前页面补充基本信息并选择权限范围，提交后进入统一审批。</p>
          <div class="account-strip">
            <span>当前 ITCode</span>
            <b>{{ itcode }}</b>
            <em>内部用户首次访问</em>
          </div>
        </section>

        <nav class="step-tabs" aria-label="首次访问权限申请步骤">
          <button
            v-for="(step, index) in steps"
            :key="step"
            type="button"
            :class="{ active: currentStep === index, completed: index < currentStep }"
            :disabled="index > maxStep"
            @click="currentStep = index"
          >
            <span>{{ index + 1 }}.</span>{{ step }}
          </button>
        </nav>

        <form class="application-form" @submit.prevent="nextOrSubmit">
          <section v-if="currentStep === 0" class="form-step">
            <div class="section-heading">
              <div>
                <h2>填写基本信息</h2>
                <p>账号信息用于识别申请人，联系方式用于审批沟通。</p>
              </div>
              <span>首次访问申请</span>
            </div>
            <div class="form-grid">
              <label>
                <span>申请人 ITCode</span>
                <input :value="itcode" readonly>
                <small class="field-help">登录认证后自动带出。</small>
              </label>
              <label>
                <span>直线经理</span>
                <input v-model.trim="form.manager" readonly>
                <small class="field-help">根据组织关系自动带出。</small>
              </label>
              <label>
                <span>手机号 <em class="optional">选填</em></span>
                <input v-model.trim="form.mobile" placeholder="用于审批沟通">
              </label>
              <label>
                <span>邮箱 <em class="optional">选填</em></span>
                <input v-model.trim="form.email" type="email" placeholder="name@lenovo.com">
              </label>
              <BusinessApproverField v-model="form.businessApprover" :error="errors.businessApprover" @update:model-value="errors.businessApprover = ''" />
              <label class="full">
                <span>申请原因 <em class="optional">选填</em></span>
                <textarea v-model.trim="form.reason" rows="4" placeholder="可补充需要访问工作台的业务场景"></textarea>
              </label>
            </div>
          </section>

          <section v-else-if="currentStep === 1" class="form-step">
            <PermissionScopeEditor
              :tenant-options="tenantOptions"
              :selected-tenant-ids="form.tenant"
              :tenant-error="errors.tenant"
              :selected-roles="selectedRoles"
              :copied-from-user="copiedFromUser"
              :copied-roles="copiedRoles"
              :copied-data-permissions="copiedDataPermissions"
              :manual-data-permissions="manualDataPermissions"
              @toggle-tenant="toggleTenant"
              @add-role="openRoleModal"
              @copy-role="openCopyModal"
              @select-data="openDataModal"
              @inspect-role="inspectRole"
              @remove-role="removeRole"
              @remove-data="removeDataPermission"
            />
          </section>

          <section v-else class="form-step">
            <div class="section-heading">
              <div>
                <h2>确认并提交</h2>
                <p>本页仅确认审批流。权限变化明细将在审批侧展示。</p>
              </div>
              <span>等待提交</span>
            </div>
            <div class="approval-flow">
              <article>
                <span>1</span>
                <b>申请人直线经理</b>
                <small>{{ form.manager }}</small>
              </article>
              <article v-for="(owner, index) in businessOwners" :key="owner">
                <span>{{ index + 2 }}</span>
                <b>业务负责人</b>
                <small>{{ businessApproverLabel(owner) }}</small>
              </article>
              <article>
                <span>{{ businessOwners.length + 2 }}</span>
                <b>系统自动生效</b>
                <small>全部审批通过后执行</small>
              </article>
            </div>
            <div class="scope-confirm-summary">
              <b>将提交的权限范围</b>
              <p>{{ allSelectedRoles.length }} 个角色、{{ selectedFunctionIds.length }} 项功能权限、{{ selectedDataIds.length }} 项数据权限、{{ form.tenant.length }} 个所属租户。</p>
            </div>
            <div class="submit-note">
              <b>所选业务负责人审批通过后统一生效</b>
              <p>审批完成前不会提前开通部分权限；整张申请通过后，系统一次性生效。</p>
            </div>
          </section>

          <p v-if="submitError" class="submit-error">{{ submitError }}</p>
          <footer class="form-actions">
            <button v-if="currentStep > 0" type="button" class="secondary-btn" @click="currentStep -= 1">上一步</button>
            <button type="submit" class="primary-btn">{{ currentStep === steps.length - 1 ? '提交申请' : '下一步' }}</button>
          </footer>
        </form>

        <PermissionRolePickerModal
          :visible="roleModal.visible"
          :roles="filteredRoles"
          :detail-role="roleModalDetail"
          :permission-groups="rolePermissionGroups"
          :keyword="roleModal.keyword"
          :detail-keyword="roleModal.detailKeyword"
          :active-permission-tab="roleModal.activePermissionTab"
          :selected-role-ids="roleModal.selectedIds"
          :selected-function-ids="roleModal.selectedFunctionIds"
          :selected-data-ids="roleModal.selectedDataIds"
          :locked-role-ids="copiedRoleIds"
          :conflicts="roleModalConflicts"
          @close="closeRoleModal"
          @confirm="confirmRoleSelection"
          @open-detail="openRoleDetail($event.id)"
          @close-detail="closeRoleDetail"
          @toggle-role="toggleRoleDraft"
          @toggle-function="toggleRoleFunctionDraft"
          @toggle-data="toggleRoleDataDraft"
          @update:keyword="roleModal.keyword = $event; syncRoleModalDetailWithResults()"
          @update:detail-keyword="roleModal.detailKeyword = $event"
          @update:active-permission-tab="roleModal.activePermissionTab = $event"
        />

        <PermissionCopyRoleModal
          :visible="copyModal.visible"
          :itcode="copyModal.itcode"
          :error="copyModal.error"
          @close="closeCopyModal"
          @confirm="confirmCopyPermissions"
          @update:itcode="copyModal.itcode = $event; copyModal.error = ''"
        />

        <PermissionDataPickerModal
          :visible="dataModal.visible"
          :directories="dataPermissionDirectories"
          :selected-ids="dataModal.selectedIds"
          :locked-ids="copiedDataIds"
          :locked-labels="copiedDataSourceMap"
          @close="closeDataModal"
          @confirm="confirmDataSelection"
          @toggle="toggleDataDraft"
        />
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { vPermissionDialogFooter } from '../components/permissions/permissionDialogFooter'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import PermissionCopyRoleModal from '@/components/permissions/PermissionCopyRoleModal.vue'
import PermissionDataPickerModal from '@/components/permissions/PermissionDataPickerModal.vue'
import PermissionScopeEditor from '@/components/permissions/PermissionScopeEditor.vue'
import BusinessApproverField from '@/components/permissions/BusinessApproverField.vue'
import { businessApproverError, businessApproverLabel } from '@/components/permissions/businessApprovers.js'
import { createPermissionScopeCatalog, groupDataPermissionsByDirectory, groupPermissionCatalog } from '@/components/permissions/permissionScopeCatalog'
import { permissionScopeValidation } from '@/components/permissions/permissionScopeSnapshot.js'
import PermissionRolePickerModal from '@/components/permissions/PermissionRolePickerModal.vue'
import { detectCustomDataRoleConflicts } from '@/components/permissions/customDataRoleConflict.js'

interface FirstAccessApplication {
  id: string
  typeKey: string
  type: string
  applicant: string
  applicantItcode: string
  applicantPersonType: string
  target: string
  targetItcode: string
  personType: string
  applicantManager: string
  targetManager: string
  businessApprover: string
  businessOwners: string[]
  approverItcode: string
  handlers: string[]
  nodeType: string
  node: string
  status: string
  statusKey: string
  time: string
  reason: string
  mobile: string
  email: string
  businessInfo: { tenant: string[]; organizations: string[] }
  permissionSnapshot: Record<string, unknown>
  approvalLogs: Array<Record<string, string>>
}


const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const steps = ['基本信息', '权限范围', '提交申请']
const currentStep = ref(0)
const maxStep = ref(0)
const submitError = ref('')
const submittedApplication = ref<FirstAccessApplication | null>(null)
const selectedRoleIds = ref<string[]>([])
const copiedRoleIds = ref<string[]>([])
const copiedDataSourceMap = reactive<Record<string, string>>({})
const selectedRoleFunctionIds = ref<string[]>([])
const selectedRoleDataIds = ref<string[]>([])
const manualDataIds = ref<string[]>([])
const copiedFromItcode = ref('')
const { tenantOptions, roles, functionPermissions, dataPermissions, copyableUsers } = createPermissionScopeCatalog()
const roleModal = reactive({ visible: false, keyword: '', selectedIds: [] as string[], selectedFunctionIds: [] as string[], selectedDataIds: [] as string[], detailRoleId: '', detailKeyword: '', activePermissionTab: 'function' })
const copyModal = reactive({ visible: false, itcode: '', error: '' })
const dataModal = reactive({ visible: false, selectedIds: [] as string[] })

const itcode = computed(() => String(route.query.itcode || appStore.user || 'noaccess'))
const form = reactive({
  manager: 'sunll1',
  businessApprover: '',
  mobile: '',
  email: '',
  reason: '',
  tenant: [] as string[]
})
const errors = reactive({ tenant: '', businessApprover: '' })
const selectedRoles = computed(() => roles.filter((role) => selectedRoleIds.value.includes(role.id)))
const copiedRoles = computed(() => roles.filter((role) => copiedRoleIds.value.includes(role.id)))
const allSelectedRoles = computed(() => [...selectedRoles.value, ...copiedRoles.value.filter((role) => !selectedRoleIds.value.includes(role.id))])
const allSelectedRoleConflicts = computed(() => detectCustomDataRoleConflicts(allSelectedRoles.value))
const roleModalConflicts = computed(() => detectCustomDataRoleConflicts(roles.filter((role) => [...roleModal.selectedIds, ...copiedRoleIds.value].includes(role.id))))
const copiedFromUser = computed(() => copyableUsers.find((user) => user.itcode === copiedFromItcode.value) || null)
const copiedDataIds = computed(() => Object.keys(copiedDataSourceMap))
const copiedDataPermissions = computed(() => dataPermissions.filter((permission) => copiedDataIds.value.includes(permission.id)).map((permission) => ({ ...permission, source: copiedDataSourceMap[permission.id] })))
const manualDataPermissions = computed(() => dataPermissions.filter((permission) => manualDataIds.value.includes(permission.id)))
const selectedFunctionIds = computed(() => [...new Set([...selectedRoleFunctionIds.value, ...copiedRoles.value.flatMap((role) => role.functionIds)])])
const selectedDataIds = computed(() => [...new Set([...selectedRoleDataIds.value, ...copiedDataIds.value, ...manualDataIds.value])])
const businessOwners = computed(() => form.businessApprover ? [form.businessApprover] : [])
const filteredRoles = computed(() => {
  const keyword = roleModal.keyword.trim().toLowerCase()
  return roles.filter((role) => {
    const functionText = role.functionIds.map((id) => functionPermissions.find((permission) => permission.id === id)?.name || id).join(' ')
    return `${role.name} ${role.description} ${functionText}`.toLowerCase().includes(keyword)
  })
})
const roleModalDetail = computed(() => roles.find((role) => role.id === roleModal.detailRoleId) || null)
const rolePermissionGroups = computed(() => {
  const role = roleModalDetail.value
  if (!role) return []
  const permissionIds = roleModal.activePermissionTab === 'function' ? role.functionIds : role.dataIds
  const source = roleModal.activePermissionTab === 'function' ? functionPermissions : dataPermissions
  const filtered = source.filter((permission) => permissionIds.includes(permission.id))
  return roleModal.activePermissionTab === 'function'
    ? groupPermissionCatalog(filtered, roleModal.detailKeyword)
    : groupDataPermissionsByDirectory(filtered)
})
const dataPermissionDirectories = computed(() => groupDataPermissionsByDirectory(dataPermissions))


function validateBasic() {
  errors.businessApprover = businessApproverError(form.businessApprover)
  return !errors.businessApprover
}

function roleConflictMessage(conflicts: ReturnType<typeof detectCustomDataRoleConflicts>) {
  const conflict = conflicts[0]
  if (!conflict) return ''
  const roleNames = conflict.roleNames.map((name: string) => '“' + name + '”').join('、')
  return '角色 ' + roleNames + ' 在数据集“' + conflict.datasetName + '”上的自定义权限不一致，请移除其中一个角色或先统一角色权限。'
}

function validateScope() {
  errors.tenant = permissionScopeValidation({ tenant: form.tenant }).tenantError
  const conflictMessage = roleConflictMessage(allSelectedRoleConflicts.value)
  submitError.value = conflictMessage
  return !errors.tenant && !conflictMessage
}

function toggleTenant(tenant: string) {
  form.tenant = form.tenant.includes(tenant)
    ? form.tenant.filter((item) => item !== tenant)
    : [...form.tenant, tenant]
  errors.tenant = ''
}

function openRoleModal() {
  roleModal.visible = true
  roleModal.keyword = ''
  roleModal.selectedIds = [...selectedRoleIds.value]
  roleModal.selectedFunctionIds = [...selectedFunctionIds.value]
  roleModal.selectedDataIds = [...selectedRoleDataIds.value]
  roleModal.detailRoleId = selectedRoleIds.value[0] || roles[0].id
  roleModal.detailKeyword = ''
  roleModal.activePermissionTab = 'function'
}

function closeRoleModal() {
  roleModal.visible = false
}

function openRoleDetail(roleId: string) {
  roleModal.detailRoleId = roleId
  roleModal.detailKeyword = ''
  roleModal.activePermissionTab = 'function'
}

function inspectRole(roleId: string) {
  openRoleModal()
  openRoleDetail(roleId)
}

function closeRoleDetail() {
  roleModal.detailRoleId = ''
  roleModal.detailKeyword = ''
}

function syncRoleModalDetailWithResults() {
  window.setTimeout(() => {
    if (filteredRoles.value.some((role) => role.id === roleModal.detailRoleId)) return
    const firstRole = filteredRoles.value[0]
    if (firstRole) openRoleDetail(firstRole.id)
    else closeRoleDetail()
  }, 0)
}

function toggleRoleDraft(roleId: string) {
  if (copiedRoleIds.value.includes(roleId)) return
  const role = roles.find((item) => item.id === roleId)
  if (!role) return
  const selected = roleModal.selectedIds.includes(roleId)
  if (selected) {
    roleModal.selectedIds = roleModal.selectedIds.filter((id) => id !== roleId)
    const remainingRoles = roles.filter((item) => roleModal.selectedIds.includes(item.id))
    const remainingFunctionIds = new Set(roles
      .filter((item) => roleModal.selectedIds.includes(item.id) || copiedRoleIds.value.includes(item.id))
      .flatMap((item) => item.functionIds))
    const remainingDataIds = new Set(remainingRoles.flatMap((item) => item.dataIds))
    roleModal.selectedFunctionIds = roleModal.selectedFunctionIds.filter((id) => remainingFunctionIds.has(id))
    roleModal.selectedDataIds = roleModal.selectedDataIds.filter((id) => !role.dataIds.includes(id) || remainingDataIds.has(id))
  } else {
    roleModal.selectedIds = [...roleModal.selectedIds, roleId]
    roleModal.selectedFunctionIds = [...new Set([...roleModal.selectedFunctionIds, ...role.functionIds])]
    roleModal.selectedDataIds = [...new Set([...roleModal.selectedDataIds, ...role.dataIds])]
  }
}

function toggleRoleFunctionDraft(permissionId: string) {
  if (copiedRoleIds.value.includes(roleModal.detailRoleId)) return
  if (!roleModal.selectedIds.includes(roleModal.detailRoleId)) roleModal.selectedIds.push(roleModal.detailRoleId)
  roleModal.selectedFunctionIds = roleModal.selectedFunctionIds.includes(permissionId)
    ? roleModal.selectedFunctionIds.filter((id) => id !== permissionId)
    : [...roleModal.selectedFunctionIds, permissionId]
}

function toggleRoleDataDraft(permissionId: string) {
  if (!roleModal.selectedIds.includes(roleModal.detailRoleId)) roleModal.selectedIds.push(roleModal.detailRoleId)
  roleModal.selectedDataIds = roleModal.selectedDataIds.includes(permissionId)
    ? roleModal.selectedDataIds.filter((id) => id !== permissionId)
    : [...roleModal.selectedDataIds, permissionId]
}

function confirmRoleSelection() {
  if (roleModalConflicts.value.length) return
  selectedRoleIds.value = [...roleModal.selectedIds]
  const allowedFunctionIds = new Set(roles
    .filter((role) => roleModal.selectedIds.includes(role.id))
    .flatMap((role) => role.functionIds))
  selectedRoleFunctionIds.value = [...new Set(roleModal.selectedFunctionIds.filter((id) => allowedFunctionIds.has(id)))]
  selectedRoleDataIds.value = [...roleModal.selectedDataIds]
  closeRoleModal()
}

function removeRole(roleId: string) {
  selectedRoleIds.value = selectedRoleIds.value.filter((id) => id !== roleId)
  const remainingRoles = roles.filter((role) => selectedRoleIds.value.includes(role.id))
  const remainingFunctionIds = new Set(remainingRoles.flatMap((role) => role.functionIds))
  const remainingDataIds = new Set(remainingRoles.flatMap((role) => role.dataIds))
  selectedRoleFunctionIds.value = selectedRoleFunctionIds.value.filter((id) => remainingFunctionIds.has(id))
  selectedRoleDataIds.value = selectedRoleDataIds.value.filter((id) => remainingDataIds.has(id))
}

function openCopyModal() {
  if (copiedFromUser.value) return
  copyModal.visible = true
  copyModal.itcode = ''
  copyModal.error = ''
}

function closeCopyModal() {
  copyModal.visible = false
}

function confirmCopyPermissions() {
  const itcode = copyModal.itcode.trim()
  if (!itcode) {
    copyModal.error = '请输入要复制的对方 ITCode。'
    return
  }
  const user = copyableUsers.find((item) => item.itcode.toLowerCase() === itcode.toLowerCase())
  if (!user) {
    copyModal.error = '没有找到该 ITCode 的 mock 权限，请检查后再试。'
    return
  }
  const conflicts = detectCustomDataRoleConflicts(roles.filter((role) => [...selectedRoleIds.value, ...user.roleIds].includes(role.id)))
  if (conflicts.length) {
    copyModal.error = roleConflictMessage(conflicts)
    return
  }
  copiedFromItcode.value = user.itcode
  copiedRoleIds.value = [...user.roleIds]
  Object.keys(copiedDataSourceMap).forEach((id) => delete copiedDataSourceMap[id])
  user.dataPermissions.forEach((permission) => { copiedDataSourceMap[permission.id] = permission.source })
  closeCopyModal()
}

function openDataModal() {
  dataModal.visible = true
  dataModal.selectedIds = [...new Set([...manualDataIds.value, ...copiedDataIds.value])]
}

function closeDataModal() {
  dataModal.visible = false
}

function toggleDataDraft(permissionId: string) {
  if (copiedDataIds.value.includes(permissionId)) return
  dataModal.selectedIds = dataModal.selectedIds.includes(permissionId)
    ? dataModal.selectedIds.filter((id) => id !== permissionId)
    : [...dataModal.selectedIds, permissionId]
}

function confirmDataSelection() {
  manualDataIds.value = dataModal.selectedIds.filter((id) => !copiedDataIds.value.includes(id))
  closeDataModal()
}

function removeDataPermission(permissionId: string) {
  manualDataIds.value = manualDataIds.value.filter((id) => id !== permissionId)
}

function nextOrSubmit() {
  submitError.value = ''
  if (currentStep.value === 0 && !validateBasic()) return
  if (currentStep.value === 1 && !validateScope()) return
  if (currentStep.value < steps.length - 1) {
    currentStep.value += 1
    maxStep.value = Math.max(maxStep.value, currentStep.value)
    return
  }
  submitApplication()
}

function applicationNumber() {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `PA-${date}-${String(now.getTime()).slice(-6)}`
}

function submitApplication() {
  if (!validateBasic()) {
    currentStep.value = 0
    return
  }
  if (!validateScope()) {
    currentStep.value = 1
    return
  }
  try {
    const storageKey = 'leaibot-first-access-applications'
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || '[]') as FirstAccessApplication[]
    const existing = stored.find((item) => item.applicantItcode.toLowerCase() === itcode.value.toLowerCase() && item.statusKey === 'pending')
    if (existing) {
      submittedApplication.value = existing
      return
    }
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    const application: FirstAccessApplication = {
      id: applicationNumber(),
      typeKey: 'change',
      type: '首次访问权限',
      applicant: itcode.value,
      applicantItcode: itcode.value,
      applicantPersonType: 'internal',
      target: itcode.value,
      targetItcode: itcode.value,
      personType: 'internal',
      applicantManager: form.manager,
      targetManager: form.manager,
      businessApprover: businessOwners.value.join('、'),
      businessOwners: businessOwners.value,
      approverItcode: form.manager,
      handlers: [form.manager],
      nodeType: 'applicant-manager',
      node: '申请人直线经理审批',
      status: '审批中',
      statusKey: 'pending',
      time: now,
      reason: form.reason || '未填写',
      mobile: form.mobile,
      email: form.email || `${itcode.value}@lenovo.com`,
      businessInfo: { tenant: [...form.tenant], organizations: [] },
      permissionSnapshot: {
        businessApprover: form.businessApprover,
        selectedRoleIds: [...selectedRoleIds.value],
        copiedFromItcode: copiedFromItcode.value,
        copiedRoleIds: [...copiedRoleIds.value],
        selectedFunctionPermissionIds: selectedFunctionIds.value,
        selectedDataPermissionIds: selectedDataIds.value,
        manualDataPermissionIds: [...manualDataIds.value],
        copiedDataSourceMap: { ...copiedDataSourceMap },
        tenant: [...form.tenant],
        changeSummary: [`首次开通 ${allSelectedRoles.value.length} 个角色`, `包含 ${selectedFunctionIds.value.length} 项功能权限`, `包含 ${selectedDataIds.value.length} 项数据权限`, `开通 ${form.tenant.length} 个租户`]
      },
      approvalLogs: [{ node: '申请提交', action: 'submit', operator: itcode.value, opinion: '内部用户在无权限页提交首次访问申请。', time: now }]
    }
    stored.unshift(application)
    window.localStorage.setItem(storageKey, JSON.stringify(stored.slice(0, 20)))
    submittedApplication.value = application
  } catch {
    submitError.value = '申请暂时无法保存，请稍后重试。'
  }
}

function restorePendingApplication() {
  try {
    const stored = JSON.parse(window.localStorage.getItem('leaibot-first-access-applications') || '[]') as FirstAccessApplication[]
    submittedApplication.value = stored.find((item) => item.applicantItcode.toLowerCase() === itcode.value.toLowerCase() && item.statusKey === 'pending') || null
  } catch {
    submittedApplication.value = null
  }
}

function backToLogin() {
  appStore.user = null
  router.replace('/login')
}

onMounted(() => {
  document.documentElement.classList.add('access-denied-route')
  document.body.classList.add('access-denied-route')
  restorePendingApplication()
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('access-denied-route')
  document.body.classList.remove('access-denied-route')
})
</script>

<style scoped>
:global(html.access-denied-route),
:global(body.access-denied-route) { min-width: 0; overflow: hidden; }
:global(html.access-denied-route body.access-denied-route) { display: block; min-width: 0; overflow: hidden; }
:global(body.access-denied-route #app) { display: block; width: 100%; min-width: 0; }
.access-denied-page { box-sizing: border-box; width: 100%; min-width: 0; height: 100vh; overflow-x: hidden; overflow-y: auto; padding: 32px 20px; background: var(--color-bg-subtle); color: var(--color-text); font-family: var(--font-body); }
.access-shell { width: min(980px, 100%); margin: 0 auto; overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-popover); }
.access-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--color-border-subtle); padding: 16px 24px; }
.access-brand { display: flex; align-items: center; gap: 12px; font-weight: 700; }
.access-logo { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--radius-md); background: var(--color-accent-red); color: var(--color-on-primary); }
.text-btn { border: 0; background: transparent; color: var(--color-primary); cursor: pointer; }
.access-intro, .success-panel { box-sizing: border-box; width: min(860px, 100%); margin: 0 auto; padding: 24px 32px 24px; }
.access-eyebrow { display: inline-flex; margin: 0 0 12px; border-radius: 9999px; padding: 4px 12px; background: var(--color-warning-subtle); color: var(--color-warning); font-size: 12px; font-weight: 700; }
.access-eyebrow.success { background: var(--color-success-subtle); color: var(--color-success); }
h1 { margin: 0; color: var(--color-text); font-size: 24px; line-height: 1.35; }
.access-intro > p:not(.access-eyebrow), .success-panel > p { margin: 12px 0 0; color: var(--color-text-secondary); line-height: 1.7; }
.account-strip { display: flex; align-items: center; gap: 16px; margin-top: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 16px; background: var(--color-primary-subtle); }
.account-strip span { color: var(--color-text-secondary); font-size: 13px; }
.account-strip em { margin-left: auto; color: var(--color-text-secondary); font-size: 12px; font-style: normal; }
.step-tabs { display: grid; grid-template-columns: repeat(3, 1fr); border-block: 1px solid var(--color-border-subtle); background: var(--color-bg-subtle); padding: 0 32px; }
.step-tabs button { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 56px; border: 0; border-bottom: 3px solid transparent; background: transparent; color: var(--color-text-tertiary); font-weight: 700; cursor: pointer; }
.step-tabs button.active { border-bottom-color: var(--color-primary); color: var(--color-primary-hover); }
.step-tabs button.completed { color: var(--color-success); }
.step-tabs button:disabled { cursor: not-allowed; opacity: .55; }
.step-tabs span { font-size: 13px; }

.application-form { box-sizing: border-box; width: min(860px, 100%); margin: 0 auto; padding: 24px 32px 32px; }
.form-step { min-height: 360px; }
.form-grid input:not([type="checkbox"]), .form-grid select { box-sizing: border-box; height: var(--control-height-md); padding: 0 12px; }
.form-grid textarea { --color-surface-subtle: var(--color-surface); }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.section-heading h2 { margin: 0; font-size: 20px; }
.section-heading p { margin: 8px 0 0; color: var(--color-text-secondary); font-size: 14px; }
.section-heading > span { border-radius: 9999px; padding: 4px 12px; background: var(--color-primary-subtle); color: var(--color-primary-hover); font-size: 12px; font-weight: 700; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 20px; }
label > span, .tenant-field > span { display: block; margin-bottom: 8px; color: var(--color-text-secondary); font-size: 13px; font-weight: 700; }
label em, .scope-title em { color: var(--color-danger); font-size: 12px; font-style: normal; }
label em.optional { color: var(--color-text-tertiary); font-weight: 400; }
input, textarea, select { box-sizing: border-box; width: 100%; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px 12px; background: var(--color-surface); color: var(--color-text); font: inherit; }
input[readonly] { background: var(--color-bg-subtle); color: var(--color-text-secondary); }
input:focus, textarea:focus, select:focus { border-color: var(--color-primary); outline: 2px solid var(--color-primary-subtle); }
.invalid { border-color: var(--color-danger); }
.full { grid-column: 1 / -1; }
.field-error, .field-help { display: block; margin-top: 4px; color: var(--color-danger); font-size: 12px; }
.field-help { color: var(--color-text-tertiary); }
.scope-action-bar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.scope-action-bar button:disabled { cursor: not-allowed; opacity: .55; }
.tenant-field { display: block; margin-bottom: 24px; }
.tenant-multi-options { display: flex; flex-wrap: wrap; gap: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; }
.tenant-multi-options.invalid { border-color: var(--color-danger); }
.tenant-multi-options label { display: inline-flex; align-items: center; gap: 8px; min-height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 12px; color: var(--color-text-secondary); cursor: pointer; }
.tenant-multi-options label.selected { border-color: var(--color-primary); background: var(--color-primary-subtle); color: var(--color-primary-hover); }
.tenant-multi-options input { width: 15px; height: 15px; accent-color: var(--color-primary); }
.scope-source-stack { display: grid; gap: 12px; }
.scope-empty { border: 1px dashed var(--color-border); border-radius: var(--radius-lg); padding: 24px; text-align: center; background: var(--color-bg-subtle); }
.scope-empty p { margin: 8px 0 0; color: var(--color-text-tertiary); }
.scope-source-panel { border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; background: var(--color-surface); }
.scope-source-panel.copied { background: var(--color-bg-subtle); }
.scope-panel-head, .source-role-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.scope-panel-head small, .source-role-card small { display: block; margin-top: 4px; color: var(--color-text-tertiary); }
.source-role-list { display: grid; gap: 8px; margin-top: 12px; }
.source-role-card { border-top: 1px solid var(--color-border-subtle); padding-top: 12px; }
.role-card-actions { display: flex; align-items: center; gap: 8px; }
.permission-tag-btn { border: 0; border-radius: 9999px; padding: 4px 8px; background: var(--color-primary-subtle); color: var(--color-primary-hover); font-size: 12px; cursor: pointer; }
.permission-tag-btn:hover, .permission-tag-btn:focus-visible { outline: 2px solid var(--color-primary-subtle); background: var(--color-primary-subtle); }
.text-btn.danger { color: var(--color-danger); }
.readonly-badge { border-radius: 9999px; padding: 4px 8px; background: var(--color-border-subtle); color: var(--color-text-secondary); font-size: 12px; font-weight: 700; }
.scope-section + .scope-section { margin-top: 24px; border-top: 1px solid var(--color-border-subtle); padding-top: 24px; }
.scope-title { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.scope-title small { color: var(--color-text-tertiary); }
.role-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.role-card { position: relative; display: block; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px 16px; cursor: pointer; }
.role-card.selected { border-color: var(--color-primary); background: var(--color-primary-subtle); box-shadow: inset 0 0 0 1px var(--color-primary); }
.role-card > input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.role-check { position: absolute; top: 14px; right: 14px; display: grid; place-items: center; width: 20px; height: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: transparent; }
.role-card.selected .role-check { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.role-card > b { padding-right: 24px; }
.role-card > p { margin: 8px 0; color: var(--color-text-secondary); font-size: 13px; }
.role-card > small { color: var(--color-text-secondary); }
.permission-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.permission-tags span { border-radius: 9999px; padding: 4px 8px; background: var(--color-primary-subtle); color: var(--color-primary-hover); font-size: 12px; }
.permission-tags span.data { background: var(--color-success-subtle); color: var(--color-success); }
.permission-tags span.removable { display: inline-flex; align-items: center; gap: 4px; }
.permission-tags span.removable button { border: 0; padding: 0; background: transparent; color: inherit; cursor: pointer; }
.scope-error { margin-top: 8px; }
.data-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.data-grid label { display: flex; align-items: center; gap: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; cursor: pointer; }
.data-grid label.selected { border-color: var(--color-primary); background: var(--color-primary-subtle); }
.data-grid input { width: 16px; height: 16px; }
.data-grid label span { margin: 0; }
.data-grid small { display: block; margin-top: 4px; color: var(--color-text-tertiary); font-weight: 400; }
.approval-flow { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 20px; }
.approval-flow article { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; }
.approval-flow article.current { border-color: var(--color-primary); background: var(--color-primary-subtle); }
.approval-flow article span { display: grid; place-items: center; width: 24px; height: 24px; margin-bottom: 12px; border-radius: 50%; background: var(--color-border-subtle); color: var(--color-text-secondary); font-size: 12px; font-weight: 700; }
.approval-flow article b, .approval-flow article small { display: block; }
.approval-flow article small { margin-top: 8px; color: var(--color-text-secondary); }
.scope-confirm-summary { margin-top: 20px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px 16px; background: var(--color-bg-subtle); }
.scope-confirm-summary p { margin: 8px 0 0; color: var(--color-text-secondary); line-height: 1.6; }
.submit-note { margin-top: 12px; border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); padding: 16px 16px; background: var(--color-primary-subtle); }
.submit-note b { color: var(--color-primary); }
.submit-note p { margin: 8px 0 0; color: var(--color-text-secondary); line-height: 1.6; }
.form-actions, .success-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; border-top: 1px solid var(--color-border-subtle); padding-top: 20px; }
.primary-btn, .secondary-btn { min-height: 40px; border-radius: var(--radius-md); padding: 0 20px; font-weight: 700; cursor: pointer; }
.primary-btn { border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.secondary-btn { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); }
.submit-error { margin: 16px 0 0; color: var(--color-danger); }
.success-panel { padding-block: 56px; text-align: center; }
.success-icon { display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto 20px; border-radius: 50%; background: var(--color-success); color: var(--color-on-primary); font-size: 30px; }
.success-panel .approval-flow { text-align: left; }
.permission-modal { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: color-mix(in srgb, var(--color-text) 45%, transparent); }
.modal-panel { position: relative; box-sizing: border-box; width: min(860px, 100%); max-height: calc(100vh - 48px); overflow-y: auto; border-radius: var(--radius-lg); padding: 24px; background: var(--color-surface); box-shadow: var(--shadow-popover); }
.modal-panel.small { width: min(520px, 100%); }
.modal-panel h3 { margin: 0; font-size: 20px; }
.modal-panel > p { margin: 8px 32px 16px 0; color: var(--color-text-secondary); line-height: 1.6; }
.modal-close { position: absolute; top: 15px; right: 16px; border: 0; background: transparent; color: var(--color-text-secondary); font-size: 24px; cursor: pointer; }
.modal-search-input { margin-bottom: 16px; }
.role-picker-modal.with-detail { width: min(1280px, calc(100vw - 72px)); }
.role-picker-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
.role-picker-modal.with-detail .role-picker-layout { grid-template-columns: minmax(380px, .92fr) minmax(460px, 1.08fr); align-items: stretch; }
.role-picker-list, .data-tree-picker { display: grid; gap: 8px; max-height: 520px; overflow-y: auto; }
.role-picker-row { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 12px; align-items: flex-start; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); cursor: pointer; }
.role-picker-row.active { border-color: var(--color-primary-border); background: var(--color-primary-subtle); box-shadow: var(--focus-ring); }
.role-picker-check { display: flex; align-items: flex-start; padding-top: 4px; }
.role-picker-check input { width: 16px; height: 16px; accent-color: var(--color-primary); }
.role-picker-content { min-width: 0; }
.role-picker-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.role-picker-content p { margin: 4px 0 8px; color: var(--color-text-secondary); font-size: 12px; line-height: 1.5; }
.role-picker-content small { display: block; color: var(--color-text-tertiary); font-size: 12px; }
.role-detail-drawer { position: relative; display: flex; min-height: 0; max-height: 520px; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; background: var(--color-bg-subtle); }
.drawer-close { top: 10px; right: 10px; }
.drawer-eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 700; }
.role-detail-drawer h4 { margin: 8px 32px 4px 0; font-size: 16px; }
.role-detail-drawer > p { margin: 0; color: var(--color-text-secondary); font-size: 12px; line-height: 1.5; }
.role-permission-tabs { display: flex; gap: 8px; margin-top: 12px; }
.role-permission-tabs button { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 8px 12px; background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; }
.role-permission-tabs button.active { border-color: var(--color-primary); background: var(--color-primary-subtle); color: var(--color-primary-hover); }
.drawer-search { flex: 0 0 auto; margin-top: 12px; }
.role-permission-tree { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.permission-tree-root, .permission-tree-branch { border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-surface); }
.permission-tree-root { margin-top: 12px; padding: 12px; }
.permission-tree-branch { margin-top: 8px; padding: 8px; background: var(--color-bg-subtle); }
.permission-tree-root summary, .permission-tree-branch summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; }
.permission-tree-root summary span, .permission-tree-branch summary span { color: var(--color-text-tertiary); font-size: 12px; }
.permission-tree-branch-list, .permission-item-list, .data-tree-leaf-list { display: grid; gap: 8px; margin-top: 8px; }
.permission-detail-check, .data-tree-leaf { display: flex; align-items: flex-start; gap: 8px; border-radius: var(--radius-md); padding: 8px; background: var(--color-surface); cursor: pointer; }
.permission-detail-check:hover, .data-tree-leaf:hover { background: var(--color-primary-subtle); }
.permission-detail-check input, .data-tree-leaf input { width: 16px; height: 16px; margin-top: 4px; accent-color: var(--color-primary); }
.permission-detail-check span { margin: 0; }
.permission-detail-check small { display: block; margin-top: 4px; color: var(--color-text-tertiary); font-weight: 400; }
.data-tree-leaf { align-items: center; border: 1px solid var(--color-border-subtle); }
.data-tree-leaf > span { flex: 1; margin: 0; }
.compact-empty { margin-top: 12px; padding: 20px; }
.modal-form-field { display: block; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; border-top: 1px solid var(--color-border-subtle); padding-top: 16px; }
@media (max-width: 760px) {
  .access-denied-page { padding: 0; }
  .access-shell { border: 0; border-radius: 0; box-shadow: none; }
  .access-header, .access-intro, .application-form, .success-panel { padding-inline: 20px; }
  .step-tabs { padding-inline: 12px; }
  .step-tabs button { flex-direction: column; gap: 4px; font-size: 12px; }
  .form-grid, .role-grid, .data-grid { grid-template-columns: 1fr; }
  .section-heading, .scope-title { align-items: flex-start; flex-direction: column; }
  .account-strip { align-items: flex-start; flex-direction: column; }
  .account-strip em { margin-left: 0; }
  .permission-modal { align-items: start; padding: 12px; }
  .modal-panel { max-height: calc(100vh - 24px); padding: 20px; }
  .role-picker-modal.with-detail { width: 100%; }
  .role-picker-modal.with-detail .role-picker-layout { grid-template-columns: 1fr; }
  .role-detail-drawer { max-height: 420px; }
}

</style>

<style scoped src="../components/permissions/permissionDialogFooter.css"></style>
