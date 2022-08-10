import { JSXElement } from "solid-js";

export function LinkThatWorksWithOption(props: {
  href: string;
  children: JSXElement;
}) {
  return (
    <a
      href={props.href}
      target="_blank"
      class="underline"
      onClick={(e) => {
        e.preventDefault();
        window.open(props.href, "_blank");
      }}
    >
      {props.children}
    </a>
  );
}
