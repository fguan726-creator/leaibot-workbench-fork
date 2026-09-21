import assert from 'node:assert/strict'
import test, { after, afterEach } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'
import { createRenderer, createSSRApp, h, nextTick, reactive, ssrContextKey } from 'vue'
import { renderToString } from 'vue/server-renderer'

const host = createHttpServer()
const server = await createServer({ root: new URL('..', import.meta.url).pathname, logLevel: 'error', server: { middlewareMode: true, hmr: { server: host } }, appType: 'custom' })
const { default: Component } = await server.ssrLoadModule('/src/components/agent/AgentConversationStates.vue')
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null })
const mounted = []
afterEach(() => { for (const app of mounted.splice(0).reverse()) app.unmount() })
after(async () => { await server.close(); host.close() })

function step(id, status, kind = 'tool_call') {
  return { id, kind, status, title: `步骤 ${id}`, detail: `说明 ${id}` }
}

function open(input) {
  const props = reactive(input)
  let state
  const app = renderer.createApp({ setup() {
    state = Component.setup(props, { expose() {} })
    return () => h('div')
  } })
  app.provide(ssrContextKey, {})
  app.mount({})
  mounted.push(app)
  return { props, state, html: () => renderToString(createSSRApp({ ...Component, setup: () => state }, props)) }
}

for (const flag of [undefined, false]) {
  test(`ordinary consumers remain collapsed until manually opened (opt-in ${flag})`, async () => {
    const view = open({ items: [step('past', 'done'), step('current', 'running')], ...(flag === undefined ? {} : { autoExpandRunning: flag }) })
    assert.match(await view.html(), /aria-expanded="false"/)
    assert.doesNotMatch(await view.html(), /说明 current|process-running-dots/)
    view.state.expanded.value = true
    assert.match(await view.html(), /说明 past/)
    view.props.items[1].status = 'done'
    await nextTick()
    assert.match(await view.html(), /aria-expanded="true"/)
    assert.match(await view.html(), /说明 current/)
    view.props.items[1].status = 'failed'
    view.state.expanded.value = false
    await nextTick()
    assert.match(await view.html(), /aria-expanded="false"/)
  })
}

test('opted-in running mounts show at most three current steps, keeping the running step ahead of pending history', async () => {
  const view = open({ autoExpandRunning: true, items: [
    step('past-a', 'done'), step('past-b', 'done'), step('waiting-a', 'pending'),
    step('waiting-b', 'pending'), step('waiting-c', 'pending'), step('current', 'running', 'streaming'),
    step('authorization', 'blocked', 'confirm')
  ] })
  const html = await view.html()
  assert.match(html, /aria-expanded="true"/)
  assert.equal((html.match(/<li\b/g) || []).length, 3)
  assert.match(html, /说明 current/)
  assert.doesNotMatch(html, /说明 past-a|说明 past-b|说明 authorization/)
  assert.equal((html.match(/class="process-running-dots"/g) || []).length, 1)
  assert.match(html, /展开历史/)
})

test('a pending-only opt-in opens when execution starts and collapses after every step completes', async () => {
  const view = open({ autoExpandRunning: true, items: [step('scan', 'pending'), step('answer', 'pending', 'streaming')] })
  assert.match(await view.html(), /aria-expanded="false"/)
  view.props.items[0].status = 'running'
  await nextTick()
  assert.match(await view.html(), /aria-expanded="true"/)
  view.props.items[0].status = 'done'
  view.props.items[1].status = 'running'
  await nextTick()
  assert.match(await view.html(), /说明 answer/)
  assert.doesNotMatch(await view.html(), /说明 scan/)
  view.props.items[1].status = 'done'
  await nextTick()
  assert.match(await view.html(), /aria-expanded="false"/)
  assert.doesNotMatch(await view.html(), /process-running-dots/)
  view.state.toggleExpanded()
  const history = await view.html()
  assert.match(history, /aria-expanded="true"/)
  assert.match(history, /说明 scan/)
  assert.match(history, /说明 answer/)
})

test('manual history reveals completed records without changing or duplicating their states', async () => {
  const items = [step('past-a', 'done'), step('past-b', 'done'), step('current', 'running')]
  const view = open({ autoExpandRunning: true, items: structuredClone(items) })
  assert.match(await view.html(), /aria-expanded="true"/)
  assert.doesNotMatch(await view.html(), /说明 past-a/)
  view.state.showHistory.value = true
  const html = await view.html()
  assert.match(html, /说明 past-a/)
  assert.match(html, /说明 past-b/)
  assert.match(html, /说明 current/)
  assert.equal((html.match(/<li\b/g) || []).length, 3)
  assert.deepEqual(JSON.parse(JSON.stringify(view.props.items)), items)
})

test('a manual collapse stays collapsed through progress, but a later execution opens anew', async () => {
  const view = open({ autoExpandRunning: true, items: [step('first', 'running'), step('second', 'pending')] })
  assert.match(await view.html(), /aria-expanded="true"/)
  view.state.toggleExpanded()
  assert.match(await view.html(), /aria-expanded="false"/)
  view.props.items[0].status = 'done'
  view.props.items[1].status = 'running'
  await nextTick()
  assert.match(await view.html(), /aria-expanded="false"/)
  view.props.items[1].status = 'done'
  await nextTick()
  view.props.items.push(step('new-run', 'running'))
  await nextTick()
  assert.match(await view.html(), /aria-expanded="true"/)
  assert.match(await view.html(), /说明 new-run/)
  assert.doesNotMatch(await view.html(), /说明 first/)
})

for (const status of ['failed', 'blocked']) {
  test(`${status} outcomes stay visible after execution stops and never auto-collapse as success`, async () => {
    const view = open({ autoExpandRunning: true, items: [step('scan', 'running')] })
    assert.match(await view.html(), /aria-expanded="true"/)
    view.state.toggleExpanded()
    view.props.items[0].status = status
    await nextTick()
    assert.match(await view.html(), /aria-expanded="true"/)
    assert.match(await view.html(), /说明 scan/)
    assert.doesNotMatch(await view.html(), /process-running-dots/)
    view.props.items.push(step('cleanup', 'done'))
    await nextTick()
    assert.match(await view.html(), /aria-expanded="true"/)
  })
}

test('opted-in completed history and confirmation-only input do not auto-open', async () => {
  const completed = open({ autoExpandRunning: true, items: [step('past', 'done')] })
  assert.match(await completed.html(), /aria-expanded="false"/)
  const confirmation = open({ autoExpandRunning: true, items: [step('authorization', 'blocked', 'confirm')] })
  assert.doesNotMatch(await confirmation.html(), /AI 会话状态|说明 authorization/)
})
