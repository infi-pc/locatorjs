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
    // for manifest v2:
    // let [background] = context.backgroundPages();
    // if (!background) background = await context.waitForEvent("backgroundpage");

    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

test("react", async ({ page }) => {
  await page.goto(projects.react);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  //   let wentToLink = false;
  //   await page.route("vscode://*", (route) => {
  //     route.abort();
  //     wentToLink = true;
  //   });

  //   await locateElement(page, "text=Hello Vite + React!");

  //   expect(wentToLink).toBe(true);
  //   const initialButton = page.locator("button >> text=Go to code");
  //   await expect(initialButton).toBeVisible();
});

test("svelte", async ({ page }) => {
  await page.goto(projects.svelte);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Vite + Svelte");

  const initialButton = page.locator("button >> text=Go to code");
  await expect(initialButton).toBeVisible();

  //   await page.pause();
});

// test("popup page", async ({ page, extensionId }) => {
//   await page.goto(`chrome-extension://${extensionId}/popup.html`);
//   await expect(page.locator("body")).toHaveText("my-extension popup");
// });
