import { isDisallowedComponent } from "../src/isDisallowedComponent";

describe("isDisallowedComponent", () => {
  test("be disallowed from list", () => {
    expect(isDisallowedComponent("Fragment")).toBe(true);
    expect(isDisallowedComponent("React.Fragment")).toBe(true);
  });
  test("Providers are disallowed", () => {
    expect(isDisallowedComponent("ThemeProvider")).toBe(true);
    expect(isDisallowedComponent("RouterProvider")).toBe(true);
  });
  test("not be disallowed", () => {
    expect(isDisallowedComponent("MyComp")).toBe(false);
  });
});
