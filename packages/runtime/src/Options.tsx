import { Targets } from "@locator/shared";
import { createSignal, For } from "solid-js";
import { bannerClasses } from "./bannerClasses";
import { getLinkTypeOrTemplate, setTemplate } from "./linkTemplateUrl";
import LogoIcon from "./LogoIcon";

export function Options(props: { targets: Targets; onClose: () => void }) {
  const [selectedTarget, setSelectedTarget] = createSignal(
    getLinkTypeOrTemplate()
  );

  function selectTarget(val: string) {
    setSelectedTarget(val);
    setTemplate(val);
  }
  function selectCustom() {
    selectTarget(
      (props.targets[selectedTarget()]
        ? props.targets[selectedTarget()]?.url
        : selectedTarget()) || ""
    );
  }
  return (
    <div class={bannerClasses() + " w-96"}>
      <div class="flex justify-between items-center">
        <LogoIcon />
        <CloseButton onClick={() => props.onClose()} />
      </div>
      <div class="mt-2">
        <label for="email" class="block text-sm font-medium text-slate-700">
          Editor link:
        </label>
        <div class="flex flex-col gap-1 py-1">
          <For each={Object.entries(props.targets)}>
            {([key, target]) => (
              <div class="flex items-center">
                <input
                  id={key}
                  name="notification-method"
                  type="radio"
                  checked={key === selectedTarget()}
                  class="focus:ring-indigo-200 h-4 w-4 text-indigo-600 border-slate-300 hover:border-slate-400"
                  onClick={() => {
                    selectTarget(key);
                  }}
                />
                <label
                  for={key}
                  class="ml-2 block text-sm font-medium text-slate-700 hover:text-slate-800"
                >
                  {target.label}
                </label>
              </div>
            )}
          </For>
          <div class="flex items-center">
            <input
              id="custom"
              name="notification-method"
              type="radio"
              checked={!props.targets[selectedTarget()]}
              onClick={() => {
                selectCustom();
              }}
              class="focus:ring-indigo-200 h-4 w-4 text-indigo-600 border-slate-300 hover:border-slate-400"
            />
            <label
              for="custom"
              class="ml-2 block text-sm font-medium text-slate-700 hover:text-slate-800"
            >
              Custom
            </label>
          </div>
        </div>

        <div class="mt-1">
          <input
            value={
              props.targets[selectedTarget()]
                ? props.targets[selectedTarget()]?.url
                : selectedTarget()
            }
            onClick={() => {
              if (props.targets[selectedTarget()]) {
                selectCustom();
              }
            }}
            onChange={(e) => {
              selectTarget(e.currentTarget.value);
            }}
            type="text"
            name="text"
            class={
              "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md " +
              (props.targets[selectedTarget()]
                ? "text-slate-400"
                : "text-slate-800")
            }
          />
        </div>
      </div>
    </div>
  );
}

function CloseButton(props: { onClick: () => void }) {
  return (
    <button
      class="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
      onClick={() => props.onClick()}
    >
      <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M13.46,12L19,17.54V19H17.54L12,13.46L6.46,19H5V17.54L10.54,12L5,6.46V5H6.46L12,10.54L17.54,5H19V6.46L13.46,12Z"
        />
      </svg>
    </button>
  );
}
