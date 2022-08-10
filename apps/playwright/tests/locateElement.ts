import { Page } from "@playwright/test";

export async function locateElement(page: Page, selector: string) {
  await page.keyboard.down("Alt");

  // await page.mouse.move(100, 100);
  const headline = page.locator(selector);

  await headline.hover();

  await headline.click();
}
