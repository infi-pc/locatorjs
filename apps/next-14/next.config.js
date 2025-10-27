/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      // only tsx files, we don't need to track other files
      test: /\.tsx?$/,
      use: [
        { loader: "@locator/webpack-loader", options: { env: "development" } },
      ],
    })
    return config
  },
}

module.exports = nextConfig
