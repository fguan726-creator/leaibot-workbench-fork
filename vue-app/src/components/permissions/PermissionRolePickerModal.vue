<template>
  <div v-if="visible" class="permission-modal permission-scope-picker-modal" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <section ref="dialog" :class="['modal-panel', 'role-picker-modal', { 'with-detail': detailRole }]" role="dialog" aria-modal="true" aria-labelledby="role-picker-title" tabindex="-1" @keydown.tab="trapFocus">
      <button type="button" class="modal-close" aria-label="关闭" @click="$emit('close')">×</button>
      <h3 id="role-picker-title">添加角色</h3>
      <p class="modal-note">可在所选角色范围内勾选功能和数据权限；复制角色带入的权限保持只读。</p>
      <input ref="searchInput" :value="keyword" class="modal-search-input" placeholder="搜索角色名称、功能权限" @input="updateKeyword">

      <div class="role-picker-layout">
        <div class="role-picker-list">
          <article v-for="role in roles" :key="role.id" :class="['role-picker-row', { active: detailRole?.id === role.id }]" @click="$emit('open-detail', role)">
            <label class="role-picker-check" @click.stop>
              <input type="checkbox" :checked="selectedRoleIds.includes(role.id)" :disabled="lockedRoleIds.includes(role.id)" @change="$emit('toggle-role', role.id)">
            </label>
            <div class="role-picker-content">
              <div class="role-picker-title">
                <b>{{ role.name }}</b>
                <button type="button" class="link-btn" @click.stop="$emit('open-detail', role)">查看详情</button>
              </div>
              <p>{{ roleDescription(role) }}</p>
              <small>{{ roleFunctionIds(role).length }} 项功能权限 / {{ roleDataCount(role) }} 项数据权限</small>
            </div>
          </article>
        </div>

        <aside v-if="detailRole" class="role-detail-drawer">
          <button type="button" class="modal-close drawer-close" aria-label="关闭角色详情" @click="$emit('close-detail')">×</button>
          <span class="drawer-eyebrow">角色详情</span>
          <h4>{{ detailRole.name }}</h4>
          <p>{{ roleDescription(detailRole) }}</p>
          <div class="role-permission-tabs" role="tablist" aria-label="角色权限类型">
            <button type="button" :class="{ active: activePermissionTab === 'function' }" @click="$emit('update:active-permission-tab', 'function')">功能权限 <b>{{ roleFunctionIds(detailRole).length }}</b></button>
            <button type="button" :class="{ active: activePermissionTab === 'data' }" @click="$emit('update:active-permission-tab', 'data')">数据权限 <b>{{ roleDataCount(detailRole) }}</b></button>
          </div>
          <input v-if="activePermissionTab === 'function'" :value="detailKeyword" class="modal-search-input drawer-search" placeholder="搜索功能权限名称、说明或分类" @input="updateDetailKeyword">
          <div v-if="activePermissionTab === 'function'" class="role-permission-tree">
            <details v-for="group in functionPermissionGroups" :key="group.id" class="permission-tree-root" open>
              <summary><b>{{ group.name }}</b><span>{{ groupItemCount(group) }} 项功能</span></summary>
              <div class="permission-tree-branch-list">
                <details v-for="branch in group.children" :key="branch.id" class="permission-tree-branch" open>
                  <summary><b>{{ branch.name }}</b><span>{{ branchItems(branch).length }} 项功能</span></summary>
                  <div class="permission-item-list">
                    <label v-for="permission in branchItems(branch)" :key="permission.id" class="permission-detail-check">
                      <input type="checkbox" :checked="selectedPermissionIds.includes(permission.id)" :disabled="lockedRoleIds.includes(detailRole.id)" @change="$emit('toggle-function', permission.id)">
                      <span><b>{{ permission.name }}</b><small>{{ permission.description || permission.scope || permission.id }}</small></span>
                    </label>
                  </div>
                </details>
              </div>
            </details>
            <div v-if="!functionPermissionGroups.length" class="scope-empty"><b>没有匹配的功能权限</b><p>请调整搜索关键词后再试。</p></div>
          </div>
          <div v-else-if="roleCustomRules(detailRole).length" class="role-permission-tree custom-table-detail">
            <CustomTableAuthorizationEditor
              :model-value="roleCustomRules(detailRole)"
              title="角色自定义授权"
              readonly
            />
          </div>
          <div v-else class="role-permission-tree data-directory-tree">
            <PermissionDataDirectoryList
              :directories="dataPermissionDirectories"
              :selected-ids="selectedDataIds"
              :disabled="lockedRoleIds.includes(detailRole.id)"
              @toggle="$emit('toggle-data', $event)"
            />
          </div>
        </aside>
      </div>

      <section v-if="conflicts?.length" class="role-conflict-alert" role="alert" data-testid="role-custom-data-conflicts">
        <b>存在角色自定义数据权限冲突，暂时无法确认</b>
        <p>请取消勾选其中一个角色，或先统一这些角色在同一数据集上的行、列权限。</p>
        <details v-for="conflict in conflicts" :key="conflict.datasetId">
          <summary>{{ conflict.datasetName }}：{{ conflict.roleNames.join('、') }}</summary>
          <div class="role-conflict-detail">
            <article v-for="role in conflict.roleSummaries" :key="role.roleId">
              <b>{{ role.roleName }}</b>
              <span>行权限：{{ role.rowSummary }}</span>
              <span>列权限：{{ role.columnSummary }}</span>
            </article>
          </div>
        </details>
      </section>

      <footer class="modal-actions">
        <button type="button" class="secondary-btn" @click="$emit('close')">取消</button>
        <button type="button" class="primary-btn" :disabled="Boolean(conflicts?.length)" @click="$emit('confirm')">确认</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import CustomTableAuthorizationEditor from './CustomTableAuthorizationEditor.vue'
import PermissionDataDirectoryList, { type DataPermissionDirectory } from './PermissionDataDirectoryList.vue'

interface PermissionItem { id: string; name: string; description?: string; scope?: string }
interface PermissionBranch { id: string; name: string; children?: PermissionItem[]; functions?: PermissionItem[]; dataPermissions?: PermissionItem[] }
interface PermissionGroup { id: string; name: string; children: PermissionBranch[] }
interface RoleConflictRoleSummary {
  roleId: string
  roleName: string
  rowSummary: string
  columnSummary: string
}
interface RoleConflict {
  datasetId: string
  datasetName: string
  roleNames: string[]
  roleSummaries: RoleConflictRoleSummary[]
}
interface RoleOption {
  id: string
  name: string
  description?: string
  desc?: string
  functionIds?: string[]
  dataIds?: string[]
  functionPermissionIds?: string[]
  dataPermissionIds?: string[]
  customDataRules?: Array<Record<string, unknown>>
}

const props = defineProps<{
  visible: boolean
  roles: RoleOption[]
  detailRole: RoleOption | null
  permissionGroups: Array<PermissionGroup | DataPermissionDirectory>
  keyword: string
  detailKeyword: string
  activePermissionTab: string
  selectedRoleIds: string[]
  selectedFunctionIds: string[]
  selectedDataIds: string[]
  lockedRoleIds: string[]
  conflicts?: RoleConflict[]
}>()

const dialog = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
let returnFocus: HTMLElement | null = null

const emit = defineEmits<{
  close: []
  confirm: []
  'open-detail': [role: RoleOption]
  'close-detail': []
  'toggle-role': [id: string]
  'toggle-function': [id: string]
  'toggle-data': [id: string]
  'update:keyword': [value: string]
  'update:detail-keyword': [value: string]
  'update:active-permission-tab': [value: string]
}>()

const selectedPermissionIds = computed(() => props.activePermissionTab === 'function' ? props.selectedFunctionIds : props.selectedDataIds)
const functionPermissionGroups = computed(() => props.permissionGroups.filter((group): group is PermissionGroup => 'children' in group))
const dataPermissionDirectories = computed(() => props.permissionGroups.filter((group): group is DataPermissionDirectory => 'sources' in group))
const roleDescription = (role: RoleOption) => role.description || role.desc || ''
const roleFunctionIds = (role: RoleOption) => role.functionPermissionIds || role.functionIds || []
const roleDataIds = (role: RoleOption) => role.dataPermissionIds || role.dataIds || []
const roleCustomRules = (role: RoleOption) => role.customDataRules || []
const roleDataCount = (role: RoleOption) => roleDataIds(role).length + roleCustomRules(role).length
const branchItems = (branch: PermissionBranch) => branch.children || (props.activePermissionTab === 'function' ? branch.functions : branch.dataPermissions) || []
const groupItemCount = (group: PermissionGroup) => group.children.reduce((count, branch) => count + branchItems(branch).length, 0)
const inputValue = (event: Event) => (event.target as HTMLInputElement).value
const updateKeyword = (event: Event) => emit('update:keyword', inputValue(event))
const updateDetailKeyword = (event: Event) => emit('update:detail-keyword', inputValue(event))

watch(() => props.visible, async (visible) => {
  if (!visible) {
    returnFocus?.focus()
    returnFocus = null
    return
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  searchInput.value?.focus()
})

function trapFocus(event: KeyboardEvent) {
  const focusable = [...(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary') || [])]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<style scoped>
.permission-modal.permission-scope-picker-modal { position: fixed; inset: 0; z-index: 1400; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: color-mix(in srgb, var(--color-text) 45%, transparent); backdrop-filter: none; }
.modal-panel { position: relative; box-sizing: border-box; width: min(820px, 100%); max-height: min(720px, calc(100vh - 48px)); overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; background: var(--color-surface); box-shadow: var(--shadow-popover); }
.role-picker-modal.with-detail { width: min(1280px, calc(100vw - 72px)); }
h3 { margin: 0; color: var(--color-text); font-size: 20px; }
.modal-note { margin: 8px calc(40px + 4px) 0 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
.modal-close { position: absolute; top: 16px; right: 16px; width: var(--control-height-md); height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-secondary); font-size: 20px; cursor: pointer; }
.modal-search-input { box-sizing: border-box; width: 100%; min-height: var(--control-height-md); margin-top: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 12px; color: var(--color-text); font: inherit; font-size: 13px; }
.role-picker-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
.with-detail .role-picker-layout { grid-template-columns: minmax(0, .95fr) minmax(0, 1.05fr); align-items: stretch; }
.role-picker-list { display: grid; gap: 8px; max-height: 520px; margin-top: 16px; overflow: auto; }
.role-picker-row { display: grid; grid-template-columns: 18px 1fr; gap: 12px; align-items: flex-start; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; }
.role-picker-row.active { border-color: var(--color-primary-border); background: var(--color-primary-subtle); box-shadow: var(--focus-ring); }
.role-picker-check { display: flex; padding-top: 4px; }
.role-picker-check input, .permission-detail-check input { width: 16px; min-height: 16px; accent-color: var(--color-primary); }
.role-picker-content { min-width: 0; }
.role-picker-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.role-picker-title b { color: var(--color-text); font-size: 13px; }
.role-picker-content p { margin: 4px 0 8px; color: var(--color-text-secondary); font-size: 12px; line-height: 1.5; }
.role-picker-content small { display: block; color: var(--color-text-tertiary); font-size: 12px; }
.link-btn { border: 0; padding: 0; background: transparent; color: var(--color-primary); font: inherit; font-size: 12px; cursor: pointer; }
.role-detail-drawer { position: relative; display: flex; min-height: 0; max-height: 520px; flex-direction: column; margin-top: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 16px; background: var(--color-bg-subtle); }
.drawer-close { top: 10px; right: 10px; }
.drawer-eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 700; }
.role-detail-drawer h4 { margin: 8px 32px 4px 0; color: var(--color-text); font-size: 16px; }
.role-detail-drawer > p { margin: 0; color: var(--color-text-secondary); font-size: 12px; line-height: 1.5; }
.role-permission-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.role-permission-tabs button { display: inline-flex; align-items: center; gap: 8px; min-height: 30px; border: 0; border-bottom: 2px solid transparent; border-radius: 0; padding: 0 12px; background: transparent; color: var(--color-text-secondary); font-size: 12px; font-weight: 700; cursor: pointer; }
.role-permission-tabs button.active { border-bottom-color: var(--color-primary); background: transparent; color: var(--color-primary); }
.drawer-search { flex: 0 0 auto; margin-top: 12px; }
.role-permission-tree { display: grid; flex: 1 1 auto; gap: 8px; min-height: 0; margin-top: 12px; overflow-y: auto; }
.permission-tree-root, .permission-tree-branch { overflow: hidden; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-surface); }
.permission-tree-branch { border: 0; border-radius: var(--radius-md); background: transparent; }
summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: var(--control-height-md); padding: 0 12px; color: var(--color-text); font-size: 13px; font-weight: 700; list-style: none; cursor: pointer; }
.permission-tree-root > summary { background: var(--color-bg-subtle); }
summary::-webkit-details-marker { display: none; }
summary::before { content: '›'; flex: 0 0 auto; color: var(--color-text-tertiary); font-size: 16px; transform: rotate(0); transition: transform .16s ease; }
details[open] > summary::before { transform: rotate(90deg); }
summary b { flex: 1 1 auto; min-width: 0; }
summary span { color: var(--color-text-tertiary); font-size: 12px; font-weight: 600; }
.permission-tree-branch-list { display: grid; gap: 4px; padding: 8px 8px 8px 24px; border-top: 1px solid var(--color-border-subtle); }
.permission-item-list { display: grid; gap: 4px; margin: 0 8px 8px 24px; }
.permission-detail-check { display: flex; align-items: flex-start; gap: 8px; min-width: 0; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 8px 12px; background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; }
.permission-detail-check:hover, summary:hover { background: var(--color-bg-subtle); }
.permission-detail-check span { display: grid; gap: 4px; min-width: 0; }
.permission-detail-check b { color: var(--color-text); font-size: 12px; }
.permission-detail-check small { color: var(--color-text-tertiary); font-size: 12px; line-height: 1.45; word-break: break-all; }
.scope-empty { border: 1px dashed var(--color-border); border-radius: var(--radius-md); padding: 24px; text-align: center; }
.scope-empty p { margin: 8px 0 0; color: var(--color-text-tertiary); font-size: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; border-top: 1px solid var(--color-border-subtle); padding-top: 16px; }
.primary-btn, .secondary-btn { min-height: var(--control-height-md); border-radius: var(--radius-md); padding: 0 20px; font-weight: 700; cursor: pointer; }
.primary-btn { border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.primary-btn:disabled { border-color: var(--color-bg-muted); background: var(--color-bg-muted); cursor: not-allowed; }
.secondary-btn { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); }
.role-conflict-alert { margin-top: 16px; border: 1px solid var(--color-danger); border-radius: var(--radius-md); padding: 12px 16px; background: var(--color-danger-subtle); color: var(--color-danger); }
.role-conflict-alert > b { font-size: 13px; }
.role-conflict-alert > p { margin: 4px 0 8px; color: var(--color-danger); font-size: 12px; line-height: 1.5; }
.role-conflict-alert details { border-top: 1px solid var(--color-danger); }
.role-conflict-alert summary { min-height: var(--control-height-md); padding: 0; color: var(--color-danger); font-size: 12px; }
.role-conflict-detail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 0 0 12px; }
.role-conflict-detail article { display: grid; gap: 4px; border: 1px solid var(--color-danger); border-radius: var(--radius-md); padding: 8px 12px; background: var(--color-surface); }
.role-conflict-detail article b { color: var(--color-danger); font-size: 12px; }
.role-conflict-detail article span { color: var(--color-danger); font-size: 12px; line-height: 1.45; }
@media (max-width: 980px) { .with-detail .role-picker-layout { grid-template-columns: 1fr; } .role-detail-drawer { max-height: 360px; } }


.primary-btn, .secondary-btn { font-family: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; }
.primary-btn:hover:not(:disabled) { border-color: var(--color-primary-hover); background: var(--color-primary-hover); }
.secondary-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.primary-btn:focus-visible, .secondary-btn:focus-visible, .modal-close:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>

<style scoped src="./permissionDialogFooter.css"></style>
