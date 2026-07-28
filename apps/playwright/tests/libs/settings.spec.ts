import { expect, test, type Page } from "@playwright/test";
import { projects } from "../consts";
import { locateElement } from "../locateElement";

async function openSettings(page: Page) {
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  await page.keyboard.down("Alt");
  try {
    await page.mouse.move(100, 100);
    await settings.first().click();
  } finally {
    await page.keyboard.up("Alt");
  }
  await expect(
    page.getByRole("tablist", { name: "Settings layers" })
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto(projects.solid);
});

test("settings popover exposes layers and persists origin values", async ({
  page,
}) => {
  await openSettings(page);

  await expect(page.getByRole("tab", { name: /This origin/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Extension/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Team/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Defaults/ })).toHaveCount(0);

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

test("layer tabs explain extension and team semantics", async ({ page }) => {
  await openSettings(page);

  await page.getByRole("tab", { name: /Extension/ }).click();
  await expect(
    page.getByText(
      "Install the browser extension to set personal cross-site defaults."
    )
  ).toBeVisible();

  await page.getByRole("tab", { name: /Team/ }).click();
  await expect(
    page.getByText(
      "Defined by setup() in the app’s code — change it in the repository."
    )
  ).toBeVisible();

  const originTab = page.getByRole("tab", { name: /This origin/ });
  await originTab.click();
  await expect(originTab).toHaveAttribute("aria-selected", "true");
});

test("welcome dismissal survives resetting origin settings", async ({
  page,
}) => {
  await expect(page.getByText("Go to component code with")).toBeVisible({
    timeout: 15_000,
  });
  await locateElement(page, "text=save to reload");
  await expect(page.getByText("Welcome to Locator!")).toBeVisible();
  await page.keyboard.up("Alt");
  await page.getByRole("button", { name: "Confirm" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_OPTIONS");
        return raw
          ? JSON.parse(raw).uiState?.welcomeScreenDismissed
          : undefined;
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
  ).toEqual({ uiState: { welcomeScreenDismissed: true } });
});
