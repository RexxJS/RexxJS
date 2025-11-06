# DOM Functions

DOM automation capabilities for web testing, UI manipulation, and interactive application development, designed for Autonomous Web Mode execution.

## ⚠️ Autonomous Web Mode Only

**Important**: DOM functions are only available in Autonomous Web Mode (direct browser execution). They will throw an error in Command-line mode since the `document` object is not available, and are not applicable in Controlled Web Mode where the worker iframe may not have DOM access permissions.

```rexx
-- This will work in browser
LET count = DOM_QUERY selector="button" operation="count"

-- This will throw "DOM functions only available in browser environment" in Command-line mode
```

## Core DOM Query Functions

### DOM_QUERY - Element Inspection and Data Retrieval

The `DOM_QUERY` function is the foundation of DOM interaction, providing multiple operations for inspecting elements.

#### Basic Syntax
```rexx
LET result = DOM_QUERY selector="CSS_SELECTOR" operation="OPERATION" [additional_params]
```

### Element Counting and Existence
```rexx
-- Count matching elements
LET button_count = DOM_QUERY selector="button" operation="count"
LET form_count = DOM_QUERY selector="form" operation="count"

-- Check if element exists (returns true/false)
LET modal_exists = DOM_QUERY selector="#modal" operation="exists"
LET has_errors = DOM_QUERY selector=".error-message" operation="exists"
```

### Visibility and State Checking
```rexx
-- Check if element is visible (considers offsetParent)
LET is_visible = DOM_QUERY selector="#popup" operation="visible"
LET menu_open = DOM_QUERY selector=".dropdown-menu" operation="visible"

-- Check for CSS classes
LET is_selected = DOM_QUERY selector="#item1" operation="has_class" class="selected"
LET is_loading = DOM_QUERY selector=".spinner" operation="has_class" class="active"
```

### Content and Value Extraction
```rexx
-- Get text content
LET title_text = DOM_QUERY selector="#page-title" operation="text"
LET error_message = DOM_QUERY selector=".error" operation="text"

-- Get input/select values
LET user_name = DOM_QUERY selector="#username" operation="value"
LET selected_country = DOM_QUERY selector="#country-select" operation="value"

-- Get element attributes
LET element_id = DOM_QUERY selector=".main-content" operation="id"
LET element_name = DOM_QUERY selector="input[type='text']" operation="name"
LET css_classes = DOM_QUERY selector="#container" operation="class"

-- Get custom attributes
LET data_id = DOM_QUERY selector=".product" operation="attribute" attribute="data-product-id"
LET aria_label = DOM_QUERY selector="button" operation="attribute" attribute="aria-label"
```

### Form Serialization
```rexx
-- Serialize form data to JSON string
LET form_data = DOM_QUERY selector="#registration-form" operation="serialize"
-- Returns: {"name":"John","email":"john@example.com","country":"US"}
```

## DOM Manipulation Functions

### DOM_CLICK - Element Interaction
```rexx
-- Basic clicking
DOM_CLICK selector="#submit-button"
DOM_CLICK selector=".menu-item:first-child"

-- Click with validation
LET button_exists = DOM_QUERY selector="#save-btn" operation="exists"
IF button_exists THEN
    DOM_CLICK selector="#save-btn"
ENDIF
```

### DOM_TYPE - Text Input
```rexx
-- Basic text input
DOM_TYPE selector="#username" text="john_doe"
DOM_TYPE selector="#password" text="secret123"

-- Clear and type
DOM_TYPE selector="#search-box" text=""  -- Clear field
DOM_TYPE selector="#search-box" text="new search term"

-- Dynamic text input
LET user_email = "user@domain.com"
DOM_TYPE selector="#email-input" text=user_email
```

### DOM_SELECT_OPTION - Dropdown Selection
```rexx
-- Select by value
DOM_SELECT_OPTION selector="#country-select" value="US"
DOM_SELECT_OPTION selector="#language" value="en"

-- Dynamic selection
LET preferred_country = "CA"
DOM_SELECT_OPTION selector="#shipping-country" value=preferred_country
```

### DOM_SET - Property Assignment
```rexx
-- Set element properties
DOM_SET selector="#progress-bar" property="value" value="75"
DOM_SET selector="#status-text" property="textContent" value="Processing..."

-- Set custom properties
DOM_SET selector="#player" property="currentTime" value="30"
```

## CSS Manipulation Functions

### DOM_ADD_CLASS / DOM_REMOVE_CLASS - Class Management
```rexx
-- Add classes
DOM_ADD_CLASS selector=".menu-item" class="active"
DOM_ADD_CLASS selector="#notification" class="visible"

-- Remove classes  
DOM_REMOVE_CLASS selector=".old-item" class="highlighted"
DOM_REMOVE_CLASS selector="#modal" class="hidden"

-- Conditional class management
LET is_valid = DOM_QUERY selector="#form" operation="attribute" attribute="data-valid"
IF is_valid = "true" THEN
    DOM_ADD_CLASS selector="#form" class="success"
    DOM_REMOVE_CLASS selector="#form" class="error"
ELSE
    DOM_ADD_CLASS selector="#form" class="error"
    DOM_REMOVE_CLASS selector="#form" class="success"
ENDIF
```

### DOM_SET_STYLE - Direct Style Manipulation
```rexx
-- Basic styling
DOM_SET_STYLE selector="#popup" property="display" value="block"
DOM_SET_STYLE selector=".highlight" property="backgroundColor" value="yellow"

-- Dynamic styling
LET progress_width = "75%"
DOM_SET_STYLE selector="#progress-fill" property="width" value=progress_width

-- Hide/show elements
DOM_SET_STYLE selector="#loading-spinner" property="display" value="none"
DOM_SET_STYLE selector="#content" property="opacity" value="1"
```

## Timing and Waiting Functions

### DOM_WAIT_FOR - Element Waiting
```rexx
-- Wait for element with default 5-second timeout
LET success = DOM_WAIT_FOR selector=".success-message"
IF success THEN
    SAY "Success message appeared"
ELSE
    SAY "Timeout - success message never appeared"
ENDIF

-- Wait with custom timeout (10 seconds)
LET modal_appeared = DOM_WAIT_FOR selector="#confirmation-modal" timeout=10000
```

### DOM_WAIT - Simple Delays
```rexx
-- Wait 1 second (default)
DOM_WAIT milliseconds=1000

-- Wait specific duration
DOM_WAIT milliseconds=2000  -- 2 seconds
DOM_WAIT milliseconds=500   -- 0.5 seconds

-- Use in automation sequences
DOM_CLICK selector="#load-data-btn"
DOM_WAIT milliseconds=1000
LET data_loaded = DOM_QUERY selector=".data-table" operation="visible"
```

## Advanced Automation Patterns

### Form Automation Workflow
```rexx
-- Complete form filling and submission
SAY "Starting registration form automation..."

-- Fill form fields
DOM_TYPE selector="#firstName" text="John"
DOM_TYPE selector="#lastName" text="Doe"
DOM_TYPE selector="#email" text="john.doe@example.com"
DOM_SELECT_OPTION selector="#country" value="US"

-- Handle checkboxes
DOM_CLICK selector="#terms-checkbox"
DOM_CLICK selector="#newsletter-checkbox"

-- Validate before submit
LET email_valid = DOM_QUERY selector="#email" operation="attribute" attribute="data-valid"
LET terms_checked = DOM_QUERY selector="#terms-checkbox" operation="attribute" attribute="checked"

IF email_valid = "true" AND terms_checked THEN
    DOM_CLICK selector="#submit-button"
    
    -- Wait for success or error
    LET success_shown = DOM_WAIT_FOR selector=".success-message" timeout=5000
    IF success_shown THEN
        LET success_text = DOM_QUERY selector=".success-message" operation="text"
        SAY "Registration successful: " || success_text
    ELSE
        LET error_shown = DOM_QUERY selector=".error-message" operation="exists"
        IF error_shown THEN
            LET error_text = DOM_QUERY selector=".error-message" operation="text"
            SAY "Registration failed: " || error_text
        ELSE
            SAY "Registration status unknown - timeout"
        ENDIF
    ENDIF
ELSE
    SAY "Form validation failed - cannot submit"
ENDIF
```

### Bulk Element Processing
```rexx
-- Process multiple similar elements
LET todo_count = DOM_QUERY selector=".todo-item" operation="count"
SAY "Found " || todo_count || " todo items to process"

DO i = 1 TO todo_count
    LET item_selector = ".todo-item:nth-child(" || i || ")"
    
    -- Check if item is already completed
    LET is_completed = DOM_QUERY selector=item_selector operation="has_class" class="completed"
    
    IF is_completed = false THEN
        -- Get the todo text
        LET todo_text = DOM_QUERY selector=item_selector || " .todo-text" operation="text"
        SAY "Completing todo: " || todo_text
        
        -- Mark as complete
        DOM_CLICK selector=item_selector || " .todo-checkbox"
        DOM_ADD_CLASS selector=item_selector class="completed"
        
        -- Add visual feedback
        DOM_SET_STYLE selector=item_selector property="opacity" value="0.7"
        
        -- Brief pause between items
        DOM_WAIT milliseconds=200
    ENDIF
END

SAY "Todo list processing complete"
```

### Data Extraction and Analysis
```rexx
-- Extract information from web pages
LET product_count = DOM_QUERY selector=".product-card" operation="count"
SAY "Analyzing " || product_count || " products..."

LET total_price = 0
LET sale_count = 0

DO i = 1 TO product_count
    LET product_selector = ".product-card:nth-child(" || i || ")"
    
    -- Extract product details
    LET name = DOM_QUERY selector=product_selector || " .product-name" operation="text"
    LET price_text = DOM_QUERY selector=product_selector || " .product-price" operation="text"
    LET is_on_sale = DOM_QUERY selector=product_selector operation="has_class" class="on-sale"
    
    -- Parse price (assuming format like "$29.99")
    LET price = SUBSTRING string=price_text start=2  -- Remove $ sign
    LET total_price = total_price + price
    
    IF is_on_sale THEN
        LET sale_count = sale_count + 1
        SAY "SALE: " || name || " - " || price_text
    ENDIF
END

LET average_price = total_price / product_count
SAY "Analysis complete:"
SAY "Total products: " || product_count
SAY "Products on sale: " || sale_count
SAY "Average price: $" || average_price
```

### Conditional UI Navigation
```rexx
-- Make decisions based on current page state
LET menu_visible = DOM_QUERY selector="#mobile-menu" operation="visible"
LET is_mobile = DOM_QUERY selector="body" operation="has_class" class="mobile-view"

IF is_mobile AND menu_visible = false THEN
    -- Open mobile menu
    DOM_CLICK selector="#menu-toggle"
    DOM_WAIT_FOR selector="#mobile-menu"
    SAY "Mobile menu opened"
ENDIF

-- Navigate based on current page
LET current_page = DOM_QUERY selector="body" operation="attribute" attribute="data-page"

SELECT
    WHEN current_page = "home" THEN
        DOM_CLICK selector="#about-link"
        SAY "Navigating to about page"
    WHEN current_page = "about" THEN  
        DOM_CLICK selector="#contact-link"
        SAY "Navigating to contact page"
    OTHERWISE
        DOM_CLICK selector="#home-link"
        SAY "Returning to home page"
END
```

## Enhanced Error Handling

DOM functions integrate with Rexx error handling and provide enhanced error context including full JavaScript stack traces.

### Enhanced Error Context Functions

When `SIGNAL ON ERROR` is active, these functions provide detailed error information:

- **`ERROR_LINE`** - Line number where the error occurred
- **`ERROR_MESSAGE`** - Full error message
- **`ERROR_STACK`** - Complete JavaScript stack trace
- **`ERROR_FUNCTION`** - Name of the function that failed
- **`ERROR_COMMAND`** - Full Rexx command that caused the error
- **`ERROR_VARIABLES`** - JSON snapshot of all variables at error time
- **`ERROR_TIMESTAMP`** - ISO timestamp when error occurred
- **`ERROR_DETAILS`** - Summary object with key error information

### Comprehensive Error Handling Example
```rexx
-- Enhanced error handling with full context
SIGNAL ON ERROR NAME DetailedErrorHandler
LET username = "testuser"
LET attempt = 1

-- This will fail if element doesn't exist
DOM_CLICK selector="#nonexistent-button"

EXIT

DetailedErrorHandler:
-- Capture all available error information
LET error_line = ERROR_LINE
LET error_message = ERROR_MESSAGE
LET error_function = ERROR_FUNCTION
LET error_command = ERROR_COMMAND
LET error_variables = ERROR_VARIABLES
LET js_stack_trace = ERROR_STACK
LET error_time = ERROR_TIMESTAMP

-- Parse the captured variables to access them
LET vars_obj = JSON_PARSE text=error_variables
LET failed_username = ARRAY_GET array=vars_obj key="username"
LET failed_attempt = ARRAY_GET array=vars_obj key="attempt"

-- Log comprehensive error information
SAY "=== ERROR DETAILS ==="
SAY "Line: " || error_line
SAY "Function: " || error_function
SAY "Message: " || error_message
SAY "Command: " || error_command
SAY "Time: " || error_time
SAY "Variables at error:"
SAY "  username: " || failed_username
SAY "  attempt: " || failed_attempt
SAY ""
SAY "JavaScript Stack Trace:"
SAY error_stack

-- Implement recovery logic based on error details
IF error_function = "DOM_CLICK" THEN
    SAY "Click failed - trying alternative approach"
    -- Look for similar elements
    LET alt_buttons = DOM_QUERY selector="button" operation="count"
    IF alt_buttons > 0 THEN
        DOM_CLICK selector="button:first-child"
        SAY "Clicked first available button instead"
    ENDIF
ENDIF
```

### Robust DOM Automation with Fallbacks
```rexx
SIGNAL ON ERROR NAME DOMErrorHandler

-- Attempt DOM operations
LET element_exists = DOM_QUERY selector="#target-element" operation="exists"
IF element_exists THEN
    DOM_CLICK selector="#target-element"
    DOM_TYPE selector="#input-field" text="test data"
    
    -- Wait for result
    LET success = DOM_WAIT_FOR selector=".result" timeout=3000
    IF success THEN
        SAY "Operation completed successfully"
    ELSE
        -- This might throw an error if element doesn't exist
        LET result_text = DOM_QUERY selector=".result" operation="text"
    ENDIF
ENDIF

EXIT

DOMErrorHandler:
SAY "DOM operation failed - continuing with fallback approach"
-- Implement fallback logic here
LET fallback_element = DOM_QUERY selector=".alternative-element" operation="exists"
IF fallback_element THEN
    DOM_CLICK selector=".alternative-element"
ENDIF
```

## Automated Testing with DOM Functions

### Web Application Test Automation
```rexx
-- Comprehensive test automation
SAY "Starting automated tests..."

-- Test 1: Login functionality
SAY "Test 1: User login"
DOM_TYPE selector="#username" text="testuser"
DOM_TYPE selector="#password" text="testpass"
DOM_CLICK selector="#login-button"

LET login_success = DOM_WAIT_FOR selector=".dashboard" timeout=5000
IF login_success THEN
    SAY "✅ Login test PASSED"
ELSE
    LET error_shown = DOM_QUERY selector=".login-error" operation="visible"
    IF error_shown THEN
        LET error_msg = DOM_QUERY selector=".login-error" operation="text"
        SAY "❌ Login test FAILED: " || error_msg
    ELSE
        SAY "❌ Login test FAILED: Timeout"
    ENDIF
ENDIF

-- Test 2: Navigation
SAY "Test 2: Navigation menu"
DOM_CLICK selector="#products-menu"
LET products_page = DOM_WAIT_FOR selector=".products-grid" timeout=3000
IF products_page THEN
    LET product_count = DOM_QUERY selector=".product-item" operation="count"
    IF product_count > 0 THEN
        SAY "✅ Navigation test PASSED - Found " || product_count || " products"
    ELSE
        SAY "❌ Navigation test FAILED - No products found"
    ENDIF
ELSE
    SAY "❌ Navigation test FAILED - Products page did not load"
ENDIF

-- Test 3: Search functionality
SAY "Test 3: Search feature"
DOM_TYPE selector="#search-input" text="laptop"
DOM_CLICK selector="#search-button"
DOM_WAIT milliseconds=1000

LET search_results = DOM_QUERY selector=".search-results .result-item" operation="count"
IF search_results > 0 THEN
    SAY "✅ Search test PASSED - Found " || search_results || " results"
ELSE
    SAY "❌ Search test FAILED - No search results"
ENDIF

SAY "Test automation completed"
```

## Best Practices

### 1. Always Check Element Existence
```rexx
-- Good: Check before interacting
LET button_exists = DOM_QUERY selector="#submit-btn" operation="exists"
IF button_exists THEN
    DOM_CLICK selector="#submit-btn"
ENDIF

-- Avoid: Direct interaction without checking
-- DOM_CLICK selector="#submit-btn"  -- May fail if element doesn't exist
```

### 2. Use Appropriate Waiting Strategies
```rexx
-- Good: Wait for dynamic content
DOM_CLICK selector="#load-data"
LET data_loaded = DOM_WAIT_FOR selector=".data-table" timeout=10000
IF data_loaded THEN
    -- Process data
ENDIF

-- Good: Simple delays for animations
DOM_CLICK selector="#menu-toggle"
DOM_WAIT milliseconds=300  -- Allow animation to complete
```

### 3. Handle Different Screen Sizes and States
```rexx
-- Responsive design handling
LET is_mobile = DOM_QUERY selector="body" operation="has_class" class="mobile"
IF is_mobile THEN
    DOM_CLICK selector="#mobile-menu-toggle"
    DOM_WAIT_FOR selector="#mobile-nav"
    DOM_CLICK selector="#mobile-nav .about-link"
ELSE
    DOM_CLICK selector="#desktop-nav .about-link"
ENDIF
```

### 4. Provide Clear Logging and Feedback
```rexx
-- Good: Descriptive logging
SAY "Starting form submission process..."
DOM_TYPE selector="#email" text="user@example.com"
SAY "Email entered successfully"

DOM_CLICK selector="#submit"
SAY "Submit button clicked, waiting for response..."

LET success = DOM_WAIT_FOR selector=".success-message" timeout=5000
IF success THEN
    SAY "Form submitted successfully"
ELSE
    SAY "Form submission failed or timed out"
ENDIF
```

### 5. Use Error Handling for Robust Automation
```rexx
SIGNAL ON ERROR NAME HandleDOMError

-- Your DOM automation code here
LET count = DOM_QUERY selector=".items" operation="count"
DO i = 1 TO count
    DOM_CLICK selector=".item:nth-child(" || i || ")"
    DOM_WAIT milliseconds=100
END

EXIT

HandleDOMError:
SAY "DOM operation failed, attempting recovery..."
-- Implement recovery logic
SIGNAL OFF ERROR  -- Continue without error handling if needed
```

## Integration with Other Rexx Features

DOM functions work seamlessly with all other Rexx language features:

### With Variables and Expressions
```rexx
LET base_selector = "#form"
LET field_number = 3
LET dynamic_selector = base_selector || " input:nth-child(" || field_number || ")"
DOM_TYPE selector=dynamic_selector text="Dynamic input"
```

### With Control Flow
```rexx
LET error_count = DOM_QUERY selector=".error" operation="count"
IF error_count > 0 THEN
    SAY "Found " || error_count || " errors to fix"
    DO i = 1 TO error_count
        LET error_selector = ".error:nth-child(" || i || ")"
        LET error_text = DOM_QUERY selector=error_selector operation="text"
        SAY "Error " || i || ": " || error_text
    END
ENDIF
```

### With Built-in Functions
```rexx
LET timestamp = NOW
LET log_entry = "Page loaded at: " || timestamp
DOM_TYPE selector="#log-input" text=log_entry

LET form_data = DOM_QUERY selector="#form" operation="serialize"
LET data_obj = JSON_PARSE text=form_data
-- Process parsed form data
```

## Function Reference

### Query Operations
- `DOM_QUERY selector="..." operation="count"` - Count matching elements
- `DOM_QUERY selector="..." operation="exists"` - Check if element exists
- `DOM_QUERY selector="..." operation="visible"` - Check if element is visible
- `DOM_QUERY selector="..." operation="text"` - Get text content
- `DOM_QUERY selector="..." operation="value"` - Get input/select value
- `DOM_QUERY selector="..." operation="attribute" attribute="..."` - Get attribute value
- `DOM_QUERY selector="..." operation="has_class" class="..."` - Check for CSS class
- `DOM_QUERY selector="..." operation="serialize"` - Serialize form to JSON

### Interaction Functions
- `DOM_CLICK selector="..."` - Click element
- `DOM_TYPE selector="..." text="..."` - Type text into input
- `DOM_SELECT_OPTION selector="..." value="..."` - Select dropdown option
- `DOM_SET selector="..." property="..." value="..."` - Set element property

### Style Functions
- `DOM_ADD_CLASS selector="..." class="..."` - Add CSS class
- `DOM_REMOVE_CLASS selector="..." class="..."` - Remove CSS class
- `DOM_SET_STYLE selector="..." property="..." value="..."` - Set CSS style

### Timing Functions
- `DOM_WAIT_FOR selector="..." timeout=...` - Wait for element to appear
- `DOM_WAIT milliseconds=...` - Simple delay

### Error Context Functions (when SIGNAL ON ERROR is active)
- `ERROR_LINE` - Line number of error
- `ERROR_MESSAGE` - Error message
- `ERROR_STACK` - JavaScript stack trace
- `ERROR_FUNCTION` - Function that failed
- `ERROR_COMMAND` - Rexx command that caused error
- `ERROR_VARIABLES` - JSON snapshot of variables
- `ERROR_TIMESTAMP` - When error occurred

**See also:**
- [Control Flow](02-control-flow.md) for loops and conditionals in automation
- [String Functions](04-string-functions.md) for processing extracted text
- [JSON Functions](08-json-functions.md) for handling form serialization
- [Array Functions](06-array-functions.md) for processing multiple elements