import { strictConfig, strictConfigStorage } from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { RotateCcw } from "lucide-solid";
import {
  For,
  Show,
  createEffect,
  createSignal,
  createUniqueId,
} from "solid-js";
import { Field } from "./Field";
import { FoldableSection } from "./FoldableSection";
import { IconButton } from "./IconButton";
import { layerFieldState } from "./layerFieldState";
import { LAYER_LABELS, ProvenanceBadge } from "./ProvenanceBadge";
import { Switch } from "./Switch";
import { TextInput } from "./TextInput";
import { Tooltip } from "./Tooltip";
import { LAYER_ORDER, type LayerViews } from "./configModel";

type FieldKey = strictConfig.ConfigField;
type LocatorLayer = strictConfig.LocatorLayerId;
type WriteResult = strictConfigStorage.WriteResult;
type WriteResponse = strictConfigStorage.WriteResponse;

function setField<K extends strictConfig.ConfigField>(
  field: K,
  value: NonNullable<strictConfig.LocatorLayerInput[K]>
): strictConfig.LayerPatchInput {
  return {
    set: { [field]: value } as Partial<strictConfig.LocatorLayerInput>,
  };
}

const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
  projectPath: "Project path",
  replacePath: "Path replace",
  bindings: "Actions",
  editor: "Editor",
  hrefTarget: "Open links in a new tab",
  tmuxSession: "Tmux session",
  debugMode: "Debug mode",
  showIntro: "Show intro again",
  adapter: "Adapter",
  disabled: "Disabled",
};

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "3" }),
  section: css({
    display: "flex",
    flexDirection: "column",
    gap: "3",
    layerStyle: "card",
    p: "3",
  }),
  sectionTitle: css({
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    fontSize: "sm",
    fontWeight: "semibold",
    pb: "2",
  }),
  note: css({ color: "fg.muted", fontSize: "xs" }),
  pair: css({ display: "grid", gap: "2", gridTemplateColumns: "1fr 1fr" }),
  switchLine: css({ alignItems: "center", display: "flex", minH: "8" }),
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
  inspector: css({
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.muted",
    fontSize: "xs",
    overflow: "hidden",
  }),
  layer: css({
    borderTopColor: "border",
    borderTopWidth: "1px",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "7rem minmax(0, 1fr)",
    p: "3",
    _first: { borderTopWidth: "0" },
  }),
  layerName: css({ color: "fg.default", fontWeight: "medium" }),
  layerValue: css({ fontFamily: "mono", overflowWrap: "anywhere" }),
};

export function AdvancedSettings(props: {
  scope: {
    layer: LocatorLayer;
    label: string;
    write: (patch: strictConfig.LayerPatchInput) => Promise<WriteResult>;
  };
  layers: LayerViews;
  targets: strictConfig.TargetViewMap;
  portalMount?: Node;
}) {
  const [errors, setErrors] = createSignal<Partial<Record<FieldKey, string>>>(
    {}
  );
  const write = async (
    fieldKey: FieldKey,
    patch: strictConfig.LayerPatchInput
  ) => {
    setErrors((current) => ({ ...current, [fieldKey]: undefined }));
    const result = await props.scope.write(patch);
    if (!result.ok) {
      setErrors((current) => ({
        ...current,
        [fieldKey]:
          result.reason === "quota"
            ? "Could not save because storage is full."
            : "Could not save this setting.",
      }));
      return result;
    }
    return result;
  };

  return (
    <div class={styles.stack}>
      <section class={styles.section}>
        <div class={styles.sectionTitle}>Project & links</div>
        <TextSetting
          label="Project path"
          fieldKey="projectPath"
          placeholder="/Users/me/project/"
          layers={props.layers}
          targets={props.targets}
          scope={props.scope}
          error={errors().projectPath}
          write={(patch) => write("projectPath", patch)}
          portalMount={props.portalMount}
        />
        <ReplacePathField
          layers={props.layers}
          targets={props.targets}
          scope={props.scope}
          error={errors().replacePath}
          write={(patch) => write("replacePath", patch)}
          portalMount={props.portalMount}
        />
        <BooleanSetting
          label="Open links in a new tab"
          fieldKey="hrefTarget"
          layers={props.layers}
          targets={props.targets}
          scope={props.scope}
          toChecked={(value) => value === "_blank"}
          toValue={(checked) => (checked ? "_blank" : "_self")}
          error={errors().hrefTarget}
          write={(patch) => write("hrefTarget", patch)}
          portalMount={props.portalMount}
        />
        <TextSetting
          label="Tmux session"
          fieldKey="tmuxSession"
          placeholder="work"
          layers={props.layers}
          targets={props.targets}
          scope={props.scope}
          error={errors().tmuxSession}
          write={(patch) => write("tmuxSession", patch)}
          portalMount={props.portalMount}
        />
      </section>
      <FoldableSection title="Diagnostics">
        <BooleanSetting
          label="Debug mode"
          fieldKey="debugMode"
          layers={props.layers}
          targets={props.targets}
          scope={props.scope}
          error={errors().debugMode}
          write={(patch) => write("debugMode", patch)}
          portalMount={props.portalMount}
        />
        <BooleanSetting
          label="Show intro again"
          fieldKey="showIntro"
          layers={props.layers}
          targets={props.targets}
          scope={props.scope}
          toChecked={(value) => value !== false}
          error={errors().showIntro}
          write={(patch) => write("showIntro", patch)}
          portalMount={props.portalMount}
        />
      </FoldableSection>
    </div>
  );
}

type CommonProps = {
  scope: {
    layer: LocatorLayer;
    write: (patch: strictConfig.LayerPatchInput) => Promise<WriteResult>;
  };
  layers: LayerViews;
  targets: strictConfig.TargetViewMap;
  portalMount?: Node;
};

function FieldMeta(
  props: CommonProps & { fieldKey: FieldKey; onReset: () => void }
) {
  const state = () =>
    layerFieldState(
      props.layers,
      props.scope.layer,
      props.fieldKey,
      props.targets
    );
  const label = () =>
    `Revert ${FIELD_LABELS[props.fieldKey] ?? String(props.fieldKey)}`;
  return (
    <span class={styles.meta}>
      <Show when={state().source && state().source !== props.scope.layer}>
        <ProvenanceBadge layer={state().source!} />
      </Show>
      <Show when={state().setHere}>
        <Tooltip label={label()} portalMount={props.portalMount}>
          <IconButton
            aria-label={label()}
            class={styles.reset}
            onClick={() => props.onReset()}
          >
            <RotateCcw size={14} />
          </IconButton>
        </Tooltip>
      </Show>
    </span>
  );
}

function TextSetting(
  props: CommonProps & {
    label: string;
    fieldKey: "projectPath" | "tmuxSession";
    placeholder?: string;
    error?: string;
    write: (patch: strictConfig.LayerPatchInput) => WriteResponse;
  }
) {
  const controlId = `locator-text-${createUniqueId()}`;
  const state = () =>
    layerFieldState(
      props.layers,
      props.scope.layer,
      props.fieldKey,
      props.targets
    );
  return (
    <Field
      label={props.label}
      controlId={controlId}
      meta={
        <FieldMeta
          {...props}
          onReset={() => props.write({ unset: [props.fieldKey] })}
        />
      }
      error={props.error}
    >
      <TextInput
        id={controlId}
        value={(state().value as string | undefined) ?? ""}
        placeholder={props.placeholder}
        onChange={(event) => {
          const value = event.currentTarget.value.trim();
          return value
            ? props.write(setField(props.fieldKey, value))
            : props.write({ unset: [props.fieldKey] });
        }}
      />
    </Field>
  );
}

function ReplacePathField(
  props: CommonProps & {
    error?: string;
    write: (patch: strictConfig.LayerPatchInput) => WriteResponse;
  }
) {
  const state = () =>
    layerFieldState(
      props.layers,
      props.scope.layer,
      "replacePath",
      props.targets
    );
  const persistedValue = () => state().value ?? { from: "", to: "" };
  const [draft, setDraft] = createSignal(persistedValue());
  let persistedKey = JSON.stringify(persistedValue());
  createEffect(() => {
    const next = persistedValue();
    const nextKey = JSON.stringify(next);
    if (nextKey === persistedKey) return;
    persistedKey = nextKey;
    setDraft(next);
  });
  const commit = (key: "from" | "to", next: string) => {
    const merged = { ...draft(), [key]: next.trim() };
    setDraft(merged);
    if (!validRegex(merged.from)) return;
    props.write(
      merged.from || merged.to
        ? { set: { replacePath: merged } }
        : { unset: ["replacePath"] }
    );
  };
  return (
    <Field
      label="Path replace"
      meta={
        <FieldMeta
          {...props}
          fieldKey="replacePath"
          onReset={() => props.write({ unset: ["replacePath"] })}
        />
      }
      error={
        props.error ??
        (!validRegex(draft().from)
          ? "From must be a valid regular expression."
          : undefined)
      }
      helper="Rewrites paths after resolving the project path."
    >
      <div class={styles.pair}>
        <TextInput
          mono
          aria-label="Path replace from"
          value={draft().from}
          placeholder="From"
          onChange={(event) => commit("from", event.currentTarget.value)}
        />
        <TextInput
          mono
          aria-label="Path replace to"
          value={draft().to}
          placeholder="To"
          onChange={(event) => commit("to", event.currentTarget.value)}
        />
      </div>
    </Field>
  );
}

function BooleanSetting(
  props: CommonProps & {
    label: string;
    fieldKey: "debugMode" | "hrefTarget" | "showIntro";
    toChecked?: (value: unknown) => boolean;
    toValue?: (checked: boolean) => boolean | "_blank" | "_self";
    error?: string;
    write: (patch: strictConfig.LayerPatchInput) => WriteResponse;
  }
) {
  const state = () =>
    layerFieldState(
      props.layers,
      props.scope.layer,
      props.fieldKey,
      props.targets
    );
  const checked = () =>
    props.toChecked ? props.toChecked(state().value) : !!state().value;
  return (
    <Field
      label={props.label}
      meta={
        <FieldMeta
          {...props}
          onReset={() => props.write({ unset: [props.fieldKey] })}
        />
      }
      error={props.error}
    >
      <div class={styles.switchLine}>
        <Switch
          label={props.label}
          checked={checked()}
          onChange={(next) =>
            props.write(
              setField(
                props.fieldKey,
                props.toValue ? props.toValue(next) : next
              )
            )
          }
        >
          {checked() ? "On" : "Off"}
        </Switch>
      </div>
    </Field>
  );
}

export function SettingsSources(props: {
  layers: LayerViews;
  targets: strictConfig.TargetViewMap;
  unavailableLayers?: LocatorLayer[];
}) {
  return (
    <FoldableSection title="Configuration sources">
      <div class={styles.note}>
        Later sources override earlier ones for each setting.
      </div>
      <div class={styles.inspector}>
        <For each={LAYER_ORDER}>
          {(layer) => (
            <div class={styles.layer}>
              <div class={styles.layerName}>{LAYER_LABELS[layer]}</div>
              <div class={styles.layerValue}>
                {props.unavailableLayers?.includes(layer)
                  ? "Unavailable without a connected LocatorJS page"
                  : formatLayer(props.layers[layer], props.targets)}
              </div>
            </div>
          )}
        </For>
      </div>
    </FoldableSection>
  );
}

function formatLayer(
  values: strictConfig.SerializedLayerV3 | undefined,
  targets: strictConfig.TargetViewMap
) {
  if (!values || Object.keys(values).length === 0) return "No overrides";
  return (Object.keys(values) as FieldKey[])
    .filter((key) => values[key] !== undefined)
    .map((key) => {
      if (key === "bindings") {
        return `actions: ${values.bindings
          ?.map((binding) => bindingSummary(binding, targets))
          .join(", ")}`;
      }
      if (key === "editor") {
        const editor = values.editor;
        return `editor: ${
          editor?.kind === "template"
            ? "custom link"
            : editor?.kind === "target"
            ? targets[editor.id]?.label ?? editor.id
            : "not set"
        }`;
      }
      const value = values[key];
      return `${FIELD_LABELS[key] ?? key}: ${
        typeof value === "object" ? JSON.stringify(value) : String(value)
      }`;
    })
    .join(" · ");
}

function bindingSummary(
  binding: strictConfig.BindingInput,
  targets: strictConfig.TargetViewMap
) {
  const trigger =
    binding.trigger.kind === "modifier-click"
      ? `${binding.trigger.modifiers.join("+")}+click`
      : "hover toolbar";
  const action =
    binding.action.kind === "open-editor"
      ? !binding.action.destination
        ? "open in editor"
        : binding.action.destination.kind === "target"
        ? `open ${
            targets[binding.action.destination.id]?.label ??
            binding.action.destination.id
          }`
        : "open custom editor"
      : binding.action.kind.replaceAll("-", " ");
  return `${trigger} → ${action}`;
}

function validRegex(value: string) {
  if (!value) return true;
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
