import "../styles/globals.css";
import setupLocatorUI from "@locator/runtime";
import Head from "next/head";
import { useEffect } from "react";

const branchName = process.env.VERCEL_GIT_COMMIT_REF || "master";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Setup LocatorJS only on the client side to avoid hydration issues
    setupLocatorUI(
      process.env.NODE_ENV === "production"
        ? {
            adapter: "jsx",
            targets: {
              github: {
                label: "GitHub",
                url: `https://www.github.com/infi-pc/locatorjs/blob/${branchName}/apps/web\${filePath}#L\${line}`,
                // target: "_blank",
              },
              githubDevEditor: {
                label: "GitHub.dev Editor",
                url: `https://github.dev/infi-pc/locatorjs/blob/${branchName}/apps/web\${filePath}#L\${line}`,
                // target: "_blank",
              },
            },
          }
        : {
            // Show initial setup to all devs in your team so they can choose their editor.
            adapter: "jsx",
          }
    );
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <title>LocatorJS - click on any component to go to code.</title>
        <meta
          name="description"
          content="Click on any component and go from your app to component's code."
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
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_gnU0ViluJLtfnpxuoncJBPmPaysPfNSmA8jpVCpUHwa',{api_host:'https://app.posthog.com'})`,
            }}
          />
        )}
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
