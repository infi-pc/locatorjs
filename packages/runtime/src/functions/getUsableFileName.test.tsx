import getUsableFileName from "./getUsableFileName"; // assuming the function is in filenameUtils.ts
import { describe, expect, it } from "vitest";

describe("getUsableFileName", () => {
  it("should return filename if it is not index.<extension>", () => {
    expect(getUsableFileName("myProject/utils/getSomething.js")).toBe(
      "getSomething.js"
    );
  });

  it("should return parent folder and filename if the filename is index.<extension>", () => {
    expect(getUsableFileName("myProject/Button/index.tsx")).toBe(
      "Button/index.tsx"
    );
  });

  it("should handle paths with only one segment", () => {
    expect(getUsableFileName("file.ts")).toBe("file.ts");
  });

  it("should handle paths with index.<extension> without parent folder", () => {
    expect(getUsableFileName("index.ts")).toBe("index.ts");
  });
});
