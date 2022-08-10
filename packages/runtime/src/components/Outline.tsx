import { For } from "solid-js";
import { baseColor, HREF_TARGET, PADDING } from "../consts";
import { LabelData } from "../types/LabelData";
import { trackClickStats } from "../functions/trackClickStats";
import { hasExperimentalFeatures } from "../functions/hasExperimentalFeatures";
import { goTo } from "../functions/goTo";
import { SimpleDOMRect } from "../types/types";
import { FullElementInfo } from "../adapters/adapterApi";
import { buildLink } from "../functions/buildLink";
import { Targets } from "@locator/shared";

export function Outline(props: {
  element: FullElementInfo;
  showTreeFromElement: (element: HTMLElement) => void;
  targets: Targets;
}) {
  const box = () => props.element.thisElement.box;
  return (
    <>
      <div>
        <div
          style={{
            position: "fixed",
            left: box().x + "px",
            top: box().y + "px",
            width: box().width + "px",
            height: box().height + "px",
            "background-color": "rgba(222, 0, 0, 0.3)",
            border: "1px solid rgba(222, 0, 0, 0.5)",
            "border-radius": "2px",
            color: "rgba(222, 0, 0, 1)",
            overflow: "hidden",
            "padding-left": "4px",
            "padding-top": box().height > 20 ? "4px" : "0px",
            "font-size": "12px",
            "font-weight": "bold",
            "text-shadow":
              "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            "text-overflow": "ellipsis",
          }}
        >
          {props.element.thisElement.label}
        </div>
      </div>
      <ComponentOutline
        labels={props.element.componentsLabels}
        bbox={props.element.componentBox}
        element={props.element.htmlElement}
        showTreeFromElement={props.showTreeFromElement}
        targets={props.targets}
      />
    </>
  );
}

function ComponentOutline(props: {
  bbox: SimpleDOMRect;
  labels: LabelData[];
  element: HTMLElement;
  showTreeFromElement: (element: HTMLElement) => void;
  targets: Targets;
}) {
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
      style={{
        position: "fixed",
        left: left() + "px",
        top: top() + "px",
        width: width() + "px",
        height: height() + "px",
        border: "2px solid " + baseColor,
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
          {hasExperimentalFeatures() ? (
            <a
              class="locatorjs-label"
              target={HREF_TARGET}
              onClick={() => {
                props.showTreeFromElement(props.element);
              }}
            >
              <svg
                style={{ width: "16px", height: "16px" }}
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M3,3H9V7H3V3M15,10H21V14H15V10M15,17H21V21H15V17M13,13H7V18H13V20H7L5,20V9H7V11H13V13Z"
                />
              </svg>
            </a>
          ) : null}
          <For each={props.labels}>
            {(label) => {
              const link = label.link
                ? buildLink(label.link, props.targets)
                : null;
              return link ? (
                <a
                  class="locatorjs-label"
                  href={link}
                  target={HREF_TARGET}
                  onClick={() => {
                    trackClickStats();
                    goTo(link!);
                  }}
                >
                  {label.label}
                </a>
              ) : (
                <div class="locatorjs-label">{label.label}</div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
