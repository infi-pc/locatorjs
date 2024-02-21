import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solidPlugin({
      babel: {
        plugins: [
          [
            "@amirrezadev1378/babel-jsx/dist",
            {
              env: "development",
            },
          ],
        ],
      },
    }),
  ],
  build: {
    target: "esnext",
  },
});
