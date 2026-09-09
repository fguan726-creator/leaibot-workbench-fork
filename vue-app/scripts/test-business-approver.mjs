import assert from 'node:assert/strict'
import { BUSINESS_APPROVER_GROUPS, businessApproverError, businessApproverLabel, createSelectedBusinessApprovalTasks } from '../src/components/permissions/businessApprovers.js'
import { createPermissionScopeCatalog } from '../src/components/permissions/permissionScopeCatalog.ts'

assert.deepEqual(BUSINESS_APPROVER_GROUPS.map((group) => group.label), ['线上数据权限', '产品/IT'])
assert.deepEqual(BUSINESS_APPROVER_GROUPS.flatMap((group) => group.options.map((option) => option.value)), ['zhangjq4', 'huangjq5', 'zhangxy43', 'zhangrui32', 'zhangyi44'])
for (const invalid of ['', undefined, null, [], ['zhangjq4'], 'admin', 'zhangjq4,huangjq5', 'zhangjq4（消费业务 to C）']) {
  assert.equal(businessApproverError(invalid), '请选择一位业务负责人。')
  assert.deepEqual(createSelectedBusinessApprovalTasks({ businessApprover: invalid, selectedRoleIds: ['product-op'] }, []), [], '非法值不得回退到角色负责人')
}
const { roles } = createPermissionScopeCatalog()
for (const group of BUSINESS_APPROVER_GROUPS) {
  for (const option of group.options) {
    assert.equal(businessApproverError(option.value), '')
    assert.equal(businessApproverLabel(option.value), option.label)
    for (const roleScope of [[], ['product-op'], ['product-op', 'geo-analyst']]) {
      const tasks = createSelectedBusinessApprovalTasks({ businessApprover: option.value, selectedRoleIds: roleScope, copiedRoleIds: ['product-op'], selectedDataPermissionIds: ['data.ops.region.east'] }, roles)
      assert.equal(tasks.length, 1, '多角色/复制角色只能生成一个指定负责人任务')
      assert.equal(tasks[0].approver, option.value)
      assert.equal(new Set(tasks[0].roleIds).size, tasks[0].roleIds.length)
      assert.equal(tasks[0].status, 'pending')
    }
    const onlyData = createSelectedBusinessApprovalTasks({ businessApprover: option.value, selectedDataPermissionIds: ['data.ops.region.east'] }, roles)
    assert.equal(onlyData.length, 1, '只选数据权限也必须保留业务审批')
    assert.deepEqual(onlyData[0].roleIds, [])
  }
}
const oldTask = { approver: 'zhangjq4', status: 'approved', organizations: ['乐享运营'] }
const changed = createSelectedBusinessApprovalTasks({ businessApprover: 'zhangyi44' }, roles, [oldTask])
assert.equal(changed[0].status, 'pending', '更换审批人不得继承其他人的审批结果')
assert.deepEqual(changed[0].organizations, [])
const same = createSelectedBusinessApprovalTasks({ businessApprover: 'zhangjq4' }, roles, [oldTask])
same[0].organizations.push('GEO 看板')
assert.deepEqual(oldTask.organizations, ['乐享运营'], '重建任务不得修改历史快照对象')
console.log('business approver tests passed')
