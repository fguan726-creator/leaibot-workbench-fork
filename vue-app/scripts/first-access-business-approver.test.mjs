import assert from 'node:assert/strict'
import test, { after, afterEach, beforeEach } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { createRenderer, createSSRApp, h, ssrContextKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'

// Keep the real Vue components, catalog, validation and approval transition code.
// Only browser storage/document surfaces are local test doubles; no requests run.
const previous = Object.fromEntries(['window', 'document', 'localStorage'].map(key => [key, globalThis[key]]))
const entries = new Map()
const storage = {
  getItem: key => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, String(value)),
  removeItem: key => entries.delete(key)
}
const classList = { add() {}, remove() {} }
globalThis.localStorage = storage
globalThis.window = { localStorage: storage, location: { origin: 'http://first-access.test' } }
globalThis.document = { documentElement: { classList }, body: { classList }, querySelector() { return null } }
const host = createHttpServer()
const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  logLevel: 'error', appType: 'custom',
  server: { middlewareMode: true, hmr: { server: host } }
})
const [{ default: Access }, { useAppStore }] = await Promise.all([
  server.ssrLoadModule('/src/views/AccessDeniedView.vue'),
  server.ssrLoadModule('/src/stores/app.ts')
])
const renderer = createRenderer({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null
})
const mounted = []
const STORAGE_KEY = 'leaibot-first-access-applications'
const choices = [
  ['zhangjq4', 'zhangjq4（消费业务 to C）'],
  ['huangjq5', 'huangjq5（商用业务 to B/b）'],
  ['zhangxy43', 'zhangxy43（to C 相关）'],
  ['zhangrui32', 'zhangrui32（to B/b 相关）'],
  ['zhangyi44', 'zhangyi44（乐享相关）']
]
beforeEach(() => entries.clear())
afterEach(() => { for (const app of mounted.splice(0)) app.unmount() })
after(async () => {
  await server.close()
  host.close()
  for (const key of Object.keys(previous)) {
    if (previous[key] === undefined) delete globalThis[key]
    else globalThis[key] = previous[key]
  }
})

async function context(path = '/access-denied') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const account = useAppStore()
  account.user = 'first-access-regression'
  account.permissions = []
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path, component: { render: () => h('div') } }] })
  await router.push({ path, query: { itcode: 'first-access-regression' } })
  return { pinia, account, router }
}

async function openAccess() {
  const current = await context()
  let state
  const app = renderer.createApp({ setup(props, setupContext) {
    state = Access.setup(props, setupContext)
    return () => h('div')
  } })
  app.provide(ssrContextKey, {})
  app.use(current.pinia)
  app.use(current.router)
  app.mount({})
  mounted.push(app)
  return { ...current, state }
}

async function htmlFor(current) {
  const app = createSSRApp({ ...Access, setup: () => current.state })
  app.use(current.pinia)
  app.use(current.router)
  return renderToString(app)
}

function validScope(state) {
  state.form.tenant = ['leaibot-cn']
  state.manualDataIds.value = ['data.mall.order.pending']
}

function persisted() {
  return JSON.parse(storage.getItem(STORAGE_KEY) || '[]')
}

test('first access renders the real required selector with five grouped choices and no default owner', async () => {
  const current = await openAccess()
  const html = await htmlFor(current)
  const selector = html.match(/<select\b[^>]*aria-label="业务负责人"[\s\S]*?<\/select>/)?.[0]
  assert.ok(selector, '首次访问基本信息必须展示真实业务负责人选择框')
  assert.match(selector, /aria-required="true"/)
  assert.match(selector, /<optgroup[^>]*label="线上数据权限"/)
  assert.match(selector, /<optgroup[^>]*label="产品\/IT"/)
  assert.deepEqual([...selector.matchAll(/<option\b[^>]*value="([^"]+)"/g)].map(match => match[1]), choices.map(([value]) => value))
  for (const [, label] of choices) assert.ok(selector.includes(label))
  assert.equal(current.state.form.businessApprover, '')
  assert.deepEqual([...current.state.businessOwners.value], [])
})

for (const value of ['', 'admin', 'sunll1', 'zhangjq4 ', 'zhangjq4（消费业务 to C）']) {
  test(`missing or invalid selected owner ${JSON.stringify(value)} blocks next step and shows its field error`, async () => {
    const current = await openAccess()
    current.state.form.businessApprover = value
    current.state.nextOrSubmit()
    assert.equal(current.state.currentStep.value, 0, '非法负责人必须留在基本信息步骤')
    assert.ok(current.state.errors.businessApprover, '必须提供负责人字段错误')
    assert.match(await htmlFor(current), /aria-invalid="true"/)
    assert.deepEqual(persisted(), [])
  })

  test(`direct submit with owner ${JSON.stringify(value)} cannot bypass basic validation`, async () => {
    const { state } = await openAccess()
    validScope(state)
    state.form.businessApprover = value
    state.currentStep.value = 2
    state.submitApplication()
    assert.equal(state.submittedApplication.value, null, '校验失败不得产生提交成功状态')
    assert.equal(state.currentStep.value, 0, '直接提交失败必须回到基本信息展示错误')
    assert.ok(state.errors.businessApprover)
    assert.deepEqual(persisted(), [])
  })
}

for (const [owner, label] of choices) {
  test(`a data-only first access application preserves explicitly selected ${owner} through confirmation and storage`, async () => {
    const current = await openAccess()
    const { state } = current
    state.form.businessApprover = owner
    state.nextOrSubmit()
    assert.equal(state.currentStep.value, 1)
    validScope(state)
    state.nextOrSubmit()
    assert.equal(state.currentStep.value, 2)
    assert.ok((await htmlFor(current)).includes(label), '确认页必须显示所选负责人标签')
    state.nextOrSubmit()
    const saved = persisted()[0]
    assert.ok(saved, '有效申请必须写入 localStorage')
    assert.equal(saved.businessApprover, owner)
    assert.deepEqual(saved.businessOwners, [owner])
    assert.equal(saved.permissionSnapshot.businessApprover, owner)
    assert.equal(saved.applicantManager, 'sunll1')
    assert.equal(saved.approverItcode, 'sunll1')
    assert.deepEqual(saved.handlers, ['sunll1'])
    assert.equal(saved.nodeType, 'applicant-manager')
    assert.equal(saved.statusKey, 'pending')
    assert.deepEqual(saved.permissionSnapshot.selectedRoleIds, [])
    assert.deepEqual(saved.permissionSnapshot.selectedDataPermissionIds, ['data.mall.order.pending'])
    assert.deepEqual(current.account.permissions, [], '提交审批不能提前开通访问权限')
    assert.ok((await htmlFor(current)).includes(label), '成功页必须显示所选负责人标签')
  })
}

test('returning to basic information replaces the owner without inheriting role-owner choices', async () => {
  const current = await openAccess()
  const { state } = current
  state.form.businessApprover = 'zhangjq4'
  state.nextOrSubmit()
  validScope(state)
  state.openRoleModal()
  state.toggleRoleDraft('ops-pm')
  state.confirmRoleSelection()
  state.copyModal.itcode = 'liwen08'
  state.confirmCopyPermissions()
  state.nextOrSubmit()
  assert.equal(state.currentStep.value, 2)
  state.currentStep.value = 0
  state.form.businessApprover = 'zhangyi44'
  state.nextOrSubmit()
  state.nextOrSubmit()
  assert.deepEqual([...state.businessOwners.value], ['zhangyi44'])
  state.nextOrSubmit()
  const saved = persisted()[0]
  assert.equal(saved.businessApprover, 'zhangyi44')
  assert.equal(saved.permissionSnapshot.businessApprover, 'zhangyi44')
  assert.deepEqual(saved.businessOwners, ['zhangyi44'])
  assert.deepEqual(saved.permissionSnapshot.selectedRoleIds, ['ops-pm'])
  assert.deepEqual(saved.permissionSnapshot.copiedRoleIds, ['product-op'])
})

test('a valid owner cannot bypass the required tenant or conflicting-role guards', async () => {
  const { state } = await openAccess()
  state.form.businessApprover = 'zhangyi44'
  state.currentStep.value = 2
  state.submitApplication()
  assert.ok(state.errors.tenant)
  assert.equal(state.currentStep.value, 1)
  assert.equal(state.submittedApplication.value, null)
  assert.deepEqual(persisted(), [])
  validScope(state)
  state.selectedRoleIds.value = ['admin', 'bpo-collab']
  state.submitApplication()
  assert.match(state.submitError.value, /自定义权限不一致/)
  assert.equal(state.submittedApplication.value, null)
  assert.deepEqual(persisted(), [])
})

test('restoring or resubmitting an existing pending application never overwrites its legacy owner or history', async () => {
  const existing = {
    id: 'PA-LEGACY-PENDING', applicantItcode: 'FIRST-ACCESS-REGRESSION', statusKey: 'pending',
    applicantManager: 'legacy-manager', businessApprover: 'legacy-owner', businessOwners: ['legacy-owner'],
    permissionSnapshot: { selectedRoleIds: ['ops-pm'], tenant: ['shop-chat'] },
    approvalLogs: [{ node: '申请提交', action: 'submit', operator: 'first-access-regression', opinion: '旧申请意见', time: '2026-09-10 09:00' }]
  }
  const other = { ...structuredClone(existing), id: 'PA-OTHER', applicantItcode: 'other-account' }
  const original = JSON.stringify([other, existing])
  storage.setItem(STORAGE_KEY, original)
  const { state } = await openAccess()
  assert.deepEqual(JSON.parse(JSON.stringify(state.submittedApplication.value)), existing, '挂载时应恢复原申请')
  validScope(state)
  state.form.businessApprover = 'zhangyi44'
  state.submitApplication()
  assert.equal(storage.getItem(STORAGE_KEY), original, '重复提交不得改写本人或他人的待审批申请')
  assert.deepEqual(JSON.parse(JSON.stringify(state.submittedApplication.value)), existing)
  assert.equal(Object.hasOwn(state.submittedApplication.value.permissionSnapshot, 'businessApprover'), false, '不得给旧快照注入空值或新负责人')
})

test('stored first-access submission reaches only its selected owner after the real manager approval transition', async () => {
  const { state } = await openAccess()
  validScope(state)
  state.selectedRoleIds.value = ['ops-pm', 'geo-analyst']
  state.form.businessApprover = 'zhangyi44'
  state.submitApplication()
  const saved = persisted()[0]
  assert.ok(saved)
  const { default: Admin } = await server.ssrLoadModule('/src/views/agent/AgentPermissionsView.vue')
  const current = await context('/agent/permissions')
  let admin
  const app = createSSRApp({ setup(props, setupContext) {
    admin = Admin.setup(props, setupContext)
    return () => h('div')
  } })
  app.use(current.pinia)
  app.use(current.router)
  await renderToString(app)
  admin.syncFirstAccessApprovalRows()
  const row = admin.approvals.value.find(item => item.id === saved.id)
  assert.ok(row, '后台必须读取首登申请持久化记录')
  assert.equal(row.nodeType, 'applicant-manager')
  const moved = admin.applyMailApprovalActionToRow(row, {
    id: 'first-access-manager-approval', identity: 'applicant-manager', operator: 'sunll1',
    action: 'approve', time: '2026-09-14 12:00'
  })
  assert.equal(moved, true)
  assert.equal(row.nodeType, 'business')
  assert.equal(row.statusKey, 'pending', '经理通过后还必须等待所选业务负责人')
  assert.deepEqual([...row.handlers], ['zhangyi44'])
  assert.equal(row.businessApprovalTasks.length, 1)
  assert.equal(row.businessApprovalTasks[0].approver, 'zhangyi44')
  assert.equal(row.businessApprovalTasks[0].status, 'pending')
})
