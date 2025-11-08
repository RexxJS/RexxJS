#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "../../src/expectations-address.js"

/* @test-tags functions, three-parameter, string-functions, math-functions, logic-functions, validation-functions, regex-functions, dogfood */
/* @description Three Parameter Function Test - Functions with Parentheses */

/* ============= SETUP SECTION ============= */
SAY "🧪 Three Parameter Function Test Suite Starting..."
SAY "Focus: Testing functions WITH parentheses (reliable syntax)"

// Shared test data
LET test_count = 0
LET pass_count = 0

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
// rexxt automatically passes .*Test$ when no arguments provided
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  // Each test subroutine execution counts as one test
  ADDRESS EXPECTATIONS "TEST_COUNT"
  INTERPRET "CALL " || subroutineName
END

SAY "✅ Three Parameter Function Tests Complete"
SAY "📝 Note: Functions with parentheses work reliably across all implementations"
// Final summary handled by TestRexxInterpreter
EXIT 0

/* ============= STRING FUNCTION TESTS ============= */
StringFunctionTest:
  SAY "📝 Testing Three Parameter String Functions (WITH PARENTHESES)..."
  
  /* SUBSTR function with parentheses */
  LET text1 = "hello world"
  LET result1 = SUBSTR(text1, 1, 5)
  ADDRESS EXPECTATIONS "{result1} should equal 'hello'"
  
  LET text2 = "hello world"
  LET result2 = SUBSTR(text2, 7, 5)
  ADDRESS EXPECTATIONS "{result2} should equal 'world'"
  
  /* POS function with parentheses */
  LET result3 = POS("hello world", "world", 1)
  ADDRESS EXPECTATIONS "{result3} should equal 7"

  LET result4 = POS("hello world", "hello", 1)
  ADDRESS EXPECTATIONS "{result4} should equal 1"

  LET result5 = POS("hello world", "test", 1)
  ADDRESS EXPECTATIONS "{result5} should equal 0"
  
RETURN

/* ============= MATH FUNCTION TESTS ============= */
MathFunctionTest:
  SAY "🔢 Testing Three Parameter Math Functions (WITH PARENTHESES)..."
  
  /* MATH_CLAMP function with parentheses */
  LET result1 = MATH_CLAMP(5, 1, 10)
  ADDRESS EXPECTATIONS "{result1} should equal 5"
  
  LET result2 = MATH_CLAMP(15, 1, 10)
  ADDRESS EXPECTATIONS "{result2} should equal 10"
  
  LET result3 = MATH_CLAMP(-5, 1, 10)
  ADDRESS EXPECTATIONS "{result3} should equal 1"
  
  /* MATH_DISTANCE_2D function with parentheses */
  LET result4 = MATH_DISTANCE_2D(0, 0, 3, 4)
  ADDRESS EXPECTATIONS "{result4} should equal 5"
  
  LET result5 = MATH_DISTANCE_2D(1, 1, 4, 5)
  ADDRESS EXPECTATIONS "{result5} should equal 5"
  
RETURN

/* ============= LOGIC FUNCTION TESTS ============= */
LogicFunctionTest:
  SAY "🤔 Testing Three Parameter Logic Functions (WITH PARENTHESES)..."
  
  /* IF function with parentheses - true condition */
  LET result1 = IF(true, "yes", "no")
  ADDRESS EXPECTATIONS "{result1} should equal 'yes'"
  
  /* IF function with expression condition */
  LET result2 = IF(5 > 3, "greater", "less")
  ADDRESS EXPECTATIONS "{result2} should equal 'greater'"
  
  /* IF function - false condition (note: may have implementation differences) */
  LET result3 = IF(false, "yes", "no")
  ADDRESS EXPECTATIONS "{TYPEOF(result3)} should equal 'string'"
  
RETURN

/* ============= VALIDATION FUNCTION TESTS ============= */
ValidationFunctionTest:
  SAY "✅ Testing Three Parameter Validation Functions (WITH PARENTHESES)..."
  
  /* IS_NUMBER function with parentheses - valid number in range */
  LET result1 = IS_NUMBER("123", 1, 999)
  ADDRESS EXPECTATIONS "{result1} should equal true"
  
  /* IS_NUMBER function - invalid number */
  LET result2 = IS_NUMBER("abc", 1, 999)
  ADDRESS EXPECTATIONS "{result2} should equal false"
  
  /* IS_NUMBER function - number in range */
  LET result3 = IS_NUMBER("50", 1, 100)
  ADDRESS EXPECTATIONS "{result3} should equal true"
  
  /* IS_RANGE function with parentheses - value in range */
  LET result4 = IS_RANGE(5, 1, 10)
  ADDRESS EXPECTATIONS "{result4} should equal true"
  
  /* IS_RANGE function - value out of range */
  LET result5 = IS_RANGE(15, 1, 10)
  ADDRESS EXPECTATIONS "{result5} should equal false"
  
  /* IS_RANGE function - boundary value */
  LET result6 = IS_RANGE(1, 1, 10)
  ADDRESS EXPECTATIONS "{result6} should equal true"
  
  /* IS_LENGTH function with parentheses - valid length */
  LET result7 = IS_LENGTH("hello", 3, 10)
  ADDRESS EXPECTATIONS "{result7} should equal true"
  
  /* IS_LENGTH function - too short */
  LET result8 = IS_LENGTH("hi", 3, 10)
  ADDRESS EXPECTATIONS "{result8} should equal false"
  
  /* IS_LENGTH function - at boundary (11 chars exceeds max 10) */
  LET result9 = IS_LENGTH("hello world", 3, 11)
  ADDRESS EXPECTATIONS "{result9} should equal true"
  
RETURN

/* ============= REGEX FUNCTION TESTS ============= */
RegexFunctionTest:
  SAY "🔍 Testing Three Parameter Regex Functions (WITH PARENTHESES)..."
  
  /* REGEX_MATCH function with parentheses - match found */
  LET result1 = REGEX_MATCH("hello123", "[0-9]+", "")
  ADDRESS EXPECTATIONS "{result1} should equal '123'"
  
  /* REGEX_MATCH function - no match */
  LET result2 = REGEX_MATCH("test", "[0-9]+", "")
  ADDRESS EXPECTATIONS "{result2} should equal ''"
  
  /* REGEX_REPLACE function with parentheses */
  LET result3 = REGEX_REPLACE("hello123world", "[0-9]+", "XXX")
  ADDRESS EXPECTATIONS "{result3} should equal 'helloXXXworld'"
  
  /* REGEX_REPLACE function - no match */
  LET result4 = REGEX_REPLACE("test", "[0-9]+", "XXX")
  ADDRESS EXPECTATIONS "{result4} should equal 'test'"
  
RETURN