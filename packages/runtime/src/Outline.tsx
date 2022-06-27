/* eslint-disable react/display-name */
/* eslint-disable react/no-unknown-property */
import { For } from "solid-js";
import { baseColor, HREF_TARGET, PADDING } from "./consts";
import {
  FullElementInfo,
  getElementInfo,
} from "./adapters/reactDevToolsAdapter";
import { LabelData } from "./LabelData";
import { trackClickStats } from "./trackClickStats";

export function Outline(props: { element: FullElementInfo }) {
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
          }}
        >
          <div
            style={{
              "margin-left": "4px",
              "margin-top": "4px",
              "font-size": "12px",
              "font-weight": "bold",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {props.element.thisElement.label}
          </div>
        </div>
      </div>
      <ComponentOutline
        labels={props.element.componentsLabels}
        bbox={props.element.componentBox}
      />
    </>
  );
}

function ComponentOutline(props: { bbox: DOMRect; labels: LabelData[] }) {
  const isReversed = () => props.bbox.y < 30;
  return () => {
    const left = Math.max(props.bbox.x - PADDING, 0);
    const top = Math.max(props.bbox.y - PADDING, 0);
    const width = Math.min(props.bbox.width + PADDING * 2, window.innerWidth);
    const height = Math.min(
      props.bbox.height + PADDING * 2,
      window.innerHeight
    );
    return (
      <div
        style={{
          position: "fixed",
          left: left + "px",
          top: top + "px",
          width: width + "px",
          height: height + "px",
          border: "2px solid " + baseColor,
          // "border-radius": "8px",
          "border-top-left-radius": left === 0 || top === 0 ? "0" : "8px",
          "border-top-right-radius":
            left + width === window.innerWidth || top === 0 ? "0" : "8px",
          "border-bottom-left-radius":
            left === 0 || top + height === window.innerHeight ? "0" : "8px",
          "border-bottom-right-radius":
            left + width === window.innerWidth ||
            top + height === window.innerHeight
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
            bottom: isReversed() ? "-28px" : undefined,
            top: isReversed() ? undefined : "-28px",
            left: "0px",
            width: "100%",
            "pointer-events": "auto",
            cursor: "pointer",
            ...(isReversed()
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
              padding: isReversed()
                ? "10px 10px 2px 10px"
                : "2px 10px 10px 10px",
            }}
          >
            <For each={props.labels}>
              {(label, i) => (
                <a
                  class="locatorjs-label"
                  href={label.link}
                  target={HREF_TARGET}
                  onClick={() => {
                    trackClickStats();
                    window.open(label.link, HREF_TARGET);
                  }}
                >
                  {label.label}
                </a>
              )}
            </For>
          </div>
        </div>
      </div>
    );
  };
}
