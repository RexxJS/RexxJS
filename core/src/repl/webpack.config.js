const path = require('path');

// Shared configuration for both builds
const sharedConfig = {
  entry: path.resolve(__dirname, 'interpreter-bundle-entry.js'),
  resolve: {
    extensions: ['.js'],
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "child_process": false,
      "vm": false,
      "https": false,
      "http": false,
      "os": false,
      "zlib": false,
      "module": false,
      "url": false,
      "stream": false,
      "buffer": false,
      "util": false
    }
  },
  target: 'web'
};

module.exports = [
  // Minified production build
  {
    ...sharedConfig,
    mode: 'production',
    output: {
      filename: 'rexxjs.bundle.min.js',
      path: path.resolve(__dirname, 'dist')
    },
    optimization: {
      minimize: true
    }
  },
  // Unminified development/debugging build
  {
    ...sharedConfig,
    mode: 'development',
    output: {
      filename: 'rexxjs.bundle.js',
      path: path.resolve(__dirname, 'dist')
    },
    optimization: {
      minimize: false
    }
  }
];
