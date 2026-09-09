export interface PermissionCatalogItem {
  id: string
  name: string
  group: string
  page: string
  sourceId?: string
  description: string
}

export interface PermissionScopeRole {
  id: string
  name: string
  description: string
  desc: string
  owner: string
  functionIds: string[]
  functionPermissionIds: string[]
  dataIds: string[]
  dataPermissionIds: string[]
  customDataRules: Array<{
    id: string
    tableId: string
    tableName: string
    logic: 'AND'
    rowFieldIds: string[]
    columnFieldIds: string[]
  }>
}

export interface CopyablePermissionUser {
  itcode: string
  name: string
  roleIds: string[]
  extraDataPermissionIds: string[]
}

export const PERMISSION_SCOPE_TENANTS = ['leaibot-cn', 'shop-chat', 'b-chat', 'biz-chat'] as const

const functionPermissions: PermissionCatalogItem[] = [
  { id: 'func.dashboard.view', name: '查看运营总览', group: '乐享运营', page: '运营总览', description: '查看运营总览页面与核心指标。' },
  { id: 'func.report.generate', name: '报告生成', group: '乐享运营', page: '运营总览', description: '生成并查看运营分析报告。' },
  { id: 'func.data.export', name: '数据导出', group: '乐享运营', page: '流量分析', description: '导出当前权限范围内的数据。' },
  { id: 'func.product.config', name: '商品配置', group: '乐享运营', page: 'GMV 分析', description: '维护商品和推荐位配置。' },
  { id: 'func.publish.confirm', name: '发布确认', group: '乐享运营', page: 'GMV 分析', description: '确认商品上下架和发布操作。' },
  { id: 'func.geo.monitor', name: 'GEO 信源监测', group: 'GEO 看板', page: '各平台信源分布', description: '查看信源分布和引用趋势。' },
  { id: 'func.lead.assign', name: '线索分配', group: '企业客户管理', page: '线索池', description: '分配并跟进企业客户线索。' },
  { id: 'func.skill.manage', name: 'Skill 管理', group: 'AI 助手', page: 'Skill Hub', description: '管理工作台 Skill。' }
]

const dataSources = [
  { id: 'ds-ops-region', group: '乐享运营', menu: '乐享运营', name: '运营指标查询', apiUrl: '/api/ops/metrics', permissionParam: 'regionCode', key: 'scope', value: 'east', remark: '用于运营日报和活动复盘，按区域控制可见范围。', sensitivity: 'sensitive-data' },
  { id: 'ds-member-tag', group: '在职员工管理', menu: '在职员工管理', name: '会员标签查询', apiUrl: '/api/member/tags', permissionParam: 'tagGroup', key: 'tag_group', value: 'rights', remark: '涉及会员权益使用情况，默认需要业务负责人确认。', sensitivity: 'it-config-data' },
  { id: 'ds-geo-source', group: 'GEO 看板', menu: 'GEO 看板', name: '信源引用查询', apiUrl: '/api/geo/sources', permissionParam: 'sourceType', key: 'source_type', value: 'official', remark: '用于 GEO 信源监测和引用趋势分析。', sensitivity: 'sensitive-data' },
  { id: 'ds-lead-pool', group: '企业客户管理', menu: '企业客户管理', name: '线索池查询', apiUrl: '/api/biz/leads', permissionParam: 'ownerOrg', key: 'owner_org', value: 'enterprise', remark: '包含客户线索和跟进状态，仅企业客户相关组织可申请。', sensitivity: 'it-config-data' },
  { id: 'ds-mall-order', group: '乐享运营', menu: '乐享运营', name: '订单状态查询', apiUrl: '/api/mall/orders', permissionParam: 'orderScope', key: 'order_scope', value: 'summary', remark: '用于订单状态和售后进展查看，暂不开放明细字段。', sensitivity: 'it-config-data' }
]

export function createPermissionDataSources() {
  return dataSources.map((source) => ({ ...source }))
}

function dataPermission(sourceId: string, id: string, name: string, description: string): PermissionCatalogItem {
  const source = dataSources.find((item) => item.id === sourceId)
  if (!source) throw new Error(`未知数据源：${sourceId}`)
  return { id, name, description, sourceId, group: source.menu, page: source.name }
}

const dataPermissions: PermissionCatalogItem[] = [
  dataPermission('ds-ops-region', 'data.ops.region.east', '华东区', '华东区域的运营指标数据。'),
  dataPermission('ds-ops-region', 'data.ops.region.north', '华北区', '华北区域的运营指标数据。'),
  dataPermission('ds-ops-region', 'data.ops.region.south', '华南区', '华南区域的运营指标数据。'),
  dataPermission('ds-ops-region', 'data.ops.metric.flow', '流量转化', '流量及转化指标。'),
  dataPermission('ds-ops-region', 'data.ops.metric.gmv', 'GMV 指标', 'GMV 及相关经营指标。'),
  dataPermission('ds-mall-order', 'data.mall.order.pending', '待处理订单', '待处理订单状态汇总（mock）。'),
  dataPermission('ds-mall-order', 'data.mall.order.completed', '已完成订单', '已完成订单状态汇总（mock）。'),
  dataPermission('ds-mall-order', 'data.mall.order.aftersales', '售后订单', '售后订单进展汇总（mock）。'),
  dataPermission('ds-geo-source', 'data.geo.source.official', '官方信源', '官方渠道信源数据。'),
  dataPermission('ds-geo-source', 'data.geo.source.community', '社区信源', '社区渠道信源数据。'),
  dataPermission('ds-member-tag', 'data.member.profile.level', '会员等级', '会员等级画像数据。'),
  dataPermission('ds-member-tag', 'data.member.profile.rights', '权益使用', '会员权益使用数据。'),
  dataPermission('ds-lead-pool', 'data.lead.pool.all', '全部线索', '全部企业客户线索。'),
  dataPermission('ds-lead-pool', 'data.lead.pool.assigned', '已分配线索', '当前账号已分配的企业线索。')
]

function createRole(
  id: string,
  name: string,
  description: string,
  owner: string,
  functionIds: string[],
  dataIds: string[],
  customDataRules: PermissionScopeRole['customDataRules'] = []
): PermissionScopeRole {
  return {
    id,
    name,
    description,
    desc: description,
    owner,
    functionIds: [...functionIds],
    functionPermissionIds: [...functionIds],
    dataIds: [...dataIds],
    dataPermissionIds: [...dataIds],
    customDataRules: customDataRules.map((rule) => ({
      ...rule,
      rowFieldIds: [...rule.rowFieldIds],
      columnFieldIds: [...rule.columnFieldIds]
    }))
  }
}

const roles = [
  createRole('ops-pm', '运营分析 PM', '可查看运营总览、生成报告，并使用常用运营数据。', 'zhangjq4', ['func.dashboard.view', 'func.report.generate', 'func.data.export'], []),
  createRole('product-op', '商品运营', '可配置商品、推荐位、价格和上下架策略。', 'huangjq5', ['func.dashboard.view', 'func.product.config', 'func.publish.confirm'], ['data.ops.region.north', 'data.ops.metric.gmv']),
  createRole('geo-analyst', 'GEO 分析师', '可查看信源、引用和搜索表现数据。', 'zhangxy43', ['func.geo.monitor', 'func.report.generate'], ['data.geo.source.official', 'data.geo.source.community']),
  createRole('lead-operator', '线索运营', '可查看企业客户线索并进行分配跟进。', 'sunll1', ['func.lead.assign', 'func.data.export'], [], [
    { id: 'first-access-leads', tableId: 'enterprise-leads-table', tableName: '企业客户线索二维表', logic: 'AND', rowFieldIds: ['east', 'north'], columnFieldIds: ['customer-name', 'lead-status'] }
  ]),
  createRole('admin', 'admin', '覆盖权限申请、审批、用户、组织、数据源、功能配置和审计类能力。', 'admin', functionPermissions.map((permission) => permission.id), dataPermissions.map((permission) => permission.id), [
    { id: 'first-access-admin', tableId: 'ops-metrics-table', tableName: '运营指标二维表', logic: 'AND', rowFieldIds: ['east', 'north', 'south', 'nationwide'], columnFieldIds: ['gmv', 'traffic', 'conversion'] }
  ]),
  createRole('bpo-collab', '外包协作', '受限菜单和脱敏数据，仅保留必要操作。', 'wangxt8', ['func.dashboard.view'], ['data.ops.region.south'], [
    { id: 'first-access-bpo', tableId: 'ops-metrics-table', tableName: '运营指标二维表', logic: 'AND', rowFieldIds: ['south'], columnFieldIds: ['gmv'] }
  ])
]

const copyableUsers: CopyablePermissionUser[] = [
  { itcode: 'wangxt8', name: '王晓婷', roleIds: ['ops-pm', 'geo-analyst'], extraDataPermissionIds: ['data.member.profile.level'] },
  { itcode: 'liwen08', name: '李雯', roleIds: ['product-op'], extraDataPermissionIds: ['data.member.profile.rights'] },
  { itcode: 'temp-bpo', name: '外部协作账号', roleIds: ['bpo-collab'], extraDataPermissionIds: [] }
]

const clonePermission = (permission: PermissionCatalogItem) => ({ ...permission })
const cloneRole = (role: PermissionScopeRole) => ({
  ...role,
  functionIds: [...role.functionIds],
  functionPermissionIds: [...role.functionPermissionIds],
  dataIds: [...role.dataIds],
  dataPermissionIds: [...role.dataPermissionIds],
  customDataRules: role.customDataRules.map((rule) => ({
    ...rule,
    rowFieldIds: [...rule.rowFieldIds],
    columnFieldIds: [...rule.columnFieldIds]
  }))
})

export function createPermissionScopeCatalog() {
  const clonedRoles = roles.map(cloneRole)
  return {
    tenantOptions: [...PERMISSION_SCOPE_TENANTS],
    roles: clonedRoles,
    functionPermissions: functionPermissions.map(clonePermission),
    dataPermissions: dataPermissions.map(clonePermission),
    copyableUsers: copyableUsers.map((user) => {
      const inheritedDataIds = [...new Set(clonedRoles
        .filter((role) => user.roleIds.includes(role.id))
        .flatMap((role) => role.dataPermissionIds))]
      return {
        ...user,
        roleIds: [...user.roleIds],
        extraDataPermissionIds: [...user.extraDataPermissionIds],
        dataPermissions: [
          ...inheritedDataIds.map((id) => ({ id, source: '角色继承' as const })),
          ...user.extraDataPermissionIds
            .filter((id) => !inheritedDataIds.includes(id))
            .map((id) => ({ id, source: '用户单独授权' as const }))
        ]
      }
    })
  }
}

export function groupDataPermissionsByDirectory(source: PermissionCatalogItem[]) {
  const directoryMap = new Map<string, Map<string, { id: string; name: string; datasets: PermissionCatalogItem[] }>>()
  const seenIds = new Set<string>()
  source.forEach((permission) => {
    if (seenIds.has(permission.id)) return
    seenIds.add(permission.id)
    const sources = directoryMap.get(permission.group) || new Map()
    const sourceId = permission.sourceId || `${permission.group}-${permission.page}`
    const dataSource = sources.get(sourceId) || { id: sourceId, name: permission.page, datasets: [] }
    dataSource.datasets.push(clonePermission(permission))
    sources.set(sourceId, dataSource)
    directoryMap.set(permission.group, sources)
  })
  return [...directoryMap.entries()].map(([directory, sources]) => ({
    id: directory,
    name: directory,
    sources: [...sources.values()]
  }))
}

export function groupPermissionCatalog(source: PermissionCatalogItem[], keyword = '') {
  const normalizedKeyword = keyword.trim().toLowerCase()
  const filtered = source.filter((permission) => [permission.name, permission.description, permission.group, permission.page].join(' ').toLowerCase().includes(normalizedKeyword))
  const groupMap = new Map<string, Map<string, PermissionCatalogItem[]>>()
  filtered.forEach((permission) => {
    const pageMap = groupMap.get(permission.group) || new Map<string, PermissionCatalogItem[]>()
    const pagePermissions = pageMap.get(permission.page) || []
    pagePermissions.push(permission)
    pageMap.set(permission.page, pagePermissions)
    groupMap.set(permission.group, pageMap)
  })
  return [...groupMap.entries()].map(([group, pages]) => ({
    id: group,
    name: group,
    children: [...pages.entries()].map(([page, permissions]) => ({ id: `${group}-${page}`, name: page, children: permissions }))
  }))
}
