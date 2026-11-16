import { SUBJECTS, PACKS, findPack, findUnit, allUnits } from '../../src/content/catalog.js';

const LEGACY_ORDER = ['num10', 'line', 'curve', 'thick', 'align', 'order', 'split', 'shape', 'add', 'sub', 'num30', 'time'];

test('所有 id 不重複且格式正確', () => {
  const ids = PACKS.flatMap(p => [...p.units, ...p.reviews].map(u => u.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^G\dA?-[MES]-[\w-]+$/);
});

test('學期包欄位與科目合法', () => {
  for (const p of PACKS) {
    expect(SUBJECTS[p.subject]).toBeDefined();
    expect(['a', 'b']).toContain(p.semester);
    expect(typeof p.load).toBe('function');
  }
});

test('每個章節的單元與總複習都找得到中繼資料', () => {
  for (const p of PACKS) {
    for (const ch of p.chapters) {
      for (const k of ch.units) expect(p.units.find(u => u.key === k), `${p.id}/${k}`).toBeDefined();
      if (ch.review) expect(p.reviews.find(r => r.key === ch.review), `${p.id}/${ch.review}`).toBeDefined();
    }
  }
});

test('g1a-math 有 12 個單元與 2 個總複習，順序同舊檔', () => {
  const p = findPack(1, 'math', 'a');
  expect(p.id).toBe('g1a-math');
  expect(p.units.map(u => u.key)).toEqual(LEGACY_ORDER);
  expect(p.chapters.flatMap(c => c.units)).toEqual(LEGACY_ORDER);
  expect(p.reviews.map(r => r.key)).toEqual(['review-length', 'review-all']);
  expect(p.chapters.filter(c => c.review).map(c => c.review)).toEqual(['review-length', 'review-all']);
  for (const u of p.units) {
    expect(u.id).toBe(`G1A-M-${u.key}`);
    expect(u.curriculum.length).toBeGreaterThan(0);
    expect(u.versions.hanlin).toBeTruthy();
    expect(u).toMatchObject({ lang: 'zh-TW', prereqs: [] });
    for (const f of ['icon', 'name', 'desc', 'tip', 'task']) expect(u[f], `${u.key}.${f}`).toBeTruthy();
  }
});

test('findPack / findUnit / allUnits', () => {
  const p = findPack(1, 'math', 'a');
  expect(findPack(1, 'math', 'z')).toBeUndefined();
  expect(findPack(9, 'math', 'a')).toBeUndefined();
  expect(findUnit(p, 'curve').name).toBe('曲線比長短');
  expect(findUnit(p, 'review-all').id).toBe('G1A-M-review-all');
  expect(findUnit(p, 'nope')).toBeUndefined();
  expect(findUnit(undefined, 'curve')).toBeUndefined();
  expect(allUnits().filter(x => x.pack === p).map(x => x.unit.key)).toEqual(LEGACY_ORDER);
});
