import type { Binding, BindingAction, Targets } from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import { getParentsPaths } from "../adapters/getParentsPath";
import { ComponentOutline } from "./ComponentOutline";
import { RenderBoxes } from "./RenderBoxes";
import Tooltip from "./Tooltip";
import { css } from "@locator/styled-system/css";
import {
  HoverToolbarButton,
  HoverToolbarFrame,
  actionIconFor,
  actionLabel,
} from "@locator/ui";
import { Check } from "lucide-solid";
import { createSignal, For, onCleanup, Show } from "solid-js";

const styles = {
  outline: css({
    alignItems: "center",
    borderColor: "blue.9",
    borderRadius: "l2",
    borderStyle: "solid",
    borderWidth: "1px",
    color: "blue.9",
    display: "flex",
    fontSize: "xs",
    fontWeight: "bold",
    justifyContent: "center",
    position: "fixed",
  }),
  actions: css({
    position: "absolute",
  }),
};

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
  bindings: Binding[];
  performAction: (
    action: BindingAction,
    element: FullElementInfo,
    position: { x: number; y: number }
  ) => Promise<boolean>;
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

  const parentsWithLinks = () =>
    getParentsPaths(props.element.htmlElement).filter((parent) => parent.link);

  const visibleBindings = () =>
    props.bindings.filter(
      (binding) =>
        binding.action.kind !== "show-parents" || parentsWithLinks().length > 1
    );

  return (
    <>
      <div>
        {domElementInfo() && <RenderBoxes allBoxes={domElementInfo()!} />}
        <div
          class={styles.outline}
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
          <Show when={visibleBindings().length > 0}>
            <HoverToolbarFrame
              role="toolbar"
              aria-label="Locator actions"
              class={styles.actions}
              style={{
                "text-shadow": "none",
                "pointer-events": "auto",
                ...getOffset(),
              }}
              ref={buttonsWrapper}
            >
              <For each={visibleBindings()}>
                {(binding) => (
                  <OutlineActionButton
                    binding={binding}
                    targets={props.targets}
                    onAction={() =>
                      props.performAction(binding.action, props.element, {
                        x: box().x + 2,
                        y: box().y + 20,
                      })
                    }
                  />
                )}
              </For>
            </HoverToolbarFrame>
          </Show>
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

function OutlineActionButton(props: {
  binding: Binding;
  targets: Targets;
  onAction: () => Promise<boolean>;
}) {
  const [complete, setComplete] = createSignal(false);
  let completeTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => {
    if (completeTimer) clearTimeout(completeTimer);
  });
  const isCopy = () =>
    props.binding.action.kind === "copy-path" ||
    props.binding.action.kind === "copy-prompt";
  return (
    <Tooltip tooltipText={actionLabel(props.binding.action, props.targets)}>
      <HoverToolbarButton
        aria-label={actionLabel(props.binding.action, props.targets)}
        onClick={async () => {
          const succeeded = await props.onAction();
          if (succeeded && isCopy()) {
            if (completeTimer) clearTimeout(completeTimer);
            setComplete(true);
            completeTimer = setTimeout(() => {
              setComplete(false);
              completeTimer = undefined;
            }, 2000);
          }
        }}
      >
        {complete() ? (
          <Check size={16} />
        ) : (
          actionIconFor(props.binding.action, props.targets)
        )}
      </HoverToolbarButton>
    </Tooltip>
  );
}

function label(value: number) {
  return value ? `${value}px` : "";
}
