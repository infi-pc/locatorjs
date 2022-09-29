import { test, expect } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

test("web", async ({ page }) => {
  await page.goto(projects.web);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Click on a component to go to its code");

  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});

test("react - jsx", async ({ page }) => {
  await page.goto(projects.react);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Hello Vite + React!");

  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});

test("preact", async ({ page }) => {
  await page.goto(projects.preact);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Vite + Preact");

  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});

test("solid", async ({ page }) => {
  await page.goto(projects.solid);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=save to reload");

  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});

test("svelte", async ({ page }) => {
  await page.goto(projects.svelte);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Vite + Svelte");

  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});

test("react - clean: should now have Locator", async ({ page }) => {
  await page.goto(projects.reactClean);
  const getStarted = page.locator("text=Go to component code with");
  expect(await getStarted.count()).toBe(0);

  await locateElement(page, "text=Vite + React");

  const initialButton = page.locator("button >> text=Confirm");
  expect(await initialButton.count()).toBe(0);
});

test("vue", async ({ page }) => {
  await page.goto(projects.vue);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Vite + Vue");

  const initialButton = page.locator("button >> text=Confirm");
  await expect(initialButton).toBeVisible();
});
