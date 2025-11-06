const path = require('path');
const { execSync } = require('child_process');

function getGitRoot() {
    try {
        const gitRoot = execSync('git rev-parse --show-toplevel')
            .toString()
            .trim();
        return gitRoot;
    } catch (error) {
        throw new Error('Not in a git repository');
    }
}

module.exports = {
  entry: './src/cli.js',
  output: {
    path: path.resolve(getGitRoot(), '../dist'),
    filename: 'rexx.js',
    library: 'rexxjs',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  mode: 'production',
  resolve: {
    fallback: {
      // Disable Node.js polyfills for crypto since we handle it manually
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "path": false,
      "fs": false,
      "vm": false,
      "https": false,
      "module": false,
      "os": false,
      "zlib": false,
      "child_process": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};