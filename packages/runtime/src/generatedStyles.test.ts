import { describe, expect, it } from "vitest";
import generatedStyles from "./_generated_styles";

describe("generated shadow-root styles", () => {
  it("contains the required compact control recipes", () => {
    expect(generatedStyles).toContain(".tabs__trigger--size_sm");
    expect(generatedStyles).toContain(".switch__root--size_sm");
  });

  it("preserves escaped utility selectors through the JavaScript wrapper", () => {
    expect(generatedStyles).toContain(".max-h_calc\\(100vh_-_24px\\)");
  });

  it("does not contain unexpanded token literals", () => {
    expect(generatedStyles).not.toMatch(/font-size:\s*(?:xs|sm|md);/);
    expect(generatedStyles).not.toMatch(/border-radius:\s*l[123](?:\s|;)/);
  });
});
