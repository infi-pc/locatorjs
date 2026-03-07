import { test, expect } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

const ASYNC_TIMEOUT = 15_000;

test.describe("Next.js 16 + Webpack (React 19)", () => {
  test("heading", async ({ page }) => {
    await page.goto(projects.next16);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=To get started");

    await expect(page.locator("button >> text=Confirm")).toBeVisible();
  });

  test("anchor element", async ({ page }) => {
    await page.goto(projects.next16);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=Deploy Now");

    await expect(page.locator("button >> text=Confirm")).toBeVisible();
  });
});

test.describe("Next.js 16 + Turbopack (React 19, no webpack-loader)", () => {
  test("client component - Counter button", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "button >> text=-");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });

  test("wrapper component - Card title", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=Counter Component");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });

  test("native element with id", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "#test-div");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });

  test("native element with className", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, ".test-class");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });

  test("server component heading", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=React 19 + Turbopack");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });

  test("nested text element", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=Nested span inside a div");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });
});

test.describe("Turbopack debug diagnostics", () => {
  test("debug history tracks async resolution", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await page.evaluate(() => {
      (window as any).__LOCATORJS_DEBUG__ = true;
    });

    await locateElement(page, "button >> text=-");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });

    const history = await page.evaluate(
      () => (window as any).__LOCATORJS_DEBUG_HISTORY__
    );
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    const last = history[history.length - 1];
    expect(last.async).toBe(true);
    expect(last.source).toBeTruthy();
    expect(last.source.fileName).toBeTruthy();
  });
});
