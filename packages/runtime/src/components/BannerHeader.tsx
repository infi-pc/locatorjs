import LogoIcon from "./LogoIcon";
import { isExtension } from "../functions/isExtension";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { AdapterId } from "../consts";
import { css } from "@locator/styled-system/css";

const header = css({
  alignItems: "center",
  display: "flex",
  gap: "2",
  justifyContent: "space-between",
});

export default function BannerHeader(props: {
  openOptions?: () => void;
  adapter?: AdapterId;
}) {
  return (
    <div class={header}>
      <LogoIcon />
      {props.openOptions ? (
        <OpenSettingsButton
          onClick={() => {
            props.openOptions!();
          }}
          title={isExtension() ? "Project settings" : "Settings"}
        />
      ) : null}
    </div>
  );
}
