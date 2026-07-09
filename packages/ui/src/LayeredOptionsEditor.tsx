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
import { css, cx } from "@locator/styled-system/css";

export type LayerTabConfig = {
  layer: LocatorLayer;
  label: string;
  values: LocatorOptions;
  /** Absent means the layer is read-only in this surface. */
  write?: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
  /** Shown at the top of the tab, e.g. why the layer is read-only or unavailable. */
  note?: string;
};

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "4" }),
  note: css({
    borderRadius: "l2",
    bg: "green.subtle.bg",
    color: "green.subtle.fg",
    fontSize: "xs",
    px: "3",
    py: "2",
  }),
  rowHeader: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
  }),
  fieldLabel: css({
    color: "fg.default",
    fontSize: "sm",
    fontWeight: "medium",
  }),
  rowActions: css({ alignItems: "center", display: "flex", gap: "2" }),
  resetButton: css({
    color: "fg.subtle",
    cursor: "pointer",
    fontSize: "xs",
    textDecoration: "underline",
    _hover: { color: "fg.muted" },
  }),
  controlWrap: css({ mt: "1" }),
  inherited: css({
    alignItems: "center",
    bg: "gray.surface.bg",
    borderColor: "gray.surface.border",
    borderRadius: "l2",
    borderWidth: "1px",
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
    minH: "10",
    px: "3",
    py: "2",
    _hover: {
      borderColor: "gray.surface.border.hover",
    },
  }),
  mutedText: css({ color: "fg.subtle", fontSize: "sm" }),
  optionStack: css({ display: "flex", flexDirection: "column", gap: "1" }),
  optionLabel: css({
    alignItems: "center",
    color: "fg.default",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    gap: "2",
  }),
  radio: css({
    accentColor: "var(--colors-green-9)",
    cursor: "pointer",
    flexShrink: 0,
  }),
  helperText: css({ color: "fg.muted", fontSize: "xs" }),
  fadedInput: css({ color: "fg.subtle", _focus: { color: "fg.default" } }),
  switchStack: css({
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
    gap: "1.5",
  }),
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
    <div class={styles.stack}>
      <Show when={props.tab.note}>
        <div class={styles.note}>{props.tab.note}</div>
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
      <div class={styles.rowHeader}>
        <span class={styles.fieldLabel}>{props.label}</span>
        <div class={styles.rowActions}>
          <ProvenanceBadge layer={props.provenance} />
          <Show when={props.setHere && props.editable}>
            <button
              class={styles.resetButton}
              onClick={() => props.onClear?.()}
            >
              reset to inherited
            </button>
          </Show>
        </div>
      </div>
      <div class={styles.controlWrap}>
        <Show
          when={props.setHere}
          fallback={
            <div class={styles.inherited}>
              <span class={styles.mutedText}>{props.inheritedPreview}</span>
              <Show when={props.editable}>
                <Button size="xs" variant="outline" onClick={props.onOverride}>
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
      <div class={styles.optionStack}>
        <For each={Object.entries(props.targets)}>
          {([key, target]) => (
            <label class={styles.optionLabel}>
              <input
                type="radio"
                name={`target-${props.tab.layer}`}
                class={styles.radio}
                checked={key === selected()}
                disabled={!props.editable}
                onChange={() => select(key)}
              />
              {target.label}
            </label>
          )}
        </For>
        <label class={styles.optionLabel}>
          <input
            type="radio"
            name={`target-${props.tab.layer}`}
            class={styles.radio}
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
          class={cx(props.targets[selected()] ? styles.fadedInput : undefined)}
          onChange={(e) => select(e.currentTarget.value)}
        />
        <Show when={isCustom()}>
          <div class={styles.helperText}>
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
      <div class={styles.switchStack}>
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
