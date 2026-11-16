// svg.js 的 tween()：加上可選的 ease 參數後，不傳 ease 時的進度曲線必須和原本一模一樣。
let tween, EASE, S;

// 原本寫死在 tween 裡的 ease-in-out 二次曲線。
const legacy = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

beforeAll(async () => {
  document.body.innerHTML = '<svg id="svg"></svg><div id="sub"></div><div id="bar"></div>';
  ({ tween, EASE } = await import('../../src/engine/svg.js'));
  ({ S } = await import('../../src/engine/state.js'));
});

// 手動控制 performance.now 與 requestAnimationFrame，一格一格推進。
function fakeFrames() {
  let now = 0;
  const queue = [];
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', cb => { queue.push(cb); return queue.length; });
  return {
    step(ms) { now += ms; const cbs = queue.splice(0); cbs.forEach(cb => cb(now)); },
  };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function sample(dur, ease) {
  const f = fakeFrames();
  const seen = [];
  const p = ease ? tween(dur, (e, t) => seen.push([e, t]), S.runId, ease) : tween(dur, (e, t) => seen.push([e, t]), S.runId);
  for (let i = 0; i < 12; i++) f.step(dur / 10);
  await p;
  return seen;
}

test('不傳 ease：每一格的進度和原本的公式相同', async () => {
  const seen = await sample(1000);
  expect(seen.length).toBeGreaterThan(5);
  for (const [e, t] of seen) expect(e).toBeCloseTo(legacy(t), 12);
  expect(seen[seen.length - 1][0]).toBe(1);
});

test('傳入 EASE.outBack：最後一格剛好是 1，中間會超過 1（Q 彈）', async () => {
  const seen = await sample(1000, EASE.outBack);
  expect(seen[seen.length - 1][0]).toBe(1);
  expect(Math.max(...seen.map(s => s[0]))).toBeGreaterThan(1);
});

test('EASE 的每個曲線：0 → 0、1 → 1', () => {
  for (const k of Object.keys(EASE)) {
    expect(EASE[k](0)).toBeCloseTo(0, 9);
    expect(EASE[k](1)).toBeCloseTo(1, 9);
  }
});

test('tween 不呼叫 Math.random', async () => {
  const spy = vi.spyOn(Math, 'random');
  await sample(500, EASE.outBounce);
  expect(spy).not.toHaveBeenCalled();
});
