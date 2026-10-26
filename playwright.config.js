import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', retries: 0, workers: 1, timeout: 60000,
  expect: { timeout: 15000 }, reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'reports/junit.xml' }]],
  projects: [
    { name: 'ui', testMatch: '**/*.ui.spec.*', use: { browserName: 'chromium', headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' } },
    { name: 'api', testMatch: '**/*.api.spec.*', use: { trace: 'off' } }
  ] });
