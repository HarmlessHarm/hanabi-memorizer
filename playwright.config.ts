import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;

/**
 * 20:9 — the aspect ratio most phones sold in the last few years have, and the
 * shape this app is actually held in. Playwright's own Pixel 7 descriptor is
 * 412x839 (2.04:1) and its landscape 863x360 (2.4:1); neither is what a player
 * is looking at, and the layout sizes cards against both axes, so the ratio is
 * the part that matters. Keep the device's touch/mobile flags, pin the viewport.
 */
const PHONE = { width: 412, height: 916 };
const PHONE_LANDSCAPE = { width: 916, height: 412 };

/**
 * These tests exist for one narrow reason: the bugs this app actually shipped
 * were browser behaviours that are invisible on a desktop with a mouse, and that
 * reading the code will not catch. A touchscreen replaying every tap as a phantom
 * mouse click; a finished CSS animation restarting when the browser re-inserts
 * its node. Both need a real engine with real touch input to observe, so the
 * phone projects — not the desktop one — are where the value is.
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
      use: { ...devices['Pixel 7'], viewport: PHONE },
    },
    {
      name: 'phone-landscape',
      testDir: './tests/landscape',
      use: { ...devices['Pixel 7 landscape'], viewport: PHONE_LANDSCAPE },
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
