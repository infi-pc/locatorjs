import { findDebugSource, findDebugSourceAsync } from "./findDebugSource";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import { getAllWrappingParents } from "./getAllWrappingParents";
import { deduplicateLabels } from "../../functions/deduplicateLabels";
import { LabelData } from "../../types/LabelData";
import { getFiberOwnBoundingBox } from "./getFiberOwnBoundingBox";
import { getAllParentsElementsAndRootComponent } from "./getAllParentsElementsAndRootComponent";
import { isStyledElement } from "./isStyled";
import {
  AdapterObject,
  FullElementInfo,
  ParentPathItem,
  TreeState,
} from "../adapterApi";
import { Fiber, Source } from "@locator/shared";
import { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";
import { registerDiagnose } from "./debug";
import { resolveSourceFromFiber } from "./clickSourceResolver";

export function getElementInfo(found: HTMLElement): FullElementInfo | null {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  const labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers = getAllWrappingParents(component);

    // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component
    // TODO: whaat? why? currently I see that it adds the original styled components which is not necessary.

    // if (fiber.return && fiber.return === fiber._debugOwner) {
    //   allPotentialComponentFibers.unshift(fiber.return);
    // }

    allPotentialComponentFibers.forEach((fiber) => {
      const fiberWithSource = findDebugSource(fiber);
      if (fiberWithSource) {
        const label = getFiberLabel(
          fiberWithSource.fiber,
          fiberWithSource.source
        );
        labels.push(label);
      }
    });

    const thisLabel = getFiberLabel(fiber, findDebugSource(fiber)?.source);

    if (isStyledElement(fiber)) {
      thisLabel.label = `${thisLabel.label} (styled)`;
    }

    return {
      thisElement: {
        box: getFiberOwnBoundingBox(fiber) || found.getBoundingClientRect(),
        ...thisLabel,
      },
      htmlElement: found,
      parentElements: parentElements,
      componentBox,
      componentsLabels: deduplicateLabels(labels),
    };
  }

  return null;
}

export class ReactTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const fiber = findFiberByHtmlElement(this.element, false);
    if (fiber) {
      const result = findDebugSource(fiber);
      if (result) {
        return result.source;
      }
    }
    return null;
  }
  getComponent(): TreeNodeComponent | null {
    const fiber = findFiberByHtmlElement(this.element, false);
    const componentFiber = fiber?._debugOwner;

    if (componentFiber) {
      const fiberLabel = getFiberLabel(
        componentFiber,
        findDebugSource(componentFiber)?.source
      );

      return {
        label: fiberLabel.label,
        callLink:
          (fiberLabel.link && {
            fileName: fiberLabel.link.filePath,
            lineNumber: fiberLabel.link.line,
            columnNumber: fiberLabel.link.column,
            projectPath: fiberLabel.link.projectPath,
          }) ||
          undefined,
      };
    }
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new ReactTreeNodeElement(element);

  return goUpByTheTree(originalRoot);
}

function fiberToPathItem(fiber: Fiber): ParentPathItem {
  const label = getFiberLabel(fiber, findDebugSource(fiber)?.source);

  return {
    title: label.label,
    link: label.link,
  };
}

function getParentsPaths(element: HTMLElement) {
  const fiber = findFiberByHtmlElement(element, false);
  if (fiber) {
    const pathItems: ParentPathItem[] = [];
    let currentFiber = fiber;
    pathItems.push(fiberToPathItem(currentFiber));

    while (currentFiber._debugOwner) {
      currentFiber = currentFiber._debugOwner;
      pathItems.push(fiberToPathItem(currentFiber));
    }

    return pathItems;
  }
  return [];
}

/**
 * Async version of getElementInfo
 * When sync cannot get source, try source-map resolution
 */
export async function getElementInfoAsync(
  found: HTMLElement
): Promise<FullElementInfo | null> {
  const labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers = getAllWrappingParents(component);

    // Use async method to get source
    for (const f of allPotentialComponentFibers) {
      const fiberWithSource = await findDebugSourceAsync(f);
      if (fiberWithSource) {
        const label = getFiberLabel(
          fiberWithSource.fiber,
          fiberWithSource.source
        );
        labels.push(label);
      }
    }

    // Get current element's source (async)
    const currentSource = await findDebugSourceAsync(fiber);
    const thisLabel = getFiberLabel(fiber, currentSource?.source);

    if (isStyledElement(fiber)) {
      thisLabel.label = `${thisLabel.label} (styled)`;
    }

    return {
      thisElement: {
        box: getFiberOwnBoundingBox(fiber) || found.getBoundingClientRect(),
        ...thisLabel,
      },
      htmlElement: found,
      parentElements: parentElements,
      componentBox,
      componentsLabels: deduplicateLabels(labels),
    };
  }

  return null;
}

/**
 * Walk all DOM elements and log debug info + resolved source for each.
 * Exposed as window.locatorDiagnose()
 */
async function diagnoseAllElements(): Promise<void> {
  const root = document.querySelector("main") || document.body;
  const allElements = root.querySelectorAll("*");

  interface DiagnoseRow {
    element: string;
    text: string;
    hasFiber: boolean;
    syncSource: string;
    asyncSource: string;
  }

  const rows: DiagnoseRow[] = [];

  console.log(
    `%c[LocatorJS-diag] Scanning ${allElements.length} elements...`,
    "color: #FF9800; font-weight: bold"
  );

  for (const el of Array.from(allElements)) {
    if (!(el instanceof HTMLElement)) continue;

    // Skip LocatorJS own UI elements
    if (el.closest("[data-locatorjs]") || el.id === "locatorjs-wrapper") continue;

    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? `.${el.className.split(/\s+/).filter(Boolean).join(".")}`
      : "";
    const label = `<${tag}${id}${cls}>`;

    const textContent = el.textContent?.trim().slice(0, 40) || "";

    const fiber = findFiberByHtmlElement(el, false);
    if (!fiber) {
      rows.push({
        element: label,
        text: textContent,
        hasFiber: false,
        syncSource: "-",
        asyncSource: "-",
      });
      continue;
    }

    // Sync source
    const syncResult = findDebugSource(fiber);
    const syncStr = syncResult?.source
      ? `${syncResult.source.fileName}:${syncResult.source.lineNumber}:${syncResult.source.columnNumber ?? 0}`
      : "none";

    // Async source (directly on this fiber, no chain walking)
    let asyncStr = "none";
    try {
      const asyncResult = await resolveSourceFromFiber(fiber);
      if (asyncResult) {
        asyncStr = `${asyncResult.fileName}:${asyncResult.lineNumber}:${asyncResult.columnNumber ?? 0}`;
      }
    } catch {
      asyncStr = "error";
    }

    // Full async with chain walking
    let fullAsyncStr = asyncStr;
    if (asyncStr === "none") {
      try {
        const fullResult = await findDebugSourceAsync(fiber);
        if (fullResult?.source) {
          fullAsyncStr = `${fullResult.source.fileName}:${fullResult.source.lineNumber}:${fullResult.source.columnNumber ?? 0}`;
        }
      } catch {
        fullAsyncStr = "error";
      }
    }

    rows.push({
      element: label,
      text: textContent,
      hasFiber: true,
      syncSource: syncStr,
      asyncSource: fullAsyncStr,
    });
  }

  console.log(
    `%c[LocatorJS-diag] Results:`,
    "color: #4CAF50; font-weight: bold"
  );
  console.table(rows);

  // Summary
  const withFiber = rows.filter((r) => r.hasFiber);
  const resolved = withFiber.filter((r) => r.asyncSource !== "none" && r.asyncSource !== "-" && r.asyncSource !== "error");
  console.log(
    `%c[LocatorJS-diag] Summary: ${rows.length} elements, ${withFiber.length} with fiber, ${resolved.length} resolved`,
    "color: #2196F3; font-weight: bold"
  );
}

// Register diagnose so it's available as window.locatorDiagnose()
registerDiagnose(diagnoseAllElements);

const reactAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default reactAdapter;
