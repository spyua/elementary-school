// 選擇題範本：看圖選字（show 'emoji'、answerBy 'label'）或看字選圖（show 'label'、answerBy 'emoji'）。
// 產生的題目是 mode 'pick'，和手寫題型走同一套練習引擎。
import { drawCard, needItems, pickOptions, speakItem, langOf, colX } from './card.js';
import { say } from '../engine/speech.js';

/**
 * cfg: { items, options = 3, show, answerBy, prompt(target), promptLang?, explain(target) }
 * 回傳題型函式 () => PracticeItem。
 */
export function makeChoiceType(cfg) {
  const { items, options = 3, show = 'emoji', answerBy = 'label', promptLang = 'zh-TW' } = cfg;
  needItems(items, options, 'makeChoiceType');
  return () => {
    const { target, options: opts, answer } = pickOptions(items, options);
    const prompt = cfg.prompt(target);
    const cardH = answerBy === 'emoji' ? 130 : 90;
    return {
      mode: 'pick', prompt, answer, target, options: opts,
      async ask(id) { await say(prompt, id, { lang: promptLang }); },
      draw() {
        drawCard(400, 110, show === 'emoji' ? 170 : 300, show === 'emoji' ? 170 : 110, target, show);
        return opts.map((o, i) => drawCard(colX(i, opts.length, 220), 320, 190, cardH, o, answerBy));
      },
      async explain(id) {
        await say(cfg.explain(target), id);
        if (langOf(target) !== 'zh-TW') await speakItem(target, id);
      },
    };
  };
}
