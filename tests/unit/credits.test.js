import { readFileSync } from 'node:fs';

const credits = JSON.parse(readFileSync('src/content/credits.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

// 只允許這些 SPDX 授權代碼；NC、ND 授權一律不收。
const ALLOWED = ['MIT', 'ISC', 'Apache-2.0', 'CC0-1.0', 'OFL-1.1', 'CC-BY-4.0'];
const FIELDS = ['name', 'url', 'license', 'author', 'usage'];

test('每一筆都有 name、url、license、author、usage 五個欄位', () => {
  expect(Array.isArray(credits)).toBe(true);
  for (const c of credits) {
    expect(Object.keys(c).sort()).toEqual([...FIELDS].sort());
    for (const f of FIELDS) {
      expect(typeof c[f], `${c.name}.${f}`).toBe('string');
      expect(c[f].trim(), `${c.name}.${f}`).not.toBe('');
    }
    expect(c.url).toMatch(/^https:\/\//);
  }
});

test('license 是允許清單內的 SPDX 代碼', () => {
  for (const c of credits) expect(ALLOWED, c.name).toContain(c.license);
});

test('至少包含 open-props、Tabler Icons、Fluent Emoji、Kenney、粉圓（Huninn）', () => {
  const names = credits.map(c => c.name).join('\n');
  for (const re of [/open-props/, /Tabler Icons/, /Fluent Emoji/, /Kenney/, /Huninn/]) {
    expect(names).toMatch(re);
  }
});

test('package.json 的每個 dependency 都登記在 credits.json（name 內含套件名稱）', () => {
  const deps = Object.keys(pkg.dependencies || {});
  const missing = deps.filter(d => !credits.some(c => c.name.includes(d)));
  expect(missing).toEqual([]);
});
