import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/courier',
    rolldownOptions: { input: fileURLToPath(new URL('./preview.html', import.meta.url)) },
  },
});
