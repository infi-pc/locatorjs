import type { LocatorLayer } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import { badge } from "@locator/styled-system/recipes";
import { Tooltip } from "./Tooltip";

export const LAYER_LABELS: Record<LocatorLayer, string> = {
  default: "Default",
  team: "Team",
  "user-extension": "Extension",
  "user-origin": "This origin",
};

const LAYER_TOOLTIPS: Record<LocatorLayer, string> = {
  default: "Built-in LocatorJS default",
  team: "Set by setup() in your app's code",
  "user-extension": "Change this in the extension popup",
  "user-origin": "Saved for this origin in your browser",
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
    <Tooltip label={LAYER_TOOLTIPS[props.layer]}>
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
