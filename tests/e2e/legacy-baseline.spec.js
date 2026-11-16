// 從舊版單檔 private/legacy-index.html 錄製「對照基準」（golden）。
// 每個單元記錄各場景的字幕序列與練習流程的字幕，寫進 private/golden/<key>.json。
// private/ 不進 Git，CI 上沒有舊檔，所以只在設定 LEGACY=1 時執行。
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepare, recordScene, recordPractice, clickEl } from './helpers/harness.js';

const LEGACY = resolve('private/legacy-index.html');
const GOLDEN_DIR = resolve('private/golden');

// 舊檔的單元清單，與舊檔 CHAPTERS 一致。執行時會再和頁面上的 CHAPTERS 比對，避免漏錄。
const UNIT_KEYS = ['num10', 'line', 'curve', 'thick', 'align', 'order', 'split', 'shape', 'add', 'sub', 'num30', 'time'];
const REVIEW_KEYS = ['review', 'all'];

test.describe('legacy baseline', () => {
  test.skip(!process.env.LEGACY || !existsSync(LEGACY), '只在 LEGACY=1 且有 private/legacy-index.html 時錄製舊檔基準');
  test.describe.configure({ timeout: 600_000 });

  async function open(page) {
    await prepare(page, { seed: 42 });
    await page.goto(pathToFileURL(LEGACY).href);
    await page.clock.runFor(500);
  }

  function save(key, data) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
    writeFileSync(resolve(GOLDEN_DIR, `${key}.json`), JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  test('單元清單與舊檔 CHAPTERS 一致', async ({ page }) => {
    await open(page);
    // CHAPTERS 是舊檔頂層的 const，不在 window 上，但在頁面全域範圍內可以直接讀取。
    const chapters = await page.evaluate('CHAPTERS.map(c => ({ units: c.units, review: c.review && c.review.key }))');
    expect(chapters.flatMap(c => c.units)).toEqual(UNIT_KEYS);
    expect(chapters.map(c => c.review).filter(Boolean)).toEqual(REVIEW_KEYS);
  });

  for (const key of UNIT_KEYS) {
    test(`unit ${key}`, async ({ page }) => {
      await open(page);
      const info = await page.evaluate(`(() => { const u = UNITS.find(u => u.key === ${JSON.stringify(key)}); return { name: u.name, scenes: u.scenes.length }; })()`);
      // 點名稱相符的 .unit 卡片（名稱後面可能接著標籤，所以比對開頭）。
      await clickEl(page, `.unit:not(.review)`, { textStartsWith: info.name, inner: '.nm' });
      await clickEl(page, '#startBtn');
      const scenes = [];
      for (let i = 0; i < info.scenes; i++) {
        if (i > 0) await clickEl(page, '#next');
        scenes.push(await recordScene(page));
      }
      await clickEl(page, '#bar button', { textStartsWith: '✏️ 開始練習' });
      const practice = await recordPractice(page);
      for (const s of scenes) expect(s.length).toBeGreaterThan(0);
      expect(practice.length).toBeGreaterThan(0);
      save(key, { scenes, practice });
    });
  }

  for (const key of REVIEW_KEYS) {
    test(`review ${key}`, async ({ page }) => {
      await open(page);
      const title = await page.evaluate(`CHAPTERS.find(c => c.review && c.review.key === ${JSON.stringify(key)}).review.title`);
      await clickEl(page, '.unit.review', { textStartsWith: title, inner: '.nm' });
      await clickEl(page, '#startBtn');
      const practice = await recordPractice(page);
      expect(practice.length).toBeGreaterThan(0);
      save(key, { scenes: [], practice });
    });
  }
});
