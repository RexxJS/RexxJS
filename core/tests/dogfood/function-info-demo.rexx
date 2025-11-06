#!/usr/bin/env rexx

/**
 * Function Metadata and Reflection Demo
 *
 * This demonstrates the INFO() and FUNCTIONS() reflection functions
 * that provide metadata about available REXX functions, including:
 * - Module source
 * - Function category
 * - Description
 * - Parameters
 * - Return type
 * - Examples
 */

SAY ""
SAY "╔════════════════════════════════════════════════════════════════════╗"
SAY "║         REXX Function Metadata and Reflection Demo                 ║"
SAY "╚════════════════════════════════════════════════════════════════════╝"
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "1. INFO() - Get detailed metadata for a specific function"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

/* Example 1: String function */
SAY "INFO(UPPER):"
info = INFO("UPPER")
SAY "  Module:      " info.1
SAY "  Category:    " info.2
SAY "  Description: " info.3
SAY ""

/* Example 2: Array function */
SAY "INFO(ARRAY_PUSH):"
info = INFO("ARRAY_PUSH")
SAY "  Module:      " info.1
SAY "  Category:    " info.2
SAY "  Description: " info.3
SAY ""

/* Example 3: Math function */
SAY "INFO(MATH_SQRT):"
info = INFO("MATH_SQRT")
SAY "  Module:      " info.1
SAY "  Category:    " info.2
SAY "  Description: " info.3
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "2. FUNCTIONS() - List functions by category or module"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

/* List String functions */
SAY "String functions (FUNCTIONS(String)):"
stringFuncs = FUNCTIONS("String")
SAY "  Count: " stringFuncs.0
SAY "  Functions:"
DO i = 1 TO MIN(8, stringFuncs.0)
  SAY "    - " stringFuncs.(i)
END
IF stringFuncs.0 > 8 THEN SAY "    ... and" (stringFuncs.0 - 8) "more"
SAY ""

/* List Math functions */
SAY "Math functions (FUNCTIONS(Math)):"
mathFuncs = FUNCTIONS("Math")
SAY "  Count: " mathFuncs.0
SAY "  Functions:"
DO i = 1 TO MIN(8, mathFuncs.0)
  SAY "    - " mathFuncs.(i)
END
IF mathFuncs.0 > 8 THEN SAY "    ... and" (mathFuncs.0 - 8) "more"
SAY ""

/* List functions from specific module */
SAY "Functions from array-functions.js module:"
arrayFuncs = FUNCTIONS("array-functions.js")
SAY "  Count: " arrayFuncs.0
SAY "  Functions:"
DO i = 1 TO MIN(10, arrayFuncs.0)
  SAY "    - " arrayFuncs.(i)
END
IF arrayFuncs.0 > 10 THEN SAY "    ... and" (arrayFuncs.0 - 10) "more"
SAY ""

/* Get info for specific function by name */
SAY "Looking up specific function (FUNCTIONS(SAY)):"
sayInfo = FUNCTIONS("SAY")
SAY "  " sayInfo.1
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "3. Practical Usage Examples"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Use Case 1: Find string manipulation functions"
SAY "  FUNCTIONS(String) returns array of string function names"
SAY ""

SAY "Use Case 2: Learn about a function"
SAY "  result = INFO(\"ARRAY_FLATTEN\")"
info = INFO("ARRAY_FLATTEN")
SAY "  Returns stem array with:"
SAY "    .1 = " info.1 " (module)"
SAY "    .2 = " info.2 " (category)"
SAY "    .3 = " info.3 " (description)"
SAY "    .4 = parameters (as JSON)"
SAY "    .5 = " info.5 " (return type)"
SAY "    .6 = examples (as JSON)"
SAY ""

SAY "Use Case 3: Discover all functions in a module"
SAY "  FUNCTIONS(\"dom-functions.js\") lists DOM functions"
domFuncs = FUNCTIONS("dom-functions.js")
SAY "  DOM functions available: " domFuncs.0
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "4. Complete Function Categories"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

/* Get sample from each major category */
SAY "Sample from each category:"
DO c = 1 TO 5
  SELECT
    WHEN c = 1 THEN category = "String"
    WHEN c = 2 THEN category = "Math"
    WHEN c = 3 THEN category = "Array"
    WHEN c = 4 THEN category = "DOM"
    WHEN c = 5 THEN category = "Shell"
    OTHERWISE category = ""
  END

  IF category = "" THEN LEAVE

  funcs = FUNCTIONS(category)
  SAY "  " category "functions:" funcs.0 "available"
END

SAY ""
SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Summary"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY "✓ Use INFO(functionName) to get detailed metadata"
SAY "✓ Use FUNCTIONS() with no args to list all functions by module"
SAY "✓ Use FUNCTIONS(category) to list functions in a category"
SAY "✓ Use FUNCTIONS(module) to list functions in a specific module"
SAY "✓ Use FUNCTIONS(functionName) to get quick info about a function"
SAY ""

EXIT 0
