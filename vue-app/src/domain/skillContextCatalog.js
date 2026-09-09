/** @typedef {'page' | 'api'} SkillContextSourceType */
/** @typedef {'affected' | 'optional'} SkillContextChangeRole */
/**
 * @typedef {object} SkillContextItem
 * @property {string} code
 * @property {string} name
 * @property {string} subtitle
 * @property {string} source
 * @property {string} menuPath
 * @property {SkillContextSourceType=} sourceType
 * @property {string=} version
 * @property {string=} currentVersion
 * @property {string=} targetVersion
 * @property {SkillContextChangeRole=} changeRole
 * @property {boolean} selected
 * @property {boolean} recommended
 */

/**
 * @typedef {object} SkillAffectedContextUpdate
 * @property {string} contextId
 * @property {string} name
 * @property {string} menuPath
 * @property {string} currentVersion
 * @property {string} targetVersion
 */

/**
 * @typedef {object} SkillOptionalContextUpdate
 * @property {string} contextId
 * @property {string} name
 * @property {string} menuPath
 * @property {string} version
 * @property {string=} summary
 */

/**
 * @typedef {object} SkillContextUpdate
 * @property {string} baseMenu
 * @property {string} summary
 * @property {SkillAffectedContextUpdate[]} affectedContexts
 * @property {SkillOptionalContextUpdate[]} optionalContexts
 */

/**
 * @typedef {object} PagelessSkillContext
 * @property {string} contextId
 * @property {string} name
 * @property {string} description
 * @property {SkillContextSourceType} sourceType
 */

/**
 * @typedef {object} PagelessSkillContextGroup
 * @property {string} groupId
 * @property {string} groupLabel
 * @property {PagelessSkillContext[]} contexts
 */

/** @type {PagelessSkillContextGroup[]} */
export const PAGELESS_SKILL_CONTEXT_GROUPS = [
  {
    groupId: 'private-customization',
    groupLabel: '私人订制',
    contexts: [
      {
        contextId: 'customization.top-ranking',
        name: '私定 TOP 榜单',
        description: '用户针对私定官方喷绘中TOP 甄选榜进行图片或顺序调整',
        sourceType: 'api'
      }
    ]
  }
]

/**
 * @returns {string[]}
 */
export function getPagelessSkillMenuLabels() {
  return PAGELESS_SKILL_CONTEXT_GROUPS.map(group => group.groupLabel)
}

/**
 * @param {string} [activeMenu='']
 * @returns {SkillContextItem[]}
 */
export function createPagelessContextItems(activeMenu = '') {
  return PAGELESS_SKILL_CONTEXT_GROUPS.flatMap(group => group.contexts.map(context => ({
    code: context.contextId,
    name: context.name,
    subtitle: context.description,
    source: group.groupLabel,
    menuPath: `${group.groupLabel} / ${context.name}`,
    sourceType: context.sourceType,
    selected: false,
    recommended: activeMenu === group.groupLabel
  })))
}

/**
 * @param {string[]} pageMenuLabels
 * @returns {string[]}
 */
export function mergeSkillMenuLabels(pageMenuLabels) {
  return [...new Set([...pageMenuLabels, ...getPagelessSkillMenuLabels()])]
}

/**
 * @param {SkillContextItem[]} pageItems
 * @param {string} [activeMenu='']
 * @param {SkillContextUpdate | null} [update=null]
 * @returns {SkillContextItem[]}
 */
export function mergeSkillContextItems(pageItems, activeMenu = '', update = null) {
  const knownBaseCodes = new Set()
  const baseItems = [...pageItems, ...createPagelessContextItems(activeMenu)].filter(item => {
    if (knownBaseCodes.has(item.code)) return false
    knownBaseCodes.add(item.code)
    return true
  })
  if (!update) return baseItems.map(item => ({ ...item }))

  const affected = new Map(update.affectedContexts.map(context => [context.contextId, context]))
  const optional = new Map(update.optionalContexts.map(context => [context.contextId, context]))
  const items = baseItems.map(item => {
    const affectedContext = affected.get(item.code)
    if (affectedContext) {
      return {
        ...item,
        name: affectedContext.name,
        menuPath: affectedContext.menuPath,
        currentVersion: affectedContext.currentVersion,
        targetVersion: affectedContext.targetVersion,
        changeRole: /** @type {const} */ ('affected'),
        recommended: true
      }
    }

    const optionalContext = optional.get(item.code)
    if (optionalContext) {
      return {
        ...item,
        name: optionalContext.name,
        subtitle: optionalContext.summary || item.subtitle,
        menuPath: optionalContext.menuPath,
        version: optionalContext.version,
        changeRole: /** @type {const} */ ('optional'),
        recommended: true
      }
    }

    return { ...item }
  })

  const knownCodes = new Set(items.map(item => item.code))
  const additions = [
    ...update.affectedContexts.map(context => ({
      code: context.contextId,
      name: context.name,
      subtitle: update.summary,
      source: context.menuPath.split('/')[0]?.trim() || update.baseMenu,
      menuPath: context.menuPath,
      currentVersion: context.currentVersion,
      targetVersion: context.targetVersion,
      changeRole: /** @type {const} */ ('affected'),
      selected: false,
      recommended: true
    })),
    ...update.optionalContexts.map(context => ({
      code: context.contextId,
      name: context.name,
      subtitle: context.summary || update.summary,
      source: context.menuPath.split('/')[0]?.trim() || update.baseMenu,
      menuPath: context.menuPath,
      version: context.version,
      changeRole: /** @type {const} */ ('optional'),
      selected: false,
      recommended: true
    }))
  ].filter(item => {
    if (knownCodes.has(item.code)) return false
    knownCodes.add(item.code)
    return true
  })

  return [...items, ...additions]
}
