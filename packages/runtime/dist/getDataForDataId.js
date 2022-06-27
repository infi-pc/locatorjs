"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dataByFilename = void 0;
exports.getDataForDataId = getDataForDataId;
exports.register = register;

var _buidLink = require("./buidLink");

var _parseDataId = require("./parseDataId");

const dataByFilename = {};
exports.dataByFilename = dataByFilename;

function getDataForDataId(dataId) {
  const [fileFullPath, id] = (0, _parseDataId.parseDataId)(dataId);
  const fileData = dataByFilename[fileFullPath];

  if (!fileData) {
    return null;
  }

  const expData = fileData.expressions[Number(id)];

  if (!expData) {
    return null;
  }

  const link = (0, _buidLink.buidLink)(fileData.filePath, fileData.projectPath, expData.loc);
  let label;

  if (expData.type === "jsx") {
    label = (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") + expData.name;
  } else {
    label = `${expData.htmlTag ? `styled.${expData.htmlTag}` : "styled"}${expData.name ? `: ${expData.name}` : ""}`;
  }

  return {
    link,
    label
  };
}

function register(input) {
  dataByFilename[input.projectPath + input.filePath] = input;
}