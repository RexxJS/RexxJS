/* Simple RENDER Function Test */

SAY "Testing RENDER function..."

/* Load the graphics functions */
REQUIRE "./r-graphics-functions.js"

/* Test basic HIST function first */
LET dataJson = "[1, 2, 3, 4, 5]"
LET data = JSON_PARSE text=dataJson
LET histogram = HIST data=data

SAY "Created histogram:" histogram.type

/* Test the RENDER function */
LET result = RENDER plot=histogram output="base64" width=400 height=300

SAY "RENDER result type:" DATATYPE(result)
SAY "RENDER result length:" LENGTH(result)

IF DATATYPE(result) = "CHAR" THEN DO
  SAY "✓ RENDER function works!"
  SAY "Base64 preview:" SUBSTR(result, 1, 50)
END
ELSE DO
  SAY "✗ RENDER function failed"
  SAY "Error result:" result
END