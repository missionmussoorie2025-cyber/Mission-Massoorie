import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function watiProxyPlugin(): Plugin {
  return {
    name: 'wati-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/api/wati-dispatch', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyStr = '';
        req.on('data', (chunk) => {
          bodyStr += chunk;
        });

        req.on('end', async () => {
          try {
            const { endpoint, token, phone, payload } = JSON.parse(bodyStr);
            const cleanEndpoint = (endpoint || 'https://live-mt-server.wati.io/10265277').replace(/\/+$/, '');
            const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
            const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

            const targetUrl = `${cleanEndpoint}/api/v1/sendTemplateMessage?whatsappNumber=${cleanPhone}`;
            const targetRes = await fetch(targetUrl, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const resData = await targetRes.json().catch(() => ({}));
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = targetRes.status;
            res.end(JSON.stringify(resData));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Internal error dispatching WATI message' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/Mission-Massoorie/',
    plugins: [
      react(),
      tailwindcss(),
      watiProxyPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: './',
          name: 'Mission Mussoorie 2027',
          short_name: 'Mussoorie27',
          description: 'Mission Mussoorie 2027: UPSC CSE syllabus progress tracker, spaced revisions, and study telemetry.',
          theme_color: '#172A46',
          background_color: '#F7F5F0',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
