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
          class="fixed flex text-xs font-bold items-center justify-center text-red-500 rounded border-red-500"
          style={{
            left: box().x + "px",
            top: box().y + "px",
            width: box().width + "px",
            height: box().height + "px",
            "background-color": "rgba(222, 0, 0, 0.3)",
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
