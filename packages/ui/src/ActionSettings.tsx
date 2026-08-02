import {
  DEFAULT_PROMPT_TEMPLATE,
  LAYER_ORDER,
  getModifiersMap,
  modifiersTitles,
  normalizeLayer,
  resolve,
  resolveBindingTarget,
  type Binding,
  type BindingAction,
  type BindingTrigger,
  type LocatorLayer,
  type LocatorOptions,
  type Targets,
  type WriteResult,
} from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Copy,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-solid";
import {
  For,
  Match,
  Show,
  Switch as SolidSwitch,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  type JSX,
} from "solid-js";
import { actionIconFor, actionSelectItems } from "./actionIcons";
import { AdvancedSettings, SettingsSources } from "./LayeredOptionsEditor";
import { Button } from "./Button";
import { EditorPicker } from "./EditorPicker";
import { ModifierChips } from "./ModifierChips";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { Select } from "./Select";
import { TextArea } from "./TextArea";

export type ActionSettingsRoute =
  | { type: "overview" }
  | { type: "binding"; index: number }
  | { type: "new-binding" }
  | { type: "advanced" };

export type ActionSettingsScope = {
  layer: LocatorLayer;
  label: string;
  write: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  disabled?: boolean;
  disabledReason?: string;
  note?: string;
};

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
  root: css({ display: "flex", flexDirection: "column", gap: "3", minW: "0" }),
  rootPopup: css({
    display: "flex",
    flexDirection: "column",
    gap: "2",
    minW: "0",
  }),
  scopeTabs: css({
    bg: "gray.subtle.bg",
    borderRadius: "l2",
    display: "grid",
    gap: "1",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    p: "1",
  }),
  scopeTab: css({
    borderRadius: "l1",
    color: "fg.muted",
    cursor: "pointer",
    fontSize: "xs",
    fontWeight: "medium",
    minH: "8",
    px: "2",
    _selected: { bg: "bg.default", boxShadow: "xs", color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  scopeNote: css({ color: "fg.subtle", fontSize: "xs" }),
  scopeNotePopup: css({ display: "none" }),
  overview: css({ display: "flex", flexDirection: "column", gap: "2" }),
  overviewPopup: css({ display: "flex", flexDirection: "column", gap: "1" }),
  actionCopy: css({
    display: "flex",
    flexDirection: "column",
    gap: "1",
    minW: "0",
  }),
  titleLine: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5",
  }),
  summary: css({
    color: "fg.muted",
    fontSize: "xs",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  toolbarActions: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1",
  }),
  advancedLink: css({
    alignItems: "center",
    appearance: "none",
    color: "fg.muted",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    gap: "2",
    justifyContent: "space-between",
    minH: "9",
    px: "1",
    textAlign: "left",
    width: "100%",
    _hover: { color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  advancedLinkPopup: css({
    alignItems: "center",
    appearance: "none",
    color: "fg.muted",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    gap: "2",
    justifyContent: "space-between",
    minH: "7",
    px: "1",
    textAlign: "left",
    width: "100%",
    _hover: { color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  actionResult: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    minW: "0",
  }),
  mapSection: css({ display: "flex", flexDirection: "column", gap: "2" }),
  sectionHeader: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    minH: "7",
  }),
  sectionHeading: css({
    color: "fg.muted",
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  }),
  mapList: css({ display: "flex", flexDirection: "column", gap: "1.5" }),
  mapRule: css({
    alignItems: "center",
    appearance: "none",
    bg: "gray.subtle.bg",
    borderRadius: "l2",
    cursor: "pointer",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
    minH: "10",
    px: "3",
    textAlign: "left",
    width: "100%",
    _hover: { bg: "accent.subtle.bg" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  hoverRail: css({
    alignItems: "stretch",
    bg: "gray.subtle.bg",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5",
    p: "2",
  }),
  hoverButton: css({
    alignItems: "center",
    display: "inline-flex",
    gap: "1.5",
    justifyContent: "flex-start",
  }),
  detail: css({ display: "flex", flexDirection: "column", gap: "3" }),
  detailHeader: css({
    alignItems: "flex-start",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "auto minmax(0, 1fr)",
  }),
  detailHeading: css({ fontSize: "lg", fontWeight: "bold" }),
  detailSummary: css({ color: "fg.muted", fontSize: "sm", mt: "0.5" }),
  ruleComposer: css({
    display: "grid",
    gap: "2",
    gridTemplateColumns: "4rem minmax(0, 1fr)",
  }),
  ruleWord: css({
    color: "accent.plain.fg",
    fontSize: "sm",
    fontWeight: "bold",
    pt: "2",
  }),
  fieldStack: css({ display: "flex", flexDirection: "column", gap: "2" }),
  fieldLabel: css({ color: "fg.muted", fontSize: "xs", fontWeight: "medium" }),
  triggerDescription: css({ color: "fg.default", fontSize: "sm" }),
  triggerLine: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "3",
    justifyContent: "space-between",
  }),
  warning: css({ color: "amber.plain.fg", fontSize: "xs" }),
  warningMark: css({
    color: "amber.plain.fg",
    fontSize: "xs",
    fontWeight: "bold",
  }),
  error: css({ color: "red.plain.fg", fontSize: "xs" }),
  dangerRow: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-end",
  }),
  detailActions: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    justifyContent: "flex-end",
  }),
};

export function ActionSettings(props: {
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  scopes: ActionSettingsScope[];
  defaultScope?: LocatorLayer;
  targets: Targets;
  portalMount?: Node;
  unavailableLayers?: LocatorLayer[];
  renderPreview?: (
    action: Extract<BindingAction, { kind: "open-editor" }>
  ) => JSX.Element;
  advancedExtras?: JSX.Element;
  surface?: "popup" | "panel";
}) {
  const firstEnabled = () =>
    props.scopes.find((scope) => !scope.disabled)?.layer ??
    props.scopes[0]?.layer ??
    "user-origin";
  const requested = () =>
    props.scopes.find(
      (scope) => scope.layer === props.defaultScope && !scope.disabled
    )?.layer ?? firstEnabled();
  const [activeLayer, setActiveLayer] = createSignal<LocatorLayer>(requested());
  const [route, setRoute] = createSignal<ActionSettingsRoute>({
    type: "overview",
  });
  const [draft, setDraft] = createSignal<Binding>();
  const [error, setError] = createSignal<string>();
  let root: HTMLDivElement | undefined;
  let previousDefault = requested();

  createEffect(() => {
    const next = requested();
    if (next !== previousDefault) {
      previousDefault = next;
      setActiveLayer(next);
      setRoute({ type: "overview" });
      setDraft(undefined);
    }
  });

  createEffect(() => {
    const active = props.scopes.find((scope) => scope.layer === activeLayer());
    if (!active || active.disabled) setActiveLayer(requested());
  });

  const activeScope = () =>
    props.scopes.find((scope) => scope.layer === activeLayer()) ??
    props.scopes[0];
  const scopedLayers = () => layersThroughScope(props.layers, activeLayer());
  const snapshot = () => resolve(normalizedLayers(scopedLayers()));
  const bindings = () => snapshot().effective.bindings ?? [];
  const source = () => snapshot().provenance.bindings;
  const canInherit = () =>
    normalizeLayer(props.layers[activeLayer()] ?? {}).bindings !== undefined;
  const setScope = (layer: LocatorLayer) => {
    setActiveLayer(layer);
    setRoute({ type: "overview" });
    setDraft(undefined);
  };
  const writeBindings = async (next: Binding[] | undefined) => {
    const scope = activeScope();
    if (!scope) return false;
    setError(undefined);
    const result = await scope.write({
      bindings: next,
      mouseModifiers: undefined,
    });
    if (!result.ok) {
      setError(
        result.reason === "quota"
          ? "Could not save because storage is full."
          : "Could not save these actions."
      );
      return false;
    }
    return true;
  };
  const updateBinding = (index: number, next: Binding) =>
    writeBindings(
      bindings().map((binding, itemIndex) =>
        itemIndex === index ? next : binding
      )
    );
  const removeBinding = async (index: number) => {
    if (
      await writeBindings(
        bindings().filter((_, itemIndex) => itemIndex !== index)
      )
    ) {
      setRoute({ type: "overview" });
    }
  };
  const beginAdd = (triggerKind: BindingTrigger["kind"]) => {
    const current = bindings();
    if (
      bindingsForTrigger(current, triggerKind).length >=
      MAX_BINDINGS_PER_TRIGGER
    )
      return;
    setError(undefined);
    setDraft({
      trigger:
        triggerKind === "modifier-click"
          ? {
              kind: "modifier-click",
              modifiers: nextAvailableModifiers(current),
            }
          : { kind: "hover-toolbar" },
      action: defaultAction("open-editor", props.targets),
    });
    setRoute({ type: "new-binding" });
  };
  const confirmDraft = async () => {
    const binding = draft();
    if (!binding) return;
    const current = bindings();
    const triggerKind = binding.trigger.kind;
    if (
      bindingsForTrigger(current, triggerKind).length >=
      MAX_BINDINGS_PER_TRIGGER
    )
      return;
    const modifierBindings = bindingsForTrigger(current, "modifier-click");
    const toolbarBindings = bindingsForTrigger(current, "hover-toolbar");
    const next =
      triggerKind === "modifier-click"
        ? [...modifierBindings, binding, ...toolbarBindings]
        : [...modifierBindings, ...toolbarBindings, binding];
    if (await writeBindings(next)) {
      setDraft(undefined);
      setRoute({ type: "overview" });
      focusOverview(`[aria-label="${addButtonLabel(triggerKind)}"]`);
    }
  };
  const selected = createMemo(() => {
    const current = route();
    return current.type === "binding" ? bindings()[current.index] : undefined;
  });

  createEffect(() => {
    const current = route();
    if (current.type === "binding" && !bindings()[current.index]) {
      // The host write signal may settle one microtask after a successful add.
      // eslint-disable-next-line solid/reactivity
      queueMicrotask(() => {
        const latest = route();
        if (latest.type === "binding" && !bindings()[latest.index]) {
          setRoute({ type: "overview" });
        }
      });
    }
  });

  const focusOverview = (selector: string) =>
    queueMicrotask(() => root?.querySelector<HTMLElement>(selector)?.focus());
  const backFromBinding = (index: number) => {
    setRoute({ type: "overview" });
    focusOverview(`[aria-label^="Edit action ${index + 1}:"]`);
  };
  const backFromAdvanced = () => {
    setRoute({ type: "overview" });
    focusOverview('[aria-label="Advanced settings"]');
  };
  const backFromDraft = () => {
    const triggerKind = draft()?.trigger.kind;
    setDraft(undefined);
    setRoute({ type: "overview" });
    if (triggerKind) {
      focusOverview(`[aria-label="${addButtonLabel(triggerKind)}"]`);
    }
  };

  return (
    <div
      ref={(element) => (root = element)}
      class={props.surface === "popup" ? styles.rootPopup : styles.root}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || event.defaultPrevented) return;
        const current = route();
        if (current.type === "binding") {
          event.preventDefault();
          backFromBinding(current.index);
        } else if (current.type === "new-binding") {
          event.preventDefault();
          backFromDraft();
        } else if (current.type === "advanced") {
          event.preventDefault();
          backFromAdvanced();
        }
      }}
    >
      <Show when={props.scopes.length > 1}>
        <div
          class={styles.scopeTabs}
          role="tablist"
          aria-label="Settings scope"
        >
          <For each={props.scopes}>
            {(scope) => (
              <button
                type="button"
                role="tab"
                class={styles.scopeTab}
                aria-selected={activeLayer() === scope.layer}
                tabIndex={activeLayer() === scope.layer ? 0 : -1}
                disabled={scope.disabled}
                title={scope.disabled ? scope.disabledReason : undefined}
                onClick={() => setScope(scope.layer)}
                onKeyDown={(event) => {
                  const enabled = props.scopes.filter((item) => !item.disabled);
                  const currentIndex = enabled.findIndex(
                    (item) => item.layer === scope.layer
                  );
                  const delta =
                    event.key === "ArrowRight"
                      ? 1
                      : event.key === "ArrowLeft"
                      ? -1
                      : 0;
                  if (!delta || currentIndex < 0) return;
                  event.preventDefault();
                  const next =
                    enabled[
                      (currentIndex + delta + enabled.length) % enabled.length
                    ];
                  if (!next) return;
                  setScope(next.layer);
                  queueMicrotask(() =>
                    root
                      ?.querySelector<HTMLElement>(
                        `[role="tab"][aria-selected="true"]`
                      )
                      ?.focus()
                  );
                }}
              >
                {scope.label}
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show when={activeScope()?.note}>
        <div
          class={cx(
            styles.scopeNote,
            props.surface === "popup" && styles.scopeNotePopup
          )}
        >
          {activeScope()?.note}
        </div>
      </Show>

      <SolidSwitch>
        <Match when={route().type === "overview"}>
          <Overview
            bindings={bindings()}
            source={source()}
            targets={props.targets}
            onAdd={beginAdd}
            onOpen={(index) => setRoute({ type: "binding", index })}
            onAdvanced={() => setRoute({ type: "advanced" })}
            onInherited={() => writeBindings(undefined)}
            canInherit={canInherit()}
            surface={props.surface}
          />
        </Match>
        <Match when={route().type === "binding" && selected()}>
          <BindingDetail
            binding={selected()!}
            allBindings={bindings()}
            targets={props.targets}
            portalMount={props.portalMount}
            renderPreview={props.renderPreview}
            onBack={() =>
              backFromBinding(
                (route() as { type: "binding"; index: number }).index
              )
            }
            onChange={(next) =>
              updateBinding(
                (route() as { type: "binding"; index: number }).index,
                next
              )
            }
            onRemove={() =>
              removeBinding(
                (route() as { type: "binding"; index: number }).index
              )
            }
          />
        </Match>
        <Match when={route().type === "new-binding" && draft()}>
          <BindingDetail
            binding={draft()!}
            allBindings={bindings()}
            targets={props.targets}
            portalMount={props.portalMount}
            renderPreview={props.renderPreview}
            onBack={backFromDraft}
            onChange={setDraft}
            onConfirm={confirmDraft}
          />
        </Match>
        <Match when={route().type === "advanced"}>
          <div class={styles.detail}>
            <DetailHeader title="Advanced" onBack={backFromAdvanced} />
            <AdvancedSettings
              scope={activeScope()!}
              layers={scopedLayers()}
              targets={props.targets}
              portalMount={props.portalMount}
            />
            <SettingsSources
              layers={props.layers}
              targets={props.targets}
              unavailableLayers={props.unavailableLayers}
            />
            {props.advancedExtras}
          </div>
        </Match>
      </SolidSwitch>

      <Show when={error()}>
        <div class={styles.error} role="alert">
          {error()}
        </div>
      </Show>
    </div>
  );
}

function Overview(props: {
  bindings: Binding[];
  source?: LocatorLayer;
  targets: Targets;
  onAdd: (trigger: BindingTrigger["kind"]) => void;
  onOpen: (index: number) => void;
  onAdvanced: () => void;
  onInherited: () => void;
  canInherit: boolean;
  surface?: "popup" | "panel";
}) {
  return (
    <div
      class={props.surface === "popup" ? styles.overviewPopup : styles.overview}
    >
      <Show when={props.source}>
        {(layer) => (
          <div class={styles.titleLine}>
            <span class={styles.summary}>Actions set by</span>
            <ProvenanceBadge layer={layer()} />
          </div>
        )}
      </Show>

      <MapSection
        title="Modifier + click"
        triggerKind="modifier-click"
        bindings={props.bindings}
        targets={props.targets}
        onAdd={() => props.onAdd("modifier-click")}
        onOpen={(index) => props.onOpen(index)}
      />
      <MapSection
        title="Hover toolbar"
        triggerKind="hover-toolbar"
        bindings={props.bindings}
        targets={props.targets}
        onAdd={() => props.onAdd("hover-toolbar")}
        onOpen={(index) => props.onOpen(index)}
      />

      <Show when={props.canInherit}>
        <div class={styles.toolbarActions}>
          <Button size="xs" variant="ghost" onClick={() => props.onInherited()}>
            <Copy size={14} /> Use inherited
          </Button>
        </div>
      </Show>
      <button
        type="button"
        class={
          props.surface === "popup"
            ? styles.advancedLinkPopup
            : styles.advancedLink
        }
        aria-label="Advanced settings"
        onClick={() => props.onAdvanced()}
      >
        <span class={styles.titleLine}>
          <SlidersHorizontal size={16} /> Advanced
        </span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function MapSection(props: {
  title: string;
  triggerKind: BindingTrigger["kind"];
  bindings: Binding[];
  targets: Targets;
  onAdd: () => void;
  onOpen: (index: number) => void;
}) {
  const items = () =>
    props.bindings
      .map((binding, index) => ({ binding, index }))
      .filter(({ binding }) => binding.trigger.kind === props.triggerKind);
  return (
    <section class={styles.mapSection}>
      <div class={styles.sectionHeader}>
        <h2 class={styles.sectionHeading}>{props.title}</h2>
        <Button
          size="xs"
          variant="ghost"
          aria-label={addButtonLabel(props.triggerKind)}
          disabled={items().length >= MAX_BINDINGS_PER_TRIGGER}
          onClick={() => props.onAdd()}
        >
          <Plus size={14} />
        </Button>
      </div>

      <Show when={props.triggerKind === "modifier-click"}>
        <div class={styles.mapList}>
          <For each={items()}>
            {({ binding, index }) => {
              const actionLabel = () =>
                resolvedActionLabel(binding.action, props.targets);
              const modifiers = () =>
                binding.trigger.kind === "modifier-click"
                  ? binding.trigger.modifiers
                  : "";
              return (
                <button
                  type="button"
                  class={styles.mapRule}
                  aria-label={`Edit action ${index + 1}: ${actionLabel()}`}
                  onClick={() => props.onOpen(index)}
                >
                  <span>{modifierText(modifiers())} + Click</span>
                  <ArrowRight size={14} />
                  <span class={styles.actionResult}>
                    {resolvedActionIcon(binding.action, props.targets)}
                    <span class={styles.actionCopy}>
                      <span>{actionLabel()}</span>
                      <Show when={actionDetailSummary(binding.action)}>
                        {(summary) => (
                          <span class={styles.summary}>{summary()}</span>
                        )}
                      </Show>
                    </span>
                    <Show when={hasDuplicateShortcut(binding, props.bindings)}>
                      <span
                        class={styles.warningMark}
                        title="Duplicate shortcut"
                      >
                        !
                      </span>
                    </Show>
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={props.triggerKind === "hover-toolbar"}>
        <div class={styles.hoverRail}>
          <For each={items()}>
            {({ binding, index }) => {
              const actionLabel = () =>
                resolvedActionLabel(binding.action, props.targets);
              return (
                <Button
                  size="xs"
                  class={styles.hoverButton}
                  aria-label={`Edit action ${index + 1}: ${actionLabel()}`}
                  onClick={() => props.onOpen(index)}
                >
                  {resolvedActionIcon(binding.action, props.targets)}
                  <span class={styles.actionCopy}>
                    <span>{actionLabel()}</span>
                    <Show when={actionDetailSummary(binding.action)}>
                      {(summary) => (
                        <span class={styles.summary}>{summary()}</span>
                      )}
                    </Show>
                  </span>
                </Button>
              );
            }}
          </For>
        </div>
      </Show>
    </section>
  );
}

function BindingDetail(props: {
  binding: Binding;
  allBindings: Binding[];
  targets: Targets;
  portalMount?: Node;
  renderPreview?: (
    action: Extract<BindingAction, { kind: "open-editor" }>
  ) => JSX.Element;
  onBack: () => void;
  onChange: (next: Binding) => void;
  onRemove?: () => void;
  onConfirm?: () => void;
}) {
  const label = () => resolvedActionLabel(props.binding.action, props.targets);
  const duplicate = () =>
    hasDuplicateShortcut(props.binding, props.allBindings);
  return (
    <div class={styles.detail}>
      <DetailHeader
        title={label()}
        summary={bindingSentence(props.binding, props.targets)}
        onBack={() => props.onBack()}
      />
      <div class={styles.ruleComposer}>
        <div class={styles.ruleWord}>When</div>
        <TriggerEditor
          binding={props.binding}
          duplicate={duplicate()}
          onChange={(next) => props.onChange(next)}
        />
        <div class={styles.ruleWord}>Then</div>
        <ResultEditor
          binding={props.binding}
          targets={props.targets}
          portalMount={props.portalMount}
          onChange={(next) => props.onChange(next)}
        />
      </div>
      <Show
        when={
          props.binding.action.kind === "open-editor" && props.renderPreview
        }
      >
        {props.renderPreview?.(
          props.binding.action as Extract<
            BindingAction,
            { kind: "open-editor" }
          >
        )}
      </Show>
      <Show
        when={props.onConfirm}
        fallback={
          <div class={styles.dangerRow}>
            <Button
              size="xs"
              variant="danger-ghost"
              onClick={() => props.onRemove?.()}
            >
              <Trash2 size={14} /> Delete action
            </Button>
          </div>
        }
      >
        <div class={styles.detailActions}>
          <Button size="xs" variant="ghost" onClick={() => props.onBack()}>
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

function TriggerEditor(props: {
  binding: Binding;
  duplicate: boolean;
  onChange: (next: Binding) => void;
}) {
  return (
    <div class={styles.fieldStack}>
      <Show
        when={props.binding.trigger.kind === "modifier-click"}
        fallback={
          <>
            <div class={styles.fieldLabel}>Hover toolbar</div>
            <div class={styles.triggerDescription}>
              Show this action as an icon in the hover toolbar.
            </div>
          </>
        }
      >
        <div class={styles.fieldLabel}>Modifier + click</div>
        <div class={styles.triggerLine}>
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
        <Show when={props.duplicate}>
          <div class={styles.warning}>
            Duplicate shortcut; the first matching action wins.
          </div>
        </Show>
      </Show>
    </div>
  );
}

function ResultEditor(props: {
  binding: Binding;
  targets: Targets;
  portalMount?: Node;
  onChange: (next: Binding) => void;
}) {
  const setAction = (action: BindingAction) =>
    props.onChange({ ...props.binding, action });
  return (
    <div class={styles.fieldStack}>
      <div class={styles.fieldLabel}>Action</div>
      <Select
        aria-label="Action"
        items={actionSelectItems}
        value={props.binding.action.kind}
        portalMount={props.portalMount}
        onChange={(kind) => setAction(defaultAction(kind, props.targets))}
      />
      <Show when={props.binding.action.kind === "open-editor"}>
        <div class={styles.fieldLabel}>Editor</div>
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
          portalMount={props.portalMount}
          onChange={(target) => setAction({ kind: "open-editor", ...target })}
        />
      </Show>
      <Show when={props.binding.action.kind === "open-prompt"}>
        <div class={styles.fieldLabel}>Prompt app</div>
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
      </Show>
      <Show
        when={
          props.binding.action.kind === "copy-prompt" ||
          props.binding.action.kind === "open-prompt"
        }
      >
        <div class={styles.fieldLabel}>Prompt template</div>
        <TextArea
          aria-label="Prompt template"
          value={
            "template" in props.binding.action
              ? props.binding.action.template ?? ""
              : ""
          }
          placeholder={DEFAULT_PROMPT_TEMPLATE}
          onChange={(event) => {
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
      </Show>
    </div>
  );
}

function DetailHeader(props: {
  title: string;
  summary?: string;
  onBack: () => void;
}) {
  let heading: HTMLHeadingElement | undefined;
  onMount(() => queueMicrotask(() => heading?.focus()));
  return (
    <div class={styles.detailHeader}>
      <Button
        size="xs"
        variant="ghost"
        aria-label="Back to actions"
        onClick={() => props.onBack()}
      >
        <ArrowLeft size={15} />
      </Button>
      <div>
        <h1
          ref={(element) => (heading = element)}
          class={styles.detailHeading}
          tabIndex={-1}
        >
          {props.title}
        </h1>
        <Show when={props.summary}>
          <div class={styles.detailSummary}>{props.summary}</div>
        </Show>
      </div>
    </div>
  );
}

function modifierText(value: string) {
  return Object.keys(getModifiersMap(value))
    .map((key) => modifiersTitles[key as keyof typeof modifiersTitles] ?? key)
    .join(" + ");
}

function triggerSummary(binding: Binding) {
  return binding.trigger.kind === "modifier-click"
    ? `${modifierText(binding.trigger.modifiers)} + Click`
    : "Hover toolbar";
}

function resolvedActionLabel(action: BindingAction, targets: Targets) {
  if (action.kind !== "open-editor") {
    return action.kind === "copy-path"
      ? "Copy path"
      : action.kind === "copy-prompt"
      ? "Copy AI prompt"
      : action.kind === "open-prompt"
      ? `Open prompt in ${action.app === "cursor" ? "Cursor" : "Windsurf"}`
      : action.kind === "show-tree"
      ? "Tree view"
      : "Parents";
  }
  const target = resolveBindingTarget(action, targets);
  if (target.kind === "template") return "Open custom editor link";
  return `Open in ${targets[target.id]?.label ?? (target.id || "editor")}`;
}

function resolvedActionIcon(action: BindingAction, targets: Targets) {
  if (action.kind !== "open-editor") return actionIconFor(action, targets);
  const target = resolveBindingTarget(action, targets);
  return actionIconFor(
    target.kind === "template"
      ? { ...action, targetId: undefined, targetTemplate: target.url }
      : { ...action, targetId: target.id, targetTemplate: undefined },
    targets
  );
}

function actionDetailSummary(action: BindingAction) {
  if (action.kind === "open-editor" && action.targetTemplate)
    return action.targetTemplate;
  if (
    (action.kind === "copy-prompt" || action.kind === "open-prompt") &&
    action.template
  )
    return "Custom prompt template";
  if (action.kind === "copy-prompt" || action.kind === "open-prompt")
    return "Built-in prompt template";
  return undefined;
}

function bindingSentence(binding: Binding, targets: Targets) {
  return `${triggerSummary(binding)} → ${resolvedActionLabel(
    binding.action,
    targets
  )}`;
}

function defaultAction(kind: string, targets?: Targets): BindingAction {
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
      return {
        kind: "open-editor",
        targetId: targets?.vscode
          ? "vscode"
          : Object.keys(targets ?? {})[0] ?? "vscode",
      };
  }
}

function hasDuplicateShortcut(binding: Binding, bindings: Binding[]) {
  if (binding.trigger.kind !== "modifier-click") return false;
  const modifiers = binding.trigger.modifiers;
  return (
    bindings.filter(
      (candidate) =>
        candidate.trigger.kind === "modifier-click" &&
        candidate.trigger.modifiers === modifiers
    ).length > 1
  );
}

function bindingsForTrigger(bindings: Binding[], kind: BindingTrigger["kind"]) {
  return bindings.filter((binding) => binding.trigger.kind === kind);
}

function addButtonLabel(kind: BindingTrigger["kind"]) {
  return kind === "modifier-click"
    ? "Add modifier + click action"
    : "Add hover toolbar action";
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

function normalizedLayers(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>
) {
  return Object.fromEntries(
    Object.entries(layers).map(([layer, options]) => [
      layer,
      normalizeLayer(options),
    ])
  ) as Partial<Record<LocatorLayer, LocatorOptions>>;
}

function layersThroughScope(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>,
  scope: LocatorLayer
) {
  const lastIndex = LAYER_ORDER.indexOf(scope);
  return Object.fromEntries(
    LAYER_ORDER.slice(0, lastIndex + 1)
      .filter((layer) => layers[layer] !== undefined)
      .map((layer) => [layer, layers[layer]])
  ) as Partial<Record<LocatorLayer, LocatorOptions>>;
}
