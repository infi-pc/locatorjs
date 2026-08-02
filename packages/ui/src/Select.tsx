import { For, JSX, createMemo, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import {
  Select as ArkSelect,
  createListCollection,
} from "@ark-ui/solid/select";
import { Check, ChevronDown } from "lucide-solid";
import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";

export type SelectItem = {
  value: string;
  label: string;
  icon?: () => JSX.Element;
};

const styles = {
  root: css({ display: "block", width: "100%" }),
  trigger: css({
    colorPalette: "accent",
    justifyContent: "space-between",
    width: "100%",
  }),
  triggerLabel: css({
    alignItems: "center",
    display: "inline-flex",
    gap: "2",
    minW: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  positioner: css({ pointerEvents: "auto", zIndex: "popover" }),
  content: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    boxShadow: "lg",
    maxH: "64",
    overflowY: "auto",
    p: "1",
    pointerEvents: "auto",
    width: "var(--reference-width)",
    _open: { animation: "fade-in 100ms ease-out" },
  }),
  item: css({
    alignItems: "center",
    borderRadius: "l2",
    color: "fg.default",
    cursor: "pointer",
    display: "grid",
    fontSize: "sm",
    gap: "2",
    gridTemplateColumns: "1rem minmax(0, 1fr) 1rem",
    minH: "8",
    outline: "0",
    px: "2",
    py: "1",
    textAlign: "left",
    width: "100%",
    _highlighted: { bg: "accent.subtle.bg" },
    _selected: { color: "accent.plain.fg" },
  }),
  icon: css({
    alignItems: "center",
    color: "fg.muted",
    display: "inline-flex",
    height: "4",
    justifyContent: "center",
    width: "4",
  }),
  check: css({ color: "accent.plain.fg", height: "4", width: "4" }),
};

export function Select(
  props: {
    items: SelectItem[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    portalMount?: Node;
    class?: string;
  } & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value">
) {
  const [local, triggerProps] = splitProps(props, [
    "items",
    "value",
    "onChange",
    "placeholder",
    "disabled",
    "portalMount",
    "class",
  ]);
  const collection = createMemo(() =>
    createListCollection<SelectItem>({
      items: local.items,
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
    })
  );
  const selected = () => local.items.find((item) => item.value === local.value);

  return (
    <ArkSelect.Root
      class={cx(styles.root, local.class)}
      collection={collection()}
      value={local.value ? [local.value] : []}
      disabled={local.disabled}
      positioning={{
        placement: "bottom-start",
        sameWidth: true,
        strategy: "fixed",
      }}
      onValueChange={(details) => {
        const next = details.value[0];
        if (next != null) local.onChange(next);
      }}
    >
      <ArkSelect.HiddenSelect />
      <ArkSelect.Control>
        <ArkSelect.Trigger
          class={cx(
            "locatorjs-select-trigger",
            button({ variant: "outline", size: "sm" }),
            styles.trigger
          )}
          {...triggerProps}
        >
          <span class={styles.triggerLabel}>
            <span class={styles.icon}>{selected()?.icon?.()}</span>
            {selected()?.label ?? local.placeholder ?? "Select"}
          </span>
          <ArkSelect.Indicator>
            <ChevronDown size={16} />
          </ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal mount={local.portalMount ?? document.body}>
        <ArkSelect.Positioner class={styles.positioner}>
          <ArkSelect.Content
            class={cx("locatorjs-select-content", styles.content)}
          >
            <ArkSelect.List>
              <For each={local.items}>
                {(item) => (
                  <ArkSelect.Item
                    item={item}
                    class={cx("locatorjs-select-item", styles.item)}
                  >
                    <span class={styles.icon}>{item.icon?.()}</span>
                    <ArkSelect.ItemText>{item.label}</ArkSelect.ItemText>
                    <ArkSelect.ItemIndicator>
                      <Check class={styles.check} />
                    </ArkSelect.ItemIndicator>
                  </ArkSelect.Item>
                )}
              </For>
            </ArkSelect.List>
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
    </ArkSelect.Root>
  );
}
