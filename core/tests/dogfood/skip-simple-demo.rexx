#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags skip, demo, simple, dogfood */
/* @description Simple skip test demo without INTERPRET */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Simple Skip Demo Starting..."

// Call tests directly
CALL PassingTest
CALL SkippedTest
CALL AnotherPassingTest

EXIT 0

// ============= Tests =============

PassingTest:
  SAY "✅ First test"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @skip This is skipped */
SkippedTest:
  SAY "⏭️  This should be skipped"
  ADDRESS EXPECTATIONS "1 should equal 2"  // Would fail if executed
RETURN

AnotherPassingTest:
  SAY "✅ Second test"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN
