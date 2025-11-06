#!/bin/bash
# verify-control-bus.sh
# Quick verification that the Control Bus HTTP API is running

echo "Verifying Control Bus HTTP API..."
echo ""

# Check if port 8083 is listening
echo "1. Checking if port 8083 is listening..."
if lsof -i :8083 > /dev/null 2>&1; then
    echo "   ✓ Port 8083 is listening"
    lsof -i :8083 | grep -v COMMAND
else
    echo "   ✗ Port 8083 is NOT listening"
    echo ""
    echo "   Make sure you started the spreadsheet with:"
    echo "   ./rexxsheet-dev --control-bus"
    echo ""
    exit 1
fi

echo ""
echo "2. Testing HTTP endpoint with curl..."

# Test the endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST http://localhost:8083/api/spreadsheet \
    -H "Authorization: Bearer dev-token-12345" \
    -H "Content-Type: application/json" \
    -d '{"command": "setCell", "params": {"ref": "Z99", "content": "test"}}' \
    2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ HTTP endpoint responding (status: 200)"
    echo "   Response: $BODY"
    echo ""
    echo "Control Bus is working! You can now run:"
    echo "  ../../core/rexx test-control-bus.rexx"
else
    echo "   ✗ HTTP endpoint returned status: $HTTP_CODE"
    echo "   Response: $BODY"
    echo ""
    echo "Check the spreadsheet terminal for error messages."
fi
