import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(root, 'e2e'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 600_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    locale: 'fr-FR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
  webServer: {
    command: 'NEXT_PUBLIC_UX_CAPTURE=1 NEXT_DIST_DIR=.next-dev next dev -p 3000 -H 127.0.0.1',
    url: 'http://127.0.0.1:3000/quiz',
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_UX_CAPTURE: '1',
      NEXT_DIST_DIR: '.next-dev',
    },
  },
});
