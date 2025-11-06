'use strict';

/**
 * Built-in function initialization for REXX interpreter
 *
 * This module provides browser/Node.js compatible functions for initializing
 * the built-in functions available in the REXX interpreter.
 */

// Import dependencies for builtin functions
const variableStackUtils = require('./interpreter-variable-stack');
const {
  getFunctionInfo,
  getFunctionsByCategory,
  getFunctionsByModule,
  getAllModules,
  getAllCategories,
  getFunctionCount
} = require('./function-metadata-registry');

/**
 * Initialize all built-in functions for the REXX interpreter
 * @param {Object} interpreter - The interpreter instance (`this`)
 * @returns {Object} Object containing all built-in functions
 */
function initializeBuiltInFunctions() {
  const interpreter = this; // Capture interpreter context

  // Import external function modules
  let importedStringFunctions = {};
  let importedMathFunctions = {};
  let importedJsonFunctions = {};
  let importedArrayFunctions = {};
  let importedDateTimeFunctions = {};
  let importedUrlFunctions = {};
  let importedRandomFunctions = {};
  let importedRegexFunctions = {};
  let importedValidationFunctions = {};
  let importedFileFunctions = {};
  let importedPathFunctions = {};
  let importedHttpFunctions = {};
  let importedStatisticsFunctions = {};
  let importedLogicFunctions = {};
  let importedCryptoFunctions = {};
  let importedDomFunctions = {};
  let importedDomOperations = {};
  let importedDomPipelineFunctions = {};
  let importedDataFunctions = {};
  let importedProbabilityFunctions = {};
  let importedShellFunctions = {};
  let importedInterpolationFunctions = {};
  // Sibling parameter converter functions for unified parameter model
  let UPPER_positional_args_to_named_param_map = null;
  let LOWER_positional_args_to_named_param_map = null;
  let TRIM_positional_args_to_named_param_map = null;
  let LEFT_positional_args_to_named_param_map = null;
  let RIGHT_positional_args_to_named_param_map = null;
  let STRIP_positional_args_to_named_param_map = null;
  let REPLACE_positional_args_to_named_param_map = null;
  let INDEX_positional_args_to_named_param_map = null;
  let SUBSTR_positional_args_to_named_param_map = null;
  let PASTE_positional_args_to_named_param_map = null;
  let ELEMENT_positional_args_to_named_param_map = null;
  let PATH_JOIN_positional_args_to_named_param_map = null;
  let SHUF_positional_args_to_named_param_map = null;
  let CUT_positional_args_to_named_param_map = null;
  let ABS_positional_args_to_named_param_map = null;
  let MAX_positional_args_to_named_param_map = null;
  let MIN_positional_args_to_named_param_map = null;
  let MATH_CEIL_positional_args_to_named_param_map = null;
  let MATH_FLOOR_positional_args_to_named_param_map = null;
  let MATH_ROUND_positional_args_to_named_param_map = null;
  let MATH_SQRT_positional_args_to_named_param_map = null;
  let MATH_AVERAGE_positional_args_to_named_param_map = null;
  let MATH_SUM_positional_args_to_named_param_map = null;
  let MATH_POWER_positional_args_to_named_param_map = null;
  let ARRAY_GET_positional_args_to_named_param_map = null;
  let ARRAY_SET_positional_args_to_named_param_map = null;
  let ARRAY_LENGTH_positional_args_to_named_param_map = null;
  let ARRAY_FILTER_positional_args_to_named_param_map = null;
  let ARRAY_SORT_positional_args_to_named_param_map = null;
  let ARRAY_FIND_positional_args_to_named_param_map = null;
  let ARRAY_MAP_positional_args_to_named_param_map = null;
  let ARRAY_JOIN_positional_args_to_named_param_map = null;
  let ARRAY_CONCAT_positional_args_to_named_param_map = null;
  let SPLIT_positional_args_to_named_param_map = null;
  let JOIN_positional_args_to_named_param_map = null;
  let ARRAY_SLICE_positional_args_to_named_param_map = null;
  // Data function converters
  let CSV_TO_JSON_positional_args_to_named_param_map = null;
  let JSON_TO_CSV_positional_args_to_named_param_map = null;
  let XML_TO_JSON_positional_args_to_named_param_map = null;
  let DATA_FILTER_positional_args_to_named_param_map = null;
  let DATA_SORT_positional_args_to_named_param_map = null;
  let DATA_GROUP_BY_positional_args_to_named_param_map = null;
  let COPY_positional_args_to_named_param_map = null;
  // DOM pipeline function converters
  let FILTER_BY_ATTR_positional_args_to_named_param_map = null;
  let FILTER_BY_CLASS_positional_args_to_named_param_map = null;
  let GET_VALUES_positional_args_to_named_param_map = null;
  let GET_TEXT_positional_args_to_named_param_map = null;
  let GET_ATTRS_positional_args_to_named_param_map = null;
  // Additional math function converters
  let MATH_ABS_positional_args_to_named_param_map = null;
  let INT_positional_args_to_named_param_map = null;
  let MATH_MAX_positional_args_to_named_param_map = null;
  let MATH_MIN_positional_args_to_named_param_map = null;
  let MATH_ADD_positional_args_to_named_param_map = null;
  let MATH_MULTIPLY_positional_args_to_named_param_map = null;
  let MATH_LOG_positional_args_to_named_param_map = null;
  let MATH_SIN_positional_args_to_named_param_map = null;
  let MATH_COS_positional_args_to_named_param_map = null;
  let MATH_TAN_positional_args_to_named_param_map = null;
  let MATH_RANDOM_positional_args_to_named_param_map = null;
  let MATH_RANDOM_INT_positional_args_to_named_param_map = null;
  let MATH_CLAMP_positional_args_to_named_param_map = null;
  let MATH_PERCENTAGE_positional_args_to_named_param_map = null;
  let MATH_FACTORIAL_positional_args_to_named_param_map = null;
  let MATH_GCD_positional_args_to_named_param_map = null;
  let MATH_LCM_positional_args_to_named_param_map = null;
  let MATH_DISTANCE_2D_positional_args_to_named_param_map = null;
  let MATH_ANGLE_2D_positional_args_to_named_param_map = null;
  // Additional array function converters
  let ARRAY_PUSH_positional_args_to_named_param_map = null;
  let ARRAY_POP_positional_args_to_named_param_map = null;
  let ARRAY_SHIFT_positional_args_to_named_param_map = null;
  let ARRAY_UNSHIFT_positional_args_to_named_param_map = null;
  let ARRAY_REVERSE_positional_args_to_named_param_map = null;
  let ARRAY_INCLUDES_positional_args_to_named_param_map = null;
  let ARRAY_INDEXOF_positional_args_to_named_param_map = null;
  let ARRAY_MIN_positional_args_to_named_param_map = null;
  let ARRAY_MAX_positional_args_to_named_param_map = null;
  let ARRAY_SUM_positional_args_to_named_param_map = null;
  let ARRAY_AVERAGE_positional_args_to_named_param_map = null;
  let ARRAY_UNIQUE_positional_args_to_named_param_map = null;
  let ARRAY_FLATTEN_positional_args_to_named_param_map = null;
  let SELECT_positional_args_to_named_param_map = null;
  let GROUP_BY_positional_args_to_named_param_map = null;
  let DISTINCT_positional_args_to_named_param_map = null;
  let ARRAY_REDUCE_positional_args_to_named_param_map = null;
  let SUMMARY_positional_args_to_named_param_map = null;
  let REGRESSION_positional_args_to_named_param_map = null;
  let FORECAST_positional_args_to_named_param_map = null;
  let CORRELATION_MATRIX_positional_args_to_named_param_map = null;
  let MAP_positional_args_to_named_param_map = null;
  let FILTER_positional_args_to_named_param_map = null;
  let REDUCE_positional_args_to_named_param_map = null;
  // Additional string function converters
  let LENGTH_positional_args_to_named_param_map = null;
  let POS_positional_args_to_named_param_map = null;
  let ABBREV_positional_args_to_named_param_map = null;
  let TRIM_START_positional_args_to_named_param_map = null;
  let TRIM_END_positional_args_to_named_param_map = null;
  let REVERSE_positional_args_to_named_param_map = null;
  let SPACE_positional_args_to_named_param_map = null;
  let WORD_positional_args_to_named_param_map = null;
  let WORDS_positional_args_to_named_param_map = null;
  let WORDPOS_positional_args_to_named_param_map = null;
  let DELWORD_positional_args_to_named_param_map = null;
  let SUBWORD_positional_args_to_named_param_map = null;
  let INDEXOF_positional_args_to_named_param_map = null;
  let INCLUDES_positional_args_to_named_param_map = null;
  let STARTS_WITH_positional_args_to_named_param_map = null;
  let ENDS_WITH_positional_args_to_named_param_map = null;
  let REPEAT_positional_args_to_named_param_map = null;
  let COPIES_positional_args_to_named_param_map = null;
  let PAD_START_positional_args_to_named_param_map = null;
  let PAD_END_positional_args_to_named_param_map = null;
  let TRANSLATE_positional_args_to_named_param_map = null;
  let VERIFY_positional_args_to_named_param_map = null;
  let SUBSTRING_positional_args_to_named_param_map = null;
  let CENTER_positional_args_to_named_param_map = null;
  let SLUG_positional_args_to_named_param_map = null;
  let WORD_FREQUENCY_positional_args_to_named_param_map = null;
  let SENTIMENT_ANALYSIS_positional_args_to_named_param_map = null;
  let EXTRACT_KEYWORDS_positional_args_to_named_param_map = null;
  // R functions, DIFF, SED, and other @extras functions - use REQUIRE statements to load them
  try {
    if (typeof require !== 'undefined') {
      // command line mode (NodeJs) is allowed to use require() but the two web modes are not.
      // All these are co-located with interpreter.js in the main RexxJS project, we should
      // auto-load them if so (provisional decision).
      const { stringFunctions, UPPER_positional_args_to_named_param_map, LOWER_positional_args_to_named_param_map, TRIM_positional_args_to_named_param_map, LEFT_positional_args_to_named_param_map, RIGHT_positional_args_to_named_param_map, STRIP_positional_args_to_named_param_map, REPLACE_positional_args_to_named_param_map, INDEX_positional_args_to_named_param_map, LENGTH_positional_args_to_named_param_map, POS_positional_args_to_named_param_map, ABBREV_positional_args_to_named_param_map, TRIM_START_positional_args_to_named_param_map, TRIM_END_positional_args_to_named_param_map, REVERSE_positional_args_to_named_param_map, SPACE_positional_args_to_named_param_map, WORD_positional_args_to_named_param_map, WORDS_positional_args_to_named_param_map, WORDPOS_positional_args_to_named_param_map, DELWORD_positional_args_to_named_param_map, SUBWORD_positional_args_to_named_param_map, INDEXOF_positional_args_to_named_param_map, INCLUDES_positional_args_to_named_param_map, STARTS_WITH_positional_args_to_named_param_map, ENDS_WITH_positional_args_to_named_param_map, REPEAT_positional_args_to_named_param_map, COPIES_positional_args_to_named_param_map, PAD_START_positional_args_to_named_param_map, PAD_END_positional_args_to_named_param_map, TRANSLATE_positional_args_to_named_param_map, VERIFY_positional_args_to_named_param_map, SUBSTRING_positional_args_to_named_param_map, CENTER_positional_args_to_named_param_map, SLUG_positional_args_to_named_param_map, WORD_FREQUENCY_positional_args_to_named_param_map, SENTIMENT_ANALYSIS_positional_args_to_named_param_map, EXTRACT_KEYWORDS_positional_args_to_named_param_map, SUBSTR_positional_args_to_named_param_map } = require('./string-functions');
      const { mathFunctions, ABS_positional_args_to_named_param_map, MAX_positional_args_to_named_param_map, MIN_positional_args_to_named_param_map, MATH_CEIL_positional_args_to_named_param_map, MATH_FLOOR_positional_args_to_named_param_map, MATH_ROUND_positional_args_to_named_param_map, MATH_SQRT_positional_args_to_named_param_map, MATH_AVERAGE_positional_args_to_named_param_map, MATH_SUM_positional_args_to_named_param_map, MATH_POWER_positional_args_to_named_param_map, MATH_ABS_positional_args_to_named_param_map, INT_positional_args_to_named_param_map, MATH_MAX_positional_args_to_named_param_map, MATH_MIN_positional_args_to_named_param_map, MATH_ADD_positional_args_to_named_param_map, MATH_MULTIPLY_positional_args_to_named_param_map, MATH_LOG_positional_args_to_named_param_map, MATH_SIN_positional_args_to_named_param_map, MATH_COS_positional_args_to_named_param_map, MATH_TAN_positional_args_to_named_param_map, MATH_RANDOM_positional_args_to_named_param_map, MATH_RANDOM_INT_positional_args_to_named_param_map, MATH_CLAMP_positional_args_to_named_param_map, MATH_PERCENTAGE_positional_args_to_named_param_map, MATH_FACTORIAL_positional_args_to_named_param_map, MATH_GCD_positional_args_to_named_param_map, MATH_LCM_positional_args_to_named_param_map, MATH_DISTANCE_2D_positional_args_to_named_param_map, MATH_ANGLE_2D_positional_args_to_named_param_map } = require('./math-functions');
      const { jsonFunctions } = require('./json-functions');
      const { arrayFunctions, ARRAY_GET_positional_args_to_named_param_map, ARRAY_SET_positional_args_to_named_param_map, ARRAY_LENGTH_positional_args_to_named_param_map, ARRAY_FILTER_positional_args_to_named_param_map, ARRAY_SORT_positional_args_to_named_param_map, ARRAY_FIND_positional_args_to_named_param_map, ARRAY_MAP_positional_args_to_named_param_map, ARRAY_JOIN_positional_args_to_named_param_map, ARRAY_CONCAT_positional_args_to_named_param_map, SPLIT_positional_args_to_named_param_map, JOIN_positional_args_to_named_param_map, ARRAY_SLICE_positional_args_to_named_param_map, ARRAY_PUSH_positional_args_to_named_param_map, ARRAY_POP_positional_args_to_named_param_map, ARRAY_SHIFT_positional_args_to_named_param_map, ARRAY_UNSHIFT_positional_args_to_named_param_map, ARRAY_REVERSE_positional_args_to_named_param_map, ARRAY_INCLUDES_positional_args_to_named_param_map, ARRAY_INDEXOF_positional_args_to_named_param_map, ARRAY_MIN_positional_args_to_named_param_map, ARRAY_MAX_positional_args_to_named_param_map, ARRAY_SUM_positional_args_to_named_param_map, ARRAY_AVERAGE_positional_args_to_named_param_map, ARRAY_UNIQUE_positional_args_to_named_param_map, ARRAY_FLATTEN_positional_args_to_named_param_map, SELECT_positional_args_to_named_param_map, GROUP_BY_positional_args_to_named_param_map, DISTINCT_positional_args_to_named_param_map, ARRAY_REDUCE_positional_args_to_named_param_map, SUMMARY_positional_args_to_named_param_map, REGRESSION_positional_args_to_named_param_map, FORECAST_positional_args_to_named_param_map, CORRELATION_MATRIX_positional_args_to_named_param_map, MAP_positional_args_to_named_param_map, FILTER_positional_args_to_named_param_map, REDUCE_positional_args_to_named_param_map } = require('./array-functions');
      const { dateTimeFunctions } = require('./date-time-functions');
      const { urlFunctions } = require('./url-functions');
      const { randomFunctions } = require('./random-functions');
      const { regexFunctions } = require('./regex-functions');
      const { validationFunctions } = require('./validation-functions');
      const { fileFunctions } = require('./file-functions');
      const { pathFunctions } = require('./path-functions');
      const { httpFunctions } = require('./http-functions');
      // Excel functions are loaded via REQUIRE statement in REXX scripts
      // e.g., REQUIRE "../extras/functions/excel/excel-functions"
      const { statisticsFunctions } = require('./statistics-functions');
      const { logicFunctions } = require('./logic-functions');
      const { cryptoFunctions } = require('./cryptography-functions');
      const { domFunctions, functions: domFunctionsOnly, operations: domOperations, functionMetadata: domFunctionMetadata, ELEMENT_positional_args_to_named_param_map } = require('./dom-functions');
      const { domPipelineFunctions, FILTER_BY_ATTR_positional_args_to_named_param_map, FILTER_BY_CLASS_positional_args_to_named_param_map, GET_VALUES_positional_args_to_named_param_map, GET_TEXT_positional_args_to_named_param_map, GET_ATTRS_positional_args_to_named_param_map } = require('./dom-pipeline-functions');
      const { dataFunctions, CSV_TO_JSON_positional_args_to_named_param_map, JSON_TO_CSV_positional_args_to_named_param_map, XML_TO_JSON_positional_args_to_named_param_map, DATA_FILTER_positional_args_to_named_param_map, DATA_SORT_positional_args_to_named_param_map, DATA_GROUP_BY_positional_args_to_named_param_map, COPY_positional_args_to_named_param_map } = require('./data-functions');
      const { probabilityFunctions } = require('./probability-functions');
      const shellFunctionsModule = require('./shell-functions');
      const { PASTE_positional_args_to_named_param_map, PATH_JOIN_positional_args_to_named_param_map, SHUF_positional_args_to_named_param_map, CUT_positional_args_to_named_param_map } = shellFunctionsModule;
      const shellFunctions = shellFunctionsModule;
      const interpolationFunctions = require('./interpolation-functions');

      // R functions, DIFF, SED are now available via REQUIRE statements in user scripts
      // e.g., REQUIRE "r-inspired/math-stats" to load R math functions
      importedStringFunctions = stringFunctions;
      importedMathFunctions = mathFunctions;
      importedJsonFunctions = jsonFunctions;
      importedArrayFunctions = arrayFunctions;
      importedDateTimeFunctions = dateTimeFunctions;
      importedUrlFunctions = urlFunctions;
      importedRandomFunctions = randomFunctions;
      importedRegexFunctions = regexFunctions;
      importedValidationFunctions = validationFunctions;
      importedFileFunctions = fileFunctions;
      importedPathFunctions = pathFunctions;
      importedHttpFunctions = httpFunctions;
      importedStatisticsFunctions = statisticsFunctions;
      importedLogicFunctions = logicFunctions;
      importedCryptoFunctions = cryptoFunctions;
      importedDomFunctions = domFunctionsOnly || domFunctions;  // Prefer split version, fall back to combined
      importedDomOperations = domOperations || {};
      importedDomPipelineFunctions = domPipelineFunctions;
      importedDataFunctions = dataFunctions;
      importedProbabilityFunctions = probabilityFunctions;
      importedShellFunctions = shellFunctions;
      importedInterpolationFunctions = interpolationFunctions;
      // R functions removed - use REQUIRE statements to load them
    } else if (typeof window !== 'undefined') {
      // Browser environment
      importedStringFunctions = window.stringFunctions || {};
      importedMathFunctions = window.mathFunctions || {};
      importedJsonFunctions = window.jsonFunctions || {};
      importedArrayFunctions = window.arrayFunctions || {};
      importedDateTimeFunctions = window.dateTimeFunctions || {};
      importedUrlFunctions = window.urlFunctions || {};
      importedRandomFunctions = window.randomFunctions || {};
      importedRegexFunctions = window.regexFunctions || {};
      importedValidationFunctions = window.validationFunctions || {};
      importedFileFunctions = window.fileFunctions || {};
      importedPathFunctions = window.pathFunctions || {};
      importedHttpFunctions = window.httpFunctions || {};
      importedStatisticsFunctions = window.statisticsFunctions || {};
      importedLogicFunctions = window.logicFunctions || {};
      importedCryptoFunctions = window.cryptoFunctions || {};
      importedDomFunctions = window.domFunctionsOnly || window.domFunctions || {};
      importedDomOperations = window.domOperations || {};
      importedDomPipelineFunctions = window.domPipelineFunctions || {};
      importedDataFunctions = window.dataFunctions || {};
      importedProbabilityFunctions = window.probabilityFunctions || {};
      // Sibling parameter converter functions
      UPPER_positional_args_to_named_param_map = window.UPPER_positional_args_to_named_param_map || null;
      LOWER_positional_args_to_named_param_map = window.LOWER_positional_args_to_named_param_map || null;
      TRIM_positional_args_to_named_param_map = window.TRIM_positional_args_to_named_param_map || null;
      LEFT_positional_args_to_named_param_map = window.LEFT_positional_args_to_named_param_map || null;
      RIGHT_positional_args_to_named_param_map = window.RIGHT_positional_args_to_named_param_map || null;
      STRIP_positional_args_to_named_param_map = window.STRIP_positional_args_to_named_param_map || null;
      REPLACE_positional_args_to_named_param_map = window.REPLACE_positional_args_to_named_param_map || null;
      INDEX_positional_args_to_named_param_map = window.INDEX_positional_args_to_named_param_map || null;
      SUBSTR_positional_args_to_named_param_map = window.SUBSTR_positional_args_to_named_param_map || null;
      PASTE_positional_args_to_named_param_map = window.PASTE_positional_args_to_named_param_map || null;
      ELEMENT_positional_args_to_named_param_map = window.ELEMENT_positional_args_to_named_param_map || null;
      FILTER_BY_ATTR_positional_args_to_named_param_map = window.FILTER_BY_ATTR_positional_args_to_named_param_map || null;
      FILTER_BY_CLASS_positional_args_to_named_param_map = window.FILTER_BY_CLASS_positional_args_to_named_param_map || null;
      GET_VALUES_positional_args_to_named_param_map = window.GET_VALUES_positional_args_to_named_param_map || null;
      GET_TEXT_positional_args_to_named_param_map = window.GET_TEXT_positional_args_to_named_param_map || null;
      GET_ATTRS_positional_args_to_named_param_map = window.GET_ATTRS_positional_args_to_named_param_map || null;
      PATH_JOIN_positional_args_to_named_param_map = window.PATH_JOIN_positional_args_to_named_param_map || null;
      SHUF_positional_args_to_named_param_map = window.SHUF_positional_args_to_named_param_map || null;
      CUT_positional_args_to_named_param_map = window.CUT_positional_args_to_named_param_map || null;
      ABS_positional_args_to_named_param_map = window.ABS_positional_args_to_named_param_map || null;
      MAX_positional_args_to_named_param_map = window.MAX_positional_args_to_named_param_map || null;
      MIN_positional_args_to_named_param_map = window.MIN_positional_args_to_named_param_map || null;
      MATH_CEIL_positional_args_to_named_param_map = window.MATH_CEIL_positional_args_to_named_param_map || null;
      MATH_FLOOR_positional_args_to_named_param_map = window.MATH_FLOOR_positional_args_to_named_param_map || null;
      MATH_ROUND_positional_args_to_named_param_map = window.MATH_ROUND_positional_args_to_named_param_map || null;
      MATH_SQRT_positional_args_to_named_param_map = window.MATH_SQRT_positional_args_to_named_param_map || null;
      MATH_AVERAGE_positional_args_to_named_param_map = window.MATH_AVERAGE_positional_args_to_named_param_map || null;
      MATH_SUM_positional_args_to_named_param_map = window.MATH_SUM_positional_args_to_named_param_map || null;
      MATH_POWER_positional_args_to_named_param_map = window.MATH_POWER_positional_args_to_named_param_map || null;
      ARRAY_GET_positional_args_to_named_param_map = window.ARRAY_GET_positional_args_to_named_param_map || null;
      ARRAY_SET_positional_args_to_named_param_map = window.ARRAY_SET_positional_args_to_named_param_map || null;
      ARRAY_LENGTH_positional_args_to_named_param_map = window.ARRAY_LENGTH_positional_args_to_named_param_map || null;
      ARRAY_FILTER_positional_args_to_named_param_map = window.ARRAY_FILTER_positional_args_to_named_param_map || null;
      ARRAY_SORT_positional_args_to_named_param_map = window.ARRAY_SORT_positional_args_to_named_param_map || null;
      ARRAY_FIND_positional_args_to_named_param_map = window.ARRAY_FIND_positional_args_to_named_param_map || null;
      ARRAY_MAP_positional_args_to_named_param_map = window.ARRAY_MAP_positional_args_to_named_param_map || null;
      ARRAY_JOIN_positional_args_to_named_param_map = window.ARRAY_JOIN_positional_args_to_named_param_map || null;
      ARRAY_CONCAT_positional_args_to_named_param_map = window.ARRAY_CONCAT_positional_args_to_named_param_map || null;
      SPLIT_positional_args_to_named_param_map = window.SPLIT_positional_args_to_named_param_map || null;
      JOIN_positional_args_to_named_param_map = window.JOIN_positional_args_to_named_param_map || null;
      ARRAY_SLICE_positional_args_to_named_param_map = window.ARRAY_SLICE_positional_args_to_named_param_map || null;
      // New math function converters
      MATH_ABS_positional_args_to_named_param_map = window.MATH_ABS_positional_args_to_named_param_map || null;
      INT_positional_args_to_named_param_map = window.INT_positional_args_to_named_param_map || null;
      MATH_MAX_positional_args_to_named_param_map = window.MATH_MAX_positional_args_to_named_param_map || null;
      MATH_MIN_positional_args_to_named_param_map = window.MATH_MIN_positional_args_to_named_param_map || null;
      MATH_ADD_positional_args_to_named_param_map = window.MATH_ADD_positional_args_to_named_param_map || null;
      MATH_MULTIPLY_positional_args_to_named_param_map = window.MATH_MULTIPLY_positional_args_to_named_param_map || null;
      MATH_LOG_positional_args_to_named_param_map = window.MATH_LOG_positional_args_to_named_param_map || null;
      MATH_SIN_positional_args_to_named_param_map = window.MATH_SIN_positional_args_to_named_param_map || null;
      MATH_COS_positional_args_to_named_param_map = window.MATH_COS_positional_args_to_named_param_map || null;
      MATH_TAN_positional_args_to_named_param_map = window.MATH_TAN_positional_args_to_named_param_map || null;
      MATH_RANDOM_positional_args_to_named_param_map = window.MATH_RANDOM_positional_args_to_named_param_map || null;
      MATH_RANDOM_INT_positional_args_to_named_param_map = window.MATH_RANDOM_INT_positional_args_to_named_param_map || null;
      MATH_CLAMP_positional_args_to_named_param_map = window.MATH_CLAMP_positional_args_to_named_param_map || null;
      MATH_PERCENTAGE_positional_args_to_named_param_map = window.MATH_PERCENTAGE_positional_args_to_named_param_map || null;
      MATH_FACTORIAL_positional_args_to_named_param_map = window.MATH_FACTORIAL_positional_args_to_named_param_map || null;
      MATH_GCD_positional_args_to_named_param_map = window.MATH_GCD_positional_args_to_named_param_map || null;
      MATH_LCM_positional_args_to_named_param_map = window.MATH_LCM_positional_args_to_named_param_map || null;
      MATH_DISTANCE_2D_positional_args_to_named_param_map = window.MATH_DISTANCE_2D_positional_args_to_named_param_map || null;
      MATH_ANGLE_2D_positional_args_to_named_param_map = window.MATH_ANGLE_2D_positional_args_to_named_param_map || null;
      // New array function converters
      ARRAY_PUSH_positional_args_to_named_param_map = window.ARRAY_PUSH_positional_args_to_named_param_map || null;
      ARRAY_POP_positional_args_to_named_param_map = window.ARRAY_POP_positional_args_to_named_param_map || null;
      ARRAY_SHIFT_positional_args_to_named_param_map = window.ARRAY_SHIFT_positional_args_to_named_param_map || null;
      ARRAY_UNSHIFT_positional_args_to_named_param_map = window.ARRAY_UNSHIFT_positional_args_to_named_param_map || null;
      ARRAY_REVERSE_positional_args_to_named_param_map = window.ARRAY_REVERSE_positional_args_to_named_param_map || null;
      ARRAY_INCLUDES_positional_args_to_named_param_map = window.ARRAY_INCLUDES_positional_args_to_named_param_map || null;
      ARRAY_INDEXOF_positional_args_to_named_param_map = window.ARRAY_INDEXOF_positional_args_to_named_param_map || null;
      ARRAY_MIN_positional_args_to_named_param_map = window.ARRAY_MIN_positional_args_to_named_param_map || null;
      ARRAY_MAX_positional_args_to_named_param_map = window.ARRAY_MAX_positional_args_to_named_param_map || null;
      ARRAY_SUM_positional_args_to_named_param_map = window.ARRAY_SUM_positional_args_to_named_param_map || null;
      ARRAY_AVERAGE_positional_args_to_named_param_map = window.ARRAY_AVERAGE_positional_args_to_named_param_map || null;
      ARRAY_UNIQUE_positional_args_to_named_param_map = window.ARRAY_UNIQUE_positional_args_to_named_param_map || null;
      ARRAY_FLATTEN_positional_args_to_named_param_map = window.ARRAY_FLATTEN_positional_args_to_named_param_map || null;
      SELECT_positional_args_to_named_param_map = window.SELECT_positional_args_to_named_param_map || null;
      GROUP_BY_positional_args_to_named_param_map = window.GROUP_BY_positional_args_to_named_param_map || null;
      DISTINCT_positional_args_to_named_param_map = window.DISTINCT_positional_args_to_named_param_map || null;
      ARRAY_REDUCE_positional_args_to_named_param_map = window.ARRAY_REDUCE_positional_args_to_named_param_map || null;
      SUMMARY_positional_args_to_named_param_map = window.SUMMARY_positional_args_to_named_param_map || null;
      REGRESSION_positional_args_to_named_param_map = window.REGRESSION_positional_args_to_named_param_map || null;
      FORECAST_positional_args_to_named_param_map = window.FORECAST_positional_args_to_named_param_map || null;
      CORRELATION_MATRIX_positional_args_to_named_param_map = window.CORRELATION_MATRIX_positional_args_to_named_param_map || null;
      MAP_positional_args_to_named_param_map = window.MAP_positional_args_to_named_param_map || null;
      FILTER_positional_args_to_named_param_map = window.FILTER_positional_args_to_named_param_map || null;
      REDUCE_positional_args_to_named_param_map = window.REDUCE_positional_args_to_named_param_map || null;
      // R functions removed - use REQUIRE statements to load them
    }
  } catch (e) {
    console.warn('Could not import external functions:', e.message);
  }

  // Create interpreter-aware array functions for pure-REXX callback support
  const interpreterAwareArrayFunctions = interpreter.createInterpreterAwareArrayFunctions(importedArrayFunctions);

  // Create interpreter-aware PATH_RESOLVE that uses the current script path
  const interpreterAwarePathFunctions = {
    'PATH_RESOLVE': (pathStr, contextScriptPath) => {
      // Use provided context path, or fall back to interpreter's script path
      const scriptPath = contextScriptPath || interpreter.scriptPath || null;
      return importedPathFunctions['PATH_RESOLVE'](pathStr, scriptPath);
    }
  };

  // Create interpreter-aware FILE functions that automatically resolve paths
  const interpreterAwareFileFunctions = {};
  const fileFunctionsToWrap = [
    'FILE_READ', 'FILE_WRITE', 'FILE_APPEND', 'FILE_COPY', 'FILE_MOVE',
    'FILE_DELETE', 'FILE_EXISTS', 'FILE_SIZE', 'FILE_LIST', 'FILE_BACKUP'
  ];

  for (const funcName of fileFunctionsToWrap) {
    if (importedFileFunctions[funcName]) {
      const originalFunc = importedFileFunctions[funcName];

      interpreterAwareFileFunctions[funcName] = async (...args) => {
        // Resolve path arguments (first argument is always a path, some functions have 2 paths)
        const resolvedArgs = [...args];

        // Helper to check if a path needs resolution
        // Only resolve root: and cwd: prefixes for FILE_* functions
        // Let ./  and ../ be handled by file-functions.js as before
        const needsResolution = (path) => {
          if (typeof path !== 'string') return false;
          return path.startsWith('root:') || path.startsWith('cwd:');
        };

        // Resolve first path argument
        if (args.length > 0 && needsResolution(args[0])) {
          try {
            const { resolvePath } = require('./path-resolver');
            resolvedArgs[0] = resolvePath(args[0], interpreter.scriptPath);
          } catch (error) {
            throw new Error(`${funcName} path resolution failed: ${error.message}`);
          }
        }

        // For FILE_COPY and FILE_MOVE, also resolve second path (destination)
        if ((funcName === 'FILE_COPY' || funcName === 'FILE_MOVE') && args.length > 1 && needsResolution(args[1])) {
          try {
            const { resolvePath } = require('./path-resolver');
            resolvedArgs[1] = resolvePath(args[1], interpreter.scriptPath);
          } catch (error) {
            throw new Error(`${funcName} destination path resolution failed: ${error.message}`);
          }
        }

        return await originalFunc(...resolvedArgs);
      };
    }
  }

  // Create interpreter-aware DOM functions that bind interpreter context
  const interpreterAwareDomFunctions = {};
  for (const funcName of Object.keys(importedDomFunctions)) {
    if (typeof importedDomFunctions[funcName] === 'function') {
      interpreterAwareDomFunctions[funcName] = importedDomFunctions[funcName].bind(interpreter);
    }
  }

  const builtIns = {
    // Import external functions
    ...importedStringFunctions,
    // Sibling parameter converter functions for unified parameter model
    UPPER_positional_args_to_named_param_map,
    LOWER_positional_args_to_named_param_map,
    TRIM_positional_args_to_named_param_map,
    LEFT_positional_args_to_named_param_map,
    RIGHT_positional_args_to_named_param_map,
    STRIP_positional_args_to_named_param_map,
    REPLACE_positional_args_to_named_param_map,
    INDEX_positional_args_to_named_param_map,
    SUBSTR_positional_args_to_named_param_map,
    PASTE_positional_args_to_named_param_map,
    ELEMENT_positional_args_to_named_param_map,
    FILTER_BY_ATTR_positional_args_to_named_param_map,
    FILTER_BY_CLASS_positional_args_to_named_param_map,
    GET_VALUES_positional_args_to_named_param_map,
    GET_TEXT_positional_args_to_named_param_map,
    GET_ATTRS_positional_args_to_named_param_map,
    PATH_JOIN_positional_args_to_named_param_map,
    SHUF_positional_args_to_named_param_map,
    CUT_positional_args_to_named_param_map,
    ABS_positional_args_to_named_param_map,
    MAX_positional_args_to_named_param_map,
    MIN_positional_args_to_named_param_map,
    MATH_CEIL_positional_args_to_named_param_map,
    MATH_FLOOR_positional_args_to_named_param_map,
    MATH_ROUND_positional_args_to_named_param_map,
    MATH_SQRT_positional_args_to_named_param_map,
    MATH_AVERAGE_positional_args_to_named_param_map,
    MATH_SUM_positional_args_to_named_param_map,
    MATH_POWER_positional_args_to_named_param_map,
    ARRAY_GET_positional_args_to_named_param_map,
    ARRAY_SET_positional_args_to_named_param_map,
    ARRAY_LENGTH_positional_args_to_named_param_map,
    ARRAY_FILTER_positional_args_to_named_param_map,
    ARRAY_SORT_positional_args_to_named_param_map,
    ARRAY_FIND_positional_args_to_named_param_map,
    ARRAY_MAP_positional_args_to_named_param_map,
    ARRAY_JOIN_positional_args_to_named_param_map,
    ARRAY_CONCAT_positional_args_to_named_param_map,
    SPLIT_positional_args_to_named_param_map,
    JOIN_positional_args_to_named_param_map,
    ARRAY_SLICE_positional_args_to_named_param_map,
    CSV_TO_JSON_positional_args_to_named_param_map,
    JSON_TO_CSV_positional_args_to_named_param_map,
    XML_TO_JSON_positional_args_to_named_param_map,
    DATA_FILTER_positional_args_to_named_param_map,
    DATA_SORT_positional_args_to_named_param_map,
    DATA_GROUP_BY_positional_args_to_named_param_map,
    COPY_positional_args_to_named_param_map,
    // New math function converters
    MATH_ABS_positional_args_to_named_param_map,
    INT_positional_args_to_named_param_map,
    MATH_MAX_positional_args_to_named_param_map,
    MATH_MIN_positional_args_to_named_param_map,
    MATH_ADD_positional_args_to_named_param_map,
    MATH_MULTIPLY_positional_args_to_named_param_map,
    MATH_LOG_positional_args_to_named_param_map,
    MATH_SIN_positional_args_to_named_param_map,
    MATH_COS_positional_args_to_named_param_map,
    MATH_TAN_positional_args_to_named_param_map,
    MATH_RANDOM_positional_args_to_named_param_map,
    MATH_RANDOM_INT_positional_args_to_named_param_map,
    MATH_CLAMP_positional_args_to_named_param_map,
    MATH_PERCENTAGE_positional_args_to_named_param_map,
    MATH_FACTORIAL_positional_args_to_named_param_map,
    MATH_GCD_positional_args_to_named_param_map,
    MATH_LCM_positional_args_to_named_param_map,
    MATH_DISTANCE_2D_positional_args_to_named_param_map,
    MATH_ANGLE_2D_positional_args_to_named_param_map,
    // New array function converters
    ARRAY_PUSH_positional_args_to_named_param_map,
    ARRAY_POP_positional_args_to_named_param_map,
    ARRAY_SHIFT_positional_args_to_named_param_map,
    ARRAY_UNSHIFT_positional_args_to_named_param_map,
    ARRAY_REVERSE_positional_args_to_named_param_map,
    ARRAY_INCLUDES_positional_args_to_named_param_map,
    ARRAY_INDEXOF_positional_args_to_named_param_map,
    ARRAY_MIN_positional_args_to_named_param_map,
    ARRAY_MAX_positional_args_to_named_param_map,
    ARRAY_SUM_positional_args_to_named_param_map,
    ARRAY_AVERAGE_positional_args_to_named_param_map,
    ARRAY_UNIQUE_positional_args_to_named_param_map,
    ARRAY_FLATTEN_positional_args_to_named_param_map,
    SELECT_positional_args_to_named_param_map,
    GROUP_BY_positional_args_to_named_param_map,
    DISTINCT_positional_args_to_named_param_map,
    ARRAY_REDUCE_positional_args_to_named_param_map,
    SUMMARY_positional_args_to_named_param_map,
    REGRESSION_positional_args_to_named_param_map,
    FORECAST_positional_args_to_named_param_map,
    CORRELATION_MATRIX_positional_args_to_named_param_map,
    MAP_positional_args_to_named_param_map,
    FILTER_positional_args_to_named_param_map,
    REDUCE_positional_args_to_named_param_map,
    LENGTH_positional_args_to_named_param_map,
    POS_positional_args_to_named_param_map,
    ABBREV_positional_args_to_named_param_map,
    TRIM_START_positional_args_to_named_param_map,
    TRIM_END_positional_args_to_named_param_map,
    REVERSE_positional_args_to_named_param_map,
    SPACE_positional_args_to_named_param_map,
    WORD_positional_args_to_named_param_map,
    WORDS_positional_args_to_named_param_map,
    WORDPOS_positional_args_to_named_param_map,
    DELWORD_positional_args_to_named_param_map,
    SUBWORD_positional_args_to_named_param_map,
    INDEXOF_positional_args_to_named_param_map,
    INCLUDES_positional_args_to_named_param_map,
    STARTS_WITH_positional_args_to_named_param_map,
    ENDS_WITH_positional_args_to_named_param_map,
    REPEAT_positional_args_to_named_param_map,
    COPIES_positional_args_to_named_param_map,
    PAD_START_positional_args_to_named_param_map,
    PAD_END_positional_args_to_named_param_map,
    TRANSLATE_positional_args_to_named_param_map,
    VERIFY_positional_args_to_named_param_map,
    SUBSTRING_positional_args_to_named_param_map,
    CENTER_positional_args_to_named_param_map,
    SLUG_positional_args_to_named_param_map,
    WORD_FREQUENCY_positional_args_to_named_param_map,
    SENTIMENT_ANALYSIS_positional_args_to_named_param_map,
    EXTRACT_KEYWORDS_positional_args_to_named_param_map,
    ...importedMathFunctions,
    ...importedJsonFunctions,
    ...interpreterAwareArrayFunctions,
    ...importedDateTimeFunctions,
    ...importedUrlFunctions,
    ...importedRandomFunctions,
    ...importedRegexFunctions,
    ...importedValidationFunctions,
    ...interpreterAwareFileFunctions,
    ...interpreterAwarePathFunctions,
    ...importedHttpFunctions,
    ...importedStatisticsFunctions,
    ...importedLogicFunctions,
    ...importedCryptoFunctions,
    ...interpreterAwareDomFunctions,  // DOM functions now part of main function set
    ...importedDomPipelineFunctions,  // DOM pipeline functions for filtering and extraction
    ...importedDataFunctions,
    ...importedProbabilityFunctions,
    ...importedShellFunctions,  // Shell functions last, includes Node.js FILE_EXISTS override
    ...importedInterpolationFunctions,  // Interpolation pattern configuration functions
    // R functions, DIFF, SED - use REQUIRE statements to load them

    // Debug function for JavaScript introspection
    'JS_SHOW': (value) => {
      const output = [];
      output.push('=== JS_SHOW Debug Output ===');
      
      // Basic type info
      output.push(`Type: ${typeof value}`);
      output.push(`Constructor: ${value?.constructor?.name || 'N/A'}`);
      output.push(`String representation: ${String(value)}`);
      
      // JSON representation (if possible)
      try {
        output.push(`JSON: ${JSON.stringify(value, null, 2)}`);
      } catch (e) {
        output.push(`JSON: [Cannot stringify: ${e.message}]`);
      }
      
      // Object properties (if it's an object)
      if (typeof value === 'object' && value !== null) {
        output.push('Properties:');
        try {
          const keys = Object.keys(value);
          if (keys.length === 0) {
            output.push('  [No enumerable properties]');
          } else {
            keys.slice(0, 20).forEach(key => { // Limit to first 20 properties
              try {
                const propValue = value[key];
                const propType = typeof propValue;
                output.push(`  ${key}: (${propType}) ${String(propValue).slice(0, 100)}`);
              } catch (e) {
                output.push(`  ${key}: [Error accessing: ${e.message}]`);
              }
            });
            if (keys.length > 20) {
              output.push(`  ... and ${keys.length - 20} more properties`);
            }
          }
        } catch (e) {
          output.push(`  [Error getting properties: ${e.message}]`);
        }
        
        // Prototype chain
        try {
          const proto = Object.getPrototypeOf(value);
          output.push(`Prototype: ${proto?.constructor?.name || 'N/A'}`);
        } catch (e) {
          output.push(`Prototype: [Error: ${e.message}]`);
        }
      }
      
      // Array-like info
      if (value && typeof value.length !== 'undefined') {
        output.push(`Length: ${value.length}`);
        if (Array.isArray(value) || value.length < 10) {
          output.push('Array-like contents:');
          for (let i = 0; i < Math.min(value.length, 10); i++) {
            try {
              output.push(`  [${i}]: ${String(value[i]).slice(0, 100)}`);
            } catch (e) {
              output.push(`  [${i}]: [Error: ${e.message}]`);
            }
          }
          if (value.length > 10) {
            output.push(`  ... and ${value.length - 10} more items`);
          }
        }
      }
      
      // Function info
      if (typeof value === 'function') {
        output.push(`Function name: ${value.name || '[anonymous]'}`);
        output.push(`Function length (arity): ${value.length}`);
        const funcStr = value.toString();
        output.push(`Function source: ${funcStr.slice(0, 200)}${funcStr.length > 200 ? '...' : ''}`);
      }
      
      output.push('=== End JS_SHOW ===');
      
      // Console output for immediate visibility
      console.log(output.join('\n'));
      
      // Return the formatted output as a string for REXX
      return output.join('\n');
    },
    
    'TYPEOF': (value) => {
      return typeof value;
    },

    // Environment variable access
    'GETENV': (varName) => {
      // Access OS environment variables from process.env
      // Returns empty string if not found (REXX convention)
      if (typeof process !== 'undefined' && process.env) {
        return process.env[varName] || '';
      }
      // In browser environment, no process.env access
      return '';
    },

    'BASE64_ENCODE': (string) => {
      try {
        // In browser environment, use btoa; in Node.js, use Buffer
        if (typeof btoa !== 'undefined') {
          return btoa(string);
        } else if (typeof Buffer !== 'undefined') {
          return Buffer.from(string, 'utf8').toString('base64');
        } else {
          // Fallback - basic base64 implementation
          return basicBase64Encode(string);
        }
      } catch (e) {
        return '';
      }
    },
    
    'BASE64_DECODE': (string) => {
      try {
        // In browser environment, use atob; in Node.js, use Buffer
        if (typeof atob !== 'undefined') {
          return atob(string);
        } else if (typeof Buffer !== 'undefined') {
          return Buffer.from(string, 'base64').toString('utf8');
        } else {
          // Fallback - basic base64 implementation
          return basicBase64Decode(string);
        }
      } catch (e) {
        return '';
      }
    },

    // Error Context Functions - Available only within error handlers after SIGNAL ON ERROR
    'ERROR_LINE': () => {
      return interpreter.errorContext?.line || 0;
    },

    'ERROR_MESSAGE': () => {
      return interpreter.errorContext?.message || '';
    },

    'ERROR_STACK': () => {
      return interpreter.errorContext?.stack || '';
    },

    'ERROR_FUNCTION': () => {
      return interpreter.errorContext?.functionName || 'Unknown';
    },

    'ERROR_COMMAND': () => {
      return interpreter.errorContext?.commandText || '';
    },

    'ERROR_VARIABLES': () => {
      if (!interpreter.errorContext?.variables) {
        return '{}';
      }
      
      const vars = {};
      for (const [key, value] of interpreter.errorContext.variables) {
        vars[key] = value;
      }
      return JSON.stringify(vars);
    },

    'ERROR_TIMESTAMP': () => {
      return interpreter.errorContext?.timestamp || '';
    },

    'ERROR_DETAILS': () => {
      if (!interpreter.errorContext) {
        return '{}';
      }
      
      return JSON.stringify({
        line: interpreter.errorContext.line,
        message: interpreter.errorContext.message,
        function: interpreter.errorContext.functionName,
        command: interpreter.errorContext.commandText,
        timestamp: interpreter.errorContext.timestamp,
        hasStack: !!interpreter.errorContext.stack
      });
    },
    
    // Dynamic Rexx execution
    'INTERPRET': async (rexxCode, options = {}) => {
      // Check if INTERPRET is blocked by NO-INTERPRET
      if (interpreter.interpretBlocked) {
        throw new Error('INTERPRET is blocked by NO-INTERPRET directive');
      }
      
      try {
        // Parse options
        const opts = typeof options === 'string' ? JSON.parse(options) : options;
        const shareVars = opts.shareVars !== false; // Default to true for compatibility
        const allowedVars = opts.allowedVars || null; // null means all vars
        
        // Convert escaped newlines to actual newlines
        const normalizedCode = String(rexxCode).replace(/\\n/g, '\n');
        
        // Import parser to compile the Rexx code
        const { parse } = require('./parser');
        const commands = parse(normalizedCode);
        
        // Create new interpreter instance for isolated execution
        const RexxInterpreter = require('./interpreter').RexxInterpreter;
        const subInterpreter = new RexxInterpreter(interpreter.addressSender, interpreter.outputHandler);
        
        // Share the same address context
        subInterpreter.address = interpreter.address;

        // Share the same built-in functions, operations, and error handling state
        subInterpreter.builtInFunctions = interpreter.builtInFunctions;
        subInterpreter.operations = interpreter.operations;
        subInterpreter.errorHandlers = new Map(interpreter.errorHandlers);
        subInterpreter.labels = new Map(interpreter.labels);
        subInterpreter.subroutines = new Map(interpreter.subroutines);
        
        // Handle variable sharing
        if (shareVars) {
          if (allowedVars === null) {
            // Share all variables (classic Rexx behavior)
            for (const [key, value] of interpreter.variables) {
              subInterpreter.variables.set(key, value);
            }
          } else if (Array.isArray(allowedVars)) {
            // Share only whitelisted variables
            for (const varName of allowedVars) {
              if (interpreter.variables.has(varName)) {
                subInterpreter.variables.set(varName, interpreter.variables.get(varName));
              }
            }
          }
        }
        
        // Execute the interpreted code
        await subInterpreter.run(commands);
        
        // Copy back variables from sub-interpreter if sharing enabled
        if (shareVars) {
          if (allowedVars === null) {
            // Copy back all variables
            for (const [key, value] of subInterpreter.variables) {
              interpreter.variables.set(key, value);
            }
          } else if (Array.isArray(allowedVars)) {
            // Copy back only whitelisted variables (strict whitelist mode)
            for (const varName of allowedVars) {
              if (subInterpreter.variables.has(varName)) {
                interpreter.variables.set(varName, subInterpreter.variables.get(varName));
              }
            }
          }
        }
        
        // Return success indicator
        return true;
      } catch (e) {
        throw new Error(`INTERPRET failed: ${e.message}`);
      }
    },
    
    // JavaScript execution - executes JS code in browser context
    'INTERPRET_JS': (jsCode, type = 'auto') => {
      if (typeof jsCode !== 'string') {
        throw new Error('INTERPRET_JS requires a string parameter');
      }
      
      // Check if INTERPRET is blocked by NO-INTERPRET
      if (interpreter.interpretBlocked) {
        throw new Error('INTERPRET_JS is blocked by NO-INTERPRET directive');
      }
      
      try {
        // Create variable context from Rexx variables
        const context = Object.fromEntries(interpreter.variables);
        
        // Get variable names and values for the function parameters
        // Filter out invalid variable names and convert values safely
        const varNames = [];
        const varValues = [];
        
        for (const [name, value] of Object.entries(context)) {
          // Only include valid JavaScript identifier names
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
            varNames.push(name);
            varValues.push(value);
          }
        }
        
        let result;
        const execType = (typeof type === 'string' ? type : 'auto').toLowerCase();
        
        switch (execType) {
          case 'expression':
            // Force expression mode - always wrap with return
            const exprFunc = new Function(...varNames, `return (${jsCode})`);
            result = exprFunc.call(interpreter, ...varValues);
            break;
            
          case 'statement':
            // Force statement mode - execute as-is
            const stmtFunc = new Function(...varNames, jsCode);
            result = stmtFunc.call(interpreter, ...varValues);
            break;
            
          case 'auto':
          default:
            // Try expression first, fall back to statement
            try {
              const func = new Function(...varNames, `return (${jsCode})`);
              result = func.call(interpreter, ...varValues);
            } catch (e) {
              // If expression fails, try as function body (for statements)
              try {
                const func = new Function(...varNames, jsCode);
                result = func.call(interpreter, ...varValues);
              } catch (e2) {
                // If both fail, throw the expression error (more informative)
                throw e;
              }
            }
            break;
        }
        
        return result !== undefined ? result : null;
      } catch (e) {
        throw new Error(`INTERPRET_JS failed: ${e.message}`);
      }
    },
    
    // Streaming control function for remote procedure control
    'CHECKPOINT': (...params) => {
      // If we have at least 2 parameters, set a variable with the first param as name
      if (params.length >= 2) {
        const variableName = String(params[0]);
        const variableValue = String(params[1]);
        interpreter.variables.set(variableName, variableValue);
      }
      
      // Send progress update with parameters to streaming controller
      const progressData = {
        type: 'rexx-progress',
        timestamp: Date.now(),
        variables: Object.fromEntries(interpreter.variables),
        params: params,
        line: interpreter.currentLineNumber || 0
      };
      
      // If we have a streaming callback, use it (for streaming execution mode)
      if (interpreter.streamingProgressCallback) {
        interpreter.streamingProgressCallback(progressData);
      } else if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
        // Default: send to parent window for cross-iframe communication
        window.parent.postMessage(progressData, '*');
      }
      
      // For now, return a default continue response synchronously
      // The real streaming control will be handled by the worker's override
      return {
        action: 'continue',
        message: 'Default continue response',
        timestamp: Date.now()
      };
    },

    // Graphics display command
    'SHOW': (value) => {
      // Check if value has an error (handle error case first)
      if (value && typeof value === 'object' && value.error) {
        return `Graphics error: ${value.error}`;
      }
      
      // Check if value is a valid graphics object
      if (value && typeof value === 'object' && value.type && 
          ['hist', 'scatter', 'boxplot', 'barplot', 'pie', 'qqplot', 'density', 'heatmap', 'contour', 'pairs'].includes(value.type)) {
        
        // Emit graphics event for display systems to handle
        if (interpreter.options && interpreter.options.onGraphics) {
          interpreter.options.onGraphics(value);
        }
        
        // Also emit as custom event in browser
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('rexx-graphics', { 
            detail: { 
              plotData: value,
              command: 'SHOW'
            } 
          }));
        }
        
        return `Displayed ${value.type} plot`;
      } else {
        return `SHOW: Not a graphics object (type: ${typeof value})`;
      }
    },

    // Library loading and dependency management
    'REQUIRE': async (libraryName, asClause = null) => {
      if (typeof libraryName !== 'string') {
        throw new Error('REQUIRE requires a string library name');
      }

      // Strip surrounding quotes if present (handles both single and double quotes)
      let cleanLibraryName = libraryName.replace(/^['"]|['"]$/g, '');
      let cleanAsClause = null;

      if (asClause !== null) {
        if (typeof asClause !== 'string') {
          throw new Error('AS clause must be a string');
        }
        cleanAsClause = asClause.replace(/^['"]|['"]$/g, '');
      }

      // Resolve path using path-resolver for local file paths
      // Only resolve if it looks like a file path (not a registry/npm module name)
      if (cleanLibraryName.startsWith('./') ||
          cleanLibraryName.startsWith('../') ||
          cleanLibraryName.startsWith('root:') ||
          cleanLibraryName.startsWith('cwd:') ||
          cleanLibraryName.startsWith('/') ||
          /^[A-Za-z]:[\\/]/.test(cleanLibraryName)) {
        // Use PATH_RESOLVE to get absolute path
        try {
          const { resolvePath } = require('./path-resolver');
          cleanLibraryName = resolvePath(cleanLibraryName, interpreter.scriptPath);
        } catch (error) {
          throw new Error(`REQUIRE path resolution failed: ${error.message}`);
        }
      }

      return await interpreter.requireWithDependencies(cleanLibraryName, cleanAsClause);
    },

    // Stack Operations (PUSH/PULL/QUEUE functions)
    'STACK_PUSH': (value) => {
      return variableStackUtils.stackPush(value, interpreter.stack);
    },

    'STACK_PULL': () => {
      return variableStackUtils.stackPull(interpreter.stack);
    },

    'STACK_QUEUE': (value) => {
      return variableStackUtils.stackQueue(value, interpreter.stack);
    },

    'STACK_SIZE': () => {
      return variableStackUtils.stackSize(interpreter.stack);
    },

    'STACK_PEEK': () => {
      return variableStackUtils.stackPeek(interpreter.stack);
    },

    'STACK_CLEAR': () => {
      return variableStackUtils.stackClear(interpreter.stack);
    },
    
    // Reflection functions
    'SUBROUTINES': (pattern = null) => {
      const allSubroutines = Array.from(interpreter.subroutines.keys());
      const patternStr = (pattern === null || pattern === undefined) ? null : String(pattern).trim();

      const results = allSubroutines
          .map(name => name.trim().toUpperCase())
          .filter(name => {
            if (name.length === 0) return false;
            if (patternStr === null || patternStr === '') return true;

            // Check if pattern contains regex metacharacters
            const regexChars = /[.*+?^${}()|[\]\\]/;
            if (regexChars.test(patternStr)) {
              // Treat as regex pattern (case-insensitive)
              try {
                const regex = new RegExp(patternStr, 'i');
                return regex.test(name);
              } catch (e) {
                // If regex is invalid, fall back to substring matching
                return name.includes(patternStr.toUpperCase());
              }
            } else {
              // Simple substring matching (original behavior)
              return name.includes(patternStr.toUpperCase());
            }
          });
      return results;
    },

    // ARG function - Classic REXX argument access
    // Usage:
    //   ARG()     - returns the count of arguments
    //   ARG(n)    - returns the nth argument (empty string if not found)
    //   ARG(n, 'E') - returns 1 if nth argument exists, 0 otherwise
    //   ARG(n, 'O') - returns 1 if nth argument was omitted, 0 otherwise
    'ARG': (index = null, option = null) => {
      // ARG() with no arguments returns argument count
      if (index === null || index === undefined) {
        return interpreter.argv.length;
      }

      // Convert index to number (1-based indexing)
      const n = typeof index === 'number' ? index : parseInt(String(index), 10);

      if (isNaN(n) || n < 1) {
        throw new Error(`ARG: Invalid argument index '${index}' (must be positive integer)`);
      }

      // Get the argument value from argv array (convert 1-based to 0-based)
      const argValue = interpreter.argv[n - 1];

      // ARG(n) - return argument value (empty string if not found)
      if (option === null || option === undefined) {
        return argValue !== undefined ? argValue : '';
      }

      // ARG(n, option) - check existence or omission
      const optionStr = String(option).trim().toUpperCase();

      if (optionStr === 'E') {
        // 'E' option: returns 1 if argument exists, 0 otherwise
        return argValue !== undefined ? 1 : 0;
      } else if (optionStr === 'O') {
        // 'O' option: returns 1 if nth argument was omitted (exists but empty), 0 otherwise
        // In REXX, an omitted argument is one that exists in position but has no value
        // For now, we consider an argument omitted if it's an empty string
        if (argValue === undefined) {
          return 0; // Argument doesn't exist at all
        }
        return argValue === '' ? 1 : 0;
      } else {
        throw new Error(`ARG: Invalid option '${option}' (must be 'E' or 'O')`);
      }
    },

    // SYMBOL function - Check variable definition status
    // Usage:
    //   SYMBOL('varName') - Returns 'VAR' if defined, 'LIT' if not defined, 'BAD' if invalid name
    'SYMBOL': (varName) => {
      if (typeof varName !== 'string') {
        return 'BAD';
      }

      // Strip surrounding quotes if present
      let cleanVarName = varName.replace(/^['"]|['"]$/g, '');

      // Check if it's a valid REXX variable name
      // Valid names start with letter or underscore, contain letters, digits, underscores, and periods
      if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(cleanVarName)) {
        return 'BAD';
      }

      // Check if variable is defined in the interpreter's variable map
      if (interpreter.variables.has(cleanVarName)) {
        return 'VAR';  // Variable is defined
      } else {
        return 'LIT';  // Variable is not defined (treat as literal)
      }
    },

    INFO: (functionName) => {
      const info = getFunctionInfo(functionName);
      if (!info) {
        return {
          error: `Function '${functionName}' not found in metadata registry`,
          hint: `Use FUNCTIONS() to list all available functions`
        };
      }

      // Return formatted metadata as a REXX stem array
      return {
        0: 6, // Number of properties
        1: info.module,
        2: info.category,
        3: info.description,
        4: JSON.stringify(info.parameters),
        5: info.returns,
        6: JSON.stringify(info.examples || [])
      };
    },

    FUNCTIONS: (...args) => {
      const arg = args[0];

      if (!arg) {
        // No arguments: list all functions grouped by module
        const byModule = getFunctionsByModule();
        const modules = getAllModules();

        let result = { 0: modules.length };
        modules.forEach((mod, index) => {
          result[index + 1] = `${mod}: ${byModule[mod].join(', ')}`;
        });
        return result;
      }

      const query = String(arg).trim();
      const queryUpper = query.toUpperCase();
      const queryLower = query.toLowerCase();

      // Check if it's a specific function name (case-insensitive)
      const info = getFunctionInfo(query);
      if (info) {
        // Return metadata for specific function
        return {
          0: 1,
          1: `${info.module} - ${info.category}: ${info.description}`
        };
      }

      // Try as category (case-insensitive lookup)
      const allCategories = getAllCategories();
      const matchingCategory = allCategories.find(cat => cat.toUpperCase() === queryUpper);
      if (matchingCategory) {
        const byCategory = getFunctionsByCategory(matchingCategory);
        const functions = byCategory[matchingCategory];
        const result = { 0: functions.length };
        functions.forEach((func, index) => {
          result[index + 1] = func;
        });
        return result;
      }

      // Try as module (case-insensitive lookup)
      const allModules = getAllModules();
      const matchingModule = allModules.find(mod => mod.toLowerCase() === queryLower);
      if (matchingModule) {
        const byModule = getFunctionsByModule(matchingModule);
        const functions = byModule[matchingModule];
        const result = { 0: functions.length };
        functions.forEach((func, index) => {
          result[index + 1] = func;
        });
        return result;
      }

      // Not found
      return {
        0: 0,
        error: `No functions found matching '${query}'`,
        hint: `Try: FUNCTIONS() to list all, or FUNCTIONS("CATEGORY") or FUNCTIONS("MODULE")`
      };
    },

  };

  return builtIns;
}

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        initializeBuiltInFunctions
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - register in registry to avoid conflicts
    if (!window.rexxModuleRegistry) {
        window.rexxModuleRegistry = new Map();
    }
    if (!window.rexxModuleRegistry.has('builtinFunctions')) {
        window.rexxModuleRegistry.set('builtinFunctions', {
            initializeBuiltInFunctions
        });
    }
}