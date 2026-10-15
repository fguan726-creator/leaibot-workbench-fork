<script setup lang="ts">
withDefaults(defineProps<{ label: string; layout?: 'stacked' | 'inset'; group?: boolean }>(), { layout: 'stacked', group: false })
</script>

<template>
  <component
    :is="group ? 'div' : 'label'"
    class="cs-filter-field"
    :data-field-layout="layout"
    :role="group ? 'group' : undefined"
    :aria-label="group ? label : undefined"
  >
    <span class="cs-filter-field__label">{{ label }}</span>
    <slot />
  </component>
</template>

<style scoped>
.cs-filter-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: var(--space-2, 8px);
  min-width: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm, 13px);
}
.cs-filter-field__label {
  font-weight: 500;
  line-height: var(--line-height-filter-label, 20px);
}
:is(label, div).cs-filter-field[data-field-layout] :deep(input),
:is(label, div).cs-filter-field[data-field-layout] :deep(select) {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: var(--control-height-md, 36px);
  padding: 0 var(--space-3, 12px);
  border: 1px solid var(--color-border);
  /* The inherited POC stylesheet forces 10px on date/select controls. */
  border-radius: var(--radius-filter-control, 8px) !important;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  outline: none;
}
.cs-filter-field :deep(input::placeholder) {
  color: var(--color-text-tertiary);
}
.cs-filter-field :deep(input:focus),
.cs-filter-field :deep(select:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}

.cs-filter-field[data-field-layout='inset'] { gap: 0; }
.cs-filter-field[data-field-layout='inset'] .cs-filter-field__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Date inputs are contained by one shared range surface. */
:is(label, div).cs-filter-field[data-field-layout='inset'] :deep(input[type='date']) {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
</style>
