import { useRouter } from "next/router";
import Header from "../../blocks/Header";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Link from "next/link";
import { Step } from "../../components/Step";
import { Tabs } from "../../components/Tabs";
import { InstallByAnything } from "../../components/InstallByAnything";
import {
  Alert,
  BlockHeadline,
  InlineCode,
  StandardLink,
  StepsBody,
} from "../../components/Styled";
import { InstallUiInFile } from "../../components/InstallUiInFile";
import { NotUsingBabelAlert } from "../../components/NotUsingBabelAlert";
import { extensionLink, getBrowserLink } from "../../blocks/shared";
import { InstallRuntime } from "../../components/InstallRuntime";

export default function InstallFramework({}) {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <div className="container flex flex-col items-center justify-center py-24 mx-auto">
          <BlockHeadline>Install React</BlockHeadline>
          <p className="text-center">
            Install Locator on React codebase. This is data-ids variant which is
            alternative solution for{" "}
            <Link href="/install/react">devtools variant</Link>.{" "}
          </p>
          <Alert>
            Both browser extension and library require either working devtools
            with sources or Locator's Babel plugin.
          </Alert>

          <StepsBody>
            <Step title="Browser extension variant" no={"A"}>
              Easiest way to start with Locator is to install a{" "}
              <StandardLink href={getBrowserLink()}>
                Browser Extension
              </StandardLink>
            </Step>
            <Step title="Library variant" no={"B"}>
              If you would like to install Locator to your project, so all team
              members can use it. You can install it as a library.
              <InstallByAnything packageName="@locator/runtime" />
              <InstallRuntime />
            </Step>
            <Step title="Test and enjoy Locator" no={3}>
              Go to your localhost environment.
            </Step>
          </StepsBody>
        </div>
      </section>
    </>
  );
}
