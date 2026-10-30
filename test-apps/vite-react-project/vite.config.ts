import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // The embedding scenarios live on their own pages, and the iframe
      // children need to be real documents.
      input: {
        main: resolve(__dirname, "index.html"),
        embedding: resolve(__dirname, "embedding.html"),
        iframeChild: resolve(__dirname, "iframe-child.html"),
        iframeChildBare: resolve(__dirname, "iframe-child-bare.html"),
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
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
