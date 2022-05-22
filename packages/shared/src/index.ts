export * from "./types";

export type Target = {
  url: string;
  label: string;
};

export type Targets = { [k: string]: Target };

export const allTargets: Targets = {
  vscode: {
    url: "vscode://file${projectPath}${filePath}:${line}:${column}",
    label: "VSCode",
  },
  webstorm: {
    url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "WebStorm",
  },
  atom: {
    url: "atom://core/open/file?filename=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "Atom",
  },
};
