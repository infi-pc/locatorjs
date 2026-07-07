import { template as _$template } from "solid-js/web";
import { spread as _$spread } from "solid-js/web";
import { mergeProps as _$mergeProps } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<input type=text>`);
import { splitProps } from "solid-js";
export function TextInput(props) {
  const [local, rest] = splitProps(props, ["class"]);
  return (() => {
    var _el$ = _tmpl$();
    _$spread(_el$, _$mergeProps({
      get ["class"]() {
        return `w-full rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100${local.class ? ` ${local.class}` : ""}`;
      }
    }, rest), false, false);
    return _el$;
  })();
}