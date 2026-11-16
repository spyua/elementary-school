// Fluent Emoji 繪製：從 public/emoji/ 載入 SVG 圖檔。
// 圖檔放在 public/，網址要加上 BASE_URL，部署到子路徑（GitHub Pages）時才找得到。
import { el, txt, svg } from './svg.js';

/** 圖檔網址。 */
export function emojiUrl(name) { return `${import.meta.env.BASE_URL}emoji/${name}.svg`; }

/**
 * 以 (x, y) 為中心畫一張 emoji 圖，回傳包住它的 <g>。
 * 圖檔載入失敗（離線、檔名打錯）時，改在同一位置顯示 fallback 文字，畫面不會空一塊。
 */
export function drawEmoji(name, x, y, size, parent = svg, fallback = name) {
  const g = el('g', { class: 'emoji', 'data-emoji': name }, parent);
  const img = el('image', { href: emojiUrl(name), x: x - size / 2, y: y - size / 2, width: size, height: size }, g);
  img.addEventListener('error', () => {
    img.remove();
    txt(x, y, fallback, { 'font-size': Math.max(16, Math.round(size / 3)), fill: '#3d2c1e' }, g);
  }, { once: true });
  return g;
}
