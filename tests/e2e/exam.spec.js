// 期中考、期末考流程：作答時不透露對錯、交卷後分數正確、錯題卡可以重看正解與講解。
// 用真的時鐘；拿掉語音合成（字幕照常顯示），音效換成空的 Audio。
import { test, expect } from '@playwright/test';
import { clickEl } from './helpers/harness.js';

const GREEN = '#2bb673';

async function openExam(page, key, { reducedMotion } = {}) {
  if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    delete Window.prototype.speechSynthesis;
    delete window.speechSynthesis;
    window.Audio = class { play() { return Promise.resolve(); } pause() {} };
  });
  await page.goto(`/#/g1/math/a/${key}`);
  await expect(page.locator('#startOv')).toBeVisible();
  await clickEl(page, '#startBtn');
}

// #svg 裡綠色（正解顏色）的元素數量。有些題目本來就用綠色畫物件，所以比較「送出前後」的差別。
const countGreens = page => page.evaluate(g => [...document.querySelectorAll('#svg *')]
  .filter(n => n.getAttribute('stroke') === g || n.getAttribute('fill') === g).length, GREEN);

const examPhase = page => page.evaluate(() => {
  const T = window.__T;
  return T && T.exam ? { phase: T.exam.phase, i: T.state.P ? T.state.P.i : -1, done: !!T.state.done } : null;
});

/** 等到第 k 題可以作答；途中遇到休息站就按「繼續 ▶」（封面和每題開場會自己播完）。 */
async function waitQuestion(page, k) {
  const until = Date.now() + 25_000;
  while (Date.now() < until) {
    const st = await examPhase(page);
    if (st && st.phase === 'question' && st.i === k && !st.done) return;
    if (st && st.phase === 'rest' && await page.locator('#examContinue').count()) await clickEl(page, '#examContinue');
    await page.waitForTimeout(100);
  }
  throw new Error(`等不到第 ${k + 1} 題`);
}

/** 20 題答完後：經過最後一區的休息站，到交卷確認。 */
async function toSubmit(page) {
  const until = Date.now() + 25_000;
  while (Date.now() < until) {
    const st = await examPhase(page);
    if (st && st.phase === 'submit') return;
    if (st && st.phase === 'rest' && await page.locator('#examContinue').count()) await clickEl(page, '#examContinue');
    await page.waitForTimeout(100);
  }
  throw new Error('等不到交卷確認');
}

/** 依 pattern(k) 答完 20 題，回傳每題送出後的畫面紀錄。 */
async function answerAll(page, pattern) {
  const snaps = [];
  for (let k = 0; k < 20; k++) {
    await waitQuestion(page, k);
    const before = await countGreens(page);
    const correct = pattern(k);
    await page.evaluate(c => window.__T.answer(c), correct);
    const snap = await page.evaluate(() => ({
      sub: document.querySelector('#sub').textContent,
      score: document.querySelector('#score').textContent,
      done: window.__T.state.done,
      bar: [...document.querySelectorAll('#bar button')].map(b => b.textContent),
    }));
    snaps.push({ ...snap, correct, greensAdded: (await countGreens(page)) - before });
  }
  return snaps;
}

test.describe('考試', () => {
  test.describe.configure({ timeout: 180_000 });

  test('期中考：作答沒有對錯回饋，交卷後分數與錯題卡正確，錯題可以重看', async ({ page }) => {
    await openExam(page, 'exam-mid');
    await expect(page.locator('#stTxt')).toContainText('期中考');
    const pattern = k => k % 3 !== 0;
    const snaps = await answerAll(page, pattern);

    for (const s of snaps) {
      expect(s.done).toBe(true);
      expect(s.sub).toBe('收到！');
      expect(s.score).toBe('');
      expect(s.greensAdded).toBe(0);
      expect(s.bar).toEqual([]);
    }
    // 答對和答錯時看到的東西完全一樣
    const strip = ({ correct, ...rest }) => rest; // eslint-disable-line no-unused-vars
    const right = snaps.filter(s => s.correct).map(strip);
    const wrong = snaps.filter(s => !s.correct).map(strip);
    expect(new Set(right.map(s => JSON.stringify(s))).size).toBe(1);
    expect(JSON.stringify(wrong[0])).toBe(JSON.stringify(right[0]));

    // 交卷
    await toSubmit(page);
    await expect(page.locator('#sub')).toContainText('要交卷了嗎');
    await clickEl(page, '#examSubmit');

    const nRight = snaps.filter(s => s.correct).length;
    const nWrong = 20 - nRight;
    const result = page.locator('#examResult');
    await expect(result).toBeVisible({ timeout: 20_000 });
    await expect(result.locator('.exScore')).toHaveAttribute('data-score', String(nRight * 5));
    await expect(result.locator('.exNum')).toHaveText(String(nRight * 5), { timeout: 5_000 });
    await expect(result.locator('.examCard')).toHaveCount(nWrong);
    const st = await page.evaluate(() => window.__T.exam);
    expect(st.score).toBe(nRight * 5);
    expect(st.wrong).toEqual(snaps.map((s, i) => (s.correct ? null : i + 1)).filter(Boolean));

    // 點第一張錯題卡：畫出綠色正解並播講解
    const first = result.locator('.examCard').first();
    const n = await first.getAttribute('data-n');
    await clickEl(page, `.examCard[data-n="${n}"]`);
    await expect(result).toBeHidden();
    await page.waitForFunction(() => window.__T.exam.phase === 'review');
    await page.waitForFunction(g => [...document.querySelectorAll('#svg *')]
      .some(e => e.getAttribute('stroke') === g || e.getAttribute('fill') === g), GREEN, { timeout: 10_000 });
    await page.waitForFunction(() => {
      const t = document.querySelector('#sub').textContent;
      return t === '我們一起看看為什麼。' || t.startsWith('正確答案是');
    }, null, { timeout: 10_000 });
    const intro = await page.locator('#sub').textContent();
    // 字幕換成講解的內容（講解在播）
    await page.waitForFunction(t => {
      const s = document.querySelector('#sub').textContent;
      return s !== t && s.trim() !== '';
    }, intro, { timeout: 30_000 });

    // 回到成績單，那張卡打勾
    await clickEl(page, '#examBack');
    await expect(result).toBeVisible();
    await expect(result.locator(`.examCard[data-n="${n}"]`)).toHaveClass(/seen/);
    await expect(result.locator('.examCard.seen')).toHaveCount(1);
    await expect(page.locator('#bar button', { hasText: '練習這些題型' })).toBeVisible();
    await expect(page.locator('#bar button', { hasText: '再考一次' })).toBeVisible();
  });

  test('期末考：全部答對是 100 分、沒有錯題卡', async ({ page }) => {
    await openExam(page, 'exam-final');
    await expect(page.locator('#stTxt')).toContainText('期末考');
    const snaps = await answerAll(page, () => true);
    for (const s of snaps) {
      expect(s.sub).toBe('收到！');
      expect(s.greensAdded).toBe(0);
    }
    await toSubmit(page);
    await clickEl(page, '#examSubmit');
    const result = page.locator('#examResult');
    await expect(result).toBeVisible({ timeout: 20_000 });
    await expect(result.locator('.exScore')).toHaveAttribute('data-score', '100');
    await expect(result.locator('.examCard')).toHaveCount(0);
    await expect(page.locator('#bar button', { hasText: '練習這些題型' })).toHaveCount(0);
    // 星星存進進度（100 分 = 3 顆）
    const stars = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stars).toContain('G1A-M-exam-final');
  });

  test('冒險主題：封面可略過、每題開場點一下就消失、第 4 題後到休息站，按「繼續 ▶」接著出題', async ({ page }) => {
    await openExam(page, 'exam-mid');
    // 封面：森林探險地圖，點一下略過
    await page.waitForFunction(() => window.__T.exam && window.__T.exam.phase === 'cover');
    await expect(page.locator('#svg')).toContainText('森林探險');
    await page.evaluate(() => document.querySelector('#examCoverSkip').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    // 每題開場：#examIntro 出現，點一下就消失並出題
    const intro = page.locator('#examIntro');
    await expect(intro).toBeVisible({ timeout: 5_000 });
    await expect(intro).toContainText('第 1 站');
    await expect(intro).toContainText('蘋果果園');
    await clickEl(page, '#examIntro');
    await expect(intro).toHaveCount(0);
    await waitQuestion(page, 0);
    // 地圖進度列：20 站，吉祥物站在第 1 站
    await expect(page.locator('#crumb .station')).toHaveCount(20);
    await expect(page.locator('#crumb .station').first().locator('.stMascot')).toHaveCount(1);
    // 答完第一區 4 題
    for (let k = 0; k < 4; k++) {
      await waitQuestion(page, k);
      await page.evaluate(c => window.__T.answer(c), k % 2 === 0);
    }
    // 休息站：收集物和對錯無關，4 題就是 4 個
    await page.waitForFunction(() => window.__T.exam.phase === 'rest', null, { timeout: 10_000 });
    await expect(page.locator('#svg')).toContainText('蘋果果園完成！');
    await expect(page.locator('#examContinue')).toBeVisible();
    await expect(page.locator('#examBag .exBagN')).toHaveText('4', { timeout: 3_000 });
    expect((await page.evaluate(() => window.__T.exam)).bag).toBe(4);
    await clickEl(page, '#examContinue');
    // 下一區的開場，然後是第 5 題
    await expect(intro).toContainText('彩虹橋', { timeout: 5_000 });
    await waitQuestion(page, 4);
    await expect(page.locator('#crumb .station').nth(4).locator('.stMascot')).toHaveCount(1);
    await expect(page.locator('#crumb .station.done')).toHaveCount(4);
  });

  test('減少動態效果：期末考照樣能走完，收集物直接進背包', async ({ page }) => {
    await openExam(page, 'exam-final', { reducedMotion: true });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    await expect(page.locator('#svg')).toContainText('遊樂園探險', { timeout: 5_000 });
    const snaps = await answerAll(page, k => k % 4 !== 1);
    for (const s of snaps) expect(s.sub).toBe('收到！');
    await expect(page.locator('.exFly')).toHaveCount(0);
    await toSubmit(page);
    await clickEl(page, '#examSubmit');
    const result = page.locator('#examResult');
    await expect(result).toBeVisible({ timeout: 20_000 });
    await expect(result.locator('.exScore')).toHaveAttribute('data-score', String(15 * 5));
    await expect(page.locator('#examBag')).toHaveCount(0);
  });
});
