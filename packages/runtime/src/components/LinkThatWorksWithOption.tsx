import { JSXElement } from "solid-js";
import { css } from "@locator/styled-system/css";

const link = css({ textDecoration: "underline" });

export function LinkThatWorksWithOption(props: {
  href: string;
  children: JSXElement;
}) {
  return (
    <a
      href={props.href}
      target="_blank"
      class={link}
      onClick={(e) => {
        e.preventDefault();
        window.open(props.href, "_blank");
      }}
    >
      {props.children}
    </a>
  );
}
