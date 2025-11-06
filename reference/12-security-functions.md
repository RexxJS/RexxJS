# Security Functions

Cryptographic and security-related functions for hashing, encryption, authentication, and secure data handling.

## Hashing Functions

### SHA-256 Hashing
```rexx
-- Generate SHA-256 hash (uses Web Cryptography API in browser)
LET hash = HASH_SHA256 text="password123"
-- Returns: "ef92b778bafe771e89245b89ecbc6b64..."

-- Hash sensitive data
LET userHash = HASH_SHA256 text=userEmail
LET documentHash = HASH_SHA256 data=documentContent
```

### SHA-1 Hashing
```rexx
-- Generate SHA-1 hash (uses Web Cryptography API in browser)
LET hash = HASH_SHA1 text="data"
-- Returns: "a17c9aaa61e80a1bf71d0d850af4e5ba..."

-- Legacy system compatibility
LET legacyHash = HASH_SHA1 text=legacyData
```

### MD5 Hashing
```rexx
-- Generate MD5 hash (requires CryptoJS library or Node.js)
LET hash = HASH_MD5 text="content"

-- Falls back to non-cryptographic hash if MD5 not available
-- Returns simple hash or "HASH_ERROR" if completely unavailable
```

## Encoding Functions

### Base64 Encoding/Decoding
```rexx
-- Encode to base64 (uses btoa in browser, Buffer in Node.js)
LET encoded = BASE64_ENCODE text="Hello World!"
-- Returns: "SGVsbG8gV29ybGQh"

-- Decode from base64
LET decoded = BASE64_DECODE encoded="SGVsbG8gV29ybGQh"
-- Returns: "Hello World!"

-- Handle binary data
LET imageData = FILE_READ filename="image.png"
LET base64Image = BASE64_ENCODE data=imageData
```

### URL-Safe Base64
```rexx
-- Create URL-safe base64 (no +, /, or = characters)
LET urlSafe = URL_SAFE_BASE64 text="data+with/special=chars"
-- Returns base64 with - instead of +, _ instead of /, no padding

-- Use for URL parameters
LET token = URL_SAFE_BASE64 text=sessionData
prepareDish name="redirect?token={token}"
```

## Random Generation

### Secure Random Strings
```rexx
-- Generate random strings (uses crypto.getRandomValues when available)
LET sessionId = RANDOM_STRING length=32 charset="alphanumeric"
LET apiKey = RANDOM_STRING length=40 charset="hex"
LET pin = RANDOM_STRING length=6 charset="numeric"

-- Charset options:
-- "alpha" - Letters only
-- "numeric" - Numbers only  
-- "alphanumeric" - Letters and numbers
-- "hex" - Hexadecimal (0-9, a-f)
-- "base64" - Base64 characters
-- Custom - Any string of characters to use

-- Custom charset example
LET code = RANDOM_STRING length=8 charset="ABCDEFG123456"
```

## JWT Handling

### JWT Decoding
```rexx
-- Decode JWT tokens (no signature verification)
LET token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
LET decoded = JWT_DECODE token=token

-- Access JWT parts
LET header = decoded.header  -- {alg: "HS256", typ: "JWT"}
LET payload = decoded.payload  -- {sub: "1234", name: "John", iat: 1516239022}
LET signature = decoded.signature  -- "SflKxwRJSMeKKF2QT4..."

-- Check JWT claims
IF payload.exp < NOW_TIMESTAMP
  SAY "Token expired"
ENDIF
```

## HMAC Functions

### HMAC-SHA256
```rexx
-- Generate HMAC signature (uses Web Cryptography API when available)
LET signature = HMAC_SHA256 text="message" secret="secret-key"

-- API request signing
LET timestamp = NOW_TIMESTAMP
LET payload = '{"action":"transfer","amount":100}'
LET apiSignature = HMAC_SHA256 text=payload secret=apiSecret
```

## Password Functions

### Password Hashing and Verification
```rexx
-- Hash password with salt (auto-generates salt)
LET hashedPassword = PASSWORD_HASH password="user-password" algorithm="SHA256"
-- Returns: "sha256$randomsalt$hashedvalue"

-- Verify password against hash
LET isValid = PASSWORD_VERIFY password="user-input" hash=hashedPassword
-- Returns: true or false

-- Support different algorithms
LET sha1Hash = PASSWORD_HASH password="pass" algorithm="SHA1"
```

## Practical Security Examples

### API Authentication
```rexx
-- Generate API credentials
LET apiKey = RANDOM_STRING length=32 charset="hex"
LET apiSecret = RANDOM_STRING length=64 charset="base64"

-- Sign API request
LET timestamp = NOW_TIMESTAMP
LET method = "POST"
LET path = "/api/v1/orders"
LET body = '{"product":"widget","quantity":5}'
LET signatureBase = method + path + timestamp + body
LET signature = HMAC_SHA256 text=signatureBase secret=apiSecret

-- Make authenticated request
ADDRESS api
POST url=path headers='{"X-API-Key":"{apiKey}","X-Signature":"{signature}","X-Timestamp":"{timestamp}"}' body=body
```

### Session Management
```rexx
-- Create secure session
LET sessionId = RANDOM_STRING length=32 charset="alphanumeric"
LET sessionData = '{"userId":123,"role":"admin"}'
LET sessionToken = BASE64_ENCODE text=sessionData
LET sessionHash = HASH_SHA256 text=sessionToken

-- Store session
FILE_WRITE filename="session_{sessionId}.json" content=sessionData

-- Verify session
LET storedData = FILE_READ filename="session_{sessionId}.json"
LET verifyHash = HASH_SHA256 text=storedData
IF verifyHash = sessionHash
  SAY "Session valid"
ELSE
  SAY "Session tampered"
ENDIF
```

### Data Integrity
```rexx
-- Calculate file checksum
LET fileContent = FILE_READ filename="important.doc"
LET checksum = HASH_SHA256 text=fileContent

-- Verify file integrity later
LET currentContent = FILE_READ filename="important.doc"
LET currentChecksum = HASH_SHA256 text=currentContent
IF currentChecksum = checksum
  SAY "File unchanged"
ELSE
  SAY "File modified"
ENDIF
```

### Secure Token Generation
```rexx
-- Generate secure authentication token
LET userId = 12345
LET tokenData = '{"userId":' || userId || ',"exp":' || (NOW_TIMESTAMP + 3600) || '}'
LET encodedToken = BASE64_ENCODE text=tokenData
LET tokenSignature = HMAC_SHA256 text=encodedToken secret=serverSecret
LET secureToken = encodedToken || "." || tokenSignature

SAY "Generated secure token: " || secureToken

-- Verify token later
LET parts = REGEX_SPLIT string=secureToken pattern="\\."
LET receivedToken = parts[0]
LET receivedSignature = parts[1]
LET expectedSignature = HMAC_SHA256 text=receivedToken secret=serverSecret

IF receivedSignature = expectedSignature THEN
  LET decodedData = BASE64_DECODE encoded=receivedToken
  LET tokenInfo = JSON_PARSE text=decodedData
  SAY "Token valid for user: " || tokenInfo.userId
ELSE
  SAY "Invalid token signature"
ENDIF
```

## Environment Detection

The crypto functions automatically detect and use available APIs:

### Browser Environment
- Uses: Web Cryptography API (crypto.subtle)
- Uses: btoa/atob for base64
- Uses: crypto.getRandomValues for secure random

### Node.js Environment  
- Uses: require('crypto') module
- Uses: Buffer for base64
- Uses: crypto.randomBytes for secure random

### Limited Environment
- Throws: Error with clear message about what's missing
- Random: Falls back to Math.random() (always available)

## Error Handling

### Crypto Function Errors
```rexx
-- Functions will throw if crypto not available
-- This ensures you know immediately if crypto is missing
-- rather than silently getting wrong results

-- JWT error handling (returns object with error property)
LET decoded = JWT_DECODE token=userToken
IF decoded.error
  SAY "Invalid JWT: {decoded.error}"
ENDIF

-- Invalid base64 will throw an error
-- This prevents silent data corruption
LET data = BASE64_DECODE encoded=userInput
-- Throws: "Invalid base64 input: ..." if malformed

-- Missing crypto will throw clear errors
LET hash = HASH_SHA256 text="password"
-- Throws: "SHA256 hashing not available in this environment"

-- MD5 requires external library
LET md5 = HASH_MD5 text="data"  
-- Throws: "MD5 hashing not available - requires CryptoJS library or Node.js"
```

## Security Best Practices

### Password Security
- Always use salt when hashing passwords
- Use strong hashing algorithms (SHA-256 or better)
- Verify passwords using constant-time comparison
- Never log or store passwords in plain text

### API Security
- Use HMAC for request signing
- Include timestamps to prevent replay attacks
- Use secure random generation for API keys
- Rotate secrets regularly

### Token Security
- Set appropriate expiration times
- Use secure signatures (HMAC-SHA256)
- Validate all token components
- Use URL-safe encoding for web tokens

### Data Integrity
- Hash critical data for integrity checks
- Use checksums for file verification
- Verify signatures before processing data
- Log security-relevant events

**See also:**
- [ID Generation Functions](10-id-functions.md) for UUID and secure random ID generation
- [Validation Functions](11-validation-functions.md) for input validation and security
- [Web Functions](09-web-functions.md) for secure web operations
- [JSON Functions](08-json-functions.md) for secure data processing