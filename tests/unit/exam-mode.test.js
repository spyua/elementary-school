// 練習引擎的考試分支：作答時不透露對錯、要按「✔ 好了」才送出、錯題重看會畫出灰色與綠色。
import { DOM } from './helpers/lesson-dom.js';

let registerTypes, startPractice, reviewExamItem, el;

const GREEN = '#2bb673';
const GRAY = '#9a8c7a';

beforeAll(async () => {
  document.body.innerHTML = DOM;
  ({ registerTypes, startPractice, reviewExamItem } = await import('../../src/engine/practice.js'));
  ({ el } = await import('../../src/engine/svg.js'));
  // 三個框框選一個；位置用 Math.random 決定，用來確認 withSeed 重建得到同一題。
  registerTypes({
    tPick3() {
      const answer = Math.floor(Math.random() * 3);
      return {
        mode: 'pick', prompt: '選一個', answer,
        draw() { return [0, 1, 2].map(i => { el('rect', { x: 50 + i * 250, y: 100, width: 200, height: 200, fill: '#eee' }); return { x: 50 + i * 250, y: 100, w: 200, h: 200, mx: 150 + i * 250, my: 200 }; }); },
        async explain() {},
      };
    },
    tNum() {
      let t;
      return {
        mode: 'num', prompt: '幾個？', answer: 4, max: 10,
        draw() { t = el('text', { x: 400, y: 200, fill: '#333' }); return []; },
        fill(n, c) { t.textContent = String(n); t.setAttribute('fill', c); },
        async explain() {},
      };
    },
  });
});

const greens = () => [...document.querySelectorAll('#svg *')].filter(n => n.getAttribute('stroke') === GREEN || n.getAttribute('fill') === GREEN).length;
const barLabels = () => [...document.querySelectorAll('#bar button')].map(b => b.textContent);
const hits = () => [...document.querySelector('#svg').lastElementChild.children];

function startExamLike(types, seeds) {
  const log = [];
  const paper = types.map((type, i) => ({ type, seed: seeds[i], zone: 0 }));
  startPractice({ title: '考試', unitId: null, queue: types, exam: { paper, onAnswered: e => log.push(e), onEnd() {} } });
  return log;
}

test('點選後只選中，出現「✔ 好了」才送出；送出後字幕是「收到！」、沒有綠色正解、#score 空白', () => {
  const log = startExamLike(['tPick3'], [7]);
  expect(barLabels()).toEqual(['🔊 再聽一次']);
  expect(document.querySelector('#score').textContent).toBe('');
  hits()[0].dispatchEvent(new Event('click'));
  expect(log).toHaveLength(0);
  expect(window.__T.state.done).toBeFalsy();
  expect(barLabels()).toContain('✔ 好了');
  document.querySelector('#examOk').click();
  expect(log).toHaveLength(1);
  expect(log[0]).toMatchObject({ n: 1, type: 'tPick3', seed: 7, zone: 0, given: { 0: 'o' } });
  expect(document.querySelector('#sub').textContent).toBe('收到！');
  expect(greens()).toBe(0);
  expect(document.querySelector('#score').textContent).toBe('');
});

test('答對和答錯的字幕、按鈕列、畫面記號都一樣', () => {
  const snap = () => ({ sub: document.querySelector('#sub').textContent, bar: barLabels(), greens: greens(), score: document.querySelector('#score').textContent });
  let log = startExamLike(['tPick3'], [11]);
  window.__T.answer(true);
  const a = snap();
  expect(log[0].ok).toBe(true);
  log = startExamLike(['tPick3'], [11]);
  window.__T.answer(false);
  const b = snap();
  expect(log[0].ok).toBe(false);
  expect(b).toEqual(a);
});

test('num：點數字只選中並標記按鈕，按「✔ 好了」才送出', () => {
  const log = startExamLike(['tNum'], [1]);
  const four = [...document.querySelectorAll('#bar button.num')].find(b => b.textContent === '4');
  four.click();
  expect(four.classList.contains('sel')).toBe(true);
  expect(log).toHaveLength(0);
  document.querySelector('#examOk').click();
  expect(log[0]).toMatchObject({ ok: true, given: { val: 4 } });
});

test('reviewExamItem：同一個種子重建同一題，孩子的答案灰色、正解綠色', async () => {
  const log = startExamLike(['tPick3'], [12345]);
  window.__T.answer(false);
  const entry = log[0];
  const S = (await import('../../src/engine/state.js')).S;
  S.runId++;
  await reviewExamItem(entry, S.runId);
  const rings = [...document.querySelectorAll('#svg ellipse')];
  const green = rings.filter(r => r.getAttribute('stroke') === GREEN);
  const gray = rings.filter(r => r.getAttribute('stroke') === GRAY);
  expect(green).toHaveLength(1);
  expect(gray).toHaveLength(1);
  // 綠圈在正確答案的框框上（框框 i 的中心 x = 150 + i*250）
  const answerIdx = (Number(green[0].getAttribute('cx')) - 150) / 250;
  expect(answerIdx).not.toBe(Number(Object.keys(entry.given)[0]));
  expect(document.querySelector('#sub').textContent).toBe('我們一起看看為什麼。');
}, 10000);
