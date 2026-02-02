import { createSignal, For } from "solid-js";

const SCRIPT_URL =
  "https://raw.githubusercontent.com/infi-pc/locatorjs/master/scripts/setup-nvim-handler.sh";

const TERMINALS = [
  { id: "auto", label: "Auto-detect" },
  { id: "ghostty", label: "Ghostty" },
  { id: "iterm", label: "iTerm2" },
  { id: "kitty", label: "Kitty" },
  { id: "terminal", label: "Default Terminal" },
] as const;

export function NvimSetupGuide() {
  const [terminal, setTerminal] = createSignal("auto");

  const curlCommand = () => {
    const t = terminal();
    if (t === "auto") {
      return `curl -fsSL ${SCRIPT_URL} | bash`;
    }
    return `curl -fsSL ${SCRIPT_URL} | bash -s -- --terminal=${t}`;
  };

  return (
    <div class="mt-2 border border-amber-200 bg-amber-50 rounded p-4 flex flex-col gap-1">
      <div class="text-sm font-medium text-amber-800">Setup required</div>
      <div class="text-xs text-amber-700">
        The <code class="bg-amber-100 rounded px-1">nvim://</code> URL scheme
        requires a one-time handler setup on macOS.
      </div>

      <div class="mt-2 flex flex-col gap-1">
        <div class="text-xs font-medium text-amber-800">Terminal</div>
        <div class="flex flex-col gap-1 py-1">
          <For each={[...TERMINALS]}>
            {(t) => (
              <div class="flex items-center">
                <input
                  id={`nvim-terminal-${t.id}`}
                  type="radio"
                  checked={terminal() === t.id}
                  onClick={() => setTerminal(t.id)}
                  class="focus:ring-indigo-200 h-4 w-4 text-indigo-600 border-slate-300 hover:border-slate-400"
                />
                <label
                  for={`nvim-terminal-${t.id}`}
                  class="ml-2 block text-sm font-medium text-slate-700 hover:text-slate-800"
                >
                  {t.label}
                </label>
              </div>
            )}
          </For>
        </div>
      </div>

      <code class="text-xs bg-amber-100 rounded p-2 mt-2 block break-all text-amber-900">
        {curlCommand()}
      </code>
      <div class="text-xs text-amber-700 mt-1">
        This creates a macOS app that handles{" "}
        <code class="bg-amber-100 rounded px-1">nvim://</code> URLs and opens
        files in Neovim.
      </div>
    </div>
  );
}
