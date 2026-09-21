import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

async function source(path) {
  try {
    return await readFile(new URL(path, import.meta.url), 'utf8')
  } catch {
    return ''
  }
}

test('capability change service owns seeded changes and patch versioning', async () => {
  const service = await source('../src/services/skillCapabilityChanges.js')
  assert.match(service, /export function getSeedCapabilityUpdate/)
  assert.match(service, /export function nextPatchVersion/)
  assert.match(service, /Asia\/Shanghai/)
  assert.match(service, /product-knowledge/)
  assert.match(service, /voucher-recommend/)
})

test('capability change service returns isolated updates and increments patch versions', async () => {
  const { getSeedCapabilityUpdate, nextPatchVersion, formatShanghaiMinute } = await import('../src/services/skillCapabilityChanges.js')
  const first = getSeedCapabilityUpdate('product-knowledge')
  const second = getSeedCapabilityUpdate('product-knowledge')
  first.changes[0].after = 'changed in test'

  assert.equal(second.changes[0].after, '新增批量商品参数对比接口')
  assert.equal(nextPatchVersion('v1.0.7'), 'v1.0.8')
  assert.equal(nextPatchVersion('invalid'), 'v1.0.0')
  assert.match(formatShanghaiMinute(new Date('2026-08-14T01:05:00Z')), /^2026-08-14 09:05$/)
})

test('capability update prepares one versioned edit draft and invalidates stale evaluation once', async () => {
  const { beginCapabilityUpdate, getSeedCapabilityUpdate, mergeCapabilityDraft } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const item = {
    name: 'product-knowledge',
    cnName: '产品知识问答',
    category: '知识问答',
    desc: '产品知识查询',
    version: 'v1.0.7',
    online: 'v1.0.7',
    status: 'published',
    statusText: '已发布',
    owner: 'product-pm',
    capabilityUpdate: update,
    draft: {
      form: { name: 'product-knowledge', cnName: '产品知识问答', menu: 'GEO 看板', scene: '', input: '', output: '' },
      selectedContextCodes: ['dashboard.geoKnowledge'],
      clarifyMessages: [],
      summaryItems: [],
      summaryUpdated: '',
      aiTuned: true,
      evaluationCapabilityVersion: 'cap-2026.08.03',
      savedAt: '2026-08-13 09:00'
    }
  }
  const started = beginCapabilityUpdate(item, '2026-08-14 11:00')
  assert.equal(started.status, 'published')
  assert.equal(started.editStatus, 'draft')
  assert.equal(started.online, 'v1.0.7')
  assert.equal(started.editVersion, 'v1.0.8')
  assert.equal(started.capabilityUpdate.status, 'preparing')
  assert.equal(started.capabilityUpdate.task.status, 'generating')
  assert.equal(started.capabilityUpdate.task.id, `capability-update-${update.recordId}`)
  assert.deepEqual(started.draft.selectedContextCodes, ['dashboard.geoKnowledge'])
  assert.deepEqual(started.draft.contextBindings, [{
    contextId: 'dashboard.geoKnowledge',
    menuPath: 'GEO 看板 / 手工上传知识',
    name: '手工上传知识',
    version: 'cap-2026.08.14'
  }])
  assert.equal(started.draft.aiTuned, false)
  assert.equal(started.draft.evaluationCapabilityVersion, undefined)
  assert.equal(started.capabilityUpdate.hasDraftEdits, false)

  started.draft.aiTuned = true
  started.draft.evaluationCapabilityVersion = update.targetCapabilityVersion
  const continued = beginCapabilityUpdate(started, '2026-08-14 11:05')
  assert.equal(continued.editVersion, 'v1.0.8')
  assert.equal(continued.draft.aiTuned, true)
  assert.equal(continued.capabilityUpdate.task.id, started.capabilityUpdate.task.id)

  const saved = mergeCapabilityDraft(continued, {
    cnName: continued.cnName,
    desc: continued.desc,
    category: continued.category,
    tags: []
  }, continued.draft, '2026-08-14 11:06')
  assert.equal(saved.capabilityUpdate.hasDraftEdits, true)
})

test('capability update preserves selections and upgrades affected context snapshots once', async () => {
  const { beginCapabilityUpdate, getSeedCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const started = beginCapabilityUpdate({
    name: 'product-knowledge',
    cnName: '产品知识问答',
    category: 'GEO 看板',
    desc: '产品知识查询',
    version: 'v1.0.7',
    online: 'v1.0.7',
    status: 'published',
    statusText: '已发布',
    owner: 'product-pm',
    capabilityUpdate: update,
    draft: {
      form: { name: 'product-knowledge', cnName: '产品知识问答', menu: 'GEO 看板', scene: '', input: '', output: '' },
      selectedContextCodes: ['dashboard.geoOverview'],
      clarifyMessages: [],
      summaryItems: [],
      summaryUpdated: '',
      aiTuned: false,
      baselineContextSeeded: true,
      savedAt: '2026-08-18 10:00'
    }
  }, '2026-08-19 09:00')

  assert.deepEqual(started.draft.selectedContextCodes, ['dashboard.geoOverview', 'dashboard.geoKnowledge'])
  assert.equal(started.draft.selectedContextCodes.filter(code => code === 'dashboard.geoKnowledge').length, 1)
  assert.equal(started.draft.selectedContextCodes.includes('product.knowledge'), false)
  assert.deepEqual(started.draft.contextBindings.map(binding => `${binding.contextId}@${binding.version}`), [
    'dashboard.geoOverview@unknown',
    'dashboard.geoKnowledge@cap-2026.08.14'
  ])
})

test('capability update seeds one complete visible update instruction and never duplicates it', async () => {
  const { beginCapabilityUpdate, getSeedCapabilityUpdate, hydrateCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const started = beginCapabilityUpdate({
    name: 'product-knowledge',
    cnName: '产品知识问答',
    category: 'GEO 看板',
    desc: '产品知识查询',
    version: 'v1.0.7',
    online: 'v1.0.7',
    status: 'published',
    statusText: '已发布',
    owner: 'product-pm',
    capabilityUpdate: update
  }, '2026-08-19 10:30')

  assert.deepEqual(started.draft.clarifyMessages, [{
    id: `capability-scan-${update.recordId}`,
    kind: 'user',
    autoExecute: true,
    text: '检测到「GEO 看板 / 手工上传知识」能力上下文由 cap-2026.08.03 更新为 cap-2026.08.14，主要变化为：新增商品对比接口，并补充能效、重量和接口类型字段。\n请保留当前 Skill 的业务目标，基于最新能力重新梳理需求澄清、输入输出、权限边界、异常兜底和验收用例；对不应纳入本 Skill 的变化明确标记为“不采用”，不要直接发布。'
  }])
  assert.deepEqual(started.draft.selectedContextCodes, ['dashboard.geoKnowledge'])

  const legacy = {
    name: 'product-knowledge',
    cnName: '产品知识问答',
    online: 'v1.0.7',
    status: 'published',
    statusText: '已发布',
    editStatus: 'draft',
    capabilityUpdate: { ...update, status: 'processing' },
    draft: {
      selectedContextCodes: ['dashboard.geoKnowledge'],
      clarifyMessages: [],
      aiTuned: false,
      baselineContextSeeded: true
    }
  }
  const hydratedOnce = hydrateCapabilityUpdate(legacy, update)
  const hydratedTwice = hydrateCapabilityUpdate({ ...legacy, draft: hydratedOnce.draft }, update)
  assert.equal(hydratedOnce.draft.clarifyMessages.length, 1)
  assert.equal(hydratedTwice.draft.clarifyMessages.length, 1)
  assert.equal(hydratedTwice.draft.clarifyMessages[0].id, `capability-scan-${update.recordId}`)
})

test('capability update scan query lists every affected context and version change', async () => {
  const { buildCapabilityScanQuery, getSeedCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  update.affectedContexts.push({
    contextId: 'product.compare',
    name: '商品参数对比',
    menuPath: '商品管理 / 商品参数对比',
    currentVersion: 'cap-2026.08.06',
    targetVersion: 'cap-2026.08.14'
  })

  assert.equal(buildCapabilityScanQuery({ capabilityUpdate: update }), [
    '检测到 2 个能力上下文更新：',
    '1. 「GEO 看板 / 手工上传知识」由 cap-2026.08.03 更新为 cap-2026.08.14',
    '2. 「商品管理 / 商品参数对比」由 cap-2026.08.06 更新为 cap-2026.08.14',
    '主要变化为：新增商品对比接口，并补充能效、重量和接口类型字段。',
    '请保留当前 Skill 的业务目标，基于最新能力重新梳理需求澄清、输入输出、权限边界、异常兜底和验收用例；对不应纳入本 Skill 的变化明确标记为“不采用”，不要直接发布。'
  ].join('\n'))
})

test('capability update completes only after the first clarification result is saved', async () => {
  const { beginCapabilityUpdate, completeCapabilityUpdate, getSeedCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const started = beginCapabilityUpdate({
    name: 'product-knowledge', cnName: '产品知识问答', category: 'GEO 看板', desc: '产品知识查询',
    version: 'v1.0.7', online: 'v1.0.7', status: 'published', statusText: '已发布', owner: 'product-pm', capabilityUpdate: update
  }, '2026-08-19 11:00')
  const generatedDraft = {
    ...started.draft,
    clarifyMessages: [...started.draft.clarifyMessages, { id: 'generated-result', kind: 'assistant', text: '已生成首轮结果' }],
    summaryItems: [{ label: '本轮能力更新', text: '采用 3 项，不采用 1 项' }]
  }

  const completed = completeCapabilityUpdate(started, generatedDraft, '2026-08-19 11:01')
  assert.equal(completed.capabilityUpdate.status, 'processing')
  assert.equal(completed.capabilityUpdate.task.status, 'succeeded')
  assert.equal(completed.capabilityUpdate.task.completedAt, '2026-08-19 11:01')
  assert.equal(completed.capabilityUpdate.hasDraftEdits, true)
  assert.equal(completed.editStatus, 'draft')
  assert.equal(completed.online, 'v1.0.7')
  assert.equal(completed.draft.clarifyMessages.at(-1).id, 'generated-result')
})

test('capability update failure restores the previous draft and remains retryable', async () => {
  const { beginCapabilityUpdate, failCapabilityUpdate, getSeedCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const previousDraft = {
    form: { name: 'product-knowledge', cnName: '产品知识问答', menu: 'GEO 看板', scene: '', input: '', output: '' },
    selectedContextCodes: ['dashboard.geoOverview'], clarifyMessages: [], summaryItems: [], summaryUpdated: '', aiTuned: true,
    evaluationCapabilityVersion: 'cap-2026.08.03', savedAt: '2026-08-18 10:00'
  }
  const started = beginCapabilityUpdate({
    name: 'product-knowledge', cnName: '产品知识问答', category: 'GEO 看板', desc: '产品知识查询',
    version: 'v1.0.7', online: 'v1.0.7', status: 'published', statusText: '已发布', owner: 'product-pm',
    draft: previousDraft, capabilityUpdate: getSeedCapabilityUpdate('product-knowledge')
  }, '2026-08-19 11:00')

  const failed = failCapabilityUpdate(started, '模型服务暂不可用', '2026-08-19 11:02')
  assert.equal(failed.capabilityUpdate.status, 'failed')
  assert.equal(failed.capabilityUpdate.task.status, 'failed')
  assert.equal(failed.capabilityUpdate.task.error, '模型服务暂不可用')
  assert.deepEqual(failed.draft, previousDraft)
  assert.equal(failed.editVersion, undefined)
  assert.equal(failed.editStatus, undefined)
  assert.equal(failed.version, 'v1.0.7')

  const retried = beginCapabilityUpdate(failed, '2026-08-19 11:03')
  assert.equal(retried.capabilityUpdate.status, 'preparing')
  assert.equal(retried.capabilityUpdate.task.id, started.capabilityUpdate.task.id)
  assert.equal(retried.capabilityUpdate.task.status, 'generating')
})

test('ignore closes only the current record and a newer record is rediscovered', async () => {
  const { capabilityUpdatePresentation, getSeedCapabilityUpdate, hydrateCapabilityUpdate, ignoreCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const enhancement = { name: 'product-knowledge', online: 'v1.0.7', status: 'published', capabilityUpdate: getSeedCapabilityUpdate('product-knowledge') }
  const ignored = ignoreCapabilityUpdate(enhancement, { operator: 'product-pm', reason: '本期不采用' }, '2026-08-19 11:10')
  assert.equal(ignored.capabilityUpdate.status, 'ignored')
  assert.deepEqual(ignored.capabilityUpdate.resolution, {
    action: 'ignored', operator: 'product-pm', handledAt: '2026-08-19 11:10', reason: '本期不采用'
  })
  assert.equal(ignored.draft, undefined)
  assert.equal(ignored.online, 'v1.0.7')

  const permission = { name: 'voucher-recommend', online: 'v0.1.3', status: 'published', capabilityUpdate: getSeedCapabilityUpdate('voucher-recommend') }
  const ignoredPermission = ignoreCapabilityUpdate(permission, { operator: 'growth-pm', reason: '权限尚未准备' }, '2026-08-19 11:11')
  assert.equal(ignoredPermission.capabilityUpdate.status, 'ignored')
  assert.equal(ignoredPermission.capabilityUpdate.resolution.action, 'ignored')
  assert.equal(capabilityUpdatePresentation(ignoredPermission).visible, false)
  assert.equal(ignoredPermission.online, 'v0.1.3')
  assert.equal(ignoredPermission.draft, undefined)

  const newer = { ...getSeedCapabilityUpdate('product-knowledge'), recordId: 'capability-change-product-knowledge-20260820', targetCapabilityVersion: 'cap-2026.08.20' }
  const rediscovered = hydrateCapabilityUpdate(ignored, newer)
  assert.equal(rediscovered.capabilityUpdate.status, 'available')
  assert.equal(rediscovered.capabilityUpdate.recordId, newer.recordId)
})

test('capability update presentation follows the P0 status and action matrix', async () => {
  const { capabilityUpdatePresentation, getSeedCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const item = { status: 'published', online: 'v1.0.7', capabilityUpdate: update }

  assert.deepEqual(capabilityUpdatePresentation(item), {
    visible: true, statusLabel: '有更新', actionLabel: '更新', actionLoading: false, ignoreLabel: '忽略更新'
  })
  assert.deepEqual(capabilityUpdatePresentation({ ...item, capabilityUpdate: { ...update, status: 'preparing' } }), {
    visible: true, statusLabel: '正在准备更新', actionLabel: '正在准备', actionLoading: true, ignoreLabel: ''
  })
  assert.deepEqual(capabilityUpdatePresentation({ ...item, editStatus: 'draft', capabilityUpdate: { ...update, status: 'processing' } }), {
    visible: true, statusLabel: '更新中', actionLabel: '继续更新', actionLoading: false, ignoreLabel: ''
  })
  assert.deepEqual(capabilityUpdatePresentation({ ...item, editStatus: 'review', capabilityUpdate: { ...update, status: 'processing' } }), {
    visible: true, statusLabel: '', actionLabel: '', actionLoading: false, ignoreLabel: ''
  })
  assert.deepEqual(capabilityUpdatePresentation({ ...item, editStatus: 'approved', capabilityUpdate: { ...update, status: 'processing' } }), {
    visible: true, statusLabel: '', actionLabel: '', actionLoading: false, ignoreLabel: ''
  })
  assert.deepEqual(capabilityUpdatePresentation({ ...item, editStatus: 'rejected', capabilityUpdate: { ...update, status: 'processing' } }), {
    visible: true, statusLabel: '已驳回', actionLabel: '继续更新', actionLoading: false, ignoreLabel: ''
  })
  assert.equal(capabilityUpdatePresentation({ ...item, capabilityUpdate: { ...update, status: 'ignored' } }).visible, false)
  assert.equal(capabilityUpdatePresentation({ ...item, capabilityUpdate: { ...update, status: 'resolved' } }).visible, false)

  const permissionUpdate = getSeedCapabilityUpdate('voucher-recommend')
  assert.equal(capabilityUpdatePresentation({ ...item, capabilityUpdate: permissionUpdate }).ignoreLabel, '忽略更新')
})

test('safe capability Markdown parser returns structured text without executing HTML', async () => {
  const { parseCapabilityMarkdown } = await import('../src/services/safeCapabilityMarkdown.js')
  const blocks = parseCapabilityMarkdown([
    '## 变化摘要',
    '新增来源字段。<img src=x onerror=alert(1)>',
    '',
    '## 受影响能力',
    '| 能力上下文 | 变化类型 |',
    '| --- | --- |',
    '| GEO 来源 | 增强 |',
    '',
    '## 权限与风险',
    '- 新增读取权限 geo.source.read'
  ].join('\n'))

  assert.deepEqual(blocks, [
    { type: 'heading', level: 2, text: '变化摘要' },
    { type: 'paragraph', text: '新增来源字段。<img src=x onerror=alert(1)>' },
    { type: 'heading', level: 2, text: '受影响能力' },
    { type: 'table', headers: ['能力上下文', '变化类型'], rows: [['GEO 来源', '增强']] },
    { type: 'heading', level: 2, text: '权限与风险' },
    { type: 'list', items: ['新增读取权限 geo.source.read'] }
  ])
})

test('Skill Hub change summary is visible only before an update starts', async () => {
  const { shouldShowCapabilityChangeSummary } = await import('../src/services/skillCapabilityChanges.js')
  assert.equal(shouldShowCapabilityChangeSummary({ status: 'available' }), true)
  assert.equal(shouldShowCapabilityChangeSummary({ status: 'processing' }), false)
  assert.equal(shouldShowCapabilityChangeSummary({ status: 'resolved' }), false)
  assert.equal(shouldShowCapabilityChangeSummary(undefined), false)
})

test('legacy processing drafts receive missing seeded context once', async () => {
  const { getSeedCapabilityUpdate, hydrateCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const seededUpdate = getSeedCapabilityUpdate('product-knowledge')
  const legacy = hydrateCapabilityUpdate({
    capabilityUpdate: { ...seededUpdate, currentContextCodes: undefined, status: 'processing' },
    draft: { selectedContextCodes: [], aiTuned: false }
  }, seededUpdate)
  assert.deepEqual(legacy.capabilityUpdate.currentContextCodes, ['dashboard.geoKnowledge'])
  assert.deepEqual(legacy.draft.selectedContextCodes, ['dashboard.geoKnowledge'])
  assert.equal(legacy.draft.baselineContextSeeded, true)

  const userEdited = hydrateCapabilityUpdate({
    capabilityUpdate: { ...seededUpdate, status: 'processing' },
    draft: { selectedContextCodes: [], aiTuned: false, baselineContextSeeded: true }
  }, seededUpdate)
  assert.deepEqual(userEdited.draft.selectedContextCodes, [])

  const legacyReview = hydrateCapabilityUpdate({
    status: 'review',
    statusText: '待审批',
    online: 'v1.0.7',
    capabilityUpdate: { ...seededUpdate, status: 'processing' },
    draft: { selectedContextCodes: ['dashboard.geoKnowledge'], aiTuned: true, baselineContextSeeded: true }
  }, seededUpdate)
  assert.equal(legacyReview.status, 'published')
  assert.equal(legacyReview.statusText, '已发布')
  assert.equal(legacyReview.editStatus, 'review')
})

test('a newer capability record is not hidden by a resolved cache', async () => {
  const { getSeedCapabilityUpdate, hydrateCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const oldUpdate = getSeedCapabilityUpdate('product-knowledge')
  oldUpdate.status = 'resolved'
  const newerUpdate = {
    ...getSeedCapabilityUpdate('product-knowledge'),
    recordId: 'capability-change-product-knowledge-20260820',
    targetCapabilityVersion: 'cap-2026.08.20',
    detectedAt: '2026-08-20 09:30',
    summary: '第二次能力变化，新增配件兼容性字段。'
  }
  const hydrated = hydrateCapabilityUpdate({ capabilityUpdate: oldUpdate }, newerUpdate)
  assert.equal(hydrated.capabilityUpdate.recordId, newerUpdate.recordId)
  assert.equal(hydrated.capabilityUpdate.targetCapabilityVersion, 'cap-2026.08.20')
  assert.equal(hydrated.capabilityUpdate.status, 'available')
  assert.equal(hydrated.capabilityUpdate.history[0].recordId, oldUpdate.recordId)
  assert.equal(hydrated.capabilityUpdate.history[0].targetCapabilityVersion, oldUpdate.targetCapabilityVersion)
  assert.equal(hydrated.capabilityUpdate.history[0].changes.length, oldUpdate.changes.length)

  const processing = hydrateCapabilityUpdate({
    status: 'published',
    statusText: '已发布',
    online: 'v1.0.7',
    editStatus: 'review',
    capabilityUpdate: { ...oldUpdate, status: 'processing' },
    draft: {
      selectedContextCodes: ['dashboard.geoKnowledge'],
      aiTuned: true,
      evaluationCapabilityVersion: oldUpdate.targetCapabilityVersion,
      baselineContextSeeded: true,
      summaryItems: [{ label: '能力变化', text: oldUpdate.summary }],
      summaryUpdated: '能力变化检测于 2026-08-14 09:30'
    }
  }, newerUpdate)
  assert.equal(processing.capabilityUpdate.status, 'processing_with_available')
  assert.equal(processing.workflowStatus, 'review')
  assert.equal(processing.editStatus, 'review')
  assert.equal(processing.draft.aiTuned, true)
  assert.equal(processing.draft.evaluationCapabilityVersion, oldUpdate.targetCapabilityVersion)
  assert.equal(processing.capabilityUpdate.pendingUpdate.recordId, newerUpdate.recordId)
})

test('legacy processing state restores the P0 available marker without discarding the draft', async () => {
  const {
    capabilityUpdatePresentation,
    getSeedCapabilityUpdate,
    hydrateCapabilityUpdate
  } = await import('../src/services/skillCapabilityChanges.js')
  const seededUpdate = getSeedCapabilityUpdate('product-knowledge')
  const legacyUpdate = { ...seededUpdate, status: 'processing' }
  delete legacyUpdate.flowRevision
  const draft = {
    form: { name: 'product-knowledge', cnName: '产品知识问答', menu: 'GEO 看板', scene: '', input: '', output: '' },
    selectedContextCodes: ['dashboard.geoKnowledge'],
    clarifyMessages: [],
    summaryItems: [],
    summaryUpdated: '',
    aiTuned: true,
    savedAt: '2026-08-19 10:00'
  }

  const hydrated = hydrateCapabilityUpdate({
    name: 'product-knowledge',
    online: 'v1.0.7',
    version: 'v1.0.8',
    status: 'published',
    statusText: '已发布',
    editStatus: 'review',
    draft,
    capabilityUpdate: legacyUpdate
  }, seededUpdate)

  assert.equal(typeof seededUpdate.flowRevision, 'string')
  assert.equal(hydrated.capabilityUpdate.status, 'available')
  assert.equal(hydrated.editStatus, 'review')
  assert.deepEqual(hydrated.draft, draft)
  assert.equal(capabilityUpdatePresentation({
    editStatus: hydrated.editStatus,
    capabilityUpdate: hydrated.capabilityUpdate
  }).statusLabel, '有更新')
  assert.equal(capabilityUpdatePresentation({
    editStatus: hydrated.editStatus,
    capabilityUpdate: hydrated.capabilityUpdate
  }).actionLabel, '更新')
})

test('capability submission enters review workflow without retaining the update editor action', async () => {
  const { beginCapabilityUpdate, completeCapabilityUpdate, getSeedCapabilityUpdate, mergeCapabilitySubmission, resolveSkillHubAllowedActions, transitionCapabilityEdit } = await import('../src/services/skillCapabilityChanges.js')
  const preparing = beginCapabilityUpdate({
    name: 'product-knowledge',
    cnName: '产品知识问答',
    category: '知识问答',
    desc: '产品知识查询',
    version: 'v1.0.7',
    online: 'v1.0.7',
    status: 'published',
    statusText: '已发布',
    owner: 'product-pm',
    capabilityUpdate: getSeedCapabilityUpdate('product-knowledge')
  }, '2026-08-14 11:00')
  const current = completeCapabilityUpdate(preparing, preparing.draft, '2026-08-14 11:05')
  const submitted = mergeCapabilitySubmission(current, {
    cnName: current.cnName,
    desc: current.desc,
    category: 'GEO 看板',
    tags: ['手工上传知识'],
    owner: 'admin',
    score: '0.859',
    draft: { ...current.draft, aiTuned: true, evaluationCapabilityVersion: current.capabilityUpdate.targetCapabilityVersion }
  }, '2026-08-14 11:10')
  assert.equal(submitted.owner, 'product-pm')
  assert.equal(submitted.status, 'published')
  assert.equal(submitted.editStatus, 'review')
  assert.equal(submitted.online, 'v1.0.7')
  assert.equal(submitted.capabilityUpdate.hasDraftEdits, true)
  assert.deepEqual(resolveSkillHubAllowedActions(submitted, { role: 'admin', user: 'admin' }).map(action => action.code), [
    'view_change',
    'view',
    'evaluate',
    'approve',
    'reject'
  ])

  const approved = transitionCapabilityEdit(submitted, 'approved', 'admin', '2026-08-14 11:20')
  assert.equal(approved.status, 'published')
  assert.equal(approved.editStatus, 'approved')
  assert.equal(approved.online, 'v1.0.7')
  const published = transitionCapabilityEdit(approved, 'published', 'admin', '2026-08-14 11:30')
  assert.equal(published.online, 'v1.0.8')
  assert.equal(published.capabilityUpdate.status, 'resolved')
  assert.equal(published.editStatus, undefined)
})

test('Skill Hub exposes controlled update discovery and change actions', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.match(view, /只看有更新/)
  assert.match(view, /查看变化/)
  assert.match(view, /rowPresentation/)
  assert.match(view, /能力变化详情/)
  assert.match(view, /startCapabilityUpdate/)
  assert.match(view, /allowedActionsFor/)
  assert.match(view, /decisionCapabilityUpdate/)
})

test('Skill Hub renders the controlled update lifecycle from action codes', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.match(view, /allowedActionsFor\(item, actor\.value\)/)
  assert.match(view, /action\.code/)
  assert.match(view, /action\.enabled/)
  assert.match(view, /function actionLabel\(action: SkillHubActionCode\)/)
  assert.match(view, /ignore_update:\s*'忽略更新'/)
  assert.match(view, /retry_update:\s*'重试更新'/)
  assert.match(view, /continue_update:\s*'继续更新'/)
  assert.doesNotMatch(view, /const pmActions:/)
  assert.doesNotMatch(view, /const adminActions:/)
})

test('Skill Hub renders safe Markdown reports and validates one ignore action', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  const component = await source('../src/components/agent/SafeCapabilityMarkdown.vue')
  assert.match(view, /SafeCapabilityMarkdown/)
  assert.match(view, /reportMarkdown/)
  assert.match(view, /technicalDetails/)
  assert.match(view, /ignoreCapabilityUpdate/)
  assert.match(view, /忽略更新只作用于当前变化记录/)
  assert.match(view, /confirmRequiresReason/)
  assert.match(view, /confirmError/)
  assert.doesNotMatch(view, /暂不处理/)
  assert.doesNotMatch(view, /忽略本次/)
  assert.doesNotMatch(component, /v-html/)
  assert.match(component, /parseCapabilityMarkdown/)
  assert.match(component, /block\.type === 'table'/)
})

test('Skill Hub loads fixed capability updates without user-side demo controls', async () => {
  const service = await source('../src/services/skillCapabilityChanges.js')
  const store = await source('../src/stores/skillHub.ts')
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.doesNotMatch(service, /export function activateCapabilityDemo|export function resetCapabilityDemo/)
  assert.match(store, /const seededUpdate = getSeedCapabilityUpdate\(item\.name\)/)
  assert.doesNotMatch(store, /const seededUpdate = item\.capabilityUpdate/)
  assert.doesNotMatch(store, /activateCapabilityDemo|resetCapabilityDemos/)
  assert.doesNotMatch(view, /模拟能力变化|重置演示数据|new\.leaibot\.cn/)
})

test('all Skill Hub summary cards filter the list with one shared predicate', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  const styles = await source('../src/assets/workbench.css')
  assert.match(view, /type SummaryFilter = 'all' \| 'own' \| 'review' \| 'published' \| 'updates' \| 'disabled'/)
  assert.match(view, /function matchesSummaryFilter\(item: SkillHubItem, filter: SummaryFilter\)/)
  for (const filter of ['all', 'own', 'review', 'published', 'updates', 'disabled']) {
    assert.match(view, new RegExp(`filter: '${filter}'`))
  }
  assert.match(view, /summaryFilter\.value === filter \? 'all' : filter/)
  assert.match(view, /item\.owner === \(user\.value \|\| 'admin'\)/)
  assert.match(view, /item\.workflowStatus === 'review'/)
  assert.match(view, /item\.onlineStatus === 'published'/)
  assert.match(view, /return hasCapabilityUpdate\(item\)/)
  assert.match(view, /item\.onlineStatus === 'disabled'/)
  assert.match(styles, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/)
  assert.match(styles, /\.skill-hub-stat\.is-active/)
  assert.match(styles, /\.skill-hub-toolbar > input/)
  assert.match(styles, /\.skill-hub-table th:last-child[\s\S]*position:sticky/)
})

test('owned Skills expose one standard edit action outside controlled updates', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  const service = await source('../src/services/skillCapabilityChanges.js')
  assert.match(view, /allowedActionsFor\(item, actor\.value\)/)
  assert.match(service, /published:\s*\['view', 'edit', 'evaluate', 'test'\]/)
  assert.match(service, /disabled:\s*\['view', 'edit', 'evaluate', 'test'\]/)
  assert.match(view, /openSkillCreateForItem\(item, item\.workflowStatus === 'rejected'\)/)
})

test('skill store preserves online version while an update draft is edited', async () => {
  const store = await source('../src/stores/skillHub.ts')
  assert.match(store, /capabilityUpdate\?: SkillCapabilityUpdate/)
  assert.match(store, /editVersion\?: string/)
  assert.match(store, /function startCapabilityUpdate/)
  assert.match(store, /updateCapabilityEditStatus/)
  assert.match(store, /mergeCapabilitySubmission/)
})

test('Skill Hub mock state resets to the seeded records after a full page refresh', async () => {
  const store = await source('../src/stores/skillHub.ts')
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.match(store, /function loadItems\(\) \{\s*return cloneDefaultItems\(\)\s*\}/)
  assert.match(store, /name:\s*'product-knowledge'[^\n]*status:\s*'published'/)
  assert.match(store, /name:\s*'voucher-recommend'[^\n]*status:\s*'published'/)
  assert.match(store, /function resetToInitialMock\(\) \{\s*items\.value = cloneDefaultItems\(\)\s*\}/)
  assert.match(store, /resetToInitialMock,?/)
  assert.match(view, /navigation\.type === 'reload'/)
  assert.match(view, /sessionStorage\.removeItem\('leai\.skillCreateDraft'\)/)
  assert.doesNotMatch(view, /skillHubStore\.resetToInitialMock\(\)/, 'entering the cached page must not erase newly submitted records; a full refresh initializes the store')
  assert.doesNotMatch(store, /localStorage\.getItem\(STORAGE_KEY\)/)
  assert.doesNotMatch(store, /localStorage\.setItem\(STORAGE_KEY/)
})

test('Skill Hub shows one main status and at most one update prompt', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.match(view, /rowPresentation\(item\)\.mainStatusLabel/)
  assert.match(view, /rowPresentation\(item\)\.updateStatusLabel/)
  assert.match(view, /v-if="rowPresentation\(item\)\.updateStatusLabel"/)
  assert.doesNotMatch(view, /class="skill-hub-edit-status"/)
})

test('Skill create keeps capability context changes visible and gates review at 0.80', async () => {
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.doesNotMatch(view, /class="skill-capability-update-banner"/)
  assert.doesNotMatch(view, /查看能力上下文/)
  assert.match(view, /class="skill-chat-context skill-capability-context-panel"[\s\S]*class="skill-capability-context-meta"/)
  assert.match(view, /已选能力受影响/)
  assert.match(view, /可选新增/)
  assert.match(view, /目标能力版本/)
  assert.match(view, /检测于/)
  assert.match(view, /REVIEW_SCORE_THRESHOLD = 0\.80/)
  assert.match(view, /currentScore\.value < REVIEW_SCORE_THRESHOLD/)
  assert.match(view, /综合评分 ≥ 0\.80/)
  assert.doesNotMatch(view, /综合评分 ≥ 0\.60|已达到 0\.60|及格线 0\.60/)
})

test('Skill update combines selected context and capability changes without auto-selecting additions', async () => {
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(view, /已选能力受影响/)
  assert.match(view, /可选新增/)
  assert.match(view, /加入上下文/)
  assert.match(view, /affectedSelectedContextItems/)
  assert.match(view, /optionalNewContextItems/)
  assert.match(view, /function addOptionalContext/)
  assert.match(view, /function handleContextCardClick/)
  assert.match(view, /class="skill-context-card"[\s\S]*?@click="handleContextCardClick\(item\.code\)"/)
  assert.match(view, /optionalNewContextItems\.value\.some\(item => item\.code === code\)/)
  assert.match(view, /activeTab\.value = 'clarify'/)
  assert.match(view, /ref="capabilityContextEl"/)
  assert.match(view, /tabindex="-1"/)
  assert.match(view, /capabilityContextEl\.value\?\.focus/)
  assert.match(view, /:aria-disabled="item\.selected"/)
  assert.match(view, /selected: false/)
  assert.match(view, /\.skill-capability-context-panel\s*\{[^}]*flex:\s*0 0 auto;/s)
  assert.match(view, /container-type:\s*inline-size/)
  assert.match(view, /@container \(max-width: 480px\)/)
})

test('Skill create reloads an update draft when route intent changes in an open tab', async () => {
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(view, /watch\(\s*\(\) => \[\s*String\(route\.query\.skill \|\| ''\),\s*String\(route\.query\.edit \|\| ''\),\s*String\(route\.query\.capabilityUpdate \|\| ''\)\s*\]/s)
  assert.match(view, /\(nextIntent, previousIntent\)[\s\S]*loadEditDraft\(\)/)
})

test('Skill update automatically runs the stable first clarification task and commits only after a model result', async () => {
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(view, /autoExecute/)
  assert.match(view, /runPendingCapabilityUpdate/)
  assert.match(view, /runningCapabilityTaskIds/)
  assert.match(view, /requestSkillModelReply\(scanMessage\.text\)/)
  assert.match(view, /createCapabilityDecisionSummary/)
  assert.match(view, /能力更新采用结论/)
  assert.match(view, /skillHubStore\.completeCapabilityUpdate/)
  assert.match(view, /skillHubStore\.failCapabilityUpdate/)
  assert.match(view, /sessionStorage\.setItem\('leai\.skillCreateDraft'/)
})

test('Skill update separates selected, affected, and optional contexts with readable paths and versions', async () => {
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(view, /activeCapabilityUpdate\.value\?\.affectedContexts/)
  assert.match(view, /activeCapabilityUpdate\.value\?\.optionalContexts/)
  assert.match(view, /v-for="item in optionalContextItems"/)
  assert.match(view, /contextVersionLabel/)
  assert.match(view, /:title="contextItemTitle\(item\)"/)
  assert.match(view, /currentVersion/)
  assert.match(view, /targetVersion/)
  assert.match(view, /-webkit-line-clamp:\s*2/)
})

test('Skill Hub row presentation keeps capability processing as an overlay on every workflow status', async () => {
  const { getSeedCapabilityUpdate, skillHubRowPresentation } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const base = {
    onlineStatus: 'published',
    workflowStatus: 'review',
    status: 'published',
    editStatus: 'review',
    online: 'v1.0.7',
    capabilityUpdate: update
  }

  assert.deepEqual(skillHubRowPresentation(base), {
    mainStatus: 'review',
    mainStatusLabel: '待审批',
    updateStatus: 'available',
    updateStatusLabel: '有更新'
  })
  assert.deepEqual(skillHubRowPresentation({ ...base, capabilityUpdate: { ...update, status: 'preparing' } }), {
    mainStatus: 'review',
    mainStatusLabel: '待审批',
    updateStatus: 'preparing',
    updateStatusLabel: '正在准备更新'
  })
  assert.deepEqual(skillHubRowPresentation({ ...base, capabilityUpdate: { ...update, status: 'failed' } }), {
    mainStatus: 'review',
    mainStatusLabel: '待审批',
    updateStatus: 'failed',
    updateStatusLabel: '更新失败'
  })
  assert.deepEqual(skillHubRowPresentation({ ...base, workflowStatus: 'draft', editStatus: 'draft', capabilityUpdate: { ...update, status: 'processing' } }), {
    mainStatus: 'draft',
    mainStatusLabel: '草稿',
    updateStatus: 'processing',
    updateStatusLabel: '更新中'
  })
  assert.deepEqual(skillHubRowPresentation({ ...base, workflowStatus: 'draft', editStatus: 'draft', capabilityUpdate: { ...update, status: 'processing_with_available' } }), {
    mainStatus: 'draft',
    mainStatusLabel: '草稿',
    updateStatus: 'processing_with_available',
    updateStatusLabel: '更新中（有新变化）'
  })

  for (const workflowStatus of ['draft', 'review', 'approved', 'published', 'disabled', 'rejected']) {
    const presentation = skillHubRowPresentation({
      ...base,
      workflowStatus,
      editStatus: workflowStatus,
      capabilityUpdate: { ...update, status: 'processing' }
    })
    assert.equal(presentation.mainStatus, workflowStatus)
    assert.equal(presentation.updateStatus, 'processing')
    assert.equal(presentation.updateStatusLabel, '更新中')
  }
})

test('available capability changes always expose update and ignore actions until handled', async () => {
  const { getSeedCapabilityUpdate, resolveSkillHubAllowedActions } = await import('../src/services/skillCapabilityChanges.js')
  const update = getSeedCapabilityUpdate('product-knowledge')
  const actor = { role: 'admin', user: 'admin' }
  const workflows = ['draft', 'review', 'approved', 'published', 'disabled', 'rejected']

  for (const workflowStatus of workflows) {
    const actions = resolveSkillHubAllowedActions({
      name: `skill-${workflowStatus}`,
      owner: 'product-pm',
      workflowStatus,
      status: workflowStatus,
      onlineStatus: workflowStatus === 'disabled' ? 'disabled' : workflowStatus === 'published' ? 'published' : 'unpublished',
      online: workflowStatus === 'published' || workflowStatus === 'disabled' ? 'v1.0.0' : '未发布',
      capabilityUpdate: { ...update, recordId: `change-${workflowStatus}` }
    }, actor)
    assert.deepEqual(
      actions.map(action => action.code),
      workflowStatus === 'published'
        ? ['view_change', 'start_update', 'ignore_update', 'evaluate', 'test', 'disable']
        : workflowStatus === 'draft'
          ? ['view_change', 'start_update', 'ignore_update', 'view']
        : ['view_change', 'start_update', 'ignore_update']
    )
  }

  assert.deepEqual(resolveSkillHubAllowedActions({
    name: 'preparing-skill', owner: 'admin', workflowStatus: 'review', status: 'review', onlineStatus: 'unpublished', online: '未发布',
    capabilityUpdate: { ...update, status: 'preparing' }
  }, actor).map(action => [action.code, action.enabled]), [
    ['view_change', true],
    ['start_update', false]
  ])

  assert.deepEqual(resolveSkillHubAllowedActions({
    name: 'failed-skill', owner: 'admin', workflowStatus: 'review', status: 'review', onlineStatus: 'unpublished', online: '未发布',
    capabilityUpdate: { ...update, status: 'failed' }
  }, actor).map(action => action.code), ['view_change', 'view_update_error', 'retry_update', 'ignore_update'])
})

test('processing updates expose continue only while editable and otherwise retain workflow actions', async () => {
  const { getSeedCapabilityUpdate, resolveSkillHubAllowedActions } = await import('../src/services/skillCapabilityChanges.js')
  const update = { ...getSeedCapabilityUpdate('product-knowledge'), status: 'processing' }
  const admin = { role: 'admin', user: 'admin' }

  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'draft-update', owner: 'admin', workflowStatus: 'draft', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, admin).map(action => action.code), ['view_change', 'continue_update', 'view'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'review-update', owner: 'product-pm', workflowStatus: 'review', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, admin).map(action => action.code), ['view_change', 'view', 'evaluate', 'approve', 'reject'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'owned-review-update', owner: 'product-pm', workflowStatus: 'review', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, { role: 'pm', user: 'product-pm' }).map(action => action.code), ['view_change', 'view', 'withdraw_review'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'owned-approved-update', owner: 'product-pm', workflowStatus: 'approved', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, { role: 'pm', user: 'product-pm' }).map(action => action.code), ['view_change', 'view', 'evaluate', 'test'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'approved-update', owner: 'product-pm', workflowStatus: 'approved', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, admin).map(action => action.code), ['view_change', 'view', 'evaluate', 'test', 'publish'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'rejected-update', owner: 'admin', workflowStatus: 'rejected', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, admin).map(action => action.code), ['view_change', 'continue_update'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'published-update', owner: 'product-pm', workflowStatus: 'published', status: 'published', online: 'v1.0.7', capabilityUpdate: update }, admin).map(action => action.code), ['view_change', 'continue_update', 'disable'])
  assert.deepEqual(resolveSkillHubAllowedActions({ name: 'disabled-update', owner: 'product-pm', workflowStatus: 'disabled', status: 'disabled', online: 'v1.0.7', capabilityUpdate: update }, admin).map(action => action.code), ['view_change', 'continue_update'])

  assert.deepEqual(resolveSkillHubAllowedActions({
    name: 'later-change', owner: 'product-pm', workflowStatus: 'review', status: 'published', online: 'v1.0.7',
    capabilityUpdate: { ...update, status: 'processing_with_available' }
  }, admin).map(action => action.code), ['view_change', 'continue_update', 'start_update', 'ignore_update'])
})

test('Skill evaluation result depends on score while ownership only gates saving and submission', async () => {
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(view, /const evaluationPassed = computed\(\(\) => currentScore\.value >= REVIEW_SCORE_THRESHOLD\)/)
  assert.match(view, /class="skill-eval-gate" :class="evaluationPassed \? 'pass' : 'warn'"/)
  assert.match(view, /\{\{ evaluationPassed \? '评估通过' : '评估未通过' \}\}/)
  assert.match(view, /const canSubmitReview = computed\(\(\) => submitMutationDecision\.value\.allowed\)/)
})

test('published Skills always retain disable across capability update states', async () => {
  const { getSeedCapabilityUpdate, resolveSkillHubAllowedActions } = await import('../src/services/skillCapabilityChanges.js')
  const admin = { role: 'admin', user: 'admin' }
  const published = {
    name: 'owned-by-pm', owner: 'product-pm', workflowStatus: 'published', status: 'published',
    onlineStatus: 'published', online: 'v1.0.0'
  }
  assert.deepEqual(resolveSkillHubAllowedActions(published, admin).map(action => action.code), ['view', 'edit', 'evaluate', 'test', 'disable'])
  assert.deepEqual(resolveSkillHubAllowedActions({
    ...published,
    capabilityUpdate: getSeedCapabilityUpdate('product-knowledge')
  }, admin).map(action => action.code), ['view_change', 'start_update', 'ignore_update', 'evaluate', 'test', 'disable'])

  for (const updateStatus of ['preparing', 'processing', 'processing_with_available', 'failed']) {
    assert.equal(resolveSkillHubAllowedActions({
      ...published,
      capabilityUpdate: { ...getSeedCapabilityUpdate('product-knowledge'), status: updateStatus }
    }, admin).some(action => action.code === 'disable'), true)
  }
})

test('ignored capability updates restore the standalone action matrix in every lifecycle', async () => {
  const { getSeedCapabilityUpdate, resolveSkillHubAllowedActions, skillHubMutationDecision } = await import('../src/services/skillCapabilityChanges.js')
  const admin = { role: 'admin', user: 'admin' }
  const ignoredUpdate = { ...getSeedCapabilityUpdate('product-knowledge'), status: 'ignored' }
  const samples = [
    ['draft', 'admin', '未发布', ['view', 'edit']],
    ['review', 'admin', '未发布', ['view', 'withdraw_review', 'evaluate', 'approve', 'reject']],
    ['approved', 'ops-pm', '未发布', ['view', 'evaluate', 'test', 'publish']],
    ['published', 'product-pm', 'v1.0.7', ['view', 'edit', 'evaluate', 'test', 'disable']],
    ['disabled', 'admin', 'v1.0.7', ['view', 'edit', 'evaluate', 'test', 'enable']],
    ['rejected', 'admin', '未发布', ['view', 'edit', 'evaluate', 'test']]
  ]

  for (const [workflowStatus, owner, online, expectedActions] of samples) {
    const item = {
      name: `${workflowStatus}-ignored-update`,
      owner,
      workflowStatus,
      status: workflowStatus,
      onlineStatus: workflowStatus === 'published' ? 'published' : workflowStatus === 'disabled' ? 'disabled' : 'unpublished',
      online
    }
    assert.deepEqual(resolveSkillHubAllowedActions(item, admin).map(action => action.code), expectedActions)
    assert.deepEqual(resolveSkillHubAllowedActions({ ...item, capabilityUpdate: ignoredUpdate }, admin).map(action => action.code), expectedActions)
  }

  const published = {
    name: 'published-admin-maintenance',
    owner: 'product-pm',
    workflowStatus: 'published',
    status: 'published',
    onlineStatus: 'published',
    online: 'v1.0.7'
  }
  assert.equal(skillHubMutationDecision(published, admin, 'edit').allowed, true)
  assert.equal(skillHubMutationDecision({ ...published, capabilityUpdate: ignoredUpdate }, admin, 'edit').allowed, true)
  const disabled = { ...published, name: 'disabled-admin-maintenance', workflowStatus: 'disabled', status: 'disabled', onlineStatus: 'disabled' }
  assert.equal(skillHubMutationDecision(disabled, admin, 'edit').allowed, true)
  assert.equal(skillHubMutationDecision({ ...disabled, capabilityUpdate: ignoredUpdate }, admin, 'edit').allowed, true)
})

test('Skill Hub keeps the original Test and Apply labels with their original behaviors', async () => {
  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.match(view, /view:\s*'详情'/)
  assert.match(view, /evaluate:\s*'测试'/)
  assert.match(view, /test:\s*'应用'/)
  assert.match(view, /if \(action === 'evaluate'\) \{\s*evalItem\.value = item/)
  assert.match(view, /if \(action === 'test'\) return testSkill\(item\)/)
})

test('standalone draft exposes only view and edit while submission remains inside the edit flow', async () => {
  const { resolveSkillHubAllowedActions } = await import('../src/services/skillCapabilityChanges.js')
  const owner = { role: 'pm', user: 'owner-pm' }
  const draft = {
    name: 'draft-skill', owner: 'owner-pm', workflowStatus: 'draft', status: 'draft',
    onlineStatus: 'unpublished', online: '未发布'
  }
  assert.deepEqual(resolveSkillHubAllowedActions({ ...draft, score: '0.799' }, owner).map(action => action.code), ['view', 'edit'])
  assert.deepEqual(resolveSkillHubAllowedActions({ ...draft, score: '0.800' }, owner).map(action => action.code), ['view', 'edit'])

  const view = await source('../src/views/agent/AgentSkillsView.vue')
  assert.match(view, /action === 'edit'[\s\S]*openSkillCreateForItem\(item/)
})

test('Skill mutation policy enforces owner score and pending-change gates at the write boundary', async () => {
  const { getSeedCapabilityUpdate, skillHubMutationDecision } = await import('../src/services/skillCapabilityChanges.js')
  const draft = {
    name: 'owned-draft', owner: 'product-pm', workflowStatus: 'draft', status: 'draft',
    onlineStatus: 'unpublished', online: '未发布'
  }
  assert.equal(skillHubMutationDecision(undefined, 'product-pm', 'submit_review', 0.782).allowed, false)
  assert.equal(skillHubMutationDecision(undefined, 'product-pm', 'submit_review', 0.800).allowed, true)
  assert.equal(skillHubMutationDecision(draft, 'admin', 'edit').allowed, false)
  assert.equal(skillHubMutationDecision(draft, 'product-pm', 'edit').allowed, true)
  assert.equal(skillHubMutationDecision(draft, 'product-pm', 'submit_review', 0.799).allowed, false)
  assert.equal(skillHubMutationDecision(draft, 'product-pm', 'submit_review', 0.800).allowed, true)
  const processingUpdate = {
    ...draft,
    capabilityUpdate: {
      ...getSeedCapabilityUpdate('product-knowledge'),
      status: 'processing',
      task: { id: 'completed-update', kind: 'initial', status: 'succeeded' }
    }
  }
  assert.equal(skillHubMutationDecision(processingUpdate, { role: 'admin', user: 'admin' }, 'submit_review', 0.800).allowed, true)
  assert.equal(skillHubMutationDecision(processingUpdate, { role: 'admin', user: 'admin' }, 'submit_review', 0.799).allowed, false)
  assert.equal(skillHubMutationDecision(processingUpdate, { role: 'pm', user: 'other-pm' }, 'submit_review', 0.900).allowed, false)
  assert.equal(skillHubMutationDecision({
    ...draft,
    capabilityUpdate: { ...getSeedCapabilityUpdate('product-knowledge'), status: 'processing_with_available' }
  }, 'product-pm', 'submit_review', 0.900).allowed, false)
  assert.equal(skillHubMutationDecision({
    ...draft,
    capabilityUpdate: {
      ...getSeedCapabilityUpdate('product-knowledge'),
      status: 'processing',
      task: { id: 'additional-task', kind: 'additional_change', status: 'failed' }
    }
  }, 'product-pm', 'submit_review', 0.900).allowed, false)

  const store = await source('../src/stores/skillHub.ts')
  const view = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(store, /skillHubMutationDecision\(current, payload\.actor \|\| payload\.owner[^)]*'submit_review'/)
  assert.match(store, /skillHubMutationDecision\(current, payload\.actor \|\| payload\.owner[^)]*'edit'/)
  assert.match(view, /canEditCurrentSkill/)
  assert.match(view, /submitMutationDecision/)
  assert.match(view, /const mutationActor = computed/)
  assert.match(view, /actor:\s*mutationActor\.value/)
})

test('an update review can be withdrawn to the same update draft', async () => {
  const { getSeedCapabilityUpdate, transitionCapabilityEdit } = await import('../src/services/skillCapabilityChanges.js')
  const current = {
    name: 'product-knowledge', owner: 'product-pm', version: 'v1.0.8', editVersion: 'v1.0.8',
    online: 'v1.0.7', onlineStatus: 'published', status: 'published', statusText: '已发布',
    workflowStatus: 'review', editStatus: 'review', submittedAt: '2026-08-21 11:20', reviewer: 'admin', reviewTime: '2026-08-21 11:21',
    capabilityUpdate: { ...getSeedCapabilityUpdate('product-knowledge'), status: 'processing' }
  }
  const withdrawn = transitionCapabilityEdit(current, 'draft', 'product-pm', '2026-08-21 11:25')
  assert.equal(withdrawn.workflowStatus, 'draft')
  assert.equal(withdrawn.editStatus, 'draft')
  assert.equal(withdrawn.online, 'v1.0.7')
  assert.equal(withdrawn.capabilityUpdate.status, 'processing')
  assert.equal(withdrawn.submittedAt, undefined)
  assert.equal(withdrawn.reviewer, undefined)
  assert.equal(withdrawn.reviewTime, undefined)
})

test('high-risk updates require an ignore reason while enhancements do not', async () => {
  const { getSeedCapabilityUpdate, ignoreCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const permission = { name: 'voucher-recommend', online: 'v0.1.3', status: 'published', capabilityUpdate: getSeedCapabilityUpdate('voucher-recommend') }
  assert.throws(
    () => ignoreCapabilityUpdate(permission, { operator: 'growth-pm', reason: '' }, '2026-08-21 11:00'),
    /处理原因/
  )
  assert.equal(ignoreCapabilityUpdate(permission, { operator: 'growth-pm', reason: '本期权限尚未准备' }, '2026-08-21 11:01').capabilityUpdate.status, 'ignored')

  const enhancement = { name: 'product-knowledge', online: 'v1.0.7', status: 'published', capabilityUpdate: getSeedCapabilityUpdate('product-knowledge') }
  assert.equal(ignoreCapabilityUpdate(enhancement, { operator: 'product-pm', reason: '' }, '2026-08-21 11:02').capabilityUpdate.status, 'ignored')
})

test('failed updates remain visible and retry with the same task', async () => {
  const { beginCapabilityUpdate, failCapabilityUpdate, getSeedCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const started = beginCapabilityUpdate({
    name: 'product-knowledge', cnName: '产品知识问答', category: 'GEO 看板', desc: '产品知识查询',
    version: 'v1.0.7', online: 'v1.0.7', status: 'published', statusText: '已发布', workflowStatus: 'published', owner: 'product-pm',
    capabilityUpdate: getSeedCapabilityUpdate('product-knowledge')
  }, '2026-08-21 11:10')
  const failed = failCapabilityUpdate(started, '上下文同步超时', '2026-08-21 11:11')
  assert.equal(failed.capabilityUpdate.status, 'failed')
  assert.equal(failed.workflowStatus, 'published')
  assert.equal(failed.capabilityUpdate.task.error, '上下文同步超时')

  const retried = beginCapabilityUpdate(failed, '2026-08-21 11:12')
  assert.equal(retried.capabilityUpdate.status, 'preparing')
  assert.equal(retried.capabilityUpdate.task.id, started.capabilityUpdate.task.id)
})

test('a later capability record creates one decision gate on the existing update draft', async () => {
  const { beginCapabilityUpdate, getSeedCapabilityUpdate, hydrateCapabilityUpdate, ignoreCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const active = getSeedCapabilityUpdate('product-knowledge')
  const later = {
    ...getSeedCapabilityUpdate('product-knowledge'),
    recordId: 'capability-change-product-knowledge-20260821',
    targetCapabilityVersion: 'cap-2026.08.21',
    detectedAt: '2026-08-21 10:30',
    summary: '新增配件兼容性字段。'
  }
  const processingItem = {
    name: 'product-knowledge', cnName: '产品知识问答', category: 'GEO 看板', desc: '产品知识查询', owner: 'product-pm',
    version: 'v1.0.8', editVersion: 'v1.0.8', online: 'v1.0.7', status: 'published', statusText: '已发布', workflowStatus: 'draft', editStatus: 'draft',
    draft: { selectedContextCodes: ['dashboard.geoKnowledge'], clarifyMessages: [], summaryItems: [], aiTuned: true, evaluationCapabilityVersion: active.targetCapabilityVersion, baselineContextSeeded: true },
    capabilityUpdate: { ...active, status: 'processing', activeUpdateChangeRecordIds: [active.recordId] }
  }

  const discovered = hydrateCapabilityUpdate(processingItem, later)
  assert.equal(discovered.capabilityUpdate.status, 'processing_with_available')
  assert.equal(discovered.capabilityUpdate.pendingUpdate.recordId, later.recordId)
  assert.equal(discovered.editVersion, 'v1.0.8')
  assert.equal(discovered.workflowStatus, 'draft')

  const accepted = beginCapabilityUpdate({ ...processingItem, ...discovered }, '2026-08-21 10:31')
  assert.equal(accepted.capabilityUpdate.status, 'processing')
  assert.equal(accepted.editVersion, 'v1.0.8')
  assert.equal(accepted.draft.evaluationCapabilityVersion, undefined)
  assert.deepEqual(accepted.capabilityUpdate.activeUpdateChangeRecordIds, [active.recordId, later.recordId])

  const ignored = ignoreCapabilityUpdate({ ...processingItem, ...discovered }, { operator: 'product-pm', reason: '' }, '2026-08-21 10:32')
  assert.equal(ignored.capabilityUpdate.status, 'processing')
  assert.equal(ignored.editVersion, 'v1.0.8')
  assert.deepEqual(ignored.capabilityUpdate.activeUpdateChangeRecordIds, [active.recordId])
})

test('accepting a later change from review returns the same edit version to draft and reruns its scan', async () => {
  const { beginCapabilityUpdate, getSeedCapabilityUpdate, hydrateCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const active = getSeedCapabilityUpdate('product-knowledge')
  const later = {
    ...getSeedCapabilityUpdate('product-knowledge'),
    recordId: 'capability-change-review-later',
    targetCapabilityVersion: 'cap-2026.08.22',
    detectedAt: '2026-08-22 09:00'
  }
  const current = {
    name: 'product-knowledge', cnName: '产品知识问答', category: 'GEO 看板', desc: '产品知识查询', owner: 'product-pm',
    version: 'v1.0.8', editVersion: 'v1.0.8', online: 'v1.0.7', onlineStatus: 'published',
    status: 'published', statusText: '已发布', workflowStatus: 'review', editStatus: 'review', submittedAt: '2026-08-21 11:00',
    draft: { selectedContextCodes: ['dashboard.geoKnowledge'], clarifyMessages: [], summaryItems: [], aiTuned: true, evaluationCapabilityVersion: active.targetCapabilityVersion, baselineContextSeeded: true },
    capabilityUpdate: { ...active, status: 'processing', activeUpdateChangeRecordIds: [active.recordId] }
  }
  const discovered = hydrateCapabilityUpdate(current, later)
  const accepted = beginCapabilityUpdate({ ...current, ...discovered }, '2026-08-22 09:01')
  assert.equal(accepted.editVersion, 'v1.0.8')
  assert.equal(accepted.workflowStatus, 'draft')
  assert.equal(accepted.editStatus, 'draft')
  assert.equal(accepted.submittedAt, undefined)
  assert.equal(accepted.draft.evaluationCapabilityVersion, undefined)
  assert.equal(accepted.capabilityUpdate.status, 'processing')
  assert.equal(accepted.capabilityUpdate.task.kind, 'additional_change')
  assert.equal(accepted.capabilityUpdate.task.status, 'generating')
  assert.equal(accepted.capabilityUpdate.history?.some(record => record.recordId === later.recordId && record.status === 'resolved'), false)

  const createView = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(createView, /task\?\.kind === 'additional_change'/)
})

test('a failed later-change scan retries inside the same update draft', async () => {
  const {
    beginCapabilityUpdate,
    failCapabilityUpdate,
    getSeedCapabilityUpdate,
    hydrateCapabilityUpdate,
    retryCapabilityUpdateTask
  } = await import('../src/services/skillCapabilityChanges.js')
  const active = getSeedCapabilityUpdate('product-knowledge')
  const current = {
    name: 'product-knowledge', cnName: '产品知识问答', category: 'GEO 看板', desc: '产品知识查询', owner: 'product-pm',
    version: 'v1.0.8', editVersion: 'v1.0.8', online: 'v1.0.7', onlineStatus: 'published',
    status: 'published', statusText: '已发布', workflowStatus: 'draft', editStatus: 'draft',
    draft: { selectedContextCodes: ['dashboard.geoKnowledge'], clarifyMessages: [], summaryItems: [], aiTuned: true, baselineContextSeeded: true },
    capabilityUpdate: { ...active, status: 'processing', activeUpdateChangeRecordIds: [active.recordId] }
  }
  const later = { ...active, recordId: 'capability-change-retry-later', targetCapabilityVersion: 'cap-2026.08.24' }
  const accepted = beginCapabilityUpdate(hydrateCapabilityUpdate(current, later), '2026-08-24 09:00')
  const failed = failCapabilityUpdate(accepted, '扫描超时', '2026-08-24 09:01')

  assert.equal(failed.capabilityUpdate.status, 'processing')
  assert.equal(failed.capabilityUpdate.task.status, 'failed')
  assert.equal(failed.editVersion, 'v1.0.8')
  assert.deepEqual(failed.draft, accepted.draft)

  const retried = retryCapabilityUpdateTask(failed, '2026-08-24 09:02')
  assert.equal(retried.capabilityUpdate.status, 'processing')
  assert.equal(retried.capabilityUpdate.task.status, 'generating')
  assert.equal(retried.capabilityUpdate.task.id, failed.capabilityUpdate.task.id)
  assert.equal(retried.editVersion, 'v1.0.8')

  const createView = await source('../src/views/agent/AgentSkillCreateView.vue')
  assert.match(createView, /isCapabilityScanRetryAvailable/)
  assert.match(createView, /retryActiveCapabilityScan/)
})

test('a queued later change cannot replace the failed scan ahead of it', async () => {
  const {
    beginCapabilityUpdate,
    completeCapabilityUpdate,
    failCapabilityUpdate,
    getSeedCapabilityUpdate,
    hydrateCapabilityUpdate,
    resolveSkillHubAllowedActions
  } = await import('../src/services/skillCapabilityChanges.js')
  const active = getSeedCapabilityUpdate('product-knowledge')
  const current = {
    name: 'product-knowledge', owner: 'product-pm', version: 'v1.0.8', editVersion: 'v1.0.8',
    online: 'v1.0.7', status: 'published', statusText: '已发布', workflowStatus: 'draft', editStatus: 'draft',
    draft: { selectedContextCodes: ['dashboard.geoKnowledge'], clarifyMessages: [], summaryItems: [], aiTuned: true, baselineContextSeeded: true },
    capabilityUpdate: { ...active, status: 'processing', activeUpdateChangeRecordIds: [active.recordId] }
  }
  const pendingA = { ...active, recordId: 'failed-A', targetCapabilityVersion: 'cap-2026.08.24' }
  const pendingB = { ...active, recordId: 'queued-B', targetCapabilityVersion: 'cap-2026.08.25' }
  const first = hydrateCapabilityUpdate(current, pendingA)
  const queued = { ...current, ...hydrateCapabilityUpdate({ ...current, ...first }, pendingB) }
  const acceptedA = beginCapabilityUpdate(queued, '2026-08-24 10:00')
  const failedA = failCapabilityUpdate(acceptedA, '扫描 A 超时', '2026-08-24 10:01')

  assert.equal(failedA.capabilityUpdate.pendingUpdate.recordId, pendingB.recordId)
  assert.equal(failedA.capabilityUpdate.task.id, `capability-update-${pendingA.recordId}`)
  assert.deepEqual(
    resolveSkillHubAllowedActions(failedA, { role: 'pm', user: 'product-pm' }).map(action => action.code),
    ['view_change', 'view_update_error', 'retry_update', 'view']
  )

  const retriedA = beginCapabilityUpdate(failedA, '2026-08-24 10:02')
  assert.equal(retriedA.capabilityUpdate.task.id, `capability-update-${pendingA.recordId}`)
  assert.equal(retriedA.capabilityUpdate.task.status, 'generating')
  assert.equal(retriedA.capabilityUpdate.pendingUpdate.recordId, pendingB.recordId)

  const completedA = completeCapabilityUpdate(retriedA, retriedA.draft, '2026-08-24 10:03')
  assert.equal(completedA.capabilityUpdate.status, 'processing_with_available')
  assert.equal(completedA.capabilityUpdate.pendingUpdate.recordId, pendingB.recordId)
})

test('multiple later capability records remain queued in detection order', async () => {
  const { getSeedCapabilityUpdate, hydrateCapabilityUpdate, ignoreCapabilityUpdate } = await import('../src/services/skillCapabilityChanges.js')
  const active = getSeedCapabilityUpdate('product-knowledge')
  const current = {
    name: 'product-knowledge', owner: 'product-pm', version: 'v1.0.8', editVersion: 'v1.0.8',
    online: 'v1.0.7', status: 'published', statusText: '已发布', workflowStatus: 'draft', editStatus: 'draft',
    draft: { selectedContextCodes: ['dashboard.geoKnowledge'], clarifyMessages: [], summaryItems: [], aiTuned: true, baselineContextSeeded: true },
    capabilityUpdate: { ...active, status: 'processing', activeUpdateChangeRecordIds: [active.recordId] }
  }
  const pendingA = { ...active, recordId: 'pending-A', targetCapabilityVersion: 'cap-2026.08.22', detectedAt: '2026-08-22 09:00' }
  const pendingB = { ...active, recordId: 'pending-B', targetCapabilityVersion: 'cap-2026.08.23', detectedAt: '2026-08-23 09:00' }
  const first = hydrateCapabilityUpdate(current, pendingA)
  const second = hydrateCapabilityUpdate({ ...current, ...first }, pendingB)
  assert.equal(second.capabilityUpdate.pendingDecisionCount, 2)
  assert.deepEqual(second.capabilityUpdate.pendingUpdates.map(update => update.recordId), ['pending-A', 'pending-B'])
  assert.equal(second.capabilityUpdate.pendingUpdate.recordId, 'pending-A')

  const ignoredFirst = ignoreCapabilityUpdate(second, { operator: 'product-pm', reason: '' }, '2026-08-23 09:01')
  assert.equal(ignoredFirst.capabilityUpdate.status, 'processing_with_available')
  assert.equal(ignoredFirst.capabilityUpdate.pendingDecisionCount, 1)
  assert.equal(ignoredFirst.capabilityUpdate.pendingUpdate.recordId, 'pending-B')

  const ignoredSecond = ignoreCapabilityUpdate(ignoredFirst, { operator: 'product-pm', reason: '' }, '2026-08-23 09:02')
  assert.equal(ignoredSecond.capabilityUpdate.status, 'processing')
  assert.equal(ignoredSecond.capabilityUpdate.pendingDecisionCount, 0)
  assert.equal(ignoredSecond.capabilityUpdate.pendingUpdate, undefined)
})

test('publishing an update preserves a disabled online state', async () => {
  const { getSeedCapabilityUpdate, transitionCapabilityEdit } = await import('../src/services/skillCapabilityChanges.js')
  const disabled = {
    name: 'weather-query', version: 'v1.0.1', editVersion: 'v1.0.1', online: 'v1.0.0', onlineStatus: 'disabled',
    status: 'disabled', statusText: '已禁用', workflowStatus: 'approved', editStatus: 'approved',
    capabilityUpdate: { ...getSeedCapabilityUpdate('product-knowledge'), status: 'processing' }
  }
  const published = transitionCapabilityEdit(disabled, 'published', 'admin', '2026-08-21 11:30')
  assert.equal(published.online, 'v1.0.1')
  assert.equal(published.onlineStatus, 'disabled')
  assert.equal(published.status, 'disabled')
  assert.equal(published.statusText, '已禁用')
  assert.equal(published.capabilityUpdate.status, 'resolved')
})

test('the initial mock keeps rejected clean while five other lifecycles expose available updates', async () => {
  const { getSeedCapabilityUpdate, resolveSkillHubAllowedActions, skillHubRowPresentation } = await import('../src/services/skillCapabilityChanges.js')
  const service = await source('../src/services/skillCapabilityChanges.js')
  const store = await source('../src/stores/skillHub.ts')
  for (const skillName of [
    'capability-draft-demo',
    'low-stock-auto-offline',
    'lenovo-order-detail-query',
    'product-knowledge',
    'weather-query'
  ]) {
    assert.match(service, new RegExp(`['\"]${skillName}['\"]`))
    assert.equal(getSeedCapabilityUpdate(skillName)?.status, 'available')
  }
  assert.equal(getSeedCapabilityUpdate('workplace-employee-review-analysis'), undefined)
  assert.deepEqual(skillHubRowPresentation({
    name: 'workplace-employee-review-analysis',
    online: '未发布',
    status: 'rejected',
    workflowStatus: 'rejected'
  }), {
    mainStatus: 'rejected',
    mainStatusLabel: '已驳回',
    updateStatus: 'none',
    updateStatusLabel: ''
  })
  assert.match(store, /name:\s*'capability-draft-demo'[\s\S]*status:\s*'draft'/)
  assert.deepEqual(resolveSkillHubAllowedActions({
    name: 'capability-draft-demo', owner: 'admin', workflowStatus: 'draft', status: 'draft',
    onlineStatus: 'unpublished', online: '未发布', capabilityUpdate: getSeedCapabilityUpdate('capability-draft-demo')
  }, { role: 'admin', user: 'admin' }).map(action => action.code), ['view_change', 'start_update', 'ignore_update', 'view'])
  assert.match(store, /name:\s*'workplace-employee-review-analysis'[\s\S]*status:\s*'rejected'/)
  assert.match(store, /function loadItems\(\) \{\s*return cloneDefaultItems\(\)\s*\}/)
})

test('the initial mock also keeps one standalone sample for every original POC lifecycle', async () => {
  const { getSeedCapabilityUpdate, resolveSkillHubAllowedActions } = await import('../src/services/skillCapabilityChanges.js')
  const store = await source('../src/stores/skillHub.ts')
  const admin = { role: 'admin', user: 'admin' }
  const samples = [
    ['operations-insight-draft', 'draft', 'admin', ['view', 'edit']],
    ['driver-download-guide', 'review', 'service-pm', ['view', 'evaluate', 'approve', 'reject']],
    ['customer-profile-export', 'approved', 'admin', ['view', 'evaluate', 'test', 'publish']],
    ['gmv-daily-summary', 'published', 'admin', ['view', 'edit', 'evaluate', 'test', 'disable']],
    ['legacy-inventory-alert', 'disabled', 'admin', ['view', 'edit', 'evaluate', 'test', 'enable']],
    ['workplace-employee-review-analysis', 'rejected', 'admin', ['view', 'edit', 'evaluate', 'test']]
  ]

  for (const [name, workflowStatus, owner, expectedActions] of samples) {
    assert.match(store, new RegExp(`name:\\s*'${name}'[^\\n]*status:\\s*'${workflowStatus}'`))
    assert.equal(getSeedCapabilityUpdate(name), undefined)
    assert.deepEqual(resolveSkillHubAllowedActions({
      name,
      owner,
      workflowStatus,
      status: workflowStatus,
      onlineStatus: workflowStatus === 'published' ? 'published' : workflowStatus === 'disabled' ? 'disabled' : 'unpublished',
      online: workflowStatus === 'published' || workflowStatus === 'disabled' ? 'v1.0.0' : '未发布'
    }, admin).map(action => action.code), expectedActions)
  }
})
