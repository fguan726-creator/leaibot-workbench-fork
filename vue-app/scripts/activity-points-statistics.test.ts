import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import {
  ordersFor,
  seedActivities,
  type Activity,
  type Order,
  type RecordItem
} from '../src/services/activityPoints.ts'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier === './activityPoints' &&
      context.parentURL?.endsWith('/activityPointsStatistics.ts')
    )
      return nextResolve(new URL('./activityPoints.ts', context.parentURL).href, context)
    return nextResolve(specifier, context)
  }
})
const { buildActivityStatistics, filterStatistics, summarizeStatistics, groupStatistics } =
  await import('../src/services/activityPointsStatistics.ts')
const activity = seedActivities[0]
const orderFixture = ordersFor(activity)
const build = (orders = orderFixture, records: RecordItem[] = [], a = activity) =>
  buildActivityStatistics(a, orders, records, a.end)
const record = (
  order: Order,
  status: RecordItem['status'],
  points: number,
  overrides: Partial<RecordItem> = {}
): RecordItem => ({
  key: `${activity.id}:${order.id}`,
  orderId: order.id,
  account: order.account,
  points,
  status,
  time: '2026-11-04 10:00:00',
  batch: 'DEMO-BATCH',
  transaction: status === '成功' ? `DEMO-${order.id}` : '',
  attempts: 1,
  reason: status === '失败' ? '演示发放失败' : '',
  history: ['演示处理记录'],
  ...overrides
})

await test('原表19笔逐单复算，保留基础积分及未取整目标，汇总不提前取整', () => {
  const examples = [
    [9, 59328, 2966, 5932, 2966],
    [20, 131840, 6592, 13184, 6592],
    [30, 197760, 9888, 19776, 9888],
    [10, 65920, 3296, 6592, 3296],
    [18, 136116, 6805, 13611, 6806],
    [10, 75620, 3781, 7562, 3781],
    [20, 151240, 7562, 15124, 7562],
    [20, 151240, 7562, 15124, 7562],
    [5, 38310, 1915, 3831, 1916],
    [7, 53634, 2681, 5363, 2682],
    [10, 64990, 2924, 6499, 3575],
    [10, 64990, 3249, 6499, 3250],
    [10, 64990, 3249, 6499, 3250],
    [67, 435433, 21771, 43543, 21772],
    [15, 114930, 5746, 11493, 5747],
    [5, 38310, 1915, 3831, 1916],
    [10, 76620, 3831, 7662, 3831],
    [5, 33460, 1673, 3346, 1673],
    [10, 66920, 3346, 6692, 3346]
  ]
  const orders = examples.map(([quantity, receipt, paid], index) => ({
    ...orderFixture[0],
    id: `SAMPLE-${index + 1}`,
    quantity,
    receipt,
    paidBase: Math.floor(receipt / 100),
    paidMember: paid - Math.floor(receipt / 100)
  }))
  const rows = build(orders)
  rows.forEach((row, index) => {
    assert.equal(row.basePointsExact, examples[index][1] / 100)
    assert.equal(row.targetPointsExact, examples[index][1] / 10)
    assert.equal(row.target, examples[index][3])
    assert.equal(row.actualPaid, examples[index][2])
    assert.equal(row.requiredPoints, examples[index][4])
  })
  const summary = summarizeStatistics(rows)
  assert.deepEqual(
    [
      summary.orderCount,
      summary.quantity,
      summary.amount,
      summary.target,
      summary.actualPaid,
      summary.required
    ],
    [19, 291, 2021651, 202163, 100752, 101411]
  )
  assert.equal(summary.pending, 101411)
})

await test('账号、日期、商品筛选不降低全活动企业档位，汇总只统计筛选结果', () => {
  const rows = build()
  const visible = filterStatistics(rows, {
    exactEnterprise: orderFixture[0].enterpriseId,
    exactAccount: orderFixture[0].account,
    start: activity.start,
    end: activity.start,
    sku: 'TP14'
  })
  assert.equal(visible.length, 1)
  assert.equal(visible[0].multiplier, 5)
  assert.equal(visible[0].enterpriseQuantity, 10)
  const [group] = groupStatistics(visible, 'enterprise')
  assert.equal(group.enterpriseQuantity, 10)
  assert.equal(group.enterpriseAmount, 50000)
  assert.equal(group.multiplier, 5)
  assert.equal(group.summary.quantity, 6)
  assert.equal(group.summary.amount, 30000)
  assert.equal(group.summary.required, 600)
  assert.equal(filterStatistics(rows, { start: '2026-10-15', end: '2026-09-07' }).length, 0)
})

await test('逐行取整后汇总，不以汇总金额一次取整代替订单计算', () => {
  const a: Activity = { ...activity, tiers: [{ threshold: 1, multiplier: 5 }] }
  const orders = [1, 2].map((n) => ({
    ...orderFixture[0],
    id: `ROUND-${n}`,
    quantity: 1,
    receipt: 199.99,
    paidBase: 0,
    paidMember: 0
  }))
  const rows = build(orders, [], a)
  assert.equal(summarizeStatistics(rows).target, 18)
  assert.equal(summarizeStatistics(rows).required, 18)
  assert.equal(Math.floor((399.98 / 100) * 5), 19)
})

await test('缺失已发或缺少其中一项均不冒充零，异常不进入待补发', () => {
  const orders = [
    orderFixture[0],
    { ...orderFixture[1], paidBase: null },
    { ...orderFixture[9], paidBase: null, paidMember: null }
  ]
  const rows = build(orders)
  for (const row of rows.slice(1)) {
    assert.equal(row.actualPaid, null)
    assert.equal(row.requiredPoints, null)
    assert.equal(row.targetPointsExact, (row.netReceipt / 100) * row.multiplier)
    assert.equal(row.status, '计算异常')
    assert.equal(row.pendingPoints, 0)
  }
  const summary = summarizeStatistics(rows)
  assert.equal(summary.missingPaidCount, 2)
  assert.equal(summary.actualPaid, 900)
  assert.equal(summary.pending, 600)
  assert.equal(summary.quantity, 22)
})

await test('待补、已补、失败、异常、不参与、无需补发状态互斥', () => {
  const rows = build(orderFixture, [
    record(orderFixture[0], '成功', 600),
    record(orderFixture[1], '失败', 400)
  ])
  assert.equal(rows[0].status, '已补发')
  assert.deepEqual([rows[0].postedPoints, rows[0].pendingPoints, rows[0].failedPoints], [600, 0, 0])
  assert.equal(rows[1].status, '发放失败')
  assert.deepEqual([rows[1].postedPoints, rows[1].pendingPoints, rows[1].failedPoints], [0, 0, 400])
  assert.equal(rows[2].status, '待补发')
  assert.equal(rows[6].status, '无需补发')
  assert.equal(rows[7].status, '不参与')
  assert.equal(rows[9].status, '计算异常')
  assert.equal(rows[10].status, '计算异常')
  const summary = summarizeStatistics(rows)
  assert.equal(summary.posted, 600)
  assert.equal(summary.failed, 400)
  assert.equal(summary.required, summary.posted + summary.pending + summary.failed)
  assert.equal(summary.exceptionCount, 2)
  assert.equal(summary.excludedCount, 3)
})

await test('重复订单行、重复成功流水与处理历史不重复计数，成功优先且取最新', () => {
  const records = [
    record(orderFixture[0], '成功', 999, { time: '2026-11-04 09:00:00' }),
    record(orderFixture[0], '成功', 600, { history: ['失败', '成功', '重复查询'] }),
    record(orderFixture[0], '失败', 600, { time: '2026-11-05 10:00:00' }),
    record(orderFixture[0], '成功', 600, { key: `OTHER:${orderFixture[0].id}` })
  ]
  const rows = build([...orderFixture.slice(0, 2), { ...orderFixture[0] }], records)
  assert.equal(rows.length, 2)
  assert.equal(rows[0].enterpriseQuantity, 10)
  assert.equal(rows[0].status, '已补发')
  assert.equal(rows[0].record?.time, '2026-11-04 10:00:00')
  assert.equal(summarizeStatistics(rows).posted, 600)
  assert.equal(summarizeStatistics(rows).orderCount, 2)
})

await test('成功金额与现算不一致标为异常，但保留实际入账', () => {
  const rows = build(orderFixture.slice(0, 2), [record(orderFixture[0], '成功', 650)])
  assert.equal(rows[0].status, '计算异常')
  assert.equal(rows[0].postedPoints, 650)
  assert.equal(rows[0].requiredPoints, 600)
  assert.equal(rows[0].targetPointsExact, 1500)
  assert.equal(rows[0].pendingPoints, 0)
  assert.equal(rows[0].failedPoints, 0)
  assert.match(rows[0].reason, /已补.*不一致/)
  assert.equal(summarizeStatistics(rows).posted, 650)
})

await test('负差额暂停补发，实际已发保留，不当作待补或自动回收', () => {
  const [row] = build([orderFixture[10]])
  assert.equal(row.delta, -700)
  assert.equal(row.actualPaid, 1200)
  assert.equal(row.requiredPoints, -700)
  assert.equal(row.targetPointsExact, 500)
  assert.equal(row.status, '计算异常')
  assert.equal(row.pendingPoints, 0)
  assert.equal(summarizeStatistics([row]).actualPaid, 1200)
  assert.equal(summarizeStatistics([row]).required, 0)
})

await test('查询支持包含匹配和精确钻取，账号分组不混淆不同企业', () => {
  const rows = build([
    orderFixture[0],
    orderFixture[1],
    { ...orderFixture[2], account: orderFixture[0].account }
  ])
  const queried = filterStatistics(rows, {
    enterprise: '远帆',
    account: 'a01',
    orderId: '001',
    status: '待补发'
  })
  assert.equal(queried.length, 1)
  assert.equal(filterStatistics(rows, { exactEnterprise: 'ENT-DEMO-00' }).length, 0)
  assert.equal(filterStatistics(rows, { exactAccount: 'LID-DEMO-A0' }).length, 0)
  const accounts = groupStatistics(rows, 'account')
  assert.equal(accounts.length, 3)
  assert.equal(new Set(accounts.map((group) => group.id)).size, 3)
  assert.equal(accounts.filter((group) => group.account === orderFixture[0].account).length, 2)
})

await test('同一订单多商品行关联同一成功记录只累计一次', () => {
  const a: Activity = { ...activity, tiers: [{ threshold: 1, multiplier: 5 }] }
  const orders = [
    { ...orderFixture[0], quantity: 1, receipt: 1000, paidBase: 10, paidMember: 0 },
    {
      ...orderFixture[0],
      sku: 'DEMO-TC90',
      quantity: 1,
      receipt: 2000,
      paidBase: 20,
      paidMember: 0
    }
  ]
  const rows = build(orders, [record(orders[0], '成功', 120)], a)
  assert.equal(rows.length, 2)
  assert.equal(new Set(rows.map((row) => row.key)).size, 2)
  assert.equal(summarizeStatistics(rows).orderCount, 1)
  assert.equal(summarizeStatistics(rows).posted, 120)
  assert.equal(
    rows.every((row) => row.status === '已补发'),
    true
  )
})

await test('报表只读，不改原活动、订单及记录；统计日期仍限制参与范围', () => {
  const orders = structuredClone(orderFixture)
  const records = [record(orders[0], '成功', 600)]
  const snapshot = JSON.stringify({ activity, orders, records })
  const rows = buildActivityStatistics(activity, orders, records, activity.start)
  filterStatistics(rows, { account: 'A01' })
  summarizeStatistics(rows)
  groupStatistics(rows, 'enterprise')
  assert.equal(JSON.stringify({ activity, orders, records }), snapshot)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].id, orders[0].id)
  assert.equal(rows[0].enterpriseQuantity, 6)
})

await test('未来订单尚未发生不进入明细，待开始活动与草稿均无统计', () => {
  assert.deepEqual(buildActivityStatistics(activity, orderFixture, [], '2026-09-06'), [])
  assert.deepEqual(
    buildActivityStatistics({ ...activity, draft: true }, orderFixture, [], activity.end),
    []
  )
  const future = seedActivities[1]
  assert.deepEqual(buildActivityStatistics(future, ordersFor(future), [], '2026-09-16'), [])
})

await test('只筛选不参与行时企业全活动档位保留，跨活动不可直接汇总', () => {
  const rows = build()
  const excluded = filterStatistics(rows, { exactEnterprise: 'ENT-DEMO-001', status: '不参与' })
  const [group] = groupStatistics(excluded, 'enterprise')
  assert.equal(group.multiplier, 5)
  assert.equal(group.enterpriseQuantity, 10)
  assert.equal(group.summary.quantity, 0)
  assert.throws(
    () => summarizeStatistics([rows[0], { ...rows[0], key: 'OTHER', activityId: 'OTHER' }]),
    /单个活动/
  )
})
