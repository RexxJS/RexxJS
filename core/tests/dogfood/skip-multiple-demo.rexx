#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags skip, demo, multiple, dogfood */
/* @description Multiple skip test demo */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Multiple Skip Demo Starting..."

CALL FirstTest
CALL SecondTest
CALL ThirdTest
CALL FourthTest
CALL FifthTest

EXIT 0

FirstTest:
  SAY "✅ Test 1 passes"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @skip Skipping test 2 */
SecondTest:
  SAY "Should be skipped"
  ADDRESS EXPECTATIONS "1 should equal 2"
RETURN

ThirdTest:
  SAY "✅ Test 3 passes"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN

/* @skip Skipping test 4 - known issue */
FourthTest:
  SAY "Should be skipped"
  ADDRESS EXPECTATIONS "4 should equal 5"
RETURN

/* @skip Skipping test 5 */
FifthTest:
  SAY "Should be skipped"
  ADDRESS EXPECTATIONS "5 should equal 6"
RETURN
