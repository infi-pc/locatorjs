import { LabelData } from "../../LabelData";
import { AdapterObject, FullElementInfo } from "../adapterApi";
import { parseDataId } from "../../parseDataId";
import { buidLink } from "../../buidLink";

export function getElementInfo(target: HTMLElement): FullElementInfo | null {
  const found = target.closest("[data-locatorjs-id]");

  console.log("getElementInfo", found);
  if (
    found &&
    found instanceof HTMLElement &&
    found.dataset &&
    (found.dataset.locatorjsId || found.dataset.locatorjsStyled)
  ) {
    const dataId = found.dataset.locatorjsId;

    console.log("A");
    if (!dataId) {
      return null;
    }

    console.log("B");
    const [fileFullPath, id] = parseDataId(dataId);

    const locatorData = window.__LOCATOR_DATA__;
    if (!locatorData) {
      return null;
    }

    console.log("C", locatorData, fileFullPath);
    const fileData = locatorData[fileFullPath];
    if (!fileData) {
      return null;
    }
    console.log("D");
    const expData = fileData.expressions[Number(id)];
    if (!expData) {
      return null;
    }

    console.log("E");
    const link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);

    // TODO move styled to separate data
    // const styled = found.dataset.locatorjsStyled
    //   ? getDataForDataId(found.dataset.locatorjsStyled)
    //   : null;

    debugger;

    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: expData.name,
        link: link,
      },
      htmlElement: found,
      parentElements: [],
      // TODO put here the component box, need to calculate it
      componentBox: found.getBoundingClientRect(),
      componentsLabels: [
        {
          label: expData.wrappingComponent || "component",
          link: buidLink(
            fileData.filePath,
            fileData.projectPath,
            // TODO wrappingComponentLoc
            expData.loc
          ),
        },
      ],
    };
  }

  // return deduplicateLabels(labels);

  return null;
}

const reactAdapter: AdapterObject = {
  getElementInfo,
};

export default reactAdapter;
