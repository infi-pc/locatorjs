import { JSX, splitProps } from "solid-js";
import { css, cx } from "@locator/styled-system/css";

const textarea = css({
  bg: "bg.default",
  borderColor: "border",
  borderRadius: "l2",
  borderWidth: "1px",
  color: "fg.default",
  fontSize: "sm",
  minH: "28",
  outline: "none",
  p: "2.5",
  resize: "vertical",
  width: "100%",
  _focus: { borderColor: "accent.outline.border", focusRing: "inside" },
  _placeholder: { color: "fg.subtle" },
});

export function TextArea(
  props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const [local, rest] = splitProps(props, ["class"]);
  return <textarea class={cx(textarea, local.class)} {...rest} />;
}
