<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'
    ariaLabel?: string
  }>(),
  { tone: 'neutral', ariaLabel: undefined }
)
</script>

<template>
  <span class="cs-status-tag" :class="`cs-status-tag--${tone}`" :aria-label="ariaLabel"><i aria-hidden="true" /><slot/></span>
</template>

<style scoped>
.cs-status-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1, 4px);
  width: max-content;
  max-width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  font-size: var(--text-xs, 12px);
  white-space: nowrap;
}
.cs-status-tag i {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: currentColor;
}
.cs-status-tag--success {
  color: var(--color-success);
  background: var(--color-success-subtle);
}
.cs-status-tag--warning {
  color: var(--color-warning);
  background: var(--color-warning-subtle);
}
.cs-status-tag--danger {
  color: var(--color-danger);
  background: var(--color-danger-subtle);
}
.cs-status-tag--info,
.cs-status-tag--primary {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
}
</style>
