import type { LocatorLayer } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import { badge } from "@locator/styled-system/recipes";
import { Show } from "solid-js";
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

/**
 * Every read of `props.layer` has to stay inside a tracked scope. The early
 * return and the hoisted `label` ran once, so when provenance changed between
 * two layers the badge's colour and tooltip updated while its text kept saying
 * "Default" -- the call sites wrap this in a non-keyed `<Show>`, which only
 * rebuilds when truthiness flips.
 */
export function ProvenanceBadge(props: { layer?: LocatorLayer }) {
  return (
    <Show when={props.layer}>
      {(layer) => (
        <Tooltip label={LAYER_TOOLTIPS[layer()]}>
          <span
            class={cx(
              badge({ variant: "subtle", size: "sm" }),
              css({ colorPalette: LAYER_PALETTES[layer()] })
            )}
          >
            {LAYER_LABELS[layer()]}
          </span>
        </Tooltip>
      )}
    </Show>
  );
}
