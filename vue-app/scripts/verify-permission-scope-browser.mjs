import assert from 'node:assert/strict'
import { verifySourceSearch } from './permission-source-search-assertions.mjs'
import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const require = createRequire(import.meta.url)
function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE_PATH,
    'playwright',
    path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
  ].filter(Boolean)
  for (const candidate of candidates) {
    try {
      return require(candidate)
    } catch {}
  }
  throw new Error('未找到 Playwright。请安装 playwright，或通过 PLAYWRIGHT_MODULE_PATH 指定模块目录。')
}

const { chromium } = loadPlaywright()
const baseUrl = process.env.PERMISSION_QA_BASE_URL || 'http://localhost:5173/admin-vue'
const screenshots = []
const browserErrors = []
const failedResponses = []

function attachDiagnostics(page, scenario) {
  page.on('pageerror', (error) => browserErrors.push(`${scenario}: pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) browserErrors.push(scenario + ': console: ' + message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(scenario + ': ' + response.status() + ' ' + response.url())
  })
}

async function screenshot(page, name) {
  const file = path.join(os.tmpdir(), `leaibot-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  screenshots.push(file)
}

async function assertWangCopiedScope(editor) {
  await editor.getByText('复制自', { exact: false }).first().waitFor()
  assert.equal(await editor.getByText('用户级功能权限例外').count(), 0, '复制结果不得出现用户级功能权限例外')
  await editor.getByText('用户单独授权', { exact: false }).first().waitFor()
}

async function copyWang(page, editor) {
  await editor.getByRole('button', { name: '复制他人角色', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '复制他人角色' })
  await dialog.locator('input').fill('wangxt8')
  await dialog.getByRole('button', { name: '确认复制' }).click()
  await assertWangCopiedScope(editor)
}
async function verifyDataDirectorySearch(container, { toggleSelection = true } = {}) {
  const list = container.locator('.data-directory-list').first()
  await list.waitFor()
  const directories = list.locator('.data-directory')
  const directoryCount = await directories.count()
  assert.equal(directoryCount > 0, true, '数据权限必须按一级目录展示')
  assert.equal(await list.locator('.directory-search-trigger').count(), directoryCount, '每个一级目录必须有且只有一个搜索图标')
  assert.equal(await list.locator('.permission-tree-branch').count(), 0, '数据权限不得出现页面或二级菜单层')

  assert.equal(await list.locator('.data-directory-toggle[aria-expanded="true"]').count(), directoryCount, '数据权限一级目录必须默认全部展开')
  assert.equal(await list.locator('.data-directory-body').count(), directoryCount, '默认状态必须直接展示每个一级目录的数据集区域')

  let secondDirectoryCount = null
  if (directoryCount > 1) {
    secondDirectoryCount = await directories.nth(1).locator('.data-dataset-item').count()
  }

  const firstDirectory = directories.first()
  const sources = firstDirectory.locator('.data-source')
  assert.ok(await sources.count() > 0, '一级目录下必须展示第二层数据源')
  assert.equal(await firstDirectory.locator('.data-source-toggle input, .data-directory-head input').count(), 0, '前两层不得展示复选框')
  const firstSource = sources.first()
  const sourceName = await firstSource.locator('.data-source-toggle b').textContent()
  const sourceLeafCount = await firstSource.locator('.data-dataset-item').count()
  const checkedBeforeCollapse = await list.locator('input:checked').count()
  const sourceToggle = firstSource.locator('.data-source-toggle')
  await sourceToggle.focus()
  await sourceToggle.press('Enter')
  assert.equal(await firstSource.locator('.data-dataset-item').count(), 0, '第二层支持键盘收起')
  await sourceToggle.press('Space')
  assert.equal(await firstSource.locator('.data-dataset-item').count(), sourceLeafCount, '第二层支持键盘展开')
  assert.equal(await list.locator('input:checked').count(), checkedBeforeCollapse, '二级折叠不得改变勾选')
  await firstDirectory.locator('.data-directory-toggle').click()
  assert.equal(await firstDirectory.locator('.data-source').count(), 0, '一级收起必须隐藏全部子级')
  await firstDirectory.locator('.data-directory-toggle').click()
  assert.equal(await list.locator('input:checked').count(), checkedBeforeCollapse, '一级折叠不得改变勾选')
  const searchTrigger = firstDirectory.locator('.directory-search-trigger')
  await searchTrigger.click()
  const searchInput = firstDirectory.locator('.directory-search-box input')
  await searchInput.waitFor()
  assert.equal(await searchInput.evaluate((element) => element === document.activeElement), true, '点击目录搜索图标后必须自动聚焦当前目录搜索框')

  const initialDatasets = firstDirectory.locator('.data-dataset-item')
  const initialCount = await initialDatasets.count()
  assert.equal(initialCount > 0, true, '展开一级目录后必须直接展示数据集')
  const datasetNames = await initialDatasets.locator(':scope > span').allTextContents()
  assert.equal(datasetNames.some((name) => name.includes('·')), false, '数据集名称不得包含拼接前缀或后缀')

  let selectedDatasetName = ''
  if (toggleSelection) {
    const availableCheckbox = firstDirectory.locator('.data-dataset-item input[type=checkbox]:not(:disabled)').first()
    if (await availableCheckbox.count()) {
      selectedDatasetName = await availableCheckbox.locator('xpath=..').locator('span').textContent() || ''
      await availableCheckbox.check()
    }
  }

  const firstDatasetName = datasetNames[0]
  await sourceToggle.click()
  await searchInput.fill(sourceName)
  assert.equal(await sources.count(), 1, '数据源名称搜索保留匹配来源')
  assert.equal(await firstSource.locator('.data-dataset-item').count(), sourceLeafCount, '源名称匹配时展示该源全部授权项')
  await searchInput.fill('')
  assert.equal(await sourceToggle.getAttribute('aria-expanded'), 'false', '清除搜索恢复源原先折叠状态')
  await sourceToggle.click()
  await searchInput.fill(firstDatasetName)
  assert.equal(await firstDirectory.locator('.data-dataset-item').count(), 1, '目录搜索必须按当前目录数据集名称实时过滤')
  await firstDirectory.getByText(firstDatasetName, { exact: true }).waitFor()
  await searchInput.fill('不存在的数据集关键词')
  await firstDirectory.getByText('暂无匹配的数据源或授权项', { exact: true }).waitFor()
  if (secondDirectoryCount !== null) {
    assert.equal(await directories.nth(1).locator('.data-dataset-item').count(), secondDirectoryCount, '当前目录搜索不得影响其他一级目录')
  }

  await searchTrigger.click()
  assert.equal(await firstDirectory.locator('.directory-search-box').count(), 0, '关闭目录搜索后必须收起搜索框')
  assert.equal(await firstDirectory.locator('.data-dataset-item').count(), initialCount, '关闭目录搜索后必须恢复当前目录全部数据集')
  await verifySourceSearch(container)
  if (selectedDatasetName) {
    assert.equal(await firstDirectory.locator('.data-dataset-item').filter({ hasText: selectedDatasetName }).locator('input:checked').count(), 1, '搜索和关闭搜索不得丢失已选数据集')
  }
}

async function openFirstAccess(browser, viewport, suffix) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(() => localStorage.removeItem('leaibot-first-access-applications'))
  const page = await context.newPage()
  attachDiagnostics(page, `first-access-${suffix}`)
  await page.goto(`${baseUrl}/access-denied?itcode=qa-first-${suffix}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: '当前账号暂无乐享 AI 工作台访问权限' }).waitFor()
  await page.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangyi44')
  await page.getByRole('button', { name: '下一步' }).click()
  const editor = page.locator('.permission-scope-editor')
  await editor.waitFor()

  const tenantBox = await editor.locator('.tenant-field').boundingBox()
  const actionBox = await editor.locator('.scope-action-bar').boundingBox()
  assert(tenantBox && actionBox && tenantBox.y < actionBox.y, '所属租户必须位于三个操作按钮上方')
  for (const label of ['添加角色', '复制他人角色', '选择数据权限']) {
    assert.equal(await editor.getByRole('button', { name: label, exact: true }).count(), 1, `缺少固定按钮：${label}`)
  }

  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByText('请至少选择一个所属租户').waitFor()
  assert.equal(await page.getByRole('heading', { name: '确认并提交' }).count(), 0, '未选租户不应进入确认页')
  assert.equal(await editor.locator('.tenant-multi-options input').first().evaluate((element) => element === document.activeElement), true, '租户错误出现后应聚焦首个可恢复选项')

  if (suffix === '1440') {
    const addRoleButton = editor.getByRole('button', { name: '添加角色', exact: true })
    await addRoleButton.click()
    const roleDialog = page.getByRole('dialog', { name: '添加角色' })
    await roleDialog.waitFor()
    assert.equal(await roleDialog.locator('.modal-search-input').first().evaluate((element) => element === document.activeElement), true, '角色弹窗应自动聚焦搜索框')
    const functionCheckboxes = roleDialog.locator('.role-detail-drawer input[type=checkbox]')
    assert.equal(await functionCheckboxes.count() > 0, true, '角色详情必须展示角色功能权限')
    assert.equal(await roleDialog.locator('.role-detail-drawer input[type=checkbox]:not(:disabled)').count() > 0, true, '手工角色的功能权限必须可以勾选')
    const activeRoleCheckbox = roleDialog.locator('.role-picker-row.active .role-picker-check input')
    const firstFunctionCheckbox = functionCheckboxes.first()
    await firstFunctionCheckbox.check()
    assert.equal(await activeRoleCheckbox.isChecked(), true, '勾选功能权限时必须自动勾选对应角色')
    await firstFunctionCheckbox.uncheck()
    assert.equal(await activeRoleCheckbox.isChecked(), true, '取消功能权限时不得自动取消对应角色')
    await activeRoleCheckbox.uncheck()
    await roleDialog.locator('.role-picker-row').filter({ hasText: '商品运营' }).click()
    await roleDialog.getByRole('button', { name: '数据权限', exact: false }).click()
    await verifyDataDirectorySearch(roleDialog, { toggleSelection: false })
    await page.keyboard.press('Escape')
    assert.equal(await addRoleButton.evaluate((element) => element === document.activeElement), true, '关闭角色弹窗后应恢复触发按钮焦点')

    const dataButton = editor.getByRole('button', { name: '选择数据权限', exact: true })
    await dataButton.click()
    const dataDialog = page.getByRole('dialog', { name: '选择数据权限' })
    await dataDialog.waitFor()
    assert.equal(await dataDialog.locator('.directory-search-trigger').first().evaluate((element) => element === document.activeElement), true, '数据弹窗应自动聚焦首个目录搜索入口')
    await verifyDataDirectorySearch(dataDialog)
    await page.keyboard.press('Escape')
    assert.equal(await dataButton.evaluate((element) => element === document.activeElement), true, '关闭数据弹窗后应恢复触发按钮焦点')
  }

  await editor.getByRole('button', { name: '复制他人角色', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '复制他人角色' })
  await dialog.waitFor()
  await dialog.getByText('不复制租户、组织和账号资料', { exact: false }).waitFor()
  assert.equal(await dialog.locator('input').evaluate((element) => element === document.activeElement), true, '复制弹窗应自动聚焦 ITCode 输入框')
  await dialog.getByRole('button', { name: '确认复制' }).focus()
  await page.keyboard.press('Tab')
  assert.equal(await dialog.getByRole('button', { name: '关闭复制他人角色弹窗' }).evaluate((element) => element === document.activeElement), true, '复制弹窗 Tab 焦点应圈定在弹窗内')
  await dialog.locator('input').fill('wangxt8')
  await dialog.getByRole('button', { name: '确认复制' }).click()
  await assertWangCopiedScope(editor)
  assert.equal(await editor.locator('.tenant-multi-options input:checked').count(), 0, '复制角色不得带入所属租户')
  await editor.getByText('数据权限', { exact: true }).last().waitFor()

  await editor.getByRole('button', { name: '添加角色', exact: true }).click()
  const lockedRoleDialog = page.getByRole('dialog', { name: '添加角色' })
  await lockedRoleDialog.waitFor()
  const lockedRoleRow = lockedRoleDialog.locator('.role-picker-row:has(.role-picker-check input:disabled)').first()
  await lockedRoleRow.click()
  assert.equal(await lockedRoleDialog.locator('.role-detail-drawer input[type=checkbox]:disabled:checked').count() > 0, true, '复制带入角色的功能权限必须勾选并锁定')
  await page.keyboard.press('Escape')

  await editor.getByRole('button', { name: '选择数据权限', exact: true }).click()
  const lockedDataDialog = page.getByRole('dialog', { name: '选择数据权限' })
  await lockedDataDialog.waitFor()
  await verifyDataDirectorySearch(lockedDataDialog, { toggleSelection: false })
  assert.equal(await lockedDataDialog.locator('.data-dataset-item input[type=checkbox]:disabled').count() > 0, true, '复制带入数据权限必须在数据弹窗中锁定')
  await lockedDataDialog.locator('.data-dataset-item input[type=checkbox]:not(:disabled)').last().check()
  await lockedDataDialog.getByRole('button', { name: '确认', exact: true }).click()
  await editor.locator('.scope-source-panel').filter({ hasText: '本次新增' }).waitFor()

  await editor.locator('.tenant-multi-options label').nth(0).click()
  await editor.locator('.tenant-multi-options label').nth(1).click()
  assert.equal(await editor.locator('.tenant-multi-options input:checked').count(), 2, '所属租户必须支持多选')
  await editor.locator('.tenant-multi-options label').nth(1).click()
  assert.equal(await editor.locator('.tenant-multi-options input:checked').count(), 1, '所属租户必须支持取消且不产生重复')
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('heading', { name: '确认并提交' }).waitFor()
  await page.getByText('2 个角色、4 项功能权限', { exact: false }).waitFor()
  await screenshot(page, 'permission-first-access-' + suffix)
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByRole('heading', { name: '首次访问权限申请已进入审批' }).waitFor()
  await context.close()
}

async function openAgentPage(browser, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('preview_user', 'qa-admin')
  })
  const page = await context.newPage()
  attachDiagnostics(page, 'agent-permissions')
  await page.goto(`${baseUrl}/agent/permissions`, { waitUntil: 'domcontentloaded' })
  await page.locator('.permission-page-vue').waitFor()
  return { context, page }
}

async function verifyApplicationInfoForms(browser) {
  const { context, page } = await openAgentPage(browser)

  async function openInfoForm(typeLabel, personType = '') {
    const backButton = page.getByRole('button', { name: '上一步', exact: true })
    if (await backButton.isEnabled().catch(() => false)) await backButton.click()
    await page.locator('.permission-type-grid button').filter({ hasText: typeLabel }).first().click()
    await page.getByRole('button', { name: '下一步', exact: true }).click()
    const form = page.locator('.application-info-form')
    await form.waitFor()
    if (personType) await form.locator('.person-type-switch button').filter({ hasText: personType }).click()
    return form
  }

  async function assertInfoForm(form, variant, expectedFields, expectedRequiredFields) {
    if (variant === 'create' || variant.startsWith('change-')) {
      expectedFields.splice(-1, 0, 'businessApprover')
      expectedRequiredFields.splice(-1, 0, 'businessApprover')
    }
    assert.equal(await form.getAttribute('data-form-variant'), variant, `${variant} Schema 选择错误`)
    const actualFields = await form.locator('[data-info-field]').evaluateAll((elements) => elements.map((element) => element.dataset.infoField))
    assert.deepEqual(actualFields, expectedFields, `${variant} 字段或顺序不符合规范`)
    const actualRequiredFields = await form.locator('[data-info-field]').evaluateAll((elements) => elements
      .filter((element) => element.querySelector('.field-label.required'))
      .map((element) => element.dataset.infoField))
    assert.deepEqual(actualRequiredFields, expectedRequiredFields, `${variant} 必填标记不符合规范`)
    assert.equal(await form.locator('[data-info-field="applicantIdentity"] input[readonly]').count(), 1, `${variant} 申请人用户名/ITCode 必须自动只读带出`)
    assert.equal(await form.locator('[data-info-field="mobile"] .optional').count(), 1, `${variant} 手机号必须标记选填`)
    assert.equal(await form.locator('[data-info-field="email"] .optional').count(), 1, `${variant} 邮箱必须标记选填`)
  }

  let form = await openInfoForm('权限变更')
async function verifyPermissionWorkspace0825(browser) {
  const { context, page } = await openAgentPage(browser, { width: 1280, height: 800 })
  const root = page.locator('.permission-page-vue')
  const rail = root.locator('.permission-module-rail')
  const layout = root.locator('.permission-layout')

  assert.equal(await page.locator('h1').count(), 1, '权限管理全页必须只有一个 h1')
  assert.equal(await rail.getByText('7 个入口', { exact: true }).count(), 1, 'Rail 必须展示入口总数')
  assert.deepEqual(
    await rail.locator('.permission-module-group-title').evaluateAll((elements) => elements.map((element) => element.textContent?.replace(/\s+/g, ' ').trim())),
    ['流程处理2', '权限配置5'],
    'Rail 必须展示分组名称与分组数量'
  )
  assert.equal(await rail.locator('[aria-current="page"]').count(), 1, 'Rail 必须只有一个当前项')

  async function assertDesktopSplit(label) {
    const columns = (await layout.evaluate((element) => getComputedStyle(element).gridTemplateColumns)).split(' ')
    assert.equal(columns.length >= 2, true, `${label}：权限页必须保持 Rail + 工作区两列`)
    const railBox = await rail.boundingBox()
    assert(railBox && railBox.width >= 219 && railBox.width <= 301, `${label}：Rail 宽度必须保持 220–300px`)
    for (const selector of ['.permission-module-search', '.permission-module-group-title', '.permission-module-copy']) {
      const item = rail.locator(selector).first()
      assert.equal(await item.isVisible(), true, `${label}：${selector} 不得提前隐藏`)
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert.equal(overflow <= 1, true, `${label}：页面根不得产生横向溢出，当前 ${overflow}px`)
  }

  await assertDesktopSplit('1280 Agent 收起')
  const sectionHeader = root.locator('.content-section-header').first()
  const markerGeometry = await sectionHeader.locator('.content-section-header__heading').evaluate((element) => {
    const marker = getComputedStyle(element, '::before')
    const title = getComputedStyle(element.querySelector('.content-section-header__title'))
    return { width: marker.width, height: marker.height, fontSize: title.fontSize }
  })
  assert.deepEqual(markerGeometry, { width: '4px', height: '18px', fontSize: '16px' }, 'SectionHeader 几何必须符合 0825 Skill')

  const activeStyle = await rail.locator('[aria-current="page"]').evaluate((element) => {
    const style = getComputedStyle(element)
    return { borderColor: style.borderColor, backgroundColor: style.backgroundColor }
  })
  assert.notEqual(activeStyle.borderColor, 'rgba(0, 0, 0, 0)', 'Rail 当前项必须有整行描边')
  assert.notEqual(activeStyle.backgroundColor, 'rgba(0, 0, 0, 0)', 'Rail 当前项必须有浅主色背景')

  const agentButton = page.getByRole('button', { name: '打开 AI 助手', exact: true })
  if (await agentButton.count()) {
  const moduleLabels = ['权限申请', '审批列表', '角色管理', '用户管理', '组织管理', '菜单管理', '数据源管理']
  for (const label of moduleLabels) {
    await rail.getByRole('button').filter({ hasText: label }).click()
    await root.locator('.content-section-header__title').filter({ hasText: label }).waitFor()
    assert.equal(await rail.locator('[aria-current="page"]').count(), 1, `${label}：切换后必须只有一个当前项`)
  }
  await rail.getByRole('button').filter({ hasText: '权限申请' }).click()
  await root.locator('.content-section-header__title').filter({ hasText: '权限申请' }).waitFor()

    await agentButton.click()
    await page.locator('.ai-panel').waitFor().catch(() => {})
    await page.waitForTimeout(250)
    await assertDesktopSplit('1280 Agent 展开')
  }

  await screenshot(page, 'permission-workspace-0825-1280-agent')
  await context.close()
}

  await assertInfoForm(form, 'change-internal', ['applicantIdentity', 'targetItcode', 'mobile', 'email', 'applicantManager', 'targetManager', 'reason'], ['targetItcode', 'targetManager', 'reason'])
  assert.equal(await form.locator('[data-info-field="relatedAccount"]').count(), 0, '内部权限变更不得展示关联人')
  assert.equal(await form.locator('[data-info-field="targetManager"] input:not([readonly])').count(), 1, '被申请人直线经理必须可填写')

  form = await openInfoForm('权限变更', '外部人员')
  await assertInfoForm(form, 'change-external', ['applicantIdentity', 'targetUser', 'relatedAccount', 'mobile', 'email', 'applicantManager', 'reason'], ['targetUser', 'relatedAccount', 'reason'])
  assert.equal(await form.locator('[data-info-field="targetManager"]').count(), 0, '外部权限变更不得展示被申请人直线经理')

  form = await openInfoForm('创建账号')
  await verifyPermissionWorkspace0825(browser)
  await assertInfoForm(form, 'create', ['applicantIdentity', 'targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'mobile', 'email', 'applicantManager', 'reason'], ['targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'reason'])
  assert.equal(await form.locator('[data-info-field="relatedAccount"] input:not([readonly])').count(), 1, '创建账号关联人 ITCode 必须可编辑')
  await form.locator('[data-info-field="reason"] textarea').fill('')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  for (const field of ['targetUser', 'accountPassword', 'confirmAccountPassword', 'relatedAccount', 'businessApprover', 'reason']) {
    assert.equal(await form.locator(`[data-info-field="${field}"] .field-error`).count(), 1, `创建账号缺少 ${field} 时必须就近报错`)
  }
  assert.equal(await form.locator('[data-info-field="mobile"] .field-error, [data-info-field="email"] .field-error').count(), 0, '手机号和邮箱为空不得报错')
  await screenshot(page, 'permission-application-info-create-errors-1440')

  form = await openInfoForm('启用账号', '内部人员')
  await assertInfoForm(form, 'status-internal', ['applicantIdentity', 'targetItcode', 'mobile', 'email', 'reason'], ['targetItcode', 'reason'])
  assert.equal(await form.locator('[data-info-field="applicantManager"], [data-info-field="targetManager"], [data-info-field="relatedAccount"]').count(), 0, '内部启用账号不得展示关联人或直线经理')

  form = await openInfoForm('禁用账号', '外部人员')
  await assertInfoForm(form, 'status-external', ['applicantIdentity', 'targetUser', 'relatedAccount', 'mobile', 'email', 'reason'], ['targetUser', 'relatedAccount', 'reason'])
  assert.equal(await form.locator('[data-info-field="targetItcode"], [data-info-field="applicantManager"], [data-info-field="targetManager"]').count(), 0, '外部禁用账号不得展示被申请人 ITCode 或直线经理')

  const backButton = page.getByRole('button', { name: '上一步', exact: true })
  await backButton.click()
  await page.locator('.permission-type-grid button').filter({ hasText: '重置密码' }).first().click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.locator('.password-reset-form').waitFor()
  assert.equal(await page.locator('.application-info-form').count(), 0, '重置密码不得接入本次填写信息 Schema')
  await page.locator('.password-reset-form').getByText('验证方式', { exact: false }).first().waitFor()
  await context.close()

}
async function verifyPermissionChange(browser) {
  const { context, page } = await openAgentPage(browser)
  const changeCard = page.locator('.permission-type-grid button').filter({ hasText: '权限变更' }).first()
  await changeCard.click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  const target = page.locator('input[placeholder="请输入被申请人 ITCode"]')
  await target.fill('zhangrui32')
  await page.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangyi44')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  const editor = page.locator('.permission-scope-editor')
  await editor.waitFor()
  const addRoleButton = editor.getByRole('button', { name: '添加角色', exact: true })
  await addRoleButton.click()
  const roleDialog = page.getByRole('dialog', { name: '添加角色' })
  const functionCheckbox = roleDialog.locator('.role-detail-drawer input[type=checkbox]:not(:disabled)').first()
  await functionCheckbox.waitFor()
  const functionWasChecked = await functionCheckbox.isChecked()
  await functionCheckbox.setChecked(!functionWasChecked)
  assert.equal(await roleDialog.locator('.role-picker-row.active .role-picker-check input').isChecked(), true, '系统内权限变更勾选或取消功能后必须保留对应角色')
  await functionCheckbox.setChecked(functionWasChecked)
  await roleDialog.locator('.modal-search-input').first().fill('不存在的角色')
  await page.keyboard.press('Escape')
  await editor.getByRole('button', { name: '复制他人角色', exact: true }).click()
  const copyDialog = page.getByRole('dialog', { name: '复制他人角色' })
  await copyDialog.locator('input').fill('wangxt8')
  await page.keyboard.press('Escape')
  await editor.getByRole('button', { name: '选择数据权限', exact: true }).click()
  const dataDialog = page.getByRole('dialog', { name: '选择数据权限' })
  await dataDialog.locator('.directory-search-trigger').first().click()
  await dataDialog.locator('.directory-search-box input').fill('不存在的数据权限')
  await dataDialog.getByText('暂无匹配的数据源或授权项', { exact: true }).waitFor()
  await dataDialog.getByRole('button', { name: '关闭', exact: true }).click()
  assert.equal(await editor.locator('.tenant-multi-options input:checked').count() > 0, true, '权限变更应带出当前租户基线')
  const tenantBox = await editor.locator('.tenant-field').boundingBox()
  const actionBox = await editor.locator('.scope-action-bar').boundingBox()
  assert(tenantBox && actionBox && tenantBox.y < actionBox.y, '系统权限范围页所属租户顺序错误')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByText('未检测到权限变更，请返回权限范围调整所属租户、角色或数据权限后再提交。').waitFor()
  await screenshot(page, 'permission-change-no-diff-1440')
  await context.close()
}

async function verifyCreateAccount(browser) {
  const { context, page } = await openAgentPage(browser, { width: 1280, height: 800 })
  const createCard = page.locator('.permission-type-grid button').filter({ hasText: '创建账号' }).first()
  await createCard.click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.locator('input[placeholder="请输入外部协作人员用户名"]').fill('qa-external-user')
  await page.locator('input[placeholder="请设置初始登录密码"]').fill('Qa-password-123')
  await page.locator('input[placeholder="请再次输入初始密码"]').fill('Qa-password-123')
  await page.locator('input[placeholder="请输入负责对接的内部员工 ITCode"]').fill('qa-owner')
  await page.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangyi44')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  const editor = page.locator('.permission-scope-editor')
  await editor.waitFor()
  assert.equal(await editor.locator('.tenant-multi-options input:checked').count(), 0, '创建账号不应继承上一场景租户')
  await copyWang(page, editor)
  assert.equal(await editor.locator('.tenant-multi-options input:checked').count(), 0, '创建账号复制角色不得带入所属租户')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByText('请至少选择一个所属租户').waitFor()
  await editor.locator('.tenant-multi-options label').nth(1).click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByText('将提交的申请').waitFor()
  await page.getByText('2 个角色、4 项功能权限', { exact: false }).waitFor()
  await screenshot(page, 'permission-create-copy-1280')
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByText('已受理。', { exact: false }).waitFor()
  await context.close()
}

async function verifyApprovalPermissionSubmodalLayers(browser) {
  const { context, page } = await openAgentPage(browser)

  async function selectDemoIdentity(label) {
    await page.locator('.demo-reset-trigger').click()
    await page.locator('.demo-reset-options').getByRole('button', { name: label, exact: true }).click()
    await page.getByRole('heading', { name: '审批列表', exact: true }).waitFor()
  }

  const ticket = 'AP-20260713-001'
  await selectDemoIdentity('关联人')
  let row = page.locator('.permission-table tbody tr').filter({ hasText: ticket }).first()
  await row.getByRole('button', { name: '审批', exact: true }).click()
  let approvalDialog = page.locator('.approval-workspace-modal')
  await approvalDialog.waitFor()
  await approvalDialog.locator('.approval-result-options button').first().click()
  await approvalDialog.getByRole('button', { name: '提交审批', exact: true }).click()
  await approvalDialog.waitFor({ state: 'hidden' })

  await selectDemoIdentity('申请人直线经理')
  row = page.locator('.permission-table tbody tr').filter({ hasText: ticket }).first()
  await row.getByRole('button', { name: '审批', exact: true }).click()
  approvalDialog = page.locator('.approval-workspace-modal')
  await approvalDialog.waitFor()
  const approvalLayer = page.locator('.permission-modal:has(> .approval-workspace-modal)')

  async function verifySubmodal(triggerName, dialogName, screenshotName = '') {
    const trigger = approvalDialog.getByRole('button', { name: triggerName, exact: true }).first()
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    const childDialog = page.getByRole('dialog', { name: dialogName, exact: true })
    await childDialog.waitFor()
    const childLayer = page.locator('.permission-scope-submodal-layer:has(> [role="dialog"])')
    const childZIndex = Number(await childLayer.evaluate((element) => getComputedStyle(element).zIndex))
    const approvalZIndex = Number(await approvalLayer.evaluate((element) => getComputedStyle(element).zIndex))
    assert.equal(childZIndex > approvalZIndex, true, `${triggerName}弹窗层级必须高于审批弹窗`)
    assert.equal(await childLayer.evaluate((element) => element.contains(document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2))), true, `${triggerName}弹窗必须命中视口最上层`)
    assert.equal(await childDialog.evaluate((element) => element.contains(document.activeElement)), true, `${triggerName}弹窗打开后焦点必须进入当前子弹窗`)
    assert.equal(await approvalDialog.isVisible(), true, `${triggerName}弹窗打开时审批弹窗必须保留在背景层`)
    if (screenshotName) await screenshot(page, screenshotName)
    await page.keyboard.press('Escape')
    await childDialog.waitFor({ state: 'hidden' })
    assert.equal(await approvalDialog.isVisible(), true, `关闭${triggerName}弹窗不得关闭审批弹窗`)
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true, `关闭${triggerName}弹窗后必须恢复触发按钮焦点`)
  }

  await verifySubmodal('添加角色', '添加角色')
  await verifySubmodal('复制他人角色', '复制他人角色')
  await verifySubmodal('选择数据权限', '选择数据权限', 'permission-approval-nested-data-modal-1440')
  await approvalDialog.locator('.modal-close').click()
  await context.close()
}
async function verifyRoleManagementDataDirectories(browser) {
  const { context, page } = await openAgentPage(browser)
  await page.locator('.permission-module-rail').getByRole('button').filter({ hasText: '角色管理' }).click()
  await page.getByRole('heading', { name: '角色管理', exact: true }).waitFor()

  await page.getByRole('button', { name: '新增角色', exact: true }).click()
  let roleEditor = page.locator('.role-editor-modal')
  await roleEditor.getByRole('heading', { name: '新增角色', exact: true }).waitFor()
  await roleEditor.getByRole('button', { name: '数据权限', exact: true }).click()
  await verifyDataDirectorySearch(roleEditor)
  await roleEditor.locator('.modal-close').click()

  const firstRoleRow = page.locator('.role-management-table tbody tr').filter({ hasText: '商品运营' }).first()
  await firstRoleRow.getByRole('button', { name: '编辑', exact: true }).click()
  roleEditor = page.locator('.role-editor-modal')
  await roleEditor.getByRole('heading', { name: /编辑角色/ }).waitFor()
  await roleEditor.getByRole('button', { name: '数据权限', exact: true }).click()
  await verifyDataDirectorySearch(roleEditor)
  await roleEditor.locator('.modal-close').click()

  await firstRoleRow.getByRole('button', { name: '查看', exact: true }).click()
  roleEditor = page.locator('.role-editor-modal')
  await roleEditor.getByRole('heading', { name: /查看角色/ }).waitFor()
  await roleEditor.getByRole('button', { name: '数据权限', exact: true }).click()
  const firstDirectory = roleEditor.locator('.data-directory').first()
  assert.equal(await firstDirectory.locator('.data-directory-toggle').getAttribute('aria-expanded'), 'true', '角色只读详情的数据目录必须默认展开')
  const visibleCheckboxes = firstDirectory.locator('.data-dataset-item input[type=checkbox]')
  assert.equal(await visibleCheckboxes.count() > 0, true, '角色只读详情必须展示一级目录下的数据集')
  assert.equal(await firstDirectory.locator('.data-dataset-item input[type=checkbox]:not(:disabled)').count(), 0, '角色只读详情中的数据集必须保持只读')
  await screenshot(page, 'permission-role-management-data-directories-1440')
  await roleEditor.locator('.modal-close').click()
  await context.close()
}

async function verifyEffectiveChange(browser, kind) {
  const { context, page } = await openAgentPage(browser)
  await page.locator('.permission-type-grid button').filter({ hasText: '权限变更' }).first().click()
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByPlaceholder('请输入被申请人 ITCode').fill('zhangrui32')
  await page.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangyi44')
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  const editor = page.locator('.permission-scope-editor')
  await editor.waitFor()
  if (kind === 'tenant') {
    await editor.locator('.tenant-multi-options label:not(.selected)').first().click()
  } else if (kind === 'role') {
    await editor.getByRole('button', { name: '添加角色', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: '添加角色' })
    await dialog.locator('.role-picker-row').filter({ hasText: '外包协作' }).locator('input[type=checkbox]').check()
    await dialog.getByRole('button', { name: '确认', exact: true }).click()
  } else if (kind === 'data') {
    await editor.getByRole('button', { name: '选择数据权限', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: '选择数据权限' })
    const leadDirectory = dialog.locator('.data-directory').filter({ hasText: '企业客户管理' })
    assert.equal(await leadDirectory.locator('.data-directory-toggle').getAttribute('aria-expanded'), 'true', '数据权限变更时一级目录必须默认展开')
    await leadDirectory.locator('.data-dataset-item').filter({ hasText: '全部线索' }).locator('input[type=checkbox]').check()
    await dialog.getByRole('button', { name: '确认', exact: true }).click()
  } else if (kind === 'copy') {
    await copyWang(page, editor)
  }
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  if (kind === 'copy') await page.getByText('2 个角色、4 项功能权限', { exact: false }).waitFor()
  await page.getByRole('button', { name: '提交申请', exact: true }).click()
  await page.getByText('已受理。', { exact: false }).waitFor()
  assert.equal(await page.getByText('未检测到权限变更', { exact: false }).count(), 0, kind + ' 的有效变化不应被误判为无变化')
  await context.close()
}

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) })
try {
  await openFirstAccess(browser, { width: 1440, height: 900 }, '1440')
  await openFirstAccess(browser, { width: 1280, height: 800 }, '1280')
  await openFirstAccess(browser, { width: 390, height: 844 }, '390')
  await verifyApplicationInfoForms(browser)
  await verifyPermissionChange(browser)
  await verifyCreateAccount(browser)
  await verifyApprovalPermissionSubmodalLayers(browser)
  await verifyRoleManagementDataDirectories(browser)
  await verifyEffectiveChange(browser, 'tenant')
  await verifyEffectiveChange(browser, 'role')
  await verifyEffectiveChange(browser, 'data')
  await verifyEffectiveChange(browser, 'copy')
  const unexpectedResponses = failedResponses.filter((item) => !item.includes('/api/admin/me'))
  assert.deepEqual(unexpectedResponses, [], '存在非鉴权探测请求失败：' + unexpectedResponses.join(' | '))
  assert.deepEqual(browserErrors, [], `浏览器控制台存在错误：\n${browserErrors.join('\n')}`)
  console.log(JSON.stringify({ ok: true, screenshots, browserErrors, failedResponses }, null, 2))
} finally {
  await browser.close()
}
