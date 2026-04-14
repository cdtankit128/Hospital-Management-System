import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:8080'
  const isNgrok = backendUrl.includes('ngrok')

  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
    },
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
      // When using Ngrok, the frontend calls the backend directly (no proxy needed)
      // When local, use Vite's proxy to forward /api and /ws to the backend
      ...(!isNgrok && {
        proxy: {
          '/api': {
            target: backendUrl,
            changeOrigin: true,
          },
          '/ws': {
            target: backendUrl,
            changeOrigin: true,
            ws: true,
          },
        },
      }),
    },
  }
})
