#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, r-graphics-functions, registry, integration */
/* @description Test loading r-graphics-functions from published registry */

SAY "🧪 Testing Published Module: org.rexxjs/r-graphics-functions"
SAY "Loading module from registry..."

// Load r-graphics-functions from the published registry
REQUIRE "registry:org.rexxjs/r-graphics-functions"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Create histogram
SAY "Test 1: Create histogram"

LET data = [1, 2, 2, 3, 3, 3, 4, 4, 5]

LET histogram = HIST(data)

IF histogram <> "" THEN DO
  SAY "✓ Histogram created"
END
ELSE DO
  SAY "❌ Failed to create histogram"
  EXIT 1
END

SAY ""

// Test 2: Create plot
SAY "Test 2: Create scatter plot"

LET x = [1, 2, 3, 4, 5]
LET y = [2, 4, 6, 8, 10]

LET plot = PLOT(x, y)

IF plot <> "" THEN DO
  SAY "✓ Plot created"
END
ELSE DO
  SAY "❌ Failed to create plot"
  EXIT 1
END

SAY ""
SAY "🎉 All tests passed for org.rexxjs/r-graphics-functions!"
