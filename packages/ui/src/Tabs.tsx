import { Tabs as KTabs } from "@kobalte/core/tabs";
import { For, JSX } from "solid-js";

export type TabItem = {
  id: string;
  label: JSX.Element;
  content: JSX.Element;
};

export function Tabs(props: {
  items: TabItem[];
  defaultId?: string;
  value?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <KTabs
      defaultValue={props.defaultId}
      value={props.value}
      onChange={props.onChange}
      class="flex flex-col"
    >
      <KTabs.List class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <For each={props.items}>
          {(item) => (
            <KTabs.Trigger
              value={item.id}
              class="px-3 py-1.5 text-sm text-gray-500 border-b-2 border-transparent -mb-px cursor-pointer hover:text-gray-800 data-[selected]:border-blue-600 data-[selected]:text-blue-700 data-[selected]:font-medium dark:text-gray-400 dark:hover:text-gray-200 dark:data-[selected]:text-blue-300"
            >
              {item.label}
            </KTabs.Trigger>
          )}
        </For>
      </KTabs.List>
      <For each={props.items}>
        {(item) => (
          <KTabs.Content value={item.id} class="pt-3">
            {item.content}
          </KTabs.Content>
        )}
      </For>
    </KTabs>
  );
}
