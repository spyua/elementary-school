// 出卷：藍圖檢查與 buildPaper。
import { validateBlueprint, buildPaper } from '../../src/engine/paper.js';
import { mulberry32 } from '../../src/engine/rng.js';
import { MID_BLUEPRINT, FINAL_BLUEPRINT } from '../../src/content/math/g1a/exam.js';

const BPS = { mid: MID_BLUEPRINT, final: FINAL_BLUEPRINT };

for (const [name, bp] of Object.entries(BPS)) {
  describe(`${name} 藍圖`, () => {
    test('藍圖本身合法', () => {
      expect(() => validateBlueprint(bp)).not.toThrow();
    });

    test('一定 20 題；每區題數等於 slot 數；題型都來自該區的 slot', () => {
      for (let s = 1; s <= 50; s++) {
        const paper = buildPaper(bp, mulberry32(s));
        expect(paper).toHaveLength(20);
        bp.zones.forEach((z, zi) => {
          const items = paper.filter(q => q.zone === zi);
          expect(items).toHaveLength(z.slots.length);
          const allowed = new Set(z.slots.flat());
          for (const q of items) expect(allowed.has(q.type), q.type).toBe(true);
        });
        // 區與區的順序固定：zone 編號不會往回跳
        const zones = paper.map(q => q.zone);
        expect(zones).toEqual([...zones].sort((a, b) => a - b));
      }
    });

    test('種子是 0～2³²−1 的整數', () => {
      for (let s = 1; s <= 20; s++) {
        for (const q of buildPaper(bp, mulberry32(s))) {
          expect(Number.isInteger(q.seed)).toBe(true);
          expect(q.seed).toBeGreaterThanOrEqual(0);
          expect(q.seed).toBeLessThanOrEqual(2 ** 32 - 1);
        }
      }
    });

    test('兩個不同的亂數來源出的考卷不同；同一個來源出的相同', () => {
      const a = buildPaper(bp, mulberry32(1));
      const b = buildPaper(bp, mulberry32(2));
      expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b));
      expect(buildPaper(bp, mulberry32(1))).toEqual(a);
    });
  });
}

test('同一份考卷裡，還有沒挑過的題型時不會重複', () => {
  const bp = { zones: [{ slots: Array.from({ length: 20 }, () => ['a', 'b', 'c']) }] };
  // 前 3 個 slot 一定挑到 a、b、c 各一次，之後才允許重複
  for (let s = 1; s <= 30; s++) {
    const r = mulberry32(s);
    const used = new Set();
    // buildPaper 會在區內打亂順序，所以只能檢查整體：三種題型都出現過
    for (const q of buildPaper(bp, r)) used.add(q.type);
    expect(used).toEqual(new Set(['a', 'b', 'c']));
  }
  const two = { zones: [{ slots: [['x', 'y'], ['x', 'y'], ...Array.from({ length: 18 }, () => ['z'])] }] };
  for (let s = 1; s <= 30; s++) {
    const types = buildPaper(two, mulberry32(s)).map(q => q.type).filter(t => t !== 'z').sort();
    expect(types).toEqual(['x', 'y']);
  }
});

test('validateBlueprint：19 題、空 slot、沒有 zones、不存在的題型都丟錯誤', () => {
  const slots = n => Array.from({ length: n }, () => ['a']);
  expect(() => validateBlueprint({ zones: [{ slots: slots(19) }] })).toThrow();
  expect(() => validateBlueprint({ zones: [{ slots: [...slots(19), []] }] })).toThrow();
  expect(() => validateBlueprint({})).toThrow();
  expect(() => validateBlueprint({ zones: [{ slots: slots(20) }] })).not.toThrow();
  expect(() => validateBlueprint({ zones: [{ slots: slots(20) }] }, { b: () => ({}) })).toThrow(/a/);
  expect(() => validateBlueprint({ zones: [{ slots: slots(20) }] }, { a: () => ({}) })).not.toThrow();
});
