import { defineConfig, devices } from '@playwright/test'

// End-to-end tests, `npm run test:e2e`: the client as `npm run dev:docker`
// serves it, against the local network that e2e/network.ts starts.
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/network.ts',
  globalTeardown: './e2e/coverage-report.ts',
  webServer: {
    command: 'npm run dev:docker',
    // The loopback OAuth client only works on 127.0.0.1 (src/auth/oauth-client.ts).
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    // Instrumented, so the tests' coverage reaches Sonar (e2e/coverage.ts).
    env: { VITE_COVERAGE: 'true' },
  },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'dot' : 'list',
})
