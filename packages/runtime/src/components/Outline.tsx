import { ComponentOutline } from "./ComponentOutline";

import type { Targets } from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import { ClipboardButton } from "./ClipboardButton";
import { Button } from "./Button";
import { RenderBoxes } from "./RenderBoxes";
import Tooltip from "./Tooltip";

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

export type AllBoxes = {
  margin: IndividualBoxes;
  padding: IndividualBoxes;
  innerBox: Box;
};

export function Outline(props: {
  element: FullElementInfo;
  showTreeFromElement: (element: HTMLElement) => void;
  showParentsPath: (element: HTMLElement, x: number, y: number) => void;
  copyToClipboard: (element: HTMLElement) => void;
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

  let buttonsWrapper: HTMLDivElement | undefined;

  function getOffset() {
    const buttonsWrapperWidth = buttonsWrapper?.clientWidth || 80;

    const offset = {
      top: -16,
      left: 0,
    };

    if (box().width < buttonsWrapperWidth) {
      offset.left = -buttonsWrapperWidth / 2 + box().width / 2 - 1;
    }

    if (box().height < 40) {
      offset.top = -30;
    }

    return {
      top: offset.top + "px",
      left: offset.left + "px",
    };
  }

  return (
    <>
      <div>
        {domElementInfo() && <RenderBoxes allBoxes={domElementInfo()!} />}
        <div
          class="fixed flex text-xs font-bold items-center justify-center text-sky-500 rounded border border-solid border-sky-500"
          style={{
            "z-index": 2,
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
            class="absolute bg-black/60 text-white font-bold rounded-md px-1 py-1 flex"
            style={{
              "text-shadow": "none",
              "pointer-events": "auto",
              ...getOffset(),
            }}
            ref={buttonsWrapper}
          >
            <Tooltip tooltipText="Tree view">
              <Button
                onClick={() => {
                  props.showTreeFromElement(props.element.htmlElement);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    width: "16px",
                    height: "16px",
                    "pointer-events": "none",
                  }}
                  viewBox="0 0 24 24"
                >
                  <title>sitemap</title>
                  <path
                    fill="currentColor"
                    d="M9,2V8H11V11H5C3.89,11 3,11.89 3,13V16H1V22H7V16H5V13H11V16H9V22H15V16H13V13H19V16H17V22H23V16H21V13C21,11.89 20.11,11 19,11H13V8H15V2H9Z"
                  />
                </svg>
              </Button>
            </Tooltip>
            <Tooltip tooltipText="Parents">
              <Button
                onClick={() => {
                  props.showParentsPath(
                    props.element.htmlElement,
                    box().x + 2,
                    box().y + 20
                  );
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    width: "16px",
                    height: "16px",
                    "pointer-events": "none",
                  }}
                  viewBox="0 0 24 24"
                >
                  <title>format-list-text</title>
                  <path
                    fill="currentColor"
                    d="M2 14H8V20H2M16 8H10V10H16M2 10H8V4H2M10 4V6H22V4M10 20H16V18H10M10 16H22V14H10"
                  />
                </svg>
              </Button>
            </Tooltip>
            <Tooltip tooltipText="Copy path">
              <ClipboardButton
                onClick={() => {
                  props.copyToClipboard(props.element.htmlElement);
                }}
              />
            </Tooltip>
          </div>
          {props.element.thisElement.label}
        </div>
      </div>
      {props.element.componentsLabels.length > 0 && (
        <ComponentOutline
          labels={props.element.componentsLabels}
          bbox={props.element.componentBox}
          element={props.element.htmlElement}
          showTreeFromElement={props.showTreeFromElement}
          targets={props.targets}
        />
      )}
    </>
  );
}

function label(value: number) {
  return value ? `${value}px` : "";
}
