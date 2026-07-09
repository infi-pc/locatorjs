import type { LocatorLayer } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import { badge } from "@locator/styled-system/recipes";

export const LAYER_LABELS: Record<LocatorLayer, string> = {
  default: "default",
  team: "team",
  "user-extension": "extension",
  "user-origin": "this origin",
};

const LAYER_PALETTES: Record<LocatorLayer, "gray" | "green" | "red"> = {
  default: "gray",
  team: "green",
  "user-extension": "red",
  "user-origin": "green",
};

export function ProvenanceBadge(props: { layer?: LocatorLayer }) {
  if (!props.layer) return null;
  return (
    <span
      class={cx(
        badge({ variant: "subtle", size: "sm" }),
        css({ colorPalette: LAYER_PALETTES[props.layer] })
      )}
      title={`Setting comes from: ${props.layer}`}
    >
      {LAYER_LABELS[props.layer]}
    </span>
  );
}
