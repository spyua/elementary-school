// judge()：練習與考試共用的對錯判斷。邏輯必須和原本 check() 裡算 ok 的那段完全相同。
import { DOM } from './helpers/lesson-dom.js';

let judge;

beforeAll(async () => {
  document.body.innerHTML = DOM;
  ({ judge } = await import('../../src/engine/practice.js'));
});

test('num：值相同才算對', () => {
  const item = { mode: 'num', answer: 7 };
  expect(judge(item, { val: 7 })).toBe(true);
  expect(judge(item, { val: 6 })).toBe(false);
  expect(judge(item, {})).toBe(false);
});

test('pick：圈的區域就是答案', () => {
  const item = { mode: 'pick', answer: 2 };
  expect(judge(item, { 2: 'o' })).toBe(true);
  expect(judge(item, { 0: 'o' })).toBe(false);
});

test('pair：交給題目的 isOk，傳入圈選的區域編號', () => {
  const seen = [];
  const item = { mode: 'pair', answer: [1, 3], isOk(arr) { seen.push(arr); return arr.includes(1) && arr.includes(3); } };
  expect(judge(item, { 1: 'o', 3: 'o' })).toBe(true);
  expect(judge(item, { 1: 'o', 2: 'o' })).toBe(false);
  expect(seen[0]).toEqual([1, 3]);
});

test('dual：打勾和畫圈都要在對的位置', () => {
  const item = { mode: 'dual', answer: { v: 0, o: 2 } };
  expect(judge(item, { 0: 'v', 2: 'o' })).toBe(true);
  expect(judge(item, { 0: 'o', 2: 'v' })).toBe(false);
  expect(judge(item, { 0: 'v', 1: 'o' })).toBe(false);
});

test('classify：每一格的記號都要對', () => {
  const item = { mode: 'classify', answer: ['v', 'o', 'o', 'v'] };
  expect(judge(item, { 0: 'v', 1: 'o', 2: 'o', 3: 'v' })).toBe(true);
  expect(judge(item, { 0: 'o', 1: 'o', 2: 'o', 3: 'v' })).toBe(false);
});

test('match：每一條線都連對', () => {
  const item = { mode: 'match', answer: [2, 0, 1] };
  expect(judge(item, { 0: 2, 1: 0, 2: 1 })).toBe(true);
  expect(judge(item, { 0: 0, 1: 2, 2: 1 })).toBe(false);
});

test('judge 不呼叫 Math.random', () => {
  const spy = vi.spyOn(Math, 'random');
  judge({ mode: 'num', answer: 1 }, { val: 1 });
  judge({ mode: 'classify', answer: ['v'] }, { 0: 'v' });
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});
