import "../styles/globals.css";
import { setup as setupLocator } from "@locator/runtime";
import Head from "next/head";

const branchName = process.env.VERCEL_GIT_COMMIT_REF || "master";

setupLocator(
  process.env.NODE_ENV === "production"
    ? {
        // On production we have to enable it with cookies, on stagings it is just hidden
        // defaultMode: process.env.VERCEL_ENV === "production" ? "disabled" : "hidden",
        defaultMode: "hidden",
        targets: {
          GitHub: `https://www.github.com/infi-pc/locatorjs/blob/${branchName}/apps/web\${filePath}#L\${line}`,
          Editor: `https://github.dev/infi-pc/locatorjs/blob/${branchName}/apps/web\${filePath}#L\${line}`,
        },
      }
    : {
        // Show initial setup to all devs in your team so they can choose their editor.
        defaultMode: "options",
      }
);

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <title>LocatorJS - click on any component to go to code.</title>
        <meta name="description" content="A plugin for you dev stack that allows you to click trough from your app to it's code."></meta>
        <meta property="og:image" content="/preview.png"></meta>
        <meta name="twitter:card" content="summary_large_image"></meta>
        <meta name="twitter:site" content="@_michaelmusil"></meta>
        <meta name="twitter:title" content="LocatorJS - click on any component to go to code."></meta>
        <meta name="twitter:image" content="https://www.locatorjs.com/preview.png"></meta>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
