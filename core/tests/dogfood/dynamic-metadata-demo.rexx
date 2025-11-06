#!/usr/bin/env rexx

/**
 * Dynamic Function Metadata Demo
 *
 * This demonstrates how dynamically loaded functions can register their metadata
 * so they appear in FUNCTIONS() and INFO() results
 */

SAY ""
SAY "╔═══════════════════════════════════════════════════════════════════════╗"
SAY "║    Dynamic Function Metadata Registration - Interactive Demo          ║"
SAY "╚═══════════════════════════════════════════════════════════════════════╝"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "1. Using Built-in Function Metadata (Static)"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Built-in functions are always available:"
SAY "  FUNCTIONS(String) returns:" FUNCTIONS("String").0 "string functions"
SAY "  FUNCTIONS(Math) returns:" FUNCTIONS("Math").0 "math functions"
SAY "  FUNCTIONS(Array) returns:" FUNCTIONS("Array").0 "array functions"
SAY ""

SAY "Get details about any function:"
info = INFO("UPPER")
SAY "  INFO(UPPER) => Module:" info.1 ", Category:" info.2
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "2. How Dynamic Registration Works"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "When you REQUIRE a module with metadata exports:"
SAY "  REQUIRE 'mylib' AS myprefix_(.*)'"
SAY ""

SAY "The module should export metadata so FUNCTIONS() can discover it."
SAY "Example metadata export pattern:"
SAY ""
SAY "  const __metadata__ = {"
SAY "    MY_FUNCTION: {"
SAY "      module: 'mylib.js',"
SAY "      category: 'Custom',"
SAY "      description: 'Does something'"
SAY "    }"
SAY "  };"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "3. Benefits of Dynamic Metadata Registration"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "✓ Discover dynamically loaded functions with FUNCTIONS()"
SAY "✓ Get detailed info with INFO() on custom functions"
SAY "✓ Filter by category or module"
SAY "✓ Automatic function documentation"
SAY "✓ IDE integration possibilities"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "4. Module Development Pattern"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "When developing a library for RexxJS:"
SAY ""
SAY "1. Export your functions:"
SAY "   module.exports = { GREET, CALCULATE, PROCESS_TEXT }"
SAY ""
SAY "2. Export metadata alongside:"
SAY "   const __metadata__ = {"
SAY "     GREET: {"
SAY "       module: 'mylib.js',"
SAY "       category: 'Custom',"
SAY "       description: 'Personalized greeting',"
SAY "       parameters: ['name'],"
SAY "       returns: 'string'"
SAY "     },"
SAY "     ..."
SAY "   }"
SAY ""
SAY "3. REXX users can now:"
SAY "   REQUIRE 'mylib' AS lib_(.*)'"
SAY "   FUNCTIONS('Custom')  -- See all custom functions"
SAY "   INFO('lib_GREET')     -- Get details about lib_GREET"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "5. API Functions"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "registerFunctionMetadata(name, metadata)"
SAY "  - Register a single function's metadata"
SAY "  - Used by REQUIRE or manually"
SAY ""

SAY "registerModuleMetadata(exports, moduleName, prefix)"
SAY "  - Register all functions from a module at once"
SAY "  - Called after REQUIRE when module loads"
SAY "  - Applies prefix to function names if provided"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "6. Integration with Existing Metadata"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Dynamic metadata adds to existing built-in functions:"
SAY ""

mathCount = FUNCTIONS("Math").0
SAY "Math functions available: " mathCount

SAY ""
SAY "After loading a custom library with math functions, both:"
SAY "  - Built-in math functions (ABS, SQRT, SIN, etc.)"
SAY "  - Custom math functions (from your library)"
SAY "Would be discoverable via FUNCTIONS()"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "7. Example: Creating a Custom Library"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "See tests/sample-custom-library.js for a complete example that includes:"
SAY "  ✓ Multiple functions (GREET, CALCULATE, PROCESS_TEXT, ANALYZE)"
SAY "  ✓ Complete metadata exports"
SAY "  ✓ Both Node.js and browser compatibility"
SAY ""

SAY "═════════════════════════════════════════════════════════════════════════"
SAY "Summary"
SAY "═════════════════════════════════════════════════════════════════════════"
SAY ""

SAY "Dynamic metadata registration enables:"
SAY "  • Self-documenting code libraries"
SAY "  • Runtime function discovery"
SAY "  • Better IDE support in the future"
SAY "  • Seamless integration with FUNCTIONS() and INFO()"
SAY ""

SAY "Start building discoverable libraries today!"
SAY ""

EXIT 0
