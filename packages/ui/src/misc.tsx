import { JSX } from "solid-js";

export function SectionHeadline(props: {
  children: JSX.Element;
  class?: string;
}) {
  return (
    <label
      class={`text-base font-medium text-gray-900 dark:text-gray-200${
        props.class ? ` ${props.class}` : ""
      }`}
    >
      {props.children}
    </label>
  );
}

export function Kbd(props: { children: JSX.Element }) {
  return (
    <kbd class="rounded border border-b-2 border-gray-300 bg-gray-50 px-1.5 py-0.5 font-sans text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
      {props.children}
    </kbd>
  );
}

export function Spinner(props: { class?: string }) {
  return (
    <div
      class={`h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600${
        props.class ? ` ${props.class}` : ""
      }`}
      role="status"
      aria-label="Loading"
    />
  );
}
