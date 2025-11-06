/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const path = require('path');
const { execSync } = require('child_process');
const TerserPlugin = require('terser-webpack-plugin');

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
  entry: './src/pyodide-address.js',
  output: {
    path: path.resolve(getGitRoot(), '../dist/addresses'),
    filename: 'pyodide-address.js',
    library: 'pyodideAddress',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: 'typeof self !== "undefined" ? self : this'
  },
  target: 'web',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  externals: [
    // Exclude all pyodide-related modules from bundling
    function({ context, request }, callback) {
      if (/^pyodide/.test(request)) {
        // Externalize any pyodide-related imports
        return callback(null, 'window');
      }
      callback();
    },
    {
      // Pyodide should be loaded separately - use global window object
      'pyodide': {
        commonjs: 'pyodide',
        commonjs2: 'pyodide', 
        amd: 'pyodide',
        root: ['window'] // Access as window object, not specific pyodide global
      }
    }
  ],
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Preserve function names for RexxJS detection
          keep_fnames: /.*_META$/,
          mangle: {
            // Don't mangle critical property names
            reserved: [
              'dependencies', 'peerDependencies', 'optionalDependencies',
              'type', 'module', 'name', 'version', 'loaded', 'functions',
              'pyodide-address', 'PYODIDE_ADDRESS_META', 'ADDRESS_PYODIDE_HANDLER', 'ADDRESS_PYODIDE_METHODS'
            ]
          },
          compress: {
            // Preserve function calls that return metadata
            pure_funcs: []
          },
          format: {
            // CRITICAL: Preserve /*! */ comments (jQuery-style) with @rexxjs-meta
            comments: /^\\*!|@preserve|@license|@cc_on|@rexxjs-meta/i
          }
        },
        extractComments: false // Keep comments in main file
      })
    ]
  },
  resolve: {
    fallback: {
      // Provide fallbacks for Node.js modules in browser
      "buffer": false,
      "crypto": false,
      "fs": false,
      "path": false,
      "stream": false,
      "util": false
    }
  },
  module: {
    rules: [
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['> 1%', 'last 2 versions'],
                  node: '14'
                }
              }]
            ]
          }
        }
      }
    ]
  },
  plugins: [],
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map'
};
