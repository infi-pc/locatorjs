import { modifiersTitles } from "@locator/shared";
import { createEffect, createSignal, For } from "solid-js";
import { bannerClasses } from "../functions/bannerClasses";
import BannerHeader from "./BannerHeader";
import { AdapterId } from "../consts";
import { getMouseModifiers } from "../functions/isCombinationModifiersPressed";
import { useOptions } from "../functions/optionsStore";

export function IntroInfo(props: {
  openOptions: () => void;
  hide: boolean;
  adapter?: AdapterId;
}) {
  const options = useOptions();

  const [showIntro, setShowIntro] = createSignal(true);
  setTimeout(() => {
    setShowIntro(false);
  }, 5000);

  createEffect(() => {
    if (props.hide && showIntro()) {
      setShowIntro(false);
    }
  });

  const modifiers = () => getMouseModifiers();
  return (
    <div
      class={bannerClasses()}
      style={{
        bottom: showIntro() ? "12px" : "-120px",
      }}
    >
      <BannerHeader openOptions={props.openOptions} adapter={props.adapter} />
      <div class="text-sm mt-2 mb-1">
        Go to component code with{" "}
        <For each={Object.keys(modifiers())}>
          {(key, i) => {
            return (
              <>
                {i() === 0 ? "" : " + "}
                <div class="inline-block px-1 py-0.5 border border-slate-200 rounded">
                  {modifiersTitles[key as keyof typeof modifiersTitles]}
                </div>
              </>
            );
          }}
        </For>{" "}
        +{" "}
        <div class="inline-block px-1 py-0.5 border border-slate-200 rounded">
          click
        </div>{" "}
      </div>
      <div class="text-xs mt-2 mb-1 text-gray-600 flex gap-1">
        <a
          class="underline cursor-pointer"
          href="https://www.locatorjs.com"
          target="_blank"
        >
          What is Locator?
        </a>
        <a
          class="underline cursor-pointer"
          onClick={() => {
            options.setOptions({ showIntro: false });
          }}
        >
          Stop showing this popup
        </a>
      </div>
    </div>
  );
}
