import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import tsConfigPaths from 'vite-tsconfig-paths';
import * as packageJson from './package.json';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({
      include: ['src/component/']
    })
  ],
  build: {
    lib: {
      entry: resolve('src', 'component/index.tsx'),
      name: 'Playstack',
      formats: ['es', 'umd'],
      fileName: (format) => `playstack.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)]
    }
  }
}));
