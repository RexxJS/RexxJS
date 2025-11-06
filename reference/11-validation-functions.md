# Validation Functions

Comprehensive data validation functions for input validation, data integrity checking, and format verification in automation workflows.

## Data Type Identification

### DATATYPE Function

Identify the REXX-style data type of any JavaScript value, with full support for native object types.

```rexx
-- Get data type
LET type = DATATYPE value
LET isType = DATATYPE value, expectedType

-- Examples with different types
LET arrayType = DATATYPE [1, 2, 3]           -- "ARRAY"
LET numberType = DATATYPE 42                 -- "NUM"
LET stringType = DATATYPE "hello"            -- "CHAR" 
LET objectType = DATATYPE {"key": "value"}   -- "OBJECT"
LET boolType = DATATYPE true                 -- "BOOL"
LET nullType = DATATYPE null                 -- "NULL"

-- Type checking (returns boolean)
LET isArray = DATATYPE myVar, "ARRAY"        -- true/false
LET isNumber = DATATYPE value, "NUM"         -- true/false
```

#### Supported Data Types

| Type | JavaScript Value | REXX Type | Description |
|------|-----------------|-----------|-------------|
| `ARRAY` | `[1, 2, 3]` | ARRAY | JavaScript arrays |
| `NUM` | `42`, `3.14` | NUM | Numbers (integer/float) |  
| `CHAR` | `"hello"` | CHAR | String values |
| `OBJECT` | `{key: value}` | OBJECT | JavaScript objects |
| `BOOL` | `true`, `false` | BOOL | Boolean values |
| `NULL` | `null`, `undefined` | NULL | Null/undefined values |
| `FUNCTION` | `function() {}` | FUNCTION | Function objects |
| `UNKNOWN` | Other | UNKNOWN | Unrecognized types |

#### Integration with Native Object Preservation

The DATATYPE function is essential when working with external REXX scripts and native object preservation:

```rexx
-- Main script
LET data = [10, 20, 30]
CALL processor.rexx data

-- In processor.rexx:
PARSE ARG received_param
IF DATATYPE(received_param) = "ARRAY" THEN DO
    SAY "Received array with " || LENGTH(received_param) || " elements"
    LET first = ARRAY_GET(received_param, 1)
    SAY "First element: " || first
END
ELSE DO
    SAY "Expected array, got: " || DATATYPE(received_param)
END
```

## Email and Web Validation

### Email Address Validation
```rexx
-- Basic email validation
LET emailValid = IS_EMAIL email="user@example.com"
LET invalidEmail = IS_EMAIL email="invalid-email"

SAY "Valid email: " || emailValid      -- true
SAY "Invalid email: " || invalidEmail  -- false

-- Real-world examples
LET corporateEmail = IS_EMAIL email="john.doe@company.com"
LET personalEmail = IS_EMAIL email="alice123@gmail.com"
LET complexEmail = IS_EMAIL email="test.email+filter@sub.domain.org"

SAY "Corporate email valid: " || corporateEmail
SAY "Personal email valid: " || personalEmail
SAY "Complex email valid: " || complexEmail
```

### URL Validation
```rexx
-- URL format validation
LET urlValid = IS_URL url="https://api.example.com"
LET httpUrl = IS_URL url="http://localhost:8080/path"
LET invalidUrl = IS_URL url="not-a-url"

SAY "HTTPS URL valid: " || urlValid     -- true
SAY "HTTP URL valid: " || httpUrl       -- true
SAY "Invalid URL: " || invalidUrl       -- false

-- API endpoint validation
LET apiUrl = IS_URL url="https://api.example.com/v1/users?page=2"
LET localApi = IS_URL url="http://127.0.0.1:3000/api/data"

SAY "API URL valid: " || apiUrl
SAY "Local API valid: " || localApi
```

## Phone Number Validation

### International Phone Number Support
```rexx
-- Phone validation by country/region
LET phoneUS = IS_PHONE phone="(555) 123-4567" format="US"
LET phoneUK = IS_PHONE phone="+44 20 1234 5678" format="UK"
LET phoneDE = IS_PHONE phone="+49 30 12345678" format="DE"
LET phoneFR = IS_PHONE phone="+33 1 23 45 67 89" format="FR"

SAY "US phone valid: " || phoneUS
SAY "UK phone valid: " || phoneUK
SAY "German phone valid: " || phoneDE
SAY "French phone valid: " || phoneFR

-- More international formats
LET phoneIN = IS_PHONE phone="+91 98765 43210" format="IN"    -- India
LET phoneJP = IS_PHONE phone="+81 90 1234 5678" format="JP"   -- Japan
LET phoneCN = IS_PHONE phone="+86 138 0013 8000" format="CN"  -- China
LET phoneAU = IS_PHONE phone="+61 2 1234 5678" format="AU"    -- Australia
LET phoneBR = IS_PHONE phone="+55 11 98765-4321" format="BR"  -- Brazil
LET phoneCA = IS_PHONE phone="+1 (416) 123-4567" format="CA"  -- Canada

SAY "Indian phone valid: " || phoneIN
SAY "Japanese phone valid: " || phoneJP
SAY "Chinese phone valid: " || phoneCN
```

### Flexible Phone Validation
```rexx
-- International and generic format support
LET phoneIntl = IS_PHONE phone="+1-555-123-4567" format="international"
LET phoneAny = IS_PHONE phone="5551234567"  -- No format specified

SAY "International format: " || phoneIntl
SAY "Generic format: " || phoneAny

-- Various US phone formats
LET phoneStandard = IS_PHONE phone="555-123-4567" format="US"
LET phoneParens = IS_PHONE phone="(555) 123-4567" format="US"
LET phoneDots = IS_PHONE phone="555.123.4567" format="US"
LET phoneSpaces = IS_PHONE phone="555 123 4567" format="US"

SAY "US formats - Standard: " || phoneStandard
SAY "US formats - Parentheses: " || phoneParens
SAY "US formats - Dots: " || phoneDots
SAY "US formats - Spaces: " || phoneSpaces
```

## Numeric Validation

### Number and Range Validation
```rexx
-- Basic number validation
LET isNumber = IS_NUMBER value="42.5"
LET notNumber = IS_NUMBER value="abc"
LET negativeNumber = IS_NUMBER value="-123.45"

SAY "Is number (42.5): " || isNumber      -- true
SAY "Is number (abc): " || notNumber      -- false
SAY "Is number (-123.45): " || negativeNumber  -- true

-- Range validation
LET inRange = IS_NUMBER value="75" min="0" max="100"
LET outOfRange = IS_NUMBER value="150" min="0" max="100"
LET negativeRange = IS_NUMBER value="-5" min="-10" max="0"

SAY "In range 0-100 (75): " || inRange
SAY "Out of range 0-100 (150): " || outOfRange
SAY "In negative range -10 to 0 (-5): " || negativeRange
```

### Integer and Sign Validation
```rexx
-- Integer validation
LET isInteger = IS_INTEGER value="42"
LET notInteger = IS_INTEGER value="42.5"
LET negativeInt = IS_INTEGER value="-17"

SAY "Is integer (42): " || isInteger       -- true
SAY "Is integer (42.5): " || notInteger    -- false
SAY "Is integer (-17): " || negativeInt    -- true

-- Positive number validation
LET isPositive = IS_POSITIVE value="10.5"
LET isNegative = IS_POSITIVE value="-5.2"
LET isZero = IS_POSITIVE value="0"

SAY "Is positive (10.5): " || isPositive   -- true
SAY "Is positive (-5.2): " || isNegative   -- false
SAY "Is positive (0): " || isZero          -- false
```

## Date and Time Validation

### Date Format Validation
```rexx
-- Standard date validation
LET validDate = IS_DATE date="2024-03-15"
LET invalidDate = IS_DATE date="2024-13-45"
LET validDateTime = IS_DATE date="2024-03-15T14:30:00"

SAY "Valid date: " || validDate           -- true
SAY "Invalid date: " || invalidDate       -- false
SAY "Valid datetime: " || validDateTime   -- true

-- Different date formats
LET isoDate = IS_DATE date="2024-08-29"
LET usDate = IS_DATE date="08/29/2024"     -- May not be supported
LET europeanDate = IS_DATE date="29/08/2024"  -- May not be supported

SAY "ISO date valid: " || isoDate
-- Note: Non-ISO formats may require parsing first
```

### Time Format Validation
```rexx
-- Time validation
LET validTime = IS_TIME time="14:30:00"
LET validTimeShort = IS_TIME time="14:30"
LET invalidTime = IS_TIME time="25:70:99"

SAY "Valid time (14:30:00): " || validTime       -- true
SAY "Valid time (14:30): " || validTimeShort     -- true
SAY "Invalid time (25:70:99): " || invalidTime   -- false

-- 12-hour format (may require conversion)
LET time12Hour = "2:30 PM"
-- Convert to 24-hour format for validation if needed
LET converted24Hour = "14:30:00"
LET time12Valid = IS_TIME time=converted24Hour

SAY "12-hour converted: " || time12Valid
```

## Financial Validation

### Credit Card Validation
```rexx
-- Credit card validation (Luhn algorithm)
LET visaValid = IS_CREDIT_CARD cardNumber="4532015112830366"
LET mastercardValid = IS_CREDIT_CARD cardNumber="5555555555554444"
LET invalidCard = IS_CREDIT_CARD cardNumber="1234567890123456"

SAY "Visa card valid: " || visaValid           -- true
SAY "Mastercard valid: " || mastercardValid    -- true  
SAY "Invalid card: " || invalidCard            -- false

-- Cards with formatting
LET cardWithSpaces = IS_CREDIT_CARD cardNumber="4532 0151 1283 0366"
LET cardWithDashes = IS_CREDIT_CARD cardNumber="4532-0151-1283-0366"

SAY "Card with spaces: " || cardWithSpaces     -- true
SAY "Card with dashes: " || cardWithDashes     -- true
```

## Geographic and Postal Validation

### Postal Code Validation
```rexx
-- Postal codes by country
LET usZip = IS_POSTAL_CODE code="12345" country="US"
LET usZipPlus4 = IS_POSTAL_CODE code="12345-6789" country="US"
LET ukPostcode = IS_POSTAL_CODE code="SW1A 1AA" country="UK"
LET canadianPostal = IS_POSTAL_CODE code="K1A 0A6" country="CA"

SAY "US ZIP valid: " || usZip               -- true
SAY "US ZIP+4 valid: " || usZipPlus4        -- true
SAY "UK postcode valid: " || ukPostcode     -- true
SAY "Canadian postal valid: " || canadianPostal  -- true

-- Invalid postal codes
LET invalidUS = IS_POSTAL_CODE code="1234" country="US"       -- Too short
LET invalidUK = IS_POSTAL_CODE code="INVALID" country="UK"    -- Wrong format

SAY "Invalid US ZIP: " || invalidUS         -- false
SAY "Invalid UK postcode: " || invalidUK    -- false
```

## Network Address Validation

### IP Address Validation
```rexx
-- IPv4 validation
LET ipv4Valid = IS_IP ip="192.168.1.1"
LET ipv4Invalid = IS_IP ip="300.400.500.600"
LET ipv4Local = IS_IP ip="127.0.0.1"

SAY "Valid IPv4: " || ipv4Valid       -- true
SAY "Invalid IPv4: " || ipv4Invalid   -- false
SAY "Localhost IPv4: " || ipv4Local   -- true

-- IPv6 validation
LET ipv6Valid = IS_IP ip="2001:db8::1"
LET ipv6Localhost = IS_IP ip="::1"
LET ipv6Invalid = IS_IP ip="invalid::address"

SAY "Valid IPv6: " || ipv6Valid       -- true
SAY "IPv6 localhost: " || ipv6Localhost  -- true
SAY "Invalid IPv6: " || ipv6Invalid   -- false
```

### MAC Address Validation
```rexx
-- MAC address validation (multiple formats)
LET macValid = IS_MAC_ADDRESS mac="00:1B:44:11:3A:B7"
LET macDashes = IS_MAC_ADDRESS mac="00-1B-44-11-3A-B7"
LET macDots = IS_MAC_ADDRESS mac="001b.4411.3ab7"
LET macInvalid = IS_MAC_ADDRESS mac="invalid-mac"

SAY "MAC with colons: " || macValid      -- true
SAY "MAC with dashes: " || macDashes     -- true
SAY "MAC with dots: " || macDots         -- true
SAY "Invalid MAC: " || macInvalid        -- false
```

## String Content Validation

### Character Set Validation
```rexx
-- String content validation
LET isAlpha = IS_ALPHA text="HelloWorld"
LET isNumeric = IS_NUMERIC text="12345"
LET isAlphaNum = IS_ALPHANUMERIC text="Hello123"

SAY "Is alphabetic: " || isAlpha        -- true
SAY "Is numeric: " || isNumeric         -- true
SAY "Is alphanumeric: " || isAlphaNum   -- true

-- Case validation
LET isLowercase = IS_LOWERCASE text="hello world"
LET isUppercase = IS_UPPERCASE text="HELLO WORLD"
LET isMixedCase = IS_LOWERCASE text="Hello World"

SAY "Is lowercase: " || isLowercase     -- true
SAY "Is uppercase: " || isUppercase     -- true
SAY "Mixed case (lowercase check): " || isMixedCase  -- false
```

### Pattern Matching
```rexx
-- Regular expression pattern matching
LET matchesPattern = MATCHES_PATTERN text="abc123" pattern="^[a-z]+[0-9]+$"
LET phonePattern = MATCHES_PATTERN text="555-1234" pattern="[0-9]{3}-[0-9]{4}"
LET emailPattern = MATCHES_PATTERN text="user@domain.com" pattern="^[^@]+@[^@]+\\.[^@]+$"

SAY "Matches alpha+numeric pattern: " || matchesPattern  -- true
SAY "Matches phone pattern: " || phonePattern            -- true
SAY "Matches email pattern: " || emailPattern            -- true

-- Custom validation patterns
LET passwordStrong = MATCHES_PATTERN text="MyP@ssw0rd!" pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$"
LET socialSecurity = MATCHES_PATTERN text="123-45-6789" pattern="^[0-9]{3}-[0-9]{2}-[0-9]{4}$"

SAY "Strong password: " || passwordStrong
SAY "SSN format: " || socialSecurity
```

## Empty Value Validation

### Null and Empty Checks
```rexx
-- Empty value validation
LET isEmpty = IS_EMPTY value=""
LET isNotEmpty = IS_NOT_EMPTY value="data"
LET isWhitespace = IS_EMPTY value="   "   -- May treat as empty or not

SAY "Empty string: " || isEmpty             -- true
SAY "Has data: " || isNotEmpty              -- true
SAY "Whitespace: " || isWhitespace          -- depends on implementation

-- Validation for form fields
LET nameField = ""
LET emailField = "user@example.com"
LET phoneField = "   "

LET nameValid = IS_NOT_EMPTY value=nameField
LET emailValid = IS_NOT_EMPTY value=emailField
LET phoneValid = IS_NOT_EMPTY value=phoneField

SAY "Name field valid: " || nameValid       -- false
SAY "Email field valid: " || emailValid     -- true  
SAY "Phone field valid: " || phoneValid     -- depends on whitespace handling
```

## Practical Validation Examples

### Form Validation Pipeline
```rexx
-- Complete form validation
LET userInput = "john.doe@company.com"
LET phoneInput = "555-123-4567"
LET ageInput = "25"
LET zipInput = "12345"

SAY "Starting form validation..."

IF IS_EMAIL email=userInput THEN
  SAY "✅ Valid email format"
  
  IF IS_PHONE phone=phoneInput format="US" THEN
    SAY "✅ Valid US phone number"
    
    IF IS_NUMBER value=ageInput min="18" max="65" THEN
      SAY "✅ Valid age for employment"
      
      IF IS_POSTAL_CODE code=zipInput country="US" THEN
        SAY "✅ Valid US postal code"
        SAY "🎉 All validation passed - proceeding with form submission"
        
        -- Proceed with form processing
        ADDRESS api
        submitForm email=userInput phone=phoneInput age=ageInput zip=zipInput
      ELSE
        SAY "❌ Invalid postal code"
      ENDIF
    ELSE
      SAY "❌ Age must be between 18 and 65"
    ENDIF
  ELSE  
    SAY "❌ Invalid phone number format"
  ENDIF
ELSE
  SAY "❌ Invalid email format"
ENDIF
```

### Data Validation Pipeline
```rexx
-- JSON data validation
LET userData = '{"email":"test@example.com","phone":"555-1234","age":"30","zip":"12345"}'
LET dataValid = true

-- Parse JSON first
LET userObj = JSON_PARSE text=userData

-- Extract and validate each field
LET emailField = userObj.email
LET phoneField = userObj.phone
LET ageField = userObj.age
LET zipField = userObj.zip

SAY "Validating user data..."

IF NOT IS_EMAIL email=emailField THEN
  SAY "❌ Invalid email in data: " || emailField
  LET dataValid = false
ENDIF

IF NOT IS_PHONE phone=phoneField THEN
  SAY "❌ Invalid phone in data: " || phoneField
  LET dataValid = false
ENDIF

IF NOT IS_NUMBER value=ageField min="0" max="120" THEN
  SAY "❌ Invalid age in data: " || ageField
  LET dataValid = false
ENDIF

IF NOT IS_POSTAL_CODE code=zipField country="US" THEN
  SAY "❌ Invalid ZIP code in data: " || zipField
  LET dataValid = false
ENDIF

IF dataValid THEN
  SAY "✅ All data validation passed"
  -- Process the validated data
ELSE
  SAY "❌ Data validation failed - cannot proceed"
ENDIF
```

### Batch Validation Processing
```rexx
-- Validate multiple records
LET records = '["user1@test.com", "invalid-email", "user2@test.com", "another-invalid"]'
LET recordArray = JSON_PARSE text=records
LET recordCount = ARRAY_LENGTH array=recordArray

LET validCount = 0
LET invalidCount = 0

SAY "Validating " || recordCount || " email records..."

DO i = 0 TO recordCount - 1
  LET email = ARRAY_GET array=recordArray index=i
  
  IF IS_EMAIL email=email THEN
    LET validCount = validCount + 1
    SAY "✅ Valid: " || email
  ELSE
    LET invalidCount = invalidCount + 1
    SAY "❌ Invalid: " || email
  ENDIF
END

SAY ""
SAY "Batch validation complete:"
SAY "  Valid records: " || validCount
SAY "  Invalid records: " || invalidCount
SAY "  Success rate: " || MATH_ROUND(value=(validCount * 100 / recordCount) precision=1) || "%"
```

### API Input Validation
```rexx
-- API request validation
LET apiRequest = '{"endpoint": "/users", "method": "POST", "data": {"email": "new@user.com", "phone": "+1-555-0123"}}'
LET request = JSON_PARSE text=apiRequest

SAY "Validating API request..."

-- Validate endpoint URL
LET fullUrl = "https://api.example.com" || request.endpoint
LET urlValid = IS_URL url=fullUrl

-- Validate request data
LET requestData = request.data
LET emailValid = IS_EMAIL email=requestData.email
LET phoneValid = IS_PHONE phone=requestData.phone format="US"

SAY "URL valid: " || urlValid
SAY "Email valid: " || emailValid  
SAY "Phone valid: " || phoneValid

IF urlValid AND emailValid AND phoneValid THEN
  SAY "✅ API request validation passed"
  -- Make the API call
ELSE
  SAY "❌ API request validation failed"
  -- Return error response
ENDIF
```

## Advanced Data Validation

### VALIDATE_SCHEMA - Comprehensive Data Schema Validation
Validates data structures against defined schemas with detailed constraint checking and error reporting.

**Usage:**
```rexx
-- Define a user data schema
LET userSchema = '{
  "name": {"type": "string", "required": true, "minLength": 2, "maxLength": 50},
  "email": {"type": "string", "required": true, "pattern": "^[^@]+@[^@]+\\.[^@]+$"},
  "age": {"type": "number", "required": true, "min": 18, "max": 120},
  "status": {"type": "string", "required": false, "enum": ["active", "inactive", "pending"]},
  "preferences": {"type": "object", "required": false}
}'

-- Validate user data
LET userData = '{
  "name": "John Doe",
  "email": "john@example.com", 
  "age": 30,
  "status": "active"
}'

LET result = VALIDATE_SCHEMA data=userData schema=userSchema

-- Check validation results
IF result.valid THEN
    SAY "✅ User data is valid"
    SAY "Valid fields: " || result.details.validFields || "/" || result.details.totalFields
ELSE
    SAY "❌ User data validation failed"
    
    -- Display validation errors
    LET errorCount = ARRAY_LENGTH array=result.errors
    DO i = 0 TO errorCount - 1
        LET error = ARRAY_GET array=result.errors index=i
        SAY "  Error: " || error
    END
ENDIF
```

**Parameters:**
- `data` - Data to validate (object, array, or JSON string)
- `schema` - Schema definition (object or JSON string)

**Schema Properties:**
- `type` - Expected data type ("string", "number", "boolean", "object", "array")
- `required` - Whether field is mandatory (true/false)
- `min`/`max` - Numeric range validation
- `minLength`/`maxLength` - String length validation
- `pattern` - Regular expression pattern for strings
- `enum` - Array of allowed values

**Returns:**
Object with validation results including `valid` (boolean), `errors` (array), and `details` (field counts).

### CHECK_TYPES - Dynamic Type Validation
Validates data types with support for union types and flexible type checking.

**Usage:**
```rexx
-- Single value type checking
LET stringValid = CHECK_TYPES data="hello" types="string"
LET numberValid = CHECK_TYPES data="42" types="number"
LET booleanValid = CHECK_TYPES data="true" types="boolean"

SAY "String validation: " || stringValid.valid    -- true
SAY "Number validation: " || numberValid.valid    -- true  
SAY "Boolean validation: " || booleanValid.valid  -- true

-- Union type validation (multiple allowed types)
LET flexibleData = "123"  -- Could be string or number
LET unionResult = CHECK_TYPES data=flexibleData types="string,number"
SAY "Union validation: " || unionResult.valid     -- true

-- Array element validation  
LET mixedArray = '[1, "hello", true, null]'
LET arrayResult = CHECK_TYPES data=mixedArray types="number,string,boolean"

IF arrayResult.valid THEN
    SAY "✅ All array elements have valid types"
ELSE
    SAY "❌ Type mismatches found:"
    LET mismatchCount = ARRAY_LENGTH array=arrayResult.mismatches
    DO i = 0 TO mismatchCount - 1
        LET mismatch = ARRAY_GET array=arrayResult.mismatches index=i
        SAY "  Index " || mismatch.index || ": expected " || JOIN(array=arrayResult.expectedTypes separator="|") || ", got " || mismatch.actualType
    END
ENDIF

-- Object property validation
LET dataObject = '{"name": "John", "age": 30, "active": true}'
LET objectResult = CHECK_TYPES data=dataObject types="string,number,boolean"

SAY "Object validation: " || objectResult.valid
SAY "Property types: " || JSON_STRINGIFY object=objectResult.details.propertyTypes
```

**Parameters:**
- `data` - Data to type-check (any type or JSON string)
- `types` - Expected types (string, array, or comma-separated list)

**Supported Types:**
- `"string"` - String values
- `"number"` - Numeric values (including numeric strings)
- `"boolean"` - Boolean values
- `"object"` - Object values
- `"array"` - Array values
- `"null"` - Null values
- `"any"` - Accept any type

**Returns:**
Object with validation results including `valid` (boolean), `actualType`, `expectedTypes`, `matches`, `mismatches`, and detailed analysis.

### Data Pipeline Validation Examples
```rexx
-- API request validation pipeline
LET apiData = '{
  "user": {"name": "Alice", "email": "alice@test.com", "age": 28},
  "action": "create_account",
  "timestamp": "2025-01-15T10:30:00Z"
}'

-- Define expected structure
LET apiSchema = '{
  "user": {"type": "object", "required": true},
  "action": {"type": "string", "required": true, "enum": ["create_account", "update_profile", "delete_account"]},
  "timestamp": {"type": "string", "required": true, "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$"}
}'

-- Validate overall structure
LET structureResult = VALIDATE_SCHEMA data=apiData schema=apiSchema

IF structureResult.valid THEN
    SAY "✅ API structure valid"
    
    -- Extract and validate user object
    LET parsedData = JSON_PARSE text=apiData
    LET userSchema = '{
      "name": {"type": "string", "required": true, "minLength": 2},
      "email": {"type": "string", "required": true, "pattern": "^[^@]+@[^@]+\\.[^@]+$"},
      "age": {"type": "number", "required": true, "min": 13, "max": 150}
    }'
    
    LET userResult = VALIDATE_SCHEMA data=parsedData.user schema=userSchema
    
    IF userResult.valid THEN
        SAY "✅ User data valid - processing request"
        -- Process the API request
    ELSE
        SAY "❌ User data invalid"
        -- Return user validation errors
    ENDIF
ELSE
    SAY "❌ API structure invalid"
    -- Return structure validation errors
ENDIF
```

## Function Reference

### Data Type Identification
- `DATATYPE(value)` - Get REXX-style data type of any value
- `DATATYPE(value, expectedType)` - Check if value matches expected type

### Email and Web
- `IS_EMAIL(email)` - Validate email address format
- `IS_URL(url)` - Validate URL format

### Phone Numbers
- `IS_PHONE(phone, format?)` - Validate phone numbers by country/format
- Supported formats: "US", "UK", "DE", "FR", "IN", "JP", "CN", "AU", "BR", "CA", "international"

### Numbers
- `IS_NUMBER(value, min?, max?)` - Validate numeric values with optional range
- `IS_INTEGER(value)` - Validate integer values
- `IS_POSITIVE(value)` - Validate positive numbers

### Date and Time  
- `IS_DATE(date)` - Validate date format
- `IS_TIME(time)` - Validate time format

### Financial
- `IS_CREDIT_CARD(cardNumber)` - Validate credit card using Luhn algorithm

### Geographic
- `IS_POSTAL_CODE(code, country)` - Validate postal codes by country
- Supported countries: "US", "UK", "CA" (and others)

### Network
- `IS_IP(ip)` - Validate IPv4 and IPv6 addresses
- `IS_MAC_ADDRESS(mac)` - Validate MAC addresses (multiple formats)

### String Content
- `IS_ALPHA(text)` - Check if text contains only alphabetic characters
- `IS_NUMERIC(text)` - Check if text contains only numeric characters
- `IS_ALPHANUMERIC(text)` - Check if text contains only alphanumeric characters
- `IS_LOWERCASE(text)` - Check if text is all lowercase
- `IS_UPPERCASE(text)` - Check if text is all uppercase

### Pattern Matching
- `MATCHES_PATTERN(text, pattern)` - Validate against regular expression patterns

### Empty Values
- `IS_EMPTY(value)` - Check if value is empty/null
- `IS_NOT_EMPTY(value)` - Check if value has content

### Advanced Validation
- `VALIDATE_SCHEMA(data, schema)` - Comprehensive data validation against defined schemas
- `CHECK_TYPES(data, types)` - Dynamic type checking with union type support

**See also:**
- [String Functions](04-string-functions.md) for string manipulation and regex
- [JSON Functions](08-json-functions.md) for validating JSON data
- [Math Functions](05-math-functions.md) for numeric validation helpers
- [Date/Time Functions](07-datetime-functions.md) for date validation details