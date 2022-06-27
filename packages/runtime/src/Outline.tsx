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
          }}
        ></div>
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
  return (
    <div
      style={{
        position: "fixed",
        left: props.bbox.x - PADDING + "px",
        top: props.bbox.y - PADDING + "px",
        width: props.bbox.width + PADDING * 2 + "px",
        height: props.bbox.height + PADDING * 2 + "px",
        border: "2px solid " + baseColor,
        "border-radius": "8px",
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
            padding: isReversed() ? "10px 10px 2px 10px" : "2px 10px 10px 10px",
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
}
