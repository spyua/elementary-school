import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// 本機與 e2e 測試用根目錄 /；部署到 GitHub Pages 時由 CI 設定 BASE_PATH=/<儲存庫名稱>/。
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: BASE,
  build: {
    rollupOptions: {
      // 入口程式命名為 main-*.js，service worker 只預先快取它；學期包（其他 assets/*.js）用到才快取。
      output: { entryFileNames: 'assets/main-[hash].js' },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // 圖示由 npx pwa-assets-generator 產生（設定在 pwa-assets.config.js），這裡直接列在 manifest。
      // icons/* 已在 globPatterns 裡，不要再自動加入一次。
      includeManifestIcons: false,
      manifest: {
        name: '小學互動教室',
        short_name: '互動教室',
        lang: 'zh-Hant-TW',
        display: 'standalone',
        background_color: '#fff8e7',
        theme_color: '#fff8e7',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 只預先快取 App 外殼；學期包與 emoji 圖檔等用到（或按「下載教材」）時才存起來。
        globPatterns: ['index.html', '**/*.css', 'assets/main-*.js', 'sfx/*.mp3', 'icons/*'],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/assets\/[^/]+\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            // 檔名含雜湊，改版後舊檔不會再被用到；限制數量避免越存越多。
            options: { cacheName: 'packs', expiration: { maxEntries: 50 } },
          },
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/emoji\/[^/]+\.svg$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'emoji' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
