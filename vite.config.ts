import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import packageJson from './package.json' with { type: 'json' }

// The user-site Pages deployment serves both development and production at the origin root.
export default defineConfig(() => ({
  base: '/',
  define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
  server: { host: '127.0.0.1', proxy: { '/api/public': { target: 'http://127.0.0.1:3001' } } },
  plugins: [react(), tailwindcss()],
}))
