<template>
  <div ref="root" class="poc-account-picker" @focusout="onFocusOut">
    <input
      :id="id"
      class="form-input poc-account-input"
      :value="modelValue"
      :placeholder="placeholder"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="none"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="id + '-options'"
      :aria-describedby="id + '-hint'"
      :aria-activedescendant="open && activeIndex >= 0 ? id + '-option-' + activeIndex : undefined"
      @input="onInput"
      @focus="showOptions"
      @click="showOptions"
      @keydown="onKeydown"
    />
    <span :id="id + '-hint'" class="poc-account-hint">仅 POC：选择演示账号后自动填充密码，不自动登录。</span>
    <div v-if="open" class="poc-account-popup">
      <ul :id="id + '-options'" role="listbox" aria-label="POC 演示账号">
        <li
          v-for="(account, index) in accounts"
          :id="id + '-option-' + index"
          :key="account.username"
          role="option"
          :aria-selected="index === activeIndex"
          :class="{ active: index === activeIndex }"
          @pointerdown.prevent
          @click="selectAccount(account)"
          @mousemove="activeIndex = index"
        >
          <span>{{ account.label }}</span>
          <small>{{ account.username }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { allowPreviewAuth } from '@/config/runtimeMode'
import { POC_LOGIN_ACCOUNTS, type PocLoginAccount } from '@/services/pocExternalLogin'

defineProps<{ id: string; modelValue: string; placeholder?: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [account: PocLoginAccount]
  submit: []
}>()
const accounts = allowPreviewAuth ? POC_LOGIN_ACCOUNTS : []
const root = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

function closeOptions() {
  open.value = false
  activeIndex.value = -1
}
function showOptions() {
  open.value = accounts.length > 0
}
function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
  activeIndex.value = -1
  showOptions()
}
function selectAccount(account: PocLoginAccount) {
  closeOptions()
  emit('update:modelValue', account.username)
  emit('select', account)
}
function onFocusOut(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) closeOptions()
}
function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) closeOptions()
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    showOptions()
    if (!accounts.length) return
    activeIndex.value = activeIndex.value < 0
      ? (event.key === 'ArrowDown' ? 0 : accounts.length - 1)
      : (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + accounts.length) % accounts.length
    nextTick(() => root.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }))
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeOptions()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const selected = open.value ? accounts[activeIndex.value] : undefined
    if (selected) selectAccount(selected)
    else {
      closeOptions()
      emit('submit')
    }
  } else if (event.key === 'Tab') closeOptions()
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<style scoped>
.poc-account-picker { position: relative; min-width: 0; }
.poc-account-input { width: 100%; }
.poc-account-hint {
  display: block;
  margin-top: 4px;
  color: var(--color-text-secondary);
  font-size: var(--text-xs, 12px);
  line-height: 1.5;
}
.poc-account-popup {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  right: 0;
  width: max(100%, min(320px, calc(100vw - 48px)));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-popover);
  overflow: hidden;
}
.poc-account-popup ul {
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: min(320px, 40vh);
  overflow-y: auto;
}
.poc-account-popup li {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text);
  font-size: var(--text-sm, 13px);
  line-height: 1.5;
}
.poc-account-popup li:hover,
.poc-account-popup li.active { background: var(--color-primary-subtle); }
.poc-account-popup small {
  display: block;
  color: var(--color-text-secondary);
  font-size: var(--text-xs, 12px);
}
.poc-account-input:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
