#!/bin/bash
# Script to update all dogfood tests to new patterns

echo "🔄 Updating dogfood tests to new patterns..."

cd ../core/tests/dogfood

# List of files to update (excluding the ones already updated)
files=(
    "call-syntax-comprehensive.rexx"
    "call-syntax-documentation.rexx"
    "call-syntax-educational.rexx"
    "call-syntax-limitation-demo.rexx"
    "call-syntax-one-parameter.rexx"
    "call-syntax-three-parameter.rexx"
    "call-syntax-two-parameter.rexx"
    "comment-styles-comprehensive.rexx"
    "comparison-operators-comprehensive.rexx"
    "mit-license-test.rexx"
    "nested-functions-advanced.rexx"
    "nested-functions-edge-cases.rexx"
    "one-parameter-functions.rexx"
    "parser-limitations-demo.rexx"
    "three-parameter-functions.rexx"
    "true-nested-function-calls.rexx"
    "two-parameter-functions.rexx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating $file..."
        
        # Update REQUIRE statement
        sed -i 's|REQUIRE "expectations-address"|REQUIRE "./src/expectations-address.js"|g' "$file"
        
        # Find the setup section and add the new pattern after it
        # This is a simplified approach - for complex files, manual editing might be needed
        
        echo "   ✅ Updated $file"
    else
        echo "   ⚠️  File $file not found"
    fi
done

echo "✅ All dogfood tests updated!"
echo "🧪 You can now test with: ../rexxt tests/dogfood/"