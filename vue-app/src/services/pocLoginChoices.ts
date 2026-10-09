import localAdminPassword from 'virtual:local-poc-admin'
import { allowPreviewAuth } from '@/config/runtimeMode'
import { POC_EXTERNAL_PASSWORD, POC_LOGIN_ACCOUNTS, type PocLoginAccount } from './pocExternalLogin'

// UI choices are intentionally separate from the synthetic authentication fixtures.
export type PocLoginChoice = Pick<PocLoginAccount, 'username' | 'label' | 'loginType'>
const localAdmin: PocLoginChoice = { username: 'admin', label: '管理员 · 正常登录', loginType: 'external' }
// Normal-login demonstrations share the administrator choice; keep auth fixtures intact.
const scenarioChoices = POC_LOGIN_ACCOUNTS.filter((account) => account.disabled || account.accessReason === 'first-access')
export const POC_LOGIN_CHOICES: readonly PocLoginChoice[] = allowPreviewAuth
  ? [...scenarioChoices, ...(import.meta.env.DEV && localAdminPassword ? [localAdmin] : [])]
  : []

export function findPocLoginChoice(username: unknown): PocLoginChoice | undefined {
  return typeof username === 'string'
    ? POC_LOGIN_CHOICES.find((item) => item.username === username.trim().toLowerCase())
    : undefined
}

export function getPocLoginPassword(account: PocLoginChoice): string {
  const choice = findPocLoginChoice(account.username)
  if (!choice) return ''
  return choice.username === 'admin' ? localAdminPassword || '' : POC_EXTERNAL_PASSWORD
}
