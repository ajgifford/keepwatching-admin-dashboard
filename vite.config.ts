import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    fs: {
      // Allow serving files from linked packages
      allow: ['..'],
    },
    watch: {
      // Watch for changes in linked packages
      followSymlinks: true,
    },
  },
  resolve: {
    // Deduplicate dependencies to avoid conflicts with linked packages
    dedupe: [
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      'recharts',
      '@ajgifford/keepwatching-types',
    ],
  },
  optimizeDeps: {
    // Force Vite to not pre-bundle the linked package
    exclude: ['@ajgifford/keepwatching-ui'],
  },
});
