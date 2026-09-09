# 无页面 Skill 能力上下文设计

日期：2026-09-03
状态：用户已确认，书面规格复核通过
目标页面：`agent.skillCreate` / `/agent/skill-create`
页面合同：T4 业务表单 + V2 多步流程 + E3/E4 专项边界

## 1. 目标

让 PM 在创建 Skill 时能够选择只有接口能力、没有左侧导航和业务页面的业务场景。本期以“私人订制 / 私定 TOP 榜单”为首个实例：

- 一级菜单：`私人订制`
- 上下文能力：`私定 TOP 榜单`
- 上下文描述：`用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整`

用户选择“私人订制”后，“私定 TOP 榜单”作为推荐能力稳定排在能力目录前部，但不会自动勾选；用户仍需主动选择。

## 2. 已确认边界

- “私人订制”只出现在 Skill 创建页的“菜单”选项和能力目录业务域中。
- 不把“私人订制”加入工作台左侧导航。
- 不新增“私人订制”或“私定 TOP 榜单”页面、路由、页签或页面占位符。
- 不给接口能力伪造 `path`、页面 ID 或隐藏页面。
- 不改变现有五步流程、评分门槛、保存/提审、Skill Hub、权限管理或右侧 Agent 行为。
- 不改变“推荐不等于默认选中”的现有交互合同。
- 不改变现有跨业务域选择能力的行为。
- 本期只登记并选择已有接口能力，不负责实现或调用该业务接口。
- 本次只更新 `new` 预览；正式环境、GitLab 和 GitHub 不在本次发布范围内。若预览服务器需要接收代码，只使用其 Git 分支/工作区链路，不使用文件上传。

## 3. 基线与问题

当前 Skill 创建页直接把 `MENU_TREE` 的每个 `children` 页面摊平成能力卡，同时用同一组一级菜单生成“菜单”下拉和业务域筛选。因此，没有页面节点的接口能力无法进入候选目录。

该实现还把用户文案和草稿字段限定为“页面能力”“子菜单上下文”和 `context_pages`，与能力上下文可以来自接口、工具、数据或知识的产品定义不一致。

## 4. 方案比较与决策

### 方案 A：独立的无页面能力目录（采用）

在 Skill 创建领域内增加一份结构化的无页面能力目录，与现有 `MENU_TREE` 页面能力在选择器入口处合并。导航继续只读取 `MENU_TREE`。

优点：导航与能力语义分离；没有虚假页面；可继续增加 API、Tool、数据或知识类能力；现有页面能力不回归。

### 方案 B：向 `MENU_TREE` 加隐藏页面（不采用）

给接口能力伪造 `children` 和 `path`，再在侧栏和路由层过滤。

不采用原因：会污染导航、路由和权限模型，也会让“无页面能力”再次依赖页面结构。

### 方案 C：只在创建页硬编码一个下拉项和卡片（不采用）

不采用原因：虽然改动最小，但数据会散落在多个映射中，后续每增加一个无页面能力都需要重复修改页面逻辑。

## 5. 数据合同

新增领域数据模块，记录不依赖页面的能力分组。每项至少包含：

| 字段 | 本期值 | 说明 |
| --- | --- | --- |
| `groupId` | `private-customization` | 稳定业务域标识 |
| `groupLabel` | `私人订制` | Skill 创建页展示的一级菜单/业务域 |
| `contextId` | `customization.top-ranking` | 草稿保存、恢复和 AI 上下文使用的稳定能力 ID |
| `name` | `私定 TOP 榜单` | 能力卡标题 |
| `description` | 用户给定原文 | 能力卡副标题和搜索内容 |
| `sourceType` | `api` | 明确它是接口能力，而非页面能力 |

该记录没有 `path` 或 route。领域模块提供纯函数：

- 返回无页面业务域标签。
- 按当前所属菜单生成无页面能力卡数据。
- 当前菜单与能力业务域一致时设置 `recommended: true`，不设置 `selected: true`。

现有 `selectedContextCodes` 继续保存稳定 `contextId`，不修改草稿存储结构；因此保存、恢复、编辑和提审链路可以复用。

## 6. 页面数据流

```text
MENU_TREE 页面菜单 ─┐
                   ├─ 合并菜单标签 ─ “菜单”下拉 / 业务域筛选
无页面能力目录 ─────┘

MENU_TREE 子页面 ───┐
                   ├─ 合并能力项 ─ 搜索/筛选/推荐排序 ─ 用户勾选
无页面接口能力 ─────┘
                                              │
                                              ├─ 需求澄清 AI 上下文
                                              ├─ 草稿能力清单
                                              └─ selectedContextCodes 保存与恢复
```

现有能力更新流程在合并后的基础目录上继续叠加 `affectedContexts` 和 `optionalContexts`；相同 `contextId` 仍需去重。

## 7. 文案调整

为避免继续把能力限定为页面或子菜单，本期仅修改 Skill 创建页中直接受影响的文案：

- `已选子菜单上下文` → `已选能力上下文`
- `当前工作台已有菜单和子菜单` → `当前工作台已登记的菜单和能力上下文`
- `页面能力` → 在表达依赖来源时改为 `页面或接口能力`
- 草稿 YAML 的 `context_pages` → `context_capabilities`
- “检查权限与依赖”快捷提示中的 `依赖页面` → `依赖能力`
- 过程状态中的 `调用页面能力` → `调用上下文能力`

不修改用户给出的上下文描述，不额外补写接口路径、权限点、输入字段或执行结果。

## 8. UI、状态与可访问性

- 复用现有 Skill 创建能力上下文选择器，不新增组件、布局或样式。
- 保留搜索、业务域筛选、只看已选、卡片 Tooltip、`aria-pressed`、推荐排序和已选移除行为。
- 新能力卡使用现有默认、Hover、Focus、推荐和选中状态。
- 初始状态仍为空；选择“私人订制”只推荐，不自动勾选。
- 搜索可命中 `私人订制`、`私定 TOP 榜单`、上下文描述和能力 ID。
- 因没有新增异步请求，本期不增加加载、错误或权限状态；沿用选择器现有空结果状态。
- 不改页面尺寸、滚动、响应式断点或固定底部流程操作。

## 9. 文件职责

- 新增 `vue-app/src/domain/skillContextCatalog.js`
  - 只保存无页面能力目录与纯数据转换函数。
- 修改 `vue-app/src/views/agent/AgentSkillCreateView.vue`
  - 合并页面菜单与无页面业务域。
  - 合并页面能力与无页面接口能力。
  - 更新直接受影响的能力上下文文案。
  - API 资源统计由 `13` 增加为 `14`。
- 新增 `vue-app/scripts/skill-context-catalog.test.mjs`
  - 对领域模块进行真实行为测试，并校验页面没有新增导航/路由依赖。
- 修改 `vue-app/src/components/shell/sidebar/WorkbenchSidebar.vue`
  - 新增一条聚合的 POC 调整记录；不改侧栏菜单结构。

不修改 `vue-app/src/stores/app.ts`、`vue-app/src/router/index.ts`、权限管理文件或 `admin-runtime`。

## 10. 测试与验收

先写失败测试并确认失败原因是功能尚未存在，再实现最小代码。

聚焦验收：

1. 目录包含 `私人订制 / 私定 TOP 榜单`，且描述与用户原文一致。
2. 记录的 `sourceType` 是 `api`，不包含 `path`。
3. 当前菜单为“私人订制”时能力标记为推荐但未选中。
4. 页面菜单标签包含“私人订制”，现有菜单顺序和名称不变。
5. 页面能力与无页面接口能力同时进入搜索、筛选和草稿保存链路。
6. `MENU_TREE`、侧栏和路由中不存在“私人订制”或该能力的伪页面。
7. 草稿使用 `context_capabilities`，澄清提示使用“能力上下文”口径。
8. 保存草稿后可按 `customization.top-ranking` 恢复选中状态。
9. 现有能力更新上下文、推荐排序和不自动勾选逻辑保持不变。

工程验证：

```text
node skill/portal-workbench-ui-0818/scripts/check-consistency.mjs --project vue-app --changed-file src/views/agent/AgentSkillCreateView.vue --changed-file src/components/shell/sidebar/WorkbenchSidebar.vue
node --test scripts/skill-context-catalog.test.mjs
node --test scripts/*.test.mjs
pnpm guard:design-skill
pnpm lint
pnpm typecheck
git diff --check
```

0818 changed-file Guard 的 raw 命令必须运行，不能因既有债务跳过或宣称 raw Guard 通过。若 raw Guard 失败，只有在 `origin/main` 的 detached 基线 worktree 运行完全相同命令后得到逐条相同的违规签名和数量，并且本次 `AgentSkillCreateView.vue` 差异未触及 `<style>` 区时，才可记录为“raw guard FAIL, delta 0 inherited debt”并继续其余工程验证；任何新增违规、签名差异或样式区差异均阻断验证。

`vite.config.js` 的默认输出目录是受 Git 管理的 `public/admin-vue`，且启用 `emptyOutDir`。因此默认 `pnpm build` 与 `pnpm smoke:shell` 只在从待发布提交创建的临时验证 worktree 中执行；实现 worktree 和服务器共享 checkout 均不直接运行默认构建。

运行时验收：

- 打开 `new` 的 `/admin-vue/agent/skill-create`。
- 确认菜单下拉包含“私人订制”。
- 选择后确认“私定 TOP 榜单”显示“推荐”且未自动选中。
- 确认卡片副标题/Tooltip 完整显示用户给定描述。
- 勾选能力后进入需求澄清，确认已选能力上下文包含该能力。
- 确认左侧导航没有新增“私人订制”。
- 检查浏览器控制台无项目错误。

## 11. 发布与保护

- 先核对最新 GitLab `main` 与当前已部署的服务器 Git 基线；若服务器基线是其后续提交，必须把本次窄改动重放到该已部署基线后再验证和构建，避免预览回退已上线功能。只读取得基线，不修改正式仓。服务器构建必须显式输出到仓库外的新临时目录，不得让默认 `emptyOutDir` 清空共享工作区的 `public/admin-vue`。
- 构建产物只发布到 `new`。
- 发布前备份 `new` 的 `public/admin-vue`。
- 使用非删除式同步，保护整个 `admin-runtime`；至少核对 `workbench-geo.js` 和 `workbench-pages.js` 发布前后指纹。
- 使用 release key `pageless-skill-context-20260903` 记录 `new` 的发布账号、北京时间和 Git 版本。
- 写发布台账时两个输出参数必须同时指向 `new` 的同一台账文件，禁止脚本默认写入正式环境的台账副本。
- 不记录 formal 发布证据，不改正式环境。
- 预览服务器若需要接收本次提交，只能使用 Git 分支和个人工作区完成，并单独报告分支、提交与合并状态；不得触发正式仓库的自动合并。
- GitLab/GitHub 是否同步必须单独报告；本次不因更新 `new` 而宣称 GitLab 或 GitHub 已更新。

## 12. 回滚

如 `new` 验收失败，使用本次发布前生成的 `new public/admin-vue` 备份恢复；恢复时继续排除/保护 `admin-runtime`，并复核两个受保护运行文件指纹。正式环境无需回滚，因为本次不修改正式环境。
