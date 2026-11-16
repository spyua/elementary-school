// 介面圖示：Tabler Icons（MIT），用 ?raw 把 SVG 原始碼打包進來，不需要額外網路請求。
// 給小孩用要粗、要大：線條版一律 stroke-width 2.5，尺寸至少 28px。
import home from '@tabler/icons/filled/home.svg?raw';
import kid from '@tabler/icons/filled/mood-kid.svg?raw';
import play from '@tabler/icons/filled/player-play.svg?raw';
import heart from '@tabler/icons/filled/heart.svg?raw';
import volume from '@tabler/icons/outline/volume.svg?raw';
import volumeOff from '@tabler/icons/outline/volume-off.svg?raw';
import music from '@tabler/icons/outline/music.svg?raw';
import musicOff from '@tabler/icons/outline/music-off.svg?raw';

const SOURCES = { home, kid, play, heart, volume, volumeOff, music, musicOff };

export const MIN_SIZE = 28;
export const STROKE = 2.5;

/** 建立圖示的 <svg> 元素；裝飾用，螢幕閱讀器略過（按鈕本身要有 title 或 aria-label）。 */
export function icon(name, size = MIN_SIZE) {
  const src = SOURCES[name];
  if (!src) throw new Error(`未知的圖示：${name}`);
  // 來源是打包進來的套件檔案，不是使用者輸入，可以安全地當 HTML 解析。
  const tpl = document.createElement('template');
  tpl.innerHTML = src.trim();
  const svg = tpl.content.querySelector('svg');
  const px = String(Math.max(MIN_SIZE, size));
  svg.setAttribute('width', px);
  svg.setAttribute('height', px);
  if (svg.getAttribute('stroke-width')) svg.setAttribute('stroke-width', String(STROKE));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.removeAttribute('class');
  svg.classList.add('ti', `ti-${name}`);
  return svg;
}
