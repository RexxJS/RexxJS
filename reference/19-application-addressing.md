# Application Addressing

Cross-application communication and automation capabilities enabling secure scripting across application boundaries, supporting all execution modes with specialized iframe integration for Controlled Web Mode.

## Overview

Application Addressing allows Rexx scripts to communicate with and control other applications through a secure postMessage-based protocol. This enables:

- **Cross-iframe Communication**: Script applications in different iframes
- **Secure API Integration**: Make authenticated calls to external services  
- **Browser Automation**: Control web applications and services
- **Multi-Application Workflows**: Coordinate actions across different systems

TODO - possible future longer distance so to speak

## Transport Modes

Application Addressing supports two distinct transport modes for cross-application communication, each optimized for different use cases:

### JSON-RPC Transport

JSON-RPC transport enables **individual API operations** and fine-grained control over target applications:

- **Individual function calls**: `ADD 2 and 2`, `getDisplay`, `press button=5`
- **Single-line Rexx commands**: Sent via ADDRESS statements to invoke specific operations
- **JavaScript function invocation**: Calls native JS functions in the target application
- **Built-in introspection**: `_inspect` capability to discover available methods and state
- **Synchronous/asynchronous calls**: Immediate responses or async operations

```rexx
-- JSON-RPC: Individual API operations
ADDRESS calculator
clear                    -- Calls calculator.clear()
press button="5"         -- Calls calculator.press("5")
press button="+"         -- Calls calculator.press("+")
press button="3"         -- Calls calculator.press("3")
press button="="         -- Calls calculator.press("=")
LET result = getDisplay  -- Calls calculator.getDisplay()

-- Inspect available methods
LET methods = _inspect
SAY "Available methods: " || methods
```

**Use cases:** Real-time application control, interactive automation, API testing, fine-grained operations.

### Rexx-RPC Transport

Rexx-RPC transport enables **whole script execution** with streaming control and progress monitoring:

- **Complete Rexx scripts**: Multi-line programs sent from director to worker
- **Script-level execution**: Worker runs entire Rexx programs, not individual operations
- **CHECKPOINT streaming**: Real-time progress monitoring during execution
- **Bidirectional control**: Director can pause/resume/abort during script execution  
- **Rexx interpreter invocation**: Executes Rexx code in the target worker environment

```rexx
-- Rexx-RPC: Complete script execution with streaming control
ADDRESS streaming-worker

-- Send entire script for execution
EXECUTE_SCRIPT script=`
  SAY "Starting data processing..."
  LET processed = 0
  LET total = 1000
  
  DO i = 1 TO total
    -- Process record i
    LET processed = processed + 1
    
    -- Send progress update every 100 records
    IF processed // 100 = 0 THEN DO
      LET response = CHECKPOINT(processed, total)
      SAY "Processed: " || processed || "/" || total
      
      -- Handle director control commands
      IF response.action = "pause" THEN DO
        SAY "Pausing execution..."
        CALL waitForResume
      END
      
      IF response.action = "abort" THEN DO
        SAY "Aborting execution..."
        EXIT
      END
    END
  END
  
  SAY "Processing complete: " || processed || " records"
`

-- Director can send control commands during execution
SEND_CONTROL action="pause" message="Pausing for review"
WAIT seconds=5
SEND_CONTROL action="resume" message="Resuming processing"
```

**Use cases:** Batch processing, data workflows, long-running operations, progress monitoring, execution control.

### Transport Comparison

| Feature | JSON-RPC | Rexx-RPC |
|---------|----------|-----------|
| **Granularity** | Individual function calls | Complete script execution |
| **Execution Model** | Call JS functions | Run Rexx interpreter |
| **Control** | Synchronous/async calls | Streaming with checkpoints |
| **Progress Monitoring** | Per-call responses | Real-time CHECKPOINT updates |
| **Director Control** | Request/response | Pause/resume/abort during execution |
| **Introspection** | `_inspect` method discovery | Script execution status |
| **Use Case** | Interactive automation | Batch processing workflows |

### Director/Worker Streaming Pattern

The **director/worker pattern** is a specialized implementation of Rexx-RPC transport:

- **Director iframe**: Orchestrates execution, sends scripts and control commands, monitors progress
- **Worker iframe**: Executes Rexx scripts, sends CHECKPOINT progress updates, responds to control
- **PostMessage protocol**: Secure communication between director and worker iframes
- **Real-time control**: Pause, resume, abort operations based on progress or conditions

```rexx
-- Director sends execution request
{
  "type": "rexx-execution-request",
  "id": "exec-123",
  "target": "worker-iframe",
  "rexxCode": "DO i = 1 TO 1000...",
  "streaming": true
}

-- Worker sends progress updates via CHECKPOINT
{
  "type": "rexx-progress", 
  "timestamp": 1640995200000,
  "variables": {"i": 250, "processed": 250},
  "params": [250, 1000],
  "line": 15
}

-- Director sends control commands
{
  "type": "rexx-control",
  "action": "pause",
  "message": "Pausing for system maintenance",
  "timestamp": 1640995260000  
}
```

## Distributed Computing Considerations

The two-iframe + postMessage architecture represents a distributed system, albeit within a single browser context. Understanding the **Eight Fallacies of Distributed Computing** helps design robust cross-iframe applications.

### The Eight Fallacies Applied to Iframe Communication

#### 1. "The network is reliable"
**Fallacy**: Assuming postMessage delivery is guaranteed.

**Reality in iframe context**:
- postMessage can fail if target iframe crashes or becomes unresponsive
- Browser security policies may block messages between certain origins
- Messages may be dropped during iframe navigation or reload

**Mitigation strategies**:
```rexx
-- Implement message acknowledgment
LET messageId = UUID
LET request = '{"id": "' || messageId || '", "method": "calculate", "params": [2, 3]}'

ADDRESS calculator
sendMessage payload=request

-- Wait with timeout for acknowledgment
LET response = waitForResponse messageId=messageId timeout=5000
IF response.success THEN
    SAY "Operation completed: " || response.result
ELSE
    SAY "Message failed or timed out - retrying..."
    -- Implement retry logic
ENDIF
```

#### 2. "Latency is zero"
**Fallacy**: Assuming instant communication between iframes.

**Reality in iframe context**:
- postMessage has measurable latency (typically 1-10ms)
- JavaScript execution queues can introduce delays
- Complex operations in target iframe increase response time

**Mitigation strategies**:
```rexx
-- Design for asynchronous operations
ADDRESS worker

-- Start long-running operation
LET jobId = startDataProcessing records=10000
SAY "Job started: " || jobId

-- Don't block - check periodically
DO attempts = 1 TO 100
    WAIT milliseconds=500
    LET status = checkJobStatus jobId=jobId
    
    IF status.completed THEN DO
        SAY "Job completed in " || (attempts * 0.5) || " seconds"
        EXIT
    END
    
    SAY "Progress: " || status.percentage || "% complete"
END
```

#### 3. "Bandwidth is infinite"
**Fallacy**: Unlimited message size and frequency between iframes.

**Reality in iframe context**:
- Large messages can impact browser performance
- High-frequency messaging can overwhelm event queues
- JSON serialization adds overhead

**Mitigation strategies**:
```rexx
-- Batch operations instead of individual calls
LET operations = '[]'
DO i = 1 TO 100
    LET op = '{"method": "addRecord", "data": {"id": ' || i || ', "value": "data' || i || '"}}'
    LET operations = ARRAY_APPEND array=operations item=op
END

-- Send batch instead of 100 individual messages
ADDRESS worker
processBatch operations=operations

-- Use compression for large data
LET largeData = FILE_READ filename="large-dataset.json"
LET compressedData = COMPRESS text=largeData
sendLargeMessage payload=compressedData compressed=true
```

#### 4. "The network is secure"
**Fallacy**: Assuming iframe communication is inherently secure.

**Reality in iframe context**:
- Same-origin policy provides some protection but isn't bulletproof
- Malicious iframes can potentially intercept or inject messages
- XSS vulnerabilities can compromise message integrity

**Mitigation strategies**:
```rexx
-- Always validate message origins
ADDRESS secureWorker

LET messageId = UUID
LET nonce = RANDOM_HEX bytes=16
LET timestamp = NOW_TIMESTAMP
LET signature = HMAC_SHA256 text=(messageId || nonce || timestamp) secret="shared-secret"

LET secureMessage = '{"id": "' || messageId || '", "nonce": "' || nonce || '", "timestamp": ' || timestamp || ', "signature": "' || signature || '", "data": {"operation": "processPayment", "amount": 100}}'

sendSecureMessage payload=secureMessage expectedOrigin="https://trusted-worker.com"

-- Validate response signatures
LET response = waitForSecureResponse messageId=messageId timeout=10000
IF validateSignature(response) THEN
    SAY "Secure operation completed"
ELSE
    SAY "Security validation failed - rejecting response"
ENDIF
```

#### 5. "Topology doesn't change"
**Fallacy**: Assuming iframe structure remains constant.

**Reality in iframe context**:
- Iframes can be dynamically added, removed, or reloaded
- User navigation can destroy iframe contexts
- Browser tab switching can suspend iframe execution

**Mitigation strategies**:
```rexx
-- Implement heartbeat to detect topology changes
ADDRESS worker
LET lastHeartbeat = NOW_TIMESTAMP

DO FOREVER
    WAIT milliseconds=5000
    
    LET heartbeatResponse = sendHeartbeat timeout=2000
    IF heartbeatResponse.success THEN DO
        LET lastHeartbeat = NOW_TIMESTAMP
        SAY "Worker responsive"
    ELSE DO
        LET timeSinceHeartbeat = NOW_TIMESTAMP - lastHeartbeat
        IF timeSinceHeartbeat > 15000 THEN DO
            SAY "Worker appears dead - attempting reconnection"
            CALL reconnectWorker
        END
    END
END

-- Graceful degradation when topology changes
PROCEDURE reconnectWorker
    -- Attempt to reload iframe
    reloadIframe target="worker-iframe"
    WAIT milliseconds=2000
    
    -- Test connectivity
    LET testResponse = sendTestMessage timeout=3000
    IF testResponse.success THEN
        SAY "Worker reconnected successfully"
    ELSE
        SAY "Reconnection failed - switching to fallback mode"
    ENDIF
END
```

#### 6. "There is one administrator"
**Fallacy**: Assuming unified control over all iframe components.

**Reality in iframe context**:
- Different iframes may be controlled by different teams/vendors
- Third-party iframe content can change without notice
- Version mismatches between director and worker implementations

**Mitigation strategies**:
```rexx
-- Negotiate capabilities at startup
ADDRESS worker

-- Check worker version and capabilities
LET workerInfo = getWorkerInfo
SAY "Worker version: " || workerInfo.version
SAY "Supported features: " || workerInfo.features

-- Adapt behavior based on worker capabilities
IF INCLUDES(string=workerInfo.features substring="streaming") THEN DO
    SAY "Using streaming mode"
    enableStreamingMode
ELSE DO
    SAY "Falling back to batch mode"
    enableBatchMode
END

-- Version compatibility checks
IF workerInfo.protocolVersion < "2.0" THEN DO
    SAY "Warning: Worker uses older protocol - some features unavailable"
    disableAdvancedFeatures
END
```

#### 7. "Transport cost is zero"
**Fallacy**: Assuming no overhead for iframe communication.

**Reality in iframe context**:
- JSON serialization/deserialization has CPU cost
- Frequent messaging can impact browser responsiveness
- Memory allocation for large messages

**Mitigation strategies**:
```rexx
-- Minimize message frequency with efficient batching
LET messageBuffer = '[]'
LET bufferSize = 0
LET maxBufferSize = 50

PROCEDURE addToBuffer(operation)
    LET messageBuffer = ARRAY_APPEND array=messageBuffer item=operation
    LET bufferSize = bufferSize + 1
    
    IF bufferSize >= maxBufferSize THEN DO
        CALL flushBuffer
    END
END

PROCEDURE flushBuffer
    IF bufferSize > 0 THEN DO
        ADDRESS worker
        processBatchOperations operations=messageBuffer
        
        -- Reset buffer
        LET messageBuffer = '[]'
        LET bufferSize = 0
    END
END

-- Use efficient data formats
-- Instead of verbose JSON:
-- {"operation": "add", "operand1": 5, "operand2": 3}
-- Use compact format:
-- ["add", 5, 3]
```

#### 8. "The network is homogeneous"
**Fallacy**: Assuming all iframe environments are identical.

**Reality in iframe context**:
- Different browsers handle postMessage differently
- Mobile vs desktop performance characteristics vary
- Some iframes may have restricted capabilities (sandboxing)

**Mitigation strategies**:
```rexx
-- Detect browser and iframe capabilities
LET browserInfo = detectBrowser
LET iframeCapabilities = detectIframeCapabilities

SAY "Browser: " || browserInfo.name || " " || browserInfo.version
SAY "Iframe sandbox: " || iframeCapabilities.sandbox
SAY "Storage available: " || iframeCapabilities.storage

-- Adapt behavior based on environment
IF browserInfo.name = "Safari" AND browserInfo.version < "14" THEN DO
    SAY "Using Safari compatibility mode"
    enableSafariWorkarounds
END

IF iframeCapabilities.sandbox.includes("allow-storage") THEN DO
    enablePersistentStorage
ELSE DO
    SAY "Storage restricted - using memory-only mode"
    enableMemoryOnlyMode
END

-- Performance adaptation
IF browserInfo.mobile THEN DO
    -- Reduce message frequency for mobile
    LET heartbeatInterval = 10000  -- 10 seconds
    LET batchSize = 20
ELSE DO
    -- More responsive for desktop
    LET heartbeatInterval = 5000   -- 5 seconds  
    LET batchSize = 50
END
```

### Design Principles for Robust Iframe Communication

Based on these fallacies, design iframe-based distributed systems with:

1. **Timeout and retry logic** for all cross-iframe operations
2. **Capability negotiation** during iframe initialization
3. **Heartbeat mechanisms** to detect failed iframes
4. **Message batching** to reduce communication overhead
5. **Security validation** for all incoming messages
6. **Graceful degradation** when iframes become unavailable
7. **Environment detection** and adaptive behavior
8. **Comprehensive error handling** with meaningful user feedback

```rexx
-- Example: Robust iframe communication pattern
PROCEDURE robustIframeOperation(targetApp, operation, data)
    LET attempt = 1
    LET maxAttempts = 3
    
    DO WHILE attempt <= maxAttempts
        TRY
            ADDRESS targetApp
            LET result = performOperation operation=operation data=data timeout=5000
            
            IF result.success THEN
                RETURN result
            ELSE
                SAY "Attempt " || attempt || " failed: " || result.error
            ENDIF
            
        CATCH error
            SAY "Communication error on attempt " || attempt || ": " || error.message
        END
        
        LET attempt = attempt + 1
        IF attempt <= maxAttempts THEN
            WAIT milliseconds=(attempt * 1000)  -- Exponential backoff
        ENDIF
    END
    
    SAY "All attempts failed - operation aborted"
    RETURN '{"success": false, "error": "Communication failure after ' || maxAttempts || ' attempts"}'
END
```

This approach acknowledges that even "local" iframe communication has distributed system characteristics and requires robust error handling, retry logic, and graceful degradation strategies.

### Implementation Architecture

In practice, the **communication infrastructure should be implemented in JavaScript** while **business logic remains in Rexx**:

- **JavaScript layer**: Handles postMessage, timeouts, retries, heartbeats, and CHECKPOINT implementation
- **Rexx layer**: Focuses on domain logic, calls `CHECKPOINT()` at appropriate intervals
- **Clean separation**: JavaScript manages distributed system complexity, Rexx handles business rules

**Example implementations:**
- [Streaming Control Test Harness](../tests/web/test-harness-streaming-control.html)
- [Director Component](../tests/web/streaming-controller.html) 
- [Worker Component](../tests/web/streaming-worker.html)

## Core ADDRESS Statement

### Basic Syntax
```rexx
-- Switch to target application
ADDRESS applicationName

-- Make function calls to the addressed application
functionName param1=value1 param2=value2

-- Return to default addressing (both methods work the same)
ADDRESS DEFAULT
ADDRESS           -- Standard REXX: ADDRESS without target resets to default
```

### ADDRESS Reset Options

There are two equivalent ways to reset ADDRESS back to default (normal REXX command processing):

```rexx
-- Method 1: Explicit reset (more readable)
ADDRESS calculator
clear
press button="5"
ADDRESS DEFAULT        -- Clear, explicit reset
SAY "Back to normal"   -- Processes normally

-- Method 2: Standard REXX (shorter)  
ADDRESS logger
log "System startup"
ADDRESS               -- Standard REXX: resets to default
SAY "Also normal"     -- Processes normally
```

Both methods:
- Reset the ADDRESS target to 'default'
- Clear any active MATCHING patterns
- Return to normal REXX command processing

### Application Context Switching
```rexx
-- Default context (local execution)
LET localVar = "processed locally"

-- Switch to calculator application
ADDRESS calculator
clear                    -- Sent to calculator
press button=5           -- Sent to calculator
press button="+"         -- Sent to calculator
press button=3           -- Sent to calculator
press button="="         -- Sent to calculator
LET result = getDisplay  -- Get result from calculator

-- Switch to API service
ADDRESS api
LET userData = getUser id=12345    -- API call
updateStatus id=12345 status="active"  -- API call

-- Return to local context
ADDRESS ""
SAY "Calculator result: " || result
SAY "User updated: " || userData.name
```

## ADDRESS HEREDOC Pattern Syntax

ADDRESS HEREDOC provides **multiline content blocks** with clean, readable syntax for complex content handling within ADDRESS contexts. This enables natural domain-specific languages, structured test frameworks, and configuration DSLs.

### Core Concept

ADDRESS HEREDOC allows you to send multiline content blocks to address targets using delimiter-based syntax. This provides a cleaner alternative to pattern-based matching for structured content.

### Basic Syntax

```rexx
-- Send multiline content to target
ADDRESS targetName <<DELIMITER
multiline content here
with preserved formatting
DELIMITER
```

### HEREDOC Rules

1. **Delimiter Matching**: Opening and closing delimiters must match exactly
2. **Content Preservation**: All whitespace and formatting is preserved
3. **Variable Interpolation**: `{variable}` syntax supported within content
4. **No Nesting**: HEREDOC blocks cannot contain other HEREDOC blocks

### Examples

#### Basic Test Framework with HEREDOC
```rexx
REQUIRE "expectations-address"

-- Send test assertions using HEREDOC
ADDRESS EXPECTATIONS <<TESTS
result should equal 42
name should equal "John"
status should be true
TESTS

-- Normal REXX execution continues
SAY "Test completed"
```

#### SQL Database Operations
```rexx
-- Send SQL commands using HEREDOC
ADDRESS sqlite3 <<SQL
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
)
SQL

-- Normal REXX execution continues
LET status = "table_created"
```

#### API Configuration with HEREDOC
```rexx
LET userId = "12345"
LET newStatus = "active"

-- Send JSON configuration using HEREDOC with interpolation
ADDRESS api <<REQUEST
{
  "method": "PUT",
  "endpoint": "/users/{userId}",
  "body": {
    "status": "{newStatus}",
    "updated_at": "{TIMESTAMP()}"
  }
}
REQUEST

-- Normal REXX
SAY "API request sent"
```

### Advanced Pattern Features

#### Complex Regex Patterns
```rexx
-- Pattern with special character escaping
ADDRESS validator MATCHING("^[ \\t]*\\[TEST\\]\\s+(.*)$")

[TEST] username should be valid email
[TEST] password should meet requirements
```

#### Multiple Capture Groups
```rexx  
-- Pattern captures priority and message separately
ADDRESS tasks MATCHING("^[ \\t]*TODO\\((\\w+)\\):\\s+(.*)$")

TODO(high): Implement user authentication
TODO(low): Update documentation
TODO(medium): Add error logging
```

#### No Capture Groups (Full Line Processing)
```rexx
-- Pattern matches but sends entire processed content
ADDRESS processor MATCHING("^[ \\t]*>\\s+")

> process this entire line including prefix
> and this line too
```

### Pattern Design Best Practices

#### 1. Always Handle Indentation
```rexx
-- GOOD: Flexible whitespace handling
ADDRESS target MATCHING("^[ \\t]*\\.\\s+(.*)$")

-- AVOID: Rigid start-of-line matching  
ADDRESS target MATCHING("^\\.\\s+(.*)$")
```

#### 2. Use Appropriate Capture Groups
```rexx
-- Extract just the content (most common)
ADDRESS expectations MATCHING("^[ \\t]*\\.\\s+(.*)$")
. result should equal 42    -- Sends: "result should equal 42"

-- Send full matched portion
ADDRESS logger MATCHING("^[ \\t]*LOG:")  
LOG: This entire line is sent  -- Sends: "LOG: This entire line is sent"
```

#### 3. Account for Variable Spacing
```rexx
-- Handle variable whitespace after prefix
ADDRESS comments MATCHING("^[ \\t]*#\\s*(.*)$")

#comment with no space
# comment with one space  
#    comment with multiple spaces
```

### Integration with Test Frameworks

#### Expectations Framework Integration
```rexx
REQUIRE "expectations-address"

LET user_age = 25
LET user_name = "Alice"
LET is_adult = true

-- Dot-prefix pattern for natural test syntax
ADDRESS EXPECTATIONS MATCHING("^[ \\t]*\\.\\s+(.*)$")

. user_age should equal 25
. user_name should equal "Alice"  
. is_adult should be true
. user_age should be greater than 18
. user_name should match "^[A-Z][a-z]+$"
```

#### Custom Test Syntax
```rexx
-- Create domain-specific test language
ADDRESS testRunner MATCHING("^[ \\t]*TEST:\\s+(.*)$")

TEST: user registration with valid email succeeds
TEST: user registration with invalid email fails  
TEST: password reset sends confirmation email
TEST: login with correct credentials succeeds
```

### Context Switching with MATCHING

```rexx
-- Different patterns for different contexts
LET api_result = '{"status": "success", "data": {"id": 123}}'
LET db_result = "5 rows affected"

-- API testing context
ADDRESS api_validator MATCHING("^[ \\t]*API:\\s+(.*)$")  
API: response should have status "success"
API: response.data.id should equal 123

-- Switch to database testing context  
ADDRESS db_validator MATCHING("^[ \\t]*DB:\\s+(.*)$")
DB: query should affect 5 rows
DB: transaction should commit successfully

-- Return to normal execution
ADDRESS ""
SAY "All validations completed"
```

### Error Handling and Invalid Patterns

```rexx
-- Invalid regex patterns fall back to normal parsing
ADDRESS target MATCHING("^[invalid")  -- Invalid regex

-- This line would normally match, but falls back to function call
. test_value should equal 42  -- Parsed as function call to current ADDRESS
```

### MATCHING with INTERPRET

```rexx
-- INTERPRET inherits ADDRESS MATCHING context
ADDRESS logger MATCHING("^[ \\t]*LOG:\\s+(.*)$")

LET dynamic_message = "System startup completed"
LET log_statement = "LOG: " || dynamic_message

-- INTERPRET executes in logger context with MATCHING active
INTERPRET log_statement  -- Sends "System startup completed" to logger
```

### Performance Considerations

- **Regex Compilation**: Patterns are compiled once when ADDRESS MATCHING is set
- **Pattern Complexity**: Simple patterns (dot-prefix) are faster than complex regex  
- **Line-by-Line Processing**: Each line is tested against the pattern
- **Fallback Overhead**: Invalid patterns have minimal performance impact

### Common Use Cases

1. **Test Frameworks**: Natural assertion syntax (`. result should equal 42`)
2. **Configuration DSLs**: Structured configuration languages  
3. **Documentation**: Executable documentation with embedded tests
4. **Logging**: Structured log message formatting
5. **API Testing**: REST endpoint validation syntax
6. **Data Validation**: Schema validation with readable syntax

### Integration Examples

See working examples in:
- [`tests/dogfood/nested-loops-comprehensive.rexx`](../tests/dogfood/nested-loops-comprehensive.rexx) - Test framework usage
- [`tests/address-matching-simple.spec.js`](../tests/address-matching-simple.spec.js) - Unit tests  
- [`src/expectations-address.js`](../src/expectations-address.js) - Implementation reference

## Cross-Iframe Communication

### Basic Iframe Integration
```rexx
-- Calculator iframe automation
ADDRESS calculator

-- Basic arithmetic sequence
clear
press button="2"
press button="+"
press button="3"
press button="="

LET calculationResult = getDisplay
SAY "2 + 3 = " || calculationResult

-- More complex calculation
clear
press button="1"
press button="0"
press button="*"
press button="5"
press button="="

LET productResult = getDisplay
SAY "10 × 5 = " || productResult
```

### Secure Message Passing
```rexx
-- Generate secure message for cross-iframe communication
LET messageId = UUID
LET nonce = RANDOM_HEX bytes=16
LET timestamp = NOW_TIMESTAMP

-- Create secure RPC payload
LET rpcPayload = '{"id": "' || messageId || '", "nonce": "' || nonce || '", "timestamp": ' || timestamp || ', "method": "calculate", "params": {"expression": "2 + 3"}}'

-- Send to target iframe
ADDRESS calculator
sendMessage target="calculator-iframe" payload=rpcPayload origin="https://calculator.example.com"

-- Wait for and process response
LET response = waitForResponse messageId=messageId timeout=5000
IF response.success THEN
    SAY "Calculation result: " || response.result
ELSE
    SAY "Calculation failed: " || response.error
ENDIF
```

## API Integration

### REST API Communication
```rexx
-- API authentication and requests
ADDRESS api

-- Set base configuration
setBaseUrl url="https://api.example.com/v1"
setHeader name="Content-Type" value="application/json"
setHeader name="Authorization" value="Bearer your-token-here"

-- Make API calls
LET users = GET endpoint="/users" params='{"page": 1, "limit": 10}'
LET newUser = POST endpoint="/users" data='{"name": "John Doe", "email": "john@example.com"}'
LET updatedUser = PUT endpoint="/users/123" data='{"name": "John Smith"}'
LET deleted = DELETE endpoint="/users/456"

-- Process API responses
IF users.success THEN
    LET userArray = JSON_PARSE text=users.data
    LET userCount = ARRAY_LENGTH array=userArray
    SAY "Retrieved " || userCount || " users"
ELSE
    SAY "API request failed: " || users.error
ENDIF
```

### Authenticated API Workflows
```rexx
-- Complete API workflow with authentication
ADDRESS api

-- Generate API signature
LET apiKey = "your-api-key"
LET apiSecret = "your-api-secret"
LET timestamp = NOW_TIMESTAMP
LET method = "POST"
LET path = "/api/v1/orders"
LET body = '{"product": "widget", "quantity": 5}'

-- Create signature
LET signatureBase = method || path || timestamp || body
LET signature = HMAC_SHA256 text=signatureBase secret=apiSecret

-- Set authentication headers
LET headers = '{"X-API-Key": "' || apiKey || '", "X-Signature": "' || signature || '", "X-Timestamp": "' || timestamp || '"}'

-- Make authenticated request
LET orderResult = POST endpoint=path headers=headers body=body

IF orderResult.success THEN
    LET order = JSON_PARSE text=orderResult.data
    SAY "Order created: " || order.id
    SAY "Status: " || order.status
ELSE
    SAY "Order failed: " || orderResult.error
    SAY "Status code: " || orderResult.statusCode
ENDIF
```

## Multi-Application Workflows

### Kitchen Management System
```rexx
-- Multi-step cooking workflow across applications
SAY "Starting meal preparation workflow..."

-- Check inventory
ADDRESS kitchen
LET chickenStock = checkStock item="chicken"
LET potatoStock = checkStock item="potatoes"
LET spiceStock = checkStock item="spices"

SAY "Inventory check:"
SAY "  Chicken: " || chickenStock.quantity || " units"
SAY "  Potatoes: " || potatoStock.quantity || " units"  
SAY "  Spices: " || spiceStock.available

-- Verify we have enough ingredients
IF chickenStock.quantity >= 2 AND potatoStock.quantity >= 4 THEN
    SAY "Sufficient ingredients available"
    
    -- Start preparation
    startPreparation meal="chicken_dinner" servings=4
    
    -- Preheat oven
    ADDRESS oven
    preheat temperature=375 duration=15
    SAY "Oven preheating to 375°F"
    
    -- Prep ingredients while oven heats
    ADDRESS kitchen
    prepChicken pieces=2 seasoning="herbs"
    prepPotatoes pieces=4 style="roasted"
    
    -- Wait for oven
    ADDRESS oven
    LET ovenReady = waitForPreheat timeout=900  -- 15 minutes
    
    IF ovenReady THEN
        SAY "Oven ready - starting cooking"
        
        -- Cook the meal
        ADDRESS kitchen
        cookItem item="seasoned_chicken" method="bake" duration=45
        cookItem item="roasted_potatoes" method="bake" duration=35
        
        -- Set timer
        ADDRESS timer
        setTimer duration=45 label="chicken_dinner"
        
        SAY "Meal cooking - timer set for 45 minutes"
    ELSE
        SAY "Oven failed to preheat - aborting cooking"
    ENDIF
ELSE
    SAY "Insufficient ingredients - updating shopping list"
    
    -- Update shopping list
    ADDRESS shopping
    IF chickenStock.quantity < 2 THEN
        addToList item="chicken" quantity=4
    ENDIF
    
    IF potatoStock.quantity < 4 THEN
        addToList item="potatoes" quantity=8
    ENDIF
    
    LET shoppingList = getList
    SAY "Shopping list updated: " || shoppingList
ENDIF
```

### Data Processing Pipeline
```rexx
-- Multi-service data processing workflow
SAY "Starting data processing pipeline..."

-- Fetch raw data from API
ADDRESS dataApi
setCredentials token="api-token"
LET rawData = fetchDataset name="customer_interactions" date="2024-08-29"

IF rawData.success THEN
    SAY "Raw data fetched: " || rawData.recordCount || " records"
    
    -- Send to processing service
    ADDRESS processor
    LET processJob = submitJob data=rawData.data type="customer_analysis"
    LET jobId = processJob.jobId
    
    SAY "Processing job submitted: " || jobId
    
    -- Monitor processing
    LET completed = false
    LET attempts = 0
    
    DO WHILE completed = false AND attempts < 30
        WAIT milliseconds=5000  -- Wait 5 seconds
        LET status = checkJob jobId=jobId
        
        SELECT
            WHEN status.state = "completed" THEN
                LET completed = true
                SAY "Processing completed successfully"
            WHEN status.state = "failed" THEN
                SAY "Processing failed: " || status.error
                EXIT
            OTHERWISE
                SAY "Processing... (" || status.progress || "% complete)"
                LET attempts = attempts + 1
        END
    END
    
    IF completed THEN
        -- Get processed results
        LET results = getJobResults jobId=jobId
        
        -- Store in database
        ADDRESS database
        LET stored = storeResults table="customer_insights" data=results.data
        
        -- Generate reports
        ADDRESS reporting
        LET report = generateReport template="customer_analysis" data=results.data
        
        IF report.success THEN
            SAY "Report generated: " || report.reportId
            SAY "Report URL: " || report.url
            
            -- Send notifications
            ADDRESS notifications
            sendEmail to="manager@company.com" subject="Data Processing Complete" body="Customer analysis report is ready: " || report.url
            
            SAY "Pipeline completed successfully"
        ELSE
            SAY "Report generation failed: " || report.error
        ENDIF
    ELSE
        SAY "Processing timed out after 30 attempts"
    ENDIF
ELSE
    SAY "Failed to fetch raw data: " || rawData.error
ENDIF
```

## Browser Automation Examples

### E-commerce Automation
```rexx
-- Automated product management
ADDRESS ecommerce

-- Login to admin panel
login username="admin" password="secure123"
LET loginSuccess = waitForPage page="dashboard" timeout=10000

IF loginSuccess THEN
    SAY "Successfully logged into e-commerce admin"
    
    -- Navigate to product management
    navigateTo section="products"
    
    -- Add new product
    LET productData = '{"name": "New Widget", "price": 29.99, "category": "widgets", "description": "Latest widget model"}'
    LET newProduct = createProduct data=productData
    
    IF newProduct.success THEN
        SAY "Product created: " || newProduct.productId
        
        -- Upload product image
        uploadImage productId=newProduct.productId imagePath="/uploads/widget-image.jpg"
        
        -- Set inventory
        setInventory productId=newProduct.productId quantity=100
        
        -- Publish product
        publishProduct productId=newProduct.productId
        
        SAY "Product published successfully"
    ELSE
        SAY "Product creation failed: " || newProduct.error
    ENDIF
    
    -- Update existing products
    LET products = getProducts filter='{"category": "widgets"}'
    LET productArray = JSON_PARSE text=products.data
    LET productCount = ARRAY_LENGTH array=productArray
    
    SAY "Updating " || productCount || " existing widget products"
    
    DO i = 0 TO productCount - 1
        LET product = ARRAY_GET array=productArray index=i
        LET productId = product.id
        LET currentPrice = product.price
        LET newPrice = currentPrice * 0.95  -- 5% discount
        
        updateProductPrice productId=productId price=newPrice
        SAY "Updated product " || productId || " price to $" || newPrice
    END
    
    -- Logout
    logout
    SAY "E-commerce automation completed"
ELSE
    SAY "Login failed - automation aborted"
ENDIF
```

### Social Media Management
```rexx
-- Multi-platform social media posting
SAY "Starting social media campaign..."

LET postContent = "Exciting news! Our new product line is now available. Check it out! #NewProduct #Innovation"
LET imageUrl = "https://example.com/product-image.jpg"
LET hashtags = "#product #announcement #innovation"

-- Post to Twitter/X
ADDRESS twitter
authenticate token="twitter-token"
LET tweetResult = createPost text=postContent media=imageUrl

IF tweetResult.success THEN
    SAY "Posted to Twitter: " || tweetResult.postId
ELSE
    SAY "Twitter post failed: " || tweetResult.error
ENDIF

-- Post to Facebook
ADDRESS facebook
authenticate token="facebook-token"
LET fbResult = createPost text=postContent image=imageUrl page="company-page"

IF fbResult.success THEN
    SAY "Posted to Facebook: " || fbResult.postId
ELSE
    SAY "Facebook post failed: " || fbResult.error
ENDIF

-- Post to LinkedIn
ADDRESS linkedin
authenticate token="linkedin-token"
LET linkedinResult = shareUpdate text=postContent media=imageUrl profile="company"

IF linkedinResult.success THEN
    SAY "Posted to LinkedIn: " || linkedinResult.shareId
ELSE
    SAY "LinkedIn post failed: " || linkedinResult.error
ENDIF

-- Schedule follow-up posts
ADDRESS scheduler
LET followUp = "Thank you for the amazing response to our product announcement!"
LET followUpTime = NOW_TIMESTAMP + 86400  -- 24 hours later

schedulePost platform="twitter" content=followUp time=followUpTime
schedulePost platform="facebook" content=followUp time=followUpTime
schedulePost platform="linkedin" content=followUp time=followUpTime

SAY "Follow-up posts scheduled for 24 hours"
SAY "Social media campaign completed"
```

## Security and Error Handling

### Secure Cross-Origin Communication
```rexx
-- Secure message handling with validation
ADDRESS calculator

-- Generate secure request
LET requestId = UUID
LET clientNonce = RANDOM_HEX bytes=16
LET timestamp = NOW_TIMESTAMP

LET secureRequest = '{"requestId": "' || requestId || '", "nonce": "' || clientNonce || '", "timestamp": ' || timestamp || ', "operation": "calculate", "expression": "sqrt(144)"}'

-- Send with origin validation
sendSecureMessage target="calculator-iframe" payload=secureRequest expectedOrigin="https://trusted-calculator.com"

-- Wait for response with timeout
LET response = waitForSecureResponse requestId=requestId timeout=10000

IF response.success THEN
    -- Validate response nonce and timestamp
    IF response.nonce = clientNonce AND ABS(value=(NOW_TIMESTAMP - response.timestamp)) < 30000 THEN
        SAY "Secure calculation result: " || response.result
    ELSE
        SAY "Security validation failed - response rejected"
    ENDIF
ELSE
    SAY "Secure request failed: " || response.error
ENDIF
```

### Error Recovery and Fallbacks
```rexx
-- Robust API communication with fallbacks
ADDRESS api

-- Primary API attempt
LET primaryResult = makeRequest endpoint="/users/123" timeout=5000

IF primaryResult.success THEN
    SAY "Primary API successful: " || primaryResult.data
ELSE
    SAY "Primary API failed: " || primaryResult.error
    
    -- Try backup API
    ADDRESS backupApi
    LET backupResult = makeRequest endpoint="/users/123" timeout=10000
    
    IF backupResult.success THEN
        SAY "Backup API successful: " || backupResult.data
    ELSE
        SAY "Backup API also failed: " || backupResult.error
        
        -- Use cached data if available
        ADDRESS cache
        LET cachedData = getCachedUser userId=123
        
        IF cachedData.found THEN
            SAY "Using cached data: " || cachedData.data
        ELSE
            SAY "No cached data available - operation failed"
            -- Could trigger alert or fallback workflow
        ENDIF
    ENDIF
ENDIF
```

## Integration with INTERPRET

### Dynamic Cross-Application Scripts
```rexx
-- INTERPRET inherits ADDRESS context
ADDRESS calculator

-- Generate and execute dynamic calculator script
LET operations = '["clear", "5", "+", "3", "*", "2", "="]'
LET opArray = JSON_PARSE text=operations
LET opCount = ARRAY_LENGTH array=opArray

LET calculatorScript = ""
DO i = 0 TO opCount - 1
    LET operation = ARRAY_GET array=opArray index=i
    
    IF operation = "clear" THEN
        LET calculatorScript = calculatorScript || "clear\\n"
    ELSE IF LENGTH(string=operation) = 1 AND INCLUDES(string="0123456789+-*/=" substring=operation) THEN
        LET calculatorScript = calculatorScript || "press button=\"" || operation || "\"\\n"
    ENDIF
END

LET calculatorScript = calculatorScript || "LET finalResult = getDisplay"

-- Execute the generated script in calculator context
INTERPRET calculatorScript

SAY "Dynamic calculation result: " || finalResult
```

## Application Types and Examples

### Supported Application Types

1. **Iframe Applications**: Web applications in sandboxed iframes
2. **API Services**: RESTful web services and microservices  
3. **Browser Extensions**: Browser automation and control
4. **Desktop Applications**: Native applications with RPC interfaces
5. **IoT Devices**: Smart home and industrial devices
6. **Database Systems**: Direct database communication
7. **Cloud Services**: AWS, Azure, GCP service integration

### Configuration Examples
```rexx
-- Configure application endpoints
ADDRESS config
setApplication name="calculator" type="iframe" url="https://calc.example.com" sandbox="allow-scripts"
setApplication name="api" type="rest" baseUrl="https://api.example.com" auth="bearer"
setApplication name="database" type="sql" connection="postgresql://user:pass@db:5432/mydb"

-- Use configured applications
ADDRESS calculator
LET calcResult = evaluate expression="2^8"

ADDRESS api  
LET apiData = GET endpoint="/data"

ADDRESS database
LET dbResult = query sql="SELECT * FROM users WHERE active = true"
```

## Best Practices

### Security Best Practices
```rexx
-- Always validate origins for cross-iframe communication
-- Use secure tokens and nonces for authentication
-- Implement request timeouts to prevent hanging
-- Validate response data before processing
-- Log all cross-application communications for audit trails
```

### Performance Best Practices
```rexx
-- Cache application configurations
-- Reuse connections when possible
-- Implement proper timeout handling
-- Use asynchronous operations where available
-- Batch related operations to reduce overhead
```

### Error Handling Best Practices
```rexx
-- Always check success status before processing results
-- Implement fallback mechanisms for critical operations
-- Provide meaningful error messages
-- Log errors for debugging and monitoring
-- Implement retry logic with exponential backoff
```

## Function Reference

### Core ADDRESS Functions
- `ADDRESS applicationName` - Switch to target application context
- `ADDRESS applicationName MATCHING("pattern")` - Switch with regex pattern matching  
- `ADDRESS ""` - Return to local context

### Message Passing Functions (implementation dependent)
- `sendMessage(target, payload, origin?)` - Send cross-iframe message
- `sendSecureMessage(target, payload, expectedOrigin)` - Send with validation
- `waitForResponse(messageId, timeout?)` - Wait for async response
- `waitForSecureResponse(requestId, timeout?)` - Wait with security validation

### API Functions (implementation dependent)
- `GET(endpoint, params?, headers?)` - HTTP GET request
- `POST(endpoint, data?, headers?)` - HTTP POST request
- `PUT(endpoint, data?, headers?)` - HTTP PUT request
- `DELETE(endpoint, headers?)` - HTTP DELETE request
- `setBaseUrl(url)` - Configure API base URL
- `setHeader(name, value)` - Set default header

### Security Functions
- Request ID generation and validation
- Nonce-based security for replay protection
- Origin validation for cross-iframe communication
- Token-based authentication support

**See also:**
- [Security Functions](12-security-functions.md) for authentication and encryption
- [JSON Functions](08-json-functions.md) for API data processing
- [Web Functions](09-web-functions.md) for URL handling and encoding
- [Dynamic Execution](15-interpret.md) for context sharing with INTERPRET