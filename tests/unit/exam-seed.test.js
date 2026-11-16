// 種子重建：考試的錯題重看靠「同一個種子重新出題＋畫圖」還原畫面。
// 這裡檢查兩份藍圖用到的每個題型，同一個種子建兩次，題目、答案、畫面都完全相同。
import { DOM } from './helpers/lesson-dom.js';

let GEN, withSeed, clear, svg, MID_BLUEPRINT, FINAL_BLUEPRINT, EXAM_TYPES, validateBlueprint;

beforeAll(async () => {
  document.body.innerHTML = DOM;
  ({ GEN } = await import('../../src/engine/practice.js'));
  ({ withSeed } = await import('../../src/engine/rng.js'));
  ({ clear, svg } = await import('../../src/engine/svg.js'));
  ({ validateBlueprint } = await import('../../src/engine/paper.js'));
  await import('../../src/content/math/g1a/index.js');
  ({ MID_BLUEPRINT, FINAL_BLUEPRINT, EXAM_TYPES } = await import('../../src/content/math/g1a/exam.js'));
});

function build(type, seed) {
  clear();
  return withSeed(seed, () => {
    const item = GEN[type]();
    item.draw();
    return { prompt: item.prompt, answer: JSON.stringify(item.answer), html: svg.innerHTML };
  });
}

test('兩份藍圖的題型都登記過', () => {
  expect(() => validateBlueprint(MID_BLUEPRINT, GEN)).not.toThrow();
  expect(() => validateBlueprint(FINAL_BLUEPRINT, GEN)).not.toThrow();
});

test('同一個種子建兩次，prompt、answer、#svg 內容都相同', () => {
  const types = [...new Set([MID_BLUEPRINT, FINAL_BLUEPRINT].flatMap(bp => bp.zones.flatMap(z => z.slots.flat())))];
  expect(types.length).toBeGreaterThan(40);
  // 14 個考試專用題型都在藍圖裡，所以也都會被這個測試檢查到
  for (const k of Object.keys(EXAM_TYPES)) expect(types, k).toContain(k);
  for (const type of types) {
    for (const seed of [1, 42, 123456789, 4294967295]) {
      const a = build(type, seed);
      // 中間故意先建一題別的，確認題型沒有依賴「上一題」的模組狀態
      build(types[(types.indexOf(type) + 1) % types.length], seed + 7);
      const b = build(type, seed);
      expect(b, `${type} seed=${seed}`).toEqual(a);
    }
  }
});
