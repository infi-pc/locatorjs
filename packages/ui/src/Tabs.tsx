import { For, JSX } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import * as TabsPrimitive from "./components/ui/tabs";

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
  const styles = {
    list: css({
      alignItems: "center",
      bg: "gray.subtle.bg",
      borderRadius: "l3",
      display: "flex",
      gap: "1",
      p: "1",
      width: "100%",
    }),
    trigger: css({
      borderRadius: "l2",
      color: "fg.muted",
      flexShrink: 0,
      fontSize: "sm",
      fontWeight: "medium",
      minH: "8",
      px: "3",
      py: "1",
      whiteSpace: "nowrap",
      _hover: {
        bg: "gray.plain.bg.hover",
        color: "fg.default",
      },
      "&[data-selected]": {
        bg: "green.surface.bg",
        color: "green.surface.fg",
        boxShadow: "xs",
      },
    }),
    content: css({ pt: "3", width: "100%" }),
  };

  return (
    <TabsPrimitive.Root
      defaultValue={props.defaultId}
      value={props.value}
      onValueChange={(details: { value: string }) =>
        props.onChange?.(details.value)
      }
      variant="line"
      size="sm"
      colorPalette="green"
    >
      <TabsPrimitive.List class={styles.list}>
        <For each={props.items}>
          {(item) => (
            <TabsPrimitive.Trigger value={item.id} class={styles.trigger}>
              {item.label}
            </TabsPrimitive.Trigger>
          )}
        </For>
      </TabsPrimitive.List>
      <For each={props.items}>
        {(item) => (
          <TabsPrimitive.Content value={item.id} class={cx(styles.content)}>
            {item.content}
          </TabsPrimitive.Content>
        )}
      </For>
    </TabsPrimitive.Root>
  );
}
