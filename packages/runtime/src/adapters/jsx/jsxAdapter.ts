import { AdapterObject, FullElementInfo } from "../adapterApi";
import { parseDataId } from "../../parseDataId";
import { buidLink } from "../../buidLink";
import { FileStorage } from "@locator/shared";
import { getExpressionData } from "./getExpressionData";
import { getJSXComponentBoundingBox } from "./getJSXComponentBoundingBox";

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
    const styledDataId = found.dataset.locatorjsStyled;
    console.log("A");
    if (!dataId) {
      return null;
    }

    console.log("B");
    const [fileFullPath, id] = parseDataId(dataId);
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

    // console.log("D", fileData.expressions, Number(id));
    const expData = getExpressionData(found, fileData);
    if (!expData) {
      return null;
    }
    const styledExpData =
      styledFileData && styledFileData.styledDefinitions[Number(styledId)];

    console.log("E");
    const link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
    const styledLink =
      styledExpData &&
      buidLink(
        styledFileData.filePath,
        styledFileData.projectPath,
        styledExpData.loc
      );

    // TODO move styled to separate data
    // const styled = found.dataset.locatorjsStyled
    //   ? getDataForDataId(found.dataset.locatorjsStyled)
    //   : null;

    const wrappingComponent =
      expData.wrappingComponentId !== null
        ? fileData.components[Number(expData.wrappingComponentId)]
        : null;

    console.log({
      wrappingComponent,
      id: Number(expData.wrappingComponentId),
      comps: fileData.components,
    });

    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: expData.name,
        link: link,
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
              link: buidLink(
                fileData.filePath,
                fileData.projectPath,
                wrappingComponent.loc
              ),
            },
          ]
        : [],
    };
  }

  // return deduplicateLabels(labels);

  return null;
}

const reactAdapter: AdapterObject = {
  getElementInfo,
};

export default reactAdapter;
