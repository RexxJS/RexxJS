#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags requires, docker, conditional, dogfood */
/* @description Demo of @requires annotation for Docker tests */

REQUIRE "../../src/expectations-address.js"

SAY "🧪 Docker Requirements Demo Starting..."

CALL BasicTest
CALL DockerBasicTest
CALL DockerAdvancedTest
CALL AnotherBasicTest

EXIT 0

// ============= Tests =============

BasicTest:
  SAY "✅ This test runs always (no requirements)"
  ADDRESS EXPECTATIONS "1 should equal 1"
RETURN

/* @requires docker */
DockerBasicTest:
  SAY "🐳 This test requires Docker"
  SAY "If you see this, Docker is available!"
  ADDRESS EXPECTATIONS "2 should equal 2"
RETURN

/* @requires docker */
DockerAdvancedTest:
  SAY "🐳 Another Docker test"
  SAY "This would do Docker-specific operations"
  ADDRESS EXPECTATIONS "3 should equal 3"
RETURN

AnotherBasicTest:
  SAY "✅ Final test (no requirements)"
  ADDRESS EXPECTATIONS "4 should equal 4"
RETURN
