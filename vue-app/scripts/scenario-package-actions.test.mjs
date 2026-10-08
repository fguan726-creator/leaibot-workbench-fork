import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { createSSRApp, nextTick, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory, createRouter, matchedRouteKey } from 'vue-router'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor, scenarioPmPermissions } from './helpers/scenarioActors.mjs'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }
const root = fileURLToPath(new URL('../', import.meta.url))
const httpHost = createHttpServer()
const seedPlugin = {
  name: 'scenario-package-actions-test-seeds', enforce: 'pre',
  transform(source, id) {
    if (!id.endsWith('/src/stores/scenarioSkillPackages.ts')) return
    // Existing draft revisions are injected only in this test process.
    return `let scenarioPackageTestSeeds
export function seedScenarioPackagesForTest(store, seeds) {
  scenarioPackageTestSeeds = seeds
  try { store.resetToInitialMock() } finally { scenarioPackageTestSeeds = undefined }
}
${source.replaceAll('createSeedScenarioPackages(selectableSkills.value, skillHub.items, currentAuthorId())', '(scenarioPackageTestSeeds || createSeedScenarioPackages(selectableSkills.value, skillHub.items, currentAuthorId()))')
    .replaceAll('createSeedScenarioPackages(selectableSkills.value, skillHub.items, ownerId)', '(scenarioPackageTestSeeds || createSeedScenarioPackages(selectableSkills.value, skillHub.items, ownerId))')}`
  },
}
const server = await createServer({ root, plugins: [seedPlugin], logLevel: 'error', server: { middlewareMode: true, hmr: { server: httpHost } }, appType: 'custom' })
const [{ default: View }, { useAppStore }, { useScenarioSkillPackagesStore, seedScenarioPackagesForTest }, { useSkillHubStore }] = await Promise.all([
  server.ssrLoadModule('/src/views/agent/AgentSkillsView.vue'),
  server.ssrLoadModule('/src/stores/app.ts'),
  server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'),
  server.ssrLoadModule('/src/stores/skillHub.ts'),
])
const copy = value => JSON.parse(JSON.stringify(value))
const creationPermissions = scenarioPmPermissions([])
const reviewer = { id: 'independent-package-reviewer', permissions: ['scenario-package:review'] }
function seedDraft(store, id) {
  seedScenarioPackagesForTest(store, copy(store.packages).map(item => item.id === id ? {
    ...item, status: 'draft', submittedAt: undefined, submittedBy: undefined,
    testReport: undefined, testRequest: undefined,
    auditEvents: item.publishedSnapshot ? item.auditEvents : [],
  } : item))
}
after(async () => {
  await server.close()
  httpHost.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})

async function fixture({ actor = reviewer.id, permissions = reviewer.permissions, role = '工作台用户', mode, status, recordId = 'seed-scenario-pending-review', prepare, query = {} } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const account = useAppStore()
  account.user = actor
  account.permissions = permissions
  account.role = role
  const notices = []
  account.notify = message => notices.push(message)
  const store = useScenarioSkillPackagesStore()
  const hub = useSkillHubStore()
  const owner = scenarioPmActor(store.findPackage(recordId).ownerId, store.selectableSkills)
  if (status === 'rejected') store.rejectPackage(recordId, reviewer, '补充本次场景边界。')
  if (status === 'draft') seedDraft(store, recordId)
  if (status === 'published' || status === 'disabled') store.approvePackage(recordId, reviewer)
  if (status === 'disabled') assert.equal(store.disablePackage(recordId, reviewer).ok, true)
  if (prepare) await prepare({ store, owner, recordId })
  const record = store.findPackage(recordId)
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/agent/skills', component: { template: '<div />' } }] })
  await router.push({ path: '/agent/skills', query: { tab: 'packages', ...query } })
  let state
  const Prepared = { ...View, setup(props, context) {
    state = View.setup(props, context)
    if (mode !== undefined) state.openPackageDetail(record, undefined, mode)
    return state
  } }
  const app = createSSRApp(Prepared)
  app.use(pinia)
  app.use(router)
  app.provide(matchedRouteKey, shallowRef(router.currentRoute.value.matched[0]))
  const context = {}
  const html = await renderToString(app, context)
  await nextTick()
  async function renderCurrent() {
    const current = createSSRApp({ ...View, setup() { return state } })
    current.use(pinia)
    current.use(router)
    current.provide(matchedRouteKey, shallowRef(router.currentRoute.value.matched[0]))
    const currentContext = {}
    const currentHtml = await renderToString(current, currentContext)
    return { html: currentHtml, dialog: currentContext.teleports?.body || '' }
  }
  return { state, store, hub, account, record, owner, notices, router, renderCurrent, html, dialog: context.teleports?.body || '' }
}

function packageRowHtml(html, id) {
  const row = [...html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)].find(match => match[0].includes(`data-package-id="${id}"`))?.[0]
  assert.ok(row, `missing package row: ${id}`)
  return row
}

test('saved drafts return to the package list and highlight an editable draft without submitting', async () => {
  const current = await fixture({ actor: 'draft-list-owner', permissions: creationPermissions, query: { mode: 'create' } })
  const saved = current.store.saveDraft({
    id: 'draft-list-save', name: '保存后继续配置', description: '', targetAudience: '',
    ownerId: current.account.user, steps: []
  }, { id: current.account.user, permissions: current.account.permissions })
  await current.state.handlePackageSaved(saved)
  assert.deepEqual(current.router.currentRoute.value.query, { tab: 'packages' })
  assert.equal(current.state.packageStatusFilter.value, 'draft')
  assert.equal(current.state.highlightedPackageId.value, saved.id)
  assert.match(current.notices.at(-1), /草稿已保存/)
  const { html } = await current.renderCurrent()
  const row = packageRowHtml(html, saved.id)
  assert.match(row, /详情/)
  assert.match(row, /编辑/)
  assert.doesNotMatch(row, /审批|驳回|撤回/)
})

function rowActions(html, id) {
  const row = packageRowHtml(html, id)
  return [...row.matchAll(/<button\b[^>]*>(.*?)<\/button>/g)].map(match => match[1].trim())
}

test('package editing rules are discoverable while each unavailable edit has a visible reason', async () => {
  const { html, record, dialog } = await fixture({ status: 'draft', mode: 'detail' })
  assert.match(html, /<details class="scenario-package-edit-rules"[^>]*><summary[^>]*>编辑规则<\/summary>/)
  assert.doesNotMatch(html, /<details class="scenario-package-edit-rules"[^>]*\bopen\b/)
  for (const text of ['未发布的草稿、驳回内容', '已发布、已禁用及其草稿或驳回修订', '本轮提交人可先撤回', '本轮编辑者均不能自审']) assert.ok(html.includes(text))
  const row = packageRowHtml(html, record.id)
  assert.match(row, /<p class="scenario-package-edit-hint"[^>]*>未发布内容，仅创建者可编辑<\/p>/)
  assert.deepEqual(rowActions(html, record.id), ['详情'])
  assert.match(dialog, /当前账号编辑说明/)
  assert.match(dialog, /此技能包尚未发布/)
})

test('editing guidance follows actual owner and revision actions without changing permissions', async () => {
  for (const status of ['draft', 'rejected', 'published', 'disabled']) {
    for (const actor of ['pm-li', reviewer.id, 'read-only-viewer']) {
      const permissions = actor === 'pm-li' ? creationPermissions : actor === reviewer.id ? reviewer.permissions : []
      const { state, record, html, store } = await fixture({ actor, permissions, status })
      const canEdit = store.actionsFor(record.id, { id: actor, permissions }).includes('edit')
      assert.equal(packageRowHtml(html, record.id).includes('scenario-package-edit-hint'), !canEdit)
      const guidance = state.packageEditGuidance(record)
      if (canEdit) assert.match(guidance.detail, /当前账号可编辑/)
      else if (['draft', 'rejected'].includes(status)) assert.match(guidance.detail, /由具备创建及跨菜单编排权限的创建者维护/)
      else assert.match(guidance.detail, /当前账号没有编辑权限/)
    }
  }
  const revision = await fixture({ prepare: async context => {
    await submitPublishedRevision(context)
    seedDraft(context.store, context.recordId)
  } })
  assert.match(revision.state.packageEditGuidance(revision.record).detail, /当前账号可编辑该技能包的修订/)
  assert.match(revision.state.packageEditGuidance(revision.record).detail, /线上版本保持原状态/)
  revision.account.user = revision.record.ownerId
  revision.account.permissions = []
  await nextTick()
  assert.match(revision.state.packageEditGuidance(revision.record).detail, /当前账号是创建者，但缺少所需的编辑权限/)
})

test('pending guidance distinguishes withdrawal, independent review, contributors and lost permissions', async () => {
  const creator = await fixture({ actor: 'pm-li', permissions: creationPermissions, mode: 'detail' })
  assert.match(packageRowHtml(creator.html, creator.record.id), /待审核暂不可编辑，可先撤回/)
  assert.match(creator.dialog, /你是创建者，可先撤回审核/)
  const reviewOnlyCreator = await fixture({ actor: 'pm-li', permissions: reviewer.permissions, mode: 'detail' })
  assert.match(reviewOnlyCreator.dialog, /继续编辑和提审仍需具备该内容的编辑权限/)
  assert.deepEqual(rowActions(reviewOnlyCreator.html, reviewOnlyCreator.record.id), ['详情', '撤回'])
  assert.equal(reviewOnlyCreator.store.withdrawPackage(reviewOnlyCreator.record.id, { id: 'pm-li', permissions: reviewer.permissions }, reviewOnlyCreator.record.updatedAt).ok, true)
  assert.deepEqual(reviewOnlyCreator.store.actionsFor(reviewOnlyCreator.record.id, { id: 'pm-li', permissions: reviewer.permissions }), ['view'])
  const reviewerView = await fixture({ mode: 'detail' })
  assert.match(reviewerView.dialog, /当前账号可审批或驳回/)
  for (const submitted of [true, false]) {
    const current = await fixture({ actor: 'revision-admin', permissions: reviewer.permissions, mode: 'detail', prepare: ({ store, recordId }) => {
      const records = copy(store.packages)
      const pending = records.find(item => item.id === recordId)
      pending.revisionEditors = ['revision-admin']
      if (submitted) {
        pending.submittedBy = 'revision-admin'
        pending.auditEvents.at(-1).actorId = 'revision-admin'
      }
      seedScenarioPackagesForTest(store, records)
    } })
    assert.match(current.dialog, submitted ? /你是本轮提交人，可先撤回审核/ : /你参与了本轮编辑，不能审核自己的修改/)
    current.account.permissions = []
    await nextTick()
    const updated = await current.renderCurrent()
    assert.match(updated.dialog, /当前账号没有撤回或审核权限/)
    assert.doesNotMatch(updated.dialog, /当前账号可审批或驳回|你是本轮提交人，可先撤回审核/)
    assert.deepEqual(rowActions(updated.html, current.record.id), ['详情'])
  }
})

test('a creator confirms withdrawal before a pending package becomes editable', async () => {
  const { state, record, store, notices } = await fixture({ actor: 'pm-li', permissions: creationPermissions })
  state.openPackageDetail(record, undefined, 'withdraw')
  assert.equal(state.packageReviewMode.value, 'withdraw')
  assert.equal(store.findPackage(record.id).status, 'review')
  await state.managePackage('withdraw')
  assert.equal(store.findPackage(record.id).status, 'draft')
  assert.equal(store.findPackage(record.id).auditEvents.at(-1).type, 'withdrawn')
  assert.equal(state.packageReviewMode.value, 'detail')
  assert.match(notices.at(-1), /撤回/)
  await state.managePackage('withdraw')
  assert.equal(store.findPackage(record.id).auditEvents.filter(event => event.type === 'withdrawn').length, 1)
})

test('an administrator can open another creator published revision from its direct edit URL', async () => {
  const { state, record } = await fixture({ actor: 'editing-admin', permissions: ['*'], status: 'published', query: { mode: 'create', edit: 'seed-scenario-pending-review' } })
  assert.equal(state.isPackageCreate.value, true)
  assert.equal(state.editingPackage.value.ownerId, record.ownerId)
  assert.equal(state.editingPackage.value.version, 'v1.0.1')
})

test('an independent administrator sees separate detail, approve and reject actions for a pending package', async () => {
  const { html, record, store } = await fixture()
  assert.deepEqual(rowActions(html, record.id), ['详情', '审批', '驳回'])
  assert.equal(store.findPackage(record.id).status, 'review')
})

for (const audience of [
  { label: 'the original creator', actor: 'pm-li', permissions: creationPermissions, actions: ['详情', '撤回'] },
  { label: 'an account without review permission', permissions: [], actions: ['详情'] },
  { label: 'a published package', recordId: 'seed-workplace-certification-operations', actions: ['详情', '编辑', '禁用'] },
]) {
  test(`${audience.label} retains detail without approve or reject row actions`, async () => {
    const { state, html, record } = await fixture(audience)
    assert.deepEqual(rowActions(html, record.id), audience.actions)
    assert.equal(state.canReviewPackage(record), false)
    for (const mode of ['approve', 'reject']) {
      state.openPackageDetail(record, undefined, mode)
      assert.equal(state.packageDetailId.value, '', 'unauthorized review entry must not open a dialog')
      assert.equal(state.packageReviewMode.value, 'detail')
    }
    state.openPackageDetail(record)
    assert.equal(state.packageDetailId.value, record.id, 'read-only detail remains available')
    assert.equal(state.packageReviewMode.value, 'detail')
  })
}

for (const mode of ['detail', 'approve', 'reject']) {
  test(`${mode} opens a distinct dialog without changing package state or audit history`, async () => {
    const { state, store, record, dialog } = await fixture({ mode })
    assert.equal(state.packageReviewMode.value, mode)
    assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
    const heading = dialog.match(/<h3\b[^>]*>(.*?)<\/h3>/)?.[1]
    assert.ok(heading?.includes(record.name))
    const footer = dialog.slice(dialog.lastIndexOf('class="skill-hub-detail-foot"'))
    if (mode === 'detail') {
      assert.equal(heading, record.name)
      assert.doesNotMatch(dialog, /<textarea\b|scenario-package-review-section/)
      assert.doesNotMatch(footer, /审批通过并发布|确认驳回/)
    } else {
      assert.ok(heading.includes(mode === 'approve' ? '审批场景技能包' : '驳回场景技能包'))
      assert.match(dialog, /<textarea\b/)
      assert.match(footer, mode === 'approve' ? /审批通过并发布/ : /确认驳回/)
      assert.doesNotMatch(footer, mode === 'approve' ? /确认驳回/ : /审批通过并发布/)
      if (mode === 'reject') assert.match(dialog, /驳回原因/)
    }
    state.packageReviewNote.value = '临时备注'
    state.packageReviewError.value = '旧错误'
    state.closePackageDetail()
    await nextTick()
    assert.equal(state.packageDetailId.value, '')
    assert.equal(state.packageReviewMode.value, 'detail')
    state.openPackageDetail(record, undefined, mode)
    assert.equal(state.packageReviewNote.value, '')
    assert.equal(state.packageReviewError.value, '')
    assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
  })
}

for (const [mode, action] of [['detail', 'approve'], ['detail', 'reject'], ['approve', 'reject'], ['reject', 'approve']]) {
  test(`${mode} mode cannot execute the unrelated ${action} decision`, async () => {
    const { state, store, record, notices } = await fixture({ mode })
    state.packageReviewNote.value = '请完善适用场景。'
    await state.reviewPackage(action)
    assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
    assert.equal(notices.length, 0)
  })
}

test('rejection requires a nonblank reason and preserves the pending record until confirmed', async () => {
  const { state, store, record, notices } = await fixture({ mode: 'reject' })
  for (const note of ['', ' \n  ']) {
    state.packageReviewNote.value = note
    await state.reviewPackage('reject')
    assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
    assert.equal(state.packageReviewBusy.value, false)
    assert.equal(state.packageReviewMode.value, 'reject')
    assert.match(state.packageReviewError.value, /请填写驳回原因/)
    assert.equal(notices.length, 0)
  }
  state.packageReviewNote.value = '  请补充企业客户跟进建议的适用范围。  '
  await state.reviewPackage('reject')
  const rejected = store.findPackage(record.id)
  assert.equal(rejected.status, 'rejected')
  assert.equal(rejected.reviewNote, '请补充企业客户跟进建议的适用范围。')
  assert.equal(rejected.reviewedBy, 'independent-package-reviewer')
  assert.deepEqual(rejected.auditEvents.map(event => event.type), ['submitted', 'rejected'])
  assert.equal(state.packageReviewMode.value, 'detail')
  assert.equal(state.packageReviewError.value, '')
  assert.equal(state.packageReviewBusy.value, false)
  assert.equal(notices.length, 1)
})

test('approval publishes only after the explicit matching confirmation and records the independent administrator', async () => {
  const { state, store, record, notices } = await fixture({ mode: 'approve' })
  assert.equal(store.findPackage(record.id).status, 'review')
  state.packageReviewNote.value = '  配置与试运行反馈已核对。  '
  await state.reviewPackage('approve')
  const published = store.findPackage(record.id)
  assert.equal(published.status, 'published')
  assert.equal(published.reviewedBy, 'independent-package-reviewer')
  assert.equal(published.reviewNote, '配置与试运行反馈已核对。')
  assert.deepEqual(published.auditEvents.map(event => event.type), ['submitted', 'approved', 'published'])
  assert.equal(state.packageReviewMode.value, 'detail')
  assert.equal(state.packageReviewBusy.value, false)
  assert.equal(notices.length, 1)
})

for (const action of ['approve', 'reject']) {
  for (const change of ['permission lost', 'account becomes the creator']) {
    test(`${action} rechecks authority when ${change} after opening the dialog`, async () => {
      const { state, store, record, account, notices } = await fixture({ mode: action })
      if (change === 'permission lost') account.permissions = []
      else account.user = record.ownerId
      state.packageReviewNote.value = '请补充输入范围。'
      await nextTick()
      assert.equal(state.packageReviewDecision.value.ok, false)
      await state.reviewPackage(action)
      assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
      assert.equal(notices.length, 0)
      assert.equal(state.packageReviewBusy.value, false)
    })
  }

  test(`${action} cannot open or execute a self-review dialog`, async () => {
    const { state, store, record, notices } = await fixture({ actor: 'pm-li' })
    state.openPackageDetail(record, undefined, action)
    assert.equal(state.packageDetailId.value, '')
    assert.equal(state.packageReviewMode.value, 'detail')
    state.packageReviewNote.value = '请补充适用范围。'
    await state.reviewPackage(action)
    assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
    assert.equal(notices.length, 0)
  })

  test(`${action} ignores an in-flight action and records a later double confirmation only once`, async () => {
    const { state, store, record, notices } = await fixture({ mode: action })
    state.packageReviewNote.value = '已检查，需按本轮意见处理。'
    state.packageReviewBusy.value = true
    await state.reviewPackage(action)
    assert.deepEqual(copy(store.findPackage(record.id)), copy(record))
    assert.equal(notices.length, 0)
    state.packageReviewBusy.value = false
    await Promise.all([state.reviewPackage(action), state.reviewPackage(action)])
    const decided = copy(store.findPackage(record.id))
    assert.equal(decided.auditEvents.filter(event => event.type === (action === 'approve' ? 'approved' : 'rejected')).length, 1)
    assert.equal(notices.length, 1)
    state.packageReviewMode.value = action
    await state.reviewPackage(action)
    assert.deepEqual(copy(store.findPackage(record.id)), decided, 'a stale review dialog must not repeat a completed decision')
    assert.equal(notices.length, 1)
  })
}

for (const status of ['draft', 'review', 'rejected', 'published', 'disabled']) {
  test(`an owner with creation permissions sees the appropriate ${status} row actions`, async () => {
    const { html, record } = await fixture({ actor: 'pm-li', permissions: creationPermissions, status })
    assert.deepEqual(rowActions(html, record.id), status === 'review' ? ['详情', '撤回'] : ['详情', '编辑'])
  })

  test(`an administrator can edit their own ${status} package only outside pending review`, async () => {
    const { html, record, state, store } = await fixture({ actor: 'pm-li', permissions: ['*'], status })
    const before = copy(store.findPackage(record.id))
    const actions = { published: ['禁用'], disabled: ['启用'] }[status] || []
    assert.deepEqual(rowActions(html, record.id), status === 'review' ? ['详情', '撤回'] : ['详情', '编辑', ...actions])
    await editWithNoDom(state, record)
    assert.equal(state.isPackageCreate.value, status !== 'review')
    if (status === 'review') {
      assert.equal(state.editingPackage.value, undefined)
    } else {
      assert.equal(state.editingPackage.value.id, record.id)
      assert.equal(state.editingPackage.value.baseUpdatedAt, record.updatedAt)
      state.editingPackage.value.description = '管理员修订本人内容。'
    }
    assert.deepEqual(copy(store.findPackage(record.id)), before, 'opening a revision must not mutate the stored record')
  })

  test(`an unrelated account cannot manage a ${status} package through an administrator role label alone`, async () => {
    const { html, record } = await fixture({ permissions: [], role: '平台管理员', status })
    assert.deepEqual(rowActions(html, record.id), ['详情'])
  })

  test(`review permission grants only the applicable ${status} actions regardless of role label`, async () => {
    const { html, record } = await fixture({ permissions: reviewer.permissions, role: '运营', status })
    const actions = { review: ['审批', '驳回'], published: ['编辑', '禁用'], disabled: ['编辑', '启用'] }[status] || []
    assert.deepEqual(rowActions(html, record.id), ['详情', ...actions])
  })
}

for (const permissions of [[], ['scenario-package:create'], ['scenario-package:compose:cross-menu']]) {
  test(`owner editing requires both creation and cross-menu composition permissions (${permissions.join(',') || 'none'})`, async () => {
    const { html, record } = await fixture({ actor: 'pm-li', permissions, role: '平台管理员', status: 'published' })
    assert.deepEqual(rowActions(html, record.id), ['详情'])
  })
}

test('an owner without creation permission has only read-only detail for a pending package', async () => {
  const { html, record, state } = await fixture({ actor: 'pm-li', permissions: [] })
  assert.deepEqual(rowActions(html, record.id), ['详情'])
  await state.editPackage(record)
  assert.equal(state.isPackageCreate.value, false)
})

async function editWithNoDom(state, record) {
  const previousDocument = globalThis.document
  globalThis.document = { querySelector() { return null } }
  try { await state.editPackage(record) }
  finally {
    if (previousDocument === undefined) delete globalThis.document
    else globalThis.document = previousDocument
  }
}

for (const status of ['draft', 'rejected', 'published', 'disabled']) {
  test(`editing an owned ${status} package opens an isolated revision without mutating the stored record`, async () => {
    const { state, store, record, router } = await fixture({ actor: 'pm-li', permissions: creationPermissions, status })
    const before = copy(store.findPackage(record.id))
    await editWithNoDom(state, record)
    assert.ok(state.isPackageCreate.value)
    assert.equal(router.currentRoute.value.query.edit, record.id)
    assert.equal(state.editingPackage.value.id, record.id)
    assert.equal(state.editingPackage.value.baseUpdatedAt, record.updatedAt)
    state.editingPackage.value.description = '尚未提交的修改。'
    state.editingPackage.value.steps[0].task = '仅存在于编辑界面的任务。'
    assert.deepEqual(copy(store.findPackage(record.id)), before)
  })
}

for (const audience of [
  { label: 'a pending owner', actor: 'pm-li', status: 'review', permissions: creationPermissions },
  { label: 'a different owner', status: 'published', permissions: creationPermissions },
  { label: 'an owner without creation permission', actor: 'pm-li', status: 'published', permissions: [] },
  { label: 'an administrator who owns a pending package', actor: 'pm-li', status: 'review', permissions: ['*'] },
]) {
  test(`the edit route cannot bypass ownership, permissions or review state for ${audience.label}`, async () => {
    const { state } = await fixture({ ...audience, query: { mode: 'create', edit: 'seed-scenario-pending-review' } })
    assert.equal(Boolean(state.isPackageCreate.value), false)
    assert.equal(state.editingPackage.value, undefined)
  })
}

test('the edit route opens an administrator-owned published package as an isolated revision', async () => {
  const { state, store, record } = await fixture({ actor: 'pm-li', permissions: ['*'], status: 'published', query: { mode: 'create', edit: 'seed-scenario-pending-review' } })
  const before = copy(store.findPackage(record.id))
  assert.equal(state.isPackageCreate.value, true)
  assert.equal(state.editingPackage.value.id, record.id)
  assert.equal(state.editingPackage.value.version, 'v1.0.1')
  assert.equal(state.editingPackage.value.baseUpdatedAt, record.updatedAt)
  state.editingPackage.value.description = '管理员直接进入编辑后的修改。'
  assert.deepEqual(copy(store.findPackage(record.id)), before)
})

const managementCases = [
  { action: 'disable', label: '禁用', status: 'published', afterStatus: 'disabled' },
  { action: 'enable', label: '启用', status: 'disabled', afterStatus: 'published' },
]

for (const item of managementCases) {
  test(`${item.action} requires its matching confirmation and changes package state only after confirmation`, async () => {
    const { state, store, record, notices, dialog } = await fixture({ ...item, mode: item.action })
    const before = copy(store.findPackage(record.id))
    assert.equal(state.packageReviewMode.value, item.action)
    assert.deepEqual(copy(store.findPackage(record.id)), before)
    const footer = dialog.slice(dialog.lastIndexOf('class="skill-hub-detail-foot"'))
    assert.match(footer, new RegExp(`确认${item.label}`))
    for (const other of managementCases.filter(other => other.action !== item.action)) {
      assert.doesNotMatch(footer, new RegExp(`确认${other.label}`))
      await state.managePackage(other.action)
      assert.deepEqual(copy(store.findPackage(record.id)), before)
      assert.equal(notices.length, 0)
    }
    await state.managePackage(item.action)
    const managed = copy(store.findPackage(record.id))
    assert.equal(managed.status, item.afterStatus)
    assert.equal(managed.auditEvents.length, before.auditEvents.length + 1)
    assert.equal(state.packageReviewMode.value, 'detail')
    assert.equal(state.packageReviewBusy.value, false)
    assert.equal(notices.length, 1)
    await state.managePackage(item.action)
    assert.deepEqual(copy(store.findPackage(record.id)), managed, 'stale confirmation must not repeat a completed action')
    assert.equal(notices.length, 1)
  })

  test(`${item.action} rechecks account authority when confirmation is submitted`, async () => {
    const { state, store, record, account, notices } = await fixture({ ...item, mode: item.action })
    const before = copy(store.findPackage(record.id))
    account.permissions = []
    await nextTick()
    await state.managePackage(item.action)
    assert.deepEqual(copy(store.findPackage(record.id)), before)
    assert.equal(notices.length, 0)
    assert.equal(state.packageReviewBusy.value, false)
  })

  test(`${item.action} cannot execute from read-only detail or open an unauthorized confirmation`, async () => {
    const current = await fixture(item)
    current.state.openPackageDetail(current.record)
    const before = copy(current.store.findPackage(current.record.id))
    await current.state.managePackage(item.action)
    assert.deepEqual(copy(current.store.findPackage(current.record.id)), before)
    current.account.permissions = []
    current.state.closePackageDetail()
    await nextTick()
    current.state.openPackageDetail(current.record, undefined, item.action)
    assert.equal(current.state.packageDetailId.value, '', 'unauthorized entry must not open a confirmation')
    await current.state.managePackage(item.action)
    assert.deepEqual(copy(current.store.findPackage(current.record.id)), before)
    assert.equal(current.notices.length, 0)
  })
}

function submitEditableRevision({ store, owner, recordId }, configure = () => {}) {
  const revision = store.editableDraft(recordId, owner)
  revision.description = `${revision.description}补充本轮修订范围。`
  configure(revision)
  const request = {
    input: '验证当前修订链路。', expectedOutput: '节点结果沿配置链路传递。',
    activeOptionalStepIds: revision.steps.filter(step => step.kind === 'conditional').map(step => step.id),
    confirmedStepIds: revision.steps.filter(step => step.requiresConfirmation).map(step => step.id),
    approvedStepIds: revision.steps.filter(step => step.requiresApproval).map(step => step.id),
    sampleOutputs: Object.fromEntries(revision.steps.map(step => [step.id, `节点 ${step.id} 的手工模拟输出。`])),
  }
  const report = runScenarioSimulation(revision, store.selectableSkills, request, owner)
  assert.equal(report.status, 'completed')
  return store.submitDraft({ ...revision, testRequest: request, testReport: report }, owner)
}

async function submitPublishedRevision(context) {
  context.store.approvePackage(context.recordId, reviewer)
  return submitEditableRevision(context)
}

test('a pending owner must withdraw before editing even with administrator permissions and an older published snapshot', async () => {
  const { state, store, record, html } = await fixture({ actor: 'pm-li', permissions: ['*'], prepare: submitPublishedRevision })
  assert.equal(record.status, 'review')
  assert.equal(record.onlineStatus, 'published')
  assert.ok(record.publishedSnapshot)
  assert.deepEqual(rowActions(html, record.id), ['详情', '撤回'])
  const before = copy(store.findPackage(record.id))
  await state.editPackage(record)
  assert.equal(state.isPackageCreate.value, false)
  for (const mode of ['approve', 'reject', 'disable', 'enable']) {
    state.openPackageDetail(record, undefined, mode)
    assert.equal(state.packageDetailId.value, '')
    assert.equal(state.packageReviewMode.value, 'detail')
  }
  assert.deepEqual(copy(store.findPackage(record.id)), before)
  state.openPackageDetail(record)
  assert.equal(state.packageDetailId.value, record.id)
})

for (const status of ['review', 'draft']) {
  test(`a ${status} revision retains the disable action for its independently approved online version`, async () => {
    const { state, store, record, html } = await fixture({ permissions: reviewer.permissions, prepare: async context => {
      await submitPublishedRevision(context)
      if (status === 'draft') seedDraft(context.store, context.recordId)
    } })
    assert.equal(record.status, status)
    assert.deepEqual(rowActions(html, record.id), status === 'review' ? ['详情', '审批', '驳回', '禁用'] : ['详情', '编辑', '禁用'])
    state.openPackageDetail(record, undefined, 'disable')
    assert.equal(state.packageReviewMode.value, 'disable')
    await state.managePackage('disable')
    assert.equal(store.findPackage(record.id).status, status, 'disabling the online version must preserve the revision workflow')
  })
}

test('an opened approval or rejection dialog cannot decide a rejected and resubmitted revision', async () => {
  for (const action of ['approve', 'reject']) {
    const { state, store, record, owner, notices, renderCurrent } = await fixture({ mode: action })
    assert.equal(state.packageOpenedUpdatedAt.value, record.updatedAt)
    assert.equal(state.packageActionStale.value, false)
    store.rejectPackage(record.id, reviewer, '补充本轮适用范围后重新提交。')
    submitEditableRevision({ store, owner, recordId: record.id })
    const resubmitted = copy(store.findPackage(record.id))
    assert.equal(resubmitted.status, 'review')
    assert.notEqual(resubmitted.updatedAt, record.updatedAt)
    assert.equal(store.reviewDecision(record.id, reviewer).ok, true, 'the new revision remains independently reviewable')
    await nextTick()
    assert.equal(state.packageActionStale.value, true)
    const { dialog } = await renderCurrent()
    assert.match(dialog, /技能包已更新，请关闭后重新查看并操作。/)
    const footer = dialog.slice(dialog.lastIndexOf('class="skill-hub-detail-foot"'))
    assert.doesNotMatch(footer, /审批通过|确认驳回/)
    state.packageReviewNote.value = '基于旧版本填写的审核意见。'
    await state.reviewPackage(action)
    assert.deepEqual(copy(store.findPackage(record.id)), resubmitted)
    assert.equal(notices.length, 0)
    state.closePackageDetail()
    state.openPackageDetail(store.findPackage(record.id), undefined, action)
    await nextTick()
    assert.equal(state.packageOpenedUpdatedAt.value, resubmitted.updatedAt)
    assert.equal(state.packageActionStale.value, false)
    state.packageReviewNote.value = '已重新核对本轮修订。'
    await state.reviewPackage(action)
    assert.equal(store.findPackage(record.id).status, action === 'approve' ? 'published' : 'rejected')
    assert.equal(notices.length, 1)
  }
})

test('an opened disable or enable dialog stays stale after an online status round trip', async () => {
  for (const action of ['disable', 'enable']) {
    const { state, store, record, notices, renderCurrent } = await fixture({
      status: action === 'disable' ? 'published' : 'disabled', mode: action,
    })
    assert.equal(state.packageOpenedUpdatedAt.value, record.updatedAt)
    assert.equal(state.packageActionStale.value, false)
    const transitions = action === 'disable' ? ['disablePackage', 'enablePackage'] : ['enablePackage', 'disablePackage']
    for (const transition of transitions) assert.equal(store[transition](record.id, reviewer).ok, true)
    const changed = copy(store.findPackage(record.id))
    assert.equal(changed.status, record.status)
    assert.notEqual(changed.updatedAt, record.updatedAt)
    assert.ok(store.actionsFor(record.id, reviewer).includes(action), 'the current status permits the action, so the opened-version check must block the old dialog')
    await nextTick()
    assert.equal(state.packageActionStale.value, true)
    const { dialog } = await renderCurrent()
    assert.match(dialog, /技能包已更新，请关闭后重新查看并操作。/)
    const footer = dialog.slice(dialog.lastIndexOf('class="skill-hub-detail-foot"'))
    assert.doesNotMatch(footer, /确认禁用|确认启用/)
    await state.managePackage(action)
    assert.deepEqual(copy(store.findPackage(record.id)), changed)
    assert.equal(notices.length, 0)
    state.closePackageDetail()
    state.openPackageDetail(store.findPackage(record.id), undefined, action)
    await nextTick()
    assert.equal(state.packageActionStale.value, false)
    await state.managePackage(action)
    assert.equal(store.findPackage(record.id).status, action === 'disable' ? 'disabled' : 'published')
    assert.equal(notices.length, 1)
  }
})

test('a pending revision is counted and filtered independently from its published or disabled online version', async () => {
  const { state, store, record, renderCurrent } = await fixture({ prepare: submitPublishedRevision })
  const count = filter => state.packageSummaryItems.value.find(item => item.filter === filter)?.value
  const isListed = () => state.filteredScenarioPackages.value.some(item => item.id === record.id)
  const initialPublishedCount = count('published')
  const initialReviewCount = count('review')
  assert.equal(record.status, 'review')
  assert.equal(record.onlineStatus, 'published')
  const otherPackages = store.packages.filter(item => item.id !== record.id)
  assert.equal(initialReviewCount, otherPackages.filter(item => item.status === 'review').length + 1)
  assert.equal(initialPublishedCount, otherPackages.filter(item => item.onlineStatus === 'published').length + 1)
  for (const filter of ['review', 'published']) {
    state.setPackageSummaryFilter(filter)
    await nextTick()
    assert.equal(isListed(), true)
    packageRowHtml((await renderCurrent()).html, record.id)
  }
  assert.equal(store.disablePackage(record.id, reviewer).ok, true)
  await nextTick()
  assert.equal(store.findPackage(record.id).status, 'review')
  assert.equal(store.findPackage(record.id).onlineStatus, 'disabled')
  assert.equal(count('review'), initialReviewCount)
  assert.equal(count('published'), initialPublishedCount - 1)
  assert.equal(isListed(), false, 'disabling the old online version removes it from the published filter')
  state.setPackageSummaryFilter('review')
  await nextTick()
  assert.equal(isListed(), true, 'the newer revision must remain in pending review')
  state.resetPackageFilters()
  state.packageStatusFilter.value = 'disabled'
  await nextTick()
  assert.equal(isListed(), true)
  assert.deepEqual(rowActions((await renderCurrent()).html, record.id), ['详情', '审批', '驳回', '启用'])
})

test('a healthy pending revision reports its old online snapshot as paused when a required dependency is disabled', async () => {
  const oldRequiredSkill = 'employee-certification-insight'
  const { state, store, hub, record, renderCurrent } = await fixture({ prepare(context) {
    context.store.approvePackage(context.recordId, reviewer)
    submitEditableRevision(context, revision => {
      revision.steps = revision.steps.filter(step => step.skillId !== oldRequiredSkill)
    })
  } })
  hub.items.find(skill => skill.name === oldRequiredSkill).onlineStatus = 'disabled'
  await nextTick()
  const current = store.findPackage(record.id)
  assert.equal(current.status, 'review')
  assert.equal(current.health.status, 'healthy')
  assert.equal(current.publishedSnapshot.health.status, 'paused')
  assert.match(state.packageHealthHint(current), /已审核版本.*因依赖异常暂停/)
  assert.doesNotMatch(state.packageHealthHint(current), /继续运行|保持已发布/)
  const row = packageRowHtml((await renderCurrent()).html, record.id)
  assert.match(row, /已审核版本.*因依赖异常暂停/)
  assert.doesNotMatch(row, /继续运行|保持已发布/)
  state.setPackageSummaryFilter('paused')
  await nextTick()
  assert.ok(state.filteredScenarioPackages.value.some(item => item.id === record.id), 'the paused filter must use the old online snapshot health')
  assert.equal(store.disablePackage(record.id, reviewer).ok, true)
  await nextTick()
  assert.equal(state.filteredScenarioPackages.value.some(item => item.id === record.id), false, 'a disabled online snapshot is not a dependency-paused published version')
  assert.match(state.packageHealthHint(store.findPackage(record.id)), /已审核版本.*保持禁用/)
})

test('initial examples render all eight state filters while administrators review PM-owned records', async () => {
  const { state, store, account, html, renderCurrent } = await fixture({ actor: 'initial-state-reviewer' })
  for (const filter of ['draft', 'review', 'rejected', 'published', 'disabled', 'upgrade_required', 'degraded', 'paused']) {
    state.resetPackageFilters()
    state.packageStatusFilter.value = filter
    await nextTick()
    const records = state.filteredScenarioPackages.value
    assert.ok(records.length > 0, `the initial ${filter} filter must contain an example`)
    const filteredHtml = (await renderCurrent()).html
    for (const record of records) packageRowHtml(filteredHtml, record.id)
  }
  assert.ok(store.packages.every(item => item.ownerId !== account.user))
  const review = store.packages.find(item => item.ownerId === 'pm-li' && item.status === 'review')
  const published = store.packages.find(item => item.ownerId === 'pm-li' && item.status === 'published')
  assert.ok(review)
  assert.ok(published)
  assert.deepEqual(rowActions(html, review.id), ['详情', '审批', '驳回'])
  assert.deepEqual(rowActions(html, published.id), ['详情', '编辑', '禁用'])
})

test('initial PM examples permit author editing without review or management actions', async () => {
  const { store, account, html } = await fixture({ actor: 'initial-pm-author', permissions: creationPermissions })
  const ownReview = store.packages.find(item => item.ownerId === account.user && item.status === 'review')
  const ownPublished = store.packages.find(item => item.ownerId === account.user && item.status === 'published')
  assert.ok(ownReview)
  assert.ok(ownPublished)
  assert.deepEqual(rowActions(html, ownReview.id), ['详情', '撤回'])
  assert.deepEqual(rowActions(html, ownPublished.id), ['详情', '编辑'])
})
