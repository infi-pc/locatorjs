import { template as _$template } from "solid-js/web";
import { setAttribute as _$setAttribute } from "solid-js/web";
import { className as _$className } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<span>`);
export const LAYER_LABELS = {
  default: "default",
  team: "team",
  "user-extension": "extension",
  "user-origin": "this origin"
};
const LAYER_CLASSES = {
  default: "bg-gray-100 text-gray-600",
  team: "bg-blue-100 text-blue-700",
  "user-extension": "bg-purple-100 text-purple-700",
  "user-origin": "bg-green-100 text-green-700"
};
export function ProvenanceBadge(props) {
  if (!props.layer) return null;
  return (() => {
    var _el$ = _tmpl$();
    _$insert(_el$, () => LAYER_LABELS[props.layer]);
    _$effect(_p$ => {
      var _v$ = `inline-block text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${LAYER_CLASSES[props.layer]}`,
        _v$2 = `Setting comes from: ${props.layer}`;
      _v$ !== _p$.e && _$className(_el$, _p$.e = _v$);
      _v$2 !== _p$.t && _$setAttribute(_el$, "title", _p$.t = _v$2);
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$;
  })();
}