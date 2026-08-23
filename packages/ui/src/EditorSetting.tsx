import {
  resolveEditorTarget,
  type LocatorLayer,
  type LocatorOptions,
  type Targets,
  type WriteResponse,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { RotateCcw } from "lucide-solid";
import { Show } from "solid-js";
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

/**
 * The one destination every source link opens in. Individual `open-editor`
 * actions inherit it unless they pin their own editor.
 */
export function EditorSetting(props: {
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  layer: LocatorLayer;
  targets: Targets;
  portalMount?: Node;
  error?: string;
  write: (patch: Partial<LocatorOptions>) => WriteResponse;
}) {
  const state = () => layerFieldState(props.layers, props.layer, "editor");
  const editor = () => state().value ?? {};
  const unresolved = () =>
    resolveEditorTarget(editor(), props.targets).kind === "fallback";

  return (
    <Field
      label="Editor"
      meta={
        <span class={styles.meta}>
          <Show when={state().source && state().source !== props.layer}>
            <ProvenanceBadge layer={state().source!} />
          </Show>
          <Show when={state().setHere}>
            <Tooltip label="Revert Editor" portalMount={props.portalMount}>
              <IconButton
                aria-label="Revert Editor"
                class={styles.reset}
                onClick={() => props.write({ editor: undefined })}
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
        (unresolved() ? "Pick an editor so source links can open." : undefined)
      }
    >
      <EditorPicker
        targets={props.targets}
        targetId={editor().targetId}
        targetTemplate={editor().targetTemplate}
        portalMount={props.portalMount}
        onChange={(patch) => props.write({ editor: patch })}
      />
    </Field>
  );
}

/**
 * Human-readable name of the editor a non-overriding action will open, for the
 * "follow the Editor setting" choice in per-action pickers.
 */
export function editorSettingLabel(
  editor: LocatorOptions["editor"],
  targets: Targets
): string {
  const resolved = resolveEditorTarget(editor, targets);
  if (resolved.kind === "template") return "Editor setting (custom link)";
  if (resolved.kind === "fallback") return "Editor setting (not set)";
  return `Editor setting (${targets[resolved.id]?.label ?? resolved.id})`;
}
