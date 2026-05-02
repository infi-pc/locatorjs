import { Button } from '@hope-ui/solid';

export function SiteLocalToggle(props: {
  label: string;
  onSiteLocal: () => void;
  disabled?: boolean;
}) {
  return (
    <div class="mt-1">
      <Button
        size="xs"
        variant="ghost"
        onClick={props.onSiteLocal}
        disabled={props.disabled}
        title={
          props.disabled
            ? 'No LocatorJS runtime detected on this page'
            : undefined
        }
      >
        {props.label}
      </Button>
    </div>
  );
}
