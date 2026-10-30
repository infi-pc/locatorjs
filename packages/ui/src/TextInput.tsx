import { JSX, splitProps } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import { input } from "@locator/styled-system/recipes";

export function TextInput(
  props: JSX.InputHTMLAttributes<HTMLInputElement> & {
    ref?: (el: HTMLInputElement) => void;
    mono?: boolean;
  }
) {
  const [local, rest] = splitProps(props, ["class", "mono"]);
  return (
    <input
      type="text"
      class={cx(
        input({ variant: "outline", size: "sm" }),
        css({
          colorPalette: "accent",
          ...(local.mono ? { fontFamily: "mono" } : {}),
        }),
        local.class
      )}
      {...rest}
    />
  );
}
