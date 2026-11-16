// 考試專用題型（ex 開頭）：每個題型跑 200 個種子，檢查題目本身合法。
// - mode 只能是 pick 或 num
// - pick：答案在選項範圍內，選項畫出來的內容不重複
// - num：答案在 0～max 之間
// - prompt 不是空的、explain 是函式
// - 不用 Date.now() 這類不確定來源：同一個種子建兩次結果相同
// - 文字不出現真實人名、出版社名稱
import { DOM } from './helpers/lesson-dom.js';

let GEN, withSeed, clear, svg, EXAM_TYPES, bodies;

beforeAll(async () => {
  document.body.innerHTML = DOM;
  ({ GEN } = await import('../../src/engine/practice.js'));
  ({ withSeed } = await import('../../src/engine/rng.js'));
  ({ clear, svg } = await import('../../src/engine/svg.js'));
  ({ bodies } = (await import('../../src/content/math/g1a/index.js')).default);
  ({ EXAM_TYPES } = await import('../../src/content/math/g1a/exam.js'));
});

const KEYS = ['exN10CircleN', 'exLenUnits', 'exOrdQueue', 'exOrdCompare', 'exSplitAll', 'exShpPattern', 'exAddWord',
  'exAddSwap', 'exSubWord', 'exSubCompare', 'exN30SkipCount', 'exN30MoreLess', 'exTimPickClock', 'exTimDaily'];

/** 區域 r 裡面畫了什麼（文字、圖、形狀、指針角度），用來比對選項有沒有重複。 */
function regionContent(r) {
  const inside = n => {
    const box = attrBox(n);
    return box && box.cx >= r.x && box.cx <= r.x + r.w && box.cy >= r.y && box.cy <= r.y + r.h;
  };
  return [...svg.querySelectorAll('text, image, circle, polygon, rect, line')]
    .filter(inside)
    .map(n => `${n.tagName}:${n.tagName === 'text' ? n.textContent : ''}:${n.getAttribute('href') || ''}:${n.getAttribute('fill') || ''}:${n.getAttribute('transform') || ''}`)
    .sort()
    .join('|');
}
/** 從屬性估一個中心點（jsdom 沒有 getBBox）。 */
function attrBox(n) {
  const g = k => parseFloat(n.getAttribute(k));
  switch (n.tagName) {
    case 'text': return { cx: g('x'), cy: g('y') };
    case 'image': return { cx: g('x') + g('width') / 2, cy: g('y') + g('height') / 2 };
    case 'circle': return { cx: g('cx'), cy: g('cy') };
    case 'rect': return { cx: g('x') + g('width') / 2, cy: g('y') + g('height') / 2 };
    case 'line': return { cx: (g('x1') + g('x2')) / 2, cy: (g('y1') + g('y2')) / 2 };
    case 'polygon': {
      const pts = n.getAttribute('points').trim().split(/\s+/).map(p => p.split(',').map(Number));
      return { cx: pts.reduce((s, p) => s + p[0], 0) / pts.length, cy: pts.reduce((s, p) => s + p[1], 0) / pts.length };
    }
    default: return null;
  }
}

function build(type, seed) {
  clear();
  return withSeed(seed, () => {
    const item = GEN[type]();
    const regs = item.draw();
    return { item, regs, html: svg.innerHTML };
  });
}

test('EXAM_TYPES 剛好 14 個，而且都登記到題型表', () => {
  expect(Object.keys(EXAM_TYPES).sort()).toEqual([...KEYS].sort());
  for (const k of KEYS) expect(GEN[k], k).toBe(EXAM_TYPES[k]);
});

test('考試題型不在任何單元的 practice 陣列裡（review-all 的題型池不變）', () => {
  const practice = Object.values(bodies).flatMap(u => u.practice);
  for (const k of KEYS) expect(practice).not.toContain(k);
});

describe.each(KEYS)('%s', type => {
  test('200 個種子：模式、答案範圍、選項不重複、prompt、explain', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { item, regs } = build(type, seed * 7919);
      const tag = `${type} seed=${seed * 7919}`;
      expect(['pick', 'num'], tag).toContain(item.mode);
      expect(typeof item.prompt, tag).toBe('string');
      expect(item.prompt.trim().length, tag).toBeGreaterThan(0);
      expect(typeof item.explain, tag).toBe('function');
      expect(Number.isInteger(item.answer), tag).toBe(true);
      if (item.mode === 'pick') {
        expect(regs.length, tag).toBeGreaterThanOrEqual(2);
        expect(item.answer, tag).toBeGreaterThanOrEqual(0);
        expect(item.answer, tag).toBeLessThan(regs.length);
        const contents = regs.map(regionContent);
        expect(new Set(contents).size, `${tag} 選項重複：${contents.join(' / ')}`).toBe(regs.length);
      } else {
        expect(regs, tag).toEqual([]);
        expect(item.answer, tag).toBeGreaterThanOrEqual(0);
        expect(item.answer, tag).toBeLessThanOrEqual(item.max ?? 10);
        expect(typeof item.fill, tag).toBe('function');
      }
    }
    // 時鐘題畫圖比較重，200 個種子單獨跑約 4 秒，貼近預設的 5 秒上限；
    // 電腦忙碌時（例如同時跑 e2e、CI）會逾時，所以放寬到 30 秒。
  }, 30000);

  test('同一個種子建兩次結果相同；中間有 Date.now 變化也不影響', () => {
    for (const seed of [3, 99, 2026, 4294967295]) {
      const a = build(type, seed);
      const realNow = Date.now;
      Date.now = () => realNow() + 123456789;
      try {
        const b = build(type, seed);
        expect(b.item.prompt).toBe(a.item.prompt);
        expect(b.item.answer).toEqual(a.item.answer);
        expect(b.html).toBe(a.html);
      } finally {
        Date.now = realNow;
      }
    }
  });

  test('文字不出現人名或出版社名稱，角色用動物', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { item, html } = build(type, seed);
      const text = item.prompt + html;
      expect(text).not.toMatch(/翰林|康軒|南一|小明|小華|小美|小英/);
    }
  });
});
