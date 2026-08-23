import {
  getModifiersMap,
  modifiersTitles,
  primaryEditorShortcut,
} from "@locator/shared";
import { createEffect, createSignal, For } from "solid-js";
import { bannerClass } from "../functions/bannerClasses";
import BannerHeader from "./BannerHeader";
import { AdapterId } from "../consts";
import { useOptions } from "../functions/optionsStore";
import { activationModifiers, effectiveBindings } from "../functions/bindings";
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

  const bindings = () => effectiveBindings(options.effective());
  /**
   * The shortcut that actually opens the editor. There may not be one -- a
   * toolbar-only config is supported -- and in that case the banner has to
   * describe what the modifier really does rather than promise a click that
   * `matchBinding` will not match.
   */
  const editorShortcut = () => {
    const trigger = primaryEditorShortcut(bindings())?.trigger;
    return trigger?.kind === "modifier-click" ? trigger.modifiers : undefined;
  };
  const modifiers = () =>
    getModifiersMap(
      editorShortcut() ?? activationModifiers(bindings())[0] ?? "alt"
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
        {editorShortcut()
          ? "Go to component code with "
          : "Show the LocatorJS toolbar with "}
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
        {editorShortcut() ? (
          <>
            + <div class={styles.key}>click</div>{" "}
          </>
        ) : (
          <>+ hover an element </>
        )}
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
