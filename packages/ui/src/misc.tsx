import { JSX } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import { kbd, spinner } from "@locator/styled-system/recipes";

export function SectionHeadline(props: {
  children: JSX.Element;
  class?: string;
}) {
  return (
    <label
      class={cx(
        css({
          color: "fg.default",
          fontSize: "md",
          fontWeight: "medium",
        }),
        props.class
      )}
    >
      {props.children}
    </label>
  );
}

export function Kbd(props: { children: JSX.Element }) {
  return (
    <kbd class={kbd({ variant: "surface", size: "sm" })}>{props.children}</kbd>
  );
}

export function Spinner(props: { class?: string }) {
  return (
    <div
      class={cx(
        spinner({ size: "lg" }),
        css({ color: "accent.9" }),
        props.class
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
