<template>
  <div ref="root" class="data-directory-list">
    <section v-for="directory in directories" :key="directory.id" class="data-directory" :data-directory-id="directory.id">
      <header class="data-directory-head">
        <button
          type="button"
          class="data-directory-toggle"
          :aria-expanded="isExpanded(directory.id)"
          @click="toggleDirectory(directory.id)"
        >
          <span class="directory-chevron" aria-hidden="true">›</span>
          <b>{{ directory.name }}</b>
          <span>{{ directory.sources.length }} 个数据源</span>
        </button>
        <button
          type="button"
          :class="['directory-search-trigger', { active: isSearchVisible(directory.id) }]"
          :aria-label="isSearchVisible(directory.id) ? `关闭${directory.name}下的数据权限搜索` : `搜索${directory.name}下的数据权限`"
          :title="isSearchVisible(directory.id) ? '关闭搜索' : '搜索当前目录的数据源或授权项'"
          @click="toggleDirectorySearch(directory.id, $event)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </button>
      </header>

      <div v-if="isExpanded(directory.id)" class="data-directory-body">
        <div v-if="isSearchVisible(directory.id)" class="directory-search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            :value="directoryKeyword(directory.id)"
            placeholder="搜索数据源或授权项名称"
            :aria-label="`搜索${directory.name}下的数据权限`"
            @input="updateDirectoryKeyword(directory.id, $event)"
            @keydown.enter.prevent
            @keydown.esc.stop="closeDirectorySearch(directory.id)"
          >
          <button
            v-if="directoryKeyword(directory.id)"
            type="button"
            class="directory-search-clear"
            :aria-label="`清空${directory.name}搜索关键词`"
            title="清空搜索"
            @click="clearDirectoryKeyword(directory.id, $event)"
          >×</button>
        </div>

        <div v-if="filteredSources(directory).length" class="data-directory-sources">
          <section v-for="source in filteredSources(directory)" :key="source.id" class="data-source" :data-source-id="source.id">
            <header class="data-source-head">
              <button
                type="button"
                class="data-source-toggle"
                :aria-expanded="isSourceExpanded(directory.id, source.id)"
                @click="toggleSource(directory.id, source.id)"
              >
                <span class="directory-chevron" aria-hidden="true">›</span>
                <b :title="source.name">{{ source.name }}</b>
                <span>{{ filteredDatasets(directory.id, source).length }} 项授权</span>
              </button>
              <button
                type="button"
                :class="['source-search-trigger', { active: isSourceSearchVisible(directory.id, source.id) }]"
                :aria-label="isSourceSearchVisible(directory.id, source.id) ? `关闭${source.name}下的授权项搜索` : `搜索${source.name}下的授权项`"
                :aria-expanded="isSourceSearchVisible(directory.id, source.id) && isSourceExpanded(directory.id, source.id)"
                :title="isSourceSearchVisible(directory.id, source.id) ? '关闭搜索' : '搜索当前数据源的授权项'"
                @click="toggleSourceSearch(directory.id, source.id, $event)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
              </button>
            </header>
            <div v-if="isSourceExpanded(directory.id, source.id)" class="data-source-content">
              <div v-if="isSourceSearchVisible(directory.id, source.id)" class="source-search-box">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <input
                  :value="sourceKeyword(directory.id, source.id)"
                  placeholder="搜索授权项名称"
                  :aria-label="`搜索${source.name}下的授权项`"
                  @input="updateSourceKeyword(directory.id, source.id, $event)"
                  @keydown.enter.prevent
                  @keydown.esc.stop.prevent="closeSourceSearch(directory.id, source.id, $event)"
                >
                <button
                  v-if="sourceKeyword(directory.id, source.id)"
                  type="button"
                  class="source-search-clear"
                  :aria-label="`清空${source.name}搜索关键词`"
                  title="清空搜索"
                  @click="clearSourceKeyword(directory.id, source.id, $event)"
                >×</button>
              </div>
              <div v-if="filteredDatasets(directory.id, source).length" class="data-directory-datasets">
                <label v-for="dataset in filteredDatasets(directory.id, source)" :key="dataset.id" class="data-dataset-item" :data-permission-id="dataset.id">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(dataset.id)"
                    :disabled="disabled || disabledIds.includes(dataset.id)"
                    @change="$emit('toggle', dataset.id)"
                  >
                  <span>{{ dataset.name }}</span>
                  <em v-if="sourceLabels[dataset.id]" class="dataset-source-badge">{{ sourceLabels[dataset.id] }}</em>
                </label>
              </div>
              <div v-else class="directory-empty" role="status">暂无匹配的授权项</div>
            </div>
          </section>
        </div>
        <div v-else class="directory-empty" role="status">
          {{ directoryKeyword(directory.id) ? '暂无匹配的数据源或授权项' : '该一级目录暂无数据权限' }}
        </div>
      </div>
    </section>

    <div v-if="!directories.length" class="directory-list-empty">
      <b>暂无数据权限</b>
      <p>当前没有可展示的数据权限。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'

export interface DataPermissionDataset {
  id: string
  name: string
  description?: string
  scope?: string
}

export interface DataPermissionSource {
  id: string
  name: string
  datasets: DataPermissionDataset[]
}

export interface DataPermissionDirectory {
  id: string
  name: string
  sources: DataPermissionSource[]
}

const props = withDefaults(defineProps<{
  directories: DataPermissionDirectory[]
  selectedIds?: string[]
  disabledIds?: string[]
  sourceLabels?: Record<string, string>
  disabled?: boolean
  defaultExpanded?: boolean
}>(), {
  selectedIds: () => [],
  disabledIds: () => [],
  sourceLabels: () => ({}),
  disabled: false,
  defaultExpanded: true
})

defineEmits<{ toggle: [id: string] }>()

const root = ref<HTMLElement | null>(null)
const expandedDirectories = reactive<Record<string, boolean>>({})
const searchVisible = reactive<Record<string, boolean>>({})
const searchKeywords = reactive<Record<string, string>>({})

watch(() => props.directories.map((directory) => directory.id), (ids) => {
  ids.forEach((id) => {
    if (!(id in expandedDirectories)) expandedDirectories[id] = props.defaultExpanded
  })
}, { immediate: true })

const expandedSources = reactive<Record<string, boolean>>({})
const sourceSearchVisible = reactive<Record<string, boolean>>({})
const sourceSearchKeywords = reactive<Record<string, string>>({})
const sourceKey = (directoryId: string, sourceId: string) => JSON.stringify([directoryId, sourceId])
const isSourceSearchVisible = (directoryId: string, sourceId: string) => !!sourceSearchVisible[sourceKey(directoryId, sourceId)]
const sourceKeyword = (directoryId: string, sourceId: string) => sourceSearchKeywords[sourceKey(directoryId, sourceId)] || ''
const isExpanded = (id: string) => !!expandedDirectories[id]
const isSearchVisible = (id: string) => !!searchVisible[id]
const directoryKeyword = (id: string) => searchKeywords[id] || ''

function toggleDirectory(id: string) {
  expandedDirectories[id] = !isExpanded(id)
}

// 搜索使用独立展开状态，关闭后恢复原来的折叠状态，不改动权限选择。
function sourceStateKey(directoryId: string, sourceId: string) {
  return JSON.stringify([directoryId, sourceId, directoryKeyword(directoryId).trim().toLowerCase(), isSourceSearchVisible(directoryId, sourceId), sourceKeyword(directoryId, sourceId).trim().toLowerCase()])
}

function isSourceExpanded(directoryId: string, sourceId: string) {
  return expandedSources[sourceStateKey(directoryId, sourceId)] ?? ((directoryKeyword(directoryId).trim() || isSourceSearchVisible(directoryId, sourceId)) ? true : props.defaultExpanded)
}

function toggleSource(directoryId: string, sourceId: string) {
  expandedSources[sourceStateKey(directoryId, sourceId)] = !isSourceExpanded(directoryId, sourceId)
}

function sourceSection(event: Event) {
  return (event.currentTarget as HTMLElement | null)?.closest<HTMLElement>('.data-source')
}

async function toggleSourceSearch(directoryId: string, sourceId: string, event: MouseEvent) {
  if (isSourceSearchVisible(directoryId, sourceId)) {
    closeSourceSearch(directoryId, sourceId, event)
    return
  }
  const section = sourceSection(event)
  sourceSearchVisible[sourceKey(directoryId, sourceId)] = true
  expandedSources[sourceStateKey(directoryId, sourceId)] = true
  await nextTick()
  section?.querySelector<HTMLInputElement>('.source-search-box input')?.focus()
}

function closeSourceSearch(directoryId: string, sourceId: string, event: Event) {
  sourceSearchVisible[sourceKey(directoryId, sourceId)] = false
  sourceSearchKeywords[sourceKey(directoryId, sourceId)] = ''
  sourceSection(event)?.querySelector<HTMLButtonElement>('.source-search-trigger')?.focus()
}

function clearSourceKeyword(directoryId: string, sourceId: string, event: MouseEvent) {
  sourceSearchKeywords[sourceKey(directoryId, sourceId)] = ''
  sourceSection(event)?.querySelector<HTMLInputElement>('.source-search-box input')?.focus()
}

function updateSourceKeyword(directoryId: string, sourceId: string, event: Event) {
  sourceSearchKeywords[sourceKey(directoryId, sourceId)] = (event.target as HTMLInputElement).value
}

function filteredDatasets(directoryId: string, source: DataPermissionSource) {
  const keyword = sourceKeyword(directoryId, source.id).trim().toLowerCase()
  return keyword ? source.datasets.filter((dataset) => dataset.name.toLowerCase().includes(keyword)) : source.datasets
}

async function toggleDirectorySearch(id: string, event: MouseEvent) {
  const section = (event.currentTarget as HTMLElement | null)?.closest<HTMLElement>('.data-directory')
  if (isSearchVisible(id)) {
    closeDirectorySearch(id)
    return
  }
  expandedDirectories[id] = true
  searchVisible[id] = true
  await nextTick()
  section?.querySelector<HTMLInputElement>('.directory-search-box input')?.focus()
}

function closeDirectorySearch(id: string) {
  searchVisible[id] = false
  searchKeywords[id] = ''
}

function clearDirectoryKeyword(id: string, event: MouseEvent) {
  searchKeywords[id] = ''
  const section = (event.currentTarget as HTMLElement | null)?.closest<HTMLElement>('.data-directory')
  section?.querySelector<HTMLInputElement>('.directory-search-box input')?.focus()
}

function updateDirectoryKeyword(id: string, event: Event) {
  searchKeywords[id] = (event.target as HTMLInputElement).value
}

function filteredSources(directory: DataPermissionDirectory) {
  const keyword = directoryKeyword(directory.id).trim().toLowerCase()
  if (!keyword) return directory.sources
  return directory.sources.map((source) => ({
    ...source,
    datasets: source.name.toLowerCase().includes(keyword)
      ? source.datasets
      : source.datasets.filter((dataset) => dataset.name.toLowerCase().includes(keyword))
  })).filter((source) => source.datasets.length)
}
</script>

<style scoped>
.data-directory-list { display: grid; gap: 8px; min-width: 0; }
.data-directory { overflow: hidden; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-surface); }
.data-directory-head { display: grid; grid-template-columns: minmax(0, 1fr) 32px; align-items: center; min-height: 40px; background: var(--color-bg-subtle); }
.data-directory-toggle { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: 40px; border: 0; padding: 0 4px 0 12px; background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
.data-directory-toggle:hover { background: var(--color-bg-subtle); }
.data-directory-toggle:focus-visible, :is(.directory-search-trigger, .source-search-trigger):focus-visible, :is(.directory-search-clear, .source-search-clear):focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
.directory-chevron { flex: 0 0 auto; color: var(--color-text-tertiary); font-size: 16px; line-height: 1; transform: rotate(0); transition: transform .16s ease; }
.data-directory-toggle[aria-expanded='true'] .directory-chevron { transform: rotate(90deg); }
.data-directory-toggle b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.data-directory-toggle span:last-child { flex: 0 0 auto; margin-left: auto; color: var(--color-text-tertiary); font-size: 12px; font-weight: 600; }
:is(.directory-search-trigger, .source-search-trigger) { display: grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: var(--radius-md); padding: 0; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
:is(.directory-search-trigger, .source-search-trigger):hover, :is(.directory-search-trigger, .source-search-trigger).active { background: var(--color-primary-subtle); color: var(--color-primary); }
:is(.directory-search-trigger, .source-search-trigger) svg, :is(.directory-search-box, .source-search-box) > svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.8; }
.data-directory-sources { display: grid; gap: 8px; min-width: 0; }
.data-source { min-width: 0; }
.data-source-head { display: grid; grid-template-columns: minmax(0, 1fr) 32px; align-items: center; }
.data-source-content { display: grid; gap: 8px; }
.data-source-toggle { display: flex; align-items: center; gap: 8px; width: 100%; min-width: 0; min-height: var(--control-height-md); border: 0; border-radius: var(--radius-md); padding: 4px 8px; background: transparent; color: var(--text); text-align: left; cursor: pointer; }
.data-source-toggle:hover { background: var(--primary-light); }
.data-source-toggle:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.data-source-toggle[aria-expanded='true'] .directory-chevron { transform: rotate(90deg); }
.data-source-toggle b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-sm); }
.data-source-toggle > span:last-child { flex: 0 0 auto; margin-left: auto; color: var(--text-tertiary); font-size: 12px; }
.data-source > .data-source-content { margin-left: 16px; border-left: 1px solid var(--border-light); padding-left: 4px; }
.data-dataset-item:has(input:disabled) { cursor: default; }
.data-directory-body { display: grid; gap: 8px; border-top: 1px solid var(--color-border-subtle); padding: 12px; }
:is(.directory-search-box, .source-search-box) { display: grid; grid-template-columns: 18px minmax(0, 1fr) 28px; align-items: center; min-height: var(--control-height-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0 4px 0 12px; background: var(--color-surface); color: var(--color-text-tertiary); }
:is(.directory-search-box, .source-search-box):focus-within { border-color: var(--color-primary-border); box-shadow: var(--focus-ring); }
.data-directory-list .data-directory :is(.directory-search-box, .source-search-box) input { min-width: 0; height: 32px; border: 0; outline: 0; box-shadow: none; padding: 0 8px; background: transparent; color: var(--color-text); font: inherit; font-size: 13px; }
:is(.directory-search-clear, .source-search-clear) { width: 26px; height: 26px; border: 0; border-radius: var(--radius-md); padding: 0; background: transparent; color: var(--color-text-tertiary); font-size: 18px; line-height: 1; cursor: pointer; }
:is(.directory-search-clear, .source-search-clear):hover { background: var(--color-bg-muted); color: var(--color-text); }
.data-directory-datasets { display: grid; gap: 4px; }
.data-dataset-item { display: flex; align-items: center; gap: 8px; min-width: 0; min-height: var(--control-height-md); border-radius: var(--radius-md); padding: 4px 8px; color: var(--color-text-secondary); font-size: 13px; cursor: pointer; }
.data-dataset-item:hover { background: var(--color-bg-subtle); }
.data-dataset-item input { flex: 0 0 auto; width: 16px; height: 16px; accent-color: var(--color-primary); }
.data-dataset-item > span { min-width: 0; overflow-wrap: anywhere; }
.dataset-source-badge { flex: 0 0 auto; margin-left: auto; border-radius: 9999px; padding: 4px 8px; background: var(--color-bg-muted); color: var(--color-text-secondary); font-size: 12px; font-style: normal; font-weight: 700; }
.directory-empty { border: 1px dashed var(--color-border); border-radius: var(--radius-md); padding: 16px; color: var(--color-text-tertiary); text-align: center; font-size: 12px; }
.directory-list-empty { border: 1px dashed var(--color-border); border-radius: var(--radius-md); padding: 24px; text-align: center; }
.directory-list-empty p { margin: 8px 0 0; color: var(--color-text-tertiary); font-size: 12px; }
@media (max-width: 520px) {
  .data-directory-toggle span:last-child { display: none; }
  .data-directory-body { padding: 8px; }
  .dataset-source-badge { padding-inline: 8px; }
}
/* The composite search owns its focus ring; override legacy standalone-input selectors locally. */
.data-directory-list .data-directory :is(.directory-search-box, .source-search-box) input:focus { border: 0; outline: none; box-shadow: none; }
</style>
