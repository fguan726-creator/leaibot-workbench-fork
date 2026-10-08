import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const page = {
  pageId: 'points.activity', label: '企业购活动积分配置', route: '/points/activity',
  pageType: 'T7', components: ['C1', 'C2', 'C3', 'C8', 'C9'],
  implementation: 'O1', visualStatus: 'VA-0',
  remainingStates: ['本次响应式、C9 状态和键盘验收待完成；真实后端未接入'],
}
const detailsPage = {
  ...page,
  pageId: 'points.activityDetails', label: '活动积分明细', route: '/points/activity-details',
  pageType: 'T2',
  remainingStates: ['本次统计查询和响应式交互验收待完成；真实订单及积分数据未接入'],
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'design-page-extensions-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const app = join(root, 'vue-app')
  const skill = join(root, 'skill/portal-workbench-ui-0914')
  mkdirSync(join(app, 'scripts'), { recursive: true })
  for (const file of ['design-baseline.lock.json', 'design-skill.guard.json', 'scripts/verify-design-skill.mjs', 'scripts/design-page-extensions.mjs']) {
    if (existsSync(join(appRoot, file))) cpSync(join(appRoot, file), join(app, file))
  }
  cpSync(join(appRoot, 'src'), join(app, 'src'), { recursive: true })
  cpSync(join(appRoot, '../skill/portal-workbench-ui-0914'), skill, { recursive: true })
  register({ app }, [page])
  const env = { ...process.env }
  delete env.PORTAL_WORKBENCH_UI_SKILL_DIR
  delete env.PORTAL_WORKBENCH_PROJECT_DIR
  return { root, app, skill, env }
}

function run(f, args = []) {
  const result = spawnSync(process.execPath, [join(f.app, 'scripts/verify-design-skill.mjs'), ...args], {
    cwd: f.app, env: f.env, encoding: 'utf8', timeout: 20000,
  })
  assert.ifError(result.error)
  return { ...result, output: result.stdout + result.stderr }
}

function register(f, pages) {
  writeFileSync(join(f.app, 'design-page-extensions.json'), JSON.stringify({ schemaVersion: 1, pages: [...pages, detailsPage] }))
}

function treeHashes(root) {
  const result = {}
  function walk(dir, prefix = '') {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const name = prefix + entry.name
      if (entry.isDirectory()) walk(join(dir, entry.name), name + '/')
      else result[name] = createHash('sha256').update(readFileSync(join(dir, entry.name))).digest('hex')
    }
  }
  walk(root)
  return result
}

test('registered native page passes the complete original checker without changing the distributed Skill', t => {
  const f = fixture(t)
  const before = treeHashes(f.skill)
  const result = run(f)
  assert.equal(result.status, 0, result.output)
  assert.match(result.output, /metadata, assets, templates, matrix and evidence are internally consistent/)
  assert.match(result.output, /points.activity.*VA-0/)
  assert.deepEqual(treeHashes(f.skill), before)
})

test('missing registration continues to block the new source route', t => {
  const f = fixture(t)
  rmSync(join(f.app, 'design-page-extensions.json'))
  const result = run(f)
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, /未登记.*points.activity|points.activity.*未登记/)
})

test('duplicate extension route or pageId cannot hide behind a Map overwrite', t => {
  const f = fixture(t)
  for (const second of [{ ...page }, { ...page, route: '/points/duplicate' }, { ...page, pageId: 'points.duplicate' }]) {
    register(f, [page, second])
    const result = run(f)
    assert.notEqual(result.status, 0, result.output)
    assert.match(result.output, /重复/)
  }
})

test('an extension cannot replace an existing pageId or route', t => {
  const f = fixture(t)
  for (const override of [{ ...page, route: '/portal/home' }, { ...page, pageId: 'portal.home' }]) {
    register(f, [override])
    const result = run(f)
    assert.notEqual(result.status, 0, result.output)
    assert.match(result.output, /已登记/)
  }
})

test('new page registration does not manufacture visual acceptance or omit C9', t => {
  const f = fixture(t)
  for (const invalid of [{ ...page, visualStatus: 'VA-PASS' }, { ...page, components: ['C1'] }, { ...page, pageType: 'T1 + T7' }]) {
    register(f, [invalid])
    const result = run(f)
    assert.notEqual(result.status, 0, result.output)
    assert.match(result.output, /Design Skill Error/)
  }
})

test('unknown executable fields and malformed extension JSON fail explicitly', t => {
  const f = fixture(t)
  register(f, [{ ...page, checker: '/external/check.mjs' }])
  assert.match(run(f).output, /不支持.*checker/)
  writeFileSync(join(f.app, 'design-page-extensions.json'), '{')
  const result = run(f)
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, /Design Skill Error/)
})

test('original route equality and source duplicate checks still run after applying extensions', t => {
  const f = fixture(t)
  register(f, [page, { ...page, pageId: 'points.ghost', route: '/points/ghost' }])
  const ghost = run(f)
  assert.notEqual(ghost.status, 0, ghost.output)
  assert.match(ghost.output, /项目不存在的 route.*points.ghost/)
  register(f, [page])
  const router = join(f.app, 'src/router/index.ts')
  writeFileSync(router, readFileSync(router, 'utf8') + "\nconst duplicateFixture = { path: 'points/activity', meta: { pageId: 'points.activity' } }\n")
  const duplicate = run(f)
  assert.notEqual(duplicate.status, 0, duplicate.output)
  assert.match(duplicate.output, /项目 route 重复/)
})

test('incremental style violations remain blocking for the new registered route', t => {
  const f = fixture(t)
  writeFileSync(join(f.app, 'src/views/ExtensionBadStyle.vue'), '<style scoped>.bad { color: #123456; }</style>')
  const result = run(f, ['--changed-file', 'src/views/ExtensionBadStyle.vue'])
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, /硬编码颜色/)
})

test('external metadata cannot provide the executable checker for a registered extension', t => {
  const f = fixture(t)
  const external = join(f.root, 'external')
  mkdirSync(join(external, 'scripts'), { recursive: true })
  cpSync(join(f.skill, 'skill.meta.json'), join(external, 'skill.meta.json'))
  writeFileSync(join(external, 'scripts/check-consistency.mjs'), "throw new Error('EXTERNAL_MUST_NOT_RUN')")
  f.env.PORTAL_WORKBENCH_UI_SKILL_DIR = external
  const result = run(f)
  assert.equal(result.status, 0, result.output)
  assert.doesNotMatch(result.output, /EXTERNAL_MUST_NOT_RUN/)
})

test('a symlink in the bundled Skill cannot execute an external checker', t => {
  const f = fixture(t)
  const external = join(f.root, 'external-checker.mjs')
  writeFileSync(external, "throw new Error('EXTERNAL_MUST_NOT_RUN')")
  const checker = join(f.skill, 'scripts/check-consistency.mjs')
  rmSync(checker)
  symlinkSync(external, checker)
  const result = run(f)
  assert.notEqual(result.status, 0, result.output)
  assert.match(result.output, /符号链接/)
  assert.doesNotMatch(result.output, /EXTERNAL_MUST_NOT_RUN/)
})
