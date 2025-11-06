#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags requires, podman, conditional, dogfood */
/* @description Demo of @requires annotation for Podman tests */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Podman Requirements Demo Starting..."

CALL BasicTest
CALL PodmanTest
CALL AnotherBasicTest

EXIT 0

// ============= Tests =============

BasicTest:
  SAY "✅ This test runs always"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @requires podman */
PodmanTest:
  SAY "🦭 This test requires Podman"
  SAY "If you see this, Podman is available!"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

AnotherBasicTest:
  SAY "✅ Final test"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN
