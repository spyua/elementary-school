// 期中考、期末考流程：作答時不透露對錯、交卷後分數正確、錯題卡可以重看正解與講解。
// 用真的時鐘；拿掉語音合成（字幕照常顯示），音效換成空的 Audio。
import { test, expect } from '@playwright/test';
import { clickEl } from './helpers/harness.js';

const GREEN = '#2bb673';

async function openExam(page, key) {
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

async function waitQuestion(page, k) {
  await page.waitForFunction(k => {
    const T = window.__T;
    return T && T.exam && T.exam.phase === 'question' && T.state.P && T.state.P.i === k && !T.state.done;
  }, k, { timeout: 15_000 });
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
    await page.waitForFunction(() => window.__T.exam.phase === 'submit', null, { timeout: 15_000 });
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
    await page.waitForFunction(() => window.__T.exam.phase === 'submit', null, { timeout: 15_000 });
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
});
