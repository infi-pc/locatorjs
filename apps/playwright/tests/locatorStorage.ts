import type { Page } from "@playwright/test";

export type LocatorLayerFixture = Record<string, unknown>;
export type LocatorUiStateFixture = Record<string, unknown>;

export async function seedLocatorStorage(
  page: Page,
  layer: LocatorLayerFixture = {},
  uiState: LocatorUiStateFixture = {}
): Promise<void> {
  await page.addInitScript(
    ({ config, state }) => {
      localStorage.setItem(
        "LOCATOR_USER_CONFIG",
        JSON.stringify({ version: 3, revision: 0, layer: config })
      );
      if (Object.keys(state).length > 0) {
        localStorage.setItem(
          "LOCATOR_UI_STATE",
          JSON.stringify({ version: 1, state })
        );
      }
    },
    { config: layer, state: uiState }
  );
}
