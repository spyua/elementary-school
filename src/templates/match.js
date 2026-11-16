// 配對範本：左右兩欄，把對應的項目連起來（練習引擎的 mode 'match'）。
// draw() 回傳的區域前 pairs 個是左欄、後 pairs 個是右欄；answer[i] 是左邊第 i 項對應右邊第幾項。
import { drawCard, needItems, speakItem, langOf } from './card.js';
import { say } from '../engine/speech.js';
import { shuffle } from '../engine/util.js';

const rowY = (i, n) => 210 - ((n - 1) * 110) / 2 + i * 110;

/** cfg: { items, pairs = 3, left, right, prompt }；回傳 () => PracticeItem（mode 'match'）。 */
export function makeMatchType(cfg) {
  const { items, pairs = 3, left: leftBy = 'label', right: rightBy = 'emoji', prompt } = cfg;
  needItems(items, pairs, 'makeMatchType');
  return () => {
    const left = shuffle(items).slice(0, pairs);
    const right = shuffle(left);
    const answer = left.map(it => right.findIndex(r => r.key === it.key));
    return {
      mode: 'match', prompt, answer, left, right,
      async ask(id) { await say(prompt, id); },
      draw() {
        const h = Math.min(96, 330 / pairs);
        const l = left.map((it, i) => drawCard(200, rowY(i, pairs), 220, h, it, leftBy));
        const r = right.map((it, i) => drawCard(600, rowY(i, pairs), 220, h, it, rightBy));
        return l.concat(r);
      },
      async explain(id) {
        for (const it of left) {
          if (langOf(it) !== 'zh-TW') await speakItem(it, id);
          else await say(it.sayText || it.label, id);
        }
      },
    };
  };
}
