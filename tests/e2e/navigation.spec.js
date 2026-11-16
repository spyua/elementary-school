// 導覽、孩子檔案、匯出匯入，以及離開單元時停止動畫（Review Focus 第 2、3、5 項）。
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { prepare, recordScene, recordPractice, clickEl } from './helpers/harness.js';

const SEMESTER = '/#/g1/math/a';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 依 { 單元 ID: 星數 } 建立一份存檔內容。 */
function seededState(stars) {
  const progress = Object.fromEntries(Object.entries(stars)
    .map(([id, n]) => [id, { stars: n, visitedAt: '2026-11-16T00:00:00.000Z' }]));
  return {
    version: 1,
    activeProfile: 'p1',
    profiles: { p1: { name: '小朋友', icon: '🐣', lastUnit: null, progress } },
    settings: { muted: false, sfxMuted: false },
  };
}

/** 寫入存檔後重新載入頁面。 */
async function seed(page, stars) {
  await page.goto('/#/');
  await page.evaluate(s => localStorage.setItem('esp:v1', JSON.stringify(s)), seededState(stars));
  await page.reload();
}

const unitStars = (page, name) =>
  page.locator('a.unit', { has: page.locator('.nm', { hasText: name }) }).locator('.st');

// 假時鐘下用真的計時器等待某個條件成立（waitForFunction 的輪詢會被假時鐘停住）。
async function until(page, fn, label) {
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(fn)) return;
    await page.clock.runFor(50);
    await sleep(50);
  }
  throw new Error(`等不到：${label}`);
}

const startShown = () => {
  const ov = document.querySelector('#startOv');
  return !!ov && !ov.classList.contains('hidden');
};

test('首頁 → 一年級 → 數學 → 曲線比長短', async ({ page }) => {
  await page.goto('/#/');
  await page.locator('a.grade-card', { hasText: '一年級' }).click();
  await expect(page).toHaveURL(/#\/g1$/);
  await page.locator('a.subject-card', { hasText: '數學' }).click();
  await expect(page).toHaveURL(/#\/g1\/math\/a$/);
  await page.locator('a.unit', { hasText: '曲線比長短' }).click();
  await expect(page).toHaveURL(/#\/g1\/math\/a\/curve$/);
  await expect(page.locator('#lesson')).toBeVisible();
});

test('沒有內容的年級與科目顯示「準備中」且不能點', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('a.grade-card')).toHaveCount(1);
  await expect(page.locator('.grade-card.soon')).toHaveCount(5);
  await expect(page.locator('.grade-card.soon').first()).toContainText('準備中');
  await page.goto('/#/g1');
  await expect(page.locator('.subject-card.soon', { hasText: '自然' })).toContainText('準備中');
});

test('學期畫面依期中、期末分組，組尾有考試卡；點期中考卡進入考試', async ({ page }) => {
  await page.goto(SEMESTER);
  const terms = page.locator('.grid h3.term');
  await expect(terms).toHaveCount(2);
  await expect(terms.nth(0)).toHaveText('📝 期中考範圍・第一～五章');
  await expect(terms.nth(1)).toHaveText('📝 期末考範圍・第六～九章');
  const exams = page.locator('a.unit.exam');
  await expect(exams).toHaveCount(2);
  await expect(exams.nth(0)).toContainText('期中考');
  await expect(exams.nth(1)).toContainText('期末考');
  // 順序：期中考卡在「認識形狀」之後、期末考標題之前；期末考卡在最後（全冊總複習之後）
  const order = await page.evaluate(() => [...document.querySelectorAll('.grid > *')].map(e =>
    e.classList.contains('term') ? 'T:' + e.dataset.term : e.classList.contains('exam') ? 'X:' + e.querySelector('.nm').textContent
      : e.classList.contains('unit') ? 'U:' + e.querySelector('.nm').textContent : 'C'));
  const at = k => order.indexOf(k);
  expect(at('T:mid')).toBe(0);
  expect(at('U:認識形狀')).toBeLessThan(at('X:期中考'));
  expect(at('X:期中考')).toBeLessThan(at('T:final'));
  expect(at('T:final')).toBeLessThan(at('U:10以內的加法'));
  expect(at('U:全冊總複習')).toBeLessThan(at('X:期末考'));
  expect(order[order.length - 1]).toBe('X:期末考');
  // 給爸媽區有考試說明
  await expect(page.locator('details.parent')).toContainText('作答時不會顯示對錯');
  await exams.nth(0).click();
  await expect(page).toHaveURL(/#\/g1\/math\/a\/exam-mid$/);
  await expect(page.locator('#startOv')).toBeVisible();
  await expect(page.locator('#stTxt')).toContainText('期中考');
});

test('英文試玩的學期畫面沒有期中、期末分組', async ({ page }) => {
  await page.goto('/#/g1/english/demo');
  await expect(page.locator('a.unit', { hasText: '認識英文單字' })).toBeVisible();
  await expect(page.locator('h3.term')).toHaveCount(0);
  await expect(page.locator('a.unit.exam')).toHaveCount(0);
});

test('學期畫面的「給爸媽」區有每個單元的提示與課綱代碼', async ({ page }) => {
  await page.goto(SEMESTER);
  const parent = page.locator('details.parent');
  await expect(parent).toContainText('陪讀三原則');
  await expect(parent).toContainText('📝 作答小提醒');
  await expect(parent).toContainText('彎彎的線，要怎麼知道它有多長？');
  await expect(parent).toContainText('N-1-5');
  await expect(parent).toContainText('二、比長短');
  // 課綱代碼不出現在孩子看的單元卡上。
  await expect(page.locator('.grid')).not.toContainText('N-1-');
});

test('完成練習後顯示三顆星，「繼續學習」指向下一個未滿星的單元', async ({ page }) => {
  test.setTimeout(600_000);
  await prepare(page, { seed: 42 });
  await page.goto('/#/g1/math/a/curve');
  await page.clock.runFor(500);
  await until(page, startShown, '#startOv 出現');
  await clickEl(page, '#startBtn');
  for (let i = 0; i < 20; i++) {
    await recordScene(page);
    const atEnd = await page.evaluate(() =>
      [...document.querySelectorAll('#bar button')].some(b => b.textContent.trim().startsWith('✏️ 開始練習')));
    if (atEnd) break;
    await clickEl(page, '#next');
  }
  await clickEl(page, '#bar button', { textStartsWith: '✏️ 開始練習' });
  await recordPractice(page, { pattern: [true] });
  await clickEl(page, '#bar button', { textStartsWith: '🏠 回首頁' });
  await until(page, () => location.hash === '#/g1/math/a' && !!document.querySelector('a.unit'), '回到學期畫面');
  expect(await unitStars(page, '曲線比長短').textContent()).toBe('⭐⭐⭐');

  await page.evaluate(() => { location.hash = '#/'; });
  await until(page, () => !!document.querySelector('#continue'), '首頁');
  await expect(page.locator('#continue')).toContainText('厚和薄');
  await expect(page.locator('#continue')).toHaveAttribute('href', '#/g1/math/a/thick');
});

test('不同孩子的星星分開', async ({ page }) => {
  await seed(page, { 'G1A-M-curve': 3 });
  await page.locator('#profileBtn').click();
  await expect(page).toHaveURL(/#\/profiles$/);
  await page.locator('#newName').fill('小明');
  await page.locator('.icon-pick button').nth(2).click();
  await page.locator('#addProfile').click();
  await page.locator('.profile', { hasText: '小明' }).getByRole('button', { name: '切換' }).click();

  await page.goto(SEMESTER);
  const all = await page.locator('a.unit .st').allTextContents();
  expect(all.length).toBeGreaterThan(0);
  expect(all.every(s => s === '☆☆☆')).toBe(true);

  await page.goto('/#/profiles');
  await page.locator('.profile', { hasText: '小朋友' }).getByRole('button', { name: '切換' }).click();
  await page.goto(SEMESTER);
  await expect(unitStars(page, '曲線比長短')).toHaveText('⭐⭐⭐');
});

test('刪除孩子要先在對話框確認', async ({ page }) => {
  await seed(page, {});
  await page.goto('/#/profiles');
  await page.locator('#newName').fill('小華');
  await page.locator('#addProfile').click();
  const row = page.locator('.profile', { hasText: '小華' });
  await row.getByRole('button', { name: '刪除' }).click();
  await expect(page.locator('dialog#confirmDelete')).toBeVisible();
  await page.locator('dialog#confirmDelete').getByRole('button', { name: '取消' }).click();
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: '刪除' }).click();
  await page.locator('dialog#confirmDelete').getByRole('button', { name: '確定刪除' }).click();
  await expect(row).toHaveCount(0);
  // 只剩一個時不能刪除。
  await expect(page.locator('.profile').getByRole('button', { name: '刪除' })).toBeDisabled();
});

test('匯出後清空，再匯入同一個檔案，星星恢復', async ({ page }) => {
  await seed(page, { 'G1A-M-curve': 3, 'G1A-M-num10': 2 });
  await page.goto('/#/profiles');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportBtn').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^elementary-school-progress-\d{4}-\d{2}-\d{2}\.json$/);
  const file = await download.path();
  expect(JSON.parse(readFileSync(file, 'utf8')).app).toBe('elementary-school');

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.goto(SEMESTER);
  await expect(unitStars(page, '曲線比長短')).toHaveText('☆☆☆');

  await page.goto('/#/profiles');
  await page.locator('#importFile').setInputFiles(file);
  await expect(page.locator('#importMsg')).toContainText('已匯入');
  await page.goto(SEMESTER);
  await expect(unitStars(page, '曲線比長短')).toHaveText('⭐⭐⭐');
  await expect(unitStars(page, '10以內的數')).toHaveText('⭐⭐☆');
});

test('匯入錯誤的檔案：顯示「這不是進度檔」，星星不變', async ({ page }) => {
  await seed(page, { 'G1A-M-curve': 3 });
  await page.goto('/#/profiles');
  await page.locator('#importFile').setInputFiles({
    name: 'hello.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}'),
  });
  await expect(page.locator('#importMsg')).toContainText('這不是進度檔，原本的進度沒有改變。');
  await page.goto(SEMESTER);
  await expect(unitStars(page, '曲線比長短')).toHaveText('⭐⭐⭐');
});

test('動畫播到一半按上一頁：畫布清空、單元隱藏、字幕不再變化', async ({ page }) => {
  await prepare(page, { seed: 42 });
  await page.goto('/#/');
  await page.clock.runFor(200);
  await page.evaluate(() => { location.hash = '#/g1/math/a/curve'; });
  await until(page, startShown, '#startOv 出現');
  await clickEl(page, '#startBtn');
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => document.querySelector('#svg').childElementCount)).toBeGreaterThan(0);

  await page.evaluate(() => history.back());
  await until(page, () => location.hash === '#/' || location.hash === '', '回到首頁網址');
  await until(page, () => document.querySelector('#lesson').classList.contains('hidden'), '#lesson 隱藏');
  expect(await page.evaluate(() => document.querySelector('#svg').childElementCount)).toBe(0);
  const before = await page.locator('#sub').textContent();
  await page.clock.runFor(5000);
  expect(await page.locator('#sub').textContent()).toBe(before);
  expect(await page.evaluate(() => document.querySelector('#svg').childElementCount)).toBe(0);
});

test('不存在的年級回到首頁', async ({ page }) => {
  await page.goto('/#/g9/math/a');
  await expect(page.locator('#continue')).toBeVisible();
  await expect(page.locator('#lesson')).toBeHidden();
});

test('首頁底部有致謝連結，致謝頁依 credits.json 列出每一筆', async ({ page }) => {
  const credits = JSON.parse(readFileSync('src/content/credits.json', 'utf8'));
  await page.goto('/#/');
  await page.locator('#creditsLink').click();
  await expect(page).toHaveURL(/#\/credits$/);
  await expect(page.locator('.credits li')).toHaveCount(credits.length);
  for (const c of credits) {
    await expect(page.locator('.credits a', { hasText: c.name })).toHaveAttribute('href', c.url);
  }
  // 頁首的回首頁按鈕是 Tabler 圖示，不是 emoji。
  await expect(page.locator('#homeBtn svg')).toHaveCount(1);
});
