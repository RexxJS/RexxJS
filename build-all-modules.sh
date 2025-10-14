#!/bin/bash

# Build all RexxJS modules using hardcoded list
# Usage: ./build-all-modules.sh [clean]
# NOTE: This script must be run from the RexxJS root directory

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Clean dist directories if requested
if [ "$1" = "clean" ]; then
    print_info "Cleaning dist directories..."
    rm -rf ../dist/addresses/
    rm -rf ../dist/functions/
fi

# Create dist directories
mkdir -p ../dist/{addresses,functions}

print_info "Building RexxJS modules..."

# Address handlers
print_info "Building address handlers..."

# sqlite3-address
cd extras/addresses/sqlite3 && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built sqlite-address.bundle.js"
cp extras/addresses/sqlite3/src/sqlite-address.js ../dist/addresses/sqlite-address.js
print_success "Copied sqlite-address.js (unbundled)"

# jq-wasm-functions moved to functions section below
# jq-functions moved to functions section below

# claude-address
cd extras/addresses/anthropic-ai/claude && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built claude-address.bundle.js"
cp extras/addresses/anthropic-ai/claude/src/claude-address.js ../dist/addresses/claude-address.js
print_success "Copied claude-address.js (unbundled)"

# pyodide-address
cd extras/addresses/pyodide && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built pyodide-address.bundle.js"
cp extras/addresses/pyodide/src/pyodide-address.js ../dist/addresses/pyodide-address.js
print_success "Copied pyodide-address.js (unbundled)"

# duckdb-wasm-address
cd extras/addresses/duckdb-wasm-address && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built duckdb-wasm-address.bundle.js"
cp extras/addresses/duckdb-wasm-address/src/duckdb-wasm-address.js ../dist/addresses/duckdb-wasm-address.js
print_success "Copied duckdb-wasm-address.js (unbundled)"

# duckdb-address (native - no build needed, just copy)
cp extras/addresses/duckdb-address/src/duckdb-address.js ../dist/addresses/duckdb-address.js
print_success "Copied duckdb-address.js (native, unbundled)"

# echo-address
cd extras/addresses/echo && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built echo-address.bundle.js"
cp extras/addresses/echo/src/echo-address.js ../dist/addresses/echo-address.js
print_success "Copied echo-address.js (unbundled)"

# system-address
cd extras/addresses/system && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built system-address.bundle.js"
cp extras/addresses/system/src/system-address.js ../dist/addresses/system-address.js
print_success "Copied system-address.js (unbundled)"

# gemini-address (HTTP-based)
cd extras/addresses/gemini-address && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built gemini-address.bundle.js"
cp extras/addresses/gemini-address/src/gemini-address.js ../dist/addresses/gemini-address.js
print_success "Copied gemini-address.js (unbundled)"

# openai-address
cd extras/addresses/open-ai/chat-completions && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built openai-address.bundle.js"
cp extras/addresses/open-ai/chat-completions/src/openai-address.js ../dist/addresses/openai-address.js
print_success "Copied openai-address.js (unbundled)"

# Individual container/VM address handlers (webpack bundled with shared-utils)
print_info "Building individual container/VM address handlers..."

# docker-address
cd extras/addresses/docker-address && npx webpack --config webpack.bundle.config.js && cd ../../..
print_success "Built docker-address.bundle.js"

# podman-address
cd extras/addresses/podman-address && npx webpack --config webpack.bundle.config.js && cd ../../..
print_success "Built podman-address.bundle.js"

# nspawn-address
cd extras/addresses/nspawn-address && npx webpack --config webpack.bundle.config.js && cd ../../..
print_success "Built nspawn-address.bundle.js"

# qemu-address
cd extras/addresses/qemu-address && npx webpack --config webpack.bundle.config.js && cd ../../..
print_success "Built qemu-address.bundle.js"

# virtualbox-address
cd extras/addresses/virtualbox-address && npx webpack --config webpack.bundle.config.js && cd ../../..
print_success "Built virtualbox-address.bundle.js"

# gcp-address
cd extras/addresses/gcp-address && npx webpack --config webpack.bundle.config.js && cd ../../..
# Remove webpack chunk files with weird names
rm -f ../dist/addresses/node_modules_*.gcp-address.bundle.js
print_success "Built gcp-address.bundle.js"

# Function libraries
print_info "Building function libraries..."

# jq-wasm-functions
cd extras/functions/jq-wasm-functions && npx webpack --config webpack.bundle.config.js && cd ../../..
print_success "Built jq-wasm-functions.bundle.js"
cp extras/functions/jq-wasm-functions/src/jq-wasm-functions.js ../dist/functions/jq-wasm-functions.js
print_success "Copied jq-wasm-functions.js (unbundled)"

# jq-functions (native - no build needed, just copy)
cp extras/functions/jq-functions/src/jq-functions.js ../dist/functions/jq-functions.js
print_success "Copied jq-functions.js (native, unbundled)"

# graphviz-functions
cd extras/functions/graphviz && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built graphviz-functions.bundle.js"
cp extras/functions/graphviz/src/graphviz-functions.js ../dist/functions/graphviz-functions.js
print_success "Copied graphviz-functions.js (unbundled)"

# excel-functions
cd extras/functions/excel && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../..
print_success "Built excel-functions.bundle.js"
cp extras/functions/excel/src/excel-functions.js ../dist/functions/excel-functions.js
print_success "Copied excel-functions.js (unbundled)"

# r-regression-functions
cd extras/functions/r-inspired/advanced-analytics && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-regression-functions.bundle.js"
cp extras/functions/r-inspired/advanced-analytics/src/r-regression-functions.js ../dist/functions/r-regression-functions.js
print_success "Copied r-regression-functions.js (unbundled)"

# r-set-functions
cd extras/functions/r-inspired/data-manipulation && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-set-functions.bundle.js"
cp extras/functions/r-inspired/data-manipulation/src/r-set-functions.js ../dist/functions/r-set-functions.js
print_success "Copied r-set-functions.js (unbundled)"

# r-factor-functions
cd extras/functions/r-inspired/data-types && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-factor-functions.bundle.js"
cp extras/functions/r-inspired/data-types/src/r-factor-functions.js ../dist/functions/r-factor-functions.js
print_success "Copied r-factor-functions.js (unbundled)"

# r-graphics-functions
cd extras/functions/r-inspired/graphics && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-graphics-functions.bundle.js"
cp extras/functions/r-inspired/graphics/src/graphics-functions.js ../dist/functions/r-graphics-functions.js
print_success "Copied r-graphics-functions.js (unbundled)"

# r-summary-functions
cd extras/functions/r-inspired/math-stats && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-summary-functions.bundle.js"
cp extras/functions/r-inspired/math-stats/src/r-summary-functions.js ../dist/functions/r-summary-functions.js
print_success "Copied r-summary-functions.js (unbundled)"

# r-timeseries-functions
cd extras/functions/r-inspired/signal-processing && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built r-timeseries-functions.bundle.js"
cp extras/functions/r-inspired/signal-processing/src/r-timeseries-functions.js ../dist/functions/r-timeseries-functions.js
print_success "Copied r-timeseries-functions.js (unbundled)"

# sp-interpolation-functions
cd extras/functions/scipy-inspired/interpolation && npx webpack --config $(pwd)/webpack.bundle.config.js && cd ../../../..
print_success "Built sp-interpolation-functions.bundle.js"
cp extras/functions/scipy-inspired/interpolation/src/sp-interpolation-functions.js ../dist/functions/sp-interpolation-functions.js
print_success "Copied sp-interpolation-functions.js (unbundled)"

# sp-stats-functions
cd extras/functions/scipy-inspired/stats && npx webpack --config src/webpack.bundle.config.js && cd ../../../..
print_success "Built sp-stats-functions.bundle.js"
cp extras/functions/scipy-inspired/stats/src/sp-stats-functions.js ../dist/functions/sp-stats-functions.js
print_success "Copied sp-stats-functions.js (unbundled)"

# sympy-functions
cd extras/functions/sympy-inspired && npx webpack --config src/webpack.bundle.config.js && cd ../../..
print_success "Built sympy-functions.bundle.js"
cp extras/functions/sympy-inspired/src/sympy-functions.js ../dist/functions/sympy-functions.js
print_success "Copied sympy-functions.js (unbundled)"

# diff-functions (native - no build needed, just copy)
cp extras/functions/diff/src/diff-functions.js ../dist/functions/diff-functions.js
print_success "Copied diff-functions.js (native, unbundled)"

# sed-functions (native - no build needed, just copy)
cp extras/functions/sed/src/sed-functions.js ../dist/functions/sed-functions.js
print_success "Copied sed-functions.js (native, unbundled)"

# Strip dependencies from all bundles
print_info "Stripping dependencies from bundles..."
node build-scripts/strip-bundle-dependencies.js
print_success "Dependencies stripped from all bundles"

# Show results
print_info "Build Summary:"
echo ""
echo "ADDRESS handlers (bundled + unbundled):"
ls -lh ../dist/addresses/ 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
echo ""
echo "Function libraries (bundled + unbundled):"
ls -lh ../dist/functions/ 2>/dev/null | grep -v "^total" | awk '{print "  " $5 " " $9}' || echo "  (none)"
echo ""

print_success "Build complete! All modules built successfully."