import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  PageStatusCard,
  describePageStatusScreen,
  type PageStatusScreen,
} from "./PageStatusCard";

afterEach(cleanup);

describe("PageStatusCard", () => {
  test("names the framework that is missing source locations", () => {
    render(() => (
      <PageStatusCard
        screen={{ kind: "no-source-info", frameworks: ["react"] }}
      />
    ));
    expect(
      screen.getByText("React is here, but without source locations")
    ).toBeTruthy();
    expect(screen.getByText(/production build/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Setup guide" }).getAttribute("href")
    ).toBe("https://www.locatorjs.com/install/react");
    expect(screen.queryByText(/dev option/)).toBeNull();
  });

  test("joins several frameworks and adds the Svelte compiler note", () => {
    const presentation = describePageStatusScreen({
      kind: "no-source-info",
      frameworks: ["vue", "svelte"],
    });
    expect(presentation.headline).toBe(
      "Vue and Svelte are here, but without source locations"
    );
    expect(presentation.body).toContain(
      "Svelte also needs the compiler's dev option"
    );
  });

  test("mentions an unsupported framework it recognised", () => {
    render(() => (
      <PageStatusCard
        screen={{ kind: "no-framework", unsupported: ["Angular"] }}
      />
    ));
    expect(screen.getByText(/This looks like an Angular app/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Setup guides" })).toBeTruthy();
  });

  test("routes the single action to the right callback", () => {
    const onCheckAgain = vi.fn();
    const onEnable = vi.fn();
    const onReload = vi.fn();
    const cases: Array<[PageStatusScreen, string, () => unknown]> = [
      [{ kind: "no-framework", unsupported: [] }, "Check again", onCheckAgain],
      [{ kind: "client-failed", detail: "csp" }, "Retry", onCheckAgain],
      [{ kind: "disabled-everywhere" }, "Turn on", onEnable],
      [{ kind: "disabled-here" }, "Turn on", onEnable],
      [{ kind: "reload-required" }, "Reload page", onReload],
    ];
    for (const [status, label, callback] of cases) {
      const view = render(() => (
        <PageStatusCard
          screen={status}
          onCheckAgain={onCheckAgain}
          onEnable={onEnable}
          onReload={onReload}
        />
      ));
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(callback).toHaveBeenCalledTimes(1);
      vi.mocked(callback).mockClear();
      view.unmount();
    }
  });

  test("states without a next step render no button", () => {
    for (const status of [
      { kind: "probing" },
      { kind: "restricted-page" },
      { kind: "runtime-unreachable" },
    ] as PageStatusScreen[]) {
      const view = render(() => <PageStatusCard screen={status} />);
      expect(screen.queryByRole("button")).toBeNull();
      view.unmount();
    }
  });

  test("keeps the raw client failure behind a disclosure", () => {
    render(() => (
      <PageStatusCard
        screen={{ kind: "client-failed", detail: "Refused to load the script" }}
      />
    ));
    expect(
      screen.getByText("Locator couldn't start on this page")
    ).toBeTruthy();
    expect(screen.getByText("Details")).toBeTruthy();
    expect(screen.getByText("Refused to load the script")).toBeTruthy();
  });

  test("shows an action error and disables the button while busy", () => {
    render(() => (
      <PageStatusCard
        screen={{ kind: "disabled-here" }}
        busy
        error="Could not enable LocatorJS on this page."
      />
    ));
    expect(screen.getByRole("alert").textContent).toContain("Could not enable");
    expect(
      (screen.getByRole("button", { name: "Turn on" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });
});
