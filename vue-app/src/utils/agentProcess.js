import { agentActivityIcon } from './agentActivityIcons.js'

// View-only groups: original messages, their indices and action identities are retained.
export function groupAgentReplies(messages = []) {
  const groups = []
  let turn = null
  messages.forEach((message, index) => {
    if (message.role === 'user') turn = message.id || `user-${index}`
    const previous = groups.at(-1)
    if (message.role === 'assistant' && turn && previous?.role === 'assistant' && previous.turn === turn) {
      previous.parts.push({ msg: message, idx: index })
      previous.lastIndex = index
      previous.last = message
    } else {
      // Key follows the first original message; feedback continues using each original message.
      groups.push({ key: message.id || `message-${index}`, turn, role: message.role,
        firstIndex: index, lastIndex: index, last: message, parts: [{ msg: message, idx: index }] })
    }
  })
  return groups
}

export function collectAgentProcessItems(parts = [], liveItems = []) {
  const snapshots = new Map()
  let anonymous = 0
  const add = item => snapshots.set(item.id || `anonymous-${anonymous++}`, item)
  parts.forEach(({ msg }) => {
    if (!msg.task && !msg.authRequest) (msg.activityItems || []).forEach(add)
  })
  liveItems.forEach(add)
  return [...snapshots.values()]
}

export function describeAgentProcess(items = []) {
  const steps = items.filter(item => !['confirm', 'follow_up'].includes(item.kind))
  const count = status => steps.filter(item => item.status === status).length
  const failed = count('failed'), done = count('done')
  // Existing store cancellation is an error/blocked record; never settle other records here.
  if (count('cancelled') || steps.some(item => item.kind === 'error' && item.status === 'blocked' && item.title === '回答已停止')) {
    return { state: 'cancelled', label: '已停止', detail: '本次回答已停止', busy: false }
  }
  const running = steps.find(item => item.status === 'running')
  const blockingError = steps.find(item => item.kind === 'error' && item.status === 'blocked')
  if (failed && (!running || blockingError)) return { state: done ? 'partial' : 'failed', label: done ? '部分完成' : '执行失败', detail: `${done} 项完成 · ${failed} 项失败`, busy: false }
  if (blockingError) return { state: 'blocked', label: '需要处理', detail: blockingError.title, busy: false }
  if (running) return { state: 'running', label: '执行中', detail: `${running.title || '处理请求'}${failed ? ` · ${failed} 项异常` : ''}`, busy: true }
  const blocked = steps.find(item => item.status === 'blocked')
  if (blocked) return { state: 'blocked', label: '需要处理', detail: blocked.title, busy: false }
  if (count('pending')) return { state: 'waiting', label: '等待中', detail: '等待执行结果', busy: true }
  if (steps.length && done === steps.length) return { state: 'done', label: '已完成', detail: `完成 ${done} 项处理`, busy: false }
  return { state: 'recorded', label: '已记录', detail: done ? `${done} 项完成 · 其余状态请查看记录` : '暂无已完成的处理记录', busy: false }
}

export function currentAgentExecutionState(items = [], loading = false) {
  if (!loading || ['cancelled', 'failed', 'partial', 'blocked'].includes(describeAgentProcess(items).state)) return null
  const active = [...items].reverse().find(item => item.status === 'running' && ['tool_call', 'tool_result', 'streaming'].includes(item.kind))
  const title = String(active?.title || '').trim()
  if (active?.kind === 'tool_result') return { label: '正在等待工具返回结果', icon: 'wait' }
  if (!title || /(?:会话|chat).*接口|调用会话接口/i.test(title)) return { label: '正在等待 AI 服务返回', icon: 'wait' }
  return { label: /^(正在|等待)/.test(title) ? title : `正在${title}`, icon: agentActivityIcon(title, active.kind) }
}

export function currentAgentTaskExecutionState(task, now = Date.now()) {
  if (!task || !Number.isFinite(task.expiresAt) || task.expiresAt <= now) return null
  const request = task.requests?.find(item => item.status === 'running' || item.status === 'approved')
  if (!request) return null
  return request.status === 'approved'
    ? { label: '已确认，等待执行', icon: 'wait' }
    : { label: `正在执行：${request.label}`, icon: agentActivityIcon(request.label, 'tool_call') }
}
