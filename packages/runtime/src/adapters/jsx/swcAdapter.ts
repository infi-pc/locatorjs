import {
  AdapterObject,
  FullElementInfo,
  ParentPathItem,
  TreeState,
} from "../adapterApi";
import { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import { Source } from "../../types/types";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";

/**
 * Parse the data-source attribute format: "filepath:line:column"
 */
function parseDataSource(dataSource: string): {
  filePath: string;
  line: number;
  column: number;
} | null {
  // Handle both absolute and relative paths
  // Format: "/path/to/file.tsx:10:5" or "src/file.tsx:10:5"
  const lastColonIdx = dataSource.lastIndexOf(':');
  if (lastColonIdx === -1) return null;
  
  const beforeLastColon = dataSource.substring(0, lastColonIdx);
  const column = parseInt(dataSource.substring(lastColonIdx + 1), 10);
  
  const secondLastColonIdx = beforeLastColon.lastIndexOf(':');
  if (secondLastColonIdx === -1) return null;
  
  const filePath = beforeLastColon.substring(0, secondLastColonIdx);
  const line = parseInt(beforeLastColon.substring(secondLastColonIdx + 1), 10);
  
  if (isNaN(line) || isNaN(column)) return null;
  
  return {
    filePath,
    line,
    column,
  };
}

/**
 * Get element name from the element
 */
function getElementName(element: HTMLElement): string {
  // Try to get React component name from data attributes or element type
  const reactName = element.getAttribute('data-react-component-name');
  if (reactName) return reactName;
  
  // Check if it's a custom component (starts with uppercase)
  const tagName = element.tagName;
  if (tagName && tagName[0] === tagName[0].toUpperCase()) {
    return tagName;
  }
  
  // Return lowercase tag name for HTML elements
  return element.tagName.toLowerCase();
}

export function getElementInfo(target: HTMLElement): FullElementInfo | null {
  // First try to find element with new data-source attribute
  let found = target.closest("[data-source]");
  
  if (found && found instanceof HTMLElement) {
    const dataSource = found.getAttribute("data-source");
    if (!dataSource) return null;
    
    const parsed = parseDataSource(dataSource);
    if (!parsed) return null;
    
    const elementName = getElementName(found);
    
    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: elementName,
        link: {
          filePath: parsed.filePath,
          projectPath: "", // Will be filled by the extension/editor integration
          column: parsed.column,
          line: parsed.line,
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: found.getBoundingClientRect(), // Same as element box for SWC version
      componentsLabels: [], // No component hierarchy in SWC version yet
    };
  }
  
  // Fallback to old data-locatorjs-id format if available
  found = target.closest("[data-locatorjs-id]");
  if (found && found instanceof HTMLElement) {
    // Delegate to the original JSX adapter for backward compatibility
    // This would need to be imported from the original jsxAdapter
    return null; // Or call original adapter here
  }
  
  return null;
}

export class SWCTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const dataSource = this.element.getAttribute("data-source");
    if (dataSource) {
      const parsed = parseDataSource(dataSource);
      if (parsed) {
        return {
          fileName: parsed.filePath,
          projectPath: "", // Will be filled by the extension/editor integration
          columnNumber: parsed.column,
          lineNumber: parsed.line,
        };
      }
    }
    return null;
  }
  
  getComponent(): TreeNodeComponent | null {
    // For SWC version, we don't have component hierarchy data yet
    // Could be enhanced in the future
    return null;
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new SWCTreeNodeElement(element);
  return goUpByTheTree(originalRoot);
}

function getParentsPaths(element: HTMLElement): ParentPathItem[] {
  const path: ParentPathItem[] = [];
  let currentElement: HTMLElement | null = element;
  
  do {
    if (currentElement) {
      const info = getElementInfo(currentElement);
      if (info) {
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

const swcAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default swcAdapter;