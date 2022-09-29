import { bannerClasses } from "../functions/bannerClasses";
import { useOptions } from "../functions/optionsStore";

import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";

export function DisableConfirmation(props: { onClose: () => void }) {
  const options = useOptions();

  return (
    <div class={bannerClasses() + " w-96"}>
      <div class="flex justify-between items-center">
        <LogoIcon />
        <OptionsCloseButton onClick={() => props.onClose()} />
      </div>
      <div class="font-medium mt-2">Disable Locator</div>
      <div class="text-sm text-gray-700 mt-1">
        You will be able to enable Locator again by running `enableLocator()` in
        DevTools console.
      </div>
      <div class="flex justify-end">
        <button
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          on:click={() => {
            options.setOptions({ disabled: true });
          }}
          class="bg-slate-100 py-2 px-4 rounded hover:bg-slate-300 active:bg-slate-200 cursor-pointer text-sm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
