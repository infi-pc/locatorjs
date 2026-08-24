import { Show, createEffect, createMemo, createSignal } from "solid-js";
import {
  isSafeTargetTemplate,
  type EditorSelection,
  type Targets,
  type WriteResponse,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { Pencil } from "lucide-solid";
import { IconButton } from "./IconButton";
import { TextInput } from "./TextInput";
import { Select, SelectItem } from "./Select";
import { Tooltip } from "./Tooltip";
import { editorIconFor } from "./editorIcons";

const CUSTOM_VALUE = "__custom__";
const INHERIT_VALUE = "__inherit__";

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "2" }),
  helper: css({ color: "fg.muted", textStyle: "caption" }),
  error: css({ color: "error", textStyle: "caption" }),
  templateRow: css({
    alignItems: "center",
    bg: "gray.subtle.bg",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    minH: "8",
    px: "2.5",
  }),
  template: css({
    color: "fg.muted",
    fontFamily: "mono",
    fontSize: "xs",
    minW: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
};

export function EditorPicker(props: {
  targets: Targets;
  targetId?: string;
  targetTemplate?: string;
  disabled?: boolean;
  portalMount?: Node;
  controlId?: string;
  /**
   * Offers a "follow the Editor setting" choice, for per-action pickers where
   * no override is the default.
   */
  inheritLabel?: string;
  onChange: (patch: EditorSelection) => WriteResponse;
}) {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  const [validationError, setValidationError] = createSignal<string>();
  let input: HTMLInputElement | undefined;
  const items = createMemo<SelectItem[]>(() => [
    ...(props.inheritLabel
      ? [
          {
            value: INHERIT_VALUE,
            label: props.inheritLabel,
            icon: () => editorIconFor("default"),
          },
        ]
      : []),
    ...Object.entries(props.targets).map(([value, target]) => ({
      value,
      label: target.label,
      icon: () => editorIconFor(value),
    })),
    {
      value: CUSTOM_VALUE,
      label: "Custom link",
      icon: () => editorIconFor("custom"),
    },
  ]);
  const inherited = () =>
    Boolean(props.inheritLabel) && !props.targetId && !props.targetTemplate;
  const value = () => {
    if (inherited()) return INHERIT_VALUE;
    return props.targetTemplate ||
      (props.targetId && !props.targets[props.targetId])
      ? CUSTOM_VALUE
      : props.targetId ??
          (props.targets.vscode ? "vscode" : Object.keys(props.targets)[0]);
  };
  /** The link template this picker currently stands for, or "" if it has none. */
  const selectedTemplate = () => {
    if (inherited()) return "";
    if (props.targetTemplate) return props.targetTemplate;
    const id = value();
    // An id missing from the map has no template to show. Falling back to the
    // id itself would display -- and, once confirmed, persist -- a bare
    // `vscode` as the link template, which can never build a URL.
    if (!id || id === CUSTOM_VALUE) return "";
    return props.targets[id]?.url ?? "";
  };

  createEffect(() => {
    if (editing()) queueMicrotask(() => input?.focus());
  });

  function beginEditing() {
    setDraft(selectedTemplate());
    setValidationError(undefined);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(selectedTemplate());
    setValidationError(undefined);
    setEditing(false);
  }

  async function commitEditing() {
    if (!editing() || saving()) return;
    const next = draft().trim();
    if (!next) {
      cancelEditing();
      return;
    }
    if (!isSafeTargetTemplate(next)) {
      setValidationError(
        "Template must start with a URL scheme, for example vscode://."
      );
      input?.focus();
      return;
    }
    // Compared against what is *stored* as a template, not against what is
    // rendered. The draft is seeded from the selected editor's built-in
    // template, so comparing with that would make "pick Custom link, accept the
    // pre-filled value" a no-op -- and for a per-action picker that is the
    // difference between pinning a link and inheriting the Editor setting.
    if (next === (props.targetTemplate ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const result = await props.onChange({
        targetTemplate: next || undefined,
        targetId: undefined,
      });
      // A failed write keeps the draft on screen, so the typed template is not
      // silently discarded and re-seeded from props on the next open.
      if (result.ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class={styles.stack}>
      <Select
        id={props.controlId}
        aria-label="Editor"
        items={items()}
        value={value()}
        placeholder="Select editor"
        disabled={props.disabled}
        portalMount={props.portalMount}
        onChange={(next) => {
          if (next === CUSTOM_VALUE) {
            beginEditing();
          } else if (next === INHERIT_VALUE) {
            setEditing(false);
            void props.onChange({
              targetId: undefined,
              targetTemplate: undefined,
            });
          } else {
            setEditing(false);
            void props.onChange({ targetId: next, targetTemplate: undefined });
          }
        }}
      />
      <Show when={selectedTemplate() && !editing()}>
        <div class={styles.templateRow}>
          <code class={styles.template} title={selectedTemplate()}>
            {selectedTemplate()}
          </code>
          <Tooltip
            label="Customize link template"
            portalMount={props.portalMount}
          >
            <IconButton
              aria-label="Customize link template"
              disabled={props.disabled}
              onClick={beginEditing}
            >
              <Pencil size={14} />
            </IconButton>
          </Tooltip>
        </div>
      </Show>
      <Show when={editing()}>
        <TextInput
          ref={(element) => (input = element)}
          mono
          aria-label="Custom link template"
          value={draft()}
          disabled={props.disabled}
          aria-busy={saving() || undefined}
          aria-invalid={validationError() ? true : undefined}
          placeholder="editor://file/${projectPath}${filePath}:${line}:${column}"
          onInput={(event) => {
            setDraft(event.currentTarget.value);
            setValidationError(undefined);
          }}
          onBlur={commitEditing}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitEditing();
            } else if (event.key === "Escape") {
              event.preventDefault();
              cancelEditing();
            }
          }}
        />
        <div class={styles.helper}>
          Available variables: projectPath, filePath, line, column, tmuxSession
        </div>
        <Show when={validationError()}>
          <div class={styles.error} role="alert">
            {validationError()}
          </div>
        </Show>
      </Show>
    </div>
  );
}
