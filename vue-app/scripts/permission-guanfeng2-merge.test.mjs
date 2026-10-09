import assert from 'node:assert/strict'
import test from 'node:test'
import * as schema from '../src/components/permissions/applicationInfoSchema.js'
import * as catalog from '../src/components/permissions/permissionScopeCatalog.ts'

async function businessApprovers() {
  try {
    return await import('../src/components/permissions/businessApprovers.js')
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') assert.fail('缺少业务负责人能力：businessApprovers.js 尚未实现')
    throw error
  }
}

const approverGroups = [
  { label: '线上数据权限', options: [
    { value: 'zhangjq4', label: 'zhangjq4（消费业务 to C）' },
    { value: 'huangjq5', label: 'huangjq5（商用业务 to B/b）' }
  ] },
  { label: '产品/IT', options: [
    { value: 'zhangxy43', label: 'zhangxy43（to C 相关）' },
    { value: 'zhangrui32', label: 'zhangrui32（to B/b 相关）' },
    { value: 'zhangyi44', label: 'zhangyi44（乐享相关）' }
  ] }
]
const approvalRoles = [
  { id: 'ops-pm', name: '运营分析 PM', owner: 'zhangjq4' },
  { id: 'geo-analyst', name: 'GEO 分析师', owner: 'zhangxy43' },
  { id: 'product-op', name: '商品运营', owner: 'huangjq5' }
]

test('business approval accepts exactly the five selectable ITCodes with their displayed groups', async () => {
  const business = await businessApprovers()
  assert.deepEqual(business.BUSINESS_APPROVER_GROUPS, approverGroups)
  for (const option of approverGroups.flatMap(group => group.options)) {
    assert.equal(business.isBusinessApprover(option.value), true)
    assert.equal(business.businessApproverError(option.value), '')
    assert.equal(business.businessApproverLabel(option.value), option.label)
  }
})

test('invalid ITCodes, display labels and empty values cannot fall back to a role owner', async () => {
  const business = await businessApprovers()
  for (const value of [undefined, null, '', ' ', 'admin', 'sunll1', 'zhangjq4 ', 'zhangjq4（消费业务 to C）', 0, {}]) {
    assert.equal(business.isBusinessApprover(value), false)
    assert.ok(business.businessApproverError(value))
    assert.deepEqual(business.createSelectedBusinessApprovalTasks({ businessApprover: value, selectedRoleIds: ['ops-pm'] }, approvalRoles), [])
  }
})

test('multiple selected and copied roles deduplicate into one task for the chosen business approver', async () => {
  const business = await businessApprovers()
  const snapshot = { businessApprover: 'zhangyi44', selectedRoleIds: ['ops-pm', 'ops-pm', 'geo-analyst'], copiedRoleIds: ['geo-analyst', 'product-op'] }
  const before = structuredClone(snapshot)
  const tasks = business.createSelectedBusinessApprovalTasks(snapshot, approvalRoles)
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].approver, 'zhangyi44')
  assert.equal(tasks[0].approverName, 'zhangyi44（乐享相关）')
  assert.deepEqual(tasks[0].roleIds, ['ops-pm', 'geo-analyst', 'product-op'])
  assert.deepEqual(tasks[0].roleNames, ['运营分析 PM', 'GEO 分析师', '商品运营'])
  assert.equal(tasks[0].status, 'pending')
  assert.deepEqual(snapshot, before)
})

test('a data-only permission application still creates the selected business approval task', async () => {
  const business = await businessApprovers()
  const tasks = business.createSelectedBusinessApprovalTasks({
    businessApprover: 'huangjq5', selectedRoleIds: [], copiedRoleIds: [], selectedDataPermissionIds: ['data.mall.order.pending']
  }, approvalRoles)
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].approver, 'huangjq5')
  assert.equal(tasks[0].status, 'pending')
  assert.deepEqual(tasks[0].roleIds, [])
  assert.deepEqual(tasks[0].roleNames, [])
})

test('changing the selected business approver cannot inherit the previous approval result', async () => {
  const business = await businessApprovers()
  const previous = [{ approver: 'zhangjq4', status: 'approved', result: 'approved', opinion: '同意', handledAt: '2026-09-09T00:00:00Z', organizations: ['旧业务组'] }]
  const tasks = business.createSelectedBusinessApprovalTasks({ businessApprover: 'zhangrui32', selectedRoleIds: ['ops-pm'] }, approvalRoles, previous)
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].approver, 'zhangrui32')
  assert.equal(tasks[0].status, 'pending')
  assert.equal(tasks[0].result, '')
  assert.equal(tasks[0].opinion, '')
  assert.equal(tasks[0].handledAt, '')
  assert.deepEqual(tasks[0].organizations, [])
  assert.equal(previous[0].status, 'approved')
})

test('approval task snapshots preserve matching history without sharing mutable arrays', async () => {
  const business = await businessApprovers()
  const snapshot = { businessApprover: 'zhangjq4', selectedRoleIds: ['ops-pm'], copiedRoleIds: ['geo-analyst'] }
  const existing = [{ approver: 'zhangjq4', status: 'approved', result: 'approved', opinion: '通过', handledAt: '2026-09-09T00:00:00Z', organizations: ['业务一组'] }]
  const task = business.createSelectedBusinessApprovalTasks(snapshot, approvalRoles, existing)[0]
  assert.equal(task.status, 'approved')
  assert.equal(task.opinion, '通过')
  task.roleIds.push('injected')
  task.roleNames[0] = '外部修改'
  task.organizations.push('injected')
  assert.deepEqual(snapshot.selectedRoleIds, ['ops-pm'])
  assert.deepEqual(snapshot.copiedRoleIds, ['geo-analyst'])
  assert.deepEqual(existing[0].organizations, ['业务一组'])
  assert.equal(approvalRoles[0].name, '运营分析 PM')
  const fresh = business.createSelectedBusinessApprovalTasks(snapshot, approvalRoles, existing)[0]
  assert.deepEqual(fresh.roleIds, ['ops-pm', 'geo-analyst'])
  assert.deepEqual(fresh.roleNames, ['运营分析 PM', 'GEO 分析师'])
  assert.deepEqual(fresh.organizations, ['业务一组'])
})

const applicationCases = [
  { type: 'change', person: 'internal', fields: ['applicantIdentity', 'targetItcode', 'mobile', 'email', 'applicantManager', 'targetManager', 'businessApprover', 'reason'], required: ['targetItcode', 'targetManager', 'businessApprover', 'reason'] },
  { type: 'change', person: 'external', fields: ['applicantIdentity', 'targetUser', 'relatedAccount', 'mobile', 'email', 'applicantManager', 'businessApprover', 'reason'], required: ['targetUser', 'relatedAccount', 'businessApprover', 'reason'] },
  { type: 'create', person: 'internal', fields: ['applicantIdentity', 'targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'mobile', 'email', 'applicantManager', 'businessApprover', 'reason'], required: ['targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'businessApprover', 'reason'] },
  { type: 'create', person: 'external', fields: ['applicantIdentity', 'targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'mobile', 'email', 'applicantManager', 'businessApprover', 'reason'], required: ['targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'businessApprover', 'reason'] },
  ...['enable', 'disable'].flatMap(type => [
    { type, person: 'internal', fields: ['applicantIdentity', 'targetItcode', 'reason'], required: ['targetItcode', 'reason'] },
    { type, person: 'external', fields: ['applicantIdentity', 'targetUser', 'relatedAccount', 'reason'], required: ['targetUser', 'relatedAccount', 'reason'] }
  ])
]

for (const expected of applicationCases) {
  test(`${expected.type}/${expected.person} retains its existing application fields and correct business-approval requirement`, () => {
    const resolved = schema.resolveApplicationInfoSchema(expected.type, expected.person)
    assert.deepEqual(resolved.fields, expected.fields)
    assert.deepEqual(resolved.requiredFields, expected.required)
    assert.equal(schema.schemaRequiresField(resolved, 'businessApprover'), ['create', 'change'].includes(expected.type))
    assert.equal(schema.schemaHasField(resolved, 'businessApprover'), ['create', 'change'].includes(expected.type))
  })
}

test('password reset stays outside the business approval application schemas', () => {
  assert.equal(schema.resolveApplicationInfoSchema('reset', 'internal'), null)
})

const functionIds = ['func.dashboard.view', 'func.report.generate', 'func.data.export', 'func.product.config', 'func.publish.confirm', 'func.geo.monitor', 'func.lead.assign', 'func.skill.manage']
const legacyDataIds = ['data.ops.region.east', 'data.ops.region.north', 'data.ops.region.south', 'data.member.profile.level', 'data.member.profile.rights', 'data.ops.metric.flow', 'data.ops.metric.gmv', 'data.geo.source.official', 'data.geo.source.community', 'data.lead.pool.all', 'data.lead.pool.assigned']
const orderDataIds = ['data.mall.order.pending', 'data.mall.order.completed', 'data.mall.order.aftersales']
const allDataIds = [...legacyDataIds, ...orderDataIds]
const sorted = values => [...values].sort()
const nonAdminRoles = [
  { id: 'ops-pm', functions: ['func.dashboard.view', 'func.report.generate', 'func.data.export'], data: [], custom: [] },
  { id: 'product-op', functions: ['func.dashboard.view', 'func.product.config', 'func.publish.confirm'], data: ['data.ops.region.north', 'data.ops.metric.gmv'], custom: [] },
  { id: 'geo-analyst', functions: ['func.geo.monitor', 'func.report.generate'], data: ['data.geo.source.official', 'data.geo.source.community'], custom: [] },
  { id: 'lead-operator', functions: ['func.lead.assign', 'func.data.export'], data: [], custom: [{ id: 'first-access-leads', tableId: 'enterprise-leads-table', tableName: '企业客户线索二维表', logic: 'AND', rowFieldIds: ['east', 'north'], columnFieldIds: ['customer-name', 'lead-status'] }] },
  { id: 'bpo-collab', functions: ['func.dashboard.view'], data: ['data.ops.region.south'], custom: [{ id: 'first-access-bpo', tableId: 'ops-metrics-table', tableName: '运营指标二维表', logic: 'AND', rowFieldIds: ['south'], columnFieldIds: ['gmv'] }] }
]

test('catalog preserves all 11 existing data grants, adds only the three order grants and leaves function IDs unchanged', () => {
  const current = catalog.createPermissionScopeCatalog()
  assert.deepEqual(sorted(current.dataPermissions.map(item => item.id)), sorted(allDataIds))
  assert.deepEqual(sorted(current.functionPermissions.map(item => item.id)), sorted(functionIds))
  const admin = current.roles.find(role => role.id === 'admin')
  assert.deepEqual(sorted(admin.dataPermissionIds), sorted(allDataIds))
})

for (const expected of nonAdminRoles) {
  test(`${expected.id} receives no additional function, data or custom-table grant from the catalog migration`, () => {
    const role = catalog.createPermissionScopeCatalog().roles.find(item => item.id === expected.id)
    assert.ok(role)
    assert.deepEqual(sorted(role.functionIds), sorted(expected.functions))
    assert.deepEqual(sorted(role.functionPermissionIds), sorted(expected.functions))
    assert.deepEqual(sorted(role.dataIds), sorted(expected.data))
    assert.deepEqual(sorted(role.dataPermissionIds), sorted(expected.data))
    assert.deepEqual(role.customDataRules, expected.custom)
  })
}

function groupedLeaves(directories) {
  return directories.flatMap(directory => {
    assert.ok(Array.isArray(directory.sources), `${directory.name} 必须按数据源分组`)
    return directory.sources.flatMap(source => source.datasets)
  })
}

test('directory/source grouping covers every grant once even when the supplied list contains duplicates', () => {
  const current = catalog.createPermissionScopeCatalog()
  const grouped = catalog.groupDataPermissionsByDirectory([...current.dataPermissions, current.dataPermissions[0], { ...current.dataPermissions[0] }])
  const leaves = groupedLeaves(grouped)
  assert.deepEqual(sorted(leaves.map(item => item.id)), sorted(allDataIds))
  assert.equal(leaves.length, 14)
  assert.deepEqual(sorted(grouped.map(directory => directory.name)), sorted(['乐享运营', 'GEO 看板', '在职员工管理', '企业客户管理']))
})

test('grouping retains supplied source boundaries and does not duplicate a grant across conflicting records', () => {
  const input = [
    { id: 'grant-a', name: '甲', group: '目录一', page: '来源一', sourceId: 'source-a', description: '说明甲' },
    { id: 'grant-b', name: '乙', group: '目录一', page: '来源一', sourceId: 'source-a', description: '说明乙' },
    { id: 'grant-a', name: '重复甲', group: '目录二', page: '其他来源', sourceId: 'source-other', description: '不应重复出现' },
    { id: 'grant-c', name: '丙', group: '目录一', page: '来源二', sourceId: 'source-b', description: '说明丙' }
  ]
  const grouped = catalog.groupDataPermissionsByDirectory(input)
  assert.deepEqual(grouped.map(directory => ({ id: directory.id, sources: directory.sources?.map(source => ({ id: source.id, name: source.name, ids: source.datasets.map(item => item.id) })) })), [
    { id: '目录一', sources: [{ id: 'source-a', name: '来源一', ids: ['grant-a', 'grant-b'] }, { id: 'source-b', name: '来源二', ids: ['grant-c'] }] }
  ])
  assert.equal(groupedLeaves(grouped)[0].name, '甲')
})

test('role-filtered grouping never fills in unselected grants or sources from the full catalog', () => {
  const current = catalog.createPermissionScopeCatalog()
  for (const expected of nonAdminRoles) {
    const role = current.roles.find(item => item.id === expected.id)
    const supplied = current.dataPermissions.filter(item => role.dataPermissionIds.includes(item.id))
    const grouped = catalog.groupDataPermissionsByDirectory(supplied)
    assert.deepEqual(sorted(groupedLeaves(grouped).map(item => item.id)), sorted(expected.data))
    assert.equal(grouped.some(directory => directory.sources.some(source => source.id === 'ds-mall-order')), false)
  }
})

const sourceFacts = [
  { id: 'ds-ops-region', group: '乐享运营', menu: '乐享运营', name: '运营指标查询', apiUrl: '/api/ops/metrics', permissionParam: 'regionCode', key: 'scope', value: 'east', sensitivity: 'sensitive-data', ids: ['data.ops.region.east', 'data.ops.region.north', 'data.ops.region.south', 'data.ops.metric.flow', 'data.ops.metric.gmv'] },
  { id: 'ds-member-tag', group: '在职员工管理', menu: '在职员工管理', name: '会员标签查询', apiUrl: '/api/member/tags', permissionParam: 'tagGroup', key: 'tag_group', value: 'rights', sensitivity: 'it-config-data', ids: ['data.member.profile.level', 'data.member.profile.rights'] },
  { id: 'ds-geo-source', group: 'GEO 看板', menu: 'GEO 看板', name: '信源引用查询', apiUrl: '/api/geo/sources', permissionParam: 'sourceType', key: 'source_type', value: 'official', sensitivity: 'sensitive-data', ids: ['data.geo.source.official', 'data.geo.source.community'] },
  { id: 'ds-lead-pool', group: '企业客户管理', menu: '企业客户管理', name: '线索池查询', apiUrl: '/api/biz/leads', permissionParam: 'ownerOrg', key: 'owner_org', value: 'enterprise', sensitivity: 'it-config-data', ids: ['data.lead.pool.all', 'data.lead.pool.assigned'] },
  { id: 'ds-mall-order', group: '乐享运营', menu: '乐享运营', name: '订单状态查询', apiUrl: '/api/mall/orders', permissionParam: 'orderScope', key: 'order_scope', value: 'summary', sensitivity: 'it-config-data', ids: ['data.mall.order.pending', 'data.mall.order.completed', 'data.mall.order.aftersales'] }
]

test('data source metadata and grouped grant locations agree with the intended source mapping', () => {
  assert.equal(typeof catalog.createPermissionDataSources, 'function', '缺少共享数据源元数据能力')
  const sources = catalog.createPermissionDataSources()
  const current = catalog.createPermissionScopeCatalog()
  const grouped = catalog.groupDataPermissionsByDirectory(current.dataPermissions)
  assert.deepEqual(sorted(sources.map(source => source.id)), sorted(sourceFacts.map(source => source.id)))
  for (const { ids, ...expected } of sourceFacts) {
    const source = sources.find(item => item.id === expected.id)
    assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key => [key, source[key]])), expected)
    assert.ok(source.remark.trim())
    const grants = current.dataPermissions.filter(item => item.sourceId === expected.id)
    assert.deepEqual(sorted(grants.map(item => item.id)), sorted(ids))
    assert.ok(grants.every(item => item.group === expected.menu && item.page === expected.name))
    const groupSource = grouped.find(directory => directory.name === expected.menu)?.sources.find(item => item.id === expected.id)
    assert.ok(groupSource)
    assert.equal(groupSource.name, expected.name)
    assert.deepEqual(sorted(groupSource.datasets.map(item => item.id)), sorted(ids))
  }
})

test('catalog and grouping outputs isolate nested role, user and grant snapshots', () => {
  const first = catalog.createPermissionScopeCatalog()
  const role = first.roles.find(item => item.id === 'bpo-collab')
  const copiedUser = first.copyableUsers.find(item => item.itcode === 'wangxt8')
  role.functionIds.push('injected')
  role.functionPermissionIds.push('injected')
  role.dataIds.push('injected')
  role.dataPermissionIds.push('injected')
  role.customDataRules[0].rowFieldIds.push('injected')
  role.customDataRules[0].columnFieldIds.push('injected')
  copiedUser.roleIds.push('admin')
  copiedUser.extraDataPermissionIds.push('injected')
  copiedUser.dataPermissions[0].id = 'injected'
  first.tenantOptions.push('injected')
  first.functionPermissions[0].name = '外部修改'
  const input = structuredClone(first.dataPermissions)
  const grouped = catalog.groupDataPermissionsByDirectory(input)
  const groupedItem = groupedLeaves(grouped)[0]
  groupedItem.name = '外部修改'
  groupedItem.sourceId = 'injected'
  grouped[0].sources[0].datasets.push({ id: 'injected' })
  assert.equal(input[0].name, '华东区')
  assert.equal(input[0].sourceId, 'ds-ops-region')
  first.dataPermissions[0].name = '外部修改'
  const fresh = catalog.createPermissionScopeCatalog()
  const freshRole = fresh.roles.find(item => item.id === 'bpo-collab')
  assert.deepEqual(freshRole.functionIds, ['func.dashboard.view'])
  assert.deepEqual(freshRole.functionPermissionIds, ['func.dashboard.view'])
  assert.deepEqual(freshRole.dataIds, ['data.ops.region.south'])
  assert.deepEqual(freshRole.dataPermissionIds, ['data.ops.region.south'])
  assert.deepEqual(freshRole.customDataRules[0].rowFieldIds, ['south'])
  assert.deepEqual(freshRole.customDataRules[0].columnFieldIds, ['gmv'])
  assert.deepEqual(fresh.tenantOptions, ['leaibot-cn', 'shop-chat', 'b-chat', 'biz-chat'])
  assert.equal(fresh.functionPermissions[0].name, '查看运营总览')
  assert.equal(fresh.dataPermissions[0].name, '华东区')
  const freshUser = fresh.copyableUsers.find(item => item.itcode === 'wangxt8')
  assert.deepEqual(freshUser.roleIds, ['ops-pm', 'geo-analyst'])
  assert.deepEqual(freshUser.extraDataPermissionIds, ['data.member.profile.level'])
  assert.deepEqual(sorted(freshUser.dataPermissions.map(item => item.id)), sorted(['data.geo.source.official', 'data.geo.source.community', 'data.member.profile.level']))
})

test('editing a returned data source cannot change later source metadata snapshots', () => {
  assert.equal(typeof catalog.createPermissionDataSources, 'function', '缺少共享数据源元数据能力')
  const sources = catalog.createPermissionDataSources()
  const source = sources.find(item => item.id === 'ds-mall-order')
  source.apiUrl = '/injected'
  source.menu = '外部修改'
  sources.push({ id: 'injected' })
  const fresh = catalog.createPermissionDataSources()
  assert.equal(fresh.length, 5)
  assert.equal(fresh.find(item => item.id === 'ds-mall-order').apiUrl, '/api/mall/orders')
  assert.equal(fresh.find(item => item.id === 'ds-mall-order').menu, '乐享运营')
})
