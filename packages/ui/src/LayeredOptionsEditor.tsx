import { For, JSX, Show, createEffect, createSignal } from "solid-js";
import type {
  LocatorLayer,
  LocatorOptions,
  Targets,
  WriteResult,
} from "@locator/shared";
import { LAYER_ORDER, resolve } from "@locator/shared";
import { RotateCcw } from "lucide-solid";
import { css, cx } from "@locator/styled-system/css";
import { EditorPicker } from "./EditorPicker";
import { Field } from "./Field";
import { IconButton } from "./IconButton";
import { ModifierChips } from "./ModifierChips";
import { LAYER_LABELS } from "./ProvenanceBadge";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { TextInput } from "./TextInput";
import { Tooltip } from "./Tooltip";

export type LayerTabConfig = {
  layer: LocatorLayer;
  label: string;
  values: LocatorOptions;
  write?: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  note?: string;
  disabled?: boolean;
  disabledReason?: string;
};

type FieldKey = keyof LocatorOptions;
type FieldWriter = (patch: Partial<LocatorOptions>) => void | Promise<boolean>;

const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
  targetId: "Editor link",
  targetTemplate: "Editor link",
  projectPath: "Project path",
  replacePath: "Path replace",
  mouseModifiers: "Mouse-click modifiers",
  hrefTarget: "Open links in a new tab",
  tmuxSession: "Tmux session",
  debugMode: "Debug mode",
  showIntro: "Show intro again",
};

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "3" }),
  note: css({ color: "fg.muted", textStyle: "caption" }),
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
  caption: css({ color: "fg.muted", textStyle: "caption" }),
  overridden: css({ color: "amber.plain.fg", textStyle: "caption" }),
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
    fontWeight: "medium",
    justifyContent: "center",
    minW: "5",
    px: "1.5",
  }),
  readonlyList: css({
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    display: "grid",
    overflow: "hidden",
  }),
  readonlyRow: css({
    alignItems: "center",
    display: "grid",
    gap: "3",
    gridTemplateColumns: "minmax(7.5rem, 0.7fr) minmax(0, 1fr)",
    minH: "8",
    px: "3",
    py: "1.5",
    borderBottomColor: "border",
    borderBottomWidth: "1px",
  }),
  readonlyLabel: css({ color: "fg.muted", fontSize: "sm" }),
  readonlyValue: css({
    color: "fg.default",
    fontFamily: "mono",
    fontSize: "sm",
    minW: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  switchLine: css({ alignItems: "center", display: "flex", minH: "8" }),
  pair: css({ display: "grid", gap: "2", gridTemplateColumns: "1fr 1fr" }),
  jump: css({
    color: "amber.plain.fg",
    cursor: "pointer",
    textDecoration: "underline",
  }),
};

export function LayeredOptionsEditor(props: {
  tabs: LayerTabConfig[];
  targets: Targets;
  defaultId?: LocatorLayer;
  portalMount?: Node;
}) {
  const visibleTabs = () => props.tabs.filter((tab) => tab.layer !== "default");
  const firstWritable = () =>
    visibleTabs().find((tab) => tab.write && !tab.disabled)?.layer ??
    visibleTabs().find((tab) => !tab.disabled)?.layer ??
    visibleTabs()[0]?.layer ??
    "user-extension";
  const defaultId = () => {
    const requested = visibleTabs().find(
      (tab) => tab.layer === props.defaultId
    );
    return requested && !requested.disabled ? requested.layer : firstWritable();
  };
  const [active, setActive] = createSignal(defaultId());

  createEffect(() => {
    const current = visibleTabs().find((tab) => tab.layer === active());
    if (!current || current.disabled) setActive(defaultId());
  });

  return (
    <Tabs
      value={active()}
      onChange={(id) => setActive(id as LocatorLayer)}
      defaultId={defaultId()}
      ariaLabel="Settings layers"
      portalMount={props.portalMount}
      items={visibleTabs().map((tab) => ({
        id: tab.layer,
        label: tabLabel(tab),
        disabled: tab.disabled,
        disabledReason: tab.disabledReason,
        content: (
          <LayerForm
            tab={tab}
            tabs={props.tabs}
            setActive={setActive}
            targets={props.targets}
            portalMount={props.portalMount}
          />
        ),
      }))}
    />
  );
}

function tabLabel(tab: LayerTabConfig) {
  const count = overrideCount(tab.values);
  return (
    <span class={styles.tabLabel}>
      <span>{tab.label}</span>
      <Show when={count > 0}>
        <span class={styles.tabCount}>{count}</span>
      </Show>
    </span>
  );
}

function overrideCount(values: LocatorOptions) {
  const keys = new Set<FieldKey>();
  for (const key of Object.keys(values) as FieldKey[]) {
    if (values[key] !== undefined) keys.add(key);
  }
  if (keys.has("targetId") || keys.has("targetTemplate")) {
    keys.delete("targetId");
    keys.delete("targetTemplate");
    keys.add("targetId");
  }
  return keys.size;
}

function LayerForm(props: {
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  setActive: (layer: LocatorLayer) => void;
  targets: Targets;
  portalMount?: Node;
}) {
  const editable = () => !!props.tab.write;
  const [errors, setErrors] = createSignal<Partial<Record<FieldKey, string>>>(
    {}
  );
  const write = async (fieldKey: FieldKey, patch: Partial<LocatorOptions>) => {
    const writer = props.tab.write;
    if (!writer) return false;
    setErrors((current) => ({ ...current, [fieldKey]: undefined }));
    const result = await writer(patch);
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
      <Show when={props.tab.note}>
        <div class={styles.note}>{props.tab.note}</div>
      </Show>
      <Show
        when={editable()}
        fallback={<ReadonlyLayer tab={props.tab} targets={props.targets} />}
      >
        <Section title="Link">
          <EditorField
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            targets={props.targets}
            portalMount={props.portalMount}
            error={errors().targetId}
            write={(patch) => write("targetId", patch)}
          />
          <TextSetting
            label="Project path"
            fieldKey="projectPath"
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            placeholder="/Users/me/project/"
            portalMount={props.portalMount}
            error={errors().projectPath}
            write={(patch) => write("projectPath", patch)}
          />
          <ReplacePathField
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            portalMount={props.portalMount}
            error={errors().replacePath}
            write={(patch) => write("replacePath", patch)}
          />
          <Show
            when={effectiveAt(props.tabs, props.tab.layer).targetId === "nvim"}
          >
            <TextSetting
              label="Tmux session"
              fieldKey="tmuxSession"
              tab={props.tab}
              tabs={props.tabs}
              setActive={props.setActive}
              placeholder="work"
              portalMount={props.portalMount}
              error={errors().tmuxSession}
              write={(patch) => write("tmuxSession", patch)}
            />
          </Show>
        </Section>
        <Section title="Behavior">
          <ModifiersSetting
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            portalMount={props.portalMount}
            error={errors().mouseModifiers}
            write={(patch) => write("mouseModifiers", patch)}
          />
          <BooleanSetting
            label="Open links in a new tab"
            fieldKey="hrefTarget"
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            toChecked={(value) => value === "_blank"}
            toValue={(checked) => (checked ? "_blank" : "_self")}
            portalMount={props.portalMount}
            error={errors().hrefTarget}
            write={(patch) => write("hrefTarget", patch)}
          />
        </Section>
        <Section title="Advanced">
          <BooleanSetting
            label="Debug mode"
            fieldKey="debugMode"
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            portalMount={props.portalMount}
            error={errors().debugMode}
            write={(patch) => write("debugMode", patch)}
          />
          <BooleanSetting
            label="Show intro again"
            fieldKey="showIntro"
            tab={props.tab}
            tabs={props.tabs}
            setActive={props.setActive}
            toChecked={(value) => value !== false}
            portalMount={props.portalMount}
            error={errors().showIntro}
            write={(patch) => write("showIntro", patch)}
          />
        </Section>
      </Show>
    </div>
  );
}

function Section(props: { title: string; children: JSX.Element }) {
  return (
    <section class={styles.section}>
      <div class={styles.sectionTitle}>{props.title}</div>
      {props.children}
    </section>
  );
}

function FieldMeta(props: {
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  fieldKey: FieldKey;
  setActive: (layer: LocatorLayer) => void;
  onReset: () => void;
  portalMount?: Node;
}) {
  const state = () => fieldState(props.tabs, props.tab.layer, props.fieldKey);
  const resetLabel = () => {
    const field = FIELD_LABELS[props.fieldKey] ?? String(props.fieldKey);
    const source = state().inheritedSource;
    return source
      ? `Revert ${field} to ${layerLabel(source)}: ${formatValue(
          state().inheritedValue
        )}`
      : `Revert ${field} to unset`;
  };
  return (
    <span class={styles.meta}>
      <Show
        when={state().setHere}
        fallback={
          <Show
            when={state().overriddenBy}
            fallback={
              <Show when={state().source && state().source !== "default"}>
                <span class={styles.caption}>
                  from {layerLabel(state().source)}
                </span>
              </Show>
            }
          >
            <span class={styles.overridden}>
              overridden by{" "}
              <button
                type="button"
                class={styles.jump}
                onClick={() => props.setActive(state().overriddenBy!)}
              >
                {layerLabel(state().overriddenBy)}
              </button>
            </span>
          </Show>
        }
      >
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

function EditorField(props: {
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  setActive: (layer: LocatorLayer) => void;
  targets: Targets;
  portalMount?: Node;
  error?: string;
  write: FieldWriter;
}) {
  const state = () => targetState(props.tabs, props.tab.layer);
  return (
    <Field
      label="Editor link"
      meta={
        <FieldMeta
          tab={props.tab}
          tabs={props.tabs}
          fieldKey="targetId"
          setActive={props.setActive}
          portalMount={props.portalMount}
          onReset={() =>
            props.write({ targetId: undefined, targetTemplate: undefined })
          }
        />
      }
      error={props.error}
    >
      <EditorPicker
        targets={props.targets}
        targetId={(state().value.targetId as string | undefined) ?? undefined}
        targetTemplate={
          (state().value.targetTemplate as string | undefined) ?? undefined
        }
        portalMount={props.portalMount}
        onChange={props.write}
      />
    </Field>
  );
}

function TextSetting(props: {
  label: string;
  fieldKey: "projectPath" | "tmuxSession";
  placeholder?: string;
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  setActive: (layer: LocatorLayer) => void;
  portalMount?: Node;
  error?: string;
  write: FieldWriter;
}) {
  const state = () => fieldState(props.tabs, props.tab.layer, props.fieldKey);
  const value = () => (state().value as string | undefined) ?? "";
  return (
    <Field
      label={props.label}
      meta={
        <FieldMeta
          tab={props.tab}
          tabs={props.tabs}
          fieldKey={props.fieldKey}
          setActive={props.setActive}
          portalMount={props.portalMount}
          onReset={() => props.write({ [props.fieldKey]: undefined })}
        />
      }
      error={props.error}
    >
      <TextInput
        value={value()}
        placeholder={props.placeholder}
        class={cx(
          !state().setHere
            ? css({ color: "fg.subtle", _focus: { color: "fg.default" } })
            : undefined
        )}
        onChange={(event) => {
          const next = event.currentTarget.value.trim();
          const inherited =
            (state().inheritedValue as string | undefined) ?? "";
          if (!next) props.write({ [props.fieldKey]: undefined });
          else if (next !== inherited || state().setHere) {
            props.write({ [props.fieldKey]: next });
          }
        }}
      />
    </Field>
  );
}

function ReplacePathField(props: {
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  setActive: (layer: LocatorLayer) => void;
  portalMount?: Node;
  error?: string;
  write: FieldWriter;
}) {
  const state = () => fieldState(props.tabs, props.tab.layer, "replacePath");
  const value = () =>
    (state().value as LocatorOptions["replacePath"]) ?? { from: "", to: "" };
  const commit = (key: "from" | "to", next: string) => {
    const current = value();
    const merged = { ...current, [key]: next.trim() };
    props.write({
      replacePath: merged.from || merged.to ? merged : undefined,
    });
  };
  return (
    <Field
      label="Path replace"
      meta={
        <FieldMeta
          tab={props.tab}
          tabs={props.tabs}
          fieldKey="replacePath"
          setActive={props.setActive}
          portalMount={props.portalMount}
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

function ModifiersSetting(props: {
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  setActive: (layer: LocatorLayer) => void;
  portalMount?: Node;
  error?: string;
  write: FieldWriter;
}) {
  const state = () => fieldState(props.tabs, props.tab.layer, "mouseModifiers");
  return (
    <Field
      label="Mouse-click modifiers"
      meta={
        <FieldMeta
          tab={props.tab}
          tabs={props.tabs}
          fieldKey="mouseModifiers"
          setActive={props.setActive}
          portalMount={props.portalMount}
          onReset={() => props.write({ mouseModifiers: undefined })}
        />
      }
      error={props.error}
    >
      <ModifierChips
        value={(state().value as string | undefined) ?? ""}
        onChange={(next) => props.write({ mouseModifiers: next })}
      />
    </Field>
  );
}

function BooleanSetting(props: {
  label: string;
  fieldKey: "debugMode" | "hrefTarget" | "showIntro";
  tab: LayerTabConfig;
  tabs: LayerTabConfig[];
  setActive: (layer: LocatorLayer) => void;
  toChecked?: (value: unknown) => boolean;
  toValue?: (checked: boolean) => LocatorOptions[keyof LocatorOptions];
  portalMount?: Node;
  error?: string;
  write: FieldWriter;
}) {
  const state = () => fieldState(props.tabs, props.tab.layer, props.fieldKey);
  const checked = () =>
    props.toChecked ? props.toChecked(state().value) : !!state().value;
  const toValue = (value: boolean) =>
    props.toValue ? props.toValue(value) : value;
  return (
    <Field
      label={props.label}
      meta={
        <FieldMeta
          tab={props.tab}
          tabs={props.tabs}
          fieldKey={props.fieldKey}
          setActive={props.setActive}
          portalMount={props.portalMount}
          onReset={() => props.write({ [props.fieldKey]: undefined })}
        />
      }
      error={props.error}
    >
      <div class={styles.switchLine}>
        <Switch
          label={props.label}
          checked={checked()}
          onChange={(next) => props.write({ [props.fieldKey]: toValue(next) })}
        >
          {checked() ? "On" : "Off"}
        </Switch>
      </div>
    </Field>
  );
}

function ReadonlyLayer(props: { tab: LayerTabConfig; targets: Targets }) {
  const groups = () => {
    const rows = readonlyRows(props.tab.values, props.targets);
    return [
      { title: "Link", rows: rows.slice(0, 5) },
      { title: "Behavior", rows: rows.slice(5, 7) },
      { title: "Advanced", rows: rows.slice(7) },
    ]
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) => row.value !== undefined),
      }))
      .filter((group) => group.rows.length > 0);
  };
  return (
    <>
      <For each={groups()}>
        {(group) => (
          <Section title={group.title}>
            <div class={styles.readonlyList}>
              <For each={group.rows}>
                {(row) => (
                  <div class={styles.readonlyRow}>
                    <div class={styles.readonlyLabel}>{row.label}</div>
                    <div class={styles.readonlyValue}>{row.value || "—"}</div>
                  </div>
                )}
              </For>
            </div>
          </Section>
        )}
      </For>
    </>
  );
}

function readonlyRows(values: LocatorOptions, targets: Targets) {
  const target = values.targetTemplate
    ? values.targetTemplate
    : values.targetId
    ? targets[values.targetId]?.label ?? values.targetId
    : undefined;
  return [
    { label: "Editor link", value: target },
    { label: "Adapter", value: values.adapterId },
    { label: "Project path", value: values.projectPath },
    {
      label: "Path replace",
      value: values.replacePath
        ? `${values.replacePath.from || "—"} → ${values.replacePath.to || "—"}`
        : undefined,
    },
    { label: "Tmux session", value: values.tmuxSession },
    { label: "Mouse-click modifiers", value: values.mouseModifiers },
    { label: "Open links in new tab", value: values.hrefTarget },
    { label: "Debug mode", value: booleanLabel(values.debugMode) },
    { label: "Show intro again", value: booleanLabel(values.showIntro) },
  ];
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

function booleanLabel(value: boolean | undefined) {
  if (value === undefined) return undefined;
  return value ? "On" : "Off";
}

function fieldState(
  tabs: LayerTabConfig[],
  layer: LocatorLayer,
  fieldKey: FieldKey
) {
  const values = tabValues(tabs);
  const layersAtOrBelow = truncateLayers(values, layer);
  const inheritedLayers = withoutLayer(layersAtOrBelow, layer);
  const resolvedHere = resolve(layersAtOrBelow);
  const inherited = resolve(inheritedLayers);
  const higher = higherOverride(tabs, layer, fieldKey);
  const setHere = values[layer]?.[fieldKey] !== undefined;
  return {
    setHere,
    value: setHere
      ? values[layer]?.[fieldKey]
      : resolvedHere.effective[fieldKey],
    source: resolvedHere.provenance[fieldKey],
    inheritedValue: inherited.effective[fieldKey],
    inheritedSource: inherited.provenance[fieldKey],
    overriddenBy: higher,
  };
}

function targetState(tabs: LayerTabConfig[], layer: LocatorLayer) {
  const targetId = fieldState(tabs, layer, "targetId");
  const targetTemplate = fieldState(tabs, layer, "targetTemplate");
  const values = tabValues(tabs);
  const setHere =
    values[layer]?.targetId !== undefined ||
    values[layer]?.targetTemplate !== undefined;
  const effective = effectiveAt(tabs, layer);
  return {
    setHere,
    value: setHere
      ? {
          targetId: values[layer]?.targetId,
          targetTemplate: values[layer]?.targetTemplate,
        }
      : {
          targetId: effective.targetId,
          targetTemplate: effective.targetTemplate,
        },
    source: targetId.source ?? targetTemplate.source,
  };
}

function effectiveAt(tabs: LayerTabConfig[], layer: LocatorLayer) {
  return resolve(truncateLayers(tabValues(tabs), layer)).effective;
}

function tabValues(tabs: LayerTabConfig[]) {
  return Object.fromEntries(
    tabs.map((tab) => [tab.layer, tab.values])
  ) as Partial<Record<LocatorLayer, LocatorOptions>>;
}

function truncateLayers(
  values: Partial<Record<LocatorLayer, LocatorOptions>>,
  layer: LocatorLayer
) {
  const max = LAYER_ORDER.indexOf(layer);
  const next: Partial<Record<LocatorLayer, LocatorOptions>> = {};
  for (const item of LAYER_ORDER.slice(0, max + 1)) next[item] = values[item];
  return next;
}

function withoutLayer(
  values: Partial<Record<LocatorLayer, LocatorOptions>>,
  layer: LocatorLayer
) {
  const next = { ...values };
  delete next[layer];
  return next;
}

function higherOverride(
  tabs: LayerTabConfig[],
  layer: LocatorLayer,
  fieldKey: FieldKey
) {
  const index = LAYER_ORDER.indexOf(layer);
  const targetKeys: FieldKey[] = ["targetId", "targetTemplate"];
  const keys = targetKeys.includes(fieldKey) ? targetKeys : [fieldKey];
  for (const higher of LAYER_ORDER.slice(index + 1)) {
    const values = tabs.find((tab) => tab.layer === higher)?.values;
    if (!values) continue;
    if (keys.some((key) => values[key] !== undefined)) return higher;
  }
  return undefined;
}

function layerLabel(layer?: LocatorLayer) {
  return layer ? LAYER_LABELS[layer] : "defaults";
}

function formatValue(value: unknown) {
  if (value === undefined || value === "") return "not set";
  if (typeof value === "boolean") return value ? "on" : "off";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
