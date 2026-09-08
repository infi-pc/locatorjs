import {
  bindingAt,
  canAddBinding,
  createBindingDraft,
  duplicateShortcutModifiers,
  globalIndexForTrigger,
  hasShortcutConflict,
  insertBinding,
  strictConfig,
  strictConfigStorage,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { ArrowLeft, Ellipsis, SlidersHorizontal } from "lucide-solid";
import {
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  untrack,
  type JSX,
} from "solid-js";
import { ActionInspector } from "./ActionInspector";
import { Button } from "./Button";
import { Select } from "./Select";
import { InspectorDialog } from "./InspectorDialog";
import { InteractionStudio, type StudioSelection } from "./InteractionStudio";
import { AdvancedSettings, SettingsSources } from "./AdvancedSettings";
import { EditorSetting } from "./EditorSetting";
import {
  effectiveEditorDestination,
  layersThroughScope,
  resolveLayerViews,
  type LayerViews,
} from "./configModel";

type Binding = strictConfig.BindingInput;
type BindingAction = strictConfig.BindingAction;
type BindingTrigger = strictConfig.BindingTrigger;
type LocatorLayer = strictConfig.LocatorLayerId;
type WriteResponse = strictConfigStorage.WriteResponse;
type WriteResult = strictConfigStorage.WriteResult;

export type ActionSettingsScope = {
  layer: LocatorLayer;
  label: string;
  write: (patch: strictConfig.LayerPatchInput) => Promise<WriteResult>;
  /**
   * Optional trusted context used while editing this scope. This lets an
   * extension keep page-provided team/site layers visible in SettingsSources
   * without using their layers or editor targets as the base of a global write.
   */
  editContext?: {
    layers: LayerViews;
    targets: strictConfig.TargetViewMap;
  };
  disabled?: boolean;
  disabledReason?: string;
  note?: string;
};

export type ActionSettingsSaveStatus = "idle" | "saving" | "saved" | "error";

type InspectorState =
  | { kind: "selected"; selection: StudioSelection }
  | { kind: "draft"; binding: Binding };

const styles = {
  root: css({ display: "flex", flexDirection: "column", gap: "3", minW: "0" }),
  topRow: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    minH: "7",
  }),
  topRowLeft: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    minW: "0",
  }),
  note: css({ color: "fg.subtle", fontSize: "xs" }),
  menu: css({ position: "relative" }),
  menuSummary: css({
    alignItems: "center",
    borderRadius: "l1",
    color: "fg.muted",
    cursor: "pointer",
    display: "inline-flex",
    h: "8",
    justifyContent: "center",
    listStyle: "none",
    w: "8",
    _hover: { bg: "gray.subtle.bg", color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  menuPopover: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    boxShadow: "lg",
    display: "flex",
    flexDirection: "column",
    minW: "48",
    p: "1",
    position: "absolute",
    right: "0",
    top: "9",
    zIndex: "dropdown",
  }),
  menuItem: css({
    alignItems: "center",
    appearance: "none",
    borderRadius: "l1",
    color: "fg.default",
    cursor: "pointer",
    display: "flex",
    fontSize: "xs",
    gap: "2",
    minH: "8",
    px: "2",
    textAlign: "left",
    _hover: { bg: "gray.subtle.bg" },
    _focusVisible: { focusVisibleRing: "inside" },
  }),
  error: css({ color: "red.plain.fg", fontSize: "xs" }),
  advanced: css({ display: "flex", flexDirection: "column", gap: "3" }),
  advancedHeader: css({
    alignItems: "center",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "auto minmax(0, 1fr)",
  }),
  advancedTitle: css({ fontSize: "lg", fontWeight: "bold" }),
};

export function ActionSettings(props: {
  layers: LayerViews;
  scopes: ActionSettingsScope[];
  activeScope?: LocatorLayer;
  defaultScope?: LocatorLayer;
  onActiveScopeChange?: (layer: LocatorLayer) => void;
  onTryAction?: (action: BindingAction) => void | Promise<void>;
  tryDisabled?: boolean;
  tryDisabledReason?: string;
  onSaveStatusChange?: (status: ActionSettingsSaveStatus) => void;
  targets: strictConfig.TargetViewMap;
  portalMount?: Node;
  inspectorMount?: Node;
  unavailableLayers?: LocatorLayer[];
  advancedExtras?: JSX.Element;
}) {
  const firstEnabled = () =>
    props.scopes.find((scope) => !scope.disabled)?.layer ??
    props.scopes[0]?.layer ??
    "user-origin";
  const requested = () =>
    props.scopes.find(
      (scope) => scope.layer === props.defaultScope && !scope.disabled
    )?.layer ?? firstEnabled();
  const [internalLayer, setInternalLayer] = createSignal<LocatorLayer>(
    requested()
  );
  const currentLayer = () => props.activeScope ?? internalLayer();
  const [route, setRoute] = createSignal<"studio" | "advanced">("studio");
  const [inspectorState, setInspectorState] = createSignal<InspectorState>();
  const [error, setError] = createSignal<string>();
  const [saveStatus, setSaveStatus] =
    createSignal<ActionSettingsSaveStatus>("idle");
  let menuElement: HTMLDetailsElement | undefined;

  onMount(() => {
    const ownerDocument = menuElement?.ownerDocument;
    if (!ownerDocument) return;

    const closeMenuOnOutsidePointerDown = (event: PointerEvent) => {
      if (!menuElement?.open || event.composedPath().includes(menuElement)) {
        return;
      }
      menuElement.open = false;
    };

    ownerDocument.addEventListener(
      "pointerdown",
      closeMenuOnOutsidePointerDown,
      true
    );
    onCleanup(() =>
      ownerDocument.removeEventListener(
        "pointerdown",
        closeMenuOnOutsidePointerDown,
        true
      )
    );
  });

  const activeScope = () =>
    props.scopes.find((scope) => scope.layer === currentLayer()) ??
    props.scopes[0];
  const editingContext = () =>
    activeScope()?.editContext ?? {
      layers: props.layers,
      targets: props.targets,
    };
  const editableLayers = () => editingContext().layers;
  const editableTargets = () => editingContext().targets;
  const scopedLayers = () =>
    layersThroughScope(editableLayers(), currentLayer());
  const snapshot = () => resolveLayerViews(scopedLayers(), editableTargets());
  const effective = () => strictConfig.effectiveOptions(snapshot());
  const bindings = () => strictConfig.encodeBindings(effective().bindings);
  const canInherit = () =>
    editableLayers()[currentLayer()]?.bindings !== undefined;
  const selection = createMemo(() => {
    const state = inspectorState();
    return state?.kind === "selected" ? state.selection : undefined;
  });
  const draft = createMemo(() => {
    const state = inspectorState();
    return state?.kind === "draft" ? state.binding : undefined;
  });

  let previousRequested = requested();
  createEffect(() => {
    const next = requested();
    if (props.activeScope === undefined && next !== previousRequested) {
      previousRequested = next;
      setInternalLayer(next);
    }
  });

  let previousLayer = untrack(currentLayer);
  createEffect(() => {
    const layer = currentLayer();
    if (layer !== previousLayer) {
      previousLayer = layer;
      setInspectorState(undefined);
      setRoute("studio");
      setError(undefined);
      setSaveStatus("idle");
    }
  });

  createEffect(() => {
    const scope = activeScope();
    if (!scope || scope.disabled) setScope(requested());
  });

  createEffect(() => {
    const current = selection();
    if (current && !bindingAt(bindings(), current.triggerKind, current.index)) {
      setInspectorState(undefined);
    }
  });

  createEffect(() => props.onSaveStatusChange?.(saveStatus()));

  const setScope = (layer: LocatorLayer) => {
    const scope = props.scopes.find((item) => item.layer === layer);
    if (!scope || scope.disabled || layer === currentLayer()) return;
    if (props.activeScope === undefined) setInternalLayer(layer);
    props.onActiveScopeChange?.(layer);
  };

  let writeSequence = 0;
  const write = async (patch: strictConfig.LayerPatchInput) => {
    const scope = activeScope();
    if (!scope) return { ok: false, reason: "blocked" } as const;
    const sequence = ++writeSequence;
    setError(undefined);
    setSaveStatus("saving");
    const result = await scope.write(patch);
    if (sequence === writeSequence) {
      if (result.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
        setError(
          result.reason === "quota"
            ? "Could not save because storage is full."
            : "Could not save settings. Try again."
        );
      }
    }
    return result;
  };

  const writeBindings = (next: Binding[] | undefined) =>
    next ? write({ set: { bindings: next } }) : write({ unset: ["bindings"] });

  const beginAdd = (triggerKind: BindingTrigger["kind"]) => {
    if (!canAddBinding(bindings(), triggerKind)) return;
    setInspectorState({
      kind: "draft",
      binding: createBindingDraft(triggerKind, bindings()),
    });
    setError(undefined);
  };

  const closeInspector = () => {
    setInspectorState(undefined);
  };

  const confirmDraft = async () => {
    const nextBinding = draft();
    if (!nextBinding) return;
    const next = insertBinding(bindings(), nextBinding);
    if (!next) return;
    const result = await writeBindings(next);
    if (result.ok) {
      closeInspector();
    }
  };

  const updateSelected = (next: Binding): WriteResponse => {
    const selected = selection();
    if (!selected) return { ok: false, reason: "unknown" };
    const globalIndex = globalIndexForTrigger(
      bindings(),
      selected.triggerKind,
      selected.index
    );
    if (globalIndex < 0) return { ok: false, reason: "unknown" };
    return writeBindings(
      bindings().map((binding, index) =>
        index === globalIndex ? next : binding
      )
    );
  };

  const removeSelected = async () => {
    const selected = selection();
    if (!selected) return;
    const globalIndex = globalIndexForTrigger(
      bindings(),
      selected.triggerKind,
      selected.index
    );
    if (globalIndex < 0) return;
    const next = bindings().filter((_, index) => index !== globalIndex);
    const result = await writeBindings(next);
    if (result.ok) {
      closeInspector();
    }
  };

  const selectedBinding = createMemo(() => {
    const selected = selection();
    return selected
      ? bindingAt(bindings(), selected.triggerKind, selected.index)
      : undefined;
  });
  const selectedDuplicate = () => {
    const binding = selectedBinding();
    return binding?.trigger.kind === "modifier-click"
      ? duplicateShortcutModifiers(bindings()).has(
          binding.trigger.modifiers.join("+")
        )
      : false;
  };
  const advancedScope = () => {
    const scope = activeScope();
    return scope ? { ...scope, write } : undefined;
  };

  const inspectorContent = () => (
    <Switch>
      <Match when={draft()}>
        {(draftBinding) => (
          <ActionInspector
            binding={draftBinding()}
            targets={editableTargets()}
            editor={effectiveEditorDestination(effective().editor)}
            portalMount={props.inspectorMount ?? props.portalMount}
            draft
            duplicate={hasShortcutConflict(draftBinding(), bindings())}
            onChange={(binding) => {
              // A draft only exists in memory until it is confirmed, so there
              // is no write to report on.
              setInspectorState({ kind: "draft", binding });
              return { ok: true };
            }}
            onCancel={closeInspector}
            onConfirm={confirmDraft}
          />
        )}
      </Match>
      <Match when={selectedBinding()}>
        {(binding) => (
          <ActionInspector
            binding={binding()}
            targets={editableTargets()}
            editor={effectiveEditorDestination(effective().editor)}
            portalMount={props.inspectorMount ?? props.portalMount}
            duplicate={selectedDuplicate()}
            tryDisabled={props.tryDisabled}
            tryDisabledReason={props.tryDisabledReason}
            onChange={updateSelected}
            onRemove={removeSelected}
            onTry={(action) => props.onTryAction?.(action)}
          />
        )}
      </Match>
    </Switch>
  );

  return (
    <div
      class={styles.root}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || event.defaultPrevented) return;
        if (inspectorState()) return;
        if (route() === "advanced") {
          event.preventDefault();
          setRoute("studio");
        }
      }}
    >
      <Show when={route() === "studio"}>
        <div class={styles.topRow}>
          <div class={styles.topRowLeft}>
            <Show when={props.scopes.length > 1}>
              <Select
                aria-label="Settings scope"
                variant="ghost"
                size="xs"
                items={props.scopes.map((scope) => ({
                  value: scope.layer,
                  label: scope.label,
                  disabled: scope.disabled,
                  title: scope.disabled ? scope.disabledReason : undefined,
                }))}
                value={currentLayer()}
                onChange={(layer) => setScope(layer as LocatorLayer)}
                portalMount={props.portalMount}
              />
            </Show>
            <Show when={activeScope()?.note}>
              <span class={styles.note}>{activeScope()?.note}</span>
            </Show>
          </div>
          <details ref={menuElement} class={styles.menu}>
            <summary
              class={styles.menuSummary}
              aria-label="Settings menu"
              title="Settings menu"
            >
              <Ellipsis size={18} />
            </summary>
            <div class={styles.menuPopover}>
              <button
                type="button"
                class={styles.menuItem}
                aria-label="Advanced settings"
                onClick={(event) => {
                  setRoute("advanced");
                  (
                    event.currentTarget.closest(
                      "details"
                    ) as HTMLDetailsElement | null
                  )?.removeAttribute("open");
                }}
              >
                <SlidersHorizontal size={14} /> Advanced settings
              </button>
              <Show when={canInherit()}>
                <button
                  type="button"
                  class={styles.menuItem}
                  onClick={(event) => {
                    void writeBindings(undefined);
                    (
                      event.currentTarget.closest(
                        "details"
                      ) as HTMLDetailsElement | null
                    )?.removeAttribute("open");
                  }}
                >
                  Use inherited actions
                </button>
              </Show>
            </div>
          </details>
        </div>
      </Show>

      <Switch>
        <Match when={route() === "studio"}>
          {/* Discard uncommitted editor drafts when their write scope changes. */}
          <Show when={currentLayer()} keyed>
            {(layer) => (
              <EditorSetting
                layers={scopedLayers()}
                layer={layer}
                targets={editableTargets()}
                portalMount={props.portalMount}
                write={write}
              />
            )}
          </Show>
          <InteractionStudio
            bindings={bindings()}
            targets={editableTargets()}
            editor={effectiveEditorDestination(effective().editor)}
            selection={selection()}
            onSelect={(next) => {
              setInspectorState({ kind: "selected", selection: next });
            }}
            onAdd={beginAdd}
          />
        </Match>
        <Match when={route() === "advanced" && advancedScope()}>
          <div class={styles.advanced}>
            <div class={styles.advancedHeader}>
              <Button
                size="xs"
                variant="ghost"
                aria-label="Back to interactions"
                onClick={() => setRoute("studio")}
              >
                <ArrowLeft size={15} />
              </Button>
              <h1 class={styles.advancedTitle}>Advanced</h1>
            </div>
            <AdvancedSettings
              scope={advancedScope()!}
              layers={scopedLayers()}
              targets={editableTargets()}
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
      </Switch>

      <InspectorDialog
        open={Boolean(inspectorState())}
        portalMount={props.inspectorMount ?? props.portalMount}
        contained={Boolean(props.inspectorMount)}
        onOpenChange={(open) => {
          if (!open) closeInspector();
        }}
      >
        {inspectorContent()}
      </InspectorDialog>

      <Show when={error()}>
        <div class={styles.error} role="alert">
          {error()}
        </div>
      </Show>
    </div>
  );
}
