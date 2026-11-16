// 範本共用的小工具：畫圖卡、檢查詞彙數量、取得要朗讀的文字。
import { el, txt } from '../engine/svg.js';
import { drawEmoji } from '../engine/emoji.js';
import { shuffle } from '../engine/util.js';
import { speakOne, chk } from '../engine/speech.js';

/**
 * 以 (cx, cy) 為中心畫一張圖卡，回傳練習引擎用的區域 { x, y, w, h, mx, my }。
 * by = 'emoji' 時畫圖（載入失敗顯示 label），'label' 時畫文字。
 */
export function drawCard(cx, cy, w, h, item, by, parent) {
  const x = cx - w / 2, y = cy - h / 2;
  const g = el('g', { class: 'card pop' }, parent);
  el('rect', { x, y, width: w, height: h, rx: 18, fill: '#fffaf0', stroke: '#e6d5b8', 'stroke-width': 3 }, g);
  if (by === 'emoji') drawEmoji(item.emoji, cx, cy, Math.min(w, h) - 24, g, item.label);
  else txt(cx, cy, item.label, { 'font-size': Math.min(40, Math.round(h * 0.42)), fill: '#3d2c1e' }, g);
  return { x, y, w, h, mx: cx, my: cy };
}

/** 詞彙不夠時在建立題型的當下就丟錯誤，不要等到孩子作答才壞掉。 */
export function needItems(items, n, name) {
  if (!Array.isArray(items) || items.length < n) {
    throw new Error(`${name}：items 至少要 ${n} 個，目前只有 ${Array.isArray(items) ? items.length : 0} 個`);
  }
}

/** 從 items 取出 target 與 n-1 個不同的干擾項，打亂後回傳 { target, options, answer }。 */
export function pickOptions(items, n) {
  const pool = shuffle(items);
  const target = pool[0];
  const options = shuffle(pool.slice(0, n));
  return { target, options, answer: options.findIndex(o => o.key === target.key) };
}

export const sayTextOf = it => it.sayText || it.label;
export const langOf = it => it.lang || 'zh-TW';

/** 只朗讀、不改字幕（例如聽音選圖時，字幕不能直接寫出答案）。 */
export async function speakItem(it, id) { chk(id); await speakOne(sayTextOf(it), langOf(it)); chk(id); }

/** 每列放 n 張卡時，第 i 張的中心 x（畫布寬 800）。 */
export const colX = (i, n, gap) => 400 - ((n - 1) * gap) / 2 + i * gap;
