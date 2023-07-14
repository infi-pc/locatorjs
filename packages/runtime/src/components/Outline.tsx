import { ComponentOutline } from "./ComponentOutline";

import type { Targets } from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
};
type IndividualBoxes = {
  top: Box;
  left: Box;
  right: Box;
  bottom: Box;
};

type AllBoxes = {
  margin: IndividualBoxes;
  padding: IndividualBoxes;
  innerBox: Box;
};

export function Outline(props: {
  element: FullElementInfo;
  showTreeFromElement: (element: HTMLElement) => void;
  targets: Targets;
}) {
  const box = () => props.element.thisElement.box;

  const domElementInfo = () => {
    const htmlElement = props.element.htmlElement;
    const box = props.element.thisElement.box;
    if (htmlElement && box) {
      const style = window.getComputedStyle(htmlElement);
      const display = style.display;
      const margin = {
        top: parseFloat(style.marginTop),
        left: parseFloat(style.marginLeft),
        right: parseFloat(style.marginRight),
        bottom: parseFloat(style.marginBottom),
      };
      const padding = {
        top: parseFloat(style.paddingTop),
        left: parseFloat(style.paddingLeft),
        right: parseFloat(style.paddingRight),
        bottom: parseFloat(style.paddingBottom),
      };
      const individualMarginBoxes: IndividualBoxes = {
        top: {
          top: box.y - margin.top,
          left: box.x,
          width: box.width,
          height: margin.top,
          label: label(margin.top),
        },
        left: {
          top: box.y - margin.top,
          left: box.x - margin.left,
          width: margin.left,
          height: box.height + margin.top + margin.bottom,
          label: label(margin.left),
        },
        right: {
          top: box.y - margin.top,
          left: box.x + box.width,
          width: margin.right,
          height: box.height + margin.top + margin.bottom,
          label: label(margin.right),
        },
        bottom: {
          top: box.y + box.height,
          left: box.x,
          width: box.width,
          height: margin.bottom,
          label: label(margin.bottom),
        },
      };

      const individualPaddingBoxes: IndividualBoxes = {
        top: {
          top: box.y,
          left: box.x,
          width: box.width,
          height: padding.top,
          label: label(padding.top),
        },
        left: {
          top: box.y + padding.top,
          left: box.x,
          width: padding.left,
          height: box.height - padding.top - padding.bottom,
          label: label(padding.left),
        },
        right: {
          top: box.y + padding.top,
          left: box.x + box.width - padding.right,
          width: padding.right,
          height: box.height - padding.top - padding.bottom,
          label: label(padding.right),
        },
        bottom: {
          top: box.y + box.height - padding.bottom,
          left: box.x,
          width: box.width,
          height: padding.bottom,
          label: label(padding.bottom),
        },
      };

      return {
        margin: individualMarginBoxes,
        padding: individualPaddingBoxes,
        innerBox: {
          top: box.y + padding.top,
          left: box.x + padding.left,
          width: box.width - padding.left - padding.right,
          height: box.height - padding.top - padding.bottom,
          label: "",
        },
      };
    }

    return null;
  };
  return (
    <>
      <div>
        {domElementInfo() && <RenderBoxes allBoxes={domElementInfo()!} />}
        <div
          class="fixed flex text-xs font-bold items-center justify-center text-red-500 rounded border border-solid border-red-500"
          style={{
            left: box().x + "px",
            top: box().y + "px",
            width: box().width + "px",
            height: box().height + "px",
            "text-shadow":
              "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            "text-overflow": "ellipsis",
          }}
        >
          <button
            class="absolute top-1 left-1 bg-red-500 text-white font-bold p-0.5 rounded hover:bg-red-800"
            style={{
              "text-shadow": "none",
              "pointer-events": "auto",
              cursor: "pointer",
              ...(box().width < 50 || box().height < 50
                ? { top: "-8px", left: "-8px" }
                : {}),
            }}
            onClick={() => {
              props.showTreeFromElement(props.element.htmlElement);
            }}
          >
            <svg style={{ width: "16px", height: "16éx" }} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z"
              />
            </svg>
          </button>
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

function RenderBoxes(props: { allBoxes: AllBoxes }) {
  return (
    <>
      {Object.entries(props.allBoxes.margin).map(([key, box]) => {
        return (
          <div
            class="fixed flex text-xs font-bold items-center justify-center text-blue-500"
            style={{
              left: box.left + "px",
              top: box.top + "px",
              width: box.width + "px",
              height: box.height + "px",
              "background-color": "rgba(0, 181, 222, 0.1)",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {/* {box.label} */}
          </div>
        );
      })}
      {Object.entries(props.allBoxes.padding).map(([key, box]) => {
        return (
          <div
            class="fixed flex text-xs font-bold items-center justify-center text-orange-500"
            style={{
              left: box.left + "px",
              top: box.top + "px",
              width: box.width + "px",
              height: box.height + "px",
              "background-color": "rgba(222, 148, 0, 0.3)",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {/* {box.label} */}
          </div>
        );
      })}

      <div
        class="fixed flex text-xs font-bold items-center justify-center text-red-500"
        style={{
          left: props.allBoxes.innerBox.left + "px",
          top: props.allBoxes.innerBox.top + "px",
          width: props.allBoxes.innerBox.width + "px",
          height: props.allBoxes.innerBox.height + "px",
          "background-color": "rgba(0, 133, 222, 0.3)",
          "text-shadow":
            "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
        }}
      >
        {props.allBoxes.innerBox.label}
      </div>
    </>
  );
}

function label(value: number) {
  return value ? `${value}px` : "";
}
