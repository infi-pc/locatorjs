import { bannerClass } from "../functions/bannerClasses";
import { useOptions } from "../functions/optionsStore";

import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { Button } from "@locator/ui";
import { css, cx } from "@locator/styled-system/css";

const styles = {
  dialog: cx(bannerClass, css({ width: "96" })),
  header: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  }),
  title: css({ fontWeight: "medium", mt: "2" }),
  body: css({ color: "fg.muted", fontSize: "sm", mt: "1" }),
  actions: css({ display: "flex", justifyContent: "flex-end" }),
};

export function DisableConfirmation(props: { onClose: () => void }) {
  const options = useOptions();

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
      <div class={styles.actions}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            options.setUserOrigin({ disabled: true });
          }}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
