// rng.js：固定種子的亂數產生器，不能碰到 Math.random。
import { mulberry32, withSeed } from '../../src/engine/rng.js';

afterEach(() => vi.restoreAllMocks());

test('同一個種子得到同一串數字，而且都在 [0, 1) 之間', () => {
  const a = mulberry32(7), b = mulberry32(7);
  const xs = Array.from({ length: 20 }, () => a());
  const ys = Array.from({ length: 20 }, () => b());
  expect(xs).toEqual(ys);
  for (const x of xs) {
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  }
});

test('不同種子得到不同的數字', () => {
  expect(mulberry32(1)()).not.toBe(mulberry32(2)());
});

test('mulberry32 不呼叫 Math.random', () => {
  const spy = vi.spyOn(Math, 'random');
  const r = mulberry32(3);
  for (let i = 0; i < 10; i++) r();
  expect(spy).not.toHaveBeenCalled();
});

test('withSeed：執行期間 Math.random 換成固定序列，結束後還原', () => {
  const original = Math.random;
  const first = withSeed(11, () => [Math.random(), Math.random()]);
  const again = withSeed(11, () => [Math.random(), Math.random()]);
  expect(first).toEqual(again);
  const r = mulberry32(11);
  expect(first).toEqual([r(), r()]);
  expect(Math.random).toBe(original);
});

test('withSeed：fn 丟錯時 Math.random 也會還原', () => {
  const original = Math.random;
  expect(() => withSeed(5, () => { throw new Error('壞掉了'); })).toThrow('壞掉了');
  expect(Math.random).toBe(original);
});
