// 全站目錄：只放中繼資料（名稱、圖示、說明、課綱對照）。
// 單元的場景與題型放在各學期包，打開單元時才用 load() 延遲載入。
import { packEmojiAssets } from '../engine/emoji-map.js';

export const SUBJECTS = {
  math: { name: '數學', icon: '🔢' },
  english: { name: '英文', icon: '🔤' },
  science: { name: '自然', icon: '🔬' },
};

// 一上數學各單元。文字照抄舊檔；curriculum 與 versions 依 docs/curriculum/g1a-math.md。
// 固定 ID（id）一旦提交就不再更改，進度存檔用它當鍵值。
const G1A_MATH_UNITS = [
  {
    key: 'num10', icon: '🔢', name: '10以內的數', desc: '數一數、寫數字、一個對一個',
    curriculum: ['N-1-1'], versions: { hanlin: '一、10 以內的數' },
    tip: '問孩子：「你怎麼知道一共有幾個？」讓他說出「最後數到的數就是全部」。',
    task: '擺餐具時請孩子一個碗配一雙筷子，說說夠不夠；數數家裡的鞋子、杯子。',
  },
  {
    key: 'line', icon: '📏', name: '直線和曲線', desc: '直直的線、彎彎的線怎麼分？',
    curriculum: ['N-1-5', 'S-1-1'], versions: { hanlin: '二、比長短' },
    tip: '問孩子：「斜斜的線也是直線嗎？為什麼？」',
    task: '在家找 3 個直直的東西（桌邊、筷子）和 3 個彎彎的東西（碗口、電線）。',
  },
  {
    key: 'curve', icon: '〰️', name: '曲線比長短', desc: '彎彎的線要拉直再比！',
    curriculum: ['N-1-5', 'S-1-1'], versions: { hanlin: '二、比長短' },
    tip: '問孩子：「彎彎的線，要怎麼知道它有多長？」讓他說出「拉直再比」。',
    task: '拿一條毛線，沿著紙上畫的彎線擺好，再拉直，跟直線比一比。',
  },
  {
    key: 'thick', icon: '🍔', name: '厚和薄', desc: '疊得越高越厚！寬不等於厚',
    curriculum: ['N-1-5', 'S-1-1'], versions: { hanlin: '二、比長短' },
    tip: '問孩子：「怎麼知道哪一個比較厚？」讓他說出「平放，看誰疊得高」。',
    task: '拿兩本書、幾片吐司或餅乾疊一疊，用手捏捏看、比比看哪個厚。',
  },
  {
    key: 'align', icon: '🧴', name: '比高矮的小陷阱', desc: '從同一個地方開始比',
    curriculum: ['N-1-5', 'S-1-1'], versions: { hanlin: '二、比長短' },
    tip: '問孩子：「比高矮，要從哪裡開始比？」',
    task: '讓一個玩偶站在書上、一個站桌上，問孩子哪個比較高，再拿下來比。',
  },
  {
    key: 'order', icon: '🚂', name: '順序與多少', desc: '前後順序、第幾個、比多少',
    curriculum: ['N-1-1'], versions: { hanlin: '三、順序與多少' },
    tip: '問孩子：「『第3個』和『3個』有什麼不一樣？」',
    task: '排隊時問孩子：「你從前面數來是第幾個？從後面數來呢？」',
  },
  {
    key: 'split', icon: '🚃', name: '分與合', desc: '火車車廂分一分、接起來',
    curriculum: ['N-1-3'], versions: { hanlin: '四、分與合' },
    tip: '問孩子：「7 節車廂的火車，可以怎麼分成兩列？還有別的分法嗎？」',
    task: '用積木或樂高排成一列火車，分成兩段再接起來，說「7 可以分成 3 和 4」「3 和 4 合起來是 7」。',
  },
  {
    key: 'shape', icon: '🔷', name: '認識形狀', desc: '方盒、圓罐、球和平面圖形',
    curriculum: ['S-1-2'], versions: { hanlin: '五、認識形狀' },
    tip: '問孩子：「為什麼球不能疊高？」「轉過來的正方形還是正方形嗎？」',
    task: '在家找方盒（牙膏盒）、圓罐（罐頭）、球，推推看、疊疊看；再把盒子的面描在紙上，看看是什麼形狀。',
  },
  {
    key: 'add', icon: '➕', name: '10以內的加法', desc: '合起來、再來幾個，用 ＋ 和 ＝ 寫算式',
    curriculum: ['N-1-2', 'N-1-3', 'R-1-1'], versions: { hanlin: '六、10 以內的加法' },
    tip: '問孩子：「3＋2，你會怎麼算？」請他示範畫○或用手指數。',
    task: '吃點心時出題：「你有 3 顆葡萄，再給你 2 顆，現在有幾顆？」請他說出算式。',
  },
  {
    key: 'sub', icon: '➖', name: '10以內的減法', desc: '吃掉、飛走、還剩幾個，用 － 寫算式',
    curriculum: ['N-1-2', 'N-1-3', 'R-1-1'], versions: { hanlin: '七、10 以內的減法' },
    tip: '問孩子：「題目說『還剩』，要用加還是減？為什麼？」',
    task: '用餅乾或積木玩「吃掉幾個、還剩幾個」，請他說出減法算式。',
  },
  {
    key: 'num30', icon: '💯', name: '30以內的數', desc: '10 個一數、數的順序、比大小',
    curriculum: ['N-1-1'], versions: { hanlin: '八、30 以內的數' },
    tip: '問孩子：「19 和 21 哪個大？為什麼？」讓他說出「先比十」。',
    task: '用 30 根吸管或筷子，10 根用橡皮筋綁一捆，數數看一共有幾根。',
  },
  {
    key: 'time', icon: '⏰', name: '時間', desc: '事情先後、幾點鐘、幾點半',
    curriculum: ['N-1-6'], versions: { hanlin: '九、時間' },
    tip: '問孩子：「短針在 3 和 4 中間，是 3 點半還是 4 點半？為什麼？」',
    task: '在家用時鐘玩「現在幾點」：整點、半點各問幾次，也聊聊早上、中午、晚上做什麼。',
  },
].map(u => ({ id: `G1A-M-${u.key}`, prereqs: [], lang: 'zh-TW', ...u }));

// 舊檔的總複習 key 是 'review' 與 'all'，新版改成有意義的名稱，避免和單元 key 撞名。
const G1A_MATH_REVIEWS = [
  { key: 'review-length', title: '比長短・厚薄 總複習', desc: '10 題挑戰題' },
  { key: 'review-all', title: '全冊總複習', desc: '12 題，混合一上所有單元' },
].map(r => ({ id: `G1A-M-${r.key}`, ...r }));

export const PACKS = [
  {
    id: 'g1a-math', grade: 1, subject: 'math', semester: 'a', label: '上學期',
    load: () => import('./math/g1a/index.js'),
    // 「下載教材」時一併快取的教材圖（public/emoji/），清單由 src/engine/emoji-map.js 產生。
    assets: packEmojiAssets(),
    chapters: [
      { name: '一、10 以內的數', units: ['num10'] },
      { name: '二、比長短', units: ['line', 'curve', 'thick', 'align'], review: 'review-length' },
      { name: '三、順序與多少', units: ['order'] },
      { name: '四、分與合', units: ['split'] },
      { name: '五、認識形狀', units: ['shape'] },
      { name: '六、10 以內的加法', units: ['add'] },
      { name: '七、10 以內的減法', units: ['sub'] },
      { name: '八、30 以內的數', units: ['num30'] },
      { name: '九、時間', units: ['time'] },
      { name: '🏆 學習加油讚', units: [], review: 'review-all' },
    ],
    // 學期畫面上方的說明，與底部「給爸媽」區的共通內容。Task 7 的學期畫面會顯示它們。
    // 文字改寫自舊檔：不提特定課本版本與測驗卷（版本對照放在各單元的 versions）。
    intro: '依 108 課綱一年級上學期的主題排列，共 9 章 12 個單元。各版本課本的對照請看「給爸媽」。'
      + '每個單元先看動畫、自己動手玩，最後做練習題。建議每次 10～15 分鐘、爸媽陪著一起看，看完請孩子說說「為什麼」。',
    parentGuide: {
      principles: [
        '先猜再看：動畫裡會先問「你猜哪個長？」讓孩子先說出答案再揭曉。',
        '讓他自己動手：「換你來拉直」那段請讓孩子自己用手指拉，不要幫他按。',
        '請他說理由：每題答完問「你怎麼知道的？」能說出「拉直再比」「疊得高比較厚」才算真的懂。',
      ],
      reminders: {
        title: '📝 作答小提醒',
        items: [
          '看到「打✓…畫○…」的題目，先用手指指著題目唸一次，確認兩件事都做到。',
          '每次 10～15 分鐘就好，錯的題目用「錯的再練一次」複習。',
        ],
      },
    },
    units: G1A_MATH_UNITS,
    reviews: G1A_MATH_REVIEWS,
  },
  // 英文示範（試玩）：只用範本做成，用來驗證範本機制與英文語音，不對應正式學期。
  {
    id: 'g1-english-demo', grade: 1, subject: 'english', semester: 'demo', label: '試玩', trial: true,
    load: () => import('./english/g1-demo/index.js'),
    // 「下載教材」時一併快取的圖檔（相對 BASE_URL 的路徑）。
    assets: ['apple', 'banana', 'cat', 'dog', 'fish', 'bird', 'egg', 'sun'].map(w => `emoji/${w}.svg`),
    chapters: [{ name: '', units: ['words'] }],
    intro: '試玩單元：先看動畫認識 8 個英文單字，再做聽音選圖、看圖選字、連連看練習。',
    parentGuide: {
      principles: [
        '跟著唸：每個單字唸完後，請孩子跟著大聲唸一次。',
        '指著說：在家看到蘋果、香蕉、貓、狗時，問孩子「英文怎麼說？」',
        '不用急：英文發音來自裝置內建的語音，聽不清楚時可以按「🔊 再聽一次」。',
      ],
    },
    units: [
      {
        id: 'G1-E-words', key: 'words', icon: '🔤', name: '認識英文單字', desc: '聽一聽、選一選、連一連',
        lang: 'en-US', curriculum: [], prereqs: [],
        tip: '問孩子：「apple 是哪一個？」讓他指出圖片，再請他自己唸一次。',
        task: '吃水果或看到小動物時，和孩子一起說出英文名字。',
      },
    ],
    reviews: [],
  },
];

export function findPack(grade, subject, semester) {
  return PACKS.find(p => p.grade === grade && p.subject === subject && p.semester === semester);
}

export function findUnit(pack, key) {
  if (!pack) return undefined;
  return pack.units.find(u => u.key === key) || pack.reviews.find(r => r.key === key);
}

export function allUnits() {
  return PACKS.flatMap(pack => pack.units.map(unit => ({ pack, unit })));
}
