// Fluent Emoji 繪製：從 public/emoji/ 載入 SVG 圖檔。
// 圖檔放在 public/，網址要加上 BASE_URL，部署到子路徑（GitHub Pages）時才找得到。
import { el, txt, svg } from './svg.js';
import { EMOJI_FILE } from './emoji-map.js';

/** 圖檔網址。 */
export function emojiUrl(name) { return `${import.meta.env.BASE_URL}emoji/${name}.svg`; }

/** 引擎共用圖（public/ui/）的網址。 */
export function uiUrl(name) { return `${import.meta.env.BASE_URL}ui/${name}.svg`; }

/** emoji 字元對應的圖檔名；對照表沒有就回傳 undefined。查表前先去掉變體選擇符（U+FE0F）。 */
export function emojiFile(ch) {
  if (typeof ch !== 'string') return undefined;
  return EMOJI_FILE[ch] ?? EMOJI_FILE[ch.replace(/️/g, '')];
}

// 只對 <text> 有意義的屬性，畫成 <image> 時不寫進 DOM。
const TEXT_ONLY = new Set(['text-anchor', 'dominant-baseline', 'fill', 'stroke', 'stroke-width',
  'font-weight', 'font-family', 'paint-order', 'letter-spacing']);

/** 圖檔載入失敗時的替代圖：把文字 emoji 包成一張 SVG data URI。 */
function textEmojiUri(ch) {
  const doc = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    + `<text x="50" y="54" font-size="80" text-anchor="middle" dominant-baseline="middle">${ch}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(doc)}`;
}

/**
 * 參數同 txt()。對照表有這個 emoji 就畫 <image>，沒有就直接回傳 txt() 的 <text>。
 *
 * 舊程式把 <text> 的 x、y 當「中心點」讀寫，但 <image> 的 x、y 是「左上角」。
 * 所以在這個 <image> 本身覆寫 getAttribute / setAttribute（稱為 shim，墊片）：
 * 讀寫 x、y 時拿到的仍是中心點，真正寫進 DOM 的是「中心點 − 邊長/2」。
 * 改 font-size 會重算邊長，中心點不動。textContent 讀到原本的 emoji 字元。
 * 不呼叫 Math.random，不影響對照測試。
 */
export function emojiAt(x, y, ch, attrs = {}, parent = svg) {
  const file = emojiFile(ch);
  if (!file) return txt(x, y, ch, attrs, parent);

  const rawGet = Element.prototype.getAttribute;
  const rawSet = Element.prototype.setAttribute;
  let fontSize = attrs['font-size'] ?? 40;
  let size = Math.round((parseFloat(fontSize) || 40) * 1.15);
  let current = ch;

  const img = el('image', { href: emojiUrl(file), width: size, height: size, class: 'svgtxt' }, parent);
  for (const k in attrs) {
    if (k === 'x' || k === 'y' || k === 'font-size' || TEXT_ONLY.has(k)) continue;
    rawSet.call(img, k, attrs[k]);
  }

  // 中心點存在 data-cx / data-cy，DOM 的 x、y 由它換算。
  const place = () => {
    rawSet.call(img, 'x', Number(img.dataset.cx) - size / 2);
    rawSet.call(img, 'y', Number(img.dataset.cy) - size / 2);
  };
  img.dataset.cx = x;
  img.dataset.cy = y;
  place();

  img.getAttribute = function (name) {
    if (name === 'x') return this.dataset.cx;
    if (name === 'y') return this.dataset.cy;
    if (name === 'font-size') return String(fontSize);
    return rawGet.call(this, name);
  };
  img.setAttribute = function (name, value) {
    if (name === 'x') { this.dataset.cx = value; place(); return; }
    if (name === 'y') { this.dataset.cy = value; place(); return; }
    if (name === 'font-size') {
      fontSize = value;
      size = Math.round((parseFloat(value) || 40) * 1.15);
      rawSet.call(this, 'width', size);
      rawSet.call(this, 'height', size);
      place();
      return;
    }
    if (TEXT_ONLY.has(name)) return;
    rawSet.call(this, name, value);
  };
  // 換字元時一併換圖；新字元沒有對照圖就用文字 emoji 的 data URI。
  Object.defineProperty(img, 'textContent', {
    configurable: true,
    get: () => current,
    set: v => {
      current = String(v);
      const f = emojiFile(current);
      rawSet.call(img, 'href', f ? emojiUrl(f) : textEmojiUri(current));
    },
  });

  // 圖檔載入失敗（離線又沒下載、檔名打錯）：同一個節點改用文字 emoji，舊程式手上的參照仍然有效。
  // 已經是 data URI 就不再換，避免重複觸發。
  img.addEventListener('error', () => {
    if (!String(rawGet.call(img, 'href')).startsWith('data:')) rawSet.call(img, 'href', textEmojiUri(current));
  });
  return img;
}

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
