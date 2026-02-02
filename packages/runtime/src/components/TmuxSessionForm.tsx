import { createSignal, Show } from "solid-js";

export function TmuxSessionForm(props: {
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  onTemplateSwitch: (useCustom: boolean, tmuxSession: string) => void;
}) {
  const [showGuide, setShowGuide] = createSignal(false);

  return (
    <div class="mt-2 border border-gray-200 rounded p-4 flex flex-col gap-1">
      <div class="flex justify-between self-stretch text-sm">
        <div>Tmux session name</div>
        <a
          class="underline cursor-pointer"
          onClick={() => {
            if (props.value === undefined) {
              props.onChange("");
            } else {
              props.onChange(undefined);
              props.onTemplateSwitch(false, "");
            }
          }}
        >
          {props.value === undefined ? "edit" : "clear"}
        </a>
      </div>
      <div class="text-xs text-gray-700">
        Optional: specify a tmux session name to open files in a running Neovim
        instance.
      </div>

      {props.value !== undefined ? (
        <div class="py-2 flex flex-col gap-2">
          <input
            id="tmux-session"
            value={props.value}
            onInput={(e) => {
              const val = e.currentTarget.value;
              props.onChange(val);
              props.onTemplateSwitch(!!val, val);
            }}
            placeholder="e.g. my-project"
            type="text"
            name="text"
            class={
              "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md"
            }
          />

          <button
            type="button"
            class="text-xs text-left text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            onClick={() => setShowGuide(!showGuide())}
          >
            <span class="inline-block transition-transform" style={{ transform: showGuide() ? "rotate(90deg)" : "rotate(0deg)" }}>
              ▶
            </span>
            How to use
          </button>

          <Show when={showGuide()}>
            <div class="text-xs text-gray-600 bg-gray-50 rounded p-3 flex flex-col gap-2">
              <div>
                <div class="font-medium text-gray-700">1. Start a tmux session:</div>
                <code class="block bg-gray-100 rounded px-2 py-1 mt-1 text-gray-800">
                  tmux new-session -s my-project
                </code>
              </div>
              <div>
                <div class="font-medium text-gray-700">2. Start Neovim with a socket:</div>
                <code class="block bg-gray-100 rounded px-2 py-1 mt-1 text-gray-800">
                  nvim --listen /tmp/nvim-my-project
                </code>
              </div>
              <div class="text-gray-500 italic">
                The socket path must follow the format: /tmp/nvim-&lt;session-name&gt;
              </div>
            </div>
          </Show>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
