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

test("settings popover uses one effective form and persists origin values", async ({
  page,
}) => {
  await openSettings(page);

  await expect(
    page.getByRole("tablist", { name: "Settings layers" })
  ).toHaveCount(0);
  await expect(
    page.getByText("Default", { exact: true }).first()
  ).toBeVisible();

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
  await expect(page.getByPlaceholder("/Users/me/project/")).toHaveValue(
    "/tmp/locator-project"
  );
});

test("layer inspector explains extension and team semantics", async ({
  page,
}) => {
  await openSettings(page);

  await page.getByText("View layers", { exact: true }).click();
  await expect(page.getByText("This origin", { exact: true })).toBeVisible();
  await expect(page.getByText("Extension", { exact: true })).toBeVisible();
  await expect(page.getByText("Team", { exact: true })).toBeVisible();
  await expect(page.getByText("Default", { exact: true }).last()).toBeVisible();
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
