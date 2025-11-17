import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-core': ['@mui/material', '@mui/system'],
          'mui-icons': ['@mui/icons-material'],
          'mui-pickers': ['@mui/x-date-pickers', 'date-fns'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
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
    // Force pre-bundling of react-is to resolve export issues with React 19
    include: [
      'react-is',
      'prop-types',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'recharts',
      'lodash',
    ],
  },
});
