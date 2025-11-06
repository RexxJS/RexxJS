# Remote Docker ADDRESS Library for RexxJS

This library provides remote Docker management for RexxJS through the ADDRESS mechanism, enabling REXX programs to control Docker containers running on remote hosts via SSH or Docker API.

## Installation

**Requirements:**
- Remote host with Docker installed and running
- SSH access to remote host (SSH mode) OR Docker API exposed (direct mode)
- `ssh2` npm package for SSH mode

```bash
npm install ssh2  # For SSH-based connections
```

## Quick Start

### SSH-Based Remote Connection

```rexx
REQUIRE "./extras/addresses/remote-docker-address/remote-docker-address.js"

ADDRESS REMOTE_DOCKER
"connect host='docker.example.com' user='ubuntu' key_file='~/.ssh/docker-key.pem'"
"create image=debian:stable name=test-container"
"start name=test-container"
```

### Direct API Connection

```rexx
ADDRESS REMOTE_DOCKER
"connect host='192.168.1.100' port=2375 mode='api'"
"create image=debian:stable name=test-container"
```

## Core Methods

### `connect host="<host>" user="<user>" key_file="<path>"`
Establish connection to remote Docker host.

**Parameters:**
- `host` (string, required) - Remote host address
- `user` (string, optional) - SSH username (default: docker)
- `key_file` (string, optional) - SSH private key path
- `password` (string, optional) - SSH password (less secure)
- `port` (number, optional) - SSH port (default: 22)
- `mode` (string, optional) - 'ssh' (default) or 'api'
- `timeout` (number, optional) - Connection timeout (default: 30)

**Returns:**
- `success` (boolean) - Connection established
- `connection_id` (string) - Unique connection identifier
- `docker_version` (string) - Remote Docker version
- `os_type` (string) - Remote OS type

### `create image="<image>" name="<name>"`
Create container on remote host.

**Parameters:**
- `image` (string, required) - Docker image
- `name` (string, required) - Container name
- `memory` (string, optional) - Memory limit
- `cpus` (string, optional) - CPU limit
- `environment` (string, optional) - Environment variables
- `volumes` (string, optional) - Volume mounts
- `ports` (string, optional) - Port mappings

**Returns:**
- `success` (boolean) - Container created
- `container_id` (string) - Container ID
- `name` (string) - Container name

### `execute name="<container>" command="<cmd>"`
Run command in remote container.

**Parameters:**
- `name` (string, required) - Container name
- `command` (string, required) - Command to execute
- `timeout` (number, optional) - Execution timeout (default: 30)

**Returns:**
- `success` (boolean) - Command executed
- `exitCode` (number) - Command exit code
- `stdout` (string) - Command output
- `stderr` (string) - Error output

### Manage Containers
- `list` - List all containers on remote host
- `start name="<name>"` - Start container
- `stop name="<name>"` - Stop container
- `delete name="<name>"` - Remove container
- `logs name="<name>"` - Get container logs
- `status` - Get Docker daemon status

## Usage Examples

### Remote Development Container

```rexx
ADDRESS REMOTE_DOCKER
"connect host='dev.example.com' user='developer' key_file='~/.ssh/dev-key.pem'"
"create image=node:20 name=dev-environment ports='3000:3000' volumes='/home/dev/projects:/app'"
"start name=dev-environment"
"execute name=dev-environment command='npm install'"
```

### Multi-Host Deployment

```rexx
hosts = ARRAY(
  'docker1.example.com',
  'docker2.example.com',
  'docker3.example.com'
)

DO host OVER hosts
  ADDRESS REMOTE_DOCKER
  "connect host='" || host || "' user='deploy' key_file='~/.ssh/deploy-key.pem'"
  "create image=myapp:1.0 name=app-" || STRIP(host, '.')
  "start name=app-" || STRIP(host, '.')

  SAY "Deployed to " || host
END
```

### Container Migration

```rexx
-- Backup from source
ADDRESS REMOTE_DOCKER
"connect host='source-host' user='docker' key_file='~/.ssh/docker-key'"
"execute name=production command='docker export myapp > /tmp/myapp.tar'"
"execute name=production command='tar -czf /tmp/myapp.tar.gz /tmp/myapp.tar'"

-- Transfer and restore on target
ADDRESS REMOTE_DOCKER
"connect host='target-host' user='docker' key_file='~/.ssh/docker-key'"
"execute name=loader command='cd /tmp && tar -xzf myapp.tar.gz'"
"create image=myapp name=production"
"start name=production"
```

### Health Monitoring

```rexx
hosts = ARRAY('web1', 'web2', 'web3')

DO host OVER hosts
  ADDRESS REMOTE_DOCKER
  "connect host='" || host || ":2375' mode='api'"
  "status"

  running = RESULT.container_count.running
  SAY host || " has " || running || " running containers"

  IF running = 0 THEN
    SAY "WARNING: No containers running on " || host
  END
END
```

### Log Aggregation

```rexx
containers = ARRAY('app-1', 'app-2', 'api-1', 'cache')

DO container OVER containers
  ADDRESS REMOTE_DOCKER
  "connect host='prod-server' user='ops' key_file='~/.ssh/ops-key'"
  "logs name='" || container || "' lines=100"

  SAY "=== " || container || " ==="
  SAY RESULT.logs
  SAY ""
END
```

## SSH Configuration

### Using SSH Key

```bash
# Generate SSH key
ssh-keygen -t rsa -N "" -f ~/.ssh/docker-key

# Copy to remote host
ssh-copy-id -i ~/.ssh/docker-key.pub ubuntu@docker.example.com
```

### Using SSH Agent

```rexx
ADDRESS REMOTE_DOCKER
"connect host='docker.example.com' user='docker' use_agent=true"
```

## Docker API Configuration

### Enable Remote API

```bash
# Edit Docker daemon config
sudo vi /etc/docker/daemon.json

# Add:
{
  "hosts": ["unix:///var/run/docker.sock", "tcp://0.0.0.0:2375"]
}

# Restart Docker
sudo systemctl restart docker
```

## Security Considerations

### ✅ Secure Approaches:
- Use SSH with key-based authentication
- Keep private keys secure (mode 600)
- Use SSH agent for key management
- Bind API to specific IPs
- Use TLS/cert authentication for Docker API

### ❌ Avoid:
- Hard-coding credentials
- Using SSH passwords
- Exposing Docker API without TLS
- Running commands with elevated privileges unnecessarily

## Error Handling

```rexx
ADDRESS REMOTE_DOCKER
LET result = connect host='docker.example.com' user='docker'

IF result.success THEN
  SAY "✓ Connected to " || result.docker_version
ELSE IF result.connection_refused THEN
  SAY "❌ Connection refused - Docker not running?"
ELSE IF result.authentication_failed THEN
  SAY "❌ Authentication failed - check credentials"
ELSE
  SAY "❌ Error: " || result.error
```

## Performance Tips

1. **Batch Operations**: Execute multiple commands per connection
2. **Connection Reuse**: Keep connection open for multiple operations
3. **Timeouts**: Set reasonable timeouts for slow networks
4. **Resource Limits**: Limit containers to prevent host overload

## Integration with Other Handlers

### With Local Docker

```rexx
REQUIRE "./extras/addresses/docker-address/docker-address.js"
REQUIRE "./extras/addresses/remote-docker-address/remote-docker-address.js"

-- Local container
ADDRESS DOCKER
"create image=debian name=local-test"

-- Remote container
ADDRESS REMOTE_DOCKER
"connect host='remote.example.com' user='docker'"
"create image=debian name=remote-test"
```

### With System Commands

```rexx
REQUIRE "./extras/addresses/system/system-address.js"
REQUIRE "./extras/addresses/remote-docker-address/remote-docker-address.js"

-- Prepare data locally
ADDRESS SYSTEM
"mkdir /tmp/deploy && cp app.tar /tmp/deploy/"

-- Deploy remotely
ADDRESS REMOTE_DOCKER
"connect host='prod' user='deploy'"
"execute command='cd /tmp/deploy && tar -xf app.tar && ./install.sh'"
```

## Best Practices

### ✅ Do:
- Use SSH keys instead of passwords
- Keep connections open for batch operations
- Implement error handling for network failures
- Monitor remote container health
- Use specific image versions, not latest

### ❌ Don't:
- Expose Docker API without TLS
- Store credentials in scripts
- Run containers as root unnecessarily
- Ignore security warnings
- Mix production and development containers

---

**Part of the RexxJS extras collection** - managing remote Docker infrastructure from REXX programs.
