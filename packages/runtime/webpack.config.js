const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";

module.exports = {
  entry: {
    "build/bundle": ["./src/index.ts"],
  },
  resolve: {
    alias: {
      svelte: path.dirname(require.resolve("svelte/package.json")),
    },
    extensions: [".tsx", ".ts", ".mjs", ".js", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
  },
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "index.js",
    environment: {
      // // The environment supports arrow functions ('() => { ... }').
      // arrowFunction: true,
      // // The environment supports BigInt as literal (123n).
      // bigIntLiteral: false,
      // // The environment supports const and let for variable declarations.
      // const: true,
      // // The environment supports destructuring ('{ a, b } = obj').
      // destructuring: true,
      // // The environment supports an async import() function to import EcmaScript modules.
      // dynamicImport: false,
      // // The environment supports 'for of' iteration ('for (const x of array) { ... }').
      // forOf: true,
      // The environment supports ECMAScript Module syntax to import ECMAScript modules (import ... from '...').
      module: true,
      // The environment supports optional chaining ('obj?.a' or 'obj?.()').
      // optionalChaining: true,
      // // The environment supports template literals.
      // templateLiteral: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: {
              dev: false,
            },
            emitCss: true,
            hotReload: false,
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        // required to prevent errors from Svelte on Webpack 5+
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  mode,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
  devtool: false,
};
