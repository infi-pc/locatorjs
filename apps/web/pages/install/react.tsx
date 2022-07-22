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
import { extensionLink } from "../../blocks/shared";

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
          <StepsBody>
            <Step title="Add Babel plugin" no={1}>
              You need a babel plugin to gather all the component's locations in
              their files.
              <InstallByAnything packageName="@locator/babel-jsx" />
              <Tabs
                items={[
                  {
                    title: "Next.js",
                    content: (
                      <>
                        Add custom babel config to your Next.js project. Create
                        of modify
                        <InlineCode>babel.config.js</InlineCode> file.
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {`module.exports = {
  presets: ["next/babel"],
  plugins: [
    ["@locator/babel-jsx/dist", {
      env: "development",
    }]
  ]
};`}
                        </SyntaxHighlighter>
                        <NotUsingBabelAlert />
                      </>
                    ),
                  },
                  {
                    title: "Create React App",
                    content: (
                      <>
                        For customisation you will need to install{" "}
                        <StandardLink href="https://github.com/gsoft-inc/craco">
                          Craco
                        </StandardLink>{" "}
                        or similar tool. Then add babel plugin in{" "}
                        <InlineCode>craco.config.js</InlineCode>
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {`module.exports = {
  babel: {
    plugins: [
      ["@locator/babel-jsx/dist", {
        env: "development"
      }]
    ],
  },
};`}
                        </SyntaxHighlighter>
                      </>
                    ),
                  },
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
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    // other Vite plugins
    react({
      babel: {
        plugins: [
          // other Babel plugins
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
                        <NotUsingBabelAlert />
                      </>
                    ),
                  },
                ]}
              />
            </Step>
            <Step title="Add UI library" no={2}>
              Call this function to show the components and handle the
              clickings.
              <InstallByAnything packageName="@locator/runtime" />
              <Tabs
                items={[
                  {
                    title: "Next.js",
                    content: <InstallUiInFile file="pages/_app.jsx" />,
                  },
                  {
                    title: "Create React App",
                    content: <InstallUiInFile file="index.jsx" />,
                  },
                  {
                    title: "Vite",
                    content: <InstallUiInFile file="main.jsx" />,
                  },
                  {
                    title: "Others",
                    content: (
                      <>
                        Add this to some global/root file, usually :
                        <InlineCode>index.js</InlineCode>
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {`import setupLocatorUI from "@locator/runtime";
                        
setupLocatorUI();`}
                        </SyntaxHighlighter>
                      </>
                    ),
                  },
                ]}
              />
              <Alert>
                Alternatively to the 2nd step, you can install{" "}
                {/* TODO firefox */}
                <StandardLink href={extensionLink.chrome}>
                  Browser Extension
                </StandardLink>
                . If you are not ready to show the UI to your whole team, you
                can skip installing library. Browser extension will connect to
                apps that have Locator Babel Plugin installed.
              </Alert>
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
