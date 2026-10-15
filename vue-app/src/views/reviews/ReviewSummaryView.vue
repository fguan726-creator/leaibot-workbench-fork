<template>
  <section
    class="review-summary-page"
    :class="{ 'review-summary-page--embedded': embedded }"
    data-page-flow="review-summary"
  >
    <div class="rs-workspace">
      <ContentPageHeader
        v-if="!embedded"
        title="评价总结"
        description="查询商品评价总结生成记录，查看 AI 归纳的口碑摘要、维度表现和高频观点。"
      />

      <section class="rs-panel rs-filter-panel" aria-label="筛选条件">
        <SectionHeader id="review-summary-filter-title" title="筛选条件" />
        <form class="rs-filter-form" @submit.prevent="applyFilters">
          <FilterField class="rs-filter-item" label="商品名称">
            <input
              v-model="draft.productName"
              type="search"
              placeholder="商品名称"
              autocomplete="off"
            />
          </FilterField>
          <FilterField class="rs-filter-item" label="商品编号">
            <input
              v-model="draft.productCode"
              type="search"
              placeholder="商品编号"
              autocomplete="off"
            />
          </FilterField>
          <FilterField class="rs-filter-item" label="生成状态">
            <select v-model="draft.status" aria-label="生成状态">
              <option value="all">全部</option>
              <option value="generated">已生成</option>
              <option value="insufficient">样本不足</option>
            </select>
          </FilterField>
          <FilterField class="rs-filter-item" label="产品组">
            <select v-model="draft.productGroup" aria-label="产品组">
              <option value="all">请选择</option>
              <option value="thinkbook">ThinkBook</option>
              <option value="yoga">YOGA</option>
              <option value="legion">拯救者</option>
            </select>
          </FilterField>
          <FilterField class="rs-filter-item rs-filter-item--range" label="时间段" group>
            <div class="rs-range-input" aria-label="时间段">
              <input v-model="draft.startDate" type="date" aria-label="开始日期" :aria-invalid="Boolean(filterError)" :aria-describedby="filterError ? 'rs-date-error' : undefined" />
              <em>~</em>
              <input v-model="draft.endDate" type="date" aria-label="结束日期" :aria-invalid="Boolean(filterError)" :aria-describedby="filterError ? 'rs-date-error' : undefined" />
            </div>
          </FilterField>
          <div class="rs-filter-actions">
            <button class="btn btn-primary btn-sm" type="submit">查询</button>
            <button class="btn btn-secondary btn-sm" type="button" @click="resetFilters">
              重置
            </button>
            <button class="btn btn-secondary btn-sm" type="button" title="导出当前筛选的全部记录" :disabled="!filteredRecords.length" @click="exportRecords">导出</button>
          </div>
        </form>
        <p v-if="filterError" id="rs-date-error" class="rs-filter-error" role="alert">{{ filterError }}</p>
      </section>

      <ListSurface class="rs-table-panel" aria-labelledby="review-summary-history-title">
        <template #toolbar><SectionHeader id="review-summary-history-title" title="评价总结历史记录"/></template>
        <div class="rs-table-scroll">
          <table class="rs-table">
            <thead>
              <tr>
                <th>商品编号</th>
                <th>商品名称</th>
                <th>样本量(有效评价)</th>
                <th>曝光量</th>
                <th>点赞</th>
                <th>点踩</th>
                <th>生成次数</th>
                <th>状态</th>
                <th>最近更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in pagedRecords" :key="record.productCode">
                <td>{{ record.productCode }}</td>
                <td>{{ record.productName }}</td>
                <td class="rs-numeric">{{ record.sampleSize }}</td>
                <td class="rs-numeric">{{ record.exposure }}</td>
                <td class="rs-numeric">{{ formatFeedbackCount(record.likes) }}</td>
                <td class="rs-numeric">{{ formatFeedbackCount(record.dislikes) }}</td>
                <td class="rs-numeric">{{ record.generateCount }}</td>
                <td>
                  <StatusTag :tone="record.status === 'generated' ? 'success' : 'neutral'">{{
                    statusLabel(record.status)
                  }}</StatusTag>
                </td>
                <td>{{ record.updatedAt }}</td>
                <td>
                  <button class="rs-link-action" type="button" @click="openDetail(record)">
                    查看总结
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
      </ListSurface>
    </div>

    <Teleport to="body">
      <div v-if="selectedRecord" class="rs-detail-layer" @click.self="closeDetail">
        <section
          class="rs-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-summary-detail-title"
        >
          <header class="rs-detail-header">
            <h2 id="review-summary-detail-title">评价总结详情</h2>
            <button type="button" aria-label="关闭" data-dialog-close @click="closeDetail">
              ×
            </button>
          </header>
          <div class="rs-detail-body">
            <section class="rs-detail-product">
              <h3>{{ selectedRecord.productName }}</h3>
              <p>
                商品编号 {{ selectedRecord.productCode }} · 样本量 {{ selectedRecord.sampleSize }} ·
                更新 {{ selectedRecord.updatedAt }} · traceId: {{ selectedRecord.traceId }}
              </p>
            </section>

            <p class="rs-summary-text">{{ selectedRecord.summary }}</p>

            <section class="rs-detail-section">
              <h3>维度表现</h3>
              <div class="rs-dimension-tags">
                <span
                  v-for="dimension in selectedRecord.dimensions"
                  :key="dimension.label"
                  :data-tone="dimension.tone"
                >
                  {{ dimension.label }} {{ dimension.value }}
                </span>
              </div>
            </section>

            <section class="rs-detail-section">
              <h3>高频观点 Top5</h3>
              <div class="rs-detail-table-scroll">
                <table class="rs-detail-table">
                  <thead>
                    <tr>
                      <th>观点</th>
                      <th>提及次数</th>
                      <th>情绪</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedRecord.topOpinions" :key="item.label">
                      <td>{{ item.label }}</td>
                      <td class="rs-numeric">{{ item.count }}</td>
                      <td>{{ item.sentiment }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onDeactivated, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useDialogFocusManager } from '@/composables/useDialogFocusManager'
import { downloadReviewCsv, matchesReviewDateRange, reviewDateRangeError, reviewPageRecords } from './reviewList'
import FilterField from '@/components/content/FilterField.vue'
import SectionHeader from '@/components/content/SectionHeader.vue'
import Pagination from '@/components/content/Pagination.vue'
import ListSurface from '@/components/content/ListSurface.vue'
import StatusTag from '@/components/content/StatusTag.vue'
import FeedbackState from '@/components/content/FeedbackState.vue'
import ContentPageHeader from '@/components/content/ContentPageHeader.vue'

defineProps<{
  embedded?: boolean
}>()

type SummaryStatus = 'generated' | 'insufficient'
type DimensionTone = 'positive' | 'neutral' | 'warning'

interface FilterDraft {
  productName: string
  productCode: string
  status: 'all' | SummaryStatus
  productGroup: 'all' | 'thinkbook' | 'yoga' | 'legion'
  startDate: string
  endDate: string
}

interface DimensionPerformance {
  label: string
  value: string
  tone: DimensionTone
}

interface TopOpinion {
  label: string
  count: number
  sentiment: string
}

interface SummaryRecord {
  productCode: string
  productName: string
  productGroup: FilterDraft['productGroup']
  sampleSize: number
  exposure: string
  likes: number | null
  dislikes: number | null
  generateCount: number
  status: SummaryStatus
  updatedAt: string
  traceId: string
  summary: string
  dimensions: DimensionPerformance[]
  topOpinions: TopOpinion[]
}

const initialDraft: FilterDraft = {
  productName: '',
  productCode: '',
  status: 'all',
  productGroup: 'all',
  startDate: '',
  endDate: ''
}

const draft = ref<FilterDraft>({ ...initialDraft })
const applied = ref<FilterDraft>({ ...initialDraft })
const currentPage = ref(1)
const filterError = ref('')
const selectedRecord = ref<SummaryRecord | null>(null)

const records: SummaryRecord[] = [
  {
    productCode: '1056602',
    productName: 'ThinkBook 14 轻薄本 i5',
    productGroup: 'thinkbook',
    sampleSize: 2140,
    exposure: '186,420',
    likes: 1248,
    dislikes: 96,
    generateCount: 12,
    status: 'generated',
    updatedAt: '2026-09-10 08:12',
    traceId: 'T10566029',
    summary:
      '整体口碑正向，用户普遍认可屏幕显示清晰、机身做工扎实，物流配送快。轻薄便携受到好评，适合日常办公与学习。部分用户提到续航表现中规中矩。（基于 2140 条有效评价）',
    dimensions: [
      { label: '屏幕清晰', value: '+86%', tone: 'positive' },
      { label: '物流快', value: '+78%', tone: 'positive' },
      { label: '做工扎实', value: '+71%', tone: 'positive' },
      { label: '续航一般', value: '42%', tone: 'neutral' },
      { label: '价格偏高', value: '31%', tone: 'warning' }
    ],
    topOpinions: [
      { label: '屏幕清晰细腻', count: 642, sentiment: '正向' },
      { label: '物流配送快', count: 531, sentiment: '正向' },
      { label: '做工扎实', count: 410, sentiment: '正向' },
      { label: '轻薄便携', count: 388, sentiment: '正向' },
      { label: '续航一般', count: 120, sentiment: '中性' }
    ]
  },
  {
    productCode: '1056601',
    productName: '联想小新 Pro 16 标压',
    productGroup: 'yoga',
    sampleSize: 1876,
    exposure: '154,380',
    likes: 934,
    dislikes: 74,
    generateCount: 9,
    status: 'generated',
    updatedAt: '2026-09-10 07:40',
    traceId: 'T10566018',
    summary:
      '用户对大屏办公、性能释放和键盘手感评价较好。负向反馈主要集中在重量感和高负载噪音，整体适合效率办公场景。（基于 1876 条有效评价）',
    dimensions: [
      { label: '性能强', value: '+82%', tone: 'positive' },
      { label: '大屏办公', value: '+76%', tone: 'positive' },
      { label: '键盘舒适', value: '+63%', tone: 'positive' },
      { label: '重量偏重', value: '38%', tone: 'warning' }
    ],
    topOpinions: [
      { label: '性能释放稳定', count: 512, sentiment: '正向' },
      { label: '屏幕够大', count: 486, sentiment: '正向' },
      { label: '键盘舒服', count: 291, sentiment: '正向' },
      { label: '机身偏重', count: 164, sentiment: '中性' },
      { label: '风扇声音明显', count: 92, sentiment: '中性' }
    ]
  },
  {
    productCode: '1056598',
    productName: '拯救者 Y7000P 游戏本',
    productGroup: 'legion',
    sampleSize: 980,
    exposure: '98,760',
    likes: 521,
    dislikes: 39,
    generateCount: 6,
    status: 'generated',
    updatedAt: '2026-09-09 21:05',
    traceId: 'T10565986',
    summary:
      '游戏性能、散热和屏幕刷新率是主要正向点。用户对外观和接口丰富度反馈较好，便携性评价相对中性。（基于 980 条有效评价）',
    dimensions: [
      { label: '性能强', value: '+89%', tone: 'positive' },
      { label: '散热稳定', value: '+74%', tone: 'positive' },
      { label: '屏幕流畅', value: '+69%', tone: 'positive' },
      { label: '便携一般', value: '36%', tone: 'neutral' }
    ],
    topOpinions: [
      { label: '游戏帧率稳定', count: 330, sentiment: '正向' },
      { label: '散热不错', count: 282, sentiment: '正向' },
      { label: '屏幕刷新率高', count: 244, sentiment: '正向' },
      { label: '接口丰富', count: 196, sentiment: '正向' },
      { label: '机身较重', count: 108, sentiment: '中性' }
    ]
  },
  {
    productCode: '1056585',
    productName: 'YOGA Air 14s 超轻薄',
    productGroup: 'yoga',
    sampleSize: 12,
    exposure: '1,320',
    likes: null,
    dislikes: null,
    generateCount: 0,
    status: 'insufficient',
    updatedAt: '—',
    traceId: '—',
    summary: '样本不足，暂不生成评价总结。',
    dimensions: [],
    topOpinions: []
  }
]

const filteredRecords = computed(() => {
  return records.filter((record) => {
    const nameMatched =
      !applied.value.productName || record.productName.includes(applied.value.productName)
    const codeMatched =
      !applied.value.productCode || record.productCode.includes(applied.value.productCode)
    const statusMatched = applied.value.status === 'all' || record.status === applied.value.status
    const groupMatched =
      applied.value.productGroup === 'all' || record.productGroup === applied.value.productGroup
    const dateMatched = matchesReviewDateRange(record.updatedAt, applied.value.startDate, applied.value.endDate)
    return nameMatched && codeMatched && statusMatched && groupMatched && dateMatched
  })
})

const pageSize = 3
const pagedRecords = computed(() => reviewPageRecords(filteredRecords.value, currentPage.value, pageSize))

function statusLabel(status: SummaryStatus) {
  return status === 'generated' ? '已生成' : '样本不足'
}

function formatFeedbackCount(count: number | null) {
  return count === null ? '—' : count.toLocaleString('zh-CN')
}

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

function exportRecords() {
  downloadReviewCsv('评价总结历史记录.csv', [
    ['商品编号', '商品名称', '样本量(有效评价)', '曝光量', '点赞', '点踩', '生成次数', '状态', '最近更新时间'],
    ...filteredRecords.value.map(record => [
      record.productCode, record.productName, record.sampleSize, record.exposure,
      record.likes ?? '—', record.dislikes ?? '—', record.generateCount,
      statusLabel(record.status), record.updatedAt
    ])
  ])
}

function openDetail(record: SummaryRecord) {
  selectedRecord.value = record
}

function closeDetail() {
  selectedRecord.value = null
}

onBeforeRouteLeave(closeDetail)
onDeactivated(closeDetail)

useDialogFocusManager(
  ref<HTMLElement | null>(document.body),
  '.rs-detail-layer',
  '.rs-detail-modal'
)
</script>

<style scoped lang="scss">
.rs-filter-error {
  margin: var(--space-2, 8px) 0 0;
  color: var(--color-danger);
  font-size: var(--text-sm, 13px);
}

.review-summary-page {
  container-type: inline-size;
  padding: 0;
  min-width: 0;
}

.review-summary-page .rs-workspace {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.review-summary-page .rs-panel {
  min-width: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.review-summary-page .rs-filter-panel {
  padding: 16px;
  background: var(--color-surface);
  border-color: var(--color-border-subtle);
}

.review-summary-page .rs-filter-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.review-summary-page .rs-range-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
}

.review-summary-page .rs-range-input em {
  color: var(--color-text-tertiary);
  font-style: normal;
  text-align: center;
}

.review-summary-page .rs-filter-actions {
  display: flex;
  grid-column: span 2;
  justify-content: flex-end;
  gap: 8px;
}

.review-summary-page .rs-filter-actions .btn {
  min-width: 56px;
}

.review-summary-page .rs-table-scroll {
  overflow-x: auto;
}

.review-summary-page .rs-table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
  border: 1px solid var(--color-border-subtle);
  font-size: var(--text-sm, 13px);
}

.review-summary-page .rs-table th,
.review-summary-page .rs-table td,
.rs-detail-table th,
.rs-detail-table td {
  border-right: 1px solid var(--color-border-subtle);
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 12px;
  color: var(--color-text-secondary);
  text-align: left;
  vertical-align: middle;
}

.review-summary-page .rs-table td {
  height: 48px;
}

.review-summary-page .rs-table th,
.rs-detail-table th {
  background: var(--color-surface);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm, 13px);
  font-weight: 500;
  white-space: nowrap;
}

.review-summary-page .rs-table td.rs-numeric,
.review-summary-page .rs-table th:nth-child(3),
.review-summary-page .rs-table th:nth-child(4),
.review-summary-page .rs-table th:nth-child(5),
.review-summary-page .rs-table th:nth-child(6),
.review-summary-page .rs-table th:nth-child(7),
.review-summary-page .rs-table th:nth-child(10) {
  text-align: right;
}

.review-summary-page .rs-status-badge {
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

.review-summary-page .rs-status-badge[data-status='generated'] {
  border-color: var(--color-success-subtle);
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.review-summary-page .rs-link-action {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: var(--text-sm, 13px);
  font-weight: 500;
  cursor: pointer;
}

.review-summary-page .rs-link-action:disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.review-summary-page .rs-pagination {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 0;
}

.review-summary-page .rs-pagination button,
.review-summary-page .rs-pagination span {
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

.review-summary-page .rs-pagination button {
  cursor: pointer;
}

.review-summary-page .rs-pagination button.active {
  background: var(--color-primary);
  color: var(--color-surface);
}

.review-summary-page .rs-pagination button:disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.review-summary-page .rs-empty-state {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 24px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.review-summary-page .rs-empty-state strong {
  color: var(--color-text-secondary);
}

.rs-detail-layer {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, var(--color-text) 18%, transparent);
}

.rs-detail-modal {
  width: min(720px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}

.rs-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  border-bottom: 1px solid var(--color-border-subtle);
  padding: 0 20px;
}

.rs-detail-header h2 {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--text-md, 16px);
  font-weight: 500;
}

.rs-detail-header button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--text-2xl, 24px);
  cursor: pointer;
}

.rs-detail-body {
  max-height: calc(100vh - 112px);
  overflow-y: auto;
  padding: 20px;
}

.rs-detail-product h3,
.rs-detail-section h3 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-base, 14px);
  font-weight: 500;
  line-height: 1.6;
}

.rs-detail-product p {
  margin: 12px 0 0;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm, 13px);
  line-height: 1.5;
}

.rs-summary-text {
  margin: 12px 0 16px;
  border: 1px solid var(--color-primary-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
  background: var(--color-primary-subtle);
  color: var(--color-text-secondary);
  font-size: var(--text-sm, 13px);
  line-height: 1.7;
}

.rs-detail-section + .rs-detail-section {
  margin-top: 24px;
}

.rs-dimension-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.rs-dimension-tags span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  padding: 0 8px;
  background: var(--color-bg-subtle);
  color: var(--color-text-secondary);
  font-size: var(--text-sm, 13px);
}

.rs-dimension-tags span[data-tone='positive'] {
  border-color: var(--color-success-subtle);
  background: var(--color-success-subtle);
  color: var(--color-success);
}

.rs-dimension-tags span[data-tone='neutral'] {
  border-color: var(--color-primary-subtle);
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.rs-dimension-tags span[data-tone='warning'] {
  border-color: var(--color-warning-subtle);
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}

.rs-detail-table-scroll {
  margin-top: 12px;
  overflow-x: auto;
}

.rs-detail-table {
  width: 100%;
  min-width: 0;
  border-collapse: collapse;
  border: 1px solid var(--color-border-subtle);
  font-size: var(--text-sm, 13px);
}

.rs-detail-table th,
.rs-detail-table td {
  height: 40px;
}

.rs-detail-table th:nth-child(2),
.rs-detail-table th:nth-child(3),
.rs-detail-table td:nth-child(2),
.rs-detail-table td:nth-child(3) {
  text-align: center;
}

@container (max-width: 1039px) {
  .review-summary-page .rs-filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (max-width: 719px) {
  .review-summary-page .rs-filter-form {
    grid-template-columns: minmax(0, 1fr);
  }

  .rs-detail-layer {
    padding: 12px;
  }

  .rs-detail-modal {
    max-height: calc(100vh - 24px);
  }
}

.rs-filter-panel > :deep(.content-section-header) {
  margin-bottom: 16px;
}
.rs-filter-item--range {
  grid-column: span 2;
}
.rs-filter-actions {
  flex-wrap: wrap;
}
.rs-filter-actions .btn {
  min-height: 36px;
  font-size: var(--text-sm, 13px);
}
.review-summary-page .rs-table th {
  height: 40px;
  font-size: var(--text-xs, 12px);
  /* Override only the inherited global th weight lock for this new table. */
  font-weight: var(--font-weight-medium, 500) !important;
  background: var(--color-bg-subtle);
}
.review-summary-page .rs-table td {
  box-sizing: border-box;
  height: 48px;
  font-variant-numeric: tabular-nums;
}
.rs-table th,
.review-summary-page .rs-table td {
  border-right: 0;
}
.review-summary-page .rs-table tr:hover td {
  background: var(--color-bg-subtle);
}
.rs-table th:last-child,
.review-summary-page .rs-table td:last-child {
  position: sticky;
  right: 0;
  text-align: right;
  background: var(--color-surface);
  box-shadow: -1px 0 0 var(--color-border-subtle);
}
.rs-pagination {
  margin: 0;
}
@container (max-width: 719px) {
  .rs-filter-actions {
    grid-column: auto;
    justify-content: flex-start;
  }
  .rs-filter-item--range {
    grid-column: auto;
  }
}

.rs-table th:nth-child(6),
.rs-table th:nth-child(7),
.rs-table td:nth-child(6),
.rs-table td:nth-child(7) {
  text-align: right;
}

@container (max-width: 719px) {
  .review-summary-page .rs-filter-actions { grid-column: auto; justify-content: flex-start; }
}

</style>
