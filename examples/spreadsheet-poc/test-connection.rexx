-- test-connection.rexx
-- Simple connection test for the Control Bus

SAY "Testing connection to Control Bus..."
SAY ""

LET API_URL = "http://localhost:8083/api/spreadsheet"
LET AUTH_TOKEN = "dev-token-12345"

-- Build simple request
LET request_body = '{"command": "setCell", "params": {"ref": "A1", "content": "100"}}'

-- Create headers as REXX compound variable
LET headers.0 = 2
LET headers.1.key = "Authorization"
LET headers.1.value = "Bearer " || AUTH_TOKEN
LET headers.2.key = "Content-Type"
LET headers.2.value = "application/json"

SAY "Sending POST request to: " || API_URL
SAY "Body: " || request_body
SAY ""

-- Send request
LET response = HTTP_POST(API_URL, request_body, headers)

SAY "Response status: " || response.status
SAY "Response body: " || response.body

IF response.status = 0 THEN DO
  SAY ""
  SAY "ERROR: Connection failed!"
  SAY ""
  SAY "Troubleshooting:"
  SAY "1. Is the spreadsheet running? Check Terminal 1"
  SAY "2. Did you start it with: ./rexxsheet-dev --control-bus"
  SAY "3. Check if port 8083 is listening: lsof -i :8083"
END
ELSE IF response.status = 200 THEN DO
  SAY ""
  SAY "✓ Connection successful!"
END
ELSE DO
  SAY ""
  SAY "Unexpected status code!"
END
