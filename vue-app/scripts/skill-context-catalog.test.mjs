import assert from 'node:assert/strict'
import test from 'node:test'

import {
  PAGELESS_SKILL_CONTEXT_GROUPS,
  createPagelessContextItems,
  getPagelessSkillMenuLabels,
  mergeSkillContextItems,
  mergeSkillMenuLabels
} from '../src/domain/skillContextCatalog.js'

const expectedDescription = '用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整'

test('registers the private customization API capability without a page path', () => {
  assert.deepEqual(getPagelessSkillMenuLabels(), ['私人订制'])
  assert.equal(PAGELESS_SKILL_CONTEXT_GROUPS.length, 1)

  const [group] = PAGELESS_SKILL_CONTEXT_GROUPS
  assert.equal(group.groupId, 'private-customization')
  assert.equal(group.groupLabel, '私人订制')
  assert.deepEqual(group.contexts, [{
    contextId: 'customization.top-ranking',
    name: '私定 TOP 榜单',
    description: expectedDescription,
    sourceType: 'api'
  }])
  assert.equal('path' in group.contexts[0], false)
})

test('recommends the active pageless capability without selecting it', () => {
  const [inactive] = createPagelessContextItems('')
  const [active] = createPagelessContextItems('私人订制')

  assert.deepEqual(inactive, {
    code: 'customization.top-ranking',
    name: '私定 TOP 榜单',
    subtitle: expectedDescription,
    source: '私人订制',
    menuPath: '私人订制 / 私定 TOP 榜单',
    sourceType: 'api',
    selected: false,
    recommended: false
  })
  assert.equal(active.recommended, true)
  assert.equal(active.selected, false)
  assert.equal('path' in active, false)
})

test('merges pageless menu labels after page menus without duplicates', () => {
  assert.deepEqual(mergeSkillMenuLabels(['乐享运营']), ['乐享运营', '私人订制'])
  assert.deepEqual(mergeSkillMenuLabels(['乐享运营', '私人订制']), ['乐享运营', '私人订制'])
})

test('deduplicates page and pageless contexts by stable code without an update', () => {
  const pageContext = {
    code: 'customization.top-ranking',
    name: '私定 TOP 榜单页面',
    subtitle: '页面能力描述',
    source: '私人订制',
    menuPath: '私人订制 / 私定 TOP 榜单页面',
    selected: false,
    recommended: false
  }

  const items = mergeSkillContextItems([pageContext], '私人订制')

  assert.equal(items.filter(item => item.code === pageContext.code).length, 1)
  assert.deepEqual(items[0], pageContext)
  assert.notEqual(items[0], pageContext)
})

test('applies an update once when page and pageless contexts share a stable code', () => {
  const items = mergeSkillContextItems([
    {
      code: 'customization.top-ranking',
      name: '私定 TOP 榜单页面',
      subtitle: '页面能力描述',
      source: '私人订制',
      menuPath: '私人订制 / 私定 TOP 榜单页面',
      selected: false,
      recommended: false
    }
  ], '私人订制', {
    baseMenu: '私人订制',
    summary: '能力发生变化',
    affectedContexts: [
      {
        contextId: 'customization.top-ranking',
        name: '私定 TOP 榜单（更新）',
        menuPath: '私人订制 / 私定 TOP 榜单',
        currentVersion: 'v1',
        targetVersion: 'v2'
      }
    ],
    optionalContexts: []
  })

  assert.equal(items.filter(item => item.code === 'customization.top-ranking').length, 1)
  assert.deepEqual(items[0], {
    code: 'customization.top-ranking',
    name: '私定 TOP 榜单（更新）',
    subtitle: '页面能力描述',
    source: '私人订制',
    menuPath: '私人订制 / 私定 TOP 榜单',
    currentVersion: 'v1',
    targetVersion: 'v2',
    changeRole: 'affected',
    selected: false,
    recommended: true
  })
})

test('merges page and API contexts while preserving update overlays and stable codes', () => {
  const pageItems = [
    {
      code: 'dashboard.overview',
      name: '数据总览',
      subtitle: '原页面描述',
      source: '乐享运营',
      menuPath: '乐享运营 / 数据总览',
      selected: false,
      recommended: false
    },
    {
      code: 'ops.traffic',
      name: '用户流量',
      subtitle: '原流量描述',
      source: '乐享运营',
      menuPath: '乐享运营 / 用户流量',
      selected: false,
      recommended: false
    }
  ]
  const update = {
    baseMenu: '私人订制',
    summary: '能力发生变化',
    affectedContexts: [
      {
        contextId: 'dashboard.overview',
        name: '数据总览（更新）',
        menuPath: '乐享运营 / 数据总览',
        currentVersion: 'v3',
        targetVersion: 'v4'
      },
      {
        contextId: 'customization.top-ranking',
        name: '私定 TOP 榜单',
        menuPath: '私人订制 / 私定 TOP 榜单',
        currentVersion: 'v1',
        targetVersion: 'v2'
      }
    ],
    optionalContexts: [
      {
        contextId: 'ops.traffic',
        name: '用户流量（可选）',
        menuPath: '乐享运营 / 用户流量',
        version: 'v5',
        summary: '可选流量能力'
      },
      {
        contextId: 'customization.asset-library',
        name: '喷绘素材库',
        menuPath: '私人订制 / 喷绘素材库',
        version: 'v1',
        summary: '可选素材查询能力'
      }
    ]
  }

  const originalPageItems = structuredClone(pageItems)
  const originalUpdate = structuredClone(update)
  const items = mergeSkillContextItems(pageItems, '私人订制', update)

  assert.deepEqual(pageItems, originalPageItems)
  assert.deepEqual(update, originalUpdate)
  assert.deepEqual(items[0], {
    code: 'dashboard.overview',
    name: '数据总览（更新）',
    subtitle: '原页面描述',
    source: '乐享运营',
    menuPath: '乐享运营 / 数据总览',
    currentVersion: 'v3',
    targetVersion: 'v4',
    changeRole: 'affected',
    selected: false,
    recommended: true
  })
  assert.deepEqual(items[1], {
    code: 'ops.traffic',
    name: '用户流量（可选）',
    subtitle: '可选流量能力',
    source: '乐享运营',
    menuPath: '乐享运营 / 用户流量',
    version: 'v5',
    changeRole: 'optional',
    selected: false,
    recommended: true
  })
  assert.deepEqual(items.find(item => item.code === 'customization.top-ranking'), {
    code: 'customization.top-ranking',
    name: '私定 TOP 榜单',
    subtitle: '用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整',
    source: '私人订制',
    menuPath: '私人订制 / 私定 TOP 榜单',
    sourceType: 'api',
    currentVersion: 'v1',
    targetVersion: 'v2',
    changeRole: 'affected',
    selected: false,
    recommended: true
  })
  assert.equal(items.filter(item => item.code === 'customization.top-ranking').length, 1)
  assert.deepEqual(items.at(-1), {
    code: 'customization.asset-library',
    name: '喷绘素材库',
    subtitle: '可选素材查询能力',
    source: '私人订制',
    menuPath: '私人订制 / 喷绘素材库',
    version: 'v1',
    changeRole: 'optional',
    selected: false,
    recommended: true
  })
})
