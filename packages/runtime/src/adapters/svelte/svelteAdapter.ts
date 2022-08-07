import { AdapterObject, FullElementInfo } from "../adapterApi";

type SvelteLoc = {
  char: number;
  column: number;
  file: string;
  line: number;
};

export function getElementInfo(
  found: HTMLElement & { __svelte_meta?: { loc: SvelteLoc } }
): FullElementInfo | null {
  if (found.__svelte_meta) {
    const { loc } = found.__svelte_meta;
    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: found.nodeName.toLowerCase(),
        link: {
          column: loc.column,
          line: loc.line,
          filePath: loc.file,
          projectPath: "",
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: found.getBoundingClientRect(),
      componentsLabels: [],
    };
  }
  return null;
}

const svelteAdapter: AdapterObject = {
  getElementInfo,
};

export default svelteAdapter;
