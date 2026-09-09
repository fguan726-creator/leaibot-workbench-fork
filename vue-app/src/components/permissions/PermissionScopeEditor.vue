<template>
  <section class="permission-scope-editor" aria-labelledby="permission-scope-title">
    <div class="scope-heading">
      <div>
        <h3 id="permission-scope-title">权限范围</h3>
        <p>所属租户为必填项；角色和数据权限可按需添加，重复权限会按系统规则合并。</p>
      </div>
      <span>{{ totalRoleCount }} 个角色</span>
    </div>

    <div class="tenant-field">
      <span class="field-label required">所属租户 <em>必填</em></span>
      <div
        ref="tenantGroup"
        :class="['tenant-multi-options', { invalid: tenantError }]"
        :aria-invalid="!!tenantError"
        :aria-describedby="tenantError ? 'permission-scope-tenant-error' : undefined"
      >
        <label v-for="tenant in tenantOptions" :key="tenant" :class="{ selected: selectedTenantIds.includes(tenant) }">
          <input type="checkbox" :checked="selectedTenantIds.includes(tenant)" :value="tenant" @change="$emit('toggle-tenant', tenant)">
          <span>{{ tenant }}</span>
        </label>
      </div>
      <small v-if="tenantError" id="permission-scope-tenant-error" class="field-error" role="alert">{{ tenantError }}</small>
      <small v-else class="field-help">可多选，审批通过后将一次性开通所选租户。</small>
    </div>

    <div class="scope-action-bar" aria-label="权限范围操作">
      <button type="button" class="scope-btn primary" @click="$emit('add-role')">添加角色</button>
      <button type="button" class="scope-btn secondary" :disabled="!!copiedFromUser" @click="$emit('copy-role')">复制他人角色</button>
      <button type="button" class="scope-btn secondary" @click="$emit('select-data')">选择数据权限</button>
      <span v-if="copiedFromUser" class="copy-complete">已复制 {{ copiedFromUser.itcode }}</span>
    </div>

    <div class="scope-source-stack">
      <div v-if="!hasPermissionSources" class="scope-empty">
        <b>角色和数据权限可按需添加</b>
        <p>当前可以只选择所属租户后继续，也可以使用上方三个入口补充权限。</p>
      </div>

      <article v-if="selectedRoles.length" class="scope-source-panel">
        <div class="scope-panel-head">
          <div><b>添加角色</b><small>{{ selectedRoles.length }} 个角色</small></div>
          <button type="button" class="link-btn" @click="$emit('add-role')">调整角色</button>
        </div>
        <div class="source-role-list">
          <div v-for="role in selectedRoles" :key="role.id" class="source-role-card">
            <div><b>{{ role.name }}</b><small>{{ role.description || role.desc }}</small></div>
            <div class="role-card-actions">
              <button type="button" class="link-btn" @click="$emit('inspect-role', role.id)">详情</button>
              <button type="button" class="link-btn danger" @click="$emit('remove-role', role.id)">移除</button>
            </div>
          </div>
        </div>
      </article>

      <article v-if="copiedFromUser" class="scope-source-panel copied">
        <div class="scope-panel-head">
          <div><b>复制他人角色</b><small>复制自 {{ copiedFromUser.name }}（{{ copiedFromUser.itcode }}）</small></div>
          <span class="readonly-badge">复制结果只读</span>
        </div>
        <div class="source-role-list">
          <div v-for="role in copiedRoles" :key="role.id" class="source-role-card copied-role">
            <div><b>{{ role.name }}</b><small>{{ role.description || role.desc }}</small></div>
            <button type="button" class="link-btn" @click="$emit('inspect-role', role.id)">详情</button>
          </div>
        </div>
        <div v-if="copiedDataPermissions.length" class="copied-permission-groups">
          <div>
            <span class="group-label">数据权限</span>
            <div class="permission-chip-list">
              <span v-for="permission in copiedDataPermissions" :key="permission.id">{{ permission.name }}<em>{{ permission.source || '复制带入' }}</em></span>
            </div>
          </div>
        </div>
      </article>

      <article v-if="manualDataPermissions.length" class="scope-source-panel">
        <div class="scope-panel-head">
          <div><b>选择数据权限</b><small>{{ manualDataPermissions.length }} 项本次新增</small></div>
          <button type="button" class="link-btn" @click="$emit('select-data')">调整数据权限</button>
        </div>
        <div class="permission-chip-list">
          <span v-for="permission in manualDataPermissions" :key="permission.id">
            {{ permission.name }}
            <button type="button" class="chip-remove" :aria-label="`移除${permission.name}`" @click="$emit('remove-data', permission.id)">×</button>
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

interface RoleSummary { id: string; name: string; description?: string; desc?: string }
interface PermissionSummary { id: string; name: string; source?: string }
interface CopiedUser { itcode: string; name: string }

const props = withDefaults(defineProps<{
  tenantOptions: string[]
  selectedTenantIds: string[]
  tenantError?: string
  selectedRoles: RoleSummary[]
  copiedFromUser: CopiedUser | null
  copiedRoles: RoleSummary[]
  copiedDataPermissions: PermissionSummary[]
  manualDataPermissions: PermissionSummary[]
}>(), { tenantError: '' })

const tenantGroup = ref<HTMLElement | null>(null)

defineEmits<{
  'toggle-tenant': [tenant: string]
  'add-role': []
  'copy-role': []
  'select-data': []
  'inspect-role': [roleId: string]
  'remove-role': [roleId: string]
  'remove-data': [permissionId: string]
}>()

const totalRoleCount = computed(() => new Set([...props.selectedRoles, ...props.copiedRoles].map((role) => role.id)).size)
const hasPermissionSources = computed(() => props.selectedRoles.length > 0 || !!props.copiedFromUser || props.manualDataPermissions.length > 0)

watch(() => props.tenantError, async (error) => {
  if (!error) return
  await nextTick()
  tenantGroup.value?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus()
})
</script>


<style scoped>
.permission-scope-editor { min-width: 0; color: var(--color-text); }
.scope-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.scope-heading h3 { margin: 0; color: var(--color-text); font-size: 20px; }
.scope-heading p { margin: 8px 0 0; color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; }
.scope-heading > span { flex: 0 0 auto; border-radius: 9999px; padding: 4px 8px; background: var(--color-primary-subtle); color: var(--color-primary); font-size: 12px; font-weight: 700; }
.tenant-field { display: block; margin-bottom: 20px; }
.field-label { display: block; margin-bottom: 8px; color: var(--color-text); font-size: 13px; font-weight: 700; }
.field-label em { margin-left: 8px; color: var(--color-danger); font-size: 12px; font-style: normal; }
.tenant-multi-options { display: flex; flex-wrap: wrap; gap: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); }
.tenant-multi-options.invalid { border-color: var(--color-danger); box-shadow: var(--shadow-popover); }
.tenant-multi-options label { display: inline-flex; align-items: center; gap: 8px; min-height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 12px; background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; }
.tenant-multi-options label:hover { border-color: var(--color-border-strong); background: var(--color-bg-subtle); }
.tenant-multi-options label:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-subtle); }
.tenant-multi-options label.selected { border-color: var(--color-primary); background: var(--color-primary-subtle); color: var(--color-primary); }
.tenant-multi-options input { width: 16px; height: 16px; accent-color: var(--color-primary); }
.field-help, .field-error { display: block; margin-top: 8px; font-size: 12px; line-height: 1.5; }
.field-help { color: var(--color-text-secondary); }
.field-error { color: var(--color-danger); }
.scope-action-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 20px; }
.scope-btn { min-height: var(--control-height-md); border-radius: var(--radius-md); padding: 0 16px; font: inherit; font-size: 13px; font-weight: 700; white-space: nowrap; cursor: pointer; }
.scope-btn.primary { border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.scope-btn.primary:hover { background: var(--color-primary-hover); }
.scope-btn.secondary { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); }
.scope-btn.secondary:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.scope-btn:focus-visible, .link-btn:focus-visible, .chip-remove:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--color-primary-subtle); }
.scope-btn:disabled { cursor: not-allowed; opacity: .5; }
.copy-complete { color: var(--color-success); font-size: 12px; font-weight: 700; }
.scope-source-stack { display: grid; gap: 12px; }
.scope-empty { border: 1px dashed var(--color-border); border-radius: var(--radius-md); padding: 24px; background: var(--color-bg-subtle); text-align: center; }
.scope-empty p { margin: 8px 0 0; color: var(--color-text-secondary); font-size: 12px; }
.scope-source-panel { border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 16px; background: var(--color-surface); }
.scope-source-panel.copied { background: var(--color-bg-subtle); }
.scope-panel-head, .source-role-card { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.scope-panel-head small, .source-role-card small { display: block; margin-top: 4px; color: var(--color-text-secondary); font-size: 12px; line-height: 1.45; }
.source-role-list { display: grid; gap: 8px; margin-top: 12px; }
.source-role-card { border-top: 1px solid var(--color-border-subtle); padding-top: 12px; }
.role-card-actions { display: flex; align-items: center; gap: 8px; }
.link-btn { border: 0; padding: 4px; background: transparent; color: var(--color-primary); font: inherit; font-size: 12px; cursor: pointer; }
.link-btn.danger { color: var(--color-danger); }
.readonly-badge, .copy-complete { border-radius: 9999px; padding: 4px 8px; }
.readonly-badge { background: var(--color-surface-muted); color: var(--color-text-secondary); font-size: 12px; font-weight: 700; }
.copied-permission-groups { display: grid; gap: 12px; margin-top: 16px; border-top: 1px solid var(--color-border-subtle); padding-top: 12px; }
.group-label { display: block; margin-bottom: 8px; color: var(--color-text-secondary); font-size: 12px; font-weight: 700; }
.permission-chip-list { display: flex; flex-wrap: wrap; gap: 8px; }
.permission-chip-list > span { display: inline-flex; align-items: center; gap: 8px; min-height: 28px; border-radius: var(--radius-md); padding: 0 8px; background: var(--color-primary-subtle); color: var(--color-primary); font-size: 12px; }
.permission-chip-list em { border-left: 1px solid var(--color-primary-border); padding-left: 8px; color: var(--color-text-secondary); font-size: 12px; font-style: normal; }
.chip-remove { border: 0; padding: 0 0 0 4px; background: transparent; color: currentColor; cursor: pointer; }
@media (max-width: 620px) {
  .scope-heading { display: block; }
  .scope-heading > span { display: inline-flex; margin-top: 12px; }
  .scope-action-bar { align-items: stretch; }
  .scope-btn { flex: 1 1 100%; }
  .scope-panel-head, .source-role-card { align-items: flex-start; }
}
</style>
