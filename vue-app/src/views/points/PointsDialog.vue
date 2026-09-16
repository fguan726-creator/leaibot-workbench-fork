<script setup lang="ts">
import { onMounted, onActivated, onDeactivated, onBeforeUnmount, ref } from 'vue'
withDefaults(defineProps<{ title: string; description?: string; wide?: boolean }>(), {
  description: '',
  wide: false
})
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
let trigger: HTMLElement | null = null
function openDialog() {
  if (!dialog.value || dialog.value.open) return
  trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  dialog.value.showModal()
}
function closeDialog(restoreFocus: boolean) {
  const target = trigger
  const ownsFocus = dialog.value?.contains(document.activeElement) || document.activeElement === document.body
  trigger = null
  dialog.value?.close()
  if (restoreFocus && ownsFocus && target?.isConnected && target.getClientRects().length) {
    target.focus({ preventScroll: true })
  }
}
onMounted(openDialog)
// A parent may retain the editor to confirm unsaved changes instead of accepting close.
onActivated(openDialog)
onDeactivated(() => {
  closeDialog(false)
  emit('close')
})
onBeforeUnmount(() => closeDialog(true))
</script>
<template>
  <dialog
    ref="dialog"
    class="points-dialog"
    :class="{ 'points-dialog-wide': wide }"
    :aria-label="title"
    @cancel.prevent="emit('close')"
  >
    <div class="points-dialog-header">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <button
        type="button"
        class="btn btn-secondary"
        aria-label="关闭对话框"
        data-dialog-close
        @click="emit('close')"
      >
        关闭
      </button>
    </div>
    <div class="points-dialog-content"><slot /></div>
    <div v-if="$slots.actions" class="points-dialog-actions"><slot name="actions" /></div>
  </dialog>
</template>
<style scoped>
.points-dialog {
  container-type: inline-size;
  width: min(560px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  overflow: auto;
}
.points-dialog-wide {
  width: min(760px, calc(100vw - 32px));
}
.points-dialog::backdrop {
  background: var(--color-overlay, color-mix(in srgb, var(--color-text) 35%, transparent));
}
.points-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4, 16px);
  padding: var(--space-5, 20px);
  border-bottom: 1px solid var(--color-border-subtle);
}
.points-dialog-header h2 {
  margin: 0;
  font-size: var(--text-md, 16px);
  line-height: 1.4;
}
.points-dialog-header p {
  margin: var(--space-2, 8px) 0 0;
  font-size: var(--text-xs, 12px);
  color: var(--color-text-secondary);
}
.points-dialog-content {
  padding: var(--space-5, 20px);
}
.points-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2, 8px);
  padding: var(--space-4, 16px) var(--space-5, 20px);
  border-top: 1px solid var(--color-border-subtle);
}
</style>
