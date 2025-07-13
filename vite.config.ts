import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import tsConfigPaths from 'vite-tsconfig-paths';
import * as packageJson from './package.json';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsConfigPaths(),
    dts({ rollupTypes: true, tsconfigPath: './tsconfig.app.json' })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/component/index.ts'),
      name: 'playstack',
      formats: ['umd', 'es'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return 'style.css';
          return assetInfo.name || 'asset';
        }
      }
    },
    emptyOutDir: true
  }
});
