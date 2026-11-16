// 對照測試工具：讓舊檔與新站在相同條件下播放，記錄字幕序列來比對。
// - 固定亂數（mulberry32），每次載入頁面都從同一個 seed 開始。
// - 移除語音合成，程式改走「只顯示字幕、等待一段時間」的路徑。
// - 假時鐘（page.clock）控制 setTimeout、setInterval、requestAnimationFrame、performance.now。
//
// 注意：假時鐘下不要用 page.click()。Playwright 的「元素穩定」檢查依賴 requestAnimationFrame，
// 時鐘停住時會一直等下去，所以這裡一律在頁面內用 DOM 的 click() 觸發。

const STEP_MS = 250;
// 空白或全形空白（舊檔把字幕設成一個全形空白 U+3000 來清空）。
const BLANK = /^[\s\u3000]*$/;

/** 允許的文字差異（舊字串 → 新字串）：介面不提「考卷」（設計文件 5.11）。 */
export const TEXT_CHANGES = [
  ['考卷會這樣考', '容易搞錯的題目'],
  ['考卷常常這樣說：是直線的打勾，是曲線的畫圈。', '題目常常這樣說：是直線的打勾，是曲線的畫圈。'],
];

/** 套用 TEXT_CHANGES，讓舊基準可以和新站的字幕直接比對。 */
export function normalize(lines) {
  return lines.map(line => TEXT_CHANGES.reduce((s, [from, to]) => s.split(from).join(to), line));
}

/** 注入固定亂數、移除語音、替換 Audio，並安裝假時鐘。必須在 page.goto 之前呼叫。 */
export async function prepare(page, { seed = 42 } = {}) {
  await page.addInitScript(s => {
    let a = s >>> 0;
    Math.random = function mulberry32() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    delete Window.prototype.speechSynthesis;
    delete window.speechSynthesis;
    window.Audio = class { play() { return Promise.resolve(); } pause() {} };
  }, seed);
  await page.clock.install();
}

/**
 * 在頁面內點擊第一個符合條件的元素。
 * textStartsWith：只點文字（或 inner 子元素的文字）以此開頭的元素。
 */
export async function clickEl(page, selector, { textStartsWith, inner } = {}) {
  const ok = await page.evaluate(({ selector, textStartsWith, inner }) => {
    const el = [...document.querySelectorAll(selector)].find(e => {
      if (textStartsWith === undefined) return true;
      const t = inner ? e.querySelector(inner)?.textContent : e.textContent;
      return (t || '').trim().startsWith(textStartsWith);
    });
    if (!el) return false;
    el.click();
    return true;
  }, { selector, textStartsWith, inner });
  if (!ok) throw new Error(`找不到可點擊的元素：${selector}${textStartsWith ? `（${textStartsWith}）` : ''}`);
}

// 讀一次畫面狀態，並依規則自動推進互動。回傳目前字幕與場景是否結束。
function sceneTick(page, idleMs, sinceClick) {
  return page.evaluate(({ idleMs, sinceClick }) => {
    const sub = document.querySelector('#sub')?.textContent ?? '';
    const bar = document.querySelector('#bar');
    const buttons = bar ? [...bar.querySelectorAll('button')] : [];
    const next = document.querySelector('#next');
    if ((next && next.classList.contains('pulse')) ||
        buttons.some(b => b.textContent.trim().startsWith('✏️ 開始練習'))) {
      return { sub, done: true, hasButtons: buttons.length > 0, clicked: false };
    }
    // 每顆按鈕先只點一次，避免重複觸發「🪄 幫我數」這類非同步動作。
    // 全部點過、且距離上次點擊超過 5 秒仍沒結束時，再點一次第一顆。
    // 例如「✔ 我分好了」要先按「🪄 幫我分」才有效，第二輪才會真正往下走。
    const enabled = buttons.filter(b => !b.disabled);
    const fresh = enabled.find(b => !b.dataset.harnessClicked);
    const target = fresh || (sinceClick >= 5000 ? enabled[0] : null);
    if (target) {
      target.dataset.harnessClicked = '1';
      target.click();
      return { sub, done: false, hasButtons: true, clicked: true };
    } else if (!buttons.length && idleMs >= 3000) {
      // 需要點 SVG 物件才能往下走的場景：點第一個有 blink 或 pulse class 的元素。
      const target = document.querySelector('#svg .blink, #svg .pulse');
      if (target) target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    return { sub, done: false, hasButtons: buttons.length > 0, clicked: false };
  }, { idleMs, sinceClick });
}

/** 記錄目前場景的字幕序列，直到場景結束（#next 閃爍，或出現「✏️ 開始練習」按鈕）。 */
export async function recordScene(page, { maxMs = 120000 } = {}) {
  const lines = [];
  const push = s => { if (!BLANK.test(s) && s !== lines[lines.length - 1]) lines.push(s); };
  let idleMs = 0;
  let sinceClick = 0;
  for (let t = 0; t <= maxMs; t += STEP_MS) {
    const r = await sceneTick(page, idleMs, sinceClick);
    push(r.sub);
    if (r.done) return lines;
    idleMs = r.hasButtons ? 0 : idleMs + STEP_MS;
    sinceClick = r.clicked ? 0 : sinceClick + STEP_MS;
    await page.clock.runFor(STEP_MS);
  }
  throw new Error(`場景超過 ${maxMs}ms 仍未結束，最後一句字幕：「${lines[lines.length - 1] ?? ''}」`);
}

/**
 * 用 window.__T.answer() 依 pattern 作答，一直到結果頁，記錄字幕。
 * 每題等題目唸完（依字幕長度估算）才作答，作答後點「下一題」或「看結果」。
 */
export async function recordPractice(page, { pattern = [true, false], maxMs = 600000 } = {}) {
  const lines = [];
  const push = s => { if (!BLANK.test(s) && s !== lines[lines.length - 1]) lines.push(s); };
  let answered = 0;
  let curIdx = -1;
  let readyAt = Infinity;
  let elapsed = 0;
  for (; elapsed <= maxMs; elapsed += STEP_MS) {
    const r = await page.evaluate(() => {
      const st = window.__T && window.__T.state;
      return {
        sub: document.querySelector('#sub')?.textContent ?? '',
        title: document.querySelector('#stTxt')?.textContent ?? '',
        idx: st && st.P ? st.P.i : -1,
        done: st ? !!st.done : false,
        hasItem: !!(st && st.type),
        hasNext: !!document.querySelector('#nextQ'),
      };
    });
    push(r.sub);
    if (r.title.includes('練習結果')) break;
    if (r.hasItem && r.idx !== curIdx) {
      // 新題目開始：題目字幕唸完大約要 500 + 字數 × 200 ms，再多留 1 秒。
      curIdx = r.idx;
      readyAt = elapsed + 1500 + r.sub.length * 200;
    }
    if (r.hasItem && !r.done && r.idx === curIdx && elapsed >= readyAt && answered <= curIdx) {
      const correct = pattern[answered % pattern.length];
      answered = curIdx + 1;
      await page.evaluate(c => window.__T.answer(c), correct);
    } else if (r.done && r.hasNext) {
      await clickEl(page, '#nextQ');
    }
    await page.clock.runFor(STEP_MS);
  }
  if (elapsed > maxMs) {
    throw new Error(`練習超過 ${maxMs}ms 仍未到結果頁，最後一句字幕：「${lines[lines.length - 1] ?? ''}」`);
  }
  // 結果頁的鼓勵語音唸完。
  for (let t = 0; t < 15000; t += STEP_MS) {
    await page.clock.runFor(STEP_MS);
    push(await page.evaluate(() => document.querySelector('#sub')?.textContent ?? ''));
  }
  return lines;
}
