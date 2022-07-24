import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Tabs } from "./Tabs";
import { InlineCode } from "./Styled";
import { InstallUiInFile } from "./InstallUiInFile";

export function InstallRuntime() {
  return (
    <Tabs
      queryId="stack"
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
              <SyntaxHighlighter language="javascript" style={a11yDark}>
                {`import setupLocatorUI from "@locator/runtime";
          
if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}
`}
              </SyntaxHighlighter>
            </>
          ),
        },
      ]}
    />
  );
}
