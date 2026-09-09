import { strictConfig, strictConfigStorage } from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { RotateCcw } from "lucide-solid";
import { Show, createUniqueId } from "solid-js";
import type { LayerViews } from "./configModel";
import { EditorPicker } from "./EditorPicker";
import { Field } from "./Field";
import { IconButton } from "./IconButton";
import { layerFieldState } from "./layerFieldState";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { Tooltip } from "./Tooltip";

const styles = {
  meta: css({
    alignItems: "center",
    display: "inline-flex",
    gap: "1",
    minH: "5",
  }),
  reset: css({
    color: "fg.subtle",
    opacity: "0.72",
    _hover: { color: "fg.default", opacity: "1" },
  }),
};

export function EditorSetting(props: {
  layers: LayerViews;
  layer: strictConfig.LocatorLayerId;
  targets: strictConfig.TargetViewMap;
  portalMount?: Node;
  error?: string;
  write: (
    patch: strictConfig.LayerPatchInput
  ) => strictConfigStorage.WriteResponse;
}) {
  const controlId = `locator-editor-${createUniqueId()}`;
  const state = () =>
    layerFieldState(props.layers, props.layer, "editor", props.targets);
  const editor = () => state().value;

  return (
    <Field
      label="Editor"
      controlId={controlId}
      meta={
        <span class={styles.meta}>
          <Show when={state().source !== props.layer}>
            <ProvenanceBadge layer={state().source} />
          </Show>
          <Show when={state().setHere}>
            <Tooltip label="Revert Editor" portalMount={props.portalMount}>
              <IconButton
                aria-label="Revert Editor"
                class={styles.reset}
                onClick={() => props.write({ unset: ["editor"] })}
              >
                <RotateCcw size={14} />
              </IconButton>
            </Tooltip>
          </Show>
        </span>
      }
      helper="Where source links open. Individual actions can override it."
      error={
        props.error ??
        (!editor() ? "Pick an editor so source links can open." : undefined)
      }
    >
      <EditorPicker
        controlId={controlId}
        targets={props.targets}
        value={editor()}
        portalMount={props.portalMount}
        onChange={(destination) =>
          destination
            ? props.write({ set: { editor: destination } })
            : props.write({ unset: ["editor"] })
        }
      />
    </Field>
  );
}

export function editorSettingLabel(
  editor: strictConfig.EditorDestination | undefined,
  targets: strictConfig.TargetViewMap
): string {
  if (!editor) return "Editor setting (not set)";
  if (editor.kind === "template") return "Editor setting (custom link)";
  return `Editor setting (${targets[editor.id]?.label ?? editor.id})`;
}
