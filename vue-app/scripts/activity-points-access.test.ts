import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canUseActivityPoints,
  isActivityPointsDemoPreview,
  withActivityPointsMenu
} from '../src/services/activityPointsAccess.ts'

test('积分菜单与操作拒绝未登录、普通无权限账号', () => {
  assert.equal(canUseActivityPoints(null, '平台管理员', ['*']), false)
  assert.equal(canUseActivityPoints('reader', '工作台用户', []), false)
  assert.equal(withActivityPointsMenu({}, 'reader', '工作台用户', []).points, undefined)
})
test('管理员具有积分权限，业务查看权限不自动授予修改或导出', () => {
  assert.equal(canUseActivityPoints('admin', '平台管理员', ['*'], 'configure'), true)
  assert.equal(canUseActivityPoints('reader', '工作台用户', ['points.activity.view']), true)
  for (const action of ['configure', 'extend', 'export', 'settle'] as const) {
    assert.equal(
      canUseActivityPoints('reader', '工作台用户', ['points.activity.view'], action),
      false
    )
  }
  assert.equal(
    canUseActivityPoints(
      'operator',
      '运营',
      ['points.activity.view', 'points.activity.extend'],
      'extend'
    ),
    true
  )
})
test('积分菜单添加不改变既有菜单和权限，只有操作权限不能绕过查看权限', () => {
  const old = { order: { icon: '', label: '订单管理', children: {} } }
  const next = withActivityPointsMenu(old, 'admin', '平台管理员', ['*'])
  assert.deepEqual(next.order, old.order)
  assert.equal(next.points.children['points.activity'].path, '/points/activity')
  assert.equal(Object.hasOwn(old, 'points'), false)
  assert.equal(
    canUseActivityPoints('operator', '运营', ['points.activity.configure'], 'configure'),
    false
  )
})

test('new 预览已登录账号可体验纯模拟流程，但不授予正式权限', () => {
  const permissions = ['portal.home']
  for (const action of ['view', 'configure', 'extend', 'export', 'settle'] as const) {
    assert.equal(canUseActivityPoints('pm', '工作台用户', permissions, action, true), true)
    assert.equal(canUseActivityPoints('pm', '工作台用户', permissions, action, false), false)
    assert.equal(canUseActivityPoints(null, null, permissions, action, true), false)
  }
  assert.equal(
    withActivityPointsMenu({}, 'pm', '工作台用户', permissions, true).points.children[
      'points.activity'
    ].path,
    '/points/activity'
  )
  assert.deepEqual(permissions, ['portal.home'])
})

test('演示访问仅限明确的 new 主机，不延伸到正式站或相似域名', () => {
  for (const [host, expected] of [
    ['new.leaibot.cn', true],
    ['leaibot.cn', false],
    ['new.leaibot.cn.example.com', false],
    ['localhost', false]
  ] as const) {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { hostname: host } }
    })
    try {
      assert.equal(isActivityPointsDemoPreview(), expected)
    } finally {
      Reflect.deleteProperty(globalThis, 'window')
    }
  }
  assert.equal(isActivityPointsDemoPreview(), false)
})
