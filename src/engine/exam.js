// 考試畫面（期中考、期末考）：出卷、冒險地圖封面、每題開場、休息站、收集物、交卷確認、結果頁、錯題重看。
// 作答本身交給練習引擎（startPractice 的 cfg.exam 分支）；這裡不碰練習引擎的內部變數，
// 只透過 startPractice 的 cfg.exam 和 reviewExamItem() 溝通。
//
// 冒險主題（設計文件 6.7）：讓孩子想答下一題，但不搶題目畫面。
// - 地圖進度列（#crumb）：20 站，吉祥物站在目前這一站。
// - 每題開場（#examIntro）：主題圖彈入、「第 N 站」、吉祥物跳一下，1.1 秒內結束，點一下就略過。
// - 休息站：每區結束顯示「○○完成！」和這一區收集到的小物，按「繼續 ▶」。
// - 收集物：每答一題就飛一個小物進背包（#examBag），和對錯無關。
// - 動畫只在題目區外圍；「減少動態效果」時只保留淡入（樣式在 app.css）。
//
// 隱私：作答紀錄（哪題錯、孩子選了什麼）只放在記憶體的 X 裡，離開考試就丟掉。
// 唯一會存進瀏覽器的是星星數（hooks.onResult，和練習相同）。
import { ABORT, S } from './state.js';
import { $, shuffle } from './util.js';
import { say, stopSpeech, subEl } from './speech.js';
import { el, txt, clear } from './svg.js';
import { clearBar, button, askChoice } from './ui.js';
import { GEN, startPractice, reviewExamItem, practiceHooks } from './practice.js';
import { buildPaper, validateBlueprint } from './paper.js';
import { uiUrl, emojiUrl, emojiFile, emojiAt } from './emoji.js';
import { confetti, starBurst, replay } from './fx.js';
import { playSfx } from './sfx.js';

const POINTS = 5;
const INTRO_MS = 1100;
// 地圖上各區的顏色（依區的順序）
const ZONE_COLORS = ['#ff5a5f', '#ffbe0b', '#3a86ff', '#ff8fab', '#2bb673'];
// 封面背景的小裝飾（依主題）：[emoji, x, y]
const DECO = {
  forest: [['🌳', 60, 380], ['🌳', 150, 395], ['☀', 735, 70], ['🌳', 660, 392], ['🌳', 740, 380], ['☁', 80, 70]],
  park: [['🎈', 60, 370], ['🍭', 150, 395], ['☀', 735, 70], ['🌈', 660, 385], ['🎈', 745, 372], ['☁', 80, 70]],
};

/** 目前這場考試的狀態；沒有考試時是 null。 */
let X = null;

/** 依分數決定獎牌、文字與星星數（設計文件 6.8）。用正面語氣，不用叉叉或「不及格」。 */
export function scoreTier(score) {
  if (score >= 100) return { medal: 'trophy', msg: '全部答對！太厲害了！', stars: 3 };
  if (score >= 80) return { medal: 'medal-gold', msg: '好棒！只差一點點！', stars: 2 };
  if (score >= 60) return { medal: 'medal-silver', msg: '很努力喔！一起看看哪裡可以更好。', stars: 1 };
  return { medal: 'medal-bronze', msg: '你很勇敢，做完了全部！一起來練習吧！', stars: 1 };
}

/**
 * 給測試用（window.__T.exam）：{ i, total, phase, score, wrong, bag }。沒有考試時回傳 null。
 * phase：cover（封面）、intro（每題開場）、question、rest（休息站）、submit、result、review。
 */
export function examState() {
  if (!X) return null;
  return { i: X.i, total: X.paper.length, phase: X.phase, score: X.score, wrong: X.log.filter(e => !e.ok).map(e => e.n), bag: X.bag };
}

/**
 * 開始一場考試。cfg: { id, title, blueprint, theme? }。
 * 每次都重新出一份卷（題型與種子都隨機），再交給練習引擎的考試分支作答。
 */
export function startExam(cfg) {
  closeExam();
  validateBlueprint(cfg.blueprint, GEN);
  const paper = buildPaper(cfg.blueprint);
  X = { cfg, paper, log: [], phase: 'cover', i: 0, score: null, seen: new Set(), bag: 0, got: cfg.blueprint.zones.map(() => 0) };
  const me = X;
  mountBag();
  startPractice({
    title: cfg.title, unitId: cfg.id, queue: paper.map(q => q.type),
    exam: {
      paper,
      // 出題前：第一題先播封面；換區時先到休息站；每題都有開場。播完才出題。
      async beforeItem(i, id) {
        if (X !== me) return;
        X.i = i;
        renderStations(me, i);
        if (i === 0) await showCover(me, id);
        else if (paper[i - 1].zone !== paper[i].zone) await showRest(me, paper[i - 1].zone, id);
        if (X !== me || id !== S.runId) return;
        clear(); clearBar();
        await showIntro(me, i, id);
      },
      crumb(i) { if (X === me) renderStations(me, i); },
      onItem(i) { if (X === me) { X.i = i; X.phase = 'question'; } },
      onAnswered(entry) { if (X === me) { X.log.push(entry); collect(me, entry.zone); } },
      onEnd() { if (X === me) finish(me); },
    },
  });
}

/** 離開考試：移除結果頁面板、開場、背包，丟掉作答紀錄。 */
export function closeExam() {
  X = null;
  $('#examResult')?.remove();
  $('#examIntro')?.remove();
  $('#examBag')?.remove();
  $('#crumb')?.classList.remove('exMap');
}

/* ===== 冒險主題：地圖進度列、封面、每題開場、休息站、收集物 ===== */

/** 「減少動態效果」：收集物不飛，直接加到背包。 */
function reducedMotion() {
  try { return !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** 地圖進度列：#crumb 畫成 20 站，已過的站亮起來，吉祥物站在目前這一站。換區時多留一點空隙。 */
function renderStations(x, i) {
  const c = $('#crumb');
  if (!c) return;
  c.innerHTML = '';
  c.classList.add('exMap');
  x.paper.forEach((q, k) => {
    const d = document.createElement('div');
    d.className = 'station' + (k === i ? ' on' : k < i ? ' done' : '') + (k > 0 && x.paper[k - 1].zone !== q.zone ? ' zstart' : '');
    d.dataset.zone = String(q.zone);
    d.style.setProperty('--zc', ZONE_COLORS[q.zone % ZONE_COLORS.length]);
    if (k === i) {
      const m = document.createElement('img');
      m.className = 'stMascot';
      m.src = uiUrl('mascot');
      m.alt = '';
      d.appendChild(m);
    }
    c.appendChild(d);
  });
}

/** 地圖上第 k 站的位置（彎彎的小路，從左走到右）。k 可以是小數，畫小路時用。 */
function stationPos(k, n) {
  const t = n > 1 ? k / (n - 1) : 0;
  return [70 + t * 660, 255 + 70 * Math.sin(t * Math.PI * 2.6)];
}

/** 等 p 結束，或點一下 target 就提早結束。p 被中止（ABORT）時照樣往外丟。 */
function skippable(p, target) {
  return new Promise((res, rej) => {
    let done = false;
    const fin = () => { if (!done) { done = true; res(); } };
    p.then(fin, e => { if (!done) { done = true; rej(e); } });
    target.addEventListener('click', fin, { once: true });
  });
}

/**
 * 封面：冒險地圖（小路、20 站、各區主題圖、吉祥物在起點），標題「森林探險」或「遊樂園探險」。
 * 唸完「出發！」自動開始；點一下畫面就略過。
 */
async function showCover(x, id) {
  x.phase = 'cover';
  const bp = x.cfg.blueprint, n = x.paper.length, adv = bp.adventure || x.cfg.title;
  clear();
  $('#stTxt').textContent = `📝 ${x.cfg.title}`;
  for (const [ch, dx, dy] of DECO[bp.theme] || DECO.forest) emojiAt(dx, dy, ch, { 'font-size': 44, class: 'svgtxt pop' });
  txt(400, 50, adv, { 'font-size': 50, fill: '#e07a00', class: 'svgtxt pop' });
  txt(400, 98, `一共 ${n} 站，出發！`, { 'font-size': 26, fill: '#7a6650' });
  const pts = Array.from({ length: 61 }, (_, k) => stationPos(k / 60 * (n - 1), n));
  const d = 'M' + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L');
  el('path', { d, fill: 'none', stroke: '#f3e2b8', 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  el('path', { d, fill: 'none', stroke: '#e0b46a', 'stroke-width': 5, 'stroke-linecap': 'round', pathLength: 100, class: 'mapRoad' });
  // 各區主題圖：放在該區中間那一站旁邊；小路在低處時放上方，在高處時放下方，才不會壓到標題
  bp.zones.forEach((z, zi) => {
    const ks = x.paper.map((q, k) => (q.zone === zi ? k : -1)).filter(k => k >= 0);
    if (!ks.length) return;
    const [px, py] = stationPos(ks[Math.floor(ks.length / 2)], n);
    const up = py > 255;
    el('image', { href: emojiUrl(z.icon), x: px - 28, y: up ? py - 92 : py + 36, width: 56, height: 56, class: 'svgtxt pop', style: `animation-delay:${(0.3 + zi * 0.15).toFixed(2)}s` });
  });
  x.paper.forEach((q, k) => {
    const [px, py] = stationPos(k, n), col = ZONE_COLORS[q.zone % ZONE_COLORS.length];
    const g = el('g', { class: 'pop', style: `animation-delay:${(k * 0.04).toFixed(2)}s` });
    el('circle', { cx: px, cy: py, r: 14, fill: '#fff', stroke: col, 'stroke-width': 5 }, g);
    txt(px, py + 1, String(k + 1), { 'font-size': 13, fill: '#3d2c1e' }, g);
  });
  const [mx, my] = stationPos(0, n);
  el('image', { href: uiUrl('mascot'), x: mx - 30, y: my - 72, width: 60, height: 60, class: 'svgtxt mapMascot' });
  const skip = el('rect', { x: 0, y: 0, width: 800, height: 420, fill: 'transparent', style: 'cursor:pointer', id: 'examCoverSkip' });
  await skippable(say(`${adv}，出發！一共 ${n} 站。`, id), skip);
  stopSpeech();
}

/**
 * 每題開場（#examIntro）：該區主題圖彈入、「第 N 站」、吉祥物跳一下。
 * 最多 1.1 秒，點一下就略過；離開考試（runId 改變）時立刻結束。
 */
function showIntro(x, i, id) {
  x.phase = 'intro';
  const zi = x.paper[i].zone, z = x.cfg.blueprint.zones[zi] || {};
  $('#examIntro')?.remove();
  const box = document.createElement('div');
  box.id = 'examIntro';
  box.style.setProperty('--zc', ZONE_COLORS[zi % ZONE_COLORS.length]);
  const icon = document.createElement('img');
  icon.className = 'exIntroIcon';
  icon.alt = '';
  icon.src = z.icon ? emojiUrl(z.icon) : uiUrl('star');
  const no = document.createElement('div');
  no.className = 'exIntroNo';
  no.textContent = `第 ${i + 1} 站`;
  const name = document.createElement('div');
  name.className = 'exIntroZone';
  name.textContent = z.name || '';
  const mascot = document.createElement('img');
  mascot.className = 'exIntroMascot';
  mascot.alt = '';
  mascot.src = uiUrl('mascot');
  box.append(icon, no, name, mascot);
  $('#stage').appendChild(box);
  return new Promise(res => {
    let done = false, t = 0, poll = 0;
    const fin = () => { if (done) return; done = true; clearTimeout(t); clearInterval(poll); box.remove(); res(); };
    t = setTimeout(fin, INTRO_MS);
    poll = setInterval(() => { if (id !== S.runId) fin(); }, 100);
    box.addEventListener('click', fin);
  });
}

/** 休息站：「○○完成！」、這一區收集到的小物，按「繼續 ▶」才往下。 */
async function showRest(x, zi, id) {
  x.phase = 'rest';
  const z = x.cfg.blueprint.zones[zi] || {};
  clear();
  $('#stTxt').textContent = `📝 ${x.cfg.title}　休息站`;
  if (z.icon) el('image', { href: emojiUrl(z.icon), x: 400 - 60, y: 28, width: 120, height: 120, class: 'svgtxt pop' });
  txt(400, 196, `${z.name || ''}完成！`, { 'font-size': 50, fill: '#e07a00', class: 'svgtxt pop' });
  const got = x.got[zi] || 0, file = emojiFile(z.collect);
  for (let k = 0; k < got; k++) {
    const cx = 400 - (got - 1) * 40 + k * 80;
    if (file) el('image', { href: emojiUrl(file), x: cx - 32, y: 248, width: 64, height: 64, class: 'svgtxt pop', style: `animation-delay:${(0.2 + k * 0.15).toFixed(2)}s` });
    else txt(cx, 280, z.collect || '⭐', { 'font-size': 48, class: 'svgtxt pop' });
  }
  txt(400, 372, '休息一下，準備好了就按「繼續 ▶」', { 'font-size': 24, fill: '#7a6650' });
  confetti($('#stage'), { seed: 11 + zi, count: 16 });
  playSfx('star');
  const choice = askChoice([{ label: '繼續 ▶', color: '#2bb673', value: true }], id);
  const btn = $('#bar').lastElementChild;
  if (btn) { btn.id = 'examContinue'; btn.classList.add('pulse'); }
  say(`${z.name || ''}完成！休息一下。`, id).catch(() => { /* 按了繼續或離開，不必處理 */ });
  await choice;
  stopSpeech();
}

/** 背包（#examBag）：放在 #stage 右上角，顯示收集到幾個小物。不擋點擊。 */
function mountBag() {
  $('#examBag')?.remove();
  const bag = document.createElement('div');
  bag.id = 'examBag';
  const img = document.createElement('img');
  img.alt = '';
  img.src = emojiUrl('backpack');
  const n = document.createElement('span');
  n.className = 'exBagN';
  n.textContent = '0';
  bag.append(img, n);
  $('#stage').appendChild(bag);
}

/** 每答一題（不論對錯）：該區小物飛進背包，數字加 1。 */
function collect(x, zi) {
  x.got[zi] = (x.got[zi] || 0) + 1;
  x.bag++;
  const z = x.cfg.blueprint.zones[zi] || {}, file = emojiFile(z.collect), count = x.bag;
  const bump = () => {
    const bag = $('#examBag');
    if (!bag || X !== x) return;
    bag.querySelector('.exBagN').textContent = String(count);
    replay(bag, 'hop');
  };
  if (reducedMotion() || !file) { bump(); return; }
  const fly = document.createElement('img');
  fly.className = 'exFly';
  fly.alt = '';
  fly.src = emojiUrl(file);
  $('#stage').appendChild(fly);
  setTimeout(() => { fly.remove(); bump(); }, 700);
}

/** 最後一題答完：最後一區的休息站 → 交卷確認。 */
async function finish(x) {
  S.runId++;
  const id = S.runId;
  stopSpeech(); clear(); clearBar();
  renderStations(x, x.paper.length);
  try { await showRest(x, x.paper[x.paper.length - 1].zone, id); } catch (e) { if (e !== ABORT) console.error(e); return; }
  if (X === x && id === S.runId) showSubmit();
}

/* 交卷確認：「要交卷了嗎？」＋「✔ 交卷」。 */
async function showSubmit() {
  X.phase = 'submit';
  S.runId++;
  const id = S.runId;
  stopSpeech(); clear(); clearBar();
  renderStations(X, X.paper.length);
  $('#stTxt').textContent = `📝 ${X.cfg.title}`;
  el('image', { href: uiUrl('wrapped-gift'), x: 400 - 70, y: 70, width: 140, height: 140, class: 'svgtxt pop' });
  txt(400, 270, '要交卷了嗎？', { 'font-size': 52, fill: '#e07a00', 'font-weight': 900 });
  txt(400, 335, `${X.paper.length} 題都做完了！`, { 'font-size': 30, fill: '#7a6650' });
  button('✔ 交卷', '#2bb673', () => { if (id === S.runId) showResult(); }, 'pulse').id = 'examSubmit';
  try { await say(`${X.paper.length} 題都做完了！要交卷了嗎？`, id); } catch { /* 已經交卷或離開，不必處理 */ }
}

/* 結果頁三幕：先肯定做完 → 分數 count-up 與獎牌 → 錯題卡「再看一次」。 */
async function showResult() {
  const x = X;
  x.phase = 'result';
  S.runId++;
  const id = S.runId;
  stopSpeech(); clear(); clearBar();
  $('#examBag')?.remove();
  $('#examIntro')?.remove();
  const right = x.log.filter(e => e.ok).length;
  x.score = right * POINTS;
  const tier = scoreTier(x.score);
  practiceHooks().onResult(x.cfg.id, tier.stars);

  // 第一幕：完成
  const st = $('#stage');
  el('image', { href: uiUrl('party-popper'), x: 400 - 80, y: 60, width: 160, height: 160, class: 'svgtxt pop' });
  txt(400, 290, `你完成了 ${x.paper.length} 站冒險！`, { 'font-size': 46, fill: '#e07a00', 'font-weight': 900 });
  confetti(st, { seed: 2026 });
  playSfx('star');
  try { await say(`你完成了 ${x.paper.length} 站冒險！`, id); } catch (e) { if (e !== ABORT) console.error(e); return; }
  if (X !== x || id !== S.runId) return;

  // 第二幕、第三幕：成績單面板
  clear();
  renderPanel(x);
  resultBar(x);
  if (x.score === 100) starBurst(st, { xPct: 50, yPct: 22 });
  try { await say(tier.msg, id); } catch { /* 離開或點了錯題卡，不必處理 */ }
}

/* 成績單面板（#examResult）：分數、獎牌、錯題卡片。HTML 放在 #stage 裡，內容多時可以捲動。 */
function renderPanel(x) {
  $('#examResult')?.remove();
  const tier = scoreTier(x.score);
  const wrong = x.log.filter(e => !e.ok);
  const box = document.createElement('div');
  box.id = 'examResult';

  const head = document.createElement('div');
  head.className = 'exHead';
  const medal = document.createElement('img');
  medal.className = 'exMedal pop';
  medal.src = uiUrl(tier.medal);
  medal.alt = '';
  const score = document.createElement('div');
  score.className = 'exScore';
  score.dataset.score = String(x.score);
  const num = document.createElement('span');
  num.className = 'exNum';
  num.textContent = '0';
  score.append(num, ' 分');
  const msg = document.createElement('div');
  msg.className = 'exMsg';
  msg.textContent = tier.msg;
  const txtBox = document.createElement('div');
  txtBox.append(score, msg);
  head.append(medal, txtBox);
  box.appendChild(head);
  countUp(num, x.score);

  if (wrong.length) {
    const h = document.createElement('h3');
    h.className = 'exTitle';
    h.textContent = '再看一次';
    const list = document.createElement('div');
    list.className = 'exCards';
    for (const e of wrong) {
      const zone = x.cfg.blueprint.zones[e.zone] || {};
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'examCard' + (x.seen.has(e.n) ? ' seen' : '');
      card.dataset.n = String(e.n);
      const no = document.createElement('span');
      no.className = 'exNo';
      no.textContent = `第 ${e.n} 題`;
      const icon = document.createElement('img');
      icon.alt = '';
      icon.src = zone.icon ? emojiUrl(zone.icon) : uiUrl('star');
      const look = document.createElement('span');
      look.className = 'exLook';
      look.textContent = x.seen.has(e.n) ? '✔ 看過了' : '看答案';
      card.append(no, icon, look);
      card.onclick = () => openReview(e.n);
      list.appendChild(card);
    }
    box.append(h, list);
    if (wrong.every(e => x.seen.has(e.n))) {
      const sticker = document.createElement('div');
      sticker.className = 'exSticker pop';
      const img = document.createElement('img');
      img.alt = '';
      img.src = uiUrl('medal-gold');
      sticker.append(img, '認真小學者');
      box.appendChild(sticker);
    }
  }
  $('#stage').appendChild(box);
}

/* 分數從 0 跳到最終分數（只改文字）。 */
function countUp(node, score) {
  const t0 = performance.now(), dur = 900;
  const step = now => {
    if (!node.isConnected) { node.textContent = String(score); return; }
    const p = Math.min(1, (now - t0) / dur);
    node.textContent = String(Math.round(score * p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* 結果頁底部按鈕：練習這些題型、再考一次、回首頁。 */
function resultBar(x) {
  clearBar();
  const wrongTypes = x.log.filter(e => !e.ok).map(e => e.type);
  if (wrongTypes.length) {
    button('🔁 練習這些題型', '#ff8c42', () => {
      closeExam();
      startPractice({
        title: '錯題練習', types: [...new Set(wrongTypes)],
        queue: shuffle(wrongTypes.concat(wrongTypes)).slice(0, Math.max(3, wrongTypes.length)), unitId: null,
      });
    });
  }
  button('📝 再考一次', '#9b7bd8', () => startExam(x.cfg));
  button('🏠 回首頁', '#3a86ff', () => practiceHooks().goHome());
}

/* 點錯題卡：用種子重建這一題，灰色是孩子的答案、綠色是正確答案，接著播講解。 */
async function openReview(n) {
  const x = X;
  const entry = x && x.log.find(e => e.n === n);
  if (!entry) return;
  x.phase = 'review';
  S.runId++;
  const id = S.runId;
  $('#examResult')?.classList.add('hidden');
  $('#stTxt').textContent = `📝 ${x.cfg.title}　第 ${n} 題`;
  const done = reviewExamItem(entry, id);
  // reviewExamItem 一開始會清空按鈕列，所以「回到成績單」要在它之後放；講解播到一半也能回去。
  button('↩ 回到成績單', '#3a86ff', () => backToResult(x, n)).id = 'examBack';
  try { await done; } catch (e) { if (e !== ABORT) console.error(e); }
}

function backToResult(x, n) {
  if (X !== x) return;
  S.runId++;
  stopSpeech(); clear();
  const firstTime = !x.seen.has(n);
  x.seen.add(n);
  x.phase = 'result';
  subEl.textContent = '　';
  $('#stTxt').textContent = `📝 ${x.cfg.title}`;
  renderPanel(x);
  resultBar(x);
  const wrong = x.log.filter(e => !e.ok);
  // 全部看完：送一張「認真小學者」貼紙
  if (firstTime && wrong.every(e => x.seen.has(e.n))) {
    playSfx('star');
    confetti($('#stage'), { seed: 99 });
  }
}

/* test hook：window.__T.exam 唯讀，給 e2e 測試看考試進度。 */
if (window.__T && !Object.prototype.hasOwnProperty.call(window.__T, 'exam')) {
  Object.defineProperty(window.__T, 'exam', { get: examState, enumerable: true });
}
