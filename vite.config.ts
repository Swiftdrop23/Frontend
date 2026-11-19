import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
  test: {
    // Apply before importing modules with a captured API base (auth/http), too.
    env: { VITE_API_URL: '' },
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Slow laptops and CI runners: avoid false timeouts (Member 10)
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})