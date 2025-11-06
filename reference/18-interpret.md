# Dynamic Code Execution - INTERPRET

Powerful dynamic code execution capabilities with multiple security and scoping models for meta-programming, code generation, and flexible automation workflows.

//TODO In many languages eval is considered potentially harmful

## INTERPRET Modes Overview

| Syntax | Variable Access | Use Cases |
|--------|----------------|-----------|
| `INTERPRET "code"` | Full bidirectional sharing | Quick scripting, template processing, legacy code |
| `INTERPRET "code" WITH ISOLATED` | No variable access | Secure execution, untrusted code, sandboxing |
| `INTERPRET "code" WITH ISOLATED (var1 var2)` | Controlled input only | Data processing with specific inputs |
| `INTERPRET "code" WITH ISOLATED EXPORT(result)` | Controlled output only | Computed results without input access |
| `INTERPRET "code" WITH ISOLATED (inputs...) EXPORT(outputs...)` | Full control of I/O | Complex data processing with security |
| `NO-INTERPRET` / `NO_INTERPRET` | Blocks all INTERPRET | High-security environments |

## Classic INTERPRET (Full Variable Sharing)

Traditional Rexx-style INTERPRET with complete variable sharing between parent and child scopes.

### Basic Usage
```rexx
-- Simple dynamic execution
LET baseValue = 100
INTERPRET "LET result = baseValue * 2"
SAY "Result: " || result              
-- "Result: 200"
```

### Multi-line Execution
```rexx
LET script = "LET a = 10\\nLET b = 20\\nLET sum = a + b"
INTERPRET script
SAY "Sum: " || sum                    
-- "Sum: 30"
```

### Bidirectional Variable Sharing
```rexx
LET original = "start"
INTERPRET "LET modified = original || \" processed\"\\nLET new_var = \"created\""
SAY modified                          
-- "start processed"
SAY new_var                          
-- "created"
```

### Complex Processing Example
```rexx
-- Dynamic data processing
LET processingScript = "
  LET rawData = '[{\\\"name\\\":\\\"john\\\",\\\"score\\\":85},{\\\"name\\\":\\\"jane\\\",\\\"score\\\":92}]'
  LET parsed = JSON_PARSE text=rawData
  LET count = ARRAY_LENGTH array=parsed
  LET firstUser = ARRAY_GET array=parsed index=1
  LET firstName = UPPER string=ARRAY_GET(array=firstUser key=\\\"name\\\")
  LET timestamp = NOW
"

INTERPRET processingScript
SAY "Processed " || count || " users at " || timestamp
SAY "First user: " || firstName
```

## Isolated INTERPRET (Sandboxed Execution)

Sandboxed execution with no variable sharing by default, providing complete security isolation.

### Basic Isolation
```rexx
-- Variables remain isolated
LET secret = "confidential"
INTERPRET "LET isolated_var = \"safe\"\\nLET leaked = secret" WITH ISOLATED

-- isolated_var and leaked are not accessible in parent scope
-- secret remains protected from the isolated code
```

### Security Benefits
- No access to parent scope variables
- Cannot modify external state
- Perfect for untrusted code execution
- Prevents information leakage

## Isolated INTERPRET with Import/Export

Control exactly which variables flow in and out of isolated scope for precise data processing.

### Import Variables (Controlled Input)
```rexx
-- Import specific variables for processing
LET price = 100
LET tax_rate = 0.08
LET discount = 10

INTERPRET "LET total = (price - discount) * (1 + tax_rate)" WITH ISOLATED (price tax_rate discount) EXPORT(total)
SAY "Total: " || total               
-- "Total: 97.2"
```

### Multiple Import and Export
```rexx
LET base = 10
LET multiplier = 3
LET offset = 5

LET processing = "
  LET result1 = base * multiplier
  LET result2 = result1 + offset
  LET debug = base || \" * \" || multiplier || \" + \" || offset || \" = \" || result2
"

INTERPRET processing WITH ISOLATED (base multiplier offset) EXPORT(result1 result2 debug)

SAY "Result1: " || result1           
-- "Result1: 30"  
SAY "Result2: " || result2           
-- "Result2: 35"
SAY "Debug: " || debug               
-- "Debug: 10 * 3 + 5 = 35"
```

### Complex Data Processing
```rexx
-- Secure data filtering
LET users = JSON_PARSE text='[{"name":"John","age":30},{"name":"Jane","age":25}]'
LET min_age = 26

LET filter_code = "
  LET filtered = []
  LET count = ARRAY_LENGTH array=users
  DO i = 1 TO count
    LET user = ARRAY_GET array=users index=i
    IF ARRAY_GET(array=user key=\"age\") >= min_age THEN
      LET filtered = ARRAY_PUSH array=filtered item=user
    ENDIF
  END
  LET result_count = ARRAY_LENGTH array=filtered
"

INTERPRET filter_code WITH ISOLATED (users min_age) EXPORT(filtered result_count)
SAY "Filtered: " || result_count || " users"
```

## Security Controls

### NO-INTERPRET - Disable Dynamic Execution
```rexx
-- Normal operation
LET result1 = INTERPRET string="LET safe = 42"
SAY "Before: " || safe                
-- "Before: 42"

-- Block all INTERPRET operations
NO-INTERPRET

-- Both function and statement forms are blocked
LET result2 = INTERPRET string="LET blocked = 1"  -- Throws error
INTERPRET "LET also_blocked = 2"                  -- Throws error

-- NO_INTERPRET (underscore variant) also supported
NO_INTERPRET
```

**Use cases for NO-INTERPRET:**
- Secure execution environments
- Code sandboxing
- Preventing dynamic code injection
- Compliance with security policies
- Template systems with restricted capabilities

## Meta-Programming and Code Generation

### Dynamic Code Generation
```rexx
-- Generate validation code for form fields
LET requiredFields = "[\"name\", \"email\", \"phone\", \"address\"]"
LET fields = JSON_PARSE text=requiredFields
LET fieldCount = ARRAY_LENGTH array=fields

LET validationCode = ""
DO i = 1 TO fieldCount
  LET fieldName = ARRAY_GET array=fields index=i
  LET validation = "IF " || fieldName || " = \"\" THEN\\n"
  LET validation = validation || "  SAY \"Error: " || fieldName || " is required\"\\n" 
  LET validation = validation || "  LET validationFailed = true\\n"
  LET validation = validation || "ENDIF\\n"
  LET validationCode = validationCode || validation
END

-- Set up test data
LET name = "John"
LET email = ""        -- This will trigger validation
LET phone = "555-1234"
LET address = "123 Main St"
LET validationFailed = false

-- Execute the generated validation code
INTERPRET validationCode

IF validationFailed THEN
  SAY "Form validation failed"
ELSE
  SAY "Form validation passed"
ENDIF
```

### Configuration-Driven Logic
```rexx
-- Execute different workflows based on configuration
LET config = JSON_PARSE text='{"workflow": "premium", "features": ["analytics", "reporting"]}'
LET workflowType = ARRAY_GET array=config key="workflow"

SELECT
  WHEN workflowType = "premium" THEN
    LET premiumScript = "LET analytics = true\\nLET reporting = true\\nLET priority = \"high\""
    INTERPRET premiumScript
  WHEN workflowType = "standard" THEN  
    INTERPRET "LET analytics = true\\nLET reporting = false\\nLET priority = \"normal\""
  OTHERWISE
    INTERPRET "LET analytics = false\\nLET reporting = false\\nLET priority = \"low\""
END

SAY "Workflow configured: priority=" || priority || ", analytics=" || analytics
```

### Template Processing
```rexx
-- Process templates with dynamic content
LET templateVars = '{"customerName": "John Smith", "orderTotal": 125.50, "itemCount": 3}'
LET vars = JSON_PARSE text=templateVars

LET template = "
  LET customerName = ARRAY_GET array=vars key=\"customerName\"
  LET orderTotal = ARRAY_GET array=vars key=\"orderTotal\"
  LET itemCount = ARRAY_GET array=vars key=\"itemCount\"
  
  LET message = \"Dear \" || customerName || \", your order of \" || itemCount || \" items totaling $\" || orderTotal || \" has been processed.\"
"

INTERPRET template WITH ISOLATED (vars) EXPORT(message)
SAY "Generated message: " || message
```

## Application Addressing Integration

INTERPRET inherits the current ADDRESS context, enabling cross-application automation:

```rexx
-- Calculator automation with dynamic operations
ADDRESS calculator

-- Generate calculator operations dynamically
LET operations = "[\"clear\", \"5\", \"+\", \"3\", \"*\", \"2\", \"=\"]"
LET ops = JSON_PARSE text=operations
LET opCount = ARRAY_LENGTH array=ops

LET calculatorScript = ""
DO i = 1 TO opCount
  LET op = ARRAY_GET array=ops index=i
  LET command = "press button=\"" || op || "\"\\n"
  LET calculatorScript = calculatorScript || command
END

LET calculatorScript = calculatorScript || "LET finalResult = getDisplay"

-- Execute the generated calculator script
INTERPRET calculatorScript

SAY "Calculator result: " || finalResult
```

## Error Handling

### INTERPRET Error Handling
```rexx
SIGNAL ON ERROR NAME InterpretError

-- This will fail and trigger error handler
INTERPRET "LET invalid = NONEXISTENT_FUNCTION()"

SAY "This won't execute"
EXIT

InterpretError:
SAY "INTERPRET failed: " || ERROR_MESSAGE
SAY "Error in function: " || ERROR_FUNCTION
SAY "Error context: " || ERROR_VARIABLES
```

### Graceful Error Recovery
```rexx
-- Safe dynamic execution with error handling
LET userCode = "LET result = 10 / 0"  -- This will cause an error

SIGNAL ON ERROR NAME HandleMathError
INTERPRET userCode
SIGNAL OFF ERROR

SAY "Execution completed successfully"
EXIT

HandleMathError:
SAY "Math error in dynamic code: " || ERROR_MESSAGE
SAY "Continuing with default values..."
LET result = 0
SIGNAL OFF ERROR
```

## Performance Considerations

- **INTERPRET instances**: Each call creates a new interpreter instance
- **Variable sharing**: Classic INTERPRET has fastest variable sharing
- **Isolated execution**: Minimal performance cost for security benefits
- **Large code blocks**: Supported with good performance
- **Error handling**: Minimal overhead when no errors occur

## Best Practices

### When to Use Each Mode

**Classic INTERPRET:**
- Template processing with trusted code
- Quick calculations and data transformations
- Legacy system integration
- Development and debugging

**Isolated INTERPRET:**
- Processing untrusted user input
- Plugin systems
- Configuration file processing
- Sandbox environments

**Import/Export INTERPRET:**
- Data processing pipelines
- Complex calculations with controlled I/O
- Secure computation services
- API request processing

### Code Organization
```rexx
-- Good: Organize complex INTERPRET code
LET dataProcessing = "
  -- Data validation phase
  LET validRecords = []
  
  -- Processing phase  
  DO i = 1 TO inputCount
    LET record = ARRAY_GET array=inputData index=i
    -- Processing logic here
  END
  
  -- Results compilation
  LET summary = createSummary records=validRecords
"

INTERPRET dataProcessing WITH ISOLATED (inputData inputCount) EXPORT(validRecords summary)
```

### Security Guidelines
- Use isolated mode for untrusted code
- Minimize exported variables to only what's needed
- Use NO-INTERPRET in high-security contexts
- Validate all dynamic code before execution
- Log dynamic code execution for audit trails

## API Reference

### Statement Forms
```rexx
-- Classic INTERPRET (full sharing)
INTERPRET codeString

-- Isolated INTERPRET (no sharing)  
INTERPRET codeString WITH ISOLATED

-- Isolated with controlled I/O
INTERPRET codeString WITH ISOLATED (input1 input2) EXPORT(output1 output2)

-- Security control
NO-INTERPRET        -- Hyphen form
NO_INTERPRET        -- Underscore form
```

### Legacy Function Form (deprecated but supported)
```rexx
LET result = INTERPRET string=codeString options='{"shareVars": true}'
```

## JavaScript Execution - INTERPRET_JS

Execute JavaScript code directly within Rexx scripts for browser automation, DOM manipulation, and cross-language integration.

### Basic JavaScript Execution
```rexx
-- Execute JavaScript expressions
LET result = INTERPRET_JS("5 + 3 * 2")
SAY "Math result: " || result                    
-- "Math result: 11"

-- Execute JavaScript statements  
INTERPRET_JS("globalThis.testVar = 'Hello from JS'")
LET message = INTERPRET_JS("globalThis.testVar")
SAY message                                      
-- "Hello from JS"
```

### Type Parameter Control
```rexx
-- Force expression mode (with return)
LET mathResult = INTERPRET_JS("Math.max(10, 20, 5)", "expression")
-- mathResult = 20

-- Force statement mode (no return)
INTERPRET_JS("console.log('Debug message')", "statement")

-- Auto mode (default) - tries expression first, falls back to statement
LET autoResult = INTERPRET_JS("document.title")  -- Reads page title
INTERPRET_JS("alert('Hello World')")             -- Shows alert dialog
```

### Browser DOM Integration
```rexx
-- Read DOM element properties
LET pageTitle = INTERPRET_JS("document.title")
LET displayValue = INTERPRET_JS("document.getElementById('display').textContent")

-- Manipulate DOM elements
INTERPRET_JS("document.getElementById('button').click()")
INTERPRET_JS("document.body.style.backgroundColor = 'lightblue'")

-- Call JavaScript functions
INTERPRET_JS("button_number(5)")
INTERPRET_JS("calculate()")
LET result = INTERPRET_JS("getDisplayValue()")
```

### Calculator Automation Example
```rexx
-- Automate calculator operations via JavaScript
SAY "Automating calculator: 5 + 3 = ?"

INTERPRET_JS("button_clear()")
INTERPRET_JS("button_number(5)")
INTERPRET_JS("button_number('+')")  
INTERPRET_JS("button_number(3)")
INTERPRET_JS("button_number('=')")

LET calculationResult = INTERPRET_JS("document.getElementById('display').textContent")
SAY "Calculator result: " || calculationResult
-- "Calculator result: 8"
```

### Cross-Frame Communication
```rexx
-- Execute JavaScript in iframe contexts  
ADDRESS iframe
INTERPRET_JS("parent.postMessage({type: 'result', value: 42}, '*')")

-- Access iframe-specific functions
INTERPRET_JS("calculatorApp.pressButton('=')")
LET iframeResult = INTERPRET_JS("calculatorApp.getDisplay()")
```

### JavaScript Object Manipulation
```rexx
-- Create and manipulate JavaScript objects
INTERPRET_JS("globalThis.config = {theme: 'dark', lang: 'en'}")
LET theme = INTERPRET_JS("globalThis.config.theme")

-- Work with arrays
INTERPRET_JS("globalThis.items = [1, 2, 3, 4, 5]")
LET arrayLength = INTERPRET_JS("globalThis.items.length")
LET firstItem = INTERPRET_JS("globalThis.items[0]")

-- Call JavaScript methods
LET joinedItems = INTERPRET_JS("globalThis.items.join('-')")
SAY "Joined array: " || joinedItems
-- "Joined array: 1-2-3-4-5"
```

### Security Integration with NO-INTERPRET
```rexx
-- INTERPRET_JS respects NO-INTERPRET directive
NO-INTERPRET

-- This will throw an error
INTERPRET_JS("alert('Blocked!')")  -- Error: "INTERPRET_JS is blocked by NO-INTERPRET directive"
```

### Error Handling
```rexx
-- Handle JavaScript errors gracefully
SIGNAL ON ERROR NAME JSError

INTERPRET_JS("nonExistentFunction()")
SAY "JavaScript executed successfully"
EXIT

JSError:
SAY "JavaScript execution failed: " || ERROR_MESSAGE
SAY "Continuing with fallback logic..."
SIGNAL OFF ERROR
```

### Type Parameter Reference

| Type | Behavior | Use Case |
|------|----------|----------|
| `"auto"` (default) | Try expression first, fall back to statement | General purpose, backward compatible |
| `"expression"` | Force expression mode with `return (...)` | Reading values, calculations, DOM queries |  
| `"statement"` | Force statement mode, execute as-is | Function calls, assignments, side effects |

### Advanced Integration Examples
```rexx
-- Dynamic JavaScript generation
LET buttonId = "calculate-btn"
LET jsCode = "document.getElementById('" || buttonId || "').click()"
INTERPRET_JS(jsCode)

-- Conditional JavaScript execution
IF INTERPRET_JS("typeof jQuery !== 'undefined'") = "true" THEN
  INTERPRET_JS("jQuery('#modal').show()")
ELSE  
  INTERPRET_JS("document.getElementById('modal').style.display = 'block'")
ENDIF

-- JavaScript template processing
LET userName = "John"
LET template = "document.querySelector('.welcome').textContent = 'Hello, " || userName || "'"
INTERPRET_JS(template)
```

### Browser Environment Detection
```rexx
-- INTERPRET_JS only works in browser environments
SIGNAL ON ERROR NAME NotBrowser

LET result = INTERPRET_JS("window.location.href")
SAY "Current page: " || result
SIGNAL OFF ERROR
EXIT

NotBrowser:
SAY "INTERPRET_JS requires browser environment"
SAY "Error: " || ERROR_MESSAGE
```

### Performance Considerations
- **JavaScript parsing**: Each call validates syntax before execution
- **Context sharing**: JavaScript executes in shared global context
- **Error isolation**: JavaScript errors are caught and converted to Rexx errors
- **Type conversion**: Automatic conversion between JavaScript and Rexx types
- **DOM access**: Direct access to browser DOM without serialization overhead

### Best Practices
- Use `"expression"` type for reading values and calculations
- Use `"statement"` type for actions and side effects  
- Use `"auto"` for mixed operations and backward compatibility
- Handle errors with SIGNAL ON ERROR for robust automation
- Validate JavaScript syntax before dynamic execution
- Use NO-INTERPRET in secure contexts to disable all dynamic execution

**See also:**
- [Basic Syntax](01-basic-syntax.md) for variable management
- [Control Flow](02-control-flow.md) for program structure  
- [Application Addressing](16-application-addressing.md) for cross-app automation
- [Security Functions](12-security-functions.md) for additional security features
- [DOM Functions](18-dom-functions.md) for structured DOM manipulation
- [Web Functions](09-web-functions.md) for URL and web integration