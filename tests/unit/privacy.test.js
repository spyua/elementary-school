import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FORBIDDEN = ['個人弱點標籤', '個人弱點註記', '原本的使用者', 'weak:true', 'weak:'];

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
