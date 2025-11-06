# Remote Deployment System

A comprehensive system for remote script execution and container management in RexxJS, enabling seamless deployment and execution of Rexx scripts across distributed environments.

**Implementation Location**: The remote deployment handlers are located in `extras/addresses/system/` alongside the existing system address handler.

## Architecture Overview

```
┌─────────────────┐    Deploy &     ┌─────────────────┐
│   Main RexxJS   │    Execute      │  Remote Target  │
│    Process      │ ──────────────► │ (Container/VM)  │
│  (Director)     │                 │                 │
│                 │ ◄────────────── │   RexxJS        │
└─────────────────┘   CHECKPOINT    │   Binary        │
                      Progress      │   (Worker)      │
                                    └─────────────────┘
```

**Key Components:**
- **Director**: Main RexxJS process orchestrating deployment
- **Worker**: Remote RexxJS instance executing scripts
- **Control Bus**: CHECKPOINT-based progress communication
- **Deployment Handlers**: Container and remote shell management

## Address Handlers

### 1. Remote Shell Handler (`remote_shell`)

Provides secure SSH-based remote execution capabilities.

#### Basic Connection
```rexx
ADDRESS remote_shell
connect host="server.example.com" user="admin" key="~/.ssh/id_rsa" alias="main"
```

#### Command Execution
```rexx
execute command="ls -la /var/log" connection="main"
execute command="ps aux | grep rexx" timeout=30000
```

#### File Operations
```rexx
upload local="./script.rexx" remote="/tmp/script.rexx" connection="main"
download remote="/tmp/output.txt" local="./output.txt" connection="main"
```

#### Security Configuration
```rexx
-- Initialize with security settings
ADDRESS remote_shell
initialize security_mode="strict" allowed_hosts="server1.com,server2.com"
```

### 2. Container Handler (`container`)

Manages containerized execution environments using podman/docker.

#### Container Creation
```rexx
ADDRESS container
create image="debian:stable" name="rexx-worker" interactive=false

-- Capture container ID for subsequent operations
LET container_info = RESULT
LET container_id = container_info.containerId
LET container_status = container_info.status

SAY "Created container: " || container_id || " (status: " || container_status || ")"
```

#### RexxJS Deployment
```rexx
deploy_rexx container="rexx-worker" rexx_binary="./rexx-linux-x64" target_path="/usr/local/bin/rexx"
```

#### Script Execution
```rexx
execute_rexx container="rexx-worker" script="SAY 'Hello from container!'"

-- Access execution results
LET exec_result = RESULT
LET exit_code = exec_result.exitCode
LET output = exec_result.output

IF exit_code = 0 THEN
  SAY "Execution successful: " || output
ELSE
  SAY "Execution failed with code " || exit_code
```

#### Container Management
```rexx
-- List all containers and examine results
list
LET container_list = RESULT
SAY "Found " || container_list.count || " containers"
DO i = 1 TO container_list.containers.0
  LET container = container_list.containers.i
  SAY "  " || container.name || " (" || container.status || ")"
END

-- Get logs with result handling
logs container="rexx-worker" lines=50
LET log_result = RESULT
SAY "Last " || log_result.lines || " log lines:"
SAY log_result.content

-- Stop and remove with status checking
stop container="rexx-worker"
LET stop_result = RESULT
IF stop_result.success THEN
  SAY "Container stopped successfully"
END

remove container="rexx-worker" force=true
cleanup all=true                 -- Remove all stopped containers
```

### 3. Deployment Handler (`deployment`)

High-level orchestration combining remote shell and container operations.

#### Container-Based Deployment
```rexx
ADDRESS deployment
setup_container image="debian:stable" name="worker1" rexx_binary="./rexx-linux-x64"

-- Capture deployment details
LET deployment_result = RESULT
LET worker_id = deployment_result.containerName
LET worker_status = deployment_result.status

SAY "Worker " || worker_id || " is " || worker_status
```

#### Remote Shell Deployment
```rexx
setup_remote_shell host="server.com" user="admin" key="~/.ssh/id_rsa" alias="server1"
```

#### Script Execution with Progress
```rexx
execute_remote script="data-processing.rexx" target="worker1" progress=true

-- Monitor execution progress
LET exec_result = RESULT
IF exec_result.success THEN DO
  SAY "Execution completed successfully"
  SAY "Exit code: " || exec_result.exitCode
  SAY "Duration: " || exec_result.duration || "ms"
  
  -- Access progress checkpoints if available
  IF exec_result.checkpoints.0 > 0 THEN DO
    SAY "Progress checkpoints received:"
    DO i = 1 TO exec_result.checkpoints.0
      LET checkpoint = exec_result.checkpoints.i
      SAY "  " || checkpoint.event || ": " || checkpoint.message
    END
  END
END
```

#### Chained Operations Example
```rexx
-- Create container and use its ID for subsequent operations
ADDRESS container
create image="debian:stable" name="data-processor" interactive=false

LET create_result = RESULT
LET container_id = create_result.containerId

-- Deploy RexxJS to the specific container
deploy_rexx container=container_id rexx_binary="./rexx-linux-x64"

LET deploy_result = RESULT
IF deploy_result.success THEN DO
  SAY "RexxJS deployed to " || container_id
  
  -- Execute script using the container ID
  execute_rexx container=container_id script="SAY 'Processing data...'; LET result = 42; SAY 'Result: ' || result"
  
  LET exec_result = RESULT
  SAY "Script execution: " || exec_result.output
  
  -- Get container logs
  logs container=container_id lines=10
  LET log_result = RESULT
  SAY "Recent logs: " || log_result.content
END
```

#### One-Shot Deployment
```rexx
deploy_and_execute script="analysis.rexx" image="debian:stable" progress=true

-- Access one-shot results
LET oneshot_result = RESULT
SAY "One-shot deployment " || oneshot_result.status
SAY "Temporary container: " || oneshot_result.temporaryContainerId
SAY "Execution output: " || oneshot_result.output
SAY "Cleanup status: " || oneshot_result.cleanupStatus
```

## Progress Monitoring with CHECKPOINT

The deployment system supports real-time progress monitoring using the CHECKPOINT function from the control bus architecture.

### Worker Script with Progress
```rexx
-- This script runs in the remote container/host
SAY "Starting data processing..."
CHECKPOINT("started", "Data processing initiated")

LET total_records = 1000
DO i = 1 TO total_records
  -- Process record
  LET result = processRecord(i)
  
  -- Report progress every 100 records
  IF i // 100 = 0 THEN DO
    CHECKPOINT("progress", i, total_records)
    SAY "Processed " || i || " of " || total_records || " records"
  END
END

CHECKPOINT("completed", "Processing finished successfully")
```

### Director Receiving Progress
```rexx
-- Main script monitoring remote execution
ADDRESS deployment
execute_remote script="worker-script.rexx" target="worker1" progress=true

-- Progress updates are automatically logged and can trigger callbacks
```

## Security Features

### Remote Shell Security
```rexx
-- Strict mode: only pre-approved hosts and keys
ADDRESS remote_shell
initialize security_mode="strict" 
  allowed_hosts="trusted1.com,trusted2.com"
  trusted_key_paths="/home/user/.ssh/approved_key"

-- Moderate mode: allow common patterns
initialize security_mode="moderate"

-- Permissive mode: allow all (development only)
initialize security_mode="permissive"
```

### Container Security
```rexx
-- Resource limits and security constraints
ADDRESS container
initialize security_mode="moderate"
  allowed_images="debian:stable,ubuntu:latest"
  max_containers=10
  resource_limits="memory=512m,cpus=1.0"
```

## Complete Workflow Examples

### Data Processing Pipeline
```rexx
#!/usr/bin/env rexx
/*
 * Distributed Data Processing Example
 */

SAY "🚀 Starting distributed data processing..."

/* Setup multiple workers */
ADDRESS deployment

-- Container worker for heavy computation
setup_container image="debian:stable" name="compute-worker" 
  rexx_binary="./rexx-linux-x64"

-- Remote worker for data storage
setup_remote_shell host="storage.example.com" user="dataops" 
  key="~/.ssh/storage_key" alias="storage-server"

/* Distribute work */
LET compute_script = "
  SAY 'Performing complex calculations...'
  CHECKPOINT('compute_start', 'Beginning computation phase')
  
  LET results.0 = 0
  DO i = 1 TO 1000
    LET result = i * i + SQRT(i)
    LET results.0 = results.0 + 1
    LET results.i = result
    
    IF i // 100 = 0 THEN
      CHECKPOINT('compute_progress', i, 1000)
  END
  
  CHECKPOINT('compute_complete', results.0, 'computations finished')
"

LET storage_script = "
  SAY 'Preparing data storage...'
  CHECKPOINT('storage_start', 'Initializing storage systems')
  
  /* Create directories */
  SYSTEM('mkdir -p /data/processed')
  SYSTEM('mkdir -p /data/backup')
  
  CHECKPOINT('storage_ready', 'Storage systems ready')
"

-- Execute in parallel
execute_remote script=compute_script target="compute-worker" progress=true
execute_remote script=storage_script target="storage-server" progress=true

SAY "✅ Distributed processing completed!"

-- Cleanup
cleanup_deployment target="compute-worker"
cleanup_deployment target="storage-server"
```

### CI/CD Pipeline Integration
```rexx
#!/usr/bin/env rexx
/*
 * Continuous Integration Pipeline
 */

SAY "🔧 Starting CI/CD pipeline..."

ADDRESS deployment

-- Build RexxJS binary for target platform
build_and_deploy target="linux-x64" deploy_to="container" 
  image="debian:stable" name="ci-builder"

-- Run test suite
LET test_script = "
  SAY 'Running test suite...'
  CHECKPOINT('tests_start', 'Beginning test execution')
  
  /* Run different test categories */
  LET test_categories.1 = 'unit-tests'
  LET test_categories.2 = 'integration-tests'  
  LET test_categories.3 = 'performance-tests'
  LET test_categories.0 = 3
  
  LET passed = 0
  LET failed = 0
  
  DO i = 1 TO test_categories.0
    LET category = test_categories.i
    SAY 'Running ' || category || '...'
    
    /* Simulate test execution */
    LET result = RANDOM(0, 1)  -- 50/50 pass/fail for demo
    
    IF result = 1 THEN DO
      LET passed = passed + 1
      SAY '✅ ' || category || ' PASSED'
    END
    ELSE DO
      LET failed = failed + 1
      SAY '❌ ' || category || ' FAILED'
    END
    
    CHECKPOINT('test_category_complete', category, result)
  END
  
  CHECKPOINT('tests_complete', passed, failed)
  SAY 'Test results: ' || passed || ' passed, ' || failed || ' failed'
"

execute_remote script=test_script target="ci-builder" progress=true

-- Deploy if tests pass
monitor_deployment target="ci-builder"

SAY "✅ CI/CD pipeline completed!"
```

### Multi-Environment Deployment
```rexx
#!/usr/bin/env rexx
/*
 * Multi-Environment Deployment Strategy
 */

SAY "🌍 Deploying to multiple environments..."

ADDRESS deployment

-- Development environment (local container)
setup_container image="debian:stable" name="dev-env"

-- Staging environment (remote server)  
setup_remote_shell host="staging.example.com" user="deploy" 
  key="~/.ssh/staging_key" alias="staging"

-- Production environment (remote server)
setup_remote_shell host="prod.example.com" user="deploy"
  key="~/.ssh/prod_key" alias="production"

LET deploy_script = "
  SAY 'Deploying application to ' || ENVIRONMENT || '...'
  CHECKPOINT('deploy_start', ENVIRONMENT, 'Deployment initiated')
  
  /* Environment-specific configuration */
  SELECT
    WHEN ENVIRONMENT = 'development' THEN DO
      SAY 'Setting up development configuration'
      LET debug_mode = 'true'
      LET log_level = 'debug'
    END
    
    WHEN ENVIRONMENT = 'staging' THEN DO
      SAY 'Setting up staging configuration'  
      LET debug_mode = 'false'
      LET log_level = 'info'
    END
    
    WHEN ENVIRONMENT = 'production' THEN DO
      SAY 'Setting up production configuration'
      LET debug_mode = 'false'
      LET log_level = 'warn'
    END
  END
  
  CHECKPOINT('config_complete', ENVIRONMENT, debug_mode, log_level)
  
  /* Simulate deployment steps */
  SAY 'Installing application...'
  CHECKPOINT('install_start', ENVIRONMENT)
  
  SAY 'Configuring services...'
  CHECKPOINT('configure_start', ENVIRONMENT)
  
  SAY 'Starting services...'
  CHECKPOINT('startup_start', ENVIRONMENT)
  
  CHECKPOINT('deploy_complete', ENVIRONMENT, 'Deployment successful')
"

-- Deploy to each environment
DO env OVER 'development staging production'
  SAY "Deploying to " || env || "..."
  
  -- Set environment variable for the script
  LET env_script = "LET ENVIRONMENT = '" || env || "'" || '0A'X || deploy_script
  
  SELECT
    WHEN env = 'development' THEN
      execute_remote script=env_script target="dev-env" progress=true
    WHEN env = 'staging' THEN  
      execute_remote script=env_script target="staging" progress=true
    WHEN env = 'production' THEN
      execute_remote script=env_script target="production" progress=true
  END
  
  SAY "✅ " || env || " deployment completed"
END

SAY "🎉 Multi-environment deployment completed!"
```

## Error Handling and Recovery

### Retry Logic
```rexx
-- Automatic retry with exponential backoff
ADDRESS deployment
LET max_retries = 3
LET retry_count = 0

retry_execution:
SIGNAL ON ERROR NAME handle_execution_error

execute_remote script="critical-operation.rexx" target="worker1"

SAY "✅ Execution successful"
EXIT

handle_execution_error:
LET retry_count = retry_count + 1
IF retry_count <= max_retries THEN DO
  LET delay = retry_count * 1000  -- 1s, 2s, 3s delays
  SAY "Execution failed, retrying in " || delay || "ms... (attempt " || retry_count || ")"
  SYSTEM("sleep " || (delay / 1000))
  SIGNAL retry_execution
END
ELSE DO
  SAY "❌ Execution failed after " || max_retries || " attempts"
  EXIT 1
END
```

### Graceful Degradation
```rexx
-- Try container first, fall back to remote shell
ADDRESS deployment

SIGNAL ON ERROR NAME try_remote_shell

setup_container image="debian:stable" name="primary-worker"
execute_remote script="important-task.rexx" target="primary-worker"

SAY "✅ Task completed using container"
EXIT

try_remote_shell:
SAY "Container deployment failed, trying remote shell..."

SIGNAL ON ERROR NAME task_failed

setup_remote_shell host="backup.example.com" user="admin"
execute_remote script="important-task.rexx" target="backup.example.com"

SAY "✅ Task completed using remote shell"
EXIT

task_failed:
SAY "❌ Task failed on all available targets"
EXIT 1
```

## Performance Optimization

### Parallel Execution
```rexx
-- Execute multiple scripts in parallel
ADDRESS deployment

-- Setup multiple workers
setup_container image="debian:stable" name="worker1"
setup_container image="debian:stable" name="worker2"  
setup_container image="debian:stable" name="worker3"

-- Start parallel execution (non-blocking)
execute_remote script="task-part-1.rexx" target="worker1" async=true
execute_remote script="task-part-2.rexx" target="worker2" async=true
execute_remote script="task-part-3.rexx" target="worker3" async=true

-- Wait for all to complete
wait_for_completion targets="worker1,worker2,worker3" timeout=300000

SAY "✅ All parallel tasks completed"
```

### Resource Monitoring
```rexx
-- Monitor resource usage during execution
ADDRESS deployment

setup_container image="debian:stable" name="monitored-worker"
  memory="1g" cpus="2.0"

LET monitoring_script = "
  SAY 'Starting resource-intensive task...'
  CHECKPOINT('task_start', 'Resource monitoring enabled')
  
  /* Simulate work while monitoring */
  DO i = 1 TO 100
    /* Check memory usage */
    LET memory_usage = SYSTEM('free -m | grep Mem | awk \'{print $3}\'')
    
    /* Check CPU usage */  
    LET cpu_usage = SYSTEM('top -bn1 | grep \"Cpu(s)\" | awk \'{print $2}\'')
    
    IF i // 10 = 0 THEN
      CHECKPOINT('resource_check', i, memory_usage, cpu_usage)
  END
  
  CHECKPOINT('task_complete', 'Resource monitoring finished')
"

execute_remote script=monitoring_script target="monitored-worker" progress=true

-- Get detailed monitoring report
monitor_deployment target="monitored-worker" detailed=true
```

## Best Practices

### 1. Security
- Always use strict security mode in production
- Implement key rotation for SSH connections
- Use resource limits for containers
- Validate all input parameters

### 2. Reliability
- Implement retry logic for critical operations
- Use health checks and monitoring
- Design for graceful degradation
- Implement proper cleanup procedures

### 3. Performance
- Use parallel execution where appropriate
- Monitor resource usage
- Implement connection pooling
- Cache binary deployments

### 4. Monitoring
- Always use progress monitoring for long-running tasks
- Log all deployment operations
- Implement alerting for failures
- Track performance metrics

## Integration with Existing Systems

### CI/CD Integration
```bash
#!/bin/bash
# Jenkins/GitLab CI integration
./rexx-linux-x64 ci-pipeline.rexx \
  --environment="$CI_ENVIRONMENT" \
  --commit="$CI_COMMIT_SHA" \
  --branch="$CI_COMMIT_REF_NAME"
```

### Docker Compose Integration
```yaml
version: '3.8'
services:
  rexx-director:
    image: rexx:latest
    volumes:
      - ./scripts:/scripts
      - ~/.ssh:/root/.ssh:ro
    environment:
      - REXX_SECURITY_MODE=moderate
      - REXX_MAX_CONTAINERS=10
```

### Kubernetes Integration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rexx-deployment-controller
spec:
  template:
    spec:
      containers:
      - name: rexx
        image: rexx:latest
        env:
        - name: REXX_ENABLE_REMOTE_SHELL
          value: "true"
        - name: REXX_ENABLE_CONTAINER
          value: "true"
```

## Troubleshooting

### Common Issues

1. **SSH Connection Failures**
   ```rexx
   -- Debug SSH connectivity
   ADDRESS remote_shell
   execute command="ssh -vvv user@host" timeout=10000
   ```

2. **Container Runtime Not Found**
   ```rexx
   -- Check available runtimes
   ADDRESS container
   initialize debug=true
   ```

3. **Binary Deployment Issues**
   ```rexx
   -- Verify binary compatibility
   execute command="file /usr/local/bin/rexx"
   execute command="ldd /usr/local/bin/rexx"
   ```

4. **Resource Limits**
   ```rexx
   -- Check resource usage
   monitor_deployment target="worker1" detailed=true
   ```

### Logging and Debugging

```rexx
-- Enable debug logging
ADDRESS deployment
initialize debug_mode=true log_level="debug"

-- View detailed logs
LET log_result = monitor_deployment target="worker1" logs=true
SAY "Deployment logs:"
SAY log_result.logs
```

The remote deployment system provides a comprehensive solution for distributed RexxJS execution, combining the simplicity of Rexx syntax with powerful containerization and remote execution capabilities.