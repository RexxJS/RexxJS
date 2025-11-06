# Testing the Control Bus HTTP API

## ARexx-Style IPC for RexxJS Spreadsheet

This demonstrates classic Amiga ARexx-style inter-process communication: a Node.js REXX script controlling a separate Tauri desktop application via HTTP.

## Recommended Approach: ADDRESS Facility

The idiomatic REXX way to communicate with external applications is through the ADDRESS facility, just like classic ARexx. This is the **recommended approach**.

## Setup

### Terminal 1: Start the Spreadsheet with Control Bus

```bash
cd examples/spreadsheet-poc

# Launch with control bus enabled
./rexxsheet-dev --control-bus

# Or with a specific file
./rexxsheet-dev --control-bus test-sheet.json
```

You should see output like:
```
Control Bus HTTP API enabled
API URL: http://localhost:8083/api/spreadsheet
Token: dev-token-12345

Loading with sample data...
```

The spreadsheet window will open and the HTTP API will be listening on port 8083.

### Terminal 2: Run the REXX Control Script

In a separate terminal:

```bash
cd examples/spreadsheet-poc

# Run the ADDRESS-based test (recommended)
../../core/rexx test-spreadsheet-address.rexx
```

The script uses the ADDRESS facility like classic ARexx - **no external libraries needed!**

```rexx
-- Register the remote spreadsheet endpoint (automatically switches to it)
ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET

-- Now in SPREADSHEET context - commands go to the remote endpoint
"setCell A1 10"
"setCell A2 20"
"setCell A3 =A1+A2"
```

### Alternative: Low-Level Debugging

For troubleshooting HTTP connectivity issues, you can use the low-level test:

```bash
# Run the low-level HTTP_POST test (debugging only)
../../core/rexx test-connection.rexx
```

This bypasses the ADDRESS facility and uses direct HTTP_POST calls, useful for diagnosing connection problems.

The script will:
1. Connect to the running spreadsheet via HTTP
2. Send commands to set cell values:
   - A1 = 10
   - A2 = 20
   - A3 = =A1 + A2 (formula)
3. You'll see the cells update in the spreadsheet window in real-time!

## Expected Output

**Terminal 2 (REXX script):**
```
RexxJS Spreadsheet - Control Bus Test
======================================

Sending command: setCell
  ✓ Success
Sending command: setCell
  ✓ Success
Sending command: setCell
  ✓ Success

Commands sent successfully!
Check the spreadsheet window to see:
  A1 = 10
  A2 = 20
  A3 = 30 (formula: =A1 + A2)

Test completed! ✓
```

**Spreadsheet Window:**
You should see the cells A1, A2, and A3 populated with the values sent from the REXX script.

## Testing with curl

You can also test the API directly with curl:

```bash
# Set a cell value
curl -X POST http://localhost:8083/api/spreadsheet \
  -H "Authorization: Bearer dev-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"command": "setCell", "params": {"ref": "B1", "content": "Hello from curl!"}}'

# Get cell value
curl -X POST http://localhost:8083/api/spreadsheet \
  -H "Authorization: Bearer dev-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"command": "getCellValue", "params": {"ref": "B1"}}'
```

## Authentication

The `AUTH` parameter in ADDRESS remote uses **Bearer token** authentication:

```rexx
ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET
```

This sends the HTTP header:
```
Authorization: Bearer dev-token-12345
```

### Custom Authentication Token

Set a custom token via environment variable:

```bash
# Terminal 1
CONTROL_BUS_TOKEN=my-secret-token ./rexxsheet-dev --control-bus

# Terminal 2 - update the AUTH parameter in your REXX script
ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "my-secret-token" AS SPREADSHEET
```

**Note:** Only Bearer token authentication is currently supported. This is the most common pattern for REST APIs.

## Writing Your Own Control Scripts

### Using ADDRESS (Recommended)

Create your own REXX scripts using the ADDRESS facility - the idiomatic ARexx way. **No external libraries needed!**

```rexx
-- my-automation.rexx
-- Build a multiplication table using ADDRESS

-- Register the remote spreadsheet (automatically switches to it)
ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET

-- Build a multiplication table (already in SPREADSHEET context)
DO row = 1 TO 10
  DO col = 1 TO 10
    -- Calculate cell reference (A1, B1, etc.)
    LET col_letter = CHR(64 + col)  -- A=65, B=66, etc.
    LET ref = col_letter || row
    LET value = row * col

    -- Send command to spreadsheet
    "setCell" ref value

    IF RC <> 0 THEN
      SAY "Error setting" ref
  END
END

SAY "Multiplication table complete!"
```

The ADDRESS approach is the most idiomatic - it abstracts away the HTTP details and follows the classic ARexx pattern. The remote HTTP endpoint registration is **built into the RexxJS core interpreter**, so no external libraries or REQUIRE statements are needed.

## Troubleshooting

### "Connection refused"
- Make sure the spreadsheet is running with `--control-bus` flag
- Check that port 8083 is not being used by another application

### "Unauthorized" (401 error)
- Verify the AUTH_TOKEN matches between the spreadsheet and your script
- Check the Authorization header format: `Bearer <token>`

### "Commands not having effect"
- Check the browser console in the spreadsheet window for errors
- Verify the command format matches the expected structure

### Rust compilation errors
If you get Rust errors when starting the spreadsheet:
```bash
cd src-tauri
cargo clean
cargo build
```

## What This Demonstrates

This is a modern recreation of the Amiga ARexx system where:
- **DPaint, PageStream, Directory Opus** → RexxJS Spreadsheet (Tauri app)
- **ARexx scripts** → Node.js REXX scripts
- **ARexx ports** → HTTP API with JSON

Just like on the Amiga, you can now write REXX scripts that control applications, automate workflows, and create powerful inter-application pipelines!
