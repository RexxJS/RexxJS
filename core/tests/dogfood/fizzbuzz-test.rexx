#!/usr/bin/env ../../rexxt

/*
 * @test-tags fizzbuzz, classic, control-flow, dogfood
 * @description FizzBuzz test - classic programming interview question
 *
 * Tests the FizzBuzz sequence values
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "🎯 FizzBuzz Test Suite Starting..."
SAY "Focus: Testing FizzBuzz sequence values"

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  ADDRESS EXPECTATIONS "TEST_COUNT"
  INTERPRET "CALL " || subroutineName
END

SAY "✅ FizzBuzz Test Suite Complete"
EXIT 0

/* ============= FIZZBUZZ SEQUENCE TEST ============= */
FizzBuzzSequenceTest:
  SAY "🎯 Testing FizzBuzz Sequence 1-15..."

  /* Build sequence manually for 1-15 */
  LET fizzb1 = 1
  LET fizzb2 = 2
  LET fizzb3 = "Fizz"
  LET fizzb4 = 4
  LET fizzb5 = "Buzz"
  LET fizzb6 = "Fizz"
  LET fizzb7 = 7
  LET fizzb8 = 8
  LET fizzb9 = "Fizz"
  LET fizzb10 = "Buzz"
  LET fizzb11 = 11
  LET fizzb12 = "Fizz"
  LET fizzb13 = 13
  LET fizzb14 = 14
  LET fizzb15 = "FizzBuzz"

  /* Verify key values */
  ADDRESS EXPECTATIONS "{fizzb1} should equal 1"
  ADDRESS EXPECTATIONS "{fizzb2} should equal 2"
  ADDRESS EXPECTATIONS "{fizzb3} should equal 'Fizz'"
  ADDRESS EXPECTATIONS "{fizzb4} should equal 4"
  ADDRESS EXPECTATIONS "{fizzb5} should equal 'Buzz'"
  ADDRESS EXPECTATIONS "{fizzb6} should equal 'Fizz'"
  ADDRESS EXPECTATIONS "{fizzb7} should equal 7"
  ADDRESS EXPECTATIONS "{fizzb9} should equal 'Fizz'"
  ADDRESS EXPECTATIONS "{fizzb10} should equal 'Buzz'"
  ADDRESS EXPECTATIONS "{fizzb12} should equal 'Fizz'"
  ADDRESS EXPECTATIONS "{fizzb15} should equal 'FizzBuzz'"

RETURN

/* ============= FIZZBUZZ PATTERN TEST ============= */
FizzBuzzPatternTest:
  SAY "🎯 Testing FizzBuzz Patterns..."

  /* Test specific FizzBuzz values */
  LET val30 = "FizzBuzz"
  LET val21 = "Fizz"
  LET val25 = "Buzz"
  LET val7 = 7

  ADDRESS EXPECTATIONS "{val30} should equal 'FizzBuzz'"
  ADDRESS EXPECTATIONS "{val21} should equal 'Fizz'"
  ADDRESS EXPECTATIONS "{val25} should equal 'Buzz'"
  ADDRESS EXPECTATIONS "{val7} should equal 7"

RETURN
