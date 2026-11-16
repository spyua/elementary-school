// 範本機制：choice、listen、match、explainer 產生的題目與場景，必須是舊引擎認得的格式。
// 引擎模組在載入時就會抓 #svg、#sub、#bar，所以先放好 DOM 再動態載入。
let makeChoiceType, makeListenType, makeMatchType, makeExplainerScene;

const ITEMS = ['apple', 'banana', 'cat', 'dog', 'fish'].map(k => ({ key: k, label: k, emoji: k, lang: 'en-US' }));

beforeAll(async () => {
  document.body.innerHTML = '<svg id="svg"></svg><div id="sub"></div><div id="bar"></div>';
  ({ makeChoiceType } = await import('../../src/templates/choice.js'));
  ({ makeListenType } = await import('../../src/templates/listen.js'));
  ({ makeMatchType } = await import('../../src/templates/match.js'));
  ({ makeExplainerScene } = await import('../../src/templates/explainer.js'));
});

// 用固定序列取代 Math.random，讓 100 次結果可重現又有變化。
function seqRandom() {
  let i = 0;
  const seq = [0.03, 0.91, 0.47, 0.12, 0.66, 0.28, 0.79, 0.55, 0.995, 0.0];
  return vi.spyOn(Math, 'random').mockImplementation(() => seq[i++ % seq.length]);
}

afterEach(() => vi.restoreAllMocks());

function checkPick(it, n) {
  expect(it.mode).toBe('pick');
  const regs = it.draw();
  expect(regs).toHaveLength(n);
  expect(Number.isInteger(it.answer)).toBe(true);
  expect(it.answer).toBeGreaterThanOrEqual(0);
  expect(it.answer).toBeLessThan(n);
  expect(typeof it.explain).toBe('function');
}

test('makeChoiceType：100 次都有 options 個不重複選項，正解剛好一次', () => {
  seqRandom();
  for (const [show, answerBy] of [['emoji', 'label'], ['label', 'emoji']]) {
    const gen = makeChoiceType({ items: ITEMS, options: 3, show, answerBy, prompt: t => `哪一個是 ${t.label}？`, explain: t => `這是 ${t.label}` });
    for (let k = 0; k < 100; k++) {
      const it = gen();
      expect(it.options).toHaveLength(3);
      expect(new Set(it.options.map(o => o.key)).size).toBe(3);
      checkPick(it, 3);
      expect(it.options.filter(o => o.key === it.target.key)).toHaveLength(1);
      expect(it.options[it.answer].key).toBe(it.target.key);
      expect(it.prompt).toBe(`哪一個是 ${it.target.label}？`);
    }
  }
});

test('makeChoiceType：items 少於 options 時立即丟錯誤', () => {
  expect(() => makeChoiceType({ items: ITEMS.slice(0, 2), options: 3, show: 'emoji', answerBy: 'label', prompt: () => '', explain: () => '' }))
    .toThrow(/items/);
});

test('makeListenType：選項不重複，正解剛好一次', () => {
  seqRandom();
  const gen = makeListenType({ items: ITEMS, options: 4, prompt: '聽一聽，選出你聽到的', explain: t => `這是 ${t.label}` });
  for (let k = 0; k < 100; k++) {
    const it = gen();
    expect(new Set(it.options.map(o => o.key)).size).toBe(4);
    checkPick(it, 4);
    expect(it.options[it.answer].key).toBe(it.target.key);
    expect(typeof it.ask).toBe('function');
  }
  expect(() => makeListenType({ items: ITEMS.slice(0, 3), options: 4, prompt: '', explain: () => '' })).toThrow(/items/);
});

test('makeMatchType：answer 是 0..pairs-1 的排列，draw() 回傳 pairs*2 個區域', () => {
  seqRandom();
  const gen = makeMatchType({ items: ITEMS, pairs: 3, left: 'label', right: 'emoji', prompt: '把英文字和圖連起來' });
  for (let k = 0; k < 100; k++) {
    const it = gen();
    expect(it.mode).toBe('match');
    expect([...it.answer].sort()).toEqual([0, 1, 2]);
    const regs = it.draw();
    expect(regs).toHaveLength(6);
    for (const r of regs) for (const f of ['x', 'y', 'w', 'h', 'mx', 'my']) expect(typeof r[f]).toBe('number');
    // 左邊第 i 項對應右邊第 answer[i] 項，兩邊是同一個詞彙
    it.answer.forEach((j, i) => expect(it.right[j].key).toBe(it.left[i].key));
  }
  expect(() => makeMatchType({ items: ITEMS.slice(0, 2), pairs: 3, left: 'label', right: 'emoji', prompt: '' })).toThrow(/items/);
});

test('makeExplainerScene：回傳 title 與 async run', () => {
  const sc = makeExplainerScene({ title: '水果', steps: [{ emoji: 'apple', text: 'apple', say: '這是' }, { say: 'apple', lang: 'en-US' }] });
  expect(sc.title).toBe('水果');
  expect(typeof sc.run).toBe('function');
  expect(sc.run.constructor.name).toBe('AsyncFunction');
});

test('drawEmoji：用 BASE_URL 下的 emoji 圖檔，載入失敗時改顯示文字', async () => {
  const { drawEmoji } = await import('../../src/engine/emoji.js');
  const g = drawEmoji('apple', 100, 100, 80, undefined, 'apple');
  const img = g.querySelector('image');
  expect(img.getAttribute('href')).toBe(`${import.meta.env.BASE_URL}emoji/apple.svg`);
  img.dispatchEvent(new Event('error'));
  expect(g.querySelector('image')).toBeNull();
  expect(g.querySelector('text').textContent).toBe('apple');
});
