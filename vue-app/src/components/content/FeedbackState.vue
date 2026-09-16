<script setup lang="ts">
withDefaults(
  defineProps<{
    state: 'loading' | 'empty' | 'filtered-empty' | 'error' | 'no-permission' | 'stale'
    title: string
    description?: string
  }>(),
  { description: '' }
)
</script>

<template>
  <div
    class="cs-feedback-state"
    :role="state === 'error' ? 'alert' : 'status'"
    :aria-live="state === 'loading' ? 'polite' : undefined"
  >
    <span class="cs-feedback-state__icon" aria-hidden="true">{{
      state === 'loading' ? '…' : '○'
    }}</span>
    <strong>{{ title }}</strong>
    <p v-if="description">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<style scoped>
.cs-feedback-state {
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--space-2, 8px);
  min-height: 160px;
  padding: var(--space-6, 24px);
  color: var(--color-text);
  text-align: center;
}
.cs-feedback-state p {
  margin: 0;
  color: var(--color-text-secondary);
}
.cs-feedback-state__icon {
  color: var(--color-primary);
  font-size: var(--text-2xl, 24px);
}
</style>
