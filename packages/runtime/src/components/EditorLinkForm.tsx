import { Targets } from "@locator/shared";
import { For } from "solid-js";

export function EditorLinkForm(props: {
  selectedTarget?: string;
  selectTarget: (val: string | undefined) => void;
  targets: Targets;
}) {
  const defaultTarget = () => Object.entries(props.targets)[0]![0];
  const selectedTarget = () => props.selectedTarget || "";

  function selectCustom() {
    props.selectTarget(
      (props.targets[selectedTarget()]
        ? props.targets[selectedTarget()]?.url
        : selectedTarget()) || ""
    );
  }
  const isCustom = () => !props.targets[selectedTarget()];
  return (
    <div class="mt-2 border border-gray-200 rounded p-4 flex flex-col gap-1">
      <div class="flex justify-between self-stretch text-sm">
        <div>Editor / Link template</div>

        <a
          class="underline cursor-pointer"
          onClick={() => {
            if (props.selectedTarget === undefined) {
              props.selectTarget(defaultTarget());
            } else {
              props.selectTarget(undefined);
            }
          }}
        >
          {props.selectedTarget === undefined ? "edit" : "clear"}
        </a>
      </div>

      <div class="text-xs text-gray-700">
        Change your editor for this project. For less common editors, you can
        change the link template.
      </div>

      {props.selectedTarget !== undefined ? (
        <>
          <div class="flex flex-col gap-1 py-1">
            <For each={Object.entries(props.targets)}>
              {([key, target]) => (
                <div class="flex items-center">
                  <input
                    id={key}
                    type="radio"
                    checked={key === selectedTarget()}
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
                type="radio"
                checked={isCustom()}
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

          {isCustom() && (
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
                onInput={(e) => {
                  props.selectTarget(e.currentTarget.value);
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
          )}
        </>
      ) : null}
    </div>
  );
}

// function ExpandableOption(props: {
//   label: string;

// }) {
//   return <div class="">

//   </div>
// }
