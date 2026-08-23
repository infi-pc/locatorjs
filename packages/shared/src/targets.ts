export type Target = {
  url: string;
  label: string;
  // target?: "_blank" | "_self" | "_parent" | "_top" | string;
};

export type Targets = { [k: string]: Target };

export const allTargets: Targets = {
  vscode: {
    url: "vscode://file/${projectPath}${filePath}:${line}:${column}",
    label: "VSCode",
  },
  webstorm: {
    url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "WebStorm",
  },
  cursor: {
    url: "cursor://file/${projectPath}${filePath}:${line}:${column}",
    label: "Cursor",
  },
  windsurf: {
    url: "windsurf://file/${projectPath}${filePath}:${line}:${column}",
    label: "Windsurf",
  },
  zed: {
    url: "zed://file${projectPath}${filePath}:${line}:${column}",
    label: "Zed",
  },
  antigravity: {
    url: "antigravity://file/${projectPath}${filePath}:${line}:${column}",
    label: "Antigravity",
  },
  nvim: {
    url: "nvim://file/${projectPath}${filePath}:${line}:${column}?tmux-session=${tmuxSession}",
    label: "Neovim (macOS only)",
  },
};

/**
 * Both v1 and v2 store "where links open" as a single string that is either a
 * key of the targets map or a URL template. This is the one rule that tells
 * them apart, so a stored id is never mistaken for a template.
 */
export function asEditorSelection(templateOrTemplateId: string): {
  targetId?: string;
  targetTemplate?: string;
} {
  return allTargets[templateOrTemplateId]
    ? { targetId: templateOrTemplateId }
    : { targetTemplate: templateOrTemplateId };
}
