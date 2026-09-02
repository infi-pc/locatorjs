import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Tabs } from "./Tabs";

const packageManagers = ["npm", "Yarn", "pnpm"];

export function InstallByAnything({ packageName }: { packageName: string }) {
  return (
    <Tabs
      queryId="install-tool"
      items={packageManagers.map((manager) => ({
        title: manager,
        content: (
          <SyntaxHighlighter language="bash" style={a11yDark}>
            {manager === "npm"
              ? `npm install -D ${packageName}`
              : `${manager.toLowerCase()} add -D ${packageName}`}
          </SyntaxHighlighter>
        ),
      }))}
    />
  );
}
