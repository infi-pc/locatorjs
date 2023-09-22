import { Targets } from "@locator/shared";
import { AdapterId } from "../consts";
import { TreeNode } from "../types/TreeNode";
import { For, createSignal, onMount } from "solid-js";
import { ContextMenuState } from "../types/types";
import { getParentsPaths } from "../adapters/getParentsPath";
import getUsableFileName from "../functions/getUsableFileName";
import { buildLink } from "../functions/buildLink";
import { useOptions } from "../functions/optionsStore";
import { goToLinkProps } from "../functions/goTo";

export function ContextView(props: {
  contextMenuState: ContextMenuState;
  close: () => void;
  adapterId?: AdapterId | undefined;
  targets: Targets;
  setHighlightedNode: (node: null | TreeNode) => void;
}) {
  const options = useOptions();
  let contentRef: HTMLDivElement | undefined;
  let list: HTMLDivElement | undefined;
  let root: HTMLDivElement | undefined;

  onMount(() => {
    if (root) {
      root.focus();
    }
  });

  const [focusedIndex, setFocusedIndex] = createSignal<number | null>(null);
  const paths = () =>
    getParentsPaths(props.contextMenuState.target, props.adapterId);

  function focusOnElementInDirection(direction: "up" | "down") {
    if (focusedIndex == null) {
      setFocusedIndex(0);
      return;
    }

    let newFocused = focusedIndex() ?? -1;
    if (direction === "down") {
      newFocused += 1;
    }
    if (direction === "up") {
      newFocused -= 1;
    }
    if (newFocused < 0) {
      newFocused = paths().length - 1;
    }
    if (newFocused > paths().length - 1) {
      newFocused = 0;
    }
    setFocusedIndex(newFocused);
    window.setTimeout(() => {
      scrollActiveOptionIntoView();
    }, 0);
  }

  function scrollActiveOptionIntoView() {
    if (focusedIndex == null) {
      return;
    }
    list
      ?.querySelector(`:nth-child(${(focusedIndex() || 0) + 1})`)
      ?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case "Escape": {
        e.preventDefault();
        e.stopPropagation();
        props.close();

        break;
      }
      case "ArrowDown": {
        e.preventDefault();
        focusOnElementInDirection("down");
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        focusOnElementInDirection("up");
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (focusedIndex() !== null) {
          const path = paths()[focusedIndex()!];
          if (path) {
            goToLinkProps(path.link!, props.targets, options);
          }

          setFocusedIndex(null);
        }

        props.close();
        break;
      }
    }
  }

  return (
    <div
      ref={root}
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        "pointer-events": "auto",
        "background-color": "rgba(0,0,0,0.1)",
        "z-index": 1001,
      }}
      tabIndex={0}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          props.close();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          position: "absolute",
          top: `${props.contextMenuState.y || 0}px`,
          left: `${props.contextMenuState.x || 0}px`,
        }}
        ref={contentRef}
      >
        <div
          class={
            "bg-white rounded-md py-2 shadow-xl text-xs overflow-auto flex flex-col"
          }
          style={{
            "max-height": "calc(100vh - 16px)",
          }}
          ref={list}
        >
          <For each={paths()}>
            {(path, index) => {
              return (
                <a
                  class={
                    "px-4 py-2 w-60 hover:bg-slate-50 text-left text-sm font-medium " +
                    (index() === focusedIndex() ? "bg-slate-100" : "")
                  }
                  href={buildLink(path.link!, props.targets, options)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToLinkProps(path.link!, props.targets, options);
                    props.close();
                  }}
                >
                  {path.title}
                  <div class="text-xs text-gray-500">
                    {getUsableFileName(path.link?.filePath || "")}
                  </div>
                </a>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
