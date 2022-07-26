import Header from "../../blocks/Header";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Step } from "../../components/Step";
import { Tabs } from "../../components/Tabs";
import { InstallByAnything } from "../../components/InstallByAnything";
import {
  BlockHeadline,
  InlineCode,
  InstallContainer,
  StepsBody,
} from "../../components/Styled";
import { InstallUiInFile } from "../../components/InstallUiInFile";
import { AlternativelyInstallExtension } from "../../components/AlternativelyInstallExtension";

export default function InstallSolidJs() {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <InstallContainer>
          <BlockHeadline>Install Locator for SolidJS</BlockHeadline>
          <p className="text-center">Install Locator on SolidJS codebase.</p>
          <StepsBody>
            <Step title="Add Babel plugin" no={1}>
              You need a babel plugin to gather all the component{"'"}s
              locations in their files.
              <InstallByAnything packageName="@locator/babel-jsx" />
              <Tabs
                queryId="stack"
                items={[
                  {
                    title: "Vite",
                    content: (
                      <>
                        Add this to your <InlineCode>vite.config.js</InlineCode>
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {`import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solidPlugin({
      babel: {
        plugins: [
          [
            "@locator/babel-jsx/dist",
            {
              env: "development",
            },
          ],
        ],
      },
    }),
  ],
});
`}
                        </SyntaxHighlighter>
                      </>
                    ),
                  },
                  {
                    title: "Others",
                    content: (
                      <>
                        Add this to your Babel config:
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {`[
  "@locator/babel-jsx/dist",
  {
    env: "development",
  },
],
`}
                        </SyntaxHighlighter>
                      </>
                    ),
                  },
                ]}
              />
            </Step>
            <Step
              title={
                <>
                  Add UI library{" "}
                  <span className="font-normal text-gray-500">
                    (optional for Browser Extension users)
                  </span>
                </>
              }
              no={2}
            >
              Import and call setup function to show the components and handle
              the clickings.
              <InstallByAnything packageName="@locator/runtime" />
              <br />
              <InstallUiInFile file="index.jsx" />
              <AlternativelyInstallExtension />
            </Step>
            <Step title="Test and enjoy Locator" no={3}>
              Go to your localhost environment.
            </Step>
          </StepsBody>
        </InstallContainer>
      </section>
    </>
  );
}
