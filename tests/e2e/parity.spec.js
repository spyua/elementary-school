// 對照測試：新站每個單元的字幕序列，必須和舊檔錄下的基準（private/golden/）一致。
// 基準只在本機有（private/ 不進 Git），沒有基準時整組略過。
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { prepare, recordScene, recordPractice, clickEl, normalize } from './helpers/harness.js';

const GOLDEN_DIR = 'private/golden';

const UNIT_KEYS = ['num10', 'line', 'curve', 'thick', 'align', 'order', 'split', 'shape', 'add', 'sub', 'num30', 'time'];
// 新網址的總複習 key → 舊檔基準檔名。
const REVIEWS = { 'review-length': 'review', 'review-all': 'all' };

const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadGolden(name) {
  return JSON.parse(readFileSync(`${GOLDEN_DIR}/${name}.json`, 'utf8'));
}

// 學期包是延遲載入的，要等它載完、開始畫面出現才能點「開始」。
// 假時鐘下 waitForFunction 的輪詢會停住，所以在 Node 端用真的計時器等。
async function waitStartOverlay(page) {
  for (let i = 0; i < 200; i++) {
    const ready = await page.evaluate(() => {
      const ov = document.querySelector('#startOv');
      return !!ov && !ov.classList.contains('hidden');
    });
    if (ready) return;
    await page.clock.runFor(50);
    await sleep(50);
  }
  throw new Error('等不到 #startOv 出現');
}

async function open(page, key) {
  await prepare(page, { seed: 42 });
  await page.goto(`/#/g1/math/a/${key}`);
  await page.clock.runFor(500);
  await waitStartOverlay(page);
}

test.describe('parity with legacy', () => {
  test.skip(!existsSync(GOLDEN_DIR), '沒有 private/golden/ 對照基準');
  test.describe.configure({ timeout: 600_000 });

  for (const key of UNIT_KEYS) {
    test(`unit ${key}`, async ({ page }) => {
      const golden = loadGolden(key);
      await open(page, key);
      await clickEl(page, '#startBtn');
      const scenes = [];
      for (let i = 0; i < golden.scenes.length; i++) {
        if (i > 0) await clickEl(page, '#next');
        scenes.push(await recordScene(page));
      }
      await clickEl(page, '#bar button', { textStartsWith: '✏️ 開始練習' });
      const practice = await recordPractice(page);
      const actual = { scenes, practice };
      expect(actual.scenes).toEqual(golden.scenes.map(normalize));
      expect(actual.practice).toEqual(normalize(golden.practice));
    });
  }

  for (const [key, legacyKey] of Object.entries(REVIEWS)) {
    test(`review ${key}`, async ({ page }) => {
      const golden = loadGolden(legacyKey);
      await open(page, key);
      await clickEl(page, '#startBtn');
      const practice = await recordPractice(page);
      expect(practice).toEqual(normalize(golden.practice));
    });
  }
});
