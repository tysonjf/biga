import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

const BG_DARK = '#14110f';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    cloudflare(),
    VitePWA({
      // Prompt instead of auto-reloading: never yank the page out from under someone mid-edit.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-48x48.png', 'apple-touch-icon-180x180.png', 'theme-init.js'],
      manifest: {
        id: '/',
        start_url: '/',
        scope: '/',
        name: 'Biga — preferment recipe book',
        short_name: 'Biga',
        description: 'Plan biga and poolish pizza doughs to the hour: yeast, water temperature and timing.',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait',
        background_color: BG_DARK,
        theme_color: BG_DARK,
        categories: ['food', 'lifestyle', 'utilities'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'New biga', short_name: 'Biga', url: '/?new=biga', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'New poolish', short_name: 'Poolish', url: '/?new=poolish', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        globIgnores: ['**/splash/**'],
        navigateFallback: '/index.html',
        // Never answer API calls (auth included) with the app shell.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Offline data comes from the persisted TanStack Query cache, not the SW.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2022',
  },
});
