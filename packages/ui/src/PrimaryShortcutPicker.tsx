import { css } from "@locator/styled-system/css";
import { ModifierChips } from "./ModifierChips";

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "3" }),
  label: css({ color: "fg.muted", fontSize: "xs" }),
};

export function PrimaryShortcutPicker(props: {
  modifiers?: string;
  onChange: (modifiers: string | undefined) => void;
}) {
  return (
    <div class={styles.stack}>
      <ModifierChips
        variant="full"
        value={props.modifiers}
        onChange={(value) => props.onChange(value)}
      />
      <p class={styles.label}>
        Hold this combination and click any element on a page to open it in your
        editor.
      </p>
    </div>
  );
}
