import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    envPrefix: [
      'VITE_',
      'AUTH_',
      'DEV_',
      'PASSWORD_',
      'MAGIC_',
      'EMAIL_',
      'RATE_',
      'LOGIN_',
      'ROLE_',
      'SEGMENT_',
      'APP_',
      'SUGGEST_KEY_',
    ],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'node:async_hooks': path.resolve(__dirname, 'src/shims/async_hooks.ts'),
      },
    },
    optimizeDeps: {
      exclude: ['@tanstack/start-storage-context'],
    },
    build: {
      commonjsOptions: {
        include: [/@tanstack\/start-storage-context/, /node_modules/],
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        usePolling: true,
        interval: 100,
      },
    },
  };
});
