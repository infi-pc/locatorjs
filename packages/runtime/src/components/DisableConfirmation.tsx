import { bannerClass } from "../functions/bannerClasses";
import { useOptions } from "../functions/optionsStore";

import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { Button } from "@locator/ui";
import { css, cx } from "@locator/styled-system/css";
import { createSignal, Show } from "solid-js";

const styles = {
  dialog: cx(bannerClass, css({ width: "96" })),
  header: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  }),
  title: css({ fontWeight: "medium", mt: "2" }),
  body: css({ color: "fg.muted", fontSize: "sm", mt: "1" }),
  error: css({ color: "error", fontSize: "xs", mt: "2" }),
  actions: css({ display: "flex", justifyContent: "flex-end" }),
};

export function DisableConfirmation(props: { onClose: () => void }) {
  const options = useOptions();
  const [saveState, setSaveState] = createSignal<"idle" | "saving" | "error">(
    "idle"
  );

  return (
    <div class={styles.dialog}>
      <div class={styles.header}>
        <LogoIcon />
        <OptionsCloseButton onClick={() => props.onClose()} />
      </div>
      <div class={styles.title}>Disable Locator</div>
      <div class={styles.body}>
        You will be able to enable Locator again by running `enableLocator()` in
        DevTools console.
      </div>
      <Show when={saveState() === "error"}>
        <div class={styles.error} role="alert">
          Could not disable Locator. Check browser storage permissions and try
          again.
        </div>
      </Show>
      <div class={styles.actions}>
        <Button
          size="sm"
          variant="outline"
          disabled={saveState() === "saving"}
          onClick={async () => {
            setSaveState("saving");
            const result = await options.setUserOrigin({ disabled: true });
            if (result.ok) {
              props.onClose();
            } else {
              setSaveState("error");
            }
          }}
        >
          {saveState() === "saving" ? "Disabling…" : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
