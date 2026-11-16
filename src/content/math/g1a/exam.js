// 一上數學的期中考、期末考：考試專用題型（EXAM_TYPES）與藍圖（每份 20 題，每題 5 分）。
//
// 藍圖：每一區對應一章，每個 slot 出一題，從清單裡隨機挑一個題型（出卷邏輯在 src/engine/paper.js）。
// 每區欄位：
// - name：區名，開場和休息站會顯示（例如「蘋果果園」）。
// - icon：該區主題圖，public/emoji/ 的檔名。
// - collect：收集物（emoji 字元），每答一題就收到一個，和對錯無關。
//
// 考試專用題型（ex 開頭，14 個）：
// - 全部原創，模仿台灣一上常見的題目樣式，不抄任何出版社題目；角色一律用動物。
// - 只用 pick、num 兩種作答模式，每題都有講解動畫（錯題重看會用到）。
// - 只登記進考試藍圖，不加進任何單元的 practice 陣列，所以 review-all 的題型池和亂數順序不變。
// - 亂數只在產生題目時呼叫（Math.random），考試時會被 withSeed 換成固定種子；
//   draw() 和 explain() 都不用亂數，同一個種子一定畫出同一個畫面。
import { ri, pick, shuffle, distinct, POS3 } from '../../../engine/util.js';
import { chk, wait, say } from '../../../engine/speech.js';
import { svg, el, txt, tween, EASE } from '../../../engine/svg.js';
import { emojiAt } from '../../../engine/emoji.js';
import { replay } from '../../../engine/fx.js';
import { sentence } from './split.js';
import { d_clock } from './num30time.js';

/* ===== 共用小工具 ===== */

const INK = '#3d2c1e';
const ORANGE = '#ff8c42';
const OK = '#2bb673';
const XS3 = [150, 400, 650];

/** 三張選項卡（或兩張）：回傳 pick 模式用的區域 { x, y, w, h, mx, my }。 */
function cards(labels, cy, w = 200, h = 84, fs = 34) {
  const xs = labels.length === 2 ? [270, 530] : XS3;
  return labels.map((l, i) => {
    const x = xs[i];
    el('rect', { x: x - w / 2, y: cy - h / 2 + 5, width: w, height: h, rx: 18, fill: 'rgba(61,44,30,.10)' });
    el('rect', { x: x - w / 2, y: cy - h / 2, width: w, height: h, rx: 18, fill: '#fff', stroke: '#c9b28a', 'stroke-width': 4 });
    txt(x, cy + 2, String(l), { 'font-size': fs, fill: INK });
    return { x: x - w / 2 - 6, y: cy - h / 2 - 6, w: w + 12, h: h + 12, mx: x, my: cy + h / 2 + 22 };
  });
}

/** 數數徽章：彩色圓底＋白色數字。 */
function badge(x, y, n, col = '#e07a00', fs = 20) {
  const g = el('g', { class: 'pop' });
  el('circle', { cx: x, cy: y, r: Math.round(fs * 0.75), fill: col, stroke: '#fff', 'stroke-width': 2.5 }, g);
  txt(x, y + 1, String(n), { 'font-size': fs, fill: '#fff' }, g);
  return g;
}

/** 一個一個加上數數徽章，物件跳一下。items 是 emojiAt 回傳的節點（getAttribute 讀中心點）。 */
async function tagCount(items, id, col = '#e07a00', dy = -34, ms = 160) {
  for (let i = 0; i < items.length; i++) {
    chk(id);
    const t = items[i];
    badge(+t.getAttribute('x'), +t.getAttribute('y') + dy, i + 1, col);
    replay(t, 'hop');
    await wait(ms, id);
  }
}

/** n 個點排成格子（每排 cols 個，最後一排置中），回傳中心點。 */
function gridPts(n, cx, cy, cols = 3, gx = 58, gy = 54) {
  const rows = Math.ceil(n / cols), out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols, inRow = r < rows - 1 ? cols : n - cols * (rows - 1);
    out.push([cx - (inRow - 1) * gx / 2 + c * gx, cy - (rows - 1) * gy / 2 + r * gy]);
  }
  return out;
}

/** 題目上方的對話框：左邊一隻動物，右邊一行字。 */
function banner(ani, text, cy = 52, fs = 34) {
  emojiAt(90, cy, ani, { 'font-size': 50, class: 'svgtxt pop' });
  el('rect', { x: 140, y: cy - 34, width: 620, height: 68, rx: 20, fill: '#fff8e1', stroke: '#e8c97a', 'stroke-width': 3 });
  el('path', { d: `M142 ${cy - 8} l-16 8 l16 8`, fill: '#fff8e1', stroke: '#e8c97a', 'stroke-width': 3, 'stroke-linejoin': 'round' });
  el('rect', { x: 141, y: cy - 10, width: 6, height: 20, fill: '#fff8e1' });
  txt(450, cy + 2, text, { 'font-size': fs, fill: INK });
}

/* ===== 一、10 以內的數 ===== */

const FOODS = [{ e: '🍎', n: '蘋果' }, { e: '🍓', n: '草莓' }, { e: '🍪', n: '餅乾' }, { e: '🍬', n: '糖果' }, { e: '🍩', n: '甜甜圈' }];

/* ===== 二、比長短 ===== */

const STICKS = [{ n: '鉛筆', col: '#ffbe0b', tip: true }, { n: '蠟筆', col: '#ff5a5f', tip: true }, { n: '吸管', col: '#3a86ff', tip: false }];
/** 畫一支鉛筆（或蠟筆、吸管），從 x1 到 x2。 */
function stick(k, x1, x2, cy) {
  const g = el('g', { class: 'pop' }), h = 30, tip = k.tip ? 26 : 0;
  el('rect', { x: x1, y: cy - h / 2 + 4, width: x2 - x1, height: h, rx: 6, fill: 'rgba(0,0,0,.10)' }, g);
  el('rect', { x: x1, y: cy - h / 2, width: x2 - x1 - tip, height: h, rx: k.tip ? 4 : 12, fill: k.col, stroke: INK, 'stroke-width': 2.5 }, g);
  if (k.tip) {
    el('polygon', { points: `${x2 - tip},${cy - h / 2} ${x2},${cy} ${x2 - tip},${cy + h / 2}`, fill: '#f6d39b', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
    el('polygon', { points: `${x2 - 9},${cy - 5} ${x2},${cy} ${x2 - 9},${cy + 5}`, fill: k.col === '#ffbe0b' ? '#555' : k.col }, g);
    el('rect', { x: x1, y: cy - h / 2, width: 14, height: h, fill: '#ff8fab', stroke: INK, 'stroke-width': 2.5 }, g);
  } else {
    for (let x = x1 + 18; x < x2 - 10; x += 28) el('line', { x1: x, y1: cy - h / 2 + 3, x2: x + 12, y2: cy + h / 2 - 3, stroke: '#fff', 'stroke-width': 5, opacity: 0.7 }, g);
  }
  return g;
}

/* ===== 三、順序與多少 ===== */

const QUEUE_ANI = ['🐶', '🐱', '🐻', '🐼', '🐸', '🐷', '🐵', '🐔', '🐯'];

/* ===== 五、認識形狀 ===== */

const SHAPE_NAME = { circ: '圓形', tri: '三角形', sq: '正方形' };
const SHAPE_COL = { circ: '#ff8fab', tri: '#ffd166', sq: '#7ec4cf' };
const PATTERNS = [['circ', 'tri'], ['sq', 'sq', 'tri'], ['circ', 'sq', 'tri'], ['tri', 'circ', 'circ'], ['sq', 'circ']];
function shape(kind, cx, cy, s, cls = 'pop') {
  const a = { fill: SHAPE_COL[kind], stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', class: cls };
  if (kind === 'circ') return el('circle', { cx, cy, r: s / 2, ...a });
  if (kind === 'tri') return el('polygon', { points: `${cx},${cy - s / 2} ${cx - s / 2},${cy + s / 2} ${cx + s / 2},${cy + s / 2}`, ...a });
  return el('rect', { x: cx - s / 2, y: cy - s / 2, width: s, height: s, rx: 4, ...a });
}

/* ===== 六、七、加減法文字題 ===== */

// 文字題的故事：lines 是畫面上的兩行字，q 是問句，u 是單位。
const ADD_STORIES = [
  { ani: '🐻', obj: '🍎', u: '顆', lines: (a, b) => [`小熊有 ${a} 顆蘋果，`, `小兔又給牠 ${b} 顆。`], q: '小熊現在有幾顆？' },
  { ani: '🐦', obj: '🐦', u: '隻', lines: (a, b) => [`樹上有 ${a} 隻小鳥，`, `又飛來 ${b} 隻。`], q: '樹上一共有幾隻？' },
  { ani: '🐸', obj: '🐸', u: '隻', lines: (a, b) => [`池塘裡有 ${a} 隻青蛙，`, `又跳來 ${b} 隻。`], q: '池塘裡現在有幾隻？' },
];
const SUB_STORIES = [
  { ani: '🐻', obj: '🍓', u: '顆', lines: (a, b) => [`小熊有 ${a} 顆草莓，`, `吃掉了 ${b} 顆。`], q: '還剩幾顆？' },
  { ani: '🐦', obj: '🐦', u: '隻', lines: (a, b) => [`樹上有 ${a} 隻小鳥，`, `飛走了 ${b} 隻。`], q: '樹上還剩幾隻？' },
  { ani: '🐵', obj: '🍪', u: '片', lines: (a, b) => [`小猴有 ${a} 片餅乾，`, `分給小兔 ${b} 片。`], q: '小猴還剩幾片？' },
];

/**
 * 加減法文字題引擎（exAddWord、exSubWord 共用）。op 是 '+' 或 '-'。
 * 題目會唸出來，畫面上也有故事文字；直接填答案（num 模式）。
 */
function wordProblem(op) {
  const add = op === '+';
  const st = pick(add ? ADD_STORIES : SUB_STORIES);
  let a, b;
  if (add) { a = ri(1, 8); b = ri(1, 10 - a); } else { a = ri(3, 10); b = ri(1, a - 1); }
  const ans = add ? a + b : a - b;
  const lines = st.lines(a, b);
  let story, S;
  return {
    mode: 'num', prompt: lines.join('') + st.q, answer: ans, max: 10,
    draw() {
      story = el('g', {});
      emojiAt(95, 120, st.ani, { 'font-size': 64, class: 'svgtxt pop' }, story);
      el('rect', { x: 170, y: 40, width: 600, height: 160, rx: 22, fill: '#fff8e1', stroke: '#e8c97a', 'stroke-width': 3 }, story);
      lines.forEach((l, i) => txt(470, 90 + i * 60, l, { 'font-size': 34, fill: INK }, story));
      txt(400, 248, st.q, { 'font-size': 30, fill: '#e07a00' }, story);
      S = sentence(335, ['答：', { v: ans, u: true }, st.u]);
      return [];
    },
    fill(v, c) { S.fill(v, c); },
    async explain(id) {
      // 收起故事，改用圖片演一次
      story.remove();
      const n = add ? a + b : a, gap = Math.min(66, 620 / Math.max(1, n - 1));
      const xs = Array.from({ length: n }, (_, i) => 400 - (n - 1) * gap / 2 + i * gap);
      const objs = [];
      for (let i = 0; i < (add ? a : n); i++) objs.push(emojiAt(xs[i], 130, st.obj, { 'font-size': 46, class: 'svgtxt pop' }));
      await wait(500, id);
      if (add) {
        for (let i = a; i < n; i++) {
          chk(id);
          objs.push(emojiAt(xs[i], 130, st.obj, { 'font-size': 46, class: 'svgtxt pop' }));
          await wait(220, id);
        }
        await tagCount(objs, id, '#e07a00', -40, 140);
        txt(400, 240, `${a} ＋ ${b} ＝ ${ans}`, { 'font-size': 40, fill: OK, class: 'svgtxt pop' });
        await say(`${a}＋${b}＝${ans}，一共是 ${ans} ${st.u}。`, id);
      } else {
        for (let i = n - 1; i >= n - b; i--) {
          chk(id);
          const x = xs[i];
          objs[i].classList.add('gone');
          const g = el('g', { class: 'pop' });
          el('line', { x1: x - 20, y1: 110, x2: x + 20, y2: 150, stroke: '#e63946', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
          el('line', { x1: x + 20, y1: 110, x2: x - 20, y2: 150, stroke: '#e63946', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
          await wait(220, id);
        }
        await tagCount(objs.slice(0, ans), id, '#3a86ff', -40, 140);
        txt(400, 240, `${a} － ${b} ＝ ${ans}`, { 'font-size': 40, fill: OK, class: 'svgtxt pop' });
        await say(`${a}－${b}＝${ans}，還剩 ${ans} ${st.u}。`, id);
      }
    },
  };
}

/* ===== 八、30 以內的數 ===== */

/** 三個選項：正解加兩個鄰近的錯誤答案（不重複、在 lo～hi 之間），回傳打亂後的選項與正解位置。 */
function numOpts(ans, cands, lo, hi) {
  const out = [ans];
  for (const c of cands) if (out.length < 3 && c >= lo && c <= hi && !out.includes(c)) out.push(c);
  for (let k = 1; out.length < 3; k++) { if (!out.includes(ans + k)) out.push(ans + k); }
  const opts = shuffle(out);
  return { opts, answer: opts.indexOf(ans) };
}

/* ===== 九、時間 ===== */

const timeLabel = (h, m) => `${h} 點${m ? '半' : '鐘'}`;
const nextH = h => h % 12 + 1;
const prevH = h => (h + 10) % 12 + 1;

/** 三個時鐘並排；回傳 pick 區域與時鐘物件。 */
function drawClocks(opts, cy = 250, r = 96) {
  const clocks = [];
  const regs = opts.map(([h, m], i) => {
    clocks.push(d_clock(svg, XS3[i], cy, r, h, m));
    return { x: XS3[i] - r - 16, y: cy - r - 16, w: 2 * r + 32, h: 2 * r + 32, mx: XS3[i], my: cy + r + 30 };
  });
  return { regs, clocks };
}
/** 在鐘面數字外面畫一個圈。 */
function ringNum(ck, n, color) {
  const [x, y] = ck.numPos(n);
  return el('circle', { cx: x, cy: y, r: ck.r * 0.15, fill: 'none', stroke: color, 'stroke-width': 4, class: 'pop' });
}
/** 講解：圈出長針、短針指的數字，說出怎麼看。 */
async function explainClock(ck, h, m, id, lead = '') {
  if (m) {
    ringNum(ck, 6, '#3a86ff'); ringNum(ck, h, '#e63946'); ringNum(ck, nextH(h), '#e63946');
    await say(`${lead}長針指著 6，短針在 ${h} 和 ${nextH(h)} 中間，是 ${h} 點半。`, id);
  } else {
    ringNum(ck, 12, '#3a86ff'); ringNum(ck, h, '#e63946');
    await say(`${lead}長針指著 12，短針指著 ${h}，是 ${h} 點鐘。`, id);
  }
}
const DAILY = [
  { e: '🛏', v: '起床', hs: [6, 7] }, { e: '🎒', v: '上學', hs: [7] }, { e: '🍚', v: '吃午飯', hs: [12] },
  { e: '🏫', v: '放學', hs: [4] }, { e: '🛁', v: '洗澡', hs: [7, 8] }, { e: '😴', v: '睡覺', hs: [9] },
];

/* ===== 14 個考試專用題型 ===== */

export const EXAM_TYPES = {
  /* 一、三個盤子，哪一盤剛好是 N 個（也有「0 個」的空盤題）。 */
  exN10CircleN() {
    const zero = Math.random() < 0.2;
    const t = zero ? 0 : ri(1, 9);
    const others = shuffle([t - 3, t - 2, t - 1, t + 1, t + 2, t + 3].filter(v => v >= 0 && v <= 10)).slice(0, 2);
    const counts = shuffle([t, ...others]), answer = counts.indexOf(t), food = pick(FOODS);
    const groups = [];
    return {
      mode: 'pick', answer,
      prompt: zero ? '小熊要找空空的盤子。哪一盤是 0 個？把它圈起來。' : `小熊要拿剛好 ${t} 個${food.n}，是哪一盤？把它圈起來。`,
      draw() {
        emojiAt(400, 42, '🐻', { 'font-size': 46, class: 'svgtxt pop' });
        return counts.map((c, i) => {
          const cx = XS3[i];
          el('rect', { x: cx - 112, y: 92, width: 224, height: 236, rx: 26, fill: 'rgba(61,44,30,.10)' });
          el('rect', { x: cx - 115, y: 84, width: 230, height: 236, rx: 26, fill: '#fffaf0', stroke: '#c9b28a', 'stroke-width': 3 });
          groups.push(gridPts(c, cx, 205, 3, 62, 52).map(([x, y]) => emojiAt(x, y, food.e, { 'font-size': 38 })));
          return { x: cx - 121, y: 78, w: 242, h: 248, mx: cx, my: 350 };
        });
      },
      async explain(id) {
        for (let i = 0; i < 3; i++) {
          if (groups[i].length) await tagCount(groups[i], id, '#e07a00', -26, 120);
          else badge(XS3[i], 205, 0, '#e07a00', 26);
          await wait(200, id);
        }
        await say(zero ? '空空的盤子，一個都沒有，就是 0 個。' : `${POS3[answer]}這盤數到 ${t}，剛好是 ${t} 個。`, id);
      },
    };
  },

  /* 二、物件下方有方格，鉛筆有幾格長（有時候不是從最左邊開始放）。 */
  exLenUnits() {
    const k = pick(STICKS), n = ri(2, 9), s = Math.random() < 0.4 ? ri(1, 10 - n) : 0;
    const CW = 60, X0 = 100, GY = 200, SY = 168;
    let S;
    return {
      mode: 'num', prompt: `小兔的${k.n}有幾格長？`, answer: n, max: 10,
      draw() {
        emojiAt(400, 60, '🐰', { 'font-size': 52, class: 'svgtxt pop' });
        for (let i = 0; i < 10; i++) el('rect', { x: X0 + i * CW, y: GY, width: CW, height: CW, fill: '#fff', stroke: '#9fc3e8', 'stroke-width': 2.5 });
        stick(k, X0 + s * CW, X0 + (s + n) * CW, SY);
        S = sentence(345, [`${k.n}有`, { v: n, u: true }, '格長']);
        return [];
      },
      fill(v, c) { S.fill(v, c); },
      async explain(id) {
        el('line', { x1: X0 + s * CW, y1: SY - 28, x2: X0 + s * CW, y2: GY + CW, stroke: '#e63946', 'stroke-width': 3, 'stroke-dasharray': '6 5', class: 'pop' });
        el('line', { x1: X0 + (s + n) * CW, y1: SY - 28, x2: X0 + (s + n) * CW, y2: GY + CW, stroke: '#e63946', 'stroke-width': 3, 'stroke-dasharray': '6 5', class: 'pop' });
        for (let i = 0; i < n; i++) {
          chk(id);
          badge(X0 + (s + i) * CW + CW / 2, GY + CW / 2, i + 1, '#3a86ff');
          await wait(200, id);
        }
        await say(s ? `${k.n}不是從最左邊開始放的，要從頭數到尾：一共 ${n} 格長。` : `從頭到尾數一數，${k.n}蓋住 ${n} 格，有 ${n} 格長。`, id);
      },
    };
  },

  /* 三、動物排隊：小兔前面有 a 隻、後面有 b 隻，一共幾隻（別忘了小兔自己）。 */
  exOrdQueue() {
    const a = ri(1, 4), b = ri(1, 4), total = a + b + 1;
    const others = shuffle(QUEUE_ANI).slice(0, a + b);
    const xs = Array.from({ length: total }, (_, i) => 140 + i * 70);
    let S, rabbit, hint;
    return {
      mode: 'num', prompt: `動物排隊溜滑梯。小兔前面有 ${a} 隻，後面有 ${b} 隻，一共有幾隻？`, answer: total, max: 10,
      draw() {
        emojiAt(60, 120, '🏁', { 'font-size': 50, class: 'svgtxt pop' });
        el('rect', { x: 30, y: 170, width: 740, height: 10, rx: 5, fill: '#f3e7cf' });
        rabbit = emojiAt(400, 130, '🐰', { 'font-size': 58, class: 'svgtxt pop' });
        hint = el('g', {});
        el('rect', { x: 140, y: 205, width: 200, height: 60, rx: 16, fill: '#e8f1ff', stroke: '#3a86ff', 'stroke-width': 3 }, hint);
        txt(240, 237, `⬅ 前面 ${a} 隻`, { 'font-size': 28, fill: '#1b5fbf' }, hint);
        el('rect', { x: 460, y: 205, width: 200, height: 60, rx: 16, fill: '#ffe8e8', stroke: '#e63946', 'stroke-width': 3 }, hint);
        txt(560, 237, `後面 ${b} 隻 ➡`, { 'font-size': 28, fill: '#c0392b' }, hint);
        S = sentence(340, ['一共有', { v: total, u: true }, '隻']);
        return [];
      },
      fill(v, c) { S.fill(v, c); },
      async explain(id) {
        const x0 = +rabbit.getAttribute('x');
        await tween(500, e => rabbit.setAttribute('x', x0 + (xs[a] - x0) * e), id, EASE.outBack);
        const row = [];
        let k = 0;
        for (let i = 0; i < total; i++) {
          chk(id);
          if (i === a) { row.push(rabbit); continue; }
          row.push(emojiAt(xs[i], 130, others[k++], { 'font-size': 50, class: 'svgtxt pop' }));
          await wait(120, id);
        }
        await tagCount(row, id, '#e07a00', -42, 150);
        await say(`前面 ${a} 隻，加上小兔自己 1 隻，再加後面 ${b} 隻，一共 ${total} 隻。別忘了數小兔自己喔！`, id);
      },
    };
  },

  /* 三、三張數字卡，選最大或最小。 */
  exOrdCompare() {
    const vals = distinct(3, 0, 10, 1), big = Math.random() < 0.6;
    const mx = Math.max(...vals), mn = Math.min(...vals), answer = vals.indexOf(big ? mx : mn);
    return {
      mode: 'pick', answer, prompt: `小猴撿到三張數字卡，哪一張最${big ? '大' : '小'}？把它圈起來。`,
      draw() {
        emojiAt(400, 45, '🐵', { 'font-size': 50, class: 'svgtxt pop' });
        return cards(vals, 180, 170, 150, 84);
      },
      async explain(id) {
        const X = v => 100 + v * 60, Y = 345;
        el('line', { x1: 80, y1: Y, x2: 720, y2: Y, stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round', class: 'pop' });
        for (let v = 0; v <= 10; v++) {
          el('line', { x1: X(v), y1: Y - 8, x2: X(v), y2: Y + 8, stroke: INK, 'stroke-width': 3 });
          txt(X(v), Y + 28, String(v), { 'font-size': 20, fill: '#7a6650' });
        }
        await wait(300, id);
        for (const v of [...vals].sort((p, q) => p - q)) {
          chk(id);
          el('circle', { cx: X(v), cy: Y - 22, r: 12, fill: v === (big ? mx : mn) ? OK : ORANGE, class: 'pop' });
          await wait(300, id);
        }
        await say(`在數線上，越右邊的數越大。${mx} 最大，${mn} 最小。`, id);
      },
    };
  },

  /* 四、一個數的分法表少了一組，選出缺的那一組。 */
  exSplitAll() {
    const n = ri(4, 9), k = ri(1, n - 1);
    const right = `${k} 和 ${n - k}`;
    const wrongs = [];
    for (const [p, q] of [[k, n - k + 1], [k, n - k - 1], [k + 1, n - k + 1], [k - 1, n - k - 1]]) {
      const s = `${p} 和 ${q}`;
      if (p >= 0 && q >= 0 && s !== right && !wrongs.includes(s)) wrongs.push(s);
    }
    const opts = shuffle([right, ...wrongs.slice(0, 2)]), answer = opts.indexOf(right);
    const cols = n - 1, cw = Math.min(80, 640 / cols), x0 = 400 - cols * cw / 2;
    let miss;
    return {
      mode: 'pick', answer, prompt: `小熊把 ${n} 顆糖果分成兩堆，表格少了一種分法。少了哪一組？把它圈起來。`,
      draw() {
        emojiAt(250, 45, '🐻', { 'font-size': 44, class: 'svgtxt pop' });
        txt(430, 47, `${n} 可以分成`, { 'font-size': 34, fill: INK });
        miss = [];
        for (let i = 0; i < cols; i++) {
          const v = i + 1, x = x0 + i * cw, u = v === k;
          for (const [row, val] of [[0, v], [1, n - v]]) {
            const y = 95 + row * 64;
            el('rect', { x, y, width: cw, height: 64, fill: u ? '#fff' : row ? '#e8f1ff' : '#fff3c4', stroke: u ? ORANGE : '#c9b28a', 'stroke-width': 3, 'stroke-dasharray': u ? '7 6' : 'none' });
            const t = txt(x + cw / 2, y + 34, u ? '?' : String(val), { 'font-size': 32, fill: u ? ORANGE : INK });
            if (u) miss.push([t, val]);
          }
        }
        return cards(opts, 330, 200, 84, 32);
      },
      async explain(id) {
        for (const [t, val] of miss) { t.textContent = String(val); t.setAttribute('fill', OK); }
        el('rect', { x: x0 + (k - 1) * cw - 4, y: 91, width: cw + 8, height: 136, rx: 10, fill: 'none', stroke: OK, 'stroke-width': 5, class: 'pop' });
        await say(`上面一個比一個多 1，下面一個比一個少 1。少的是 ${k} 和 ${n - k}。`, id);
      },
    };
  },

  /* 五、形狀的規律（○△○△、□□△□□△），選下一個。 */
  exShpPattern() {
    const unit = pick(PATTERNS), p = unit.length;
    const len = ri(Math.max(4, 2 * p), 7);
    const seq = Array.from({ length: len }, (_, i) => unit[i % p]), next = unit[len % p];
    const opts = shuffle(['circ', 'tri', 'sq']), answer = opts.indexOf(next);
    const gap = 82, x0 = 400 - len * gap / 2;
    return {
      mode: 'pick', answer, prompt: '小青蛙照規律排積木，下一個是什麼形狀？把它圈起來。',
      draw() {
        emojiAt(70, 60, '🐸', { 'font-size': 50, class: 'svgtxt pop' });
        seq.forEach((k, i) => shape(k, x0 + i * gap, 150, 58));
        el('rect', { x: x0 + len * gap - 36, y: 114, width: 72, height: 72, rx: 12, fill: '#fff', stroke: ORANGE, 'stroke-width': 4, 'stroke-dasharray': '7 6' });
        txt(x0 + len * gap, 152, '?', { 'font-size': 40, fill: ORANGE });
        return opts.map((k, i) => {
          const x = XS3[i];
          el('rect', { x: x - 80, y: 265, width: 160, height: 120, rx: 18, fill: '#fff', stroke: '#c9b28a', 'stroke-width': 4 });
          shape(k, x, 325, 64, '');
          return { x: x - 86, y: 259, w: 172, h: 132, mx: x, my: 400 };
        });
      },
      async explain(id) {
        for (let r = 0; r * p < len; r++) {
          chk(id);
          const w = Math.min(p, len - r * p) * gap;
          el('rect', { x: x0 + r * p * gap - 38, y: 106, width: w - 6, height: 88, rx: 16, fill: 'rgba(58,134,255,.10)', stroke: '#3a86ff', 'stroke-width': 3, class: 'pop' });
          await wait(300, id);
        }
        shape(next, x0 + len * gap, 150, 58);
        await say(`每 ${p} 個一組：${unit.map(k => SHAPE_NAME[k]).join('、')}，一直重複。下一個是${SHAPE_NAME[next]}。`, id);
      },
    };
  },

  /* 六、聽題作答的加法文字題。 */
  exAddWord() { return wordProblem('+'); },

  /* 六、選出和 a＋b 一樣大的算式（交換兩個數）。 */
  exAddSwap() {
    const [a, b] = distinct(2, 1, 5, 1), s = a + b;
    const right = `${b} ＋ ${a}`;
    const cands = [[a, a], [b, b], [a, b + 1], [a + 1, b]].filter(([p, q]) => p + q !== s).map(([p, q]) => `${p} ＋ ${q}`);
    const wrongs = shuffle([...new Set(cands)]).slice(0, 2);
    const opts = shuffle([right, ...wrongs]), answer = opts.indexOf(right);
    return {
      mode: 'pick', answer, prompt: `小熊說：${a}＋${b}。哪一個算式和它一樣大？把它圈起來。`,
      draw() {
        banner('🐻', `${a} ＋ ${b}`, 90, 54);
        return cards(opts, 290, 220, 96, 42);
      },
      async explain(id) {
        for (let i = 0; i < 3; i++) {
          chk(id);
          const [p, q] = opts[i].split(' ＋ ').map(Number);
          txt(XS3[i], 375, `＝ ${p + q}`, { 'font-size': 32, fill: i === answer ? OK : '#7a6650', class: 'svgtxt pop' });
          await wait(300, id);
        }
        await say(`${a}＋${b}＝${s}，${b}＋${a} 也是 ${s}。兩個數換位置，合起來一樣多。`, id);
      },
    };
  },

  /* 七、聽題作答的減法文字題。 */
  exSubWord() { return wordProblem('-'); },

  /* 七、兩排氣球對齊，紅的比藍的多幾個（或藍的比紅的少幾個）。 */
  exSubCompare() {
    const a = ri(3, 9), b = ri(1, a - 1), d = a - b, askMore = Math.random() < 0.6;
    const X = i => 150 + i * 66;
    let S;
    const balloon = (x, y, col) => {
      const g = el('g', { class: 'pop' });
      el('path', { d: `M${x} ${y + 27} q-6 18 0 36`, stroke: '#9a8c7a', 'stroke-width': 2, fill: 'none' }, g);
      el('ellipse', { cx: x, cy: y, rx: 22, ry: 27, fill: col, stroke: INK, 'stroke-width': 2 }, g);
      el('ellipse', { cx: x - 7, cy: y - 9, rx: 5, ry: 8, fill: '#fff', opacity: 0.55 }, g);
      el('polygon', { points: `${x - 5},${y + 30} ${x + 5},${y + 30} ${x},${y + 24}`, fill: col }, g);
      return g;
    };
    return {
      mode: 'num', answer: d, max: 10,
      prompt: `小狗買了紅氣球和藍氣球。${askMore ? '紅氣球比藍氣球多幾個？' : '藍氣球比紅氣球少幾個？'}`,
      draw() {
        emojiAt(60, 160, '🐶', { 'font-size': 52, class: 'svgtxt pop' });
        for (let i = 0; i < a; i++) balloon(X(i), 80, '#ff5a5f');
        for (let i = 0; i < b; i++) balloon(X(i), 215, '#3a86ff');
        S = sentence(355, [askMore ? '紅的多' : '藍的少', { v: d, u: true }, '個']);
        return [];
      },
      fill(v, c) { S.fill(v, c); },
      async explain(id) {
        for (let i = 0; i < b; i++) {
          chk(id);
          el('line', { x1: X(i), y1: 145, x2: X(i), y2: 186, stroke: '#888', 'stroke-width': 3, 'stroke-dasharray': '5 4', class: 'pop' });
          await wait(160, id);
        }
        for (let i = b; i < a; i++) {
          chk(id);
          badge(X(i), 160, i - b + 1, '#e63946');
          await wait(250, id);
        }
        await say(`一個對一個，紅氣球多出 ${d} 個。${a}－${b}＝${d}，所以${askMore ? '紅的多' : '藍的少'} ${d} 個。`, id);
      },
    };
  },

  /* 八、2 個 2 個數、5 個 5 個數：2、4、6、□。 */
  exN30SkipCount() {
    const step = Math.random() < 0.6 ? 2 : 5;
    const start = step === 2 ? 2 * ri(1, 11) : 5 * ri(1, 2);
    const seq = [0, 1, 2, 3, 4].map(k => start + k * step);
    const mi = Math.random() < 0.6 ? 4 : ri(1, 3), ans = seq[mi];
    const { opts, answer } = numOpts(ans, shuffle([ans + 1, ans - 1, ans + step, ans - step]), 1, 35);
    const xs = seq.map((_, i) => 120 + i * 140);
    let cells, frog;
    return {
      mode: 'pick', answer, prompt: `小青蛙 ${step} 個 ${step} 個往前跳，空格裡是多少？把它圈起來。`,
      draw() {
        el('rect', { x: 30, y: 150, width: 740, height: 70, rx: 30, fill: '#d6efff' });
        cells = seq.map((v, i) => {
          const u = i === mi;
          el('ellipse', { cx: xs[i], cy: 190, rx: 52, ry: 26, fill: u ? '#fff' : '#d9cdb8', stroke: u ? ORANGE : '#a8957a', 'stroke-width': 3, 'stroke-dasharray': u ? '7 6' : 'none' });
          return txt(xs[i], 192, u ? '?' : String(v), { 'font-size': 32, fill: u ? ORANGE : INK });
        });
        frog = emojiAt(xs[0], 132, '🐸', { 'font-size': 50, class: 'svgtxt pop' });
        return cards(opts, 330, 180, 84, 40);
      },
      async explain(id) {
        for (let i = 1; i < 5; i++) {
          const x1 = xs[i - 1], x2 = xs[i];
          txt((x1 + x2) / 2, 250, `＋${step}`, { 'font-size': 24, fill: '#3a86ff', class: 'svgtxt pop' });
          await tween(420, (e, t) => { frog.setAttribute('x', x1 + (x2 - x1) * e); frog.setAttribute('y', 132 - Math.sin(Math.PI * t) * 50); }, id);
          if (i === mi) { cells[i].textContent = String(ans); cells[i].setAttribute('fill', OK); }
          await wait(120, id);
        }
        await say(`每次多 ${step}：${seq.join('、')}。空格是 ${ans}。`, id);
      },
    };
  },

  /* 八、比 n 多 1、比 n 少 1 是多少。 */
  exN30MoreLess() {
    const more = Math.random() < 0.5;
    const n = more ? ri(10, 29) : ri(11, 30), ans = more ? n + 1 : n - 1;
    const opts = shuffle([n + 1, n - 1, n]), answer = opts.indexOf(ans);
    return {
      mode: 'pick', answer, prompt: `小魚問：比 ${n} ${more ? '多' : '少'} 1 是多少？把它圈起來。`,
      draw() {
        banner('🐟', `比 ${n} ${more ? '多' : '少'} 1 是多少？`, 70, 40);
        return cards(opts, 310, 190, 100, 50);
      },
      async explain(id) {
        const vals = [n - 2, n - 1, n, n + 1, n + 2], X = i => 240 + i * 80;
        vals.forEach((v, i) => {
          el('rect', { x: X(i) - 36, y: 160, width: 72, height: 52, rx: 10, fill: v === n ? '#fff3c4' : '#fff', stroke: v === ans ? OK : '#c9b28a', 'stroke-width': v === ans ? 5 : 3, class: 'pop' });
          txt(X(i), 188, String(v), { 'font-size': 26, fill: v === ans ? OK : INK, class: 'svgtxt pop' });
        });
        const i0 = 2, i1 = more ? 3 : 1;
        el('path', { d: `M${X(i0)} 156 Q${(X(i0) + X(i1)) / 2} 120 ${X(i1)} 156`, stroke: '#3a86ff', 'stroke-width': 4, fill: 'none', class: 'pop' });
        txt((X(i0) + X(i1)) / 2, 122, more ? '＋1' : '－1', { 'font-size': 22, fill: '#3a86ff', class: 'svgtxt pop' });
        await say(more ? `${n} 的下一個數是 ${ans}，比 ${n} 多 1 就是 ${ans}。` : `${n} 的前一個數是 ${ans}，比 ${n} 少 1 就是 ${ans}。`, id);
      },
    };
  },

  /* 九、給「3 點半」，從三個鐘面選出正確的。 */
  exTimPickClock() {
    const h = ri(1, 12), m = pick([0, 30]), label = timeLabel(h, m);
    const L = m ? [[h, 30], [prevH(h), 30], [h, 0]] : [[h, 0], [nextH(h), 0], [h, 30]];
    const opts = shuffle(L), answer = opts.indexOf(L[0]);
    let clocks;
    return {
      mode: 'pick', answer, prompt: `小兔 ${label}要去公園。哪一個時鐘是 ${label}？把它圈起來。`,
      draw() {
        banner('🐰', `${label}`, 50, 40);
        const d = drawClocks(opts);
        clocks = d.clocks;
        return d.regs;
      },
      async explain(id) { await explainClock(clocks[answer], h, m, id); },
    };
  },

  /* 九、生活情境：「小熊 7 點起床」，選對應的鐘面。 */
  exTimDaily() {
    const ev = pick(DAILY), h = pick(ev.hs), m = pick([0, 30]);
    const label = m ? `${h} 點半` : `${h} 點`;
    const far = (h + ri(2, 4) - 1) % 12 + 1;
    const L = [[h, m], [far, m], [h, 30 - m]];
    const opts = shuffle(L), answer = opts.indexOf(L[0]);
    let clocks;
    return {
      mode: 'pick', answer, prompt: `小熊 ${label}${ev.v}。哪一個時鐘是 ${label}？把它圈起來。`,
      draw() {
        banner('🐻', `${label}　${ev.v}`, 50, 38);
        emojiAt(700, 50, ev.e, { 'font-size': 44, class: 'svgtxt pop' });
        const d = drawClocks(opts);
        clocks = d.clocks;
        return d.regs;
      },
      async explain(id) { await explainClock(clocks[answer], h, m, id, `小熊 ${label}${ev.v}。`); },
    };
  },
};

/* ===== 藍圖（設計文件 6.6） ===== */

export const MID_BLUEPRINT = {
  key: 'exam-mid', title: '期中考', theme: 'forest', adventure: '森林探險',
  zones: [
    { chapter: '一、10 以內的數', name: '蘋果果園', icon: 'apple', collect: '🍎',
      slots: [['n10count'], ['n10match', 'n10frame'], ['n10corr'], ['exN10CircleN']] },
    { chapter: '二、比長短', name: '彩虹橋', icon: 'rainbow', collect: '🌟',
      slots: [['classify'], ['rope', 'box', 'curve3', 'exLenUnits'], ['thick2', 'thick3'], ['align']] },
    { chapter: '三、順序與多少', name: '動物列車', icon: 'locomotive', collect: '🎀',
      slots: [['ordSeq', 'exOrdCompare'], ['ordNth', 'ordCardinal'], ['ordMore', 'ordDiff'], ['exOrdQueue']] },
    { chapter: '四、分與合', name: '糖果屋', icon: 'lollipop', collect: '🍬',
      slots: [['bond'], ['picture', 'pair'], ['ten', 'wrong'], ['exSplitAll']] },
    { chapter: '五、認識形狀', name: '積木城堡', icon: 'castle', collect: '🍰',
      slots: [['shpName', 'shpClassify'], ['shpRoll', 'shpTrace'], ['shpCount'], ['exShpPattern']] },
  ],
};

export const FINAL_BLUEPRINT = {
  key: 'exam-final', title: '期末考', theme: 'park', adventure: '遊樂園探險',
  zones: [
    { chapter: '六、10 以內的加法', name: '氣球廣場', icon: 'balloon', collect: '🎈',
      slots: [['addPic'], ['addEq'], ['addPickEq', 'exAddSwap'], ['addMissing'], ['exAddWord']] },
    { chapter: '七、10 以內的減法', name: '餅乾工廠', icon: 'cookie', collect: '🍪',
      slots: [['subPic'], ['subEq', 'subMissing'], ['subPickEq', 'subStory'], ['exSubCompare'], ['exSubWord']] },
    { chapter: '八、30 以內的數', name: '水族館', icon: 'fish', collect: '🐟',
      slots: [['n30bundle', 'n30tens'], ['n30seq'], ['n30cmp'], ['exN30SkipCount'], ['exN30MoreLess']] },
    { chapter: '九、時間', name: '鐘樓', icon: 'alarm-clock', collect: '🌟',
      slots: [['timRead'], ['timHalfTrap'], ['timOrder', 'timEarlier'], ['exTimPickClock'], ['exTimDaily']] },
  ],
};
