import { modifiersTitles } from "@locator/shared";
import { createEffect, createSignal, For } from "solid-js";
import { bannerClasses } from "./bannerClasses";
import BannerHeader from "./BannerHeader";
import { getMouseModifiers } from "./isCombinationModifiersPressed";

export function IntroInfo(props: { openOptions: () => void; hide: boolean }) {
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
        bottom: showIntro() ? "12px" : "-90px",
      }}
    >
      <BannerHeader openOptions={props.openOptions} />
      <div class="text-xs mt-2 mb-1">
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
    </div>
  );
}
