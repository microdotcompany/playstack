// playstack/vite.config.page.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsConfigPaths()],
  build: {
    outDir: 'page',
    // No lib config: this is a normal app build
    emptyOutDir: true
  },
  server: {
    host: true
  }
});
