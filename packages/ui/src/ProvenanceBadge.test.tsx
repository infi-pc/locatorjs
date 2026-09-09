import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test } from "vitest";
import { Show, createSignal } from "solid-js";
import { strictConfig } from "@locator/shared";
import { ProvenanceBadge } from "./ProvenanceBadge";

afterEach(cleanup);

describe("ProvenanceBadge", () => {
  test("follows a change between two layers", () => {
    // The label was read once outside any tracked scope while the class and
    // tooltip were compiled to getters, so a default -> team change repainted
    // the badge blue while its text still said "Default".
    const [layer, setLayer] =
      createSignal<strictConfig.LocatorLayerId>("default");
    render(() => <ProvenanceBadge layer={layer()} />);

    expect(screen.getByText("Default")).toBeTruthy();

    setLayer("team");

    expect(screen.queryByText("Default")).toBeNull();
    expect(screen.getByText("Team")).toBeTruthy();
  });

  test("updates through the non-keyed Show its call sites wrap it in", () => {
    // `<Show>` only rebuilds children when truthiness flips, so a change
    // between two truthy layers has to be tracked by the badge itself.
    const [layer, setLayer] = createSignal<
      strictConfig.LocatorLayerId | undefined
    >("user-extension");
    render(() => (
      <Show when={layer()}>
        <ProvenanceBadge layer={layer()} />
      </Show>
    ));

    expect(screen.getByText("Extension")).toBeTruthy();

    setLayer("user-origin");

    expect(screen.getByText("This origin")).toBeTruthy();
  });

  test("renders nothing without a layer", () => {
    const { container } = render(() => <ProvenanceBadge />);

    expect(container.textContent).toBe("");
  });
});
