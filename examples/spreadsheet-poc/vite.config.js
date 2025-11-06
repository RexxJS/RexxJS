import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

// Plugin to copy RexxJS bundle (only during build, not dev server)
const copyRexxJSBundle = () => ({
  name: 'copy-rexxjs-bundle',
  closeBundle() {
    // Only copy during production builds, not when dev server closes
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    const source = resolve(__dirname, '../../core/src/repl/dist/rexxjs.bundle.js');
    const dest = resolve(__dirname, 'dist/rexxjs.bundle.js');
    try {
      copyFileSync(source, dest);
      console.log('Copied RexxJS bundle to dist/');
    } catch (err) {
      console.error('Failed to copy RexxJS bundle:', err.message);
    }
  }
});

export default defineConfig({
  plugins: [react(), copyRexxJSBundle()],

  // For Tauri, we need to use relative paths
  base: './',

  build: {
    outDir: 'dist',
    // Don't minify for easier debugging
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index-bundled.html')
      }
    }
  },

  server: {
    port: 5173,
    strictPort: true
  },

  // Resolve paths for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
