export type Source = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  projectPath?: string;
};

export type SimpleDOMRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type LinkProps = {
  filePath: string;
  projectPath: string;
  line: number;
  column: number;
};

export type ContextMenuState = { target: HTMLElement; x: number; y: number };
