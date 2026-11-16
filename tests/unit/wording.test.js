// 介面不提「考卷」，也不放個人化標籤（設計文件 5.11、5.10）。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findPack } from '../../src/content/catalog.js';

function walk(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('src/ 與 index.html 不出現「考卷」字樣', () => {
  const files = [...walk('src'), 'index.html'];
  const hits = files.filter(f => readFileSync(f, 'utf8').includes('考卷'));
  expect(hits).toEqual([]);
});

test('g1a-math 的首頁說明與「給爸媽」作答小提醒', () => {
  const p = findPack(1, 'math', 'a');
  expect(p.intro).toContain('依 108 課綱一年級上學期的主題排列，共 9 章 12 個單元。各版本課本的對照請看「給爸媽」。');
  expect(p.intro).not.toContain('翰林');
  expect(p.parentGuide.reminders.title).toBe('📝 作答小提醒');
  expect(p.parentGuide.reminders.items.length).toBeGreaterThan(0);
  expect(p.parentGuide.principles.length).toBe(3);
});

test('總複習與單元文字已改寫', () => {
  const p = findPack(1, 'math', 'a');
  expect(p.reviews.find(r => r.key === 'review-length').desc).toBe('10 題挑戰題');
  expect(p.units.find(u => u.key === 'curve').task).toContain('沿著紙上畫的彎線擺好');
  for (const u of p.units) expect(u).not.toHaveProperty('weak');
});
