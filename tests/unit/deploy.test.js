// @vitest-environment node
// 部署設定：base 路徑跟著 BASE_PATH 走，GitHub Actions 流程有建置、測試與發布三段。
import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  return (await import('../../vite.config.js')).default;
}

describe('vite base 路徑', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('沒有設定 BASE_PATH 時是根目錄 /', async () => {
    vi.stubEnv('BASE_PATH', undefined);
    expect((await loadConfig()).base).toBe('/');
  });

  it('部署到子路徑時使用 BASE_PATH', async () => {
    vi.stubEnv('BASE_PATH', '/elementary-school/');
    expect((await loadConfig()).base).toBe('/elementary-school/');
  });
});

describe('.github/workflows/deploy.yml', () => {
  // vitest 從專案根目錄執行；jsdom 環境下 import.meta.url 不是 file:，所以用相對於根目錄的路徑。
  let yml = '';
  beforeAll(() => { yml = readFileSync('.github/workflows/deploy.yml', 'utf8'); });

  it('push 到 main 與手動觸發', () => {
    expect(yml).toMatch(/push:\s*\n\s*branches:\s*\[\s*main\s*\]/);
    expect(yml).toMatch(/workflow_dispatch/);
  });

  it('先跑單元與 e2e 測試，再用儲存庫名稱當 base 建置', () => {
    const order = ['npm ci', 'npm test', 'npx playwright install --with-deps chromium', 'npx playwright test',
      'BASE_PATH: /${{ github.event.repository.name }}/', 'actions/upload-pages-artifact'];
    const idx = order.map((s) => yml.indexOf(s));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it('deploy job 有 Pages 權限與 github-pages 環境', () => {
    expect(yml).toMatch(/pages:\s*write/);
    expect(yml).toMatch(/id-token:\s*write/);
    expect(yml).toMatch(/name:\s*github-pages/);
    expect(yml).toMatch(/actions\/deploy-pages/);
  });
});
