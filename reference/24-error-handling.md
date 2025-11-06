# Error Handling

Comprehensive error handling with traditional Rexx SIGNAL statements and enhanced error context information.

## Traditional vs Enhanced Error Handling

### Standard Rexx SIGNAL Behavior

Traditional Rexx uses GOTO-style error handling with `SIGNAL ON ERROR`:

```rexx
SIGNAL ON ERROR NAME ErrorHandler
-- Some operation that might fail
-- If error occurs, execution jumps to ErrorHandler
-- Lost: call stack, variable context, error details

ErrorHandler:
-- Only knows: an error happened somewhere
SAY "An error occurred"
```

### Enhanced Error Handling (Our Implementation)

Our implementation extends Rexx with **enhanced error context** while maintaining traditional SIGNAL semantics:

```rexx
SIGNAL ON ERROR NAME ErrorHandler
LET x = 10
LET operation = "division"
LET result = DIVIDE x=x y=0  -- Error occurs here

ErrorHandler:
-- Enhanced: Full error context available
LET error_line = ERROR_LINE           -- Returns: 4
LET error_function = ERROR_FUNCTION   -- Returns: "DIVIDE"
LET error_message = ERROR_MESSAGE     -- Returns: "Division by zero"
LET error_stack = ERROR_STACK         -- Returns: JavaScript stack trace
LET error_vars = ERROR_VARIABLES      -- Returns: {"x": 10, "operation": "division"}

SAY "Error in " || error_function || " at line " || error_line
SAY "Context variables: " || error_vars
SAY "JavaScript stack trace:"
SAY error_stack
```

## Error Context Functions

### Core Error Information

**`ERROR_LINE`** - Line Number
```rexx
SIGNAL ON ERROR NAME Handler
-- Line 2
-- Line 3  
LET result = JSON_PARSE text="invalid"  -- Line 4 - error occurs here

Handler:
LET line_num = ERROR_LINE  -- Returns: 4
```

**`ERROR_MESSAGE`** - Error Message
```rexx
SIGNAL ON ERROR NAME Handler
LET result = DIVIDE x=10 y=0

Handler:
LET msg = ERROR_MESSAGE  -- Returns: "Division by zero"
```

**`ERROR_FUNCTION`** - Function Name
```rexx
SIGNAL ON ERROR NAME Handler
LET hash = SHA256 data="test"  -- Fails if crypto not available

Handler:
LET func = ERROR_FUNCTION  -- Returns: "SHA256"
```

**`ERROR_COMMAND`** - Complete Command Text
```rexx
SIGNAL ON ERROR NAME Handler
LET result = JSON_PARSE text="malformed {}" pretty=true

Handler:
LET cmd = ERROR_COMMAND  
-- Returns: 'LET result = JSON_PARSE text="malformed {}" pretty=true'
```

### Advanced Error Context

**`ERROR_VARIABLES`** - Variable Snapshot
```rexx
SIGNAL ON ERROR NAME Handler
LET user = "john_doe"
LET config = '{"debug": true}'
LET count = 42
LET result = SOME_FAILING_FUNCTION

Handler:
LET vars_json = ERROR_VARIABLES
LET vars = JSON_PARSE text=vars_json
-- vars now contains: {"user": "john_doe", "config": "{\"debug\": true}", "count": 42}

-- Access individual variables
LET failed_user = ARRAY_GET array=vars key="user"      -- "john_doe"
LET failed_count = ARRAY_GET array=vars key="count"    -- 42
```

**`ERROR_STACK`** - JavaScript Stack Trace
```rexx
SIGNAL ON ERROR NAME Handler
LET result = DOM_CLICK selector="#missing-element"

Handler:
LET js_stack = ERROR_STACK
SAY "JavaScript call stack:"
SAY js_stack
```

**Output:**
```
JavaScript call stack:
Error: DOM click failed: Element not found: #missing-element
    at DOM_CLICK (/path/to/interpreter.js:2920:17)
    at Interpreter.executeFunctionCall (/path/to/interpreter.js:3373:14)
    at Interpreter.executeCommand (/path/to/interpreter.js:3326:39)
    at Interpreter.executeCommands (/path/to/interpreter.js:3272:35)
    at async Interpreter.run (/path/to/interpreter.js:3252:14)
```

**`ERROR_TIMESTAMP`** - When Error Occurred
```rexx
SIGNAL ON ERROR NAME Handler
LET result = FAILING_OPERATION

Handler:
LET error_time = ERROR_TIMESTAMP  -- "2025-08-26T07:30:15.123Z"
```

**`ERROR_DETAILS`** - Summary Object
```rexx
SIGNAL ON ERROR NAME Handler
LET result = FAILING_OPERATION

Handler:
LET details_json = ERROR_DETAILS
LET details = JSON_PARSE text=details_json
-- details contains:
-- {
--   "line": 3,
--   "message": "Operation failed",
--   "function": "FAILING_OPERATION",
--   "command": "LET result = FAILING_OPERATION",
--   "timestamp": "2025-08-26T07:30:15.123Z",
--   "hasStack": true
-- }
```

## SIGNAL Statement Syntax

### SIGNAL ON ERROR

Enable error handling and specify a label to jump to when errors occur.

**Basic Syntax:**
```rexx
SIGNAL ON ERROR NAME label_name
```

**Default Label (ERROR):**
```rexx
SIGNAL ON ERROR  -- Uses default label "ERROR"

-- Your code here
LET result = RISKY_OPERATION

EXIT

ERROR:
SAY "An error occurred"
LET error_msg = ERROR_MESSAGE
SAY "Details: " || error_msg
```

**Custom Label:**
```rexx
SIGNAL ON ERROR NAME MyErrorHandler

-- Your code here
LET result = RISKY_OPERATION

EXIT

MyErrorHandler:
SAY "Custom error handler activated"
LET line_num = ERROR_LINE
LET func_name = ERROR_FUNCTION
SAY "Error in " || func_name || " at line " || line_num
```

### SIGNAL OFF ERROR

Disable error handling and let errors propagate normally.

```rexx
SIGNAL ON ERROR NAME Handler
-- Error handling active

SIGNAL OFF ERROR
-- Error handling disabled - errors will be thrown normally

LET result = FAILING_OPERATION  -- Will throw unhandled error

Handler:
-- This won't be reached
```

### Multiple Error Handlers

You can change error handlers during execution:

```rexx
SIGNAL ON ERROR NAME InitHandler
LET config = LOAD_CONFIG

SIGNAL ON ERROR NAME ProcessHandler  
LET data = PROCESS_DATA config=config

SIGNAL ON ERROR NAME CleanupHandler
CLEANUP_RESOURCES

EXIT

InitHandler:
SAY "Error during initialization"
-- Handle init errors
EXIT

ProcessHandler:
SAY "Error during processing" 
-- Handle processing errors
EXIT

CleanupHandler:
SAY "Error during cleanup"
-- Handle cleanup errors
```

## Error Recovery Patterns

### Smart Error Recovery

Use error context to implement intelligent error recovery:

```rexx
SIGNAL ON ERROR NAME SmartRecovery
LET retry_count = 0
LET max_retries = 3

ProcessData:
LET result = NETWORK_OPERATION url="https://api.example.com/data"
EXIT

SmartRecovery:
LET error_func = ERROR_FUNCTION
LET error_msg = ERROR_MESSAGE
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET current_retries = ARRAY_GET array=vars key="retry_count"

IF error_func = "NETWORK_OPERATION" THEN
    IF current_retries < max_retries THEN
        LET retry_count = current_retries + 1
        SAY "Network error, retrying... (attempt " || retry_count || ")"
        WAIT milliseconds=1000
        SIGNAL ProcessData  -- Jump back to retry
    ELSE
        SAY "Network operation failed after " || max_retries || " attempts"
        SAY "Final error: " || error_msg
    ENDIF
ELSE
    SAY "Unexpected error in " || error_func || ": " || error_msg
ENDIF
```

### Fallback Strategies

```rexx
SIGNAL ON ERROR NAME FallbackHandler
LET primary_method = "crypto"

ProcessSecurity:
SELECT
    WHEN primary_method = "crypto" THEN
        LET hash = SHA256 data="sensitive_data"
    WHEN primary_method = "basic" THEN
        LET hash = SIMPLE_HASH data="sensitive_data"
    OTHERWISE
        LET hash = "no_security"
END
EXIT

FallbackHandler:
LET error_func = ERROR_FUNCTION
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET current_method = ARRAY_GET array=vars key="primary_method"

SELECT
    WHEN error_func = "SHA256" AND current_method = "crypto" THEN
        SAY "Crypto not available, falling back to basic hashing"
        LET primary_method = "basic"
        SIGNAL ProcessSecurity
    WHEN error_func = "SIMPLE_HASH" AND current_method = "basic" THEN  
        SAY "Basic hashing failed, disabling security"
        LET primary_method = "none"
        SIGNAL ProcessSecurity
    OTHERWISE
        SAY "All security methods failed: " || ERROR_MESSAGE
END
```

### Error Logging and Monitoring

```rexx
SIGNAL ON ERROR NAME ErrorLogger

-- Main application logic
LET result = COMPLEX_OPERATION param1="value1" param2="value2"

EXIT

ErrorLogger:
-- Capture comprehensive error information
LET timestamp = ERROR_TIMESTAMP
LET line_num = ERROR_LINE
LET func_name = ERROR_FUNCTION  
LET error_msg = ERROR_MESSAGE
LET command = ERROR_COMMAND
LET vars_json = ERROR_VARIABLES
LET stack_trace = ERROR_STACK

-- Create error report
LET error_report = "=== ERROR REPORT ==="
LET error_report = error_report || "\nTimestamp: " || timestamp
LET error_report = error_report || "\nLine: " || line_num
LET error_report = error_report || "\nFunction: " || func_name
LET error_report = error_report || "\nCommand: " || command
LET error_report = error_report || "\nMessage: " || error_msg
LET error_report = error_report || "\nVariables: " || vars_json
LET error_report = error_report || "\nStack Trace:\n" || stack_trace

-- Log to console
SAY error_report

-- Could also send to logging service
-- SEND_TO_LOGGER report=error_report level="error"

-- Graceful shutdown
SAY "\nApplication terminating due to error"
EXIT
```

## Integration with Built-in Functions

### DOM Function Error Handling

```rexx
SIGNAL ON ERROR NAME DOMErrorHandler

-- DOM automation that might fail
LET element_count = DOM_QUERY selector=".items" operation="count"

DO i = 1 TO element_count
    LET item_selector = ".items:nth-child(" || i || ")"
    DOM_CLICK selector=item_selector
    
    -- Wait for response
    LET success = DOM_WAIT_FOR selector=".success" timeout=2000
    IF success = false THEN
        -- Force an error to trigger handler
        DOM_CLICK selector="#non-existent-element"
    ENDIF
END

EXIT

DOMErrorHandler:
LET error_func = ERROR_FUNCTION
LET error_line = ERROR_LINE
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET current_i = ARRAY_GET array=vars key="i"

SAY "DOM operation failed:"
SAY "  Function: " || error_func
SAY "  Line: " || error_line  
SAY "  Processing item: " || current_i
SAY "  Message: " || ERROR_MESSAGE

-- Attempt recovery
IF error_func = "DOM_CLICK" THEN
    SAY "Click failed, trying alternative selector"
    -- Could implement alternative clicking strategy
ELSE IF error_func = "DOM_WAIT_FOR" THEN
    SAY "Wait timeout, continuing anyway"
    -- Continue with next iteration
ENDIF
```

### JSON Function Error Handling

```rexx
SIGNAL ON ERROR NAME JSONErrorHandler
LET config_text = '{"settings": {"timeout": 5000, "debug": true}'  -- Invalid JSON

ParseConfig:
LET config = JSON_PARSE text=config_text
LET timeout = ARRAY_GET array=config key="timeout"
EXIT

JSONErrorHandler:
LET error_func = ERROR_FUNCTION
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET bad_json = ARRAY_GET array=vars key="config_text"

IF error_func = "JSON_PARSE" THEN
    SAY "JSON parsing failed for:"
    SAY bad_json
    SAY "Error: " || ERROR_MESSAGE
    
    -- Use default configuration
    SAY "Using default configuration"
    LET config = JSON_PARSE text='{"timeout": 3000, "debug": false}'
    LET timeout = ARRAY_GET array=config key="timeout"
    
    SAY "Continuing with timeout: " || timeout
ENDIF
```

### Mathematical Function Error Handling

```rexx
SIGNAL ON ERROR NAME MathErrorHandler
LET numbers = '[1, 2, 0, 4, 5]'
LET results = '[]'

ProcessNumbers:
LET num_array = JSON_PARSE text=numbers
LET count = ARRAY_LENGTH array=num_array

DO i = 1 TO count
    LET num = ARRAY_GET array=num_array index=i
    LET result = DIVIDE x=100 y=num
    LET results = ARRAY_PUSH array=results item=result
END

LET final_results = JSON_STRINGIFY data=results
SAY "Results: " || final_results
EXIT

MathErrorHandler:
LET error_func = ERROR_FUNCTION
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET current_i = ARRAY_GET array=vars key="i"
LET current_num = ARRAY_GET array=vars key="num"

IF error_func = "DIVIDE" AND current_num = 0 THEN
    SAY "Division by zero at position " || current_i
    SAY "Skipping this number and continuing"
    
    -- Add a placeholder and continue
    LET current_results = ARRAY_GET array=vars key="results"
    LET results = ARRAY_PUSH array=current_results item="undefined"
    
    -- Continue the loop (would need more complex loop handling)
    SAY "Added placeholder, continuing processing"
ELSE
    SAY "Unexpected math error: " || ERROR_MESSAGE
ENDIF
```

## Testing Error Scenarios

### Error Handler Testing

```rexx
-- Test various error conditions
SIGNAL ON ERROR NAME TestErrorHandler
LET test_case = 1

RunTests:
SELECT  
    WHEN test_case = 1 THEN
        SAY "Testing JSON parsing error..."
        LET result = JSON_PARSE text="invalid json"
    WHEN test_case = 2 THEN
        SAY "Testing DOM error..."
        DOM_CLICK selector="#nonexistent"
    WHEN test_case = 3 THEN
        SAY "Testing math error..."  
        LET result = DIVIDE x=1 y=0
    OTHERWISE
        SAY "All tests completed"
        EXIT
END

TestErrorHandler:
LET error_func = ERROR_FUNCTION
LET error_msg = ERROR_MESSAGE
LET current_test = ERROR_VARIABLES
LET test_num = ARRAY_GET array=JSON_PARSE(text=current_test) key="test_case"

SAY "Test " || test_num || " - " || error_func || " error caught:"
SAY "  Message: " || error_msg
SAY "  Line: " || ERROR_LINE

-- Move to next test
LET test_case = test_num + 1
SIGNAL RunTests
```

## Best Practices

### 1. Always Provide Meaningful Error Handling

```rexx
-- Good: Specific error handling
SIGNAL ON ERROR NAME ConfigErrorHandler

-- Bad: Generic error handling that loses context
-- SIGNAL ON ERROR NAME GenericHandler
```

### 2. Use Error Context for Smart Recovery

```rexx
-- Good: Use error context to make informed decisions
ErrorHandler:
LET error_func = ERROR_FUNCTION
IF error_func = "NETWORK_OPERATION" THEN
    -- Handle network errors specifically
ELSE IF error_func = "FILE_OPERATION" THEN
    -- Handle file errors specifically
ENDIF

-- Bad: Generic error handling
ErrorHandler:
SAY "Something went wrong"
```

### 3. Log Comprehensive Error Information

```rexx
-- Good: Capture full context
ErrorHandler:
SAY "Error occurred at line " || ERROR_LINE
SAY "Function: " || ERROR_FUNCTION  
SAY "Command: " || ERROR_COMMAND
SAY "Variables: " || ERROR_VARIABLES
SAY "Stack trace:"
SAY ERROR_STACK

-- Bad: Minimal error info
ErrorHandler:
SAY "Error: " || ERROR_MESSAGE
```

### 4. Clean Up Resources in Error Handlers

```rexx
SIGNAL ON ERROR NAME CleanupHandler
LET file_handle = OPEN_FILE path="data.txt"
-- Process file
LET result = PROCESS_FILE handle=file_handle

CLOSE_FILE handle=file_handle
EXIT

CleanupHandler:
-- Always clean up, even on error
LET vars = JSON_PARSE text=ERROR_VARIABLES
LET handle = ARRAY_GET array=vars key="file_handle"
IF handle THEN
    CLOSE_FILE handle=handle
ENDIF

SAY "Error occurred: " || ERROR_MESSAGE
SAY "Resources cleaned up"
```

### 5. Use Nested Error Handling for Complex Operations

```rexx
MainOperation:
SIGNAL ON ERROR NAME MainErrorHandler

PreprocessingPhase:
SIGNAL ON ERROR NAME PreprocessingErrorHandler
-- Preprocessing code
SIGNAL ON ERROR NAME MainErrorHandler  -- Restore main handler

ProcessingPhase:  
SIGNAL ON ERROR NAME ProcessingErrorHandler
-- Processing code
SIGNAL ON ERROR NAME MainErrorHandler  -- Restore main handler

-- Continue with other phases...
EXIT

PreprocessingErrorHandler:
SAY "Preprocessing failed: " || ERROR_MESSAGE
-- Handle preprocessing errors
SIGNAL ProcessingPhase  -- Skip to next phase

ProcessingErrorHandler:
SAY "Processing failed: " || ERROR_MESSAGE  
-- Handle processing errors
EXIT

MainErrorHandler:
SAY "Operation failed: " || ERROR_MESSAGE
SAY "Stack trace:"
SAY ERROR_STACK
```

## Debugging Tips

### Using Stack Traces for Debugging

The JavaScript stack traces help identify:
- **Exact function call chain** leading to the error
- **Line numbers** in the interpreter source code
- **JavaScript function names** for debugging interpreter issues
- **Async call patterns** showing Promise resolution chains

### Variable State Analysis

The ERROR_VARIABLES snapshot helps with:
- **Understanding error context** - what data led to the failure
- **Debugging variable values** at the exact moment of error
- **Implementing smart recovery** based on variable state
- **Logging for production debugging**

### Error Pattern Recognition

Common error patterns and their contexts:
- **DOM errors**: Usually indicate missing elements or incorrect selectors
- **JSON errors**: Invalid JSON syntax or structure
- **Network errors**: Connectivity issues or API failures
- **Math errors**: Division by zero or invalid numeric operations

This comprehensive error handling system bridges traditional Rexx SIGNAL semantics with modern JavaScript debugging capabilities, providing developers with the best tools for building robust, debuggable Rexx applications.