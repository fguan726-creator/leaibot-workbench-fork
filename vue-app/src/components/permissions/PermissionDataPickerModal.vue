<template>
  <div v-if="visible" class="permission-modal permission-scope-picker-modal" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <section ref="dialog" class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="data-picker-title" tabindex="-1" @keydown.tab="trapFocus">
      <button type="button" class="modal-close" aria-label="关闭" @click="$emit('close')">×</button>
      <h3 id="data-picker-title">选择数据权限</h3>
      <p class="modal-note">按目录、数据源和授权项分层展示；点击目录或数据源右侧放大镜搜索对应范围。复制带入的数据权限保持锁定。</p>
      <div class="data-directory-picker">
        <PermissionDataDirectoryList
          :directories="directories"
          :selected-ids="selectedIds"
          :disabled-ids="lockedIds"
          :source-labels="lockedLabels"
          @toggle="$emit('toggle', $event)"
        />
      </div>
      <footer class="modal-actions">
        <button type="button" class="secondary-btn" @click="$emit('close')">取消</button>
        <button type="button" class="primary-btn" @click="$emit('confirm')">确认</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import PermissionDataDirectoryList, { type DataPermissionDirectory } from './PermissionDataDirectoryList.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  directories: DataPermissionDirectory[]
  selectedIds: string[]
  lockedIds: string[]
  lockedLabels?: Record<string, string>
}>(), { lockedLabels: () => ({}) })

const dialog = ref<HTMLElement | null>(null)
let returnFocus: HTMLElement | null = null

defineEmits<{
  close: []
  confirm: []
  toggle: [id: string]
}>()

watch(() => props.visible, async (visible) => {
  if (!visible) {
    returnFocus?.focus()
    returnFocus = null
    return
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  dialog.value?.querySelector<HTMLElement>('.directory-search-trigger')?.focus()
})

function trapFocus(event: KeyboardEvent) {
  const focusable = [...(dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') || [])]
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
h3 { margin: 0; color: var(--color-text); font-size: 20px; }
.modal-note { margin: 8px calc(40px + 4px) 0 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
.modal-close { position: absolute; top: 16px; right: 16px; width: var(--control-height-md); height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-secondary); font-size: 20px; cursor: pointer; }
.data-directory-picker { max-height: 520px; margin-top: 16px; overflow: auto; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; border-top: 1px solid var(--color-border-subtle); padding-top: 16px; }
.primary-btn, .secondary-btn { min-height: var(--control-height-md); border-radius: var(--radius-md); padding: 0 20px; font-weight: 700; cursor: pointer; }
.primary-btn { border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.secondary-btn { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); }
@media (max-width: 520px) { .permission-modal.permission-scope-picker-modal { padding: 12px; } .modal-panel { max-height: calc(100vh - 24px); padding: 20px; } }


.primary-btn, .secondary-btn { font-family: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; }
.primary-btn:hover:not(:disabled) { border-color: var(--color-primary-hover); background: var(--color-primary-hover); }
.secondary-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.primary-btn:focus-visible, .secondary-btn:focus-visible, .modal-close:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>

<style scoped src="./permissionDialogFooter.css"></style>
