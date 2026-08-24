import {
  findDebugSource,
  findDebugSourceAsync,
  findOwnDebugSource,
} from "./findDebugSource";
import { getUsableName } from "../../functions/getUsableName";
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
import type { SourceResolutionContext } from "./sourceMapResolver";

// Tree wrappers are rebuilt whenever expansion or async-resolution state
// changes. Cache successful async results by the stable DOM element so the
// next wrapper's synchronous getters can expose them to the view model. Misses
// deliberately remain retryable, matching the fiber resolver's positive-only
// cache contract.
const asyncElementSources = new WeakMap<HTMLElement, Source>();
const asyncComponents = new WeakMap<HTMLElement, TreeNodeComponent>();

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
  protected createNode(element: HTMLElement): ReactTreeNodeElement {
    return new ReactTreeNodeElement(element);
  }
  getSource(): Source | null {
    const resolved = asyncElementSources.get(this.element);
    if (resolved) return resolved;
    const fiber = findFiberByHtmlElement(this.element, false);
    if (fiber) {
      const result = findDebugSource(fiber);
      if (result) {
        return result.source;
      }
    }
    return null;
  }
  async getSourceAsync(
    context?: SourceResolutionContext
  ): Promise<Source | null> {
    const fiber = findFiberByHtmlElement(this.element, false);
    const source = fiber
      ? (await findDebugSourceAsync(fiber, context))?.source ?? null
      : null;
    if (source) asyncElementSources.set(this.element, source);
    return source;
  }
  getComponent(): TreeNodeComponent | null {
    const resolved = asyncComponents.get(this.element);
    if (resolved) return resolved;
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
  async getComponentAsync(
    context?: SourceResolutionContext
  ): Promise<TreeNodeComponent | null> {
    const fiber = findFiberByHtmlElement(this.element, false)?._debugOwner;
    if (!fiber) return null;
    const source =
      findOwnDebugSource(fiber) ??
      (await resolveSourceFromFiber(fiber, context));
    const component = {
      label: getUsableName(fiber),
      callLink: source ?? undefined,
    };
    if (source) asyncComponents.set(this.element, component);
    return component;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new ReactTreeNodeElement(element);

  return goUpByTheTree(originalRoot);
}

/**
 * Walks the owner chain — who wrote the JSX, not who contains the DOM node —
 * and reports each step with its own source only. Falling back to an
 * ancestor's source (as `findDebugSource` does) would make consecutive rows
 * claim the same file and line.
 */
function getParentsPaths(element: HTMLElement): ParentPathItem[] {
  const fiber = findFiberByHtmlElement(element, false);
  if (!fiber) return [];

  const pathItems: ParentPathItem[] = [];
  const seen = new Set<Fiber>();
  let current: Fiber | null = fiber;

  while (current && !seen.has(current)) {
    seen.add(current);
    const owner: Fiber | null = current._debugOwner || null;
    const label = getFiberLabel(
      current,
      findOwnDebugSource(current) || undefined
    );
    pathItems.push({
      title: label.label,
      link: label.link,
      component: owner ? getUsableName(owner) : undefined,
      kind: "call-site",
    });
    current = owner;
  }

  return pathItems;
}

export async function getParentsPathsAsync(
  element: HTMLElement,
  context?: SourceResolutionContext
): Promise<ParentPathItem[]> {
  const fiber = findFiberByHtmlElement(element, false);
  if (!fiber) return [];
  const items: ParentPathItem[] = [];
  const seen = new Set<Fiber>();
  let current: Fiber | null = fiber;
  while (current && !seen.has(current)) {
    seen.add(current);
    const owner: Fiber | null = current._debugOwner || null;
    const source =
      findOwnDebugSource(current) ??
      (await resolveSourceFromFiber(current, context));
    const label = getFiberLabel(current, source ?? undefined);
    items.push({
      title: label.label,
      link: label.link,
      component: owner ? getUsableName(owner) : undefined,
      kind: "call-site",
    });
    current = owner;
  }
  return items;
}

/**
 * Async version of getElementInfo
 * When sync cannot get source, try source-map resolution
 */
export async function getElementInfoAsync(
  found: HTMLElement,
  context?: SourceResolutionContext
): Promise<FullElementInfo | null> {
  const labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers = getAllWrappingParents(component);

    // Use async method to get source
    for (const f of allPotentialComponentFibers) {
      const fiberWithSource = await findDebugSourceAsync(f, context);
      if (fiberWithSource) {
        const label = getFiberLabel(
          fiberWithSource.fiber,
          fiberWithSource.source
        );
        labels.push(label);
      }
    }

    // Get current element's source (async)
    const currentSource = await findDebugSourceAsync(fiber, context);
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

  // eslint-disable-next-line no-console -- the explicit diagnose command reports a scan table.
  console.log(
    `%c[LocatorJS-diag] Scanning ${allElements.length} elements...`,
    "color: #FF9800; font-weight: bold"
  );

  for (const el of Array.from(allElements)) {
    if (!(el instanceof HTMLElement)) continue;

    // Skip LocatorJS own UI elements
    if (el.closest("[data-locatorjs]") || el.id === "locatorjs-wrapper")
      continue;

    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const cls =
      el.className && typeof el.className === "string"
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
      ? `${syncResult.source.fileName}:${syncResult.source.lineNumber}:${
          syncResult.source.columnNumber ?? 0
        }`
      : "none";

    // Async source (directly on this fiber, no chain walking)
    let asyncStr = "none";
    try {
      const asyncResult = await resolveSourceFromFiber(fiber);
      if (asyncResult) {
        asyncStr = `${asyncResult.fileName}:${asyncResult.lineNumber}:${
          asyncResult.columnNumber ?? 0
        }`;
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
          fullAsyncStr = `${fullResult.source.fileName}:${
            fullResult.source.lineNumber
          }:${fullResult.source.columnNumber ?? 0}`;
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

  // eslint-disable-next-line no-console -- the explicit diagnose command reports a scan table.
  console.log(
    `%c[LocatorJS-diag] Results:`,
    "color: #4CAF50; font-weight: bold"
  );
  // eslint-disable-next-line no-console -- the explicit diagnose command reports a scan table.
  console.table(rows);

  // Summary
  const withFiber = rows.filter((r) => r.hasFiber);
  const resolved = withFiber.filter(
    (r) =>
      r.asyncSource !== "none" &&
      r.asyncSource !== "-" &&
      r.asyncSource !== "error"
  );
  // eslint-disable-next-line no-console -- the explicit diagnose command reports a scan summary.
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
