import { spawn } from 'node:child_process'

const host = '127.0.0.1'
const port = Number(process.env.PORTAL_SMOKE_PORT || 4173)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORTAL_SMOKE_PORT: ${process.env.PORTAL_SMOKE_PORT}`)
}
const baseUrl = `http://${host}:${port}/admin-vue`
const routes = ['/', '/portal/home', '/dashboard/overview']

const preview = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort',
    ...(process.env.PORTAL_SMOKE_OUT_DIR ? ['--outDir', process.env.PORTAL_SMOKE_OUT_DIR] : [])
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] }
)

let output = ''
preview.stdout.on('data', chunk => { output += chunk.toString() })
preview.stderr.on('data', chunk => { output += chunk.toString() })

try {
  await waitForServer()
  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`)
    const html = await response.text()
    assert(response.ok, `${route} returned ${response.status}`)
    assert(html.includes('<div id="app"></div>'), `${route} did not return Vue shell entry`)
    assert(html.includes('/admin-vue/assets/'), `${route} did not reference built assets`)
  }
  console.log(`Shell smoke passed: ${routes.join(', ')}`)
} finally {
  preview.kill('SIGTERM')
}

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 10000) {
    if (preview.exitCode !== null) {
      throw new Error(`vite preview exited early\n${output}`)
    }
    try {
      const response = await fetch(`${baseUrl}/`)
      if (response.ok) return
    } catch {
      // keep waiting
    }
    await delay(150)
  }
  throw new Error(`vite preview did not start in time\n${output}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
