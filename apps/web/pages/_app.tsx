import '../styles/globals.css'
import { setup } from "@locator/runtime"

setup({
  targets: {
    GitHub: "https://www.github.com/infi-pc/locatorjs/tree/master/web${filePath}:${line}:${column}",
    Editor: "https://www.github.dev/infi-pc/locatorjs/web${filePath}:${line}:${column}"
  }
})

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
