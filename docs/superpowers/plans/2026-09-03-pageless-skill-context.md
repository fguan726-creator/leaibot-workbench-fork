# Pageless Skill Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Skill creators select the existing API-backed `私人订制 / 私定 TOP 榜单` capability without adding a page, route, or left-navigation entry, then publish the verified change only to `new`.

**Architecture:** Keep navigation and page routes driven exclusively by `MENU_TREE`. Add a small Skill-domain catalog for pageless capabilities, convert it to the existing `ContextItem` shape through pure functions, and merge it only at the Skill creation selector boundary. Preserve `selectedContextCodes`, capability-update overlays, recommendation sorting, and the rule that recommendations are never auto-selected.

**Tech Stack:** Vue 3, TypeScript, JavaScript ES modules, Pinia, Node test runner, Vite, pnpm, portal-workbench-ui-0818 design guard, Git-isolated worktree.

## Global Constraints

- Work only in `/private/tmp/lexiang-skill-context-20260903` on branch `feat/skill-context-no-page-20260903`.
- Do not edit the dirty checkout at `/Users/liz/Library/Mobile Documents/com~apple~CloudDocs/Codex/门户工作台/lexiang-new`.
- Do not modify `vue-app/src/stores/app.ts`, `vue-app/src/router/index.ts`, permission modules, or anything under `admin-runtime`.
- Do not create a `path`, route, hidden page, navigation node, or page placeholder for this capability.
- Use test-first red/green cycles. Confirm each new test fails for the expected missing behavior before production edits.
- Keep the exact description: `用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整`.
- Selecting `私人订制` marks `私定 TOP 榜单` as recommended but leaves `selected: false`.
- Keep existing page-backed capabilities and cross-domain selection behavior unchanged.
- Use `apply_patch` for source changes. Keep commits narrow and do not include generated dependencies or unrelated files.
- Publish only `new`; formal, GitLab, and GitHub synchronization are separate and out of scope unless needed solely as a Git transport to the preview server.
- Before preview deployment, create a fresh `new` backup and fingerprint the whole protected `admin-runtime`, including `workbench-geo.js` and `workbench-pages.js`; use non-deleting synchronization.

---

## Task 1: Add a tested pageless capability catalog

**Files:**

- Create: `vue-app/scripts/skill-context-catalog.test.mjs`
- Create: `vue-app/src/domain/skillContextCatalog.js`

- [ ] **Step 1: Read the test-quality guide before changing tests**

Read `/Users/liz/.codex/skills/test-driven-development/writing-good-tests.md` completely and retain these constraints in the implementation review: assert public behavior, keep one reason per failure, and avoid tests that merely mirror implementation details.

- [ ] **Step 2: Write the first failing behavior test**

Create `vue-app/scripts/skill-context-catalog.test.mjs` with Node's built-in runner:

```js
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PAGELESS_SKILL_CONTEXT_GROUPS,
  createPagelessContextItems,
  getPagelessSkillMenuLabels
} from '../src/domain/skillContextCatalog.js'

const expectedDescription = '用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整'

test('registers the private customization API capability without a page path', () => {
  assert.deepEqual(getPagelessSkillMenuLabels(), ['私人订制'])
  assert.equal(PAGELESS_SKILL_CONTEXT_GROUPS.length, 1)

  const [group] = PAGELESS_SKILL_CONTEXT_GROUPS
  assert.equal(group.groupId, 'private-customization')
  assert.equal(group.groupLabel, '私人订制')
  assert.deepEqual(group.contexts, [{
    contextId: 'customization.top-ranking',
    name: '私定 TOP 榜单',
    description: expectedDescription,
    sourceType: 'api'
  }])
  assert.equal('path' in group.contexts[0], false)
})

test('recommends the active pageless capability without selecting it', () => {
  const [inactive] = createPagelessContextItems('')
  const [active] = createPagelessContextItems('私人订制')

  assert.deepEqual(inactive, {
    code: 'customization.top-ranking',
    name: '私定 TOP 榜单',
    subtitle: expectedDescription,
    source: '私人订制',
    menuPath: '私人订制 / 私定 TOP 榜单',
    sourceType: 'api',
    selected: false,
    recommended: false
  })
  assert.equal(active.recommended, true)
  assert.equal(active.selected, false)
  assert.equal('path' in active, false)
})
```

- [ ] **Step 3: Run the focused test and verify the RED state**

Run from `vue-app`:

```bash
node --test scripts/skill-context-catalog.test.mjs
```

Expected: FAIL because `src/domain/skillContextCatalog.js` does not exist. If it fails for syntax, environment, or another unrelated reason, correct the test setup and rerun until the failure proves only the missing feature.

- [ ] **Step 4: Implement the minimal pure catalog**

Create `vue-app/src/domain/skillContextCatalog.js`. Before the exports, define JSDoc types for the narrow literals and object contracts used by both tasks:

```js
/** @typedef {'page' | 'api'} SkillContextSourceType */
/** @typedef {'affected' | 'optional'} SkillContextChangeRole */
/**
 * @typedef {object} SkillContextItem
 * @property {string} code
 * @property {string} name
 * @property {string} subtitle
 * @property {string} source
 * @property {string} menuPath
 * @property {SkillContextSourceType=} sourceType
 * @property {string=} version
 * @property {string=} currentVersion
 * @property {string=} targetVersion
 * @property {SkillContextChangeRole=} changeRole
 * @property {boolean} selected
 * @property {boolean} recommended
 */
```

Annotate the catalog and every exported function with `@type`, `@param`, and `@returns` so `sourceType`, `changeRole`, and the returned object shape remain literal/narrow when consumed by the TypeScript Vue file. Then implement:

```js
export const PAGELESS_SKILL_CONTEXT_GROUPS = [
  {
    groupId: 'private-customization',
    groupLabel: '私人订制',
    contexts: [
      {
        contextId: 'customization.top-ranking',
        name: '私定 TOP 榜单',
        description: '用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整',
        sourceType: 'api'
      }
    ]
  }
]

export function getPagelessSkillMenuLabels() {
  return PAGELESS_SKILL_CONTEXT_GROUPS.map(group => group.groupLabel)
}

export function createPagelessContextItems(activeMenu = '') {
  return PAGELESS_SKILL_CONTEXT_GROUPS.flatMap(group => group.contexts.map(context => ({
    code: context.contextId,
    name: context.name,
    subtitle: context.description,
    source: group.groupLabel,
    menuPath: `${group.groupLabel} / ${context.name}`,
    sourceType: context.sourceType,
    selected: false,
    recommended: activeMenu === group.groupLabel
  })))
}
```

- [ ] **Step 5: Run focused tests and verify the GREEN state**

```bash
node --test scripts/skill-context-catalog.test.mjs
```

Expected: 2 tests pass, 0 fail.

- [ ] **Step 6: Commit the catalog slice**

```bash
git add vue-app/scripts/skill-context-catalog.test.mjs vue-app/src/domain/skillContextCatalog.js
git diff --cached --check
git commit -m "feat: add pageless Skill capability catalog [tokens:5000]"
```

---

## Task 2: Merge the catalog into Skill creation without touching navigation

**Files:**

- Modify: `vue-app/scripts/skill-context-catalog.test.mjs`
- Modify: `vue-app/src/domain/skillContextCatalog.js`
- Modify: `vue-app/src/views/agent/AgentSkillCreateView.vue`
- Verify unchanged: `vue-app/src/stores/app.ts`
- Verify unchanged: `vue-app/src/router/index.ts`

- [ ] **Step 1: Add failing integration-behavior tests**

Extend the test import with two not-yet-implemented public functions:

```js
import {
  mergeSkillContextItems,
  mergeSkillMenuLabels
} from '../src/domain/skillContextCatalog.js'
```

Add behavior tests with hand-written inputs and literal expectations:

```js
test('merges pageless menu labels after page menus without duplicates', () => {
  assert.deepEqual(mergeSkillMenuLabels(['乐享运营']), ['乐享运营', '私人订制'])
  assert.deepEqual(mergeSkillMenuLabels(['乐享运营', '私人订制']), ['乐享运营', '私人订制'])
})

test('merges page and API contexts while preserving update overlays and stable codes', () => {
  const pageItems = [
    {
      code: 'dashboard.overview',
      name: '数据总览',
      subtitle: '原页面描述',
      source: '乐享运营',
      menuPath: '乐享运营 / 数据总览',
      selected: false,
      recommended: false
    },
    {
      code: 'ops.traffic',
      name: '用户流量',
      subtitle: '原流量描述',
      source: '乐享运营',
      menuPath: '乐享运营 / 用户流量',
      selected: false,
      recommended: false
    }
  ]
  const update = {
    baseMenu: '私人订制',
    summary: '能力发生变化',
    affectedContexts: [
      {
        contextId: 'dashboard.overview',
        name: '数据总览（更新）',
        menuPath: '乐享运营 / 数据总览',
        currentVersion: 'v3',
        targetVersion: 'v4'
      },
      {
        contextId: 'customization.top-ranking',
        name: '私定 TOP 榜单',
        menuPath: '私人订制 / 私定 TOP 榜单',
        currentVersion: 'v1',
        targetVersion: 'v2'
      }
    ],
    optionalContexts: [
      {
        contextId: 'ops.traffic',
        name: '用户流量（可选）',
        menuPath: '乐享运营 / 用户流量',
        version: 'v5',
        summary: '可选流量能力'
      },
      {
        contextId: 'customization.asset-library',
        name: '喷绘素材库',
        menuPath: '私人订制 / 喷绘素材库',
        version: 'v1',
        summary: '可选素材查询能力'
      }
    ]
  }

  const originalPageItems = structuredClone(pageItems)
  const originalUpdate = structuredClone(update)
  const items = mergeSkillContextItems(pageItems, '私人订制', update)

  assert.deepEqual(pageItems, originalPageItems)
  assert.deepEqual(update, originalUpdate)
  assert.deepEqual(items[0], {
    code: 'dashboard.overview',
    name: '数据总览（更新）',
    subtitle: '原页面描述',
    source: '乐享运营',
    menuPath: '乐享运营 / 数据总览',
    currentVersion: 'v3',
    targetVersion: 'v4',
    changeRole: 'affected',
    selected: false,
    recommended: true
  })
  assert.deepEqual(items[1], {
    code: 'ops.traffic',
    name: '用户流量（可选）',
    subtitle: '可选流量能力',
    source: '乐享运营',
    menuPath: '乐享运营 / 用户流量',
    version: 'v5',
    changeRole: 'optional',
    selected: false,
    recommended: true
  })
  assert.deepEqual(items.find(item => item.code === 'customization.top-ranking'), {
    code: 'customization.top-ranking',
    name: '私定 TOP 榜单',
    subtitle: '用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整',
    source: '私人订制',
    menuPath: '私人订制 / 私定 TOP 榜单',
    sourceType: 'api',
    currentVersion: 'v1',
    targetVersion: 'v2',
    changeRole: 'affected',
    selected: false,
    recommended: true
  })
  assert.equal(items.filter(item => item.code === 'customization.top-ranking').length, 1)
  assert.deepEqual(items.at(-1), {
    code: 'customization.asset-library',
    name: '喷绘素材库',
    subtitle: '可选素材查询能力',
    source: '私人订制',
    menuPath: '私人订制 / 喷绘素材库',
    version: 'v1',
    changeRole: 'optional',
    selected: false,
    recommended: true
  })
})
```

The test names the regressions it catches: duplicate labels, dropped page capabilities, duplicate stable IDs, loss of API metadata, incorrect automatic selection, and failure to apply the existing update overlay to a pageless item. Do not add source-text/regex assertions.

- [ ] **Step 2: Run the focused test and verify the RED state**

```bash
node --test scripts/skill-context-catalog.test.mjs
```

Expected: the focused suite fails on the missing named exports for the two merge functions. The failure must be caused by the absent integration behavior, not syntax or environment setup.

- [ ] **Step 3: Implement the two pure merge functions**

In `skillContextCatalog.js`:

1. `mergeSkillMenuLabels(pageMenuLabels)` returns the page menu labels first, then pageless labels, deduplicated by exact label while preserving first occurrence order.
2. `mergeSkillContextItems(pageItems, activeMenu = '', update = null)` appends `createPagelessContextItems(activeMenu)` to the supplied page items.
3. When `update` exists, overlay matching `affectedContexts` and `optionalContexts` by stable `contextId` across the combined base array. Preserve the original item subtitle for affected items, matching current behavior; use an optional context's `summary` when present.
4. Add update-only contexts once, after base items, with the current affected/optional field mapping and `recommended: true`, `selected: false`.
5. Do not mutate the supplied `pageItems` or `update` objects; the test snapshots the page inputs before the merge and compares them afterward.

- [ ] **Step 4: Run the focused test and verify the helper GREEN state**

```bash
node --test scripts/skill-context-catalog.test.mjs
```

Expected: all catalog and merge behavior tests pass.

- [ ] **Step 5: Integrate the tested functions at the selector boundary**

In `AgentSkillCreateView.vue`:

1. Import `mergeSkillContextItems` and `mergeSkillMenuLabels` from `@/domain/skillContextCatalog.js`.
2. Add `sourceType?: 'page' | 'api'` to `ContextItem` so API-origin metadata survives the merge without weakening typing.
3. Change menu labels to:

```ts
const menuGroupLabels = mergeSkillMenuLabels(menuGroups.map(group => group.label))
```

4. In `createMenuContextItems(activeMenu)`, keep the existing `MENU_TREE` child mapping as `pageItems`, but remove update-overlay work from that mapping. Pass `pageItems`, `activeMenu`, and `activeCapabilityUpdate.value` to `mergeSkillContextItems`.
5. Do not add `私人订制` to `RECOMMENDED_CONTEXT_CODES_BY_MENU`; its recommendation comes from the catalog transformer.
6. Preserve the existing `.sort()` recommendation-first behavior and never set the new item selected based on the active menu.

- [ ] **Step 6: Update only the affected user-facing semantics**

Make these exact replacements in `AgentSkillCreateView.vue`:

- `已选子菜单上下文` → `已选能力上下文`
- `必须基于当前工作台已有菜单和子菜单理解能力上下文，不要编造菜单外能力。` → `必须基于当前工作台已登记的菜单和能力上下文理解业务能力，不要编造目录外能力。`
- `页面能力、接口或上游材料` → `页面或接口能力、上游材料`
- `依赖页面` → `依赖能力`
- `调用页面能力` → `调用上下文能力`
- YAML key `context_pages:` → `context_capabilities:`
- API metric `{ label: 'API', value: 13 }` → `{ label: 'API', value: 14 }`

Do not rewrite unrelated prompts, labels, or the existing page layout.

- [ ] **Step 7: Run focused tests and static type verification**

```bash
node --test scripts/skill-context-catalog.test.mjs
pnpm typecheck
```

Expected: all focused tests pass and TypeScript reports no errors.

- [ ] **Step 8: Confirm navigation and route files are byte-unchanged**

```bash
git diff --exit-code HEAD -- vue-app/src/stores/app.ts vue-app/src/router/index.ts
git diff --check
```

Expected: both protected source files have no diff; whitespace check passes.

- [ ] **Step 9: Commit the Skill creation integration**

```bash
git add vue-app/scripts/skill-context-catalog.test.mjs vue-app/src/domain/skillContextCatalog.js vue-app/src/views/agent/AgentSkillCreateView.vue
git diff --cached --check
git commit -m "feat: select API contexts in Skill creation [tokens:7000]"
```

---

## Task 3: Add one user-facing POC adjustment record

**Files:**

- Modify: `vue-app/src/components/shell/sidebar/WorkbenchSidebar.vue`

- [ ] **Step 1: Add the newest POC record**

Insert the record at the beginning of `basePocLogRecords`:

```ts
{
  time: '2026-09-03 12:52',
  releaseKey: 'pageless-skill-context-20260903',
  title: 'Skill 创建支持无页面接口能力',
  changePoint: 'Skill 创建可选择“私人订制”，并匹配接口能力“私定 TOP 榜单”；不新增左侧菜单、页面或路由。',
  detail: '为只有接口、没有二级或三级页面支撑的场景补充能力上下文目录。用户在 Skill 创建中选择“私人订制”后，可主动勾选“私定 TOP 榜单”，上下文描述为“用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整”；推荐项不会自动选中，现有页面能力、跨业务域选择、保存提审和右侧 Agent 行为保持不变。',
  deployTargets: ['new'],
  status: '已更新 new 预览'
}
```

- [ ] **Step 2: Verify the rendered-source contract without a source-grep test**

The POC record is human-facing prose, so do not add a test that only greps its source. Review the diff directly for one top record, exact release key, exact description, `deployTargets: ['new']`, and no formal release metadata. The build and browser verification in Tasks 4–5 prove that the record is consumable and visible.

- [ ] **Step 3: Run focused and full Node tests**

```bash
node --test scripts/skill-context-catalog.test.mjs
node --test scripts/*.test.mjs
```

Expected: focused tests pass; the full suite has no failures.

- [ ] **Step 4: Commit the adjustment record**

```bash
git add vue-app/src/components/shell/sidebar/WorkbenchSidebar.vue
git diff --cached --check
git commit -m "docs: record pageless Skill context preview [tokens:4000]"
```

---

## Task 4: Run the design and engineering verification gate

**Files:**

- Verify: all changed source and test files
- Generated only in disposable verification worktree: `/private/tmp/lexiang-skill-context-verify-20260903/public/admin-vue`

`vite.config.js` writes to `../public/admin-vue` with `emptyOutDir: true`. Never run the default `pnpm build` in the implementation worktree or a shared server checkout because it clears that tracked output directory before rebuilding, including its protected runtime copy.

- [ ] **Step 1: Run the raw incremental 0818 design guard and, only if needed, its baseline-delta comparison**

From repository root:

```bash
node skill/portal-workbench-ui-0818/scripts/check-consistency.mjs \
  --project vue-app \
  --changed-file src/views/agent/AgentSkillCreateView.vue \
  --changed-file src/components/shell/sidebar/WorkbenchSidebar.vue
```

Expected: the raw changed-file Guard must always run. `[OK] portal-workbench-ui-0818 ... internally consistent.` is a raw pass. If the raw command fails, do not call it PASS: create a detached `origin/main` baseline worktree, run exactly the same command, remove only its absolute worktree prefix before comparing violation signatures, and confirm both the count and every signature match. Also confirm `git diff origin/main...HEAD -- vue-app/src/views/agent/AgentSkillCreateView.vue` has no diff in the `<style>` block. Only when baseline and raw output are identical with no style diff may the gate continue as `raw guard FAIL, delta 0 inherited debt`; any count/signature difference or style diff is BLOCKED.

- [ ] **Step 2: Run non-destructive checks in the implementation worktree**

From `vue-app`:

```bash
node --test scripts/*.test.mjs
pnpm guard:design-skill
pnpm lint
pnpm typecheck
```

Expected: every command exits 0. Record exact test counts and any non-blocking warnings separately.

- [ ] **Step 3: Run the destructive-output build and standard smoke in a disposable worktree**

From repository root, first confirm the target path is not another registered worktree, then add a detached worktree at the verified task HEAD:

```bash
git worktree list --porcelain
git worktree add --detach /private/tmp/lexiang-skill-context-verify-20260903 HEAD
pnpm --dir /private/tmp/lexiang-skill-context-verify-20260903/vue-app install --frozen-lockfile
pnpm --dir /private/tmp/lexiang-skill-context-verify-20260903/vue-app build
pnpm --dir /private/tmp/lexiang-skill-context-verify-20260903/vue-app smoke:shell
```

Expected: build and smoke exit 0. Record the generated entry asset names. The default build may clear only the disposable worktree's `public/admin-vue`; it must not run against `/private/tmp/lexiang-skill-context-20260903`, `/opt/projects/lexiang-new`, or `/opt/projects/lexiang`.

After recording evidence, remove only this explicitly validated disposable worktree:

```bash
git worktree remove --force /private/tmp/lexiang-skill-context-verify-20260903
```

- [ ] **Step 4: Review the final diff and protected boundaries**

From repository root:

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git diff origin/main...HEAD -- vue-app/src/stores/app.ts vue-app/src/router/index.ts
git status --short
```

Expected: no whitespace errors; only planned files plus the approved spec/plan changed; navigation and router diff is empty; no dependency or build artifacts are staged.

- [ ] **Step 5: Perform two-stage review**

First compare the implementation against every requirement in `docs/superpowers/specs/2026-09-03-pageless-skill-context-design.md`. Then review code quality, typing, deduplication behavior, test quality, user copy, and scope discipline. Fix findings through a new red/green cycle and repeat the full gate after any code change.

---

## Task 5: Reconcile with the current deployed Git baseline

**Files:**

- Rebase: branch `feat/skill-context-no-page-20260903`
- Read-only source baseline: `formal-server/main`
- Preserve recovery ref: `backup/pageless-skill-context-before-formal-20260903`

The release audit found that the current deployed server history is a descendant of the fetched GitLab `origin/main`. Building from the older base would regress unrelated live functionality even though this feature's own tests pass. Reconcile before any deployment; do not modify the formal repository or its worktree.

- [ ] **Step 1: Freeze and verify the read-only deployed baseline**

Confirm the locally fetched `formal-server/main` points to `046446b38f90dd3bdb691526d049b84e1dcbf3fd`, whose merge base with `origin/main` is `0b905f5ba9bf47e64428353b87c511eddcead282`, and confirm `origin/main...formal-server/main` is `0 334`. Confirm the recovery ref points to the pre-reconciliation task HEAD.

If the server HEAD has advanced again, fetch it to a new immutable local ref, compare the `vue-app` tree and live `public/admin-vue` entry to the frozen baseline, and use the latest commit only when it changes the portal source or deployed output. Do not chase unrelated auto-checkpoints outside the portal tree.

- [ ] **Step 2: Rebase the isolated feature commits onto the frozen deployed baseline**

Run:

```bash
git rebase --onto formal-server/main origin/main feat/skill-context-no-page-20260903
```

Resolve conflicts only in files changed by this plan. Preserve the deployed baseline's unrelated changes and apply the pageless-context diff narrowly. Use `apply_patch` for conflict resolution, stage explicit files, and continue non-interactively. Never use `git reset --hard`, `git checkout --ours`, `git checkout --theirs`, or a broad restore.

- [ ] **Step 3: Verify the rebased functional diff**

Against `formal-server/main`, confirm the only intended functional changes remain:

- the pageless catalog and behavior tests;
- the Skill creation selector integration and copy;
- the single new-only POC log record;
- the approved specification and plan documents.

Confirm `vue-app/src/stores/app.ts`, `vue-app/src/router/index.ts`, permission files, and all `admin-runtime` paths have empty diffs.

- [ ] **Step 4: Rerun all code and build gates on the rebased HEAD**

Repeat Task 4 using `formal-server/main` as the design-Guard and Git-diff baseline: focused tests, all Node tests, raw/delta 0818 Guard, `guard:design-skill`, lint, typecheck, disposable-worktree build, smoke, `git diff --check`, and protected-boundary checks. The raw Guard may continue only if its normalized signatures equal the frozen baseline and the `<style>` diff is empty.

- [ ] **Step 5: Review the reconciliation**

Review the complete `formal-server/main..HEAD` diff for preservation of newer deployed behavior, correct conflict resolution, exact requested strings, recommendation without auto-selection, stable-code restoration compatibility, and absence of unplanned source/build files. Record the rewritten commit mapping in the SDD ledger.

---

## Task 6: Publish only to `new` and verify the live interaction

**Files:**

- Server preview repository/worktree: discover read-only before changing it
- Preview output: `new` environment `public/admin-vue`
- Protected output: `public/admin-vue/admin-runtime/**`
- Release ledger: use existing repository script with key `pageless-skill-context-20260903`

- [ ] **Step 1: Inspect preview deployment state without mutation**

On the preview server, identify the actual `lexiang-new` branch, HEAD, dirty files, worktree locks, deployment/build procedure, output directory, and release-ledger script. Also capture the formal repository HEAD plus a recursive SHA-256 manifest of the entire formal `public/admin-vue` tree, including its `poc-release-ledger.json`, so “formal untouched” can be verified byte-for-byte later.

Stop and resolve any overlap with another person's dirty files before merging. Do not use `/opt/projects/lexiang` as a work area.

- [ ] **Step 2: Transfer code through Git only if the preview server requires it**

Use the isolated branch/commit chain or a server-side personal worktree. Do not use `scp`, SFTP, IDE upload, or direct edits in a shared dirty checkout. Do not push to any incoming branch watched by the formal auto-merge job.

Report preview-server Git state separately from GitLab and GitHub. A successful `new` deployment does not imply either remote mirror is updated.

- [ ] **Step 3: Create a fresh preview backup and protected-runtime fingerprints**

Before replacing any preview asset:

1. Create a timestamped backup of the current `new` `public/admin-vue`.
2. Capture a recursive SHA-256 manifest for `admin-runtime` and explicit hashes for `workbench-geo.js` and `workbench-pages.js`.
3. Confirm the backup is readable and record its exact path as the rollback point.

- [ ] **Step 4: Build from the verified commit into a fresh temporary directory and publish non-destructively**

From the isolated preview worktree, create a unique temporary output directory outside the repository and invoke Vite with an explicit absolute `--outDir`. Do not run the default `pnpm build` in the server worktree because the configured `emptyOutDir` would clear its tracked `public/admin-vue` first.

Create the directory first and capture its printed absolute path:

```bash
mktemp -d /tmp/lexiang-new-build-20260903.XXXXXX
```

Then pass that exact printed path to `pnpm --dir vue-app exec vite build --outDir ... --emptyOutDir` in a separate command; do not substitute or glob an unresolved target.

Synchronize that temporary build into `new` without delete semantics and while excluding the entire `admin-runtime` directory. Do not touch the formal environment. Compare the generated entry asset with the locally verified disposable-worktree build before publication.

- [ ] **Step 5: Record actual preview release evidence**

After the preview assets are live, run the existing release ledger command with both output variables explicitly resolved to the same `new` ledger path. The ledger writer deduplicates identical output paths, so this records the `new` release once and cannot write the formal file:

```bash
PORTAL_RELEASE_NEW_OUTPUT=/opt/projects/lexiang-new/public/admin-vue/poc-release-ledger.json \
PORTAL_RELEASE_FORMAL_OUTPUT=/opt/projects/lexiang-new/public/admin-vue/poc-release-ledger.json \
scripts/record-portal-workbench-release.sh new pageless-skill-context-20260903 "Skill 创建支持无页面接口能力"
```

Record the actual deployment account, Beijing timestamp, Git commit, entry asset, and rollback backup.

- [ ] **Step 6: Verify bytes, protection, and formal non-change**

Verify all of the following against the live `new` host:

- HTTP 200 for the entry and newly referenced assets.
- The live entry references the just-built hashed JavaScript and CSS assets.
- Live asset content contains the new menu/capability identifiers and exact description.
- The post-release recursive `admin-runtime` manifest exactly matches the pre-release manifest.
- `workbench-geo.js` and `workbench-pages.js` hashes match before/after.
- The formal repository HEAD and recursive `public/admin-vue` manifest, including the formal ledger file, match their before-state exactly.

- [ ] **Step 7: Verify the actual `new` user flow in the browser**

Open the live Skill creation route in the in-app browser and verify:

1. The menu select contains `私人订制`.
2. Selecting it puts `私定 TOP 榜单` first with the recommendation indicator but does not select it.
3. The exact description is visible in the card/tooltip.
4. Selecting the card adds it to `已选能力上下文`.
5. Advancing to clarification includes `私人订制/私定 TOP 榜单(customization.top-ranking)` in the selected capability context.
6. Search separately for `私人订制`, `私定 TOP 榜单`, the exact description, and `customization.top-ranking`; each search returns the capability.
7. Select the `私人订制` business-domain filter and confirm the capability remains available.
8. Select the capability, save the draft, return to Skill Hub, reopen the draft, refresh, and confirm `customization.top-ranking` restores as selected.
9. The left navigation has no `私人订制` item.
10. Browser console has no project errors.

- [ ] **Step 8: Run a final fresh completion gate**

After deployment and any required corrections, rerun the focused test, full Node suite, lint, typecheck, the disposable-worktree build and smoke procedure from Task 4, `git diff --check`, live HTTP/resource checks, protected-runtime fingerprint comparison, and full formal-tree non-change check. Only then report completion.

## Handoff Evidence

The final report must state, as separate chains:

- local isolated branch and exact commit(s);
- `new` preview URL, release version, deployment account/time, entry assets, and rollback backup;
- test counts and engineering checks actually run;
- protected `admin-runtime` before/after result;
- formal environment state (`未更新` when its before/after evidence matches);
- preview-server Git, GitLab, and GitHub states independently, without calling them collectively “已同步”;
- any visual/browser verification limitation if an interaction could not be exercised.
