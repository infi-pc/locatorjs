const path = require('path');

module.exports = {
  plugins: [
    'postcss-preset-env',
    require('@pandacss/dev/postcss')({
      configPath: path.join(__dirname, 'panda.config.ts'),
    }),
  ],
};
