<script setup lang="ts">
withDefaults(defineProps<{ state?: 'loading' | 'data' | 'empty' | 'error' | 'no-permission' }>(), {
  state: 'data'
})
</script>

<template>
  <section class="cs-list-surface">
    <div v-if="$slots.tabs" class="cs-list-surface__tabs"><slot name="tabs" /></div>
    <div v-if="$slots.toolbar" class="cs-list-surface__toolbar"><slot name="toolbar" /></div>
    <div class="cs-list-surface__data"><slot /></div>
    <div v-if="$slots.pagination" class="cs-list-surface__pagination">
      <slot name="pagination" />
    </div>
  </section>
</template>

<style scoped>
.cs-list-surface {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.cs-list-surface__tabs,
.cs-list-surface__toolbar,
.cs-list-surface__pagination {
  padding: var(--space-3, 12px) var(--space-4, 16px);
}
.cs-list-surface__toolbar,
.cs-list-surface__data,
.cs-list-surface__pagination {
  border-top: 1px solid var(--color-border-subtle);
}
.cs-list-surface__data {
  min-width: 0;
}
.cs-list-surface__data:first-child {
  border-top: 0;
}
</style>
