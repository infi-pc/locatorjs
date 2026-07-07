import { template as _$template } from "solid-js/web";
import { className as _$className } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { insert as _$insert } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<label>`),
  _tmpl$2 = /*#__PURE__*/_$template(`<kbd class="rounded border border-b-2 border-gray-300 bg-gray-50 px-1.5 py-0.5 font-sans text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">`),
  _tmpl$3 = /*#__PURE__*/_$template(`<div role=status aria-label=Loading>`);
export function SectionHeadline(props) {
  return (() => {
    var _el$ = _tmpl$();
    _$insert(_el$, () => props.children);
    _$effect(() => _$className(_el$, `text-base font-medium text-gray-900 dark:text-gray-200${props.class ? ` ${props.class}` : ""}`));
    return _el$;
  })();
}
export function Kbd(props) {
  return (() => {
    var _el$2 = _tmpl$2();
    _$insert(_el$2, () => props.children);
    return _el$2;
  })();
}
export function Spinner(props) {
  return (() => {
    var _el$3 = _tmpl$3();
    _$effect(() => _$className(_el$3, `h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600${props.class ? ` ${props.class}` : ""}`));
    return _el$3;
  })();
}