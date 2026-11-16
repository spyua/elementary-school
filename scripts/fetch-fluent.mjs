// 下載 Microsoft Fluent Emoji Flat SVG（MIT）到 public/emoji/ 與 public/ui/。
// 用法：node scripts/fetch-fluent.mjs
// 已經存在的檔案會略過，所以可以放心重跑；新增圖片時，在下面的對照表加一行再執行一次。
// 新增後記得：src/engine/emoji-map.js 加字元對照、src/content/credits.json 補 usage。
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';

/** 有膚色子資料夾的 emoji（人物、手勢）：一律取 Default 版本。 */
const SKIN_TONE = new Set(['Child']);

/** 教材圖：本地檔名 → Fluent 資料夾名稱。 */
const EMOJI = {
  // 物件與食物
  apple: 'Red apple',
  banana: 'Banana',
  egg: 'Egg',
  'glowing-star': 'Glowing star',
  balloon: 'Balloon',
  strawberry: 'Strawberry',
  cookie: 'Cookie',
  candy: 'Candy',
  car: 'Automobile',
  'soccer-ball': 'Soccer ball',
  carrot: 'Carrot',
  'cup-with-straw': 'Cup with straw',
  spoon: 'Spoon',
  doughnut: 'Doughnut',
  bone: 'Bone',
  blossom: 'Blossom',
  locomotive: 'Locomotive',
  // 動物與人物
  'rabbit-face': 'Rabbit face',
  bird: 'Bird',
  fish: 'Fish',
  'baby-chick': 'Baby chick',
  dog: 'Dog face',
  'front-facing-baby-chick': 'Front-facing baby chick',
  turtle: 'Turtle',
  cat: 'Cat face',
  bear: 'Bear',
  panda: 'Panda',
  frog: 'Frog',
  'pig-face': 'Pig face',
  'monkey-face': 'Monkey face',
  chicken: 'Chicken',
  'tiger-face': 'Tiger face',
  honeybee: 'Honeybee',
  child: 'Child',
  'lady-beetle': 'Lady beetle',
  // 生活事件卡
  toothbrush: 'Toothbrush',
  'sleeping-face': 'Sleeping face',
  pencil: 'Pencil',
  bed: 'Bed',
  backpack: 'Backpack',
  soap: 'Soap',
  'cooked-rice': 'Cooked rice',
  school: 'School',
  socks: 'Socks',
  'running-shoe': 'Running shoe',
  door: 'Door',
  bathtub: 'Bathtub',
  't-shirt': 'T-shirt',
  // 口訣卡 icon
  link: 'Link',
  'input-numbers': 'Input numbers',
  ribbon: 'Ribbon',
  scissors: 'Scissors',
  'chequered-flag': 'Chequered flag',
  'balance-scale': 'Balance scale',
  'hourglass-not-done': 'Hourglass not done',
  // 考試主題圖
  'deciduous-tree': 'Deciduous tree',
  castle: 'Castle',
  'alarm-clock': 'Alarm clock',
  rainbow: 'Rainbow',
  cloud: 'Cloud',
  sun: 'Sun',
  lollipop: 'Lollipop',
  shortcake: 'Shortcake',
};

/** 引擎共用圖：本地檔名 → Fluent 資料夾名稱。 */
const UI = {
  mascot: 'Bear',
  star: 'Star',
  trophy: 'Trophy',
  'medal-gold': '1st place medal',
  'medal-silver': '2nd place medal',
  'medal-bronze': '3rd place medal',
  sparkles: 'Sparkles',
  'party-popper': 'Party popper',
  'confetti-ball': 'Confetti ball',
  'wrapped-gift': 'Wrapped gift',
};

/** Fluent 的檔名規則：資料夾名稱轉小寫、空白換成底線。 */
function sourceUrl(folder) {
  const file = folder.toLowerCase().replace(/ /g, '_');
  const dir = encodeURIComponent(folder);
  return SKIN_TONE.has(folder)
    ? `${BASE}/${dir}/Default/Flat/${file}_flat_default.svg`
    : `${BASE}/${dir}/Flat/${file}_flat.svg`;
}

async function fetchAll(table, outDir) {
  mkdirSync(outDir, { recursive: true });
  const failed = [];
  for (const [name, folder] of Object.entries(table)) {
    const out = join(outDir, `${name}.svg`);
    if (existsSync(out)) continue;
    const url = sourceUrl(folder);
    const res = await fetch(url);
    if (!res.ok) {
      failed.push(`${name} ← ${folder}（HTTP ${res.status}）`);
      continue;
    }
    const text = await res.text();
    if (!text.includes('<svg')) {
      failed.push(`${name} ← ${folder}（內容不是 SVG）`);
      continue;
    }
    writeFileSync(out, text);
    console.log(`下載 ${out}`);
  }
  return failed;
}

const failed = [
  ...(await fetchAll(EMOJI, 'public/emoji')),
  ...(await fetchAll(UI, 'public/ui')),
];
if (failed.length) {
  console.error(`下載失敗 ${failed.length} 個：\n${failed.join('\n')}`);
  process.exit(1);
}
console.log('完成');
