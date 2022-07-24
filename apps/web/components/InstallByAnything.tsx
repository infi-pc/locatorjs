import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Tabs } from "./Tabs";

export function InstallByAnything({ packageName }: { packageName: string }) {
  return (
    <Tabs
      queryId="install-tool"
      items={[
        {
          title: "npm",
          content: (
            <SyntaxHighlighter language="bash" style={a11yDark}>
              {`npm install -D ${packageName}`}
            </SyntaxHighlighter>
          ),
        },
        {
          title: "Yarn",
          content: (
            <SyntaxHighlighter language="bash" style={a11yDark}>
              {`yarn add -D ${packageName}`}
            </SyntaxHighlighter>
          ),
        },
        {
          title: "pnpm",
          content: (
            <SyntaxHighlighter language="bash" style={a11yDark}>
              {`pnpm add -D ${packageName}`}
            </SyntaxHighlighter>
          ),
        },
      ]}
    />
  );
}
