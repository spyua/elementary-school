import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4173',
  },
  // 錄製舊檔基準（LEGACY=1）時直接用 file:// 開舊檔，不需要啟動新站。
  webServer: process.env.LEGACY ? undefined : {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // 平板尺寸，引擎仍用 chromium。
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], browserName: 'chromium' } },
  ],
});
