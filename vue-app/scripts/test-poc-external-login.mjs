import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/pocExternalLogin.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { resolvePocExternalLogin: login, resolvePocLogin, findPocLoginAccount, POC_LOGIN_ACCOUNTS, POC_EXTERNAL_PASSWORD: password } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const unreadable = () => { throw new Error('storage unavailable') }
const requests = (rows) => () => JSON.stringify(rows)
const done = { typeKey: 'enable', targetItcode: 'external-disabled', statusKey: 'done', nodeType: 'done' }

for (const account of ['external-noaccess', 'external-disabled']) {
  assert.equal(login(account, password, false, unreadable), null, 'Server mode must ignore demo accounts and their local state')
  assert.equal(login(account, 'wrong', true, unreadable), 'invalid-password', 'Password errors must not expose account state')
}
assert.equal(login('ordinary-user', password, true, unreadable), null, 'Ordinary login remains handled by the server')
assert.equal(login(' EXTERNAL-NOACCESS ', password, true, unreadable), 'no-access')
assert.equal(login('external-disabled', password, true, requests([])), 'disabled')
for (const statusKey of ['pending', 'rejected']) {
  assert.equal(login('external-disabled', password, true, requests([{ ...done, statusKey }])), 'disabled')
}
assert.equal(login('external-disabled', password, true, requests([{ ...done, nodeType: 'system-admin' }])), 'disabled', 'An unfinished enable node cannot unlock login')
assert.equal(login('external-disabled', password, true, requests([{ ...done, targetItcode: 'other-user' }])), 'disabled')
assert.equal(login('external-disabled', password, true, requests([{ ...done, typeKey: 'change' }])), 'disabled')
assert.equal(login('external-disabled', password, true, requests([done])), 'no-access', 'Enable approval must not grant workspace permissions')
assert.equal(login('external-disabled', password, true, requests([{ ...done, statusKey: 'rejected' }, done])), 'no-access', 'A rejected request must not undo an executed enable approval')
assert.throws(() => login('external-disabled', password, true, requests({})))
assert.throws(() => login('external-disabled', password, true, () => 'broken-json'))
assert.throws(() => login('external-disabled', password, true, unreadable))
assert.equal(POC_LOGIN_ACCOUNTS.length, 5)
assert.equal(new Set(POC_LOGIN_ACCOUNTS.map((item) => item.username)).size, 5)
assert.equal(findPocLoginAccount('admin', true), undefined)
assert.equal(findPocLoginAccount(['noaccess'], true), undefined)
assert.equal(findPocLoginAccount('noaccess', true).accessReason, 'first-access')
for (const username of ['guest01', 'external-noaccess', 'internal-disabled', 'external-disabled']) {
  assert.equal(findPocLoginAccount(username, true).accessReason, 'permissions-removed')
}
for (const account of POC_LOGIN_ACCOUNTS) {
  assert.equal(findPocLoginAccount(account.username, false), undefined)
  assert.equal(resolvePocLogin(account.username, password, account.loginType, false, unreadable), null)
  assert.equal(resolvePocLogin(account.username, 'wrong', account.loginType, true, unreadable), 'invalid-password')
  assert.equal(resolvePocLogin(account.username, password, account.loginType === 'internal' ? 'external' : 'internal', true, unreadable), 'wrong-login-type')
  assert.equal(resolvePocLogin(account.username, password, account.loginType, true, requests([])), account.disabled ? 'disabled' : 'no-access')
  if (account.disabled) {
    const completed = { ...done, targetItcode: account.username }
    assert.equal(resolvePocLogin(account.username, password, account.loginType, true, requests([completed])), 'no-access')
    assert.equal(resolvePocLogin(account.username, password, account.loginType, true, requests([{ ...completed, statusKey: 'pending' }])), 'disabled')
    assert.throws(() => resolvePocLogin(account.username, password, account.loginType, true, unreadable))
  }
}
console.log('Five POC scenarios: mode isolation, account types, passwords, approvals and storage failures passed')
