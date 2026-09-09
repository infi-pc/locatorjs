import { JSX } from "solid-js";
import { css } from "@locator/styled-system/css";
import * as SwitchPrimitive from "./components/ui/switch";

const visuallyHidden = css({
  border: "0",
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  p: "0",
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
});

export function Switch(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  children?: JSX.Element;
}) {
  return (
    <SwitchPrimitive.Root
      checked={props.checked}
      onCheckedChange={(details: { checked: boolean }) =>
        props.onChange(details.checked)
      }
      disabled={props.disabled}
      size="sm"
      colorPalette="accent"
    >
      <SwitchPrimitive.HiddenInput />
      <SwitchPrimitive.Control />
      <SwitchPrimitive.Label class={visuallyHidden}>
        {props.label}
      </SwitchPrimitive.Label>
      {props.children != null && (
        <span aria-hidden="true">{props.children}</span>
      )}
    </SwitchPrimitive.Root>
  );
}
