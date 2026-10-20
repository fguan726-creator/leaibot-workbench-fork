// Local POC only. Production must validate signed, expiring links on the server.
export const APPROVAL_MAIL_ROWS_KEY = 'leaibot-approval-mail-mock-rows'
export interface MailReviewGrant {
  token: string
  nodeType: string
  approver: string
  expiresAt: number
}
export interface MailReviewRow {
  id: string
  approvalRevision?: number
  guestApprovalLinks?: Record<string, MailReviewGrant>
  nodeType: string
  statusKey: string
  approverItcode: string
  businessApprovalTasks?: { approver: string; status: string }[]
}
export interface MailReviewQuery { ticket: string; identity: string; approver: string; token: string }
export type MailReviewState = 'invalid' | 'expired' | 'ready' | 'readonly'

export function leaderMailNode(role: string): string {
  if (role === 'applicant-manager' || role === 'target-manager') return role
  return role.startsWith('business-owner:') ? 'business' : ''
}

export function ensureMailReviewGrant(row: MailReviewRow, role: string, approver: string, now = Date.now()): MailReviewGrant | null {
  const nodeType = leaderMailNode(role)
  if (!nodeType || !approver) return null
  row.guestApprovalLinks ||= {}
  const previous = row.guestApprovalLinks[role]
  if (previous && previous.approver === approver && previous.nodeType === nodeType && previous.expiresAt > now) return previous
  const grant = { token: crypto.randomUUID(), nodeType, approver, expiresAt: now + 7 * 24 * 60 * 60 * 1000 }
  row.guestApprovalLinks[role] = grant
  return grant
}

export function checkMailReviewAccess(row: MailReviewRow | undefined, query: MailReviewQuery, preview: boolean, now = Date.now()): MailReviewState {
  if (!preview || !row || row.id !== query.ticket || !query.token || !query.approver) return 'invalid'
  const grant = row.guestApprovalLinks?.[query.identity]
  if (!grant || grant.token !== query.token || grant.approver !== query.approver || grant.nodeType !== leaderMailNode(query.identity) || !grant.nodeType) return 'invalid'
  if (!Number.isFinite(grant.expiresAt) || grant.expiresAt <= now) return 'expired'
  if (row.statusKey !== 'pending' || row.nodeType !== grant.nodeType) return 'readonly'
  const current = row.nodeType === 'business'
    ? row.businessApprovalTasks?.some(task => task.status === 'pending' && task.approver === grant.approver)
    : row.approverItcode === grant.approver
  return current ? 'ready' : 'readonly'
}

export function readApprovalMailRows(storage: Pick<Storage, 'getItem'>): MailReviewRow[] {
  const rows: unknown = JSON.parse(storage.getItem(APPROVAL_MAIL_ROWS_KEY) || '[]')
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row.id !== 'string')) throw new Error('审批演示记录读取失败，请恢复演示数据后重试。')
  return rows
}

// Compare-and-save is called inside the shared cross-tab Web Lock by both entries.
export function saveApprovalMailRow<T extends MailReviewRow>(storage: Pick<Storage, 'getItem' | 'setItem'>, row: T): void {
  const rows = readApprovalMailRows(storage)
  const previous = rows.find(item => item.id === row.id)
  if ((previous?.approvalRevision || 0) > (row.approvalRevision || 0)) throw new Error('申请已更新，请刷新详情后重新审批。')
  const nextRevision = (row.approvalRevision || 0) + 1
  const next = { ...row, approvalRevision: nextRevision }
  storage.setItem(APPROVAL_MAIL_ROWS_KEY, JSON.stringify([next, ...rows.filter(item => item.id !== row.id)]))
  row.approvalRevision = nextRevision
}
