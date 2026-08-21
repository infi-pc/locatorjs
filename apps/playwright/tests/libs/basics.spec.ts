import { test, expect, type Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

async function expectLocatorReady(page: Page) {
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }).first()
  ).toBeAttached({ timeout: 15_000 });
}

async function expectWelcome(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Welcome to Locator" })
  ).toBeVisible({ timeout: 15_000 });
}

test("web", async ({ page }) => {
  await page.goto(projects.web);
  await expectLocatorReady(page);

  await locateElement(page, "text=Click on a component to go to its code");

  await expectWelcome(page);
});

test("react - jsx", async ({ page }) => {
  await page.goto(projects.react);
  await expectLocatorReady(page);

  await locateElement(page, "text=Hello Vite + React!");

  await expectWelcome(page);
});

test("preact", async ({ page }) => {
  await page.goto(projects.preact);
  await expectLocatorReady(page);

  await locateElement(page, "text=Vite + Preact");

  await expectWelcome(page);
});

test("solid", async ({ page }) => {
  await page.goto(projects.solid);
  await expectLocatorReady(page);

  await locateElement(page, "text=save to reload");

  await expectWelcome(page);
});

test("svelte", async ({ page }) => {
  await page.goto(projects.svelte);
  await expectLocatorReady(page);

  await locateElement(page, "text=Vite + Svelte");

  await expectWelcome(page);
});

test("react - clean: should now have Locator", async ({ page }) => {
  await page.goto(projects.reactClean);
  const getStarted = page.locator("text=Go to component code with");
  expect(await getStarted.count()).toBe(0);

  await locateElement(page, "text=Vite + React");

  await expect(
    page.getByRole("heading", { name: "Welcome to Locator" })
  ).toHaveCount(0);
});

test("vue", async ({ page }) => {
  await page.goto(projects.vue);
  await expectLocatorReady(page);

  await locateElement(page, "text=Vite + Vue");

  await expectWelcome(page);
});
