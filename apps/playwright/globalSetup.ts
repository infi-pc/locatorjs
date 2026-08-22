import { chromium, type FullConfig } from "@playwright/test";

/**
 * Warm every app's module graph before the suite runs.
 *
 * Cold-start is the flake floor here. Waiting on a URL only proves the dev
 * server can serve index.html; a Vite dev server transforms the JS module
 * graph lazily, on the requests the *browser* makes afterwards. The first test
 * to visit an app therefore pays the whole transform, and on a CI runner the
 * solid app reliably exceeded expectLocatorReady's 15s budget — then passed on
 * retry in ~5s, once warm.
 *
 * Loading each app in a real browser once forces that transform to happen here
 * instead of inside the first assertion. The cost is paid either way; this just
 * moves it somewhere that cannot fail a test.
 *
 * Best-effort by design: a warm-up miss logs and moves on. This must never be
 * the reason a run goes red.
 */
async function globalSetup(config: FullConfig) {
  // webServer is a single object or an array depending on how it was declared.
  const servers = config.webServer
    ? [config.webServer].flat()
    : ([] as { url?: string }[]);
  const urls = servers
    .map((server) => server.url)
    .filter((url): url is string => typeof url === "string");

  if (urls.length === 0) return;

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    // Cannot launch a browser: nothing to warm, but the suite may still be
    // runnable, so let it try rather than failing the whole run here.
    console.info(`[warm-up] skipped, browser launch failed: ${error}`);
    return;
  }

  const started = Date.now();
  let warmed = 0;
  try {
    await Promise.all(
      urls.map(async (url) => {
        const page = await browser.newPage();
        try {
          await page.goto(url, { waitUntil: "load", timeout: 90_000 });
          // The runtime mounting is what the specs actually wait on, so wait
          // for the same signal rather than a bare load event.
          await page
            .getByRole("button", { name: "Settings", exact: true })
            .first()
            .waitFor({ state: "attached", timeout: 60_000 });
          warmed += 1;
        } catch (error) {
          // react-clean and svelte-clean intentionally ship no runtime, so the
          // Settings button never appears there. Their page load still warmed
          // the graph, which is the point.
          console.info(
            `[warm-up] ${url}: ${
              error instanceof Error
                ? error.message.split("\n")[0]
                : String(error)
            }`
          );
        } finally {
          await page.close();
        }
      })
    );
  } finally {
    await browser.close();
    console.info(
      `[warm-up] ${warmed}/${urls.length} apps ready in ${Math.round(
        (Date.now() - started) / 1000
      )}s`
    );
  }
}

export default globalSetup;
