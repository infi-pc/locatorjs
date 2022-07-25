import { LinkProps } from "./types";
import { buildLink } from "./buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { createSignal } from "solid-js";
import { Targets } from "@locator/shared";
import { goToLinkProps } from "./goTo";
import { setLocalStorageLinkTemplate } from "./linkTemplateUrl";

export function ChooseEditorDialog(props: {
  originalLinkProps: LinkProps;
  targets: Targets;
}) {
  const [selectedTarget, setSelectedTarget] = createSignal<string>(
    // eslint-disable-next-line solid/reactivity
    Object.entries(props.targets)[0]![0]
  );
  const originalLink = () => buildLink(props.originalLinkProps, props.targets);
  return (
    <div class="bg-white p-4 rounded-xl border-2 border-red-500 shadow-xl cursor-auto pointer-events-auto z-10">
      <h1>Choose an editor</h1>
      <EditorLinkForm
        targets={props.targets}
        selectedTarget={selectedTarget()}
        selectTarget={setSelectedTarget}
      />
      <div class="mt-2">
        <label for="email" class="block text-sm font-medium text-slate-700">
          Link preview:
        </label>
        <code class="flex first-letter:text-sm mt-1 bg-green-100 text-green-600 py-1 px-2 rounded">
          {originalLink()}
        </code>
      </div>
      <div class="mt-4 flex justify-between items-center">
        <div>{/* TODO: "use this editor next times"  */}</div>
        <div>
          <button
            onClick={() => {
              setLocalStorageLinkTemplate(selectedTarget());
              goToLinkProps(props.originalLinkProps, props.targets);
            }}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to code
          </button>
        </div>
      </div>
    </div>
  );
}
