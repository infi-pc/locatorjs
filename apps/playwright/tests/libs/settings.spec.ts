import { expect, test, type Locator, type Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";
import { expectLocatorReady } from "../activateLocator";

async function openSettings(page: Page) {
  await expectLocatorReady(page);
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  const visibleSettings = settings.filter({ visible: true }).first();
  await expect(visibleSettings).toBeVisible({ timeout: 15_000 });
  await visibleSettings.dispatchEvent("click");
  await expect(
    page.getByRole("button", { name: /^Edit action 1:/ })
  ).toBeVisible();
}

async function openAdvanced(page: Page) {
  await page.getByLabel("Settings menu").click();
  await page.getByRole("button", { name: "Advanced settings" }).click();
  await expect(page.getByText("Project path", { exact: true })).toBeVisible();
}

type DrawerScrollHost = HTMLElement & {
  __locatorDrawerScrollState?: { maxScrollLeft: number };
};

async function trackDrawerHostScroll(host: Locator) {
  await host.evaluate((element) => {
    const panel = element as DrawerScrollHost;
    const state = { maxScrollLeft: panel.scrollLeft };
    panel.__locatorDrawerScrollState = state;
    panel.addEventListener("scroll", () => {
      state.maxScrollLeft = Math.max(state.maxScrollLeft, panel.scrollLeft);
    });
  });
}

async function expectDrawerAnimationWithoutHostScroll(
  host: Locator,
  dialog: Locator
) {
  await dialog.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished)
    );
  });
  const maxScrollLeft = await host.evaluate((element) => {
    const panel = element as DrawerScrollHost;
    return panel.__locatorDrawerScrollState?.maxScrollLeft ?? panel.scrollLeft;
  });
  expect(maxScrollLeft).toBe(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto(projects.solid);
});

test("action settings persist editor-owned and advanced origin values", async ({
  page,
}) => {
  await openSettings(page);

  await expect(page.getByRole("heading", { name: "Shortcuts" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hover toolbar" })
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Cards" })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const settingsPanel = page
    .getByRole("button", { name: "Close settings" })
    .locator("xpath=../../..");
  await trackDrawerHostScroll(settingsPanel);

  const firstAction = page.getByRole("button", {
    name: "Edit action 1: Open in editor",
  });
  await expect(firstAction).toHaveAttribute("aria-pressed", "false");
  await firstAction.click();
  await expect(firstAction).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("heading", { name: "Open in editor" })
  ).toBeVisible();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expectDrawerAnimationWithoutHostScroll(settingsPanel, dialog);

  const panelBox = await settingsPanel.boundingBox();
  const drawerBox = await dialog.boundingBox();
  expect(panelBox).not.toBeNull();
  expect(drawerBox).not.toBeNull();
  expect(
    Math.abs(drawerBox!.x + drawerBox!.width - (panelBox!.x + panelBox!.width))
  ).toBeLessThan(2);
  expect(Math.abs(drawerBox!.y - panelBox!.y)).toBeLessThan(2);
  expect(Math.abs(drawerBox!.width - panelBox!.width * 0.8)).toBeLessThan(2);
  expect(Math.abs(drawerBox!.height - panelBox!.height)).toBeLessThanOrEqual(2);
  await expect(
    page.getByText("Live link preview", { exact: true })
  ).toHaveCount(0);

  // Scoped to the drawer: the settings surface also carries the global Editor
  // field, and picking there would change the setting, not this action.
  const editor = dialog.getByRole("combobox", { name: "Editor" });
  await editor.click();
  await page
    .getByRole("option")
    .filter({ hasText: /^WebStorm$/ })
    .click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        const binding = raw ? JSON.parse(raw).bindings?.[0] : undefined;
        return binding?.action?.targetId;
      })
    )
    .toBe("webstorm");

  await page.getByRole("button", { name: "Close interaction editor" }).click();
  await expect(
    page.getByRole("button", { name: "Edit action 1: Open in WebStorm" })
  ).toHaveAttribute("aria-pressed", "false");
  await openAdvanced(page);

  const projectPath = page.getByPlaceholder("/Users/me/project/");
  await projectPath.fill("/tmp/locator-project");
  await projectPath.blur();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        return raw ? JSON.parse(raw).projectPath : undefined;
      })
    )
    .toBe("/tmp/locator-project");

  await page.reload();
  await openSettings(page);
  await openAdvanced(page);
  await expect(page.getByPlaceholder("/Users/me/project/")).toHaveValue(
    "/tmp/locator-project"
  );
});

test("separate trigger sections share action editing and navigation state", async ({
  page,
}) => {
  await openSettings(page);

  const settingsPanel = page
    .getByRole("button", { name: "Close settings" })
    .locator("xpath=../../..");
  await trackDrawerHostScroll(settingsPanel);
  await page.getByRole("button", { name: "Add hover toolbar action" }).click();
  await expectDrawerAnimationWithoutHostScroll(
    settingsPanel,
    page.getByRole("dialog")
  );
  await expect(
    page.getByRole("button", { name: "Add", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy AI prompt", exact: true })
  ).toHaveCount(0);
  await page.getByRole("combobox", { name: "Action" }).click();
  await page.getByRole("option", { name: "Copy AI prompt" }).click();
  await expect(
    page.getByRole("heading", { name: "Add interaction" })
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Prompt template" })
    .fill("Explain ${filePath} at ${line}");
  await page.getByRole("textbox", { name: "Prompt template" }).blur();

  await expect(
    page.getByRole("textbox", { name: "Prompt template" })
  ).toHaveValue("Explain ${filePath} at ${line}");

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        const bindings = raw ? JSON.parse(raw).bindings : undefined;
        return bindings?.length ?? 0;
      })
    )
    .toBe(0);

  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit action 5: Copy AI prompt" })
  ).toBeVisible();
  const addedHoverAction = page.getByRole("button", {
    name: "Edit action 5: Copy AI prompt",
  });
  await expect(addedHoverAction).toHaveAttribute("aria-pressed", "false");
  await addedHoverAction.click();
  await expect(addedHoverAction).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("textbox", { name: "Prompt template" })
  ).toHaveValue("Explain ${filePath} at ${line}");
  await page.getByRole("button", { name: "Close interaction editor" }).click();
  await expect(addedHoverAction).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Add modifier + click action" })
    .click();
  await page.getByRole("combobox", { name: "Action" }).click();
  await page.getByRole("option", { name: "Copy path" }).click();
  await expect(
    page.getByRole("heading", { name: "Add interaction" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /(Option|Alt)/ })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Shift/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
  await page.getByRole("button", { name: "Add", exact: true }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        const bindings = raw ? JSON.parse(raw).bindings : [];
        return bindings?.map(
          (binding: { trigger?: { kind?: string } }) => binding.trigger?.kind
        );
      })
    )
    .toEqual([
      "modifier-click",
      "modifier-click",
      "hover-toolbar",
      "hover-toolbar",
      "hover-toolbar",
      "hover-toolbar",
    ]);
});

test("Advanced contains source inspection and infrequent settings", async ({
  page,
}) => {
  await openSettings(page);
  const advancedSettings = page.getByRole("button", {
    name: "Advanced settings",
  });
  await page.getByLabel("Settings menu").click();
  await expect(advancedSettings).toBeVisible();
  await page.getByRole("heading", { name: "Shortcuts" }).click();
  await expect(advancedSettings).not.toBeVisible();
  await openAdvanced(page);

  await expect(
    page.getByRole("button", { name: "Back to interactions" })
  ).toBeVisible();
  // Both of these live in foldable sections that start collapsed.
  await page.getByText("Configuration sources", { exact: true }).click();
  await expect(page.getByText("This origin", { exact: true })).toBeVisible();
  await expect(page.getByText("Extension", { exact: true })).toBeVisible();
  await expect(page.getByText("Team", { exact: true })).toBeVisible();
  await expect(page.getByText("Default", { exact: true }).last()).toBeVisible();

  await page.getByText("Diagnostics", { exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Debug mode" })
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Show intro again" })
  ).toBeVisible();
});

test("welcome dismissal survives resetting origin settings", async ({
  page,
}) => {
  await expectLocatorReady(page);
  await expect(page.getByText("Go to component code with")).toBeVisible({
    timeout: 15_000,
  });
  await locateElement(page, "text=save to reload");
  await expect(
    page.getByRole("heading", { name: "Welcome to Locator" })
  ).toBeVisible();
  await page.keyboard.up("Alt");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Pick your editor" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Choose your controls" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Test it" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "You’re ready" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        return raw ? JSON.parse(raw).uiState?.onboarding?.dismissed : undefined;
      })
    )
    .toBe(true);

  await openSettings(page);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByText("Reset settings for this site?")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();

  expect(
    await page.evaluate(() => {
      const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
      return raw ? JSON.parse(raw) : null;
    })
  ).toEqual({
    uiState: {
      welcomeScreenDismissed: true,
      onboarding: { dismissed: true, step: "done" },
    },
  });
});

test("Try runs only the selected action and Escape cancels", async ({
  page,
}) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (
            window as Window & { __locatorCopiedText?: string }
          ).__locatorCopiedText = text;
        },
      },
    });
    window.open = ((url?: string | URL) => {
      (window as Window & { __locatorOpenedUrl?: string }).__locatorOpenedUrl =
        String(url);
      return null;
    }) as typeof window.open;
  });

  await openSettings(page);
  await page.getByRole("button", { name: "Edit action 4: Copy path" }).click();
  await page.getByRole("button", { name: "Try this action" }).click();
  await expect(page.getByText(/Trying “Copy path”/)).toBeVisible();

  const target = page.getByText("save to reload", { exact: false }).first();
  await target.dispatchEvent("mouseover", { altKey: true });
  await target.dispatchEvent("click", { altKey: true });

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __locatorCopiedText?: string })
            .__locatorCopiedText
      )
    )
    .toMatch(/\.(?:tsx|ts|jsx|js):\d+:\d+$/);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __locatorOpenedUrl?: string }).__locatorOpenedUrl
    )
  ).toBeUndefined();
  await expect(page.getByText(/Trying “Copy path”/)).toHaveCount(0);
  await page.locator("body").dispatchEvent("keyup", { key: "Alt" });

  await openSettings(page);
  await page.getByRole("button", { name: "Edit action 4: Copy path" }).click();
  await page.getByRole("button", { name: "Try this action" }).click();
  await expect(page.getByText(/Trying “Copy path”/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText(/Trying “Copy path”/)).toHaveCount(0);
});
