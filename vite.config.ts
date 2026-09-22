import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-rewrite-middleware',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            const url = req.url ? req.url.split('?')[0] : '';
            if (url === '/privacy' || url === '/privacy/') {
              req.url = '/privacy.html';
            } else if (url === '/PrivacyPolicy' || url === '/privacypolicy' || url === '/PrivacyPolicy/') {
              req.url = '/PrivacyPolicy.html';
            } else if (url === '/about' || url === '/about/') {
              req.url = '/about.html';
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          privacyPolicy: path.resolve(__dirname, 'PrivacyPolicy.html'),
          about: path.resolve(__dirname, 'about.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
