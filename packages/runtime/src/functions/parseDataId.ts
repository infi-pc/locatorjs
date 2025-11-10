export function parseDataId(
  dataId: string
): [fileFullPath: string, id: string] {
  const [fileFullPath, id] = dataId.split("::");
  if (!fileFullPath || !id) {
    throw new Error("locatorjsId is malformed");
  }
  return [fileFullPath, id];
}

export function parseDataPath(
  dataPath: string
): [fileFullPath: string, line: number, column: number] | null {
  // Format: /path/to/file.tsx:line:column
  // Need to handle Windows paths like C:\path\to\file.tsx:line:column

  // Find the last two colons (for line and column)
  const lastColonIndex = dataPath.lastIndexOf(":");
  if (lastColonIndex === -1) return null;

  const secondLastColonIndex = dataPath.lastIndexOf(":", lastColonIndex - 1);
  if (secondLastColonIndex === -1) return null;

  const fileFullPath = dataPath.substring(0, secondLastColonIndex);
  const lineStr = dataPath.substring(secondLastColonIndex + 1, lastColonIndex);
  const columnStr = dataPath.substring(lastColonIndex + 1);

  const line = parseInt(lineStr, 10);
  const column = parseInt(columnStr, 10);

  if (Number.isNaN(line) || Number.isNaN(column)) {
    return null;
  }

  return [fileFullPath, line, column];
}

export function splitFullPath(
  fullPath: string
): [projectPath: string, filePath: string] {
  // Try to find a common project root indicator
  const indicators = ["/src/", "/app/", "/pages/", "/components/"];

  for (const indicator of indicators) {
    const index = fullPath.indexOf(indicator);
    if (index !== -1) {
      return [fullPath.substring(0, index), fullPath.substring(index)];
    }
  }

  // Fallback: treat the whole path as project path with empty file path
  // or try to split at the last reasonable directory
  const lastSlash = fullPath.lastIndexOf("/");
  if (lastSlash !== -1) {
    return [
      fullPath.substring(0, lastSlash + 1),
      fullPath.substring(lastSlash + 1),
    ];
  }

  return [fullPath, ""];
}
