#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags requires, multiple, conditional, dogfood */
/* @description Demo of @requires with multiple capabilities */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Multiple Requirements Demo Starting..."

CALL NoRequirementsTest
CALL GitTest
CALL DockerTest
CALL DockerAndCurlTest
CALL PodmanTest
CALL FinalTest

EXIT 0

// ============= Tests =============

NoRequirementsTest:
  SAY "✅ Test with no requirements"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @requires git */
GitTest:
  SAY "📦 Test requires git"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

/* @requires docker */
DockerTest:
  SAY "🐳 Test requires Docker"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN

/* @requires docker, curl */
DockerAndCurlTest:
  SAY "🐳📡 Test requires both Docker AND curl"
  SAY "Both must be present for this test to run"
  ADDRESS EXPECTATIONS "4 should equal 4"
RETURN

/* @requires podman */
PodmanTest:
  SAY "🦭 Test requires Podman"
  ADDRESS EXPECTATIONS "5 should equal 5"
RETURN

FinalTest:
  SAY "✅ Final test (no requirements)"
  ADDRESS EXPECTATIONS "6 should equal 6"
RETURN
