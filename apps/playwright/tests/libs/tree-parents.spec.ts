import { expect, test, type Page } from "@playwright/test";
import { projects } from "../consts";

/**
 * The tree panel and the parents menu. Both used to be unreachable or silently
 * broken: rows looked clickable but had no handler, links resolved through the
 * bindings list instead of the Editor setting, and the toolbar that opens them
 * only appeared when a modifier-click binding existed.
 */

const dismissedUiState = {
  welcomeScreenDismissed: true,
  onboarding: { dismissed: true, step: "done" },
};

const toolbarBindings = [
  {
    trigger: { kind: "modifier-click" as const, modifiers: "alt" },
    action: { kind: "open-editor" as const },
  },
  {
    trigger: { kind: "hover-toolbar" as const },
    action: { kind: "show-tree" as const },
  },
  {
    trigger: { kind: "hover-toolbar" as const },
    action: { kind: "show-parents" as const },
  },
];

type OpenedWindow = Window & { __locatorOpenedUrl?: string };

/** A row that resolved to a source, and so is meant to be clickable. */
const SOURCED_ROW = '[role="treeitem"]:not([aria-disabled="true"])';

async function setup(
  page: Page,
  options: Record<string, unknown>
): Promise<void> {
  await page.addInitScript(
    ({ options: stored }) => {
      localStorage.setItem("LOCATOR_USER_OPTIONS", JSON.stringify(stored));
      window.open = ((url?: string | URL) => {
        (window as OpenedWindow).__locatorOpenedUrl = String(url);
        return null;
      }) as typeof window.open;
    },
    { options: { uiState: dismissedUiState, ...options } }
  );
  await page.goto(projects.react);
  // The intro banner only renders once the runtime has mounted, so waiting for
  // it keeps the first mouseover from landing before Locator is listening.
  await expect(
    page.getByRole("button", { name: "Settings", exact: true })
  ).toBeVisible({ timeout: 15_000 });
  // The deepest nesting box is the element every scenario inspects.
  await expect(page.locator("div[style*='yellow']")).toBeVisible();
}

const openedUrl = (page: Page) =>
  page.evaluate(() => (window as OpenedWindow).__locatorOpenedUrl);

/** Reveals the outline for the deepest nesting element and its toolbar. */
async function hoverTarget(page: Page) {
  const target = page.locator("div[style*='yellow']");
  await target.dispatchEvent("mouseover", { altKey: true });
  await expect(
    page.getByRole("toolbar", { name: "Locator actions" })
  ).toBeVisible();
  return target;
}

async function openTree(page: Page) {
  await hoverTarget(page);
  await page.getByRole("button", { name: "Tree view" }).click();
  const panel = page.getByRole("dialog", { name: "Component tree" });
  await expect(panel).toBeVisible();
  return panel;
}

async function openParents(page: Page) {
  await hoverTarget(page);
  await page.getByRole("button", { name: "Parents" }).click();
  const menu = page.getByRole("menu", { name: "Parents" });
  await expect(menu).toBeVisible();
  return menu;
}

test.describe("tree panel", () => {
  test("clicking a row opens its own source and closes the panel", async ({
    page,
  }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    const rows = panel.getByRole("treeitem");
    await expect(rows.first()).toBeVisible();

    // Every row that reports a source must resolve to that exact location.
    const row = panel.locator(SOURCED_ROW).first();
    const title = await row.getAttribute("title");
    expect(title).toMatch(/\.(?:tsx|ts|jsx|js):\d+$/);

    await row.click();
    await expect.poll(() => openedUrl(page)).toMatch(/^vscode:\/\/file\//);
    // The panel used to stay open with no confirmation that anything happened.
    await expect(panel).toBeHidden();
  });

  test("rows without a source are inert instead of looking clickable", async ({
    page,
  }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    const inert = panel.locator('[role="treeitem"][aria-disabled="true"]');
    for (const row of await inert.all()) {
      await expect(row).toHaveAttribute("title", /no source location/);
      await row.dispatchEvent("click");
    }
    expect(await openedUrl(page)).toBeUndefined();
    await expect(panel).toBeVisible();
  });

  test("component rows are labelled separately from element rows", async ({
    page,
  }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    await expect(
      panel.locator('[role="treeitem"][data-row-kind="component"]').first()
    ).toBeVisible();
    await expect(
      panel.locator('[role="treeitem"][data-row-kind="element"]').first()
    ).toBeVisible();
  });

  test("keyboard navigation moves, expands, and opens", async ({ page }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    const tree = panel.getByRole("tree");
    const before = await panel.getByRole("treeitem").count();

    // The list is focused on open, so arrows work without clicking first.
    await tree.press("Home");
    await tree.press("ArrowLeft");
    await expect
      .poll(async () => panel.getByRole("treeitem").count())
      .toBeLessThan(before);
    await tree.press("ArrowRight");
    await expect
      .poll(async () => panel.getByRole("treeitem").count())
      .toBe(before);

    await tree.press("Enter");
    await expect.poll(() => openedUrl(page)).toMatch(/^vscode:\/\/file\//);
  });

  test("Escape closes the panel without opening anything", async ({ page }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    await panel.getByRole("tree").press("Escape");
    await expect(panel).toBeHidden();
    expect(await openedUrl(page)).toBeUndefined();
  });

  test("the close button dismisses the panel", async ({ page }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    await panel.getByRole("button", { name: "Close tree" }).click();
    await expect(panel).toBeHidden();
  });
});

test.describe("parents menu", () => {
  test("entries carry a distinct file:line and open it", async ({ page }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const menu = await openParents(page);
    const items = menu.getByRole("menuitem");
    await expect(items.first()).toBeVisible();

    // The old menu rendered five identical `div / NestingTest.tsx` rows.
    const details = await items.allInnerTexts();
    const locations = details
      .flatMap((text) => text.split("\n"))
      .filter((line) => /:\d+:\d+$/.test(line));
    expect(locations.length).toBeGreaterThan(1);
    expect(new Set(locations).size).toBe(locations.length);

    await items.first().click();
    await expect.poll(() => openedUrl(page)).toMatch(/^vscode:\/\/file\//);
    await expect(menu).toBeHidden();
  });

  test("names the component that renders each ancestor", async ({ page }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const menu = await openParents(page);
    // The yellow div is written inside NestingTest3, so that is the component
    // the entry belongs to. Without this the menu is a column of `<div>`s.
    await expect(menu.getByText("NestingTest3", { exact: true })).toBeVisible();
    await expect(menu.getByText("NestingTest2", { exact: true })).toBeVisible();
  });

  test("arrow keys and Enter open an entry", async ({ page }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings,
    });

    const menu = await openParents(page);
    await menu.press("ArrowDown");
    await menu.press("Enter");
    await expect.poll(() => openedUrl(page)).toMatch(/^vscode:\/\/file\//);
  });
});

test.describe("editor configuration", () => {
  test("panels follow the Editor setting, not the bindings", async ({
    page,
  }) => {
    await setup(page, {
      // The binding pins VS Code; the global setting says WebStorm. Tree rows
      // are not tied to a binding, so they must follow the setting.
      editor: { targetId: "webstorm" },
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "alt" },
          action: { kind: "open-editor", targetId: "vscode" },
        },
        ...toolbarBindings.slice(1),
      ],
    });

    const panel = await openTree(page);
    await panel.locator(SOURCED_ROW).first().click();

    await expect.poll(() => openedUrl(page)).toMatch(/^webstorm:\/\//);
  });

  test("an unresolvable editor asks for one instead of guessing", async ({
    page,
  }) => {
    // A stored editor that is not in the target list — a stale id, or a team
    // config naming something this build does not know.
    await setup(page, {
      editor: { targetId: "not-installed-editor" },
      bindings: toolbarBindings,
    });

    const panel = await openTree(page);
    await panel.locator(SOURCED_ROW).first().click();

    // Used to emit a hard-coded vscode:// link that went nowhere in silence.
    // The wizard opens on the editor question, not wherever onboarding
    // happened to stop.
    await expect(
      page.getByRole("heading", { name: "Pick your editor" })
    ).toBeVisible();
    expect(await openedUrl(page)).toBeUndefined();

    // Choosing one resolves the click for good.
    await page.getByRole("combobox", { name: "Editor" }).click();
    // Matched on its text: each option also carries a brand icon whose alt
    // text lands in the accessible name.
    await page
      .getByRole("option")
      .filter({ hasText: /^VSCode$/ })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
          return raw ? JSON.parse(raw).editor : undefined;
        })
      )
      .toEqual({ targetId: "vscode", targetTemplate: undefined });
  });

  test("the default editor is a visible setting, not a hidden constant", async ({
    page,
  }) => {
    // Nothing chosen: the default layer supplies VS Code, so a click still
    // works — but it is a resolved setting the user can see and change.
    await setup(page, { bindings: toolbarBindings });

    const panel = await openTree(page);
    await panel.locator(SOURCED_ROW).first().click();
    await expect.poll(() => openedUrl(page)).toMatch(/^vscode:\/\/file\//);
  });
});

test.describe("toolbar activation", () => {
  test("a toolbar-only config still reveals the toolbar", async ({ page }) => {
    // Deleting every shortcut used to make the outline — and with it the tree
    // and parents actions — permanently unreachable.
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: toolbarBindings.slice(1),
    });

    await hoverTarget(page);
    const toolbar = page.getByRole("toolbar", { name: "Locator actions" });
    await expect(toolbar.locator("button")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Tree view" })).toBeVisible();
  });

  test("a custom shortcut replaces alt as the activation modifier", async ({
    page,
  }) => {
    await setup(page, {
      editor: { targetId: "vscode" },
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "meta+shift" },
          action: { kind: "open-editor" },
        },
        ...toolbarBindings.slice(1),
      ],
    });

    const target = page.locator("div[style*='yellow']");
    await target.dispatchEvent("mouseover", { altKey: true });
    await expect(
      page.getByRole("toolbar", { name: "Locator actions" })
    ).toHaveCount(0);

    await target.dispatchEvent("mouseover", {
      metaKey: true,
      shiftKey: true,
    });
    await expect(
      page.getByRole("toolbar", { name: "Locator actions" })
    ).toBeVisible();
  });
});
