import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ModifierChips } from "./ModifierChips";

afterEach(cleanup);

describe("ModifierChips", () => {
  test("renders full two-line macOS keycaps with accessible labels", () => {
    render(() => (
      <ModifierChips
        variant="full"
        platform="mac"
        value={["alt", "meta"]}
        onChange={() => undefined}
      />
    ));

    expect(screen.getByRole("button", { name: "⌥ Option" }).textContent).toBe(
      "⌥option"
    );
    expect(screen.getByRole("button", { name: "⌘ Command" }).textContent).toBe(
      "⌘command"
    );
    expect(
      screen
        .getByRole("button", { name: "⌘ Command" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  test("renders Windows-specific full keycap legends", () => {
    render(() => (
      <ModifierChips
        variant="full"
        platform="windows"
        onChange={() => undefined}
      />
    ));

    expect(screen.getByRole("button", { name: "Alt" }).textContent).toBe(
      "Altalt"
    );
    expect(screen.getByRole("button", { name: "⊞ Win" }).textContent).toBe(
      "⊞windows"
    );
  });

  test("keeps the selected value in sync across interactions", async () => {
    const onChange = vi.fn();

    function Harness() {
      const [value, setValue] = createSignal<
        readonly ("alt" | "ctrl" | "shift" | "meta")[] | undefined
      >(["alt"]);
      return (
        <ModifierChips
          value={value()}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      );
    }

    render(() => <Harness />);
    const option = screen.getByRole("button", { name: /(Option|Alt)/ });
    await option.click();

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(option.getAttribute("aria-pressed")).toBe("false");
  });
});
