// 聽音選擇範本：先唸題目，再用詞彙自己的語言唸出目標詞，孩子從圖卡中選出聽到的那一個。
// 字幕只顯示題目，不寫出目標詞，避免看字就知道答案。
import { drawCard, needItems, pickOptions, speakItem, langOf, colX } from './card.js';
import { say } from '../engine/speech.js';

/** cfg: { items, options = 3, prompt, explain(target) }；回傳 () => PracticeItem（mode 'pick'）。 */
export function makeListenType(cfg) {
  const { items, options = 3, prompt } = cfg;
  needItems(items, options, 'makeListenType');
  return () => {
    const { target, options: opts, answer } = pickOptions(items, options);
    return {
      mode: 'pick', prompt, answer, target, options: opts,
      async ask(id) { await say(prompt, id); await speakItem(target, id); },
      draw() {
        const gap = opts.length > 3 ? 180 : 220;
        return opts.map((o, i) => drawCard(colX(i, opts.length, gap), 230, gap - 30, 170, o, 'emoji'));
      },
      async explain(id) {
        await say(cfg.explain(target), id);
        if (langOf(target) !== 'zh-TW') await speakItem(target, id);
      },
    };
  };
}
