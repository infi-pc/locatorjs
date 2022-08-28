import { AdapterObject, FullElementInfo, TreeState } from "../adapterApi";
import { parseDataId } from "../../functions/parseDataId";
import { FileStorage } from "@locator/shared";
import { getExpressionData } from "./getExpressionData";
import { getJSXComponentBoundingBox } from "./getJSXComponentBoundingBox";
import { TreeNode } from "../../types/TreeNode";
import { SimpleDOMRect, Source } from "../../types/types";
import { getReferenceId } from "../../functions/getReferenceId";
import nonNullable from "../../functions/nonNullable";

export function getElementInfo(target: HTMLElement): FullElementInfo | null {
  const found = target.closest("[data-locatorjs-id]");

  if (
    found &&
    found instanceof HTMLElement &&
    found.dataset &&
    (found.dataset.locatorjsId || found.dataset.locatorjsStyled)
  ) {
    const dataId = found.dataset.locatorjsId;
    const styledDataId = found.dataset.locatorjsStyled;
    if (!dataId) {
      return null;
    }

    const [fileFullPath] = parseDataId(dataId);
    const [styledFileFullPath, styledId] = styledDataId
      ? parseDataId(styledDataId)
      : [null, null];

    const locatorData = window.__LOCATOR_DATA__;
    if (!locatorData) {
      return null;
    }

    const fileData: FileStorage | undefined = locatorData[fileFullPath];
    if (!fileData) {
      return null;
    }
    const styledFileData: FileStorage | undefined =
      styledFileFullPath && locatorData[styledFileFullPath];

    const expData = getExpressionData(found, fileData);
    if (!expData) {
      return null;
    }
    const styledExpData =
      styledFileData && styledFileData.styledDefinitions[Number(styledId)];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const styledLink = styledExpData && {
      filePath: styledFileData.filePath,
      projectPath: styledFileData.projectPath,
      column: (styledExpData.loc?.start.column || 0) + 1,
      line: styledExpData.loc?.start.line || 0,
    };

    // TODO move styled to separate data
    // const styled = found.dataset.locatorjsStyled
    //   ? getDataForDataId(found.dataset.locatorjsStyled)
    //   : null;

    const wrappingComponent =
      expData.wrappingComponentId !== null
        ? fileData.components[Number(expData.wrappingComponentId)]
        : null;

    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: expData.name,
        link: {
          filePath: fileData.filePath,
          projectPath: fileData.projectPath,
          column: (expData.loc.start.column || 0) + 1,
          line: expData.loc.start.line || 0,
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: getJSXComponentBoundingBox(
        found,
        locatorData,
        fileFullPath,
        Number(expData.wrappingComponentId)
      ),
      componentsLabels: wrappingComponent
        ? [
            {
              label: wrappingComponent.name || "component",
              link: {
                filePath: fileData.filePath,
                projectPath: fileData.projectPath,
                column: (wrappingComponent.loc?.start.column || 0) + 1,
                line: wrappingComponent.loc?.start.line || 0,
              },
            },
          ]
        : [],
    };
  }

  // return deduplicateLabels(labels);

  return null;
}

export class JSXTreeNodeElement implements TreeNode {
  type: "element" = "element";
  element: HTMLElement;
  name: string;
  uniqueId: string;
  constructor(element: HTMLElement) {
    this.element = element;
    this.name = element.nodeName.toLowerCase();
    this.uniqueId = String(getReferenceId(element));
  }
  getBox(): SimpleDOMRect | null {
    return this.element.getBoundingClientRect();
  }
  getElement(): Element | Text {
    return this.element;
  }
  getChildren(): TreeNode[] {
    const children = Array.from(this.element.children);
    return children
      .map((child) => {
        if (child instanceof HTMLElement) {
          return new JSXTreeNodeElement(child);
        } else {
          return null;
        }
      })
      .filter(nonNullable);
  }
  getParent(): TreeNode | null {
    if (this.element.parentElement) {
      return new JSXTreeNodeElement(this.element.parentElement);
    } else {
      return null;
    }
  }
  getSource(): Source | null {
    const dataId = this.element.dataset.locatorjsId;
    const locatorData = window.__LOCATOR_DATA__;
    if (dataId && locatorData) {
      const [fileFullPath] = parseDataId(dataId);
      const fileData: FileStorage | undefined = locatorData[fileFullPath];
      if (fileData) {
        const expData = getExpressionData(this.element, fileData);
        if (expData) {
          return {
            fileName: fileData.filePath,
            projectPath: fileData.projectPath,
            columnNumber: (expData.loc.start.column || 0) + 1,
            lineNumber: expData.loc.start.line || 0,
          };
        }
      }
    }
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  let root: TreeNode = new JSXTreeNodeElement(element);

  const allIds = new Set<string>();
  let current: TreeNode | null = root;

  const highlightedId = root.uniqueId;
  allIds.add(current.uniqueId);
  let limit = 2;
  while (current && limit > 0) {
    limit--;
    current = current.getParent();
    if (current) {
      allIds.add(current.uniqueId);
      root = current;
    }
  }

  return {
    root: root,
    expandedIds: allIds,
    highlightedId: highlightedId,
  };
}

const jsxAdapter: AdapterObject = {
  getElementInfo,
  getTree,
};

export default jsxAdapter;
