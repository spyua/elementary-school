// emojiAt()：把文字 emoji 換成 Fluent 圖片的 helper。
// 舊程式把 <text> 的 x、y 當中心點讀寫；換成 <image> 後，讀寫的仍要是中心點。
// 引擎模組在載入時就會抓 #svg，所以先放好 DOM 再動態載入。
let emojiAt, emojiFile, uiUrl, txt;
const realGet = (node, name) => Element.prototype.getAttribute.call(node, name);

beforeAll(async () => {
  document.body.innerHTML = '<svg id="svg"></svg><div id="sub"></div><div id="bar"></div>';
  ({ emojiAt, emojiFile, uiUrl } = await import('../../src/engine/emoji.js'));
  ({ txt } = await import('../../src/engine/svg.js'));
});

beforeEach(() => { document.querySelector('#svg').innerHTML = ''; });
afterEach(() => vi.restoreAllMocks());

test('呼叫 emojiAt 時 Math.random 一次都不會被呼叫（不影響對照測試的亂數順序）', () => {
  const spy = vi.spyOn(Math, 'random');
  const img = emojiAt(100, 50, '🍎', { 'font-size': 40 });
  img.setAttribute('x', 130);
  img.getAttribute('y');
  emojiAt(10, 10, '①');
  expect(spy).not.toHaveBeenCalled();
});

test('有對照圖：回傳 <image>，x/y 讀寫的是中心點', () => {
  const img = emojiAt(100, 50, '🍎', { 'font-size': 40 });
  expect(img.tagName).toBe('image');
  expect(img.parentNode).toBe(document.querySelector('#svg'));
  // 邊長 = round(40 × 1.15) = 46，一半是 23
  expect(realGet(img, 'width')).toBe('46');
  expect(realGet(img, 'height')).toBe('46');
  expect(img.getAttribute('x')).toBe('100');
  expect(img.getAttribute('y')).toBe('50');
  expect(realGet(img, 'x')).toBe(String(100 - 23));
  expect(realGet(img, 'y')).toBe(String(50 - 23));
  expect(realGet(img, 'href')).toMatch(/emoji\/apple\.svg$/);
  expect(img.getAttribute('class')).toBe('svgtxt');

  img.setAttribute('x', 130);
  expect(img.getAttribute('x')).toBe('130');
  expect(realGet(img, 'x')).toBe(String(130 - 23));
  img.setAttribute('y', '12.5');
  expect(img.getAttribute('y')).toBe('12.5');
  expect(Number(realGet(img, 'y'))).toBeCloseTo(12.5 - 23);
});

test('沒有 font-size 時用 40；class 與 style 照帶，文字專用屬性不寫到 <image>', () => {
  const img = emojiAt(0, 0, '🐰', { class: 'pop', style: 'opacity:.5', fill: '#333', 'text-anchor': 'start' });
  expect(realGet(img, 'width')).toBe('46');
  expect(img.getAttribute('class')).toBe('pop');
  expect(img.getAttribute('style')).toBe('opacity:.5');
  expect(img.hasAttribute('fill')).toBe(false);
  expect(img.hasAttribute('text-anchor')).toBe(false);
});

test('改 font-size 時重算邊長，中心點不變', () => {
  const img = emojiAt(100, 100, '🐰', { 'font-size': 40 });
  img.setAttribute('font-size', 80);
  expect(img.getAttribute('font-size')).toBe('80');
  expect(realGet(img, 'width')).toBe('92');
  expect(realGet(img, 'x')).toBe(String(100 - 46));
  expect(img.getAttribute('x')).toBe('100');
});

test('textContent 讀到原本的 emoji 字元', () => {
  expect(emojiAt(0, 0, '🍪').textContent).toBe('🍪');
});

test('帶變體選擇符的字元（✏️、⚖️）也查得到圖', () => {
  expect(emojiFile('✏️')).toBe('pencil');
  expect(emojiFile('⚖️')).toBe('balance-scale');
  expect(emojiAt(0, 0, '✏️').tagName).toBe('image');
});

test('對照表沒有的字元退回 <text>，和 txt() 一樣', () => {
  const a = emojiAt(30, 40, '①', { 'font-size': 30, fill: '#999' });
  const b = txt(30, 40, '①', { 'font-size': 30, fill: '#999' });
  expect(a.tagName).toBe('text');
  expect(a.outerHTML).toBe(b.outerHTML);
  expect(emojiFile('①')).toBeUndefined();
});

test('可以指定 parent', () => {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  document.querySelector('#svg').appendChild(g);
  expect(emojiAt(0, 0, '🍎', {}, g).parentNode).toBe(g);
});

test('圖檔載入失敗：同一個節點改用文字 emoji 的 data URI', () => {
  const img = emojiAt(100, 50, '🍎', { 'font-size': 40 });
  img.dispatchEvent(new Event('error'));
  const href = realGet(img, 'href');
  expect(href).toMatch(/^data:image\/svg\+xml,/);
  expect(decodeURIComponent(href)).toContain('🍎');
  expect(img.getAttribute('x')).toBe('100');
});

test('uiUrl 指向 public/ui/', () => {
  expect(uiUrl('mascot')).toMatch(/ui\/mascot\.svg$/);
});
