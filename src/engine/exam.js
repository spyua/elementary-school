// 考試畫面（期中考、期末考）：出卷、交卷確認、結果頁、錯題重看。
// 作答本身交給練習引擎（startPractice 的 cfg.exam 分支）；這裡不碰練習引擎的內部變數，
// 只透過 startPractice 的 cfg.exam 和 reviewExamItem() 溝通。
//
// 隱私：作答紀錄（哪題錯、孩子選了什麼）只放在記憶體的 X 裡，離開考試就丟掉。
// 唯一會存進瀏覽器的是星星數（hooks.onResult，和練習相同）。
import { ABORT, S } from './state.js';
import { $, shuffle } from './util.js';
import { say, stopSpeech, subEl } from './speech.js';
import { el, txt, clear } from './svg.js';
import { clearBar, button } from './ui.js';
import { GEN, startPractice, reviewExamItem, practiceHooks } from './practice.js';
import { buildPaper, validateBlueprint } from './paper.js';
import { uiUrl, emojiUrl } from './emoji.js';
import { confetti, starBurst } from './fx.js';
import { playSfx } from './sfx.js';

const POINTS = 5;

/** 目前這場考試的狀態；沒有考試時是 null。 */
let X = null;

/** 依分數決定獎牌、文字與星星數（設計文件 6.8）。用正面語氣，不用叉叉或「不及格」。 */
export function scoreTier(score) {
  if (score >= 100) return { medal: 'trophy', msg: '全部答對！太厲害了！', stars: 3 };
  if (score >= 80) return { medal: 'medal-gold', msg: '好棒！只差一點點！', stars: 2 };
  if (score >= 60) return { medal: 'medal-silver', msg: '很努力喔！一起看看哪裡可以更好。', stars: 1 };
  return { medal: 'medal-bronze', msg: '你很勇敢，做完了全部！一起來練習吧！', stars: 1 };
}

/** 給測試用（window.__T.exam）：{ i, total, phase, score, wrong }。沒有考試時回傳 null。 */
export function examState() {
  if (!X) return null;
  return { i: X.i, total: X.paper.length, phase: X.phase, score: X.score, wrong: X.log.filter(e => !e.ok).map(e => e.n) };
}

/**
 * 開始一場考試。cfg: { id, title, blueprint, theme? }。
 * 每次都重新出一份卷（題型與種子都隨機），再交給練習引擎的考試分支作答。
 */
export function startExam(cfg) {
  closeExam();
  validateBlueprint(cfg.blueprint, GEN);
  const paper = buildPaper(cfg.blueprint);
  X = { cfg, paper, log: [], phase: 'question', i: 0, score: null, seen: new Set() };
  const me = X;
  startPractice({
    title: cfg.title, unitId: cfg.id, queue: paper.map(q => q.type),
    exam: {
      paper,
      onItem(i) { if (X === me) { X.i = i; X.phase = 'question'; } },
      onAnswered(entry) { if (X === me) X.log.push(entry); },
      onEnd() { if (X === me) showSubmit(); },
    },
  });
}

/** 離開考試：移除結果頁面板、丟掉作答紀錄。 */
export function closeExam() {
  X = null;
  $('#examResult')?.remove();
}

/* 交卷確認：「要交卷了嗎？」＋「✔ 交卷」。 */
async function showSubmit() {
  X.phase = 'submit';
  S.runId++;
  const id = S.runId;
  stopSpeech(); clear(); clearBar();
  $('#crumb').querySelectorAll('.dot').forEach(d => { d.classList.remove('on'); d.classList.add('done'); });
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
