import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

const ASYNC_TIMEOUT = 15_000;

async function enableDebug(page: Page) {
  await page.evaluate(() => {
    (window as any).__LOCATORJS_DEBUG__ = true;
    (window as any).__LOCATORJS_DEBUG_HISTORY__ = [];
  });
}

async function getLastResolvedFile(page: Page): Promise<string | null> {
  const history = await page.evaluate(
    () => (window as any).__LOCATORJS_DEBUG_HISTORY__
  );
  if (!Array.isArray(history)) return null;
  const withSource = history.filter((h: any) => h?.source?.fileName);
  if (withSource.length === 0) return null;
  return withSource[withSource.length - 1].source.fileName as string;
}

// Permissive assertion: file is resolved to somewhere in the app's source tree
// (not node_modules / framework internals). Browser-specific _debugOwner traversal
// means the exact file (page.tsx vs components/Card.tsx) varies, so we only
// verify the resolver stayed within the user's code.
function expectFileInAppSource(file: string | null, appPath: RegExp): void {
  expect(file).not.toBeNull();
  expect(file!).toMatch(appPath);
}

test.describe("Next.js 16 + Webpack (React 19)", () => {
  test("heading", async ({ page }) => {
    await page.goto(projects.next16);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=To get started");

    await expect(page.locator("button >> text=Confirm")).toBeVisible();
  });

  test("anchor element", async ({ page }) => {
    await page.goto(projects.next16);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=Deploy Now");

    await expect(page.locator("button >> text=Confirm")).toBeVisible();
  });
});

test.describe("Next.js 16 + Turbopack (React 19, no webpack-loader)", () => {
  test("client component - Counter button", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "button >> text=-");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /apps\/next-16-turbopack\/app\//);
  });

  test("wrapper component - Card title", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=Counter Component");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /apps\/next-16-turbopack\/app\//);
  });

  test("native element with id", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "#test-div");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /apps\/next-16-turbopack\/app\//);
  });

  test("native element with className", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, ".test-class");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /apps\/next-16-turbopack\/app\//);
  });

  test("server component heading", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=React 19 + Turbopack");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
  });

  test("nested text element", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await locateElement(page, "text=Nested span inside a div");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /apps\/next-16-turbopack\/app\//);
  });
});

test.describe("Turbopack debug diagnostics", () => {
  test("debug history tracks async resolution", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expect(page.locator("text=Go to component code with")).toBeVisible();

    await enableDebug(page);

    await locateElement(page, "button >> text=-");

    await expect(page.locator("button >> text=Confirm")).toBeVisible({
      timeout: ASYNC_TIMEOUT,
    });

    const history = await page.evaluate(
      () => (window as any).__LOCATORJS_DEBUG_HISTORY__
    );
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);

    // Some browser ordering returns Counter.tsx as the first async entry, others
    // return a parent fiber (page.tsx) first. What matters is that async
    // resolution produced *some* entry for a file inside the app source tree.
    const asyncAppEntry = history.find(
      (h: any) =>
        h.async === true &&
        h.source?.fileName?.match(/apps\/next-16-turbopack\/app\//)
    );
    expect(asyncAppEntry).toBeTruthy();
  });
});
