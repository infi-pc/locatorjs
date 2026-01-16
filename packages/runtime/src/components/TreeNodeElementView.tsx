import { Targets } from "@locator/shared";
import { For } from "solid-js";
import cropPath from "../functions/cropPath";
import { goToSource } from "../functions/goTo";
import { useOptions } from "../functions/optionsStore";
import { TreeNodeComponent, TreeNodeElement } from "../types/TreeNode";
import { Source } from "../types/types";
import { parseDataPath, splitFullPath } from "../functions/parseDataId";

/**
 * Extract Source from DOM data-locatorjs attribute.
 * Fallback for when window.__LOCATOR_DATA__ is unavailable (e.g., Server Components).
 */
function getSourceFromDataAttribute(
  element: Element | Text | null
): Source | null {
  if (!element || !(element instanceof HTMLElement)) {
    return null;
  }

  const found = element.closest("[data-locatorjs]");
  if (!found || !(found instanceof HTMLElement) || !found.dataset.locatorjs) {
    return null;
  }

  const parsed = parseDataPath(found.dataset.locatorjs);
  if (!parsed) {
    return null;
  }

  const [fileFullPath, line, column] = parsed;
  const [projectPath, fileName] = splitFullPath(fileFullPath);

  return { fileName, projectPath, lineNumber: line, columnNumber: column };
}

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

  /** Get source for element, with DOM attribute fallback for Server Components */
  function getElementSource(): Source | null {
    return (
      props.node.getSource() ??
      getSourceFromDataAttribute(props.node.getElement())
    );
  }

  /** Get link: callLink > definitionLink > DOM attribute fallback */
  function getNodeLink(): Source | null {
    const component = props.node.getComponent();
    return (
      component?.callLink ??
      component?.definitionLink ??
      getSourceFromDataAttribute(props.node.getElement())
    );
  }

  function isDifferentFilePath() {
    return getElementSource()?.fileName !== props.parentFilePath;
  }

  function isDifferentComponent() {
    return (
      props.node.getComponent &&
      JSON.stringify(props.node.getComponent()) !==
        JSON.stringify(props.parentComponent)
    );
  }

  const preferInlineComponent = () => !getElementSource();

  function showComponentWrapper() {
    return isDifferentComponent() && !preferInlineComponent();
  }

  function componentLink() {
    const component = props.node.getComponent();
    const link = getNodeLink();
    const label =
      component?.label || (link?.fileName ? cropPath(link.fileName) : null);

    if (!label) return null;

    return link ? (
      <div
        class="font-bold cursor-pointer text-black hover:bg-gray-100 rounded"
        onClick={() => goToSource(link, props.targets, options)}
      >
        {label}
      </div>
    ) : (
      <div class="font-bold text-gray-500">{label}</div>
    );
  }

  function renderChildren() {
    return (
      <For each={props.node.getChildren()}>
        {(child) => (
          <TreeNodeElementView
            node={child as TreeNodeElement}
            expandedIds={props.expandedIds}
            highlightedId={props.highlightedId}
            expandId={props.expandId}
            parentFilePath={getElementSource()?.fileName}
            targets={props.targets}
            setHighlightedBoundingBox={props.setHighlightedBoundingBox}
            parentComponent={props.node.getComponent()}
          />
        )}
      </For>
    );
  }

  return (
    <div
      class={
        "text-xs pl-2 " +
        (props.highlightedId === props.node.uniqueId ? "bg-yellow-100 " : " ") +
        (showComponentWrapper() ? "border border-gray-300 py-2 pr-2 " : " ") +
        (getElementSource() ? "text-black " : "text-gray-500 ")
      }
      onMouseEnter={() => props.setHighlightedBoundingBox(props.node)}
      onMouseLeave={() => props.setHighlightedBoundingBox(null)}
    >
      {showComponentWrapper() && (
        <div class="flex gap-2 justify-between pb-1">
          {componentLink()}
          <div class="whitespace-nowrap text-ellipsis overflow-hidden">
            {cropPath(getNodeLink()?.fileName || "")}
          </div>
        </div>
      )}
      <div class={showComponentWrapper() ? "pl-2" : ""}>
        <div
          class={
            "flex justify-between items-center gap-4 " +
            (getElementSource() ? " cursor-pointer hover:bg-sky-100" : "")
          }
          onClick={() => {
            const source = getElementSource();
            if (source) goToSource(source, props.targets, options);
          }}
        >
          <div class="font-mono flex gap-1">
            {"<"}
            {props.node.name}
            {">"}
            {preferInlineComponent() && componentLink()}
          </div>
          <div class="whitespace-nowrap text-ellipsis overflow-hidden">
            {isDifferentFilePath() && !showComponentWrapper()
              ? cropPath(getElementSource()?.fileName || "")
              : null}
          </div>
        </div>

        <div>
          {props.expandedIds.has(props.node.uniqueId) ? (
            renderChildren()
          ) : props.node.getChildren().length ? (
            <button
              class="inline-flex cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 py-0 px-2 ml-2"
              onClick={() => props.expandId(props.node.uniqueId)}
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
