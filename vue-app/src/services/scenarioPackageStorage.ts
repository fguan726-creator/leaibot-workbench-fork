import type { ScenarioSkillPackage } from '../stores/scenarioSkillPackages'

const STORAGE_KEY = 'leai_scenario_skill_packages_v1'
const SCHEMA_VERSION = 2

export interface ScenarioPackageStoredState {
  schemaVersion?: 1 | 2
  packages: ScenarioSkillPackage[]
  seededOwners: string[]
}

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
const optionalStrings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => value[key] === undefined || typeof value[key] === 'string')

function validRequest(value: unknown): boolean {
  return isObject(value) && typeof value.input === 'string' && typeof value.expectedOutput === 'string'
    && ['activeOptionalStepIds', 'confirmedStepIds', 'approvedStepIds'].every(key => strings(value[key]))
    && isObject(value.sampleOutputs) && Object.values(value.sampleOutputs).every(item => typeof item === 'string')
}

function validReport(value: unknown): boolean {
  if (!isObject(value) || value.mode !== 'simulation' || value.executionPerformed !== false
    || !['completed', 'attention', 'blocked'].includes(String(value.status))
    || !['id', 'fingerprint', 'createdAt', 'testerId', 'summary'].every(key => typeof value[key] === 'string')
    || !validRequest(value.request) || !strings(value.issues) || !Array.isArray(value.nodes)) return false
  return value.nodes.every(node => isObject(node)
    && ['id', 'name', 'task', 'fixedRequirements', 'expectedOutput', 'condition', 'output'].every(key => typeof node[key] === 'string')
    && ['completed', 'skipped', 'blocked'].includes(String(node.status)) && strings(node.issues)
    && (node.errors === undefined || strings(node.errors)) && (node.suggestions === undefined || strings(node.suggestions))
    && Array.isArray(node.inputs) && node.inputs.every(input => isObject(input) && typeof input.name === 'string' && typeof input.value === 'string')
    && (node.downstream === undefined || (Array.isArray(node.downstream) && node.downstream.every(item => isObject(item)
      && ['nodeId', 'name', 'status', 'sentValue', 'receivedValue', 'detail'].every(key => typeof item[key] === 'string')))))
}

function validPackage(value: unknown, depth = 0): value is ScenarioSkillPackage {
  if (!isObject(value) || depth > 1) return false
  if (!['id', 'name', 'ownerId', 'version', 'updatedAt'].every(key => typeof value[key] === 'string' && value[key].trim())) return false
  if (!['description', 'targetAudience'].every(key => typeof value[key] === 'string')) return false
  if (!optionalStrings(value, ['baseUpdatedAt', 'approvedAt', 'publishedAt', 'submittedAt', 'submittedBy', 'submitterId', 'reviewedAt', 'reviewedBy', 'reviewNote', 'degradationNote'])) return false
  if (value.revisionEditors !== undefined && (!strings(value.revisionEditors) || value.revisionEditors.some(id => !id.trim()))) return false
  if (!Number.isFinite(Date.parse(value.updatedAt as string))) return false
  if (!['draft', 'review', 'rejected', 'published', 'disabled'].includes(String(value.status))) return false
  if (value.onlineStatus !== undefined && !['unpublished', 'published', 'disabled'].includes(String(value.onlineStatus))) return false
  if (!Array.isArray(value.steps) || !value.steps.every(step => isObject(step)
    && ['id', 'skillId', 'name', 'menu', 'pinnedVersion', 'currentPublishedVersion'].every(key => typeof step[key] === 'string')
    && optionalStrings(step, ['condition', 'task', 'fixedRequirements', 'expectedOutput', 'inputDescription'])
    && (step.predecessorId === undefined || step.predecessorId === null || typeof step.predecessorId === 'string')
    && ['available', 'expired', 'unavailable', 'emergency_disabled', 'update_available'].includes(String(step.dependencyState))
    && typeof step.required === 'boolean' && isObject(step.permissions)
    && ['menu', 'skill', 'data', 'action'].every(bucket => strings((step.permissions as Record<string, unknown>)[bucket])))) return false
  if (!isObject(value.health) || !['healthy', 'upgrade_required', 'degraded', 'paused'].includes(String(value.health.status))
    || !['explanations', 'blockedStepIds', 'degradedStepIds'].every(key => strings((value.health as Record<string, unknown>)[key]))) return false
  if (value.auditEvents !== undefined && (!Array.isArray(value.auditEvents) || !value.auditEvents.every(event => isObject(event)
    && ['submitted', 'approved', 'published', 'rejected', 'withdrawn', 'disabled', 'enabled'].includes(String(event.type))
    && typeof event.actorId === 'string' && typeof event.at === 'string' && optionalStrings(event, ['note'])))) return false
  if (value.testRequest !== undefined && !validRequest(value.testRequest)) return false
  if (value.testReport !== undefined && !validReport(value.testReport)) return false
  return value.publishedSnapshot === undefined || validPackage(value.publishedSnapshot, depth + 1)
}

/** Unsupported or damaged browser data must not break the package page or create a runnable partial record. */
export function readScenarioPackageState(): ScenarioPackageStoredState | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!isObject(value) || (value.schemaVersion !== 1 && value.schemaVersion !== SCHEMA_VERSION) || !Array.isArray(value.packages)
      || !value.packages.every(item => validPackage(item)) || !strings(value.seededOwners)) return null
    if (new Set(value.packages.map(item => item.id)).size !== value.packages.length) return null
    return { schemaVersion: value.schemaVersion as 1 | 2, packages: value.packages, seededOwners: value.seededOwners }
  } catch {
    return null
  }
}

/** localStorage writes are synchronous; callers commit memory only after this returns. */
export function writeScenarioPackageState(state: ScenarioPackageStoredState): void {
  try {
    if (!globalThis.localStorage) throw new Error('Storage unavailable')
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }))
  } catch {
    throw new Error('场景技能包保存失败，请检查浏览器本地存储空间或访问权限后重试；本次修改未保存')
  }
}
