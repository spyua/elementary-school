// 吉祥物小熊：放在字幕列旁邊（#mascotBox），不在 #svg 裡面，clear() 清不到它。
// 由事件驅動，本身不呼叫 Math.random，也不影響場景的時間軸：
// - lesson:say    detail.state 為 'start' 時張嘴說話，'end' 時停下。
// - lesson:answer detail.ok 為 true 跳一下、false 歪頭；detail.neutral 為 true 只點點頭（考試不透露對錯）。
import { uiUrl } from './emoji.js';

const REACT = ['jump', 'tilt', 'nod'];

/** 把小熊放進 #mascotBox 並開始監聽事件。重複呼叫不會放第二隻。 */
export function mountMascot(box = document.querySelector('#mascotBox')) {
  if (!box || box.querySelector('#mascot')) return null;
  const img = document.createElement('img');
  img.id = 'mascot';
  img.src = uiUrl('mascot');
  img.alt = '';
  img.draggable = false;
  // 圖檔載入失敗（離線又沒下載）時直接藏起來，不留破圖。
  img.addEventListener('error', () => { box.classList.add('hidden'); }, { once: true });
  box.appendChild(img);

  window.addEventListener('lesson:say', e => {
    img.classList.toggle('talk', e.detail?.state === 'start');
  });
  window.addEventListener('lesson:answer', e => {
    const d = e.detail || {};
    const cls = d.neutral ? 'nod' : d.ok ? 'jump' : 'tilt';
    img.classList.remove(...REACT);
    void img.offsetWidth; // 讓瀏覽器先套用「移除」，同一個動作連續兩次才會重播
    img.classList.add(cls);
  });
  // 說話動畫是無限循環，不會觸發 animationend；會結束的只有跳、歪頭、點頭。
  img.addEventListener('animationend', () => img.classList.remove(...REACT));
  return img;
}
