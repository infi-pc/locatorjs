import type { LocatorLayer } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import { badge } from "@locator/styled-system/recipes";
import { Tooltip } from "./Tooltip";

export const LAYER_LABELS: Record<LocatorLayer, string> = {
  default: "default",
  team: "team",
  "user-extension": "extension",
  "user-origin": "this origin",
};

const LAYER_PALETTES: Record<LocatorLayer, "gray" | "blue" | "teal" | "amber"> =
  {
    default: "gray",
    team: "blue",
    "user-extension": "teal",
    "user-origin": "amber",
  };

export function ProvenanceBadge(props: { layer?: LocatorLayer }) {
  if (!props.layer) return null;
  const label = LAYER_LABELS[props.layer];
  return (
    <Tooltip label={`Setting comes from ${label}`}>
      <span
        class={cx(
          badge({ variant: "subtle", size: "sm" }),
          css({ colorPalette: LAYER_PALETTES[props.layer] })
        )}
      >
        {label}
      </span>
    </Tooltip>
  );
}
