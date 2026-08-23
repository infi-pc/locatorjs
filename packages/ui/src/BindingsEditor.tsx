import {
  MAX_BINDINGS_PER_TRIGGER,
  canAddBinding,
  createBindingDraft,
  defaultBindingAction,
  duplicateShortcutModifiers,
  hasShortcutConflict,
  insertBinding,
  type Binding,
  type BindingAction,
  type BindingTrigger,
  type EditorSelection,
  type Targets,
  type WriteResponse,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { Copy, Plus, Trash2 } from "lucide-solid";
import { For, Show, createMemo, createSignal } from "solid-js";
import { Button } from "./Button";
import { EditorPicker } from "./EditorPicker";
import { editorSettingLabel } from "./EditorSetting";
import { IconButton } from "./IconButton";
import { ModifierChips } from "./ModifierChips";
import { Select } from "./Select";
import { TextArea } from "./TextArea";
import { actionSelectItems } from "./actionIcons";

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
  editor?: EditorSelection;
  portalMount?: Node;
  /** Trigger groups to show. Defaults to all of them. */
  triggers?: BindingTrigger["kind"][];
  onChange: (next: Binding[] | undefined) => WriteResponse;
}) {
  const [draft, setDraft] = createSignal<Binding>();
  const shows = (kind: BindingTrigger["kind"]) =>
    !props.triggers || props.triggers.includes(kind);
  const duplicates = createMemo(() => duplicateShortcutModifiers(props.value));

  const update = (index: number, next: Binding) =>
    props.onChange(
      props.value.map((binding, itemIndex) =>
        itemIndex === index ? next : binding
      )
    );
  const remove = (index: number) =>
    props.onChange(props.value.filter((_, itemIndex) => itemIndex !== index));
  const beginAdd = (triggerKind: BindingTrigger["kind"]) => {
    if (!canAddBinding(props.value, triggerKind)) return;
    setDraft(createBindingDraft(triggerKind, props.value));
  };
  const confirmDraft = async () => {
    const binding = draft();
    if (!binding) return;
    const next = insertBinding(props.value, binding);
    if (!next) return;
    // The draft stays open on a failed write, so the half-built binding is not
    // thrown away along with the failure.
    if ((await props.onChange(next)).ok) setDraft(undefined);
  };

  return (
    <div class={styles.stack}>
      <Show when={shows("modifier-click")}>
        <BindingGroup
          title="Modifier + click"
          triggerKind="modifier-click"
          value={props.value}
          targets={props.targets}
          editor={props.editor}
          portalMount={props.portalMount}
          draft={
            draft()?.trigger.kind === "modifier-click" ? draft() : undefined
          }
          duplicates={duplicates()}
          onAdd={() => beginAdd("modifier-click")}
          onDraftChange={setDraft}
          onDraftConfirm={confirmDraft}
          onDraftCancel={() => setDraft(undefined)}
          onUpdate={update}
          onRemove={remove}
        />
      </Show>
      <Show when={shows("hover-toolbar")}>
        <BindingGroup
          title="Hover toolbar"
          triggerKind="hover-toolbar"
          value={props.value}
          targets={props.targets}
          editor={props.editor}
          portalMount={props.portalMount}
          draft={
            draft()?.trigger.kind === "hover-toolbar" ? draft() : undefined
          }
          duplicates={duplicates()}
          onAdd={() => beginAdd("hover-toolbar")}
          onDraftChange={setDraft}
          onDraftConfirm={confirmDraft}
          onDraftCancel={() => setDraft(undefined)}
          onUpdate={update}
          onRemove={remove}
        />
      </Show>

      <div class={styles.footer}>
        <Show when={props.value.length > 0}>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => void props.onChange(undefined)}
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
  editor?: EditorSelection;
  portalMount?: Node;
  draft?: Binding;
  duplicates: Set<string>;
  onAdd: () => void;
  onDraftChange: (binding: Binding) => void;
  onDraftConfirm: () => void;
  onDraftCancel: () => void;
  onUpdate: (index: number, binding: Binding) => WriteResponse;
  onRemove: (index: number) => WriteResponse;
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
            editor={props.editor}
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
            editor={props.editor}
            portalMount={props.portalMount}
            actionLabel="New action"
            duplicate={hasShortcutConflict(draft(), props.value)}
            onChange={(binding) => {
              // A draft lives in memory until it is confirmed, so editing one
              // is not a write and has no outcome to report.
              props.onDraftChange(binding);
              return { ok: true };
            }}
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
  editor?: EditorSelection;
  portalMount?: Node;
  actionLabel?: string;
  duplicate: boolean;
  onChange: (binding: Binding) => WriteResponse;
  onRemove?: () => WriteResponse;
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
          onChange={(kind) => updateAction(defaultBindingAction(kind))}
        />
        <Show when={props.onRemove}>
          <IconButton
            aria-label={`Remove binding ${props.index + 1}`}
            onClick={() => void props.onRemove?.()}
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
                void props.onChange({
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
              ? props.binding.action.targetId
              : undefined
          }
          targetTemplate={
            props.binding.action.kind === "open-editor"
              ? props.binding.action.targetTemplate
              : undefined
          }
          inheritLabel={editorSettingLabel(props.editor, props.targets)}
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
            onInput={(event) => {
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
