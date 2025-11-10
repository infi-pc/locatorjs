import type { FileStorage } from "@locator/shared";
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

export function getElementInfo(target: HTMLElement): FullElementInfo | null {
  const found = target.closest("[data-locatorjs-id], [data-locatorjs]");

  if (
    found &&
    found instanceof HTMLElement &&
    found.dataset &&
    (found.dataset.locatorjsId ||
      found.dataset.locatorjs ||
      found.dataset.locatorjsStyled)
  ) {
    const dataId = found.dataset.locatorjsId;
    const dataPath = found.dataset.locatorjs;
    const styledDataId = found.dataset.locatorjsStyled;

    if (!dataId && !dataPath) {
      return null;
    }

    let fileFullPath: string;

    if (dataPath) {
      const parsed = parseDataPath(dataPath);
      if (!parsed) {
        return null;
      }
      [fileFullPath] = parsed;
    } else if (dataId) {
      [fileFullPath] = parseDataId(dataId);
    } else {
      return null;
    }

    const locatorData = window.__LOCATOR_DATA__;
    const fileData: FileStorage | undefined = locatorData?.[fileFullPath];

    // Handle styled components (only when locatorData is available)
    const [styledFileFullPath, styledId] = styledDataId
      ? parseDataId(styledDataId)
      : [null, null];
    const styledFileData: FileStorage | undefined =
      styledFileFullPath && locatorData?.[styledFileFullPath];
    const styledExpData =
      styledFileData && styledFileData.styledDefinitions[Number(styledId)];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const styledLink = styledExpData && {
      filePath: styledFileData.filePath,
      projectPath: styledFileData.projectPath,
      column: (styledExpData.loc?.start.column || 0) + 1,
      line: styledExpData.loc?.start.line || 0,
    };

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

export class JSXTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const dataId = this.element.dataset.locatorjsId;
    const dataPath = this.element.dataset.locatorjs;

    if (!dataId && !dataPath) {
      return null;
    }

    let fileFullPath: string;

    if (dataPath) {
      const parsed = parseDataPath(dataPath);
      if (!parsed) {
        return null;
      }
      [fileFullPath] = parsed;
    } else if (dataId) {
      [fileFullPath] = parseDataId(dataId);
    } else {
      return null;
    }

    const locatorData = window.__LOCATOR_DATA__;
    const fileData: FileStorage | undefined = locatorData?.[fileFullPath];

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
    const dataId = this.element.dataset.locatorjsId;
    const dataPath = this.element.dataset.locatorjs;

    if (!dataId && !dataPath) {
      return null;
    }

    let fileFullPath: string;

    if (dataPath) {
      const parsed = parseDataPath(dataPath);
      if (!parsed) {
        return null;
      }
      [fileFullPath] = parsed;
    } else if (dataId) {
      [fileFullPath] = parseDataId(dataId);
    } else {
      return null;
    }

    const locatorData = window.__LOCATOR_DATA__;
    const fileData: FileStorage | undefined = locatorData?.[fileFullPath];

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
          });
        }
      }
    }

    currentElement = currentElement.parentElement;
  } while (currentElement);

  return path;
}

const jsxAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default jsxAdapter;
