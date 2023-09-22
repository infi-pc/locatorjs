import { createSignal } from "solid-js";
import { Button } from "./Button";

export function ClipboardButton(props: { onClick: () => void }) {
  const [copied, setCopied] = createSignal(false);
  return (
    <Button
      onClick={() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);

        props.onClick();
      }}
    >
      {copied() ? (
        <svg
          style={{ width: "16px", height: "16px", "pointer-events": "none" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <title>check-bold</title>
          <path
            fill="green"
            d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"
          />
        </svg>
      ) : (
        <svg
          style={{ width: "16px", height: "16px", "pointer-events": "none" }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"
          />
        </svg>
      )}
    </Button>
  );
}
