import {
  type Binding,
  type BindingAction,
  type Targets,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { Copy, Plus, Trash2 } from "lucide-solid";
import { For, Show, createMemo } from "solid-js";
import { Button } from "./Button";
import { EditorPicker } from "./EditorPicker";
import { IconButton } from "./IconButton";
import { ModifierChips } from "./ModifierChips";
import { Select } from "./Select";
import { Switch } from "./Switch";
import { TextArea } from "./TextArea";

const MAX_BINDINGS = 6;

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "2" }),
  row: css({
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    display: "flex",
    flexDirection: "column",
    gap: "2.5",
    p: "2.5",
  }),
  rowHeader: css({
    alignItems: "center",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "minmax(0, 1fr) auto",
  }),
  trigger: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    justifyContent: "space-between",
  }),
  label: css({ color: "fg.muted", fontSize: "xs" }),
  warning: css({ color: "amber.plain.fg", fontSize: "xs" }),
  prompt: css({ display: "flex", flexDirection: "column", gap: "1.5" }),
  details: css({
    color: "fg.muted",
    cursor: "pointer",
    fontSize: "xs",
  }),
  footer: css({ alignItems: "center", display: "flex", gap: "2" }),
};

const actionItems = [
  { value: "open-editor", label: "Open in editor" },
  { value: "copy-path", label: "Copy path" },
  { value: "copy-prompt", label: "Copy AI prompt" },
  { value: "open-prompt", label: "Open AI prompt in…" },
  { value: "show-tree", label: "Tree view" },
  { value: "show-parents", label: "Parents" },
];

export function BindingsEditor(props: {
  value: Binding[];
  targets: Targets;
  portalMount?: Node;
  onChange: (next: Binding[] | undefined) => void;
}) {
  const duplicates = createMemo(() => {
    const counts = new Map<string, number>();
    for (const binding of props.value) {
      if (binding.modifiers) {
        counts.set(binding.modifiers, (counts.get(binding.modifiers) ?? 0) + 1);
      }
    }
    return new Set(
      [...counts].filter(([, count]) => count > 1).map(([combo]) => combo)
    );
  });

  const update = (index: number, patch: Partial<Binding>) => {
    props.onChange(
      props.value.map((binding, itemIndex) =>
        itemIndex === index ? { ...binding, ...patch } : binding
      )
    );
  };
  const updateAction = (index: number, action: BindingAction) =>
    update(index, { action });

  return (
    <div class={styles.stack}>
      <For each={props.value}>
        {(binding, index) => (
          <div class={styles.row}>
            <div class={styles.rowHeader}>
              <Select
                aria-label={`Action ${index() + 1}`}
                items={actionItems}
                value={binding.action.kind}
                portalMount={props.portalMount}
                onChange={(kind) => updateAction(index(), defaultAction(kind))}
              />
              <IconButton
                aria-label={`Remove binding ${index() + 1}`}
                onClick={() =>
                  props.onChange(
                    props.value.filter((_, itemIndex) => itemIndex !== index())
                  )
                }
              >
                <Trash2 size={15} />
              </IconButton>
            </div>

            <div class={styles.trigger}>
              <div>
                <div class={styles.label}>Modifier + click</div>
                <ModifierChips
                  value={binding.modifiers}
                  onChange={(modifiers) =>
                    update(index(), {
                      modifiers,
                      ...(!modifiers && !binding.icon ? { icon: true } : {}),
                    })
                  }
                />
              </div>
              <Switch
                label={`Show binding ${index() + 1} as hover icon`}
                checked={!!binding.icon}
                onChange={(icon) => {
                  if (!icon && !binding.modifiers) return;
                  update(index(), { icon: icon || undefined });
                }}
              >
                Hover icon
              </Switch>
            </div>

            <Show when={!binding.modifiers && !binding.icon}>
              <div class={styles.warning}>
                Choose a modifier combination, a hover icon, or both.
              </div>
            </Show>
            <Show
              when={binding.modifiers && duplicates().has(binding.modifiers)}
            >
              <div class={styles.warning}>
                Duplicate shortcut; the first matching binding wins.
              </div>
            </Show>

            <Show when={binding.action.kind === "open-editor"}>
              <EditorPicker
                allowDefault
                targets={props.targets}
                targetId={
                  binding.action.kind === "open-editor"
                    ? binding.action.targetId
                    : undefined
                }
                targetTemplate={
                  binding.action.kind === "open-editor"
                    ? binding.action.targetTemplate
                    : undefined
                }
                portalMount={props.portalMount}
                onChange={(target) =>
                  updateAction(index(), { kind: "open-editor", ...target })
                }
              />
            </Show>

            <Show when={binding.action.kind === "open-prompt"}>
              <Select
                aria-label={`Prompt app ${index() + 1}`}
                items={[
                  { value: "cursor", label: "Cursor" },
                  { value: "windsurf", label: "Windsurf" },
                ]}
                value={
                  binding.action.kind === "open-prompt"
                    ? binding.action.app
                    : "cursor"
                }
                portalMount={props.portalMount}
                onChange={(app) =>
                  updateAction(index(), {
                    kind: "open-prompt",
                    app: app as "cursor" | "windsurf",
                    template:
                      binding.action.kind === "open-prompt"
                        ? binding.action.template
                        : undefined,
                  })
                }
              />
            </Show>

            <Show
              when={
                binding.action.kind === "copy-prompt" ||
                binding.action.kind === "open-prompt"
              }
            >
              <details class={styles.prompt}>
                <summary class={styles.details}>Customize prompt</summary>
                <TextArea
                  aria-label={`Custom prompt ${index() + 1}`}
                  value={
                    "template" in binding.action
                      ? binding.action.template ?? ""
                      : ""
                  }
                  placeholder="Use the shared AI prompt template"
                  onChange={(event) => {
                    const template =
                      event.currentTarget.value.trim() || undefined;
                    if (binding.action.kind === "copy-prompt") {
                      updateAction(index(), {
                        kind: "copy-prompt",
                        template,
                      });
                    } else if (binding.action.kind === "open-prompt") {
                      updateAction(index(), {
                        ...binding.action,
                        template,
                      });
                    }
                  }}
                />
              </details>
            </Show>
          </div>
        )}
      </For>

      <div class={styles.footer}>
        <Button
          size="xs"
          variant="outline"
          disabled={props.value.length >= MAX_BINDINGS}
          onClick={() =>
            props.onChange([
              ...props.value,
              { modifiers: "alt+shift", action: { kind: "copy-prompt" } },
            ])
          }
        >
          <Plus size={14} />
          Add binding
        </Button>
        <Show when={props.value.length > 0}>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => props.onChange(undefined)}
          >
            <Copy size={14} />
            Use inherited
          </Button>
        </Show>
      </div>
    </div>
  );
}

function defaultAction(kind: string): BindingAction {
  switch (kind) {
    case "copy-path":
      return { kind: "copy-path" };
    case "copy-prompt":
      return { kind: "copy-prompt" };
    case "open-prompt":
      return { kind: "open-prompt", app: "cursor" };
    case "show-tree":
      return { kind: "show-tree" };
    case "show-parents":
      return { kind: "show-parents" };
    default:
      return { kind: "open-editor" };
  }
}
