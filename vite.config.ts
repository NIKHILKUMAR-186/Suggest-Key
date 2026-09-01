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
        '@': path.resolve(__dirname, '.'),
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
