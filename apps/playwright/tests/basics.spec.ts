import { test, expect, Page } from "@playwright/test";

const projects = {
  web: "http://localhost:3342/",
  react: "http://localhost:3343/",
  solid: "http://localhost:3345/",
  preact: "http://localhost:3346/",
  svelte: "http://localhost:3347/",
};

async function locateElement(page: Page, selector: string) {
  await page.keyboard.down("Alt");

  // await page.mouse.move(100, 100);

  const headline = page.locator(selector);

  await headline.hover();

  await headline.click();
}

test("web", async ({ page }) => {
  await page.goto(projects.web);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Click on a component to go to its code");

  const initialButton = page.locator("button >> text=Go to code");
  await expect(initialButton).toBeVisible();
});

test("react", async ({ page }) => {
  await page.goto(projects.react);
  const getStarted = page.locator("text=Go to component code with");
  await expect(getStarted).toBeVisible();

  await locateElement(page, "text=Hello Vite + React!");

  const initialButton = page.locator("button >> text=Go to code");
  await expect(initialButton).toBeVisible();
});
