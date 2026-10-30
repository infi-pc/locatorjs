import { modifiersTitles, strictConfig } from "@locator/shared";
import { createEffect, createSignal, For, Show } from "solid-js";
import { bannerClass } from "../functions/bannerClasses";
import BannerHeader from "./BannerHeader";
import { AdapterId } from "../consts";
import { useOptions } from "../functions/optionsContext";
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
  link: css({
    bg: "transparent",
    border: "none",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
    p: "0",
    textDecoration: "underline",
  }),
  error: css({ color: "error" }),
};

export function IntroInfo(props: {
  openOptions: () => void;
  hide: boolean;
  adapter?: AdapterId;
}) {
  const options = useOptions();

  const [showIntro, setShowIntro] = createSignal(true);
  const [saveState, setSaveState] = createSignal<"idle" | "saving" | "error">(
    "idle"
  );
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
    return strictConfig.primaryEditorShortcut(options.effective().bindings)
      ?.trigger.chord;
  };
  const modifiers = () =>
    strictConfig.modifiersForChord(
      editorShortcut() ?? activationModifiers(bindings())[0]!
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
        <For each={modifiers()}>
          {(key, i) => {
            return (
              <>
                {i() === 0 ? "" : " + "}
                <div class={styles.key}>{modifiersTitles[key]}</div>
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
        <button
          type="button"
          class={styles.link}
          disabled={saveState() === "saving"}
          onClick={async () => {
            setSaveState("saving");
            const result = await options.setUserOrigin({
              set: { showIntro: false },
            });
            if (result.ok) {
              setShowIntro(false);
            } else {
              setSaveState("error");
            }
          }}
        >
          {saveState() === "saving" ? "Saving…" : "Stop showing this popup"}
        </button>
        <Show when={saveState() === "error"}>
          <span class={styles.error} role="alert">
            Could not save
          </span>
        </Show>
      </div>
    </div>
  );
}
