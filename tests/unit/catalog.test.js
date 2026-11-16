import { SUBJECTS, PACKS, findPack, findUnit, allUnits } from '../../src/content/catalog.js';

const LEGACY_ORDER = ['num10', 'line', 'curve', 'thick', 'align', 'order', 'split', 'shape', 'add', 'sub', 'num30', 'time'];

test('所有 id（含考試）不重複且格式正確', () => {
  const ids = PACKS.flatMap(p => [...p.units, ...p.reviews, ...(p.exams || [])].map(u => u.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const id of ids) expect(id).toMatch(/^G\dA?-[MES]-[\w-]+$/);
});

test('學期包欄位與科目合法', () => {
  for (const p of PACKS) {
    expect(SUBJECTS[p.subject]).toBeDefined();
    // 正式學期包是 a（上學期）或 b（下學期）；試玩包用 demo。
    expect(p.trial ? ['demo'] : ['a', 'b']).toContain(p.semester);
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

test('g1a-math 有期中考、期末考，固定 ID 不變，findUnit 找得到', () => {
  const p = findPack(1, 'math', 'a');
  expect(p.exams.map(x => x.id)).toEqual(['G1A-M-exam-mid', 'G1A-M-exam-final']);
  expect(findUnit(p, 'exam-mid')).toMatchObject({ id: 'G1A-M-exam-mid', title: '期中考' });
  expect(findUnit(p, 'exam-final')).toMatchObject({ id: 'G1A-M-exam-final', title: '期末考' });
  // 沒有 exams 欄位的學期包也不會出錯
  expect(findUnit(findPack(1, 'english', 'demo'), 'exam-mid')).toBeUndefined();
});

test('g1a-math 章節分成期中、期末範圍，組尾的考試都找得到', () => {
  const p = findPack(1, 'math', 'a');
  for (const ch of p.chapters) expect(['mid', 'final'], ch.name).toContain(ch.term);
  expect(p.chapters.slice(0, 5).map(c => c.term)).toEqual(['mid', 'mid', 'mid', 'mid', 'mid']);
  expect(p.chapters.slice(5).every(c => c.term === 'final')).toBe(true);
  expect(p.chapters.find(c => c.review === 'review-all').term).toBe('final');
  expect(p.terms.map(t => t.key)).toEqual(['mid', 'final']);
  for (const t of p.terms) {
    expect(p.exams.map(x => x.key), t.key).toContain(t.exam);
    expect(t.name).toContain(t.key === 'mid' ? '期中考範圍' : '期末考範圍');
  }
  expect(p.terms.map(t => t.range)).toEqual(['第一～五章', '第六～九章']);
  // 每個章節都有歸屬的分組
  const keys = new Set(p.terms.map(t => t.key));
  for (const ch of p.chapters) expect(keys.has(ch.term), ch.name).toBe(true);
  // 給爸媽的作答小提醒有考試說明
  expect(p.parentGuide.reminders.items.some(t => t.includes('不會顯示對錯'))).toBe(true);
});

test('沒有 terms 的學期包（英文試玩）章節也沒有 term', () => {
  const p = findPack(1, 'english', 'demo');
  expect(p.terms).toBeUndefined();
  for (const ch of p.chapters) expect(ch.term).toBeUndefined();
});

test('英文試玩包只有一個單元 G1-E-words', () => {
  const p = findPack(1, 'english', 'demo');
  expect(p).toMatchObject({ id: 'g1-english-demo', grade: 1, subject: 'english', semester: 'demo', label: '試玩', trial: true });
  expect(p.units).toHaveLength(1);
  expect(p.units[0]).toMatchObject({
    id: 'G1-E-words', key: 'words', icon: '🔤', name: '認識英文單字', desc: '聽一聽、選一選、連一連', lang: 'en-US', curriculum: [],
  });
  expect(p.reviews).toEqual([]);
});
