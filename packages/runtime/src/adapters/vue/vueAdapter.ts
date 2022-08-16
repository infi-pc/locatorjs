import type { ComponentInternalInstance } from "vue";
import { AdapterObject, FullElementInfo } from "../adapterApi";
import { getVueComponentBoundingBox } from "./getVNodeBoundingBox";

export function getElementInfo(
  found: HTMLElement & { __vueParentComponent?: ComponentInternalInstance }
): FullElementInfo | null {
  const parentComponent = found.__vueParentComponent;
  if (parentComponent) {
    if (!parentComponent.type) {
      return null;
    }

    const componentBBox = getVueComponentBoundingBox(parentComponent);

    const { __file, __name } = parentComponent.type;
    if (__file && __name) {
      return {
        thisElement: {
          box: found.getBoundingClientRect(),
          label: found.nodeName.toLowerCase(),
          link: {
            column: 1,
            line: 1,
            filePath: __file,
            projectPath: "",
          },
        },
        htmlElement: found,
        parentElements: [],
        componentBox: componentBBox || found.getBoundingClientRect(),
        componentsLabels: [
          {
            label: __name,
            link: {
              column: 1,
              line: 1,
              filePath: __file,
              projectPath: "",
            },
          },
        ],
      };
    }
  }
  return null;
}

const vueAdapter: AdapterObject = {
  getElementInfo,
};

export default vueAdapter;
