# Web Functions

URL processing, encoding, and web integration capabilities for HTTP operations, API automation, and secure data transmission.

## URL Processing Functions

### URL Parsing
```rexx
-- Parse URLs into components
LET apiUrl = "https://api.example.com:8080/v1/users?page=2&limit=10#results"
LET urlParts = URL_PARSE url=apiUrl

-- Access URL components with dot notation
LET protocol = urlParts.protocol      -- "https:"
LET hostname = urlParts.hostname      -- "api.example.com"
LET port = urlParts.port             -- "8080"
LET pathname = urlParts.pathname      -- "/v1/users"
LET search = urlParts.search         -- "?page=2&limit=10"
LET hash = urlParts.hash             -- "#results"
LET host = urlParts.host             -- "api.example.com:8080"

SAY "Parsed URL components:"
SAY "  Protocol: " || protocol
SAY "  Hostname: " || hostname
SAY "  Port: " || port
SAY "  Path: " || pathname
SAY "  Query: " || search
SAY "  Fragment: " || hash
```

### URL Encoding and Decoding
```rexx
-- Encode strings for safe URL usage
LET searchTerm = "hello world & special chars"
LET encoded = URL_ENCODE string=searchTerm
-- Result: "hello%20world%20%26%20special%20chars"

-- Decode URL-encoded strings
LET decoded = URL_DECODE string=encoded
-- Result: "hello world & special chars"

-- Build dynamic URLs with proper encoding
LET baseUrl = "https://api.example.com"
LET endpoint = "/search"
LET query = "john doe & associates"
LET encodedQuery = URL_ENCODE string=query
LET searchUrl = baseUrl || endpoint || "?q=" || encodedQuery

SAY "Search URL: " || searchUrl
```

## Base64 Encoding Functions

### Basic Base64 Operations
```rexx
-- Encode text to base64
LET originalText = "Hello World!"
LET encoded = BASE64_ENCODE text=originalText
-- Result: "SGVsbG8gV29ybGQh"

-- Decode base64 back to text
LET decoded = BASE64_DECODE encoded=encoded
-- Result: "Hello World!"

-- Handle authentication credentials
LET username = "admin"
LET password = "secret123"
LET credentials = username || ":" || password
LET authHeader = BASE64_ENCODE text=credentials
LET basicAuth = "Basic " || authHeader

SAY "Authorization header: " || basicAuth
```

### URL-Safe Base64
```rexx
-- Create URL-safe base64 (no +, /, or = characters)
LET sensitiveData = "data+with/special=chars"
LET urlSafe = URL_SAFE_BASE64 text=sensitiveData
-- Returns base64 with - instead of +, _ instead of /, no padding

-- Use for URL parameters and tokens
LET sessionData = '{"userId":12345,"role":"admin","expires":1698765432}'
LET sessionToken = URL_SAFE_BASE64 text=sessionData
LET redirectUrl = "https://app.example.com/dashboard?token=" || sessionToken

SAY "URL-safe token: " || sessionToken
SAY "Redirect URL: " || redirectUrl
```

### Binary Data Handling
```rexx
-- Handle binary data with base64
LET imageData = FILE_READ filename="logo.png"
LET base64Image = BASE64_ENCODE data=imageData

-- Create data URL for images
LET dataUrl = "data:image/png;base64," || base64Image
SAY "Data URL length: " || LENGTH(string=dataUrl)

-- Decode binary data
LET decodedBinary = BASE64_DECODE encoded=base64Image
SAY "Original size matches: " || (LENGTH(string=imageData) = LENGTH(string=decodedBinary))
```

## API Integration Examples

### REST API URL Construction
```rexx
-- Build REST API URLs
LET baseUrl = "https://api.example.com"
LET version = "v2"
LET resource = "users"
LET userId = 12345
LET includeDetails = true

-- Construct endpoint
LET endpoint = "/" || version || "/" || resource || "/" || userId

-- Add query parameters
LET params = ""
IF includeDetails THEN
  LET params = "?include=profile,settings"
ENDIF

LET fullUrl = baseUrl || endpoint || params
SAY "API endpoint: " || fullUrl

-- URL validation
LET parsed = URL_PARSE url=fullUrl
IF parsed.hostname THEN
  SAY "Valid API URL constructed"
ELSE
  SAY "Invalid URL format"
ENDIF
```

### Query Parameter Building
```rexx
-- Build complex query strings
LET searchParams = ""
LET filters = '{"status":"active","role":"admin","department":"engineering"}'
LET parsedFilters = JSON_PARSE text=filters

-- Build query string manually
LET paramPairs = []
LET status = "status=" || URL_ENCODE(string="active")
LET role = "role=" || URL_ENCODE(string="admin")  
LET dept = "department=" || URL_ENCODE(string="engineering")

LET queryString = "?" || status || "&" || role || "&" || dept
LET searchUrl = "https://api.example.com/search" || queryString

SAY "Search URL with filters: " || searchUrl
```

### PostMessage Integration
```rexx
-- Construct postMessage data with proper encoding
LET messageData = '{"action": "navigate", "url": "https://example.com/page?id=123"}'
LET encodedMessage = BASE64_ENCODE text=messageData

-- Send cross-frame message
ADDRESS iframe
sendMessage target="calculator-iframe" payload=encodedMessage

-- Parse incoming URLs from postMessage
LET receivedUrl = "https://calculator.example.com/api/calculate?expr=2%2B3"
LET decodedUrl = URL_DECODE string=receivedUrl
LET urlComponents = URL_PARSE url=decodedUrl

-- Extract calculation parameters
LET queryParams = urlComponents.search
IF INCLUDES(string=queryParams substring="expr=") THEN
  -- Extract expression parameter
  LET exprStart = INDEXOF(string=queryParams substring="expr=") + 5
  LET expression = SUBSTRING(string=queryParams start=exprStart)
  LET decodedExpr = URL_DECODE string=expression
  SAY "Expression to calculate: " || decodedExpr
ENDIF
```

## Web Security Functions

### Secure Authentication Headers
```rexx
-- Create basic authentication headers
LET username = "api_user"
LET password = "secure_password"
LET credentials = username || ":" || password
LET encodedCreds = BASE64_ENCODE text=credentials
LET authHeader = "Basic " || encodedCreds

SAY "Authorization: " || authHeader

-- Create bearer token headers
LET apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
LET bearerHeader = "Bearer " || apiToken
SAY "Authorization: " || bearerHeader
```

### URL Sanitization
```rexx
-- Sanitize user input for URLs
LET userInput = "search term with spaces & symbols!"
LET sanitized = URL_ENCODE string=userInput

-- Validate URLs before processing
LET userUrl = "https://example.com/api/data"
LET parsed = URL_PARSE url=userUrl

IF parsed.protocol = "https:" OR parsed.protocol = "http:" THEN
  SAY "Valid HTTP/HTTPS URL: " || userUrl
ELSE
  SAY "Invalid or unsafe URL protocol"
ENDIF

-- Check for suspicious patterns
LET isSuspicious = INCLUDES(string=userUrl substring="javascript:") OR INCLUDES(string=userUrl substring="data:")
IF isSuspicious THEN
  SAY "Potentially dangerous URL detected"
ELSE
  SAY "URL appears safe for processing"
ENDIF
```

## HTTP Resource Access

### File System Integration
```rexx
-- HTTP vs localStorage routing
LET localFile = "config.txt"           -- No path separators = localStorage
LET httpFile = "/data/users.csv"       -- Path separator = HTTP resource

-- Local file operations
LET localContent = FILE_READ filename=localFile
IF localContent.success THEN
  SAY "Local file read successfully"
ELSE
  SAY "Local file not found"
ENDIF

-- HTTP resource access
LET httpContent = FILE_READ filename=httpFile
IF httpContent.success THEN
  SAY "HTTP resource loaded: " || LENGTH(string=httpContent.content) || " bytes"
ELSE
  SAY "HTTP resource failed: " || httpContent.error
ENDIF

-- Check resource existence
LET httpExists = FILE_EXISTS filename="/api/status.json"
LET localExists = FILE_EXISTS filename="cache.dat"

SAY "HTTP resource exists: " || httpExists
SAY "Local file exists: " || localExists
```

### API Data Processing
```rexx
-- Load and process API data
LET apiEndpoint = "/api/v1/users.json"
LET userData = FILE_READ filename=apiEndpoint

IF userData.success THEN
  -- Parse JSON response
  LET users = JSON_PARSE text=userData.content
  LET userCount = ARRAY_LENGTH array=users
  
  SAY "Loaded " || userCount || " users from API"
  
  -- Process each user
  DO i = 0 TO userCount - 1
    LET user = ARRAY_GET array=users index=i
    LET userName = user.name
    LET userEmail = user.email
    
    -- Create encoded email for URL
    LET encodedEmail = URL_ENCODE string=userEmail
    LET profileUrl = "/users/profile?email=" || encodedEmail
    
    SAY "User: " || userName || " -> " || profileUrl
  END
ELSE
  SAY "Failed to load user data: " || userData.error
ENDIF
```

## Advanced Web Operations

### URL Routing and Validation
```rexx
-- URL routing logic
LET requestUrl = "https://app.example.com/api/users/123/profile?tab=settings"
LET parsed = URL_PARSE url=requestUrl

-- Route based on pathname
SELECT
  WHEN INCLUDES(string=parsed.pathname substring="/api/users") THEN
    SAY "User API endpoint detected"
    
    -- Extract user ID from path
    LET pathParts = REGEX_SPLIT string=parsed.pathname pattern="/"
    LET userIdIndex = ARRAY_INDEXOF array=pathParts item="users" + 1
    LET userId = ARRAY_GET array=pathParts index=userIdIndex
    
    SAY "Processing request for user ID: " || userId
    
  WHEN INCLUDES(string=parsed.pathname substring="/api/admin") THEN
    SAY "Admin API endpoint - requires authentication"
    
  OTHERWISE
    SAY "Unknown endpoint: " || parsed.pathname
END

-- Validate query parameters
IF parsed.search THEN
  LET queryString = SUBSTRING(string=parsed.search start=2)  -- Remove leading '?'
  LET queryPairs = REGEX_SPLIT string=queryString pattern="&"
  
  SAY "Query parameters:"
  DO i = 0 TO ARRAY_LENGTH(array=queryPairs) - 1
    LET pair = ARRAY_GET array=queryPairs index=i
    LET parts = REGEX_SPLIT string=pair pattern="="
    LET key = ARRAY_GET array=parts index=0
    LET value = URL_DECODE string=ARRAY_GET(array=parts index=1)
    
    SAY "  " || key || " = " || value
  END
ENDIF
```

### Cross-Origin Communication
```rexx
-- Prepare cross-origin postMessage
LET targetOrigin = "https://partner.example.com"
LET messageType = "data-request"
LET requestData = '{"endpoint": "/users", "filters": {"active": true}}'

-- Encode sensitive data
LET encodedData = BASE64_ENCODE text=requestData
LET messagePayload = '{"type": "' || messageType || '", "data": "' || encodedData || '"}'

-- Send to iframe or parent window
ADDRESS iframe
sendMessage target="partner-frame" payload=messagePayload origin=targetOrigin

-- Handle incoming messages
LET receivedMessage = '{"type": "data-response", "data": "eyJzdWNjZXNzIjp0cnVl..."}'
LET parsedMessage = JSON_PARSE text=receivedMessage

IF parsedMessage.type = "data-response" THEN
  LET responseData = BASE64_DECODE encoded=parsedMessage.data
  LET response = JSON_PARSE text=responseData
  SAY "Received response: " || response.success
ENDIF
```

### Web Standards Compliance
```rexx
-- Ensure proper URL encoding for different contexts
LET formData = "user name with spaces"
LET pathComponent = "path/with/slashes"
LET queryValue = "value&with&ampersands"

-- Different encoding for different URL parts
LET encodedForm = URL_ENCODE string=formData        -- For query parameters
LET encodedPath = URL_ENCODE string=pathComponent   -- For path components  
LET encodedQuery = URL_ENCODE string=queryValue     -- For query values

-- Build compliant URL
LET baseUrl = "https://api.example.com"
LET encodedPathPart = REGEX_REPLACE string=encodedPath pattern="%2F" replacement="/"
LET compliantUrl = baseUrl || "/" || encodedPathPart || "?name=" || encodedForm || "&data=" || encodedQuery

SAY "Standards-compliant URL: " || compliantUrl
```

## Error Handling

### Robust Web Operations
```rexx
-- Safe URL parsing with error handling
LET userInputUrl = "https://example.com/path?query=value"
LET parsedUrl = URL_PARSE url=userInputUrl

IF parsedUrl.hostname THEN
  SAY "Successfully parsed URL"
  SAY "  Host: " || parsedUrl.hostname
  SAY "  Path: " || parsedUrl.pathname
ELSE
  SAY "Failed to parse URL: " || userInputUrl
  -- Use default or prompt for correction
  LET fallbackUrl = "https://api.example.com"
  SAY "Using fallback URL: " || fallbackUrl
ENDIF

-- Safe encoding/decoding operations
LET testString = "test string with unicode: 👍"
LET encoded = URL_ENCODE string=testString

IF LENGTH(string=encoded) > 0 THEN
  LET decoded = URL_DECODE string=encoded
  LET roundTripSuccess = (decoded = testString)
  SAY "Encoding round-trip successful: " || roundTripSuccess
ELSE
  SAY "Encoding failed for input: " || testString
ENDIF

-- Base64 error handling
LET invalidBase64 = "invalid-base64-string"
SIGNAL ON ERROR NAME Base64Error
LET decoded = BASE64_DECODE encoded=invalidBase64
SIGNAL OFF ERROR

SAY "Base64 decode succeeded"
EXIT

Base64Error:
SAY "Base64 decode failed: " || ERROR_MESSAGE
SAY "Using empty string as fallback"
LET decoded = ""
SIGNAL OFF ERROR
```

## Function Reference

### URL Functions
- `URL_PARSE(url)` - Parse URL string into components object
- `URL_ENCODE(string)` - URL-encode string for safe use in URLs  
- `URL_DECODE(string)` - Decode URL-encoded strings back to original

### Base64 Functions
- `BASE64_ENCODE(text|data)` - Base64 encode text or binary data
- `BASE64_DECODE(encoded)` - Decode Base64 strings back to original
- `URL_SAFE_BASE64(text)` - Create URL-safe base64 encoding

### URL Component Properties
When using `URL_PARSE`, the returned object contains:
- `protocol` - URL protocol (e.g., "https:")
- `hostname` - Domain name (e.g., "example.com")
- `port` - Port number if specified
- `pathname` - Path portion of URL
- `search` - Query string including leading "?"
- `hash` - Fragment identifier including leading "#"
- `host` - Hostname and port combined

### Error Handling
- `URL_PARSE` returns `null` for invalid URLs
- `URL_ENCODE/DECODE` return empty string for encoding/decoding errors
- `BASE64_ENCODE/DECODE` handle errors gracefully with empty string fallback
- Cross-platform support with native browser/Node.js APIs and fallbacks

**See also:**
- [Security Functions](12-security-functions.md) for additional encoding and hashing
- [JSON Functions](08-json-functions.md) for API data processing  
- [String Functions](04-string-functions.md) for URL string manipulation
- [File System Functions](13-filesystem-functions.md) for HTTP resource access