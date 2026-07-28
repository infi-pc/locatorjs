import { Show, createEffect, createMemo, createSignal } from "solid-js";
import type { LocatorOptions, Targets } from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { Pencil } from "lucide-solid";
import { IconButton } from "./IconButton";
import { TextInput } from "./TextInput";
import { Select, SelectItem } from "./Select";
import { Tooltip } from "./Tooltip";
import { editorIconFor } from "./editorIcons";

const CUSTOM_VALUE = "__custom__";

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "2" }),
  helper: css({ color: "fg.muted", textStyle: "caption" }),
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
  onChange: (
    patch: Pick<LocatorOptions, "targetId" | "targetTemplate">
  ) => void | boolean | Promise<void | boolean>;
}) {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  let input: HTMLInputElement | undefined;
  const items = createMemo<SelectItem[]>(() => [
    ...Object.entries(props.targets).map(([value, target]) => ({
      value,
      label: target.label,
      icon: editorIconFor(value),
    })),
    {
      value: CUSTOM_VALUE,
      label: "Custom link",
      icon: editorIconFor("custom"),
    },
  ]);
  const value = () =>
    props.targetTemplate || (props.targetId && !props.targets[props.targetId])
      ? CUSTOM_VALUE
      : props.targetId;
  const selectedTemplate = () =>
    props.targetTemplate ??
    (props.targetId
      ? props.targets[props.targetId]?.url ?? props.targetId
      : "");

  createEffect(() => {
    if (editing()) queueMicrotask(() => input?.focus());
  });

  function beginEditing() {
    setDraft(selectedTemplate());
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(selectedTemplate());
    setEditing(false);
  }

  async function commitEditing() {
    if (!editing() || saving()) return;
    const next = draft().trim();
    if (next === selectedTemplate()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const result = await props.onChange({
        targetTemplate: next || undefined,
        targetId: undefined,
      });
      if (result !== false) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class={styles.stack}>
      <Select
        items={items()}
        value={value()}
        placeholder="Select editor"
        disabled={props.disabled}
        portalMount={props.portalMount}
        onChange={(next) => {
          if (next === CUSTOM_VALUE) {
            beginEditing();
          } else {
            setEditing(false);
            props.onChange({ targetId: next, targetTemplate: undefined });
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
          placeholder="editor://file/${projectPath}${filePath}:${line}:${column}"
          onInput={(event) => {
            setDraft(event.currentTarget.value);
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
      </Show>
    </div>
  );
}
