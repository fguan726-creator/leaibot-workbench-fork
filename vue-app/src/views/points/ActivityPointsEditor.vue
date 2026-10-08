<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SectionHeader from '@/components/content/SectionHeader.vue'
import PointsDialog from './PointsDialog.vue'
import {
  activeProducts,
  checkProductCodes,
  checkExcludedProductCodes,
  products,
  payoutDate,
  validateActivity,
  type Activity,
  type ProductCodeCheck
} from '@/services/activityPoints'
const props = defineProps<{ initial: Activity; date: string }>()
const emit = defineEmits<{ close: []; save: [activity: Activity] }>()
const activity = ref<Activity>(JSON.parse(JSON.stringify(props.initial)) as Activity)
const codeInput = ref(props.initial.codes.join(','))
const codeCheck = ref<ProductCodeCheck | null>(null)
const codeField = ref<HTMLTextAreaElement | null>(null)
const excludedInput = ref(props.initial.excluded.join(','))
const excludedCheck = ref<ProductCodeCheck | null>(null)
const excludedField = ref<HTMLTextAreaElement | null>(null)
const filteredProductCount = computed(() => {
  const result = checkExcludedProductCodes(excludedInput.value)
  return result.error ? null : activeProducts({ ...activity.value, excluded: result.codes }).length
})
const error = ref('')
const discard = ref(false)
const dirty = computed(
  () =>
    JSON.stringify(activity.value) !== JSON.stringify(props.initial) ||
    codeInput.value !== props.initial.codes.join(',') ||
    excludedInput.value !== props.initial.excluded.join(',')
)
watch([codeInput, () => activity.value.productMode], () => {
  codeCheck.value = null
})
watch([excludedInput, () => activity.value.productMode], () => {
  excludedCheck.value = null
})
function detectCodes() {
  codeCheck.value = checkProductCodes(codeInput.value)
  return codeCheck.value
}
function detectExcludedCodes() {
  excludedCheck.value = checkExcludedProductCodes(excludedInput.value)
  return excludedCheck.value
}
const previousMode = ref<Activity['mode']>(props.initial.mode)
const draftTiers: Record<Activity['mode'], Activity['tiers']> = {
  quantity:
    props.initial.mode === 'quantity'
      ? props.initial.tiers.map((tier) => ({ ...tier }))
      : [{ threshold: 10, multiplier: 5 }],
  amount:
    props.initial.mode === 'amount'
      ? props.initial.tiers.map((tier) => ({ ...tier }))
      : [{ threshold: 50000, multiplier: 5 }]
}
const planned = computed(() => {
  try {
    return activity.value.end && activity.value.delay > 0 && activity.value.delay <= 90
      ? payoutDate(activity.value)
      : '待填写'
  } catch {
    return '待填写有效日期'
  }
})
function close() {
  if (dirty.value) discard.value = true
  else emit('close')
}
function changeMode() {
  draftTiers[previousMode.value] = activity.value.tiers.map((tier) => ({ ...tier }))
  activity.value.tiers = draftTiers[activity.value.mode].map((tier) => ({ ...tier }))
  previousMode.value = activity.value.mode
}
function save(draft: boolean) {
  error.value = ''
  let codes = activity.value.codes
  let excluded = activity.value.excluded
  if (activity.value.productMode === 'codes') {
    const result = detectCodes()
    if (result.error) {
      codeField.value?.focus()
      return
    }
    codes = result.codes
  } else {
    const result = detectExcludedCodes()
    if (result.error) {
      excludedField.value?.focus()
      return
    }
    excluded = result.codes
  }
  const value: Activity = {
    ...activity.value,
    codes,
    excluded: activity.value.productMode === 'codes' ? [] : excluded,
    name: activity.value.name.trim(),
    draft,
    updated: props.date,
    logs: [
      `${props.date} · 演示运营员 · ${draft ? '保存草稿' : '保存并启用'}配置`,
      ...activity.value.logs
    ]
  }
  error.value =
    validateActivity(value) ||
    (!draft && value.start < props.date ? '开始日期不得早于当前演示日期' : '')
  if (draft && !props.initial.draft) error.value = '已启用活动不能直接撤回草稿'
  if (!error.value) emit('save', value)
}
</script>
<template>
  <PointsDialog
    :title="initial.name ? '编辑活动' : '新增活动'"
    description="按企业统一累计，积分补至各下单账号。所有配置仅用于演示。"
    wide
    @close="close"
  >
    <div class="points-form-flow">
      <section class="points-section">
        <SectionHeader title="基本信息" />
        <div class="points-fields">
          <label class="points-field points-field-full">活动名称（必填）<input
            v-model="activity.name"
            class="form-input"
            maxlength="50"
            placeholder="例如：双11企业采购积分加磅"
            required
          /></label>
          <label class="points-field">开始日期（必填）<input
            v-model="activity.start"
            class="form-input"
            type="date"
            required
          /></label>
          <label class="points-field">结束日期（必填）<input
            v-model="activity.end"
            class="form-input"
            type="date"
            :min="activity.start"
            required
          /></label>
          <label class="points-field">积分渠道<input class="form-input" value="企业购积分" readonly /></label><label class="points-field">统计主体<input class="form-input" value="企业 · 多个 Lenovo ID 合并累计" readonly/></label>
        </div>
      </section>
      <section class="points-section">
        <SectionHeader title="参与商品" /><label class="points-field">商品选择方式<select v-model="activity.productMode" class="form-input">
          <option value="codes">按商品编码选择</option>
          <option value="filter">FA 与产品组取交集</option>
        </select></label>
        <div v-if="activity.productMode === 'codes'" class="points-code-entry">
          <label class="points-field">商品编码（必填）<textarea
            ref="codeField"
            v-model="codeInput"
            class="form-input points-code-input"
            rows="3"
            placeholder="例如：DEMO-TP14,DEMO-TC90"
            :aria-invalid="Boolean(codeCheck?.error)"
            aria-describedby="points-code-help points-code-result"
            required
          /></label>
          <div class="points-actions">
            <button class="btn btn-primary" type="button" @click="detectCodes">检测商品编码</button>
            <p id="points-code-help" class="points-muted">
              最多 1000 个，以英文逗号分隔，不能含空格或换行。
            </p>
          </div>
          <p
            id="points-code-result"
            class="points-code-feedback"
            :class="{ 'points-code-error': codeCheck?.error }"
            aria-live="polite"
          >
            {{
              codeCheck
                ? codeCheck.error || `检测通过：${codeCheck.codes.length} 个有效商品，${codeCheck.duplicateCount} 个重复编码已去重。`
                : '请输入或修改商品编码后进行检测。'
            }}
          </p>
          <p class="points-muted points-code-examples">
            演示编码：{{ products.map((product) => product.code).join(',') }}
          </p>
        </div>
        <div v-else class="points-fields">
          <label class="points-field">FA<select v-model="activity.fa" class="form-input">
            <option v-for="fa in ['全部', 'ThinkPad', 'ThinkCentre', 'ThinkBook']" :key="fa">
              {{ fa }}
            </option>
          </select></label><label class="points-field">产品组<select v-model="activity.group" class="form-input">
            <option v-for="group in ['全部', '笔记本', '台式机']" :key="group">
              {{ group }}
            </option>
          </select></label>
        </div>
        <div v-if="activity.productMode === 'filter'" class="points-code-entry">
          <label class="points-field">排除商品编码（选填）<textarea
            ref="excludedField"
            v-model="excludedInput"
            class="form-input points-code-input"
            rows="3"
            placeholder="例如：DEMO-TP14,DEMO-CTO"
            :aria-invalid="Boolean(excludedCheck?.error)"
            aria-describedby="points-excluded-help points-excluded-result"
          /></label>
          <div class="points-actions">
            <button class="btn btn-primary" type="button" @click="detectExcludedCodes">检测排除商品编码</button>
            <p id="points-excluded-help" class="points-muted">
              可留空；最多 1000 个，以英文逗号分隔，不能含空格或换行。
            </p>
          </div>
          <p
            id="points-excluded-result"
            class="points-code-feedback"
            :class="{ 'points-code-error': excludedCheck?.error }"
            aria-live="polite"
          >
            {{
              excludedCheck
                ? excludedCheck.error || (excludedCheck.codes.length
                  ? `检测通过：${excludedCheck.codes.length} 个排除商品，${excludedCheck.duplicateCount} 个重复编码已去重。`
                  : '未配置排除商品。')
                : '留空表示不排除商品；填写后请检测。'
            }}
          </p>
          <p class="points-muted points-code-examples">
            演示编码：{{ products.map((product) => product.code).join(',') }}
          </p>
        </div>
        <p v-if="activity.productMode === 'filter'" class="points-muted">
          {{ filteredProductCount === null
            ? '排除商品编码待校验，暂不展示参与商品数量。'
            : `最终参与 ${filteredProductCount} 个商品，重复命中只计一次。` }}
        </p>
        <div class="points-notice">
          沿用既有发放资格。演示含黑名单、CTO
          和签收校验；发票、经销商等条件清单及判断时点待业务确认。
        </div>
      </section>
      <section class="points-section">
        <SectionHeader title="累计方式与档位" /><label class="points-field">累计方式<select v-model="activity.mode" class="form-input" @change="changeMode">
          <option value="quantity">满台数</option>
          <option value="amount">满金额</option>
        </select></label>
        <div v-for="(tier, index) in activity.tiers" :key="index" class="points-tier-row">
          <label class="points-field">第 {{ index + 1 }} 档门槛（{{ activity.mode === 'quantity' ? '台' : '元' }}）<input
            v-model.number="tier.threshold"
            class="form-input"
            type="number"
            :min="activity.mode === 'quantity' ? 1 : 0.01"
            :step="activity.mode === 'quantity' ? 1 : 0.01"
          /></label><label class="points-field">最终总倍数<input
            v-model.number="tier.multiplier"
            class="form-input"
            type="number"
            min="1"
            step="1"
          /></label><button
            class="btn btn-secondary"
            type="button"
            :aria-label="`删除第 ${index + 1} 档`"
            :disabled="activity.tiers.length === 1"
            @click="activity.tiers.splice(index, 1)"
          >
            删除
          </button>
        </div>
        <div>
          <button
            class="btn btn-secondary"
            type="button"
            @click="activity.tiers.push({ threshold: 0, multiplier: 0 })"
          >
            增加档位
          </button>
        </div>
        <p class="points-muted">
          演示采用单一累计方式、含门槛、命中最高档且不叠加；正式择档口径待确认。
        </p>
      </section>
      <section class="points-section">
        <SectionHeader title="发放安排" />
        <div class="points-fields">
          <label class="points-field">活动结束后延迟天数<input
            v-model.number="activity.delay"
            class="form-input"
            type="number"
            min="1"
            max="90"
          /></label><label class="points-field">日历类型<select v-model="activity.calendar" class="form-input">
            <option value="natural">自然日</option>
            <option value="weekday">周一至周五（演示）</option>
          </select></label>
        </div>
        <div class="points-notice">
          <strong>计划发放：{{ planned }} 10:00</strong>
          <p>第 N 日统一处理仅为演示口径；实际发放时间、节假日与调休日历待业务确认。</p>
        </div>
        <label class="points-field">发放说明<input v-model="activity.description" class="form-input" maxlength="200"/></label>
      </section>
      <p v-if="error" class="points-notice points-danger" role="alert">{{ error }}</p>
      <div v-if="discard" class="points-notice points-warning" role="alert">
        <p>配置尚未保存，关闭将放弃本次修改。</p>
        <div class="points-actions">
          <button class="btn btn-secondary" @click="discard = false">继续编辑</button><button class="btn btn-danger" @click="emit('close')">放弃修改</button>
        </div>
      </div>
    </div>
    <template #actions><button class="btn btn-secondary" @click="close">取消</button><button v-if="initial.draft" class="btn btn-secondary" @click="save(true)">保存草稿</button><button class="btn btn-primary" @click="save(false)">保存并启用</button></template>
  </PointsDialog>
</template>
<style scoped src="./points.css"></style>
