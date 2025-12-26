const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/windows-automation-address.js',
  output: {
    filename: 'windows-automation-address.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'WindowsAutomationAddress',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'typeof self !== "undefined" ? self : this',
  },
  target: ['web', 'node'],
  optimization: {
    minimize: true,
  },
};
