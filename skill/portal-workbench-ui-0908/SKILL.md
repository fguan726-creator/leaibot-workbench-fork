---
name: portal-workbench-ui-0908
description: >-
  Unified design and implementation skill for the 联想乐享 / 乐享 AI 工作台 / Leaibot portal workbench consolidated 0908 release. It unifies PM requirement analysis, UI/UX design, page optimization, Figma/UAT audits, POC comparison, Vue implementation, responsive validation, accessibility, engineering handoff, and release governance in one contract based on the complete 0825 Vue baseline plus the confirmed AI商品管理 and 权限管理 POC deliveries. Use it for this release when PM, UI designers, frontend developers, reviewers, or Codex assess, maintain, or verify the paired project. It supersedes portal-workbench-ui-0825 for this release only. Do not use for unrelated admin systems, marketing sites, or mobile consumer apps.
---

# Portal Workbench UI 0908

## 1. Single Source Of Truth

Use this one skill for PM, UI and development work. Do not maintain a separate developer edition or a separately authored project/PM copy.

Use the target application's repository as the execution baseline. Resolve `<app-root>` to the directory that contains the target `package.json`, `src/` and build configuration:

```text
<app-root>
```

Use release 0908 as the current design contract, extending the confirmed 0904 project and its 2026-09-08 feedback supplement. Product acceptance must be verified for the new implementation. It retains the complete 0825 baseline and adds the confirmed AI商品管理 delivery plus the 权限申请、角色管理、用户管理 and related permission-management interaction delivery without introducing a second role-specific design standard; retain 0825 and earlier releases as inherited historical and non-regression references. Do not require the target repository to use a particular folder name, operating-system user name or machine path.

Treat generated/install copies as distributions of this skill. Edit the authoritative 0908 folder first, validate it, then distribute an identical copy. Never merge rules back from a generated copy.

Current architecture:

- Use Vue 3, Vite, Pinia and Vue Router with base path `/admin-vue/`.
- Preserve TypeScript `strict` and `noImplicitAny`.
- Keep sidebar, Topbar, static tabs, AI result selector, right Agent, stores, router, composables and services owned by Vue.
- Keep visible business pages in the Vue route/page layer. Existing wrappers, local `v-html` and migration helpers are transition evidence, not preferred patterns.
- Use `NativeWorkbenchPage` only for registered hidden/detail compatibility routes.
- Reintroduce deleted search-backend or risk-management scope only from a fresh confirmed requirement.

Do not claim all content-slot internals are fully componentized. Do not route a visible migrated page back to `NativeWorkbenchPage` without an explicit rollback request.

## 2. Unified PM, UI And Development Workflow

Use one decision record and one page contract through the whole flow:

1. Compare the latest project baseline with the new PRD, POC, prototype, conversation or audit evidence.
2. Report additions, intentional changes, affected accepted behavior, protected scope, risks and unresolved decisions before changing source.
3. Wait for confirmation when a choice changes product behavior, scope, permissions, data semantics or sealed surfaces.
4. Register or locate the page in `page-spec-coverage-matrix.md`; select exactly one T1–T7 base page type and at most one necessary specialized variant. For middle content-slot styling, resolve the request through `content-slot-component-library.md` before creating page-local structure.
5. Produce the design contract: information hierarchy, components, responsive behavior, states, copy, permissions, accessibility and acceptance criteria.
6. Produce the authorized output from the same component baseline. For PM/UI prototypes, compose the Skill-bundled Vue components outside the product repository. For a development request that names or clearly places a target project in scope, first reuse its verified implementation of the same component; otherwise map the Skill component into that repository and complete engineering integration.
7. Verify design and engineering results together. Record truthful evidence and do not convert source review or screenshots into unsupported acceptance claims.
8. Archive the confirmed project and this unified skill as matching dated releases; do not create a parallel developer skill.

Read `references/unified-role-workflow.md` for role-specific inputs, outputs and handoff rules. PM/UI work may stop after an approved design/acceptance package; development work continues from that same package without translating it into a second standard.

## 3. Reference Router

Load only the references needed for the task.

| Task | Required references |
|---|---|
| PM/UI/development handoff or release | `unified-role-workflow.md`, then the task-specific references below |
| Any middle content-slot page | `content-slot-design-contract.md`, `content-slot-component-library.md`, `content-slot-component-registry.json`, `page-spec-coverage-matrix.md`, `page-templates.md` |
| Responsive layout or Agent squeeze | `responsive-layout-contract.md`, `layout-grid.md`, `workbench-interactions.md` |
| Visual style, tokens or typography | `style-contract.md`, `design-tokens.md`, `typography.md`; add `brand-assets.md` and `content-guidelines.md` when relevant |
| Content-slot component reuse, creation or optimization | `content-slot-component-library.md`, `content-slot-component-registry.json`, `content-slot-component-contracts.md`, then `components.md`; add `table-patterns.md` and `accessibility.md` when relevant |
| Shell or project-specific components, filters, overlays or states | `components.md`; use `sealed-module-specs.md` only for registered project-specific modules |
| Shell, Agent, tabs, Composer, Skill 创建 or permissions | `workbench-interactions.md`, `sealed-module-specs.md`, `vue-architecture-contract.md`; add `icon-rules.md` for icon/tooltip work |
| AI result / dynamic-tab content view | `workbench-interactions.md`, `page-templates.md` V3, `content-slot-design-contract.md`, `content-slot-component-library.md`, `content-slot-component-contracts.md`; use the normal content-slot component library for the rendered result page |
| PM prototype or AI-generated content-slot page | `content-slot-vue-library.md`, `content-slot-component-library.md`, `content-slot-component-registry.json`, `content-slot-component-contracts.md`; reuse from `assets/vue-content-slot-components/` before creating new page-local structure |
| Development requirement or product Vue implementation | Read `content-slot-vue-library.md` and the same component references first, then `vue-architecture-contract.md`, `content-slot-migration-plan.md`, `style-contract.md`; add `design-guard.md` for every new or changed content-slot source file |
| PRD, conversation requirement or PM POC | `prd-to-ui-workflow.md`, `project-pattern-matching.md`, `reusable-interaction-rules.md`, `prd-ui-acceptance-checklist.md` |
| Design/UAT/Figma audit | `page-spec-coverage-matrix.md`, `page-visual-acceptance.json`, `va-r2-pilot-plan.md`, `review-checklist.md`, `style-qa-checklist.md`, `accessibility.md` |
| Static preview or asset production | `asset-inventory.md`, `brand-assets.md`, relevant templates; read `gaps-to-fill.md` only for unresolved asset/token decisions |
| AI改图 / AI插图 validation, error placement, upload feedback, approval or publish feedback | `ai-product-feedback-contract.md`, `content-guidelines.md`, `components.md`, `reusable-interaction-rules.md`; distinguish target rules from verified product behavior |
| Historical comparison only | `leaibot-admin-ui.md` and earlier project/skill folders; never use them as the default current contract |

For references longer than 100 lines, use the table of contents and load only the relevant section.

## 4. Decision Priority

When sources conflict, use:

1. User-confirmed current requirements and decisions.
2. Current 0908 Vue behavior, data and non-regression boundary.
3. This 0908 skill's content-slot, page-matrix, responsive, interaction and architecture contracts.
4. Applicable component, token, icon, chart, accessibility and content contracts.
5. Current loaded source CSS, token and class contracts.
6. Figma 01–03/05 as absorbed design evidence; Figma 04/UAT and dated files as audit/history only.
7. General design preference.

Record the chosen rule, reason, affected pages and whether the difference is intentional. Do not stack conflicting rules.

## 5. Current Product Contract

### Content page header

- Place the shared `ContentPageHeader` once at the top-left of every independent middle-content page; its page title is the page's only `h1`.
- Treat the target project's verified shared `ContentPageHeader` implementation and its accepted existing consumers as the visual source of truth. New page requirements pass only title, description, status and actions through the existing API; they must not restyle the title from a screenshot, copy a legacy `.page-title`, or add page-scoped overrides. If the project has no verified mapping, adapt the Skill asset without changing its locked geometry.
- Keep its fixed `18×18px` project icon, main title, subtitle, responsive actions and `16px` distance to the first business block identical across lists, dashboards, details, creation, settings, WIP and AI report pages. The icon is always present and decorative; the subtitle starts on the component's left edge below the icon/title row.
- Before delivery, compare the new page and one accepted existing consumer at the same content width. The icon geometry, title `19px/1.35/700`, subtitle `12px/1.65`, `3px` title-subtitle gap, action alignment and content start line must match; computed differences require an explicit approved component-level change, never a page-local correction.
- Allow any number of task-required module headings below it, but render those with `SectionHeader` and semantic `h2`/`h3`; they are not additional page headers. Do not reproduce the page header with page-local DOM, `.page-title` pseudo-elements or custom margins. Modal, Drawer and nested Card headings are not page headers.

### Module headings

- Use the shared `SectionHeader` for repeated top-level business modules such as 关键经营链路、GMV 结构拆解 and 核心趋势速览. Render its title as `h2`, with the fixed primary marker and optional badge, description, meta or actions.
- Keep headings inside a module, such as 分业务 and 分平台, as lightweight `SubsectionHeading` styles using `h3`; do not repeat the SectionHeader marker or create another heavy component.
- Let the right meta/action group wrap below the title group when space is constrained. Never compress either heading into vertical text.

### Shell

- Use a three-column workbench: sidebar `168/58px`, Topbar `56px`, right Agent `380px` default and about `492px` maximum.
- Keep the Agent closed on first entry; open it only after explicit user action.
- Use the Topbar AI result selector for conversation-scoped AI result reports. Do not restore a second-row dynamic-tab strip.
- In every AI result detail header, label the exit action `关闭`, never `返回页面`. Closing removes the current result; switch to an adjacent result when available, otherwise restore the active static page.
- Keep the current release light-only in UI; hide the theme toggle and ignore persisted dark preference while retaining future token/runtime capability.
- Treat Topbar, sidebar, brand lockup, collapse controls, account entry, static tabs, AI result selector, right Agent/header, Composer and shared primitives as sealed unless explicitly included in the requirement.

### AI商品管理反馈

- For AI改图 and AI插图, read [the feedback contract](references/ai-product-feedback-contract.md) before designing, implementing or reviewing validation, upload, approval or publish feedback.
- Place feedback at the field, item or operation where the user can resolve it. Reserve step-top alerts for step-wide prerequisites and page-top alerts for task-wide unavailability; blocking the next action does not determine placement.
- Keep technical read failures distinct from invalid materials, invalidate stale success after inputs change, and avoid duplicate alerts. The reference defines target behavior; inspect implementation before claiming compliance.

### AI result dynamic tabs

- Treat an `AI result` as the dynamic-tab object and the Topbar `AI 结果报告` selector as its current presentation and management entry. Do not interpret the absence of a second-row tab strip as the absence of dynamic-tab behavior.
- Render the selected AI report, link or HTML preview as an independent view in the middle content slot. Choose exactly one T1–T7 base page type by the result's task, add V3 AI-result only, and reuse the same registered content-slot components through `C → B → composition → Domain wrapper → A`.
- Keep dynamic-tab lifecycle outside presentational content components: `conversationId + messageId` ownership, maximum 10 results, switching, saving, closing and adjacent-result fallback belong to the AI-result container. Do not add `isAiReport` or equivalent business switches to Common components.
- Use one `ContentPageHeader` and one page `h1` in every AI result view; use `SectionHeader`, `SectionCard`, `MetricGrid / MetricCard`, `ChartPanel`, `ContentTabs`, `ListSurface / DataTable / Pagination`, `FeedbackState` and other registered components only when required by the payload and task.

### Content slot

- Use seven base types: standard list, long-filter list, dashboard, business form, task/import, split settings and configuration list.
- Use `20px 24px` normal content-slot padding and white surfaces with fine borders. This padding has exactly one owner: when the shell `.page-content` already provides it, the routed page root must use `padding:0`; when the shell provides none, one page container may own it. Never put `20px 24px` on both the content slot and page root. Use `--radius-md` (`8px`) for controls and compact/data cards, `--radius-lg` (`12px`) for large cards and overlays, `--text-sm` (`13px`) for tables/forms/buttons, and `--text-base` (`14px`) for body copy; do not choose arbitrary values inside a range.
- Use one shared PageHeader rhythm across all page types: fixed icon + `19px` title + `12px` subtitle and exactly `16px` from PageHeader to the first business section. Dashboard KPI pages, Skill 创建 and other specialized flows do not override this distance. Generate it once with either the PageHeader's bottom margin or the parent layout gap, never both.
- Every generated content-slot page must declare one `PageFlow` that owns spacing between page blocks. PageHeader, Summary, FilterBar, Tabs/Toolbar, MainContent and Pagination must not each invent outer margins. For list pages with KPI summaries, reuse the registered `SummaryList` composition and its `ListWorkspace`; do not freely stack independent cards.
- Reset legacy outer margins on direct PageFlow/ListWorkspace children before applying gaps. The accepted list-page geometry is content-slot edge → page root with no second inset, PageHeader → first business block `16px`, and FilterBar → ListSurface `12px`; a global `.card { margin-bottom:* }` must not add to either gap.
- Keep PageHeader spacing ownership explicit in specialized pages such as Skill 创建: if PageFlow owns the `16px` gap, reset PageHeader outer margin instead of allowing both rules to accumulate.
- Scope table cell secondary-copy selectors to a dedicated class. Never use broad selectors such as `td span` when StatusTag, badges or actions share the same cell element type; StatusTag must remain inline-sized to its content.
- Treat spacing as measurable acceptance data. Verify every visible adjacent block against the spacing matrix, and fail delivery when an unexplained strip is `>24px`, when a required gap collapses below its token, or when fixed/min-height stretches a standard list surface only to fill the viewport.
- Use `#3370ff` as primary blue. Reserve Lenovo red for brand/danger. Use the calm project blue/green/purple chart palette.
- Treat Figma 04/UAT as problem evidence, not a correct-style source.

### Responsive

- Respond to measured content width: C-XL `>=1200`, C-L `1040–1199`, C-M `720–1039`, C-S `480–719`, C-XS `<480`.
- Start four-column filters at `1040px`, two columns at `720px`, and one column below `720px`; follow page-specific thresholds where documented.
- Keep content `width:100%`; use fluid grids with `minmax(0,1fr)`. Do not create a parallel `920/620px` general breakpoint system.
- Auto-collapse the sidebar at `<=1320px` and auto-expand a system-collapsed sidebar at `>=1480px`; validate desktop at `1280px` minimum.
- Keep page-root horizontal overflow at zero. Allow table scrolling only inside the table container with actions reachable.

### Agent and structured flows

- Use process block → answer bubble → conditional structured output for Agent and Skill 创建/需求澄清 flows.
- Keep 权限管理 as a left/right split workspace aligned with Skill 创建: the local `PermissionModuleRail` uses `clamp(220px,26%,300px)` and the main workspace uses `minmax(0,1fr)`. Preserve the rail on the left at supported desktop widths, expose the total entry count and per-group counts, separate module groups, and make the single-click current state visually and semantically explicit. Do not turn this desktop structure into stacked top/bottom cards or a second global sidebar.
- Treat the bottom `本次演示链路` as a sticky progress summary, not the complete approval history. Show every step only when the route has at most three steps; otherwise keep the previous, current and next steps visible, collapse earlier completed and later pending steps into counted toggle rows, and keep expanded content inside a bounded scroll area so it cannot squeeze the module list. Open the existing approval detail surface for the full route.
- Keep the Composer as one rounded group: use a subtle neutral surface for the outer shortcut/attachment group, a white `--color-surface` editable row, tertiary placeholder text and the shared primary focus ring. Gray only the truly disabled send/control state; never make the default editable textarea look disabled.
- Render only reached states; do not expose chain-of-thought, duplicate waiting rows or run authorization-required actions before approval.
- Collapse completed process history while keeping it auditable; show at most three current active cards.
- Render TODO as direct independent list content after the answer and auto-collapse it when complete.

## 6. Implementation Rules

- Use one component baseline for PM, UI, AI and development work. The Skill-bundled Vue library defines the preferred component structure and API; the target repository contains the engineering implementation and remains the runtime source of truth.
- For PM/UI output, copy the smallest required components from `assets/vue-content-slot-components/`, preserve their public API and tokens, and compose them in the generated prototype. Do not rewrite an equivalent page-local component merely because the output lives outside the product repository.
- For a development request, treat the request to add or change functionality in an identified project as authorization for the normal in-scope source edits. Inspect the repository first: reuse a verified mapped project component when present; otherwise adapt the matching Skill component to the project's component framework, tokens and dependencies. Do not require a second confirmation merely to use the library.
- Keep business data, permissions, routing, stores, services and chart options in the product implementation. Do not import the Skill directory as a runtime package or overwrite a stronger existing project primitive blindly.
- The Skill reference library may grow through the registered A/B/C process: reuse C first, then B, then composition; create A only when none fits. New A remains page-local and is not automatically added to the shared library. Promotion to B/C requires the evidence and registration gates in `content-slot-component-library.md`.
- Inspect the target repository before editing; adapt paths but do not weaken the design contract.
- Prefer existing components, Pinia stores, composables, services and adapters.
- For middle content-slot page styles, reuse C-stage components first, then B-stage components, then compose existing components. If none can carry the requirement, create an A-stage page-local pattern and register it; do not place a first occurrence directly into the shared component layer.
- Apply the same decision to AI result views. Their dynamic-tab origin changes lifecycle and ownership, not the content-slot visual system or component reuse order.
- Render the registered `ContentPageHeader` once as the top-left page-level heading of every independent middle-content page. A page-local page-title block is not an allowed A-stage pattern; module-level `SectionHeader` components remain allowed below it.
- Reuse `SectionHeader` for top-level modules and the lightweight `SubsectionHeading` contract for nested groups; do not invent page-specific module-title markers, font sizes or alignment rules.
- Treat A/B/C as design-library maturity and Page-local/Domain/Common as reuse scope. Keep project implementation status separate; never claim a shared Vue component exists only because a design component is registered in this Skill.
- Keep side effects in composables/services, not arbitrary store actions or scattered DOM calls.
- Do not add new `window.*`, `innerHTML` or ad hoc DOM bridges outside the registered adapter.
- Pass edit/review context through route query, typed state, store or session draft; do not patch fields after navigation as the primary data path.
- Extract shared components when reused by at least two domains or when interaction risk justifies it. Keep single-use or unstable business blocks page-local.
- Never copy a PM POC's complete CSS/runtime stack. Reject shell/shared selectors from broad POC CSS and extract only page-private intent into scoped styles.
- Do not add unregistered `*design-skill*.css` runtime shortcuts or late global imports that override sealed surfaces.
- Treat HTML templates as visual references. PM/UI prototypes and development implementations must both resolve content-slot structure through the bundled Vue component contracts before creating page-local markup.

## 7. Validation

From `<app-root>`, run the target repository's equivalent checks. For the reference Vue setup:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm smoke:shell
```

If the target repository provides a design guard, run it for protected-surface and global-style warnings. Do not require project or skill fingerprints, fixed directory names or personal paths.

For skill/design work:

- Run `node scripts/check-consistency.mjs --project <target-vue-app>` after changing contracts, assets, templates, page mappings or evidence.
- For every new or changed content-slot source file, append `--changed-file <repo-relative-file>` once per file. The incremental design guard fails new hardcoded style violations while leaving untouched historical debt as audit-only output. Use `--guard-all` only for a non-blocking full-project inventory.
- Run the skill structure validator after changing `SKILL.md` or `agents/openai.yaml`.
- Read `style-qa-checklist.md`; use `review-checklist.md` for audits and implementations.
- Verify Agent closed/default/max layouts and relevant initial, loading, empty, error, no-permission, disabled, submitting, success, partial-success and stale-data states.
- Record `viewport/sidebar/agent/contentInnerWidth` and `scrollWidth-clientWidth` where responsive acceptance is claimed.
- Treat archived 0728 screenshots and 0729/0730 project evidence as historical reference only. Current 0908 acceptance requires evidence from the paired target implementation.
- Keep VA-FAIL and VA-BLOCKED truthful. Never promote S1–S4 or VA-R2 into a full interaction/data/accessibility pass.

## 8. Delivery And Version Governance

- Keep `portal-workbench-ui-0908` as the single archived 0908 skill for PM, UI and development.
- Do not create `-dev`, `-pm`, `-ui` or project-specific authored variants.
- Distribute generated copies only when a consuming environment cannot reference this folder directly; run the structure, consistency and portability checks before use.
- Keep dated historical project and skill folders read-only. Create the next dated release from the latest confirmed pair.
- Keep compatibility rule-based: inspect the target source and compare behavior against this contract. Do not block use because a project or skill hash differs.
- Preserve the PM source package shape. Remove generated handoff artifacts only when they are known rebuild outputs; never delete source-owned `vue-app/public`.

## 9. Preview Assets And Evidence

- Use `assets/page-template.html` as a static shell snapshot; current Vue source and confirmed requirements win.
- Use `assets/content-*-template.html` and `assets/content-template.css` as page-type references, not runtime product files.
- Use bundled logos, fonts and assets through portable relative paths.
- Use `assets/vue-content-slot-components/` as the shared implementation reference for PM prototypes, AI page generation and development requirements. Its `skillVueComponent:true` status proves only that the reference exists in this Skill; inspect the target repository before claiming that project contains the component.
- Use `references/page-visual-acceptance.json` as the inherited 0825 visual-status registry; the paired requirement log contains the additional 0908 AI商品管理 and 权限管理 evidence boundaries. Store historical screenshots outside the active Skill in a dated requirement-log archive, reference that archive only by a portable logical location, and never bundle or relabel old captures as current acceptance evidence.
