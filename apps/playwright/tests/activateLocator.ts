import { expect, type Frame, type Page } from "@playwright/test";

/** Activates the lazy visual runtime, then waits for its shared settings affordance. */
export async function expectLocatorReady(
  target: Page | Frame,
  modifier: "Alt" | "Control" | "Meta+Shift" = "Alt",
  timeout = 15_000
): Promise<void> {
  await expect
    .poll(
      () =>
        target.evaluate(
          () =>
            !!(window as Window & { __LOCATOR_RUNTIME__?: unknown })
              .__LOCATOR_RUNTIME__
        ),
      { timeout }
    )
    .toBe(true);

  const eventInit =
    modifier === "Alt"
      ? { altKey: true }
      : modifier === "Control"
      ? { ctrlKey: true }
      : { metaKey: true, shiftKey: true };
  await target.locator("body").dispatchEvent("mouseover", eventInit);
  await expect(
    target.getByRole("button", { name: "Settings", exact: true }).first()
  ).toBeVisible({ timeout });
}
