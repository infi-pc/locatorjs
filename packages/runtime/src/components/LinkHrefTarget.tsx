import { For } from "solid-js";
import { HREF_TARGET } from "../consts";

const hrefTargets = ["_blank", "_self"] as const;

type HrefTarget = typeof hrefTargets[number];

export function LinkHrefTarget(props: {
  value?: HrefTarget;
  onChange: (val: HrefTarget | undefined) => void;
}) {
  const selectedTarget = () => props.value || "";

  return (
    <div class="mt-2 border border-gray-200 rounded p-4 flex flex-col gap-1">
      <div class="flex justify-between self-stretch text-sm">
        <div>Link Href Target</div>

        <a
          class="underline cursor-pointer"
          onClick={() => {
            if (props.value === undefined) {
              props.onChange(HREF_TARGET);
            } else {
              props.onChange(undefined);
            }
          }}
        >
          {props.value === undefined ? "edit" : "clear"}
        </a>
      </div>

      {props.value !== undefined ? (
        <>
          <div class="text-xs text-gray-700">
            Hot-reloading On some stacks (e.g. Create React App) gets broken
            when you use _blank as the target. You can change the target to
            _self to fix this. <br />
            Some browsers open unnecessary tabs when you use _blank.
          </div>
          <div class="flex flex-col gap-1 py-1">
            <For each={Object.entries(hrefTargets)}>
              {([key, target]) => (
                <div class="flex items-center">
                  <input
                    id={key}
                    type="radio"
                    checked={key === selectedTarget()}
                    class="focus:ring-indigo-200 h-4 w-4 text-indigo-600 border-slate-300 hover:border-slate-400"
                    onClick={() => {
                      props.onChange(key as HrefTarget);
                    }}
                  />
                  <label
                    for={key}
                    class="ml-2 block text-sm font-medium text-slate-700 hover:text-slate-800"
                  >
                    {target}
                  </label>
                </div>
              )}
            </For>
          </div>
        </>
      ) : null}
    </div>
  );
}
