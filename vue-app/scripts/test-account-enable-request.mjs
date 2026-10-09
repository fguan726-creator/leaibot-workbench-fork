import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/accountEnableRequest.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
const { validateEnableRequest, submitEnableRequest, disabledIdentityError, ACCOUNT_REQUESTS_KEY, DISABLED_ACCOUNT_KEY, DISABLED_ACCOUNT_TYPE_KEY } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
function storage(initial = '[]') {
  const values = new Map([[ACCOUNT_REQUESTS_KEY, initial]])
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}
const draft = { applicant: 'admin', itcode: 'admin', applicantPersonType: 'internal', personType: 'internal', targetItcode: 'disabled-user', targetUser: '', relatedAccount: '', reason: '恢复业务使用', systemApprover: 'sunzh4' }
assert.deepEqual(validateEnableRequest(draft), {})
assert.ok(validateEnableRequest({ ...draft, reason: ' ' }).reason)
assert.ok(validateEnableRequest({ ...draft, targetItcode: '' }).targetItcode)
assert.ok(validateEnableRequest({ ...draft, personType: 'external', targetUser: 'external-disabled' }).relatedAccount)
assert.ok(validateEnableRequest({ ...draft, personType: 'external', relatedAccount: 'wangxt8' }).targetUser)
const original = { id: 'unrelated', typeKey: 'change', statusKey: 'pending' }
const data = storage(JSON.stringify([original]))
const result = submitEnableRequest(draft, data)
assert.equal(result.duplicate, false)
assert.equal(result.request.typeKey, 'enable')
assert.equal(result.request.nodeType, 'system-admin')
assert.deepEqual(result.request.handlers, ['sunzh4'])
assert.match(result.request.id, /^AP-/)
assert.ok(result.request.token)
assert.equal(result.request.statusKey, 'pending')
assert.equal(result.request.relatedAccount, '')
for (const key of ['mobile', 'email', 'permissionSnapshot', 'businessApprover']) assert.equal(key in result.request, false)
assert.deepEqual(JSON.parse(data.getItem(ACCOUNT_REQUESTS_KEY))[1], original)
const duplicate = submitEnableRequest({ ...draft, targetItcode: 'DISABLED-USER' }, data)
assert.equal(duplicate.duplicate, true)
assert.equal(duplicate.request.id, result.request.id)
assert.equal(JSON.parse(data.getItem(ACCOUNT_REQUESTS_KEY)).length, 2)
const external = submitEnableRequest({ ...draft, personType: 'external', targetUser: 'external-disabled', relatedAccount: 'wangxt8' }, data)
assert.equal(external.request.applicantPersonType, 'internal', 'Applying for an external target must not change the applicant type')
assert.equal(external.request.relatedAccount, 'wangxt8')
const self = submitEnableRequest({ ...draft, itcode: 'external-self', applicant: 'external-self', applicantPersonType: 'external', personType: 'external', targetUser: 'external-self', relatedAccount: 'wangxt8' }, data)
assert.equal(self.request.applicantItcode, self.request.targetItcode)
assert.equal(self.request.applicantPersonType, 'external')
for (const malformed of ['broken-json', '{}']) {
  const broken = storage(malformed)
  assert.throws(() => submitEnableRequest(draft, broken))
  assert.equal(broken.getItem(ACCOUNT_REQUESTS_KEY), malformed, 'Corrupt storage must not be overwritten')
}
assert.throws(() => submitEnableRequest(draft, { getItem: () => '[]', setItem: () => { throw new Error('quota') } }))
assert.throws(() => submitEnableRequest({ ...draft, reason: '' }, data))
const rejected = storage(JSON.stringify([{ ...result.request, statusKey: 'rejected' }]))
assert.equal(submitEnableRequest(draft, rejected).duplicate, false)
const proof = storage()
assert.ok(disabledIdentityError('external-disabled', 'external', proof))
proof.setItem(DISABLED_ACCOUNT_KEY, 'external-disabled')
proof.setItem(DISABLED_ACCOUNT_TYPE_KEY, 'external')
assert.equal(disabledIdentityError('EXTERNAL-DISABLED', 'external', proof), '')
assert.ok(disabledIdentityError('other', 'external', proof))
assert.ok(disabledIdentityError('external-disabled', 'internal', proof))
assert.ok(disabledIdentityError('external-disabled', 'external', { getItem: () => { throw new Error('denied') } }))
console.log('Shared account enable tests passed: fields, identities, duplicate prevention, pending-only creation and storage failures')
