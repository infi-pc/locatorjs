/* eslint-disable no-empty-pattern -- Playwright fixtures must be destructured to select the configured project. */
import {
  test as base,
  expect,
  BrowserContext,
  Locator,
  Page,
  chromium,
} from "@playwright/test";
import * as path from "path";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

/**
 * `chrome` exists only in the extension's page context, which is where the
 * page.evaluate callbacks below actually run. Declare the sliver this spec
 * touches instead of pulling in all of @types/chrome.
 */
declare const chrome: {
  storage: {
    local: {
      get(
        keys: string[],
        callback: (result: {
          userConfig?: { version?: number; layer?: { debugMode?: boolean } };
        }) => void
      ): void;
    };
  };
};

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(
      __dirname,
      "../../../extension/build/production_chrome"
    );

    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

// Persistent extension profiles and their service workers are process-level
// resources in Chromium. Running several of them concurrently can close a
// sibling test's page while its extension worker is still starting.
test.describe.configure({ mode: "serial" });

async function activateLocator(page: Page, target: Locator) {
  const locatorLogo = page.locator("a[title=LocatorJS]");

  try {
    await expect
      .poll(
        async () => {
          // The extension may still be waiting for the framework hook when the
          // page first renders. Replay the real activation gesture so a keydown
          // that predates content-script setup does not make this test flaky.
          await page.keyboard.up("Alt");
          await page.keyboard.down("Alt");
          await target.hover();
          return locatorLogo.isVisible();
        },
        { timeout: 15_000 }
      )
      .toBe(true);
  } catch (error) {
    const hookStatus = await page.evaluate(
      () => document.head.dataset.locatorHookStatusMessage ?? "not reported"
    );
    throw new Error(`Locator did not activate. Hook status: ${hookStatus}`, {
      cause: error,
    });
  }
}

test("react", async ({ page }) => {
  await page.goto(projects.reactClean);

  const headline = page.locator("text=Vite + React");
  await activateLocator(page, headline);

  //   expect(wentToLink).toBe(true);
  //   const initialButton = page.locator("button >> text=Confirm");
  //   await expect(initialButton).toBeVisible();
});

test("svelte", async ({ page }) => {
  await page.goto(projects.svelteClean);

  const headline = page.locator("text=Vite + Svelte");
  await activateLocator(page, headline);

  await locateElement(page, "text=Vite + Svelte");
  await expect(
    page.getByRole("heading", { name: "Welcome to Locator" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
});

test("popup renders scopes and persists an extension setting", async ({
  page,
  extensionId,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  const settingsScope = page.getByRole("combobox", {
    name: "Settings scope",
  });
  try {
    await expect(settingsScope).toBeVisible({ timeout: 10_000 });
  } catch (error) {
    const bodyText = (await page.locator("body").innerText()).slice(0, 500);
    throw new Error(
      `Popup did not render at ${page.url()}. Page errors: ${
        pageErrors.join(" | ") || "none"
      }. Body: ${bodyText || "empty"}`,
      { cause: error }
    );
  }
  await expect(settingsScope).toContainText("All sites");
  await settingsScope.click();
  await expect(page.getByRole("option", { name: "This site" })).toBeDisabled();
  await page.keyboard.press("Escape");

  await page.locator('[aria-label="Settings menu"]').click();
  await page.getByRole("button", { name: "Advanced settings" }).click();
  await page.locator("summary", { hasText: "Diagnostics" }).click();

  const debugMode = page.getByRole("checkbox", { name: "Debug mode" });
  await debugMode.locator("..").click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean | undefined>((resolve) => {
            chrome.storage.local.get(["userConfig"], (result) => {
              resolve(result.userConfig?.layer?.debugMode);
            });
          })
      )
    )
    .toBe(true);
});
