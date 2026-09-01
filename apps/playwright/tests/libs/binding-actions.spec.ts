import { expect, test, type Page } from "@playwright/test";
import { projects } from "../consts";
import { expectLocatorReady } from "../activateLocator";
import { seedLocatorStorage } from "../locatorStorage";

const dismissedUiState = {
  welcomeScreenDismissed: true,
  onboarding: { dismissed: true, step: "done" },
};

async function trigger(
  page: Page,
  modifier: "Alt" | "Control",
  selector = "text=save to reload"
) {
  const eventInit = modifier === "Alt" ? { altKey: true } : { ctrlKey: true };
  const element = page.locator(selector);
  await element.dispatchEvent("mouseover", eventInit);
  await element.dispatchEvent("click", eventInit);
}

test("copy-path binding writes the resolved source location", async ({
  page,
}) => {
  await seedLocatorStorage(
    page,
    {
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["alt"] },
          action: { kind: "copy-path" as const },
        },
      ],
    },
    dismissedUiState
  );
  await page.addInitScript(() => {
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
  });

  await page.goto(projects.solid);
  await expectLocatorReady(page);
  await trigger(page, "Alt");

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __locatorCopiedText?: string })
            .__locatorCopiedText
      )
    )
    .toMatch(/\.(?:tsx|ts|jsx|js):\d+:\d+$/);
});

test("a strict multi-source modifier chord dispatches from the v3 envelope", async ({
  page,
}) => {
  await seedLocatorStorage(
    page,
    {
      editor: { kind: "target", id: "vscode" },
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["ctrl"] },
          action: { kind: "open-editor" },
        },
      ],
    },
    dismissedUiState
  );
  await page.addInitScript(() => {
    window.open = ((url?: string | URL) => {
      (window as Window & { __locatorOpenedUrl?: string }).__locatorOpenedUrl =
        String(url);
      return null;
    }) as typeof window.open;
  });

  await page.goto(projects.solid);
  await expectLocatorReady(page, "Control");
  await trigger(page, "Control");

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __locatorOpenedUrl?: string })
            .__locatorOpenedUrl
      )
    )
    .toMatch(/^vscode:\/\/file\//);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem("LOCATOR_USER_CONFIG");
        const stored = raw ? JSON.parse(raw).layer : {};
        return stored.bindings?.[0]?.trigger;
      })
    )
    .toEqual({ kind: "modifier-click", modifiers: ["ctrl"] });
});

test("hover toolbar stays hidden when no toolbar action is configured", async ({
  page,
}) => {
  await seedLocatorStorage(
    page,
    {
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["alt"] },
          action: { kind: "copy-path" as const },
        },
      ],
    },
    dismissedUiState
  );

  await page.goto(projects.solid);
  await expectLocatorReady(page);

  await page
    .locator("text=save to reload")
    .dispatchEvent("mouseover", { altKey: true });

  const toolbar = page.getByRole("toolbar", { name: "Locator actions" });
  await expect(page.locator("text=save to reload")).toBeVisible();
  await expect(toolbar).toHaveCount(0);
});

test("hover toolbar renders the configured toolbar actions", async ({
  page,
}) => {
  await seedLocatorStorage(
    page,
    {
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: ["alt"] },
          action: { kind: "copy-path" as const },
        },
        {
          trigger: { kind: "hover-toolbar" as const },
          action: { kind: "show-tree" as const },
        },
        {
          trigger: { kind: "hover-toolbar" as const },
          action: { kind: "copy-path" as const },
        },
      ],
    },
    dismissedUiState
  );

  await page.goto(projects.solid);
  await expectLocatorReady(page);

  await page
    .locator("text=save to reload")
    .dispatchEvent("mouseover", { altKey: true });

  const toolbar = page.getByRole("toolbar", { name: "Locator actions" });
  await expect(toolbar).toBeVisible();
  await expect(toolbar.locator("button")).toHaveCount(2);
});
