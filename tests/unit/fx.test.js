// fx.js：紙花等裝飾特效不能呼叫 Math.random，同一個種子要灑出同樣的圖樣。
let confetti, starBurst, crumbs, replay;

beforeAll(async () => {
  document.body.innerHTML = '<div id="stage"><svg id="svg"></svg></div><div id="sub"></div><div id="bar"></div>';
  ({ confetti, starBurst, crumbs, replay } = await import('../../src/engine/fx.js'));
});

afterEach(() => vi.restoreAllMocks());

const stage = () => document.querySelector('#stage');

test('confetti 期間 Math.random 一次都不會被呼叫', () => {
  const spy = vi.spyOn(Math, 'random');
  confetti(stage(), { seed: 3 });
  starBurst(stage());
  crumbs(100, 100, document.querySelector('#svg'));
  expect(spy).not.toHaveBeenCalled();
});

test('confetti 灑出約 24 片紙花，放在 #svg 外面，不回傳 Promise', () => {
  const ret = confetti(stage(), { seed: 1 });
  expect(ret).toBeUndefined();
  const pieces = stage().querySelectorAll('.fx-confetti .confetti-piece');
  expect(pieces.length).toBe(24);
  expect(document.querySelector('#svg .confetti-piece')).toBeNull();
});

test('同一個種子灑出同樣的位置；再灑一次會先清掉舊的', () => {
  confetti(stage(), { seed: 9 });
  const a = [...stage().querySelectorAll('.confetti-piece')].map(p => p.style.left);
  confetti(stage(), { seed: 9 });
  const b = [...stage().querySelectorAll('.confetti-piece')].map(p => p.style.left);
  expect(stage().querySelectorAll('.fx-confetti').length).toBe(1);
  expect(a).toEqual(b);
});

test('crumbs 只畫 <circle>，不新增 <text>', () => {
  const svg = document.querySelector('#svg');
  svg.innerHTML = '';
  crumbs(50, 60, svg);
  expect(svg.querySelectorAll('circle.crumb').length).toBeGreaterThan(3);
  expect(svg.querySelectorAll('text').length).toBe(0);
});

test('replay 會把 class 加回去', () => {
  const n = document.createElement('div');
  n.classList.add('hop');
  replay(n, 'hop');
  expect(n.classList.contains('hop')).toBe(true);
});
