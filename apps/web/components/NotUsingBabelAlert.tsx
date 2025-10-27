import Link from "next/link";
import { Alert, StandardLink } from "./Styled";

export function NotUsingBabelAlert() {
  return (
    <Alert>
      If you are not using <b>Babel</b>, we offer{" "}
      <Link href="/install/react" passHref legacyBehavior>
        <StandardLink>
          alternative solution based on React DevTools
        </StandardLink>
      </Link>
      .
    </Alert>
  );
}
