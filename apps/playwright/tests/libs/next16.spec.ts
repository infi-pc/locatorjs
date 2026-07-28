import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

const ASYNC_TIMEOUT = 15_000;

async function expectLocatorReady(page: Page) {
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }).first()
  ).toBeAttached({ timeout: ASYNC_TIMEOUT });
}

async function expectWelcome(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Welcome to Locator" })
  ).toBeVisible({ timeout: ASYNC_TIMEOUT });
}

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
    await expectLocatorReady(page);

    await locateElement(page, "text=To get started");

    await expectWelcome(page);
  });

  test("anchor element", async ({ page }) => {
    await page.goto(projects.next16);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, "text=Deploy Now");

    await expectWelcome(page);
  });
});

test.describe("Next.js 16 + Turbopack (React 19, no webpack-loader)", () => {
  test("client component - Counter button", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, "button >> text=-");

    await expectWelcome(page);
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /test-apps\/next-16-turbopack\/app\//);
  });

  test("wrapper component - Card title", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, "text=Counter Component");

    await expectWelcome(page);
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /test-apps\/next-16-turbopack\/app\//);
  });

  test("native element with id", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, "#test-div");

    await expectWelcome(page);
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /test-apps\/next-16-turbopack\/app\//);
  });

  test("native element with className", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, ".test-class");

    await expectWelcome(page);
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /test-apps\/next-16-turbopack\/app\//);
  });

  test("server component heading", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, "text=React 19 + Turbopack");

    await expectWelcome(page);
  });

  test("nested text element", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await enableDebug(page);
    await expectLocatorReady(page);

    await locateElement(page, "text=Nested span inside a div");

    await expectWelcome(page);
    const file = await getLastResolvedFile(page);
    expectFileInAppSource(file, /test-apps\/next-16-turbopack\/app\//);
  });
});

test.describe("Turbopack debug diagnostics", () => {
  test("debug history tracks async resolution", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);

    await enableDebug(page);

    await locateElement(page, "button >> text=-");

    await expectWelcome(page);

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
        h.source?.fileName?.match(/test-apps\/next-16-turbopack\/app\//)
    );
    expect(asyncAppEntry).toBeTruthy();
  });
});
