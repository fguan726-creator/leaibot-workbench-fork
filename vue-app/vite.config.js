import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { localPocAdminPlugin } from './scripts/local-poc-admin-plugin.mjs'

export default defineConfig({
  base: '/admin-vue/',
  plugins: [vue(), localPocAdminPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // 把所有 /api 请求代理到后端，开发时与原项目保持一致
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    // 将 Vue 产物打包到 /admin-vue/ 目录，与部署 base 保持一致
    outDir: '../public/admin-vue',
    emptyOutDir: true
  }
})
