import { Targets } from "@locator/shared";
import { createSignal } from "solid-js";
import { bannerClasses } from "./bannerClasses";
import { EditorLinkForm } from "./EditorLinkForm";
import {
  getLinkTypeOrTemplate,
  setLocalStorageLinkTemplate,
} from "./linkTemplateUrl";
import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";

export function Options(props: { targets: Targets; onClose: () => void }) {
  const [selectedTarget, setSelectedTarget] = createSignal(
    // eslint-disable-next-line solid/reactivity
    getLinkTypeOrTemplate(props.targets)
  );

  function selectTarget(val: string) {
    setSelectedTarget(val);
    setLocalStorageLinkTemplate(val);
  }

  return (
    <div class={bannerClasses() + " w-96"}>
      <div class="flex justify-between items-center">
        <LogoIcon />
        <OptionsCloseButton onClick={() => props.onClose()} />
      </div>
      <EditorLinkForm
        targets={props.targets}
        selectedTarget={selectedTarget()}
        selectTarget={selectTarget}
      />
    </div>
  );
}
