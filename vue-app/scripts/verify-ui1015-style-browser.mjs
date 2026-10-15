import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))
const origin = process.env.UI1015_QA_ORIGIN
assert.match(origin || '', /^http:\/\/(127\.0\.0\.1|localhost):\d+$/, 'An explicit localhost origin is required')
const output = process.env.UI1015_QA_OUTPUT || path.join(os.tmpdir(), 'ui1015-style-browser')
const phase = process.env.UI1015_QA_PHASE || 'all'
assert.ok(['all', 'review-auth', 'agent'].includes(phase))
mkdirSync(output, { recursive: true })
const report = { origin, phase, cases: [], geometry: [], errors: [], apiRequests: [], unexpectedRequests: [], passed: false }
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
let lastPage

async function setup(authenticated = true) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' })
  context.setDefaultTimeout(15000)
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url())
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
      report.unexpectedRequests.push({ url: request.url(), method: request.method() })
      return route.abort()
    }
    if (url.pathname.startsWith('/api/')) {
      report.apiRequests.push({ path: url.pathname, method: request.method(), mocked: true })
      if (!['/api/admin/me', '/api/harness/menu'].includes(url.pathname)) {
        report.unexpectedRequests.push({ url: request.url(), method: request.method() })
        return route.abort()
      }
      const body = url.pathname === '/api/admin/me' ? { admin: { username: 'ui1015-style-browser-qa' } } : { permissions: ['*'], menus: ['dashboard'] }
      return route.fulfill({ status: !authenticated && url.pathname === '/api/admin/me' ? 401 : 200, contentType: 'application/json', body: JSON.stringify(body) })
    }
    return route.continue()
  })
  const page = await context.newPage()
  lastPage = page
  page.on('pageerror', error => report.errors.push(error.message))
  return { context, page }
}

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

async function agentWidth(page, width) {
  await page.evaluate(async width => {
    const { useAIStore } = await import('/admin-vue/src/stores/ai.ts')
    const ai = useAIStore()
    ai.toggleOpen(width > 0)
  }, width)
  if (width) {
    await page.locator('#ai-panel').waitFor({ state: 'visible' })
    await settle(page)
    const current = await page.locator('#ai-panel').boundingBox()
    if (Math.abs(current.width - width) >= 1) {
      // Use the real drag handle, which disables the panel's width transition
      // while resizing; injecting store widths can race the shell resize event.
      const handle = await page.locator('#ai-resize-handle').boundingBox()
      const x = handle.x + handle.width / 2, y = handle.y + 100
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + current.width - width, y, { steps: 12 })
      await page.mouse.up()
    }
  }
  await page.waitForFunction(width => width ? Math.abs(document.querySelector('#ai-panel').getBoundingClientRect().width - width) < 1 : !document.querySelector('#ai-panel').classList.contains('open'), width)
  await settle(page)
}

async function captureLayout(page, label, selector) {
  const geometry = await page.locator(selector).evaluate(root => {
    const rect = root.getBoundingClientRect()
    const panel = document.querySelector('#ai-panel')
    return { viewportWidth: innerWidth, sidebarWidth: document.querySelector('#sidebar')?.getBoundingClientRect().width || 0,
      agentWidth: panel?.classList.contains('open') ? panel.getBoundingClientRect().width : 0,
      contentInnerWidth: rect.width, documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      rootOverflow: root.scrollWidth - root.clientWidth, rootRight: rect.right }
  })
  assert.ok(geometry.documentOverflow <= 1 && geometry.rootOverflow <= 1, label + ': ' + JSON.stringify(geometry))
  report.geometry.push({ label, ...geometry })
  await page.screenshot({ path: path.join(output, label + '.png'), fullPage: true, animations: 'disabled' })
}

async function reviewCases() {
  const { context, page } = await setup()
  await page.goto(origin + '/admin-vue/reviews/summary', { waitUntil: 'domcontentloaded' })
  const summary = page.locator('.review-summary-page')
  await summary.waitFor()
  assert.equal(await summary.locator('tbody tr').count(), 3)
  await summary.getByRole('button', { name: '下一页', exact: true }).click()
  await summary.locator('tbody tr').filter({ hasText: '1056585' }).waitFor()
  await summary.getByRole('button', { name: '上一页', exact: true }).click()
  await summary.getByLabel('商品编号', { exact: true }).fill('1056598')
  await summary.getByRole('button', { name: '查询', exact: true }).click()
  assert.equal(await summary.locator('tbody tr').count(), 1)
  await reviewLayoutMatrix(page, summary, 'summary', '.rs-filter-form', '.rs-table-scroll', ['商品名称', '商品编号', '生成状态', '产品组', '时间段'])
  assert.equal(await summary.getByLabel('商品编号', { exact: true }).inputValue(), '1056598')
  await summary.getByRole('button', { name: '查看总结', exact: true }).click()
  await page.getByRole('dialog', { name: '评价总结详情' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: '评价总结详情' }).waitFor({ state: 'hidden' })
  // The shell is intentionally auto-collapsed at 1280; enter the sibling route
  // directly instead of depending on a hidden navigation child.
  await page.goto(origin + '/admin-vue/reviews/assist', { waitUntil: 'domcontentloaded' })
  const assist = page.locator('.assist-generation-page')
  await assist.waitFor()
  await assist.getByRole('button', { name: /展开更多条件/ }).click()
  await assist.getByLabel('账户', { exact: true }).fill('186')
  await assist.getByLabel('结果状态', { exact: true }).selectOption('生成前拦截')
  await assist.getByRole('button', { name: '查询', exact: true }).click()
  await assist.locator('tbody tr').filter({ hasText: '186****5510' }).waitFor()
  assert.equal(await assist.locator('tbody tr').count(), 1)
  await reviewLayoutMatrix(page, assist, 'assist', '.ag-filter-form', '.ag-table-scroll', ['商品名称', '商品编号', '账户', 'LenovoID', '来源', '生成方式', '结果状态', '时间段'])
  assert.equal(await assist.getByLabel('账户', { exact: true }).inputValue(), '186')
  assert.equal(await assist.getByLabel('结果状态', { exact: true }).inputValue(), '生成前拦截')
  report.cases.push('Review filters, pagination and details preserve existing behavior; visible field labels and selected values persist through 1440/1280 and Agent closed/380/492 layouts')
  await context.close()
}

async function reviewLayoutMatrix(page, root, label, formSelector, scrollSelector, expectedLabels) {
  for (const viewportWidth of [1440, 1280]) {
    await page.setViewportSize({ width: viewportWidth, height: 1000 })
    for (const width of [0, 380, 492]) {
      await agentWidth(page, width)
      const labels = await root.locator('.cs-filter-field__label:visible').allTextContents()
      assert.deepEqual(labels.map(item => item.trim()), expectedLabels)
      const fields = await root.locator('.cs-filter-field:visible').evaluateAll(items => items.map(field => {
        const label = field.querySelector('.cs-filter-field__label'), control = field.querySelector('input,select')
        const a = label.getBoundingClientRect(), b = control.getBoundingClientRect(), style = getComputedStyle(label)
        return { label: label.textContent, width: a.width, height: a.height, clipped: style.clipPath !== 'none', order: a.bottom <= b.top + 1 }
      }))
      assert.ok(fields.every(item => item.width > 20 && item.height >= 16 && !item.clipped && item.order), JSON.stringify(fields))
      const form = await root.locator(formSelector).evaluate(el => ({ columns: getComputedStyle(el).gridTemplateColumns.split(' ').length, width: el.getBoundingClientRect().width }))
      const table = await root.locator(scrollSelector).evaluate(el => {
        const header = el.querySelector('th'), cell = el.querySelector('tbody td')
        el.scrollLeft = el.scrollWidth
        const action = el.querySelector('tbody tr td:last-child button').getBoundingClientRect(), box = el.getBoundingClientRect()
        return { overflowX: getComputedStyle(el).overflowX, scrollWidth: el.scrollWidth, width: el.clientWidth,
          actionReachable: action.left >= box.left - 1 && action.right <= box.right + 1,
          headerWeight: getComputedStyle(header).fontWeight, rowHeight: cell.getBoundingClientRect().height }
      })
      assert.ok(['auto', 'scroll'].includes(table.overflowX))
      assert.ok(table.actionReachable, `${label}: final table action remains reachable`)
      assert.equal(table.headerWeight, '500')
      assert.ok(table.rowHeight >= 48)
      report.geometry.push({ label: `${label}-${viewportWidth}-${width}-filters`, ...form, ...table })
      await captureLayout(page, `${label}-${viewportWidth}-${width}`, label === 'summary' ? '.review-summary-page' : '.assist-generation-page')
    }
  }
}

async function authCases() {
  const { context, page } = await setup(false)
  // A disabled-login proof is an isolated local fixture, never a real login or account mutation.
  await context.addInitScript(() => {
    sessionStorage.setItem('leaibot-disabled-login-account', 'internal-disabled')
    sessionStorage.setItem('leaibot-disabled-login-type', 'internal')
  })
  await page.goto(origin + '/admin-vue/account-enable-request?account=internal-disabled&loginType=internal')
  const flow = page.locator('.account-enable-flow')
  await flow.waitFor()
  assert.equal(await flow.getByLabel('被申请人 ITCode', { exact: true }).inputValue(), 'internal-disabled')
  assert.equal(await flow.getByLabel('被申请人 ITCode', { exact: true }).getAttribute('readonly'), '')
  assert.equal(await flow.getByRole('radio').first().isDisabled(), true)
  assert.equal(await flow.getByRole('button', { name: /审批执行/ }).isDisabled(), true)
  await flow.getByRole('button', { name: '下一步', exact: true }).click()
  await flow.getByText('请填写申请原因。', { exact: true }).waitFor()
  await flow.getByLabel('申请原因', { exact: true }).fill('本机样式验收：恢复账号访问，保留原有权限。')
  for (const width of [720, 719]) {
    await flow.evaluate((el, width) => { el.style.width = `${width}px`; el.style.boxSizing = 'content-box'; el.style.flex = '0 0 auto'; el.style.alignSelf = 'flex-start' }, width)
    await settle(page)
    const geometry = await flow.evaluate(el => ({ contentWidth: el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight),
      fields: getComputedStyle(el.querySelector('.enable-fields')).gridTemplateColumns.split(' ').length,
      people: getComputedStyle(el.querySelector('.enable-person-types')).gridTemplateColumns.split(' ').length }))
    assert.equal(geometry.contentWidth, width)
    assert.equal(geometry.fields, width === 719 ? 1 : 2)
    assert.equal(geometry.people, width === 719 ? 1 : 2)
    report.geometry.push({ label: 'account-enable-container-' + width, ...geometry })
    await page.screenshot({ path: path.join(output, `account-enable-container-${width}.png`), fullPage: true })
  }
  await flow.evaluate(el => { for (const name of ['width', 'box-sizing', 'flex', 'align-self']) el.style.removeProperty(name) })
  for (const width of [1440, 1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await captureLayout(page, `account-enable-${width}`, '.account-enable-flow')
    assert.match(await flow.getByLabel('申请原因', { exact: true }).inputValue(), /保留原有权限/)
  }
  await flow.getByRole('button', { name: '下一步', exact: true }).click()
  await flow.getByText('系统管理员审批', { exact: true }).waitFor()
  assert.doesNotMatch(await flow.innerText(), /直线经理审批|业务负责人审批|关联人审批/)
  await flow.getByRole('button', { name: '上一步', exact: true }).click()
  assert.match(await flow.getByLabel('申请原因', { exact: true }).inputValue(), /保留原有权限/)
  assert.equal(await page.evaluate(() => localStorage.getItem('leaibot-account-request-status-rows')), null)
  report.cases.push('Enable-account flow switches at actual 719/720 content width, retains validation and self-service identity lock, preserves input through 1440/1280/390 layouts and review/back; no request submitted')
  await context.close()
}

async function agentCases() {
  const { context, page } = await setup()
  await page.goto(origin + '/admin-vue/reviews/summary')
  await page.locator('.review-summary-page').waitFor()
  await page.evaluate(async () => {
    const { useAIStore } = await import('/admin-vue/src/stores/ai.ts')
    const ai = useAIStore()
    const at = new Date().toISOString()
    const action = (type, label, id) => ({ type, label, id, packageId: 'local-fixture', version: 'v1.2.3', confirmationToken: `token-${id}` })
    ai.messages = [
      { id: 'ui-user-1', role: 'user', text: '核对本机样例的结果和操作', at },
      { id: 'ui-answer-1', role: 'assistant', text: '第一条回答：请先核对结果。', at,
        activityItems: [{ id: 'step-failed', kind: 'tool_call', title: '早期查询失败', status: 'failed', detail: '保留原始失败记录' }, { id: 'step-done', kind: 'tool_result', title: '读取样例完成', status: 'done' }],
        actionItems: [action('scenario_application_confirm', '确认样例 A', 'confirm-A'), action('navigate', '查看样例 B', 'navigate-B')] },
      { role: 'assistant', text: '第二条回答：这是同轮补充信息。', at,
        actionItems: [action('scenario_application_cancel', '取消样例 C', 'cancel-C'), action('navigate', '查看样例 D', 'navigate-D')] },
      { id: 'ui-user-2', role: 'user', text: '开始第二轮独立问题', at },
      { id: 'ui-answer-3', role: 'assistant', text: '第三条回答：保持新的独立轮次。', at,
        actionItems: [action('navigate', '查看样例 E', 'navigate-E')] }
    ]
    window.__ui1015Original = JSON.stringify(ai.messages)
    window.__ui1015Actions = []
    // Spy only at the existing store action boundary: each actual DOM button must delegate
    // the exact original object, while no mocked approval or business action is executed.
    ai.runTaskAction = item => window.__ui1015Actions.push({ item: JSON.parse(JSON.stringify(item)), identical: ai.messages.some(message => message.actionItems?.some(action => action === item)) })
    ai.toggleOpen(true)
  })
  const ai = page.locator('#ai-panel')
  const groups = ai.locator('.ai-merged-reply')
  await groups.first().waitFor()
  assert.equal(await groups.count(), 2)
  assert.deepEqual(await groups.first().locator('.ai-answer-part').evaluateAll(nodes => nodes.map(node => node.dataset.agentMessageIndex)), ['1', '2'])
  assert.deepEqual(await groups.nth(1).locator('.ai-answer-part').evaluateAll(nodes => nodes.map(node => node.dataset.agentMessageIndex)), ['4'])
  assert.equal(await ai.locator('.ai-task-btn').count(), 5)
  assert.equal(await ai.locator('.ai-reply-feedback').count(), 3)
  for (const label of ['确认样例 A', '查看样例 B', '取消样例 C', '查看样例 D', '查看样例 E']) await ai.getByRole('button', { name: label, exact: true }).click()
  const dispatched = await page.evaluate(() => window.__ui1015Actions)
  assert.deepEqual(dispatched.map(item => item.item.id), ['confirm-A', 'navigate-B', 'cancel-C', 'navigate-D', 'navigate-E'])
  assert.ok(dispatched.every(item => item.identical))
  const first = ai.locator('.ai-answer-part[data-agent-message-index="1"]')
  const second = ai.locator('.ai-answer-part[data-agent-message-index="2"]')
  await first.getByRole('button', { name: '有帮助', exact: true }).click()
  await second.getByRole('button', { name: '没帮助', exact: true }).click()
  assert.equal(await first.getByRole('button', { name: '有帮助', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await second.getByRole('button', { name: '没帮助', exact: true }).getAttribute('aria-pressed'), 'true')
  await first.getByRole('button', { name: '有帮助', exact: true }).click()
  assert.equal(await first.getByRole('button', { name: '有帮助', exact: true }).getAttribute('aria-pressed'), 'false')
  assert.equal(await second.getByRole('button', { name: '没帮助', exact: true }).getAttribute('aria-pressed'), 'true')
  for (const viewportWidth of [1440, 1280]) {
    await page.setViewportSize({ width: viewportWidth, height: 1000 })
    await settle(page)
    for (const width of [380, 492]) {
      await agentWidth(page, width)
      assert.equal(await ai.locator('.ai-task-btn').count(), 5)
      assert.equal(await second.getByRole('button', { name: '没帮助', exact: true }).getAttribute('aria-pressed'), 'true')
      const timestamps = await groups.first().locator('.ai-answer-part').evaluateAll(parts => parts.map(part => {
        const time = part.querySelector('.ai-message-time').getBoundingClientRect(), box = part.getBoundingClientRect()
        return { inside: time.top >= box.top && time.bottom <= box.bottom + 1, top: time.top, bottom: time.bottom }
      }))
      assert.ok(timestamps.every(item => item.inside) && timestamps[1].top > timestamps[0].bottom, 'Grouped replies retain distinct, non-overlapping original timestamps')
      await captureLayout(page, `agent-replies-${viewportWidth}-${width}`, '#ai-panel')
    }
  }
  assert.equal(await page.evaluate(async () => JSON.stringify((await import('/admin-vue/src/stores/ai.ts')).useAIStore().messages) === window.__ui1015Original), true)
  report.cases.push('Contiguous same-turn answers visually group without changing source messages, original indices, five action identities or independent feedback (including the id-less fallback key); 380/492 Agent layouts remain contained')
  await page.evaluate(async () => {
    const ai = (await import('/admin-vue/src/stores/ai.ts')).useAIStore()
    ai.messages = [{ id: 'live-user', role: 'user', text: '演示公开过程状态', at: new Date().toISOString() }]
    ai.loading = true
    ai.activityItems = Array.from({ length: 5 }, (_, i) => ({ id: `live-${i}`, kind: 'tool_call', title: i === 4 ? '查询知识库' : `读取公开样例 ${i + 1}`, status: i === 4 ? 'running' : 'done', detail: `公开步骤说明 ${i + 1}` }))
  })
  const live = ai.locator('.ai-state-row .conversation-states')
  await live.waitFor()
  assert.ok(await live.locator('.conversation-state-list > li').count() <= 3)
  await ai.locator('.ai-execution-row').filter({ hasText: '正在查询知识库' }).waitFor()
  assert.equal(await ai.locator('.ai-execution-row .agent-activity-icon').count(), 1)
  await live.locator('.conversation-state-summary').click()
  assert.equal(await live.locator('.conversation-state-list > li').count(), 5)
  await live.locator('.state-card-toggle').last().click()
  assert.equal(await live.locator('.state-card-toggle').last().getAttribute('aria-expanded'), 'true')
  assert.equal(await live.locator('.state-card-detail.is-expanded').count(), 1)
  await live.getByText('公开步骤说明 5', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(output, 'agent-live-process-expanded.png'), fullPage: true })
  await page.evaluate(async () => {
    const ai = (await import('/admin-vue/src/stores/ai.ts')).useAIStore()
    ai.activityItems.push({ id: 'live-stop', kind: 'error', title: '回答已停止', status: 'blocked' })
  })
  await ai.locator('.ai-execution-row').waitFor({ state: 'hidden' })
  assert.match(await live.innerText(), /已停止/)
  await page.evaluate(async () => {
    const ai = (await import('/admin-vue/src/stores/ai.ts')).useAIStore()
    ai.activityItems = [{ id: 'failure', kind: 'tool_call', title: '查询失败', status: 'failed' }, { id: 'error', kind: 'error', title: '大模型不可用', status: 'blocked' }]
  })
  assert.equal(await ai.locator('.ai-execution-row').count(), 0)
  assert.doesNotMatch(await live.innerText(), /已完成/)
  report.cases.push('Live process initially bounds visible cards, expands history/details and derives an outlined activity icon from actual public running metadata; stopped/failed states never show stale execution or success')
  await context.close()
}

try {
  if (phase !== 'agent') { await reviewCases(); await authCases() }
  if (phase !== 'review-auth') await agentCases()
  assert.deepEqual(report.errors, [])
  assert.deepEqual(report.unexpectedRequests, [])
  report.passed = true
} catch (error) {
  report.failure = error.stack || String(error)
  if (lastPage && !lastPage.isClosed()) await lastPage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
  report.limitations = ['Only isolated localhost fixtures and mocked auth reads; no real business API, account change or approval was executed.', 'Agent action delegation is verified with a store-boundary spy; domain/runtime authorization is covered by separate existing tests.']
  writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
}
