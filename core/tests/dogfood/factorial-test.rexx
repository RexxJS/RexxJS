#!/usr/bin/env ../../rexxt

/*
 * @test-tags factorial, math, classic, recursion, dogfood
 * @description Factorial calculation test - classic mathematical function
 *
 * Tests factorial calculation using iterative approach
 * factorial(n) = n! = n * (n-1) * (n-2) * ... * 2 * 1
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🔢 Factorial Test Suite Starting..."
SAY "Focus: Testing factorial calculations"

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  ADDRESS EXPECTATIONS "TEST_COUNT"
  INTERPRET "CALL " || subroutineName
END

SAY "✅ Factorial Test Suite Complete"
EXIT 0

/* ============= FACTORIAL BASE CASES ============= */
FactorialBaseCasesTest:
  SAY "🔢 Testing Factorial Base Cases..."

  /* 0! = 1 (by definition) */
  LET n = 0
  LET result = 1
  IF n > 0 THEN DO
    DO i = 1 TO n
      result = result * i
    END
  END
  ADDRESS EXPECTATIONS "{result} should equal 1"

  /* 1! = 1 */
  LET n = 1
  LET result = 1
  IF n > 0 THEN DO
    DO i = 1 TO n
      result = result * i
    END
  END
  ADDRESS EXPECTATIONS "{result} should equal 1"

  /* 2! = 2 */
  LET n = 2
  LET result = 1
  IF n > 0 THEN DO
    DO i = 1 TO n
      result = result * i
    END
  END
  ADDRESS EXPECTATIONS "{result} should equal 2"

RETURN

/* ============= SMALL FACTORIALS ============= */
SmallFactorialsTest:
  SAY "🔢 Testing Small Factorials..."

  /* 3! = 6 */
  LET n = 3
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 6"

  /* 4! = 24 */
  LET n = 4
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 24"

  /* 5! = 120 */
  LET n = 5
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 120"

  /* 6! = 720 */
  LET n = 6
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 720"

RETURN

/* ============= MEDIUM FACTORIALS ============= */
MediumFactorialsTest:
  SAY "🔢 Testing Medium Factorials..."

  /* 7! = 5040 */
  LET n = 7
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 5040"

  /* 8! = 40320 */
  LET n = 8
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 40320"

  /* 9! = 362880 */
  LET n = 9
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 362880"

  /* 10! = 3628800 */
  LET n = 10
  LET result = 1
  DO i = 1 TO n
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 3628800"

RETURN

/* ============= FACTORIAL PROPERTIES ============= */
FactorialPropertiesTest:
  SAY "🔢 Testing Factorial Properties..."

  /* Property: n! = n * (n-1)! */
  /* Test: 5! = 5 * 4! */
  LET n = 4
  LET fact4 = 1
  DO i = 1 TO n
    fact4 = fact4 * i
  END

  LET n = 5
  LET fact5 = 1
  DO i = 1 TO n
    fact5 = fact5 * i
  END

  LET expected = 5 * fact4
  ADDRESS EXPECTATIONS "{fact5} should equal {expected}"

  /* Property: n! / (n-1)! = n */
  /* Test: 6! / 5! = 6 */
  LET n = 5
  LET fact5 = 1
  DO i = 1 TO n
    fact5 = fact5 * i
  END

  LET n = 6
  LET fact6 = 1
  DO i = 1 TO n
    fact6 = fact6 * i
  END

  LET ratio = fact6 / fact5
  ADDRESS EXPECTATIONS "{ratio} should equal 6"

RETURN

/* ============= FACTORIAL GROWTH TEST ============= */
FactorialGrowthTest:
  SAY "🔢 Testing Factorial Growth Rate..."

  /* Factorials grow very quickly */
  /* Each factorial is previous * n */

  LET fact1 = 1
  LET fact2 = 1 * 2
  LET fact3 = fact2 * 3
  LET fact4 = fact3 * 4
  LET fact5 = fact4 * 5

  /* Verify the sequence */
  ADDRESS EXPECTATIONS "{fact1} should equal 1"
  ADDRESS EXPECTATIONS "{fact2} should equal 2"
  ADDRESS EXPECTATIONS "{fact3} should equal 6"
  ADDRESS EXPECTATIONS "{fact4} should equal 24"
  ADDRESS EXPECTATIONS "{fact5} should equal 120"

  /* Verify growth: fact5 > fact4 > fact3 > fact2 > fact1 */
  LET check1 = 0
  IF fact5 > fact4 THEN check1 = 1
  ADDRESS EXPECTATIONS "{check1} should equal 1"

  LET check2 = 0
  IF fact4 > fact3 THEN check2 = 1
  ADDRESS EXPECTATIONS "{check2} should equal 1"

RETURN

/* ============= DOUBLE FACTORIAL TEST ============= */
DoubleFactorialTest:
  SAY "🔢 Testing Double Factorial (n!!)..."

  /* Double factorial n!! = n * (n-2) * (n-4) * ... */
  /* 5!! = 5 * 3 * 1 = 15 */
  LET n = 5
  LET result = 1
  DO i = n TO 1 BY -2
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 15"

  /* 6!! = 6 * 4 * 2 = 48 */
  LET n = 6
  LET result = 1
  DO i = n TO 1 BY -2
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 48"

  /* 4!! = 4 * 2 = 8 */
  LET n = 4
  LET result = 1
  DO i = n TO 1 BY -2
    result = result * i
  END
  ADDRESS EXPECTATIONS "{result} should equal 8"

RETURN

/* ============= BUILT-IN FACTORIAL COMPARISON ============= */
BuiltInFactorialTest:
  SAY "🔢 Testing Against Built-In MATH_FACTORIAL..."

  /* Compare our iterative calculation with built-in */
  /* 5! using iteration */
  LET n = 5
  LET our_result = 1
  DO i = 1 TO n
    our_result = our_result * i
  END

  /* 5! using built-in */
  LET builtin_result = MATH_FACTORIAL(5)

  /* Should be equal */
  ADDRESS EXPECTATIONS "{our_result} should equal {builtin_result}"

  /* Test another: 7! */
  LET n = 7
  LET our_result = 1
  DO i = 1 TO n
    our_result = our_result * i
  END
  LET builtin_result = MATH_FACTORIAL(7)
  ADDRESS EXPECTATIONS "{our_result} should equal {builtin_result}"

RETURN
