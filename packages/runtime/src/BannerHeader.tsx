import LogoIcon from "./LogoIcon";
import { isExtension } from "./isExtension";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { AdapterId } from "./consts";

export default function BannerHeader(props: {
  openOptions?: () => void;
  adapter?: AdapterId;
}) {
  const isProjectSettings = () => isExtension() && props.adapter === "svelte";
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
