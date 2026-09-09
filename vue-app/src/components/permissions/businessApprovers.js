export const BUSINESS_APPROVER_GROUPS = Object.freeze([
  Object.freeze({ label: '线上数据权限', options: Object.freeze([
    Object.freeze({ value: 'zhangjq4', label: 'zhangjq4（消费业务 to C）' }),
    Object.freeze({ value: 'huangjq5', label: 'huangjq5（商用业务 to B/b）' })
  ]) }),
  Object.freeze({ label: '产品/IT', options: Object.freeze([
    Object.freeze({ value: 'zhangxy43', label: 'zhangxy43（to C 相关）' }),
    Object.freeze({ value: 'zhangrui32', label: 'zhangrui32（to B/b 相关）' }),
    Object.freeze({ value: 'zhangyi44', label: 'zhangyi44（乐享相关）' })
  ]) })
])

export function isBusinessApprover(value) {
  return typeof value === 'string' && BUSINESS_APPROVER_GROUPS.some((group) => group.options.some((option) => option.value === value))
}

export function businessApproverLabel(value) {
  return BUSINESS_APPROVER_GROUPS.flatMap((group) => group.options).find((option) => option.value === value)?.label || value || '未选择'
}

export function businessApproverError(value) {
  return isBusinessApprover(value) ? '' : '请选择一位业务负责人。'
}

export function createSelectedBusinessApprovalTasks(snapshot, roles, existingTasks = []) {
  if (!isBusinessApprover(snapshot.businessApprover)) return []
  const approver = snapshot.businessApprover
  const roleIds = [...new Set([...(snapshot.selectedRoleIds || []), ...(snapshot.copiedRoleIds || [])])]
  const existing = existingTasks.find((task) => task.approver === approver) || {}
  return [{
    approver, approverName: businessApproverLabel(approver),
    roleIds, roleNames: roleIds.map((id) => roles.find((role) => role.id === id)?.name).filter(Boolean),
    organizations: [...(existing.organizations || [])], status: existing.status || 'pending',
    result: existing.result || '', opinion: existing.opinion || '', handledAt: existing.handledAt || ''
  }]
}
