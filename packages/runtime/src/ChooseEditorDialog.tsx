import { LinkProps } from "./types";
import {
  buildLink,
  getLocalStorageProjectPath,
  setLocalStorageProjectPath,
} from "./buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { createSignal } from "solid-js";
import { Targets } from "@locator/shared";
import { goToLinkProps } from "./goTo";
import { setLocalStorageLinkTemplate } from "./linkTemplateUrl";
import { ProjectLinkForm } from "./ProjectLinkForm";

export function ChooseEditorDialog(props: {
  originalLinkProps: LinkProps;
  targets: Targets;
  onClose: () => void;
}) {
  const [selectedTarget, setSelectedTarget] = createSignal<string>(
    // eslint-disable-next-line solid/reactivity
    Object.entries(props.targets)[0]![0]
  );
  const [projectPath, setProjectPath] = createSignal<string>(
    // eslint-disable-next-line solid/reactivity
    getLocalStorageProjectPath() || props.originalLinkProps.projectPath
  );

  const correctedProjectPath = (): string => {
    let pp = projectPath();
    if (pp.at(-1) !== "/" && pp.at(-1) !== "\\") {
      pp += "/";
    }
    return pp;
  };

  const [needToFillLinkError, setNeedToFillLinkError] =
    createSignal<boolean>(false);

  const currentLinkProps = (): LinkProps => ({
    ...props.originalLinkProps,
    projectPath: correctedProjectPath(),
  });

  const currentLink = () =>
    buildLink(currentLinkProps(), props.targets, selectedTarget());

  return (
    <div class="bg-white p-4 rounded-xl border-2 border-red-500 shadow-xl cursor-auto pointer-events-auto z-10 max-w-2xl">
      <ProjectLinkForm
        value={projectPath()}
        onChange={(val) => {
          setNeedToFillLinkError(false);
          setProjectPath(val);
        }}
      />
      {needToFillLinkError() ? (
        <div class="text-red-500 text-sm">Project path is required</div>
      ) : (
        ""
      )}

      <EditorLinkForm
        targets={props.targets}
        selectedTarget={selectedTarget()}
        selectTarget={setSelectedTarget}
      />
      <div class="mt-2">
        <label for="email" class="block text-sm  text-slate-700 font-bold">
          Link preview:
        </label>
        <code class="flex first-letter:text-sm mt-1 bg-green-100 text-green-600 py-1 px-2 rounded whitespace-pre-wrap break-all">
          {currentLink()}
        </code>
      </div>
      <div class="mt-4 flex gap-2 justify-between items-center">
        <div class="text-sm text-gray-600">
          Locator will remember your choice, you can change it later in
          settings.
        </div>
        <div>
          <button
            onClick={() => {
              if (!projectPath()) {
                setNeedToFillLinkError(true);
                return;
              }

              setLocalStorageLinkTemplate(selectedTarget());
              const newProjectPath = correctedProjectPath();
              if (newProjectPath) {
                setLocalStorageProjectPath(newProjectPath);
              }
              goToLinkProps(currentLinkProps(), props.targets);
              props.onClose();
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
