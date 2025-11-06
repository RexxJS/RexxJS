# AWS Lambda ADDRESS Library for RexxJS

This library provides AWS Lambda function invocation for RexxJS through the ADDRESS mechanism, enabling REXX programs to invoke serverless functions on AWS.

## Installation

**Requirements:**
- AWS Account with Lambda functions deployed
- AWS credentials configured (IAM user with Lambda permissions)
- `aws-sdk` v3 npm package

```bash
npm install @aws-sdk/client-lambda
```

## Quick Start

### Invoke Lambda Function

```rexx
REQUIRE "./extras/addresses/lambda-address/lambda-address.js"

ADDRESS LAMBDA
"invoke function='my-function' payload='{\"name\": \"World\"}'"

SAY RESULT.response
```

### Async Invocation

```rexx
ADDRESS LAMBDA
"invoke function='background-task' async=true payload='{\"job_id\": 123}'"

SAY "Task queued, request ID: " || RESULT.invocation_id
```

## Core Methods

### `invoke function="<name>" payload="<json>"`
Invoke a Lambda function synchronously or asynchronously.

**Parameters:**
- `function` (string, required) - Lambda function name or ARN
- `payload` (string, required) - JSON payload to send
- `async` (boolean, optional) - Asynchronous invocation (default: false)
- `qualifier` (string, optional) - Function version or alias
- `invocation_type` (string, optional) - RequestResponse, Event, DryRun

**Returns:**
- `success` (boolean) - Invocation successful
- `response` (object/string) - Function response
- `invocation_id` (string) - Unique invocation ID
- `log_result` (string) - Function logs
- `function_error` (string) - Error details if failed

### `list`
List all Lambda functions in current region.

**Returns:**
- `success` (boolean) - Operation successful
- `functions` (array) - Array of function objects
- `count` (number) - Total functions

### `status function="<name>"`
Get Lambda function status and configuration.

**Returns:**
- `success` (boolean) - Operation successful
- `state` (string) - Function state (Active, Pending)
- `memory` (number) - Memory allocation MB
- `timeout` (number) - Timeout seconds
- `last_modified` (string) - Last update timestamp

## Usage Examples

### Data Processing

```rexx
ADDRESS LAMBDA
"invoke function='process-data' payload='{\"file\": \"input.csv\"}'"

IF RESULT.success THEN
  SAY "Processing result: " || RESULT.response
ELSE
  SAY "Error: " || RESULT.function_error
```

### Scheduled Background Tasks

```rexx
ADDRESS LAMBDA
"invoke function='send-daily-reports' async=true payload='{\"date\": \"2025-10-19\"}'"

SAY "Background task started: " || RESULT.invocation_id
```

### API Integration

```rexx
payload = ARRAY(
  'user_id' -> '12345',
  'action' -> 'fetch_profile',
  'timestamp' -> DATETIME('now')
)

ADDRESS LAMBDA
"invoke function='api-gateway' payload='" || JSON(payload) || "'"

data = RESULT.response
SAY "User: " || data.name || " (" || data.email || ")"
```

### Function Chaining

```rexx
-- First Lambda extracts data
ADDRESS LAMBDA
"invoke function='extract-data' payload='{\"source\": \"database\"}'"

extract_result = RESULT.response

-- Second Lambda transforms the data
ADDRESS LAMBDA
"invoke function='transform-data' payload='" || JSON(extract_result) || "'"

SAY "Final result: " || RESULT.response
```

### Error Handling

```rexx
ADDRESS LAMBDA
LET result = invoke function='my-function' payload='{}'

IF result.success THEN
  SAY "✓ Success: " || result.response
ELSE IF result.function_error THEN
  SAY "❌ Function error: " || result.function_error
ELSE
  SAY "❌ Invocation failed: " || result.error
```

## AWS Configuration

### Using AWS Credentials

```bash
# Configure AWS credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_REGION="us-east-1"
```

### Using IAM Role (EC2/Lambda execution)

```rexx
-- Automatically uses instance IAM role
ADDRESS LAMBDA
"invoke function='trusted-function' payload='{}'"
```

## Lambda Function Examples

### Handler in Node.js

```javascript
exports.handler = async (event, context) => {
  console.log('Received event:', event);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from Lambda',
      input: event
    })
  };
};
```

### From REXX

```rexx
ADDRESS LAMBDA
"invoke function='hello' payload='{\"name\": \"REXX\"}'"

SAY RESULT.response.body
```

## Advanced Features

### Concurrent Invocations

```rexx
functions = ARRAY('func1', 'func2', 'func3', 'func4')

DO fn OVER functions
  ADDRESS LAMBDA
  "invoke function='" || fn || "' async=true payload='{}'"

  SAY "Invoked " || fn || " (ID: " || RESULT.invocation_id || ")"
END

SAY "All functions queued for execution"
```

### Version Management

```rexx
-- Invoke specific version
ADDRESS LAMBDA
"invoke function='my-function' qualifier='2' payload='{}'"

SAY "Version 2 result: " || RESULT.response

-- Or invoke alias
ADDRESS LAMBDA
"invoke function='my-function' qualifier='PROD' payload='{}'"

SAY "Production result: " || RESULT.response
```

## Monitoring & Logging

```rexx
ADDRESS LAMBDA
"invoke function='my-function' payload='{}'"

IF RESULT.log_result THEN
  SAY "Logs:"
  SAY RESULT.log_result
END
```

## Best Practices

### ✅ Do:
- Use async invocation for non-critical background tasks
- Implement timeout handling
- Validate Lambda responses
- Use function aliases for version management
- Monitor invocation metrics

### ❌ Don't:
- Send unencrypted sensitive data
- Ignore Lambda errors
- Invoke too frequently without throttling
- Hard-code AWS credentials
- Exceed concurrency limits without request

## Limitations & Considerations

- **Timeout**: Max 15 minutes (900 seconds)
- **Memory**: 128 MB to 10,240 MB
- **Payload**: 6 MB request, 6 MB response
- **Concurrency**: Account-level limits apply
- **Cold start**: Initial invocation may be slower

## Cost Optimization

- Use async invocation when response not needed
- Monitor memory usage
- Cache results when possible
- Use reserved concurrency for critical functions

## Integration with Other Services

### With S3

```rexx
-- Lambda processes S3 files
ADDRESS LAMBDA
"invoke function='process-s3' payload='{\"bucket\": \"my-bucket\", \"key\": \"file.txt\"}'"
```

### With DynamoDB

```rexx
-- Lambda queries database
ADDRESS LAMBDA
"invoke function='query-db' payload='{\"table\": \"users\", \"id\": \"123\"}'"
```

---

**Part of the RexxJS extras collection** - bringing AWS Lambda's serverless capabilities to REXX programs.
