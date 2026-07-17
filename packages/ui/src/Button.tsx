import { JSX, mergeProps, splitProps } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";

type Variant = "primary" | "outline" | "ghost" | "danger-ghost";
type Size = "xs" | "sm" | "md";

const VARIANT_PROPS: Record<
  Variant,
  {
    variant: "solid" | "outline" | "plain";
    colorPalette: "accent" | "gray" | "red";
  }
> = {
  primary: { variant: "solid", colorPalette: "accent" },
  outline: { variant: "outline", colorPalette: "gray" },
  ghost: { variant: "plain", colorPalette: "accent" },
  "danger-ghost": { variant: "plain", colorPalette: "red" },
};

const SIZE_PROPS: Record<Size, "xs" | "sm" | "md"> = {
  xs: "xs",
  sm: "sm",
  md: "md",
};

export function Button(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
  }
) {
  const merged = mergeProps(
    {
      variant: "outline" as Variant,
      size: "sm" as Size,
      type: "button" as const,
    },
    props
  );
  const [local, rest] = splitProps(merged, ["variant", "size", "class"]);
  const variant = () => VARIANT_PROPS[local.variant];
  return (
    <button
      class={cx(
        button({
          variant: variant().variant,
          size: SIZE_PROPS[local.size],
        }),
        css({ colorPalette: variant().colorPalette }),
        local.class
      )}
      {...rest}
    />
  );
}
