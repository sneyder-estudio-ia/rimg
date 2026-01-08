import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel output error mentions 'build', so we set outDir to 'build' instead of the default 'dist'
    outDir: 'build',
  },
});