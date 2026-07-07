import { template as _$template } from "solid-js/web";
import { delegateEvents as _$delegateEvents } from "solid-js/web";
import { setAttribute as _$setAttribute } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { memo as _$memo } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<div class="rounded bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">`),
  _tmpl$2 = /*#__PURE__*/_$template(`<div class="flex flex-col gap-4">`),
  _tmpl$3 = /*#__PURE__*/_$template(`<button class="text-[11px] text-gray-400 underline hover:text-gray-600 cursor-pointer">reset to inherited`),
  _tmpl$4 = /*#__PURE__*/_$template(`<div><div class="flex items-center justify-between gap-2"><span class="text-sm font-medium text-gray-900 dark:text-gray-200"></span><div class="flex items-center gap-2"></div></div><div class=mt-1>`),
  _tmpl$5 = /*#__PURE__*/_$template(`<div class="flex items-center justify-between gap-2 rounded border border-dashed border-gray-200 px-2 py-1.5 dark:border-gray-700"><span class="text-sm text-gray-400">`),
  _tmpl$6 = /*#__PURE__*/_$template(`<div class="text-xs text-gray-500">Available variables: projectPath, filePath, line, column`),
  _tmpl$7 = /*#__PURE__*/_$template(`<div class="flex flex-col gap-1"><label class="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-gray-200"><input type=radio class="text-blue-600 focus:ring-blue-500">Custom link`),
  _tmpl$8 = /*#__PURE__*/_$template(`<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-gray-200"><input type=radio class="text-blue-600 focus:ring-blue-500">`),
  _tmpl$9 = /*#__PURE__*/_$template(`<div class="flex flex-col items-start gap-1.5">`);
import { For, Show } from "solid-js";
import { getModifiersMap, getModifiersString, modifiersTitles } from "@locator/shared";
import { Button } from "./Button";
import { Switch } from "./Switch";
import { Tabs } from "./Tabs";
import { TextInput } from "./TextInput";
import { ProvenanceBadge, LAYER_LABELS } from "./ProvenanceBadge";
export function LayeredOptionsEditor(props) {
  const defaultId = () => (props.tabs.find(t => t.write) ?? props.tabs[0])?.layer;
  return _$createComponent(Tabs, {
    get defaultId() {
      return defaultId();
    },
    get items() {
      return props.tabs.map(tab => ({
        id: tab.layer,
        label: tab.label,
        content: _$createComponent(LayerForm, {
          tab: tab,
          get effective() {
            return props.effective;
          },
          get provenance() {
            return props.provenance;
          },
          get targets() {
            return props.targets;
          }
        })
      }));
    }
  });
}
function LayerForm(props) {
  const editable = () => !!props.tab.write;
  const write = patch => props.tab.write?.(patch);
  return (() => {
    var _el$ = _tmpl$2();
    _$insert(_el$, _$createComponent(Show, {
      get when() {
        return props.tab.note;
      },
      get children() {
        var _el$2 = _tmpl$();
        _$insert(_el$2, () => props.tab.note);
        return _el$2;
      }
    }), null);
    _$insert(_el$, _$createComponent(TargetField, {
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get targets() {
        return props.targets;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    _$insert(_el$, _$createComponent(ModifiersField, {
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    _$insert(_el$, _$createComponent(TextField, {
      label: "Project path",
      fieldKey: "projectPath",
      placeholder: "/Users/me/my-project/",
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    _$insert(_el$, _$createComponent(BooleanField, {
      label: "Open links in a new tab",
      fieldKey: "hrefTarget",
      toValue: checked => checked ? "_blank" : "_self",
      toChecked: value => value === "_blank",
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    _$insert(_el$, _$createComponent(BooleanField, {
      label: "Experimental features",
      fieldKey: "experimentalFeatures",
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    _$insert(_el$, _$createComponent(BooleanField, {
      label: "Debug mode",
      fieldKey: "debugMode",
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    _$insert(_el$, _$createComponent(BooleanField, {
      label: "Disable LocatorJS",
      fieldKey: "disabled",
      get tab() {
        return props.tab;
      },
      get effective() {
        return props.effective;
      },
      get provenance() {
        return props.provenance;
      },
      get editable() {
        return editable();
      },
      write: write
    }), null);
    return _el$;
  })();
}

/**
 * Shared row shell: label + provenance of the effective value, then either the
 * layer's own control (value set at this layer), an inherited-value preview
 * with an "Override here" action, or a plain read-only rendering.
 */
function FieldRow(props) {
  return (() => {
    var _el$3 = _tmpl$4(),
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.firstChild,
      _el$6 = _el$5.nextSibling,
      _el$8 = _el$4.nextSibling;
    _$insert(_el$5, () => props.label);
    _$insert(_el$6, _$createComponent(ProvenanceBadge, {
      get layer() {
        return props.provenance;
      }
    }), null);
    _$insert(_el$6, _$createComponent(Show, {
      get when() {
        return _$memo(() => !!props.setHere)() && props.editable;
      },
      get children() {
        var _el$7 = _tmpl$3();
        _el$7.$$click = () => props.onClear?.();
        return _el$7;
      }
    }), null);
    _$insert(_el$8, _$createComponent(Show, {
      get when() {
        return props.setHere;
      },
      get fallback() {
        return (() => {
          var _el$9 = _tmpl$5(),
            _el$0 = _el$9.firstChild;
          _$insert(_el$0, () => props.inheritedPreview);
          _$insert(_el$9, _$createComponent(Show, {
            get when() {
              return props.editable;
            },
            get children() {
              return _$createComponent(Button, {
                size: "xs",
                variant: "ghost",
                get onClick() {
                  return props.onOverride;
                },
                children: "Override here"
              });
            }
          }), null);
          return _el$9;
        })();
      },
      get children() {
        return props.children;
      }
    }));
    return _el$3;
  })();
}
function inheritedLabel(value, provenance) {
  if (value === undefined) return "not set";
  return `${value} (from ${provenance ? LAYER_LABELS[provenance] : "…"})`;
}
function TargetField(props) {
  let input;
  const setHere = () => props.tab.values.targetId !== undefined || props.tab.values.targetTemplate !== undefined;
  const selected = () => props.tab.values.targetTemplate ?? props.tab.values.targetId ?? "";
  const effectiveTarget = () => props.effective.targetTemplate ?? props.effective.targetId;
  const provenance = () => props.provenance.targetTemplate ?? props.provenance.targetId;
  const isCustom = () => setHere() && !props.targets[selected()];
  function select(val) {
    if (val.includes("://")) {
      props.write({
        targetTemplate: val,
        targetId: undefined
      });
    } else {
      props.write({
        targetId: val,
        targetTemplate: undefined
      });
    }
  }
  return _$createComponent(FieldRow, {
    label: "Editor link",
    get setHere() {
      return setHere();
    },
    get editable() {
      return props.editable;
    },
    get provenance() {
      return provenance();
    },
    get inheritedPreview() {
      return inheritedLabel(effectiveTarget() && props.targets[effectiveTarget()] ? props.targets[effectiveTarget()].label : effectiveTarget(), provenance());
    },
    onOverride: () => select(effectiveTarget() ?? "vscode"),
    onClear: () => props.write({
      targetId: undefined,
      targetTemplate: undefined
    }),
    get children() {
      var _el$1 = _tmpl$7(),
        _el$10 = _el$1.firstChild,
        _el$11 = _el$10.firstChild;
      _$insert(_el$1, _$createComponent(For, {
        get each() {
          return Object.entries(props.targets);
        },
        children: ([key, target]) => (() => {
          var _el$13 = _tmpl$8(),
            _el$14 = _el$13.firstChild;
          _el$14.addEventListener("change", () => select(key));
          _$insert(_el$13, () => target.label, null);
          _$effect(_p$ => {
            var _v$3 = `target-${props.tab.layer}`,
              _v$4 = !props.editable;
            _v$3 !== _p$.e && _$setAttribute(_el$14, "name", _p$.e = _v$3);
            _v$4 !== _p$.t && (_el$14.disabled = _p$.t = _v$4);
            return _p$;
          }, {
            e: undefined,
            t: undefined
          });
          _$effect(() => _el$14.checked = key === selected());
          return _el$13;
        })()
      }), _el$10);
      _el$11.addEventListener("change", () => {
        const known = props.targets[selected()];
        if (known) select(known.url);
        input?.focus();
        input?.select();
      });
      _$insert(_el$1, _$createComponent(TextInput, {
        ref: el => input = el,
        get value() {
          return _$memo(() => !!props.targets[selected()])() ? props.targets[selected()].url : selected();
        },
        get disabled() {
          return !props.editable;
        },
        get ["class"]() {
          return props.targets[selected()] ? "text-gray-400 focus:text-gray-800" : "";
        },
        onChange: e => select(e.currentTarget.value)
      }), null);
      _$insert(_el$1, _$createComponent(Show, {
        get when() {
          return isCustom();
        },
        get children() {
          return _tmpl$6();
        }
      }), null);
      _$effect(_p$ => {
        var _v$ = `target-${props.tab.layer}`,
          _v$2 = !props.editable;
        _v$ !== _p$.e && _$setAttribute(_el$11, "name", _p$.e = _v$);
        _v$2 !== _p$.t && (_el$11.disabled = _p$.t = _v$2);
        return _p$;
      }, {
        e: undefined,
        t: undefined
      });
      _$effect(() => _el$11.checked = isCustom());
      return _el$1;
    }
  });
}
function ModifiersField(props) {
  const setHere = () => props.tab.values.mouseModifiers !== undefined;
  const map = () => getModifiersMap(props.tab.values.mouseModifiers ?? "");
  const effectiveTitles = () => Object.keys(getModifiersMap(props.effective.mouseModifiers ?? "")).map(k => modifiersTitles[k]).join(" + ");
  function setControl(key, enable) {
    const next = map();
    if (enable) {
      next[key] = true;
    } else {
      delete next[key];
    }
    props.write({
      mouseModifiers: getModifiersString(next)
    });
  }
  return _$createComponent(FieldRow, {
    label: "Mouse-click modifiers",
    get setHere() {
      return setHere();
    },
    get editable() {
      return props.editable;
    },
    get provenance() {
      return props.provenance.mouseModifiers;
    },
    get inheritedPreview() {
      return inheritedLabel(effectiveTitles(), props.provenance.mouseModifiers);
    },
    onOverride: () => props.write({
      mouseModifiers: props.effective.mouseModifiers ?? "alt"
    }),
    onClear: () => props.write({
      mouseModifiers: undefined
    }),
    get children() {
      var _el$15 = _tmpl$9();
      _$insert(_el$15, _$createComponent(For, {
        get each() {
          return Object.entries(modifiersTitles);
        },
        children: ([key, title]) => _$createComponent(Switch, {
          get checked() {
            return !!map()[key];
          },
          get disabled() {
            return !props.editable;
          },
          onChange: checked => setControl(key, checked),
          children: title
        })
      }));
      return _el$15;
    }
  });
}
function TextField(props) {
  const setHere = () => props.tab.values[props.fieldKey] !== undefined;
  return _$createComponent(FieldRow, {
    get label() {
      return props.label;
    },
    get setHere() {
      return setHere();
    },
    get editable() {
      return props.editable;
    },
    get provenance() {
      return props.provenance[props.fieldKey];
    },
    get inheritedPreview() {
      return inheritedLabel(props.effective[props.fieldKey], props.provenance[props.fieldKey]);
    },
    onOverride: () => props.write({
      [props.fieldKey]: props.effective[props.fieldKey] ?? ""
    }),
    onClear: () => props.write({
      [props.fieldKey]: undefined
    }),
    get children() {
      return _$createComponent(TextInput, {
        get value() {
          return props.tab.values[props.fieldKey] ?? "";
        },
        get placeholder() {
          return props.placeholder;
        },
        get disabled() {
          return !props.editable;
        },
        onChange: e => props.write({
          [props.fieldKey]: e.currentTarget.value
        })
      });
    }
  });
}
function BooleanField(props) {
  const toChecked = value => props.toChecked ? props.toChecked(value) : !!value;
  const toValue = checked => props.toValue ? props.toValue(checked) : checked;
  const setHere = () => props.tab.values[props.fieldKey] !== undefined;
  const checkedHere = () => toChecked(props.tab.values[props.fieldKey]);
  const effectiveChecked = () => toChecked(props.effective[props.fieldKey]);
  return _$createComponent(FieldRow, {
    get label() {
      return props.label;
    },
    get setHere() {
      return setHere();
    },
    get editable() {
      return props.editable;
    },
    get provenance() {
      return props.provenance[props.fieldKey];
    },
    get inheritedPreview() {
      return inheritedLabel(effectiveChecked() ? "on" : "off", props.provenance[props.fieldKey]);
    },
    onOverride: () => props.write({
      [props.fieldKey]: toValue(effectiveChecked())
    }),
    onClear: () => props.write({
      [props.fieldKey]: undefined
    }),
    get children() {
      return _$createComponent(Switch, {
        get checked() {
          return checkedHere();
        },
        get disabled() {
          return !props.editable;
        },
        onChange: checked => props.write({
          [props.fieldKey]: toValue(checked)
        }),
        get children() {
          return checkedHere() ? "on" : "off";
        }
      });
    }
  });
}
_$delegateEvents(["click"]);