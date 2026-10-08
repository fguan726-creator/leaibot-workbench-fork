<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'

interface SelectOption {
  value: string
  label: string
  description?: string
  keywords?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  options: SelectOption[]
  searchable?: boolean
  placeholder?: string
  disabled?: boolean
  id?: string
  emptyText?: string
}>(), {
  searchable: false,
  placeholder: '请选择',
  disabled: false,
  id: undefined,
  emptyText: '未找到匹配活动'
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()
const instanceId = getCurrentInstance()?.uid ?? 0
const controlId = computed(() => props.id || `points-select-${instanceId}`)
const listId = computed(() => `${controlId.value}-listbox`)
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const popup = ref<HTMLElement | null>(null)
const opened = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const composing = ref(false)
const position = ref<Record<string, string>>({})
const unavailable = computed(() => props.disabled || !props.options.length)
const selected = computed(() => props.options.find(option => option.value === props.modelValue))
const selectedLabel = computed(() => selected.value?.label ?? (props.modelValue ? '当前选项不可用' : ''))
const displayedValue = computed(() => opened.value && props.searchable ? query.value : selectedLabel.value)
const filtered = computed(() => {
  const term = props.searchable ? query.value.trim().toLocaleLowerCase() : ''
  return term ? props.options.filter(option =>
    `${option.label} ${option.value} ${option.keywords || ''}`.toLocaleLowerCase().includes(term)
  ) : props.options
})
const activeId = computed(() => opened.value && activeIndex.value >= 0 && filtered.value[activeIndex.value]
  ? `${controlId.value}-option-${activeIndex.value}` : undefined)
let dialog: HTMLDialogElement | null = null
let observer: ResizeObserver | null = null
let listening = false

async function positionPopup() {
  if (!opened.value || !input.value || !popup.value) return
  const rect = input.value.getBoundingClientRect()
  const margin = 8
  const gap = 4
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const width = Math.min(rect.width, viewportWidth - margin * 2)
  position.value = {
    ...position.value,
    left: `${Math.max(margin, Math.min(rect.left, viewportWidth - width - margin))}px`,
    width: `${width}px`
  }
  // Wrapping depends on the trigger width, so measure after that width is applied.
  await nextTick()
  if (!opened.value || !popup.value) return
  const above = Math.max(0, rect.top - gap - margin)
  const below = Math.max(0, viewportHeight - rect.bottom - gap - margin)
  const desiredHeight = Math.min(popup.value.scrollHeight, 280)
  const flipped = below < desiredHeight && above > below
  const height = Math.min(desiredHeight, flipped ? above : below)
  position.value = {
    ...position.value,
    top: `${flipped ? Math.max(margin, rect.top - gap - height) : rect.bottom + gap}px`,
    maxHeight: `${Math.max(0, Math.min(280, flipped ? above : below))}px`
  }
}

function close() {
  opened.value = false
  query.value = ''
  activeIndex.value = -1
  composing.value = false
  // A local popover enters the top layer without leaving its modal dialog subtree.
  if (popup.value && typeof popup.value.hidePopover === 'function') popup.value.hidePopover()
  removeListeners()
}

function outsidePointer(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}
function escapeKey(event: KeyboardEvent) {
  if (!opened.value || event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  close()
}
function cancelDialog(event: Event) {
  if (!opened.value) return
  event.preventDefault()
  event.stopPropagation()
  close()
}
function addListeners() {
  if (listening) return
  listening = true
  document.addEventListener('pointerdown', outsidePointer, true)
  document.addEventListener('keydown', escapeKey, true)
  window.addEventListener('resize', positionPopup)
  window.addEventListener('scroll', positionPopup, true)
  window.visualViewport?.addEventListener('resize', positionPopup)
  window.visualViewport?.addEventListener('scroll', positionPopup)
  dialog = root.value?.closest('dialog') ?? null
  dialog?.addEventListener('cancel', cancelDialog, true)
  if (typeof ResizeObserver !== 'undefined' && input.value) {
    observer = new ResizeObserver(positionPopup)
    observer.observe(input.value)
  }
}
function removeListeners() {
  if (!listening) return
  listening = false
  document.removeEventListener('pointerdown', outsidePointer, true)
  document.removeEventListener('keydown', escapeKey, true)
  window.removeEventListener('resize', positionPopup)
  window.removeEventListener('scroll', positionPopup, true)
  window.visualViewport?.removeEventListener('resize', positionPopup)
  window.visualViewport?.removeEventListener('scroll', positionPopup)
  dialog?.removeEventListener('cancel', cancelDialog, true)
  dialog = null
  observer?.disconnect()
  observer = null
}
function resetActive() {
  const selectedIndex = filtered.value.findIndex(option => option.value === props.modelValue)
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : filtered.value.length ? 0 : -1
}
async function revealActive() {
  await nextTick()
  const panel = popup.value
  const item = panel?.children[activeIndex.value] as HTMLElement | undefined
  if (!panel || !item) return
  if (item.offsetTop < panel.scrollTop) panel.scrollTop = item.offsetTop
  else if (item.offsetTop + item.offsetHeight > panel.scrollTop + panel.clientHeight) {
    panel.scrollTop = item.offsetTop + item.offsetHeight - panel.clientHeight
  }
}
async function open() {
  if (unavailable.value || opened.value) return
  query.value = ''
  opened.value = true
  resetActive()
  addListeners()
  await nextTick()
  if (!opened.value || !popup.value) return
  if (typeof popup.value.showPopover === 'function') popup.value.showPopover()
  else popup.value.removeAttribute('popover')
  await positionPopup()
  await revealActive()
}
function clickTrigger() {
  if (unavailable.value) return
  if (opened.value && !props.searchable) close()
  else void open()
}
function focusTrigger() {
  if (props.searchable) void open()
}
function inputText(event: Event) {
  const target = event.target as HTMLInputElement
  if (!props.searchable || unavailable.value) {
    target.value = displayedValue.value
    return
  }
  if (!opened.value) void open()
  query.value = target.value
}
function endComposition(event: CompositionEvent) {
  composing.value = false
  inputText(event)
}
function selectOption(option: SelectOption) {
  if (unavailable.value || !props.options.some(candidate => candidate.value === option.value)) return
  close()
  if (option.value !== props.modelValue) {
    emit('update:modelValue', option.value)
    emit('change', option.value)
  }
}
function keydown(event: KeyboardEvent) {
  if (unavailable.value) return
  if (event.key === 'Escape' && opened.value) {
    escapeKey(event)
    return
  }
  if (event.key === 'Tab') {
    close()
    return
  }
  if (composing.value || event.isComposing || event.keyCode === 229) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    if (!opened.value) {
      void open()
      return
    }
    if (filtered.value.length) {
      const direction = event.key === 'ArrowDown' ? 1 : -1
      activeIndex.value = (activeIndex.value + direction + filtered.value.length) % filtered.value.length
      void revealActive()
    }
  } else if (opened.value && (event.key === 'Home' || event.key === 'End') && !props.searchable) {
    event.preventDefault()
    activeIndex.value = event.key === 'Home' ? 0 : filtered.value.length - 1
    void revealActive()
  } else if (event.key === 'Enter' || (!props.searchable && event.key === ' ')) {
    event.preventDefault()
    if (!opened.value) void open()
    else if (filtered.value[activeIndex.value]) selectOption(filtered.value[activeIndex.value])
  }
}
function focusOut(event: FocusEvent) {
  if (!root.value?.contains(event.relatedTarget as Node | null)) close()
}
watch(filtered, async () => {
  if (!opened.value) return
  resetActive()
  await nextTick()
  await positionPopup()
  await revealActive()
}, { deep: true })
watch(() => props.modelValue, () => close())
watch(unavailable, value => { if (value) close() })
onDeactivated(close)
onBeforeUnmount(close)
</script>

<template>
  <div ref="root" class="points-field points-select" @focusout="focusOut">
    <label :for="controlId">{{ label }}</label>
    <div class="points-select-trigger">
      <input
        :id="controlId"
        ref="input"
        class="points-select-input"
        :class="{ 'points-select-searchable': searchable }"
        role="combobox"
        type="text"
        autocomplete="off"
        :value="displayedValue"
        :placeholder="placeholder"
        :readonly="!searchable"
        :disabled="unavailable"
        :aria-expanded="opened"
        :aria-controls="listId"
        :aria-autocomplete="searchable ? 'list' : 'none'"
        :aria-activedescendant="activeId"
        aria-haspopup="listbox"
        @focus="focusTrigger"
        @click="clickTrigger"
        @input="inputText"
        @keydown="keydown"
        @compositionstart="composing = true"
        @compositionend="endComposition"
      />
      <svg class="points-select-chevron" :class="{ 'is-open': opened }" viewBox="0 0 16 16" aria-hidden="true">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </div>
    <div
      v-if="opened"
      :id="listId"
      ref="popup"
      class="points-select-popup"
      role="listbox"
      popover="manual"
      :aria-label="label"
      :style="position"
    >
      <div
        v-for="(option, index) in filtered"
        :id="`${controlId}-option-${index}`"
        :key="option.value"
        class="points-select-option"
        :class="{ 'is-active': index === activeIndex, 'is-selected': option.value === modelValue }"
        role="option"
        :aria-selected="option.value === modelValue"
        @pointerdown.prevent
        @click="selectOption(option)"
        @mousemove="activeIndex = index"
      >
        <span class="points-select-option-copy">
          <span>{{ option.label }}</span>
          <small v-if="option.description">{{ option.description }}</small>
        </span>
        <svg v-if="option.value === modelValue" class="points-select-check" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m3 8 3 3 7-7" />
        </svg>
      </div>
      <div v-if="!filtered.length" class="points-select-empty" role="status">{{ emptyText }}</div>
    </div>
  </div>
</template>

<style scoped>
.points-select {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2, 8px);
}
.points-select > label {
  color: var(--color-text-secondary);
  font-size: var(--text-sm, 13px);
}
.points-select-trigger {
  position: relative;
  min-width: 0;
}
.points-select .points-select-input {
  box-sizing: border-box;
  width: 100%;
  height: var(--control-height-md, 36px);
  padding: 0 var(--space-8, 32px) 0 var(--space-3, 12px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-sm, 13px);
  cursor: pointer;
  text-overflow: ellipsis;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.points-select .points-select-input.points-select-searchable {
  cursor: text;
}
.points-select .points-select-input::placeholder {
  color: var(--color-text-tertiary);
}
.points-select .points-select-input:not(:disabled):not(:focus):hover {
  border-color: var(--color-primary-border);
}
.points-select .points-select-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--focus-ring);
}
.points-select .points-select-input:disabled {
  color: var(--color-text-secondary);
  background: var(--color-surface-muted);
  cursor: not-allowed;
}
.points-select-chevron {
  position: absolute;
  top: 50%;
  right: var(--space-3, 12px);
  width: var(--space-4, 16px);
  height: var(--space-4, 16px);
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  pointer-events: none;
}
.points-select-chevron.is-open {
  transform: translateY(-50%) rotate(180deg);
}
.points-select-chevron path,
.points-select-check path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.points-select-popup {
  position: fixed;
  inset: auto;
  box-sizing: border-box;
  margin: 0;
  padding: var(--space-1, 4px);
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-popover);
  z-index: var(--z-dropdown, 100);
  font-size: var(--text-sm, 13px);
}
.points-select-option {
  display: flex;
  min-height: var(--control-height-md, 36px);
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px);
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  line-height: 1.4;
}
.points-select-option.is-active {
  background: var(--color-bg-subtle);
}
.points-select-option.is-selected {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}
.points-select-option-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1, 4px);
  overflow-wrap: anywhere;
}
.points-select-option-copy small {
  color: var(--color-text-secondary);
  font-size: var(--text-xs, 12px);
}
.points-select-check {
  width: var(--space-4, 16px);
  height: var(--space-4, 16px);
  flex-shrink: 0;
}
.points-select-empty {
  padding: var(--space-3, 12px);
  color: var(--color-text-secondary);
}
</style>
