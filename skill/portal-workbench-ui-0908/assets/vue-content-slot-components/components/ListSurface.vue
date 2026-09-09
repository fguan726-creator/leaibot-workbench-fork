<script setup lang="ts">
withDefaults(defineProps<{ state?: 'loading' | 'data' | 'empty' | 'error' | 'no-permission' }>(), { state: 'data' })
</script>

<template>
  <section class="cs-list-surface">
    <div v-if="$slots.tabs" class="cs-list-surface__tabs"><slot name="tabs" /></div>
    <div v-if="$slots.toolbar" class="cs-list-surface__toolbar"><slot name="toolbar" /></div>
    <div class="cs-list-surface__data"><slot /></div>
    <div v-if="$slots.pagination" class="cs-list-surface__pagination"><slot name="pagination" /></div>
  </section>
</template>
