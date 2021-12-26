import "../styles/globals.css";
import { setup as setupLocator } from "@locator/runtime";

console.log("process.env.NODE_ENV:", process.env.NODE_ENV)

setupLocator(
  process.env.NODE_ENV === "production"
    ? {
        defaultMode: "hidden",
        targets: {
          GitHub:
            "https://www.github.com/infi-pc/locatorjs/blob/master/apps/web${filePath}#L${line}",
          Editor:
            "https://github.dev/infi-pc/locatorjs/blob/master/apps/web${filePath}#L${line}",
        },
      }
    : {
        defaultMode: "options",
      }
);

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
