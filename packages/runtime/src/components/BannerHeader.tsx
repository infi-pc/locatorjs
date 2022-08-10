import LogoIcon from "./LogoIcon";
import { isExtension } from "../functions/isExtension";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { AdapterId } from "../consts";
import { detectSvelte } from "@locator/shared";

export default function BannerHeader(props: {
  openOptions?: () => void;
  adapter?: AdapterId;
}) {
  const isProjectSettings = () => isExtension() && detectSvelte();
  return (
    <div class="flex justify-between gap-2">
      <LogoIcon />
      {(!isExtension() || isProjectSettings()) && props.openOptions ? (
        <OpenSettingsButton
          onClick={() => {
            props.openOptions!();
          }}
          title={isProjectSettings() ? "Project settings" : "Settings"}
        />
      ) : null}
    </div>
  );
}
