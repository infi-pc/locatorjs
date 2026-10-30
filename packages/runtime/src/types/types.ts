import type { Source as SharedSource } from "@locator/shared";

export type Source = SharedSource & { projectPath?: string };

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
  pathKind?: Source["pathKind"];
};

export type ContextMenuState = { target: HTMLElement; x: number; y: number };
