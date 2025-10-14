const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, 'src/echo-address.js'),
  output: {
    filename: 'echo-address.bundle.js',
    path: path.resolve(__dirname, '../../../../dist/addresses'),
    library: 'EchoAddress',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  target: 'web',
  optimization: {
    minimize: true
  }
};
