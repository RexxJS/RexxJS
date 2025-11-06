#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags requires, boolean, flexible, dogfood */
/* @description @requires is about BOOLEAN DETERMINATION, not just commands! */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Boolean Determination Demo"
SAY ""
SAY "@requires is about YES/NO decisions - ANY kind!"
SAY "NOT just 'commands in PATH'"
SAY ""

CALL AlwaysRunsTest
CALL CommandCheckTest
CALL EnvironmentVariableTest
CALL FeatureFlagTest
CALL PlatformCheckTest

EXIT 0

// ============= Tests =============

AlwaysRunsTest:
  SAY "✅ Test with no requirements"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @requires git */
CommandCheckTest:
  SAY "📦 @requires git"
  SAY "   → Checks if 'git' command exists (fallback behavior)"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

/* @requires ci-environment */
EnvironmentVariableTest:
  SAY "🔧 @requires ci-environment"
  SAY "   → Boolean check: Are we in CI?"
  SAY "   → Could check env vars, not just commands!"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN

/* @requires feature-x */
FeatureFlagTest:
  SAY "🎯 @requires feature-x"
  SAY "   → Boolean check: Is feature-x enabled?"
  SAY "   → Defined in .rexxt-capabilities.js or env var"
  ADDRESS EXPECTATIONS "4 should equal 4"
RETURN

/* @requires linux */
PlatformCheckTest:
  SAY "🐧 @requires linux"
  SAY "   → Boolean check: Running on Linux?"
  SAY "   → Platform check, not a command!"
  ADDRESS EXPECTATIONS "5 should equal 5"
RETURN
