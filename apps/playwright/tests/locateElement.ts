import { Page } from "@playwright/test";

export async function locateElement(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.dispatchEvent("mouseover", { altKey: true });
  await element.dispatchEvent("click", { altKey: true });
  await page.locator("body").dispatchEvent("keyup", { key: "Alt" });
}
