# ID Generation Functions

Essential functions for distributed systems, session tracking, and secure random data generation with cross-platform cryptographic support.

## Core ID Generation Functions

### UUID - Standard Universally Unique Identifiers
```rexx
-- Standard UUID v4 generation (RFC 4122 compliant)
LET sessionId = UUID
-- Result: "f47ac10b-58cc-4372-a567-0e02b2c3d479"

-- Use in session tracking
LET userSessionId = UUID
LET requestId = UUID
LET transactionId = UUID

SAY "Session: " || userSessionId
SAY "Request: " || requestId
SAY "Transaction: " || transactionId
```

### NANOID - URL-Safe Short IDs
```rexx
-- URL-safe short IDs (similar to npm's nanoid)
LET trackingId = NANOID length=12
-- Result: "V1StGXR8_Z5j"

-- Default length (21 characters)
LET defaultId = NANOID
-- Result: "V1StGXR8_Z5jkuuuuuuu"

-- Various lengths for different purposes
LET shortCode = NANOID length=6    -- "A1B2C3"
LET mediumId = NANOID length=16    -- "V1StGXR8_Z5jkuuu"
LET longId = NANOID length=32      -- "V1StGXR8_Z5jkuuuuuuuuuuuuuuuu"

SAY "Short code: " || shortCode
SAY "Medium ID: " || mediumId
SAY "Long ID: " || longId
```

## Random Data Generation

### RANDOM_HEX - Secure Hexadecimal Strings
```rexx
-- Secure random data generation
LET apiKey = RANDOM_HEX bytes=32
-- Result: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890"

LET token = RANDOM_HEX bytes=16
-- Result: "f3e4d5c6b7a89012abcdef1234567890"

-- Default 16 bytes
LET defaultHex = RANDOM_HEX
-- Result: "a1b2c3d4e5f67890abcdef1234567890"

-- Various sizes for different use cases
LET shortHex = RANDOM_HEX bytes=4    -- "a1b2c3d4"
LET mediumHex = RANDOM_HEX bytes=8   -- "a1b2c3d4e5f67890"
LET longHex = RANDOM_HEX bytes=64    -- Very long hex string

SAY "API Key: " || apiKey
SAY "Short token: " || shortHex
```

### RANDOM_INT - Random Integers
```rexx
-- Random integers for testing and simulation
LET dice = RANDOM_INT min=1 max=6
-- Result: 4 (random between 1-6)

LET percentage = RANDOM_INT min=0 max=100
-- Result: 73 (random between 0-100)

-- Default range (0-100)
LET defaultRandom = RANDOM_INT
-- Result: 42

-- Various ranges
LET binary = RANDOM_INT min=0 max=1        -- 0 or 1
LET grade = RANDOM_INT min=60 max=100      -- Grade range
LET port = RANDOM_INT min=3000 max=8000    -- Port number range

SAY "Dice roll: " || dice
SAY "Percentage: " || percentage
SAY "Binary: " || binary
```

### RANDOM_BYTES - Raw Random Bytes
```rexx
-- Raw random bytes for cryptographic operations
LET entropy = RANDOM_BYTES count=32
-- Result: [42, 158, 91, 203, 17, 249, ...]

LET salt = RANDOM_BYTES count=16
-- Result: [201, 45, 88, 92, 13, 177, ...]

-- Default 32 bytes
LET defaultBytes = RANDOM_BYTES
-- Result: Array of 32 random bytes

SAY "Entropy bytes: " || ARRAY_LENGTH(array=entropy)
SAY "Salt bytes: " || ARRAY_LENGTH(array=salt)

-- Convert to hex for display (manual process)
LET firstByte = ARRAY_GET array=entropy index=0
LET secondByte = ARRAY_GET array=entropy index=1
SAY "First two bytes: " || firstByte || ", " || secondByte
```

## Practical Applications

### Session and Authentication Management
```rexx
-- Complete session management
LET userId = "user_12345"
LET sessionId = UUID
LET csrfToken = RANDOM_HEX bytes=32
LET sessionTimeout = NOW_TIMESTAMP + 3600  -- 1 hour from now

-- Create session object
LET sessionData = '{"userId": "' || userId || '", "sessionId": "' || sessionId || '", "csrfToken": "' || csrfToken || '", "expires": ' || sessionTimeout || '}'

SAY "Created session:"
SAY "  User: " || userId
SAY "  Session: " || sessionId
SAY "  CSRF Token: " || csrfToken
SAY "  Expires: " || sessionTimeout

-- API key generation for services
LET apiKeyId = NANOID length=16
LET apiSecret = RANDOM_HEX bytes=64
LET apiCreatedAt = NOW

LET apiCredentials = '{"keyId": "' || apiKeyId || '", "secret": "' || apiSecret || '", "createdAt": "' || apiCreatedAt || '"}'
SAY "Generated API credentials: " || apiKeyId
```

### Distributed System Integration
```rexx
-- Request tracking across services
LET traceId = UUID                    -- Overall trace
LET spanId = NANOID length=12         -- Current span
LET parentSpanId = NANOID length=12   -- Parent span
LET requestId = NANOID length=16      -- Request identifier

-- Create distributed trace context
LET traceContext = '{"traceId": "' || traceId || '", "spanId": "' || spanId || '", "parentSpanId": "' || parentSpanId || '", "requestId": "' || requestId || '"}'

SAY "Distributed trace context:"
SAY "  Trace ID: " || traceId
SAY "  Span ID: " || spanId
SAY "  Request ID: " || requestId

-- Load balancing and routing
LET serverId = RANDOM_INT min=1 max=5
LET routingKey = RANDOM_HEX bytes=8
LET priority = RANDOM_INT min=1 max=10

SELECT
  WHEN serverId <= 2 THEN
    SAY "Routing to primary cluster with key: " || routingKey
  WHEN serverId <= 4 THEN
    SAY "Routing to secondary cluster with key: " || routingKey
  OTHERWISE
    SAY "Routing to tertiary cluster with key: " || routingKey
END

SAY "Request priority: " || priority
```

### Cross-Frame Security
```rexx
-- Generate secure message IDs for postMessage
LET messageId = UUID
LET nonce = RANDOM_HEX bytes=16
LET timestamp = NOW_TIMESTAMP

-- Create secure RPC payload
LET rpcData = '{"id": "' || messageId || '", "nonce": "' || nonce || '", "timestamp": ' || timestamp || ', "method": "calculate", "params": {"expression": "2 + 3"}}'

SAY "Secure RPC call:"
SAY "  Message ID: " || messageId
SAY "  Nonce: " || nonce
SAY "  Payload: " || rpcData

-- Session validation with random challenges
LET challengeId = NANOID length=16
LET challengeValue = RANDOM_INT min=1000 max=9999
LET challengeExpiry = NOW_TIMESTAMP + 300  -- 5 minutes

LET challenge = '{"id": "' || challengeId || '", "value": ' || challengeValue || ', "expires": ' || challengeExpiry || '}'
SAY "Security challenge: " || challengeId || " = " || challengeValue
```

### Testing and Simulation
```rexx
-- Generate test data with consistent patterns
SAY "Generating test users..."
DO testRun = 1 TO 5
  LET userId = "user_" || NANOID(length=8)
  LET score = RANDOM_INT min=0 max=1000
  LET sessionTime = RANDOM_INT min=60 max=3600
  LET level = RANDOM_INT min=1 max=50
  
  SAY "Test User " || testRun || ":"
  SAY "  ID: " || userId
  SAY "  Score: " || score
  SAY "  Session Time: " || sessionTime || " seconds"
  SAY "  Level: " || level
END

-- A/B testing with random assignment
LET variant = RANDOM_INT min=1 max=2
LET experimentId = UUID
LET userId = "user_" || NANOID(length=10)

IF variant = 1 THEN
  SAY "User " || userId || " assigned to variant A (experiment: " || experimentId || ")"
ELSE
  SAY "User " || userId || " assigned to variant B (experiment: " || experimentId || ")"
ENDIF
```

### Database and File Operations
```rexx
-- Generate unique filenames
LET baseFilename = "backup"
LET timestamp = NOW
LET fileId = NANOID length=8
LET uniqueFilename = baseFilename || "_" || timestamp || "_" || fileId || ".json"

SAY "Generated filename: " || uniqueFilename

-- Database record creation
LET recordId = UUID
LET createdAt = NOW
LET createdBy = "system"
LET correlationId = NANOID length=16

LET dbRecord = '{"id": "' || recordId || '", "createdAt": "' || createdAt || '", "createdBy": "' || createdBy || '", "correlationId": "' || correlationId || '"}'

SAY "Database record:"
SAY "  ID: " || recordId
SAY "  Correlation: " || correlationId
SAY "  Record: " || dbRecord
```

### Batch Processing and Queuing
```rexx
-- Generate batch processing IDs
LET batchId = UUID
LET jobQueue = "processing"
LET priority = RANDOM_INT min=1 max=5

SAY "Batch processing setup:"
SAY "  Batch ID: " || batchId
SAY "  Queue: " || jobQueue
SAY "  Priority: " || priority

-- Create multiple jobs in the batch
DO jobIndex = 1 TO 3
  LET jobId = UUID
  LET workerId = "worker_" || RANDOM_INT(min=1 max=10)
  LET estimatedTime = RANDOM_INT min=30 max=300
  
  LET jobRecord = '{"batchId": "' || batchId || '", "jobId": "' || jobId || '", "workerId": "' || workerId || '", "estimatedTime": ' || estimatedTime || '}'
  
  SAY "Job " || jobIndex || ": " || jobId || " -> " || workerId || " (est. " || estimatedTime || "s)"
END
```

### URL-Safe Token Generation
```rexx
-- Generate tokens safe for URLs and filenames
LET shortToken = NANOID length=8     -- For short-lived tokens
LET mediumToken = NANOID length=16   -- For session tokens
LET longToken = NANOID length=32     -- For API keys

-- Combine with other data
LET userId = "12345"
LET action = "reset-password"
LET tokenData = userId || ":" || action || ":" || longToken
LET encodedToken = BASE64_ENCODE text=tokenData

SAY "Token generation:"
SAY "  Short: " || shortToken
SAY "  Medium: " || mediumToken  
SAY "  Long: " || longToken
SAY "  Encoded: " || encodedToken

-- Create secure URLs
LET baseUrl = "https://app.example.com"
LET endpoint = "/reset"
LET secureUrl = baseUrl || endpoint || "?token=" || mediumToken

SAY "Secure URL: " || secureUrl
```

### Game and Simulation Features
```rexx
-- Gaming random generation
LET playerId = UUID
LET gameSessionId = NANOID length=12
LET mapSeed = RANDOM_HEX bytes=8

-- Random game events
LET dice1 = RANDOM_INT min=1 max=6
LET dice2 = RANDOM_INT min=1 max=6
LET diceTotal = dice1 + dice2

LET cardValue = RANDOM_INT min=1 max=13    -- Card values 1-13
LET suitValue = RANDOM_INT min=1 max=4     -- 4 suits

SAY "Game Session: " || gameSessionId
SAY "Player: " || playerId
SAY "Map Seed: " || mapSeed
SAY "Dice Roll: " || dice1 || " + " || dice2 || " = " || diceTotal
SAY "Card: " || cardValue || " of suit " || suitValue

-- Generate random loot
LET lootRarity = RANDOM_INT min=1 max=100
LET lootType = ""
SELECT
  WHEN lootRarity >= 95 THEN LET lootType = "Legendary"
  WHEN lootRarity >= 80 THEN LET lootType = "Epic"
  WHEN lootRarity >= 60 THEN LET lootType = "Rare"
  WHEN lootRarity >= 30 THEN LET lootType = "Uncommon"
  OTHERWISE LET lootType = "Common"
END

LET lootId = UUID
SAY "Loot Drop: " || lootType || " (ID: " || lootId || ")"
```

## Security and Cryptographic Features

### Cryptographic Randomness
The ID generation functions use cryptographically secure random sources:
- **Browser**: Web Cryptography API (`crypto.getRandomValues`)
- **Node.js**: `crypto.randomBytes` module
- **Fallback**: Custom implementations maintain security when native APIs unavailable

### Security Best Practices
```rexx
-- Generate secure API credentials
LET apiKeyId = NANOID length=20        -- Long enough to prevent guessing
LET apiSecret = RANDOM_HEX bytes=32    -- 256 bits of entropy
LET refreshToken = UUID                -- Standard UUID for refresh tokens

-- Session security
LET sessionId = UUID                   -- Standard session identifier
LET csrfToken = RANDOM_HEX bytes=16   -- CSRF protection
LET securitySalt = RANDOM_BYTES count=32  -- For password hashing

SAY "Secure credentials generated:"
SAY "  API Key ID: " || apiKeyId
SAY "  Secret length: " || LENGTH(string=apiSecret) || " characters"
SAY "  Session: " || sessionId
SAY "  CSRF: " || csrfToken
SAY "  Salt bytes: " || ARRAY_LENGTH(array=securitySalt)

-- Verify entropy quality
LET testBytes = RANDOM_BYTES count=10
LET uniqueValues = 0
DO i = 0 TO ARRAY_LENGTH(array=testBytes) - 1
  LET currentByte = ARRAY_GET array=testBytes index=i
  -- In practice, you'd check for uniqueness
  SAY "  Random byte " || i || ": " || currentByte
END
```

## Error Handling and Edge Cases

### Parameter Validation
```rexx
-- Functions handle invalid parameters gracefully
LET validId = NANOID length=8        -- Valid length
LET invalidId = NANOID length=0      -- Uses default length (21)
LET negativeId = NANOID length=-5    -- Uses default length (21)

SAY "Valid ID: " || validId
SAY "Invalid length (0): " || invalidId || " (length: " || LENGTH(string=invalidId) || ")"
SAY "Negative length (-5): " || negativeId || " (length: " || LENGTH(string=negativeId) || ")"

-- RANDOM_INT handles invalid ranges
LET validRange = RANDOM_INT min=1 max=10      -- Valid range
LET invalidRange = RANDOM_INT min=10 max=5    -- Invalid range, uses defaults
LET sameRange = RANDOM_INT min=5 max=5        -- Same min/max

SAY "Valid range (1-10): " || validRange
SAY "Invalid range (10-5): " || invalidRange
SAY "Same range (5-5): " || sameRange

-- RANDOM_HEX and RANDOM_BYTES handle invalid sizes
LET validHex = RANDOM_HEX bytes=8
LET invalidHex = RANDOM_HEX bytes=0       -- Uses default (16 bytes)
LET validBytes = RANDOM_BYTES count=5
LET invalidBytes = RANDOM_BYTES count=-1  -- Uses default (32 bytes)

SAY "Valid hex: " || validHex
SAY "Invalid hex size: " || invalidHex
SAY "Valid bytes count: " || ARRAY_LENGTH(array=validBytes)
SAY "Invalid bytes count: " || ARRAY_LENGTH(array=invalidBytes)
```

## Performance Considerations

- **UUID generation**: Fast, suitable for high-frequency use
- **NANOID generation**: Optimized for URL-safe characters, very fast
- **RANDOM_HEX**: Efficient for most use cases, scales with byte count
- **RANDOM_INT**: Very fast, suitable for loops and games
- **RANDOM_BYTES**: Raw byte generation, efficient for cryptographic use

## Function Reference

### Core Functions
- `UUID()` - Generate RFC4122 version 4 UUID
- `NANOID(length?)` - URL-safe unique IDs (default: 21 characters)
- `RANDOM_HEX(bytes?)` - Cryptographically secure hex strings (default: 16 bytes)
- `RANDOM_INT(min?, max?)` - Random integers within range (default: 0-100)
- `RANDOM_BYTES(count?)` - Array of random bytes (default: 32 bytes)

### Specifications
- **UUID**: RFC 4122 version 4 compliant, 36 characters including hyphens
- **NANOID**: Uses 64-character alphabet, URL-safe, collision-resistant
- **RANDOM_HEX**: Hexadecimal (0-9, a-f), length = bytes × 2 characters
- **RANDOM_INT**: Inclusive range [min, max]
- **RANDOM_BYTES**: Returns array of integers 0-255

### Default Values
- `NANOID()` - 21 characters
- `RANDOM_HEX()` - 16 bytes (32 hex characters)
- `RANDOM_INT()` - Range 0-100
- `RANDOM_BYTES()` - 32 bytes

**See also:**
- [Security Functions](12-security-functions.md) for cryptographic operations
- [String Functions](04-string-functions.md) for ID string manipulation  
- [Math Functions](05-math-functions.md) for random number operations
- [Web Functions](09-web-functions.md) for URL-safe encoding