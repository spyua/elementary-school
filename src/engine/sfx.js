// 音效（Kenney Interface Sounds，CC0）。和朗讀分開開關：S.sfxMuted 為 true 時不播放。
// 音效只是點綴，載入或播放失敗（例如瀏覽器還不允許出聲）時直接忽略。
import { S } from './state.js';

const NAMES = ['correct', 'wrong', 'star', 'tap'];

/** @param {'correct'|'wrong'|'star'|'tap'} name */
export function playSfx(name) {
  if (S.sfxMuted || !NAMES.includes(name)) return;
  try {
    const p = new Audio(`${import.meta.env.BASE_URL}sfx/${name}.mp3`).play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    /* 沒有 Audio 或不能播放，忽略 */
  }
}
