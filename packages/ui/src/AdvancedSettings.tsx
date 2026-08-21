import {
  LAYER_ORDER,
  normalizeLayer,
  resolve,
  type Binding,
  type LocatorLayer,
  type LocatorOptions,
  type Targets,
  type WriteResult,
} from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { RotateCcw } from "lucide-solid";
import { For, Show, createSignal } from "solid-js";
import { Field } from "./Field";
import { FoldableSection } from "./FoldableSection";
import { IconButton } from "./IconButton";
import { LAYER_LABELS, ProvenanceBadge } from "./ProvenanceBadge";
import { Switch } from "./Switch";
import { TextInput } from "./TextInput";
import { Tooltip } from "./Tooltip";

type FieldKey = keyof LocatorOptions;

const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
  projectPath: "Project path",
  replacePath: "Path replace",
  bindings: "Actions",
  hrefTarget: "Open links in a new tab",
  tmuxSession: "Tmux session",
  debugMode: "Debug mode",
  showIntro: "Show intro again",
  adapterId: "Adapter",
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
    write: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  };
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  targets: Targets;
  portalMount?: Node;
}) {
  const [errors, setErrors] = createSignal<Partial<Record<FieldKey, string>>>(
    {}
  );
  const write = async (fieldKey: FieldKey, patch: Partial<LocatorOptions>) => {
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
      return false;
    }
    return true;
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
          scope={props.scope}
          error={errors().projectPath}
          write={(patch) => write("projectPath", patch)}
          portalMount={props.portalMount}
        />
        <ReplacePathField
          layers={props.layers}
          scope={props.scope}
          error={errors().replacePath}
          write={(patch) => write("replacePath", patch)}
          portalMount={props.portalMount}
        />
        <BooleanSetting
          label="Open links in a new tab"
          fieldKey="hrefTarget"
          layers={props.layers}
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
          scope={props.scope}
          error={errors().debugMode}
          write={(patch) => write("debugMode", patch)}
          portalMount={props.portalMount}
        />
        <BooleanSetting
          label="Show intro again"
          fieldKey="showIntro"
          layers={props.layers}
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
    write: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  };
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  portalMount?: Node;
};

function FieldMeta(
  props: CommonProps & { fieldKey: FieldKey; onReset: () => void }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, props.fieldKey);
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
    write: (patch: Partial<LocatorOptions>) => void | Promise<boolean>;
  }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, props.fieldKey);
  return (
    <Field
      label={props.label}
      meta={
        <FieldMeta
          {...props}
          onReset={() => props.write({ [props.fieldKey]: undefined })}
        />
      }
      error={props.error}
    >
      <TextInput
        value={(state().value as string | undefined) ?? ""}
        placeholder={props.placeholder}
        onChange={(event) =>
          props.write({
            [props.fieldKey]: event.currentTarget.value.trim() || undefined,
          })
        }
      />
    </Field>
  );
}

function ReplacePathField(
  props: CommonProps & {
    error?: string;
    write: (patch: Partial<LocatorOptions>) => void | Promise<boolean>;
  }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, "replacePath");
  const value = () =>
    (state().value as LocatorOptions["replacePath"]) ?? { from: "", to: "" };
  const commit = (key: "from" | "to", next: string) => {
    const merged = { ...value(), [key]: next.trim() };
    props.write({ replacePath: merged.from || merged.to ? merged : undefined });
  };
  return (
    <Field
      label="Path replace"
      meta={
        <FieldMeta
          {...props}
          fieldKey="replacePath"
          onReset={() => props.write({ replacePath: undefined })}
        />
      }
      error={
        props.error ??
        (!validRegex(value().from)
          ? "From must be a valid regular expression."
          : undefined)
      }
      helper="Rewrites paths after resolving the project path."
    >
      <div class={styles.pair}>
        <TextInput
          mono
          aria-label="Path replace from"
          value={value().from}
          placeholder="From"
          onChange={(event) => commit("from", event.currentTarget.value)}
        />
        <TextInput
          mono
          aria-label="Path replace to"
          value={value().to}
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
    toValue?: (checked: boolean) => LocatorOptions[keyof LocatorOptions];
    error?: string;
    write: (patch: Partial<LocatorOptions>) => void | Promise<boolean>;
  }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, props.fieldKey);
  const checked = () =>
    props.toChecked ? props.toChecked(state().value) : !!state().value;
  return (
    <Field
      label={props.label}
      meta={
        <FieldMeta
          {...props}
          onReset={() => props.write({ [props.fieldKey]: undefined })}
        />
      }
      error={props.error}
    >
      <div class={styles.switchLine}>
        <Switch
          label={props.label}
          checked={checked()}
          onChange={(next) =>
            props.write({
              [props.fieldKey]: props.toValue ? props.toValue(next) : next,
            })
          }
        >
          {checked() ? "On" : "Off"}
        </Switch>
      </div>
    </Field>
  );
}

export function SettingsSources(props: {
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  targets: Targets;
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

function fieldState(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>,
  layer: LocatorLayer,
  fieldKey: FieldKey
) {
  const normalized = normalizedLayers(layers);
  const resolved = resolve(normalized);
  const layerValues = normalized[layer] ?? {};
  return {
    setHere: layerValues[fieldKey] !== undefined,
    source: resolved.provenance[fieldKey],
    value: resolved.effective[fieldKey],
  };
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

function formatLayer(values: LocatorOptions | undefined, targets: Targets) {
  if (!values || Object.keys(normalizeLayer(values)).length === 0)
    return "No overrides";
  const normalized = normalizeLayer(values);
  return (Object.keys(normalized) as FieldKey[])
    .filter((key) => normalized[key] !== undefined)
    .map((key) => {
      if (key === "bindings") {
        return `actions: ${normalized.bindings
          ?.map((binding) => bindingSummary(binding, targets))
          .join(", ")}`;
      }
      const value = normalized[key];
      return `${FIELD_LABELS[key] ?? key}: ${
        typeof value === "object" ? JSON.stringify(value) : String(value)
      }`;
    })
    .join(" · ");
}

function bindingSummary(binding: Binding, targets: Targets) {
  const trigger =
    binding.trigger.kind === "modifier-click"
      ? `${binding.trigger.modifiers}+click`
      : "hover toolbar";
  const action =
    binding.action.kind === "open-editor"
      ? binding.action.targetId
        ? `open ${
            targets[binding.action.targetId]?.label ?? binding.action.targetId
          }`
        : binding.action.targetTemplate
        ? "open custom editor"
        : "open VSCode"
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
