export type Tier = { threshold: number; multiplier: number }
export type Activity = {
  id: string
  name: string
  start: string
  end: string
  mode: 'quantity' | 'amount'
  tiers: Tier[]
  draft: boolean
  productMode: 'codes' | 'filter'
  codes: string[]
  fa: string
  group: string
  excluded: string[]
  delay: number
  calendar: 'natural' | 'weekday'
  description: string
  updated: string
  logs: string[]
}
export type Order = {
  id: string
  enterprise: string
  enterpriseId: string
  account: string
  sku: string
  quantity: number
  returned: number
  receipt: number
  refund: number
  paidBase: number | null
  paidMember: number | null
  date: string
  signed: boolean
  exclusion?: string
}
export type RecordItem = {
  key: string
  orderId: string
  account: string
  points: number
  status: '成功' | '失败'
  time: string
  batch: string
  transaction: string
  attempts: number
  reason: string
  history: string[]
}
// Fixed demo date: this does not drive real settlement jobs.
export const TODAY = '2026-09-16'
export const products = [
  { code: 'DEMO-TP14', name: 'ThinkPad T14 商用笔记本', fa: 'ThinkPad', group: '笔记本' },
  { code: 'DEMO-TC90', name: 'ThinkCentre M90 商用台式机', fa: 'ThinkCentre', group: '台式机' },
  { code: 'DEMO-TB16', name: 'ThinkBook 16 商用笔记本', fa: 'ThinkBook', group: '笔记本' },
  { code: 'DEMO-CTO', name: '定制配置设备（CTO）', fa: 'ThinkPad', group: '笔记本' }
]
const common = {
  productMode: 'codes' as const,
  codes: ['DEMO-TP14', 'DEMO-TC90', 'DEMO-TB16'],
  fa: '全部',
  group: '全部',
  excluded: ['DEMO-CTO'],
  delay: 20,
  calendar: 'natural' as const,
  description: '活动积分补发',
  updated: TODAY,
  logs: ['2026-09-07 · 运营管理员 · 创建演示活动']
}
export const seedActivities: Activity[] = [
  {
    ...common,
    id: 'ACT202609001',
    name: '秋季采购积分加磅',
    start: '2026-09-07',
    end: '2026-10-15',
    mode: 'quantity',
    tiers: [
      { threshold: 10, multiplier: 5 },
      { threshold: 50, multiplier: 7 },
      { threshold: 100, multiplier: 10 }
    ],
    draft: false
  },
  {
    ...common,
    id: 'ACT202611001',
    name: '双11企业采购回馈',
    start: '2026-10-21',
    end: '2026-11-11',
    mode: 'quantity',
    tiers: [
      { threshold: 10, multiplier: 10 },
      { threshold: 20, multiplier: 15 },
      { threshold: 50, multiplier: 20 }
    ],
    draft: false
  },
  {
    ...common,
    id: 'ACT202608001',
    name: '8月采购加磅',
    start: '2026-08-01',
    end: '2026-08-20',
    mode: 'quantity',
    tiers: [
      { threshold: 10, multiplier: 5 },
      { threshold: 50, multiplier: 7 },
      { threshold: 100, multiplier: 10 }
    ],
    draft: false
  },
  {
    ...common,
    id: 'ACT202610002',
    name: '季度满额积分礼',
    start: '2026-10-01',
    end: '2026-10-31',
    mode: 'amount',
    tiers: [
      { threshold: 50000, multiplier: 5 },
      { threshold: 200000, multiplier: 7 }
    ],
    draft: true
  }
]
export function activityStatus(a: Activity, date = TODAY) {
  return a.draft ? '草稿' : date < a.start ? '待开始' : date <= a.end ? '进行中' : '已结束'
}
export function payoutDate(a: Pick<Activity, 'end' | 'delay' | 'calendar'>) {
  const d = new Date(a.end + 'T00:00:00Z')
  let n = 0
  while (n < a.delay) {
    d.setUTCDate(d.getUTCDate() + 1)
    if (a.calendar === 'natural' || ![0, 6].includes(d.getUTCDay())) n++
  }
  return d.toISOString().slice(0, 10)
}
export function activeProducts(a: Activity) {
  return products.filter(
    (p) =>
      (a.productMode === 'codes'
        ? a.codes.includes(p.code)
        : (a.fa === '全部' || p.fa === a.fa) && (a.group === '全部' || p.group === a.group)) &&
      !a.excluded.includes(p.code)
  )
}
function validDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  )
}
export function validateActivity(a: Activity) {
  if (!a.name.trim()) return '请填写活动名称'
  if (!validDate(a.start) || !validDate(a.end) || a.start >= a.end)
    return '请填写有效日期，活动开始日期必须早于结束日期'
  if (!activeProducts(a).length) return '请至少选择一个参与商品'
  if (!Number.isInteger(a.delay) || a.delay < 1 || a.delay > 90) return '发放延迟请输入 1–90 的整数'
  if (!a.tiers.length) return '请至少配置一个档位'
  for (let i = 0; i < a.tiers.length; i++) {
    const t = a.tiers[i],
      p = a.tiers[i - 1]
    if (
      !Number.isFinite(t.threshold) ||
      t.threshold <= 0 ||
      !Number.isInteger(t.multiplier) ||
      t.multiplier <= 0
    )
      return '门槛必须大于 0，倍数必须为正整数'
    if (a.mode === 'quantity' && !Number.isInteger(t.threshold)) return '台数门槛必须为正整数'
    if (
      a.mode === 'amount' &&
      Math.abs(t.threshold * 100 - Math.round(t.threshold * 100)) > 0.00001
    )
      return '金额门槛最多保留两位小数'
    if (p && (t.threshold <= p.threshold || t.multiplier <= p.multiplier))
      return '请按递增顺序配置门槛及倍数，不可重复'
  }
  return ''
}
export function extendActivity(a: Activity, end: string, reason: string, date = TODAY): Activity {
  if (activityStatus(a, date) !== '进行中') throw new Error('仅允许在活动进行中延期')
  if (!validDate(end) || end <= a.end)
    throw new Error('请填写有效日期，新结束日期必须晚于原结束日期')
  if (!reason.trim()) throw new Error('请填写延期原因')
  const next = { ...a, end, updated: date }
  return {
    ...next,
    logs: [
      `${date} · 运营管理员 · 延期 ${a.end} → ${end}；计划发放 ${payoutDate(a)} → ${payoutDate(next)}；原因：${reason.trim()}`,
      ...a.logs
    ]
  }
}
// All identities and orders below are constructed demo data. Monetary examples reproduce the supplied calculation cases.
export function ordersFor(a: Activity): Order[] {
  const start = new Date(a.start + 'T00:00:00Z')
  const day = (offset: number) => {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + offset)
    return d.toISOString().slice(0, 10)
  }
  const make = (
    n: number,
    enterprise: string,
    enterpriseId: string,
    account: string,
    quantity: number,
    receipt: number,
    paid: number,
    extras: Partial<Order> = {}
  ): Order => ({
    id: `D-${a.id.slice(-6)}-${String(n).padStart(3, '0')}`,
    enterprise,
    enterpriseId,
    account,
    quantity,
    receipt,
    paidBase: Math.floor(receipt / 100),
    paidMember: paid - Math.floor(receipt / 100),
    returned: 0,
    refund: 0,
    sku: n % 2 ? 'DEMO-TP14' : 'DEMO-TC90',
    date: day(n === 1 ? 0 : Math.min(n - 1, 4)),
    signed: true,
    ...extras
  })
  return [
    make(1, '远帆智能科技有限公司', 'ENT-DEMO-001', 'LID-DEMO-A01', 6, 30000, 900),
    make(2, '远帆智能科技有限公司', 'ENT-DEMO-001', 'LID-DEMO-A02', 4, 20000, 600),
    make(3, '澄星实业有限公司', 'ENT-DEMO-002', 'LID-DEMO-B01', 10, 59328, 2966),
    make(4, '澄星实业有限公司', 'ENT-DEMO-002', 'LID-DEMO-B02', 20, 136116, 6805),
    make(5, '澄星实业有限公司', 'ENT-DEMO-002', 'LID-DEMO-B01', 10, 64990, 2924),
    make(6, '澄星实业有限公司', 'ENT-DEMO-002', 'LID-DEMO-B03', 60, 300000, 15000),
    make(7, '青禾设计有限公司', 'ENT-DEMO-003', 'LID-DEMO-C01', 8, 40000, 1200),
    make(8, '远帆智能科技有限公司', 'ENT-DEMO-001', 'LID-DEMO-A03', 10, 50000, 1500, {
      exclusion: '账号命中现有黑名单'
    }),
    make(9, '远帆智能科技有限公司', 'ENT-DEMO-001', 'LID-DEMO-A01', 5, 25000, 750, {
      sku: 'DEMO-CTO',
      exclusion: 'CTO 商品不参与'
    }),
    make(10, '若水服务有限公司', 'ENT-DEMO-004', 'LID-DEMO-D01', 12, 60000, 0, {
      paidBase: null,
      paidMember: null
    }),
    make(11, '合序制造有限公司', 'ENT-DEMO-005', 'LID-DEMO-E01', 10, 10000, 1200),
    make(12, '远帆智能科技有限公司', 'ENT-DEMO-001', 'LID-DEMO-A01', 2, 10000, 300, {
      returned: 2,
      refund: 10000
    })
  ]
}
export type Calculated = Order & {
  netQuantity: number
  netReceipt: number
  multiplier: number
  target: number
  paid: number
  delta: number
  eligible: boolean
  issue: string
  enterpriseQuantity: number
  enterpriseAmount: number
}
export function calculate(a: Activity, orders: Order[], cutoff = '9999-12-31'): Calculated[] {
  const codes = new Set(activeProducts(a).map((x) => x.code))
  const prepared = orders.map((o) => {
    let issue = o.exclusion || ''
    if (!issue && !codes.has(o.sku)) issue = '不在活动商品范围'
    if (!issue && (o.date < a.start || o.date > a.end || o.date > cutoff))
      issue = '不在统计时间范围'
    if (!issue && !o.signed) issue = '尚未签收'
    const netQuantity = o.quantity - o.returned,
      netReceipt = Math.round((o.receipt - o.refund) * 100) / 100
    if (!issue && (!o.enterpriseId || !o.enterprise)) issue = '企业归属无法匹配'
    if (
      !issue &&
      (![o.quantity, o.returned, o.receipt, o.refund].every(Number.isFinite) ||
        netQuantity < 0 ||
        netReceipt < 0)
    )
      issue = '订单数量或金额异常'
    if (!issue && (netQuantity === 0 || netReceipt === 0)) issue = '已全额退货退款'
    return { ...o, netQuantity, netReceipt, issue, eligible: !issue }
  })
  const totals = new Map<string, { quantity: number; amount: number }>()
  for (const o of prepared) {
    if (o.eligible) {
      const t = totals.get(o.enterpriseId) || { quantity: 0, amount: 0 }
      t.quantity += o.netQuantity
      t.amount = Math.round((t.amount + o.netReceipt) * 100) / 100
      totals.set(o.enterpriseId, t)
    }
  }
  return prepared.map((o) => {
    const t = totals.get(o.enterpriseId) || { quantity: 0, amount: 0 }
    const metric = a.mode === 'quantity' ? t.quantity : t.amount
    const tier = [...a.tiers]
      .sort((x, y) => y.threshold - x.threshold)
      .find((x) => metric >= x.threshold)
    const multiplier = o.eligible ? tier?.multiplier || 0 : 0
    const paid = (o.paidBase ?? 0) + (o.paidMember ?? 0)
    // Convert net receipts to cents before multiplication to avoid binary floating rounding at integer boundaries.
    const target = multiplier
      ? Math.floor((Math.round(o.netReceipt * 100) * multiplier) / 10000)
      : paid
    let issue = o.issue
    if (o.eligible && (o.paidBase === null || o.paidMember === null))
      issue = '缺少订单实际已发积分记录'
    const delta = multiplier ? target - paid : 0
    if (!issue && delta < 0) issue = '应补差额为负，待业务核对'
    return {
      ...o,
      multiplier,
      target,
      paid,
      delta,
      issue,
      enterpriseQuantity: t.quantity,
      enterpriseAmount: t.amount
    }
  })
}
export function settle(
  a: Activity,
  rows: Calculated[],
  records: RecordItem[],
  date: string,
  failOrderId?: string
): RecordItem[] {
  if (a.draft || date < payoutDate(a)) throw new Error('尚未到计划发放日期')
  const next = records.map((r) => ({ ...r }))
  for (const r of rows) {
    if (!r.eligible || r.issue || r.delta <= 0) continue
    const key = `${a.id}:${r.id}`,
      index = next.findIndex((x) => x.key === key),
      old = next[index]
    if (old?.status === '成功') continue
    const failed = r.id === failOrderId
    const item: RecordItem = {
      key,
      orderId: r.id,
      account: r.account,
      points: r.delta,
      status: failed ? '失败' : '成功',
      time: date + ' 10:00:00',
      batch: `BATCH-${a.id}`,
      transaction: failed ? '' : `DEMO-TXN-${a.id}-${r.id}`,
      attempts: (old?.attempts || 0) + 1,
      reason: failed ? '模拟账户服务暂时不可用，未入账' : '',
      history: [
        ...(old?.history || []),
        `${date} 10:00:00 · 第 ${(old?.attempts || 0) + 1} 次 · ${failed ? '失败：模拟账户服务暂时不可用，未入账' : `成功：向 ${r.account} 补发 ${r.delta} 分`}`
      ]
    }
    if (index < 0) next.push(item)
    else next[index] = item
  }
  return next
}
export function initialRecords() {
  const a = seedActivities[2]
  const rows = calculate(a, ordersFor(a))
  return settle(a, rows, [], payoutDate(a), rows[3].id)
}
export const number = (v: number) => v.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
