# Output and Debug Functions

Console output and debugging capabilities with support for variable interpolation, mixed content formatting, and program flow tracking.

## SAY Statement - Core Output

### Basic Text Output
```rexx
-- Simple text output
SAY "Hello World"
SAY "Script started at initialization"
SAY "Processing data..."

-- Empty lines for formatting
SAY ""
SAY "Section separator"
SAY ""
```

### Variable Output
```rexx
-- Output variables directly
LET name = "John"
LET age = 30
LET city = "New York"

SAY name              -- Output: John
SAY name age          -- Output: John 30
SAY name age city     -- Output: John 30 New York

-- Mixed variables and values
LET score = 95
LET maxScore = 100
SAY score maxScore    -- Output: 95 100
```

## String Interpolation

### Variable Interpolation Syntax
```rexx
-- String interpolation with {variable} syntax
LET user = "Alice"
LET score = 95
LET course = "Mathematics"

SAY "Student {user} scored {score} points"
-- Output: Student Alice scored 95 points

SAY "Course: {course}, Student: {user}, Score: {score}"
-- Output: Course: Mathematics, Student: Alice, Score: 95

-- Complex expressions in interpolation
LET percentage = (score * 100) / 100
SAY "{user} achieved {percentage}% in {course}"
-- Output: Alice achieved 95% in Mathematics
```

### Mixed Text and Variables
```rexx
-- Combine literal text with variables
LET count = 5
LET item = "widgets"

SAY "Found" count "items in inventory"
-- Output: Found 5 items in inventory

SAY "Processing" count item "for shipment"
-- Output: Processing 5 widgets for shipment

-- Multiple mixed elements
LET total = 150
LET currency = "USD"
SAY "Total cost:" total currency "including tax"
-- Output: Total cost: 150 USD including tax
```

## Advanced Output Patterns

### Object Property Access
```rexx
-- Output object properties
ADDRESS kitchen
LET stock = checkStock item="chicken"

SAY "Current stock:" stock.quantity "units"
-- Output: Current stock: 5 units

SAY "Item:" stock.item "Quantity:" stock.quantity "Status:" stock.status
-- Output: Item: chicken Quantity: 5 Status: available

-- Nested object properties
LET order = '{"customer": {"name": "John", "email": "john@example.com"}, "total": 99.99}'
LET orderObj = JSON_PARSE text=order

SAY "Customer:" orderObj.customer.name "Email:" orderObj.customer.email
-- Output: Customer: John Email: john@example.com
```

### Array and Collection Output
```rexx
-- Array processing with output
LET numbers = "[1, 2, 3, 4, 5]"
LET sum = ARRAY_SUM array=numbers
LET average = ARRAY_AVERAGE array=numbers
LET length = ARRAY_LENGTH array=numbers

SAY "Array:" numbers
SAY "Length:" length "Sum:" sum "Average:" average
-- Output: Array: [1, 2, 3, 4, 5]
-- Output: Length: 5 Sum: 15 Average: 3
```

## Debugging and Development

### Workflow Debug Output
```rexx
-- Debug complex workflows step by step
SAY "Starting meal preparation workflow"

ADDRESS kitchen
LET stock = checkStock item="chicken"
SAY "Debug: Retrieved stock info - Item:" stock.item "Quantity:" stock.quantity

IF stock.quantity >= 3 THEN
    SAY "✅ Sufficient ingredients available"
    createMeal chicken=3 potatoes=2
    SAY "✅ Meal created successfully"
ELSE
    SAY "⚠️ Insufficient ingredients, only" stock.quantity "available"
    SAY "🔄 Falling back to alternative meal"
    createMeal chicken=stock.quantity potatoes=4
ENDIF

SAY "✅ Workflow completed"
```

### Loop Progress Tracking
```rexx
-- Track progress through iterations
LET iterations = 10
LET batchSize = 100

SAY "Starting batch processing:"
SAY "  Iterations:" iterations
SAY "  Batch size:" batchSize
SAY "  Total items:" (iterations * batchSize)
SAY ""

DO i = 1 TO iterations
    SAY "Processing batch" i "of" iterations "(" || (i * batchSize) || " items processed)"
    
    -- Simulate work
    WAIT milliseconds=500
    
    -- Progress indicator
    LET progress = MATH_ROUND value=((i * 100) / iterations) precision=1
    SAY "  Progress:" progress "% complete"
END

SAY ""
SAY "✅ All batches completed successfully"
```

### Conditional Debug Output
```rexx
-- Environment-aware debugging
LET debugMode = true
LET temperature = 75
LET threshold = 80

IF debugMode THEN
    SAY "🐛 DEBUG: Temperature check starting"
    SAY "🐛 DEBUG: Current temperature:" temperature
    SAY "🐛 DEBUG: Threshold:" threshold
ENDIF

IF temperature > threshold THEN
    SAY "🔥 WARNING: High temperature detected:" temperature "degrees"
    SAY "🔧 ACTION: Initiating cooling sequence"
ELSE
    SAY "✅ Normal temperature:" temperature "degrees"
    IF debugMode THEN
        SAY "🐛 DEBUG: Temperature within normal range"
    ENDIF
ENDIF
```

## Built-in Function Integration

### Function Result Output
```rexx
-- Show function processing
LET text = "hello world"
SAY "Original text:" text

LET processed = UPPER string=text
SAY "Uppercase:" processed

LET length = LENGTH string=text
SAY "Length:" length "characters"

-- Mathematical function output
LET numbers = "[10, 20, 30, 40, 50]"
LET max = ARRAY_MAX array=numbers
LET min = ARRAY_MIN array=numbers
LET avg = ARRAY_AVERAGE array=numbers

SAY "Dataset analysis:"
SAY "  Numbers:" numbers
SAY "  Maximum:" max
SAY "  Minimum:" min
SAY "  Average:" avg
SAY "  Range:" (max - min)
```

### Date and Time Output
```rexx
-- Timestamp and date formatting
LET currentDate = DATE
LET currentTime = TIME
LET timestamp = NOW

SAY "System time information:"
SAY "  Date:" currentDate
SAY "  Time:" currentTime
SAY "  Full timestamp:" timestamp

-- Formatted output with interpolation
SAY "Script executed on {currentDate} at {currentTime}"
-- Output: Script executed on 2024-08-29 at 14:30:15
```

## Formatting and Presentation

### Single vs Double Quote Behavior
```rexx
-- Demonstrate interpolation differences
LET name = "John"
LET age = 30

SAY 'Hello {name}, you are {age} years old'
-- Output: Hello {name}, you are {age} years old (no interpolation)

SAY "Hello {name}, you are {age} years old"
-- Output: Hello John, you are 30 years old (with interpolation)

-- Mixed usage
SAY 'User name: {name}' " (processed: " processed ")"
-- Output: User name: {name} (processed: true)
```

### Multi-line and Complex Output
```rexx
-- Complex formatting for reports
LET reportTitle = "Sales Analysis Report"
LET reportDate = DATE
LET totalSales = 45000
LET targetSales = 40000
LET performance = MATH_ROUND value=((totalSales * 100) / targetSales) precision=1

SAY "================================"
SAY reportTitle
SAY "================================"
SAY "Generated on: {reportDate}"
SAY ""
SAY "Performance Summary:"
SAY "  Target Sales:  ${targetSales}"
SAY "  Actual Sales:  ${totalSales}"
SAY "  Performance:   {performance}%"
SAY ""

IF totalSales > targetSales THEN
    SAY "🎉 TARGET EXCEEDED!"
    SAY "   Surplus: ${totalSales - targetSales}"
ELSE
    SAY "📈 Target not met"
    SAY "   Shortfall: ${targetSales - totalSales}"
ENDIF

SAY "================================"
```

## Error Reporting and Diagnostics

### Error Information Display
```rexx
-- Error handling with detailed output
SIGNAL ON ERROR NAME ErrorHandler

LET riskyOperation = "divide by zero test"
LET result = 10 / 0  -- This will cause an error

SAY "This line won't execute"
EXIT

ErrorHandler:
SAY "❌ ERROR OCCURRED:"
SAY "   Message: " || ERROR_MESSAGE
SAY "   Line: " || ERROR_LINE
SAY "   Function: " || ERROR_FUNCTION
SAY "   Command: " || ERROR_COMMAND
SAY "   Timestamp: " || ERROR_TIMESTAMP

-- Additional context
SAY ""
SAY "🔧 Error Context:"
SAY "   Operation: " || riskyOperation
SAY "   Variables: " || ERROR_VARIABLES

-- Recovery suggestions
SAY ""
SAY "💡 Suggested Actions:"
SAY "   1. Check input values"
SAY "   2. Validate calculations" 
SAY "   3. Review error log"
```

### Diagnostic Output
```rexx
-- System diagnostics and health checks
SAY "🔍 System Diagnostics Starting..."
SAY ""

-- Memory and performance
LET startTime = NOW_TIMESTAMP

-- File system check
LET configExists = FILE_EXISTS filename="config.txt"
SAY "Configuration file: " || IF(condition=configExists trueValue="✅ Found" falseValue="❌ Missing")

-- Network connectivity (if applicable)
ADDRESS api
LET healthCheck = ping endpoint="/health" timeout=5000
SAY "API connectivity: " || IF(condition=healthCheck.success trueValue="✅ Connected" falseValue="❌ Unavailable")

-- Processing test
LET testArray = "[1, 2, 3, 4, 5]"
LET testSum = ARRAY_SUM array=testArray
LET expectedSum = 15
LET mathWorking = (testSum = expectedSum)
SAY "Math functions: " || IF(condition=mathWorking trueValue="✅ Working" falseValue="❌ Error")

-- Performance measurement
LET endTime = NOW_TIMESTAMP
LET diagnosticTime = endTime - startTime
SAY ""
SAY "⏱️ Diagnostic completed in {diagnosticTime}ms"

IF configExists AND healthCheck.success AND mathWorking THEN
    SAY "🟢 System Status: All systems operational"
ELSE
    SAY "🔴 System Status: Issues detected - review above"
ENDIF
```

## Logging and Audit Trails

### Structured Logging
```rexx
-- Create structured log entries
LET logLevel = "INFO"
LET component = "UserService"
LET action = "user_login"
LET userId = 12345
LET timestamp = NOW

SAY "[{logLevel}] {timestamp} - {component}"
SAY "  Action: {action}"
SAY "  User ID: {userId}"
SAY "  Status: Success"
SAY "  Duration: 245ms"

-- Error logging
LET errorLevel = "ERROR"
LET errorComponent = "PaymentService"
LET errorCode = "PAYMENT_FAILED"
LET transactionId = UUID

SAY "[{errorLevel}] {timestamp} - {errorComponent}"
SAY "  Error Code: {errorCode}"
SAY "  Transaction: {transactionId}"
SAY "  User ID: {userId}"
SAY "  Message: Payment gateway timeout"
```

### Performance Monitoring
```rexx
-- Track operation performance
LET operationName = "Data Processing"
LET startTime = NOW_TIMESTAMP

SAY "🚀 Starting: {operationName}"
SAY "   Start time: " || startTime

-- Simulate work with progress updates
DO i = 1 TO 5
    SAY "   Progress: Step {i}/5"
    WAIT milliseconds=1000
END

LET endTime = NOW_TIMESTAMP
LET duration = endTime - startTime
LET duractionSeconds = MATH_ROUND value=(duration / 1000) precision=2

SAY "✅ Completed: {operationName}"
SAY "   End time: " || endTime
SAY "   Duration: {duractionSeconds} seconds"

-- Performance assessment
IF duration < 3000 THEN
    SAY "⚡ Performance: Excellent (< 3s)"
ELSE IF duration < 10000 THEN
    SAY "✅ Performance: Good (< 10s)"
ELSE
    SAY "⚠️ Performance: Slow (> 10s)"
ENDIF
```

## Development and Testing Utilities

### Test Result Display
```rexx  
-- Test execution output formatting
LET testCollection = "String Functions"
LET totalTests = 5
LET passedTests = 0

SAY "🧪 Running Test Collection: {testCollection}"
SAY "═══════════════════════════════"

-- Test 1
LET test1Result = (UPPER(string="hello") = "HELLO")
LET test1Status = IF(condition=test1Result trueValue="✅ PASS" falseValue="❌ FAIL")
SAY "Test 1: UPPER function - {test1Status}"
IF test1Result THEN LET passedTests = passedTests + 1

-- Test 2  
LET test2Result = (LENGTH(string="test") = 4)
LET test2Status = IF(condition=test2Result trueValue="✅ PASS" falseValue="❌ FAIL")
SAY "Test 2: LENGTH function - {test2Status}"
IF test2Result THEN LET passedTests = passedTests + 1

-- Test 3
LET test3Result = INCLUDES(string="hello world" substring="world")
LET test3Status = IF(condition=test3Result trueValue="✅ PASS" falseValue="❌ FAIL")
SAY "Test 3: INCLUDES function - {test3Status}"
IF test3Result THEN LET passedTests = passedTests + 1

-- Summary
SAY ""
SAY "📊 Test Results:"
SAY "   Total Tests: {totalTests}"
SAY "   Passed: {passedTests}"
SAY "   Failed: " || (totalTests - passedTests)
SAY "   Success Rate: " || MATH_ROUND(value=((passedTests * 100) / totalTests) precision=1) || "%"

IF passedTests = totalTests THEN
    SAY "🎉 ALL TESTS PASSED!"
ELSE
    SAY "⚠️ Some tests failed - review above"
ENDIF
```

## Best Practices

### Effective Debug Output
```rexx
-- Use consistent formatting for different message types
SAY "ℹ️ INFO: Application starting..."        -- Information
SAY "⚠️ WARN: Configuration file missing"     -- Warnings  
SAY "❌ ERROR: Database connection failed"    -- Errors
SAY "✅ SUCCESS: Operation completed"         -- Success
SAY "🐛 DEBUG: Variable state: " || variable  -- Debug info
SAY "📊 METRIC: Processing rate: " || rate    -- Metrics
```

### Structured Output Format
```rexx
-- Create consistent, readable output structure
LET operation = "User Registration"
LET startTime = NOW

SAY "┌─ {operation} ─────────────────"
SAY "│ Started: {startTime}"
SAY "│ User: john.doe@example.com"
SAY "│ IP: 192.168.1.100"
SAY "├─ Progress ─────────────────────"
SAY "│ ✅ Email validation"
SAY "│ ✅ Password strength check"
SAY "│ ✅ Database insert"
SAY "│ ✅ Welcome email sent"
SAY "└─ Completed ───────────────────"
```

## Function Reference

### SAY Statement Syntax
- `SAY "text"` - Output literal text
- `SAY variable` - Output variable value
- `SAY var1 var2 var3` - Output multiple variables separated by spaces
- `SAY "Text with {variable} interpolation"` - String interpolation with double quotes
- `SAY 'Text without {variable} interpolation'` - Literal text with single quotes
- `SAY ""` - Output empty line

### String Interpolation
- `{variable}` - Insert variable value
- `{object.property}` - Insert object property value  
- `{array[index]}` - Insert array element value
- Only works with double-quoted strings
- Variables must be defined in current scope

### Output Formatting
- Use consistent prefixes for different message types
- Include timestamps for logging and debugging
- Provide progress indicators for long operations
- Use visual separators for complex output
- Include context information for errors

**See also:**
- [String Functions](04-string-functions.md) for text formatting
- [Date/Time Functions](07-datetime-functions.md) for timestamps
- [Math Functions](05-math-functions.md) for calculations in output
- [Control Flow](02-control-flow.md) for conditional output