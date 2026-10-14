import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { readScenarioPackageState, writeScenarioPackageState } from '../src/services/scenarioPackageStorage.ts'
import { saveScenarioPackageDraft } from '../src/domain/scenarioSkillPackages.js'

const previousStorage = globalThis.localStorage
let contents
globalThis.localStorage = { getItem: () => contents ?? null, setItem: (_key, value) => { contents = value } }
after(() => { if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage })

function packageOf() {
  return saveScenarioPackageDraft({
    id: 'workflow-storage', name: '执行要求保存', description: '', targetAudience: '', ownerId: 'owner', requiresConfirmation: true, steps: [],
    testRequest: { input: '', expectedOutput: '', activeOptionalStepIds: [], workflowConfirmed: false, confirmedStepIds: [], approvedStepIds: [], sampleOutputs: {} }
  }, { id: 'owner', permissions: ['*'] }, '2026-10-14T03:00:00.000Z')
}

test('browser persistence retains workflow choices and independent trial evidence', () => {
  const item = packageOf()
  writeScenarioPackageState({ packages: [item], seededOwners: ['owner'] })
  const restored = readScenarioPackageState()
  assert.equal(restored.packages[0].requiresConfirmation, true)
  assert.equal(restored.packages[0].testRequest.workflowConfirmed, false)
})

test('old browser records lacking workflow fields remain readable without mutating stored snapshots', () => {
  const item = packageOf()
  delete item.requiresConfirmation
  delete item.testRequest.workflowConfirmed
  writeScenarioPackageState({ packages: [item], seededOwners: ['owner'] })
  const before = contents
  assert.deepEqual(readScenarioPackageState().packages[0], JSON.parse(JSON.stringify(item)))
  assert.equal(contents, before)
})

test('malformed workflow policy or trial confirmation cannot become accepted browser evidence', () => {
  for (const invalid of ['true', 'false', 1, {}, null]) {
    const policy = packageOf()
    policy.requiresConfirmation = invalid
    writeScenarioPackageState({ packages: [policy], seededOwners: ['owner'] })
    assert.equal(readScenarioPackageState(), null)
    const request = packageOf()
    request.testRequest.workflowConfirmed = invalid
    writeScenarioPackageState({ packages: [request], seededOwners: ['owner'] })
    assert.equal(readScenarioPackageState(), null)
  }
})
