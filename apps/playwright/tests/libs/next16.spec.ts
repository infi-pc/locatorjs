import { test, expect, Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";
import { expectLocatorReady } from "../activateLocator";

const ASYNC_TIMEOUT = 15_000;

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

type ResolvedSource = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
};

async function configureEditor(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "LOCATOR_USER_OPTIONS",
      JSON.stringify({
        editor: { targetId: "vscode" },
        uiState: {
          welcomeScreenDismissed: true,
          onboarding: { dismissed: true, step: "done" },
        },
      })
    );
    window.open = ((url?: string | URL) => {
      (window as Window & { __locatorOpenedUrl?: string }).__locatorOpenedUrl =
        String(url);
      return null;
    }) as typeof window.open;
  });
}

async function getLastResolvedSource(
  page: Page
): Promise<ResolvedSource | null> {
  const history = await page.evaluate(
    () => (window as any).__LOCATORJS_DEBUG_HISTORY__
  );
  if (!Array.isArray(history)) return null;
  const withSource = history.filter((h: any) => h?.source?.fileName);
  if (withSource.length === 0) return null;
  return withSource[withSource.length - 1].source as ResolvedSource;
}

// Permissive assertion: file is resolved to somewhere in the app's source tree
// (not node_modules / framework internals). Browser-specific _debugOwner traversal
// means the exact file (page.tsx vs components/Card.tsx) varies, so we only
// verify the resolver stayed within the user's code.
async function expectFileInAppSource(page: Page, appPath: RegExp) {
  await expect
    .poll(
      () => getLastResolvedSource(page).then((source) => source?.fileName),
      {
        timeout: ASYNC_TIMEOUT,
      }
    )
    .toMatch(appPath);
}

async function expectExactUserSource(
  page: Page,
  expected: { file: RegExp; line: number }
) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as Window & { __locatorOpenedUrl?: string })
              .__locatorOpenedUrl
        ),
      { timeout: ASYNC_TIMEOUT }
    )
    .toMatch(/\.tsx:\d+:\d+$/);

  const openedUrl = await page.evaluate(
    () =>
      (window as Window & { __locatorOpenedUrl?: string }).__locatorOpenedUrl ??
      ""
  );
  expect(openedUrl).not.toMatch(
    /(?:node_modules|webpack-internal:|react-jsx-dev-runtime|\/_next\/|\/\.next\/)/
  );
  expect(decodeURIComponent(openedUrl).replace(/:\d+:\d+$/, "")).toMatch(
    expected.file
  );
  expect(openedUrl).toMatch(new RegExp(`:${expected.line}:\\d+$`));
}

test.describe("Next.js 16 + Webpack (React 19)", () => {
  test("heading", async ({ page }) => {
    await configureEditor(page);
    await page.goto(projects.next16);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "text=To get started");

    await expectExactUserSource(page, {
      file: /test-apps\/next-16\/app\/page\.tsx$/,
      line: 8,
    });
  });

  test("anchor element", async ({ page }) => {
    await configureEditor(page);
    await page.goto(projects.next16);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "text=Deploy Now");

    await expectExactUserSource(page, {
      file: /test-apps\/next-16\/app\/page\.tsx$/,
      line: 30,
    });
  });
});

test.describe("Next.js 16 + Turbopack (React 19, no webpack-loader)", () => {
  test("client component - Counter button", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "button >> text=-");

    await expectWelcome(page);
    await expectFileInAppSource(page, /test-apps\/next-16-turbopack\/app\//);
  });

  test("wrapper component - Card title", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "text=Counter Component");

    await expectWelcome(page);
    await expectFileInAppSource(page, /test-apps\/next-16-turbopack\/app\//);
  });

  test("native element with id", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "#test-div");

    await expectWelcome(page);
    await expectFileInAppSource(page, /test-apps\/next-16-turbopack\/app\//);
  });

  test("native element with className", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, ".test-class");

    await expectWelcome(page);
    await expectFileInAppSource(page, /test-apps\/next-16-turbopack\/app\//);
  });

  test("server component heading", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "text=React 19 + Turbopack");

    await expectWelcome(page);
    await expectFileInAppSource(page, /test-apps\/next-16-turbopack\/app\//);
  });

  test("nested text element", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await enableDebug(page);

    await locateElement(page, "text=Nested span inside a div");

    await expectWelcome(page);
    await expectFileInAppSource(page, /test-apps\/next-16-turbopack\/app\//);
  });
});

test.describe("Turbopack debug diagnostics", () => {
  test("pointer movement does not cancel an accepted click", async ({
    page,
  }) => {
    await configureEditor(page);
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);
    await page.evaluate(() => {
      window.open = ((url?: string | URL) => {
        (
          window as Window & { __locatorOpenedUrl?: string }
        ).__locatorOpenedUrl = String(url);
        return null;
      }) as typeof window.open;
    });

    const target = page.getByRole("button", { name: "-", exact: true });
    await target.dispatchEvent("mouseover", { altKey: true });
    await target.dispatchEvent("click", { altKey: true });
    await page
      .getByText("Counter Component")
      .dispatchEvent("mouseover", { altKey: true });

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              (window as Window & { __locatorOpenedUrl?: string })
                .__locatorOpenedUrl
          ),
        { timeout: ASYNC_TIMEOUT }
      )
      .toMatch(/test-apps\/next-16-turbopack\/app\/.*\.tsx:\d+:\d+$/);
  });

  test("debug history tracks async resolution", async ({ page }) => {
    await page.goto(projects.next16Turbopack);
    await expectLocatorReady(page);

    await enableDebug(page);

    await locateElement(page, "button >> text=-");

    await expectWelcome(page);

    // Some browser ordering returns Counter.tsx as the first async entry, others
    // return a parent fiber (page.tsx) first. What matters is that async
    // resolution produced *some* entry for a file inside the app source tree.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const history = (window as any).__LOCATORJS_DEBUG_HISTORY__;
            if (!Array.isArray(history)) return undefined;
            return history.find(
              (h: any) =>
                h.async === true &&
                h.source?.fileName?.match(/test-apps\/next-16-turbopack\/app\//)
            );
          }),
        { timeout: ASYNC_TIMEOUT }
      )
      .toBeTruthy();
  });
});
