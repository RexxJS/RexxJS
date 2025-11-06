# HTTP Functions

## Overview

RexxJS provides built-in HTTP functions for making web API requests. These functions return structured response objects with status, body, headers, and convenience flags.

**Availability**: All environments (Node.js and browser)

## HTTP Functions

### HTTP_GET(url [, headers]) → response

Perform an HTTP GET request.

```rexx
-- Simple GET request
LET response = HTTP_GET("https://api.github.com/users/octocat")

IF response.ok THEN DO
  SAY "Status: " || response.status
  SAY "Body: " || response.body
END
ELSE
  SAY "Request failed: " || response.status
```

### HTTP_POST(url, body [, headers]) → response

Perform an HTTP POST request with a body.

```rexx
-- POST JSON data
LET data = '{"name": "Alice", "email": "alice@example.com"}'
LET response = HTTP_POST("https://api.example.com/users", data)

IF response.ok THEN
  SAY "User created: " || response.body
ELSE
  SAY "Failed to create user: " || response.status
```

### HTTP_PUT(url, body [, headers]) → response

Perform an HTTP PUT request to update a resource.

```rexx
-- PUT request to update user
LET data = '{"name": "Alice Smith", "email": "alice.smith@example.com"}'
LET response = HTTP_PUT("https://api.example.com/users/123", data)

IF response.ok THEN
  SAY "User updated successfully"
ELSE
  SAY "Failed to update user: " || response.status
```

### HTTP_DELETE(url [, headers]) → response

Perform an HTTP DELETE request.

```rexx
-- DELETE request
LET response = HTTP_DELETE("https://api.example.com/users/123")

IF response.ok THEN
  SAY "User deleted successfully"
ELSE
  SAY "Failed to delete user: " || response.status
```

## Response Object

All HTTP functions return a response object with these properties:

```javascript
{
  status: 200,              // HTTP status code (number)
  body: "...",             // Response body (string)
  headers: {...},          // Response headers (object)
  ok: true                 // true if status 200-299, false otherwise
}
```

### Response Properties

- **status**: HTTP status code (200, 404, 500, etc.)
- **body**: Response body as a string
- **headers**: Object containing response headers (lowercase keys)
- **ok**: Boolean indicating success (status 200-299)

## Working with JSON APIs

### Parsing JSON Responses

```rexx
LET response = HTTP_GET("https://api.github.com/users/octocat")

IF response.ok THEN DO
  LET user = JSON_PARSE(response.body)
  SAY "Name: " || user.name
  SAY "Followers: " || user.followers
  SAY "Public Repos: " || user.public_repos
END
```

### Sending JSON Data

```rexx
-- Create JSON object
LET user = {
  name: "Alice",
  email: "alice@example.com",
  age: 25
}

-- Convert to JSON string
LET json_data = JSON_STRINGIFY(user)

-- Send POST request
LET response = HTTP_POST("https://api.example.com/users", json_data, {
  "Content-Type": "application/json"
})

IF response.ok THEN DO
  LET created_user = JSON_PARSE(response.body)
  SAY "User ID: " || created_user.id
END
```

## Custom Headers

Pass headers as the last parameter:

```rexx
-- GET with authorization header
LET headers = {
  "Authorization": "Bearer YOUR_TOKEN_HERE",
  "Accept": "application/json"
}
LET response = HTTP_GET("https://api.example.com/protected", headers)

-- POST with custom headers
LET headers = {
  "Content-Type": "application/json",
  "X-Custom-Header": "custom-value"
}
LET response = HTTP_POST("https://api.example.com/data", data, headers)
```

## Status Codes

Common HTTP status codes:

- **2xx Success**
  - 200 OK - Request successful
  - 201 Created - Resource created
  - 204 No Content - Success, but no response body

- **3xx Redirection**
  - 301 Moved Permanently
  - 302 Found (temporary redirect)
  - 304 Not Modified

- **4xx Client Errors**
  - 400 Bad Request - Invalid request
  - 401 Unauthorized - Authentication required
  - 403 Forbidden - Access denied
  - 404 Not Found - Resource not found
  - 429 Too Many Requests - Rate limit exceeded

- **5xx Server Errors**
  - 500 Internal Server Error
  - 502 Bad Gateway
  - 503 Service Unavailable
  - 504 Gateway Timeout

```rexx
LET response = HTTP_GET("https://api.example.com/data")

SELECT
  WHEN response.status = 200 THEN
    SAY "Success"
  WHEN response.status = 404 THEN
    SAY "Resource not found"
  WHEN response.status >= 400 & response.status < 500 THEN
    SAY "Client error: " || response.status
  WHEN response.status >= 500 THEN
    SAY "Server error: " || response.status
  OTHERWISE
    SAY "Unexpected status: " || response.status
END
```

## Common Patterns

### REST API CRUD Operations

```rexx
LET base_url = "https://api.example.com"

-- CREATE
LET new_user = '{"name": "Bob", "email": "bob@example.com"}'
LET response = HTTP_POST(base_url || "/users", new_user)
LET user_id = JSON_PARSE(response.body).id

-- READ
LET response = HTTP_GET(base_url || "/users/" || user_id)
LET user = JSON_PARSE(response.body)
SAY "User name: " || user.name

-- UPDATE
LET updated = '{"name": "Bob Smith"}'
LET response = HTTP_PUT(base_url || "/users/" || user_id, updated)

-- DELETE
LET response = HTTP_DELETE(base_url || "/users/" || user_id)
IF response.ok THEN
  SAY "User deleted"
```

### Error Handling

```rexx
SIGNAL ON ERROR NAME HandleHttpError

LET response = HTTP_GET("https://api.example.com/data")

IF \response.ok THEN DO
  SAY "HTTP error: " || response.status
  IF response.status = 401 THEN
    SAY "Authentication required"
  ELSE IF response.status = 429 THEN
    SAY "Rate limit exceeded, try again later"
  ELSE
    SAY "Error body: " || response.body
  EXIT 1
END

-- Process successful response
LET data = JSON_PARSE(response.body)
-- ... use data ...

EXIT

HandleHttpError:
  SAY "HTTP request failed with error"
  EXIT 1
```

### Pagination

```rexx
LET base_url = "https://api.example.com/items"
LET page = 1
LET all_items = []

DO WHILE page <= 10  -- Limit to 10 pages
  LET url = base_url || "?page=" || page || "&per_page=100"
  LET response = HTTP_GET(url)

  IF \response.ok THEN LEAVE

  LET page_data = JSON_PARSE(response.body)
  LET items = page_data.items

  IF LENGTH(items) = 0 THEN LEAVE  -- No more data

  -- Add items to collection
  DO i = 0 TO LENGTH(items) - 1
    all_items[LENGTH(all_items)] = items[i]
  END

  page = page + 1
END

SAY "Total items collected: " || LENGTH(all_items)
```

### Rate Limiting

```rexx
LET max_retries = 3
LET retry_count = 0

DO WHILE retry_count < max_retries
  LET response = HTTP_GET("https://api.example.com/data")

  IF response.status = 429 THEN DO
    -- Rate limited, wait and retry
    retry_count = retry_count + 1
    SAY "Rate limited, retry " || retry_count || " of " || max_retries
    SLEEP 5000  -- Wait 5 seconds
    ITERATE
  END

  IF response.ok THEN DO
    -- Success
    LET data = JSON_PARSE(response.body)
    -- Process data
    LEAVE
  END
  ELSE DO
    -- Other error
    SAY "Request failed: " || response.status
    EXIT 1
  END
END

IF retry_count >= max_retries THEN DO
  SAY "Max retries exceeded"
  EXIT 1
END
```

### File Download

```rexx
-- Download file content
LET response = HTTP_GET("https://example.com/data.json")

IF response.ok THEN DO
  -- Save to file (Node.js only)
  FILE_WRITE("/tmp/downloaded.json", response.body)
  SAY "File downloaded successfully"
END
```

### OAuth Authentication

```rexx
-- Get access token
LET token_data = '{"grant_type": "client_credentials"}'
LET auth_header = "Basic " || BASE64_ENCODE(client_id || ":" || client_secret)

LET response = HTTP_POST("https://oauth.example.com/token", token_data, {
  "Authorization": auth_header,
  "Content-Type": "application/x-www-form-urlencoded"
})

IF response.ok THEN DO
  LET token_response = JSON_PARSE(response.body)
  LET access_token = token_response.access_token

  -- Use access token
  LET api_response = HTTP_GET("https://api.example.com/data", {
    "Authorization": "Bearer " || access_token
  })

  IF api_response.ok THEN
    SAY "API data: " || api_response.body
END
```

### GraphQL Queries

```rexx
LET query = <<JSON
{
  "query": "{ user(id: \"123\") { name email posts { title } } }"
}
JSON

LET response = HTTP_POST("https://api.example.com/graphql", query, {
  "Content-Type": "application/json"
})

IF response.ok THEN DO
  LET result = JSON_PARSE(response.body)
  LET user = result.data.user
  SAY "User: " || user.name
  SAY "Posts: " || LENGTH(user.posts)
END
```

### Webhook Handling

```rexx
-- Verify webhook signature
LET signature = request_headers['X-Hub-Signature']
LET payload = request_body
LET secret = "your_webhook_secret"

LET expected_sig = "sha256=" || HMAC_SHA256(payload, secret)

IF signature = expected_sig THEN DO
  -- Process webhook
  LET data = JSON_PARSE(payload)
  SAY "Webhook event: " || data.event
  -- Handle event...
END
ELSE
  SAY "Invalid webhook signature"
```

## Debugging HTTP Requests

### Inspect Headers

```rexx
LET response = HTTP_GET("https://api.github.com/users/octocat")

SAY "Response headers:"
LET headers = response.headers
-- Iterate over headers (implementation depends on object iteration support)
SAY "Content-Type: " || headers['content-type']
SAY "Date: " || headers.date
SAY "Server: " || headers.server
```

### Verbose Debugging

```rexx
LET url = "https://api.example.com/data"
SAY "Sending GET request to: " || url

LET response = HTTP_GET(url)

SAY "Response status: " || response.status
SAY "Response ok: " || response.ok
SAY "Response body length: " || LENGTH(response.body)
SAY "Response body: " || response.body
```

## Security Considerations

### 1. Never Hardcode Credentials

```rexx
-- BAD
LET api_key = "sk_live_1234567890abcdef"

-- GOOD - Use environment variables
LET api_key = ENV['API_KEY']
IF api_key = "" THEN DO
  SAY "API_KEY environment variable not set"
  EXIT 1
END
```

### 2. Validate Responses

```rexx
LET response = HTTP_GET("https://api.example.com/data")

-- Always check ok flag
IF \response.ok THEN DO
  SAY "Request failed"
  EXIT 1
END

-- Validate JSON structure
LET data = JSON_PARSE(response.body)
IF \DATATYPE(data.id, 'N') THEN DO
  SAY "Invalid response structure"
  EXIT 1
END
```

### 3. Use HTTPS

```rexx
-- BAD - Insecure HTTP
LET response = HTTP_GET("http://api.example.com/data")

-- GOOD - Secure HTTPS
LET response = HTTP_GET("https://api.example.com/data")
```

### 4. Handle Sensitive Data Carefully

```rexx
-- Don't log sensitive data
LET response = HTTP_POST("https://api.example.com/login", credentials)
-- SAY response.body  -- BAD: Might contain auth tokens

-- Only log safe information
IF response.ok THEN
  SAY "Login successful"
ELSE
  SAY "Login failed with status: " || response.status
```

## Browser vs Node.js Differences

### Browser Environment
- Uses `fetch()` API under the hood
- Subject to CORS restrictions
- Cannot access file:// URLs
- Cookie handling is automatic

### Node.js Environment
- Uses `node-fetch` or similar
- No CORS restrictions
- Can access local files
- Must handle cookies manually

## Error Handling

HTTP functions may throw errors for network issues:

```rexx
SIGNAL ON ERROR NAME HandleNetworkError

LET response = HTTP_GET("https://invalid-domain-12345.com")
-- This might throw if DNS lookup fails

EXIT

HandleNetworkError:
  SAY "Network error occurred"
  SAY "Error: " || CONDITION('D')
  EXIT 1
```

## Performance Tips

1. **Reuse connections**: Multiple requests to same host are optimized
2. **Compress large payloads**: Use gzip compression for large bodies
3. **Cache responses**: Store responses when data doesn't change frequently
4. **Use conditional requests**: Send If-Modified-Since headers
5. **Batch requests**: Combine multiple operations when API supports it

## Next Steps

- [JSON Functions](14-json-functions.md)
- [Error Handling](06-error-handling.md)
- [String Functions](11-string-functions.md)
- [Cryptography Functions](18-cryptography-functions.md) (for API signatures)
