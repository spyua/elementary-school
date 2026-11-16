import { parseRoute, formatRoute, onRoute, navigate } from '../../src/platform/router.js';

test.each([
  ['', { view: 'home' }], ['#/', { view: 'home' }],
  ['#/g1', { view: 'grade', grade: 1 }],
  ['#/g1/math/a', { view: 'semester', grade: 1, subject: 'math', semester: 'a' }],
  ['#/g1/math/a/num10', { view: 'unit', grade: 1, subject: 'math', semester: 'a', key: 'num10' }],
  ['#/credits', { view: 'credits' }], ['#/profiles', { view: 'profiles' }],
])('parseRoute(%s)', (h, r) => expect(parseRoute(h)).toEqual(r));

test('來回轉換一致', () => {
  const r = { view: 'unit', grade: 1, subject: 'math', semester: 'a', key: 'curve' };
  expect(parseRoute(formatRoute(r))).toEqual(r);
});

test.each(['#/g9', '#/g1/art/a', '#/g1/math/z/num10', '#/g1/math/a/nope', '#/%%%', '#/g1/math/a/num10/extra'])('不存在的網址回首頁：%s', h => expect(parseRoute(h)).toEqual({ view: 'home' }));

test('總複習也是可開啟的單元網址', () => {
  expect(parseRoute('#/g1/math/a/review-length')).toEqual({ view: 'unit', grade: 1, subject: 'math', semester: 'a', key: 'review-length' });
});

test('每種畫面都能轉回網址', () => {
  for (const r of [{ view: 'home' }, { view: 'grade', grade: 1 }, { view: 'semester', grade: 1, subject: 'math', semester: 'a' }, { view: 'credits' }, { view: 'profiles' }]) {
    expect(parseRoute(formatRoute(r))).toEqual(r);
  }
});

test('onRoute 啟動時先呼叫一次，navigate 會觸發 hashchange', async () => {
  window.location.hash = '';
  const seen = [];
  onRoute(r => seen.push(r));
  expect(seen).toEqual([{ view: 'home' }]);
  navigate({ view: 'grade', grade: 1 });
  await new Promise(res => window.addEventListener('hashchange', res, { once: true }));
  expect(window.location.hash).toBe('#/g1');
  expect(seen.at(-1)).toEqual({ view: 'grade', grade: 1 });
});
