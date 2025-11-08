-- test-spreadsheet-address.rexx
-- ARexx-style spreadsheet control demonstration
--
-- Usage:
--   1. Start spreadsheet with control bus:
--      ./rexxsheet-dev --control-bus
--
--   2. Run this script in another terminal:
--      ../../core/rexx test-spreadsheet-address.rexx
--
-- This demonstrates classic ARexx-style IPC

SAY "RexxJS Spreadsheet - ARexx-Style Control Demo"
SAY "==============================================="
SAY ""

/* Register and target the spreadsheet port */
ADDRESS "http://localhost:2410/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET

/* Check spreadsheet version */
SAY "Checking spreadsheet version..."
'SPREADSHEET_VERSION()'
IF RC = 0 THEN DO
  SAY "  Spreadsheet version:" RESULT
END
SAY ""

SAY "Sending commands to spreadsheet..."
SAY "Watch the spreadsheet window for real-time updates!"
SAY ""

/* Set A1 to 100 */
SAY "Setting A1 = 100..."
'SETCELL("A1", "100")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END
ELSE DO
  SAY "  ✗ Failed with RC =" RC
END

/* Get A1 value - result returns via RESULT variable */
SAY "Getting A1 value..."
'GETCELL("A1")'
IF RC = 0 THEN DO
  SAY "  ✓ Got A1 =" RESULT
END
ELSE DO
  SAY "  ✗ Failed with RC =" RC
END

/* Set A2 to 200 */
SAY ""
SAY "Setting A2 = 200..."
'SETCELL("A2", "200")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

/* Set A3 to a formula */
SAY "Setting A3 = =A1+A2 (formula)..."
'SETCELL("A3", "=A1+A2")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

/* Get A3 calculated value */
SAY "Getting A3 value..."
'GETCELL("A3")'
IF RC = 0 THEN DO
  SAY "  ✓ Got A3 =" RESULT "(calculated from =A1+A2)"
END
ELSE DO
  SAY "  ✗ Failed with RC =" RC
END

/* Set B1 to text */
SAY "Setting B1 = 'Hello from REXX!'..."
'SETCELL("B1", "Hello from REXX!")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

/* Set B2 to uppercase formula */
SAY "Setting B2 = =UPPER(B1)..."
'SETCELL("B2", "=UPPER(B1)")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

'SETCELL("B3", "=B2 |> LOWER")'
IF RC = 0 THEN DO
  SAY "  ✓ B3 formula set"
END
ELSE DO
  SAY "  ✗ B3 formula failed with RC =" RC
END

'GETCELL("B3")'
IF RC = 0 THEN DO
  SAY "  ✓ Got B3 =" RESULT "(should be 'hello from rexx!')"
END
ELSE DO
  SAY "  ✗ Failed with RC =" RC "ERRORTEXT =" ERRORTEXT
END

/* Test formatting features */
SAY ""
SAY "Testing formatting features..."
SAY ""

/* Test number formatting */
SAY "Setting D1 = 123.456789..."
'SETCELL("D1", "123.456789")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

SAY "Formatting D1 with 2 decimal places..."
'SETFORMAT("D1", "number:0.00")'
IF RC = 0 THEN DO
  SAY "  ✓ Format applied: number:0.00"
END

/* Test currency formatting */
SAY "Setting D2 = 1234.56..."
'SETCELL("D2", "1234.56")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

SAY "Formatting D2 as USD currency..."
'SETFORMAT("D2", "currency:USD")'
IF RC = 0 THEN DO
  SAY "  ✓ Format applied: currency:USD"
END

/* Test percentage formatting */
SAY "Setting D3 = 0.125..."
'SETCELL("D3", "0.125")'
IF RC = 0 THEN DO
  SAY "  ✓ Command sent"
END

SAY "Formatting D3 as percentage..."
'SETFORMAT("D3", "percent:0.0%")'
IF RC = 0 THEN DO
  SAY "  ✓ Format applied: percent:0.0%"
END

/* Test text alignment */
SAY ""
SAY "Testing alignment formatting..."
SAY "Setting E1 = 'Left' with left alignment..."
'SETCELL("E1", "Left")'
'SETFORMAT("E1", "align:left")'
IF RC = 0 THEN DO
  SAY "  ✓ Left alignment applied"
END

SAY "Setting E2 = 'Center' with center alignment..."
'SETCELL("E2", "Center")'
'SETFORMAT("E2", "align:center")'
IF RC = 0 THEN DO
  SAY "  ✓ Center alignment applied"
END

SAY "Setting E3 = 'Right' with right alignment..."
'SETCELL("E3", "Right")'
'SETFORMAT("E3", "align:right")'
IF RC = 0 THEN DO
  SAY "  ✓ Right alignment applied"
END

/* Test combined formatting */
SAY ""
SAY "Testing combined formatting..."
SAY "Setting F1 = 999.99 with bold, red, currency format..."
'SETCELL("F1", "999.99")'
'SETFORMAT("F1", "bold;color:red;currency:USD")'
IF RC = 0 THEN DO
  SAY "  ✓ Combined format applied"
END

SAY ""
SAY "==========================================="
SAY "Demo completed! ✓"
SAY ""
SAY "Check the spreadsheet window - you should see:"
SAY "  A1 = 100"
SAY "  A2 = 200"
SAY "  A3 = 300 (formula: =A1+A2)"
SAY "  B1 = Hello from REXX!"
SAY "  B2 = HELLO FROM REXX! (formula: =UPPER(B1))"
SAY "  B3 = hello from rexx! (formula: =B2 |> LOWER)"
SAY ""
SAY "Formatted cells:"
SAY "  D1 = 123.46 (2 decimal places)"
SAY "  D2 = $1,234.56 (USD currency)"
SAY "  D3 = 12.5% (percentage with 1 decimal)"
SAY "  E1 = Left (left aligned)"
SAY "  E2 = Center (center aligned)"
SAY "  E3 = Right (right aligned)"
SAY "  F1 = $999.99 (bold, red, currency)"
SAY ""
SAY "The RESULT variable contains values returned from GETCELL!"
SAY ""
SAY "IMPORTANT: Also check the browser DevTools console"
SAY "(F12 or Right-click → Inspect → Console tab)"
SAY "You should see detailed logs showing:"
SAY "  - Control bus events received"
SAY "  - Commands being executed"
SAY "  - GETCELL results"
SAY "  - SETFORMAT commands"
SAY "  - UI update events"
SAY ""
SAY "The spreadsheet is being controlled remotely"
SAY "via ARexx-style ADDRESS commands over HTTP!"
SAY ""
SAY "Architecture: COMET-style long-polling (inspired by Selenium-RC 2007)"
SAY "  1. Node.js REXX script → POST command to /api/spreadsheet"
SAY "  2. Rust server → Queues command, waits for browser to poll"
SAY "  3. Browser → Polls /api/poll continuously (100ms interval)"
SAY "  4. Browser → Executes command in isolated REXX interpreter"
SAY "  5. Browser → POSTs result to /api/result"
SAY "  6. Rust → Returns result to Node.js caller"
SAY "  7. REXX script → RESULT variable contains the return value!"
SAY "==========================================="
