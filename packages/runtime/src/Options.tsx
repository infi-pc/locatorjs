import { Targets } from "@locator/shared";
import { For } from "solid-js";
import { bannerClasses } from "./bannerClasses";
import LogoIcon from "./LogoIcon";

export function Options(props: { targets: Targets; onClose: () => void }) {
  return (
    <div class={bannerClasses() + " w-96 p-4"}>
      <div class="flex justify-between items-center">
        <LogoIcon />
        <CloseButton onClick={() => props.onClose()} />
      </div>
      <div class="mt-2">
        <label for="email" class="block text-sm font-medium text-slate-700">
          Editor link:
        </label>
        <For each={Object.entries(props.targets)}>
          {([key, target]) => (
            <div class="flex items-center">
              <input
                id={key}
                name="notification-method"
                type="radio"
                checked={key === "email"}
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label
                for={key}
                class="ml-3 block text-sm font-medium text-gray-700"
              >
                {target.label}
              </label>
            </div>
          )}
        </For>
        <div class="mt-1">
          <input
            type="text"
            name="text"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md"
            placeholder="you@example.com"
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
