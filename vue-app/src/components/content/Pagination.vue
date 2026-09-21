<script setup lang="ts">
import { computed } from 'vue'
const props = withDefaults(
  defineProps<{ page: number; pageSize: number; total: number; loading?: boolean }>(),
  { loading: false }
)
const emit = defineEmits<{ 'update:page': [page: number] }>()
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
</script>

<template>
  <nav v-if="total > 0" class="cs-pagination" aria-label="分页">
    <span>共 {{ total }} 条</span>
    <button
      type="button"
      :disabled="loading || page <= 1"
      aria-label="上一页"
      @click="emit('update:page', page - 1)"
    >
      上一页
    </button>
    <span aria-current="page">第 {{ page }} / {{ pageCount }} 页</span>
    <button
      type="button"
      :disabled="loading || page >= pageCount"
      aria-label="下一页"
      @click="emit('update:page', page + 1)"
    >
      下一页
    </button>
  </nav>
</template>

<style scoped>
.cs-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2, 8px);
  color: var(--color-text-secondary);
  font-size: var(--text-sm, 13px);
}
.cs-pagination button {
  height: 36px;
  padding: 0 var(--space-3, 12px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}
.cs-pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.cs-pagination button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
