import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;

/**
 * These tests exist for one narrow reason: the bugs this app actually shipped
 * were browser behaviours that are invisible on a desktop with a mouse, and that
 * reading the code will not catch. A touchscreen replaying every tap as a phantom
 * mouse click; a finished CSS animation restarting when the browser re-inserts
 * its node. Both need a real engine with real touch input to observe, so the
 * phone project — not the desktop one — is where the value is.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'phone',
      testDir: './tests/phone',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop',
      testDir: './tests/desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
