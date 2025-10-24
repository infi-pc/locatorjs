import { transformSync } from "@babel/core";

interface LocatorLoaderOptions {
  env?: string;
  ignoreComponentNames?: string[];
}

interface SourceMap {
  version: number;
  sources: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
  sourcesContent?: string[];
  names?: string[];
}

interface LoaderContext<T = Record<string, unknown>> {
  async(): (err: Error | null, content?: string, sourceMap?: SourceMap) => void;
  getOptions(): T;
  resourcePath: string;
}

/**
 * Webpack loader for @locator/babel-jsx plugin
 *
 * This loader applies the LocatorJS babel transformation to JSX/TSX files,
 * enabling component location tracking for projects using SWC or Turbopack
 * where direct babel plugin usage is not possible.
 *
 * Always uses path-based data attributes (data-locatorjs) for React Server
 * Component compatibility, working without requiring window.__LOCATOR_DATA__.
 *
 * @example
 * ```js
 * // next.config.js
 * module.exports = {
 *   webpack: (config) => {
 *     config.module.rules.push({
 *       test: /\.(tsx|ts|jsx|js)$/,
 *       exclude: /node_modules/,
 *       use: [{
 *         loader: '@locator/webpack-loader',
 *         options: { env: 'development' }
 *       }]
 *     });
 *     return config;
 *   }
 * };
 * ```
 */
function locatorLoader(
  this: LoaderContext<LocatorLoaderOptions>,
  source: string
): void {
  const callback = this.async();
  const filePath = this.resourcePath;

  // Skip node_modules and middleware files by default
  if (filePath.includes("node_modules") || filePath.includes("middleware.")) {
    callback(null, source);
    return;
  }

  const options = this.getOptions();

  try {
    // Use babel to transform the source with the locator plugin
    const locatorPlugin = require("@locator/babel-jsx");

    const result = transformSync(source, {
      filename: filePath,
      sourceMaps: true,
      sourceFileName: filePath,
      babelrc: false,
      configFile: false,
      // Use TypeScript preset to properly parse TS/TSX files
      presets: [
        [
          "@babel/preset-typescript",
          {
            isTSX: true,
            allExtensions: true,
            onlyRemoveTypeImports: true,
          },
        ],
      ],
      // Apply the locator plugin with path-based data attributes for server components
      plugins: [[locatorPlugin, { ...options, dataAttribute: "path" }]],
      // Preserve the original code structure
      retainLines: false,
      compact: false,
    });

    if (!result || !result.code) {
      callback(null, source);
      return;
    }

    callback(null, result.code, result.map || undefined);
  } catch (error) {
    // If transformation fails, return original source and log warning
    console.warn(
      `[@locator/webpack-loader] Failed to transform ${filePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    callback(null, source);
  }
}

export default locatorLoader;
