import { buidLink } from "../../buidLink";
import { LabelData } from "../../LabelData";
import { parseDataId } from "../../parseDataId";

export function getDataForDataId(dataId: string) {
  const [fileFullPath, id] = parseDataId(dataId);

  const data = window.__LOCATOR_DATA__;
  if (!data) {
    return null;
  }

  const fileData = data[fileFullPath];
  if (!fileData) {
    return null;
  }
  const expData = fileData.expressions[Number(id)];
  if (!expData) {
    return null;
  }

  const link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);

  // let label;
  // if (expData.type === "jsx") {
  //   label =
  //     (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") +
  //     expData.name;
  // } else {
  //   label = `${expData.htmlTag ? `styled.${expData.htmlTag}` : "styled"}${
  //     expData.name ? `: ${expData.name}` : ""
  //   }`;
  // }

  return {
    link,
    label: expData.name,
    componentLabel: expData,
  };
}
