import { Switch as KSwitch } from "@kobalte/core/switch";
import { JSX } from "solid-js";

export function Switch(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: JSX.Element;
}) {
  return (
    <KSwitch
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
      class="inline-flex items-center gap-2"
    >
      <KSwitch.Input class="peer sr-only" />
      <KSwitch.Control class="h-5 w-9 rounded-full bg-gray-300 transition-colors data-[checked]:bg-blue-600 data-[disabled]:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 dark:bg-gray-600">
        <KSwitch.Thumb class="block h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[18px]" />
      </KSwitch.Control>
      {props.children != null && (
        <KSwitch.Label class="text-sm text-gray-800 data-[disabled]:opacity-60 dark:text-gray-200">
          {props.children}
        </KSwitch.Label>
      )}
    </KSwitch>
  );
}
