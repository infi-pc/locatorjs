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
import {
  AllBrowsersLinks,
  getAllExtensionsLinks,
} from "../../components/AllBrowsersLinks";

export default function InstallReact({}) {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <div className="container flex flex-col items-center justify-center py-24 mx-auto">
          <BlockHeadline>Install React</BlockHeadline>
          <p className="text-center">
            Install Locator on React codebase. This is DevTools variant which is
            preffered solution. Alternative is{" "}
            <Link href="/install/react-data-id">
              <StandardLink>data-id solution</StandardLink>
            </Link>
            .{" "}
          </p>
          <Alert>
            Both browser extension and library require either working devtools
            with sources or Locator's Babel plugin.
          </Alert>

          <StepsBody>
            <Step
              title={
                <>
                  Browser extension{" "}
                  <span className="text-gray-500">(option A)</span>
                </>
              }
              no={"A"}
            >
              Easiest way to start with Locator is to install a{" "}
              <StandardLink href={getBrowserLink()}>
                <b>Browser Extension</b>
              </StandardLink>
              <br />
              You can get extension for{" "}
              {getAllExtensionsLinks().map(({ link, title }, i) => {
                return (
                  <span key={i}>
                    {i !== 0 && ", "}
                    <StandardLink href={link}>{title}</StandardLink>
                  </span>
                );
              })}
            </Step>
            <Step
              title={
                <>
                  Library <span className="text-gray-500">(option B)</span>
                </>
              }
              no={"B"}
            >
              If you would like to install Locator to your project, so all team
              members can use it. You can install it as a library.
              <InstallByAnything packageName="@locator/runtime" />
              <InstallRuntime />
            </Step>

            <Step title="Troubleshooting" no={"?"}>
              Locator should work automatically in dev mode in most modern
              stacks. They automatically include{" "}
              <StandardLink href="https://babeljs.io/docs/en/babel-preset-react">
                babel-preset-react
              </StandardLink>{" "}
              which includes{" "}
              <StandardLink href="https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source">
                babel-plugin-transform-react-jsx-source
              </StandardLink>{" "}
              <br />
              Non-babel stacks use similar alternatives. <br />
              <br />
              If you don't have{" "}
              <StandardLink href="https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source">
                babel-plugin-transform-react-jsx-source
              </StandardLink>{" "}
              you should set it up manually.
              <br />
              Or try alternative{" "}
              <Link href="/install/react-data-id">
                <StandardLink>
                  installation based on custom Babel plugin
                </StandardLink>
              </Link>
            </Step>
          </StepsBody>
        </div>
      </section>
    </>
  );
}
