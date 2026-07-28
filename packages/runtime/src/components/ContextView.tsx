import type { Targets } from "@locator/shared";
import { createSignal, For, onMount } from "solid-js";
import { getParentsPaths } from "../adapters/getParentsPath";
import type { AdapterId } from "../consts";
import { buildLink } from "../functions/buildLink";
import getUsableFileName from "../functions/getUsableFileName";
import { goToLinkProps } from "../functions/goTo";
import { useOptions } from "../functions/optionsStore";
import type { TreeNode } from "../types/TreeNode";
import type { ContextMenuState } from "../types/types";
import { css, cx } from "@locator/styled-system/css";

const styles = {
  backdrop: css({
    bg: "black/10",
    height: "100vh",
    left: "0",
    pointerEvents: "auto",
    position: "fixed",
    top: "0",
    width: "100vw",
  }),
  menu: css({
    bg: "bg.default",
    borderRadius: "l2",
    boxShadow: "xl",
    display: "flex",
    flexDirection: "column",
    fontSize: "xs",
    overflow: "auto",
    py: "2",
  }),
  item: css({
    fontSize: "sm",
    fontWeight: "medium",
    px: "4",
    py: "2",
    textAlign: "left",
    width: "60",
    _hover: { bg: "gray.subtle.bg" },
  }),
  focused: css({ bg: "gray.subtle.bg" }),
  path: css({ color: "fg.muted", fontSize: "xs" }),
};

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
      class={styles.backdrop}
      ref={root}
      style={{
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
          class={styles.menu}
          style={{
            "max-height": "calc(100vh - 16px)",
          }}
          ref={list}
        >
          <For each={paths()}>
            {(path, index) => {
              const link = path.link;
              if (!link) {
                return null;
              }
              return (
                <a
                  class={cx(
                    styles.item,
                    index() === focusedIndex() && styles.focused
                  )}
                  href={buildLink(link, props.targets, options)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToLinkProps(link, props.targets, options);
                    props.close();
                  }}
                >
                  {path.title}
                  <div class={styles.path}>
                    {getUsableFileName(link.filePath || "")}
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
