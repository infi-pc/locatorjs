import { Targets } from "@locator/shared";
import { For } from "solid-js";

export function EditorLinkForm(props: {
  selectedTarget: string;
  selectTarget: (val: string) => void;
  targets: Targets;
}) {
  function selectCustom() {
    props.selectTarget(
      (props.targets[props.selectedTarget]
        ? props.targets[props.selectedTarget]?.url
        : props.selectedTarget) || ""
    );
  }
  return (
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
                checked={key === props.selectedTarget}
                class="focus:ring-indigo-200 h-4 w-4 text-indigo-600 border-slate-300 hover:border-slate-400"
                onClick={() => {
                  props.selectTarget(key);
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
            checked={!props.targets[props.selectedTarget]}
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
            props.targets[props.selectedTarget]
              ? props.targets[props.selectedTarget]?.url
              : props.selectedTarget
          }
          onClick={() => {
            if (props.targets[props.selectedTarget]) {
              selectCustom();
            }
          }}
          onInput={(e) => {
            props.selectTarget(e.currentTarget.value);
          }}
          type="text"
          name="text"
          class={
            "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md " +
            (props.targets[props.selectedTarget]
              ? "text-slate-400"
              : "text-slate-800")
          }
        />
      </div>
    </div>
  );
}
