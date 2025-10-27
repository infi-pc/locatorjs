import Link from "next/link";
import { useState } from "react";
import { MdArrowDropDown, MdArrowDropUp } from "react-icons/md";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Header from "../../blocks/Header";
import { getBrowserLink } from "../../blocks/shared";
import { AllBrowsersLinksInline } from "../../components/AllBrowsersLinks";
import { InstallByAnything } from "../../components/InstallByAnything";
import { InstallReactRuntime } from "../../components/InstallReactRuntime";
import { minimalImportScript } from "../../components/InstallUiInFile";
import { Step } from "../../components/Step";
import {
  Alert,
  BlockHeadline,
  InlineCode,
  InstallContainer,
  StandardLink,
  StepsBody,
} from "../../components/Styled";

export const babelPluginMinimalDevtoolsConfig = `{
  "presets": ["@babel/preset-react"],
  "plugins": [
    "@babel/plugin-transform-react-jsx-self",
    "@babel/plugin-transform-react-jsx-source"
  ]
}
`;

export default function InstallReact() {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <InstallContainer>
          <BlockHeadline>Install Locator for React</BlockHeadline>
          <p className="text-center">
            Install Locator on React codebase. This is DevTools variant which is
            preffered solution. Alternative is{" "}
            <Link href="/install/react-data-id" passHref legacyBehavior>
              <StandardLink>data-id solution</StandardLink>
            </Link>
            .{" "}
          </p>
          <Alert>
            Both browser extension and library require either working devtools
            with sources or Locator{"'"}s Babel plugin.
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
              You can get extension for <AllBrowsersLinksInline />
              <Expandable title="storybook">
                <>
                  Add this to <InlineCode>.storybook/.babelrc</InlineCode>:
                  <SyntaxHighlighter language="json" style={a11yDark}>
                    {babelPluginMinimalDevtoolsConfig}
                  </SyntaxHighlighter>
                </>
              </Expandable>
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
              <InstallReactRuntime />
              <Expandable title="storybook">
                <>
                  Add this to <InlineCode>.storybook/preview.js</InlineCode>
                  <SyntaxHighlighter language="javascript" style={a11yDark}>
                    {minimalImportScript}
                  </SyntaxHighlighter>
                </>
              </Expandable>
            </Step>

            <Step title="Next.js 15+ with Turbopack/SWC" no={3}>
              For Next.js 15+ using Turbopack or SWC (where babel plugins don
              {"'"}t work), use the webpack/turbopack loader:
              <InstallByAnything packageName="@locator/webpack-loader" />
              <div className="mt-2 mb-1 font-semibold">
                For Turbopack (Next.js 15+):
              </div>
              Add this to your <InlineCode>next.config.ts</InlineCode>:
              <SyntaxHighlighter language="javascript" style={a11yDark}>
                {`import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "**/*.{tsx,jsx}": {
        loaders: [{
          loader: "@locator/webpack-loader",
          options: { env: "development" }
        }]
      }
    }
  }
};

export default nextConfig;`}
              </SyntaxHighlighter>
              <div className="mt-3 mb-1 font-semibold">For Webpack:</div>
              Add this to your <InlineCode>next.config.js</InlineCode>:
              <SyntaxHighlighter language="javascript" style={a11yDark}>
                {`module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\\.(tsx|ts|jsx|js)$/,
        exclude: /node_modules/,
        use: [{
          loader: '@locator/webpack-loader',
          options: { 
            env: 'development'
          }
        }]
      });
    }
    return config;
  }
};`}
              </SyntaxHighlighter>
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
              If you don{"'"}t have{" "}
              <StandardLink href="https://babeljs.io/docs/en/babel-plugin-transform-react-jsx-source">
                babel-plugin-transform-react-jsx-source
              </StandardLink>{" "}
              you should set it up manually.
              <div className="mt-1">
                <b>tl;dr</b> Adding this to your Babel config might help:
                <SyntaxHighlighter language="json" style={a11yDark}>
                  {babelPluginMinimalDevtoolsConfig}
                </SyntaxHighlighter>
              </div>
              <br />
              <b>Or try alternative:</b>{" "}
              <Link href="/install/react-data-id" passHref legacyBehavior>
                <StandardLink>
                  installation based on custom Babel plugin
                </StandardLink>
              </Link>
            </Step>
          </StepsBody>
        </InstallContainer>
      </section>
    </>
  );
}

function Expandable({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm font-medium"
      >
        <div className="text-blue-600 hover:text-blue-800">{title}</div>
        {isOpen ? (
          <MdArrowDropUp size={20}></MdArrowDropUp>
        ) : (
          <MdArrowDropDown size={20}></MdArrowDropDown>
        )}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}
