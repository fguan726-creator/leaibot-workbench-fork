import assert from 'node:assert/strict'
import test from 'node:test'

let createClarificationPlayback
try {
  ;({ createClarificationPlayback } = await import('../src/domain/skillClarificationPlayback.js'))
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
}

function clock() {
  let time = 0
  let nextId = 0
  const timers = new Map()
  const callbacks = []
  return {
    timers,
    callbacks,
    setTimer(callback, delay) {
      const id = ++nextId
      timers.set(id, { at: time + delay, callback })
      callbacks.push(callback)
      return id
    },
    clearTimer(id) { timers.delete(id) },
    tick() {
      const entry = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
      if (!entry) return false
      const [id, timer] = entry
      timers.delete(id)
      time = timer.at
      timer.callback()
      return true
    },
    flush() {
      let remaining = 100
      while (this.tick()) assert.ok(--remaining > 0, 'playback must finish with a bounded number of timers')
    }
  }
}

function setup(options = {}) {
  assert.equal(typeof createClarificationPlayback, 'function', 'the playback helper must be implemented')
  const timer = clock()
  const player = createClarificationPlayback({ stepMs: 20, chunkMs: 5, chunkSize: 1, setTimer: timer.setTimer, clearTimer: timer.clearTimer, ...options })
  return { player, timer }
}

function steps() {
  return [
    { id: 'understand', kind: 'thinking', title: '理解需求', detail: '归纳当前表单' },
    { id: 'boundary', kind: 'tool_call', title: '整理范围', detail: '使用本地示例' },
    { id: 'reply', kind: 'streaming', title: '组织回复', detail: '逐步展示说明' }
  ]
}

function recorder() {
  const states = []
  const texts = []
  return { states, texts, onStates: value => states.push(value), onText: value => texts.push(value) }
}

test('runs steps in order and completes the final streaming step only after all text', async () => {
  const { player, timer } = setup()
  const output = recorder()
  const events = []
  const result = player.run({ steps: steps(), text: '说明', onStates(value) { output.onStates(value); events.push(value.map(item => item.status).join(',')) }, onText(value) { output.onText(value); events.push(`text:${value}`) } })
  assert.equal(player.isRunning, true)
  assert.deepEqual(output.states.at(-1).map(item => item.status), ['running', 'pending', 'pending'])
  timer.flush()
  assert.equal(await result, true)
  assert.deepEqual(output.states.map(value => value.map(item => item.status)), [
    ['pending', 'pending', 'pending'], ['running', 'pending', 'pending'],
    ['done', 'pending', 'pending'], ['done', 'running', 'pending'],
    ['done', 'done', 'pending'], ['done', 'done', 'running'], ['done', 'done', 'done']
  ])
  assert.deepEqual(output.texts.filter(Boolean), ['说', '说明'])
  assert.ok(events.indexOf('text:说明') < events.indexOf('done,done,done'))
  assert.equal(player.isRunning, false)
  assert.equal(timer.timers.size, 0)
})

test('progressive Unicode text never splits a surrogate pair and preserves the exact text', async () => {
  const { player, timer } = setup()
  const output = recorder()
  const result = player.run({ steps: steps(), text: '需求😀𠮷好', ...output })
  timer.flush()
  assert.equal(await result, true)
  assert.deepEqual(output.texts.filter(Boolean), ['需', '需求', '需求😀', '需求😀𠮷', '需求😀𠮷好'])
  assert.ok(output.texts.every(value => value.isWellFormed()))
})

test('does not mutate the input steps or let a consumer corrupt future state snapshots', async () => {
  const { player, timer } = setup()
  const input = Object.freeze(steps().map(item => Object.freeze(item)))
  const observed = []
  const result = player.run({ steps: input, text: '好', onText() {}, onStates(value) {
    observed.push(structuredClone(value))
    value[0].id = 'consumer-mutation'
    value[0].title = 'consumer-mutation'
    value[0].status = 'failed'
  } })
  timer.flush()
  assert.equal(await result, true)
  assert.ok(observed.every(value => value[0].id === 'understand' && value[0].title === '理解需求' && value[0].status !== 'failed'))
  assert.deepEqual(input, steps())
})

test('a busy run is refused without inserting steps, text or timers into the current run', async () => {
  const { player, timer } = setup()
  const first = recorder()
  const second = recorder()
  const result = player.run({ steps: steps(), text: '第一轮', ...first })
  const timerCount = timer.timers.size
  assert.equal(await player.run({ steps: steps(), text: '第二轮', ...second }), false)
  assert.deepEqual(second.states, [])
  assert.deepEqual(second.texts, [])
  assert.equal(timer.timers.size, timerCount)
  timer.flush()
  assert.equal(await result, true)
  assert.equal(first.texts.at(-1), '第一轮')
})

test('cancel settles false, clears timers and rejects late callbacks after a new run starts', async () => {
  const { player, timer } = setup()
  const old = recorder()
  const stopped = player.run({ steps: steps(), text: '旧回复', ...old })
  const late = [...timer.callbacks]
  player.cancel()
  assert.equal(player.isRunning, false)
  assert.equal(await stopped, false)
  assert.equal(timer.timers.size, 0)
  const oldSnapshot = structuredClone({ states: old.states, texts: old.texts })
  const current = recorder()
  const next = player.run({ steps: steps(), text: '新回复', ...current })
  late.forEach(callback => callback())
  assert.deepEqual({ states: old.states, texts: old.texts }, oldSnapshot)
  assert.equal(player.isRunning, true)
  timer.flush()
  assert.equal(await next, true)
  assert.equal(current.texts.at(-1), '新回复')
  assert.equal(timer.timers.size, 0)
  player.cancel()
})

test('cancel from a synchronous state callback prevents any later callback or scheduled work', async () => {
  const { player, timer } = setup()
  const output = recorder()
  const result = player.run({ steps: steps(), text: '不会展示', onText: output.onText, onStates(value) { output.onStates(value); player.cancel() } })
  assert.equal(await result, false)
  assert.equal(output.states.length, 1)
  assert.deepEqual(output.texts, [])
  assert.equal(timer.timers.size, 0)
  assert.equal(player.isRunning, false)
})

test('cancel during text output can synchronously start a replacement run without stale completion', async () => {
  const { player, timer } = setup()
  const output = recorder()
  const replacement = recorder()
  let next
  const result = player.run({ steps: steps(), text: '旧文字', onStates: output.onStates, onText(value) {
    output.onText(value)
    if (!value) return
    player.cancel()
    next = player.run({ steps: steps(), text: '替代结果', ...replacement })
  } })
  timer.flush()
  assert.equal(await result, false)
  assert.equal(await next, true)
  assert.deepEqual(output.texts.filter(Boolean), ['旧'])
  assert.equal(output.states.at(-1).at(-1).status, 'running')
  assert.equal(replacement.texts.at(-1), '替代结果')
  assert.equal(timer.timers.size, 0)
})

for (const callback of ['onStates', 'onText']) {
  test(`${callback} errors reject the run and release it for retry`, async () => {
    const { player, timer } = setup()
    const error = new Error(`${callback} failed`)
    const output = recorder()
    const failed = player.run({ steps: steps(), text: '错误', ...output, [callback]() { throw error } })
    const rejection = assert.rejects(failed, value => value === error)
    timer.flush()
    await rejection
    assert.equal(player.isRunning, false)
    assert.equal(timer.timers.size, 0)
    const retry = player.run({ steps: steps(), text: '重试成功', ...output })
    timer.flush()
    assert.equal(await retry, true)
    assert.equal(output.texts.at(-1), '重试成功')
  })
}

test('a throwing callback that also cancels still reports its failure without affecting a replacement', async () => {
  const { player, timer } = setup()
  const error = new Error('cancel then throw')
  let replacement
  const failed = player.run({ steps: steps(), text: '旧结果', onText() {}, onStates() {
    player.cancel()
    replacement = player.run({ steps: steps(), text: '新结果', ...recorder() })
    throw error
  } })
  await assert.rejects(failed, value => value === error)
  assert.equal(player.isRunning, true)
  timer.flush()
  assert.equal(await replacement, true)
  assert.equal(timer.timers.size, 0)
})

test('reduced motion emits the whole reply once while retaining ordered step transitions and no timers', async () => {
  const { player, timer } = setup()
  const output = recorder()
  const result = player.run({ steps: steps(), text: '完整😀回复', reducedMotion: true, ...output })
  assert.equal(await result, true)
  assert.deepEqual(output.texts, ['完整😀回复'])
  assert.deepEqual(output.states.map(value => value.map(item => item.status)), [
    ['pending', 'pending', 'pending'], ['running', 'pending', 'pending'],
    ['done', 'pending', 'pending'], ['done', 'running', 'pending'],
    ['done', 'done', 'pending'], ['done', 'done', 'running'], ['done', 'done', 'done']
  ])
  assert.equal(timer.callbacks.length, 0)
  assert.equal(player.isRunning, false)
})

test('empty steps and empty text still complete without retaining timers', async () => {
  const { player, timer } = setup()
  const output = recorder()
  const result = player.run({ steps: [], text: '', ...output })
  timer.flush()
  assert.equal(await result, true)
  assert.deepEqual(output.states, [[]])
  assert.deepEqual(output.texts, [''])
  assert.equal(timer.timers.size, 0)
})
