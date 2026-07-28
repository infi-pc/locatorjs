import { Button } from "@locator/ui";

export function OpenSettingsButton(props: {
  onClick: () => void;
  title?: string;
}) {
  return (
    <Button
      size="xs"
      variant="outline"
      onClick={() => {
        props.onClick();
      }}
    >
      {props.title || "Settings"}
    </Button>
  );
}
