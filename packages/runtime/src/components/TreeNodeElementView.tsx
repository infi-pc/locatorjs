import { Targets } from "@locator/shared";
import { For } from "solid-js";
import cropPath from "../functions/cropPath";
import { goToSource } from "../functions/goTo";
import { useOptions } from "../functions/optionsStore";
import { TreeNodeComponent, TreeNodeElement } from "../types/TreeNode";
import { css, cx } from "@locator/styled-system/css";
import { expandPill } from "@locator/styled-system/recipes";

const styles = {
  componentLink: css({
    borderRadius: "l1",
    color: "fg.default",
    cursor: "pointer",
    fontWeight: "bold",
    _hover: { bg: "gray.subtle.bg" },
  }),
  componentLabel: css({ fontWeight: "bold" }),
  node: css({ fontSize: "xs", pl: "2" }),
  highlighted: css({ bg: "amber.subtle.bg" }),
  bordered: css({
    borderColor: "border",
    borderWidth: "1px",
    pr: "2",
    py: "2",
  }),
  source: css({ color: "fg.default" }),
  noSource: css({ color: "fg.muted" }),
  componentHeader: css({
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
    pb: "1",
  }),
  ellipsis: css({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  nested: css({ pl: "2" }),
  sourceRow: css({
    alignItems: "center",
    display: "flex",
    gap: "4",
    justifyContent: "space-between",
  }),
  clickable: css({
    cursor: "pointer",
    _hover: { bg: "accent.subtle.bg" },
  }),
  tag: css({ display: "flex", fontFamily: "mono", gap: "1" }),
  expand: css({ ml: "2" }),
};

export function TreeNodeElementView(props: {
  node: TreeNodeElement;
  expandedIds: Set<string>;
  highlightedId: string;
  expandId: (id: string) => void;
  parentFilePath?: string;
  parentComponent: TreeNodeComponent | null;
  targets: Targets;
  setHighlightedBoundingBox: (node: TreeNodeElement | null) => void;
}) {
  const options = useOptions();

  function renderChildren() {
    return (
      <For each={props.node.getChildren()}>
        {(child) => (
          <TreeNodeElementView
            node={child as TreeNodeElement}
            expandedIds={props.expandedIds}
            highlightedId={props.highlightedId}
            expandId={props.expandId}
            parentFilePath={props.node.getSource()?.fileName}
            targets={props.targets}
            setHighlightedBoundingBox={props.setHighlightedBoundingBox}
            parentComponent={props.node.getComponent()}
          />
        )}
      </For>
    );
  }

  function isDifferentFilePath() {
    return props.node.getSource()?.fileName !== props.parentFilePath;
  }

  function isDifferentComponent() {
    return (
      props.node.getComponent &&
      JSON.stringify(props.node.getComponent()) !==
        JSON.stringify(props.parentComponent)
    );
  }

  // Assume that library components does not have a source, so show them inlined
  const preferInlineComponent = () => !props.node.getSource();

  function showComponentWrapper() {
    return isDifferentComponent() && !preferInlineComponent();
  }

  function showBorder() {
    return showComponentWrapper();
  }

  function componentLink() {
    return props.node.getComponent()?.callLink ? (
      <div
        class={styles.componentLink}
        onClick={() => {
          const callLink = props.node.getComponent()?.callLink;
          if (callLink) {
            goToSource(callLink, props.targets, options);
          }
        }}
      >
        {props.node.getComponent()?.label}
      </div>
    ) : (
      <div class={styles.componentLabel}>
        {props.node.getComponent()?.label}
      </div>
    );
  }
  return (
    <div
      class={cx(
        styles.node,
        props.highlightedId === props.node.uniqueId && styles.highlighted,
        showBorder() && styles.bordered,
        props.node.getSource() ? styles.source : styles.noSource
      )}
      onMouseEnter={() => {
        props.setHighlightedBoundingBox(props.node);
      }}
      onMouseLeave={() => {
        props.setHighlightedBoundingBox(null);
      }}
    >
      {showComponentWrapper() && (
        <div class={styles.componentHeader}>
          {componentLink()}
          <div class={styles.ellipsis}>
            {cropPath(
              props.node.getComponent()?.definitionLink?.fileName || ""
            )}
          </div>
        </div>
      )}
      <div class={showComponentWrapper() ? styles.nested : undefined}>
        <div
          class={cx(
            styles.sourceRow,
            props.node.getSource() && styles.clickable
          )}
          onClick={() => {
            const source = props.node.getSource();
            if (source) {
              goToSource(source, props.targets, options);
            }
          }}
        >
          <div class={styles.tag}>
            {"<"}
            {props.node.name}
            {">"}

            {preferInlineComponent() && componentLink()}
          </div>
          <div class={styles.ellipsis}>
            {isDifferentFilePath() && !showComponentWrapper()
              ? cropPath(props.node.getSource()?.fileName || "")
              : null}
          </div>
        </div>

        <div>
          {props.expandedIds.has(props.node.uniqueId) ? (
            renderChildren()
          ) : props.node.getChildren().length ? (
            <button
              class={cx(expandPill(), styles.expand)}
              onClick={() => {
                props.expandId(props.node.uniqueId);
              }}
            >
              ...
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}
