import { evalTemplate } from "./evalTemplate";

describe("evalTemplate", () => {
  test("basic", () => {
    const res = evalTemplate("https://example.com/${filePath}${ext}", {
      filePath: "test",
      ext: ".js",
    });
    expect(res).toBe("https://example.com/test.js");
  });
});
