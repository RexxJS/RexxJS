# OpenFaaS ADDRESS Library for RexxJS

This library provides OpenFaaS (Open Function as a Service) integration for RexxJS through the ADDRESS mechanism, enabling REXX programs to invoke serverless functions deployed on OpenFaaS clusters.

## Installation

**Requirements:**
- OpenFaaS cluster running (OpenFaaS gateway)
- Gateway URL accessible from client
- Function deployment on OpenFaaS

```bash
# Install OpenFaaS CLI
curl https://cli.openfaas.com | sh

# Start a local OpenFaaS cluster
docker run -d -p 8080:8080 --name openfaas \
  -e read_timeout=30s \
  -e write_timeout=30s \
  openfaas/gateway:latest
```

## Quick Start

### Invoke Function

```rexx
REQUIRE "./extras/addresses/openfaas-address/openfaas-address.js"

ADDRESS OPENFAAS
"invoke function='hello' gateway='http://localhost:8080' input='World'"

SAY RESULT.output
```

### With JSON Input

```rexx
ADDRESS OPENFAAS
"invoke function='process' gateway='http://localhost:8080' input='{\"name\": \"test\"}'"

SAY RESULT.response
```

## Core Methods

### `invoke function="<name>" gateway="<url>" input="<data>"`
Invoke an OpenFaaS function synchronously.

**Parameters:**
- `function` (string, required) - Function name
- `gateway` (string, required) - OpenFaaS gateway URL
- `input` (string, optional) - Input data (string or JSON)
- `timeout` (number, optional) - Timeout in seconds (default: 30)
- `async` (boolean, optional) - Run asynchronously

**Returns:**
- `success` (boolean) - Invocation successful
- `output` (string) - Function output
- `response` (string/object) - Parsed response
- `status_code` (number) - HTTP status
- `execution_time` (number) - Time in milliseconds

### `deploy function="<name>" image="<docker-image>"`
Deploy a function to OpenFaaS.

**Parameters:**
- `function` (string, required) - Function name
- `image` (string, required) - Docker image name
- `gateway` (string, required) - OpenFaaS gateway URL
- `environment` (object, optional) - Environment variables

**Returns:**
- `success` (boolean) - Deployment successful
- `function_id` (string) - Deployed function ID

### `list gateway="<url>"`
List all functions on OpenFaaS cluster.

**Returns:**
- `success` (boolean) - Operation successful
- `functions` (array) - List of deployed functions
- `count` (number) - Total functions

### `status function="<name>" gateway="<url>"`
Get function status and metrics.

**Returns:**
- `success` (boolean) - Operation successful
- `state` (string) - Current state
- `replicas` (number) - Running replicas
- `invocation_count` (number) - Total invocations
- `last_invoked` (string) - Last invocation time

## Usage Examples

### Simple Text Processing

```rexx
ADDRESS OPENFAAS
"invoke function='slug' gateway='http://localhost:8080' input='Hello World From REXX'"

slug = RESULT.output
SAY "Slug: " || slug
```

### Image Processing

```rexx
ADDRESS OPENFAAS
"invoke function='image-resize' gateway='http://localhost:8080' input='{\"url\": \"https://example.com/image.jpg\", \"width\": 300}'"

IF RESULT.success THEN
  SAY "Image resized: " || RESULT.response.url
ELSE
  SAY "Error: " || RESULT.error
```

### Data Transformation

```rexx
data = ARRAY(
  'name' -> 'Alice',
  'age' -> 30,
  'email' -> 'alice@example.com'
)

ADDRESS OPENFAAS
"invoke function='csv-export' gateway='http://localhost:8080' input='" || JSON(data) || "'"

csv = RESULT.output
SAY csv
```

### Batch Processing

```rexx
files = ARRAY('file1.txt', 'file2.txt', 'file3.txt')

DO file OVER files
  ADDRESS OPENFAAS
  "invoke function='process-file' gateway='http://localhost:8080' input='" || file || "' async=true"

  SAY "Processing " || file || " (ID: " || RESULT.function_id || ")"
END
```

### Function Chaining

```rexx
-- First function extracts text
ADDRESS OPENFAAS
"invoke function='ocr' gateway='http://localhost:8080' input='image.png'"

extracted_text = RESULT.output

-- Second function translates
ADDRESS OPENFAAS
"invoke function='translate' gateway='http://localhost:8080' input='" || extracted_text || "?to=es'"

translated = RESULT.output
SAY "Translated: " || translated
```

## OpenFaaS Function Example

### Node.js Handler

```javascript
module.exports = async (context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from OpenFaaS',
      input: context.body
    })
  };
};
```

### Python Handler

```python
def handle(req):
    return {
        'statusCode': 200,
        'body': f'Hello from {req}'
    }
```

### From REXX

```rexx
ADDRESS OPENFAAS
"invoke function='hello' gateway='http://localhost:8080' input='REXX'"

SAY RESULT.response
```

## Gateway Configuration

### Local Development

```bash
# Start OpenFaaS locally
docker run -d \
  -p 8080:8080 \
  -e basic_auth="true" \
  -e secret_basic_auth="1" \
  openfaas/gateway:latest

# Set gateway in REXX
gateway_url = "http://localhost:8080"
```

### Production Deployment

```rexx
ADDRESS OPENFAAS
"invoke function='api' gateway='https://openfaas.example.com' input='...'"
```

### With Authentication

```rexx
ADDRESS OPENFAAS
"invoke function='secure' gateway='https://gateway.example.com' input='...' username='admin' password='secret'"
```

## Error Handling

```rexx
ADDRESS OPENFAAS
LET result = invoke function='process' gateway='http://localhost:8080' input='{}'

IF result.success THEN
  SAY "✓ Invoked: " || result.output
ELSE IF result.status_code = 404 THEN
  SAY "❌ Function not found"
ELSE IF result.status_code = 429 THEN
  SAY "❌ Rate limited, retry after " || result.retry_after
ELSE IF result.status_code >= 500 THEN
  SAY "❌ Server error: " || result.status_code
ELSE
  SAY "❌ Error: " || result.error
```

## Performance & Scaling

### Auto-Scaling Configuration

```rexx
ADDRESS OPENFAAS
"deploy function='api' image='myregistry/api' gateway='http://localhost:8080' min_replicas=2 max_replicas=10"
```

### Function Metrics

```rexx
ADDRESS OPENFAAS
"status function='busy-function' gateway='http://localhost:8080'"

invocations = RESULT.invocation_count
last_invoked = RESULT.last_invoked

SAY "Total invocations: " || invocations
SAY "Last invoked: " || last_invoked
SAY "Replicas running: " || RESULT.replicas
```

## Security

### Authentication

```bash
# Enable basic auth
export basic_auth="true"
export secret_basic_auth="1"
```

### Environment Variables

```rexx
-- Securely pass secrets as environment variables
ADDRESS OPENFAAS
"invoke function='api' gateway='http://localhost:8080' input='{}' env_api_key='secret-key-here'"
```

## Best Practices

### ✅ Do:
- Use appropriate timeout values
- Implement error handling
- Monitor function performance
- Use async for non-critical tasks
- Set resource limits

### ❌ Don't:
- Hard-code sensitive data
- Ignore function timeouts
- Deploy large functions without testing
- Exceed gateway rate limits
- Use for long-running tasks (> 5 min)

## Comparison with Other Serverless

| Feature | OpenFaaS | Lambda | Cloud Functions |
|---------|----------|--------|-----------------|
| Deployment | Self-hosted/Managed | AWS | Google Cloud |
| Cost | Low (self-hosted) | Pay-per-invoke | Pay-per-invoke |
| Control | Full | Limited | Limited |
| Setup | Easy | AWS account | Google account |
| Best for | Custom deployments | AWS ecosystem | Google ecosystem |

## Integration with Other Handlers

### With Docker

```rexx
REQUIRE "./extras/addresses/docker-address/docker-address.js"
REQUIRE "./extras/addresses/openfaas-address/openfaas-address.js"

-- Build function image with Docker
ADDRESS DOCKER
"build image='myfunc:1.0' dockerfile='Dockerfile'"

-- Deploy to OpenFaaS
ADDRESS OPENFAAS
"deploy function='myfunc' image='myfunc:1.0' gateway='http://localhost:8080'"
```

---

**Part of the RexxJS extras collection** - bringing OpenFaaS serverless functions to REXX programs.
