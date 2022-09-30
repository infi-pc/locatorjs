import { cleanOptions, Targets } from "@locator/shared";
import { createMemo } from "solid-js";
import { bannerClasses } from "../functions/bannerClasses";
import { isExtension } from "../functions/isExtension";
import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { useOptions } from "../functions/optionsStore";
import { AdapterId } from "../consts";
import { LinkOptions } from "./LinkOptions";
import { getElementInfo } from "../adapters/getElementInfo";

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  adapterId?: AdapterId;
  currentElement: HTMLElement | null;
}) {
  const options = useOptions();

  const elLinkProps = createMemo(() =>
    props.currentElement
      ? getElementInfo(props.currentElement, props.adapterId)?.thisElement
          .link || null
      : null
  );

  return (
    <div class={bannerClasses() + " w-[560px] max-w-full overflow-hidden"}>
      <div class="p-1">
        <div class="flex justify-between items-center">
          <LogoIcon />
          <OptionsCloseButton onClick={() => props.onClose()} />
        </div>

        <LinkOptions
          linkProps={elLinkProps()}
          adapterId={props.adapterId}
          targets={props.targets}
        />

        <div class="flex gap-2 justify-between mt-4">
          <button
            class="bg-slate-100 py-1 px-2 rounded hover:bg-slate-300 active:bg-slate-200 cursor-pointer text-xs"
            onClick={() => {
              cleanOptions();
              props.onClose();
            }}
          >
            Reset settings
          </button>
          <button
            class="bg-red-50 py-1 px-2 rounded hover:bg-red-200 active:bg-red-100 cursor-pointer text-xs text-red-800 flex gap-1"
            onClick={() => {
              if (isExtension()) {
                options.setOptions({ disabled: true });
                props.onClose();
              } else {
                props.showDisableDialog();
              }
            }}
          >
            <svg style={{ width: "16px", height: "16px" }} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"
              />
            </svg>{" "}
            Disable Locator
          </button>
        </div>
      </div>
    </div>
  );
}
