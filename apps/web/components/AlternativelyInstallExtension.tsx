import { Alert, StandardLink } from "./Styled";
import { getBrowserLink } from "../blocks/shared";

export function AlternativelyInstallExtension() {
  return (
    <Alert>
      Alternatively to the 2nd step, you can install{" "}
      <StandardLink href={getBrowserLink()}>Browser Extension</StandardLink>. If
      you are not ready to show the UI to your whole team, you can skip
      installing library. Browser extension will connect to apps that have
      Locator Babel Plugin installed.
    </Alert>
  );
}
