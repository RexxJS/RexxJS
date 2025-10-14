/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const rGraphicsFunctions = require('./src/graphics-functions');

const graphicsFunctions = {
  ...rGraphicsFunctions
};

function GRAPHICS_MAIN() {
  return {
    type: 'function-library',
    name: 'R Graphics Functions',
    version: '1.0.0',
    provides: {
      functions: Object.keys(graphicsFunctions),
      categories: ['graphics', 'visualization', 'plotting', 'charts', 'statistical-plots']
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...graphicsFunctions,
    GRAPHICS_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, graphicsFunctions);
  window.GRAPHICS_MAIN = GRAPHICS_MAIN;
}