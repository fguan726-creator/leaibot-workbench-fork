export const POC_EXTERNAL_PASSWORD = 'Poc123456!'
export const POC_ACCOUNT_REQUESTS_KEY = 'leaibot-account-request-status-rows'

export type PocLoginType = 'internal' | 'external'
export interface PocLoginAccount {
  readonly username: string
  readonly label: string
  readonly loginType: PocLoginType
  readonly disabled: boolean
  readonly accessReason: 'first-access' | 'active'
}

/** Public, synthetic POC fixtures only. Never add real accounts or their passwords here. */
export const POC_LOGIN_ACCOUNTS: readonly PocLoginAccount[] = [
  { username: 'noaccess', label: '内部人员 · 首次登录申请权限', loginType: 'internal', disabled: false, accessReason: 'first-access' },
  { username: 'internal-active', label: '内部人员 · 正常登录', loginType: 'internal', disabled: false, accessReason: 'active' },
  { username: 'internal-disabled', label: '内部人员 · 账号被禁用', loginType: 'internal', disabled: true, accessReason: 'active' },
  { username: 'external-active', label: '外部人员 · 正常登录', loginType: 'external', disabled: false, accessReason: 'active' },
  { username: 'external-disabled', label: '外部人员 · 账号被禁用', loginType: 'external', disabled: true, accessReason: 'active' }
]

export function findPocLoginAccount(username: unknown, previewEnabled: boolean) {
  if (!previewEnabled || typeof username !== 'string') return undefined
  return POC_LOGIN_ACCOUNTS.find((item) => item.username === username.trim().toLowerCase())
}

type PocLoginResult = 'invalid-password' | 'wrong-login-type' | 'disabled' | 'no-access' | 'active' | null

/** Only preview mode may use these synthetic fixtures; never authenticate a server account. */
export function resolvePocExternalLogin(
  username: string,
  password: string,
  previewEnabled: boolean,
  readRequests: () => string | null
): PocLoginResult {
  return resolvePocLogin(username, password, 'external', previewEnabled, readRequests)
}

export function resolvePocLogin(
  username: string,
  password: string,
  loginType: PocLoginType,
  previewEnabled: boolean,
  readRequests: () => string | null
): PocLoginResult {
  const fixture = findPocLoginAccount(username, previewEnabled)
  if (!fixture) return null
  if (password !== POC_EXTERNAL_PASSWORD) return 'invalid-password'
  if (fixture.loginType !== loginType) return 'wrong-login-type'
  if (!fixture.disabled) return fixture.accessReason === 'first-access' ? 'no-access' : 'active'

  const rows: unknown = JSON.parse(readRequests() || '[]')
  if (!Array.isArray(rows)) throw new Error('Invalid POC account request storage')
  // Only an executed approval changes the fixture's initial disabled state.
  // A newer pending/rejected request must not undo an already completed enable.
  const completedEnable = rows.find((row) => row && typeof row === 'object'
    && row.typeKey === 'enable'
    && row.statusKey === 'done' && row.nodeType === 'done'
    && typeof row.targetItcode === 'string'
    && row.targetItcode.toLowerCase() === fixture.username)
  return completedEnable ? 'active' : 'disabled'
}
