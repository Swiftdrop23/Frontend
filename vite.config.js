import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
  test: {
    // Apply before importing modules with a captured API base (auth/http), too.
    env: { VITE_API_URL: '' },
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
