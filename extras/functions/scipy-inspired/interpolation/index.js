/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const spInterpolationFunctions = require('./src/sp-interpolation-functions');

const interpolationFunctions = {
  ...spInterpolationFunctions.spInterpolationFunctions
};

function SCIPY_INTERPOLATION_MAIN() {
  return {
    type: 'function-library',
    name: 'SciPy Interpolation Functions',
    version: '1.0.0',
    provides: {
      functions: Object.keys(interpolationFunctions),
      categories: ['interpolation', 'spline', 'numerical', 'scientific-computing']
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...interpolationFunctions,
    SCIPY_INTERPOLATION_MAIN
  };
} else if (typeof window !== 'undefined') {
  Object.assign(window, interpolationFunctions);
  window.SCIPY_INTERPOLATION_MAIN = SCIPY_INTERPOLATION_MAIN;
}