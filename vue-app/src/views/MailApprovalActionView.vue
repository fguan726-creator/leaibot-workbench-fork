<template>
  <main class="mail-approval-page">
    <section class="mail-approval-card">
      <div class="approval-brand">
        <div class="approval-logo">L</div>
        <span>联想乐享</span>
      </div>

      <div class="approval-body">
        <span class="approval-eyebrow">邮件审批确认</span>
        <h1>{{ actionLabel }}申请</h1>
        <p>{{ message }}</p>

        <dl class="approval-summary">
          <div>
            <dt>申请单号</dt>
            <dd>{{ ticket || '-' }}</dd>
          </div>
          <div>
            <dt>审批动作</dt>
            <dd>{{ actionLabel }}</dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>{{ sourceLabel }}</dd>
          </div>
        </dl>

        <div v-if="!confirmed" class="approval-actions">
          <a :href="fallbackLink" class="secondary-link">先查看详情</a>
          <button type="button" :class="['confirm-btn', action === 'reject' ? 'reject' : 'agree']" @click="confirmAction">确认{{ actionLabel }}</button>
        </div>

        <div v-else class="approval-result" :class="resultClass">
          <b>{{ resultTitle }}</b>
          <p>{{ resultDetail }}</p>
          <a :href="fallbackLink">查看同步后的状态</a>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const ACTION_KEY = 'leaibot-mail-approval-actions'
const REGISTER_KEY = 'leaibot-account-request-status-rows'
const PERMISSION_KEY = 'leaibot-approval-mail-mock-rows'

const route = useRoute()
const confirmed = ref(false)
const resultTitle = ref('')
const resultDetail = ref('')

const ticket = computed(() => String(route.query.ticket || ''))
const action = computed(() => String(route.query.action || 'approve'))
const source = computed(() => String(route.query.source || 'permissions'))
const token = computed(() => String(route.query.token || 'mock'))
const approver = computed(() => String(route.query.approver || ''))
const identity = computed(() => String(route.query.identity || 'approver'))
const actionLabel = computed(() => action.value === 'reject' ? '驳回' : '同意')
const sourceLabel = computed(() => source.value === 'account-register' ? '账号/访问申请' : '权限申请')
const resultClass = computed(() => action.value === 'reject' ? 'reject' : 'agree')
const message = computed(() => `请确认是否通过邮件直接${actionLabel.value}该${sourceLabel.value}。确认后会写入 mock 审批记录，并同步审批列表/进度查询页。`)
const fallbackLink = computed(() => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  if (source.value === 'account-register') return `${base}/account-request/status?ticket=${encodeURIComponent(ticket.value)}&token=${encodeURIComponent(token.value)}`
  return `${base}/agent/permissions?module=approval&ticket=${encodeURIComponent(ticket.value)}&approver=${encodeURIComponent(approver.value)}&viewer=approver&identity=${encodeURIComponent(identity.value)}`
})

function readList(key: string) {
  if (typeof window === 'undefined') return [] as any[]
  try {
    return JSON.parse(window.localStorage.getItem(key) || '[]')
  } catch {
    return [] as any[]
  }
}

function writeList(key: string, value: any[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function appendMailAction() {
  const id = `${source.value}-${ticket.value}-${identity.value || 'approver'}-${approver.value || 'mail-approver'}-${action.value}`
  const now = new Date()
  const time = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const actions = readList(ACTION_KEY)
  const existing = actions.find((item: any) => item.id === id)
  if (existing) return { ...existing, duplicate: true }
  const record = {
    id,
    ticket: ticket.value,
    source: source.value,
    action: action.value === 'reject' ? 'reject' : 'approve',
    token: token.value,
    identity: identity.value,
    operator: approver.value || 'mail-approver',
    time
  }
  actions.unshift(record)
  writeList(ACTION_KEY, actions.slice(0, 50))
  return record
}

function registerNodeFromIdentity(identity: string) {
  const role = String(identity || '').split(':')[0]
  const map: Record<string, string> = {
    relation: 'relation',
    'applicant-manager': 'applicant-manager',
    'target-manager': 'target-manager',
    'system-admin': 'system-admin'
  }
  return map[role] || ''
}

function registerNodeMeta(nodeType: string, row: any) {
  const map: Record<string, any> = {
    relation: { node: '关联人审批', approverItcode: row.relatedAccount || row.approverItcode, handlers: [row.relatedAccount || row.approverItcode].filter(Boolean) },
    'applicant-manager': { node: '申请人直线经理审批', approverItcode: row.applicantManager || 'sunll1', handlers: [row.applicantManager || 'sunll1'] },
    'target-manager': { node: '被申请人直线经理审批', approverItcode: row.targetManager || row.applicantManager || 'sunll1', handlers: [row.targetManager || row.applicantManager || 'sunll1'] },
    'system-admin': { node: '系统管理员审批', approverItcode: row.systemApprover || 'sunzh4', handlers: [row.systemApprover || 'sunzh4'] }
  }
  return map[nodeType] || map['applicant-manager']
}

function updateRegisterNode(row: any, nodeType: string) {
  const meta = registerNodeMeta(nodeType, row)
  row.nodeType = nodeType
  row.node = meta.node
  row.approverItcode = meta.approverItcode
  row.handlers = meta.handlers
  row.status = '待我审批'
  row.statusKey = 'pending'
}

function applyRegisterAction(record: any) {
  const rows = readList(REGISTER_KEY)
  const index = rows.findIndex((item: any) => item.id === record.ticket && item.token === record.token)
  if (index < 0) return false
  const row = rows[index]
  if (row.statusKey === 'done' || row.status === '已完成' || row.status === '执行完成' || row.statusKey === 'rejected' || row.status === '已驳回') return true
  const approve = record.action === 'approve'
  const currentNodeType = row.nodeType || registerNodeFromIdentity(record.identity) || 'applicant-manager'
  const actionNodeType = registerNodeFromIdentity(record.identity)
  if (actionNodeType && currentNodeType !== actionNodeType) return false

  row.logs = [...(row.logs || []), {
    node: row.node || registerNodeMeta(currentNodeType, row).node,
    detail: approve ? '审批人通过邮件确认同意。' : '审批人通过邮件确认驳回。',
    time: record.time,
    operator: record.operator
  }]

  if (!approve) {
    row.status = '已驳回'
    row.statusKey = 'rejected'
    row.nodeType = 'rework'
    row.node = '申请人修改'
    row.result = '申请已通过邮件审批被驳回，请根据反馈重新提交。'
    rows[index] = row
    writeList(REGISTER_KEY, rows)
    return true
  }

  if (row.typeKey === 'enable') {
    if (currentNodeType !== 'system-admin') return false
    row.status = '已完成'
    row.statusKey = 'done'
    row.nodeType = 'done'
    row.node = '启用执行完成'
    row.result = '系统管理员已批准账号启用申请，请重新登录并重新检查工作台权限。'
    row.logs.push({ node: '系统执行结果', detail: row.result, time: record.time })
    rows[index] = row
    writeList(REGISTER_KEY, rows)
    return true
  }

  if (currentNodeType === 'relation') {
    updateRegisterNode(row, 'applicant-manager')
  } else if (currentNodeType === 'applicant-manager') {
    updateRegisterNode(row, 'target-manager')
  } else if (currentNodeType === 'target-manager') {
    updateRegisterNode(row, 'system-admin')
  } else {
    row.status = '已完成'
    row.statusKey = 'done'
    row.nodeType = 'done'
    row.node = '执行完成'
    const accessRequest = row.typeKey === 'workspace-access'
    row.result = accessRequest ? '系统已根据系统管理员审批结果开通工作台访问权限，执行结果：成功。' : '系统已根据系统管理员审批结果创建账号，执行结果：成功。'
    row.logs.push({ node: '系统执行结果', detail: accessRequest ? '系统已开通工作台访问权限，执行结果：成功。' : '系统已创建账号，执行结果：成功。', time: record.time })
  }
  rows[index] = row
  writeList(REGISTER_KEY, rows)
  return true
}

function applyPermissionSnapshot(record: any) {
  const rows = readList(PERMISSION_KEY)
  return rows.some((item: any) => item.id === record.ticket)
}

function confirmAction() {
  if (!ticket.value) {
    confirmed.value = true
    resultTitle.value = '无法处理'
    resultDetail.value = '审批链接缺少申请单号，请返回邮件重新打开。'
    return
  }
  const record = appendMailAction()
  const synced = source.value === 'account-register' ? applyRegisterAction(record) : applyPermissionSnapshot(record)
  confirmed.value = true
  resultTitle.value = record.duplicate ? '该邮件审批已处理' : `已${actionLabel.value}`
  resultDetail.value = synced
    ? `处理结果已写入 mock 状态，${sourceLabel.value}会同步更新。`
    : '处理结果已记录。若审批列表暂未同步，请先打开对应申请页面生成本地 mock 数据。'
}
</script>

<style scoped>
.mail-approval-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 18px;
  background: #f3f6fb;
  color: #172033;
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

.mail-approval-card {
  width: min(760px, 100%);
  border: 1px solid #dfe7f2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.10);
  overflow: hidden;
}

.approval-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e6edf5;
  padding: 18px 28px;
  font-weight: 800;
}

.approval-logo {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #e2231a;
  color: #fff;
}

.approval-body {
  padding: 32px;
}

.approval-eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: #316dff;
  font-size: 13px;
  font-weight: 800;
}

.approval-body h1 {
  margin: 0;
  color: #101828;
  font-size: 28px;
  line-height: 1.3;
}

.approval-body p {
  margin: 10px 0 0;
  color: #5f6b7a;
  font-size: 14px;
  line-height: 1.7;
}

.approval-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 26px 0;
}

.approval-summary div {
  border: 1px solid #e6edf5;
  border-radius: 8px;
  padding: 14px;
  background: #f8fafc;
}

.approval-summary dt {
  margin-bottom: 6px;
  color: #8a96a8;
  font-size: 12px;
  font-weight: 800;
}

.approval-summary dd {
  margin: 0;
  color: #172033;
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.approval-actions,
.approval-result {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e6edf5;
  padding-top: 20px;
}

.secondary-link,
.approval-result a,
.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border-radius: 6px;
  padding: 0 16px;
  font-weight: 800;
  text-decoration: none;
}

.secondary-link,
.approval-result a {
  border: 1px solid #d8e1ee;
  background: #fff;
  color: #455468;
}

.confirm-btn {
  border: 0;
  color: #fff;
  cursor: pointer;
}

.confirm-btn.agree {
  background: #18a058;
}

.confirm-btn.reject {
  background: #e53935;
}

.approval-result {
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 8px;
  border: 1px solid #d9eadf;
  padding: 16px;
  background: #f4fbf7;
}

.approval-result.reject {
  border-color: #ffd0d0;
  background: #fff7f7;
}

.approval-result b {
  display: block;
  color: #172033;
}

@media (max-width: 640px) {
  .approval-body {
    padding: 24px 18px;
  }

  .approval-summary {
    grid-template-columns: 1fr;
  }

  .approval-actions,
  .approval-result {
    display: grid;
    justify-content: stretch;
  }
}
</style>
