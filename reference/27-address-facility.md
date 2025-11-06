# ADDRESS Facility - Complete Reference

## Overview

The ADDRESS facility is RexxJS's powerful "escape hatch" mechanism that allows REXX scripts to communicate with external domains, applications, services, and systems. It's one of the most important features that makes RexxJS a true orchestration and automation platform.

## What is ADDRESS?

ADDRESS provides a way to:

1. **Execute commands in alien domains** - SQL, bash, cloud APIs, containers, VMs
2. **Control external applications** - Docker, QEMU, VirtualBox, cloud platforms
3. **Access specialized languages** - Execute SQL queries, shell commands, cloud CLIs
4. **Implement test assertions** - Structured test expectations and validations
5. **Orchestrate infrastructure** - Provision and manage compute resources

Think of ADDRESS as a **protocol adapter** that translates REXX commands into the native language of another system, executes them, and returns results back to your REXX script.

## Basic ADDRESS Syntax

### Switching ADDRESS Context

```rexx
-- Switch to a specific ADDRESS target
ADDRESS target_name

-- All subsequent commands go to this target until changed
"command for target"
operation param1=value
LET result = method param=value

-- Switch back to default
ADDRESS REXX  -- or ADDRESS default
```

### One-time ADDRESS Usage

```rexx
-- Execute single command in a target, then return to previous context
ADDRESS target_name "single command"
```

### Remote HTTP Endpoint Registration (Built-in)

```rexx
-- Register a remote HTTP endpoint as an ADDRESS target (automatically switches to it)
ADDRESS "http://localhost:8080/api" AUTH "token-12345" AS MYAPP

-- Already in MYAPP context - send commands immediately
"command arg1 arg2"
IF RC = 0 THEN
  SAY "Success: " || RESULT
```

This feature is **built into the core interpreter** and requires no external libraries. It enables classic ARexx-style remote application control over HTTP. Registration automatically switches to that ADDRESS context.

### Common Pattern

```rexx
-- Save current ADDRESS
LET saved_address = ADDRESS()

-- Do work in new ADDRESS
ADDRESS SQL
"CREATE TABLE users (id, name)"

-- Restore previous ADDRESS
ADDRESS VALUE saved_address
```

## How ADDRESS Works

### Architecture

```
REXX Script
    ↓
ADDRESS target_name
    ↓
ADDRESS Handler (registered function)
    ↓
External System (database, container, VM, API)
    ↓
Result/Status returned
    ↓
RC (return code) and RESULT variables set
```

### Communication Flow

1. **Command Submission**: REXX sends command string or operation to ADDRESS handler
2. **Handler Processing**: Handler interprets command in target's native language
3. **External Execution**: Handler executes command using target's API/CLI/protocol
4. **Result Collection**: Handler captures output, status, errors
5. **Return to REXX**: Handler sets RC (return code) and RESULT (data) variables

### Special Variables

ADDRESS handlers can set these special variables:

- **RC**: Return code (0 = success, non-zero = error)
- **RESULT**: Result data (string, number, object, array)

```rexx
ADDRESS SQL
"SELECT * FROM users WHERE age > 18"
IF RC = 0 THEN
  SAY "Found " || LENGTH(RESULT) || " users"
ELSE
  SAY "Query failed with code: " || RC
```

## Remote HTTP Endpoints (Built-in Feature)

RexxJS includes built-in support for registering remote HTTP endpoints as ADDRESS targets, enabling classic ARexx-style inter-process communication over HTTP.

### Syntax

```rexx
ADDRESS "url" [AUTH "token"] AS name
```

### Features

- **No External Libraries Required**: Built into the core interpreter
- **Bearer Token Authentication**: Optional `Authorization: Bearer <token>` header
- **Standard REXX Variables**: Sets RC, RESULT, and ERRORTEXT
- **HTTP POST Protocol**: Commands sent as JSON POST requests
- **Fetch API Compatible**: Works in both Node.js (node-fetch) and browsers
- **Automatic Context Switch**: Registration automatically switches to that ADDRESS

### Example: Spreadsheet Control Bus

```rexx
-- Register remote spreadsheet endpoint (automatically switches to it)
ADDRESS "http://localhost:8083/api/spreadsheet" AUTH "dev-token-12345" AS SPREADSHEET

-- Send commands (already in SPREADSHEET context)
"setCell A1 10"
"setCell A2 20"
"setCell A3 =A1+A2"

-- Check results
IF RC = 0 THEN
  SAY "Spreadsheet updated successfully"
```

### HTTP Request Format

Commands are sent as HTTP POST requests with JSON body:

```json
{
  "command": "setCell",
  "params": {
    "ref": "A1",
    "content": "10"
  }
}
```

The command string `"setCell A1 10"` is parsed as:
- Command: `setCell`
- Arguments: `["A1", "10"]`
- Parameters: `{ref: "A1", content: "10"}`

### HTTP Response Format

Responses should be JSON with these fields:

```json
{
  "success": true,
  "result": "Cell A1 set to 10",
  "error": null
}
```

- `success`: Boolean indicating success/failure (sets RC: 0 = success, 1 = failure)
- `result`: Result data (sets RESULT variable)
- `error`: Error message if failed (sets ERRORTEXT variable)

### Authentication

The `AUTH` parameter uses **Bearer token** authentication (the most common pattern for REST APIs).

When AUTH is specified, requests include the Authorization header with Bearer scheme:

```
Authorization: Bearer dev-token-12345
```

**Note:** Currently only Bearer token authentication is supported. If you need other authentication schemes (Basic, API Key headers, etc.), you can implement them on the server side or this feature may be extended in the future.

### Error Handling

```rexx
ADDRESS "http://localhost:8080/api" AUTH "secret" AS MYAPP
ADDRESS MYAPP

"operation arg1 arg2"

IF RC = 0 THEN
  SAY "Success: " || RESULT
ELSE DO
  SAY "Failed with RC=" || RC
  SAY "Error: " || ERRORTEXT
END
```

### Connection Errors

The ADDRESS handler provides helpful error messages:

- **Connection refused**: "Connection refused to http://... - is the remote service running?"
- **Unauthorized**: "Unauthorized - check authentication token"
- **HTTP errors**: "HTTP 500: Internal Server Error"

### Switching Back to Other Contexts

Registration automatically switches to the new ADDRESS, but you can switch to other contexts anytime:

```rexx
ADDRESS "http://localhost:8080/api" AUTH "token" AS MYAPP
-- Now in MYAPP context

"command1"  -- Goes to MYAPP

ADDRESS REXX
SAY "Back to default"  -- Regular REXX output

ADDRESS MYAPP
"command2"  -- Back to MYAPP
```

### Use Cases

1. **Application Control**: Control desktop applications (Tauri, Electron) from REXX scripts
2. **Microservices**: Coordinate microservices via REXX orchestration scripts
3. **Test Automation**: Drive web applications and GUIs from test scripts
4. **Cross-Process IPC**: Classic ARexx-style inter-application communication

### Implementation Details

**Location**: `core/src/interpreter-address-handling.js` (executeRemoteCommand function)

**Parser**: `core/src/parser.js` (ADDRESS_REMOTE pattern)

**Registration**: Endpoints stored in `interpreter.addressRemoteEndpoints` object

**Fetch Compatibility**: Checks for native fetch, falls back to node-fetch in Node.js

## Complete ADDRESS Handler Catalog

### Core ADDRESS Handlers (Built-in)

These handlers are built into the core RexxJS interpreter and are always available:

#### SYSTEM - Shell Command Execution
- **Location**: Core built-in
- **Purpose**: Execute operating system shell commands
- **Availability**: Node.js only (not in browser)
- **Commands**: Any valid shell command for the host OS
- **Example**:
  ```rexx
  ADDRESS SYSTEM
  "ls -la"
  "cat > file.txt <<'EOF'
  Hello World
  EOF"
  ```
- **Documentation**: See [28-address-system.md](28-address-system.md)

#### SQL - SQLite Database Operations
- **Location**: Core built-in (requires REQUIRE)
- **Purpose**: Execute SQL queries on SQLite databases
- **Availability**: Node.js only
- **Commands**: Standard SQL (CREATE, SELECT, INSERT, UPDATE, DELETE)
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/sqlite3/sqlite-address.js"
  ADDRESS SQL
  "CREATE TABLE users (id INTEGER, name TEXT)"
  "INSERT INTO users VALUES (1, 'Alice')"
  LET result = execute sql="SELECT * FROM users"
  ```
- **Documentation**: See [29-address-sql.md](29-address-sql.md)

#### EXPECTATIONS - Test Assertions
- **Location**: `core/src/expectations-address.js`
- **Purpose**: Structured test assertions and validations
- **Availability**: All environments
- **Commands**: EXPECT, EXPECT_ERROR, EXPECT_EQUAL, etc.
- **Example**:
  ```rexx
  ADDRESS EXPECTATIONS
  EXPECT actual=5 equals=5 message="Math works"
  EXPECT actual="hello" contains="ell"
  ```
- **Documentation**: See [30-address-expectations.md](30-address-expectations.md)

#### TEST_FRAMEWORK - Test Framework Operations
- **Location**: `core/src/test-framework-address.js`
- **Purpose**: Test suite management and reporting
- **Availability**: All environments
- **Commands**: RUN_TEST, ASSERT, SETUP, TEARDOWN
- **Documentation**: See [31-address-test-framework.md](31-address-test-framework.md)

#### ECHO - Example/Testing Handler
- **Location**: `extras/addresses/echo/`
- **Purpose**: Simple echo handler for testing and examples
- **Availability**: All environments (via REQUIRE)
- **Example**:
  ```rexx
  REQUIRE "github.com/RexxJS/dist@latest"
  ADDRESS ECHO
  "Hello World"
  LET last = getLastEcho()  -- Returns "Hello World"
  ```
- **Documentation**: See [32-address-echo.md](32-address-echo.md)

### Extra ADDRESS Handlers - Container Management

These handlers manage container and lightweight virtualization systems:

#### DOCKER - Docker Containers
- **Location**: `extras/addresses/docker-address/docker-address.js`
- **Purpose**: Full Docker container lifecycle management
- **Capabilities**:
  - Create, start, stop, restart containers
  - Execute commands inside containers (docker exec)
  - Manage images, networks, volumes
  - Container lifecycle: pause, unpause, kill, remove
  - Log access and inspection
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/docker-address/docker-address.js"
  ADDRESS DOCKER
  "create image=node:18 name=app-container"
  "start name=app-container"
  "exec container=app-container command='npm install'"
  "stop name=app-container"
  ```
- **Documentation**: See [33-address-docker.md](33-address-docker.md)

#### PODMAN - Rootless Containers
- **Location**: `extras/addresses/podman-address/podman-address.js`
- **Purpose**: Podman rootless container operations
- **Capabilities**:
  - Rootless container execution (no root privileges needed)
  - Similar interface to Docker ADDRESS
  - Pod management (groups of containers)
  - Systemd integration for container services
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/podman-address/podman-address.js"
  ADDRESS PODMAN
  "create image=alpine name=test-pod"
  "exec container=test-pod command='apk update'"
  ```
- **Documentation**: See [34-address-podman.md](34-address-podman.md)

#### NSPAWN - systemd-nspawn Containers
- **Location**: `extras/addresses/nspawn-address/nspawn-address.js`
- **Purpose**: Lightweight OS containers using systemd-nspawn
- **Capabilities**:
  - Lightweight container execution
  - Full OS containers (not just processes)
  - systemd integration
  - Resource limits and cgroups
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/nspawn-address/nspawn-address.js"
  ADDRESS NSPAWN
  "create name=debian-container template=debian"
  "start name=debian-container"
  "exec container=debian-container command='apt update'"
  ```
- **Documentation**: See [35-address-nspawn.md](35-address-nspawn.md)

#### FIRECRACKER - MicroVMs
- **Location**: `extras/addresses/firecracker-address/firecracker-address.js`
- **Purpose**: AWS Firecracker microVM management
- **Capabilities**:
  - Lightweight microVMs (millisecond boot times)
  - Secure isolation (KVM-based)
  - Minimal memory footprint
  - Serverless-style VM execution
- **Documentation**: See [36-address-firecracker.md](36-address-firecracker.md)

### Extra ADDRESS Handlers - Virtual Machine Management

These handlers manage full virtual machines:

#### QEMU - QEMU/KVM Virtualization
- **Location**: `extras/addresses/qemu-address/qemu-address.js`
- **Purpose**: Production virtualization with QEMU/KVM and Guest Agent
- **Capabilities**:
  - Full VM lifecycle (create, start, stop, pause, resume)
  - **Guest Agent integration** - Execute commands without SSH
  - Three execution methods: Guest Agent → SSH fallback → Serial console
  - ISO management and installation
  - Snapshot and state save/restore
  - Network configuration
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/qemu-address/qemu-address.js"
  ADDRESS QEMU
  "create image=debian.qcow2 name=ci-vm memory=4G cpus=4"
  "install_guest_agent name=ci-vm"
  "execute vm=ci-vm command='apt update'"  -- Via guest agent!
  "save_state name=ci-vm file=ci-vm.state"
  ```
- **Documentation**: See [37-address-qemu.md](37-address-qemu.md)

#### VIRTUALBOX - VirtualBox Management
- **Location**: `extras/addresses/virtualbox-address/virtualbox-address.js`
- **Purpose**: VirtualBox VM management with Guest Additions
- **Capabilities**:
  - Desktop/development VM management
  - **Guest Additions integration** - Execute commands without SSH
  - Full lifecycle: create, start, stop, pause, resume, snapshot
  - ISO management and mounting
  - Network configuration (NAT, bridged, host-only)
  - Shared folders between host and guest
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/virtualbox-address/virtualbox-address.js"
  ADDRESS VIRTUALBOX
  "create template=Ubuntu name=dev-vm memory=2048"
  "start_if_stopped name=dev-vm"
  "install_guest_additions name=dev-vm"
  "execute vm=dev-vm command='./run-tests.sh'"
  ```
- **Documentation**: See [38-address-virtualbox.md](38-address-virtualbox.md)

#### LXD - LXD Container/VM Management
- **Location**: `extras/addresses/lxd-address/lxd-address.js`
- **Purpose**: Canonical LXD system containers and VMs
- **Capabilities**:
  - Both containers and VMs in one system
  - Copy-on-write storage (ZFS, btrfs)
  - Live migration
  - Clustering support
- **Documentation**: See [39-address-lxd.md](39-address-lxd.md)

### Extra ADDRESS Handlers - Cloud & Serverless

These handlers integrate with cloud platforms and serverless systems:

#### GCP - Google Cloud Platform
- **Location**: `extras/addresses/gcp-address/gcp-address.js`
- **Purpose**: Comprehensive Google Cloud Platform orchestration
- **Killer Feature**: Direct Google Sheets access with SQL-like queries
- **Services Supported**:
  - **Sheets**: Treat spreadsheets as databases with SELECT, INSERT, UPDATE
  - **BigQuery**: Data warehouse queries and management
  - **Firestore**: NoSQL document database operations
  - **Cloud Storage**: Bucket and blob management
  - **Pub/Sub**: Message queue publishing and subscriptions
  - **Cloud Functions**: Serverless function deployment (Gen 2)
  - **Cloud Run**: Container-based serverless services
  - **Compute Engine**: VM management
  - **GKE**: Kubernetes cluster operations
  - **Cloud SQL**: Managed database operations
  - **And 20+ more services**
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/gcp-address/gcp-address.js"
  ADDRESS GCP
  -- Treat Google Sheets as a database!
  "SHEET 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms SELECT * FROM 'Sales' WHERE amount > 1000"

  -- Load into BigQuery
  "BIGQUERY INSERT INTO analytics.sales SELECT * FROM SHEETS_RESULT"

  -- Store metrics
  "FIRESTORE SET /metrics/today {orders: 342, revenue: 125000}"

  -- Notify subscribers
  "PUBSUB PUBLISH daily-metrics MESSAGE 'Report ready'"
  ```
- **Documentation**: See [40-address-gcp.md](40-address-gcp.md)

#### LAMBDA - AWS Lambda Functions
- **Location**: `extras/addresses/google-cloud-platform/address-lambda.js`
- **Purpose**: AWS Lambda serverless function management
- **Capabilities**:
  - Function deployment and invocation
  - Environment variable configuration
  - Layer management
  - Trigger configuration (API Gateway, S3, etc.)
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/google-cloud-platform/address-lambda.js"
  ADDRESS LAMBDA
  "deploy function=my-function runtime=nodejs18.x handler=index.handler source=./dist"
  "invoke function=my-function payload='{\"key\": \"value\"}'"
  ```
- **Documentation**: See [41-address-lambda.md](41-address-lambda.md)

#### OPENFAAS - OpenFaaS Serverless
- **Location**: `extras/addresses/google-cloud-platform/address-openfaas.js`
- **Purpose**: OpenFaaS function management (self-hosted serverless)
- **Capabilities**:
  - Deploy functions to OpenFaaS gateway
  - Invoke functions with payloads
  - Scale functions based on load
  - Monitor function metrics
- **Documentation**: See [42-address-openfaas.md](42-address-openfaas.md)

#### PROXMOX - Proxmox VE Management
- **Location**: `extras/addresses/google-cloud-platform/address-proxmox.js`
- **Purpose**: Proxmox Virtual Environment management
- **Capabilities**:
  - VM and container management
  - Cluster operations
  - Storage management
  - Backup and restore
- **Documentation**: See [43-address-proxmox.md](43-address-proxmox.md)

#### SSH - Remote Command Execution
- **Location**: `extras/addresses/google-cloud-platform/address-ssh.js`
- **Purpose**: Execute commands on remote systems via SSH
- **Capabilities**:
  - SSH command execution
  - File transfer (SCP/SFTP)
  - Port forwarding
  - Key-based authentication
- **Documentation**: See [44-address-ssh.md](44-address-ssh.md)

### Extra ADDRESS Handlers - Data & AI

These handlers integrate with databases and AI services:

#### DUCKDB - DuckDB Analytical Database
- **Location**: `extras/addresses/duckdb-address/src/duckdb-address.js`
- **Purpose**: High-performance analytical SQL database (Node.js)
- **Capabilities**:
  - Fast analytical queries on large datasets
  - Parquet file support
  - CSV import/export
  - In-process database (no server needed)
  - Compatible with PostgreSQL syntax
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/duckdb-address/src/duckdb-address.js"
  ADDRESS DUCKDB
  "CREATE TABLE sales AS SELECT * FROM read_parquet('sales.parquet')"
  "SELECT product, SUM(amount) FROM sales GROUP BY product"
  ```
- **Documentation**: See [45-address-duckdb.md](45-address-duckdb.md)

#### DUCKDB_WASM - DuckDB for Browser
- **Location**: `extras/addresses/duckdb-wasm-address/src/duckdb-wasm-address.js`
- **Purpose**: DuckDB compiled to WebAssembly for browser environments
- **Capabilities**:
  - Same features as DuckDB but runs in browser
  - Client-side data analysis
  - No server needed for queries
- **Documentation**: See [46-address-duckdb-wasm.md](46-address-duckdb-wasm.md)

#### CLAUDE - Anthropic Claude AI
- **Location**: `extras/addresses/anthropic-ai/claude/src/claude-address.js`
- **Purpose**: Integration with Claude AI models
- **Capabilities**:
  - Send prompts to Claude API
  - Stream responses
  - Multi-turn conversations
  - Function calling (tool use)
- **Example**:
  ```rexx
  REQUIRE "root:extras/addresses/anthropic-ai/claude/src/claude-address.js"
  ADDRESS CLAUDE
  "prompt text='Explain quantum computing in simple terms'"
  SAY RESULT  -- Claude's response
  ```
- **Documentation**: See [47-address-claude.md](47-address-claude.md)

#### GEMINI - Google Gemini AI
- **Location**: `extras/addresses/gemini-address/src/gemini-address.js`
- **Purpose**: Integration with Google Gemini AI models
- **Capabilities**:
  - Text generation
  - Multimodal inputs (text + images)
  - Function calling
  - Chat conversations
- **Documentation**: See [48-address-gemini.md](48-address-gemini.md)

## Summary Table

| ADDRESS Target | Type | Environment | Key Feature |
|---------------|------|-------------|-------------|
| **Remote HTTP** | Core | All | Remote endpoints via HTTP |
| **SYSTEM** | Core | Node.js | Shell commands |
| **SQL** | Core | Node.js | SQLite database |
| **EXPECTATIONS** | Core | All | Test assertions |
| **TEST_FRAMEWORK** | Core | All | Test management |
| **ECHO** | Core | All | Testing/examples |
| **DOCKER** | Container | Node.js | Docker lifecycle |
| **PODMAN** | Container | Node.js | Rootless containers |
| **NSPAWN** | Container | Node.js | systemd containers |
| **FIRECRACKER** | Container | Node.js | MicroVMs |
| **QEMU** | VM | Node.js | Guest Agent exec |
| **VIRTUALBOX** | VM | Node.js | Guest Additions |
| **LXD** | VM/Container | Node.js | System containers |
| **GCP** | Cloud | Node.js | Sheets as database |
| **LAMBDA** | Serverless | Node.js | AWS functions |
| **OPENFAAS** | Serverless | Node.js | Self-hosted functions |
| **PROXMOX** | Cloud | Node.js | Proxmox VE |
| **SSH** | Remote | Node.js | Remote execution |
| **DUCKDB** | Database | Node.js | Analytical SQL |
| **DUCKDB_WASM** | Database | Browser | Client-side SQL |
| **CLAUDE** | AI | All | Claude AI |
| **GEMINI** | AI | All | Gemini AI |

## Creating Custom ADDRESS Handlers

You can create your own ADDRESS handlers using the REQUIRE system:

```javascript
// my-custom-address.js
module.exports = {
  metadata: {
    name: 'MYAPP',
    version: '1.0.0',
    description: 'My application ADDRESS handler'
  },

  // Handler function receives (command, params, context)
  handler: async function(command, params, context) {
    // command: the method/operation name
    // params: parsed parameters {param1: value1, ...}
    // context: REXX variable context

    // Execute your logic
    const result = await myAppAPI.execute(command, params);

    // Return result (sets RESULT variable)
    // Throw error to set RC to non-zero
    return result;
  },

  // Optional: list of available methods
  methods: ['start', 'stop', 'status', 'configure']
};
```

```rexx
-- Use custom handler
REQUIRE "./my-custom-address.js"
ADDRESS MYAPP
"start server=web port=8080"
LET status = status server=web
```

## Best Practices

### 1. Check Return Codes

Always check RC after ADDRESS operations:

```rexx
ADDRESS DOCKER
"start name=mycontainer"
IF RC \= 0 THEN DO
  SAY "Failed to start container: " || RESULT
  EXIT RC
END
```

### 2. Use HEREDOC for Complex Commands

For multi-line commands or commands with special characters:

```rexx
ADDRESS SQL
LET query = <<SQL
  SELECT u.name, COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.created_at > '2024-01-01'
  GROUP BY u.name
  ORDER BY order_count DESC
SQL
execute sql=query
```

### 3. Save and Restore ADDRESS Context

When temporarily switching ADDRESS:

```rexx
LET saved = ADDRESS()
ADDRESS SYSTEM
"ls -la"
ADDRESS VALUE saved  -- Restore previous
```

### 4. Handle Errors with SIGNAL ON ERROR

```rexx
SIGNAL ON ERROR NAME HandleAddressError

ADDRESS DOCKER
"start name=container-that-might-not-exist"

EXIT

HandleAddressError:
  SAY "ADDRESS operation failed with RC=" || RC
  SAY "Error: " || RESULT
  EXIT RC
```

## Performance Considerations

1. **Minimize ADDRESS Switching**: Each ADDRESS switch has overhead
2. **Batch Operations**: Group related commands in one ADDRESS context
3. **Async Operations**: Most ADDRESS handlers are async-capable
4. **Resource Cleanup**: Always clean up resources (stop containers, close connections)

## Security Considerations

1. **Validate Input**: Always validate user input before passing to ADDRESS commands
2. **Least Privilege**: Run with minimum necessary permissions
3. **Secure Credentials**: Never hardcode credentials in scripts
4. **Audit Logging**: Many ADDRESS handlers support audit logging
5. **Sandbox Mode**: Use interpreter security restrictions when running untrusted scripts

## Next Steps

- Explore individual ADDRESS handler documentation (28-48)
- Review [REQUIRE system documentation](51-require-system.md) for loading handlers
- Check [error handling guide](06-error-handling.md) for robust ADDRESS usage
- See [HEREDOC documentation](08-heredoc.md) for complex command construction
