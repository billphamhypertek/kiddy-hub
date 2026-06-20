/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Brand palette (kept in sync with src/art/tokens.ts).
const THEME = '#ff8c42'; // Cáo orange — primary brand hue
const BACKGROUND = '#fef6ec'; // warm cream page background

export default defineConfig({
  plugins: [
    react(),
    // PWA: installable + offline. Build-time only — `injectRegister: 'auto'`
    // wires the service-worker registration into the built HTML with NO
    // app-code import (no `virtual:pwa-register`), so vitest/jsdom are never
    // touched. `devOptions.enabled: false` means no SW runs in dev or tests.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: false },
      includeAssets: [
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-512.png',
      ],
      workbox: {
        // Precache the full app shell AND the code-split chunks so every game
        // works offline. Phaser is a ~1.5 MB lazy chunk — precaching it is the
        // whole point, so raise the per-file cap above its size.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'KiddyHub',
        short_name: 'KiddyHub',
        description: 'Sân chơi học tập cho bé mầm non',
        lang: 'vi',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: THEME,
        background_color: BACKGROUND,
        categories: ['education', 'kids', 'games'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      phaser: new URL('./src/test/phaser-stub.ts', import.meta.url).pathname,
    },
  },
});
