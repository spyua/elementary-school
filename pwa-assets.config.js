// PWA 圖示：用 Fluent Emoji 的「Books」（Flat）當來源，執行 npx pwa-assets-generator 產生到 public/icons/。
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // 透明底的 emoji 在主畫面上會看不清楚，可遮罩圖示與 Apple 圖示改用奶油色底。
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#fff8e7' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#fff8e7' } },
  },
  images: ['public/icons/books.svg'],
});
