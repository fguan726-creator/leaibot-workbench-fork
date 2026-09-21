import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test, { beforeEach } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'

// Execute the actual store, Vue reactivity and capability service without a browser or API.
const storeUrl = new URL('../src/stores/skillHub.ts', import.meta.url)
const source = stripTypeScriptTypes(readFileSync(storeUrl, 'utf8'))
  .replace("from 'pinia'", `from '${import.meta.resolve('pinia')}'`)
  .replace("from 'vue'", `from '${import.meta.resolve('vue')}'`)
  .replace("from '@/services/skillCapabilityChanges.js'", `from '${new URL('../src/services/skillCapabilityChanges.js', import.meta.url).href}'`)
const { useSkillHubStore } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

beforeEach(() => setActivePinia(createPinia()))

function draft(name = 'actual-business-skill') {
  return {
    form: { name, cnName: '实际业务技能', menu: '企业客户管理', scene: '分析客户跟进记录并给出建议。', input: '客户范围', output: '跟进建议' },
    selectedContextCodes: ['dashboard.query'],
    clarifyMessages: [],
    summaryItems: [],
    summaryUpdated: '已刷新',
    aiTuned: true,
    savedAt: '2026-09-21 10:00:00'
  }
}

function submission(overrides = {}) {
  return {
    name: 'actual-business-skill', cnName: '实际业务技能', desc: '分析客户跟进记录并给出建议。',
    category: '企业客户管理', owner: 'skill-owner', actor: { role: 'pm', user: 'skill-owner' },
    score: '0.859', tags: ['客户', '跟进'], draft: draft(), ...overrides
  }
}

function snapshot(value) {
  return JSON.parse(JSON.stringify(value))
}

test('new submission is first with the actual form fields and returns the stored reactive row', () => {
  const store = useSkillHubStore()
  const previous = snapshot(store.items)
  const payload = submission({ name: ' actual-business-skill ', cnName: ' 实际业务技能 ', desc: ' 分析客户跟进记录并给出建议。 ' })
  const submitted = store.upsertSubmittedSkill(payload)
  const first = store.items[0]
  assert.deepEqual([first.name, first.cnName, first.desc], ['actual-business-skill', '实际业务技能', '分析客户跟进记录并给出建议。'])
  assert.equal(first.category, payload.category)
  assert.equal(first.owner, payload.owner)
  assert.deepEqual(first.tags, payload.tags)
  assert.deepEqual(first.draft, payload.draft)
  assert.equal(first.workflowStatus, 'review')
  assert.equal(first.statusText, '待审批')
  assert.equal(first.onlineStatus, 'unpublished')
  assert.deepEqual(snapshot(store.items.slice(1)), previous)
  assert.equal(submitted, first)
  assert.equal(submitted, store.findSkill('actual-business-skill'))
})

test('an existing draft is promoted on every submission without a duplicate or owner replacement', () => {
  const store = useSkillHubStore()
  store.upsertDraftSkill(submission())
  store.upsertDraftSkill(submission({ name: 'other-draft', draft: draft('other-draft') }))
  const count = store.items.length
  const untouched = snapshot(store.items.filter(item => item.name !== 'actual-business-skill'))
  const submitted = store.upsertSubmittedSkill(submission({ name: ' actual-business-skill ', owner: 'replacement-owner', cnName: '修改后的中文名', desc: '本次真正提交的描述。' }))
  assert.equal(store.items[0].name, 'actual-business-skill')
  assert.equal(store.items.length, count)
  assert.equal(store.items.filter(item => item.name === 'actual-business-skill').length, 1)
  assert.equal(submitted.owner, 'skill-owner')
  assert.equal(submitted.cnName, '修改后的中文名')
  assert.equal(submitted.desc, '本次真正提交的描述。')
  assert.equal(submitted, store.items[0])
  assert.deepEqual(snapshot(store.items.slice(1)), untouched)

  store.updateStatus(submitted, 'draft')
  store.upsertSubmittedSkill(submission({ name: 'other-draft', draft: draft('other-draft') }))
  const resubmitted = store.upsertSubmittedSkill(submission())
  assert.equal(store.items[0], resubmitted)
  assert.equal(resubmitted.name, 'actual-business-skill')
  assert.equal(store.items.length, count)
  assert.equal(store.items.filter(item => item.name === 'actual-business-skill').length, 1)
})

test('a rejected Skill moves to the first row with its new fields and cleared previous review', () => {
  const store = useSkillHubStore()
  const name = 'workplace-employee-review-analysis'
  assert.equal(store.findSkill(name).workflowStatus, 'rejected')
  const count = store.items.length
  const submitted = store.upsertSubmittedSkill(submission({ name, owner: 'admin', actor: { role: 'admin', user: 'admin' }, cnName: '补充材料后的技能', desc: '本次补充了业务边界和测试材料。', draft: draft(name) }))
  assert.equal(store.items[0].name, name)
  assert.equal(store.items.length, count)
  assert.equal(store.items.filter(item => item.name === name).length, 1)
  assert.equal(submitted, store.items[0])
  assert.equal(submitted.cnName, '补充材料后的技能')
  assert.equal(submitted.desc, '本次补充了业务边界和测试材料。')
  assert.equal(submitted.workflowStatus, 'review')
  assert.equal(submitted.reviewer, undefined)
  assert.equal(submitted.reviewTime, undefined)
})

for (const scenario of [
  { label: 'low score for an existing draft', setup: store => store.upsertDraftSkill(submission()), payload: () => submission({ score: '0.799' }), reason: /0\.80/ },
  { label: 'low score for a new Skill', setup() {}, payload: () => submission({ score: '0.799' }), reason: /0\.80/ },
  { label: 'another owner', setup: store => store.upsertDraftSkill(submission()), payload: () => submission({ actor: { role: 'pm', user: 'other-owner' } }), reason: /负责人/ },
  { label: 'a failed capability scan', setup() {}, payload: () => submission({ name: 'capability-update-failure-demo', owner: 'admin', actor: { role: 'admin', user: 'admin' } }), reason: /扫描待重试/ }
]) {
  test(`refusing ${scenario.label} preserves every row and its order`, () => {
    const store = useSkillHubStore()
    scenario.setup(store)
    const before = snapshot(store.items)
    assert.throws(() => store.upsertSubmittedSkill(scenario.payload()), scenario.reason)
    assert.deepEqual(snapshot(store.items), before)
  })
}

test('capability review promotes the merged edit while retaining the online version and update record', () => {
  const store = useSkillHubStore()
  const name = 'capability-update-failure-demo'
  store.findSkill(name).publishedContract = { version: 'v1.0.0', description: '已经发布的查询说明', input: '原查询范围', output: '原查询结果' }
  store.startCapabilityUpdate(name)
  store.completeCapabilityUpdate(name, draft(name))
  const before = snapshot(store.findSkill(name))
  assert.equal(before.capabilityUpdate.status, 'processing')
  assert.equal(before.capabilityUpdate.task.status, 'succeeded')
  store.upsertDraftSkill(submission())
  const count = store.items.length
  const submitted = store.upsertSubmittedSkill(submission({ name, owner: 'replacement-owner', actor: { role: 'admin', user: 'review-admin' }, cnName: '更新后的运营查询', desc: '更新后的运营查询说明。', draft: draft(name) }))
  assert.equal(store.items[0].name, name)
  assert.equal(store.items.length, count)
  assert.equal(store.items.filter(item => item.name === name).length, 1)
  assert.equal(submitted, store.items[0])
  assert.equal(submitted.owner, before.owner)
  assert.equal(submitted.cnName, '更新后的运营查询')
  assert.equal(submitted.desc, '更新后的运营查询说明。')
  assert.equal(submitted.online, 'v1.0.0')
  assert.equal(submitted.onlineStatus, 'published')
  assert.equal(submitted.status, before.status)
  assert.equal(submitted.version, 'v1.0.1')
  assert.equal(submitted.editVersion, 'v1.0.1')
  assert.equal(submitted.editStatus, 'review')
  assert.equal(submitted.workflowStatus, 'review')
  assert.deepEqual(snapshot(submitted.capabilityUpdate), { ...before.capabilityUpdate, hasDraftEdits: true })
  assert.deepEqual(submitted.publishedContract, before.publishedContract)
})
