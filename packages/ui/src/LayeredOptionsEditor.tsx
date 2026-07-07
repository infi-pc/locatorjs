import { For, JSX, Show } from "solid-js";
import type {
  LocatorLayer,
  LocatorOptions,
  Targets,
  WriteResult,
} from "@locator/shared";
import {
  getModifiersMap,
  getModifiersString,
  modifiersTitles,
} from "@locator/shared";
import { Button } from "./Button";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { TextInput } from "./TextInput";
import { ProvenanceBadge, LAYER_LABELS } from "./ProvenanceBadge";

export type LayerTabConfig = {
  layer: LocatorLayer;
  label: string;
  values: LocatorOptions;
  /** Absent means the layer is read-only in this surface. */
  write?: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  /** Shown at the top of the tab, e.g. why the layer is read-only or unavailable. */
  note?: string;
};

export function LayeredOptionsEditor(props: {
  tabs: LayerTabConfig[];
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  targets: Targets;
}) {
  const defaultId = () =>
    (props.tabs.find((t) => t.write) ?? props.tabs[0])?.layer;

  return (
    <Tabs
      defaultId={defaultId()}
      items={props.tabs.map((tab) => ({
        id: tab.layer,
        label: tab.label,
        content: (
          <LayerForm
            tab={tab}
            effective={props.effective}
            provenance={props.provenance}
            targets={props.targets}
          />
        ),
      }))}
    />
  );
}

function LayerForm(props: {
  tab: LayerTabConfig;
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  targets: Targets;
}) {
  const editable = () => !!props.tab.write;
  const write = (patch: Partial<LocatorOptions>) => props.tab.write?.(patch);

  return (
    <div class="flex flex-col gap-4">
      <Show when={props.tab.note}>
        <div class="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {props.tab.note}
        </div>
      </Show>

      <TargetField
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        targets={props.targets}
        editable={editable()}
        write={write}
      />

      <ModifiersField
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        editable={editable()}
        write={write}
      />

      <TextField
        label="Project path"
        fieldKey="projectPath"
        placeholder="/Users/me/my-project/"
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        editable={editable()}
        write={write}
      />

      <BooleanField
        label="Open links in a new tab"
        fieldKey="hrefTarget"
        toValue={(checked) => (checked ? "_blank" : "_self")}
        toChecked={(value) => value === "_blank"}
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        editable={editable()}
        write={write}
      />

      <BooleanField
        label="Experimental features"
        fieldKey="experimentalFeatures"
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        editable={editable()}
        write={write}
      />

      <BooleanField
        label="Debug mode"
        fieldKey="debugMode"
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        editable={editable()}
        write={write}
      />

      <BooleanField
        label="Disable LocatorJS"
        fieldKey="disabled"
        tab={props.tab}
        effective={props.effective}
        provenance={props.provenance}
        editable={editable()}
        write={write}
      />
    </div>
  );
}

/**
 * Shared row shell: label + provenance of the effective value, then either the
 * layer's own control (value set at this layer), an inherited-value preview
 * with an "Override here" action, or a plain read-only rendering.
 */
function FieldRow(props: {
  label: string;
  setHere: boolean;
  editable: boolean;
  provenance?: LocatorLayer;
  inheritedPreview: JSX.Element;
  onOverride?: () => void;
  onClear?: () => void;
  children: JSX.Element;
}) {
  return (
    <div>
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-medium text-gray-900 dark:text-gray-200">
          {props.label}
        </span>
        <div class="flex items-center gap-2">
          <ProvenanceBadge layer={props.provenance} />
          <Show when={props.setHere && props.editable}>
            <button
              class="text-[11px] text-gray-400 underline hover:text-gray-600 cursor-pointer"
              onClick={() => props.onClear?.()}
            >
              reset to inherited
            </button>
          </Show>
        </div>
      </div>
      <div class="mt-1">
        <Show
          when={props.setHere}
          fallback={
            <div class="flex items-center justify-between gap-2 rounded border border-dashed border-gray-200 px-2 py-1.5 dark:border-gray-700">
              <span class="text-sm text-gray-400">
                {props.inheritedPreview}
              </span>
              <Show when={props.editable}>
                <Button size="xs" variant="ghost" onClick={props.onOverride}>
                  Override here
                </Button>
              </Show>
            </div>
          }
        >
          {props.children}
        </Show>
      </div>
    </div>
  );
}

function inheritedLabel(
  value: string | undefined,
  provenance: LocatorLayer | undefined
) {
  if (value === undefined) return "not set";
  return `${value} (from ${provenance ? LAYER_LABELS[provenance] : "…"})`;
}

function TargetField(props: {
  tab: LayerTabConfig;
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  targets: Targets;
  editable: boolean;
  write: (patch: Partial<LocatorOptions>) => void;
}) {
  let input: HTMLInputElement | undefined;
  const setHere = () =>
    props.tab.values.targetId !== undefined ||
    props.tab.values.targetTemplate !== undefined;
  const selected = () =>
    props.tab.values.targetTemplate ?? props.tab.values.targetId ?? "";
  const effectiveTarget = () =>
    props.effective.targetTemplate ?? props.effective.targetId;
  const provenance = () =>
    props.provenance.targetTemplate ?? props.provenance.targetId;
  const isCustom = () => setHere() && !props.targets[selected()];

  function select(val: string) {
    if (val.includes("://")) {
      props.write({ targetTemplate: val, targetId: undefined });
    } else {
      props.write({ targetId: val, targetTemplate: undefined });
    }
  }

  return (
    <FieldRow
      label="Editor link"
      setHere={setHere()}
      editable={props.editable}
      provenance={provenance()}
      inheritedPreview={inheritedLabel(
        effectiveTarget() && props.targets[effectiveTarget()!]
          ? props.targets[effectiveTarget()!]!.label
          : effectiveTarget(),
        provenance()
      )}
      onOverride={() => select(effectiveTarget() ?? "vscode")}
      onClear={() =>
        props.write({ targetId: undefined, targetTemplate: undefined })
      }
    >
      <div class="flex flex-col gap-1">
        <For each={Object.entries(props.targets)}>
          {([key, target]) => (
            <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input
                type="radio"
                name={`target-${props.tab.layer}`}
                class="text-blue-600 focus:ring-blue-500"
                checked={key === selected()}
                disabled={!props.editable}
                onChange={() => select(key)}
              />
              {target.label}
            </label>
          )}
        </For>
        <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
          <input
            type="radio"
            name={`target-${props.tab.layer}`}
            class="text-blue-600 focus:ring-blue-500"
            checked={isCustom()}
            disabled={!props.editable}
            onChange={() => {
              const known = props.targets[selected()];
              if (known) select(known.url);
              input?.focus();
              input?.select();
            }}
          />
          Custom link
        </label>
        <TextInput
          ref={(el) => (input = el)}
          value={
            props.targets[selected()]
              ? props.targets[selected()]!.url
              : selected()
          }
          disabled={!props.editable}
          class={
            props.targets[selected()] ? "text-gray-400 focus:text-gray-800" : ""
          }
          onChange={(e) => select(e.currentTarget.value)}
        />
        <Show when={isCustom()}>
          <div class="text-xs text-gray-500">
            Available variables: projectPath, filePath, line, column
          </div>
        </Show>
      </div>
    </FieldRow>
  );
}

function ModifiersField(props: {
  tab: LayerTabConfig;
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  editable: boolean;
  write: (patch: Partial<LocatorOptions>) => void;
}) {
  const setHere = () => props.tab.values.mouseModifiers !== undefined;
  const map = () => getModifiersMap(props.tab.values.mouseModifiers ?? "");
  const effectiveTitles = () =>
    Object.keys(getModifiersMap(props.effective.mouseModifiers ?? ""))
      .map((k) => modifiersTitles[k as keyof typeof modifiersTitles])
      .join(" + ");

  function setControl(key: string, enable: boolean) {
    const next = map();
    if (enable) {
      next[key] = true;
    } else {
      delete next[key];
    }
    props.write({ mouseModifiers: getModifiersString(next) });
  }

  return (
    <FieldRow
      label="Mouse-click modifiers"
      setHere={setHere()}
      editable={props.editable}
      provenance={props.provenance.mouseModifiers}
      inheritedPreview={inheritedLabel(
        effectiveTitles(),
        props.provenance.mouseModifiers
      )}
      onOverride={() =>
        props.write({ mouseModifiers: props.effective.mouseModifiers ?? "alt" })
      }
      onClear={() => props.write({ mouseModifiers: undefined })}
    >
      <div class="flex flex-col items-start gap-1.5">
        <For each={Object.entries(modifiersTitles)}>
          {([key, title]) => (
            <Switch
              checked={!!map()[key]}
              disabled={!props.editable}
              onChange={(checked) => setControl(key, checked)}
            >
              {title}
            </Switch>
          )}
        </For>
      </div>
    </FieldRow>
  );
}

function TextField(props: {
  label: string;
  fieldKey: "projectPath" | "tmuxSession";
  placeholder?: string;
  tab: LayerTabConfig;
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  editable: boolean;
  write: (patch: Partial<LocatorOptions>) => void;
}) {
  const setHere = () => props.tab.values[props.fieldKey] !== undefined;
  return (
    <FieldRow
      label={props.label}
      setHere={setHere()}
      editable={props.editable}
      provenance={props.provenance[props.fieldKey]}
      inheritedPreview={inheritedLabel(
        props.effective[props.fieldKey],
        props.provenance[props.fieldKey]
      )}
      onOverride={() =>
        props.write({ [props.fieldKey]: props.effective[props.fieldKey] ?? "" })
      }
      onClear={() => props.write({ [props.fieldKey]: undefined })}
    >
      <TextInput
        value={props.tab.values[props.fieldKey] ?? ""}
        placeholder={props.placeholder}
        disabled={!props.editable}
        onChange={(e) =>
          props.write({ [props.fieldKey]: e.currentTarget.value })
        }
      />
    </FieldRow>
  );
}

function BooleanField(props: {
  label: string;
  fieldKey: "experimentalFeatures" | "debugMode" | "disabled" | "hrefTarget";
  toValue?: (checked: boolean) => LocatorOptions[keyof LocatorOptions];
  toChecked?: (value: unknown) => boolean;
  tab: LayerTabConfig;
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
  editable: boolean;
  write: (patch: Partial<LocatorOptions>) => void;
}) {
  const toChecked = (value: unknown) =>
    props.toChecked ? props.toChecked(value) : !!value;
  const toValue = (checked: boolean) =>
    props.toValue ? props.toValue(checked) : checked;

  const setHere = () => props.tab.values[props.fieldKey] !== undefined;
  const checkedHere = () => toChecked(props.tab.values[props.fieldKey]);
  const effectiveChecked = () => toChecked(props.effective[props.fieldKey]);

  return (
    <FieldRow
      label={props.label}
      setHere={setHere()}
      editable={props.editable}
      provenance={props.provenance[props.fieldKey]}
      inheritedPreview={inheritedLabel(
        effectiveChecked() ? "on" : "off",
        props.provenance[props.fieldKey]
      )}
      onOverride={() =>
        props.write({ [props.fieldKey]: toValue(effectiveChecked()) })
      }
      onClear={() => props.write({ [props.fieldKey]: undefined })}
    >
      <Switch
        checked={checkedHere()}
        disabled={!props.editable}
        onChange={(checked) =>
          props.write({ [props.fieldKey]: toValue(checked) })
        }
      >
        {checkedHere() ? "on" : "off"}
      </Switch>
    </FieldRow>
  );
}
