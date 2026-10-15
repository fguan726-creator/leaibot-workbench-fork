<template>
  <section class="assist-generation-page" data-page-flow="review-assist">
    <div class="ag-workspace">
      <ContentPageHeader
        title="辅助生成"
        description="查询 AI 辅助生成评价草稿的历史记录，并分析生成、采纳、拦截等核心指标。"
      />

      <section class="ag-panel ag-tabs-panel" aria-label="辅助生成工作区">
        <ContentTabs
          :items="[
            { key: 'query', label: '查询' },
            { key: 'analysis', label: '分析' }
          ]"
          :model-value="activeTab"
          label="辅助生成视图"
          @update:model-value="activeTab = $event as AssistTab"
        />
      </section>

      <template v-if="activeTab === 'query'">
        <div class="ag-query-workspace">
          <section
            class="ag-panel ag-filter-panel"
            aria-label="筛选条件"
          >
            <SectionHeader id="assist-generation-filter-title" title="筛选条件" />
            <form class="ag-filter-form" @submit.prevent="applyFilters">
              <FilterField class="ag-filter-item" label="商品名称">
                <input
                  v-model="draft.productName"
                  type="search"
                  placeholder="商品名称"
                  autocomplete="off"
                />
              </FilterField>
              <FilterField class="ag-filter-item" label="商品编号">
                <input
                  v-model="draft.productCode"
                  type="search"
                  placeholder="商品编号"
                  autocomplete="off"
                />
              </FilterField>
              <FilterField class="ag-filter-item" label="账户">
                <input
                  v-model="draft.account"
                  type="search"
                  placeholder="账户"
                  autocomplete="off"
                />
              </FilterField>
              <FilterField class="ag-filter-item" label="LenovoID">
                <input
                  v-model="draft.lenovoId"
                  type="search"
                  placeholder="LenovoID"
                  autocomplete="off"
                />
              </FilterField>
              <div
                v-show="showMoreFilters"
                id="assist-more-filters"
                class="ag-more-fields"
                role="group"
                aria-label="更多筛选条件"
              >
                <FilterField class="ag-filter-item" label="来源">
                  <select v-model="draft.source" aria-label="来源">
                    <option value="all">全部</option>
                    <option value="乐享">乐享</option>
                    <option value="商城">商城</option>
                  </select>
                </FilterField>
                <FilterField class="ag-filter-item" label="生成方式">
                  <select v-model="draft.way" aria-label="生成方式">
                    <option value="all">全部</option>
                    <option value="标签生成">标签生成</option>
                    <option value="提示词生成">提示词生成</option>
                    <option value="标签+提示词">标签+提示词</option>
                    <option value="换一版">换一版</option>
                  </select>
                </FilterField>
                <FilterField class="ag-filter-item" label="结果状态">
                  <select v-model="draft.result" aria-label="结果状态">
                    <option value="all">全部</option>
                    <option value="已采纳">已采纳</option>
                    <option value="未采纳">未采纳</option>
                    <option value="生成前拦截">生成前拦截</option>
                    <option value="生成后拦截">生成后拦截</option>
                  </select>
                </FilterField>
                <FilterField class="ag-filter-item ag-filter-item--range" label="时间段" group>
                  <div class="ag-range-input" aria-label="时间段">
                    <input v-model="draft.startDate" type="date" aria-label="开始日期" :aria-invalid="Boolean(filterError)" :aria-describedby="filterError ? 'ag-date-error' : undefined" />
                    <em>~</em>
                    <input v-model="draft.endDate" type="date" aria-label="结束日期" :aria-invalid="Boolean(filterError)" :aria-describedby="filterError ? 'ag-date-error' : undefined" />
                  </div>
                </FilterField>
              </div>
              <div class="ag-filter-actions">
                <button
                  class="ag-more-toggle"
                  type="button"
                  :aria-expanded="showMoreFilters"
                  aria-controls="assist-more-filters"
                  @click="showMoreFilters = !showMoreFilters"
                >
                  {{ showMoreFilters ? '收起更多条件' : '展开更多条件'
                  }}<span v-if="moreFilterCount">（{{ moreFilterCount }}）</span>
                  <span aria-hidden="true">{{ showMoreFilters ? '⌃' : '⌄' }}</span>
                </button>
                <div class="ag-filter-submit-actions">
                  <button class="btn btn-primary btn-sm" type="submit">查询</button>
                  <button class="btn btn-secondary btn-sm" type="button" @click="resetFilters">
                    重置
                  </button>
                  <button class="btn btn-secondary btn-sm" type="button" title="导出当前筛选的全部记录" :disabled="!filteredRecords.length" @click="exportRecords">导出</button>
                </div>
              </div>
            </form>
            <p v-if="filterError" id="ag-date-error" class="ag-filter-error" role="alert">{{ filterError }}</p>
          </section>

          <ListSurface class="ag-table-panel" aria-labelledby="assist-generation-history-title">
            <template #toolbar><SectionHeader id="assist-generation-history-title" title="辅助生成历史记录"/></template>
            <div class="ag-table-scroll">
              <table class="ag-table">
                <thead>
                  <tr>
                    <th>账户</th>
                    <th>LenovoID</th>
                    <th>商品编号</th>
                    <th>商品名称</th>
                    <th>生成方式</th>
                    <th>生成次数</th>
                    <th>评分</th>
                    <th>结果</th>
                    <th>生成时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in pagedRecords" :key="`${record.user}-${record.time}`">
                    <td>{{ record.user }}</td>
                    <td>{{ record.lenovoId }}</td>
                    <td>{{ record.productCode }}</td>
                    <td>{{ record.productName }}</td>
                    <td class="ag-center">{{ record.way }}</td>
                    <td class="ag-center">{{ record.generateCount }}</td>
                    <td class="ag-center">{{ record.score }}</td>
                    <td class="ag-center">
                      <StatusTag
                        :tone="
                          record.result === '已采纳'
                            ? 'success'
                            : record.result.includes('拦截')
                              ? 'warning'
                              : 'neutral'
                        "
                      >{{ record.result }}</StatusTag>
                    </td>
                    <td>{{ record.time }}</td>
                    <td class="ag-center">
                      <button class="ag-link-action" type="button" @click="openDraft(record)">
                        查看草稿
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!filteredRecords.length">
                    <td colspan="10">
                      <FeedbackState
                        state="filtered-empty"
                        title="暂无匹配记录"
                        description="请调整筛选条件后重试。"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <template #pagination>
              <Pagination
                :page="currentPage"
                :page-size="pageSize"
                :total="filteredRecords.length"
                @update:page="currentPage = $event"
              />
            </template>
          </ListSurface></div></template>

      <template v-else>
        <ReviewAnalysisPanel variant="assist" />
      </template>
    </div>

    <Teleport to="body">
      <div v-if="selectedRecord" class="ag-modal-layer" @click.self="closeDraft">
        <section
          class="ag-draft-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assist-generation-draft-title"
        >
          <header class="ag-modal-header">
            <h2 id="assist-generation-draft-title">AI 草稿详情</h2>
            <button type="button" aria-label="关闭" data-dialog-close @click="closeDraft">×</button>
          </header>
          <div class="ag-modal-body">
            <section class="ag-draft-product">
              <h3>{{ selectedRecord.productName }}</h3>
              <dl class="ag-draft-meta">
                <div>
                  <dt>账户</dt>
                  <dd>{{ selectedRecord.userFull }}</dd>
                </div>
                <div>
                  <dt>商品编号</dt>
                  <dd>{{ selectedRecord.productCode }}</dd>
                </div>
                <div>
                  <dt>评分</dt>
                  <dd>{{ selectedRecord.score }}</dd>
                </div>
                <div>
                  <dt>生成时间</dt>
                  <dd>{{ selectedRecord.time }}</dd>
                </div>
              </dl>
            </section>

            <section class="ag-draft-section">
              <h3>用户输入标签</h3>
              <div class="ag-tag-row">
                <span v-for="tag in selectedRecord.tags" :key="tag">{{ tag }}</span>
              </div>
            </section>

            <section class="ag-draft-section">
              <h3>用户输入提示词</h3>
              <p class="ag-prompt-box">{{ selectedRecord.prompt }}</p>
            </section>

            <section class="ag-draft-section">
              <h3>草稿版本记录</h3>
              <article
                v-for="(item, index) in selectedRecord.drafts"
                :key="item.time"
                class="ag-draft-card"
              >
                <header>
                  <span>版本 {{ index + 1 }} · {{ item.time }}</span>
                  <StatusTag v-if="item.adopted" tone="success">已采纳</StatusTag>
                </header>
                <p>{{ item.content }}</p>
              </article>
            </section>

            <p class="ag-safety-note">
              安全校验：生成前 ✓ 通过 · 生成后 ✓ 无违禁词/虚假承诺 · 本流程共生成 3/5 次
            </p>
          </div>
          <footer class="ag-modal-footer">
            <button class="btn btn-secondary" type="button" @click="closeDraft">关闭</button>
          </footer>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onDeactivated, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useDialogFocusManager } from '@/composables/useDialogFocusManager'
import { downloadReviewCsv, matchesReviewDateRange, reviewDateRangeError, reviewPageRecords } from './reviewList'
import ContentTabs from '@/components/content/ContentTabs.vue'
import FilterField from '@/components/content/FilterField.vue'
import SectionHeader from '@/components/content/SectionHeader.vue'
import ListSurface from '@/components/content/ListSurface.vue'
import Pagination from '@/components/content/Pagination.vue'
import StatusTag from '@/components/content/StatusTag.vue'
import FeedbackState from '@/components/content/FeedbackState.vue'
import ContentPageHeader from '@/components/content/ContentPageHeader.vue'
import ReviewAnalysisPanel from '@/views/reviews/ReviewAnalysisPanel.vue'

type AssistTab = 'query' | 'analysis'
type GenerateWay = '标签生成' | '提示词生成' | '标签+提示词' | '换一版'
type ResultStatus = '已采纳' | '未采纳' | '生成前拦截' | '生成后拦截'
type AssistSource = '乐享' | '商城'

interface FilterDraft {
  productName: string
  productCode: string
  account: string
  lenovoId: string
  source: 'all' | AssistSource
  way: 'all' | GenerateWay
  result: 'all' | ResultStatus
  startDate: string
  endDate: string
}

interface DraftVersion {
  time: string
  content: string
  adopted?: boolean
}

interface AssistRecord {
  user: string
  userFull: string
  lenovoId: string
  source: AssistSource
  productCode: string
  productName: string
  way: GenerateWay
  generateCount: number
  score: number
  result: ResultStatus
  time: string
  tags: string[]
  prompt: string
  drafts: DraftVersion[]
}

const initialDraft: FilterDraft = {
  productName: '',
  productCode: '',
  account: '',
  lenovoId: '',
  source: 'all',
  way: 'all',
  result: 'all',
  startDate: '',
  endDate: ''
}

const draft = ref<FilterDraft>({ ...initialDraft })
const showMoreFilters = ref(false)
const moreFilterCount = computed(
  () =>
    Number(draft.value.source !== 'all') +
    Number(draft.value.way !== 'all') +
    Number(draft.value.result !== 'all') +
    Number(Boolean(draft.value.startDate || draft.value.endDate))
)
const applied = ref<FilterDraft>({ ...initialDraft })
const activeTab = ref<AssistTab>('query')
const currentPage = ref(1)
const filterError = ref('')
const selectedRecord = ref<AssistRecord | null>(null)

const defaultTags = ['运行流畅', '外观好看', '性价比高']
const defaultPrompt = '买给上大学的孩子用，主要看重轻薄和续航'
const defaultDrafts: DraftVersion[] = [
  {
    time: '09:28',
    content: '孩子上大学用，机器很轻薄，放包里没负担，运行也流畅，颜值在线，性价比不错。'
  },
  {
    time: '09:30',
    content: '轻薄好带，日常上课办公都够用，运行流畅不卡顿，外观也好看，价格挺合适。'
  },
  {
    time: '09:31',
    content:
      '买给上大学的孩子，最看重轻薄和续航，实际拿到手很满意，机身很轻，运行流畅，外观也好看，性价比高，推荐。',
    adopted: true
  }
]

const records: AssistRecord[] = [
  {
    user: '138****2043',
    userFull: '13820002043',
    lenovoId: 'LID8837201',
    source: '乐享',
    productCode: '1056602',
    productName: 'ThinkBook 14 轻薄本',
    way: '标签生成',
    generateCount: 2,
    score: 5,
    result: '已采纳',
    time: '2026-09-10 09:31',
    tags: defaultTags,
    prompt: defaultPrompt,
    drafts: defaultDrafts
  },
  {
    user: '150****7788',
    userFull: '15012347788',
    lenovoId: 'LID6620915',
    source: '商城',
    productCode: '1056601',
    productName: '联想小新 Pro 16',
    way: '提示词生成',
    generateCount: 3,
    score: 5,
    result: '已采纳',
    time: '2026-09-10 09:12',
    tags: ['性能稳定', '屏幕清晰', '办公高效'],
    prompt: '日常办公和修图使用，想强调大屏和性能稳定',
    drafts: defaultDrafts
  },
  {
    user: '177****0021',
    userFull: '17755550021',
    lenovoId: 'LID4471088',
    source: '乐享',
    productCode: '1056598',
    productName: '拯救者 Y7000P',
    way: '换一版',
    generateCount: 4,
    score: 4,
    result: '未采纳',
    time: '2026-09-10 08:55',
    tags: ['游戏流畅', '散热稳定', '接口够用'],
    prompt: '主要玩大型游戏，希望描述性能和散热',
    drafts: defaultDrafts
  },
  {
    user: '186****5510',
    userFull: '18666665510',
    lenovoId: 'LID5510372',
    source: '商城',
    productCode: '1056602',
    productName: 'ThinkBook 14 轻薄本',
    way: '提示词生成',
    generateCount: 1,
    score: 2,
    result: '生成前拦截',
    time: '2026-09-10 08:40',
    tags: ['轻薄', '续航'],
    prompt: '要求生成夸大续航承诺的内容',
    drafts: defaultDrafts.slice(0, 1)
  },
  {
    user: '139****9902',
    userFull: '13988889902',
    lenovoId: 'LID9902644',
    source: '乐享',
    productCode: '1056585',
    productName: 'YOGA Air 14s',
    way: '标签生成',
    generateCount: 5,
    score: 5,
    result: '生成后拦截',
    time: '2026-09-10 08:20',
    tags: ['轻薄便携', '颜值高', '运行流畅'],
    prompt: '通勤携带，平时办公和上网课',
    drafts: defaultDrafts
  },
  {
    user: '135****3366',
    userFull: '13533223366',
    lenovoId: 'LID3366120',
    source: '商城',
    productCode: '1056590',
    productName: '小新平板 Pro 12.7',
    way: '标签+提示词',
    generateCount: 2,
    score: 5,
    result: '已采纳',
    time: '2026-09-10 07:58',
    tags: ['屏幕细腻', '学习方便', '系统顺滑'],
    prompt: '给孩子学习和看课用，希望表达屏幕和书写体验',
    drafts: defaultDrafts
  }
]

const filteredRecords = computed(() =>
  records.filter((record) => {
    const nameMatched =
      !applied.value.productName || record.productName.includes(applied.value.productName)
    const codeMatched =
      !applied.value.productCode || record.productCode.includes(applied.value.productCode)
    const accountMatched =
      !applied.value.account ||
      record.user.includes(applied.value.account) ||
      record.userFull.includes(applied.value.account)
    const lenovoMatched =
      !applied.value.lenovoId || record.lenovoId.includes(applied.value.lenovoId)
    const sourceMatched = applied.value.source === 'all' || record.source === applied.value.source
    const wayMatched = applied.value.way === 'all' || record.way === applied.value.way
    const resultMatched = applied.value.result === 'all' || record.result === applied.value.result
    const dateMatched = matchesReviewDateRange(record.time, applied.value.startDate, applied.value.endDate)
    return (
      nameMatched &&
      codeMatched &&
      accountMatched &&
      lenovoMatched &&
      sourceMatched &&
      wayMatched &&
      resultMatched &&
      dateMatched
    )
  })
)

const pageSize = 3
const pagedRecords = computed(() =>
  reviewPageRecords(filteredRecords.value, currentPage.value, pageSize)
)

function applyFilters() {
  filterError.value = reviewDateRangeError(draft.value.startDate, draft.value.endDate)
  if (filterError.value) return
  applied.value = { ...draft.value }
  currentPage.value = 1
}

function resetFilters() {
  filterError.value = ''
  draft.value = { ...initialDraft }
  applied.value = { ...initialDraft }
  currentPage.value = 1
}

watch(activeTab, () => { currentPage.value = 1 })

function exportRecords() {
  downloadReviewCsv('辅助生成历史记录.csv', [
    ['账户', 'LenovoID', '来源', '商品编号', '商品名称', '生成方式', '生成次数', '评分', '结果', '生成时间'],
    ...filteredRecords.value.map(record => [
      record.user, record.lenovoId, record.source, record.productCode, record.productName,
      record.way, record.generateCount, record.score, record.result, record.time
    ])
  ])
}

function openDraft(record: AssistRecord) {
  selectedRecord.value = record
}

function closeDraft() {
  selectedRecord.value = null
}

onBeforeRouteLeave(closeDraft)
onDeactivated(closeDraft)

useDialogFocusManager(ref<HTMLElement | null>(document.body), '.ag-modal-layer', '.ag-draft-modal')
</script>

<style scoped lang="scss">
.ag-filter-error {
  margin: var(--space-2, 8px) 0 0;
  color: var(--color-danger);
  font-size: var(--text-sm, 13px);
}

.assist-generation-page {
  container-type: inline-size;
  padding: 0;
  min-width: 0;
}

.ag-workspace {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.ag-panel {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.ag-filter-panel {
  padding: 16px;
  background: var(--color-surface);
  border-color: var(--color-border-subtle);
}

.ag-filter-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.ag-range-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
}

.ag-range-input em {
  color: var(--color-text-tertiary);
  font-style: normal;
  text-align: center;
}

.ag-filter-actions {
  display: flex;
  grid-column: 1 / -1;
  justify-content: space-between;
  gap: 8px;
}

.ag-filter-actions .btn {
  min-width: 56px;
}

.ag-table-scroll {
  overflow-x: auto;
}

.ag-table {
  width: 100%;
  min-width: 1064px;
  border-collapse: collapse;
  border: 1px solid var(--color-border-subtle);
  table-layout: fixed;
  font-size: var(--text-sm, 13px);
}

.ag-table th,
.assist-generation-page .ag-table td {
  border-right: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  overflow: hidden;
  padding: 8px 12px;
  color: var(--color-text-secondary);
  text-align: left;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.assist-generation-page .ag-table td {
  height: 48px;
}

.assist-generation-page .ag-table th {
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm, 13px);
  font-weight: 500;
  white-space: nowrap;
}

.ag-table th:nth-child(1),
.ag-table td:nth-child(1) {
  width: 104px;
}

.ag-table th:nth-child(2),
.ag-table td:nth-child(2) {
  width: 100px;
}

.ag-table th:nth-child(3),
.ag-table td:nth-child(3) {
  width: 84px;
}

.ag-table th:nth-child(5),
.ag-table td:nth-child(5) {
  width: 112px;
}

.ag-table th:nth-child(6),
.ag-table td:nth-child(6) {
  width: 84px;
}

.ag-table th:nth-child(7),
.ag-table td:nth-child(7) {
  width: 56px;
}

.ag-table th:nth-child(8),
.ag-table td:nth-child(8) {
  width: 96px;
}

.ag-table th:nth-child(9),
.ag-table td:nth-child(9) {
  width: 156px;
}

.ag-table th:nth-child(10),
.ag-table td:nth-child(10) {
  width: 104px;
}

.ag-center,
.ag-table th:nth-child(5),
.ag-table th:nth-child(6),
.ag-table th:nth-child(7),
.ag-table th:nth-child(8),
.ag-table th:nth-child(10) {
  text-align: center;
}

.ag-status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  padding: 0 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs, 12px);
  white-space: nowrap;
}

.ag-status-badge[data-result='已采纳'] {
  border-color: var(--color-success-subtle);
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.ag-status-badge[data-result='生成前拦截'],
.ag-status-badge[data-result='生成后拦截'] {
  border-color: color-mix(in srgb, var(--color-danger) 25%, var(--color-border-subtle));
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}

.assist-generation-page .ag-link-action {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: var(--text-sm, 13px);
  font-weight: 500;
  cursor: pointer;
}

.ag-pagination {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 0;
}

.ag-pagination button,
.ag-pagination span {
  display: inline-grid;
  min-width: 30px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--text-sm, 13px);
  font-weight: 500;
}

.ag-pagination button {
  cursor: pointer;
}

.ag-pagination button.active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.ag-pagination button:disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.ag-empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.ag-empty-state strong {
  color: var(--color-text-secondary);
}

.ag-modal-layer {
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--color-text) 45%, transparent);
}

.ag-draft-modal {
  display: grid;
  width: min(720px, 100%);
  max-height: calc(100vh - 64px);
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.ag-modal-header {
  border-bottom: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.ag-modal-header h2 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-lg, 18px);
  font-weight: 600;
  line-height: 26px;
}

.ag-modal-header button {
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-2xl, 24px);
  line-height: 1;
  cursor: pointer;
}

.ag-modal-body {
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px;
}

.ag-draft-product h3 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-md, 16px);
  line-height: 1.5;
}

.ag-draft-product p,
.ag-safety-note {
  margin: 12px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm, 13px);
  line-height: 1.6;
}

.ag-draft-section {
  margin-top: 24px;
}

.ag-draft-section h3 {
  margin: 0 0 8px;
  color: var(--color-text);
  font-size: var(--text-sm, 13px);
  font-weight: 500;
  line-height: 1.5;
}

.ag-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ag-tag-row span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 4px;
  padding: 0 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: var(--text-xs, 12px);
}

.ag-prompt-box,
.ag-draft-card {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.ag-prompt-box {
  margin: 0;
  padding: 16px;
  background: var(--color-primary-subtle);
  color: var(--color-text);
  font-size: var(--text-sm, 13px);
  line-height: 1.7;
}

.ag-draft-card {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  padding: 16px;
}

.ag-draft-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ag-draft-card span {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm, 13px);
}

.ag-draft-card em {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border: 1px solid var(--color-success-subtle);
  border-radius: 4px;
  padding: 0 8px;
  background: var(--color-success-subtle);
  color: var(--color-success);
  font-size: var(--text-xs, 12px);
  font-style: normal;
}

.ag-draft-card p {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-base, 14px);
  line-height: 1.8;
}

.ag-safety-note {
  margin-top: 12px;
}

@container (max-width: 1039px) {
  .ag-filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (max-width: 719px) {
  .ag-filter-form {
    grid-template-columns: minmax(0, 1fr);
  }
}

.ag-filter-panel > :deep(.content-section-header) {
  margin-bottom: 16px;
}
.ag-filter-item--range {
  grid-column: span 2;
}
.ag-filter-actions {
  flex-wrap: wrap;
}
.ag-filter-actions .btn {
  min-height: 36px;
  font-size: var(--text-sm, 13px);
}
.assist-generation-page .ag-table th {
  height: 40px;
  font-size: var(--text-xs, 12px);
  /* Override only the inherited global th weight lock for this new table. */
  font-weight: var(--font-weight-medium, 500) !important;
  background: var(--color-bg-subtle);
}
.assist-generation-page .ag-table td {
  box-sizing: border-box;
  height: 48px;
  font-variant-numeric: tabular-nums;
}
.ag-table th,
.assist-generation-page .ag-table td {
  border-right: 0;
}
.assist-generation-page .ag-table tr:hover td {
  background: var(--color-bg-subtle);
}
.ag-table th:last-child,
.assist-generation-page .ag-table td:last-child {
  position: sticky;
  right: 0;
  text-align: right;
  background: var(--color-surface);
  box-shadow: -1px 0 0 var(--color-border-subtle);
}
.ag-pagination {
  margin: 0;
}
@container (max-width: 719px) {
  .ag-filter-actions {
    grid-column: 1 / -1;
    justify-content: space-between;
  }
  .ag-filter-item--range {
    grid-column: auto;
  }
}

.ag-query-workspace {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.ag-tabs-panel {
  padding: 0 16px;
}

.ag-table th:nth-child(6),
.ag-table th:nth-child(7),
.ag-table td:nth-child(6),
.ag-table td:nth-child(7) {
  text-align: right;
}

.ag-more-fields {
  display: contents;
}
.ag-filter-submit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ag-more-toggle {
  padding-left: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  border: 0;
  padding-block: 0;
  padding-right: 0;
  background: transparent;
  color: var(--color-primary);
  font-size: var(--text-sm, 13px);
  cursor: pointer;
}
.ag-more-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

.ag-draft-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  margin: 16px 0 0;
}
.ag-draft-meta > div {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
}
.ag-draft-meta dt {
  color: var(--color-text-tertiary);
}
.ag-draft-meta dd {
  margin: 0;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.ag-draft-meta dt,
.ag-draft-meta dd {
  font-size: var(--text-sm, 13px);
  line-height: 1.65;
}
.ag-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-subtle);
}
.ag-modal-footer .btn {
  height: 36px;
}
.assist-generation-page .ag-table td {
  height: 48px;
}
.ag-table-panel > :deep(.cs-list-surface__toolbar) {
  padding-block: 16px;
}
.ag-modal-header button:focus-visible,
.ag-modal-footer button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
@media (max-width: 719px) {
  .ag-draft-meta {
    grid-template-columns: minmax(0, 1fr);
  }
  .ag-modal-layer {
    padding: 12px;
  }
  .ag-draft-modal {
    max-height: calc(100dvh - 24px);
  }
}

</style>
