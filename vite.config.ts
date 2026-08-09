import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // Default globs omit woff2; include it so the self-hosted numeral font is
      // precached and the app stays fully on-brand offline (NFR-4).
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      // NFR-4: the app must work offline after first load. Workbox precaches the
      // built app shell; there is no runtime network dependency to configure.
      manifest: {
        name: 'Hanabi — hint tracker',
        short_name: 'Hanabi',
        description:
          "Records the hints you receive about your own face-away Hanabi cards, so the memory bookkeeping stops crowding out the deduction.",
        theme_color: '#0d1014',
        background_color: '#0d1014',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
});
