<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import ContentPageHeader from '@/components/content/ContentPageHeader.vue'
import ContentTabs from '@/components/content/ContentTabs.vue'
import DataTable from '@/components/content/DataTable.vue'
import ListSurface from '@/components/content/ListSurface.vue'
import MetricGrid from '@/components/content/MetricGrid.vue'
import MetricCard from '@/components/content/MetricCard.vue'
import Pagination from '@/components/content/Pagination.vue'
import FeedbackState from '@/components/content/FeedbackState.vue'
import StatusTag from '@/components/content/StatusTag.vue'
import PointsDialog from './PointsDialog.vue'
import { useActivityPointsDemo, exportPointsCsv } from './useActivityPointsDemo'
import { canUseActivityPoints } from '@/services/activityPointsAccess'
import { activityStatus, payoutDate, ordersFor, number as n } from '@/services/activityPoints'
import {
  buildActivityStatistics,
  filterStatistics,
  summarizeStatistics,
  groupStatistics,
  statisticsStatuses,
  type StatisticsFilters,
  type StatisticsRow,
  type StatisticsGroup
} from '@/services/activityPointsStatistics'

const app = useAppStore()
const route = useRoute()
const { state, storageNotice } = useActivityPointsDemo()
const canView = computed(() => canUseActivityPoints(app.user, app.role, app.permissions))
const canExport = computed(() =>
  canUseActivityPoints(app.user, app.role, app.permissions, 'export')
)
const initialActivity = () =>
  state.activities.find((a) => !a.draft && a.start <= state.date)?.id ||
  state.activities[0]?.id ||
  ''
const activityId = ref(initialActivity())
const activity = computed(() => state.activities.find((a) => a.id === activityId.value))
const accumulating = computed(() => !!activity.value && state.date <= activity.value.end)
const activityPointsLabel = computed(() => accumulating.value ? '预计活动积分' : '应发活动积分')
const pendingPointsLabel = computed(() => accumulating.value ? '预计待发积分' : '待自动发放积分')
const plannedDate = computed(() => activity.value ? payoutDate(activity.value) : '—')
const emptyFilters = (): StatisticsFilters => ({
  enterprise: '',
  account: '',
  orderId: '',
  sku: '',
  start: '',
  end: '',
  status: ''
})
const filters = reactive<StatisticsFilters>(emptyFilters())
const drillEnterprise = ref('')
const drillAccount = ref('')
const advanced = ref(false)
const tab = ref('订单明细')
const tabs = ['企业统计', '账号明细', '订单明细'].map((key) => ({ key, label: key }))
const page = ref(1)
const detailKey = ref('')
const notice = ref('')
const dateError = computed(() =>
  filters.start && filters.end && filters.start > filters.end ? '付款开始日期不能晚于结束日期' : ''
)
const allRows = computed(() =>
  activity.value && canView.value
    ? buildActivityStatistics(activity.value, ordersFor(activity.value), state.records, state.date)
    : []
)
const rows = computed(() =>
  dateError.value
    ? []
    : filterStatistics(allRows.value, {
        ...filters,
        exactEnterprise: drillEnterprise.value,
        exactAccount: drillAccount.value
      })
)
const summary = computed(() => summarizeStatistics(rows.value))
const groups = computed(() =>
  groupStatistics(rows.value, tab.value === '企业统计' ? 'enterprise' : 'account')
)
const detail = computed(() => allRows.value.find((row) => row.key === detailKey.value))
const p = (value: number | null) => (value == null ? '待核对' : n(value))
const exact = (value: number | null) =>
  value == null ? '—' : value.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
const money = (value: number) =>
  `¥ ${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const targetValue = (row: StatisticsRow) =>
  row.eligible && row.targetPointsExact != null ? row.target : null
const tierLabel = (group: StatisticsGroup) =>
  group.multiplier ? `${group.multiplier} 倍` : '未达档'
const tableRows = computed<Array<Record<string, unknown>>>(() =>
  tab.value === '订单明细'
    ? rows.value.map((row) => ({
        key: row.key,
        name: row.id,
        secondary: row.account,
        enterprise: row.enterprise,
        product: row.sku,
        date: row.date,
        quantity: n(row.netQuantity),
        amount: money(row.netReceipt),
        multiplier: row.multiplier ? `${row.multiplier} 倍` : '—',
        target: row.eligible ? p(targetValue(row)) : '—',
        paid: p(row.actualPaid),
        required: row.eligible ? p(row.requiredPoints) : '—',
        posted: n(row.postedPoints),
        pending: n(row.pendingPoints),
        status: row.status,
        reason: row.reason
      }))
    : groups.value.map((group) => ({
        key: group.id,
        name: tab.value === '企业统计' ? group.enterprise : group.account,
        secondary: tab.value === '企业统计' ? group.enterpriseId : group.enterprise,
        count: `${group.summary.orderCount} 单 / ${group.summary.accountCount} 个账号`,
        quantity: n(group.summary.quantity),
        amount: money(group.summary.amount),
        multiplier: tierLabel(group),
        tierContext: `${n(group.enterpriseQuantity)} 台 / ${money(group.enterpriseAmount)}`,
        target: n(group.summary.target),
        paid: `${n(group.summary.actualPaid)}${group.summary.missingPaidCount ? '（部分）' : ''}`,
        required: n(group.summary.required),
        posted: n(group.summary.posted),
        pending: n(group.summary.pending),
        failed: n(group.summary.failed),
        exceptions: group.summary.exceptionCount
      }))
)
const paged = computed(() => tableRows.value.slice((page.value - 1) * 10, page.value * 10))
type Column = { key: string; label: string; align?: 'left' | 'right' }
const numeric = (key: string, label: string): Column => ({ key, label, align: 'right' })
const columns = computed<Column[]>(() =>
  tab.value === '订单明细'
    ? [
        { key: 'name', label: '订单号 / Lenovo ID' },
        { key: 'enterprise', label: '企业' },
        { key: 'product', label: '商品编码' },
        { key: 'date', label: '付款日期' },
        numeric('quantity', '有效台数'),
        numeric('amount', '实际收款金额'),
        numeric('multiplier', '积分倍数'),
        numeric('target', '应发总积分'),
        numeric('paid', '实际已发（其他）'),
        numeric('required', activityPointsLabel.value),
        numeric('posted', '已发活动积分'),
        numeric('pending', pendingPointsLabel.value),
        { key: 'status', label: '发放状态' },
        { key: 'actions', label: '操作' }
      ]
    : [
        { key: 'name', label: tab.value === '企业统计' ? '企业名称 / 标识' : 'Lenovo ID / 企业' },
        { key: 'count', label: '订单 / 账号' },
        numeric('quantity', '有效台数'),
        numeric('amount', '实际收款金额'),
        numeric('multiplier', '企业活动档位'),
        numeric('target', '可计算应发'),
        numeric('paid', '实际已发（其他）'),
        numeric('required', activityPointsLabel.value),
        numeric('posted', '已发活动积分'),
        numeric('pending', pendingPointsLabel.value),
        numeric('failed', '失败积分'),
        numeric('exceptions', '计算异常'),
        { key: 'actions', label: '操作' }
      ]
)
function resetFilters() {
  Object.assign(filters, emptyFilters())
  drillEnterprise.value = ''
  drillAccount.value = ''
  page.value = 1
  notice.value = ''
}
function openRow(key: unknown) {
  if (tab.value === '订单明细') {
    detailKey.value = String(key)
    return
  }
  const group = groups.value.find((item) => item.id === key)
  if (!group) return
  drillEnterprise.value = group.enterpriseId
  drillAccount.value = tab.value === '账号明细' ? group.account : ''
  tab.value = tab.value === '企业统计' ? '账号明细' : '订单明细'
}
function clearDrill() {
  if (drillAccount.value) {
    drillAccount.value = ''
    tab.value = '账号明细'
  } else {
    drillEnterprise.value = ''
    tab.value = '企业统计'
  }
}
function exportDetails() {
  if (!canExport.value) {
    notice.value = '当前账号没有明细导出权限。'
    return
  }
  if (!activity.value || dateError.value || !rows.value.length) return
  exportPointsCsv(
    `${activity.value.name}-活动积分明细`,
    [
      '活动编号',
      '活动名称',
      '企业标识',
      '企业名称',
      '订单号',
      '商品编码',
      'Lenovo ID',
      '数量',
      '退货件数',
      '实际成交件数',
      '收款金额',
      '退款金额',
      '实际收款金额',
      '积分倍数',
      '基础积分（未取整计算值）',
      '应发放总积分（不舍小数点）',
      '应发放总积分',
      '实际已发积分（其他）',
      activityPointsLabel.value,
      '已发活动积分',
      pendingPointsLabel.value,
      '发放失败积分',
      '发放状态',
      '异常或排除原因',
      '付款日期',
      '备注',
      '邮件审批时间',
      '发票类型',
      '处理时间',
      '发放批次',
      '积分流水号',
      '计划自动发放日期',
      '统计截止日期'
    ],
    rows.value.map((row) => [
      row.activityId,
      row.activityName,
      row.enterpriseId,
      row.enterprise,
      row.id,
      row.sku,
      row.account,
      row.quantity,
      row.returned,
      row.netQuantity,
      row.receipt,
      row.refund,
      row.netReceipt,
      row.multiplier,
      row.basePointsExact,
      row.targetPointsExact ?? '未计算',
      targetValue(row) ?? '未计算',
      row.actualPaid ?? '待核对',
      row.eligible ? (row.requiredPoints ?? '待核对') : '不适用',
      row.postedPoints,
      row.pendingPoints,
      row.failedPoints,
      row.status,
      row.reason,
      row.date,
      activity.value?.description || '',
      '未记录',
      '未记录',
      row.record?.time || '',
      row.record?.batch || '',
      row.record?.transaction || '',
      plannedDate.value,
      state.date
    ])
  )
  notice.value = `已导出当前筛选的全部 ${rows.value.length} 条订单计算明细，可用 Excel 打开。`
}
watch(
  () => route.query.activity,
  (value) => {
    if (typeof value === 'string' && state.activities.some((a) => a.id === value))
      activityId.value = value
  },
  { immediate: true }
)
watch(activityId, () => {
  resetFilters()
  detailKey.value = ''
})
watch(tab, (value) => {
  if (value === '企业统计') {
    drillEnterprise.value = ''
    drillAccount.value = ''
  } else if (value === '账号明细') drillAccount.value = ''
})
watch(
  [filters, drillEnterprise, drillAccount, tab],
  () => {
    page.value = 1
    notice.value = ''
  },
  { deep: true }
)
watch(
  () => tableRows.value.length,
  () => {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(tableRows.value.length / 10)))
  }
)
</script>

<template>
  <section class="points-page" data-page="points.activityDetails">
    <div class="points-flow" data-composition="summary-list">
      <ContentPageHeader
        title="活动积分明细"
        description="活动期间累计积分，结束后由系统按计划自动发放。"
      >
        <template #actions>
          <button
            v-if="canExport"
            class="btn btn-primary"
            :disabled="!rows.length || !!dateError"
            @click="exportDetails"
          >
            导出明细
          </button>
        </template>
      </ContentPageHeader>
      <FeedbackState
        v-if="!canView"
        state="no-permission"
        title="暂无活动积分查看权限"
        description="请联系管理员开通积分查看权限。"
      />
      <template v-else>
        <div class="points-demo-strip">
          <div>
            <strong>演示数据 · 不产生真实积分</strong><span class="points-secondary">统计截至 {{ state.date }}，与活动配置共享本浏览器内的演示记录。</span>
            <span v-if="activity" class="points-secondary">计划自动发放：{{ plannedDate }}。{{ accumulating ? '当前为预计积分，最终以活动结束后的结算结果为准。' : '系统按计划统一发放至原下单账号。' }}</span>
          </div>
          <span class="points-muted">单活动统计 · 筛选不改变企业档位</span>
        </div>
        <p v-if="storageNotice.message" class="points-notice points-warning" role="status">
          {{ storageNotice.message }}
        </p>
        <div class="points-list-workspace" data-flow-role="list-workspace">
          <div class="points-filter">
            <div class="points-filter-grid">
              <label class="points-field">活动<select v-model="activityId" class="form-input">
                <option v-for="item in state.activities" :key="item.id" :value="item.id">
                  {{ item.name }}（{{ activityStatus(item, state.date) }}）
                </option>
              </select></label>
              <label class="points-field">企业名称 / 标识<input
                v-model="filters.enterprise"
                class="form-input"
                type="search"
                placeholder="输入企业名称或标识"
              /></label>
              <label class="points-field">Lenovo ID<input
                v-model="filters.account"
                class="form-input"
                type="search"
                placeholder="输入下单账号"
              /></label>
              <label class="points-field">订单号<input
                v-model="filters.orderId"
                class="form-input"
                type="search"
                placeholder="输入订单号"
              /></label>
              <template v-if="advanced">
                <label class="points-field">商品编码<input
                  v-model="filters.sku"
                  class="form-input"
                  type="search"
                  placeholder="输入商品编码"
                /></label>
                <label class="points-field">付款开始日期<input v-model="filters.start" class="form-input" type="date"/></label>
                <label class="points-field">付款结束日期<input v-model="filters.end" class="form-input" type="date"/></label>
                <label class="points-field">发放状态<select v-model="filters.status" class="form-input">
                  <option value="">全部状态</option>
                  <option v-for="status in statisticsStatuses" :key="status">{{ status }}</option>
                </select></label>
              </template>
              <div class="points-actions points-filter-actions">
                <span class="points-muted">条件变更后实时筛选</span>
                <button class="points-link" :aria-expanded="advanced" @click="advanced = !advanced">
                  {{ advanced ? '收起筛选' : '更多筛选' }}
                </button>
                <button class="btn btn-secondary" @click="resetFilters">重置筛选</button>
              </div>
            </div>
            <p v-if="dateError" class="points-code-error" role="alert">{{ dateError }}</p>
          </div>
          <MetricGrid data-flow-role="summary">
            <MetricCard
              :label="activityPointsLabel"
              :value="n(summary.required)"
              unit="分"
              primary
              :meta="accumulating ? '按当前累计档位预估' : '按结算结果自动发放'"
            />
            <MetricCard
              label="已发活动积分"
              :value="n(summary.posted)"
              unit="分"
              meta="按成功积分流水统计"
            />
            <MetricCard
              :label="pendingPointsLabel"
              :value="n(summary.pending)"
              unit="分"
              :meta="accumulating ? '活动结束后统一核算' : '系统按计划发放，失败与异常单列'"
            />
            <MetricCard
              label="发放失败"
              :value="n(summary.failed)"
              unit="分"
              :meta="`${summary.exceptionCount} 条计算异常 · ${summary.excludedCount} 条不参与`"
            />
          </MetricGrid>
          <p v-if="notice" class="points-notice" role="status">{{ notice }}</p>
          <ListSurface>
            <template #tabs><ContentTabs v-model="tab" :items="tabs" label="积分统计层级"/></template>
            <template #toolbar>
              <div class="points-toolbar">
                <span class="points-muted">当前筛选：{{ summary.enterpriseCount }} 家企业 ·
                  {{ summary.accountCount }} 个账号 · {{ summary.orderCount }} 个订单 · 有效
                  {{ n(summary.quantity) }} 台 · 有效实收 {{ money(summary.amount) }}</span>
                <button
                  v-if="drillEnterprise || drillAccount"
                  class="points-link"
                  @click="clearDrill"
                >
                  {{ drillAccount ? '返回账号列表' : '返回企业列表' }}
                </button>
              </div>
              <p v-if="drillEnterprise" class="points-muted">
                下钻范围：{{
                  allRows.find((row) => row.enterpriseId === drillEnterprise)?.enterprise
                }}{{ drillAccount ? ` / ${drillAccount}` : '' }}
              </p>
              <p class="points-muted">
                可计算应发 {{ n(summary.target) }} 分 · 实际已发（其他已知）{{ n(summary.actualPaid) }} 分。汇总包含筛选后的全部记录，企业档位按活动完整范围计算。
              </p>
              <p v-if="summary.missingPaidCount" class="points-code-error">
                {{ summary.missingPaidCount }}
                条实际已发记录缺失，已发合计仅含已知部分；异常订单暂停自动发放。
              </p>
            </template>
            <div role="tabpanel" :aria-label="tab">
              <DataTable
                v-if="paged.length"
                :columns="columns"
                :rows="paged"
                row-key="key"
                :caption="`活动积分明细 — ${tab}`"
                density="two-line"
              >
                <template #cell-name="{ row }"><button class="points-link points-name" @click="openRow(row.key)">
                  {{ row.name }}</button><small class="points-secondary">{{ row.secondary }}</small></template>
                <template #cell-multiplier="{ row }"><span class="points-numeric">{{ row.multiplier }}</span><small v-if="row.tierContext" class="points-secondary">活动累计 {{ row.tierContext }}</small></template>
                <template #cell-status="{ row }"><StatusTag
                  :tone="
                    row.status === '已发放'
                      ? 'success'
                      : row.status === '发放失败'
                        ? 'danger'
                        : row.status === '计算异常'
                          ? 'warning'
                          : 'neutral'
                  "
                >{{ row.status }}</StatusTag><small v-if="row.reason" class="points-secondary">{{
                  row.reason
                }}</small></template>
                <template #cell-actions="{ row }"><button class="points-link" @click="openRow(row.key)">
                  {{
                    tab === '企业统计' ? '查看账号' : tab === '账号明细' ? '查看订单' : '计算详情'
                  }}
                </button></template>
              </DataTable>
              <FeedbackState
                v-else
                :state="dateError ? 'error' : 'filtered-empty'"
                :title="dateError || '暂无符合条件的积分明细'"
                description="请调整活动或筛选条件。待开始活动尚无统计期内订单。"
              ><template #action><button class="btn btn-secondary" @click="resetFilters">
                重置筛选
              </button></template></FeedbackState>
            </div>
            <template #pagination><Pagination v-model:page="page" :page-size="10" :total="tableRows.length"/></template>
          </ListSurface>
        </div>
      </template>
    </div>
    <PointsDialog
      v-if="detail && canView"
      title="订单积分计算详情"
      :description="`${detail.activityName} · ${detail.id}`"
      wide
      @close="detailKey = ''"
    >
      <div class="points-form-flow">
        <StatusTag
          :tone="
            detail.status === '计算异常' || detail.status === '发放失败' ? 'warning' : 'primary'
          "
        >{{ detail.status }}</StatusTag>
        <p v-if="detail.reason" class="points-notice points-warning">{{ detail.reason }}</p>
        <dl class="points-definition">
          <dt>企业 / 标识</dt>
          <dd>{{ detail.enterprise }} / {{ detail.enterpriseId }}</dd>
          <dt>Lenovo ID</dt>
          <dd>{{ detail.account }}</dd>
          <dt>订单号 / 商品编码</dt>
          <dd>{{ detail.id }} / {{ detail.sku }}</dd>
          <dt>付款日期</dt>
          <dd>{{ detail.date }}</dd>
          <dt>购买 / 退货 / 成交</dt>
          <dd>
            {{ n(detail.quantity) }} / {{ n(detail.returned) }} / {{ n(detail.netQuantity) }} 件
          </dd>
          <dt>收款 / 退款</dt>
          <dd>{{ money(detail.receipt) }} / {{ money(detail.refund) }}</dd>
          <dt>实际收款金额</dt>
          <dd>{{ money(detail.netReceipt) }}</dd>
          <dt>企业活动累计</dt>
          <dd>{{ n(detail.enterpriseQuantity) }} 台 / {{ money(detail.enterpriseAmount) }}</dd>
          <dt>积分倍数</dt>
          <dd>{{ detail.multiplier ? `${detail.multiplier} 倍` : '未达档或不参与' }}</dd>
          <dt>基础积分（未取整）</dt>
          <dd>{{ exact(detail.basePointsExact) }}</dd>
          <dt>应发总积分（未取整）</dt>
          <dd>{{ exact(detail.targetPointsExact) }}</dd>
          <dt>应发总积分（取整）</dt>
          <dd>{{ targetValue(detail) == null ? '未计算' : n(detail.target) }}</dd>
          <dt>实际已发（其他）</dt>
          <dd>
            {{ p(detail.actualPaid) }}<small class="points-secondary">不包含本活动已补积分</small>
          </dd>
          <dt>{{ activityPointsLabel }}</dt>
          <dd>{{ detail.eligible ? p(detail.requiredPoints) : '不适用' }}</dd>
          <dt>已发活动积分</dt>
          <dd>{{ n(detail.postedPoints) }}</dd>
          <dt>{{ pendingPointsLabel }} / 失败积分</dt>
          <dd>{{ n(detail.pendingPoints) }} / {{ n(detail.failedPoints) }}</dd>
          <dt>备注</dt>
          <dd>{{ activity?.description || '未填写' }}</dd>
          <dt>邮件审批时间</dt>
          <dd>未记录</dd>
          <dt>发票类型</dt>
          <dd>未记录</dd>
          <dt>计划自动发放</dt>
          <dd>{{ plannedDate }}</dd>
          <dt>发放时间 / 批次</dt>
          <dd>{{ detail.record?.time || '暂无发放记录' }} / {{ detail.record?.batch || '—' }}</dd>
          <dt>积分流水号</dt>
          <dd>{{ detail.record?.transaction || '—' }}</dd>
        </dl>
        <div class="points-calculation">
          <p v-if="!detail.eligible">
            此订单不参与本活动，保留原始金额与已发记录供核对，不计入活动累计和应补。
          </p>
          <p v-else-if="!detail.multiplier">
            {{ accumulating ? '当前未达活动档位，活动期间继续累计，最终以活动结束后的结算结果为准。' : '企业未达活动档位，沿用原实际已发积分，本活动无需发放。' }}
          </p>
          <p v-else>基础积分＝实际收款金额 ÷ 100；应发总积分＝基础积分 × 积分倍数，再舍去小数。</p>
          <p v-if="detail.eligible && detail.multiplier">
            活动积分＝应发总积分 − 实际已发（其他）。{{ accumulating ? '当前为预计值，系统将在活动结束后统一核算并按计划自动发放。' : '未到账积分由系统按计划自动发放，失败和计算异常分别列示。' }}
          </p>
        </div>
      </div>
      <template #actions><button class="btn btn-secondary" @click="detailKey = ''">关闭</button></template>
    </PointsDialog>
  </section>
</template>
<style scoped src="./points.css"></style>
