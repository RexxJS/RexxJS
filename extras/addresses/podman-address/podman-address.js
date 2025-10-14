/*!
 * rexxjs/address-podman v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=PODMAN_ADDRESS_META
 */
/**
 * ADDRESS PODMAN Handler
 * Provides explicit ADDRESS PODMAN integration for container operations
 * 
 * Usage:
 *   REQUIRE "rexxjs/address-podman" AS PODMAN
 *   ADDRESS PODMAN
 *   "create image=debian:stable name=test-container"
 *   "status"
 *   "list"
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Modules will be loaded dynamically in initialize method
// Interpolation is now handled by the interpreter before ADDRESS commands are invoked

class AddressPodmanHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 0;
    this.defaultTimeout = 60000;
    this.maxContainers = 20;
    this.securityMode = 'moderate';
    this.allowedImages = new Set(['debian:stable', 'ubuntu:latest', 'alpine:latest']);
    this.trustedBinaries = new Set();
    this.runtime = 'podman';
    
    // Enhanced security settings
    this.securityPolicies = {
      allowPrivileged: false,
      allowHostNetwork: false,
      allowHostPid: false,
      maxMemory: '2g',
      maxCpus: '4.0',
      allowedVolumePaths: new Set(['/tmp', '/var/tmp']),
      bannedCommands: new Set(['rm -rf /', 'dd if=/dev/zero', 'fork()', ':(){ :|:& };:'])
    };
    this.auditLog = [];
    
    // Container process management
    this.processMonitor = {
      enabled: true,
      checkInterval: 30000, // 30 seconds
      healthChecks: new Map(),
      processStats: new Map()
    };
    this.monitoringTimer = null;
    
    // Enhanced CHECKPOINT progress monitoring
    this.checkpointMonitor = {
      enabled: true,
      activeStreams: new Map(), // container -> stream info
      callbacks: new Map(),     // container -> callback function
      realtimeData: new Map()   // container -> latest checkpoint data
    };
    this.initialized = false;
  }

  /**
   * Initialize the ADDRESS PODMAN handler
   */
  async initialize(config = {}) {
    if (this.initialized) return;
    
    try {
      // Import Node.js modules when needed
      this.spawn = require('child_process').spawn;
      this.fs = require('fs');
      this.path = require('path');

      // Import shared utilities
      const sharedUtilsPath = this.path.join(__dirname, '../_shared/provisioning-shared-utils.js');
      const sharedUtils = require(sharedUtilsPath);
      this.interpolateMessage = sharedUtils.interpolateMessage;
      this.logActivity = sharedUtils.logActivity;
      this.createLogFunction = sharedUtils.createLogFunction;
      this.parseCommandParts = sharedUtils.parseCommandParts;
      this.parseCommand = sharedUtils.parseCommand;
      this.parseMemoryLimit = sharedUtils.parseMemoryLimit;
      this.testRuntime = sharedUtils.testRuntime;
      this.validateCommand = sharedUtils.validateCommand;
      this.validateVolumePath = sharedUtils.validateVolumePath;
      this.validateBinaryPath = sharedUtils.validateBinaryPath;
      this.sharedAuditSecurityEvent = sharedUtils.auditSecurityEvent;
      this.calculateUptime = sharedUtils.calculateUptime;
      this.parseKeyValueString = sharedUtils.parseKeyValueString;
      this.sharedParseCheckpointOutput = sharedUtils.parseCheckpointOutput;
      this.sharedWrapScriptWithCheckpoints = sharedUtils.wrapScriptWithCheckpoints;
      this.sharedParseEnhancedCheckpointOutput = sharedUtils.parseEnhancedCheckpointOutput;
      this.formatStatus = sharedUtils.formatStatus;
      
      // Set up logger
      this.log = this.createLogFunction('ADDRESS_PODMAN');
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Podman handler: ${error.message}`);
    }
    
    this.securityMode = config.securityMode || this.securityMode;
    this.maxContainers = config.maxContainers || this.maxContainers;
    this.defaultTimeout = config.defaultTimeout || this.defaultTimeout;
    
    if (config.allowedImages && Array.isArray(config.allowedImages)) {
      this.allowedImages = new Set(config.allowedImages);
    }
    
    if (config.trustedBinaries && Array.isArray(config.trustedBinaries)) {
      this.trustedBinaries = new Set(config.trustedBinaries);
    }

    // Detect runtime availability
    await this.detectRuntime();

    this.log('initialize', {
      securityMode: this.securityMode,
      maxContainers: this.maxContainers,
      runtime: this.runtime,
      allowedImages: Array.from(this.allowedImages)
    });
  }

  /**
   * Detect if podman runtime is available
   */
  async detectRuntime() {
    try {
      await this.testRuntime('podman');
      this.runtime = 'podman';
      return;
    } catch (error) {
      throw new Error('Podman runtime not found or not available');
    }
  }

  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str, variablePool) {
    if (!variablePool) {
      return str;
    }

    // Use simple {var} pattern for variable interpolation
    return str.replace(/\{([^}]+)\}/g, (match, varName) => {
      return (variablePool[varName] !== undefined ? String(variablePool[varName]) : match);
    });
  }

  /**
   * Main handler for ADDRESS PODMAN commands
   */
  async handleAddressCommand(command, context = {}) {
    try {
      // Apply RexxJS variable interpolation
      const interpolatedCommand = this.interpolateVariables(command, context);
      this.log('command', { command: interpolatedCommand });

      const parsed = this.parseCommand(interpolatedCommand);
      
      switch (parsed.operation) {
        case 'status':
          return await this.getStatus();
        case 'list':
          return await this.listContainers();
        case 'create':
          return await this.createContainer(parsed.params, context);
        case 'start':
          return await this.startContainer(parsed.params, context);
        case 'stop':
          return await this.stopContainer(parsed.params, context);
        case 'remove':
          return await this.removeContainer(parsed.params, context);
        case 'copy_to':
          return await this.handleCopyTo(parsed.params, context);
        case 'copy_from':
          return await this.handleCopyFrom(parsed.params, context);
        case 'logs':
          return await this.handleLogs(parsed.params, context);
        case 'cleanup':
          return await this.handleCleanup(parsed.params, context);
        case 'security_audit':
          return this.getSecurityAuditLog();
        case 'process_stats':
          return this.getProcessStatistics();
        case 'configure_health_check':
          return this.configureHealthCheck(parsed.params);
        case 'start_monitoring':
          this.startProcessMonitoring();
          return { success: true, operation: 'start_monitoring', enabled: true };
        case 'stop_monitoring':
          this.stopProcessMonitoring();
          return { success: true, operation: 'stop_monitoring', enabled: false };
        case 'checkpoint_status':
          return this.getCheckpointMonitoringStatus();
        case 'deploy_rexx':
          return await this.deployRexx(parsed.params, context);
        case 'execute':
          return await this.executeInContainer(parsed.params, context);
        case 'execute_rexx':
          return await this.executeRexx(parsed.params, context);
        default:
          throw new Error(`Unknown ADDRESS PODMAN command: ${parsed.operation}`);
      }
    } catch (error) {
      this.log('error', { error: error.message, command });
      return {
        success: false,
        operation: 'error',
        error: error.message,
        output: error.message
      };
    }
  }



  /**
   * Get handler status
   */
  async getStatus() {
    const containerCount = this.activeContainers.size;
    
    return {
      success: true,
      operation: 'status',
      runtime: this.runtime,
      activeContainers: containerCount,
      maxContainers: this.maxContainers,
      securityMode: this.securityMode,
      output: this.formatStatus(this.runtime, containerCount, this.maxContainers, this.securityMode)
    };
  }

  /**
   * List containers
   */
  async listContainers() {
    const containers = Array.from(this.activeContainers.entries()).map(([name, info]) => ({
      name,
      image: info.image,
      status: info.status,
      created: info.created,
      interactive: info.interactive || false,
      memory: info.memory,
      cpus: info.cpus,
      volumes: info.volumes,
      environment: info.environment,
      rexxDeployed: info.rexxDeployed || false
    }));

    return {
      success: true,
      operation: 'list',
      containers,
      count: containers.length,
      output: `Found ${containers.length} containers`
    };
  }

  /**
   * Create a new container
   */
  async createContainer(params, context) {
    const { image, name, interactive = 'false', memory, cpus, volumes, environment, command, ports } = params;
    
    if (!image) {
      throw new Error('Missing required parameter: image');
    }

    // Validate image
    if (this.securityMode === 'strict' && !this.allowedImages.has(image)) {
      throw new Error(`Image not allowed in strict mode: ${image}`);
    }

    // Check container limits
    if (this.activeContainers.size >= this.maxContainers) {
      throw new Error(`Maximum containers reached: ${this.maxContainers}`);
    }

    // Enhanced security validation
    const securityViolations = this.validateContainerSecurity(params);
    if (securityViolations.length > 0) {
      this.auditSecurityEvent('security_violation', { violations: securityViolations, operation: 'create' });
      throw new Error(`Security violations: ${securityViolations.join('; ')}`);
    }

    const containerName = (name && name.trim()) || `podman-container-${++this.containerCounter}`;
    
    // Check for name conflicts
    if (name && name.trim() && this.activeContainers.has(name.trim())) {
      throw new Error(`Container name already exists: ${name.trim()}`);
    }
    
    // Real podman container creation with enhanced options
    const createArgs = ['create', '--name', containerName];

    // Add resource limits
    if (memory) {
      createArgs.push('--memory', memory);
    }
    if (cpus) {
      createArgs.push('--cpus', cpus);
    }

    // Add port mappings
    if (ports) {
      const portMappings = ports.split(',');
      for (const mapping of portMappings) {
        createArgs.push('-p', mapping.trim());
      }
    }

    // Add volume mounts
    if (volumes) {
      const volumeMounts = volumes.split(',');
      for (const mount of volumeMounts) {
        createArgs.push('-v', mount.trim());
      }
    }

    // Add environment variables
    if (environment) {
      const envVars = environment.split(',');
      for (const envVar of envVars) {
        createArgs.push('-e', envVar.trim());
      }
    }

    // Add interactive flags
    if (interactive === 'true') {
      createArgs.push('-i', '-t'); // interactive and pseudo-TTY
    }

    createArgs.push(image);

    // Add command if provided, otherwise use default behavior
    if (command) {
      // Split command into shell invocation
      createArgs.push('sh', '-c', command);
    } else if (interactive === 'true') {
      // If interactive but no command, start with bash
      createArgs.push('bash');
    }
    
    this.log('podman_create_start', { containerName, image, args: createArgs });
    const result = await this.execPodmanCommand(createArgs);
    this.log('podman_create_result', { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr });
    
    if (result.exitCode === 0) {
      const containerInfo = {
        name: containerName,
        image,
        status: 'created',
        created: new Date().toISOString(),
        runtime: this.runtime,
        containerId: result.stdout.trim(),
        interactive: interactive === 'true',
        memory: memory,
        cpus: cpus,
        volumes: volumes,
        environment: environment
      };

      this.activeContainers.set(containerName, containerInfo);

      this.log('container_created', { name: containerName, image, containerId: containerInfo.containerId });

      return {
        success: true,
        operation: 'create',
        container: containerName,
        image,
        status: 'created',
        containerId: containerInfo.containerId,
        interactive: containerInfo.interactive,
        memory: containerInfo.memory,
        cpus: containerInfo.cpus,
        volumes: containerInfo.volumes,
        environment: containerInfo.environment,
        output: `Container ${containerName} created successfully`
      };
    } else {
      throw new Error(`Failed to create container: ${result.stderr}`);
    }
  }

  /**
   * Start a container
   */
  async startContainer(params, context) {
    const { name } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      throw new Error(`Container not found: ${name}`);
    }
    if (container.status === 'running') {
      throw new Error(`Container ${name} is already running`);
    }

    // Real podman start
    const result = await this.execPodmanCommand(['start', name]);
    
    if (result.exitCode === 0) {
      // Update container status
      container.status = 'running';
      container.started = new Date().toISOString();

      this.log('container_started', { name });

      return {
        success: true,
        operation: 'start',
        container: name,
        status: 'running',
        output: `Container ${name} started successfully`
      };
    } else {
      throw new Error(`Failed to start container: ${result.stderr}`);
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(params, context) {
    const { name } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      throw new Error(`Container not found: ${name}`);
    }
    if (container.status !== 'running') {
      throw new Error(`Container ${name} is not running`);
    }

    const result = await this.execPodmanCommand(['stop', name]);

    if (result.exitCode === 0) {
      container.status = 'stopped';
      container.stopped = new Date().toISOString();

      this.log('container_stopped', { name });

      return {
        success: true,
        operation: 'stop',
        container: name,
        status: 'stopped',
        output: `Container ${name} stopped successfully`
      };
    } else {
        throw new Error(`Failed to stop container: ${result.stderr}`);
    }
  }

  /**
   * Remove a container (supports comma-separated names, force, ignore_missing)
   */
  async removeContainer(params, context) {
    const { name, force = 'false', ignore_missing = 'false' } = params;

    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    // Handle comma-separated container names
    const containerNames = name.split(',').map(n => n.trim()).filter(n => n.length > 0);
    const forceRemove = force === 'true';
    const ignoreMissing = ignore_missing === 'true';

    const results = [];
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const containerName of containerNames) {
      try {
        // Check if container exists in our tracking
        const exists = this.activeContainers.has(containerName);

        if (!exists && ignoreMissing) {
          this.log('container_skip', { name: containerName, reason: 'not tracked' });
          results.push({
            container: containerName,
            success: true,
            skipped: true,
            reason: 'Container not tracked (ignore_missing=true)'
          });
          skipCount++;
          continue;
        }

        if (!exists && !ignoreMissing) {
          throw new Error(`Container not found: ${containerName}`);
        }

        // Build podman rm command
        const rmArgs = ['rm'];
        if (forceRemove) {
          rmArgs.push('-f'); // Force removal even if running
        }
        rmArgs.push(containerName);

        const result = await this.execPodmanCommand(rmArgs);

        if (result.exitCode === 0) {
          this.activeContainers.delete(containerName);
          this.log('container_removed', { name: containerName, forced: forceRemove });

          results.push({
            container: containerName,
            success: true,
            forced: forceRemove
          });
          successCount++;
        } else {
          throw new Error(`Failed to remove: ${result.stderr}`);
        }
      } catch (error) {
        this.log('container_remove_error', { name: containerName, error: error.message });

        if (ignoreMissing && error.message.includes('not found')) {
          results.push({
            container: containerName,
            success: true,
            skipped: true,
            reason: 'Container not found (ignore_missing=true)'
          });
          skipCount++;
        } else {
          results.push({
            container: containerName,
            success: false,
            error: error.message
          });
          errorCount++;
        }
      }
    }

    // If all operations failed and we're not ignoring missing, throw error
    if (errorCount > 0 && errorCount === containerNames.length && !ignoreMissing) {
      throw new Error(`Failed to remove all containers: ${results.map(r => r.error).join('; ')}`);
    }

    const returnValue = {
      success: errorCount === 0,
      operation: 'remove',
      containers: containerNames,
      results: results,
      summary: {
        total: containerNames.length,
        success: successCount,
        skipped: skipCount,
        failed: errorCount
      }
    };

    // For single container removal, provide simpler output and include 'container' field
    if (containerNames.length === 1) {
      returnValue.container = containerNames[0];
      if (successCount === 1) {
        returnValue.output = `Container ${containerNames[0]} removed successfully`;
      } else if (skipCount === 1) {
        returnValue.output = `Container ${containerNames[0]} skipped`;
      } else {
        returnValue.output = `Failed to remove container ${containerNames[0]}`;
      }
    } else {
      // Multi-container removal: use summary output
      returnValue.output = `Removed ${successCount} containers, skipped ${skipCount}, failed ${errorCount}`;
    }

    return returnValue;
  }

  /**
   * Deploy RexxJS binary to a container
   * deploy_rexx container="test-container" rexx_binary="/path/to/rexx-linux-x64" target="/usr/local/bin/rexx"
   */
  async deployRexx(params, context) {
    const { container: name, rexx_binary, target = '/usr/local/bin/rexx' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: container');
    }
    
    if (!rexx_binary) {
      throw new Error('Missing required parameter: rexx_binary');
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      throw new Error(`Container not found: ${name}`);
    }

    if (container.status !== 'running') {
      throw new Error(`Container ${name} must be running to deploy RexxJS binary`);
    }

    // Check if binary exists
    const interpolatedBinary = this.interpolateVariables(rexx_binary, context);
    const interpolatedTarget = this.interpolateVariables(target, context);
    
    // Security validation
    if (!this.validateBinaryPath(interpolatedBinary, this.securityMode, this.trustedBinaries, this.auditSecurityEvent.bind(this))) {
      throw new Error(`RexxJS binary path ${interpolatedBinary} not trusted by security policy`);
    }
    
    if (!this.fs.existsSync(interpolatedBinary)) {
      throw new Error(`RexxJS binary not found: ${interpolatedBinary}`);
    }

    try {
      // Copy binary to container
      await this.copyToContainer(name, interpolatedBinary, interpolatedTarget);
      
      // Make executable
      await this.execInContainer(name, `chmod +x ${interpolatedTarget}`, { timeout: 5000 });

      // Test binary
      const testResult = await this.execInContainer(name, `${interpolatedTarget} --help`, { timeout: 10000 });
      
      if (testResult.exitCode !== 0) {
        throw new Error(`RexxJS binary test failed: ${testResult.stderr}`);
      }

      // Mark container as having RexxJS deployed
      container.rexxDeployed = true;
      container.rexxPath = interpolatedTarget;

      this.log('binary_deployed', { 
        container: name, 
        binary: interpolatedBinary, 
        target: interpolatedTarget 
      });

      return {
        success: true,
        operation: 'deploy_rexx',
        container: name,
        binary: interpolatedBinary,
        target: interpolatedTarget,
        output: `RexxJS binary deployed to ${name} at ${interpolatedTarget}`
      };
    } catch (error) {
      throw new Error(`Failed to deploy RexxJS binary: ${error.message}`);
    }
  }

  /**
   * Execute command in container
   * execute container="test-container" command="ls -la" [timeout=30000] [working_dir="/tmp"]
   */
  async executeInContainer(params, context) {
    const { container: name, command: cmd, timeout, working_dir } = params;

    if (!name || !cmd) {
      throw new Error('Missing required parameters: container and command');
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      throw new Error(`Container not found: ${name}`);
    }

    if (container.status !== 'running') {
      throw new Error(`Container ${name} must be running to execute commands`);
    }

    const interpolatedCmd = this.interpolateVariables(cmd, context);
    const interpolatedDir = working_dir ? this.interpolateVariables(working_dir, context) : null;

    // Security validation for command
    const commandViolations = this.validateCommand(interpolatedCmd, this.securityPolicies.bannedCommands);
    if (commandViolations.length > 0) {
      this.auditSecurityEvent('command_blocked', { 
        command: interpolatedCmd, 
        violations: commandViolations, 
        container: name 
      });
      throw new Error(`Command blocked by security policy: ${commandViolations.join('; ')}`);
    }
    
    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;

    const fullCommand = interpolatedDir 
      ? `cd ${interpolatedDir} && ${interpolatedCmd}`
      : interpolatedCmd;

    try {
      const result = await this.execInContainer(name, fullCommand, { timeout: execTimeout });

      this.log('command_executed', {
        container: name,
        command: interpolatedCmd,
        exitCode: result.exitCode
      });

      return {
        success: result.exitCode === 0,
        operation: 'execute',
        container: name,
        command: interpolatedCmd,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.exitCode === 0 ? result.stdout : `Command failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Execute RexxJS script in container with CHECKPOINT support
   * execute_rexx container="test-container" script="SAY 'Hello'" [timeout=30000] [progress_callback=true]
   */
  async executeRexx(params, context) {
    const { container: name, script, timeout, progress_callback = 'false', script_file } = params;

    if (!name || (!script && !script_file)) {
      throw new Error('Missing required parameters: container and (script or script_file)');
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      throw new Error(`Container not found: ${name}`);
    }

    if (container.status !== 'running') {
      throw new Error(`Container ${name} must be running to execute RexxJS scripts`);
    }
    
    if (!container.rexxDeployed) {
      throw new Error(`RexxJS binary not deployed to container ${name}. Use deploy_rexx first.`);
    }

    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;
    const enableProgressCallback = progress_callback.toString().toLowerCase() === 'true';

    let rexxScript;
    if (script_file) {
      const interpolatedFile = this.interpolateVariables(script_file, context);
      rexxScript = this.fs.readFileSync(interpolatedFile, 'utf8');
    } else {
      rexxScript = this.interpolateVariables(script, context);
    }

    try {
      let result;
      
      if (enableProgressCallback) {
        // Execute with streaming progress updates
        result = await this.executeRexxWithProgress(container, rexxScript, {
          timeout: execTimeout,
          progressCallback: (checkpoint, params) => {
            this.log('rexx_progress', {
              container: name,
              checkpoint: checkpoint,
              progress: params
            });
          }
        });
      } else {
        // Simple execution
        // Real mode: execute in actual container
        const tempScript = `/tmp/rexx_script_${Date.now()}.rexx`;
        await this.writeToContainer(name, tempScript, rexxScript);
        
        result = await this.execInContainer(name, `${container.rexxPath} ${tempScript}`, { 
          timeout: execTimeout 
        });

        // Cleanup temp script
        await this.execInContainer(name, `rm -f ${tempScript}`, { timeout: 5000 });
      }

      this.log('rexx_executed', {
        container: name,
        exitCode: result.exitCode,
        progressEnabled: enableProgressCallback
      });

      return {
        success: result.exitCode === 0,
        operation: 'execute_rexx',
        container: name,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.exitCode === 0 ? result.stdout : `RexxJS execution failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`RexxJS execution failed: ${error.message}`);
    }
  }

  /**
   * Handle copy_to command
   * copy_to container="test-container" local="/path/to/file" remote="/container/path"
   */
  async handleCopyTo(params, context) {
    const { container, local, remote } = params;

    if (!container || !local || !remote) {
      throw new Error('copy_to requires container, local, and remote parameters');
    }

    const containerInfo = this.activeContainers.get(container);
    if (!containerInfo) {
      throw new Error(`Container not found: ${container}`);
    }

    // Real mode - execute actual podman cp command
    const args = ['cp', local, `${container}:${remote}`];
    
    try {
      const result = await this.execPodmanCommand(args);
      
      if (result.exitCode === 0) {
        this.log('copy_to_success', {
          container,
          local,
          remote
        });

        return {
          success: true,
          operation: 'copy_to',
          container,
          localPath: local,
          remotePath: remote,
          output: `Copied ${local} to ${container}:${remote}`
        };
      } else {
        throw new Error(`Copy operation failed: ${result.stderr || result.stdout}`);
      }
    } catch (error) {
      throw new Error(`Copy to container failed: ${error.message}`);
    }
  }

  /**
   * Handle copy_from command
   * copy_from container="test-container" remote="/container/path" local="/host/path"
   */
  async handleCopyFrom(params, context) {
    const { container, remote, local } = params;

    if (!container || !remote || !local) {
      throw new Error('copy_from requires container, remote, and local parameters');
    }

    const containerInfo = this.activeContainers.get(container);
    if (!containerInfo) {
      throw new Error(`Container not found: ${container}`);
    }

    // Real mode - execute actual podman cp command
    const args = ['cp', `${container}:${remote}`, local];
    
    try {
      const result = await this.execPodmanCommand(args);
      
      if (result.exitCode === 0) {
        this.log('copy_from_success', {
          container,
          remote,
          local
        });

        return {
          success: true,
          operation: 'copy_from',
          container,
          remotePath: remote,
          localPath: local,
          output: `Copied ${container}:${remote} to ${local}`
        };
      } else {
        throw new Error(`Copy operation failed: ${result.stderr || result.stdout}`);
      }
    } catch (error) {
      throw new Error(`Copy from container failed: ${error.message}`);
    }
  }

  /**
   * Handle logs command
   * logs container="test-container" [lines=50]
   */
  async handleLogs(params, context) {
    const { container, lines = '50' } = params;

    if (!container) {
      throw new Error('logs requires container parameter');
    }

    const containerInfo = this.activeContainers.get(container);
    if (!containerInfo) {
      throw new Error(`Container not found: ${container}`);
    }

    const logLines = parseInt(lines);

    // Real mode - execute actual podman logs command
    const args = ['logs', '--tail', logLines.toString(), container];
    
    try {
      const result = await this.execPodmanCommand(args);
      
      if (result.exitCode === 0) {
        this.log('logs_success', {
          container,
          lines: logLines,
          logLength: result.stdout.length
        });

        return {
          success: true,
          operation: 'logs',
          container,
          lines: logLines,
          logs: result.stdout,
          output: `Retrieved logs from ${container}`
        };
      } else {
        throw new Error(`Logs retrieval failed: ${result.stderr || result.stdout}`);
      }
    } catch (error) {
      throw new Error(`Get container logs failed: ${error.message}`);
    }
  }

  /**
   * Handle cleanup command
   * cleanup [all=false]
   */
  async handleCleanup(params, context) {
    const { all = 'false' } = params;

    let cleaned = 0;
    let errors = [];

    try {
      if (all === 'true') {
        // Remove all containers
        for (const [id, container] of this.activeContainers) {
          try {
            // Real mode - stop and remove container
            if (container.status === 'running') {
              await this.execPodmanCommand(['stop', id]);
            }
            await this.execPodmanCommand(['rm', id]);
            this.activeContainers.delete(id);
            cleaned++;
          } catch (error) {
            this.log('cleanup_error', {
              containerId: id,
              error: error.message
            });
            errors.push(`${id}: ${error.message}`);
          }
        }
      } else {
        // Remove only stopped containers
        for (const [id, container] of this.activeContainers) {
          if (container.status === 'stopped' || container.status === 'created') {
            try {
              // Real mode - remove stopped container
              await this.execPodmanCommand(['rm', id]);
              this.activeContainers.delete(id);
              cleaned++;
            } catch (error) {
              this.log('cleanup_error', {
                containerId: id,
                error: error.message
              });
              errors.push(`${id}: ${error.message}`);
            }
          }
        }
      }

      this.log('cleanup_completed', {
        cleaned,
        remaining: this.activeContainers.size,
        all: all === 'true'
      });

      return {
        success: true,
        operation: 'cleanup',
        cleaned,
        remaining: this.activeContainers.size,
        all: all === 'true',
        errors: errors.length > 0 ? errors : undefined,
        output: `Cleaned up ${cleaned} containers, ${this.activeContainers.size} remaining`
      };
    } catch (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Low-level container execution
   */
  async execInContainer(containerName, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || this.defaultTimeout;

      const exec = this.spawn('podman', ['exec', containerName, 'sh', '-c', command], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      exec.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      exec.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutHandle = setTimeout(() => {
        exec.kill('SIGTERM');
        reject(new Error(`Command timeout after ${timeout}ms: ${command}`));
      }, timeout);

      exec.on('close', (code) => {
        clearTimeout(timeoutHandle);
        const duration = Date.now() - startTime;
        
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          duration: duration
        });
      });

      exec.on('error', (error) => {
        clearTimeout(timeoutHandle);
        reject(new Error(`Execution error: ${error.message}`));
      });
    });
  }

  /**
   * Copy file to container
   */
  async copyToContainer(containerName, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      const copy = this.spawn('podman', ['cp', localPath, `${containerName}:${remotePath}`], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';
      copy.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      copy.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`File copy failed: ${stderr}`));
        }
      });

      copy.on('error', (error) => {
        reject(new Error(`Copy operation error: ${error.message}`));
      });
    });
  }

  /**
   * Write content to file in container
   */
  async writeToContainer(containerName, remotePath, content) {
    return new Promise((resolve, reject) => {
      const write = this.spawn('podman', ['exec', '-i', containerName, 'sh', '-c', `cat > ${remotePath}`], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      write.stdin.write(content);
      write.stdin.end();

      let stderr = '';
      write.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      write.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`File write failed: ${stderr}`));
        }
      });

      write.on('error', (error) => {
        reject(new Error(`Write operation error: ${error.message}`));
      });
    });
  }

  /**
   * Execute podman command
   */
  async execPodmanCommand(args, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    
    return new Promise((resolve, reject) => {
      const child = this.spawn('podman', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        reject(new Error(`Podman command failed: ${error.message}`));
      });

      // Set timeout
      if (timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Podman command timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Execute RexxJS script with enhanced CHECKPOINT progress monitoring
   */
  async executeRexxWithProgress(containerInfo, script, options = {}) {
    const tempScript = `/tmp/rexx_script_progress_${Date.now()}.rexx`;
    
    try {
      // Enhanced script with CHECKPOINT monitoring wrapper
      const enhancedScript = this.wrapScriptWithCheckpoints(script, options);
      
      // Real mode: execute with enhanced streaming progress
      await this.writeToContainer(containerInfo.name, tempScript, enhancedScript);
      
      // Setup bidirectional CHECKPOINT monitoring
      if (options.progressCallback) {
        this.setupCheckpointMonitoring(containerInfo.name, options.progressCallback);
      }
      
      const result = await this.execInContainerWithProgress(
        containerInfo.name, 
        `${containerInfo.rexxPath} ${tempScript}`, 
        {
          timeout: options.timeout || this.defaultTimeout,
          progressCallback: options.progressCallback,
          bidirectional: true
        }
      );

      // Cleanup temp script
      await this.execInContainer(containerInfo.name, `rm -f ${tempScript}`, { timeout: 5000 });
      
      return result;
    } catch (error) {
      // Ensure cleanup on error
      try {
        await this.execInContainer(containerInfo.name, `rm -f ${tempScript}`, { timeout: 5000 });
      } catch (cleanupError) {
        // Log cleanup failure but don't mask original error
        this.log('cleanup_error', { script: tempScript, error: cleanupError.message });
      }
      throw error;
    }
  }

  /**
   * Wrap RexxJS script with CHECKPOINT monitoring capabilities
   */
  wrapScriptWithCheckpoints(script, options = {}) {
    return this.sharedWrapScriptWithCheckpoints(script, options);
  }

  /**
   * Execute command in container with progress monitoring
   */
  async execInContainerWithProgress(containerName, command, options = {}) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = this.spawn('podman', ['exec', '-i', containerName, 'sh', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      const startTime = Date.now();

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Parse CHECKPOINT outputs for progress monitoring
        if (options.progressCallback && output.includes('CHECKPOINT')) {
          this.parseCheckpointOutput(output, options.progressCallback);
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          exitCode: code,
          stdout,
          stderr,
          duration
        });
      });

      child.on('error', (error) => {
        reject(new Error(`Container execution error: ${error.message}`));
      });

      // Set timeout if specified
      if (options.timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Container execution timeout after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  /**
   * Parse CHECKPOINT output for progress monitoring
   */
  parseCheckpointOutput(output, progressCallback) {
    return this.sharedParseCheckpointOutput(output, progressCallback);
  }

  /**
   * Parse key=value parameter string
   */
  parseKeyValueString(paramStr) {
    return parseKeyValueString(paramStr);
  }


  /**
   * Enhanced security validation for container parameters
   */
  validateContainerSecurity(params) {
    const violations = [];
    
    // Validate memory limits
    if (params.memory) {
      const memoryLimit = this.parseMemoryLimit(params.memory);
      const maxMemoryLimit = this.parseMemoryLimit(this.securityPolicies.maxMemory);
      if (memoryLimit > maxMemoryLimit) {
        violations.push(`Memory limit ${params.memory} exceeds maximum allowed ${this.securityPolicies.maxMemory}`);
      }
    }
    
    // Validate CPU limits
    if (params.cpus) {
      const cpuLimit = parseFloat(params.cpus);
      const maxCpuLimit = parseFloat(this.securityPolicies.maxCpus);
      if (cpuLimit > maxCpuLimit) {
        violations.push(`CPU limit ${params.cpus} exceeds maximum allowed ${this.securityPolicies.maxCpus}`);
      }
    }
    
    // Validate volume paths
    if (params.volumes) {
      const volumeMounts = params.volumes.split(',');
      for (const mount of volumeMounts) {
        const [hostPath] = mount.split(':');
        if (!this.validateVolumePath(hostPath.trim(), this.securityMode, this.securityPolicies.allowedVolumePaths)) {
          violations.push(`Volume path ${hostPath} not allowed by security policy`);
        }
      }
    }
    
    // Check for privileged operations
    if (params.privileged === 'true' && !this.securityPolicies.allowPrivileged) {
      violations.push('Privileged containers not allowed by security policy');
    }
    
    return violations;
  }




  /**
   * Audit security events for compliance
   */
  auditSecurityEvent(event, details) {
    this.sharedAuditSecurityEvent(event, details, this.securityMode, this.auditLog, this.log);
  }

  /**
   * Get security audit log
   */
  getSecurityAuditLog() {
    return {
      success: true,
      operation: 'security_audit',
      events: this.auditLog.slice(-100), // Return last 100 events
      totalEvents: this.auditLog.length,
      securityMode: this.securityMode,
      policies: this.securityPolicies
    };
  }

  /**
   * Container Process Management Methods
   */

  /**
   * Start process monitoring for containers
   */
  startProcessMonitoring() {
    if (this.monitoringTimer || !this.processMonitor.enabled) {
      return;
    }

    this.monitoringTimer = setInterval(() => {
      this.checkContainerHealth();
    }, this.processMonitor.checkInterval);

    this.log('process_monitoring_started', { 
      interval: this.processMonitor.checkInterval,
      containers: this.activeContainers.size 
    });
  }

  /**
   * Stop process monitoring
   */
  stopProcessMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      this.log('process_monitoring_stopped');
    }
  }

  /**
   * Check health of all active containers
   */
  async checkContainerHealth() {
    for (const [name, container] of this.activeContainers) {
      try {
        const health = await this.getContainerHealth(name);
        this.processStats.set(name, {
          ...health,
          lastCheck: new Date().toISOString()
        });

        // Check for unhealthy containers
        if (health.status === 'unhealthy' || health.status === 'exited') {
          this.handleUnhealthyContainer(name, container, health);
        }
      } catch (error) {
        this.log('health_check_error', { container: name, error: error.message });
      }
    }
  }

  /**
   * Get container health and process information
   */
  async getContainerHealth(containerName) {
    try {
      // Real mode: get actual container stats
      const inspectResult = await this.execPodmanCommand(['inspect', containerName]);
      const statsResult = await this.execPodmanCommand(['stats', '--no-stream', containerName]);
      
      if (inspectResult.exitCode === 0 && statsResult.exitCode === 0) {
        const inspectData = JSON.parse(inspectResult.stdout)[0];
        const running = inspectData.State.Running;
        
        return {
          status: running ? 'running' : 'stopped',
          running: running,
          pid: inspectData.State.Pid,
          memory: this.parseStatsMemory(statsResult.stdout),
          cpu: this.parseStatsCpu(statsResult.stdout),
          uptime: this.calculateUptime(inspectData.State.StartedAt)
        };
      }
    } catch (error) {
      this.log('health_check_failed', { container: containerName, error: error.message });
    }

    return {
      status: 'unknown',
      running: false,
      pid: 0,
      memory: '0MB',
      cpu: '0%',
      uptime: '0s'
    };
  }

  /**
   * Handle unhealthy containers
   */
  async handleUnhealthyContainer(name, container, health) {
    this.log('unhealthy_container_detected', { 
      container: name, 
      status: health.status,
      lastKnownGood: container.status 
    });

    // Update container status
    container.status = health.status;

    // Audit the event
    this.auditSecurityEvent('container_health_issue', {
      container: name,
      healthStatus: health.status,
      action: 'monitoring'
    });

    // Auto-recovery logic for certain conditions
    if (health.status === 'exited' && container.autoRestart) {
      try {
        this.log('attempting_auto_restart', { container: name });
        await this.startContainer({ name }, {});
      } catch (error) {
        this.log('auto_restart_failed', { container: name, error: error.message });
      }
    }
  }

  /**
   * Get process statistics for all containers
   */
  getProcessStatistics() {
    const stats = Array.from(this.processStats.entries()).map(([name, stats]) => ({
      container: name,
      ...stats,
      containerInfo: this.activeContainers.get(name)
    }));

    return {
      success: true,
      operation: 'process_stats',
      containers: stats,
      monitoringEnabled: this.processMonitor.enabled,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Configure container health checks
   */
  configureHealthCheck(params) {
    const { container, enabled = true, interval = 30000, command, retries = 3 } = params;

    if (!container) {
      throw new Error('Container name required for health check configuration');
    }

    if (!this.activeContainers.has(container)) {
      throw new Error(`Container not found: ${container}`);
    }

    this.processMonitor.healthChecks.set(container, {
      enabled,
      interval,
      command,
      retries,
      failureCount: 0,
      lastCheck: null
    });

    this.log('health_check_configured', { 
      container, 
      enabled, 
      interval, 
      command: command ? 'custom' : 'default' 
    });

    return {
      success: true,
      operation: 'configure_health_check',
      container,
      configuration: { enabled, interval, command, retries }
    };
  }

  /**
   * Utility methods for parsing container stats
   */
  parseStatsMemory(statsOutput) {
    const match = statsOutput.match(/(\d+\.?\d*\s*[KMGT]?B)/);
    return match ? match[1] : '0MB';
  }

  parseStatsCpu(statsOutput) {
    const match = statsOutput.match(/(\d+\.?\d*%)/);
    return match ? match[1] : '0%';
  }


  /**
   * Enhanced CHECKPOINT Progress Monitoring Methods
   */

  /**
   * Setup bidirectional CHECKPOINT monitoring for a container
   */
  setupCheckpointMonitoring(containerName, progressCallback) {
    if (!this.checkpointMonitor.enabled) {
      return;
    }

    // Register the callback for this container
    this.checkpointMonitor.callbacks.set(containerName, progressCallback);
    this.checkpointMonitor.realtimeData.set(containerName, {
      started: new Date().toISOString(),
      checkpoints: [],
      lastUpdate: null
    });

    this.log('checkpoint_monitoring_setup', { 
      container: containerName,
      bidirectional: true 
    });
  }

  /**
   * Process incoming CHECKPOINT data from container
   */
  processCheckpointData(containerName, checkpointData) {
    const callback = this.checkpointMonitor.callbacks.get(containerName);
    const realtimeData = this.checkpointMonitor.realtimeData.get(containerName);

    if (realtimeData) {
      realtimeData.checkpoints.push({
        timestamp: new Date().toISOString(),
        ...checkpointData
      });
      realtimeData.lastUpdate = new Date().toISOString();
    }

    // Call the progress callback with the new data
    if (callback) {
      callback(checkpointData.checkpoint, checkpointData.params || {});
    }

    // Log the checkpoint for debugging
    this.log('checkpoint_received', {
      container: containerName,
      checkpoint: checkpointData.checkpoint,
      params: checkpointData.params
    });
  }

  /**
   * Enhanced container execution with real-time CHECKPOINT parsing
   */
  async execInContainerWithProgress(containerName, command, options = {}) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = this.spawn('podman', ['exec', '-i', containerName, 'sh', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      const startTime = Date.now();

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Enhanced CHECKPOINT parsing for bidirectional communication
        if (options.progressCallback && output.includes('CHECKPOINT')) {
          this.parseEnhancedCheckpointOutput(containerName, output, options.progressCallback);
        }
      });

      child.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        stderr += errorOutput;
        
        // Also check stderr for CHECKPOINT outputs (RexxJS might output there)
        if (options.progressCallback && errorOutput.includes('CHECKPOINT')) {
          this.parseEnhancedCheckpointOutput(containerName, errorOutput, options.progressCallback);
        }
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        // Cleanup checkpoint monitoring for this execution
        this.cleanupCheckpointMonitoring(containerName);
        
        resolve({
          exitCode: code,
          stdout,
          stderr,
          duration
        });
      });

      child.on('error', (error) => {
        this.cleanupCheckpointMonitoring(containerName);
        reject(new Error(`Container execution error: ${error.message}`));
      });

      // Set timeout if specified
      if (options.timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          this.cleanupCheckpointMonitoring(containerName);
          reject(new Error(`Container execution timeout after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  /**
   * Parse enhanced CHECKPOINT output with structured data support
   */
  parseEnhancedCheckpointOutput(containerName, output, progressCallback) {
    return this.sharedParseEnhancedCheckpointOutput(output, (rec) => {
      this.processCheckpointData(containerName, rec);
      if (typeof progressCallback === 'function') {
        progressCallback(rec.checkpoint, rec.params);
      }
    });
  }

  /**
   * Cleanup checkpoint monitoring for a container
   */
  cleanupCheckpointMonitoring(containerName) {
    this.checkpointMonitor.callbacks.delete(containerName);
    
    // Keep realtime data for a while for inspection
    setTimeout(() => {
      this.checkpointMonitor.realtimeData.delete(containerName);
    }, 60000); // Keep for 1 minute
  }

  /**
   * Get current checkpoint monitoring status
   */
  getCheckpointMonitoringStatus() {
    const activeMonitoring = Array.from(this.checkpointMonitor.callbacks.keys());
    const realtimeData = {};
    
    for (const [container, data] of this.checkpointMonitor.realtimeData.entries()) {
      realtimeData[container] = {
        ...data,
        checkpointCount: data.checkpoints.length,
        latestCheckpoint: data.checkpoints[data.checkpoints.length - 1]
      };
    }
    
    return {
      success: true,
      operation: 'checkpoint_monitoring_status',
      enabled: this.checkpointMonitor.enabled,
      activeContainers: activeMonitoring,
      realtimeData: realtimeData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup process monitoring on handler destruction
   */
  destroy() {
    this.stopProcessMonitoring();
    
    // Cleanup checkpoint monitoring
    this.checkpointMonitor.callbacks.clear();
    this.checkpointMonitor.realtimeData.clear();
    
    this.activeContainers.clear();
    this.processStats.clear();
    this.auditLog.length = 0;
  }
}

// Global handler instance
let podmanHandlerInstance = null;

// Podman ADDRESS metadata function
function PODMAN_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    type: 'address-target',
    name: 'ADDRESS PODMAN Container Service',
    version: '1.0.0',
    description: 'Podman container operations via ADDRESS interface',
    provides: {
      addressTarget: 'podman',
      handlerFunction: 'ADDRESS_PODMAN_HANDLER',
      commandSupport: true,  // Indicates support for command-string style
      methodSupport: true    // Also supports method-call style for convenience
    },
    dependencies: {
      "child_process": "builtin"
    },
    envVars: [],
    loaded: true,
    requirements: {
      environment: 'nodejs',
      modules: ['child_process']
    }
  };
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_PODMAN_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize handler instance if not exists
  if (!podmanHandlerInstance) {
    podmanHandlerInstance = new AddressPodmanHandler();
    await podmanHandlerInstance.initialize();
  }
  
  let commandString = commandOrMethod;
  let context = (sourceContext && sourceContext.variables) ? Object.fromEntries(sourceContext.variables) : {};

  if (params) { // Method call style
      const paramsString = Object.entries(params)
          .map(([key, value]) => {
              if (typeof value === 'string' && value.includes(' ')) {
                  return `${key}="${value}"`;
              }
              return `${key}=${value}`;
          })
          .join(' ');
      commandString = `${commandOrMethod} ${paramsString}`;
      context = { ...context, ...params };
  }

  try {
    const result = await podmanHandlerInstance.handleAddressCommand(commandString, context);

    // Convert to REXX-style result - flatten important fields to top level for easy access
    return {
      success: result.success,
      errorCode: result.success ? 0 : 1,
      errorMessage: result.error || null,
      output: result.output || '',
      result: result,
      // Flatten commonly accessed fields to top level
      operation: result.operation,
      runtime: result.runtime,
      activeContainers: result.activeContainers,
      maxContainers: result.maxContainers,
      container: result.container,
      status: result.status,
      count: result.count,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
      binary: result.binary,
      target: result.target,
      rexxVariables: {
        'PODMAN_OPERATION': result.operation || '',
        'PODMAN_CONTAINER': result.container || '',
        'PODMAN_STATUS': result.status || '',
        'PODMAN_COUNT': result.count || 0,
        'PODMAN_EXIT_CODE': result.exitCode || 0,
        'PODMAN_STDOUT': result.stdout || '',
        'PODMAN_STDERR': result.stderr || '',
        'PODMAN_BINARY': result.binary || '',
        'PODMAN_TARGET': result.target || ''
      }
    };
  } catch (error) {
    return {
      success: false,
      errorCode: 1,
      errorMessage: error.message,
      output: error.message,
      result: { error: error.message },
      error: error.message,
      rexxVariables: {
        'PODMAN_ERROR': error.message
      }
    };
  }
}

// Method names for RexxJS method detection
const ADDRESS_PODMAN_METHODS = {
  'status': 'Get PODMAN handler status',
  'list': 'List containers',
  'create': 'Create a new container [interactive=true] [memory=512m] [cpus=1.0] [volumes=host:container] [environment=KEY=value]',
  'start': 'Start a container',
  'stop': 'Stop a container', 
  'remove': 'Remove a container',
  'deploy_rexx': 'Deploy RexxJS binary to container',
  'execute': 'Execute command in container',
  'execute_rexx': 'Execute RexxJS script in container [progress_callback=true] [timeout=30000]',
  'copy_to': 'Copy file to container',
  'copy_from': 'Copy file from container',
  'logs': 'Get container logs [lines=50]',
  'cleanup': 'Cleanup containers [all=true]',
  'security_audit': 'Get security audit log and policies',
  'process_stats': 'Get container process statistics and health',
  'configure_health_check': 'Configure health check for container [enabled=true] [interval=30000] [command=custom]',
  'start_monitoring': 'Start container process monitoring',
  'stop_monitoring': 'Stop container process monitoring',
  'checkpoint_status': 'Get bidirectional CHECKPOINT monitoring status'
};

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    PODMAN_ADDRESS_META,
    ADDRESS_PODMAN_HANDLER,
    ADDRESS_PODMAN_METHODS,
    AddressPodmanHandler // Export the class for testing
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  window.PODMAN_ADDRESS_META = PODMAN_ADDRESS_META;
  window.ADDRESS_PODMAN_HANDLER = ADDRESS_PODMAN_HANDLER;
  window.ADDRESS_PODMAN_METHODS = ADDRESS_PODMAN_METHODS;
}
