/* eslint-disable react/no-unknown-property */
import { For } from "solid-js";
import { baseColor, HREF_TARGET, PADDING } from "./consts";
import { getLabels } from "./getLabels";
import { LabelData } from "./LabelData";
import { trackClickStats } from "./trackClickStats";

export function Outline(props: { element: HTMLElement }) {
  const bbox = () => props.element.getBoundingClientRect();
  const isReversed = () => bbox().y < 30;
  let labels = (): LabelData[] => getLabels(props.element);
  return (
    <div
      style={{
        position: "fixed",
        left: bbox().x - PADDING + "px",
        top: bbox().y - PADDING + "px",
        width: bbox().width + PADDING * 2 + "px",
        height: bbox().height + PADDING * 2 + "px",
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
          <For each={labels()}>
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
