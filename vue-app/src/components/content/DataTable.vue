<script setup lang="ts" generic="Row extends Record<string, unknown>">
type Column = {
  key: string
  label: string
  align?: 'left' | 'right'
  width?: string
  format?: (value: unknown, row: Row) => string
}
withDefaults(
  defineProps<{
    columns: Column[]
    rows: Row[]
    rowKey: keyof Row
    caption: string
    density?: 'compact' | 'default' | 'comfy' | 'two-line'
    loading?: boolean
  }>(),
  { density: 'default', loading: false }
)
</script>

<template>
  <div class="cs-data-table-wrap">
    <table class="cs-data-table" :class="`cs-data-table--${density}`">
      <caption class="cs-sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :data-column="column.key"
            :style="{ width: column.width, textAlign: column.align || 'left' }"
            scope="col"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length">加载中</td>
        </tr>
        <tr v-for="row in rows" v-else :key="String(row[rowKey])">
          <td
            v-for="column in columns"
            :key="column.key"
            :data-column="column.key"
            :style="{ textAlign: column.align || 'left' }"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{
              column.format ? column.format(row[column.key], row) : row[column.key]
            }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cs-data-table-wrap {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
}
.cs-data-table {
  width: 100%;
  min-width: 680px;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--color-text);
  font-size: var(--text-sm, 13px);
}
.cs-data-table th,
.cs-data-table td {
  padding: var(--space-2, 8px) var(--space-4, 16px);
  border-bottom: 1px solid var(--color-border-subtle);
  vertical-align: middle;
}
.cs-data-table th {
  height: 40px;
  background: var(--color-surface-subtle);
  color: var(--color-text-secondary);
  font-size: var(--text-xs, 12px);
  white-space: nowrap;
}
.cs-data-table td {
  height: 48px;
  background: var(--color-surface);
}
.cs-data-table--compact td {
  height: 40px;
}
.cs-data-table--comfy td {
  height: 56px;
}
.cs-data-table--two-line td {
  height: 64px;
}
.cs-data-table tr:last-child td {
  border-bottom: 0;
}
.cs-data-table [data-column='actions'] {
  position: sticky;
  right: 0;
  box-shadow: -1px 0 0 var(--color-border-subtle);
}
.cs-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
