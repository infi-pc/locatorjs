import { template as _$template } from "solid-js/web";
import { spread as _$spread } from "solid-js/web";
import { mergeProps as _$mergeProps } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<button>`);
import { mergeProps, splitProps } from "solid-js";
// The extension popup builds Tailwind without preflight, so explicitly reset
// the native button border/background in every variant.
const VARIANT_CLASSES = {
  primary: "border border-transparent bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300",
  outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800",
  ghost: "border border-transparent bg-transparent text-blue-700 hover:bg-blue-50 active:bg-blue-100 dark:text-blue-300 dark:hover:bg-gray-800",
  "danger-ghost": "border border-transparent bg-transparent text-gray-700 hover:bg-red-100 hover:text-red-800 active:bg-red-50 dark:text-gray-300"
};
const SIZE_CLASSES = {
  xs: "text-xs px-2 py-0.5 gap-1",
  sm: "text-sm px-3 py-1 gap-1.5",
  md: "text-sm px-4 py-2 gap-2"
};
export function Button(props) {
  const merged = mergeProps({
    variant: "outline",
    size: "sm",
    type: "button"
  }, props);
  const [local, rest] = splitProps(merged, ["variant", "size", "class"]);
  return (() => {
    var _el$ = _tmpl$();
    _$spread(_el$, _$mergeProps({
      get ["class"]() {
        return `inline-flex items-center justify-center rounded font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[local.variant]} ${SIZE_CLASSES[local.size]}${local.class ? ` ${local.class}` : ""}`;
      }
    }, rest), false, false);
    return _el$;
  })();
}