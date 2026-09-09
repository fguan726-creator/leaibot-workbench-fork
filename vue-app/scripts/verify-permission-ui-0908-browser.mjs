import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
let playwright
for (const candidate of [process.env.PLAYWRIGHT_MODULE_PATH, 'playwright', path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')].filter(Boolean)) {
  try { playwright = require(candidate); break } catch { /* Try the configured runtime next. */ }
}
if (!playwright) throw new Error('Playwright unavailable')
const base = process.env.PERMISSION_QA_BASE_URL || 'http://127.0.0.1:5174/admin-vue'
const browser = await playwright.chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => { localStorage.clear(); localStorage.setItem('preview_user', 'qa-admin') })
const page = await context.newPage()
const errors = [], measurements = [], screenshots = []
page.on('pageerror', error => errors.push(error.message))
async function capture(name) {
  const file = path.join(os.tmpdir(), `permission-ui0908-${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  screenshots.push(file)
}
async function headerMetrics() {
  return page.locator('.content-page-header').first().evaluate(header => {
    const title = header.querySelector('h1'), description = header.querySelector('p')
    const t = getComputedStyle(title), d = getComputedStyle(description), marker = getComputedStyle(title, '::before')
    return { title: [t.fontSize, t.fontWeight, t.lineHeight], description: [d.fontSize, d.lineHeight], marker: [marker.width, marker.height], width: header.getBoundingClientRect().width }
  })
}
async function layoutMetrics(label) {
  const m = await page.locator('.permission-page-vue').evaluate(root => {
    const rect = node => node.getBoundingClientRect()
    const header = root.querySelector('.content-page-header'), layout = root.querySelector('.permission-layout')
    const rail = root.querySelector('.permission-module-rail'), main = root.querySelector('.permission-workspace')
    return { viewport: innerWidth, contentInnerWidth: rect(root).width, sidebar: document.querySelector('.sidebar')?.getBoundingClientRect().width, agent: document.querySelector('.ai-panel')?.getBoundingClientRect().width || 0,
      gap: rect(layout).top - rect(header).bottom, rail: rect(rail).width, columnGap: rect(main).left - rect(rail).right,
      overflow: root.scrollWidth - root.clientWidth, pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      h1: root.querySelectorAll('h1').length, selected: rail.querySelectorAll('[aria-current="page"]').length }
  })
  assert.equal(m.h1, 1)
  assert.equal(m.selected, 1)
  assert.ok(Math.abs(m.gap - 16) <= 1, `${label}: header gap ${m.gap}`)
  assert.ok(m.rail >= 219 && m.rail <= 301, `${label}: rail ${m.rail}`)
  assert.ok(Math.abs(m.columnGap - 16) <= 1, `${label}: column gap ${m.columnGap}`)
  assert.ok(m.overflow <= 1 && m.pageOverflow <= 1, `${label}: ${JSON.stringify(m)}`)
  measurements.push({ label, ...m })
}
async function footerState(modal, expected) {
  const footer = modal.locator(':scope > .modal-actions')
  await page.waitForFunction(({ selector, expected }) => document.querySelector(selector)?.dataset.scrollState === expected, { selector: await modal.evaluate(el => `#${el.id || (el.id = 'ui0908-dialog') } > .modal-actions`), expected })
  const state = await footer.evaluate(el => ({ state: el.dataset.scrollState, position: getComputedStyle(el).position, shadow: getComputedStyle(el).boxShadow, align: getComputedStyle(el).justifyContent }))
  assert.equal(state.state, expected)
  assert.equal(state.align, 'flex-end')
  assert.equal(state.position, expected === 'static' ? 'static' : 'sticky')
  assert.equal(state.shadow === 'none', expected !== 'more')
  const box = await footer.boundingBox()
  assert.ok(box && box.y + box.height <= page.viewportSize().height + 1, 'Footer must remain reachable')
  measurements.push({ label: 'footer', ...state })
}
try {
  await page.goto(`${base}/agent/skills`)
  await page.locator('.content-page-header').waitFor()
  const acceptedHeader = await headerMetrics()
  await page.goto(`${base}/agent/permissions`)
  await page.locator('.permission-module-rail').waitFor()
  const permissionHeader = await headerMetrics()
  assert.deepEqual(permissionHeader, acceptedHeader, 'Same-width header must reuse the accepted component geometry')
  for (const width of [1440, 1280]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 800 })
    const modules = ['权限申请', '审批列表', '角色管理', '用户管理', '组织管理', '数据源管理', '菜单管理']
    for (const name of modules) {
      await page.locator('.permission-module-rail .permission-module-list button').filter({ hasText: name }).click()
      await layoutMetrics(`${width} ${name}`)
    }
    await capture(`${width}-modules`)
  }
  await page.getByRole('button', { name: '打开 AI 助手', exact: true }).click()
  await page.waitForTimeout(350)
  await layoutMetrics('1280 Agent default')
  const handle = await page.locator('#ai-resize-handle').boundingBox()
  assert.ok(handle)
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 80)
  await page.mouse.down()
  await page.mouse.move(handle.x - 112, handle.y + 80, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  await layoutMetrics('1280 Agent expanded')
  await capture('1280-agent-expanded')

  await page.goto(`${base}/access-denied?itcode=ui0908-qa`)
  await page.getByRole('combobox', { name: '业务负责人', exact: true }).selectOption('zhangyi44')
  const controls = await page.locator('.form-grid input, .business-approver-field select').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node)
    return { height: node.getBoundingClientRect().height, font: style.fontSize, background: style.backgroundColor }
  }))
  for (const control of controls) {
    assert.equal(control.height, 36, 'First-access controls must use 36px height')
    assert.equal(control.font, '13px')
    assert.equal(control.background, 'rgb(255, 255, 255)')
  }
  await page.getByRole('button', { name: '下一步', exact: true }).click()
  await page.getByRole('button', { name: '复制他人角色', exact: true }).click()
  const copy = page.locator('.permission-scope-picker-modal .modal-panel')
  await footerState(copy, 'static')
  await capture('copy-short')
  await page.setViewportSize({ width: 1280, height: 320 })
  await footerState(copy, 'more')
  await capture('copy-overflow')
  await copy.evaluate(el => { el.scrollTop = el.scrollHeight })
  await footerState(copy, 'end')
  await page.setViewportSize({ width: 1280, height: 800 })
  await footerState(copy, 'static')
  await copy.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: '添加角色', exact: true }).click()
  const role = page.locator('.role-picker-modal')
  await role.locator('.role-picker-row').filter({ hasText: '商品运营' }).getByRole('button', { name: '查看详情', exact: true }).click()
  await role.getByRole('button', { name: '数据权限', exact: false }).click()
  await role.locator('.source-search-trigger').first().click()
  await role.locator('.source-search-box input').first().fill('华')
  const searchStyle = await role.locator('.source-search-box input').first().evaluate(el => {
    const input = getComputedStyle(el), wrapper = getComputedStyle(el.parentElement)
    return { border: input.borderTopWidth, shadow: input.boxShadow, wrapperShadow: wrapper.boxShadow }
  })
  assert.equal(searchStyle.border, '0px', 'Composite search must not show an inner input border')
  assert.equal(searchStyle.shadow, 'none', 'Composite search must not show two focus rings')
  assert.notEqual(searchStyle.wrapperShadow, 'none', 'Keep the visible keyboard focus indicator')
  await capture('role-data-search')
  await role.getByRole('button', { name: '取消', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), 0)
  await capture('first-access-390')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ ok: true, measurements, screenshots, errors }, null, 2))
} finally { await context.close(); await browser.close() }
