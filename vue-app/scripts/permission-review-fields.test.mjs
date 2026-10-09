import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/views/agent/AgentPermissionsView.vue', import.meta.url), 'utf8')
const script = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
const ast = ts.createSourceFile('permissions.ts', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'validateUserWorkspace')

test('user editor removes validity without changing internal/external creation choices', () => {
  const editor = source.slice(source.indexOf('v-if="userWorkspace.visible"'), source.indexOf('<PermissionRolePickerModal', source.indexOf('v-if="userWorkspace.visible"')))
  assert.doesNotMatch(editor, /有效期|有效时间|draft\.validUntil/)
  assert.match(editor, /userWorkspace\.draft\.userType/)
  assert.match(editor, /内部人员/)
  assert.match(editor, /外部人员/)
})

test('organization UI hides code and creator while retaining member actions and internal identifiers', () => {
  const org = source.slice(source.indexOf('ref="organizationDialogRoot"'), source.indexOf('v-if="organizationMemberModal.visible"'))
  assert.doesNotMatch(org, /<span>Code<\/span>|<span>创建人<\/span>|{{ selectedOrganization\.code }}/)
  assert.match(org, /添加成员/)
  assert.match(org, /编辑信息/)
  assert.match(org, /移除组织/)
  assert.match(source, /org\.code = draft\.code/)
})

test('actual user validation accepts missing validity but still enforces manager, tenant and external contact', () => {
  assert.ok(fn)
  const workspace = { mode: 'edit', errors: {}, draft: { name: '', loginAccount: 'qa-user', userType: '内部用户', targetManager: 'manager', tenant: ['leaibot-cn'], roleIds: [], extraDataPermissionIds: [], customDataRules: [] } }
  const dependencies = {
    userWorkspace: workspace,
    resetUserWorkspaceErrors: () => { workspace.errors = {} },
    normalizeTenantList: values => values || [],
    userPermissionChanged: { value: false },
    businessApproverError: value => value ? '' : 'required',
    validateCustomTableRules: () => '',
    detectCustomDataRoleConflicts: () => [],
    roleObjectsForIds: () => [],
    roleConflictMessage: () => '',
    activePendingUserPermissionApproval: { value: null }
  }
  const validate = new Function(...Object.keys(dependencies), fn.getText(ast) + '; return validateUserWorkspace')(...Object.values(dependencies))
  assert.equal(validate(), true)
  workspace.draft.validUntil = ''
  assert.equal(validate(), true)
  workspace.draft.targetManager = ''
  assert.equal(validate(), false)
  workspace.draft.userType = '外部用户'
  assert.equal(validate(), false)
  workspace.draft.relatedAccount = 'contact'
  assert.equal(validate(), true)
  workspace.draft.tenant = []
  assert.equal(validate(), false)
})
