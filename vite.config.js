import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8080' } },
  test: {
    // Apply before importing modules with a captured API base (auth/http), too.
    env: { VITE_API_URL: '' },
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // The courier feature's tests use Node's built-in runner: node --test src/features/courier/statusRules.test.js
    exclude: [...configDefaults.exclude, 'src/features/courier/**'],
  },
})
