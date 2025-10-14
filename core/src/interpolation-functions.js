/**
 * Interpolation Configuration Functions for REXX
 * Exposes interpolation pattern control to REXX scripts
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const {
  setInterpolationPattern
} = require('./interpolation');

const interpolationFunctions = {
  /**
   * SET_INTERPOLATION - Set the global interpolation pattern
   *
   * Usage:
   *   SET_INTERPOLATION('handlebars')  -- {{var}}
   *   SET_INTERPOLATION('shell')       -- ${var}
   *   SET_INTERPOLATION('batch')       -- %var%
   *   SET_INTERPOLATION('{{v}}')       -- Pattern example
   *   SET_INTERPOLATION('{v}')         -- Custom pattern
   *
   * Returns: Pattern name that was set
   */
  'SET_INTERPOLATION': (patternNameOrExample) => {
    if (!patternNameOrExample || typeof patternNameOrExample !== 'string') {
      throw new Error('SET_INTERPOLATION requires a pattern name or example');
    }

    const pattern = setInterpolationPattern(patternNameOrExample);
    return pattern.name;
  }
};

module.exports = interpolationFunctions;
