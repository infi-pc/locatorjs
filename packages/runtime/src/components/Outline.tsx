import { FullElementInfo } from "../adapters/adapterApi";
import { Targets } from "@locator/shared";
import { ComponentOutline } from "./ComponentOutline";

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
          <button
            class="bg-red-500 text-white font-bold px-2 py-1 rounded-full hover:bg-red-800"
            style={{
              "text-shadow": "none",
              "pointer-events": "auto",
              cursor: "pointer",
            }}
            onClick={() => {
              props.showTreeFromElement(props.element.htmlElement);
            }}
          >
            tree
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
