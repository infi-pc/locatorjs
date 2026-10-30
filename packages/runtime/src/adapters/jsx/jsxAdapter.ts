import {
  parseDataId,
  parseDataPath,
  splitFullPath,
} from "../../functions/parseDataId";
import type { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import type { Source } from "../../types/types";
import type {
  AdapterObject,
  FullElementInfo,
  ParentPathItem,
  TreeState,
} from "../adapterApi";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";
import { getExpressionData } from "./getExpressionData";
import { getJSXComponentBoundingBox } from "./getJSXComponentBoundingBox";
import {
  closestAcrossShadow,
  getParentElementAcrossShadow,
} from "../../functions/domTraversal";

function getFileData(element: HTMLElement) {
  const dataId = element.dataset.locatorjsId;
  const dataPath = element.dataset.locatorjs;
  let fileFullPath: string;

  if (dataPath) {
    const parsed = parseDataPath(dataPath);
    if (!parsed) return null;
    [fileFullPath] = parsed;
  } else if (dataId) {
    [fileFullPath] = parseDataId(dataId);
  } else {
    return null;
  }

  const locatorData = window.__LOCATOR_DATA__;
  return {
    fileFullPath,
    fileData: locatorData?.[fileFullPath],
    locatorData,
  };
}

function getElementInfo(target: HTMLElement): FullElementInfo | null {
  const found = closestAcrossShadow(
    target,
    "[data-locatorjs-id], [data-locatorjs]"
  );

  if (found && found instanceof HTMLElement) {
    const fileInfo = getFileData(found);
    if (!fileInfo) return null;
    const { fileFullPath, fileData, locatorData } = fileInfo;

    // Get expression data (works with or without locatorData)
    const expData = getExpressionData(found, fileData || null);
    if (!expData) {
      return null;
    }

    // Extract file path components
    let filePath: string;
    let projectPath: string;

    if (fileData) {
      filePath = fileData.filePath;
      projectPath = fileData.projectPath;
    } else {
      // If no fileData, split the full path
      [projectPath, filePath] = splitFullPath(fileFullPath);
    }

    const wrappingComponent =
      expData.wrappingComponentId !== null && fileData
        ? fileData.components[Number(expData.wrappingComponentId)]
        : null;

    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: expData.name,
        link: {
          filePath,
          projectPath,
          pathKind: "project-relative",
          column: (expData.loc.start.column || 0) + 1,
          line: expData.loc.start.line || 0,
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: getJSXComponentBoundingBox(
        found,
        locatorData || {},
        fileFullPath,
        Number(expData.wrappingComponentId)
      ),
      componentsLabels: wrappingComponent
        ? [
            {
              label: wrappingComponent.name || "component",
              link: {
                filePath,
                projectPath,
                pathKind: "project-relative",
                column: (wrappingComponent.loc?.start.column || 0) + 1,
                line: wrappingComponent.loc?.start.line || 0,
              },
            },
          ]
        : [],
    };
  }

  return null;
}

class JSXTreeNodeElement extends HtmlElementTreeNode {
  protected createNode(element: HTMLElement): JSXTreeNodeElement {
    return new JSXTreeNodeElement(element);
  }
  getSource(): Source | null {
    const fileInfo = getFileData(this.element);
    if (!fileInfo) return null;
    const { fileFullPath, fileData } = fileInfo;

    // Get expression data (works with or without locatorData)
    const expData = getExpressionData(this.element, fileData || null);
    if (expData) {
      let fileName: string;
      let projectPath: string;

      if (fileData) {
        fileName = fileData.filePath;
        projectPath = fileData.projectPath;
      } else {
        // If no fileData, split the full path
        [projectPath, fileName] = splitFullPath(fileFullPath);
      }

      return {
        fileName,
        projectPath,
        columnNumber: (expData.loc.start.column || 0) + 1,
        lineNumber: expData.loc.start.line || 0,
      };
    }

    return null;
  }
  getComponent(): TreeNodeComponent | null {
    const fileInfo = getFileData(this.element);
    if (!fileInfo) return null;
    const { fileData } = fileInfo;

    // Component information is only available when we have fileData
    if (fileData) {
      const expData = getExpressionData(this.element, fileData);
      if (expData && expData.wrappingComponentId !== null) {
        const component = fileData.components[expData.wrappingComponentId];
        if (component) {
          return {
            label: component.name || "component",
            definitionLink: {
              fileName: fileData.filePath,
              projectPath: fileData.projectPath,
              columnNumber: (component.loc?.start.column || 0) + 1,
              lineNumber: component.loc?.start.line || 0,
            },
          };
        }
      }
    }

    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new JSXTreeNodeElement(element);

  return goUpByTheTree(originalRoot);
}

function getParentsPaths(element: HTMLElement): ParentPathItem[] {
  const path: ParentPathItem[] = [];
  let currentElement: HTMLElement | null = element;
  let previousComponentKey: string | null = null;

  do {
    if (currentElement) {
      const info = getElementInfo(currentElement);
      const currentComponentKey = JSON.stringify(info?.componentsLabels);
      if (info && currentComponentKey !== previousComponentKey) {
        previousComponentKey = currentComponentKey;

        const link = info.thisElement.link;
        const label = info.thisElement.label;

        if (link) {
          path.push({
            title: label,
            link: link,
            // The component whose JSX contains this element. Without it the
            // menu reads as a column of identical `<div>` entries.
            component: info.componentsLabels[0]?.label,
            kind: "call-site",
          });
        }
      }
    }

    currentElement = getParentElementAcrossShadow(currentElement);
  } while (currentElement);

  return path;
}

const jsxAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default jsxAdapter;
