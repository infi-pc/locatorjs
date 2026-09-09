import { cleanup, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Wizard } from "./Wizard";

afterEach(cleanup);

describe("Wizard", () => {
  test("navigates controlled steps and finishes", async () => {
    const finish = vi.fn();
    function Subject() {
      const [active, setActive] = createSignal("welcome");
      return (
        <Wizard
          activeId={active()}
          onStepChange={setActive}
          onFinish={finish}
          steps={[
            {
              id: "welcome",
              title: "Welcome",
              content: () => <div>First</div>,
            },
            { id: "done", title: "Done", content: () => <div>Last</div> },
          ]}
        />
      );
    }
    render(() => <Subject />);
    expect(screen.getByText("First")).toBeTruthy();
    await screen.getByRole("button", { name: "Continue" }).click();
    expect(screen.getByText("Last")).toBeTruthy();
    await screen.getByRole("button", { name: "Finish" }).click();
    expect(finish).toHaveBeenCalledOnce();
  });
});
