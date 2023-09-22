export default function getUsableFileName(path: string): string {
  const pathSegments = path.split("/");

  // If the path has only one segment, return it directly.
  if (pathSegments.length === 1) {
    return pathSegments[0] || "unnamed";
  }

  const fileName = pathSegments[pathSegments.length - 1] || "unnamed";

  if (fileName.startsWith("index.")) {
    // If the file name is index.<extension>, return the parent folder's name
    // along with the filename.
    return `${pathSegments[pathSegments.length - 2]}/${fileName}`;
  } else {
    // Otherwise, just return the filename.
    return fileName;
  }
}
