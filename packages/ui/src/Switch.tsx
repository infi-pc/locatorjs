import { JSX } from "solid-js";
import * as SwitchPrimitive from "./components/ui/switch";

export function Switch(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
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
      colorPalette="green"
    >
      <SwitchPrimitive.HiddenInput />
      <SwitchPrimitive.Control />
      {props.children != null && (
        <SwitchPrimitive.Label>{props.children}</SwitchPrimitive.Label>
      )}
    </SwitchPrimitive.Root>
  );
}
