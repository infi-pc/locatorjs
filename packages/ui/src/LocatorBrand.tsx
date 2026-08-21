import { css } from "@locator/styled-system/css";
import { LocatorMark } from "./LocatorMark";

const styles = {
  brand: css({
    alignItems: "center",
    color: "fg.default",
    display: "inline-flex",
    fontSize: "sm",
    fontWeight: "semibold",
    gap: "1",
  }),
  mark: css({
    flexShrink: "0",
  }),
};

export function LocatorBrand() {
  return (
    <span class={styles.brand} aria-label="LocatorJS">
      <LocatorMark class={styles.mark} />
      <span>LocatorJS</span>
    </span>
  );
}
