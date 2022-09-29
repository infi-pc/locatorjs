import LogoIcon from "./LogoIcon";
import { isExtension } from "../functions/isExtension";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { AdapterId } from "../consts";

export default function BannerHeader(props: {
  openOptions?: () => void;
  adapter?: AdapterId;
}) {
  return (
    <div class="flex justify-between gap-2">
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
