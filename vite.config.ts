import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  // Set base to './' so asset paths are relative — works on GitHub Pages
  // under any repo name (e.g. https://user.github.io/reponame/).
  base: './',

  plugins: [
    react(),
    // Copy the sql.js WASM file into dist so it can be fetched at runtime.
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/sql.js/dist/sql-wasm-browser.wasm',
          dest: '',
        },
      ],
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        // Keep sql.js as a separate chunk to avoid huge main bundle.
        manualChunks: {
          sqljs: ['sql.js'],
        },
      },
    },
  },
});
