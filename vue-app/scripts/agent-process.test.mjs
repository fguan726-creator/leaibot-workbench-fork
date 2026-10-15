import assert from 'node:assert/strict'
import test from 'node:test'
import { groupAgentReplies, collectAgentProcessItems, describeAgentProcess, currentAgentExecutionState, currentAgentTaskExecutionState } from '../src/utils/agentProcess.js'
import { AGENT_ACTIVITY_ICONS, agentActivityIcon } from '../src/utils/agentActivityIcons.js'

test('reply grouping preserves exact message, action, task and original index identities without changing feedback keys', () => {
  const action = Object.freeze({ type: 'scenario_application_confirm', id: 'confirmation-A', label: '确认工作流' })
  const task = Object.freeze({ id: 'task-A' })
  const messages = Object.freeze([
    Object.freeze({ id: 'user-A', role: 'user', text: '应用' }),
    Object.freeze({ id: 'answer-A', role: 'assistant', task, actionItems: Object.freeze([action]) }),
    Object.freeze({ id: 'answer-B', role: 'assistant', actionItems: Object.freeze([{ type: 'scenario_application_cancel', id: 'cancel-A' }]) }),
    Object.freeze({ id: 'user-B', role: 'user' }), Object.freeze({ id: 'answer-C', role: 'assistant' })
  ])
  const groups = groupAgentReplies(messages)
  assert.equal(groups.length, 4)
  assert.deepEqual(groups[1].parts.map(part => part.idx), [1, 2])
  assert.equal(groups[1].parts[0].msg, messages[1])
  assert.equal(groups[1].parts[1].msg, messages[2])
  assert.equal(groups[1].parts[0].msg.actionItems[0], action)
  assert.equal(groups[1].parts[0].msg.task, task)
  assert.equal(groups[1].feedback, undefined)
  assert.notEqual(groups[1].key, groups[3].key)
})

test('process grouping only updates same-ID snapshots and retains earlier distinct failure evidence', () => {
  const failed = Object.freeze({ id: 'failed-tool', kind: 'tool_call', status: 'failed', title: '查询失败' })
  const running = Object.freeze({ id: 'stream', kind: 'streaming', status: 'running' })
  const done = Object.freeze({ id: 'stream', kind: 'streaming', status: 'done' })
  const items = collectAgentProcessItems([{ msg: { activityItems: [failed, running] } }, { msg: { activityItems: [done] } }])
  assert.deepEqual(items, [failed, done])
  assert.equal(items[0], failed)
  assert.equal(items[1], done)
  assert.deepEqual(collectAgentProcessItems([{ msg: { task: {}, activityItems: [failed] } }]), [])
})

test('empty, unknown and skipped-only activity is never asserted as completed', () => {
  for (const items of [[], [{ kind: 'tool_call', status: 'skipped' }], [{ kind: 'tool_call', status: 'unexpected' }]]) {
    assert.notEqual(describeAgentProcess(items).state, 'done')
  }
  assert.equal(describeAgentProcess([{ kind: 'tool_result', status: 'done' }, { kind: 'follow_up', status: 'pending' }, { kind: 'confirm', status: 'blocked' }]).state, 'done')
})

test('current store stop and failure records remain terminal despite stale running entries', () => {
  const running = { kind: 'tool_call', status: 'running', title: '调用会话接口' }
  const stopped = { kind: 'error', status: 'blocked', title: '回答已停止' }
  assert.equal(describeAgentProcess([running, stopped]).state, 'cancelled')
  assert.equal(currentAgentExecutionState([running, stopped], true), null)
  const failure = [{ kind: 'tool_call', status: 'failed', title: '会话接口失败' }, { kind: 'error', status: 'blocked', title: '大模型不可用' }]
  assert.equal(describeAgentProcess(failure).state, 'failed')
  assert.equal(currentAgentExecutionState(failure, true), null)
  assert.equal(describeAgentProcess([{ kind: 'tool_call', status: 'done' }, ...failure]).state, 'partial')
})

test('activity line uses only actually running public operations and never claims execution on pending permission', () => {
  assert.deepEqual(currentAgentExecutionState([], true), { label: '正在等待 AI 服务返回', icon: 'wait' })
  assert.deepEqual(currentAgentExecutionState([{ kind: 'tool_call', status: 'running', title: '查询知识库' }], true), { label: '正在查询知识库', icon: 'search' })
  assert.equal(currentAgentExecutionState([{ kind: 'tool_call', status: 'done' }], false), null)
  assert.equal(currentAgentTaskExecutionState({ expiresAt: 100, requests: [{ status: 'pending', label: '导出' }] }, 50), null)
  assert.equal(currentAgentTaskExecutionState({ expiresAt: 100, requests: [{ status: 'running', label: '导出' }] }, 100), null)
  assert.deepEqual(currentAgentTaskExecutionState({ expiresAt: 100, requests: [{ status: 'approved', label: '导出' }] }, 50), { label: '已确认，等待执行', icon: 'wait' })
  assert.deepEqual(currentAgentTaskExecutionState({ expiresAt: 100, requests: [{ status: 'running', label: '导出' }] }, 50), { label: '正在执行：导出', icon: 'export' })
})

test('ten public activity categories have outline icons and deterministic metadata-only mapping', () => {
  assert.equal(Object.keys(AGENT_ACTIVITY_ICONS).length, 10)
  const examples = { search: '查询知识库', read: '读取附件', terminal: '执行脚本', skill: '执行技能', analysis: '分析趋势', write: '生成报告', network: '调用接口', wait: '等待结果', export: '导出明细', navigate: '跳转工作区' }
  for (const [name, title] of Object.entries(examples)) {
    assert.equal(agentActivityIcon(title), name)
    assert.ok(AGENT_ACTIVITY_ICONS[name].paths.length)
  }
})
