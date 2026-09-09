import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = file => fs.readFileSync(path.join(app, file), 'utf8')
const contract = JSON.parse(read('design-baseline.lock.json'))
assert.equal(contract.recommendedSkillVersion, '2026-09-08')
assert.deepEqual(JSON.parse(read('design-skill.guard.json')).skillSearchDirs, ['../skill/portal-workbench-ui-0908'])
const files = ['src/views/agent/AgentPermissionsView.vue', 'src/views/AccessDeniedView.vue', ...fs.readdirSync(path.join(app, 'src/components/permissions')).filter(file => file.endsWith('.vue')).map(file => 'src/components/permissions/' + file)]
for (const file of files) {
  // Vue-scoped styles are the runtime UI. Standalone email HTML is a separate artifact.
  const styles = [...read(file).matchAll(/<style scoped>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n')
  assert.doesNotMatch(styles, /#[\da-f]{3,8}\b|rgba?\(/i, `${file}: use existing semantic color tokens`)
  assert.doesNotMatch(styles, /font-size:\s*(?:10|11|15|17|19|22|26)px/, `${file}: typography scale`)
  assert.doesNotMatch(styles, /backdrop-filter:\s*blur/, `${file}: no POC glass overlay`)
}
const footer = read('src/components/permissions/permissionDialogFooter.css')
assert.match(footer, /data-scroll-state="static"[^]*?position: static/)
assert.match(footer, /data-scroll-state="more"[^]*?box-shadow:/)
assert.doesNotMatch(read('src/main.ts'), /permissionDialogFooter|portal-workbench-ui-0908/)
console.log(`0908 permission UI contract passed: ${files.length} components, scoped styles and active Skill.`)
