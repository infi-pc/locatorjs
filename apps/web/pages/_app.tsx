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
        <meta
          name="description"
          content="A plugin for you dev stack that allows you to click trough from your app to it's code."
        ></meta>
        <meta property="og:image" content="/preview.png"></meta>
        <meta name="twitter:card" content="summary_large_image"></meta>
        <meta name="twitter:site" content="@_michaelmusil"></meta>
        {/* <meta name="twitter:site" content="@_michaelmusil" />
        <meta name="twitter:creator" content="@_michaelmusil" />    */}
        <meta
          name="twitter:title"
          content="LocatorJS - click on any component to go to code."
        ></meta>
        <meta
          name="twitter:image"
          content="https://www.locatorjs.com/preview.png"
        ></meta>
        {process.env.NODE_ENV === "production" && (
          <script type="text/javascript">
            {`window.smartlook||(function(d) {
    var o=smartlook=function(){ o.api.push(arguments)},h=d.getElementsByTagName('head')[0];
    var c=d.createElement('script');o.api=new Array();c.async=true;c.type='text/javascript';
    c.charset='utf-8';c.src='https://rec.smartlook.com/recorder.js';h.appendChild(c);
    })(document);
    smartlook('init', 'f69eb3dd4cb7531a91e2657bfd2a509e8d23e8b4');`}
          </script>
        )}
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
