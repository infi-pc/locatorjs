import { JSX, splitProps } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import { input } from "@locator/styled-system/recipes";

export function TextInput(
  props: JSX.InputHTMLAttributes<HTMLInputElement> & {
    ref?: (el: HTMLInputElement) => void;
  }
) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <input
      type="text"
      class={cx(
        input({ variant: "outline", size: "sm" }),
        css({ colorPalette: "green" }),
        local.class
      )}
      {...rest}
    />
  );
}
