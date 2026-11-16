// 英文示範單元：只用範本做成，驗證英文語音、三種範本題型與星數紀錄。
import { test, expect } from '@playwright/test';

const UNIT = '/#/g1/english/demo/words';
const WORDS = ['apple', 'banana', 'cat', 'dog', 'fish', 'bird', 'egg', 'sun'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 換掉 speechSynthesis 與 Audio：speak() 很快就觸發 onend，並記錄朗讀的文字與語言。 */
async function fakeSpeech(page) {
  await page.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ''; this.voice = null; }
    };
    const fake = {
      getVoices: () => [{ lang: 'zh-TW', name: 'Fake 中文' }, { lang: 'en-US', name: 'Fake English' }],
      speak(u) {
        window.__spoken.push({ text: u.text, lang: u.lang });
        setTimeout(() => u.onend && u.onend(), 10);
      },
      cancel() {},
      resume() {},
      onvoiceschanged: null,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    window.Audio = class { play() { return Promise.resolve(); } pause() {} };
  });
}

async function until(page, fn, label, { tries = 400, arg } = {}) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return;
    await sleep(50);
  }
  throw new Error(`等不到：${label}`);
}

// #startBtn、閃爍的按鈕一直有動畫，Playwright 的「元素穩定」檢查會等不完，改用 DOM click()。
const domClick = (page, selector) => page.evaluate(s => document.querySelector(s).click(), selector);

/** 從單元網址開始，按「開始」並把兩個講解場景播完，停在「✏️ 開始練習」。 */
async function playScenes(page) {
  await page.goto(UNIT);
  await expect(page.locator('#startBtn')).toBeVisible();
  await domClick(page, '#startBtn');
  await until(page, () => document.querySelector('#next').classList.contains('pulse'), '場景 1 播完');
  await expect(page.locator('#stTxt')).toContainText('1.');
  await domClick(page, '#next');
  await until(page, () => [...document.querySelectorAll('#bar button')]
    .some(b => b.textContent.trim().startsWith('✏️ 開始練習')), '場景 2 播完');
  await expect(page.locator('#stTxt')).toContainText('2.');
}

test('一年級的英文卡片顯示「試玩」，點進去可以打開單字單元', async ({ page }) => {
  await page.goto('/#/g1');
  const card = page.locator('a.subject-card', { hasText: '英文' });
  await expect(card).toContainText('試玩');
  await card.click();
  await expect(page).toHaveURL(/#\/g1\/english\/demo$/);
  await page.locator('a.unit', { hasText: '認識英文單字' }).click();
  await expect(page).toHaveURL(/#\/g1\/english\/demo\/words$/);
  await expect(page.locator('#lesson')).toBeVisible();
});

test('兩個講解場景都能播完，apple 用 en-US 朗讀', async ({ page }) => {
  await fakeSpeech(page);
  await playScenes(page);
  const spoken = await page.evaluate(() => window.__spoken.filter(s => s.text));
  expect(spoken).toContainEqual({ text: 'apple', lang: 'en-US' });
  // 先用中文說「這是」，再用英文唸單字；8 個單字都唸過。
  expect(spoken.some(s => s.lang === 'zh-TW' && s.text.includes('這是'))).toBe(true);
  for (const w of WORDS) expect(spoken, w).toContainEqual({ text: w, lang: 'en-US' });
});

test('練習 6 題全部答對後，學期畫面顯示 ⭐⭐⭐', async ({ page }) => {
  test.setTimeout(120_000);
  await fakeSpeech(page);
  await playScenes(page);
  await page.evaluate(() => [...document.querySelectorAll('#bar button')]
    .find(b => b.textContent.trim().startsWith('✏️ 開始練習')).click());
  const types = new Set();
  for (let i = 0; i < 6; i++) {
    await until(page, i => {
      const st = window.__T.state;
      return st.P && st.P.i === i && st.type && !st.done;
    }, `第 ${i + 1} 題出現`, { arg: i });
    types.add(await page.evaluate(() => window.__T.state.type));
    await page.evaluate(() => window.__T.answer(true));
    await until(page, () => !!document.querySelector('#nextQ'), `第 ${i + 1} 題講解完`);
    await domClick(page, '#nextQ');
  }
  expect([...types].sort()).toEqual(['enChoice', 'enListen', 'enMatch']);
  await expect(page.locator('#stTxt')).toContainText('練習結果');
  await expect(page.locator('#svg')).toContainText('答對 6 / 6 題');
  await page.goto('/#/g1/english/demo');
  await expect(page.locator('a.unit', { hasText: '認識英文單字' }).locator('.st')).toHaveText('⭐⭐⭐');
});

test('講解場景畫出的 8 張 emoji 圖片都成功載入', async ({ page }) => {
  await fakeSpeech(page);
  // 記下場景播放期間畫到 #svg 上的所有 <image> 網址（場景換頁會清空畫布，所以要邊播邊記）。
  await page.addInitScript(() => {
    window.__hrefs = new Set();
    new MutationObserver(() => {
      document.querySelectorAll('#svg image').forEach(img => window.__hrefs.add(img.getAttribute('href')));
    }).observe(document, { subtree: true, childList: true });
  });
  await playScenes(page);
  const hrefs = await page.evaluate(() => [...window.__hrefs].sort());
  expect(hrefs.map(h => h.replace(/^.*\//, '').replace(/\.svg$/, ''))).toEqual([...WORDS].sort());
  // <image> 沒有 naturalWidth，用同一個網址建立 Image 來檢查。
  const widths = await page.evaluate(hrefs => Promise.all(hrefs.map(src => new Promise(res => {
    const img = new Image();
    img.onload = () => res(img.naturalWidth);
    img.onerror = () => res(0);
    img.src = src;
  }))), hrefs);
  expect(widths.every(w => w > 0), JSON.stringify(widths)).toBe(true);
});
