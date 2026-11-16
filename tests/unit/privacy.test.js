import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// 禁用字以 base64 存放，避免禁用字原文出現在公開的程式碼裡。
const FORBIDDEN = ['6ICD5Y236KaB5Yqg5by3', '6ICD5Y235byx6bue', '6Ieq5a625a2p5a2Q']
  .map(b => Buffer.from(b, 'base64').toString('utf8'))
  .concat(['weak:true', 'weak:']);

test('公開檔案沒有個人資訊', () => {
  // -z 讓非 ASCII 檔名不會被 git 轉成跳脫字串。
  const files = execSync('git ls-files -z --cached --others --exclude-standard')
    .toString()
    .split('\0')
    .filter(Boolean);
  const hits = files.flatMap(f => {
    if (f === 'tests/unit/privacy.test.js' || f.startsWith('docs/superpowers/plans/')) return [];
    const t = readFileSync(f, 'utf8');
    return FORBIDDEN.filter(w => t.includes(w)).map(w => `${f}: ${w}`);
  });
  expect(hits).toEqual([]);
});

test('private/ 不會被追蹤', () => {
  expect(execSync('git check-ignore private/legacy-index.html').toString().trim()).toBe('private/legacy-index.html');
});
