#!/usr/bin/env ../../rexxt

/*
 * @test-tags palindrome, strings, classic, algorithms, dogfood
 * @description Palindrome detection test - classic string manipulation
 *
 * Tests palindrome detection for strings and numbers
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
REQUIRE "../../src/expectations-address.js"

/* ============= SETUP SECTION ============= */
SAY "📝 Palindrome Test Suite Starting..."
SAY "Focus: Testing palindrome detection for strings and numbers"

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  ADDRESS EXPECTATIONS "TEST_COUNT"
  INTERPRET "CALL " || subroutineName
END

SAY "✅ Palindrome Test Suite Complete"
EXIT 0

/* ============= SIMPLE STRING PALINDROMES ============= */
SimpleStringPalindromesTest:
  SAY "📝 Testing Simple String Palindromes..."

  /* Single character is a palindrome */
  LET str = "a"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* Two same characters */
  LET str = "aa"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "racecar" is a palindrome */
  LET str = "racecar"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "radar" is a palindrome */
  LET str = "radar"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "level" is a palindrome */
  LET str = "level"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

RETURN

/* ============= NON-PALINDROME STRINGS ============= */
NonPalindromeStringsTest:
  SAY "📝 Testing Non-Palindrome Strings..."

  /* "hello" is not a palindrome */
  LET str = "hello"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 0"

  /* "world" is not a palindrome */
  LET str = "world"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 0"

  /* "test" is not a palindrome */
  LET str = "test"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 0"

RETURN

/* ============= ODD LENGTH PALINDROMES ============= */
OddLengthPalindromesTest:
  SAY "📝 Testing Odd Length Palindromes..."

  /* "aba" - 3 characters */
  LET str = "aba"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "civic" - 5 characters */
  LET str = "civic"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "rotator" - 7 characters */
  LET str = "rotator"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

RETURN

/* ============= EVEN LENGTH PALINDROMES ============= */
EvenLengthPalindromesTest:
  SAY "📝 Testing Even Length Palindromes..."

  /* "abba" - 4 characters */
  LET str = "abba"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "noon" - 4 characters */
  LET str = "noon"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "bookkoob" - 8 characters */
  LET str = "bookkoob"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

RETURN

/* ============= NUMERIC PALINDROMES ============= */
NumericPalindromesTest:
  SAY "📝 Testing Numeric Palindromes..."

  /* Single digit is palindrome */
  LET num = 5
  LET str = num || ""
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* 121 is a palindrome */
  LET num = 121
  LET str = num || ""
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* 1331 is a palindrome */
  LET num = 1331
  LET str = num || ""
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* 12321 is a palindrome */
  LET num = 12321
  LET str = num || ""
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* 123 is not a palindrome */
  LET num = 123
  LET str = num || ""
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 0"

RETURN

/* ============= CASE SENSITIVITY TEST ============= */
CaseSensitivityTest:
  SAY "📝 Testing Case-Insensitive Palindromes..."

  /* "Racecar" is palindrome when case-insensitive */
  LET str = "Racecar"
  LET lower_str = LOWER(str)
  LET reversed = REVERSE(lower_str)
  LET is_palindrome = 0
  IF lower_str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* "Level" is palindrome when case-insensitive */
  LET str = "Level"
  LET lower_str = LOWER(str)
  LET reversed = REVERSE(lower_str)
  LET is_palindrome = 0
  IF lower_str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 1"

  /* But case-sensitive check fails */
  LET str = "Racecar"
  LET reversed = REVERSE(str)
  LET is_palindrome = 0
  IF str = reversed THEN is_palindrome = 1
  ADDRESS EXPECTATIONS "{is_palindrome} should equal 0"

RETURN
