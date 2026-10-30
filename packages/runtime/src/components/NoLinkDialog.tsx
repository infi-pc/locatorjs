import { LinkThatWorksWithOption } from "./LinkThatWorksWithOption";
import LogoIcon from "./LogoIcon";
import { css } from "@locator/styled-system/css";

const styles = {
  dialog: css({
    bg: "bg.default",
    borderColor: "red.9",
    borderRadius: "l3",
    borderWidth: "2px",
    boxShadow: "xl",
    cursor: "auto",
    p: "4",
    pointerEvents: "auto",
    zIndex: "popover",
  }),
  title: css({ fontWeight: "bold", mt: "2" }),
  body: css({ color: "fg.muted" }),
  heading: css({
    color: "fg.default",
    fontWeight: "medium",
    mb: "1",
    mt: "2",
  }),
  list: css({ listStyleType: "disc", pl: "4" }),
};

export function NoLinkDialog() {
  return (
    <div class={styles.dialog}>
      <LogoIcon />

      <div class={styles.title}>No source info found for this element!</div>

      <div class={styles.body}>
        <p class={styles.heading}>You need one of these:</p>
        <ul class={styles.list}>
          <li>
            Working React in development mode, with{" "}
            <LinkThatWorksWithOption href="https://babeljs.io/docs/en/babel-preset-react">
              preset-react plugins
            </LinkThatWorksWithOption>
          </li>
          <li>React, SolidJS or Preact with Locator Babel plugin</li>
        </ul>
        <p class={styles.heading}>Setup babel plugin:</p>
        <div>
          <ul class={styles.list}>
            <li>
              <LinkThatWorksWithOption href="https://www.locatorjs.com/install/react-data-id">
                React
              </LinkThatWorksWithOption>
            </li>
            <li>
              <LinkThatWorksWithOption href="https://www.locatorjs.com/install/preact">
                Preact
              </LinkThatWorksWithOption>
            </li>
            <li>
              <LinkThatWorksWithOption href="https://www.locatorjs.com/install/solidjs">
                SolidJS
              </LinkThatWorksWithOption>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
