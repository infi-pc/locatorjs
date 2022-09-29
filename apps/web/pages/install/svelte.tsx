import Header from "../../blocks/Header";
import { Step } from "../../components/Step";
import { InstallByAnything } from "../../components/InstallByAnything";
import {
  AlertWarning,
  BlockHeadline,
  InlineCode,
  InstallContainer,
  StandardLink,
  StepsBody,
} from "../../components/Styled";
import { getBrowserLink } from "../../blocks/shared";
import { AllBrowsersLinksInline } from "../../components/AllBrowsersLinks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Tabs } from "../../components/Tabs";

const svelteImportScript = (
  projectPath: string
) => `import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI({
    adapter: "svelte",
    projectPath: ${projectPath},
  });
}
`;

export default function InstallSvelte() {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <InstallContainer>
          <BlockHeadline>Install Locator for Svelte</BlockHeadline>
          <p className="text-center">Install Locator on Svelte codebase.</p>

          <AlertWarning>
            <div className="mb-1">
              <strong>Svelte support is experimental:</strong>
            </div>
            <ul className="ml-4 list-disc">
              <li>It does not show component{"'"}s name and bounding box.</li>
            </ul>
          </AlertWarning>

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
              You can get extension for <AllBrowsersLinksInline />
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
              <Tabs
                queryId="svelte-stack"
                items={[
                  {
                    title: "Vite",
                    content: (
                      <>
                        Add this to some global/root file, usually:
                        <InlineCode>index.js</InlineCode> or{" "}
                        <InlineCode>App.svelte</InlineCode>
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {svelteImportScript("__PROJECT_PATH__")}
                        </SyntaxHighlighter>
                        and add this to your{" "}
                        <InlineCode>vite.config.js</InlineCode>
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {`export default defineConfig({
  ...
  define: {
    __PROJECT_PATH__: \`"\${process.cwd()}/"\`,
  },
  ...
});`}
                        </SyntaxHighlighter>
                      </>
                    ),
                  },
                  {
                    title: "other stacks",
                    content: (
                      <>
                        Add this to some global/root file, usually:
                        <InlineCode>index.js</InlineCode> or{" "}
                        <InlineCode>App.svelte</InlineCode>
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {svelteImportScript("process.cwd()")}
                        </SyntaxHighlighter>
                        there might be differences in other frameworks.
                      </>
                    ),
                  },
                ]}
              />
            </Step>
          </StepsBody>
        </InstallContainer>
      </section>
    </>
  );
}
