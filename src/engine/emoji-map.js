// emoji 字元與圖檔的對照表（純資料，不 import 任何東西，單元測試與建置設定都能直接讀）。
// 圖檔來自 Microsoft Fluent Emoji Flat（MIT），由 scripts/fetch-fluent.mjs 下載。
// 新增一個字元時：先在 scripts/fetch-fluent.mjs 加檔名對照並重跑，再到這裡加一行，
// 最後在 src/content/credits.json 的 Fluent Emoji usage 補上「檔名 ← Fluent 原名」。

/**
 * emoji 字元 → public/emoji/ 檔名（不含 .svg）。
 * 鍵一律不含變體選擇符（U+FE0F）；查表時由 emojiFile() 先去掉它再比對。
 */
export const EMOJI_FILE = {
  // 物件與食物
  '🍎': 'apple',
  '🌟': 'glowing-star',
  '🎈': 'balloon',
  '🍓': 'strawberry',
  '🍪': 'cookie',
  '🍬': 'candy',
  '🚗': 'car',
  '⚽': 'soccer-ball',
  '🥕': 'carrot',
  '🥤': 'cup-with-straw',
  '🥄': 'spoon',
  '🍩': 'doughnut',
  '🦴': 'bone',
  '🌼': 'blossom',
  '🚂': 'locomotive',
  // 動物與人物
  '🐰': 'rabbit-face',
  '🐦': 'bird',
  '🐟': 'fish',
  '🐤': 'baby-chick',
  '🐶': 'dog',
  '🐥': 'front-facing-baby-chick',
  '🐢': 'turtle',
  '🐱': 'cat',
  '🐻': 'bear',
  '🐼': 'panda',
  '🐸': 'frog',
  '🐷': 'pig-face',
  '🐵': 'monkey-face',
  '🐔': 'chicken',
  '🐯': 'tiger-face',
  '🐝': 'honeybee',
  '🧒': 'child',
  '🐞': 'lady-beetle',
  // 生活事件卡
  '🪥': 'toothbrush',
  '😴': 'sleeping-face',
  '✏': 'pencil',
  '🛏': 'bed',
  '🎒': 'backpack',
  '🧼': 'soap',
  '🍚': 'cooked-rice',
  '🏫': 'school',
  '🧦': 'socks',
  '👟': 'running-shoe',
  '🚪': 'door',
  '🛁': 'bathtub',
  '👕': 't-shirt',
  // 口訣卡 icon
  '🔗': 'link',
  '🔢': 'input-numbers',
  '🎀': 'ribbon',
  '✂': 'scissors',
  '🏁': 'chequered-flag',
  '⚖': 'balance-scale',
  '⏳': 'hourglass-not-done',
  // 考試主題圖也可以用字元畫
  '🌳': 'deciduous-tree',
  '🏰': 'castle',
  '⏰': 'alarm-clock',
  '🌈': 'rainbow',
  '☁': 'cloud',
  '☀': 'sun',
  '🍭': 'lollipop',
  '🍰': 'shortcake',
};

/** 考試主題圖（public/emoji/）：期中、期末考的開場與背景用。 */
export const EXAM_THEME_FILES = ['deciduous-tree', 'castle', 'alarm-clock', 'rainbow', 'cloud', 'sun', 'lollipop', 'shortcake'];

/** 引擎共用圖（public/ui/）：吉祥物、星星、獎盃、獎牌、紙花。跟 App 外殼一起預先快取。 */
export const UI_FILES = [
  'mascot', 'star', 'trophy', 'medal-gold', 'medal-silver', 'medal-bronze',
  'sparkles', 'party-popper', 'confetti-ball', 'wrapped-gift',
];

/** 學期包 assets 用：教材圖相對 BASE_URL 的路徑（emoji/<name>.svg），已去重。 */
export function packEmojiAssets() {
  const names = new Set([...Object.values(EMOJI_FILE), ...EXAM_THEME_FILES]);
  return [...names].map(n => `emoji/${n}.svg`);
}
