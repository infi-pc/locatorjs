import { JSX, mergeProps, splitProps } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";

export function IconButton(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    "aria-label": string;
    variant?: "ghost" | "outline" | "danger-ghost";
    size?: "xs" | "sm";
  }
) {
  const merged = mergeProps(
    { type: "button" as const, variant: "ghost" as const, size: "xs" as const },
    props
  );
  const [local, rest] = splitProps(merged, ["class", "variant", "size"]);
  const palette = () => (local.variant === "danger-ghost" ? "red" : "accent");
  const recipeVariant = () =>
    local.variant === "outline" ? "outline" : "plain";

  return (
    <button
      class={cx(
        button({ variant: recipeVariant(), size: local.size }),
        css({ colorPalette: palette(), px: "0" }),
        local.class
      )}
      {...rest}
    />
  );
}
