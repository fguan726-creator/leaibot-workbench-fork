import assert from 'node:assert/strict'
import { test } from 'node:test'
import { localPocAdminPlugin } from './local-poc-admin-plugin.mjs'

const config = { command: 'serve', mode: 'development', envDir: '.', env: {}, server: { host: '127.0.0.1' } }
const canary = 'test-only-not-a-real-password'
for (const [name, override] of [
  ['build', { command: 'build' }],
  ['preview build', { command: 'build', env: { VITE_AUTH_MODE: 'preview' } }],
  ['preview server', { isPreview: true }],
  ['production mode', { isProduction: true }],
  ['server auth', { env: { VITE_AUTH_MODE: 'server' } }],
  ['unknown auth', { env: { VITE_AUTH_MODE: 'unknown' } }],
  ['all interfaces', { server: { host: true } }],
  ['network IP', { server: { host: '0.0.0.0' } }]
]) {
  test(name + ': does not read or emit local credentials', () => {
    const plugin = localPocAdminPlugin(() => { throw new Error('Must not read secrets') })
    plugin.configResolved({ ...config, ...override })
    assert.equal(plugin.load(plugin.resolveId('virtual:local-poc-admin')), 'export default null')
  })
}
for (const host of [undefined, 'localhost', '127.0.0.1', '::1']) {
  test('loopback preview ' + host + ': local opt-in only', () => {
    const plugin = localPocAdminPlugin(() => ({ LOCAL_POC_ADMIN_PASSWORD: canary }))
    plugin.configResolved({ ...config, server: { host } })
    assert.equal(plugin.load(plugin.resolveId('virtual:local-poc-admin')), 'export default ' + JSON.stringify(canary))
    assert.equal(plugin.resolveId('unrelated'), undefined)
    assert.equal(plugin.load('unrelated'), undefined)
    plugin.configResolved({ ...config, command: 'build' })
    assert.equal(plugin.load(plugin.resolveId('virtual:local-poc-admin')), 'export default null')
  })
}
test('unconfigured and empty credentials do not expose a shortcut', () => {
  for (const env of [{}, { LOCAL_POC_ADMIN_PASSWORD: '' }]) {
    const plugin = localPocAdminPlugin(() => env)
    plugin.configResolved(config)
    assert.equal(plugin.load(plugin.resolveId('virtual:local-poc-admin')), 'export default null')
  }
})
