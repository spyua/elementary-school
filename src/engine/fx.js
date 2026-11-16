// 裝飾特效：紙花、星星爆開、物件跳一下、碎屑。
// 規則（守住對照測試）：
// - 不呼叫 Math.random。位置與顏色用固定公式，或用 rng.js 的 mulberry32（固定種子）。
// - 全部是 CSS 動畫，函式不回傳 Promise，呼叫端也不用 await，時間軸不會變。
// - 紙花、星星放在 #svg 外面，pointer-events: none，不會擋住 iPad 點擊，clear() 也清不到。
import { mulberry32 } from './rng.js';
import { uiUrl } from './emoji.js';

const COLORS = ['#ff5a5f', '#ffbe0b', '#3a86ff', '#2bb673', '#9b7bd8', '#ff8c42'];

function layer(container, cls) {
  const box = document.createElement('div');
  box.className = `fx-layer ${cls}`;
  box.setAttribute('aria-hidden', 'true');
  container.appendChild(box);
  // 動畫播完就移除，避免一直累積。
  setTimeout(() => box.remove(), 2200);
  return box;
}

/**
 * 在 container（通常是 #stage）裡灑約 24 片紙花。
 * 同一個 seed 每次灑出來的圖樣都一樣。
 */
export function confetti(container, { seed = 1, count = 24 } = {}) {
  if (!container) return;
  container.querySelectorAll('.fx-confetti').forEach(n => n.remove());
  const r = mulberry32(seed);
  const box = layer(container, 'fx-confetti');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece' + (i % 3 === 0 ? ' round' : '');
    p.style.left = `${(4 + r() * 92).toFixed(1)}%`;
    p.style.background = COLORS[i % COLORS.length];
    p.style.setProperty('--dx', `${Math.round((r() - .5) * 120)}px`);
    p.style.setProperty('--rot', `${Math.round(360 + r() * 540)}deg`);
    p.style.animationDelay = `${Math.round(r() * 250)}ms`;
    p.style.animationDuration = `${Math.round(1100 + r() * 500)}ms`;
    box.appendChild(p);
  }
}

/**
 * 從 (xPct, yPct)（container 的百分比位置）往外爆開 8 顆星星。
 * 角度是固定的，不用亂數。
 */
export function starBurst(container, { xPct = 50, yPct = 40, count = 8 } = {}) {
  if (!container) return;
  const box = layer(container, 'fx-burst');
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const s = document.createElement('img');
    s.className = 'burst-star';
    s.src = uiUrl('star');
    s.alt = '';
    s.style.left = `${xPct}%`;
    s.style.top = `${yPct}%`;
    s.style.setProperty('--dx', `${Math.round(Math.cos(a) * 110)}px`);
    s.style.setProperty('--dy', `${Math.round(Math.sin(a) * 80)}px`);
    s.style.animationDelay = `${(i % 2) * 60}ms`;
    box.appendChild(s);
  }
}

/** 讓元素重新播放一次某個 class 的動畫（例如 .hop）。 */
export function replay(node, cls) {
  if (!node || !node.classList) return;
  node.classList.remove(cls);
  // 讀一次版面，讓瀏覽器把「移除」生效，再加回去才會重播。
  if (node.getBoundingClientRect) node.getBoundingClientRect();
  node.classList.add(cls);
}

// 碎屑飛出去的固定角度（度）。
const CRUMB_ANGLES = [-150, -110, -70, -30, 10, 50];

/** 在 SVG 座標 (x, y) 冒出一圈碎屑（餅乾被吃掉時用）。只用 <circle>，不加 <text>。 */
export function crumbs(x, y, parent, color = '#c98f45') {
  if (!parent) return;
  const NS = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'crumbs');
  g.setAttribute('pointer-events', 'none');
  CRUMB_ANGLES.forEach((deg, i) => {
    const a = deg * Math.PI / 180, d = 30 + (i % 2) * 10;
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', 4 + (i % 3));
    c.setAttribute('fill', color);
    c.setAttribute('class', 'crumb');
    c.style.setProperty('--dx', `${Math.round(Math.cos(a) * d)}px`);
    c.style.setProperty('--dy', `${Math.round(Math.sin(a) * d)}px`);
    g.appendChild(c);
  });
  parent.appendChild(g);
  return g;
}
