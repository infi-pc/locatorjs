import { createComponent as _$createComponent } from "solid-js/web";
import { Tabs as KTabs } from "@kobalte/core/tabs";
import { For } from "solid-js";
export function Tabs(props) {
  return _$createComponent(KTabs, {
    get defaultValue() {
      return props.defaultId;
    },
    get value() {
      return props.value;
    },
    get onChange() {
      return props.onChange;
    },
    "class": "flex flex-col",
    get children() {
      return [_$createComponent(KTabs.List, {
        "class": "flex gap-1 border-b border-gray-200 dark:border-gray-700",
        get children() {
          return _$createComponent(For, {
            get each() {
              return props.items;
            },
            children: item => _$createComponent(KTabs.Trigger, {
              get value() {
                return item.id;
              },
              "class": "px-3 py-1.5 text-sm text-gray-500 border-b-2 border-transparent -mb-px cursor-pointer hover:text-gray-800 data-[selected]:border-blue-600 data-[selected]:text-blue-700 data-[selected]:font-medium dark:text-gray-400 dark:hover:text-gray-200 dark:data-[selected]:text-blue-300",
              get children() {
                return item.label;
              }
            })
          });
        }
      }), _$createComponent(For, {
        get each() {
          return props.items;
        },
        children: item => _$createComponent(KTabs.Content, {
          get value() {
            return item.id;
          },
          "class": "pt-3",
          get children() {
            return item.content;
          }
        })
      })];
    }
  });
}