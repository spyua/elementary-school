// 英文示範（試玩）學期包：只有一個「認識英文單字」單元。
// 這個檔案只用範本（choice、listen、match、explainer），不直接呼叫 el、txt 等繪圖函式，
// 用來證明不寫繪圖程式也能做出完整單元，並驗證英文語音。
// 名稱、圖示、說明等中繼資料放在 catalog.js；這裡只放場景與題型。
import { registerTypes } from '../../../engine/practice.js';
import { makeChoiceType } from '../../../templates/choice.js';
import { makeListenType } from '../../../templates/listen.js';
import { makeMatchType } from '../../../templates/match.js';
import { makeExplainerScene } from '../../../templates/explainer.js';

// 詞彙：emoji 是 public/emoji/ 的檔名（Fluent Emoji Flat 版，檔名改成英文單字）。
const word = key => ({ key, label: key, emoji: key, lang: 'en-US' });
// 8 個單字裡有 4 個動物；sun 不是食物，但為了兩個場景各 4 個，放在第一組，場景標題寫明「和太陽」。
const FOODS = ['apple', 'banana', 'egg', 'sun'].map(word);
const ANIMALS = ['cat', 'dog', 'fish', 'bird'].map(word);
const WORDS = [...FOODS, ...ANIMALS];

// 中文句子用中文語音唸，所以句子裡不放英文單字；英文單字一律用 lang: 'en-US' 另外唸。

/** 每個單字兩個步驟：先顯示圖並用中文說「這是」，再保留同一張圖用英文唸單字。 */
const introSteps = items => items.flatMap(it => [
  { emoji: it.emoji, text: it.label, say: '這是' },
  { say: it.label, lang: 'en-US' },
]);

const scenes = [
  makeExplainerScene({
    title: '水果、食物和太陽',
    steps: [
      { say: '我們來學英文單字！先看看水果、食物，還有天上的太陽。' },
      ...introSteps(FOODS),
      { say: '你記住了嗎？下一個場景看看動物。' },
    ],
  }),
  makeExplainerScene({
    title: '動物',
    steps: [
      { say: '再來認識動物。' },
      ...introSteps(ANIMALS),
      { say: '全部學會了！來做練習吧！' },
    ],
  }),
];

const TYPES = {
  enListen: makeListenType({
    items: WORDS,
    options: 3,
    prompt: '聽一聽，是哪一個？',
    explain: () => '答案是這一個，再聽一次：',
  }),
  enChoice: makeChoiceType({
    items: WORDS,
    options: 3,
    show: 'emoji',
    answerBy: 'label',
    prompt: () => '這個的英文是哪一個？',
    explain: () => '這個的英文是：',
  }),
  enMatch: makeMatchType({
    items: WORDS,
    pairs: 3,
    left: 'label',
    right: 'emoji',
    prompt: '把英文字和圖片連起來！',
  }),
};
registerTypes(TYPES);

const bodies = {
  words: { scenes, practice: Object.keys(TYPES), count: 6 },
};

export default { bodies, reviews: {} };
