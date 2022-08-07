import { Targets } from "@locator/shared";
import { createSignal } from "solid-js";
import { bannerClasses } from "./bannerClasses";
import {
  cleanLocalStorageProjectPath,
  getSavedProjectPath,
  setLocalStorageProjectPath,
} from "./buildLink";
import { EditorLinkForm } from "./EditorLinkForm";
import { isExtension } from "./isExtension";
import {
  cleanLocalStorageLinkTemplate,
  getLinkTypeOrTemplate,
  setLocalStorageLinkTemplate,
} from "./linkTemplateUrl";
import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { ProjectLinkForm } from "./ProjectLinkForm";

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  adapterId: string;
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
      {props.adapterId === "svelte" ? (
        <ProjectLinkForm
          value={projectPath()}
          onChange={function (newValue) {
            saveProjectPath(newValue);
          }}
        />
      ) : null}

      {!isExtension() ? (
        <EditorLinkForm
          targets={props.targets}
          selectedTarget={selectedTarget()}
          selectTarget={selectTarget}
        />
      ) : null}

      <button
        class="text-slate-500 hover:text-slate-600 text-xs underline cursor-pointer"
        onClick={() => {
          cleanLocalStorageLinkTemplate();
          cleanLocalStorageProjectPath();
          props.onClose();
        }}
      >
        Reset all settings
      </button>
    </div>
  );
}
