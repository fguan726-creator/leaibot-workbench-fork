import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { after, test } from 'node:test'

// Mount the compiled SFC in Vue's real renderer. The host supplies only DOM geometry
// and native popover methods; component state, events and lifecycle remain real.
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(appRoot, 'package.json'))
const vueUrl = pathToFileURL(require.resolve('vue/dist/vue.runtime.esm-bundler.js')).href
const { parse, compileScript } = require('vue/compiler-sfc')
const ts = require('typescript')
const sourcePath = path.join(appRoot, 'src/views/points/PointsSelect.vue')
const source = await readFile(sourcePath, 'utf8')
const compiled = compileScript(parse(source).descriptor, { id: 'points-select-qa', inlineTemplate: true }).content
const js = ts.transpileModule(compiled.replace(/from ['"]vue['"]/g, `from ${JSON.stringify(vueUrl)}`), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText
const temporary = await mkdtemp(path.join(tmpdir(), 'points-select-qa-'))
await writeFile(path.join(temporary, 'PointsSelect.mjs'), js)
after(() => rm(temporary, { recursive: true, force: true }))
const { default: PointsSelect } = await import(pathToFileURL(path.join(temporary, 'PointsSelect.mjs')).href)
const { createRenderer, h, reactive, ref, nextTick, KeepAlive } = await import(vueUrl)

function eventTarget() {
  const listeners = new Map()
  return {
    listeners,
    addEventListener(type, listener) {
      const group = listeners.get(type) || new Set()
      group.add(listener)
      listeners.set(type, group)
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener) },
    dispatch(type, event = {}) { for (const listener of [...(listeners.get(type) || [])]) listener(event) },
    count() { return [...listeners.values()].reduce((count, group) => count + group.size, 0) }
  }
}
const documentHost = { ...eventTarget(), activeElement: null, documentElement: { clientWidth: 1000, clientHeight: 800 } }
const windowHost = { ...eventTarget(), innerWidth: 1000, innerHeight: 800, visualViewport: eventTarget() }
globalThis.document = documentHost
globalThis.window = windowHost
const observers = new Set()
globalThis.ResizeObserver = class {
  observe() { observers.add(this) }
  disconnect() { observers.delete(this) }
}
function node(tag, text = '') {
  return {
    tag, tagName: tag.toUpperCase(), text, props: {}, children: [], parent: null,
    value: '', scrollTop: 0, clientHeight: 180, popoverVisible: false,
    ...eventTarget(),
    get offsetTop() { return (this.parent?.children.indexOf(this) || 0) * 40 },
    offsetHeight: 40,
    get scrollHeight() { return Math.max(40, this.children.length * 40) },
    contains(target) { return this === target || this.children.some(child => child.contains(target)) },
    closest(selector) { let current = this; while (current) { if (current.tag === selector) return current; current = current.parent }; return null },
    getBoundingClientRect() { return this.rect || { top: 300, bottom: 336, left: 100, right: 360, width: 260, height: 36 } },
    showPopover() { this.popoverVisible = true },
    hidePopover() { this.popoverVisible = false },
    removeAttribute(key) { delete this.props[key] },
    focus() { documentHost.activeElement = this }
  }
}
function detach(el) {
  if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1)
  el.parent = null
}
const renderer = createRenderer({
  createElement: tag => node(tag), createText: text => node('#text', text), createComment: text => node('#comment', text),
  setText: (el, text) => { el.text = text }, setElementText: (el, text) => { el.text = text; el.children = [] },
  parentNode: el => el.parent, nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1] || null,
  patchProp(el, key, previous, value) { el.props[key] = value; if (key === 'value') el.value = value },
  insert(el, parent, anchor = null) { detach(el); el.parent = parent; const index = anchor ? parent.children.indexOf(anchor) : -1; if (index < 0) parent.children.push(el); else parent.children.splice(index, 0, el) },
  remove: detach
})
function all(root, predicate) { return [root, ...root.children.flatMap(child => all(child, predicate))].filter(predicate) }
function content(el) { return el.text + el.children.map(content).join('') }
function event(fields = {}) {
  return { preventDefault() { this.defaultPrevented = true }, stopPropagation() { this.propagationStopped = true }, ...fields }
}
async function fire(el, name, fields = {}) {
  const e = event({ target: el, currentTarget: el, ...fields })
  const listeners = el.props[name]
  for (const listener of Array.isArray(listeners) ? listeners : listeners ? [listeners] : []) await listener(e)
  await nextTick()
  await nextTick()
  await nextTick()
  return e
}
const options = [
  { value: 'ACT-100', label: '开学活动（进行中）', description: 'ACT-100', keywords: '开学' },
  { value: 'ACT-200', label: '国庆活动（已结束）', description: 'ACT-200', keywords: '黄金周' },
  { value: 'ACT-300', label: '年终活动（未开始）', description: 'ACT-300' }
]
async function mount(extra = {}, useKeepAlive = false) {
  const props = reactive({ modelValue: 'ACT-100', label: '活动', options: options.map(option => ({ ...option })), searchable: true, ...extra })
  const emitted = []
  const changed = []
  const shown = ref(true)
  const host = node('dialog')
  const renderSelect = () => h(PointsSelect, { ...props, 'onUpdate:modelValue': value => { emitted.push(value); props.modelValue = value }, onChange: value => changed.push(value) })
  const app = renderer.createApp({ setup: () => () => useKeepAlive ? h(KeepAlive, null, { default: () => shown.value ? renderSelect() : h('div', 'hidden') }) : renderSelect() })
  app.mount(host)
  await nextTick()
  const input = () => all(host, el => el.props.role === 'combobox')[0]
  const items = () => all(host, el => el.props.role === 'option')
  const panel = () => all(host, el => el.props.role === 'listbox')[0]
  return { props, emitted, changed, shown, host, input, items, panel, app,
    async open() { await fire(input(), 'onClick') },
    async type(value) { input().value = value; await fire(input(), 'onInput') },
    async key(key, extra = {}) { return fire(input(), 'onKeydown', { key, ...extra }) }
  }
}
function assertClean() {
  assert.equal(documentHost.count(), 0, 'document listeners released')
  assert.equal(windowHost.count(), 0, 'window listeners released')
  assert.equal(windowHost.visualViewport.count(), 0, 'viewport listeners released')
  assert.equal(observers.size, 0, 'observer disconnected')
}

test('search filters name, number and keywords without changing the selection', async () => {
  const c = await mount()
  try {
    assert.equal(c.input().value, options[0].label)
    await c.open()
    await c.type('国庆')
    assert.equal(c.items().length, 1)
    assert.match(content(c.items()[0]), /国庆.*ACT-200/)
    assert.deepEqual(c.emitted, [])
    await c.type('act-300')
    assert.match(content(c.items()[0]), /年终/)
    await c.type('黄金周')
    assert.match(content(c.items()[0]), /国庆/)
    await c.type('')
    assert.equal(c.items().length, 3)
    await c.type('没有该活动')
    assert.equal(c.items().length, 0)
    assert.match(content(c.panel()), /未找到匹配活动/)
    await c.key('Enter')
    assert.deepEqual(c.emitted, [])
    assert.equal(c.props.modelValue, 'ACT-100')
    await c.key('Escape')
    assert.equal(c.input().value, options[0].label)
  } finally { c.app.unmount(); assertClean() }
})

test('click and Enter explicitly select an option and emit both events once', async () => {
  const c = await mount()
  try {
    await c.open()
    const down = await fire(c.items()[1], 'onPointerdown')
    assert.equal(down.defaultPrevented, true)
    await fire(c.items()[1], 'onClick')
    assert.equal(c.props.modelValue, 'ACT-200')
    assert.deepEqual(c.emitted, ['ACT-200'])
    assert.deepEqual(c.changed, ['ACT-200'])
    assert.equal(c.input().props['aria-expanded'], false)
    await c.open()
    await c.type('ACT-300')
    assert.equal(c.input().props['aria-activedescendant'], c.items()[0].props.id)
    await c.key('Enter')
    assert.deepEqual(c.emitted, ['ACT-200', 'ACT-300'])
    await c.open()
    await c.type('ACT-300')
    await c.key('Enter')
    assert.deepEqual(c.changed, ['ACT-200', 'ACT-300'])
  } finally { c.app.unmount(); assertClean() }
})

test('Escape, Tab, outside pointer and blur cancel text and retain the selected value', async () => {
  const c = await mount()
  try {
    for (const action of ['Escape', 'Tab', 'outside', 'blur']) {
      await c.open(); await c.type('国庆')
      if (action === 'outside') documentHost.dispatch('pointerdown', event({ target: node('outside') }))
      else if (action === 'blur') await fire(all(c.host, el => el.props.class === 'points-field points-select')[0], 'onFocusout', { relatedTarget: node('outside') })
      else await c.key(action)
      await nextTick()
      assert.equal(c.input().props['aria-expanded'], false, action)
      assert.equal(c.input().value, options[0].label, action)
      assert.deepEqual(c.emitted, [])
      assertClean()
    }
  } finally { c.app.unmount(); assertClean() }
})

test('arrow navigation and composition protect selection and Escape consumes the dialog key', async () => {
  const c = await mount()
  try {
    await c.key('ArrowDown')
    assert.equal(c.input().props['aria-expanded'], true)
    await c.key('ArrowDown')
    assert.equal(c.input().props['aria-activedescendant'], c.items()[1].props.id)
    await fire(c.input(), 'onCompositionstart')
    await c.key('Enter', { isComposing: true })
    assert.deepEqual(c.emitted, [])
    await fire(c.input(), 'onCompositionend')
    await c.key('Enter', { keyCode: 229 })
    assert.deepEqual(c.emitted, [])
    await c.key('Enter')
    assert.equal(c.props.modelValue, 'ACT-200')
    await c.open()
    const escape = event({ key: 'Escape', target: c.input() })
    documentHost.dispatch('keydown', escape)
    await nextTick()
    assert.equal(escape.defaultPrevented, true)
    assert.equal(escape.propagationStopped, true)
    assert.equal(c.input().props['aria-expanded'], false)
    await c.open()
    const cancel = event()
    c.host.dispatch('cancel', cancel)
    await nextTick()
    assert.equal(cancel.defaultPrevented, true)
    assert.equal(cancel.propagationStopped, true)
    assert.equal(c.input().props['aria-expanded'], false)
  } finally { c.app.unmount(); assertClean() }
})

test('disabled, empty and changing options never silently clear or commit a selection', async () => {
  const c = await mount({ disabled: true })
  try {
    await c.open(); await c.key('ArrowDown')
    assert.equal(c.input().props['aria-expanded'], false)
    assert.equal(c.input().props.disabled, true)
    c.props.disabled = false
    await nextTick(); await c.open()
    c.props.options = []
    await nextTick()
    assert.equal(c.input().props['aria-expanded'], false)
    assert.equal(c.props.modelValue, 'ACT-100')
    assert.equal(c.input().value, '当前选项不可用')
    await c.open()
    assert.equal(c.input().props['aria-expanded'], false)
    c.props.options = options.map(option => ({ ...option }))
    c.props.modelValue = 'ACT-300'
    await nextTick()
    assert.equal(c.input().value, options[2].label)
    await c.open(); await c.type('国庆')
    c.props.options = [options[0], options[2]]
    await nextTick()
    assert.equal(c.items().length, 0)
    await c.key('Enter')
    assert.deepEqual(c.emitted, [])
    c.props.disabled = true
    await nextTick()
    assert.equal(c.input().props['aria-expanded'], false)
    assertClean()
  } finally { c.app.unmount(); assertClean() }
})

test('ordinary selection is readonly and accepts an explicit empty-string option', async () => {
  const c = await mount({ searchable: false, modelValue: 'done', options: [{ value: '', label: '全部状态' }, { value: 'done', label: '已结束' }] })
  try {
    assert.equal(c.input().props.readonly, true)
    await c.open()
    await c.type('自由输入')
    assert.equal(c.items().length, 2)
    assert.deepEqual(c.emitted, [])
    await fire(c.items()[0], 'onClick')
    assert.deepEqual(c.emitted, [''])
    assert.equal(c.input().value, '全部状态')
    await c.key('ArrowUp')
    await c.key('End')
    await c.key('Enter')
    assert.equal(c.props.modelValue, 'done')
  } finally { c.app.unmount(); assertClean() }
})

test('local popover flips above near the viewport bottom and closes on KeepAlive leave', async () => {
  const c = await mount({}, true)
  try {
    c.input().rect = { top: 730, bottom: 766, left: 900, right: 1160, width: 260, height: 36 }
    await c.open()
    const panel = c.panel()
    assert.equal(panel.popoverVisible, true)
    assert.ok(c.host.contains(panel), 'popover remains within the dialog DOM')
    assert.ok(parseFloat(panel.props.style.top) < 730, 'flips above')
    assert.ok(parseFloat(panel.props.style.left) + parseFloat(panel.props.style.width) <= 992, 'clamped to viewport')
    // A long label gains height after the popup adopts the trigger width.
    Object.defineProperty(panel, 'scrollHeight', { get: () => parseFloat(panel.props.style.width) <= 260 ? 240 : 80 })
    panel.props.style.width = '500px'
    windowHost.dispatch('resize')
    await nextTick()
    await nextTick()
    assert.equal(parseFloat(panel.props.style.top), 486, 'flipped position uses height after width constraint')
    assert.ok(documentHost.count() > 0)
    c.shown.value = false
    await nextTick()
    assert.equal(panel.popoverVisible, false)
    assertClean()
    c.shown.value = true
    await nextTick()
    assert.equal(c.input().props['aria-expanded'], false)
    await c.open()
    assert.equal(c.panel().popoverVisible, true)
  } finally { c.app.unmount(); assertClean() }
})
