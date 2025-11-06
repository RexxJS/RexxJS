#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags requires, open-system, flexible, dogfood */
/* @description Demo of open capability system - any name works! */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Open Capability System Demo Starting..."
SAY "The @requires system is OPEN - no hard-coded tech list!"
SAY ""

CALL AlwaysRunsTest
CALL GitTest
CALL DoofusTest
CALL FoobarTest
CALL ArbitraryTest

EXIT 0

// ============= Tests =============

AlwaysRunsTest:
  SAY "✅ Test with no requirements (always runs)"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @requires git */
GitTest:
  SAY "📦 Test requires 'git' command"
  SAY "    (Checks if 'git' command exists on system)"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

/* @requires doofus */
DoofusTest:
  SAY "🎭 Test requires 'doofus' command"
  SAY "    (System checks if 'doofus' exists - it probably doesn't!)"
  SAY "    (This shows the system is OPEN - any name works)"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN

/* @requires foobar */
FoobarTest:
  SAY "🎪 Test requires 'foobar' command"
  SAY "    (Another arbitrary capability name)"
  ADDRESS EXPECTATIONS "4 should equal 4"
RETURN

/* @requires anything */
ArbitraryTest:
  SAY "🌟 Test requires 'anything' command"
  SAY "    (Literally any capability name works!)"
  ADDRESS EXPECTATIONS "5 should equal 5"
RETURN
