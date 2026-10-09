export const POC_EXTERNAL_PASSWORD = 'Poc123456!'
export const POC_ACCOUNT_REQUESTS_KEY = 'leaibot-account-request-status-rows'

export type PocLoginType = 'internal' | 'external'
export interface PocLoginAccount {
  readonly username: string
  readonly label: string
  readonly loginType: PocLoginType
  readonly disabled: boolean
  readonly accessReason: 'first-access' | 'permissions-removed'
}

/** Public, synthetic POC fixtures only. Never add real accounts or their passwords here. */
export const POC_LOGIN_ACCOUNTS: readonly PocLoginAccount[] = [
  { username: 'noaccess', label: '内部人员 · 首次登录申请权限', loginType: 'internal', disabled: false, accessReason: 'first-access' },
  { username: 'guest01', label: '内部人员 · 权限被移除', loginType: 'internal', disabled: false, accessReason: 'permissions-removed' },
  { username: 'internal-disabled', label: '内部人员 · 账号被禁用', loginType: 'internal', disabled: true, accessReason: 'permissions-removed' },
  { username: 'external-noaccess', label: '外部人员 · 权限被移除', loginType: 'external', disabled: false, accessReason: 'permissions-removed' },
  { username: 'external-disabled', label: '外部人员 · 账号被禁用', loginType: 'external', disabled: true, accessReason: 'permissions-removed' }
]

export function findPocLoginAccount(username: unknown, previewEnabled: boolean) {
  if (!previewEnabled || typeof username !== 'string') return undefined
  return POC_LOGIN_ACCOUNTS.find((item) => item.username === username.trim().toLowerCase())
}

type PocLoginResult = 'invalid-password' | 'wrong-login-type' | 'disabled' | 'no-access' | null

/** Only preview mode may use these fixtures. No fixture grants workspace access. */
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
  if (!fixture.disabled) return 'no-access'

  const rows: unknown = JSON.parse(readRequests() || '[]')
  if (!Array.isArray(rows)) throw new Error('Invalid POC account request storage')
  // The shared request list is newest-first. Pending/rejected requests never enable an account.
  const latest = rows.find((row) => row && typeof row === 'object'
    && row.typeKey === 'enable'
    && typeof row.targetItcode === 'string'
    && row.targetItcode.toLowerCase() === fixture.username)
  return latest?.statusKey === 'done' && latest?.nodeType === 'done' ? 'no-access' : 'disabled'
}
