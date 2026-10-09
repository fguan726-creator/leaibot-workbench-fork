import { loadEnv } from 'vite'

const publicId = 'virtual:local-poc-admin'
const resolvedId = '\0' + publicId

/** Never load the local credential for builds, server auth, or network-facing dev servers. */
export function localPocAdminPlugin(readEnv = loadEnv) {
  let password = null
  return {
    name: 'local-poc-admin',
    configResolved(config) {
      password = null
      const localHost = config.server.host === undefined
        || ['localhost', '127.0.0.1', '::1'].includes(config.server.host)
      if (config.command !== 'serve' || config.isPreview || config.isProduction || !localHost
        || (config.env.VITE_AUTH_MODE || 'preview') !== 'preview') return
      const value = readEnv(config.mode, config.envDir, 'LOCAL_POC_').LOCAL_POC_ADMIN_PASSWORD
      password = typeof value === 'string' && value.length > 0 ? value : null
    },
    resolveId(id) {
      if (id === publicId) return resolvedId
    },
    load(id) {
      if (id === resolvedId) return 'export default ' + JSON.stringify(password)
    }
  }
}
