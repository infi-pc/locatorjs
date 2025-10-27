import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Header from "../../blocks/Header";
import { AlternativelyInstallExtension } from "../../components/AlternativelyInstallExtension";
import { InstallByAnything } from "../../components/InstallByAnything";
import { InstallReactRuntime } from "../../components/InstallReactRuntime";
import { NotUsingBabelAlert } from "../../components/NotUsingBabelAlert";
import { Step } from "../../components/Step";
import {
  BlockHeadline,
  InlineCode,
  InstallContainer,
  StandardLink,
  StepsBody,
} from "../../components/Styled";
import { Tabs } from "../../components/Tabs";

export const babelPluginMinimalConfig = `
{
  "plugins": [
    [
      "@locator/babel-jsx/dist",
      {
        "env": "development"
      }
    ]
  ]
}
`;

export default function InstallReactDataId() {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <InstallContainer>
          <BlockHeadline>Install Locator for React</BlockHeadline>
          <p className="text-center">
            Install Locator on React codebase. This is data-ids variant which is
            alternative solution for{" "}
            <Link href="/install/react" passHref legacyBehavior>
              <StandardLink>devtools variant</StandardLink>
            </Link>
            .{" "}
          </p>
          <StepsBody>
            <Step title="Add Babel plugin" no={1}>
              You need a babel plugin to gather all the component{"'"}s
              locations in their files.
              <InstallByAnything packageName="@locator/babel-jsx" />
              <Tabs
                queryId="stack"
                items={[
                  {
                    title: "Next.js 15+",
                    content: (
                      <>
                        For Next.js:
                        <InstallByAnything packageName="@locator/webpack-loader" />
                        <div className="mt-2 mb-1 font-semibold">
                          For Turbopack (Next.js 15+):
                        </div>
                        Add this to your <InlineCode>next.config.ts</InlineCode>
                        :
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
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
                        <div className="mt-3 mb-1 font-semibold">
                          For Webpack:
                        </div>
                        Add this to your <InlineCode>next.config.js</InlineCode>
                        :
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
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
                      </>
                    ),
                  },
                  {
                    title: "Next.js (older)",
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
                    title: "Storybook",
                    content: (
                      <>
                        Add this to <InlineCode>.storybook/.babelrc</InlineCode>
                        :
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {babelPluginMinimalConfig}
                        </SyntaxHighlighter>
                        <NotUsingBabelAlert />
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
                          {babelPluginMinimalConfig}
                        </SyntaxHighlighter>
                        <NotUsingBabelAlert />
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
              <InstallReactRuntime />
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
