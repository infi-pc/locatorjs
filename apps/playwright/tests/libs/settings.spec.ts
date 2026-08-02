import { expect, test, type Locator, type Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

async function openSettings(page: Page) {
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await expect
    .poll(() => settings.count(), { timeout: 15_000 })
    .toBeGreaterThan(0);
  let visibleSettings = await firstInViewport(page, settings);
  if (!visibleSettings) {
    await page.keyboard.down("Alt");
    await page.mouse.move(100, 100);
    await expect
      .poll(async () => Boolean(await firstInViewport(page, settings)))
      .toBe(true);
    visibleSettings = await firstInViewport(page, settings);
  }
  if (!visibleSettings) {
    await page.keyboard.up("Alt");
    throw new Error("No visible Settings button");
  }
  await visibleSettings.click();
  await page.keyboard.up("Alt");
  await expect(
    page.getByRole("button", { name: /^Edit action 1:/ })
  ).toBeVisible();
}

async function openAdvanced(page: Page) {
  await page.getByRole("button", { name: "Advanced settings" }).click();
  await expect(page.getByText("Project path", { exact: true })).toBeVisible();
}

async function firstInViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  for (let index = 0; index < (await locator.count()); index += 1) {
    const candidate = locator.nth(index);
    const box = await candidate.boundingBox();
    if (
      box &&
      viewport &&
      box.x + box.width > 0 &&
      box.y + box.height > 0 &&
      box.x < viewport.width &&
      box.y < viewport.height
    ) {
      return candidate;
    }
  }
  return undefined;
}

test.beforeEach(async ({ page }) => {
  await page.goto(projects.solid);
});

test("action settings persist editor-owned and advanced origin values", async ({
  page,
}) => {
  await openSettings(page);

  await expect(
    page.getByRole("heading", { name: "Modifier + click" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hover toolbar" })
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Cards" })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Edit action 1: Open in VSCode" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Open in VSCode" })
  ).toBeFocused();
  await expect(
    page.getByText("Live link preview", { exact: true })
  ).toBeVisible();

  const editor = page.getByRole("combobox", { name: "Editor" });
  await editor.click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        const binding = raw ? JSON.parse(raw).bindings?.[0] : undefined;
        return binding?.action?.targetId;
      })
    )
    .toBe("webstorm");

  await page.getByRole("button", { name: "Back to actions" }).click();
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

  await page.getByRole("button", { name: "Add hover toolbar action" }).click();
  await expect(page.getByRole("button", { name: "Confirm" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy AI prompt", exact: true })
  ).toHaveCount(0);
  await page.getByRole("combobox", { name: "Action" }).click();
  await page.getByRole("option", { name: "Copy AI prompt" }).click();
  await expect(
    page.getByRole("heading", { name: "Copy AI prompt" })
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Prompt template" })
    .fill("Explain ${filePath} at ${line}");
  await page.getByRole("textbox", { name: "Prompt template" }).blur();

  await expect(page.getByText("When", { exact: true })).toBeVisible();
  await expect(page.getByText("Then", { exact: true })).toBeVisible();
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

  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(
    page.getByRole("button", { name: "Edit action 5: Copy AI prompt" })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit action 5: Copy AI prompt" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Prompt template" })
  ).toHaveValue("Explain ${filePath} at ${line}");
  await page.getByRole("button", { name: "Back to actions" }).click();
  await expect(
    page.getByRole("button", { name: "Edit action 5: Copy AI prompt" })
  ).toBeFocused();

  await page
    .getByRole("button", { name: "Add modifier + click action" })
    .click();
  await page.getByRole("combobox", { name: "Action" }).click();
  await page.getByRole("option", { name: "Copy path" }).click();
  await expect(page.getByRole("heading", { name: "Copy path" })).toBeVisible();
  await expect(
    page.getByText(/(Option|Alt) \+ (Shift|⇧ Shift) \+ Click/)
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();

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
  await openAdvanced(page);

  await expect(
    page.getByRole("button", { name: "Back to actions" })
  ).toBeVisible();
  await expect(page.getByText("This origin", { exact: true })).toBeVisible();
  await expect(page.getByText("Extension", { exact: true })).toBeVisible();
  await expect(page.getByText("Team", { exact: true })).toBeVisible();
  await expect(page.getByText("Default", { exact: true }).last()).toBeVisible();
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
  await page.getByRole("button", { name: "Reset this origin" }).click();

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
