import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.[jt]sx$/,
      exclude: /node_modules/,
      use: {
        loader: "@locator/webpack-loader",
        options: { env: "development" },
      },
    });
    return config;
  },
};

export default nextConfig;
