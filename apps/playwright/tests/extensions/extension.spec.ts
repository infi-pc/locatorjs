/* eslint-disable no-empty-pattern */
import {
  test as base,
  expect,
  BrowserContext,
  chromium,
} from "@playwright/test";
import * as path from "path";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

export const test = base.extend<{
  context: BrowserContext;
  // extensionId: string;
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
  // extensionId: async ({ context }, use) => {
  //   // for manifest v2:
  //   // let [background] = context.backgroundPages();
  //   // if (!background) background = await context.waitForEvent("backgroundpage");

  //   // for manifest v3:
  //   let [background] = context.serviceWorkers();
  //   if (!background) background = await context.waitForEvent("serviceworker");

  //   const extensionId = background.url().split("/")[2];
  //   await use(extensionId);
  // },
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

// test("popup page", async ({ page, extensionId }) => {
//   await page.goto(`chrome-extension://${extensionId}/popup.html`);
//   await expect(page.locator("body")).toHaveText("my-extension popup");
// });
