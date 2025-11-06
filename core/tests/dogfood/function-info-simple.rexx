#!/usr/bin/env rexx

/**
 * Simple Function Metadata Demo
 *
 * This demonstrates the INFO() and FUNCTIONS() reflection functions
 * that provide metadata about available REXX functions.
 */

SAY ""
SAY "╔════════════════════════════════════════════════════════════════════╗"
SAY "║         Function Metadata Reflection - Simple Demo                 ║"
SAY "╚════════════════════════════════════════════════════════════════════╝"
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 1: Get Info About the UPPER Function"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: info = INFO(\"UPPER\")"
info = INFO("UPPER")
SAY "Result (as JSON): " JSON_STRINGIFY(info)
SAY ""

SAY "Extracted metadata:"
SAY "  Module:      " info.1
SAY "  Category:    " info.2
SAY "  Description: " info.3
SAY "  Parameters:  " info.4
SAY "  Return Type: " info.5
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 2: Get Info About the ARRAY_PUSH Function"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: info = INFO(\"ARRAY_PUSH\")"
info = INFO("ARRAY_PUSH")
SAY "Module:      " info.1
SAY "Category:    " info.2
SAY "Description: " info.3
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 3: Get Info About the ELEMENT Function (DOM)"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: info = INFO(\"ELEMENT\")"
info = INFO("ELEMENT")
SAY "Module:      " info.1
SAY "Category:    " info.2
SAY "Description: " info.3
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 4: Find All String Functions"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: stringFuncs = FUNCTIONS(\"String\")"
stringFuncs = FUNCTIONS("String")
SAY "Result (as JSON):"
SAY JSON_STRINGIFY(stringFuncs)
SAY ""
SAY "Number of String functions: " stringFuncs.0
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 5: Get Quick Info About the SAY Function"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: info = FUNCTIONS(\"SAY\")"
info = FUNCTIONS("SAY")
SAY "Result:"
SAY JSON_STRINGIFY(info)
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 6: List All Math Functions"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: mathFuncs = FUNCTIONS(\"Math\")"
mathFuncs = FUNCTIONS("Math")
SAY "Total Math functions: " mathFuncs.0
SAY "First 5 math functions:"
SAY "  1. " mathFuncs.1
SAY "  2. " mathFuncs.2
SAY "  3. " mathFuncs.3
SAY "  4. " mathFuncs.4
SAY "  5. " mathFuncs.5
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 7: List All Functions from array-functions.js Module"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: arrayFuncs = FUNCTIONS(\"array-functions.js\")"
arrayFuncs = FUNCTIONS("array-functions.js")
SAY "Total array functions: " arrayFuncs.0
SAY "First 5 array functions:"
SAY "  1. " arrayFuncs.1
SAY "  2. " arrayFuncs.2
SAY "  3. " arrayFuncs.3
SAY "  4. " arrayFuncs.4
SAY "  5. " arrayFuncs.5
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "Example 8: Get Info for Non-Existent Function"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Command: info = INFO(\"NOSUCHFUNCTION\")"
info = INFO("NOSUCHFUNCTION")
SAY "Result (shows error):"
SAY JSON_STRINGIFY(info)
SAY ""

SAY "═══════════════════════════════════════════════════════════════════════"
SAY "SUMMARY"
SAY "═══════════════════════════════════════════════════════════════════════"
SAY ""
SAY "✓ INFO(functionName) - Get detailed metadata about a function"
SAY "✓ FUNCTIONS() - List all functions grouped by module"
SAY "✓ FUNCTIONS(category) - List functions in a category (String, Math, Array, etc)"
SAY "✓ FUNCTIONS(module) - List functions in a specific module"
SAY "✓ FUNCTIONS(functionName) - Get quick info about a function"
SAY ""
SAY "All functions return REXX stem arrays with indexed elements"
SAY ""

EXIT 0
