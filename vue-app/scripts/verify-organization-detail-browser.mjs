import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright')
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const output = process.env.PERMISSION_QA_OUTPUT || path.join(os.tmpdir(), 'organization-detail-qa')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const errors = []
const measurements = []

async function open(viewport) {
  const context = await browser.newContext({ viewport })
  await context.route('**/api/admin/me', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${base}/agent/permissions?module=orgs`)
  await page.locator('.org-workspace-card').waitFor()
  return { context, page }
}
const detail = page => page.locator('.org-detail-modal')
const editor = page => page.locator('.org-editor-modal')
const nameInput = page => editor(page).locator('label').filter({ hasText: '组织名称' }).locator('input')
async function openCurrent(page) {
  await page.locator('.current-card .org-chart-detail-btn').click()
  await detail(page).waitFor()
}
async function state(page) {
  // Read the real page's reactive data; all mutations below use visible controls.
  return page.locator('.permission-page-vue').evaluate(element => JSON.parse(JSON.stringify(element.__vueParentComponent.setupState.organizations)))
}
async function geometry(page, label) {
  // The overflow directive applies the footer layout on an animation frame.
  await page.waitForFunction(() => {
    const panel = document.querySelector('.org-detail-modal')
    const footer = panel?.querySelector('.modal-actions')
    if (!panel || !footer) return false
    const r = panel.getBoundingClientRect()
    return r.left >= 0 && r.right <= innerWidth + 1
      && r.top >= 0 && r.bottom <= innerHeight + 1
      && footer.getBoundingClientRect().bottom <= r.bottom + 1
      && panel.scrollWidth - panel.clientWidth <= 1
      && document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1
  }, null, { timeout: 3000, polling: 'raf' })
  const result = await detail(page).evaluate(panel => {
    const r = panel.getBoundingClientRect()
    const footer = panel.querySelector('.modal-actions').getBoundingClientRect()
    return { viewport: [innerWidth, innerHeight], left: r.left, right: r.right, top: r.top, bottom: r.bottom, footerBottom: footer.bottom, panelOverflow: panel.scrollWidth - panel.clientWidth, pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
  })
  assert.ok(result.left >= 0 && result.right <= result.viewport[0] + 1)
  assert.ok(result.top >= 0 && result.bottom <= result.viewport[1] + 1)
  assert.ok(result.footerBottom <= result.bottom + 1)
  assert.ok(result.panelOverflow <= 1 && result.pageOverflow <= 1)
  measurements.push({ label, ...result })
  await page.screenshot({ path: path.join(output, `${label}.png`) })
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }]) {
    const { context, page } = await open(viewport)
    await openCurrent(page)
    assert.equal(await detail(page).getAttribute('aria-modal'), 'true')
    await detail(page).getByRole('heading', { name: '联想乐享', exact: true }).waitFor()
    assert.equal(await detail(page).locator('tbody tr').count(), 3)
    await geometry(page, `detail-${viewport.width}`)
    await detail(page).getByRole('button', { name: '移除组织', exact: true }).click()
    await detail(page).getByRole('status').filter({ hasText: '根组织不能移除。' }).waitFor()
    await detail(page).getByRole('button', { name: '编辑信息', exact: true }).focus()
    await page.keyboard.press('Tab')
    assert.equal(await detail(page).getByRole('button', { name: '关闭组织详情' }).evaluate(el => el === document.activeElement), true)
    await page.keyboard.press('Escape')
    await detail(page).waitFor({ state: 'detached' })
    assert.equal(await page.locator('.current-card .org-chart-detail-btn').evaluate(el => el === document.activeElement), true)
    await context.close()
  }

  const { context, page } = await open({ width: 1440, height: 900 })
  await page.locator('.child-card').filter({ hasText: '乐享运营' }).getByRole('button', { name: '详情', exact: true }).click()
  await detail(page).getByRole('button', { name: '移除组织', exact: true }).click()
  await detail(page).getByRole('status').filter({ hasText: '该组织下还有下级组织' }).waitFor()
  await page.keyboard.press('Escape')
  await page.locator('.child-card').filter({ hasText: '商城运营' }).getByRole('button', { name: '详情', exact: true }).click()
  const before = await state(page)
  await detail(page).getByRole('button', { name: '编辑信息', exact: true }).click()
  await editor(page).waitFor()
  assert.equal(await editor(page).locator('label').filter({ hasText: '上级组织' }).count(), 0, 'edit must not render parent organization field')
  assert.equal(await nameInput(page).inputValue(), '商城运营')
  assert.equal(await editor(page).locator('input[readonly]').inputValue(), 'OPS-MALL')
  await nameInput(page).fill('不应保存的名称')
  await editor(page).getByRole('button', { name: '取消', exact: true }).click()
  assert.deepEqual(await state(page), before, 'cancel must not mutate organization data')
  await detail(page).getByRole('heading', { name: '商城运营', exact: true }).waitFor()
  await detail(page).getByRole('button', { name: '编辑信息', exact: true }).click()
  await nameInput(page).fill('')
  await editor(page).getByRole('button', { name: '保存', exact: true }).click()
  await editor(page).getByText('请填写组织名称。', { exact: true }).waitFor()
  await nameInput(page).fill('商城运营（恢复验证）')
  await editor(page).getByRole('button', { name: '保存', exact: true }).click()
  await editor(page).waitFor({ state: 'detached' })
  await detail(page).getByRole('heading', { name: '商城运营（恢复验证）', exact: true }).waitFor()
  const edited = await state(page)
  assert.deepEqual(edited[0].children.slice(1), before[0].children.slice(1), 'editing cannot mutate sibling organizations')
  assert.deepEqual(edited[0].children[0].children[0].members, before[0].children[0].children[0].members)

  page.once('dialog', async dialog => { assert.match(dialog.message(), /组织下成员也会从当前 POC 中移除/); await dialog.dismiss() })
  await detail(page).getByRole('button', { name: '移除组织', exact: true }).click()
  assert.deepEqual(await state(page), edited, 'cancel deletion must keep all data')
  page.once('dialog', dialog => dialog.accept())
  await detail(page).getByRole('button', { name: '移除组织', exact: true }).click()
  await detail(page).waitFor({ state: 'detached' })
  assert.equal((await state(page))[0].children[0].children.some(org => org.id === 'ops-mall'), false)
  assert.equal(await page.locator('.current-card .org-chart-detail-btn').evaluate(el => el === document.activeElement), true, 'deleted-node focus returns to parent')
  await page.locator('.current-card').getByText('乐享运营', { exact: true }).waitFor()

  await page.locator('.add-card').click()
  assert.equal(await editor(page).locator('label').filter({ hasText: '创建人' }).count(), 0, 'creation must not render creator field')
  assert.equal(await editor(page).locator('label').filter({ hasText: 'Code' }).count(), 0, 'creation must not render code field')
  const parentSelect = editor(page).locator('label').filter({ hasText: '上级组织' }).locator('select')
  assert.equal(await parentSelect.isEnabled(), true, 'creation must retain parent selection')
  assert.ok(await parentSelect.locator('option').count() > 1)
  await nameInput(page).fill('空组织验证')
  await editor(page).getByRole('button', { name: '保存', exact: true }).click()
  await editor(page).waitFor({ state: 'detached' })
  await openCurrent(page)
  await detail(page).getByText('当前组织还没有成员', { exact: true }).waitFor()
  await geometry(page, 'empty-detail')
  await page.locator('.organization-dialog-root > .permission-modal').click({ position: { x: 2, y: 2 } })
  await detail(page).waitFor({ state: 'detached' })
  await context.close()
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'passed', measurements, screenshots: output, errors }, null, 2))
} finally {
  await browser.close()
}
