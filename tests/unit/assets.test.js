// 圖片素材：對照表列到的檔案都要真的存在、g1a 學期包的 assets 要涵蓋它們、
// credits.json 要登記檔名、總大小不能失控。
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { EMOJI_FILE, EXAM_THEME_FILES, UI_FILES, packEmojiAssets } from '../../src/engine/emoji-map.js';
import { PACKS } from '../../src/content/catalog.js';

const emojiNames = [...new Set([...Object.values(EMOJI_FILE), ...EXAM_THEME_FILES])];

test('EMOJI_FILE、EXAM_THEME_FILES 的每個檔名在 public/emoji/ 都有檔案', () => {
  const missing = emojiNames.filter(n => !existsSync(join('public/emoji', `${n}.svg`)));
  expect(missing).toEqual([]);
});

test('UI_FILES 的每個檔名在 public/ui/ 都有檔案', () => {
  const missing = UI_FILES.filter(n => !existsSync(join('public/ui', `${n}.svg`)));
  expect(missing).toEqual([]);
});

test('EMOJI_FILE 的鍵不含變體選擇符（U+FE0F），查表時才比對得到', () => {
  expect(Object.keys(EMOJI_FILE).filter(k => k.includes('️'))).toEqual([]);
});

test('packEmojiAssets() 已去重，而且 g1a 的 assets 涵蓋所有對照圖與考試主題圖', () => {
  const list = packEmojiAssets();
  expect(new Set(list).size).toBe(list.length);
  const g1a = PACKS.find(p => p.id === 'g1a-math');
  for (const n of emojiNames) expect(g1a.assets, n).toContain(`emoji/${n}.svg`);
});

test('public/emoji 加 public/ui 總大小小於 1 MB', () => {
  let total = 0;
  for (const dir of ['public/emoji', 'public/ui']) {
    for (const f of readdirSync(dir)) total += statSync(join(dir, f)).size;
  }
  expect(total).toBeLessThan(1024 * 1024);
});

test('credits.json 的 Fluent Emoji usage 登記了每個圖檔名', () => {
  const credits = JSON.parse(readFileSync('src/content/credits.json', 'utf8'));
  const usage = credits.find(c => /Fluent Emoji/.test(c.name)).usage;
  const missing = [...emojiNames, ...UI_FILES].filter(n => !new RegExp(`(^|[\\s、：（])${n} ←`).test(usage));
  expect(missing).toEqual([]);
});
