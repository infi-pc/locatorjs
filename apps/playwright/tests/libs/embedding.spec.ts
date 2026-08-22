import { expect, test, type Frame, type Page } from "@playwright/test";
import { projects } from "../consts";

/**
 * Shadow DOM and iframe coverage.
 *
 * Every case uses the `copy-path` binding so we assert that Locator actually
 * resolved a source location, not just that some overlay flashed.
 */

type CopyWindow = Window & { __locatorCopiedText?: string };

const options = {
  bindings: [
    {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "copy-path" as const },
    },
  ],
  uiState: {
    welcomeScreenDismissed: true,
    onboarding: { dismissed: true, step: "done" },
  },
};

async function preparePage(page: Page) {
  // Runs in every frame, so iframe children get the same stub clipboard.
  await page.addInitScript(
    ({ options }) => {
      localStorage.setItem("LOCATOR_USER_OPTIONS", JSON.stringify(options));
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as CopyWindow).__locatorCopiedText = text;
          },
        },
      });
    },
    { options }
  );
}

async function expectRuntimeReady(target: Page | Frame) {
  // `__LOCATOR_RUNTIME__` appears once the runtime has mounted and its
  // listeners are attached; the wrapper element alone shows up earlier.
  await expect
    .poll(
      () =>
        target.evaluate(
          () =>
            !!(window as Window & { __LOCATOR_RUNTIME__?: unknown })
              .__LOCATOR_RUNTIME__
        ),
      { timeout: 15_000 }
    )
    .toBe(true);
}

async function resetCopied(target: Page | Frame) {
  await target.evaluate(() => {
    delete (window as CopyWindow).__locatorCopiedText;
  });
}

function copied(target: Page | Frame) {
  return target.evaluate(() => (window as CopyWindow).__locatorCopiedText);
}

/** Alt+hover then Alt+click, the way the other lib specs trigger Locator. */
async function altClick(target: Page | Frame, selector: string) {
  const element = target.locator(selector).first();
  await element.dispatchEvent("mouseover", { altKey: true });
  await element.dispatchEvent("click", { altKey: true });
}

/**
 * The layer always holds some chrome (intro badge, banner), so presence of the
 * outline is checked with the marker the outline itself carries.
 */
function outlineVisible(target: Page | Frame) {
  return target.evaluate(
    () =>
      !!document
        .getElementById("locatorjs-wrapper")
        ?.shadowRoot?.querySelector("[data-locatorjs-outline]")
  );
}

test.beforeEach(async ({ page }) => {
  await preparePage(page);
});

test.describe("shadow DOM", () => {
  test("baseline: plain element in the top-level document resolves", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await altClick(page, "text=Top-level document heading");

    await expect.poll(() => copied(page)).toContain("main.tsx");
  });

  test("element inside an eagerly attached open shadow root resolves", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await altClick(page, "text=paragraph in eager open shadow");

    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
  });

  test("element inside a shadow root attached after init resolves", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await page.getByTestId("attach-late-shadow").click();
    await expect(
      page.locator("text=paragraph in late open shadow")
    ).toBeAttached();

    await resetCopied(page);
    await altClick(page, "text=paragraph in late open shadow");

    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
  });

  test("element inside a nested shadow root resolves", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await altClick(page, "text=paragraph in nested open shadow");

    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
  });

  test("element inside a custom element's shadow root resolves", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await altClick(page, "text=paragraph in custom element shadow");

    // Static markup inside the custom element has no source of its own, so
    // Locator should fall back to the nearest annotated ancestor: the host.
    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
  });

  test("slotted light DOM element resolves", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await altClick(page, "text=slotted light dom paragraph");

    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
  });

  test("clicking a shadow host itself resolves the host element", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    const host = page.getByTestId("eager-shadow-host");
    await host.dispatchEvent("mouseover", { altKey: true });
    await host.dispatchEvent("click", { altKey: true });

    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
  });

  test("element inside a closed shadow root resolves", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    // Both shadow roots mount the same component, so the open one tells us the
    // source location the closed one has to produce. Resolving the host instead
    // of the inner paragraph would give a different location.
    await altClick(page, "text=paragraph in eager open shadow");
    await expect.poll(() => copied(page)).toContain("ShadowScenarios.tsx");
    const paragraphSource = await copied(page);

    await page.getByTestId("attach-closed-shadow").click();
    await resetCopied(page);

    // Playwright cannot select through a closed root, so the click goes to the
    // host and Locator has to find the paragraph by pointer position.
    const point = await page.evaluate(() => {
      const root = (window as Window & { __closedShadowRoot?: ShadowRoot })
        .__closedShadowRoot;
      const paragraph = root?.querySelector("p");
      if (!paragraph) throw new Error("closed shadow paragraph not found");
      const box = paragraph.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    const host = page.getByTestId("closed-shadow-host");
    const init = { altKey: true, clientX: point.x, clientY: point.y };
    await host.dispatchEvent("mouseover", init);
    await host.dispatchEvent("click", init);

    await expect.poll(() => copied(page)).toBe(paragraphSource);
  });

  test("hovering inside a shadow root shows the outline", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await page
      .locator("text=paragraph in eager open shadow")
      .first()
      .dispatchEvent("mouseover", { altKey: true });

    await expect.poll(() => outlineVisible(page)).toBe(true);
  });
});

test.describe("iframes", () => {
  function childFrame(page: Page, testId: string) {
    return page.frameLocator(`[data-testid="${testId}"]`);
  }

  test("same-origin child with its own runtime resolves inside the child", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    const frame = page
      .frames()
      .find((f) => f.url().includes("iframe-child.html"));
    expect(frame).toBeTruthy();
    await expectRuntimeReady(frame!);

    await altClick(frame!, "text=iframe child paragraph");

    await expect.poll(() => copied(frame!)).toContain("childMain.tsx");
  });

  test("child overlay stays inside the child document", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await childFrame(page, "iframe-same-origin-runtime")
      .locator("text=iframe child paragraph")
      .first()
      .dispatchEvent("mouseover", { altKey: true });

    // The parent must not draw an outline for something it never hovered.
    expect(await outlineVisible(page)).toBe(false);
  });

  test("iframe without a runtime resolves the iframe element in the parent", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);
    await resetCopied(page);

    const iframe = page.getByTestId("iframe-same-origin-bare");
    await iframe.dispatchEvent("mouseover", { altKey: true });
    await iframe.dispatchEvent("click", { altKey: true });

    await expect.poll(() => copied(page)).toContain("IframeScenarios.tsx");
  });

  test("late-added iframe gets a working runtime", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    await page.getByTestId("add-late-iframe").click();
    await expect(page.getByTestId("iframe-late")).toBeAttached();

    const frame = await expect
      .poll(
        () =>
          page.frames().filter((f) => f.url().includes("iframe-child.html"))
            .length
      )
      .toBeGreaterThan(1)
      .then(() =>
        page.frames().filter((f) => f.url().includes("iframe-child.html"))
      );

    const late = frame[frame.length - 1];
    await expectRuntimeReady(late);
    await altClick(late, "text=iframe child paragraph");

    await expect.poll(() => copied(late)).toContain("childMain.tsx");
  });

  test("nested iframe resolves in the innermost document", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    // The innermost frame is a grandchild: parent -> ?nested=1 -> plain child.
    const outer = page
      .frames()
      .find((f) => f.url().includes("iframe-child.html?nested=1"));
    expect(outer).toBeTruthy();
    const inner = outer!.childFrames()[0];
    expect(inner).toBeTruthy();
    await expectRuntimeReady(inner);

    await altClick(inner, "text=iframe child paragraph");

    await expect.poll(() => copied(inner)).toContain("childMain.tsx");
  });

  test("cross-origin iframe does not break the parent runtime", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.route(/127\.0\.0\.1:\d+\/iframe-child\.html/, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<body><h3>cross origin heading</h3></body>",
      })
    );

    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);
    await resetCopied(page);

    const iframe = page.getByTestId("iframe-cross-origin");
    await iframe.dispatchEvent("mouseover", { altKey: true });
    await iframe.dispatchEvent("click", { altKey: true });

    await expect.poll(() => copied(page)).toContain("IframeScenarios.tsx");
    expect(errors).toEqual([]);
  });

  test("srcdoc iframe element resolves in the parent", async ({ page }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);
    await resetCopied(page);

    const iframe = page.getByTestId("iframe-srcdoc");
    await iframe.dispatchEvent("mouseover", { altKey: true });
    await iframe.dispatchEvent("click", { altKey: true });

    await expect.poll(() => copied(page)).toContain("IframeScenarios.tsx");
  });

  test("modifier held in the parent activates the child overlay", async ({
    page,
  }) => {
    await page.goto(projects.reactEmbedding);
    await expectRuntimeReady(page);

    const frame = page
      .frames()
      .find((f) => f.url().includes("iframe-child.html"));
    expect(frame).toBeTruthy();
    await expectRuntimeReady(frame!);

    // The pointer settles inside the child first, with no modifier held...
    const paragraph = frame!.locator("text=iframe child paragraph").first();
    const box = await paragraph.boundingBox();
    expect(box).not.toBeNull();
    await paragraph.dispatchEvent("mouseover", {
      clientX: box!.x + box!.width / 2,
      clientY: box!.y + box!.height / 2,
    });
    expect(await outlineVisible(frame!)).toBe(false);

    // ...and Alt is pressed afterwards, so only the parent sees the key event.
    await page.keyboard.down("Alt");

    await expect.poll(() => outlineVisible(frame!)).toBe(true);
    await page.keyboard.up("Alt");
  });
});
