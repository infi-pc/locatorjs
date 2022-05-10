const webpack = require('webpack'),
  path = require('path');

const options = {
  mode: process.env.NODE_ENV || 'production',
  entry: path.join(__dirname, 'src', 'pages', 'Client', 'index.ts'),
  output: {
    path: path.resolve(__dirname, 'src', 'pages', 'Content', 'generated'),
    filename: 'client.bundle.js',
    clean: true,
  },
  module: {
    rules: [
      // {
      //   test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
      //   loader: 'file-loader',
      //   options: {
      //     name: '[name].[ext]',
      //   },
      //   exclude: /node_modules/,
      // },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  // plugins: [new webpack.EnvironmentPlugin(['NODE_ENV'])],
  // infrastructureLogging: {
  //   level: 'info',
  // },
};

// if (env.NODE_ENV === 'development') {
//   options.devtool = 'cheap-module-source-map';
// } else {
//   options.optimization = {
//     minimize: true,
//     minimizer: [
//       new TerserPlugin({
//         extractComments: false,
//       }),
//     ],
//   };
// }

module.exports = options;
