import test from 'node:test'
import assert from 'node:assert/strict'
import { checkMailReviewAccess, ensureMailReviewGrant, readApprovalMailRows, saveApprovalMailRow } from '../src/services/approvalMailReview.ts'

function fixture() {
  const row = { id: 'QA-review', nodeType: 'applicant-manager', statusKey: 'pending', approverItcode: 'manager' }
  const grant = ensureMailReviewGrant(row, 'applicant-manager', 'manager', 100)
  const query = { ticket: row.id, identity: 'applicant-manager', approver: 'manager', token: grant.token }
  return { row, grant, query }
}
test('Only a valid ticket, recipient, node and token can approve in preview', () => {
  const { row, query } = fixture()
  assert.equal(checkMailReviewAccess(row, query, true, 101), 'ready')
  for (const field of ['ticket', 'identity', 'approver', 'token']) {
    assert.equal(checkMailReviewAccess(row, { ...query, [field]: 'invalid' }, true, 101), 'invalid')
  }
  assert.equal(checkMailReviewAccess(row, query, false, 101), 'invalid')
  assert.equal(checkMailReviewAccess(undefined, query, true, 101), 'invalid')
})
test('Expiry fails closed and reissued links invalidate old tokens', () => {
  const { row, grant, query } = fixture()
  assert.equal(checkMailReviewAccess(row, query, true, grant.expiresAt), 'expired')
  ensureMailReviewGrant(row, 'applicant-manager', 'manager', grant.expiresAt)
  assert.equal(checkMailReviewAccess(row, query, true, grant.expiresAt), 'invalid')
})
test('Completed, rejected, not-yet-current and changed-recipient nodes are readonly', () => {
  const { row, query } = fixture()
  for (const statusKey of ['done', 'rejected']) assert.equal(checkMailReviewAccess({ ...row, statusKey }, query, true, 101), 'readonly')
  assert.equal(checkMailReviewAccess({ ...row, nodeType: 'target-manager' }, query, true, 101), 'readonly')
  assert.equal(checkMailReviewAccess({ ...row, approverItcode: 'another' }, query, true, 101), 'readonly')
})
test('Business approval is bound to its individual pending task', () => {
  const row = { id: 'business', nodeType: 'business', statusKey: 'pending', approverItcode: 'another', businessApprovalTasks: [{ approver: 'owner', status: 'pending' }] }
  const grant = ensureMailReviewGrant(row, 'business-owner:owner', 'owner', 100)
  const query = { ticket: row.id, identity: 'business-owner:owner', approver: 'owner', token: grant.token }
  assert.equal(checkMailReviewAccess(row, query, true, 101), 'ready')
  row.businessApprovalTasks[0].status = 'approved'
  assert.equal(checkMailReviewAccess(row, query, true, 101), 'readonly')
  assert.equal(ensureMailReviewGrant(row, 'applicant', 'owner', 100), null)
  assert.equal(ensureMailReviewGrant(row, 'system-admin', 'owner', 100), null)
})
test('Saving preserves history, rejects stale records and leaves revisions unchanged on failure', () => {
  let value = JSON.stringify(Array.from({ length: 31 }, (_, i) => ({ id: String(i), approvalRevision: 1 })))
  const storage = { getItem: () => value, setItem: (_key, next) => { value = next } }
  const { row } = fixture()
  saveApprovalMailRow(storage, row)
  assert.equal(readApprovalMailRows(storage).length, 32)
  assert.equal(row.approvalRevision, 1)
  assert.throws(() => saveApprovalMailRow(storage, { ...row, approvalRevision: 0 }), /已更新/)
  assert.throws(() => saveApprovalMailRow({ ...storage, setItem: () => { throw new Error('quota') } }, row), /quota/)
  assert.equal(row.approvalRevision, 1)
  value = '{broken'
  assert.throws(() => readApprovalMailRows(storage))
  value = '{}'
  assert.throws(() => readApprovalMailRows(storage), /读取失败/)
})
