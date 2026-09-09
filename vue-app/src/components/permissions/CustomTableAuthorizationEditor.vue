<template>
  <div class="custom-table-auth" data-testid="custom-table-authorization-editor">
    <header class="editor-head">
      <div><b>{{ title }}</b><small>选择数据集后配置行权限和列权限；仅当行、列同时命中时可访问。</small></div>
      <button v-if="!readonly" type="button" class="outline-btn" :disabled="disabled" @click="openManagePicker">编辑</button>
    </header>

    <div v-if="rules.length" class="rule-list">
      <article v-for="rule in rules" :key="rule.id" class="rule-card" :data-table-id="rule.tableId">
        <header class="rule-card-head">
          <div><b>{{ tableFor(rule)?.name || rule.tableName }}</b><small>{{ tableFor(rule)?.description }}</small></div>
          <div><span class="logic-badge">行 与 列</span><button v-if="!readonly" type="button" class="link-btn" :disabled="disabled" @click="openEditPicker(rule)">编辑权限</button><button v-if="!readonly" type="button" class="link-btn danger" :disabled="disabled" @click="removeTable(rule.id)">删除数据集</button></div>
        </header>
        <div class="summary-grid">
          <section><span>行权限（{{ rule.rowFieldIds.length }}）</span><p>{{ selectedFieldNames(rule, 'rows') || '未配置' }}</p></section>
          <section><span>列权限（{{ rule.columnFieldIds.length }}）</span><p>{{ selectedFieldNames(rule, 'columns') || '未配置' }}</p></section>
        </div>
        <p v-if="!isRuleComplete(rule)" class="error-text">{{ ruleHint(rule) }}</p>
        <details class="matrix-preview">
          <summary><b>授权结果预览</b><span>仅行与列同时命中时可访问</span></summary>
          <div class="matrix-scroll"><table><thead><tr><th>行 \ 列</th><th v-for="column in tableFor(rule)?.columns || []" :key="column.id" :class="{ selectedAxis: rule.columnFieldIds.includes(column.id) }">{{ column.name }}</th></tr></thead><tbody><tr v-for="row in tableFor(rule)?.rows || []" :key="row.id"><th :class="{ selectedAxis: rule.rowFieldIds.includes(row.id) }">{{ row.name }}</th><td v-for="column in tableFor(rule)?.columns || []" :key="column.id" :class="{ granted: cellGranted(rule, row.id, column.id) }" :data-row-id="row.id" :data-column-id="column.id" :data-granted="cellGranted(rule, row.id, column.id)">{{ cellGranted(rule, row.id, column.id) ? '可访问' : '—' }}</td></tr></tbody></table></div>
        </details>
      </article>
    </div>
    <div v-else class="empty-state"><b>还没有自定义授权</b><p>{{ readonly ? '当前没有配置二维数据表的行列访问范围。' : '点击“编辑”统一选择数据集；新选择的数据集默认拥有全部行、列权限。' }}</p></div>

    <Teleport to="body">
      <div v-if="pickerVisible" class="picker-overlay" @click.self="closePicker" @keydown.esc.stop.prevent="handlePickerEscape">
        <section ref="dialog" v-permission-dialog-footer class="picker-dialog" role="dialog" aria-modal="true" :aria-label="pickerTitle" @keydown.tab="trapFocus">
          <header class="picker-head"><div><h3>{{ pickerTitle }}</h3><p>{{ pickerMode === 'manage' ? '统一维护全部数据集；勾选后默认全选全部行列，取消勾选会从本次授权中移除。' : '调整当前数据集的行权限和列权限。' }}</p></div><button type="button" class="close-btn" aria-label="关闭自定义授权弹层" @click="closePicker">×</button></header>
          <div class="picker-layout">
            <aside class="catalog-panel">
              <div data-testid="dataset-search-filter" class="catalog-filter-bar" :class="{ active: tagFilterOpen }">
                <label class="search-box"><span class="sr-only">搜索数据集名称、说明或标签</span><input ref="searchInput" v-model.trim="searchKeyword" type="search" aria-label="搜索数据集名称、说明或标签" placeholder="搜索名称、说明或标签"></label>
                <div v-if="pickerMode === 'manage'" ref="tagFilterControl" class="tag-multiselect">
                  <button type="button" data-testid="dataset-tag-filter-trigger" class="tag-select-trigger" :class="{ active: tagFilterOpen || selectedTags.length }" role="combobox" aria-haspopup="listbox" aria-controls="custom-auth-tag-options" :aria-expanded="tagFilterOpen" :aria-label="selectedTags.length ? `标签筛选，已选 ${selectedTags.length} 个` : '标签筛选'" :title="selectedTags.length ? `已选标签：${selectedTags.join('、')}` : '按标签筛选数据集'" @click="tagFilterOpen = !tagFilterOpen">
                    <span class="tag-select-label">标签筛选</span><small v-if="selectedTags.length" class="tag-select-count">{{ selectedTags.length }}</small><span class="tag-select-chevron" aria-hidden="true">⌄</span>
                  </button>
                  <div v-if="tagFilterOpen" class="tag-select-dropdown">
                    <header><b>标签筛选</b><button type="button" :disabled="!selectedTags.length" @click="clearTagFilters">清空</button></header>
                    <div v-if="allTags.length" id="custom-auth-tag-options" class="tag-option-list" role="listbox" aria-multiselectable="true"><label v-for="tag in allTags" :key="tag" role="option" :aria-selected="selectedTags.includes(tag)"><input type="checkbox" :checked="selectedTags.includes(tag)" @change="toggleTagFilter(tag)"><span>{{ tag }}</span></label></div>
                    <p v-else>暂无可筛选标签</p>
                  </div>
                </div>
              </div>
              <div v-if="pickerMode === 'manage'" class="catalog-tools"><span>已选 {{ draftRules.length }} 个</span><div><button type="button" :disabled="!selectableFilteredTables.length" @click="selectFilteredTables">全选当前结果</button><button type="button" :disabled="!draftRules.length" @click="clearDraftSelection">清空</button></div></div>
              <div v-if="filteredPickerTables.length" class="dataset-list">
                <article v-for="table in filteredPickerTables" :key="table.id" :class="['dataset-item', { active: activeTable?.id === table.id, selected: isDraftTableSelected(table.id) }]">
                  <label class="dataset-checkbox"><input type="checkbox" :checked="isDraftTableSelected(table.id)" :disabled="pickerMode === 'edit'" :aria-label="`选择${table.name}`" @change="toggleDraftTable(table.id)"></label>
                  <button type="button" class="dataset-info" @click="viewDataset(table.id)"><b>{{ table.name }}</b><small>{{ table.description }}</small><span><em v-for="tag in table.tags" :key="tag">{{ tag }}</em></span></button>
                  <small class="dataset-state">{{ isDraftTableSelected(table.id) ? '已选择' : '未选择' }}</small>
                </article>
              </div>
              <div v-else class="empty-search"><b>未找到匹配的数据集</b><p>请尝试其他名称、标签或关键词。</p></div>
            </aside>

            <section class="workspace">
              <nav v-if="pickerMode === 'manage'" class="workspace-tabs"><button type="button" :class="{ active: workspaceMode === 'single' }" @click="workspaceMode = 'single'">逐表配置</button><button type="button" :class="{ active: workspaceMode === 'batch' }" :disabled="draftRules.length < 2" @click="openBatchWorkspace">批量配置</button></nav>

              <aside v-if="workspaceMode === 'batch'" class="config-panel batch-panel" data-testid="custom-auth-batch-panel">
                <header class="config-head"><div class="dataset-title"><span>批量配置</span><h4>应用到已选数据集</h4><p>以下仅展示所有已选数据集共同包含的字段，选择后将统一应用。</p></div><em>{{ draftRules.length }} 个数据集</em></header>
                <div class="logic-note"><b>固定运算关系：与（AND）</b><span>行权限和列权限必须同时命中。</span></div>
                <section class="axis-block"><header><div><b>批量行权限</b><small>已选择 {{ batchSelection.rowFieldIds.length }} 项 · 仅显示交集</small></div><div><button type="button" @click="setBatchAxis('rowFieldIds', true)">全选</button><button type="button" @click="setBatchAxis('rowFieldIds', false)">清空</button></div></header><div v-if="batchRowDimensions.length" class="dimension-scroll"><section v-for="dimension in batchRowDimensions" :key="dimension.id" class="dimension-group"><b>{{ dimension.name }}</b><div class="options"><label v-for="row in dimension.values" :key="row.id" :class="{ selected: batchSelection.rowFieldIds.includes(row.id) }"><input type="checkbox" :checked="batchSelection.rowFieldIds.includes(row.id)" @change="toggleBatchField('rowFieldIds', row.id)">{{ row.name }}</label></div></section></div><p v-else class="batch-empty">当前已选数据集没有共同的行权限字段，请调整数据集。</p></section>
                <section class="axis-block"><header><div><b>批量列权限</b><small>已选择 {{ batchSelection.columnFieldIds.length }} 项 · 仅显示交集</small></div><div><button type="button" @click="setBatchAxis('columnFieldIds', true)">全选</button><button type="button" @click="setBatchAxis('columnFieldIds', false)">清空</button></div></header><div v-if="batchColumns.length" class="options column-options"><label v-for="column in batchColumns" :key="column.id" :class="{ selected: batchSelection.columnFieldIds.includes(column.id) }"><input type="checkbox" :checked="batchSelection.columnFieldIds.includes(column.id)" @change="toggleBatchField('columnFieldIds', column.id)">{{ column.name }}</label></div><p v-else class="batch-empty">当前已选数据集没有共同的列权限字段，请调整数据集。</p></section>
                <button type="button" class="primary-btn batch-apply" :disabled="!batchSelectionComplete || batchMismatchItems.length > 0" :title="batchMismatchItems.length ? '存在字段不匹配的数据集，请先调整。' : ''" @click="applyBatchSelection">应用到已选数据集</button>
                <div v-if="batchMismatchItems.length" id="custom-auth-batch-feedback" class="batch-error" role="alert" data-testid="custom-auth-batch-error"><b>存在 {{ batchMismatchItems.length }} 个字段不匹配的数据集，请调整字段或取消选择对应数据集：</b><ul><li v-for="item in batchMismatchItems" :key="item.tableId">{{ item.tableName }}（{{ item.reason }}）</li></ul></div>
                <div v-else-if="batchResult" class="batch-result" role="status" data-testid="custom-auth-batch-result"><b>已应用 {{ batchResult.appliedTableIds.length }} 个数据集</b><p>所有已选数据集均已成功应用，可以继续保存。</p></div>
              </aside>

              <aside v-else-if="displayRule && activeTable" :class="['config-panel', { 'preview-panel': !activeRule }]" :data-active-table-id="activeRule?.tableId" :data-preview-table-id="activeRule ? undefined : activeTable.id">
                <header class="config-head dataset-config-head">
                  <div class="dataset-title"><span>逐表配置</span><h4>{{ activeTable.name }}</h4><p>{{ activeTable.description }}</p></div>
                  <div class="dataset-tag-maintenance" :class="{ editing: isTagEditing(activeTable.id) }" data-testid="dataset-tag-maintenance">
                    <div class="tag-summary"><span>数据集标签</span><div v-if="!isTagEditing(activeTable.id)" class="tag-chips"><em v-for="tag in activeTable.tags" :key="tag">{{ tag }}</em><small v-if="!activeTable.tags?.length">未设置标签</small></div></div>
                    <button v-if="tagMaintenanceEnabled && !isTagEditing(activeTable.id)" type="button" class="tag-edit-btn" @click="startTagEditing(activeTable)">编辑标签</button>
                    <small v-if="tagNoticeTableId === activeTable.id" class="tag-save-notice" role="status">标签已保存</small>
                    <div v-if="isTagEditing(activeTable.id)" class="tag-editor">
                      <div class="tag-editor-selected"><span v-for="tag in tagDraft" :key="tag">{{ tag }}<button type="button" :aria-label="`移除标签${tag}`" @click="removeTagDraft(tag)">×</button></span><small v-if="!tagDraft.length">暂未设置标签</small></div>
                      <div class="tag-input-row"><input ref="tagInput" v-model.trim="tagInputValue" type="text" :maxlength="CUSTOM_TABLE_TAG_MAX_LENGTH" placeholder="输入标签名称" @keydown.enter.prevent="addTagDraft()"><button type="button" :disabled="tagDraft.length >= CUSTOM_TABLE_TAG_LIMIT" @click="addTagDraft()">添加</button></div>
                      <div v-if="tagSuggestions.length" class="tag-suggestions"><small>已有标签</small><button v-for="tag in tagSuggestions" :key="tag" type="button" @click="addTagDraft(tag)">{{ tag }}</button></div>
                      <p class="tag-helper">最多 {{ CUSTOM_TABLE_TAG_LIMIT }} 个，每个不超过 {{ CUSTOM_TABLE_TAG_MAX_LENGTH }} 个字符；保存后只影响检索和筛选。</p>
                      <p v-if="tagEditorError" class="tag-editor-error" role="alert">{{ tagEditorError }}</p>
                      <div class="tag-editor-actions"><button type="button" class="secondary-btn compact" @click="cancelTagEditing">取消</button><button type="button" class="primary-btn compact" @click="saveTagChanges(activeTable)">保存标签</button></div>
                    </div>
                  </div>
                  <em :class="{ complete: activeRule && isRuleComplete(activeRule) }">{{ activeRule && isRuleComplete(activeRule) ? '配置完成' : '待完善' }}</em>
                </header>
                <div class="logic-note"><b>固定运算关系：与（AND）</b><span>仅当所选行和所选列同时命中时，才可访问对应单元格。</span></div>
                <div class="all-actions"><span>当前数据集</span><button type="button" @click="setAllActiveFields(true)">全选</button><button type="button" @click="setAllActiveFields(false)">清空</button></div>
                <div class="axis-grid">
                  <section class="axis-block"><header><div><b>添加行权限</b><small>已选择 {{ displayRule.rowFieldIds.length }} 项</small></div></header><div class="dimension-scroll"><section v-for="dimension in activeTable.rowDimensions" :key="dimension.id" class="dimension-group"><header><b>{{ dimension.name }}</b><span><button type="button" @click="setDimensionFields(dimension, true)">全选</button><button type="button" @click="setDimensionFields(dimension, false)">清空</button></span></header><div class="options"><label v-for="row in dimension.values" :key="row.id" :class="{ selected: displayRule.rowFieldIds.includes(row.id) }"><input type="checkbox" :checked="displayRule.rowFieldIds.includes(row.id)" @change="toggleDraftField('rowFieldIds', row.id)">{{ row.name }}</label></div></section></div></section>
                  <section class="axis-block"><header><div><b>添加列权限</b><small>已选择 {{ displayRule.columnFieldIds.length }} 项</small></div><div><button type="button" @click="setAxisFields('columnFieldIds', true)">全选</button><button type="button" @click="setAxisFields('columnFieldIds', false)">清空</button></div></header><div class="options column-options"><label v-for="column in activeTable.columns" :key="column.id" :class="{ selected: displayRule.columnFieldIds.includes(column.id) }"><input type="checkbox" :checked="displayRule.columnFieldIds.includes(column.id)" @change="toggleDraftField('columnFieldIds', column.id)">{{ column.name }}</label></div></section>
                </div>
                <p v-if="activeRule && draftRuleError(activeRule)" class="error-text">{{ draftRuleError(activeRule) }}</p>
                <details class="matrix-preview drawer-matrix" open><summary><b>授权结果预览</b><span>仅行与列同时命中时可访问</span></summary><div class="matrix-scroll"><table><thead><tr><th>行 \ 列</th><th v-for="column in activeTable.columns" :key="column.id" :class="{ selectedAxis: displayRule.columnFieldIds.includes(column.id) }">{{ column.name }}</th></tr></thead><tbody><tr v-for="row in activeTable.rows" :key="row.id"><th :class="{ selectedAxis: displayRule.rowFieldIds.includes(row.id) }">{{ row.name }}</th><td v-for="column in activeTable.columns" :key="column.id" :class="{ granted: cellGranted(displayRule, row.id, column.id) }" :data-row-id="row.id" :data-column-id="column.id" :data-granted="cellGranted(displayRule, row.id, column.id)">{{ cellGranted(displayRule, row.id, column.id) ? '可访问' : '—' }}</td></tr></tbody></table></div></details>
              </aside>              <aside v-else class="config-panel empty-config"><b>请选择需要查看的数据集</b><p>点击数据集名称可查看字段；勾选复选框或选择任一权限都会加入本次授权。</p></aside>
            </section>
          </div>
          <footer class="picker-actions"><span v-if="pickerError" role="alert">{{ pickerError }}</span><button type="button" class="secondary-btn" @click="closePicker">取消</button><button type="button" class="primary-btn" :disabled="batchSubmissionBlocked" :title="batchSubmissionHint" @click="confirmPicker">{{ pickerMode === 'manage' ? '保存自定义授权' : '保存权限配置' }}</button></footer>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { vPermissionDialogFooter } from './permissionDialogFooter'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CUSTOM_TABLE_CATALOG, CUSTOM_TABLE_TAG_LIMIT, CUSTOM_TABLE_TAG_MAX_LENGTH, applyCustomTableBatchSelection, createCustomTableRule, customTableById, intersectCustomTableFields, isCustomTableCellGranted, normalizeCustomDataRules, setCustomTableTags, subscribeCustomTableCatalog, validateCustomTableRules, validateCustomTableTags } from './customTableAuthorization.js'

const props = defineProps({ modelValue: { type: Array, default: () => [] }, title: { type: String, default: '自定义授权' }, readonly: { type: Boolean, default: false }, disabled: { type: Boolean, default: false }, canManageDatasetTags: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])
const pickerVisible = ref(false)
const pickerMode = ref('manage')
const workspaceMode = ref('single')
const searchKeyword = ref('')
const selectedTags = ref([])
const tagFilterOpen = ref(false)
const draftRules = ref([])
const activeRuleId = ref('')
const viewedTableId = ref('')
const pickerError = ref('')
const batchSelection = ref({ rowFieldIds: [], columnFieldIds: [] })
const batchResult = ref(null)
const dialog = ref(null)
const searchInput = ref(null)
const tagInput = ref(null)
const tagFilterControl = ref(null)
const catalogRevision = ref(0)
const tagEditorVisible = ref(false)
const tagEditingTableId = ref('')
const tagDraft = ref([])
const tagInputValue = ref('')
const tagEditorError = ref('')
const tagNoticeTableId = ref('')
const previewRuleDrafts = ref({})
const previewTouchedTableIds = ref([])
let returnFocus = null
let unsubscribeCatalog = () => {}

const rules = computed(() => normalizeCustomDataRules(props.modelValue))
const pickerTitle = computed(() => pickerMode.value === 'manage' ? '编辑自定义授权数据集' : '编辑数据集权限')
const catalogTables = computed(() => { catalogRevision.value; return [...CUSTOM_TABLE_CATALOG] })
const allTags = computed(() => [...new Set(catalogTables.value.flatMap((table) => table.tags || []))])
const tagMaintenanceEnabled = computed(() => props.canManageDatasetTags && !props.readonly && !props.disabled)
const tagSuggestions = computed(() => {
  const used = new Set(tagDraft.value.map((tag) => tag.toLocaleLowerCase()))
  const keyword = tagInputValue.value.trim().toLocaleLowerCase()
  return allTags.value.filter((tag) => !used.has(tag.toLocaleLowerCase()) && (!keyword || tag.toLocaleLowerCase().includes(keyword))).slice(0, 8)
})
const filteredPickerTables = computed(() => {
  const source = pickerMode.value === 'edit' ? catalogTables.value.filter((table) => draftRules.value.some((rule) => rule.tableId === table.id)) : catalogTables.value
  const keyword = searchKeyword.value.toLocaleLowerCase()
  return source.filter((table) => (!selectedTags.value.length || selectedTags.value.some((tag) => table.tags?.includes(tag))) && (!keyword || `${table.name} ${table.description} ${(table.tags || []).join(' ')}`.toLocaleLowerCase().includes(keyword)))
})
const selectableFilteredTables = computed(() => filteredPickerTables.value.filter((table) => !isDraftTableSelected(table.id)))
const activeRule = computed(() => draftRules.value.find((rule) => rule.id === activeRuleId.value) || null)
const activeTable = computed(() => { catalogRevision.value; return customTableById(activeRule.value?.tableId || viewedTableId.value) })
const previewRule = computed(() => {
  if (!activeTable.value || activeRule.value) return null
  return previewRuleDrafts.value[activeTable.value.id] || createCustomTableRule(activeTable.value.id, { selectAll: false })
})
const displayRule = computed(() => activeRule.value || previewRule.value)
const batchFieldIntersection = computed(() => intersectCustomTableFields(draftRules.value.map((rule) => rule.tableId)))
const batchRowDimensions = computed(() => batchFieldIntersection.value.rowDimensions)
const batchColumns = computed(() => batchFieldIntersection.value.columns)
const batchSelectionComplete = computed(() => Boolean(batchSelection.value.rowFieldIds.length && batchSelection.value.columnFieldIds.length))
const batchValidationPreview = computed(() => batchSelectionComplete.value
  ? applyCustomTableBatchSelection(draftRules.value, batchSelection.value)
  : { rules: draftRules.value, appliedTableIds: [], skipped: [] })
const batchMismatchItems = computed(() => batchValidationPreview.value.skipped)
const batchSubmissionBlocked = computed(() => {
  if (pickerMode.value !== 'manage' || workspaceMode.value !== 'batch') return false
  if (!batchSelectionComplete.value || batchMismatchItems.value.length) return true
  return !batchResult.value || batchResult.value.skipped.length > 0 || batchResult.value.appliedTableIds.length !== draftRules.value.length
})
const batchSubmissionHint = computed(() => {
  if (pickerMode.value !== 'manage' || workspaceMode.value !== 'batch') return ''
  if (!batchSelectionComplete.value) return '请至少选择一个批量行权限和一个批量列权限。'
  if (batchMismatchItems.value.length) return `存在 ${batchMismatchItems.value.length} 个字段不匹配的数据集，请调整字段或取消选择对应数据集。`
  if (!batchResult.value) return '请先点击“应用到已选数据集”完成批量配置。'
  return ''
})

watch(() => props.readonly || props.disabled, (locked) => { if (locked && pickerVisible.value) closePicker() })
watch(() => draftRules.value.map((rule) => rule.tableId).join('|'), () => { batchResult.value = null; pruneBatchSelectionToIntersection(); if (draftRules.value.length < 2 && workspaceMode.value === 'batch') workspaceMode.value = 'single' })
onMounted(() => { unsubscribeCatalog = subscribeCustomTableCatalog(() => { catalogRevision.value += 1 }); document.addEventListener('pointerdown', handleDocumentPointerdown); document.addEventListener('keydown', handleDocumentKeydown, true) })
onBeforeUnmount(() => { unsubscribeCatalog(); document.removeEventListener('pointerdown', handleDocumentPointerdown); document.removeEventListener('keydown', handleDocumentKeydown, true); returnFocus = null })

function cloneRule(rule) { return { ...rule, rowFieldIds: [...rule.rowFieldIds], columnFieldIds: [...rule.columnFieldIds] } }
function emitRules(nextRules) { emit('update:modelValue', normalizeCustomDataRules(nextRules)) }
function tableFor(rule) { return customTableById(rule.tableId) }
function openPicker(mode, nextRules, activeId = '') {
  if (props.readonly || props.disabled) return
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  pickerMode.value = mode
  workspaceMode.value = 'single'
  searchKeyword.value = ''
  selectedTags.value = []
  tagFilterOpen.value = false
  pickerError.value = ''
  batchResult.value = null
  batchSelection.value = { rowFieldIds: [], columnFieldIds: [] }
  previewRuleDrafts.value = {}
  previewTouchedTableIds.value = []
  draftRules.value = nextRules.map(cloneRule)
  activeRuleId.value = activeId || nextRules[0]?.id || ''
  viewedTableId.value = nextRules[0]?.tableId || ''
  pickerVisible.value = true
  nextTick(() => searchInput.value?.focus())
}
function openManagePicker() { openPicker('manage', rules.value, rules.value[0]?.id || '') }
function openEditPicker(rule) { openPicker('edit', [cloneRule(rule)], rule.id) }
function closePicker() {
  pickerVisible.value = false
  draftRules.value = []
  activeRuleId.value = ''
  viewedTableId.value = ''
  pickerError.value = ''
  batchResult.value = null
  previewRuleDrafts.value = {}
  previewTouchedTableIds.value = []
  resetTagEditor()
  const focusTarget = returnFocus
  returnFocus = null
  nextTick(() => focusTarget?.focus())
}

function draftRuleForTable(tableId) { return draftRules.value.find((rule) => rule.tableId === tableId) || null }
function previewDraftForTable(tableId) { return previewRuleDrafts.value[tableId] || null }
function isDraftTableSelected(tableId) { return Boolean(draftRuleForTable(tableId)) }
function clearPreviewDraft(tableId) {
  const { [tableId]: ignored, ...retained } = previewRuleDrafts.value
  void ignored
  previewRuleDrafts.value = retained
  previewTouchedTableIds.value = previewTouchedTableIds.value.filter((id) => id !== tableId)
}
function createSelectionRule(tableId) {
  const nextRule = createCustomTableRule(tableId)
  if (!nextRule) return null
  const previewDraft = previewDraftForTable(tableId)
  if (previewDraft && previewTouchedTableIds.value.includes(tableId)) {
    nextRule.rowFieldIds = [...previewDraft.rowFieldIds]
    nextRule.columnFieldIds = [...previewDraft.columnFieldIds]
  }
  clearPreviewDraft(tableId)
  return nextRule
}
function promotePreviewRule(tableId) {
  if (draftRuleForTable(tableId)) return
  const nextRule = createSelectionRule(tableId)
  if (!nextRule) return
  draftRules.value = [...draftRules.value, nextRule]
  activeRuleId.value = nextRule.id
  viewedTableId.value = tableId
  workspaceMode.value = 'single'
}
function viewDataset(tableId) { if (guardTagEditing(tableId)) return; tagNoticeTableId.value = ''; viewedTableId.value = tableId; activeRuleId.value = draftRuleForTable(tableId)?.id || ''; workspaceMode.value = 'single' }
function toggleDraftTable(tableId) {
  if (pickerMode.value !== 'manage' || guardTagEditing(tableId)) return
  const current = draftRuleForTable(tableId)
  pickerError.value = ''
  if (current) {
    draftRules.value = draftRules.value.filter((rule) => rule.id !== current.id)
    clearPreviewDraft(tableId)
    if (activeRuleId.value === current.id) activeRuleId.value = ''
    viewedTableId.value = tableId
    return
  }
  const nextRule = createSelectionRule(tableId)
  if (!nextRule) return
  draftRules.value = [...draftRules.value, nextRule]
  activeRuleId.value = nextRule.id
  viewedTableId.value = tableId
}
function selectFilteredTables() {
  if (guardTagEditing()) return
  const additions = selectableFilteredTables.value.filter((table) => !isDraftTableSelected(table.id)).map((table) => createSelectionRule(table.id)).filter(Boolean)
  if (!additions.length) return
  draftRules.value = [...draftRules.value, ...additions]
  activeRuleId.value = additions[0].id
  viewedTableId.value = additions[0].tableId
}
function clearDraftSelection() { if (guardTagEditing()) return; draftRules.value = []; previewRuleDrafts.value = {}; previewTouchedTableIds.value = []; activeRuleId.value = ''; batchResult.value = null }
function updateDisplayedRule(update) {
  if (!displayRule.value || !activeTable.value) return
  if (activeRule.value) draftRules.value = draftRules.value.map((rule) => rule.id === activeRule.value.id ? { ...rule, ...update, logic: 'AND' } : rule)
  else {
    const tableId = activeTable.value.id
    const nextPreviewRule = { ...displayRule.value, ...update, logic: 'AND' }
    previewRuleDrafts.value = { ...previewRuleDrafts.value, [tableId]: nextPreviewRule }
    if (!previewTouchedTableIds.value.includes(tableId)) previewTouchedTableIds.value = [...previewTouchedTableIds.value, tableId]
    if (nextPreviewRule.rowFieldIds.length || nextPreviewRule.columnFieldIds.length) promotePreviewRule(tableId)
  }
  pickerError.value = ''
  batchResult.value = null
}
function toggleDraftField(fieldName, fieldId) {
  const current = displayRule.value?.[fieldName] || []
  updateDisplayedRule({ [fieldName]: current.includes(fieldId) ? current.filter((id) => id !== fieldId) : [...current, fieldId] })
}
function setAxisFields(fieldName, selectAll) {
  if (!activeTable.value) return
  const options = fieldName === 'rowFieldIds' ? activeTable.value.rows : activeTable.value.columns
  updateDisplayedRule({ [fieldName]: selectAll ? options.map((item) => item.id) : [] })
}
function setAllActiveFields(selectAll) {
  if (!activeTable.value) return
  updateDisplayedRule({ rowFieldIds: selectAll ? activeTable.value.rows.map((item) => item.id) : [], columnFieldIds: selectAll ? activeTable.value.columns.map((item) => item.id) : [] })
}
function setDimensionFields(dimension, selectAll) {
  if (!displayRule.value) return
  const dimensionIds = new Set(dimension.values.map((item) => item.id))
  const retained = displayRule.value.rowFieldIds.filter((id) => !dimensionIds.has(id))
  updateDisplayedRule({ rowFieldIds: selectAll ? [...retained, ...dimensionIds] : retained })
}
function openBatchWorkspace() {
  if (guardTagEditing() || draftRules.value.length < 2) return
  workspaceMode.value = 'batch'
  if (!batchSelection.value.rowFieldIds.length && !batchSelection.value.columnFieldIds.length) batchSelection.value = { rowFieldIds: batchRowDimensions.value.flatMap((dimension) => dimension.values.map((item) => item.id)), columnFieldIds: batchColumns.value.map((item) => item.id) }
}
function pruneBatchSelectionToIntersection() {
  const rowIds = new Set(batchRowDimensions.value.flatMap((dimension) => dimension.values.map((item) => item.id)))
  const columnIds = new Set(batchColumns.value.map((item) => item.id))
  batchSelection.value = {
    rowFieldIds: batchSelection.value.rowFieldIds.filter((id) => rowIds.has(id)),
    columnFieldIds: batchSelection.value.columnFieldIds.filter((id) => columnIds.has(id))
  }
}
function toggleBatchField(fieldName, fieldId) {
  const current = batchSelection.value[fieldName]
  batchSelection.value = { ...batchSelection.value, [fieldName]: current.includes(fieldId) ? current.filter((id) => id !== fieldId) : [...current, fieldId] }
  batchResult.value = null
}
function setBatchAxis(fieldName, selectAll) {
  const ids = fieldName === 'rowFieldIds' ? batchRowDimensions.value.flatMap((dimension) => dimension.values.map((item) => item.id)) : batchColumns.value.map((item) => item.id)
  batchSelection.value = { ...batchSelection.value, [fieldName]: selectAll ? ids : [] }
  batchResult.value = null
}
function applyBatchSelection() {
  if (!batchSelectionComplete.value || batchMismatchItems.value.length) return
  const result = batchValidationPreview.value
  draftRules.value = result.rules.map(cloneRule)
  batchResult.value = result
  pickerError.value = ''
}
function isRuleComplete(rule) { return Boolean(rule.rowFieldIds.length && rule.columnFieldIds.length) }
function draftRuleError(rule) { return pickerError.value && !isRuleComplete(rule) ? ruleHint(rule) : '' }
function confirmPicker() {
  if (guardTagEditing()) { pickerError.value = '请先保存或取消正在编辑的数据集标签。'; return }
  if (batchSubmissionBlocked.value) { pickerError.value = batchSubmissionHint.value; return }

  const validationError = validateCustomTableRules(draftRules.value)
  if (validationError) {
    const incompleteRule = draftRules.value.find((rule) => !isRuleComplete(rule))
    if (incompleteRule) { activeRuleId.value = incompleteRule.id; viewedTableId.value = incompleteRule.tableId; workspaceMode.value = 'single' }
    pickerError.value = validationError
    return
  }
  if (pickerMode.value === 'edit') {
    const editedRule = draftRules.value[0]
    emitRules(rules.value.map((rule) => rule.id === editedRule.id ? editedRule : rule))
  } else emitRules(draftRules.value)
  closePicker()
}
function removeTable(ruleId) { if (!props.readonly && !props.disabled) emitRules(rules.value.filter((rule) => rule.id !== ruleId)) }
function selectedFieldNames(rule, axis) {
  const ids = axis === 'rows' ? rule.rowFieldIds : rule.columnFieldIds
  return (tableFor(rule)?.[axis] || []).filter((option) => ids.includes(option.id)).map((option) => option.name).join('、')
}
function cellGranted(rule, rowId, columnId) { return isCustomTableCellGranted(rule, rowId, columnId) }
function ruleHint(rule) {
  if (!rule.rowFieldIds.length && !rule.columnFieldIds.length) return '请至少选择一个行权限和一个列权限。'
  if (!rule.rowFieldIds.length) return '请至少选择一个行权限。'
  return '请至少选择一个列权限。'
}
function isTagEditing(tableId) { return tagEditorVisible.value && tagEditingTableId.value === tableId }
function resetTagEditor(clearNotice = true) {
  tagEditorVisible.value = false
  tagEditingTableId.value = ''
  tagDraft.value = []
  tagInputValue.value = ''
  tagEditorError.value = ''
  if (clearNotice) tagNoticeTableId.value = ''
}
function startTagEditing(table) {
  if (!tagMaintenanceEnabled.value || !table) return
  tagNoticeTableId.value = ''
  tagEditorVisible.value = true
  tagEditingTableId.value = table.id
  tagDraft.value = [...(table.tags || [])]
  tagInputValue.value = ''
  tagEditorError.value = ''
  nextTick(() => tagInput.value?.focus())
}
function cancelTagEditing() { resetTagEditor(false) }
function guardTagEditing(nextTableId = '') {
  if (!tagEditorVisible.value || (nextTableId && tagEditingTableId.value === nextTableId)) return false
  tagEditorError.value = '请先保存或取消当前标签编辑，再切换数据集或配置方式。'
  return true
}
function addTagDraft(candidate = tagInputValue.value) {
  const tag = String(candidate || '').trim()
  if (!tag) { tagEditorError.value = '请输入标签名称。'; return }
  const nextTags = [...tagDraft.value, tag]
  const validationError = validateCustomTableTags(nextTags)
  if (validationError) { tagEditorError.value = validationError; return }
  tagDraft.value = nextTags
  tagInputValue.value = ''
  tagEditorError.value = ''
  nextTick(() => tagInput.value?.focus())
}
function removeTagDraft(tag) {
  tagDraft.value = tagDraft.value.filter((item) => item !== tag)
  tagEditorError.value = ''
}
function saveTagChanges(table) {
  if (!table || !isTagEditing(table.id)) return
  const validationError = validateCustomTableTags(tagDraft.value)
  if (validationError) { tagEditorError.value = validationError; return }
  try {
    const savedTags = setCustomTableTags(table.id, tagDraft.value)
    selectedTags.value = selectedTags.value.filter((tag) => allTags.value.includes(tag))
    tagNoticeTableId.value = table.id
    resetTagEditor(false)
  } catch (error) {
    tagEditorError.value = error instanceof Error ? error.message : '标签保存失败，请稍后重试。'
  }
}
function toggleTagFilter(tag) {
  selectedTags.value = selectedTags.value.includes(tag) ? selectedTags.value.filter((item) => item !== tag) : [...selectedTags.value, tag]
}
function clearTagFilters() { selectedTags.value = [] }
function handleDocumentPointerdown(event) {
  if (tagFilterOpen.value && !tagFilterControl.value?.contains(event.target)) tagFilterOpen.value = false
}
function handleDocumentKeydown(event) {
  if (event.key !== 'Escape' || !pickerVisible.value || !tagFilterOpen.value) return
  event.preventDefault()
  event.stopPropagation()
  tagFilterOpen.value = false
}
function handlePickerEscape() {
  if (tagEditorVisible.value) cancelTagEditing()
  else if (tagFilterOpen.value) tagFilterOpen.value = false
  else closePicker()
}
function trapFocus(event) {
  const focusable = [...(dialog.value?.querySelectorAll('button:not(:disabled), input:not(:disabled), summary') || [])]
  if (!focusable.length) return
  const [first] = focusable
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
</script>

<style scoped>.custom-table-auth,.rule-list{display: grid;gap: 16px;min-width: 0}.editor-head,.rule-card-head,.config-head{display: flex;align-items: flex-start;justify-content: space-between;gap: 16px}.editor-head>div,.rule-card-head>div:first-child{display: grid;gap: 4px;min-width: 0}.editor-head b,.rule-card-head b{color: var(--color-text);font-size: 14px}.editor-head small,.rule-card-head small{color: var(--color-text-secondary);font-size: 12px;line-height: 1.55}.outline-btn{min-height: var(--control-height-md);border: 1px solid var(--color-primary-border);border-radius: var(--radius-md);padding: 0 16px;background: var(--color-surface);color: var(--color-primary);font: inherit;font-size: 13px;cursor: pointer}.outline-btn:disabled,.link-btn:disabled{border-color: var(--color-border);color: var(--color-text-tertiary);cursor: not-allowed}.rule-card{display: grid;gap: 16px;min-width: 0;border: 1px solid var(--color-border);border-radius: var(--radius-md);padding: 16px;background: var(--color-surface)}.rule-card-head>div:last-child{display: flex;align-items: center;gap: 12px}.logic-badge{border-radius: 9999px;padding: 4px 12px;background: var(--color-primary-subtle);color: var(--color-primary);font-size: 12px;font-weight: 700}.link-btn{border: 0;padding: 4px 0;background: transparent;color: var(--color-primary);font: inherit;font-size: 12px;cursor: pointer}.link-btn.danger{color: var(--color-danger)}.summary-grid{display: grid;grid-template-columns: repeat(2,minmax(0,1fr));gap: 12px}.summary-grid section{min-width: 0;border: 1px solid var(--color-border-subtle);border-radius: var(--radius-md);padding: 12px 12px;background: var(--color-bg-subtle)}.summary-grid span{color: var(--color-text-secondary);font-size: 12px}.summary-grid p{margin: 4px 0 0;overflow: hidden;color: var(--color-text-secondary);font-size: 12px;text-overflow: ellipsis;white-space: nowrap}.error-text{margin: 0;color: var(--color-danger);font-size: 12px}.matrix-preview{min-width: 0;border-top: 1px solid var(--color-border-subtle);padding-top: 12px}.matrix-preview summary{display: flex;justify-content: space-between;gap: 12px;color: var(--color-text-secondary);font-size: 12px;cursor: pointer}.matrix-preview summary span{color: var(--color-text-tertiary);font-size: 12px;font-weight: 400}.matrix-scroll{max-width: 100%;margin-top: 12px;overflow: auto;border: 1px solid var(--color-border-subtle);border-radius: var(--radius-md)}table{width: max-content;min-width: 100%;border-collapse: collapse;font-size: 12px}th,td{min-width: 88px;border-right: 1px solid var(--color-border-subtle);border-bottom: 1px solid var(--color-border-subtle);padding: 8px 12px;text-align: center;white-space: nowrap}th{background: var(--color-bg-subtle);color: var(--color-text-secondary)}tbody th{position: sticky;left: 0;z-index: 1;text-align: left}.selectedAxis{background: var(--color-primary-subtle);color: var(--color-primary)}td{color: var(--color-text-disabled)}td.granted{background: var(--color-success-subtle);color: var(--color-success);font-weight: 700}.empty-state,.empty-search{border: 1px dashed var(--color-border);border-radius: var(--radius-md);padding: 24px 20px;background: var(--color-bg-subtle);text-align: center}.empty-state p,.empty-search p{margin: 8px 0 0;color: var(--color-text-tertiary);font-size: 12px;line-height: 1.6}.picker-overlay{position: fixed;inset: 0;z-index: 2400;display: grid;place-items: center;overflow-y: auto;padding: 24px;background: color-mix(in srgb, var(--color-text) 45%, transparent);backdrop-filter: none}.picker-dialog{display: flex;box-sizing: border-box;width: min(1180px,100%);max-height: min(800px,calc(100vh - 48px));min-height: min(700px,calc(100vh - 48px));flex-direction: column;overflow: hidden;border: 1px solid var(--color-border);border-radius: var(--radius-lg);background: var(--color-surface);box-shadow: var(--shadow-popover)}.picker-head{display: flex;justify-content: space-between;gap: 16px;border-bottom: 1px solid var(--color-border-subtle);padding: 20px 24px 16px}.picker-head h3{margin: 0;color: var(--color-text);font-size: 20px}.picker-head p{margin: 8px 0 0;color: var(--color-text-secondary);font-size: 13px}.close-btn{width: 34px;height: var(--control-height-md);border: 1px solid var(--color-border);border-radius: var(--radius-md);background: var(--color-surface);color: var(--color-text-secondary);font-size: 20px;cursor: pointer}.picker-layout{display: grid;grid-template-columns: minmax(300px,350px) minmax(0,1fr);flex: 1;min-height: 0}.catalog-panel{display: flex;min-height: 0;flex-direction: column;border-right: 1px solid var(--color-border-subtle);padding: 16px;background: var(--color-bg-subtle)}.search-box input{box-sizing: border-box;width: 100%;min-height: var(--control-height-md);border: 1px solid var(--color-border);border-radius: var(--radius-md);padding: 0 12px;color: var(--color-text);font: inherit;font-size: 13px}.tag-multiselect{position: relative;margin-top: 12px}.tag-select-trigger{display: flex;box-sizing: border-box;width: 100%;min-height: var(--control-height-md);align-items: center;justify-content: space-between;gap: 8px;border: 1px solid var(--color-border);border-radius: var(--radius-md);padding: 4px 12px;background: var(--color-surface);color: var(--color-text-secondary);font: inherit;font-size: 12px;text-align: left;cursor: pointer}.tag-select-trigger.active,.tag-select-trigger:focus-visible{outline: 0;border-color: var(--color-primary);box-shadow: var(--focus-ring)}.tag-select-values{display: flex;min-width: 0;align-items: center;gap: 4px;overflow: hidden}.tag-select-values em,.tag-select-values small{flex: none;border-radius: 9999px;padding: 4px 8px;background: var(--color-primary-subtle);color: var(--color-primary);font-size: 12px;font-style: normal}.tag-select-placeholder{color: var(--color-text-tertiary)}.tag-select-chevron{flex: none;color: var(--color-text-tertiary);font-size: 14px}.tag-select-dropdown{position: absolute;z-index: 8;top: calc(100% + 6px);right: 0;left: 0;overflow: hidden;border: 1px solid var(--color-border);border-radius: var(--radius-md);background: var(--color-surface);box-shadow: var(--shadow-popover)}.tag-select-dropdown>header{display: flex;align-items: center;justify-content: space-between;min-height: var(--control-height-md);border-bottom: 1px solid var(--color-border-subtle);padding: 0 12px}.tag-select-dropdown>header b{color: var(--color-text-secondary);font-size: 12px}.tag-select-dropdown>header button{border: 0;padding: 4px;background: transparent;color: var(--color-primary);font: inherit;font-size: 12px;cursor: pointer}.tag-select-dropdown>header button:disabled{color: var(--color-text-disabled);cursor: not-allowed}.tag-option-list{display: grid;max-height: 184px;overflow-y: auto;padding: 8px}.tag-option-list label{display: flex;min-height: 32px;align-items: center;gap: 8px;border-radius: var(--radius-md);padding: 0 8px;color: var(--color-text-secondary);font-size: 12px;cursor: pointer}.tag-option-list label:hover,.tag-option-list label[aria-selected="true"]{background: var(--color-primary-subtle);color: var(--color-primary)}.tag-option-list input{width: 14px;height: 14px;margin: 0;accent-color: var(--color-primary)}.tag-select-dropdown>p{margin: 0;padding: 20px 12px;color: var(--color-text-tertiary);font-size: 12px;text-align: center}.options label{border: 1px solid var(--color-border);border-radius: 9999px;background: var(--color-surface);color: var(--color-text-secondary)}.options label.selected{border-color: var(--color-primary-border);background: var(--color-primary-subtle);color: var(--color-primary)}.catalog-tools,.all-actions{display: flex;align-items: center;justify-content: space-between;gap: 8px;margin-top: 12px;color: var(--color-text-secondary);font-size: 12px}.catalog-tools div,.all-actions{gap: 12px}.catalog-tools button,.all-actions button,.axis-block header button,.dimension-group header button{border: 0;padding: 4px;background: transparent;color: var(--color-primary);font: inherit;font-size: 12px;cursor: pointer}.catalog-tools button:disabled{color: var(--color-text-disabled)}.dataset-list{display: grid;align-content: start;gap: 8px;min-height: 0;margin-top: 12px;overflow-y: auto}.dataset-item{display: grid;grid-template-columns: 20px minmax(0,1fr) auto;gap: 8px;align-items: start;border: 1px solid var(--color-border-subtle);border-radius: var(--radius-md);padding: 12px;background: var(--color-surface)}.dataset-item.active{border-color: var(--color-primary-border);box-shadow: var(--focus-ring)}.dataset-item.selected{background: var(--color-primary-subtle)}.dataset-checkbox input{width: 16px;height: 16px;margin: 4px 0 0;accent-color: var(--color-primary)}.dataset-info{display: grid;gap: 4px;border: 0;padding: 0;background: transparent;text-align: left;cursor: pointer}.dataset-info b{color: var(--color-text);font-size: 13px}.dataset-info small{color: var(--color-text-tertiary);font-size: 12px;line-height: 1.45}.dataset-info span{display: flex;flex-wrap: wrap;gap: 4px}.dataset-info em{border-radius: 9999px;padding: 4px 8px;background: var(--color-bg-muted);color: var(--color-text-secondary);font-size: 12px;font-style: normal}.dataset-state{color: var(--color-text-tertiary);font-size: 12px}.workspace{display: flex;min-width: 0;min-height: 0;flex-direction: column}.workspace-tabs{display: flex;gap: 8px;border-bottom: 1px solid var(--color-border-subtle);padding: 12px 20px 0}.workspace-tabs button{min-height: var(--control-height-md);border: 0;border-bottom: 2px solid transparent;padding: 0 12px;background: transparent;color: var(--color-text-secondary);font: inherit;font-size: 12px;cursor: pointer}.workspace-tabs button.active{border-bottom-color: var(--color-primary);color: var(--color-primary);font-weight: 700}.workspace-tabs button:disabled{color: var(--color-text-disabled)}.config-panel{display: flex;min-width: 0;min-height: 0;flex: 1;flex-direction: column;overflow-y: auto;padding: 20px 20px}.config-head>div>span{color: var(--color-primary);font-size: 12px;font-weight: 700}.config-head h4{margin: 4px 0 4px;color: var(--color-text);font-size: 16px}.config-head p{margin: 0;color: var(--color-text-tertiary);font-size: 12px}.config-head em{border-radius: 9999px;padding: 4px 8px;background: var(--color-warning-subtle);color: var(--color-warning);font-size: 12px;font-style: normal;font-weight: 700}.config-head em.complete{background: var(--color-success-subtle);color: var(--color-success)}.dataset-config-head{display: grid;grid-template-columns: minmax(180px,.85fr) minmax(300px,1.15fr) auto;align-items: start}.preview-panel .dataset-config-head{grid-template-columns: minmax(180px,.85fr) minmax(300px,1.15fr) auto}.dataset-title{min-width: 0}.dataset-tag-maintenance{display: grid;grid-template-columns: minmax(0,1fr) auto;gap: 8px 12px;align-items: start;min-width: 0;border: 1px solid var(--color-border-subtle);border-radius: var(--radius-md);padding: 8px 12px;background: var(--color-bg-subtle)}.dataset-tag-maintenance.editing{grid-template-columns: minmax(0,1fr);border-color: var(--color-primary-border);box-shadow: var(--focus-ring);background: var(--color-surface)}.tag-summary{display: grid;gap: 4px;min-width: 0}.tag-summary>span{color: var(--color-text-secondary);font-size: 12px;font-weight: 700}.tag-chips,.tag-editor-selected,.tag-suggestions{display: flex;flex-wrap: wrap;gap: 4px;align-items: center}.tag-chips em,.tag-editor-selected>span{border-radius: 9999px;padding: 4px 8px;background: var(--color-bg-muted);color: var(--color-text-secondary);font-size: 12px;font-style: normal}.tag-chips small,.tag-editor-selected>small{color: var(--color-text-tertiary);font-size: 12px}.tag-edit-btn{min-height: 28px;border: 1px solid var(--color-primary-border);border-radius: var(--radius-md);padding: 0 12px;background: var(--color-surface);color: var(--color-primary);font: inherit;font-size: 12px;white-space: nowrap;cursor: pointer}.tag-save-notice{align-self: center;color: var(--color-success);font-size: 12px}.tag-editor{display: grid;grid-column: 1/-1;gap: 8px;border-top: 1px solid var(--color-border-subtle);padding-top: 8px}.tag-editor-selected>span{display: inline-flex;align-items: center;gap: 4px;background: var(--color-primary-subtle);color: var(--color-primary)}.tag-editor-selected>span button{width: 16px;height: 16px;border: 0;padding: 0;background: transparent;color: var(--color-text-secondary);font: inherit;font-size: 14px;line-height: 1;cursor: pointer}.tag-input-row{display: grid;grid-template-columns: minmax(0,1fr) auto;gap: 8px}.tag-input-row input{box-sizing: border-box;min-width: 0;height: var(--control-height-md);border: 1px solid var(--color-border);border-radius: var(--radius-md);padding: 0 12px;color: var(--color-text);font: inherit;font-size: 12px}.tag-input-row>button{min-height: var(--control-height-md);border: 1px solid var(--color-primary-border);border-radius: var(--radius-md);padding: 0 12px;background: var(--color-primary-subtle);color: var(--color-primary);font: inherit;font-size: 12px;cursor: pointer}.tag-input-row>button:disabled{border-color: var(--color-border-subtle);background: var(--color-bg-muted);color: var(--color-text-disabled);cursor: not-allowed}.tag-suggestions>small{margin-right: 4px;color: var(--color-text-tertiary);font-size: 12px}.tag-suggestions>button{min-height: 24px;border: 1px solid var(--color-border);border-radius: 9999px;padding: 0 8px;background: var(--color-surface);color: var(--color-text-secondary);font: inherit;font-size: 12px;cursor: pointer}.tag-helper,.tag-editor-error{margin: 0;font-size: 12px;line-height: 1.5}.tag-helper{color: var(--color-text-tertiary)}.tag-editor-error{color: var(--color-danger)}.tag-editor-actions{display: flex;justify-content: flex-end;gap: 8px}.primary-btn.compact,.secondary-btn.compact{min-height: 28px;padding: 0 12px;font-size: 12px}.tag-edit-btn:focus-visible,.tag-input-row input:focus-visible,.tag-input-row>button:focus-visible,.tag-suggestions>button:focus-visible,.tag-editor-selected>span button:focus-visible{outline: 0;border-color: var(--color-primary);box-shadow: var(--focus-ring)}.logic-note{display: flex;justify-content: space-between;gap: 12px;margin-top: 16px;border: 1px solid var(--color-border);border-radius: var(--radius-md);padding: 12px 12px;background: var(--color-primary-subtle)}.logic-note b{color: var(--color-primary);font-size: 12px}.logic-note span{color: var(--color-text-secondary);font-size: 12px}.all-actions span{margin-right: auto}.axis-grid{display: grid;grid-template-columns: repeat(2,minmax(0,1fr));gap: 12px;margin-top: 12px}.axis-block{overflow: hidden;border: 1px solid var(--color-border-subtle);border-radius: var(--radius-md);background: var(--color-bg-subtle)}.axis-block>header{display: flex;align-items: center;justify-content: space-between;gap: 12px;min-height: 44px;padding: 0 12px}.axis-block>header>div:first-child{display: grid;gap: 4px}.axis-block header b{color: var(--color-primary);font-size: 12px}.axis-block header small{color: var(--color-text-tertiary);font-size: 12px}.axis-block>header>div:last-child{display: flex;gap: 8px}.dimension-scroll{display: grid;gap: 8px;max-height: 245px;overflow-y: auto;border-top: 1px solid var(--color-border-subtle);padding: 12px;background: var(--color-surface)}.dimension-group>header{display: flex;justify-content: space-between;margin-bottom: 8px}.dimension-group>header span{display: flex;gap: 8px}.dimension-group>b,.dimension-group>header>b{color: var(--color-text-secondary);font-size: 12px}.options{display: flex;align-content: flex-start;flex-wrap: wrap;gap: 8px;margin-top: 8px}.options label{display: inline-flex;align-items: center;gap: 8px;min-height: 30px;padding: 0 12px;font-size: 12px;cursor: pointer}.options input{width: 14px;height: 14px;margin: 0;accent-color: var(--color-primary)}.column-options{max-height: 245px;overflow-y: auto;border-top: 1px solid var(--color-border-subtle);padding: 12px;background: var(--color-surface)}.drawer-matrix{margin-top: 16px}.drawer-matrix .matrix-scroll{max-height: 220px}.preview-list{display: grid;gap: 12px;margin-top: 16px}.preview-list section{border: 1px solid var(--color-border-subtle);border-radius: var(--radius-md);padding: 12px;background: var(--color-bg-subtle)}.preview-list b{font-size: 12px}.preview-list p{margin: 4px 0 0;color: var(--color-text-secondary);font-size: 12px}.empty-config{align-items: center;justify-content: center;text-align: center}.empty-config p{color: var(--color-text-tertiary);font-size: 12px}.batch-panel{gap: 12px}.batch-panel .dimension-scroll{max-height: 170px}.batch-panel .column-options{max-height: 130px}.batch-empty{margin: 0;border-top: 1px solid var(--color-border-subtle);padding: 20px 12px;background: var(--color-surface);color: var(--color-text-tertiary);font-size: 12px;text-align: center}.batch-apply{align-self: flex-start}.batch-error{border: 1px solid var(--color-danger);border-radius: var(--radius-md);padding: 12px 12px;background: var(--color-danger-subtle);color: var(--color-danger);font-size: 12px}.batch-error b{color: var(--color-danger)}.batch-error ul{margin: 8px 0 0;padding-left: 20px;color: var(--color-danger)}.batch-error li+li{margin-top: 4px}.batch-result{border: 1px solid var(--color-success);border-radius: var(--radius-md);padding: 12px 12px;background: var(--color-success-subtle);color: var(--color-text-secondary);font-size: 12px}.batch-result b{color: var(--color-success)}.batch-result p{margin: 4px 0 0}.batch-result ul{margin: 4px 0 0;padding-left: 20px;color: var(--color-text-secondary)}.picker-actions{display: flex;align-items: center;justify-content: flex-end;gap: 12px;border-top: 1px solid var(--color-border-subtle);padding: 16px 20px}.picker-actions>span{margin-right: auto;color: var(--color-danger);font-size: 12px}.primary-btn,.secondary-btn{min-height: var(--control-height-md);border-radius: var(--radius-md);padding: 0 20px;font: inherit;font-size: 13px;font-weight: 700;cursor: pointer}.primary-btn{border: 1px solid var(--color-primary);background: var(--color-primary);color: var(--color-on-primary)}.primary-btn:disabled{border-color: var(--color-bg-muted);background: var(--color-bg-muted)}.secondary-btn{border: 1px solid var(--color-border);background: var(--color-surface);color: var(--color-text-secondary)}.sr-only{position: absolute;width: 1px;height: 1px;overflow: hidden;clip-path: inset(50%);white-space: nowrap}@media(max-width:980px){.summary-grid,.axis-grid,.dataset-config-head,.preview-panel .dataset-config-head{grid-template-columns: 1fr}.editor-head,.rule-card-head,.logic-note{flex-direction: column}.picker-layout{grid-template-columns: 1fr;overflow-y: auto}.catalog-panel{max-height: 330px;border-right: 0;border-bottom: 1px solid var(--color-border-subtle)}.config-panel{overflow: visible}}</style>
<style scoped>
.catalog-filter-bar{position: relative;display: grid;grid-template-columns: minmax(0,1fr) auto;min-height: var(--control-height-md);border: 1px solid var(--color-border);border-radius: var(--radius-md);background: var(--color-surface);transition: border-color .15s ease,box-shadow .15s ease}.catalog-filter-bar:hover{border-color: var(--color-border-strong)}.catalog-filter-bar.active,.catalog-filter-bar:focus-within{border-color: var(--color-primary);box-shadow: var(--focus-ring)}.catalog-filter-bar .search-box{display: flex;min-width: 0}.catalog-filter-bar .search-box input{box-sizing: border-box;width: 100%;min-width: 0;min-height: var(--control-height-md);border: 0;border-radius: var(--radius-md) 0 0 var(--radius-md);padding: 0 12px;background: transparent;color: var(--color-text);font: inherit;font-size: 13px;outline: 0}.catalog-filter-bar .tag-multiselect{position: static;display: flex;margin-top: 0;border-left: 1px solid var(--color-border-subtle)}.catalog-filter-bar .tag-select-trigger{display: flex;box-sizing: border-box;width: auto;min-height: var(--control-height-md);align-items: center;justify-content: center;gap: 8px;border: 0;border-radius: 0 var(--radius-md) var(--radius-md) 0;padding: 0 12px;background: var(--color-surface);color: var(--color-text-secondary);font: inherit;font-size: 12px;white-space: nowrap;cursor: pointer}.catalog-filter-bar .tag-select-trigger:hover,.catalog-filter-bar .tag-select-trigger.active{background: var(--color-primary-subtle);color: var(--color-primary)}.catalog-filter-bar .tag-select-trigger:focus-visible{outline: 2px solid var(--color-primary);outline-offset: -2px;box-shadow: none}.tag-select-label{font-weight: 600}.tag-select-count{display: inline-grid;min-width: 18px;height: 18px;box-sizing: border-box;place-items: center;border-radius: 9999px;padding: 0 4px;background: var(--color-primary);color: var(--color-on-primary);font-size: 12px;font-weight: 700}.catalog-filter-bar .tag-select-chevron{color: currentColor}.catalog-filter-bar .tag-select-dropdown{top: calc(100% + 6px);right: 0;left: 0}

</style>

<style scoped src="./permissionDialogFooter.css"></style>
