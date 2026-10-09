import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

async function service(name) {
  const source = readFileSync(new URL('../src/services/' + name + '.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'))
}
const { resolvePocLogin, POC_EXTERNAL_PASSWORD } = await service('pocExternalLogin')
const { submitEnableRequest, ACCOUNT_REQUESTS_KEY } = await service('accountEnableRequest')
function storage(rows) {
  let value = JSON.stringify(rows)
  return { getItem: () => value, setItem(key, next) { assert.equal(key, ACCOUNT_REQUESTS_KEY); value = next } }
}
// Execute the actual component persistence functions, not copies of their implementation.
function componentFunction(file, name, localStorage) {
  const vue = readFileSync(new URL('../src/views/' + file, import.meta.url), 'utf8')
  const script = vue.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
  const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
  assert.ok(fn, name + ' must exist in the actual component')
  const { outputText } = ts.transpileModule(fn.getText(ast), { compilerOptions: { module: ts.ModuleKind.ESNext } })
  return new Function('window', outputText + '; return ' + name)({ localStorage })
}
const unrelated = Array.from({ length: 30 }, (_, i) => ({ id: 'other-' + i, typeKey: 'create', token: 'token-' + i, statusKey: 'pending' }))
for (const type of ['internal', 'external']) {
  const account = type + '-disabled'
  const draft = { applicant: 'admin', itcode: 'admin', applicantPersonType: 'internal', personType: type,
    targetItcode: account, targetUser: account, relatedAccount: 'wangxt8', reason: 'QA enable', systemApprover: 'sunzh4' }
  const completed = { id: 'enabled-' + type, typeKey: 'enable', personType: type, targetItcode: account, statusKey: 'done', nodeType: 'done', logs: [] }
  const login = data => resolvePocLogin(account, POC_EXTERNAL_PASSWORD, type, true, () => data.getItem())

  test(type + ': approval sync preserves an oldest request beyond 20 and every unrelated record', () => {
    const pending = { ...completed, statusKey: 'pending', nodeType: 'system-admin' }
    const data = storage([...unrelated, pending])
    const sync = componentFunction('agent/AgentPermissionsView.vue', 'syncPublicEnableRequest', data)
    sync({ ...completed, status: '已完成', node: '执行完成', handlers: ['sunzh4'] }, '2026-10-09 12:00')
    const rows = JSON.parse(data.getItem())
    assert.equal(rows.length, 31)
    assert.deepEqual(rows.slice(0, 30), unrelated)
    assert.equal(rows[30].id, completed.id)
    assert.equal(rows[30].statusKey, 'done')
    assert.equal(login(data), 'no-access', 'Enabled does not mean workspace permission granted')
  })
  test(type + ': a new pending/rejected request cannot revoke an already completed enable', () => {
    const data = storage([completed])
    assert.equal(login(data), 'no-access')
    const { request } = submitEnableRequest(draft, data)
    assert.equal(request.statusKey, 'pending')
    assert.equal(login(data), 'no-access')
    assert.equal(submitEnableRequest(draft, data).duplicate, true)
    const sync = componentFunction('agent/AgentPermissionsView.vue', 'syncPublicEnableRequest', data)
    sync({ ...request, statusKey: 'rejected', nodeType: 'rework', status: '已驳回' }, '2026-10-09 12:01')
    assert.equal(login(data), 'no-access')
    assert.deepEqual(JSON.parse(data.getItem())[1], completed)
  })
  test(type + ': absent, pending, rejected or partially executed approval never enables', () => {
    for (const rows of [[], [{ ...completed, statusKey: 'pending' }], [{ ...completed, statusKey: 'rejected' }],
      [{ ...completed, nodeType: 'system-admin' }], [{ ...completed, targetItcode: 'someone-else' }]]) {
      assert.equal(login(storage(rows)), 'disabled')
    }
    assert.equal(login(storage([null, ...unrelated, completed])), 'no-access')
    assert.equal(resolvePocLogin(account, 'wrong', type, true, () => JSON.stringify([completed])), 'invalid-password')
    assert.equal(resolvePocLogin(account, POC_EXTERNAL_PASSWORD, type, false, () => { throw new Error('Must not read POC state') }), null)
  })
}
test('legacy account creation cannot truncate shared enable records either', () => {
  const initial = [...unrelated, { id: 'old-enable', typeKey: 'enable', statusKey: 'done', nodeType: 'done' }]
  const data = storage(initial)
  const persist = componentFunction('LoginView.vue', 'persistRegisterRequest', data)
  const created = { id: 'new-created', typeKey: 'create' }
  persist(created)
  assert.deepEqual(JSON.parse(data.getItem()), [created, ...initial])
})
