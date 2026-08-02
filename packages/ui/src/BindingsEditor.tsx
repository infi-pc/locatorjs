import {
  type Binding,
  type BindingAction,
  type BindingTrigger,
  type Targets,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { Copy, Plus, Trash2 } from "lucide-solid";
import { For, Show, createMemo, createSignal } from "solid-js";
import { Button } from "./Button";
import { EditorPicker } from "./EditorPicker";
import { IconButton } from "./IconButton";
import { ModifierChips } from "./ModifierChips";
import { Select } from "./Select";
import { TextArea } from "./TextArea";
import { actionSelectItems } from "./actionIcons";

const MAX_BINDINGS_PER_TRIGGER = 6;
const PREFERRED_MODIFIER_COMBINATIONS = [
  "alt",
  "alt+shift",
  "ctrl",
  "ctrl+shift",
  "meta",
  "meta+shift",
] as const;

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "2" }),
  section: css({ display: "flex", flexDirection: "column", gap: "2" }),
  sectionHeader: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  }),
  sectionTitle: css({
    color: "fg.muted",
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  }),
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
  draftActions: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    justifyContent: "flex-end",
  }),
};

export function BindingsEditor(props: {
  value: Binding[];
  targets: Targets;
  portalMount?: Node;
  onChange: (next: Binding[] | undefined) => void;
}) {
  const [draft, setDraft] = createSignal<Binding>();
  const duplicates = createMemo(() => {
    const counts = new Map<string, number>();
    for (const binding of props.value) {
      if (binding.trigger.kind === "modifier-click") {
        const value = binding.trigger.modifiers;
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    return new Set(
      [...counts].filter(([, count]) => count > 1).map(([combo]) => combo)
    );
  });

  const update = (index: number, next: Binding) => {
    props.onChange(
      props.value.map((binding, itemIndex) =>
        itemIndex === index ? next : binding
      )
    );
  };
  const remove = (index: number) =>
    props.onChange(props.value.filter((_, itemIndex) => itemIndex !== index));
  const beginAdd = (triggerKind: BindingTrigger["kind"]) => {
    const modifierBindings = bindingsForTrigger(props.value, "modifier-click");
    const toolbarBindings = bindingsForTrigger(props.value, "hover-toolbar");
    if (
      (triggerKind === "modifier-click"
        ? modifierBindings.length
        : toolbarBindings.length) >= MAX_BINDINGS_PER_TRIGGER
    )
      return;
    setDraft({
      trigger:
        triggerKind === "modifier-click"
          ? {
              kind: "modifier-click",
              modifiers: nextAvailableModifiers(props.value),
            }
          : { kind: "hover-toolbar" },
      action: defaultAction("open-editor"),
    });
  };
  const confirmDraft = () => {
    const binding = draft();
    if (!binding) return;
    const triggerKind = binding.trigger.kind;
    const modifierBindings = bindingsForTrigger(props.value, "modifier-click");
    const toolbarBindings = bindingsForTrigger(props.value, "hover-toolbar");
    if (
      (triggerKind === "modifier-click"
        ? modifierBindings.length
        : toolbarBindings.length) >= MAX_BINDINGS_PER_TRIGGER
    )
      return;
    props.onChange(
      triggerKind === "modifier-click"
        ? [...modifierBindings, binding, ...toolbarBindings]
        : [...modifierBindings, ...toolbarBindings, binding]
    );
    setDraft(undefined);
  };

  return (
    <div class={styles.stack}>
      <BindingGroup
        title="Modifier + click"
        triggerKind="modifier-click"
        value={props.value}
        targets={props.targets}
        portalMount={props.portalMount}
        draft={draft()?.trigger.kind === "modifier-click" ? draft() : undefined}
        duplicates={duplicates()}
        onAdd={() => beginAdd("modifier-click")}
        onDraftChange={setDraft}
        onDraftConfirm={confirmDraft}
        onDraftCancel={() => setDraft(undefined)}
        onUpdate={update}
        onRemove={remove}
      />
      <BindingGroup
        title="Hover toolbar"
        triggerKind="hover-toolbar"
        value={props.value}
        targets={props.targets}
        portalMount={props.portalMount}
        draft={draft()?.trigger.kind === "hover-toolbar" ? draft() : undefined}
        duplicates={duplicates()}
        onAdd={() => beginAdd("hover-toolbar")}
        onDraftChange={setDraft}
        onDraftConfirm={confirmDraft}
        onDraftCancel={() => setDraft(undefined)}
        onUpdate={update}
        onRemove={remove}
      />

      <div class={styles.footer}>
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

function BindingGroup(props: {
  title: string;
  triggerKind: BindingTrigger["kind"];
  value: Binding[];
  targets: Targets;
  portalMount?: Node;
  draft?: Binding;
  duplicates: Set<string>;
  onAdd: () => void;
  onDraftChange: (binding: Binding) => void;
  onDraftConfirm: () => void;
  onDraftCancel: () => void;
  onUpdate: (index: number, binding: Binding) => void;
  onRemove: (index: number) => void;
}) {
  const items = () =>
    props.value
      .map((binding, index) => ({ binding, index }))
      .filter(({ binding }) => binding.trigger.kind === props.triggerKind);
  const addLabel = () =>
    props.triggerKind === "modifier-click"
      ? "modifier + click binding"
      : "hover toolbar binding";

  return (
    <section class={styles.section}>
      <div class={styles.sectionHeader}>
        <h3 class={styles.sectionTitle}>{props.title}</h3>
        <Button
          size="xs"
          variant="ghost"
          aria-label={`Add ${addLabel()}`}
          aria-expanded={Boolean(props.draft)}
          disabled={items().length >= MAX_BINDINGS_PER_TRIGGER}
          onClick={() => (props.draft ? props.onDraftCancel() : props.onAdd())}
        >
          <Plus size={14} />
        </Button>
      </div>
      <For each={items()}>
        {({ binding, index }) => (
          <BindingRow
            binding={binding}
            index={index}
            targets={props.targets}
            portalMount={props.portalMount}
            duplicate={
              binding.trigger.kind === "modifier-click" &&
              props.duplicates.has(binding.trigger.modifiers)
            }
            onChange={(next) => props.onUpdate(index, next)}
            onRemove={() => props.onRemove(index)}
          />
        )}
      </For>
      <Show when={props.draft}>
        {(draft) => (
          <BindingRow
            binding={draft()}
            index={
              props.triggerKind === "modifier-click"
                ? items().length
                : props.value.length
            }
            targets={props.targets}
            portalMount={props.portalMount}
            actionLabel="New action"
            duplicate={hasDuplicateShortcut(draft(), props.value)}
            onChange={props.onDraftChange}
            onConfirm={props.onDraftConfirm}
            onCancel={props.onDraftCancel}
          />
        )}
      </Show>
    </section>
  );
}

function BindingRow(props: {
  binding: Binding;
  index: number;
  targets: Targets;
  portalMount?: Node;
  actionLabel?: string;
  duplicate: boolean;
  onChange: (binding: Binding) => void;
  onRemove?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const updateAction = (action: BindingAction) =>
    props.onChange({ ...props.binding, action });
  return (
    <div class={styles.row}>
      <div class={styles.rowHeader}>
        <Select
          aria-label={props.actionLabel ?? `Action ${props.index + 1}`}
          items={actionSelectItems}
          value={props.binding.action.kind}
          portalMount={props.portalMount}
          onChange={(kind) => updateAction(defaultAction(kind))}
        />
        <Show when={props.onRemove}>
          <IconButton
            aria-label={`Remove binding ${props.index + 1}`}
            onClick={() => props.onRemove?.()}
          >
            <Trash2 size={15} />
          </IconButton>
        </Show>
      </div>

      <Show
        when={props.binding.trigger.kind === "modifier-click"}
        fallback={<div class={styles.label}>Hover toolbar icon</div>}
      >
        <div class={styles.trigger}>
          <div>
            <div class={styles.label}>Modifier + click</div>
            <ModifierChips
              value={
                props.binding.trigger.kind === "modifier-click"
                  ? props.binding.trigger.modifiers
                  : undefined
              }
              onChange={(modifiers) => {
                if (!modifiers) return;
                props.onChange({
                  ...props.binding,
                  trigger: { kind: "modifier-click", modifiers },
                });
              }}
            />
          </div>
        </div>
      </Show>
      <Show when={props.duplicate}>
        <div class={styles.warning}>
          Duplicate shortcut; the first matching binding wins.
        </div>
      </Show>

      <Show when={props.binding.action.kind === "open-editor"}>
        <EditorPicker
          targets={props.targets}
          targetId={
            props.binding.action.kind === "open-editor"
              ? props.binding.action.targetId ??
                (props.targets.vscode
                  ? "vscode"
                  : Object.keys(props.targets)[0])
              : undefined
          }
          targetTemplate={
            props.binding.action.kind === "open-editor"
              ? props.binding.action.targetTemplate
              : undefined
          }
          portalMount={props.portalMount}
          onChange={(target) =>
            updateAction({ kind: "open-editor", ...target })
          }
        />
      </Show>

      <Show when={props.binding.action.kind === "open-prompt"}>
        <Select
          aria-label={`Prompt app ${props.index + 1}`}
          items={[
            { value: "cursor", label: "Cursor" },
            { value: "windsurf", label: "Windsurf" },
          ]}
          value={
            props.binding.action.kind === "open-prompt"
              ? props.binding.action.app
              : "cursor"
          }
          portalMount={props.portalMount}
          onChange={(app) =>
            updateAction({
              kind: "open-prompt",
              app: app as "cursor" | "windsurf",
              template:
                props.binding.action.kind === "open-prompt"
                  ? props.binding.action.template
                  : undefined,
            })
          }
        />
      </Show>

      <Show
        when={
          props.binding.action.kind === "copy-prompt" ||
          props.binding.action.kind === "open-prompt"
        }
      >
        <details class={styles.prompt}>
          <summary class={styles.details}>Customize prompt</summary>
          <TextArea
            aria-label={`Custom prompt ${props.index + 1}`}
            value={
              "template" in props.binding.action
                ? props.binding.action.template ?? ""
                : ""
            }
            placeholder="Use the built-in AI prompt template"
            onChange={(event) => {
              const template = event.currentTarget.value.trim() || undefined;
              if (props.binding.action.kind === "copy-prompt") {
                updateAction({ kind: "copy-prompt", template });
              } else if (props.binding.action.kind === "open-prompt") {
                updateAction({ ...props.binding.action, template });
              }
            }}
          />
        </details>
      </Show>
      <Show when={props.onConfirm}>
        <div class={styles.draftActions}>
          <Button size="xs" variant="ghost" onClick={() => props.onCancel?.()}>
            Cancel
          </Button>
          <Button size="xs" onClick={() => props.onConfirm?.()}>
            Confirm
          </Button>
        </div>
      </Show>
    </div>
  );
}

function bindingsForTrigger(bindings: Binding[], kind: BindingTrigger["kind"]) {
  return bindings.filter((binding) => binding.trigger.kind === kind);
}

function hasDuplicateShortcut(binding: Binding, bindings: Binding[]) {
  if (binding.trigger.kind !== "modifier-click") return false;
  const modifiers = binding.trigger.modifiers;
  return bindings.some(
    (candidate) =>
      candidate.trigger.kind === "modifier-click" &&
      candidate.trigger.modifiers === modifiers
  );
}

function nextAvailableModifiers(bindings: Binding[]) {
  const used = new Set(
    bindings.flatMap((binding) =>
      binding.trigger.kind === "modifier-click"
        ? [binding.trigger.modifiers]
        : []
    )
  );
  return (
    PREFERRED_MODIFIER_COMBINATIONS.find((value) => !used.has(value)) ?? "alt"
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
      return { kind: "open-editor", targetId: "vscode" };
  }
}
