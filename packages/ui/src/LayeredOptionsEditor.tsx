import {
  DEFAULT_PROMPT_TEMPLATE,
  LAYER_ORDER,
  PROMPT_TEMPLATE_VARIABLES,
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
import { For, JSX, Show, createEffect, createSignal } from "solid-js";
import { BindingsEditor } from "./BindingsEditor";
import { EditorPicker } from "./EditorPicker";
import { Field } from "./Field";
import { IconButton } from "./IconButton";
import { PromoFooter, type PromoHint } from "./PromoFooter";
import { LAYER_LABELS, ProvenanceBadge } from "./ProvenanceBadge";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { TextArea } from "./TextArea";
import { TextInput } from "./TextInput";
import { Tooltip } from "./Tooltip";

export type WriteScope = {
  layer: LocatorLayer;
  label: string;
  write: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  disabled?: boolean;
  disabledReason?: string;
  note?: string;
};

type FieldKey = keyof LocatorOptions;
type FieldWriter = (patch: Partial<LocatorOptions>) => void | Promise<boolean>;

const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
  targetId: "Default editor",
  targetTemplate: "Default editor",
  projectPath: "Project path",
  replacePath: "Path replace",
  bindings: "Shortcuts",
  promptTemplate: "AI prompt template",
  hrefTarget: "Open links in a new tab",
  tmuxSession: "Tmux session",
  debugMode: "Debug mode",
  showIntro: "Show intro again",
};

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "3" }),
  note: css({ color: "fg.muted", fontSize: "xs" }),
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
    color: "fg.default",
    fontSize: "sm",
    fontWeight: "semibold",
    pb: "2",
  }),
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
  tabLabel: css({ alignItems: "center", display: "inline-flex", gap: "1.5" }),
  tabCount: css({
    alignItems: "center",
    bg: "gray.subtle.bg",
    borderRadius: "full",
    color: "fg.muted",
    display: "inline-flex",
    fontSize: "xs",
    justifyContent: "center",
    minW: "5",
    px: "1.5",
  }),
  pair: css({ display: "grid", gap: "2", gridTemplateColumns: "1fr 1fr" }),
  switchLine: css({ alignItems: "center", display: "flex", minH: "8" }),
  inspector: css({
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.muted",
    fontSize: "xs",
    overflow: "hidden",
  }),
  inspectorSummary: css({
    cursor: "pointer",
    fontWeight: "medium",
    p: "3",
    _hover: { bg: "gray.subtle.bg" },
  }),
  layer: css({
    borderTopColor: "border",
    borderTopWidth: "1px",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "7rem minmax(0, 1fr)",
    p: "3",
  }),
  layerName: css({ color: "fg.default", fontWeight: "medium" }),
  layerValue: css({
    color: "fg.muted",
    fontFamily: "mono",
    overflowWrap: "anywhere",
  }),
  promptVariables: css({ color: "fg.muted", fontSize: "xs" }),
};

export function LayeredOptionsEditor(props: {
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  writeScopes: WriteScope[];
  targets: Targets;
  defaultId?: LocatorLayer;
  portalMount?: Node;
  promos?: PromoHint[];
}) {
  const firstEnabled = () =>
    props.writeScopes.find((scope) => !scope.disabled)?.layer ??
    props.writeScopes[0]?.layer ??
    "user-origin";
  const requested = () =>
    props.writeScopes.find(
      (scope) => scope.layer === props.defaultId && !scope.disabled
    )?.layer ?? firstEnabled();
  const [active, setActive] = createSignal(requested());

  createEffect(() => {
    const current = props.writeScopes.find((scope) => scope.layer === active());
    if (!current || current.disabled) setActive(requested());
  });

  const content = (scope: WriteScope) => (
    <LayerForm
      scope={scope}
      layers={props.layers}
      targets={props.targets}
      portalMount={props.portalMount}
      promos={props.promos}
    />
  );

  return (
    <Show
      when={props.writeScopes.length > 1}
      fallback={props.writeScopes[0] ? content(props.writeScopes[0]) : <div />}
    >
      <Tabs
        value={active()}
        onChange={(id) => setActive(id as LocatorLayer)}
        defaultId={requested()}
        ariaLabel="Settings scopes"
        portalMount={props.portalMount}
        items={props.writeScopes.map((scope) => ({
          id: scope.layer,
          label: (
            <span class={styles.tabLabel}>
              <span>{scope.label}</span>
              <Show when={overrideCount(props.layers[scope.layer] ?? {}) > 0}>
                <span class={styles.tabCount}>
                  {overrideCount(props.layers[scope.layer] ?? {})}
                </span>
              </Show>
            </span>
          ),
          disabled: scope.disabled,
          disabledReason: scope.disabledReason,
          content: content(scope),
        }))}
      />
    </Show>
  );
}

function LayerForm(props: {
  scope: WriteScope;
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  targets: Targets;
  portalMount?: Node;
  promos?: PromoHint[];
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
  const effective = () => resolve(normalizedLayers(props.layers)).effective;

  return (
    <div class={styles.stack}>
      <Show when={props.scope.note}>
        <div class={styles.note}>{props.scope.note}</div>
      </Show>

      <Section title="Link">
        <EditorField
          {...props}
          error={errors().targetId}
          write={(patch) => write("targetId", patch)}
        />
        <TextSetting
          {...props}
          label="Project path"
          fieldKey="projectPath"
          placeholder="/Users/me/project/"
          error={errors().projectPath}
          write={(patch) => write("projectPath", patch)}
        />
        <ReplacePathField
          {...props}
          error={errors().replacePath}
          write={(patch) => write("replacePath", patch)}
        />
        <Show when={effective().targetId === "nvim"}>
          <TextSetting
            {...props}
            label="Tmux session"
            fieldKey="tmuxSession"
            placeholder="work"
            error={errors().tmuxSession}
            write={(patch) => write("tmuxSession", patch)}
          />
        </Show>
      </Section>

      <Section title="Controls">
        <BindingsSetting
          {...props}
          error={errors().bindings}
          write={(patch) => write("bindings", patch)}
        />
        <PromptTemplateSetting
          {...props}
          error={errors().promptTemplate}
          write={(patch) => write("promptTemplate", patch)}
        />
        <BooleanSetting
          {...props}
          label="Open links in a new tab"
          fieldKey="hrefTarget"
          toChecked={(value) => value === "_blank"}
          toValue={(checked) => (checked ? "_blank" : "_self")}
          error={errors().hrefTarget}
          write={(patch) => write("hrefTarget", patch)}
        />
      </Section>

      <Section title="Advanced">
        <BooleanSetting
          {...props}
          label="Debug mode"
          fieldKey="debugMode"
          error={errors().debugMode}
          write={(patch) => write("debugMode", patch)}
        />
        <BooleanSetting
          {...props}
          label="Show intro again"
          fieldKey="showIntro"
          toChecked={(value) => value !== false}
          error={errors().showIntro}
          write={(patch) => write("showIntro", patch)}
        />
      </Section>

      <LayersInspector layers={props.layers} targets={props.targets} />
      <Show when={(props.promos?.length ?? 0) > 0}>
        <PromoFooter promos={props.promos ?? []} />
      </Show>
    </div>
  );
}

type CommonSettingProps = {
  scope: WriteScope;
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  portalMount?: Node;
};

function Section(props: { title: string; children: JSX.Element }) {
  return (
    <section class={styles.section}>
      <div class={styles.sectionTitle}>{props.title}</div>
      {props.children}
    </section>
  );
}

function FieldMeta(
  props: CommonSettingProps & {
    fieldKey: FieldKey;
    onReset: () => void;
  }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, props.fieldKey);
  const resetLabel = () =>
    `Revert ${FIELD_LABELS[props.fieldKey] ?? String(props.fieldKey)}`;
  return (
    <span class={styles.meta}>
      <Show when={state().source && state().source !== props.scope.layer}>
        <ProvenanceBadge layer={state().source} />
      </Show>
      <Show when={state().setHere}>
        <Tooltip label={resetLabel()} portalMount={props.portalMount}>
          <IconButton
            aria-label={resetLabel()}
            class={styles.reset}
            onClick={props.onReset}
          >
            <RotateCcw size={14} />
          </IconButton>
        </Tooltip>
      </Show>
    </span>
  );
}

function EditorField(
  props: CommonSettingProps & {
    targets: Targets;
    error?: string;
    write: FieldWriter;
  }
) {
  const effective = () => resolve(normalizedLayers(props.layers)).effective;
  return (
    <Field
      label="Default editor"
      meta={
        <FieldMeta
          {...props}
          fieldKey="targetId"
          onReset={() =>
            props.write({ targetId: undefined, targetTemplate: undefined })
          }
        />
      }
      error={props.error}
    >
      <EditorPicker
        targets={props.targets}
        targetId={effective().targetId}
        targetTemplate={effective().targetTemplate}
        portalMount={props.portalMount}
        onChange={props.write}
      />
    </Field>
  );
}

function TextSetting(
  props: CommonSettingProps & {
    label: string;
    fieldKey: "projectPath" | "tmuxSession";
    placeholder?: string;
    error?: string;
    write: FieldWriter;
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
          fieldKey={props.fieldKey}
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
  props: CommonSettingProps & {
    error?: string;
    write: FieldWriter;
  }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, "replacePath");
  const value = () =>
    (state().value as LocatorOptions["replacePath"]) ?? { from: "", to: "" };
  const commit = (key: "from" | "to", next: string) => {
    const merged = { ...value(), [key]: next.trim() };
    props.write({
      replacePath: merged.from || merged.to ? merged : undefined,
    });
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
    >
      <div class={styles.pair}>
        <TextInput
          mono
          value={value().from}
          placeholder="From"
          onChange={(event) => commit("from", event.currentTarget.value)}
        />
        <TextInput
          mono
          value={value().to}
          placeholder="To"
          onChange={(event) => commit("to", event.currentTarget.value)}
        />
      </div>
    </Field>
  );
}

function BindingsSetting(
  props: CommonSettingProps & {
    targets: Targets;
    error?: string;
    write: FieldWriter;
  }
) {
  const state = () => fieldState(props.layers, props.scope.layer, "bindings");
  return (
    <Field
      label="Shortcuts & hover actions"
      meta={
        <FieldMeta
          {...props}
          fieldKey="bindings"
          onReset={() =>
            props.write({ bindings: undefined, mouseModifiers: undefined })
          }
        />
      }
      error={props.error}
    >
      <BindingsEditor
        value={(state().value as Binding[] | undefined) ?? []}
        targets={props.targets}
        portalMount={props.portalMount}
        onChange={(bindings) =>
          props.write({ bindings, mouseModifiers: undefined })
        }
      />
    </Field>
  );
}

function PromptTemplateSetting(
  props: CommonSettingProps & {
    error?: string;
    write: FieldWriter;
  }
) {
  const state = () =>
    fieldState(props.layers, props.scope.layer, "promptTemplate");
  return (
    <Field
      label="AI prompt template"
      meta={
        <FieldMeta
          {...props}
          fieldKey="promptTemplate"
          onReset={() => props.write({ promptTemplate: undefined })}
        />
      }
      helper={
        <div class={styles.promptVariables}>
          Variables:{" "}
          {PROMPT_TEMPLATE_VARIABLES.map((name) => `\${${name}}`).join(", ")}
        </div>
      }
      error={props.error}
    >
      <TextArea
        aria-label="AI prompt template"
        value={(state().value as string | undefined) ?? ""}
        placeholder={DEFAULT_PROMPT_TEMPLATE}
        onChange={(event) =>
          props.write({
            promptTemplate: event.currentTarget.value.trim() || undefined,
          })
        }
      />
    </Field>
  );
}

function BooleanSetting(
  props: CommonSettingProps & {
    label: string;
    fieldKey: "debugMode" | "hrefTarget" | "showIntro";
    toChecked?: (value: unknown) => boolean;
    toValue?: (checked: boolean) => LocatorOptions[keyof LocatorOptions];
    error?: string;
    write: FieldWriter;
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
          fieldKey={props.fieldKey}
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

function LayersInspector(props: {
  layers: Partial<Record<LocatorLayer, LocatorOptions>>;
  targets: Targets;
}) {
  return (
    <details class={styles.inspector}>
      <summary class={styles.inspectorSummary}>View layers</summary>
      <For each={LAYER_ORDER}>
        {(layer) => (
          <div class={styles.layer}>
            <div class={styles.layerName}>{LAYER_LABELS[layer]}</div>
            <div class={styles.layerValue}>
              {formatLayer(props.layers[layer], props.targets)}
            </div>
          </div>
        )}
      </For>
    </details>
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
  const keys =
    fieldKey === "targetId" || fieldKey === "targetTemplate"
      ? (["targetId", "targetTemplate"] as FieldKey[])
      : fieldKey === "bindings" || fieldKey === "mouseModifiers"
      ? (["bindings", "mouseModifiers"] as FieldKey[])
      : [fieldKey];
  const setHere = keys.some((key) => layerValues[key] !== undefined);
  const source = keys
    .map((key) => resolved.provenance[key])
    .find((value) => value !== undefined);
  const value =
    fieldKey === "bindings"
      ? resolved.effective.bindings
      : resolved.effective[fieldKey];
  return { setHere, source, value };
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

function overrideCount(values: LocatorOptions) {
  const keys = new Set(
    (Object.keys(values) as FieldKey[]).filter(
      (key) => values[key] !== undefined
    )
  );
  if (keys.has("targetId") || keys.has("targetTemplate")) {
    keys.delete("targetId");
    keys.delete("targetTemplate");
    keys.add("targetId");
  }
  if (keys.has("bindings") || keys.has("mouseModifiers")) {
    keys.delete("bindings");
    keys.delete("mouseModifiers");
    keys.add("bindings");
  }
  return keys.size;
}

function formatLayer(values: LocatorOptions | undefined, targets: Targets) {
  if (!values || Object.keys(values).length === 0) return "No overrides";
  const normalized = normalizeLayer(values);
  return (Object.keys(normalized) as FieldKey[])
    .filter((key) => normalized[key] !== undefined)
    .map((key) => {
      if (key === "targetTemplate") {
        return `editor: ${normalized.targetTemplate}`;
      }
      if (key === "targetId") {
        return `editor: ${
          targets[normalized.targetId!]?.label ?? normalized.targetId
        }`;
      }
      if (key === "bindings") {
        return `shortcuts: ${normalized.bindings
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
  const trigger = [
    binding.modifiers ? `${binding.modifiers}+click` : "",
    binding.icon ? "icon" : "",
  ]
    .filter(Boolean)
    .join("/");
  const action =
    binding.action.kind === "open-editor"
      ? binding.action.targetId
        ? `open ${
            targets[binding.action.targetId]?.label ?? binding.action.targetId
          }`
        : "open default editor"
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
