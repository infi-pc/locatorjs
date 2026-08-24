/* eslint-disable no-empty-pattern -- Playwright fixtures must be destructured to select the configured project. */
import {
  test as base,
  expect,
  BrowserContext,
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
        callback: (result: { userOptions?: { debugMode?: boolean } }) => void
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

test("react", async ({ page }) => {
  await page.goto(projects.reactClean);

  await page.keyboard.down("Alt");
  await page.mouse.move(100, 100);
  const headline = page.locator("text=Vite + React");
  await headline.hover();

  const locatorLogo = page.locator("a[title=LocatorJS]");
  await expect(locatorLogo).toBeVisible();

  //   expect(wentToLink).toBe(true);
  //   const initialButton = page.locator("button >> text=Confirm");
  //   await expect(initialButton).toBeVisible();
});

test("svelte", async ({ page }) => {
  await page.goto(projects.svelteClean);

  await page.keyboard.down("Alt");
  const headline = page.locator("text=Vite + Svelte");
  await headline.hover();

  const locatorLogo = page.locator("a[title=LocatorJS]");
  await expect(locatorLogo).toBeVisible();

  await locateElement(page, "text=Vite + Svelte");
  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});

test("popup renders layer tabs and persists an extension setting", async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.getByRole("button", { name: "Settings" }).first().click();
  const extensionTab = page.getByRole("tab", { name: /Extension/ });
  const originTab = page.getByRole("tab", { name: /This origin/ });

  await expect(extensionTab).toHaveAttribute("aria-selected", "true");
  await expect(originTab).toBeDisabled();

  const debugMode = page.getByRole("checkbox", { name: "Debug mode" });
  await debugMode.locator("..").click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean | undefined>((resolve) => {
            chrome.storage.local.get(["userOptions"], (result) => {
              resolve(result.userOptions?.debugMode);
            });
          })
      )
    )
    .toBe(true);
});
