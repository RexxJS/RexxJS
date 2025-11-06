#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags skip, demo, dogfood */
/* @description Demo of skip test capability using @skip annotations */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Skip Capability Demo Test Suite Starting..."

// ============= ARGUMENT PARSING =============
PARSE ARG target_describe .

// ============= EXECUTION CONTROLLER =============
LET matching_tests = SUBROUTINES(target_describe)
DO subroutineName OVER matching_tests
  INTERPRET "CALL " || subroutineName
END

EXIT 0

// ============= Tests =============

PassingTest:
  SAY "✅ This test should pass"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @skip This test is intentionally skipped for demo purposes */
SkippedWithReasonTest:
  SAY "⏭️  This test should be skipped"
  ADDRESS EXPECTATIONS "1 should equal 2"  // Would fail if executed
RETURN

/* @skip */
SkippedWithoutReasonTest:
  SAY "⏭️  This test should also be skipped"
  ADDRESS EXPECTATIONS "2 should equal 3"  // Would fail if executed
RETURN

AnotherPassingTest:
  SAY "✅ This test should also pass"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

/* @skip Known bug - waiting for fix */
FailingTestMarkedAsSkipTest:
  SAY "⏭️  This would fail but is marked as skip"
  LET result = 10 / 0  // Would error if executed
  ADDRESS EXPECTATIONS "result should equal 0"
RETURN

FinalPassingTest:
  SAY "✅ Final test should pass"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN
