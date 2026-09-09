<template>
  <label class="business-approver-field" data-info-field="businessApprover">
    <span class="field-label required">业务负责人 <em>必填</em></span>
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="{ invalid: error, 'is-placeholder': !modelValue }"
      aria-label="业务负责人"
      aria-required="true"
      :aria-invalid="!!error"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">业务负责人</option>
      <optgroup v-for="group in BUSINESS_APPROVER_GROUPS" :key="group.label" :label="group.label">
        <option v-for="option in group.options" :key="option.value" :value="option.value">{{ option.label }}</option>
      </optgroup>
    </select>
    <small v-if="error" class="field-error" role="alert">{{ error }}</small>
  </label>
</template>

<script setup lang="ts">
import { BUSINESS_APPROVER_GROUPS } from './businessApprovers.js'
withDefaults(defineProps<{ modelValue: string; error?: string; disabled?: boolean }>(), { error: '', disabled: false })
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.business-approver-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.business-approver-field select { --color-surface-subtle: var(--color-surface); width: 100%; min-width: 0; height: var(--control-height-md); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0 8px; background: var(--card-bg); color: var(--text); font: inherit; font-size: 13px; }
.business-approver-field option { color: var(--text); }
.business-approver-field select.is-placeholder, .business-approver-field option[value=""] { color: var(--text-tertiary); }
.business-approver-field select.is-placeholder { --form-control-text: var(--text-tertiary); }
.business-approver-field select:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.business-approver-field select.invalid { border-color: var(--red); }
.business-approver-field em, .business-approver-field .field-error { color: var(--red); font-size: 12px; font-style: normal; }
</style>
