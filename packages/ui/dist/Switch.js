import { memo as _$memo } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
import { Switch as KSwitch } from "@kobalte/core/switch";
export function Switch(props) {
  return _$createComponent(KSwitch, {
    get checked() {
      return props.checked;
    },
    get onChange() {
      return props.onChange;
    },
    get disabled() {
      return props.disabled;
    },
    "class": "inline-flex items-center gap-2",
    get children() {
      return [_$createComponent(KSwitch.Input, {
        "class": "peer sr-only"
      }), _$createComponent(KSwitch.Control, {
        "class": "h-5 w-9 rounded-full bg-gray-300 transition-colors data-[checked]:bg-blue-600 data-[disabled]:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 dark:bg-gray-600",
        get children() {
          return _$createComponent(KSwitch.Thumb, {
            "class": "block h-4 w-4 translate-x-0.5 translate-y-0.5 rounded-full bg-white transition-transform data-[checked]:translate-x-[18px]"
          });
        }
      }), _$memo(() => _$memo(() => props.children != null)() && _$createComponent(KSwitch.Label, {
        "class": "text-sm text-gray-800 data-[disabled]:opacity-60 dark:text-gray-200",
        get children() {
          return props.children;
        }
      }))];
    }
  });
}