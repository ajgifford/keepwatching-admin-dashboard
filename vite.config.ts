import react from '@vitejs/plugin-react';

import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (['react/', 'react-dom/', 'react-router-dom/'].some((p) => id.includes(`/node_modules/${p}`))) {
            return 'vendor';
          }
          if (
            ['@mui/material/', '@mui/system/', '@emotion/react/', '@emotion/styled/'].some((p) =>
              id.includes(`/node_modules/${p}`),
            )
          ) {
            return 'mui-core';
          }
          if (id.includes('/node_modules/@mui/icons-material/')) {
            return 'mui-icons';
          }
          if (id.includes('/node_modules/@mui/x-date-pickers/') || id.includes('/node_modules/date-fns/')) {
            return 'mui-pickers';
          }
          if (['@reduxjs/toolkit/', 'react-redux/'].some((p) => id.includes(`/node_modules/${p}`))) {
            return 'redux';
          }
          if (id.includes('/node_modules/recharts/')) {
            return 'charts';
          }
        },
      },
    },
  },
  server: {
    port: 3005,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'https://localhost:3034',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Disable compression so SSE streams aren't buffered by http-proxy
            proxyReq.setHeader('accept-encoding', 'identity');
          });
        },
      },
      '/uploads': {
        target: 'https://localhost:3034',
        changeOrigin: true,
        secure: false,
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
  preview: {
    port: 3005,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'https://localhost:3034',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://localhost:3034',
        changeOrigin: true,
        secure: false,
      },
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
    ],
  },
});
