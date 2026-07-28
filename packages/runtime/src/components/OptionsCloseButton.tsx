import { IconButton } from "@locator/ui";
import { X } from "lucide-solid";

export function OptionsCloseButton(props: { onClick: () => void }) {
  return (
    <IconButton aria-label="Close" onClick={props.onClick}>
      <X size={16} />
    </IconButton>
  );
}
