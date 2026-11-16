// 講解場景範本：依序顯示圖文並朗讀，可以穿插「按一下繼續」。
// 有 emoji 或 text 的步驟會換掉畫面；只有 say 的步驟保留上一張圖（例如先說「這是」，再用英文唸單字）。
import { txt, clear } from '../engine/svg.js';
import { drawEmoji } from '../engine/emoji.js';
import { say } from '../engine/speech.js';
import { askChoice } from '../engine/ui.js';

/**
 * cfg: { title, steps: [{ emoji?, text?, say, lang?, tapLabel? }] }
 * 回傳和手寫場景相同的 { title, run(id) }，場景播放器不需要知道它來自範本。
 */
export function makeExplainerScene(cfg) {
  const { title, steps } = cfg;
  return {
    title,
    async run(id) {
      for (const st of steps) {
        if (st.emoji || st.text) {
          clear();
          if (st.emoji) drawEmoji(st.emoji, 400, st.text ? 170 : 210, 200, undefined, st.text || st.emoji);
          if (st.text) txt(400, st.emoji ? 340 : 210, st.text, { 'font-size': 48, fill: '#3d2c1e', class: 'svgtxt pop' });
        }
        await say(st.say, id, { lang: st.lang || 'zh-TW' });
        if (st.tapLabel) await askChoice([{ label: st.tapLabel, color: '#2bb673', value: true }], id);
      }
    },
  };
}
