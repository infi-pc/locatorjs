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
  /* Warms every app's module graph so the first test does not pay for it. */
  globalSetup: "./globalSetup.ts",
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
  /**
   * One worker per shard on CI. These specs share dev servers and mutate
   * global settings (see settings.spec.ts), so running them concurrently
   * against the same server is not safe. CI parallelism comes from sharding
   * instead: each shard is a separate job with its own dev servers, so the
   * isolation holds.
   */
  workers: process.env.CI ? 1 : undefined,
  /**
   * On CI: `github` annotates the failing lines directly in the PR, `list`
   * puts the failure in the job log (previously the html reporter was the
   * only one, so the log said nothing and you had to download an artifact to
   * learn which test broke), and `blob` is what makes shard merging possible.
   */
  reporter: process.env.CI
    ? [["github"], ["list"], ["blob"]]
    : [["html", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
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
   * `url` rather than `port` is load-bearing. `port` only waits for a TCP
   * listener, and vite listens before it has transformed anything, so the first
   * test to reach an app raced its initial compile. The bash port-wait loop
   * this replaced happened to curl every port, which warmed them by accident;
   * dropping it made that race visible as flakes in basics.spec.ts (once per
   * shard, since each shard boots its own servers). `url` makes Playwright
   * issue real HTTP GETs until one succeeds, restoring the warm-up as a
   * deliberate part of readiness rather than a side effect.
   *
   * Ports also live in test-apps/<app>/package.json and in tests/consts.ts.
   * See scripts/dev-ports.sh for the shared source.
   */
  webServer: [
    ["@locator/web", "PORT_WEB", 3342],
    ["@locator/vite-react-project", "PORT_REACT", 3343],
    ["vite-solid-project", "PORT_SOLID", 3345],
    ["vite-preact-project", "PORT_PREACT", 3346],
    ["vite-svelte-project", "PORT_SVELTE", 3347],
    ["vite-react-clean-project", "PORT_REACT_CLEAN", 3348],
    ["vite-svelte-clean-project", "PORT_SVELTE_CLEAN", 3349],
    ["vite-vue-project", "PORT_VUE", 3350],
    ["next-16", "PORT_NEXT_16", 3352],
    ["next-16-turbopack", "PORT_NEXT_16_TURBO", 3353],
  ]
    .map(([pkg, envVar, fallback]) => ({
      command: `pnpm --filter ${pkg} dev`,
      url: `http://localhost:${process.env[envVar as string] ?? fallback}/`,
    }))
    .map((server) => ({
      ...server,
      reuseExistingServer: !process.env.CI,
      // The Next apps cold-compile on first request; be generous.
      timeout: 120_000,
      stdout: "pipe" as const,
      stderr: "pipe" as const,
    })),
};

export default config;
