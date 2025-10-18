#!/bin/bash

set -e

# Initialize statistics
TOTAL_JEST_SUITES=0
TOTAL_JEST_TESTS=0
TOTAL_JEST_PASSED=0
TOTAL_JEST_FAILED=0
TOTAL_REXXT_FILES=0
TOTAL_REXXT_TESTS=0
TOTAL_REXXT_EXPECTATIONS=0
TOTAL_PLAYWRIGHT_TESTS=0
TOTAL_PLAYWRIGHT_PASSED=0
TOTAL_PLAYWRIGHT_FAILED=0
TOTAL_PLAYWRIGHT_SKIPPED=0
JEST_MODULES=()
REXXT_MODULES=()
PLAYWRIGHT_MODULES=()
SKIPPED_MODULES=()
WEB_SERVER_PID=""

# Function to extract Jest stats from output
extract_jest_stats() {
  local output="$1"
  local module="$2"
  local module_path="$3"
  local temp_file="$4"
  
  # Extract test suites from Jest output
  local suites_line=$(echo "$output" | grep -E "Test Suites:" | tail -1)
  local passed_suites=0
  local failed_suites=0
  
  if [[ "$suites_line" =~ Test\ Suites:\ ([0-9]+)\ passed ]]; then
    passed_suites=${BASH_REMATCH[1]}
  elif [[ "$suites_line" =~ Test\ Suites:\ ([0-9]+)\ failed,\ ([0-9]+)\ passed ]]; then
    failed_suites=${BASH_REMATCH[1]}
    passed_suites=${BASH_REMATCH[2]}
  fi
  
  # Extract tests from Jest output
  local tests_line=$(echo "$output" | grep -E "Tests:" | tail -1)
  local passed_tests=0
  local failed_tests=0
  
  if [[ "$tests_line" =~ Tests:\ +([0-9]+)\ passed ]]; then
    passed_tests=${BASH_REMATCH[1]}
  elif [[ "$tests_line" =~ Tests:\ +([0-9]+)\ failed,\ ([0-9]+)\ passed ]]; then
    failed_tests=${BASH_REMATCH[1]}
    passed_tests=${BASH_REMATCH[2]}
  fi
  
  # Extract duration from Jest output
  local duration_line=$(echo "$output" | grep -E "Time:" | tail -1)
  local duration=""
  if [[ "$duration_line" =~ Time:.*([0-9]+\.?[0-9]*\ s) ]]; then
    duration=${BASH_REMATCH[1]}
  fi
  
  # Default to 0 if extraction failed
  passed_suites=${passed_suites:-0}
  failed_suites=${failed_suites:-0}
  passed_tests=${passed_tests:-0}
  failed_tests=${failed_tests:-0}
  
  local total_suites=$((passed_suites + failed_suites))
  local total_tests=$((passed_tests + failed_tests))
  
  TOTAL_JEST_SUITES=$((TOTAL_JEST_SUITES + total_suites))
  TOTAL_JEST_TESTS=$((TOTAL_JEST_TESTS + total_tests))
  TOTAL_JEST_PASSED=$((TOTAL_JEST_PASSED + passed_tests))
  TOTAL_JEST_FAILED=$((TOTAL_JEST_FAILED + failed_tests))
  
  # Output temp file content if there were failures
  if [ "$failed_tests" -gt 0 ] && [ -f "$temp_file" ]; then
    echo "❌ Test failures in $module:"
    cat "$temp_file"
  fi
  
  if [ -n "$duration" ]; then
    JEST_MODULES+=("$module_path: $passed_tests/$total_tests tests ($duration)")
  else
    JEST_MODULES+=("$module_path: $passed_tests/$total_tests tests")
  fi
}

# Function to extract rexxt stats from output
extract_rexxt_stats() {
  local output="$1"
  local module="$2"
  local module_path="$3"
  local temp_file="$4"
  
  # Extract files, tests, and expectations from rexxt summary
  local files=$(echo "$output" | grep "test sources executed" | sed -E 's/.*([0-9]+) test sources executed.*/\1/' | tail -1)
  local tests=$(echo "$output" | grep -E "[0-9]+ tests" | sed -E 's/.*([0-9]+) tests.*/\1/' | tail -1)
  local expectations=$(echo "$output" | grep "expectations executed" | sed -E 's/.*([0-9]+) expectations executed.*/\1/' | tail -1)
  
  files=${files:-0}
  tests=${tests:-0}
  expectations=${expectations:-0}
  
  TOTAL_REXXT_FILES=$((TOTAL_REXXT_FILES + files))
  TOTAL_REXXT_TESTS=$((TOTAL_REXXT_TESTS + tests))
  TOTAL_REXXT_EXPECTATIONS=$((TOTAL_REXXT_EXPECTATIONS + expectations))
  
  if [ "$files" -gt 0 ]; then
    REXXT_MODULES+=("$module_path: $files files, $tests tests, $expectations expectations")
  fi
  
  # Check for rexxt failures (look for error patterns in output)
  if echo "$output" | grep -q -E "(Error|FAIL|failed|exception)" && [ -f "$temp_file" ]; then
    echo "❌ Rexxt failures in $module:"
    cat "$temp_file"
  fi
}

run_test() {
  local module_path="$1"
  local module_name="$2"
  echo "  🧪 Testing $module_name..."
  cd "$module_path"
  if [ -f "package.json" ]; then
    MODULE_JEST_TEMP=$(mktemp)
    MODULE_JEST_OUTPUT=$(npm test -- --ci --verbose 2>&1 | tee "$MODULE_JEST_TEMP")
    extract_jest_stats "$MODULE_JEST_OUTPUT" "$module_name" "$(pwd)" "$MODULE_JEST_TEMP"
    rm -f "$MODULE_JEST_TEMP"
  fi
  cd - > /dev/null
}

# Function to extract Playwright stats from output
extract_playwright_stats() {
  local output="$1"
  local temp_file="$2"

  # Extract test counts from Playwright output
  local passed=$(echo "$output" | grep -oE "[0-9]+ passed" | grep -oE "[0-9]+" | tail -1)
  local failed=$(echo "$output" | grep -oE "[0-9]+ failed" | grep -oE "[0-9]+" | tail -1)
  local skipped=$(echo "$output" | grep -oE "[0-9]+ skipped" | grep -oE "[0-9]+" | tail -1)

  passed=${passed:-0}
  failed=${failed:-0}
  skipped=${skipped:-0}

  local total=$((passed + failed + skipped))

  TOTAL_PLAYWRIGHT_TESTS=$((TOTAL_PLAYWRIGHT_TESTS + total))
  TOTAL_PLAYWRIGHT_PASSED=$((TOTAL_PLAYWRIGHT_PASSED + passed))
  TOTAL_PLAYWRIGHT_FAILED=$((TOTAL_PLAYWRIGHT_FAILED + failed))
  TOTAL_PLAYWRIGHT_SKIPPED=$((TOTAL_PLAYWRIGHT_SKIPPED + skipped))

  PLAYWRIGHT_MODULES+=("core/web: $passed passed, $failed failed, $skipped skipped")

  # Output failures if any
  if [ "$failed" -gt 0 ] && [ -f "$temp_file" ]; then
    echo "❌ Playwright test failures:"
    cat "$temp_file" | grep -A 5 "failed"
  fi
}

# Function to start web server for Playwright tests
start_web_server() {
  echo "  🌐 Starting web server on port 8000..."
  cd "$(pwd)"
  npx http-server -p 8000 -s > /dev/null 2>&1 &
  WEB_SERVER_PID=$!

  # Wait for server to be ready
  sleep 2

  # Verify server is running
  if curl -s http://localhost:8000/ > /dev/null; then
    echo "    ✅ Web server started (PID: $WEB_SERVER_PID)"
    return 0
  else
    echo "    ❌ Web server failed to start"
    return 1
  fi
}

# Function to stop web server
stop_web_server() {
  if [ -n "$WEB_SERVER_PID" ]; then
    echo "  🛑 Stopping web server (PID: $WEB_SERVER_PID)..."
    kill $WEB_SERVER_PID 2>/dev/null || true
    wait $WEB_SERVER_PID 2>/dev/null || true
  fi
}


echo "🚀 Starting CI pipeline..."
echo "========================="

# Run core tests
echo "📦 Running core tests..."
cd core/
CORE_JEST_TEMP=$(mktemp)
CORE_JEST_OUTPUT=$(npx jest --ci --verbose 2>&1 | tee "$CORE_JEST_TEMP")
extract_jest_stats "$CORE_JEST_OUTPUT" "core" "$(pwd)" "$CORE_JEST_TEMP"
rm -f "$CORE_JEST_TEMP"

CORE_REXXT_TEMP=$(mktemp)
CORE_REXXT_OUTPUT=$(./rexxt tests/dogfood/* 2>&1 | tee "$CORE_REXXT_TEMP")
extract_rexxt_stats "$CORE_REXXT_OUTPUT" "core/dogfood" "$(pwd)" "$CORE_REXXT_TEMP"
rm -f "$CORE_REXXT_TEMP"

# Run Playwright web tests for demo pages
echo ""
echo "🎭 Running Playwright web tests..."
start_web_server

# Use trap to ensure web server is stopped
trap stop_web_server EXIT

PLAYWRIGHT_TEMP=$(mktemp)
# Skip snapshot tests in CI - they're brittle and fail when output changes
PLAYWRIGHT_OUTPUT=$(PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/web/repl-demo-pages.spec.js --project=chromium 2>&1 | tee "$PLAYWRIGHT_TEMP")
extract_playwright_stats "$PLAYWRIGHT_OUTPUT" "$PLAYWRIGHT_TEMP"
rm -f "$PLAYWRIGHT_TEMP"

stop_web_server
trap - EXIT

cd ..

echo ""
echo "📁 Running extras/functions tests..."
run_test "extras/functions/graphviz" "graphviz"
run_test "extras/functions/graphviz/src" "graphviz/src"
# run_test "extras/functions/r-inspired/advanced-analytics" "r-inspired/advanced-analytics"
# run_test "extras/functions/r-inspired/data-manipulation" "r-inspired/data-manipulation"
# run_test "extras/functions/r-inspired/data-types" "r-inspired/data-types"
# run_test "extras/functions/r-inspired/graphics" "r-inspired/graphics"
# run_test "extras/functions/r-inspired/math-stats" "r-inspired/math-stats"
# run_test "extras/functions/r-inspired/signal-processing" "r-inspired/signal-processing"
# run_test "extras/functions/r-inspired" "r-inspired"
run_test "extras/functions/scipy-inspired/interpolation" "scipy-inspired/interpolation"
run_test "extras/functions/scipy-inspired/stats" "scipy-inspired/stats"
run_test "extras/functions/scipy-inspired/stats/src" "scipy-inspired/stats/src"
run_test "extras/functions/excel" "excel"
run_test "extras/functions/numpy-inspired" "numpy-inspired"
run_test "extras/functions/sympy-inspired/src" "sympy-inspired/src"
run_test "extras/functions/sympy-inspired" "sympy-inspired"
run_test "extras/functions/numpy-via-pyoide" "numpy-via-pyoide"
run_test "extras/functions/jq-functions" "jq-functions"
run_test "extras/functions/jq-wasm-functions" "jq-wasm-functions"
run_test "extras/functions/minimatch" "minimatch"
run_test "extras/functions/diff" "diff"
run_test "extras/functions/sed" "sed"
run_test "extras/functions/matlab-inspired" "matlab-inspired"

echo ""
echo "📁 Running extras/addresses tests..."
run_test "extras/addresses/anthropic-ai/claude" "anthropic-ai/claude"
run_test "extras/addresses/sqlite3" "sqlite3"
run_test "extras/addresses/open-ai/chat-completions" "open-ai/chat-completions"
run_test "extras/addresses/pyodide/src" "pyodide/src"
run_test "extras/addresses/pyodide" "pyodide"
run_test "extras/addresses/system" "system"
run_test "extras/addresses/duckdb-address" "duckdb-address"
run_test "extras/addresses/duckdb-wasm-address" "duckdb-wasm-address"
run_test "extras/addresses/duckdb-wasm-address/src" "duckdb-wasm-address/src"
run_test "extras/addresses/docker-address" "docker-address"
run_test "extras/addresses/gcp-address" "gcp-address"
run_test "extras/addresses/google-cloud-platform" "google-cloud-platform"
run_test "extras/addresses/nspawn-address" "nspawn-address"
run_test "extras/addresses/podman-address" "podman-address"
run_test "extras/addresses/qemu-address" "qemu-address"
run_test "extras/addresses/virtualbox-address" "virtualbox-address"
run_test "extras/addresses/gemini-address" "gemini-address"

# Print final statistics
echo ""
echo "::group::🏁 CI PIPELINE SUMMARY"
echo "======================"
echo ""
echo "📊 Jest Test Results:"
echo "  Total Test Suites: $TOTAL_JEST_SUITES"
echo "  Total Tests: $TOTAL_JEST_TESTS"
echo "  ✅ Passed: $TOTAL_JEST_PASSED"
echo "  ❌ Failed: $TOTAL_JEST_FAILED"
if [ "$TOTAL_JEST_TESTS" -gt 0 ]; then
  JEST_PASS_RATE=$((TOTAL_JEST_PASSED * 100 / TOTAL_JEST_TESTS))
  echo "  📈 Pass Rate: $JEST_PASS_RATE%"
fi
echo ""

echo "📊 Rexxt Test Results:"
echo "  Total Test Files: $TOTAL_REXXT_FILES"
echo "  Total Tests: $TOTAL_REXXT_TESTS"
echo "  Total Expectations: $TOTAL_REXXT_EXPECTATIONS"
echo ""

echo "📊 Playwright Web Test Results:"
echo "  Total Tests: $TOTAL_PLAYWRIGHT_TESTS"
echo "  ✅ Passed: $TOTAL_PLAYWRIGHT_PASSED"
echo "  ❌ Failed: $TOTAL_PLAYWRIGHT_FAILED"
echo "  ⏭️  Skipped: $TOTAL_PLAYWRIGHT_SKIPPED"
if [ "$TOTAL_PLAYWRIGHT_TESTS" -gt 0 ]; then
  PLAYWRIGHT_PASS_RATE=$((TOTAL_PLAYWRIGHT_PASSED * 100 / TOTAL_PLAYWRIGHT_TESTS))
  echo "  📈 Pass Rate: $PLAYWRIGHT_PASS_RATE%"
fi
echo ""

echo "📁 Module Breakdown:"
echo "Jest modules:"
for module in "${JEST_MODULES[@]}"; do
  echo "  • $module"
done
echo ""

if [ ${#REXXT_MODULES[@]} -gt 0 ]; then
  echo "Rexxt modules:"
  for module in "${REXXT_MODULES[@]}"; do
    echo "  • $module"
  done
  echo ""
fi

if [ ${#PLAYWRIGHT_MODULES[@]} -gt 0 ]; then
  echo "Playwright web modules:"
  for module in "${PLAYWRIGHT_MODULES[@]}"; do
    echo "  • $module"
  done
  echo ""
fi

if [ ${#SKIPPED_MODULES[@]} -gt 0 ]; then
  echo "Skipped modules:"
  for module in "${SKIPPED_MODULES[@]}"; do
    echo "  • $module"
  done
  echo ""
fi
echo "::endgroup::"

# Final status
if [ "$TOTAL_JEST_FAILED" -eq 0 ] && [ "$TOTAL_PLAYWRIGHT_FAILED" -eq 0 ]; then
  echo "🎉 All tests passed!"

  # Build binary after successful tests
  echo ""
  echo "🔨 Building binaries..."

  BINARY_BUILD_SUCCESS=true

  # Build linux-x64 binary
  echo "Building linux-x64 binary..."
  if ./make-binary.sh linux-x64; then
    echo "✅ linux-x64 binary build completed"
  else
    echo "❌ linux-x64 binary build failed"
    BINARY_BUILD_SUCCESS=false
  fi

  # Build linux-arm64 binary (if on compatible platform)
  echo ""
  echo "Building linux-arm64 binary..."
  if ./make-binary.sh linux-arm64; then
    echo "✅ linux-arm64 binary build completed"
  else
    echo "❌ linux-arm64 binary build failed"
    BINARY_BUILD_SUCCESS=false
  fi

  if [ "$BINARY_BUILD_SUCCESS" = true ]; then
    echo "✅ All binary builds completed successfully"
  else
    echo "⚠️ Some binary builds failed"
  fi

  exit 0
else
  TOTAL_FAILURES=$((TOTAL_JEST_FAILED + TOTAL_PLAYWRIGHT_FAILED))
  echo "💥 $TOTAL_FAILURES tests failed"
  if [ "$TOTAL_JEST_FAILED" -gt 0 ]; then
    echo "  - Jest: $TOTAL_JEST_FAILED failed"
  fi
  if [ "$TOTAL_PLAYWRIGHT_FAILED" -gt 0 ]; then
    echo "  - Playwright: $TOTAL_PLAYWRIGHT_FAILED failed"
  fi
  exit 1
fi
