import { css } from "@locator/styled-system/css";

const styles = {
  brand: css({
    alignItems: "center",
    color: "fg.default",
    display: "inline-flex",
    fontSize: "sm",
    fontWeight: "semibold",
    gap: "2",
  }),
  mark: css({
    bgGradient: "brand",
    borderRadius: "l1",
    boxShadow: "xs",
    flexShrink: "0",
    height: "5",
    width: "5",
  }),
};

export function LocatorBrand() {
  return (
    <span class={styles.brand} aria-label="LocatorJS">
      <span class={styles.mark} aria-hidden="true" />
      <span>LocatorJS</span>
    </span>
  );
}
