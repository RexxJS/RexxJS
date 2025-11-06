'use strict';

/**
 * Function Metadata Registry
 *
 * Provides comprehensive metadata about all REXX functions, including:
 * - Module source
 * - Function description
 * - Parameter information
 * - Return type
 * - Example usage
 */

const functionMetadata = {
  // String Functions (string-functions.js)
  UPPER: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Convert string to uppercase',
    parameters: ['string'],
    returns: 'string',
    examples: ['UPPER("hello") => "HELLO"']
  },
  LOWER: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Convert string to lowercase',
    parameters: ['string'],
    returns: 'string',
    examples: ['LOWER("HELLO") => "hello"']
  },
  LENGTH: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Get length of string',
    parameters: ['string'],
    returns: 'number',
    examples: ['LENGTH("hello") => 5']
  },
  SUBSTR: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Extract substring from string',
    parameters: ['string', 'start', 'length'],
    returns: 'string',
    examples: ['SUBSTR("hello", 2, 3) => "ell"']
  },
  INDEX: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Find index of substring',
    parameters: ['string', 'substring'],
    returns: 'number',
    examples: ['INDEX("hello", "ll") => 3']
  },
  LEFT: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Get leftmost characters of string',
    parameters: ['string', 'length'],
    returns: 'string',
    examples: ['LEFT("hello", 2) => "he"']
  },
  RIGHT: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Get rightmost characters of string',
    parameters: ['string', 'length'],
    returns: 'string',
    examples: ['RIGHT("hello", 2) => "lo"']
  },
  TRIM: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Remove leading and trailing whitespace',
    parameters: ['string'],
    returns: 'string',
    examples: ['TRIM("  hello  ") => "hello"']
  },
  REPLACE: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Replace all occurrences of a substring',
    parameters: ['string', 'search', 'replacement'],
    returns: 'string',
    examples: ['REPLACE("hello world", "world", "REXX") => "hello REXX"']
  },
  STRIP: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Remove leading/trailing characters',
    parameters: ['string', 'chars'],
    returns: 'string',
    examples: ['STRIP("---hello---", "-") => "hello"']
  },
  REVERSE: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Reverse string',
    parameters: ['string'],
    returns: 'string',
    examples: ['REVERSE("hello") => "olleh"']
  },
  SPLIT: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Split string by delimiter',
    parameters: ['string', 'delimiter'],
    returns: 'array',
    examples: ['SPLIT("a,b,c", ",") => ["a", "b", "c"]']
  },
  POS: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Find position of substring (1-based)',
    parameters: ['substring', 'string'],
    returns: 'number',
    examples: ['POS("ll", "hello") => 3']
  },
  ABBREV: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Check if string is an abbreviation',
    parameters: ['string', 'abbreviation', 'minLength'],
    returns: 'boolean',
    examples: ['ABBREV("COMMAND", "COM", 3) => true']
  },
  SPACE: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Normalize whitespace in string',
    parameters: ['string', 'numSpaces'],
    returns: 'string',
    examples: ['SPACE("a  b  c", 1) => "a b c"']
  },
  WORD: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Get word at specific position',
    parameters: ['string', 'wordNumber'],
    returns: 'string',
    examples: ['WORD("hello world test", 2) => "world"']
  },
  WORDS: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Count words in string',
    parameters: ['string'],
    returns: 'number',
    examples: ['WORDS("hello world test") => 3']
  },
  WORDPOS: {
    module: 'string-functions.js',
    category: 'String',
    description: 'Find position of word in string',
    parameters: ['string', 'word'],
    returns: 'number',
    examples: ['WORDPOS("world", "hello world test") => 2']
  },

  // Math Functions (math-functions.js)
  ABS: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Get absolute value',
    parameters: ['number'],
    returns: 'number',
    examples: ['ABS(-5) => 5']
  },
  INT: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Convert to integer',
    parameters: ['number'],
    returns: 'number',
    examples: ['INT(3.7) => 3']
  },
  MAX: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Get maximum value',
    parameters: ['...numbers'],
    returns: 'number',
    examples: ['MAX(3, 1, 4, 1, 5) => 5']
  },
  MIN: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Get minimum value',
    parameters: ['...numbers'],
    returns: 'number',
    examples: ['MIN(3, 1, 4, 1, 5) => 1']
  },
  MATH_CEIL: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Round up to nearest integer',
    parameters: ['number'],
    returns: 'number',
    examples: ['MATH_CEIL(3.2) => 4']
  },
  MATH_FLOOR: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Round down to nearest integer',
    parameters: ['number'],
    returns: 'number',
    examples: ['MATH_FLOOR(3.8) => 3']
  },
  MATH_ROUND: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Round to nearest integer',
    parameters: ['number'],
    returns: 'number',
    examples: ['MATH_ROUND(3.5) => 4']
  },
  MATH_SQRT: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Calculate square root',
    parameters: ['number'],
    returns: 'number',
    examples: ['MATH_SQRT(16) => 4']
  },
  MATH_POWER: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Calculate power (base^exponent)',
    parameters: ['base', 'exponent'],
    returns: 'number',
    examples: ['MATH_POWER(2, 3) => 8']
  },
  MATH_SUM: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Sum array of numbers',
    parameters: ['array'],
    returns: 'number',
    examples: ['MATH_SUM([1, 2, 3, 4]) => 10']
  },
  MATH_AVERAGE: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Calculate average of numbers',
    parameters: ['array'],
    returns: 'number',
    examples: ['MATH_AVERAGE([2, 4, 6, 8]) => 5']
  },
  MATH_LOG: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Natural logarithm',
    parameters: ['number'],
    returns: 'number',
    examples: ['MATH_LOG(2.718) => 1']
  },
  MATH_SIN: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Sine function (radians)',
    parameters: ['number'],
    returns: 'number'
  },
  MATH_COS: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Cosine function (radians)',
    parameters: ['number'],
    returns: 'number'
  },
  MATH_TAN: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Tangent function (radians)',
    parameters: ['number'],
    returns: 'number'
  },
  MATH_RANDOM: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Generate random number between 0 and 1',
    parameters: [],
    returns: 'number',
    examples: ['MATH_RANDOM() => 0.437']
  },
  MATH_RANDOM_INT: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Generate random integer in range',
    parameters: ['min', 'max'],
    returns: 'number',
    examples: ['MATH_RANDOM_INT(1, 10) => 7']
  },
  MATH_CLAMP: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Clamp number to range',
    parameters: ['number', 'min', 'max'],
    returns: 'number',
    examples: ['MATH_CLAMP(15, 0, 10) => 10']
  },
  MATH_PERCENTAGE: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Calculate percentage',
    parameters: ['value', 'total'],
    returns: 'number',
    examples: ['MATH_PERCENTAGE(25, 100) => 25']
  },
  MATH_FACTORIAL: {
    module: 'math-functions.js',
    category: 'Math',
    description: 'Calculate factorial',
    parameters: ['number'],
    returns: 'number',
    examples: ['MATH_FACTORIAL(5) => 120']
  },

  // Array Functions (array-functions.js)
  ARRAY_GET: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Get element from array',
    parameters: ['array', 'index'],
    returns: 'any',
    examples: ['ARRAY_GET([1, 2, 3], 1) => 1']
  },
  ARRAY_SET: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Set element in array',
    parameters: ['array', 'index', 'value'],
    returns: 'array',
    examples: ['ARRAY_SET([1, 2, 3], 1, 9) => [9, 2, 3]']
  },
  ARRAY_LENGTH: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Get array length',
    parameters: ['array'],
    returns: 'number',
    examples: ['ARRAY_LENGTH([1, 2, 3]) => 3']
  },
  ARRAY_PUSH: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Add element to end of array',
    parameters: ['array', 'element'],
    returns: 'array',
    examples: ['ARRAY_PUSH([1, 2], 3) => [1, 2, 3]']
  },
  ARRAY_POP: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Remove element from end of array',
    parameters: ['array'],
    returns: 'any',
    examples: ['ARRAY_POP([1, 2, 3]) => 3']
  },
  ARRAY_SHIFT: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Remove element from beginning of array',
    parameters: ['array'],
    returns: 'any',
    examples: ['ARRAY_SHIFT([1, 2, 3]) => 1']
  },
  ARRAY_UNSHIFT: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Add element to beginning of array',
    parameters: ['array', 'element'],
    returns: 'array',
    examples: ['ARRAY_UNSHIFT([2, 3], 1) => [1, 2, 3]']
  },
  ARRAY_REVERSE: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Reverse array',
    parameters: ['array'],
    returns: 'array',
    examples: ['ARRAY_REVERSE([1, 2, 3]) => [3, 2, 1]']
  },
  ARRAY_INCLUDES: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Check if array contains element',
    parameters: ['array', 'element'],
    returns: 'boolean',
    examples: ['ARRAY_INCLUDES([1, 2, 3], 2) => true']
  },
  ARRAY_INDEXOF: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Find index of element in array',
    parameters: ['array', 'element'],
    returns: 'number',
    examples: ['ARRAY_INDEXOF([1, 2, 3], 2) => 1']
  },
  ARRAY_MIN: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Get minimum value from array',
    parameters: ['array'],
    returns: 'number',
    examples: ['ARRAY_MIN([3, 1, 4, 1, 5]) => 1']
  },
  ARRAY_MAX: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Get maximum value from array',
    parameters: ['array'],
    returns: 'number',
    examples: ['ARRAY_MAX([3, 1, 4, 1, 5]) => 5']
  },
  ARRAY_SUM: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Sum all numbers in array',
    parameters: ['array'],
    returns: 'number',
    examples: ['ARRAY_SUM([1, 2, 3, 4]) => 10']
  },
  ARRAY_AVERAGE: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Calculate average of array elements',
    parameters: ['array'],
    returns: 'number',
    examples: ['ARRAY_AVERAGE([2, 4, 6, 8]) => 5']
  },
  ARRAY_UNIQUE: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Get unique elements from array',
    parameters: ['array'],
    returns: 'array',
    examples: ['ARRAY_UNIQUE([1, 2, 2, 3, 3, 3]) => [1, 2, 3]']
  },
  ARRAY_FLATTEN: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Flatten nested array',
    parameters: ['array', 'depth'],
    returns: 'array',
    examples: ['ARRAY_FLATTEN([[1, 2], [3, 4]]) => [1, 2, 3, 4]']
  },
  ARRAY_FILTER: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Filter array by condition',
    parameters: ['array', 'condition'],
    returns: 'array'
  },
  ARRAY_SORT: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Sort array',
    parameters: ['array', 'order'],
    returns: 'array',
    examples: ['ARRAY_SORT([3, 1, 2]) => [1, 2, 3]']
  },
  ARRAY_FIND: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Find first matching element',
    parameters: ['array', 'condition'],
    returns: 'any'
  },
  ARRAY_MAP: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Map function over array',
    parameters: ['array', 'function'],
    returns: 'array'
  },
  ARRAY_REDUCE: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Reduce array to single value',
    parameters: ['array', 'function', 'initial'],
    returns: 'any'
  },
  JOIN: {
    module: 'array-functions.js',
    category: 'Array',
    description: 'Join array elements with separator',
    parameters: ['array', 'separator'],
    returns: 'string',
    examples: ['JOIN([1, 2, 3], ",") => "1,2,3"']
  },

  // DOM Functions (dom-functions.js)
  ELEMENT: {
    module: 'dom-functions.js',
    category: 'DOM',
    description: 'Query or manipulate DOM elements',
    parameters: ['selector', 'operation', 'value'],
    returns: 'element|value',
    examples: [
      'ELEMENT("#myDiv", "text", "Hello")',
      'ELEMENT(".button", "click")',
      'ELEMENT("[data-id=123]", "attr", "data-value") => "value"'
    ]
  },

  // Shell Functions (shell-functions.js)
  SAY: {
    module: 'shell-functions.js',
    category: 'Shell',
    description: 'Print output',
    parameters: ['...values'],
    returns: 'void',
    examples: ['SAY "Hello, World!"']
  },
  PASTE: {
    module: 'shell-functions.js',
    category: 'Shell',
    description: 'Concatenate arrays column-wise',
    parameters: ['...arrays'],
    returns: 'array'
  },
  CUT: {
    module: 'shell-functions.js',
    category: 'Shell',
    description: 'Extract columns from data',
    parameters: ['input', 'fields', 'delimiter'],
    returns: 'array'
  },
  SHUF: {
    module: 'shell-functions.js',
    category: 'Shell',
    description: 'Shuffle array',
    parameters: ['array'],
    returns: 'array',
    examples: ['SHUF([1, 2, 3, 4, 5]) => [3, 1, 5, 2, 4]']
  },

  // Path Functions (path-functions.js)
  PATH_JOIN: {
    module: 'path-functions.js',
    category: 'Path',
    description: 'Join path components',
    parameters: ['...parts'],
    returns: 'string',
    examples: ['PATH_JOIN("path", "to", "file.txt") => "path/to/file.txt"']
  },
  PATH_RESOLVE: {
    module: 'path-functions.js',
    category: 'Path',
    description: 'Resolve absolute path',
    parameters: ['...parts'],
    returns: 'string'
  },

  // File Functions (file-functions.js)
  FILE_READ: {
    module: 'file-functions.js',
    category: 'File',
    description: 'Read file contents',
    parameters: ['filepath'],
    returns: 'string'
  },
  FILE_WRITE: {
    module: 'file-functions.js',
    category: 'File',
    description: 'Write to file',
    parameters: ['filepath', 'content'],
    returns: 'void'
  },

  // JSON Functions (json-functions.js)
  JSON_STRINGIFY: {
    module: 'json-functions.js',
    category: 'JSON',
    description: 'Convert to JSON string',
    parameters: ['object'],
    returns: 'string',
    examples: ['JSON_STRINGIFY({a: 1, b: 2}) => "{\\"a\\":1,\\"b\\":2}"']
  },
  JSON_PARSE: {
    module: 'json-functions.js',
    category: 'JSON',
    description: 'Parse JSON string',
    parameters: ['jsonString'],
    returns: 'object',
    examples: ['JSON_PARSE("{\\"a\\":1,\\"b\\":2}") => {a: 1, b: 2}']
  },

  // Regex Functions (regex-functions.js)
  REGEX_MATCH: {
    module: 'regex-functions.js',
    category: 'Regex',
    description: 'Match string against regex',
    parameters: ['string', 'pattern'],
    returns: 'boolean'
  },
  REGEX_EXTRACT: {
    module: 'regex-functions.js',
    category: 'Regex',
    description: 'Extract matches from string',
    parameters: ['string', 'pattern'],
    returns: 'array'
  },

  // Logic Functions (logic-functions.js)
  IF: {
    module: 'logic-functions.js',
    category: 'Logic',
    description: 'Conditional execution',
    parameters: ['condition', 'trueValue', 'falseValue'],
    returns: 'any'
  },

  // Validation Functions (validation-functions.js)
  IS_NUMBER: {
    module: 'validation-functions.js',
    category: 'Validation',
    description: 'Check if value is a number',
    parameters: ['value'],
    returns: 'boolean'
  },
  IS_STRING: {
    module: 'validation-functions.js',
    category: 'Validation',
    description: 'Check if value is a string',
    parameters: ['value'],
    returns: 'boolean'
  },

  // DOM Pipeline Functions (dom-pipeline-functions.js)
  FILTER_BY_ATTR: {
    module: 'dom-pipeline-functions.js',
    category: 'DOM Pipeline',
    description: 'Filter DOM elements by attribute',
    parameters: ['elements', 'attribute', 'value'],
    returns: 'array'
  },
  FILTER_BY_CLASS: {
    module: 'dom-pipeline-functions.js',
    category: 'DOM Pipeline',
    description: 'Filter DOM elements by class',
    parameters: ['elements', 'className'],
    returns: 'array'
  },
  GET_VALUES: {
    module: 'dom-pipeline-functions.js',
    category: 'DOM Pipeline',
    description: 'Extract values from form elements',
    parameters: ['elements'],
    returns: 'array'
  },
  GET_TEXT: {
    module: 'dom-pipeline-functions.js',
    category: 'DOM Pipeline',
    description: 'Extract text content from elements',
    parameters: ['elements'],
    returns: 'array'
  },
  GET_ATTRS: {
    module: 'dom-pipeline-functions.js',
    category: 'DOM Pipeline',
    description: 'Extract attributes from elements',
    parameters: ['elements', 'attributeName'],
    returns: 'array'
  },

  // Interpreter Functions
  ARG: {
    module: 'interpreter-builtin-functions.js',
    category: 'Interpreter',
    description: 'Get function arguments',
    parameters: ['index'],
    returns: 'any'
  },
  SYMBOL: {
    module: 'interpreter-builtin-functions.js',
    category: 'Interpreter',
    description: 'Check if symbol is variable or literal',
    parameters: ['symbol'],
    returns: 'string',
    examples: ['SYMBOL("x") => "VAR" or "LIT"']
  },
  TYPEOF: {
    module: 'interpreter-builtin-functions.js',
    category: 'Interpreter',
    description: 'Get type of value',
    parameters: ['value'],
    returns: 'string',
    examples: ['TYPEOF(42) => "number"']
  },
  SUBROUTINES: {
    module: 'interpreter-builtin-functions.js',
    category: 'Interpreter',
    description: 'List available subroutines',
    parameters: [],
    returns: 'array'
  },
  JS_SHOW: {
    module: 'interpreter-builtin-functions.js',
    category: 'Interpreter',
    description: 'Show JavaScript representation',
    parameters: ['value'],
    returns: 'string'
  }
};

/**
 * Get metadata for a specific function
 * @param {string} functionName - Name of the function
 * @returns {Object|null} Function metadata or null if not found
 */
function getFunctionInfo(functionName) {
  const name = String(functionName).toUpperCase();
  return functionMetadata[name] || null;
}

/**
 * List all functions by category
 * @param {string} category - Optional category filter
 * @returns {Object} Functions grouped by category
 */
function getFunctionsByCategory(category = null) {
  const result = {};

  for (const [name, metadata] of Object.entries(functionMetadata)) {
    const cat = metadata.category;

    if (category && cat !== category) {
      continue;
    }

    if (!result[cat]) {
      result[cat] = [];
    }
    result[cat].push(name);
  }

  return result;
}

/**
 * List all functions by module
 * @param {string} module - Optional module filter
 * @returns {Object} Functions grouped by module
 */
function getFunctionsByModule(module = null) {
  const result = {};

  for (const [name, metadata] of Object.entries(functionMetadata)) {
    const mod = metadata.module;

    if (module && mod !== module) {
      continue;
    }

    if (!result[mod]) {
      result[mod] = [];
    }
    result[mod].push(name);
  }

  return result;
}

/**
 * Get list of all available modules
 * @returns {Array} List of unique module names
 */
function getAllModules() {
  const modules = new Set();
  for (const metadata of Object.values(functionMetadata)) {
    modules.add(metadata.module);
  }
  return Array.from(modules).sort();
}

/**
 * Get list of all available categories
 * @returns {Array} List of unique category names
 */
function getAllCategories() {
  const categories = new Set();
  for (const metadata of Object.values(functionMetadata)) {
    categories.add(metadata.category);
  }
  return Array.from(categories).sort();
}

/**
 * Get total function count
 * @returns {number} Total number of documented functions
 */
function getFunctionCount() {
  return Object.keys(functionMetadata).length;
}

/**
 * Register metadata for a dynamically loaded function
 * Allows REQUIRE'd modules to register their function metadata
 *
 * @param {string} functionName - Name of the function (will be uppercased)
 * @param {Object} metadata - Function metadata object with properties:
 *   - module: string (source module name)
 *   - category: string (function category)
 *   - description: string (human-readable description)
 *   - parameters: Array<string> (parameter names)
 *   - returns: string (return type)
 *   - examples?: Array<string> (optional usage examples)
 * @returns {boolean} true if registered successfully
 */
function registerFunctionMetadata(functionName, metadata) {
  if (!functionName || typeof functionName !== 'string') {
    console.error('registerFunctionMetadata: functionName must be a non-empty string');
    return false;
  }

  const name = functionName.toUpperCase();

  // Validate metadata object
  if (!metadata || typeof metadata !== 'object') {
    console.error(`registerFunctionMetadata: metadata must be an object for ${name}`);
    return false;
  }

  const required = ['module', 'category', 'description', 'parameters', 'returns'];
  for (const field of required) {
    if (!metadata[field]) {
      console.error(`registerFunctionMetadata: metadata for ${name} missing required field: ${field}`);
      return false;
    }
  }

  functionMetadata[name] = metadata;
  return true;
}

/**
 * Register metadata for all functions from a loaded module
 * Call this when loading external modules via REQUIRE
 *
 * @param {Object} moduleExports - Module export object
 * @param {string} moduleName - Display name for the module (e.g., "custom-library")
 * @param {string} prefix - Optional prefix to apply to function names (e.g., "custom_")
 * @returns {number} Number of functions registered
 */
function registerModuleMetadata(moduleExports, moduleName, prefix = '') {
  if (!moduleExports || typeof moduleExports !== 'object') {
    console.warn(`registerModuleMetadata: invalid module exports for ${moduleName}`);
    return 0;
  }

  // Check if module exports metadata
  const metadata = moduleExports.__metadata__ || moduleExports.metadata || moduleExports._metadata;
  if (!metadata || typeof metadata !== 'object') {
    // No metadata in module - that's okay, just return 0
    return 0;
  }

  let registered = 0;

  for (const [functionName, functionMetadata] of Object.entries(metadata)) {
    const prefixedName = prefix ? `${prefix}${functionName}` : functionName;
    if (registerFunctionMetadata(prefixedName, functionMetadata)) {
      registered++;
    }
  }

  return registered;
}

/**
 * Get metadata entry as REXX stem array format
 * @param {string} functionName - Function name to get
 * @returns {Object|null} REXX stem array with metadata or error
 */
function getFunctionMetadataAsRexxArray(functionName) {
  const name = String(functionName).toUpperCase();
  const meta = functionMetadata[name];

  if (!meta) {
    return {
      error: `Function '${functionName}' not found in metadata registry`,
      hint: `Use FUNCTIONS() to list all available functions`
    };
  }

  // Return formatted metadata as a REXX stem array
  return {
    0: 6, // Number of properties
    1: meta.module,
    2: meta.category,
    3: meta.description,
    4: JSON.stringify(meta.parameters),
    5: meta.returns,
    6: JSON.stringify(meta.examples || [])
  };
}

module.exports = {
  functionMetadata,
  getFunctionInfo,
  getFunctionsByCategory,
  getFunctionsByModule,
  getAllModules,
  getAllCategories,
  getFunctionCount,
  registerFunctionMetadata,
  registerModuleMetadata,
  getFunctionMetadataAsRexxArray
};

// Browser compatibility
if (typeof window !== 'undefined') {
  window.functionMetadata = functionMetadata;
  window.getFunctionInfo = getFunctionInfo;
  window.getFunctionsByCategory = getFunctionsByCategory;
  window.getFunctionsByModule = getFunctionsByModule;
  window.getAllModules = getAllModules;
  window.getAllCategories = getAllCategories;
  window.getFunctionCount = getFunctionCount;
  window.registerFunctionMetadata = registerFunctionMetadata;
  window.registerModuleMetadata = registerModuleMetadata;
  window.getFunctionMetadataAsRexxArray = getFunctionMetadataAsRexxArray;
}
