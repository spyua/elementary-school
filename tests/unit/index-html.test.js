import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

test('index.html 只有一組 <style>…</style>，CSS 不會漏到畫面上', () => {
  expect((html.match(/<style\b/g) || []).length).toBe(1);
  expect((html.match(/<\/style>/g) || []).length).toBe(1);
});

test('body 的第一個元素是 #app，前面沒有多餘文字', () => {
  const body = html.split(/<body[^>]*>/)[1];
  expect(body.trimStart().startsWith('<div id="app">')).toBe(true);
});
