import { For, JSX, Show } from "solid-js";
import { css, cx } from "@locator/styled-system/css";
import * as TabsPrimitive from "./components/ui/tabs";
import { Tooltip } from "./Tooltip";

export type TabItem = {
  id: string;
  label: JSX.Element;
  content: JSX.Element;
  disabled?: boolean;
  disabledReason?: string;
};

export function Tabs(props: {
  items: TabItem[];
  defaultId?: string;
  value?: string;
  onChange?: (id: string) => void;
  ariaLabel?: string;
  portalMount?: Node;
}) {
  const styles = {
    root: css({ gap: "0" }),
    list: css({
      alignItems: "center",
      display: "flex",
      gap: "0",
      position: "sticky",
      top: "var(--locator-settings-tabs-top, 0px)",
      width: "100%",
      zIndex: "sticky",
    }),
    triggerWrap: css({ display: "flex", flex: "1 0 auto", minW: "0" }),
    trigger: css({
      flex: "1 1 0",
      fontSize: "sm",
      fontWeight: "medium",
      justifyContent: "center",
      minH: "8",
      px: "3",
      py: "1",
      textAlign: "center",
      whiteSpace: "nowrap",
    }),
    content: css({
      p: "3",
    }),
  };

  const trigger = (item: TabItem) => (
    <TabsPrimitive.Trigger
      value={item.id}
      class={styles.trigger}
      disabled={item.disabled}
    >
      {item.label}
    </TabsPrimitive.Trigger>
  );

  return (
    <TabsPrimitive.Root
      defaultValue={props.defaultId}
      value={props.value}
      onValueChange={(details: { value: string }) =>
        props.onChange?.(details.value)
      }
      variant="connected"
      size="sm"
      colorPalette="accent"
      class={styles.root}
    >
      <TabsPrimitive.List
        class={styles.list}
        aria-label={props.ariaLabel ?? "Settings layers"}
      >
        <For each={props.items}>
          {(item) => (
            <Show
              when={item.disabled && item.disabledReason}
              fallback={<span class={styles.triggerWrap}>{trigger(item)}</span>}
            >
              <Tooltip
                label={item.disabledReason!}
                portalMount={props.portalMount}
                class={styles.triggerWrap}
              >
                {trigger(item)}
              </Tooltip>
            </Show>
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
