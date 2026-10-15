import assert from 'node:assert/strict'
import test, { after, afterEach } from 'node:test'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'vite'
import { createRenderer, createSSRApp, h, nextTick, reactive, ssrContextKey } from 'vue'
import { renderToString } from 'vue/server-renderer'

const host = createHttpServer()
const server = await createServer({ root: new URL('..', import.meta.url).pathname, logLevel: 'error', server: { middlewareMode: true, hmr: { server: host } }, appType: 'custom' })
const renderer = createRenderer({ createElement: () => ({}), createText: () => ({}), createComment: () => ({}), insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {}, parentNode: () => null, nextSibling: () => null })
const mounted = []
afterEach(() => { for (const app of mounted.splice(0).reverse()) app.unmount() })
after(async () => { await server.close(); host.close() })

async function openComponent(path, input) {
  const { default: Component } = await server.ssrLoadModule(path)
  const props = reactive(input)
  const events = []
  let state
  const app = renderer.createApp({ setup() {
    state = Component.setup(props, { expose() {}, emit: (...event) => events.push(event) })
    return () => h('div')
  } })
  app.provide(ssrContextKey, {})
  app.mount({}); mounted.push(app)
  return { props, state, events, html: () => renderToString(createSSRApp({ ...Component, setup: () => state }, props)) }
}

test('same-turn reply groups preserve every action, message index and individual feedback choice', async () => {
  const confirm = { type: 'scenario_application_confirm', label: '确认工作流', applicationId: 'application-A' }
  const cancel = { type: 'scenario_application_cancel', label: '取消应用测试', applicationId: 'application-A' }
  const view = await openComponent('/src/components/agent/AgentMessageList.vue', {
    messages: [
      { id: 'user-A', role: 'user', text: '应用测试' },
      { id: 'answer-A', role: 'assistant', text: '请确认', actionItems: [confirm, cancel] },
      { id: 'answer-B', role: 'assistant', text: '另一个结果', actionItems: [{ type: 'open-report', label: '查看报告' }] }
    ], loading: false, activityItems: [], currentPageId: 'portal.home'
  })
  const html = await view.html()
  assert.equal((html.match(/ai-merged-reply/g) || []).length, 1)
  for (const idx of [0, 1, 2]) assert.equal((html.match(new RegExp(`data-agent-message-index="${idx}"`, 'g')) || []).length, 1)
  assert.equal((html.match(/aria-label="回答反馈"/g) || []).length, 2)
  for (const label of ['确认工作流', '取消应用测试', '查看报告']) assert.match(html, new RegExp(label))
  view.state.setFeedback(view.props.messages[1], 1, 'up')
  assert.equal(view.state.feedbackState('answer-A'), 'up')
  assert.equal(view.state.feedbackState('answer-B'), '')
  view.props.messages.push({ id: 'answer-C', role: 'assistant', text: '后续回答' })
  await nextTick()
  assert.equal(view.state.feedbackState('answer-A'), 'up')
  assert.equal(view.state.feedbackKey(view.props.messages[1], 1), 'answer-A')
  assert.equal(view.state.messageGroups.value[1].parts[0].msg.actionItems[0], view.props.messages[1].actionItems[0])
})

test('a stopped saved process stays above its answer and does not produce a running bottom status', async () => {
  const view = await openComponent('/src/components/agent/AgentMessageList.vue', {
    messages: [{ id: 'user', role: 'user', text: '查询' }, { id: 'answer', role: 'assistant', text: '已停止当前回答', activityItems: [
      { id: 'run', kind: 'tool_call', status: 'running', title: '调用会话接口' },
      { id: 'stop', kind: 'error', status: 'blocked', title: '回答已停止' }
    ] }], loading: false, activityItems: [], currentPageId: 'portal.home'
  })
  const html = await view.html()
  assert.match(html, /Thinking 处理过程/)
  assert.match(html, /已停止/)
  assert.ok(html.indexOf('Thinking 处理过程') < html.indexOf('data-agent-message-index="1"'))
  assert.doesNotMatch(html, /ai-execution-row/)
})

test('live thinking precedes same-turn content and the bottom activity is one transparent public action row', async () => {
  const view = await openComponent('/src/components/agent/AgentMessageList.vue', {
    messages: [{ id: 'user', role: 'user', text: '查询' }, { id: 'answer', role: 'assistant', text: '正在处理' }],
    loading: true, activityItems: [{ id: 'run', kind: 'tool_call', status: 'running', title: '查询知识库', detail: '查询公开知识条目' }], currentPageId: 'portal.home'
  })
  const html = await view.html()
  assert.equal((html.match(/Thinking 处理过程/g) || []).length, 1)
  assert.match(html, /ai-execution-row/)
  assert.match(html, /data-activity-icon="search"/)
  assert.match(html, /正在查询知识库/)
  assert.ok(html.indexOf('Thinking 处理过程') < html.indexOf('data-agent-message-index="1"'))
})


test('legacy users without IDs retain the same process expansion key when their reply arrives', async () => {
  const view = await openComponent('/src/components/agent/AgentMessageList.vue', {
    messages: [{ role: 'user', text: '查询' }], loading: true,
    activityItems: [{ id: 'run', kind: 'tool_call', status: 'running', title: '查询知识库' }], currentPageId: 'portal.home'
  })
  const key = view.state.liveProcessKey.value
  view.state.processExpanded[key] = true
  view.props.messages.push({ id: 'reply', role: 'assistant', text: '结果', activityItems: [{ id: 'run', kind: 'tool_call', status: 'done', title: '查询知识库' }] })
  view.props.loading = false
  await nextTick()
  assert.equal(view.state.processKey(view.state.messageGroups.value[1]), key)
  assert.match(await view.html(), /class="conversation-state-summary" aria-expanded="true"/)
})

test('reading earlier content pauses autoscroll without changing messages and can follow latest again', async () => {
  const view = await openComponent('/src/components/agent/AgentMessageList.vue', {
    messages: [{ id: 'user', role: 'user', text: '查询' }], loading: false, activityItems: [], currentPageId: 'portal.home'
  })
  view.state.messagesEl.value = { scrollTop: 100, scrollHeight: 1500, clientHeight: 500 }
  view.state.onMessagesScroll()
  view.state.scrollToBottom()
  await nextTick()
  assert.equal(view.state.messagesEl.value.scrollTop, 100)
  view.state.messagesEl.value.scrollTop = 1000
  view.state.onMessagesScroll()
  view.state.scrollToBottom()
  await nextTick()
  assert.equal(view.state.messagesEl.value.scrollTop, 1500)
  assert.equal(view.props.messages[0].text, '查询')
})
