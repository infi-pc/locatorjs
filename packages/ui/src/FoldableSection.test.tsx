import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test } from "vitest";
import { FoldableSection } from "./FoldableSection";

afterEach(cleanup);

describe("FoldableSection", () => {
  test("renders closed by default and opens on summary click", async () => {
    render(() => (
      <FoldableSection title="Details">
        <div>Hidden content</div>
      </FoldableSection>
    ));

    const summary = screen.getByText("Details");
    const section = summary.closest("details") as HTMLDetailsElement;
    expect(section.open).toBe(false);
    expect(screen.getByText("Hidden content")).toBeTruthy();

    await fireEvent.click(summary);
    expect(section.open).toBe(true);
  });
});
