<script setup lang="ts">
withDefaults(defineProps<{ columns?: 'auto' | 2 | 3 | 4 }>(), { columns: 'auto' })
</script>

<template>
  <div class="cs-metric-grid" :data-columns="columns"><slot /></div>
</template>

<style scoped>
.cs-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-kpi-gap, 16px);
  min-width: 0;
}
.cs-metric-grid[data-columns='2'] {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.cs-metric-grid[data-columns='3'] {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
@container (max-width:1039px) {
  .cs-metric-grid,
  .cs-metric-grid[data-columns='3'] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container (max-width:719px) {
  .cs-metric-grid,
  .cs-metric-grid[data-columns='2'],
  .cs-metric-grid[data-columns='3'] {
    grid-template-columns: 1fr;
  }
}
</style>
