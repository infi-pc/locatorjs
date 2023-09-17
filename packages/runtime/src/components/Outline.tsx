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
          <div
            class="absolute -top-4 left-0 bg-black/60 text-white font-bold rounded-md px-1 py-1 flex"
            style={{
              "text-shadow": "none",
              "pointer-events": "auto",
              ...(box().width < 50 || box().height < 50
                ? { top: "-8px", left: "-8px" }
                : {}),
            }}
          >
            <button
              class="py-1 px-1 hover:bg-white/30 pointer hover:text-gray-100 rounded"
              onClick={() => {
                props.showTreeFromElement(props.element.htmlElement);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "16px", height: "16px" }}
                viewBox="0 0 24 24"
              >
                <title>sitemap</title>
                <path
                  fill="currentColor"
                  d="M9,2V8H11V11H5C3.89,11 3,11.89 3,13V16H1V22H7V16H5V13H11V16H9V22H15V16H13V13H19V16H17V22H23V16H21V13C21,11.89 20.11,11 19,11H13V8H15V2H9Z"
                />
              </svg>
            </button>
            <button
              class="py-1 px-1 hover:bg-white/30 pointer hover:text-gray-100 rounded"
              onClick={() => {
                props.showParentsPath(props.element.htmlElement);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "16px", height: "16px" }}
                viewBox="0 0 24 24"
              >
                <title>format-list-text</title>
                <path
                  fill="currentColor"
                  d="M2 14H8V20H2M16 8H10V10H16M2 10H8V4H2M10 4V6H22V4M10 20H16V18H10M10 16H22V14H10"
                />
              </svg>
            </button>
            <button
              class="py-1 px-1 hover:bg-white/30 pointer hover:text-gray-100 rounded"
              onClick={() => {
                props.copyToClipboard(props.element.htmlElement);
              }}
            >
              <svg
                style={{ width: "16px", height: "16px" }}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
                />
              </svg>
            </button>
          </div>
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
      {Object.entries(props.allBoxes.margin).map(([, box]) => {
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
      {Object.entries(props.allBoxes.padding).map(([, box]) => {
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
