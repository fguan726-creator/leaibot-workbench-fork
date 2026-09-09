<template>
  <div v-if="visible" class="permission-modal permission-scope-picker-modal" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <section ref="dialog" class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="copy-role-title" tabindex="-1" @keydown.tab="trapFocus">
      <button type="button" class="modal-close" aria-label="关闭复制他人角色弹窗" @click="$emit('close')">×</button>
      <h3 id="copy-role-title">复制他人角色</h3>
      <p class="modal-note">复制对方当前有效的角色及角色对应的功能、数据权限，并复制用户单独授权的数据权限；不复制租户、组织和账号资料。复制结果只读。</p>
      <label class="modal-form-field">
        <span>对方 ITCode <em>必填</em></span>
        <input ref="input" :value="itcode" :class="{ invalid: error }" placeholder="例如 wangxt8" @input="updateItcode" @keyup.enter="$emit('confirm')">
        <small v-if="error" class="field-error" role="alert">{{ error }}</small>
      </label>
      <small class="field-help">可试用：wangxt8、liwen08、temp-bpo</small>
      <footer class="modal-actions">
        <button type="button" class="secondary-btn" @click="$emit('close')">取消</button>
        <button type="button" class="primary-btn" @click="$emit('confirm')">确认复制</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = defineProps<{ visible: boolean; itcode: string; error?: string }>()
const emit = defineEmits<{ close: []; confirm: []; 'update:itcode': [value: string] }>()
const dialog = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
let returnFocus: HTMLElement | null = null

watch(() => props.visible, async (visible) => {
  if (!visible) {
    returnFocus?.focus()
    returnFocus = null
    return
  }
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  await nextTick()
  input.value?.focus()
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

function updateItcode(event: Event) {
  emit('update:itcode', (event.target as HTMLInputElement).value.trim())
}
</script>

<style scoped>
.permission-modal.permission-scope-picker-modal { position: fixed; inset: 0; z-index: 1450; display: grid; place-items: center; overflow-y: auto; padding: 24px; background: color-mix(in srgb, var(--color-text) 45%, transparent); }
.modal-panel { position: relative; box-sizing: border-box; width: min(560px, 100%); max-height: calc(100vh - 48px); overflow: auto; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 24px; background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-popover); }
h3 { margin: 0; font-size: 20px; }
.modal-note { margin: 8px calc(40px + 4px) 0 0; color: var(--color-text-secondary); font-size: 13px; line-height: 1.6; }
.modal-close { position: absolute; top: 16px; right: 16px; width: var(--control-height-md); height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-secondary); font-size: 20px; cursor: pointer; }
.modal-close:focus-visible, input:focus-visible, button:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--color-primary-subtle); }
.modal-form-field { display: block; margin-top: 20px; }
.modal-form-field > span { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
.modal-form-field em { margin-left: 8px; color: var(--color-danger); font-size: 12px; font-style: normal; }
input { box-sizing: border-box; width: 100%; min-height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 12px; background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 13px; }
input:focus { border-color: var(--color-primary); }
input.invalid { border-color: var(--color-danger); }
.field-help, .field-error { display: block; margin-top: 8px; font-size: 12px; }
.field-help { color: var(--color-text-secondary); }
.field-error { color: var(--color-danger); }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; border-top: 1px solid var(--color-border-subtle); padding-top: 16px; }
.primary-btn, .secondary-btn { min-height: var(--control-height-md); border-radius: var(--radius-md); padding: 0 16px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.primary-btn { border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-on-primary); }
.secondary-btn { border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); }


.primary-btn, .secondary-btn { font-family: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; }
.primary-btn:hover:not(:disabled) { border-color: var(--color-primary-hover); background: var(--color-primary-hover); }
.secondary-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.primary-btn:focus-visible, .secondary-btn:focus-visible, .modal-close:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>

<style scoped src="./permissionDialogFooter.css"></style>
