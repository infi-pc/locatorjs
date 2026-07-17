import { For, createSignal } from "solid-js";
import { css } from "@locator/styled-system/css";

const SCRIPT_URL =
  "https://raw.githubusercontent.com/infi-pc/locatorjs/master/scripts/setup-nvim-handler.sh";

const TERMINALS = [
  { id: "auto", label: "Auto-detect" },
  { id: "ghostty", label: "Ghostty" },
  { id: "iterm", label: "iTerm2" },
  { id: "kitty", label: "Kitty" },
  { id: "terminal", label: "Default Terminal" },
] as const;

const styles = {
  root: css({
    bg: "amber.subtle.bg",
    borderColor: "amber.subtle.border",
    borderRadius: "l3",
    borderWidth: "1px",
    colorPalette: "amber",
    display: "flex",
    flexDirection: "column",
    gap: "2",
    p: "3",
  }),
  title: css({
    color: "amber.subtle.fg",
    fontSize: "sm",
    fontWeight: "semibold",
  }),
  text: css({ color: "amber.subtle.fg", textStyle: "caption" }),
  label: css({ color: "fg.default", fontSize: "xs", fontWeight: "semibold" }),
  options: css({ display: "flex", flexWrap: "wrap", gap: "1.5" }),
  option: css({
    alignItems: "center",
    bg: "bg.default",
    borderColor: "amber.outline.border",
    borderRadius: "l2",
    borderWidth: "1px",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: "xs",
    gap: "1.5",
    minH: "7",
    px: "2",
    _focusWithin: { focusVisibleRing: "outside" },
  }),
  radio: css({ accentColor: "amber.9", height: "3.5", width: "3.5" }),
  command: css({
    bg: "amber.surface.bg",
    borderRadius: "l2",
    color: "fg.default",
    display: "block",
    fontFamily: "mono",
    fontSize: "xs",
    overflowWrap: "anywhere",
    p: "2",
  }),
  inlineCode: css({
    bg: "amber.surface.bg",
    borderRadius: "l1",
    fontFamily: "mono",
    px: "1",
  }),
};

export function NvimSetupGuide() {
  const [terminal, setTerminal] = createSignal("auto");
  const curlCommand = () => {
    const selected = terminal();
    return selected === "auto"
      ? `curl -fsSL ${SCRIPT_URL} | bash`
      : `curl -fsSL ${SCRIPT_URL} | bash -s -- --terminal=${selected}`;
  };

  return (
    <section class={styles.root} aria-labelledby="locatorjs-nvim-setup-title">
      <div id="locatorjs-nvim-setup-title" class={styles.title}>
        Neovim setup required
      </div>
      <div class={styles.text}>
        The <code class={styles.inlineCode}>nvim://</code> URL scheme needs a
        one-time handler setup on macOS.
      </div>
      <div class={styles.label}>Terminal</div>
      <div class={styles.options}>
        <For each={[...TERMINALS]}>
          {(item) => (
            <label class={styles.option}>
              <input
                class={styles.radio}
                type="radio"
                name="locatorjs-nvim-terminal"
                value={item.id}
                checked={terminal() === item.id}
                onChange={() => setTerminal(item.id)}
              />
              {item.label}
            </label>
          )}
        </For>
      </div>
      <code class={styles.command}>{curlCommand()}</code>
      <div class={styles.text}>
        This creates a macOS app that handles Neovim links and opens files in
        the selected terminal.
      </div>
    </section>
  );
}
