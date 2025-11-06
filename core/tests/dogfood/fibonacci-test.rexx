#!/usr/bin/env ../../rexxt

/*
 * @test-tags fibonacci, math, dogfood
 * @description Fibonacci sequence calculation test using inline calculations
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🔢 Fibonacci Test Suite Starting..."
SAY "Focus: Testing Fibonacci sequence calculations"

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

SAY "✅ Fibonacci Test Suite Complete"
EXIT 0

/* ============= BASE CASE TESTS ============= */
FibonacciBaseCaseTest:
  SAY "🔢 Testing Fibonacci Base Cases..."

  /* Test fib(0) = 0 */
  LET fib0 = 0
  ADDRESS EXPECTATIONS "{fib0} should equal 0"

  /* Test fib(1) = 1 */
  LET fib1 = 1
  ADDRESS EXPECTATIONS "{fib1} should equal 1"

  /* Test fib(2) = fib(0) + fib(1) = 1 */
  LET fib2 = fib0 + fib1
  ADDRESS EXPECTATIONS "{fib2} should equal 1"

RETURN

/* ============= SMALL FIBONACCI NUMBER TESTS ============= */
FibonacciSmallNumbersTest:
  SAY "🔢 Testing Small Fibonacci Numbers..."

  /* Build up the sequence */
  LET fib0 = 0
  LET fib1 = 1
  LET fib2 = fib0 + fib1
  LET fib3 = fib1 + fib2
  LET fib4 = fib2 + fib3
  LET fib5 = fib3 + fib4
  LET fib6 = fib4 + fib5
  LET fib7 = fib5 + fib6

  /* Test fib(3) = 2 */
  ADDRESS EXPECTATIONS "{fib3} should equal 2"

  /* Test fib(4) = 3 */
  ADDRESS EXPECTATIONS "{fib4} should equal 3"

  /* Test fib(5) = 5 */
  ADDRESS EXPECTATIONS "{fib5} should equal 5"

  /* Test fib(6) = 8 */
  ADDRESS EXPECTATIONS "{fib6} should equal 8"

  /* Test fib(7) = 13 */
  ADDRESS EXPECTATIONS "{fib7} should equal 13"

RETURN

/* ============= MEDIUM FIBONACCI NUMBER TESTS ============= */
FibonacciMediumNumbersTest:
  SAY "🔢 Testing Medium Fibonacci Numbers..."

  /* Build up the sequence from 0 to 10 */
  LET fib0 = 0
  LET fib1 = 1
  LET fib2 = fib0 + fib1
  LET fib3 = fib1 + fib2
  LET fib4 = fib2 + fib3
  LET fib5 = fib3 + fib4
  LET fib6 = fib4 + fib5
  LET fib7 = fib5 + fib6
  LET fib8 = fib6 + fib7
  LET fib9 = fib7 + fib8
  LET fib10 = fib8 + fib9

  /* Test fib(8) = 21 */
  ADDRESS EXPECTATIONS "{fib8} should equal 21"

  /* Test fib(9) = 34 */
  ADDRESS EXPECTATIONS "{fib9} should equal 34"

  /* Test fib(10) = 55 */
  ADDRESS EXPECTATIONS "{fib10} should equal 55"

RETURN

/* ============= LARGER FIBONACCI NUMBER TESTS ============= */
FibonacciLargeNumbersTest:
  SAY "🔢 Testing Larger Fibonacci Numbers..."

  /* Build up the sequence efficiently using a loop */
  LET prev = 0
  LET curr = 1

  /* Compute up to fib(20) */
  DO i = 2 TO 20
    LET next = prev + curr
    LET prev = curr
    LET curr = next

    /* Save specific values we want to test */
    IF i = 14 THEN LET fib14 = curr
    IF i = 16 THEN LET fib16 = curr
    IF i = 20 THEN LET fib20 = curr
  END

  /* Test fib(14) = 377 */
  ADDRESS EXPECTATIONS "{fib14} should equal 377"

  /* Test fib(16) = 987 */
  ADDRESS EXPECTATIONS "{fib16} should equal 987"

  /* Test fib(20) = 6765 */
  ADDRESS EXPECTATIONS "{fib20} should equal 6765"

RETURN

/* ============= SEQUENCE VERIFICATION TEST ============= */
FibonacciSequencePropertyTest:
  SAY "🔢 Testing Fibonacci Sequence Property (fib(n) = fib(n-1) + fib(n-2))..."

  /* Build sequence up to 15 */
  LET prev = 0
  LET curr = 1

  DO i = 2 TO 15
    LET next = prev + curr
    LET prev = curr
    LET curr = next

    /* Save values for testing */
    IF i = 10 THEN LET fib10 = curr
    IF i = 11 THEN LET fib11 = curr
    IF i = 12 THEN LET fib12 = curr
    IF i = 13 THEN LET fib13 = curr
    IF i = 14 THEN LET fib14 = curr
    IF i = 15 THEN LET fib15 = curr
  END

  /* Verify sequence property for n=12: fib(12) = fib(10) + fib(11) */
  LET expected12 = fib10 + fib11
  ADDRESS EXPECTATIONS "{fib12} should equal {expected12}"

  /* Verify sequence property for n=15: fib(15) = fib(13) + fib(14) */
  LET expected15 = fib13 + fib14
  ADDRESS EXPECTATIONS "{fib15} should equal {expected15}"

RETURN
