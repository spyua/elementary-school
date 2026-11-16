// 多語語音、音效與分開的靜音開關（Review Focus 第 4 項：裝置沒有該語言的語音時流程不卡住）。
import { test, expect } from '@playwright/test';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * 換掉 speechSynthesis、SpeechSynthesisUtterance 與 Audio，記錄呼叫內容。
 * - voices：getVoices() 回傳的清單。
 * - autoEnd：true 時 speak() 之後很快觸發 onend；false 時永遠不觸發（模擬沒有語音、默默丟掉的裝置）。
 */
async function fakeAudio(page, { voices, autoEnd = true }) {
  await page.addInitScript(({ voices, autoEnd }) => {
    window.__spoken = [];
    window.__plays = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) { this.text = text; this.lang = ''; this.voice = null; }
    };
    const fake = {
      getVoices: () => voices,
      speak(u) {
        window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice ? u.voice.lang : null });
        if (autoEnd) setTimeout(() => u.onend && u.onend(), 10);
      },
      cancel() {},
      resume() {},
      onvoiceschanged: null,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    window.Audio = class {
      constructor(src) { this.src = src; }
      play() { window.__plays.push(this.src); return Promise.resolve(); }
      pause() {}
    };
  }, { voices, autoEnd });
}

const ZH_ONLY = [{ lang: 'zh-TW', name: 'Fake 中文' }];

async function until(page, fn, label, arg) {
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(fn, arg)) return;
    await sleep(50);
  }
  throw new Error(`等不到：${label}`);
}

/** 打開全冊總複習，按「開始」，答對第一題，等到唸出答對的回饋。 */
async function answerFirstItem(page) {
  await page.goto('/#/g1/math/a/review-all');
  // #startBtn 一直有 pulse 動畫，Playwright 的「元素穩定」檢查會等不完，改用 DOM click()。
  await expect(page.locator('#startBtn')).toBeVisible();
  await page.evaluate(() => document.querySelector('#startBtn').click());
  await until(page, () => !!(window.__T && window.__T.state.type), '第一題出現');
  await page.evaluate(() => window.__T.answer(true));
  await until(page, () => window.__spoken.some(s => /答對了|太厲害了|完全正確/.test(s.text)), '答對的回饋語音');
}

test('英文用 en-US 朗讀，不套用中文符號替換；中文照舊替換', async ({ page }) => {
  await fakeAudio(page, { voices: ZH_ONLY });
  await page.goto('/#/');
  await until(page, () => !!window.__speech, '測試入口');
  await page.evaluate(async () => {
    await window.__speech.say('1 + 1 = 2 apple ✓', window.__speech.runId, { lang: 'en-US' });
    await window.__speech.say('1＋1＝2 ✓', window.__speech.runId);
  });
  const spoken = await page.evaluate(() => window.__spoken.filter(s => s.text));
  expect(spoken).toEqual([
    // 只有中文語音：英文不借用中文語音，只設定 u.lang。
    { text: '1 + 1 = 2 apple ✓', lang: 'en-US', voice: null },
    { text: '1加1等於2 勾', lang: 'zh-TW', voice: 'zh-TW' },
  ]);
});

test('沒有任何語音、speak 也沒有回應時，英文字幕依序播完不會卡住', async ({ page }) => {
  await fakeAudio(page, { voices: [], autoEnd: false });
  await page.clock.install();
  await page.goto('/#/');
  await until(page, () => !!window.__speech, '測試入口');
  const lines = ['Hello!', 'This is an apple.', 'Red apple, green apple.', 'Good job!'];
  await page.evaluate(lines => {
    window.__seen = [];
    window.__done = (async () => {
      const id = window.__speech.runId;
      for (const t of lines) {
        await window.__speech.say(t, id, { lang: 'en-US' });
        window.__seen.push(document.querySelector('#sub').textContent);
      }
      return 'ok';
    })().catch(e => String(e));
  }, lines);
  await page.clock.runFor(60000);
  expect(await page.evaluate(() => window.__done)).toBe('ok');
  expect(await page.evaluate(() => window.__seen)).toEqual(lines);
  expect(await page.evaluate(() => window.__spoken.filter(s => s.text).map(s => s.lang)))
    .toEqual(['en-US', 'en-US', 'en-US', 'en-US']);
});

test('音效開著：答對時播放 correct 音效', async ({ page }) => {
  await fakeAudio(page, { voices: ZH_ONLY });
  await answerFirstItem(page);
  expect(await page.evaluate(() => window.__plays)).toEqual([expect.stringMatching(/sfx\/correct\.mp3$/)]);
});

test('關掉 🎵 後答題：不播音效，但仍有朗讀', async ({ page }) => {
  await fakeAudio(page, { voices: ZH_ONLY });
  await page.goto('/#/');
  await expect(page.locator('#sfxBtn')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sfxBtn').click();
  await expect(page.locator('#sfxBtn')).toHaveAttribute('aria-pressed', 'false');
  await answerFirstItem(page);
  expect(await page.evaluate(() => window.__plays)).toEqual([]);
  expect(await page.evaluate(() => window.__spoken.filter(s => s.text).length)).toBeGreaterThan(1);
});

test('兩個開關存在 state.settings，重新整理後不變', async ({ page }) => {
  await fakeAudio(page, { voices: ZH_ONLY });
  await page.goto('/#/');
  await page.locator('#mute').click();
  await page.locator('#sfxBtn').click();
  await page.reload();
  await expect(page.locator('#mute')).toHaveText('🔇');
  await expect(page.locator('#sfxBtn')).toHaveAttribute('aria-pressed', 'false');
  const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('esp:v1')).settings);
  expect(settings).toEqual({ muted: true, sfxMuted: true });
  // 朗讀關著：字幕照常，但不呼叫 speak()。
  await until(page, () => !!window.__speech, '測試入口');
  await page.evaluate(() => window.__speech.say('靜音測試', window.__speech.runId));
  await expect(page.locator('#sub')).toHaveText('靜音測試');
  expect(await page.evaluate(() => window.__spoken.filter(s => s.text))).toEqual([]);
  // 打開回來也會保存。
  await page.locator('#mute').click();
  await page.locator('#sfxBtn').click();
  await page.reload();
  await expect(page.locator('#mute')).toHaveText('🔊');
  await expect(page.locator('#sfxBtn')).toHaveAttribute('aria-pressed', 'true');
});
