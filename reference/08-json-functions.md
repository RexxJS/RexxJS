# JSON Functions

Modern data interchange and processing capabilities for working with JSON data in APIs, configuration files, and data structures.

## Core JSON Functions

### JSON Parsing
```rexx
LET jsonString = '{"name": "John", "age": 30, "active": true}'
LET parsed = JSON_PARSE text=jsonString   -- JavaScript object
```

**With Arrays:**
```rexx
LET arrayJson = '[{"name": "Alice", "role": "admin"}, {"name": "Bob", "role": "user"}]'
LET users = JSON_PARSE text=arrayJson
```

### JSON Stringification  
```rexx
LET object = {name: "John", age: 30, active: true}
LET jsonString = JSON_STRINGIFY object=object
-- Result: '{"name":"John","age":30,"active":true}'

-- Pretty-printed JSON
LET prettyJson = JSON_STRINGIFY object=object indent=2
-- Result: formatted with 2-space indentation
```

### JSON Validation
```rexx
LET jsonString = '{"valid": true}'
LET isValid = JSON_VALID string=jsonString  -- true

LET badJson = '{"invalid": json'
LET isBad = JSON_VALID string=badJson       -- false
```

## Working with Parsed JSON Data

### Accessing Properties
```rexx
LET userJson = '{"profile": {"firstName": "John", "lastName": "Doe"}, "age": 30}'
LET user = JSON_PARSE text=userJson

-- Access nested properties with dot notation
LET firstName = user.profile.firstName  -- "John"
LET age = user.age                       -- 30
```

### Array Access
```rexx
LET usersJson = '[{"name": "Alice", "score": 95}, {"name": "Bob", "score": 87}]'
LET users = JSON_PARSE text=usersJson

-- Access array elements
LET firstUser = users[0]               -- First user object
LET firstUserName = users[0].name      -- "Alice"  
LET secondScore = users[1].score       -- 87
```

## Practical JSON Processing Examples

### API Response Processing
```rexx
-- Simulated API response
LET apiResponse = '{
  "status": "success",
  "data": {
    "users": [
      {"id": 1, "name": "Alice", "role": "admin", "active": true},
      {"id": 2, "name": "Bob", "role": "user", "active": false},
      {"id": 3, "name": "Carol", "role": "user", "active": true}
    ],
    "total": 3
  }
}'

LET response = JSON_PARSE text=apiResponse

-- Extract and process data
LET status = response.status
LET users = response.data.users  
LET totalUsers = response.data.total

SAY "API Status: " || status
SAY "Total Users: " || totalUsers

-- Process each user
DO i = 0 TO totalUsers - 1
  LET user = users[i]
  LET userName = user.name
  LET userRole = user.role
  LET isActive = user.active
  
  IF isActive THEN
    SAY "Active " || userRole || ": " || userName
  ELSE
    SAY "Inactive " || userRole || ": " || userName
  ENDIF
END
```

### Configuration File Processing
```rexx
-- Application configuration
LET configJson = '{
  "app": {
    "name": "My Application",
    "version": "2.1.0",
    "debug": false
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "features": ["auth", "api", "reporting"]
}'

LET config = JSON_PARSE text=configJson

-- Extract configuration values
LET appName = config.app.name
LET appVersion = config.app.version
LET debugMode = config.app.debug
LET dbHost = config.database.host
LET dbPort = config.database.port
LET features = config.features

SAY "Configuring " || appName || " v" || appVersion
SAY "Debug mode: " || debugMode
SAY "Database: " || dbHost || ":" || dbPort

-- Check if specific feature is enabled
LET hasAuth = ARRAY_INCLUDES array=features item="auth"
IF hasAuth THEN
  SAY "Authentication enabled"
ENDIF
```

### Dynamic JSON Creation
```rexx
-- Create JSON from variables
LET userName = "Alice"
LET userRole = "admin"  
LET timestamp = NOW
LET sessionId = UUID

-- Build object dynamically
LET logEntry = {
  user: userName,
  role: userRole,
  action: "login",
  timestamp: timestamp,
  sessionId: sessionId,
  success: true
}

LET logJson = JSON_STRINGIFY object=logEntry indent=2
SAY "Log entry created:"
SAY logJson
```

### Data Transformation Pipeline
```rexx
-- Raw data transformation
LET rawDataJson = '[
  {"firstName": "john", "lastName": "DOE", "email": "JOHN@EXAMPLE.COM"},
  {"firstName": "jane", "lastName": "smith", "email": "jane@test.com"}
]'

LET rawUsers = JSON_PARSE text=rawDataJson

-- Transform data
LET transformedUsers = []
LET userCount = ARRAY_LENGTH array=rawUsers

DO i = 0 TO userCount - 1
  LET user = rawUsers[i]
  
  -- Clean and format data
  LET cleanFirstName = PROPER string=user.firstName
  LET cleanLastName = PROPER string=user.lastName  
  LET cleanEmail = LOWER string=user.email
  LET fullName = cleanFirstName || " " || cleanLastName
  
  -- Create transformed user object
  LET transformedUser = {
    id: i + 1,
    fullName: fullName,
    email: cleanEmail,
    processedAt: NOW
  }
  
  LET transformedUsers = ARRAY_PUSH array=transformedUsers item=transformedUser
END

-- Convert back to JSON
LET resultJson = JSON_STRINGIFY object=transformedUsers indent=2
SAY "Transformed data:"
SAY resultJson
```

## Error Handling with JSON

### Safe JSON Processing
```rexx
-- Validate before processing
LET userInput = '{"name": "John", "age": 30}'

LET isValidJson = JSON_VALID string=userInput

IF isValidJson THEN
  LET userData = JSON_PARSE text=userInput
  LET userName = userData.name
  LET userAge = userData.age
  
  SAY "Processing user: " || userName || ", age " || userAge
ELSE
  SAY "Invalid JSON provided"
ENDIF
```

### Handling Missing Properties
```rexx
LET incompleteJson = '{"name": "John"}'  -- Missing age property
LET user = JSON_PARSE text=incompleteJson

LET userName = user.name                 -- "John"
LET userAge = user.age                   -- undefined/null

-- Safe property access
IF userAge THEN
  SAY "User age: " || userAge
ELSE
  SAY "Age not provided"
ENDIF
```

## Integration with Control Flow

### JSON in Conditional Logic
```rexx
LET configJson = '{"features": {"auth": true, "api": false, "debug": true}}'
LET config = JSON_PARSE text=configJson

-- Use JSON data in conditions
IF config.features.auth THEN
  SAY "Enabling authentication module"
ENDIF

IF config.features.debug THEN
  SAY "Debug mode enabled"
ENDIF

-- Complex conditions
IF config.features.auth AND config.features.api THEN
  SAY "Starting secure API server"
ELSE IF config.features.auth THEN
  SAY "Starting basic auth server"
ELSE
  SAY "Starting public server"
ENDIF
```

### JSON with Loops
```rexx
LET tasksJson = '[
  {"id": 1, "title": "Setup database", "priority": "high"},
  {"id": 2, "title": "Create API", "priority": "medium"},
  {"id": 3, "title": "Write tests", "priority": "high"}
]'

LET tasks = JSON_PARSE text=tasksJson
LET taskCount = ARRAY_LENGTH array=tasks

SAY "Processing " || taskCount || " tasks:"

DO i = 0 TO taskCount - 1
  LET task = tasks[i]
  LET taskId = task.id
  LET taskTitle = task.title
  LET taskPriority = task.priority
  
  SAY "Task " || taskId || ": " || taskTitle || " (" || taskPriority || " priority)"
  
  -- Process high priority tasks differently
  IF taskPriority = "high" THEN
    SAY "  → Marking for immediate processing"
  ENDIF
END
```

## Advanced JSON Patterns

### Nested Data Structures
```rexx
-- Complex nested JSON
LET organizationJson = '{
  "company": {
    "name": "TechCorp",
    "departments": {
      "engineering": {
        "employees": [
          {"name": "Alice", "title": "Senior Developer"},
          {"name": "Bob", "title": "DevOps Engineer"}
        ]
      },
      "sales": {
        "employees": [
          {"name": "Carol", "title": "Sales Manager"}
        ]
      }
    }
  }
}'

LET org = JSON_PARSE text=organizationJson

-- Navigate deep structures
LET companyName = org.company.name
LET engineeringTeam = org.company.departments.engineering.employees
LET firstEngineer = engineeringTeam[0].name

SAY "Company: " || companyName
SAY "First engineer: " || firstEngineer
```

### JSON with String Interpolation
```rexx
LET userId = 12345
LET userName = "Alice"
LET action = "login"

-- Create JSON with interpolated values
LET auditLogJson = JSON_STRINGIFY object={
  user: userName,
  userId: userId,
  action: action,
  message: "User {userName} (ID: {userId}) performed {action}",
  timestamp: NOW
}

SAY "Audit log: " || auditLogJson
```

## Function Reference

### JSON_PARSE(text)
- **Purpose**: Convert JSON string to JavaScript object
- **Parameters**: `text` - JSON string to parse
- **Returns**: Parsed object, or `null` for invalid JSON
- **Example**: `LET obj = JSON_PARSE text='{"key": "value"}'`

### JSON_STRINGIFY(object, indent?)
- **Purpose**: Convert object to JSON string
- **Parameters**: `object` - Object to serialize, `indent` - Optional formatting
- **Returns**: JSON string, or empty string for non-serializable objects
- **Example**: `LET json = JSON_STRINGIFY object=myObj indent=2`

### JSON_VALID(string)  
- **Purpose**: Validate JSON syntax
- **Parameters**: `string` - JSON string to validate
- **Returns**: Boolean (true/false)
- **Example**: `LET isValid = JSON_VALID string=userInput`

**See also:**
- [Array Functions](06-array-functions.md) for processing JSON arrays
- [String Functions](04-string-functions.md) for JSON string manipulation
- [Validation Functions](11-validation-functions.md) for data validation
- [Web Functions](09-web-functions.md) for API integration