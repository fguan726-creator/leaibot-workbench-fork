<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string | number
  label: string
  kind?: 'text' | 'search' | 'number' | 'select' | 'date' | 'textarea'
  size?: 'compact' | 'default'
  placeholder?: string
  helper?: string
  error?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  options?: Array<{ label: string; value: string | number }>
}>(), { kind: 'text', size: 'default', disabled: false, readonly: false, required: false, options: () => [] })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const update = (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value)
</script>

<template>
  <label class="cs-form-control" :class="[`cs-form-control--${size}`, { 'is-invalid': error }]">
    <span class="cs-form-control__label">{{ label }}<span v-if="required" aria-hidden="true"> *</span></span>
    <textarea v-if="kind === 'textarea'" class="cs-form-control__input" :value="modelValue" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :required="required" :aria-invalid="!!error" @input="update" />
    <select v-else-if="kind === 'select'" class="cs-form-control__input" :value="modelValue" :disabled="disabled" :required="required" :aria-invalid="!!error" @change="update">
      <option v-for="option in options" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
    </select>
    <input v-else class="cs-form-control__input" :type="kind" :value="modelValue" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :required="required" :aria-invalid="!!error" @input="update" />
    <span v-if="error || helper" class="cs-form-control__help" :class="{ 'is-error': error }">{{ error || helper }}</span>
  </label>
</template>
