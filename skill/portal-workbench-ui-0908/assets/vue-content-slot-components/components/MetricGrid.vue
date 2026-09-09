<script setup lang="ts">
withDefaults(defineProps<{ columns?: 'auto' | 2 | 3 | 4 }>(), { columns: 'auto' })
</script>

<template><div class="cs-metric-grid" :data-columns="columns"><slot /></div></template>
