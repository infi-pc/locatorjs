# @locator/webpack-loader

Webpack/Turbopack loader for LocatorJS that enables component location tracking in projects using SWC or Turbopack where direct Babel plugin usage is not possible.

Works with both **Webpack** and **Turbopack** (Next.js 15+).

## Installation

```bash
npm install --save-dev @locator/webpack-loader
# or
yarn add -D @locator/webpack-loader
# or
pnpm add -D @locator/webpack-loader
```

## Usage

### Next.js 15+ with Turbopack

Add this to your `next.config.ts` or `next.config.js`:

```javascript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "**/*.{tsx,jsx}": {
        loaders: [
          {
            loader: "@locator/webpack-loader",
            options: {
              env: "development",
            },
          },
        ],
      },
    },
  },
};

export default nextConfig;
```

### Next.js with Webpack (or with SWC)

Add this to your `next.config.js`:

```javascript
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "@locator/webpack-loader",
            options: {
              env: "development",
            },
          },
        ],
      });
    }
    return config;
  },
};
```

### Generic Webpack Configuration

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(tsx|ts|jsx|js)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "@locator/webpack-loader",
            options: {
              env: "development",
              ignoreComponentNames: ["CustomProvider"], // optional
            },
          },
        ],
      },
    ],
  },
};
```

## Options

- **`env`** (string, optional): Environment to run the loader in. Defaults to `process.env.NODE_ENV` or `"development"`.
- **`ignoreComponentNames`** (string[], optional): Array of component names to ignore during transformation.

## How It Works

This loader uses Babel's transform API to apply the `@locator/babel-jsx` plugin to your JSX/TSX files. It adds `data-locatorjs` attributes with full file path and location information to your components, enabling click-to-source functionality even in React Server Components where JavaScript execution is limited.

The loader:

1. Parses your JSX/TSX files using Babel
2. Applies the LocatorJS transformation with path-based attributes (`data-locatorjs="/path/to/file.tsx:line:column"`)
3. Returns the transformed code with sourcemaps
4. Automatically skips `node_modules` and middleware files
5. Works without requiring `window.__LOCATOR_DATA__` - perfect for Server Components

## Requirements

- Webpack 5.x
- Works with React, Preact, and SolidJS

## Related Packages

- [@locator/babel-jsx](https://www.npmjs.com/package/@locator/babel-jsx) - Direct Babel plugin (use this if you have direct Babel access)
- [@locator/runtime](https://www.npmjs.com/package/@locator/runtime) - Runtime UI library for LocatorJS

## More Information

Visit [locatorjs.com](https://www.locatorjs.com) for complete documentation and installation guides.
