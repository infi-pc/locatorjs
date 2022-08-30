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

const vueImportScript = () => `import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI({
    adapter: "vue"
  });
}
`;

export default function InstallVue() {
  return (
    <>
      <Header />
      <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
        <InstallContainer>
          <BlockHeadline>Install Locator for Vue</BlockHeadline>
          <p className="text-center">Install Locator on Vue codebase.</p>

          <AlertWarning>
            <div className="mb-1">
              <strong>Vue support is experimental:</strong>
            </div>
            <ul className="ml-4 list-disc">
              <li>Works only with Vue 3</li>
              <li>Goes only to file, not to precise line and number</li>
              <li>SSR rendered component may not be recognized</li>
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
                queryId="vue-stack"
                items={[
                  {
                    title: "Vite",
                    content: (
                      <>
                        Add this to <InlineCode>main.js</InlineCode>:
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {vueImportScript()}
                        </SyntaxHighlighter>
                      </>
                    ),
                  },
                  {
                    title: "Nuxt 3",
                    content: (
                      <>
                        Add this to <InlineCode>app.vue</InlineCode>:
                        <SyntaxHighlighter
                          language="javascript"
                          style={a11yDark}
                        >
                          {"<script>\n" + vueImportScript() + "</script>"}
                        </SyntaxHighlighter>
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
