import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const main = readFileSync('src/main.js', 'utf8');

test('index.html 沒有內嵌 <style>；樣式由 src/main.js 載入 tokens.css 與 app.css', () => {
  expect(html).not.toMatch(/<style\b/);
  expect(html).not.toMatch(/<\/style>/);
  expect(main).toContain("import './styles/tokens.css';");
  expect(main).toContain("import './styles/app.css';");
});

test('字型載入粉圓（Huninn），Noto Sans TC 備用', () => {
  expect(html).toMatch(/fonts\.googleapis\.com\/css2\?family=Huninn/);
  const tokens = readFileSync('src/styles/tokens.css', 'utf8');
  expect(tokens).toContain('"Huninn", "Noto Sans TC", system-ui, sans-serif');
});

test('body 的第一個元素是 #app，前面沒有多餘文字', () => {
  const body = html.split(/<body[^>]*>/)[1];
  expect(body.trimStart().startsWith('<div id="app">')).toBe(true);
});
