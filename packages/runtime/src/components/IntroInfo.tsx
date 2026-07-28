import {
  getModifiersMap,
  modifiersTitles,
  primaryEditorBinding,
} from "@locator/shared";
import { createEffect, createSignal, For } from "solid-js";
import { bannerClass } from "../functions/bannerClasses";
import BannerHeader from "./BannerHeader";
import { AdapterId } from "../consts";
import { useOptions } from "../functions/optionsStore";
import { css, cx } from "@locator/styled-system/css";
import { kbd } from "@locator/styled-system/recipes";

const styles = {
  instruction: css({ fontSize: "sm", mb: "1", mt: "2" }),
  key: cx(
    kbd({ size: "sm", variant: "outline" }),
    css({ colorPalette: "gray" })
  ),
  links: css({
    color: "fg.muted",
    display: "flex",
    fontSize: "xs",
    gap: "1",
    mb: "1",
    mt: "2",
  }),
  link: css({ cursor: "pointer", textDecoration: "underline" }),
};

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

  const modifiers = () =>
    getModifiersMap(
      primaryEditorBinding(options.effective().bindings)?.modifiers ?? "alt"
    );
  return (
    <div
      class={bannerClass}
      style={{
        bottom: showIntro() ? "12px" : "-120px",
      }}
    >
      <BannerHeader openOptions={props.openOptions} adapter={props.adapter} />
      <div class={styles.instruction}>
        Go to component code with{" "}
        <For each={Object.keys(modifiers())}>
          {(key, i) => {
            return (
              <>
                {i() === 0 ? "" : " + "}
                <div class={styles.key}>
                  {modifiersTitles[key as keyof typeof modifiersTitles]}
                </div>
              </>
            );
          }}
        </For>{" "}
        + <div class={styles.key}>click</div>{" "}
      </div>
      <div class={styles.links}>
        <a class={styles.link} href="https://www.locatorjs.com" target="_blank">
          What is Locator?
        </a>
        <a
          class={styles.link}
          onClick={() => {
            options.setUserOrigin({ showIntro: false });
          }}
        >
          Stop showing this popup
        </a>
      </div>
    </div>
  );
}
