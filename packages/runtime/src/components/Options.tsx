import { cleanOptions, Targets } from "@locator/shared";
import { createSignal } from "solid-js";
import { bannerClasses } from "../functions/bannerClasses";
import {
  getSavedProjectPath,
  setLocalStorageProjectPath,
} from "../functions/buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { isExtension } from "../functions/isExtension";
import {
  getLinkTypeOrTemplate,
  setLocalStorageLinkTemplate,
} from "../functions/linkTemplateUrl";
import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { ProjectLinkForm } from "./ProjectLinkForm";
import { setOptions } from "../functions/optionsStore";

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  adapterId?: string;
}) {
  const [selectedTarget, setSelectedTarget] = createSignal(
    // eslint-disable-next-line solid/reactivity
    getLinkTypeOrTemplate(props.targets)
  );

  function selectTarget(val: string) {
    setSelectedTarget(val);
    setLocalStorageLinkTemplate(val);
  }

  const [projectPath, setProjectPath] = createSignal<string>(
    // eslint-disable-next-line solid/reactivity
    getSavedProjectPath() || ""
  );

  function saveProjectPath(newPath: string) {
    setProjectPath(newPath);
    setLocalStorageProjectPath(newPath);
  }

  return (
    <div class={bannerClasses() + " w-96"}>
      <div class="flex justify-between items-center">
        <LogoIcon />
        <OptionsCloseButton onClick={() => props.onClose()} />
      </div>

      <ProjectLinkForm
        value={projectPath()}
        onChange={function (newValue) {
          saveProjectPath(newValue);
        }}
      />

      {!isExtension() ? (
        <EditorLinkForm
          targets={props.targets}
          selectedTarget={selectedTarget()}
          selectTarget={selectTarget}
        />
      ) : null}

      <div class="flex gap-2">
        <button
          class="text-slate-500 hover:text-slate-600 text-xs underline cursor-pointer"
          onClick={() => {
            cleanOptions();
            props.onClose();
          }}
        >
          Reset all settings
        </button>
        <button
          class="text-slate-500 hover:text-slate-600 text-xs underline cursor-pointer"
          onClick={() => {
            if (isExtension()) {
              setOptions({ disabled: true });
              props.onClose();
            } else {
              props.showDisableDialog();
            }
          }}
        >
          Disable Locator {isExtension() ? "on this project" : ""}
        </button>
      </div>
    </div>
  );
}
