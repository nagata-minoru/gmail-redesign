import { defineConfig, devices } from '@playwright/test'

const port = 4173

/**
 * E2E テストの設定。npm run build:web で書き出した dist/ を e2e/serve.mjs で配信し、
 * モバイル幅の Chromium で操作する。
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{
    name: 'mobile-chromium',
    use: { ...devices['Pixel 7'], browserName: 'chromium' },
  }],
  webServer: {
    command: 'node e2e/serve.mjs',
    port,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(port) },
  },
})
