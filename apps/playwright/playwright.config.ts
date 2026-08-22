import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: "./tests",
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /**
   * Every server the suite needs, in one place.
   *
   * This used to list only the four Next.js apps, leaving the rest to be
   * started by `pnpm dev` / `pnpm test-apps:dev` and waited on by a bash
   * port-loop in the CI workflow. That split meant three owners of server
   * startup and two port lists that had already drifted apart. Playwright
   * boots these in parallel, waits for each URL itself, and pipes their
   * output, so a server that dies during startup reports its own error
   * instead of surfacing as an anonymous 60s timeout.
   *
   * `reuseExistingServer` is off on CI (nothing is running, so a stray
   * listener means something is wrong) and on locally, so an already-running
   * `pnpm dev` is reused rather than fought over.
   *
   * Ports also live in test-apps/<app>/package.json and in tests/consts.ts.
   * See scripts/dev-ports.sh for the shared source.
   */
  webServer: [
    { command: "pnpm --filter @locator/web dev", port: 3342 },
    { command: "pnpm --filter @locator/vite-react-project dev", port: 3343 },
    { command: "pnpm --filter vite-solid-project dev", port: 3345 },
    { command: "pnpm --filter vite-preact-project dev", port: 3346 },
    { command: "pnpm --filter vite-svelte-project dev", port: 3347 },
    { command: "pnpm --filter vite-react-clean-project dev", port: 3348 },
    { command: "pnpm --filter vite-svelte-clean-project dev", port: 3349 },
    { command: "pnpm --filter vite-vue-project dev", port: 3350 },
    { command: "pnpm --filter next-16 dev", port: 3352 },
    { command: "pnpm --filter next-16-turbopack dev", port: 3353 },
  ].map((server) => ({
    ...server,
    reuseExistingServer: !process.env.CI,
    // The Next apps cold-compile on first request; be generous.
    timeout: 120_000,
    stdout: "pipe" as const,
    stderr: "pipe" as const,
  })),
};

export default config;
