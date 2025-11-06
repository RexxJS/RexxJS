# Docker ADDRESS Library for RexxJS

This library provides Docker container operations for RexxJS through the ADDRESS mechanism, allowing REXX programs to create, manage, and interact with Docker containers.

## Installation

**Requirements:**
- Docker must be installed and running
- Docker daemon must be accessible

```bash
# Verify Docker is installed
docker --version

# Start Docker daemon if needed
docker daemon
```

## Quick Start

### Basic Container Operations

```rexx
REQUIRE "./extras/addresses/docker-address/docker-address.js"

ADDRESS DOCKER
"create image=debian:stable name=my-container"
"start name=my-container"
"execute name=my-container command='echo Hello from Docker'"
"logs name=my-container"
"stop name=my-container"
"delete name=my-container"
```

## Core Methods

### `create image="<image>" name="<container-name>"`
Create a new Docker container.

**Parameters:**
- `image` (string, required) - Docker image to use
- `name` (string, required) - Container name
- `memory` (string, optional) - Memory limit (e.g., "1g", "512m")
- `cpus` (string, optional) - CPU limit (e.g., "1.5")
- `environment` (string, optional) - Environment variables
- `volumes` (string, optional) - Volume mounts
- `ports` (string, optional) - Port mappings
- `interactive` (boolean, optional) - Interactive mode

**Returns:**
- `success` (boolean) - Container created successfully
- `container` (string) - Container ID
- `name` (string) - Container name

### `start name="<container-name>"`
Start a stopped container.

**Returns:**
- `success` (boolean) - Start successful
- `container` (string) - Container name

### `stop name="<container-name>"`
Stop a running container.

**Returns:**
- `success` (boolean) - Stop successful
- `container` (string) - Container name

### `delete name="<container-name>"`
Remove a container.

**Returns:**
- `success` (boolean) - Deletion successful
- `container` (string) - Container name

### `execute name="<container>" command="<command>"`
Run a command in a container.

**Returns:**
- `success` (boolean) - Execution successful
- `exitCode` (number) - Command exit code
- `stdout` (string) - Command output
- `stderr` (string) - Error output

### `logs name="<container>" lines="<count>"`
Get container logs.

**Returns:**
- `success` (boolean) - Retrieval successful
- `logs` (string) - Log output
- `lines` (number) - Number of lines

### `list`
List all containers.

**Returns:**
- `success` (boolean) - Operation successful
- `containers` (array) - Array of container objects
- `count` (number) - Number of containers

### `status`
Get Docker daemon status.

**Returns:**
- `success` (boolean) - Status available
- `running` (number) - Running containers count
- `paused` (number) - Paused containers count
- `stopped` (number) - Stopped containers count

## Usage Examples

### Running a Web Server

```rexx
ADDRESS DOCKER
"create image=nginx name=webserver ports='8080:80' memory='512m'"
"start name=webserver"
"logs name=webserver lines=20"
SAY "Web server started at http://localhost:8080"
```

### Data Processing Pipeline

```rexx
ADDRESS DOCKER
"create image=debian:stable name=worker environment='TASK_ID=12345' memory='1g'"
"start name=worker"
"execute name=worker command='apt-get update && apt-get install -y python3'"
"execute name=worker command='python3 /process/data.py'"
LET result = execute name=worker command='cat /output/result.json'
SAY "Result: " || result.stdout
```

### Container Cleanup

```rexx
ADDRESS DOCKER
"list"

-- Process list and stop containers
DO container OVER RESULT.containers
  IF container.state = 'running' THEN
    "stop name=" || container.name
  "delete name=" || container.name
END
```

## Security Considerations

- **Privileged Containers**: Use with caution - can access host system
- **Volume Mounts**: Be careful with host directory access
- **Environment Variables**: Don't pass sensitive data directly
- **Network Isolation**: Use default networks or custom networks

### Best Practices

```rexx
-- ✅ Good: Limited resource allocation
"create image=debian name=safe memory='512m' cpus='0.5'"

-- ✅ Good: Specific volume paths
"create image=debian name=safe volumes='/tmp/data:/data'"

-- ❌ Avoid: Privileged with full host access
"create image=debian name=risky privileged=true"
```

## Integration with Other ADDRESS Handlers

Combine with system operations:

```rexx
REQUIRE "./extras/addresses/system/system-address.js"
REQUIRE "./extras/addresses/docker-address/docker-address.js"

ADDRESS DOCKER
"create image=ubuntu name=builder memory='2g'"
"start name=builder"
"execute name=builder command='apt-get install -y build-essential'"

ADDRESS SYSTEM
"mkdir /project/output"
```

## Performance Tips

1. **Use smaller images**: Alpine Linux is lighter than full Ubuntu
2. **Cache frequently used containers**: Create snapshots for reuse
3. **Limit resource usage**: Set memory and CPU limits
4. **Clean up regularly**: Remove unused containers and images

## Troubleshooting

### Cannot connect to Docker daemon
```bash
# Check if Docker is running
docker ps

# Restart Docker daemon
systemctl restart docker
```

### Container fails to start
```rexx
ADDRESS DOCKER
LET result = create image=myimage name=test
IF result.success = false THEN
  SAY "Create failed: " || result.error
```

### Out of disk space
```bash
docker system prune  -- Remove unused containers and images
```

## Supported Images

- `debian:stable`, `debian:latest`
- `ubuntu:latest`, `ubuntu:22.04`
- `alpine:latest`
- `centos:latest`
- `python:3.11`, `node:20`
- Custom images from Docker Hub

---

**Part of the RexxJS extras collection** - bringing container management to REXX programs with clean, readable syntax.
