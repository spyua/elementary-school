// 離線安裝（PWA）與「下載教材」：對 npm run preview 的正式建置執行。
// 每個測試都是新的瀏覽器環境，所以都要先造訪首頁、等 service worker 接管頁面。
import { test, expect } from '@playwright/test';
import { prepare, recordScene, clickEl } from './helpers/harness.js';

const CURVE = '/#/g1/math/a/curve';
const ENGLISH = '/#/g1/english/demo/words';
const WORDS = ['apple', 'banana', 'cat', 'dog', 'fish', 'bird', 'egg', 'sun'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 造訪首頁，等 service worker 啟用並接管這個頁面（之後的請求才會經過快取）。 */
async function installServiceWorker(page) {
  await page.goto('/#/');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);
}

/** 用真的計時器輪詢；假時鐘下另外推進頁面時間。 */
async function until(page, fn, label, { clock = false, tries = 400 } = {}) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn)) return;
    if (clock) await page.clock.runFor(50);
    await sleep(50);
  }
  throw new Error(`等不到：${label}`);
}

const startShown = () => {
  const ov = document.querySelector('#startOv');
  return !!ov && !ov.classList.contains('hidden');
};

/** 換掉 speechSynthesis 與 Audio：speak() 很快就觸發 onend。 */
async function fakeSpeech(page) {
  await page.addInitScript(() => {
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ''; this.voice = null; }
    };
    const fake = {
      getVoices: () => [{ lang: 'zh-TW', name: 'Fake 中文' }, { lang: 'en-US', name: 'Fake English' }],
      speak(u) { setTimeout(() => u.onend && u.onend(), 10); },
      cancel() {},
      resume() {},
      onvoiceschanged: null,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    window.Audio = class { play() { return Promise.resolve(); } pause() {} };
  });
}

test('打開過的單元離線後重新整理，第一個場景仍能播放', async ({ page, context }) => {
  test.setTimeout(240_000);
  await installServiceWorker(page);
  // 固定亂數與假時鐘從下一次載入頁面開始生效。
  await prepare(page);

  const playFirstScene = async () => {
    await page.goto(CURVE);
    await page.reload();
    await page.clock.runFor(500);
    await until(page, startShown, '#startOv 出現', { clock: true });
    await clickEl(page, '#startBtn');
    const lines = await recordScene(page);
    expect(lines.length).toBeGreaterThan(0);
    await expect(page.locator('#stTxt')).toContainText('1.');
  };

  await playFirstScene();
  await context.setOffline(true);
  await playFirstScene();
});

test('下載「一年級 數學」後離線：教材圖（emoji/）與引擎共用圖（ui/）都從快取讀得到', async ({ page, context }) => {
  test.setTimeout(180_000);
  await installServiceWorker(page);
  await page.reload();
  const box = page.locator('#offlineBox');
  await box.getByLabel('一年級 數學').check();
  await box.locator('button', { hasText: '下載' }).click();
  await expect(box.locator('.offline-status')).toContainText('✅ 可以離線使用了', { timeout: 60_000 });

  await context.setOffline(true);
  // ui/ 由 Workbox 預先快取；emoji/ 由「下載教材」逐一抓取後存進 emoji 快取。
  const result = await page.evaluate(async paths => Promise.all(paths.map(async p => {
    const res = await fetch(p);
    const text = await res.text();
    return { p, ok: res.ok, svg: text.includes('<svg') };
  })), ['/emoji/rabbit-face.svg', '/emoji/castle.svg', '/ui/mascot.svg', '/ui/trophy.svg']);
  for (const r of result) expect(r, r.p).toEqual({ p: r.p, ok: true, svg: true });
});

test('離線、沒下載過的單元顯示提示；下載「一年級 英文」後離線也能用', async ({ page, context }) => {
  test.setTimeout(180_000);
  await fakeSpeech(page);
  await installServiceWorker(page);

  // 離線打開沒造訪過的英文單元：顯示提示與回首頁按鈕，不是空白頁。
  await context.setOffline(true);
  await page.goto(ENGLISH);
  const notice = page.locator('#notDownloaded');
  await expect(notice).toContainText('這個單元還沒下載');
  await notice.locator('a, button', { hasText: '回首頁' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('a.grade-card', { hasText: '一年級' })).toBeVisible();

  // 恢復連線，在首頁勾選「一年級 英文」並下載。
  await context.setOffline(false);
  await page.goto('/#/');
  await page.reload();
  const box = page.locator('#offlineBox');
  await expect(box).toContainText('📥 下載教材，離線使用');
  await box.getByLabel('一年級 英文').check();
  await box.locator('button', { hasText: '下載' }).click();
  await expect(box.locator('.offline-status')).toContainText('✅ 可以離線使用了', { timeout: 30_000 });

  // 切換成離線，重新整理後打開英文單元：場景播得完、8 張 emoji 都載入。
  await context.setOffline(true);
  await page.addInitScript(() => {
    window.__hrefs = new Set();
    new MutationObserver(() => {
      document.querySelectorAll('#svg image').forEach(img => window.__hrefs.add(img.getAttribute('href')));
    }).observe(document, { subtree: true, childList: true });
  });
  await page.goto(ENGLISH);
  await page.reload();
  await expect(page.locator('#startBtn')).toBeVisible();
  await page.evaluate(() => document.querySelector('#startBtn').click());
  await until(page, () => document.querySelector('#next').classList.contains('pulse'), '場景 1 播完');
  await page.evaluate(() => document.querySelector('#next').click());
  await until(page, () => [...document.querySelectorAll('#bar button')]
    .some(b => b.textContent.trim().startsWith('✏️ 開始練習')), '場景 2 播完');

  const hrefs = await page.evaluate(() => [...window.__hrefs].sort());
  expect(hrefs.map(h => h.replace(/^.*\//, '').replace(/\.svg$/, ''))).toEqual([...WORDS].sort());
  const widths = await page.evaluate(hrefs => Promise.all(hrefs.map(src => new Promise(res => {
    const img = new Image();
    img.onload = () => res(img.naturalWidth);
    img.onerror = () => res(0);
    img.src = src;
  }))), hrefs);
  expect(widths.every(w => w > 0), JSON.stringify(widths)).toBe(true);

  // 離線時字型取不到也不影響版面：#bar 的按鈕在畫面內，而且可以點。
  const start = page.locator('#bar button', { hasText: '開始練習' });
  await expect(start).toBeInViewport();
  await start.click({ force: true });
  await until(page, () => !!(window.__T && window.__T.state && window.__T.state.type), '第一題出現');
});
