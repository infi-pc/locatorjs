import { For } from "solid-js";
import { baseColor, HREF_TARGET, PADDING } from "../consts";
import { LabelData } from "../types/LabelData";
import { trackClickStats } from "../functions/trackClickStats";

import { goTo } from "../functions/goTo";
import { SimpleDOMRect } from "../types/types";
import { buildLink } from "../functions/buildLink";
import { Targets } from "@locator/shared";
import { useOptions } from "../functions/optionsStore";

export function ComponentOutline(props: {
  bbox: SimpleDOMRect;
  labels: LabelData[];
  element: HTMLElement;
  showTreeFromElement: (element: HTMLElement) => void;
  targets: Targets;
}) {
  const options = useOptions();

  const isInside = () => props.bbox.height >= window.innerHeight - 40;
  const isBelow = () => props.bbox.y < 30 && !isInside();

  const left = () => Math.max(props.bbox.x - PADDING, 0);
  const top = () => Math.max(props.bbox.y - PADDING, 0);

  const cutFromTop = () => (props.bbox.y < 0 ? -(props.bbox.y - PADDING) : 0);
  const cutFromLeft = () => (props.bbox.x < 0 ? -(props.bbox.x - PADDING) : 0);

  const width = () =>
    Math.min(props.bbox.width - cutFromLeft() + PADDING * 2, window.innerWidth);
  const height = () =>
    Math.min(
      props.bbox.height - cutFromTop() + PADDING * 2,
      window.innerHeight
    );

  return (
    <div
      class="border border-purple-500"
      style={{
        "z-index": 1,
        position: "fixed",
        left: left() + "px",
        top: top() + "px",
        width: width() + "px",
        height: height() + "px",
        // "border-radius": "8px",
        "border-top-left-radius": left() === 0 || top() === 0 ? "0" : "8px",
        "border-top-right-radius":
          left() + width() === window.innerWidth || top() === 0 ? "0" : "8px",
        "border-bottom-left-radius":
          left() === 0 || top() + height() === window.innerHeight ? "0" : "8px",
        "border-bottom-right-radius":
          left() + width() === window.innerWidth ||
          top() + height() === window.innerHeight
            ? "0"
            : "8px",
      }}
    >
      <div
        id="locatorjs-labels-section"
        style={{
          position: "absolute",
          display: "flex",
          "justify-content": "center",
          bottom: isBelow() ? (isInside() ? "2px" : "-28px") : undefined,
          top: isBelow() ? undefined : isInside() ? "2px" : "-28px",
          left: "0px",
          width: "100%",
          "pointer-events": "auto",
          cursor: "pointer",
          ...(isBelow()
            ? {
                "border-bottom-left-radius": "100%",
                "border-bottom-right-radius": "100%",
              }
            : {
                "border-top-left-radius": "100%",
                "border-top-right-radius": "100%",
              }),
        }}
      >
        <div
          id="locatorjs-labels-wrapper"
          style={{
            padding: isBelow() ? "10px 10px 2px 10px" : "2px 10px 10px 10px",
          }}
        >
          {/* <a
            class="locatorjs-label"
            target={HREF_TARGET}
            onClick={() => {
              props.showTreeFromElement(props.element);
            }}
          >
            <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M3,3H9V7H3V3M15,10H21V14H15V10M15,17H21V21H15V17M13,13H7V18H13V20H7L5,20V9H7V11H13V13Z"
              />
            </svg>
          </a> */}

          <For each={props.labels}>
            {(label) => {
              const link = label.link
                ? buildLink(label.link, props.targets, options)
                : null;
              const labelClass =
                "cursor-pointer bg-purple-500 block text-white text-xs font-bold text-center px-1 py-0.5 rounded whitespace-nowrap pointer-events-auto hover:bg-purple-600";
              const labelStyles = {
                "line-height": "18px",
              };

              return link ? (
                <a
                  class={labelClass}
                  style={labelStyles}
                  href={link}
                  target={options.getOptions().hrefTarget || HREF_TARGET}
                  onClick={() => {
                    trackClickStats();
                    goTo(link!, options);
                  }}
                >
                  {label.label}
                </a>
              ) : (
                <div class={labelClass} style={labelStyles}>
                  {label.label}
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
