/** Shared POC workflow; real account activation remains an administrator approval action. */
export const ACCOUNT_REQUESTS_KEY = 'leaibot-account-request-status-rows'
export const DISABLED_ACCOUNT_KEY = 'leaibot-disabled-login-account'
export const DISABLED_ACCOUNT_TYPE_KEY = 'leaibot-disabled-login-type'
export const EXTERNAL_DISABLED_MESSAGE = '当前账号已被禁用，请联系对应的联想业务接口人申请启用。'

export type PersonType = 'internal' | 'external'
export interface EnableRequestDraft {
  applicant: string
  itcode: string
  applicantPersonType: PersonType
  personType: PersonType
  targetItcode: string
  targetUser: string
  relatedAccount: string
  reason: string
  systemApprover: string
}
export type EnableErrors = Partial<Record<'identity' | 'targetItcode' | 'targetUser' | 'relatedAccount' | 'reason', string>>
export interface AccountEnableRequest {
  id: string
  token: string
  typeKey: 'enable'
  type: string
  applicant: string
  applicantItcode: string
  applicantPersonType: PersonType
  personType: PersonType
  target: string
  targetItcode: string
  relatedAccount: string
  reason: string
  systemApprover: string
  approverItcode: string
  handlers: string[]
  nodeType: string
  node: string
  status: string
  statusKey: string
  time: string
  logs: Array<{ node: string; detail: string; time: string }>
}
export interface EnableSubmission { request: AccountEnableRequest; duplicate: boolean }
type RequestStorage = Pick<Storage, 'getItem' | 'setItem'>

export function validateEnableRequest(draft: EnableRequestDraft): EnableErrors {
  const errors: EnableErrors = {}
  if (!draft.itcode.trim() || !draft.systemApprover.trim()
    || !['internal', 'external'].includes(draft.personType)) errors.identity = '申请身份或审批人信息不完整，请重新进入申请。'
  if (draft.personType === 'internal' && !draft.targetItcode.trim()) errors.targetItcode = '请填写被申请人 ITCode。'
  if (draft.personType === 'external') {
    if (!draft.targetUser.trim()) errors.targetUser = '请填写被申请人用户名。'
    if (!draft.relatedAccount.trim()) errors.relatedAccount = '请填写负责对接的内部员工 ITCode。'
  }
  if (!draft.reason.trim()) errors.reason = '请填写申请原因。'
  return errors
}

export function disabledIdentityError(account: string, personType: PersonType, storage: Pick<Storage, 'getItem'>): string {
  if (personType === 'external') return EXTERNAL_DISABLED_MESSAGE
  try {
    if (account.trim()
      && storage.getItem(DISABLED_ACCOUNT_KEY)?.toLowerCase() === account.trim().toLowerCase()
      && storage.getItem(DISABLED_ACCOUNT_TYPE_KEY) === personType) return ''
  } catch { /* Fail closed if the login proof cannot be read. */ }
  return '请返回登录页重新验证账号状态后再申请启用。'
}

export function submitEnableRequest(draft: EnableRequestDraft, storage: RequestStorage): EnableSubmission {
  const errors = validateEnableRequest(draft)
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  const target = (draft.personType === 'external' ? draft.targetUser : draft.targetItcode).trim()
  const rows: unknown = JSON.parse(storage.getItem(ACCOUNT_REQUESTS_KEY) || '[]')
  if (!Array.isArray(rows)) throw new Error('申请记录格式异常，未覆盖已有记录。')
  const existing = rows.find(row => row && row.typeKey === 'enable'
    && row.personType === draft.personType
    && typeof row.targetItcode === 'string'
    && row.targetItcode.toLowerCase() === target.toLowerCase()
    && row.statusKey === 'pending')
  if (existing) return { request: existing, duplicate: true }

  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  const request: AccountEnableRequest = {
    id: `AP-${date}-${crypto.randomUUID()}`,
    token: crypto.randomUUID(),
    typeKey: 'enable', type: '启用账号',
    applicant: draft.applicant.trim() || draft.itcode.trim(),
    applicantItcode: draft.itcode.trim(),
    applicantPersonType: draft.applicantPersonType,
    personType: draft.personType,
    target, targetItcode: target,
    relatedAccount: draft.personType === 'external' ? draft.relatedAccount.trim() : '',
    reason: draft.reason.trim(),
    systemApprover: draft.systemApprover.trim(),
    approverItcode: draft.systemApprover.trim(),
    handlers: [draft.systemApprover.trim()],
    nodeType: 'system-admin', node: '系统管理员审批',
    status: '待我审批', statusKey: 'pending', time,
    logs: [{ node: '申请人提交', detail: '已提交账号启用申请，等待系统管理员审批。', time }]
  }
  // Preserve other applications; failed writes must not be reported as submitted.
  storage.setItem(ACCOUNT_REQUESTS_KEY, JSON.stringify([request, ...rows]))
  return { request, duplicate: false }
}
