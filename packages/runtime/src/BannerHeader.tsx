import LogoIcon from "./LogoIcon";
import { isExtension } from "./isExtension";
import { OpenOptionsButton } from "./OpenOptionsButton";

export default function BannerHeader(props: { openOptions?: () => void }) {
  return (
    <div class="flex justify-between gap-2">
      <LogoIcon />
      {!isExtension() && props.openOptions ? (
        <OpenOptionsButton
          onClick={() => {
            props.openOptions!();
          }}
        />
      ) : null}
    </div>
  );
}
