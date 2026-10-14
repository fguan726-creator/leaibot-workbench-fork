import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { createServer } from 'vite'
import { runScenarioSimulation } from '../src/domain/scenarioPackageTesting.js'
import { scenarioPmActor } from './helpers/scenarioActors.mjs'

import {
  createPinnedScenarioStep,
  createSeedScenarioPackages,
  evaluatePackageForPublish,
  evaluatePackageHealth,
  evaluateRuntimeAccess,
  publishScenarioPackage
} from '../src/domain/scenarioSkillPackages.js'

const previousStorage = globalThis.localStorage
globalThis.localStorage = { getItem() { return null }, setItem() {}, removeItem() {} }

const actor = (overrides = {}) => ({
  ...scenarioPmActor('pm-owner', ['skill-customer-query', 'skill-order-export', 'employee-certification-insight', 'workplace-segment-operations', 'enterprise-customer-followup']),
  ...overrides
})

const publishedSkill = (overrides = {}) => ({
  id: 'skill-customer-query',
  name: '客户查询',
  menu: '客户管理',
  version: '2.4.1',
  status: 'published',
  onlineStatus: 'published',
  online: '2.4.1',
  permissions: {
    menu: ['menu:customers'],
    skill: ['skill:customer-query'],
    data: ['data:customers:read'],
    action: ['action:customer-query:run']
  },
  ...overrides
})

const secondPublishedSkill = (overrides = {}) => publishedSkill({
  id: 'skill-order-export',
  name: '订单导出',
  menu: '订单管理',
  version: '3.0.0',
  online: '3.0.0',
  permissions: {
    menu: ['menu:orders'],
    skill: ['skill:order-export'],
    data: ['data:orders:read'],
    action: ['action:order-export:run']
  },
  ...overrides
})

const validDraft = (overrides = {}) => ({
  id: 'package-sales-service',
  name: '销售服务包',
  description: '串联客户查询与订单导出，完成销售服务闭环。',
  targetAudience: '企业销售运营',
  ownerId: 'pm-owner',
  steps: [
    createPinnedScenarioStep(publishedSkill(), { id: 'customer', required: true }),
    createPinnedScenarioStep(secondPublishedSkill(), {
      id: 'export',
      kind: 'conditional',
      condition: '用户需要导出订单时',
      required: false
    })
  ],
  ...overrides
})

const authoritativeCatalog = () => [publishedSkill(), secondPublishedSkill()]
const reviewer = () => ({ id: 'reviewer', permissions: ['scenario-package:review'] })
const pendingReview = draft => ({ ...draft, status: 'review', submittedBy: draft.ownerId, submittedAt: '2026-09-03T00:00:00.000Z', auditEvents: [{ type: 'submitted', actorId: draft.ownerId, at: '2026-09-03T00:00:00.000Z' }] })
function withTrial(draft, skills, actor) {
  const testRequest = {
    input: '使用手工样例检查当前场景链路。',
    expectedOutput: '各节点按既定链路传递手工样例。',
    activeOptionalStepIds: draft.steps.filter(step => step.kind === 'conditional').map(step => step.id),
    confirmedStepIds: draft.steps.filter(step => step.requiresConfirmation).map(step => step.id),
    approvedStepIds: draft.steps.filter(step => step.requiresApproval).map(step => step.id),
    sampleOutputs: Object.fromEntries(draft.steps.map(step => [step.id, `节点 ${step.id} 的手工模拟输出。`]))
  }
  return { ...draft, testRequest, testReport: runScenarioSimulation(draft, skills, testRequest, actor, '2026-09-09T10:00:00.000Z') }
}

function publishThroughReview(store, draft, creator) {
  store.submitDraft(withTrial(draft, store.selectableSkills, creator), creator)
  return store.approvePackage(draft.id, reviewer())
}

const packagePolicyPermissions = (draft = validDraft()) => [
  'scenario-package:create',
  'scenario-package:compose:cross-menu',
  ...draft.steps.flatMap(step => [
    `skill:${step.skillId}:metadata:read`,
    `skill:${step.skillId}:reference`
  ])
]

const runtimePackage = (overrides = {}) => ({
  ...validDraft(),
  status: 'published',
  auditEvents: [
    { type: 'approved', actorId: 'reviewer', at: '2026-09-04T00:00:00.000Z' },
    { type: 'published', actorId: 'reviewer', at: '2026-09-04T00:00:00.000Z' }
  ],
  ...overrides
})

const snapshot = (value) => JSON.parse(JSON.stringify(value))

let scenarioStoreModules
let scenarioStoreServer

async function loadScenarioStoreModules() {
  if (scenarioStoreModules) return scenarioStoreModules

  const server = await createServer({
    root: new URL('..', import.meta.url).pathname,
    logLevel: 'silent',
    server: { middlewareMode: true }
  })
  try {
    const [pinia, scenarioStore, skillHubStore] = await Promise.all([
      import('pinia'),
      server.ssrLoadModule('/src/stores/scenarioSkillPackages.ts'),
      server.ssrLoadModule('/src/stores/skillHub.ts')
    ])

    scenarioStoreServer = server
    scenarioStoreModules = { pinia, scenarioStore, skillHubStore }
    return scenarioStoreModules
  } catch (error) {
    await server.close()
    throw error
  }
}

after(async () => {
  await scenarioStoreServer?.close()
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
})

async function createScenarioStores() {
  const { pinia, scenarioStore, skillHubStore } = await loadScenarioStoreModules()
  pinia.setActivePinia(pinia.createPinia())
  return {
    scenario: scenarioStore.useScenarioSkillPackagesStore(),
    skillHub: skillHubStore.useSkillHubStore()
  }
}

function currentStoreDraft(scenario, overrides = {}) {
  const employee = scenario.selectableSkills.find(skill => skill.id === 'employee-certification-insight')
  const operations = scenario.selectableSkills.find(skill => skill.id === 'workplace-segment-operations')
  assert.ok(employee)
  assert.ok(operations)
  return validDraft({
    id: 'package-current-store-draft',
    steps: [
      createPinnedScenarioStep(employee, { id: 'employee', required: true }),
      createPinnedScenarioStep(operations, { id: 'operations', required: true })
    ],
    ...overrides
  })
}

test('rejects Skills that are not actually published online', () => {
  for (const skill of [
    publishedSkill({ onlineStatus: 'draft' }),
    publishedSkill({ onlineStatus: 'disabled' }),
    publishedSkill({ onlineStatus: 'unpublished' }),
    publishedSkill({ online: '未发布' })
  ]) {
    assert.throws(() => createPinnedScenarioStep(skill), /已发布/)
  }
})

test('snapshots a published Skill identity, menu, and exact version', () => {
  const step = createPinnedScenarioStep(publishedSkill(), { id: 'customer', required: true })

  assert.deepEqual(
    { skillId: step.skillId, menu: step.menu, pinnedVersion: step.pinnedVersion },
    { skillId: 'skill-customer-query', menu: '客户管理', pinnedVersion: '2.4.1' }
  )
})

test('pins the actual online version instead of an unpublished editing version', () => {
  const step = createPinnedScenarioStep(publishedSkill({ version: '2.5.0', online: '2.4.1' }))

  assert.equal(step.pinnedVersion, '2.4.1')
  assert.equal(step.currentPublishedVersion, '2.4.1')
})

test('constructor keeps step kind and required flag consistent', () => {
  const inferredConditional = createPinnedScenarioStep(secondPublishedSkill(), {
    required: false,
    condition: '需要导出时'
  })
  const explicitRequired = createPinnedScenarioStep(publishedSkill(), {
    kind: 'required',
    required: false
  })
  const explicitConditional = createPinnedScenarioStep(secondPublishedSkill(), {
    kind: 'conditional',
    required: true,
    condition: '需要导出时'
  })

  assert.deepEqual(
    [
      [inferredConditional.kind, inferredConditional.required],
      [explicitRequired.kind, explicitRequired.required],
      [explicitConditional.kind, explicitConditional.required]
    ],
    [
      ['conditional', false],
      ['required', true],
      ['conditional', false]
    ]
  )
})

test('domain seed pins version identifiers rather than display status text', () => {
  const [seed] = createSeedScenarioPackages()

  assert.deepEqual(seed.steps.map(step => step.pinnedVersion), ['1.0.0', '1.0.0'])
})

test('blocks packages with fewer than two Skills or fewer than two menus', () => {
  const oneStep = validDraft({ steps: [createPinnedScenarioStep(publishedSkill())] })
  const oneMenu = validDraft({
    steps: [
      createPinnedScenarioStep(publishedSkill()),
      createPinnedScenarioStep(secondPublishedSkill({ menu: '客户管理' }))
    ]
  })

  assert.equal(evaluatePackageForPublish(oneStep, actor()).ok, false)
  assert.equal(evaluatePackageForPublish(oneMenu, actor()).ok, false)
})

test('blocks a conditional step without a condition', () => {
  const draft = validDraft({
    steps: [
      createPinnedScenarioStep(publishedSkill(), { kind: 'conditional' }),
      createPinnedScenarioStep(secondPublishedSkill())
    ]
  })

  assert.match(evaluatePackageForPublish(draft, actor()).reasons.join(' '), /条件/)
})

test('blocks a package whose chain has no required core step', () => {
  const draft = validDraft({
    steps: [
      createPinnedScenarioStep(publishedSkill(), {
        id: 'customer', kind: 'conditional', condition: '需要查询客户时', required: false
      }),
      createPinnedScenarioStep(secondPublishedSkill(), {
        id: 'export', kind: 'conditional', condition: '需要导出订单时', required: false
      })
    ]
  })

  const result = evaluatePackageForPublish(draft, actor())

  assert.equal(result.ok, false)
  assert.match(result.reasons.join(' '), /至少需要一个必需步骤/)
})

test('blocks a creator without cross-menu composition permission', () => {
  const result = evaluatePackageForPublish(
    validDraft(),
    actor({ permissions: ['scenario-package:approve:self'] })
  )

  assert.equal(result.ok, false)
  assert.match(result.reasons.join(' '), /跨菜单/)
})

test('requires every machine permission needed to create and reference a package', () => {
  const draft = validDraft()
  const fullPermissions = packagePolicyPermissions(draft)
  const cases = [
    ['scenario-package:create', /创建技能包权限/],
    ['scenario-package:compose:cross-menu', /跨菜单编排权限/],
    ['skill:skill-customer-query:metadata:read', /元数据读取权限.*skill-customer-query/],
    ['skill:skill-order-export:reference', /引用权限.*skill-order-export/]
  ]

  for (const [missingPermission, expectedReason] of cases) {
    const result = evaluatePackageForPublish(
      draft,
      actor({ permissions: fullPermissions.filter(permission => permission !== missingPermission) })
    )
    assert.equal(result.ok, false, `${missingPermission} must be required`)
    assert.match(result.reasons.join(' '), expectedReason)
  }

  assert.equal(evaluatePackageForPublish(draft, actor({ permissions: fullPermissions })).ok, true)
})

test('structured action permissions cannot satisfy package publication policy', () => {
  const draft = validDraft()
  const result = evaluatePackageForPublish(
    draft,
    actor({
      permissions: {
        policy: [],
        menu: [],
        skill: [],
        data: [],
        action: packagePolicyPermissions(draft)
      }
    })
  )

  assert.equal(result.ok, false)
  assert.match(result.reasons.join(' '), /创建技能包权限/)
})

test('requires a non-empty actor and matching non-empty owner for submission', () => {
  for (const [draft, currentActor] of [
    [validDraft({ ownerId: '' }), actor()],
    [validDraft({ ownerId: '   ' }), actor()],
    [validDraft(), actor({ id: '' })],
    [validDraft(), actor({ id: 'other-owner' })],
    [validDraft({ ownerId: ' pm-owner ' }), actor({ id: 'pm-owner' })]
  ]) {
    const result = evaluatePackageForPublish(draft, currentActor)
    assert.equal(result.ok, false)
    assert.match(result.reasons.join(' '), /主责任人|所有者|账号/)
  }
})

test('rejects incomplete permission snapshots and contradictory step kinds', () => {
  const missingPermission = {
    ...createPinnedScenarioStep(publishedSkill(), { id: 'customer' }),
    permissions: { menu: ['menu:customers'], skill: [], data: ['data:customers:read'], action: ['action:customer-query:run'] }
  }
  const contradictory = {
    ...createPinnedScenarioStep(secondPublishedSkill(), { id: 'export' }),
    kind: 'conditional',
    required: true,
    condition: '需要导出时'
  }

  const result = evaluatePackageForPublish(
    validDraft({ steps: [missingPermission, contradictory] }),
    actor()
  )

  assert.equal(result.ok, false)
  assert.match(result.reasons.join(' '), /权限快照/)
  assert.match(result.reasons.join(' '), /步骤类型.*必需属性|kind.*required/i)
})

test('allows owner submission but never self-approval after automated gates pass', () => {
  const noGatePass = evaluatePackageForPublish(
    validDraft({ steps: [createPinnedScenarioStep(publishedSkill())] }),
    actor()
  )
  const allGatesPass = evaluatePackageForPublish(validDraft(), actor())

  assert.equal(noGatePass.canSelfApprove, false)
  assert.equal(allGatesPass.ok, true)
  assert.equal(allGatesPass.canSelfApprove, false)
})

test('publishing creates distinct approved and published audit events', () => {
  const published = publishScenarioPackage(
    pendingReview(withTrial(validDraft(), authoritativeCatalog(), actor())),
    reviewer(),
    '2026-09-04T00:00:00.000Z',
    authoritativeCatalog()
  )

  assert.deepEqual(
    published.auditEvents.map((event) => event.type),
    ['submitted', 'approved', 'published']
  )
  assert.equal(published.status, 'published')
})

test('publication rebuilds step identity and permissions from the authoritative catalog', () => {
  const draft = validDraft({
    steps: validDraft().steps.map((step, index) => ({
      ...step,
      name: `伪造名称-${index}`,
      menu: `伪造菜单-${index}`,
      currentPublishedVersion: '999.0.0',
      permissions: {
        menu: ['menu:forged'],
        skill: ['skill:forged'],
        data: ['data:forged'],
        action: ['action:forged']
      }
    }))
  })

  const published = publishScenarioPackage(
    pendingReview(withTrial(draft, authoritativeCatalog(), actor())),
    reviewer(),
    '2026-09-04T00:00:00.000Z',
    authoritativeCatalog()
  )

  assert.deepEqual(
    published.steps.map(step => ({
      skillId: step.skillId,
      name: step.name,
      menu: step.menu,
      currentPublishedVersion: step.currentPublishedVersion,
      permissions: step.permissions
    })),
    [
      {
        skillId: 'skill-customer-query',
        name: '客户查询',
        menu: '客户管理',
        currentPublishedVersion: '2.4.1',
        permissions: publishedSkill().permissions
      },
      {
        skillId: 'skill-order-export',
        name: '订单导出',
        menu: '订单管理',
        currentPublishedVersion: '3.0.0',
        permissions: secondPublishedSkill().permissions
      }
    ]
  )
})

test('publication blocks a stale pinned version instead of silently replacing it', () => {
  const staleDraft = validDraft({
    steps: validDraft().steps.map((step, index) => index === 0
      ? { ...step, pinnedVersion: '2.3.0' }
      : step)
  })

  assert.throws(
    () => publishScenarioPackage(pendingReview(staleDraft), reviewer(), '2026-09-04T00:00:00.000Z', authoritativeCatalog()),
    /固定版本.*当前线上版本.*重新选择|版本.*重新评估/
  )
})

test('publication rejects an authoritative Skill with any empty permission bucket', () => {
  const catalog = authoritativeCatalog()
  catalog[0] = {
    ...catalog[0],
    permissions: { ...catalog[0].permissions, action: [] }
  }

  assert.throws(
    () => publishScenarioPackage(pendingReview(validDraft()), reviewer(), '2026-09-04T00:00:00.000Z', catalog),
    /权限快照/
  )
})

test('keeps a pinned version while reporting an explicitly available newer version', () => {
  const step = createPinnedScenarioStep(publishedSkill(), {
    currentPublishedVersion: '2.5.0',
    dependencyState: 'update_available'
  })
  const health = evaluatePackageHealth([step])

  assert.equal(health.status, 'upgrade_required')
  assert.equal(step.pinnedVersion, '2.4.1')
})

test('does not claim an upgrade from a version mismatch without an availability signal', () => {
  const health = evaluatePackageHealth([
    createPinnedScenarioStep(publishedSkill(), { currentPublishedVersion: '2.5.0' })
  ])

  assert.equal(health.status, 'healthy')
})

test('pauses a package when a required dependency expires', () => {
  const health = evaluatePackageHealth([
    createPinnedScenarioStep(publishedSkill(), { dependencyState: 'expired', required: true })
  ])

  assert.equal(health.status, 'paused')
})

test('pauses for an optional expired dependency with a readable explanation', () => {
  const health = evaluatePackageHealth([
    createPinnedScenarioStep(publishedSkill(), { required: true }),
    createPinnedScenarioStep(secondPublishedSkill(), {
      id: 'optional-export',
      dependencyState: 'expired',
      required: false
    })
  ])

  assert.equal(health.status, 'paused')
  assert.deepEqual(health.blockedStepIds, ['optional-export'])
  assert.match(health.explanations.join(' '), /可选分支.*订单导出.*过期/)
})

test('blocks before execution when a caller misses a required permission', () => {
  const packageItem = runtimePackage()
  const runtime = evaluateRuntimeAccess(
    packageItem,
    { permissions: { policy: ['scenario-package:package-sales-service:use'], menu: [], skill: [], data: [], action: [] } },
    [],
    ['skill-customer-query']
  )

  assert.equal(runtime.status, 'blocked')
  assert.deepEqual(runtime.effectiveSteps, [])
  assert.ok(runtime.missingPermissions.length > 0)
})

test('blocks the whole run when an active optional branch lacks permission', () => {
  const packageItem = runtimePackage()
  const runtime = evaluateRuntimeAccess(
    packageItem,
    {
      permissions: {
        policy: ['scenario-package:package-sales-service:use'],
        menu: ['menu:customers'],
        skill: ['skill:customer-query'],
        data: ['data:customers:read'],
        action: ['action:customer-query:run']
      }
    },
    ['export'],
    ['skill-customer-query', 'skill-order-export']
  )

  assert.equal(runtime.status, 'blocked')
  assert.deepEqual(runtime.effectiveSteps, [])
  assert.deepEqual(runtime.skippedSteps.map((step) => step.id), ['customer', 'export'])
  assert.match(runtime.explanations.join(' '), /可选分支.*订单导出.*权限/)
})

test('rejects runtime Skill IDs that are not declared in the package', () => {
  assert.throws(
    () => evaluateRuntimeAccess(runtimePackage(), { permissions: ['*'] }, [], ['skill-not-declared']),
    /未声明/
  )
})

test('runtime accepts only published packages with independent approval and publication evidence', () => {
  const caller = { permissions: ['*'] }
  const cases = [
    [runtimePackage({ status: 'draft' }), /未发布/],
    [runtimePackage({ auditEvents: [{ type: 'published', actorId: 'reviewer', at: '2026-09-04T00:00:00.000Z' }] }), /审批.*审计/],
    [runtimePackage({ auditEvents: [{ type: 'approved', actorId: 'reviewer', at: '2026-09-04T00:00:00.000Z' }] }), /发布.*审计/],
    [runtimePackage({ auditEvents: [
      { type: 'approved', actorId: '', at: '2026-09-04T00:00:00.000Z' },
      { type: 'published', actorId: 'reviewer', at: '2026-09-04T00:00:00.000Z' }
    ] }), /审批.*审计/]
  ]

  for (const [packageItem, reason] of cases) {
    const runtime = evaluateRuntimeAccess(packageItem, caller, [], ['skill-customer-query'])
    assert.equal(runtime.status, 'blocked')
    assert.deepEqual(runtime.effectiveSteps, [])
    assert.match(runtime.explanations.join(' '), reason)
  }
})

test('runtime requires the exact package use permission before step permissions', () => {
  const packageItem = runtimePackage()
  const wrongPackagePermission = {
    permissions: ['scenario-package:another-package:use']
  }

  const runtime = evaluateRuntimeAccess(
    packageItem,
    wrongPackagePermission,
    [],
    ['skill-customer-query']
  )

  assert.equal(runtime.status, 'blocked')
  assert.equal(runtime.missingPackagePermission, 'scenario-package:package-sales-service:use')
  assert.match(runtime.explanations.join(' '), /技能包使用权限/)
})

test('structured action permissions cannot satisfy exact package use policy', () => {
  const packageItem = runtimePackage()
  const packageUsePermission = `scenario-package:${packageItem.id}:use`
  const runtime = evaluateRuntimeAccess(
    packageItem,
    {
      permissions: {
        policy: [],
        menu: ['*'],
        skill: ['*'],
        data: ['*'],
        action: ['*', packageUsePermission]
      }
    },
    [],
    ['skill-customer-query']
  )

  assert.equal(runtime.status, 'blocked')
  assert.equal(runtime.missingPackagePermission, packageUsePermission)
})

test('runtime blocks a required step until its confirmation and approval evidence is present', () => {
  const step = createPinnedScenarioStep(publishedSkill(), {
    id: 'customer',
    required: true,
    requiresConfirmation: true,
    requiresApproval: true
  })
  const packageItem = runtimePackage({ steps: [step] })

  const missing = evaluateRuntimeAccess(packageItem, { permissions: ['*'] }, [], [step.skillId])
  const confirmedOnly = evaluateRuntimeAccess(
    packageItem,
    { permissions: ['*'] },
    [],
    [step.skillId],
    { confirmedStepIds: [step.id] }
  )
  const complete = evaluateRuntimeAccess(
    packageItem,
    { permissions: ['*'] },
    [],
    [step.skillId],
    { confirmedStepIds: [step.id], approvedStepIds: [step.id] }
  )

  assert.equal(missing.status, 'blocked')
  assert.deepEqual(missing.missingEvidence.map(item => item.type).sort(), ['approval', 'confirmation'])
  assert.equal(confirmedOnly.status, 'blocked')
  assert.deepEqual(confirmedOnly.missingEvidence.map(item => item.type), ['approval'])
  assert.equal(complete.status, 'ready')
})

test('runtime blocks an active optional step missing evidence but ignores an inactive branch', () => {
  const required = createPinnedScenarioStep(publishedSkill(), { id: 'customer', required: true })
  const optional = createPinnedScenarioStep(secondPublishedSkill(), {
    id: 'export',
    kind: 'conditional',
    condition: '用户需要导出时',
    requiresApproval: true
  })
  const packageItem = runtimePackage({ steps: [required, optional] })

  const inactive = evaluateRuntimeAccess(
    packageItem,
    { permissions: ['*'] },
    [],
    [required.skillId]
  )
  const active = evaluateRuntimeAccess(
    packageItem,
    { permissions: ['*'] },
    [optional.id],
    [required.skillId, optional.skillId]
  )

  assert.equal(inactive.status, 'ready')
  assert.deepEqual(inactive.missingEvidence, [])
  assert.equal(active.status, 'blocked')
  assert.deepEqual(active.effectiveSteps, [])
  assert.deepEqual(active.skippedSteps.map(step => step.id), ['customer', 'export'])
  assert.deepEqual(active.missingEvidence, [{ stepId: 'export', type: 'approval' }])
  assert.match(active.explanations.join(' '), /可选分支.*审批证据.*阻断/)
})

test('does not let map permissions satisfy a different permission bucket', () => {
  const runtime = evaluateRuntimeAccess(
    runtimePackage(),
    {
      permissions: {
        policy: ['scenario-package:package-sales-service:use'],
        action: [
          'menu:customers',
          'skill:customer-query',
          'data:customers:read',
          'action:customer-query:run'
        ]
      }
    },
    [],
    ['skill-customer-query']
  )

  assert.equal(runtime.status, 'blocked')
  assert.deepEqual(
    runtime.missingPermissions.map(({ bucket }) => bucket).sort(),
    ['data', 'menu', 'skill']
  )
})

test('blocks duplicate Skills even when duplicate rows span two menus', () => {
  const duplicateSkill = createPinnedScenarioStep(
    publishedSkill({ menu: '订单管理' }),
    { id: 'duplicate-customer' }
  )
  const result = evaluatePackageForPublish(validDraft({
    steps: [createPinnedScenarioStep(publishedSkill(), { id: 'customer' }), duplicateSkill]
  }), actor())

  assert.equal(result.ok, false)
  assert.match(result.reasons.join(' '), /不同的 Skills/)
})

test('blocks duplicate stable step IDs', () => {
  const result = evaluatePackageForPublish(validDraft({
    steps: [
      createPinnedScenarioStep(publishedSkill(), { id: 'same-step' }),
      createPinnedScenarioStep(secondPublishedSkill(), { id: 'same-step' })
    ]
  }), actor())

  assert.equal(result.ok, false)
  assert.match(result.reasons.join(' '), /步骤 ID/)
})

test('blocks missing pinned or published version snapshots', () => {
  for (const step of [
    { ...createPinnedScenarioStep(publishedSkill()), pinnedVersion: '' },
    { ...createPinnedScenarioStep(secondPublishedSkill()), currentPublishedVersion: '' }
  ]) {
    const other = step.skillId === 'skill-customer-query'
      ? createPinnedScenarioStep(secondPublishedSkill())
      : createPinnedScenarioStep(publishedSkill())
    const result = evaluatePackageForPublish(validDraft({ steps: [step, other] }), actor())
    assert.equal(result.ok, false)
    assert.match(result.reasons.join(' '), /版本快照/)
  }
})

test('blocks publication when a required dependency has expired', () => {
  const draft = validDraft({
    steps: [
      createPinnedScenarioStep(publishedSkill(), { dependencyState: 'expired', required: true }),
      createPinnedScenarioStep(secondPublishedSkill(), {
        kind: 'conditional', condition: '需要导出时', required: false
      })
    ]
  })

  assert.throws(
    () => publishScenarioPackage(pendingReview(draft), reviewer(), '2026-09-04T00:00:00.000Z', authoritativeCatalog()),
    /暂停/
  )
})

test('blocks runtime before execution when a required dependency has expired', () => {
  const runtime = evaluateRuntimeAccess(runtimePackage({
    steps: [
      createPinnedScenarioStep(publishedSkill(), { dependencyState: 'expired', required: true }),
      createPinnedScenarioStep(secondPublishedSkill(), { required: false })
    ]
  }), { permissions: ['*'] }, [], ['skill-customer-query'])

  assert.equal(runtime.status, 'blocked')
  assert.deepEqual(runtime.effectiveSteps, [])
  assert.match(runtime.explanations.join(' '), /暂停/)
})

test('blocks an unavailable optional dependency at runtime with a pause explanation', () => {
  const runtime = evaluateRuntimeAccess(runtimePackage({
    steps: [
      createPinnedScenarioStep(publishedSkill(), { id: 'customer', required: true }),
      createPinnedScenarioStep(secondPublishedSkill(), {
        id: 'export', dependencyState: 'expired', required: false
      })
    ]
  }), { permissions: ['*'] }, ['export'], ['skill-customer-query', 'skill-order-export'])

  assert.equal(runtime.status, 'blocked')
  assert.deepEqual(runtime.effectiveSteps, [])
  assert.deepEqual(runtime.skippedSteps.map((step) => step.id), ['customer', 'export'])
  assert.match(runtime.explanations.join(' '), /可选分支.*订单导出.*过期/)
})

test('pauses and blocks a required emergency-disabled dependency', () => {
  const step = createPinnedScenarioStep(publishedSkill(), {
    dependencyState: 'emergency_disabled', required: true
  })
  const health = evaluatePackageHealth([step])
  const runtime = evaluateRuntimeAccess(runtimePackage({ steps: [step] }), { permissions: ['*'] }, [], [step.skillId])

  assert.equal(health.status, 'paused')
  assert.equal(runtime.status, 'blocked')
})

test('pauses and blocks an optional emergency-disabled dependency', () => {
  const required = createPinnedScenarioStep(publishedSkill(), { required: true })
  const optional = createPinnedScenarioStep(secondPublishedSkill(), {
    id: 'export', dependencyState: 'emergency_disabled', required: false
  })
  const health = evaluatePackageHealth([required, optional])
  const runtime = evaluateRuntimeAccess(
    runtimePackage({ steps: [required, optional] }),
    { permissions: ['*'] },
    ['export'],
    [required.skillId, optional.skillId]
  )

  assert.equal(health.status, 'paused')
  assert.equal(runtime.status, 'blocked')
  assert.deepEqual(runtime.effectiveSteps, [])
  assert.deepEqual(runtime.skippedSteps.map((step) => step.id), [required.id, 'export'])
})

test('catalog offers only Skills that are actually published online', async () => {
  const { scenario } = await createScenarioStores()
  const listed = scenario.selectableSkills

  assert.deepEqual(
    listed
      .filter((skill) => [
        'employee-certification-insight',
        'workplace-segment-operations',
        'enterprise-customer-followup'
      ].includes(skill.id))
      .map((skill) => ({ id: skill.id, name: skill.name, menu: skill.menu })),
    [
      { id: 'employee-certification-insight', name: '职场认证状态查询', menu: '在职员工管理' },
      { id: 'workplace-segment-operations', name: '职场人群经营分析', menu: '乐享运营' },
      { id: 'enterprise-customer-followup', name: '企业客户跟进建议', menu: '企业客户管理' }
    ]
  )
  assert.equal(listed.some((skill) => skill.id === 'capability-draft-demo'), false)
  assert.equal(listed.some((skill) => skill.id === 'low-stock-auto-offline'), false)
  assert.equal(listed.some((skill) => skill.id === 'weather-query'), false)
})

test('catalog includes online Skills from any first-level menu and pins their online version', async () => {
  const { scenario, skillHub } = await createScenarioStores()
  skillHub.items.push({
    name: 'private-custom-top-ranking',
    cnName: '私定 TOP 榜单',
    platform: 'lexiang',
    desc: '用户针对私定官方喷绘中 TOP 甄选榜进行图片或顺序调整。',
    version: 'v1.3.0',
    editVersion: 'v1.3.0',
    workflowStatus: 'draft',
    onlineStatus: 'published',
    online: 'v1.2.0',
    status: 'draft',
    statusText: '草稿',
    category: '私人订制',
    tags: ['榜单'],
    owner: 'admin',
    updated: '2026-09-05 09:00'
  })

  const listed = scenario.selectableSkills.find(skill => skill.id === 'private-custom-top-ranking')

  assert.deepEqual(
    { menu: listed?.menu, version: listed?.version, online: listed?.online },
    { menu: '私人订制', version: 'v1.2.0', online: 'v1.2.0' }
  )
})

test('seed package keeps the required cross-menu core chain and conditional branch', async () => {
  const { scenario } = await createScenarioStores()
  const seed = scenario.findPackage('seed-workplace-certification-operations')

  assert.equal(seed?.name, '职场人群认证经营管理')
  assert.deepEqual(
    seed?.steps.map((step) => ({ id: step.skillId, kind: step.kind, required: step.required })),
    [
      { id: 'employee-certification-insight', kind: 'required', required: true },
      { id: 'workplace-segment-operations', kind: 'required', required: true },
      { id: 'enterprise-customer-followup', kind: 'conditional', required: false }
    ]
  )
  assert.match(seed?.steps[2].condition || '', /企业客户/)
})

test('seed preserves an older valid dependency and reports that upgrade is required', async () => {
  const { scenario } = await createScenarioStores()
  const seed = scenario.findPackage('seed-workplace-certification-operations')
  const segmentStep = seed?.steps.find((step) => step.skillId === 'workplace-segment-operations')

  assert.deepEqual(
    {
      pinnedVersion: segmentStep?.pinnedVersion,
      currentPublishedVersion: segmentStep?.currentPublishedVersion,
      dependencyState: segmentStep?.dependencyState,
      health: seed?.health.status
    },
    {
      pinnedVersion: 'v1.1.0',
      currentPublishedVersion: 'v1.2.0',
      dependencyState: 'update_available',
      health: 'upgrade_required'
    }
  )
})

test('seed package is a published auditable demo with an explicit package version and update time', async () => {
  const { scenario } = await createScenarioStores()
  const seed = scenario.findPackage('seed-workplace-certification-operations')

  assert.deepEqual(
    {
      status: seed?.status,
      version: seed?.version,
      updatedAt: seed?.updatedAt,
      auditTypes: seed?.auditEvents?.map((event) => event.type)
    },
    {
      status: 'published',
      version: 'v1.0.0',
      updatedAt: '2026-09-04T09:30:00.000Z',
      auditTypes: ['submitted', 'approved', 'published']
    }
  )
})

test('publication adds the initial package version and uses the write time as updated time', () => {
  const published = publishScenarioPackage(
    pendingReview(withTrial(validDraft(), authoritativeCatalog(), actor())),
    reviewer(),
    '2026-09-04T00:00:00.000Z',
    authoritativeCatalog()
  )

  assert.equal(published.version, 'v1.0.0')
  assert.equal(published.updatedAt, '2026-09-04T00:00:00.000Z')
})

test('publishing prepends an immutable package without duplicate IDs', async () => {
  const { scenario } = await createScenarioStores()
  const seed = scenario.findPackage('seed-workplace-certification-operations')
  const seedSnapshot = snapshot(seed)
  const draft = currentStoreDraft(scenario, {
    id: 'package-workplace-followup-v2',
    name: '职场人群认证经营管理（新版）'
  })
  const draftBefore = snapshot(draft)

  const published = publishThroughReview(scenario, draft, actor())

  assert.equal(published.id, 'package-workplace-followup-v2')
  assert.equal(scenario.packages[0].id, 'package-workplace-followup-v2')
  assert.equal(scenario.packages.filter((item) => item.id === published.id).length, 1)
  assert.deepEqual(snapshot(scenario.findPackage('seed-workplace-certification-operations')), seedSnapshot)
  assert.deepEqual(snapshot(draft), draftBefore)
})

test('store publication preserves every scene-definition field', async () => {
  const { scenario } = await createScenarioStores()
  const draft = currentStoreDraft(scenario, {
    id: 'package-scene-fields',
    name: '认证经营服务包',
    description: '串联认证洞察与经营分析。',
    targetAudience: '认证运营人员'
  })

  const published = publishThroughReview(scenario, draft, actor())

  assert.deepEqual(
    {
      description: published.description,
      targetAudience: published.targetAudience
    },
    {
      description: '串联认证洞察与经营分析。',
      targetAudience: '认证运营人员'
    }
  )
})

test('store blocks every empty or whitespace-only required scene field without mutation', async () => {
  const { scenario } = await createScenarioStores()
  const validStoreDraft = currentStoreDraft(scenario)
  const packageIdsBefore = scenario.packages.map(item => item.id)
  const requiredFields = [
    ['name', '技能包名称'],
    ['description', '场景描述'],
    ['targetAudience', '目标人群']
  ]

  for (const [field, label] of requiredFields) {
    for (const [variant, invalidValue] of [['empty', ''], ['whitespace', ' \t ']]) {
      const draft = {
        ...snapshot(validStoreDraft),
        id: `package-invalid-${field}-${variant}`,
        [field]: invalidValue
      }
      const evaluation = scenario.evaluateDraft(draft, actor())
      const expectedReason = new RegExp(`请填写${label}`)

      assert.equal(evaluation.ok, false, `${field}=${JSON.stringify(invalidValue)} must fail evaluation`)
      assert.match(evaluation.reasons.join(' '), expectedReason)
      assert.throws(() => publishThroughReview(scenario, draft, actor()), expectedReason)
      assert.deepEqual(scenario.packages.map(item => item.id), packageIdsBefore)
    }
  }
})

test('store blocks a stale selected Skill that is disabled before publication without mutation', async () => {
  const { scenario, skillHub } = await createScenarioStores()
  const draft = currentStoreDraft(scenario, { id: 'package-disabled-after-selection' })
  const packageIdsBefore = scenario.packages.map(item => item.id)
  const disabledSkill = skillHub.items.find(item => item.name === 'employee-certification-insight')
  assert.ok(disabledSkill)

  skillHub.updateStatus(disabledSkill, 'disabled')

  assert.equal(scenario.selectableSkills.some(item => item.id === disabledSkill.name), false)
  assert.throws(() => publishThroughReview(scenario, draft, actor()), /不再发布|已禁用/)
  assert.deepEqual(scenario.packages.map(item => item.id), packageIdsBefore)
})

test('store blocks a draft when its pinned version no longer matches the online version', async () => {
  const { scenario, skillHub } = await createScenarioStores()
  const draft = currentStoreDraft(scenario, { id: 'package-version-refresh' })
  const packageIdsBefore = scenario.packages.map(item => item.id)
  const selectedStep = draft.steps.find(step => step.skillId === 'employee-certification-insight')
  const liveSkill = skillHub.items.find(item => item.name === selectedStep.skillId)
  assert.ok(liveSkill)
  assert.equal(selectedStep.pinnedVersion, 'v1.0.0')

  liveSkill.version = 'v1.1.0'
  liveSkill.online = 'v1.1.0'

  const evaluation = scenario.evaluateDraft(draft, actor())

  assert.equal(evaluation.ok, false)
  assert.match(evaluation.reasons.join(' '), /固定版本.*当前线上版本.*重新选择|版本.*重新评估/)
  assert.throws(() => publishThroughReview(scenario, draft, actor()), /重新选择|重新评估/)
  assert.equal(draft.steps.find(step => step.skillId === selectedStep.skillId).pinnedVersion, 'v1.0.0')
  assert.deepEqual(scenario.packages.map(item => item.id), packageIdsBefore)
})

test('store publication rebuilds mutable step fields from its live catalog', async () => {
  const { scenario } = await createScenarioStores()
  const draft = currentStoreDraft(scenario, {
    id: 'package-authoritative-write',
    steps: currentStoreDraft(scenario).steps.map(step => ({
      ...step,
      name: '伪造名称',
      menu: '伪造菜单',
      currentPublishedVersion: 'v999.0.0',
      permissions: {
        menu: ['menu:forged'],
        skill: ['skill:forged'],
        data: ['data:forged'],
        action: ['action:forged']
      }
    }))
  })

  const published = publishThroughReview(scenario, draft, actor())
  const employee = published.steps.find(step => step.skillId === 'employee-certification-insight')

  assert.deepEqual(
    {
      name: employee?.name,
      menu: employee?.menu,
      currentPublishedVersion: employee?.currentPublishedVersion,
      permissions: employee?.permissions
    },
    {
      name: '职场认证状态查询',
      menu: '在职员工管理',
      currentPublishedVersion: 'v1.0.0',
      permissions: {
        menu: ['menu:employee-management'],
        skill: ['skill:employee-certification-insight'],
        data: ['data:employee-certification:read'],
        action: ['action:employee-certification-insight:run']
      }
    }
  )
})

test('published package health and store runtime refresh from current Skill Hub state', async () => {
  const { scenario, skillHub } = await createScenarioStores()
  const seedBefore = scenario.findPackage('seed-workplace-certification-operations')
  const requiredSkill = skillHub.items.find(item => item.name === 'employee-certification-insight')
  assert.ok(seedBefore)
  assert.ok(requiredSkill)

  skillHub.updateStatus(requiredSkill, 'disabled')

  const refreshed = scenario.findPackage(seedBefore.id)
  const runtime = scenario.evaluateRuntimeAccess(seedBefore.id, { permissions: ['*'] }, [], [requiredSkill.name])
  assert.equal(refreshed?.health.status, 'paused')
  assert.equal(runtime.status, 'blocked')
  assert.match(runtime.explanations.join(' '), /暂停/)
})

test('published package pauses for an unavailable optional dependency and only flags online upgrades', async () => {
  const { scenario, skillHub } = await createScenarioStores()
  const optionalSkill = skillHub.items.find(item => item.name === 'enterprise-customer-followup')
  const upgradedSkill = skillHub.items.find(item => item.name === 'employee-certification-insight')
  assert.ok(optionalSkill)
  assert.ok(upgradedSkill)

  skillHub.updateStatus(optionalSkill, 'disabled')
  let refreshed = scenario.findPackage('seed-workplace-certification-operations')
  assert.equal(refreshed?.health.status, 'paused')

  skillHub.resetToInitialMock()
  const liveUpgrade = skillHub.items.find(item => item.name === 'employee-certification-insight')
  assert.ok(liveUpgrade)
  liveUpgrade.version = 'v1.1.0'
  liveUpgrade.online = 'v1.1.0'
  refreshed = scenario.findPackage('seed-workplace-certification-operations')
  const refreshedStep = refreshed?.steps.find(step => step.skillId === liveUpgrade.name)

  assert.equal(refreshed?.health.status, 'upgrade_required')
  assert.equal(refreshedStep?.pinnedVersion, 'v1.0.0')
  assert.equal(refreshedStep?.currentPublishedVersion, 'v1.1.0')
  assert.equal(refreshedStep?.dependencyState, 'update_available')
})

test('published package refresh preserves its pinned metadata and permission snapshot', async () => {
  const { scenario, skillHub } = await createScenarioStores()
  const before = scenario.findPackage('seed-workplace-certification-operations')
  const beforeStep = before?.steps.find(step => step.skillId === 'employee-certification-insight')
  const liveSkill = skillHub.items.find(item => item.name === 'employee-certification-insight')
  assert.ok(beforeStep)
  assert.ok(liveSkill)

  liveSkill.cnName = '线上目录新名称'
  liveSkill.category = '线上目录新菜单'
  liveSkill.permissions = {
    menu: ['menu:new'],
    skill: ['skill:new'],
    data: ['data:new'],
    action: ['action:new']
  }

  const afterStep = scenario.findPackage(before.id)?.steps.find(step => step.skillId === liveSkill.name)

  assert.deepEqual(
    { name: afterStep?.name, menu: afterStep?.menu, permissions: afterStep?.permissions },
    { name: beforeStep.name, menu: beforeStep.menu, permissions: beforeStep.permissions }
  )
})

test('store read APIs return isolated package snapshots', async () => {
  const { scenario } = await createScenarioStores()
  const firstRead = scenario.findPackage('seed-workplace-certification-operations')
  assert.ok(firstRead)
  firstRead.steps[0].name = '被外部篡改'
  firstRead.steps[0].permissions.menu.push('menu:forged')

  const secondRead = scenario.findPackage(firstRead.id)

  assert.notEqual(secondRead?.steps[0].name, '被外部篡改')
  assert.equal(secondRead?.steps[0].permissions.menu.includes('menu:forged'), false)
})

test('reset restores fresh isolated scenario package seed objects', async () => {
  const { scenario } = await createScenarioStores()
  const original = scenario.findPackage('seed-workplace-certification-operations')
  const originalSnapshot = snapshot(original)
  scenario.packages[0].steps[0].permissions.menu.push('menu:mutated-only-in-test')

  scenario.resetToInitialMock()
  const reset = scenario.findPackage('seed-workplace-certification-operations')

  assert.deepEqual(snapshot(reset), originalSnapshot)
  assert.notEqual(reset, original)
  assert.notEqual(reset.steps, original?.steps)
  assert.notEqual(reset.steps[0].permissions, original?.steps[0].permissions)
})
