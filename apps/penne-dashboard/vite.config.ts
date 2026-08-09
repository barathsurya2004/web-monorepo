import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in current working directory
  const env = loadEnv(mode, process.cwd(), '');
  const targetServer = env.VITE_BACKEND_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    envDir: './', // Looks for .env inside apps/penne-dashboard/
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: targetServer,
          changeOrigin: true,
          secure: false,
          rewrite: (pathStr) => pathStr.replace(/^\/api/, '')
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  };
});
