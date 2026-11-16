// 練習引擎的 match 作答模式：點左再點右連線、再點一次取消、全部連好自動檢查。
// 用 jsdom 載入真正的 index.html 片段（引擎模組載入時就會抓這些 id）。
let registerTypes, startPractice, makeMatchType;

const ITEMS = ['apple', 'cat', 'sun'].map(k => ({ key: k, label: k, emoji: k, lang: 'en-US' }));

beforeAll(async () => {
  document.body.innerHTML = `<section id="home"></section><button id="homeBtn"></button>
    <section id="lesson" class="hidden"><div id="crumb"></div><span id="stTxt"></span><span id="score"></span>
    <svg id="svg" viewBox="0 0 800 420"></svg><div id="startOv"></div><div id="sub"></div><div id="bar"></div>
    <nav id="nav"><button id="prev"></button><button id="replay"></button><button id="next"></button></nav></section>`;
  ({ registerTypes, startPractice } = await import('../../src/engine/practice.js'));
  ({ makeMatchType } = await import('../../src/templates/match.js'));
  registerTypes({ tMatch: makeMatchType({ items: ITEMS, pairs: 3, left: 'label', right: 'emoji', prompt: '連連看' }) });
});

// layer.hit 是最後一個 <g>，裡面的透明方塊依區域順序排列。
const hits = () => [...document.querySelector('#svg').lastElementChild.children];
const linkCount = () => document.querySelectorAll('#svg line').length;
const barLabels = () => [...document.querySelectorAll('#bar button')].map(b => b.textContent);

function start() {
  startPractice({ title: 't', types: ['tMatch'], count: 1, unitId: null });
  return window.__T;
}

test('match 模式沒有打勾畫圈按鈕，只有「🔊 再聽一次」', () => {
  start();
  expect(barLabels()).toEqual(['🔊 再聽一次']);
});

test('點左再點右連一條線；再點一次已連線的項目會取消', () => {
  start();
  const h = hits();
  expect(h).toHaveLength(6);
  h[0].dispatchEvent(new Event('click'));
  h[3].dispatchEvent(new Event('click'));
  expect(linkCount()).toBe(1);
  h[3].dispatchEvent(new Event('click'));
  expect(linkCount()).toBe(0);
  // 先點右邊再點左邊也可以
  h[4].dispatchEvent(new Event('click'));
  h[1].dispatchEvent(new Event('click'));
  expect(linkCount()).toBe(1);
  h[1].dispatchEvent(new Event('click'));
  expect(linkCount()).toBe(0);
  expect(window.__T.state.done).toBeFalsy();
});

test('全部連好自動檢查；答錯時畫出綠色正解', () => {
  const T = start();
  T.answer(false);
  expect(T.state.done).toBe(true);
  expect(T.state.P.c).toBe(0);
  const green = [...document.querySelectorAll('#svg line')].filter(l => l.getAttribute('stroke') === '#2bb673');
  expect(green).toHaveLength(3);
});

test('依正解連線就答對', () => {
  const T = start();
  T.answer(true);
  expect(T.state.done).toBe(true);
  expect(T.state.P.c).toBe(1);
});
