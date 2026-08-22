import {
  DEFAULT_PROMPT_TEMPLATE,
  defaultBindingAction,
  type Binding,
  type BindingAction,
  type EditorSelection,
  type Targets,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { MousePointer2, Play, Plus, Trash2 } from "lucide-solid";
import { Show, onMount } from "solid-js";
import { actionIconFor, actionLabel, actionSelectItems } from "./actionIcons";
import { Button } from "./Button";
import { EditorPicker } from "./EditorPicker";
import { editorSettingLabel } from "./EditorSetting";
import { ModifierChips } from "./ModifierChips";
import { Select } from "./Select";
import { TextArea } from "./TextArea";

const styles = {
  inspector: css({
    bg: "bg.default",
    display: "flex",
    flexDirection: "column",
    gap: "4",
    minW: "0",
    p: "4",
  }),
  header: css({ display: "flex", flexDirection: "column", gap: "1", pr: "8" }),
  eyebrow: css({
    color: "accent.plain.fg",
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  }),
  title: css({
    alignItems: "center",
    display: "flex",
    fontSize: "lg",
    fontWeight: "semibold",
    gap: "2",
  }),
  subtitle: css({ color: "fg.muted", fontSize: "xs", lineHeight: "1.5" }),
  fields: css({ display: "flex", flexDirection: "column", gap: "3" }),
  field: css({ display: "flex", flexDirection: "column", gap: "1.5" }),
  label: css({ color: "fg.muted", fontSize: "xs", fontWeight: "medium" }),
  summary: css({ color: "fg.subtle", fontSize: "xs" }),
  warning: css({ color: "amber.plain.fg", fontSize: "xs" }),
  footer: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    justifyContent: "space-between",
    mt: "auto",
  }),
  footerGroup: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    ml: "auto",
  }),
};

export function ActionInspector(props: {
  binding: Binding;
  targets: Targets;
  editor?: EditorSelection;
  portalMount?: Node;
  duplicate?: boolean;
  draft?: boolean;
  tryDisabled?: boolean;
  tryDisabledReason?: string;
  onChange: (binding: Binding) => void;
  onRemove?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onTry?: (action: BindingAction) => void | Promise<void>;
}) {
  let heading: HTMLHeadingElement | undefined;
  onMount(() => {
    if (props.draft)
      queueMicrotask(() => heading?.focus({ preventScroll: true }));
  });
  const label = () =>
    actionLabel(props.binding.action, props.targets, props.editor);
  const setAction = (action: BindingAction) =>
    props.onChange({ ...props.binding, action });

  return (
    <aside class={styles.inspector} aria-label="Selected interaction editor">
      <div class={styles.header}>
        <span class={styles.eyebrow}>
          {props.draft
            ? "New interaction"
            : props.binding.trigger.kind === "modifier-click"
            ? "Shortcut rule"
            : "Toolbar button"}
        </span>
        <h2
          ref={(element) => (heading = element)}
          class={styles.title}
          tabIndex={-1}
        >
          {props.binding.trigger.kind === "modifier-click" ? (
            <MousePointer2 size={18} />
          ) : (
            actionIconFor(props.binding.action, props.targets, props.editor)
          )}
          {props.draft ? "Add interaction" : label()}
        </h2>
        <p class={styles.subtitle}>
          {props.draft
            ? "Choose the trigger and action, then add it to your interaction map."
            : "Changes save automatically. Try runs only this action on your next component click."}
        </p>
      </div>

      <div class={styles.fields}>
        <Show when={props.binding.trigger.kind === "modifier-click"}>
          <div class={styles.field}>
            <span class={styles.label}>Hold these keys</span>
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
            <Show when={props.duplicate}>
              <div class={styles.warning} role="alert">
                Duplicate shortcut; the first matching action wins.
              </div>
            </Show>
          </div>
        </Show>

        <div class={styles.field}>
          <span class={styles.label}>
            {props.binding.trigger.kind === "modifier-click"
              ? "On click, run"
              : "Button action"}
          </span>
          <Select
            aria-label="Action"
            items={actionSelectItems}
            value={props.binding.action.kind}
            portalMount={props.portalMount}
            onChange={(kind) => setAction(defaultBindingAction(kind))}
          />
        </div>

        <Show when={props.binding.action.kind === "open-editor"}>
          <div class={styles.field}>
            <span class={styles.label}>Editor</span>
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
                setAction({ kind: "open-editor", ...target })
              }
            />
            <div class={styles.summary}>
              Leave this on the Editor setting to follow it everywhere, or pick
              an editor to send only this action somewhere else.
            </div>
          </div>
        </Show>

        <Show when={props.binding.action.kind === "open-prompt"}>
          <div class={styles.field}>
            <span class={styles.label}>Prompt app</span>
            <Select
              aria-label="Prompt app"
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
                setAction({
                  kind: "open-prompt",
                  app: app as "cursor" | "windsurf",
                  template:
                    props.binding.action.kind === "open-prompt"
                      ? props.binding.action.template
                      : undefined,
                })
              }
            />
          </div>
        </Show>

        <Show
          when={
            props.binding.action.kind === "copy-prompt" ||
            props.binding.action.kind === "open-prompt"
          }
        >
          <div class={styles.field}>
            <span class={styles.label}>Prompt template</span>
            <TextArea
              aria-label="Prompt template"
              value={
                "template" in props.binding.action
                  ? props.binding.action.template ?? ""
                  : ""
              }
              placeholder={DEFAULT_PROMPT_TEMPLATE}
              onInput={(event) => {
                const template = event.currentTarget.value.trim() || undefined;
                if (props.binding.action.kind === "copy-prompt") {
                  setAction({ kind: "copy-prompt", template });
                } else if (props.binding.action.kind === "open-prompt") {
                  setAction({ ...props.binding.action, template });
                }
              }}
            />
            <div class={styles.summary}>
              Leave empty to use the built-in template.
            </div>
          </div>
        </Show>
      </div>

      <div class={styles.footer}>
        <Show when={!props.draft && props.onRemove}>
          <Button
            size="xs"
            variant="danger-ghost"
            onClick={() => props.onRemove?.()}
          >
            <Trash2 size={13} /> Remove
          </Button>
        </Show>
        <Show
          when={props.draft}
          fallback={
            <Show when={props.onTry}>
              <Button
                size="xs"
                variant="ghost"
                disabled={props.tryDisabled}
                title={props.tryDisabled ? props.tryDisabledReason : undefined}
                onClick={() => props.onTry?.(props.binding.action)}
              >
                <Play size={13} /> Try this action
              </Button>
            </Show>
          }
        >
          <div class={styles.footerGroup}>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => props.onCancel?.()}
            >
              Cancel
            </Button>
            <Button size="xs" onClick={() => props.onConfirm?.()}>
              <Plus size={13} /> Add
            </Button>
          </div>
        </Show>
      </div>
    </aside>
  );
}
