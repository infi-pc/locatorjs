import { Binding, BindingAction, Targets } from "@locator/shared";
import { createMemo } from "solid-js";
import { AdapterId } from "../consts";
import { getElementInfo } from "../adapters/getElementInfo";
import { Outline } from "./Outline";
import { css } from "@locator/styled-system/css";

const styles = {
  viewport: css({
    alignItems: "center",
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    left: "0",
    position: "fixed",
    top: "0",
    width: "100vw",
  }),
  missing: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  }),
};

export function MaybeOutline(props: {
  currentElement: HTMLElement;
  showTreeFromElement: (element: HTMLElement) => void;
  bindings: Binding[];
  performAction: (
    action: BindingAction,
    element: import("../adapters/adapterApi").FullElementInfo,
    position: { x: number; y: number }
  ) => Promise<boolean>;
  adapterId?: AdapterId;
  targets: Targets;
}) {
  const elInfo = createMemo(() =>
    getElementInfo(props.currentElement, props.adapterId)
  );
  const box = () => props.currentElement.getBoundingClientRect();
  return (
    <>
      {elInfo() ? (
        <Outline
          element={elInfo()!}
          showTreeFromElement={props.showTreeFromElement}
          bindings={props.bindings}
          performAction={props.performAction}
          targets={props.targets}
        />
      ) : (
        <div class={styles.viewport}>
          <div
            class={styles.missing}
            style={{
              position: "absolute",
              left: box().x + "px",
              top: box().y + "px",
              width: box().width + "px",
              height: box().height + "px",
              "background-color": "rgba(222, 0, 0, 0.3)",
              border: "1px solid rgba(222, 0, 0, 0.5)",
              "border-radius": "2px",
              "font-size": "12px",
              "font-weight": "bold",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
              "text-overflow": "ellipsis",
            }}
          >
            No source found
          </div>
        </div>
      )}
    </>
  );
}
