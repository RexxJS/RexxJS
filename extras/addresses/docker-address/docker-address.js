/*!
 * rexxjs/address-docker v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=DOCKER_ADDRESS_META
 */
/**
 * ADDRESS DOCKER Handler
 * Provides explicit ADDRESS DOCKER integration for container operations
 * 
 * Usage:
 *   REQUIRE "rexxjs/address-docker" AS DOCKER
 *   ADDRESS DOCKER
 *   "create image=debian:stable name=test-container"
 *   "status"
 *   "list"
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Modules will be loaded dynamically in initialize method
// Interpolation is now handled by the interpreter before ADDRESS commands are invoked

class AddressDockerHandler {
  constructor() {
    this.activeContainers = new Map();
    this.containerCounter = 0;
    this.defaultTimeout = 60000;
    this.maxContainers = 20;
    this.securityMode = 'moderate';
    this.allowedImages = new Set(['debian:stable', 'ubuntu:latest', 'alpine:latest']);
    this.trustedBinaries = new Set();
    this.runtime = 'docker';
    this.initialized = false;
    
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
  }

  /**
   * Initialize the ADDRESS DOCKER handler
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
      this.log = this.createLogFunction('ADDRESS_DOCKER');
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Docker handler: ${error.message}`);
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
   * Detect if docker runtime is available
   */
  async detectRuntime() {
    try {
      await this.testRuntime('docker');
      this.runtime = 'docker';
      return;
    } catch (error) {
      throw new Error('Docker runtime not found or not available');
    }
  }

  /**
   * Interpolate variables using RexxJS global interpolation pattern
   */
  interpolateVariables(str, variablePool) {
    if (!variablePool) {
      return str;
    }

    // Use the interpolation module directly
    try {
      const interpolationModule = require(this.path.join(__dirname, '../../..', 'core/src/interpolation.js'));
      const pattern = interpolationModule.getCurrentPattern();
      if (!pattern.hasDelims(str)) {
        return str;
      }

      return str.replace(pattern.regex, (match) => {
        const varName = pattern.extractVar(match);
        if (varName in variablePool) {
          return variablePool[varName];
        }
        return match; // Variable not found - leave as-is
      });
    } catch (error) {
      // Fallback to handlebars-style interpolation if module not available
      return str.replace(/\{\{([^}]+)\}\}/g, (m, v) => (variablePool[v] !== undefined ? String(variablePool[v]) : m));
    }
  }

  /**
   * Run a script from a variable name
   * run_script var=myScript
   */
  async runScriptFromVariable(params, context = {}) {
    const { var: varName } = params;

    if (!varName) {
      throw new Error('Missing required parameter: var (variable name containing script)');
    }

    // Look up the variable in the context
    const script = context[varName];

    if (!script) {
      throw new Error(`Variable '${varName}' not found in context or is empty`);
    }

    if (typeof script !== 'string') {
      throw new Error(`Variable '${varName}' must contain a string, got: ${typeof script}`);
    }

    this.log('run_script', { varName, scriptLength: script.length });

    // Execute as multi-line script
    return await this.handleMultiLineScript(script, context);
  }

  /**
   * Handle multi-line scripts (HEREDOC-style)
   */
  async handleMultiLineScript(script, context = {}) {
    // Split script into individual lines
    const lines = script.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

    if (lines.length === 0) {
      return {
        success: true,
        operation: 'multi_line_script',
        commandCount: 0,
        output: 'No commands to execute'
      };
    }

    this.log('multi_line_script', { lineCount: lines.length, lines });

    const results = [];
    let lastResult = null;

    // Execute each line sequentially
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      try {
        // Recursively call handleAddressCommand for each line
        // This ensures proper command processing and parameter extraction
        const result = await this.handleAddressCommand(line, context);

        results.push({
          line: i + 1,
          command: line,
          success: result.success,
          operation: result.operation,
          output: result.output
        });

        lastResult = result;

        // If a command fails, stop execution
        if (!result.success) {
          this.log('multi_line_script_failed', {
            line: i + 1,
            command: line,
            error: result.error
          });

          return {
            success: false,
            operation: 'multi_line_script',
            commandCount: lines.length,
            executedCount: i + 1,
            failedAt: i + 1,
            failedCommand: line,
            error: result.error || 'Command failed',
            results,
            output: `Multi-line script failed at line ${i + 1}: ${line}`
          };
        }
      } catch (error) {
        this.log('multi_line_script_error', {
          line: i + 1,
          command: line,
          error: error.message
        });

        return {
          success: false,
          operation: 'multi_line_script',
          commandCount: lines.length,
          executedCount: i + 1,
          failedAt: i + 1,
          failedCommand: line,
          error: error.message,
          results,
          output: `Multi-line script error at line ${i + 1}: ${error.message}`
        };
      }
    }

    // All commands executed successfully
    this.log('multi_line_script_complete', {
      commandCount: lines.length,
      allSucceeded: true
    });

    // Return the result of the last command as the primary result
    // but include metadata about the script execution
    return {
      ...lastResult,
      operation: 'multi_line_script',
      commandCount: lines.length,
      executedCount: lines.length,
      allSucceeded: true,
      results,
      output: `Multi-line script completed: ${lines.length} commands executed successfully`
    };
  }

  /**
   * Main handler for ADDRESS DOCKER commands
   */
  async handleAddressCommand(command, context = {}) {
    try {
      // Apply RexxJS variable interpolation
      let interpolatedCommand = this.interpolateVariables(command, context);

      // Check if this is a multi-line script (contains newlines)
      if (interpolatedCommand.includes('\n')) {
        return await this.handleMultiLineScript(interpolatedCommand, context);
      }

      this.log('command', { command: interpolatedCommand });

      const parsed = this.parseCommand(interpolatedCommand);
      
      switch (parsed.operation) {
        case 'status':
          return await this.getStatus();
        case 'check_docker_running':
          return await this.checkDockerRunning();
        case 'check_container_with_echo':
          return await this.checkContainerWithEcho(parsed.params, context);
        case 'run_script':
          return await this.runScriptFromVariable(parsed.params, context);
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
        case 'execute_stdin':
          return await this.executeWithStdin(parsed.params, context);
        case 'execute_rexx':
          return await this.executeRexx(parsed.params, context);
        case 'commit':
          return await this.handleCommit(parsed.params, context);
        case 'build_image':
          return await this.handleBuildImage(parsed.params, context);
        case 'wait_for_port':
          return await this.waitForPort(parsed.params, context);
        case 'shutdown':
          return this.handleShutdown();
        default:
          throw new Error(`Unknown ADDRESS DOCKER command: ${parsed.operation}`);
      }
    } catch (error) {
      this.log('error', { error: error.message, command });
      return {
        success: false,
        operation: 'error',
        error: error.message,
        output: error.message,
        exitCode: 1,
        stdout: '',
        stderr: error.message
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
   * Check if Docker is running
   */
  async checkDockerRunning() {
    try {
      // Try to run docker ps to check if daemon is running
      const result = await this.execPodmanCommand(['ps'], { timeout: 5000 });

      if (result.exitCode !== 0) {
        console.error('ERROR: Docker is not running or not accessible');
        console.error('  ' + result.stderr);
        return {
          success: false,
          operation: 'check_docker_running',
          error: 'Docker is not running or not accessible',
          stderr: result.stderr,
          output: 'Docker check failed'
        };
      }

      const containerCount = this.activeContainers.size;

      console.log('[1/14] Checking Docker status...');
      console.log('  ✓ Runtime: ' + this.runtime);
      console.log('  ✓ Max containers: ' + this.maxContainers);
      console.log('');

      return {
        success: true,
        operation: 'check_docker_running',
        runtime: this.runtime,
        maxContainers: this.maxContainers,
        output: 'Docker is running'
      };
    } catch (error) {
      console.error('ERROR: Docker check failed: ' + error.message);
      return {
        success: false,
        operation: 'check_docker_running',
        error: error.message,
        output: 'Docker check failed'
      };
    }
  }

  /**
   * Test if container is responding
   * Supports common test scenarios: 'echo', 'ls', 'pwd', or custom command
   */
  async checkContainerWithEcho(params, context) {
    const { container: name, test_command = 'echo test' } = params;

    if (!name) {
      console.error('ERROR: Missing required parameter: container');
      return {
        success: false,
        operation: 'check_container_with_echo',
        error: 'Missing required parameter: container',
        output: 'Container test failed'
      };
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      console.error('ERROR: Container not found: ' + name);
      return {
        success: false,
        operation: 'check_container_with_echo',
        error: 'Container not found: ' + name,
        output: 'Container test failed'
      };
    }

    if (container.status !== 'running') {
      console.error('ERROR: Container ' + name + ' is not running');
      return {
        success: false,
        operation: 'check_container_with_echo',
        error: 'Container ' + name + ' is not running',
        output: 'Container test failed'
      };
    }

    // Support shorthand test scenarios
    let testCmd = test_command;
    const testScenarios = {
      'echo': 'echo test',
      'ls': 'ls /',
      'pwd': 'pwd'
    };

    // If test_command is just a shorthand, expand it
    if (testScenarios[test_command]) {
      testCmd = testScenarios[test_command];
    }

    console.log('[6/14] Verifying container is running...');

    try {
      const result = await this.execInContainer(name, testCmd, { timeout: 5000 });

      console.log('  Exit code: ' + result.exitCode);
      console.log('  Success: ' + (result.exitCode === 0));
      console.log('  Stdout: ' + result.stdout);
      console.log('  Stderr: ' + result.stderr);

      if (result.exitCode !== 0) {
        console.error('  ERROR: Container not responding');

        // Cleanup on failure
        await this.execPodmanCommand(['stop', name]);
        await this.execPodmanCommand(['rm', name]);
        this.activeContainers.delete(name);

        return {
          success: false,
          operation: 'check_container_with_echo',
          container: name,
          testCommand: testCmd,
          exitCode: result.exitCode,
          error: 'Container not responding',
          stdout: result.stdout,
          stderr: result.stderr,
          output: 'Container test failed'
        };
      }

      console.log('  ✓ Container responding');
      console.log('');

      return {
        success: true,
        operation: 'check_container_with_echo',
        container: name,
        testCommand: testCmd,
        exitCode: result.exitCode,
        output: 'Container is responding'
      };
    } catch (error) {
      console.error('  ERROR: Container test failed: ' + error.message);

      // Cleanup on failure
      try {
        await this.execPodmanCommand(['stop', name]);
        await this.execPodmanCommand(['rm', name]);
        this.activeContainers.delete(name);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      return {
        success: false,
        operation: 'check_container_with_echo',
        container: name,
        testCommand: testCmd,
        error: error.message,
        output: 'Container test failed'
      };
    }
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
   * Check if a container exists in Docker (not just our tracking)
   */
  async containerExistsInDocker(containerName) {
    try {
      const result = await this.execPodmanCommand(['ps', '-a', '--filter', `name=^${containerName}$`, '--format', '{{.Names}}']);
      return result.exitCode === 0 && result.stdout.trim() === containerName;
    } catch (error) {
      return false;
    }
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

    // Check container limits (only count containers we know exist in Docker)
    if (this.activeContainers.size >= this.maxContainers) {
      throw new Error(`Maximum containers reached: ${this.maxContainers}`);
    }

    // Enhanced security validation
    const securityViolations = this.validateContainerSecurity(params);
    if (securityViolations.length > 0) {
      this.auditSecurityEvent('security_violation', { violations: securityViolations, operation: 'create' });
      throw new Error(`Security violations: ${securityViolations.join('; ')}`);
    }

    const containerName = (name && name.trim()) || `docker-container-${++this.containerCounter}`;

    // Check for name conflicts - check actual Docker state, not just our tracking
    if (name && name.trim()) {
      const existsInDocker = await this.containerExistsInDocker(name.trim());
      if (existsInDocker) {
        throw new Error(`Container name already exists: ${name.trim()}`);
      }
      // If it's in our map but not in Docker, remove the stale entry
      if (this.activeContainers.has(name.trim()) && !existsInDocker) {
        this.log('removing_stale_entry', { name: name.trim() });
        this.activeContainers.delete(name.trim());
      }
    }
    
    // Real docker container creation with enhanced options
    const createArgs = ['create', '--name', containerName];
    
    // Add resource limits
    if (memory) {
      createArgs.push('--memory', memory);
    }
    if (cpus) {
      createArgs.push('--cpus', cpus);
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

    // Add port mappings
    if (ports) {
      const portMappings = ports.split(',');
      for (const portMapping of portMappings) {
        createArgs.push('-p', portMapping.trim());
      }
    }

    // Add interactive flags
    if (interactive === 'true') {
      createArgs.push('-i', '-t'); // interactive and pseudo-TTY
    }
    
    createArgs.push(image);

    // Add command if provided, otherwise use defaults
    if (command) {
      // Split command into array for docker
      const cmdParts = command.trim().split(/\s+/);
      createArgs.push(...cmdParts);
    } else if (interactive === 'true') {
      // If interactive but no command, start with bash
      createArgs.push('bash');
    }
    
    this.log('docker_create_start', { containerName, image, args: createArgs });
    const result = await this.execPodmanCommand(createArgs);
    this.log('docker_create_result', { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr });
    
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

    // Real docker start
    const result = await this.execPodmanCommand(['start', name]);

    if (result.exitCode === 0) {
      // Wait for container to be actually running (max 5 seconds)
      const maxRetries = 10;
      const retryDelay = 500; // 500ms between retries
      let isRunning = false;

      for (let i = 0; i < maxRetries; i++) {
        try {
          const inspectResult = await this.execPodmanCommand(['inspect', name]);
          if (inspectResult.exitCode === 0) {
            const inspectData = JSON.parse(inspectResult.stdout)[0];
            if (inspectData.State.Running) {
              isRunning = true;
              break;
            }
          }
        } catch (error) {
          // Ignore inspect errors and retry
        }

        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      if (!isRunning) {
        throw new Error(`Container ${name} started but is not running after ${maxRetries * retryDelay}ms`);
      }

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
   * Remove a container (or multiple containers)
   * Supports comma-separated container names, force=true, ignore_missing=true
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
          // Try to remove anyway in case it exists in Docker but not in our tracking
          const result = await this.execPodmanCommand(['rm', '-f', containerName]);

          if (result.exitCode === 0) {
            this.log('container_removed_untracked', { name: containerName });
            results.push({ container: containerName, status: 'removed', tracked: false });
            successCount++;
          } else {
            // Container truly doesn't exist
            this.log('container_missing_skipped', { name: containerName });
            results.push({ container: containerName, status: 'skipped', reason: 'not found' });
            skipCount++;
          }
          continue;
        }

        if (!exists && !ignoreMissing) {
          throw new Error(`Container not found: ${containerName}`);
        }

        // If force=true, stop the container first if it's running
        if (forceRemove) {
          const container = this.activeContainers.get(containerName);
          if (container && container.status === 'running') {
            await this.execPodmanCommand(['stop', containerName]);
            this.log('container_force_stopped', { name: containerName });
          }
        }

        // Remove the container
        const removeArgs = forceRemove ? ['rm', '-f', containerName] : ['rm', containerName];
        const result = await this.execPodmanCommand(removeArgs);

        if (result.exitCode === 0) {
          this.activeContainers.delete(containerName);
          this.log('container_removed', { name: containerName, force: forceRemove });
          results.push({ container: containerName, status: 'removed', forced: forceRemove });
          successCount++;
        } else {
          if (ignoreMissing && result.stderr.includes('No such container')) {
            results.push({ container: containerName, status: 'skipped', reason: 'not found' });
            skipCount++;
          } else {
            throw new Error(`Failed to remove container: ${result.stderr}`);
          }
        }
      } catch (error) {
        if (ignoreMissing) {
          this.log('container_remove_error_ignored', { name: containerName, error: error.message });
          results.push({ container: containerName, status: 'error', error: error.message, ignored: true });
          errorCount++;
        } else {
          throw error;
        }
      }
    }

    // Build output message
    let outputParts = [];
    if (successCount > 0) outputParts.push(`${successCount} removed`);
    if (skipCount > 0) outputParts.push(`${skipCount} skipped`);
    if (errorCount > 0) outputParts.push(`${errorCount} errors (ignored)`);

    return {
      success: true,
      operation: 'remove',
      containers: containerNames,
      count: containerNames.length,
      successCount,
      skipCount,
      errorCount,
      results,
      output: `Containers: ${outputParts.join(', ')}`
    };
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

      // Test binary - optional, warn if it fails
      const testResult = await this.execInContainer(name, `${interpolatedTarget} --version 2>&1 || echo 'binary check skipped'`, { timeout: 10000 });

      const binaryWorking = testResult.exitCode === 0 && !testResult.stdout.includes('binary check skipped');

      if (!binaryWorking) {
        this.log('binary_test_skipped', {
          container: name,
          reason: 'Binary verification failed - may be incompatible libc (alpine vs glibc)',
          stderr: testResult.stderr
        });
      }

      // Mark container as having RexxJS deployed
      container.rexxDeployed = true;
      container.rexxPath = interpolatedTarget;

      this.log('binary_deployed', {
        container: name,
        binary: interpolatedBinary,
        target: interpolatedTarget,
        tested: binaryWorking
      });

      return {
        success: true,
        operation: 'deploy_rexx',
        container: name,
        binary: interpolatedBinary,
        target: interpolatedTarget,
        tested: binaryWorking,
        output: `RexxJS binary deployed to ${name} at ${interpolatedTarget}${binaryWorking ? '' : ' (binary verification skipped)'}`
      };
    } catch (error) {
      throw new Error(`Failed to deploy RexxJS binary: ${error.message}`);
    }
  }

  /**
   * Execute command in container
   * execute container="test-container" command="ls -la" [timeout=30000] [working_dir="/tmp"] [detached=false]
   */
  async executeInContainer(params, context) {
    const { container: name, command: cmd, timeout, working_dir, detached = 'false' } = params;

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
      // Use detached execution if requested
      if (detached === 'true') {
        const result = await this.execInContainerDetached(name, fullCommand);

        this.log('command_executed_detached', {
          container: name,
          command: interpolatedCmd
        });

        return {
          success: true,
          operation: 'execute',
          container: name,
          command: interpolatedCmd,
          detached: true,
          output: 'Command started in detached mode'
        };
      } else {
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
      }
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Execute command with stdin input
   * execute_stdin container="test-container" command="/usr/local/bin/rexx --stdin" stdin_var="setupScript" [timeout=30000]
   * Note: Either 'input' (direct content) or 'stdin_var' (variable name) can be used
   */
  async executeWithStdin(params, context) {
    this.log('execute_stdin_params', {
      containerParam: params.container,
      hasInput: !!params.input,
      hasStdinVar: !!params.stdin_var
    });

    let { container: name, command: cmd, input, stdin_var, timeout } = params;

    // If stdin_var is provided, look up that variable in the context
    if (!input && stdin_var && context) {
      input = context[stdin_var];
      if (!input) {
        throw new Error(`Variable '${stdin_var}' not found in context or is empty`);
      }
    }

    if (!name || !cmd || !input) {
      throw new Error(`Missing required parameters: container, command, and input (got container=${name}, cmd=${cmd}, input=${input ? 'present' : 'missing'})`);
    }

    const container = this.activeContainers.get(name);
    if (!container) {
      throw new Error(`Container not found: ${name}`);
    }

    if (container.status !== 'running') {
      throw new Error(`Container ${name} must be running to execute commands`);
    }

    const interpolatedCmd = this.interpolateVariables(cmd, context);
    const interpolatedInput = this.interpolateVariables(input, context);

    const execTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;

    try {
      const result = await this.execInContainerWithStdin(name, interpolatedCmd, interpolatedInput, { timeout: execTimeout });

      this.log('stdin_executed', {
        container: name,
        command: interpolatedCmd,
        exitCode: result.exitCode,
        inputLength: interpolatedInput.length
      });

      return {
        success: result.exitCode === 0,
        operation: 'execute_stdin',
        container: name,
        command: interpolatedCmd,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        output: result.exitCode === 0 ? result.stdout : `Command failed: ${result.stderr}`
      };
    } catch (error) {
      throw new Error(`Stdin execution failed: ${error.message}`);
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
      // Check if script is available from context first (for multi-line HEREDOCs)
      if (!script || typeof script !== 'string') {
        // Try to get from context variables
        if (context && context.setup_script && typeof context.setup_script === 'string') {
          rexxScript = context.setup_script;
        } else {
          throw new Error(`Script parameter must be a string, got: ${typeof script}`);
        }
      } else {
        rexxScript = this.interpolateVariables(script, context);
      }
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

    // Real mode - execute actual docker cp command
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

    // Real mode - execute actual docker cp command
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

    // Real mode - execute actual docker logs command
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

      const exec = this.spawn('docker', ['exec', containerName, 'sh', '-c', command], {
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
   * Execute command in container with stdin input
   */
  async execInContainerWithStdin(containerName, command, input, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || this.defaultTimeout;

      const exec = this.spawn('docker', ['exec', '-i', containerName, 'sh', '-c', command], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // Write input to stdin
      exec.stdin.write(input);
      exec.stdin.end();

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
   * Execute command in container in detached mode (background)
   */
  async execInContainerDetached(containerName, command) {
    return new Promise((resolve, reject) => {
      const exec = this.spawn('docker', ['exec', '-d', containerName, 'sh', '-c', command], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';

      exec.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      exec.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          reject(new Error(`Detached execution failed: ${stderr}`));
        }
      });

      exec.on('error', (error) => {
        reject(new Error(`Detached execution error: ${error.message}`));
      });
    });
  }

  /**
   * Copy file to container
   */
  async copyToContainer(containerName, localPath, remotePath) {
    return new Promise((resolve, reject) => {
      // Resolve symlinks before copying - docker cp doesn't follow symlinks
      let resolvedPath = localPath;
      try {
        const stats = this.fs.lstatSync(localPath);
        if (stats.isSymbolicLink()) {
          resolvedPath = this.fs.realpathSync(localPath);
          this.log('symlink_resolved', { original: localPath, resolved: resolvedPath });
        }
      } catch (error) {
        // If we can't stat the file, let docker cp try and fail with better error
        this.log('symlink_check_failed', { path: localPath, error: error.message });
      }

      const copy = this.spawn('docker', ['cp', resolvedPath, `${containerName}:${remotePath}`], {
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
      const write = this.spawn('docker', ['exec', '-i', containerName, 'sh', '-c', `cat > ${remotePath}`], {
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
   * Execute docker command
   */
  async execPodmanCommand(args, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    
    return new Promise((resolve, reject) => {
      const child = this.spawn('docker', args, {
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
        reject(new Error(`Docker command failed: ${error.message}`));
      });

      // Set timeout
      if (timeout > 0) {
        setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Docker command timeout after ${timeout}ms`));
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
      const child = this.spawn('docker', ['exec', '-i', containerName, 'sh', '-c', command], {
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
      const child = this.spawn('docker', ['exec', '-i', containerName, 'sh', '-c', command], {
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
   * Handle commit command
   * commit container="name" image="repo/name:tag"
   */
  async handleCommit(params, context) {
    const { container, image } = params;

    if (!container || !image) {
      throw new Error('commit requires container and image parameters');
    }

    const containerInfo = this.activeContainers.get(container);
    if (!containerInfo) {
      throw new Error(`Container not found: ${container}`);
    }

    const args = ['commit', container, image];

    try {
      const result = await this.execPodmanCommand(args);

      if (result.exitCode === 0) {
        this.log('commit_success', {
          container,
          image
        });

        return {
          success: true,
          operation: 'commit',
          container,
          image,
          imageId: result.stdout.trim(),
          output: `Committed ${container} to ${image}`
        };
      } else {
        throw new Error(`Commit operation failed: ${result.stderr || result.stdout}`);
      }
    } catch (error) {
      throw new Error(`Commit failed: ${error.message}`);
    }
  }

  /**
   * Handle build_image command
   * build_image from_image="base:tag" tag="new:tag" cmd="ruby /app.rb"
   */
  async handleBuildImage(params, context) {
    const { from_image, tag, cmd } = params;

    if (!from_image || !tag || !cmd) {
      throw new Error('build_image requires from_image, tag, and cmd parameters');
    }

    this.log('build_image_params', {
      from_image,
      tag,
      cmd_raw: cmd,
      cmd_type: typeof cmd
    });

    // Convert cmd to JSON array format for Dockerfile CMD instruction
    // If cmd looks like JSON array already, use as-is, otherwise split into array
    let cmdArray;
    if (cmd.trim().startsWith('[')) {
      // Already JSON format
      cmdArray = cmd;
    } else {
      // Simple command string - split into array
      const cmdParts = cmd.trim().split(/\s+/);
      cmdArray = JSON.stringify(cmdParts);
    }

    this.log('build_image_cmd_array', {
      cmdArray
    });

    // Create temporary Dockerfile
    const dockerfileContent = `FROM ${from_image}\nCMD ${cmdArray}`;
    const tempDir = `/tmp/docker-build-${Date.now()}`;
    const dockerfilePath = `${tempDir}/Dockerfile`;

    try {
      // Create temp directory
      this.fs.mkdirSync(tempDir, { recursive: true });

      // Write Dockerfile
      this.fs.writeFileSync(dockerfilePath, dockerfileContent);

      this.log('build_image_start', {
        from_image,
        tag,
        cmd: cmdArray,
        dockerfile: dockerfilePath
      });

      // Build image
      const args = ['build', '-t', tag, '-f', dockerfilePath, tempDir];
      const result = await this.execPodmanCommand(args, { timeout: 120000 });

      // Cleanup temp directory
      this.fs.rmSync(tempDir, { recursive: true, force: true });

      if (result.exitCode === 0) {
        this.log('build_image_success', {
          tag
        });

        return {
          success: true,
          operation: 'build_image',
          from_image,
          tag,
          cmd: cmdArray,
          output: `Built image ${tag} from ${from_image}`
        };
      } else {
        throw new Error(`Build failed: ${result.stderr || result.stdout}`);
      }
    } catch (error) {
      // Cleanup on error
      try {
        this.fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw new Error(`Image build failed: ${error.message}`);
    }
  }

  /**
   * Wait for container port to be ready (makes HTTP GET request to verify service is responding)
   * wait_for_port container="test-container" port=4567 [timeout=60000] [retryInterval=1000] [maxRetries=60]
   */
  async waitForPort(params, context) {
    const { container: name, port, timeout = '60000', retryInterval = '1000', maxRetries = '60' } = params;

    if (!name) {
      throw new Error('Missing required parameter: container');
    }

    if (!port) {
      throw new Error('Missing required parameter: port');
    }

    // Check if container is running (either tracked or via docker inspect)
    let containerRunning = false;
    const container = this.activeContainers.get(name);

    if (container) {
      // Container is tracked - check our status
      if (container.status !== 'running') {
        throw new Error(`Container ${name} must be running to wait for port`);
      }
      containerRunning = true;
    } else {
      // Container not tracked - verify it exists and is running via docker inspect
      try {
        const inspectResult = await this.execPodmanCommand(['inspect', name]);
        if (inspectResult.exitCode === 0) {
          const inspectData = JSON.parse(inspectResult.stdout)[0];
          if (inspectData.State.Running) {
            containerRunning = true;
          } else {
            throw new Error(`Container ${name} exists but is not running`);
          }
        } else {
          throw new Error(`Container not found: ${name}`);
        }
      } catch (error) {
        throw new Error(`Container not found or not accessible: ${name}`);
      }
    }

    const portNum = parseInt(port);
    const timeoutMs = parseInt(timeout);
    const retryMs = parseInt(retryInterval);
    const maxRetry = parseInt(maxRetries);

    this.log('wait_for_port_start', {
      container: name,
      port: portNum,
      timeout: timeoutMs,
      retryInterval: retryMs,
      maxRetries: maxRetry
    });

    const startTime = Date.now();
    let attempt = 0;
    let lastError = null;

    // Import http module for HTTP request testing
    const http = require('http');

    // Try to make HTTP GET request to the port
    while (attempt < maxRetry) {
      attempt++;
      const elapsed = Date.now() - startTime;

      // Check if we've exceeded the timeout
      if (elapsed >= timeoutMs) {
        throw new Error(`Port ${portNum} not ready after ${timeoutMs}ms (${attempt} attempts). Last error: ${lastError || 'connection refused'}`);
      }

      try {
        // Attempt HTTP GET to localhost:port/
        await new Promise((resolve, reject) => {
          const requestTimeout = Math.min(retryMs, 5000); // Max 5 seconds per attempt

          const req = http.request({
            hostname: 'localhost',
            port: portNum,
            path: '/',
            method: 'GET',
            timeout: requestTimeout
          }, (res) => {
            // Any response (even errors) means the HTTP server is responding
            res.resume(); // Consume response data
            resolve();
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('HTTP request timeout'));
          });

          req.on('error', (err) => {
            reject(err);
          });

          req.end();
        });

        // Success! HTTP server is responding
        const duration = Date.now() - startTime;
        this.log('wait_for_port_success', {
          container: name,
          port: portNum,
          attempts: attempt,
          duration
        });

        return {
          success: true,
          operation: 'wait_for_port',
          container: name,
          port: portNum,
          attempts: attempt,
          duration,
          output: `Port ${portNum} is ready after ${attempt} attempts (${duration}ms)`
        };
      } catch (error) {
        lastError = error.message;

        this.log('wait_for_port_retry', {
          container: name,
          port: portNum,
          attempt,
          error: error.message,
          nextRetryIn: retryMs
        });

        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, retryMs));
      }
    }

    // Max retries reached
    throw new Error(`Port ${portNum} not ready after ${maxRetry} attempts. Last error: ${lastError || 'connection refused'}`);
  }

  /**
   * Handle shutdown command - clean up resources and exit process
   */
  handleShutdown() {
    this.log('shutdown_initiated', {
      activeContainers: this.activeContainers.size
    });

    this.destroy();

    // Exit immediately - the destroy() has already cleaned up all timers
    setImmediate(() => {
      process.exit(0);
    });

    return {
      success: true,
      operation: 'shutdown',
      output: 'Handler shutdown complete'
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
let dockerHandlerInstance = null;

// Consolidated metadata provider function
function DOCKER_ADDRESS_META() {
  return {
    namespace: "rexxjs",
    dependencies: {"child_process": "builtin"},
    envVars: [],
    type: 'address-target',
    name: 'ADDRESS DOCKER Container Service',
    version: '1.0.0',
    description: 'Docker container management via ADDRESS interface',
    detectionFunction: 'DOCKER_ADDRESS_META'
  };
}

// ADDRESS target handler function with REXX variable management
async function ADDRESS_DOCKER_HANDLER(commandOrMethod, params, sourceContext) {
  // Initialize handler instance if not exists
  if (!dockerHandlerInstance) {
    dockerHandlerInstance = new AddressDockerHandler();
    await dockerHandlerInstance.initialize();
  }

  let commandString = commandOrMethod;
  let context = (sourceContext && sourceContext.variables) ? Object.fromEntries(sourceContext.variables) : {};

  // Params are passed in context, not serialized into commandString
  if (params) {
      context = { ...context, ...params };
  }

  try {
    const result = await dockerHandlerInstance.handleAddressCommand(commandString, context);

    // Return result directly - RexxJS will set RESULT to this entire object
    // Properties can be accessed as RESULT.property in REXX
    return {
      ...result,  // Spread all result properties at top level
      errorCode: result.success ? 0 : 1,
      errorMessage: result.error || null,
      rexxVariables: {
        'DOCKER_OPERATION': result.operation || '',
        'DOCKER_CONTAINER': result.container || '',
        'DOCKER_STATUS': result.status || '',
        'DOCKER_COUNT': result.count || 0,
        'DOCKER_EXIT_CODE': result.exitCode || 0,
        'DOCKER_STDOUT': result.stdout || '',
        'DOCKER_STDERR': result.stderr || '',
        'DOCKER_BINARY': result.binary || '',
        'DOCKER_TARGET': result.target || ''
      }
    };
  } catch (error) {
    return {
      success: false,
      errorCode: 1,
      errorMessage: error.message,
      output: error.message,
      error: error.message,
      rexxVariables: {
        'DOCKER_ERROR': error.message
      }
    };
  }
}

// Method names for RexxJS method detection
const ADDRESS_DOCKER_METHODS = {
  'status': 'Get DOCKER handler status',
  'check_docker_running': 'Check if Docker is running',
  'check_container_with_echo': 'Test if container is responding [test_command=echo|ls|pwd|custom]',
  'run_script': 'Execute multi-line script from variable [var=variableName]',
  'list': 'List containers',
  'create': 'Create a new container [interactive=true] [memory=512m] [cpus=1.0] [volumes=host:container] [environment=KEY=value]',
  'start': 'Start a container',
  'stop': 'Stop a container',
  'remove': 'Remove container(s) - supports comma-separated names [force=true] [ignore_missing=true]',
  'deploy_rexx': 'Deploy RexxJS binary to container',
  'execute': 'Execute command in container',
  'execute_stdin': 'Execute command with stdin input - use stdin_var to specify variable name [timeout=30000]',
  'execute_rexx': 'Execute RexxJS script in container [progress_callback=true] [timeout=30000]',
  'copy_to': 'Copy file to container',
  'copy_from': 'Copy file from container',
  'logs': 'Get container logs [lines=50]',
  'cleanup': 'Cleanup containers [all=true]',
  'commit': 'Commit container to image',
  'build_image': 'Build image from base with CMD',
  'wait_for_port': 'Wait for container port to be ready [port=4567] [timeout=60000] [retryInterval=1000] [maxRetries=60]',
  'security_audit': 'Get security audit log and policies',
  'process_stats': 'Get container process statistics and health',
  'configure_health_check': 'Configure health check for container [enabled=true] [interval=30000] [command=custom]',
  'start_monitoring': 'Start container process monitoring',
  'stop_monitoring': 'Stop container process monitoring',
  'checkpoint_status': 'Get bidirectional CHECKPOINT monitoring status',
  'shutdown': 'Clean up handler resources and exit process'
};

// UMD pattern for both Node.js and browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    DOCKER_ADDRESS_META,
    ADDRESS_DOCKER_HANDLER,
    ADDRESS_DOCKER_METHODS,
    AddressDockerHandler // Export the class for testing
  };
} else if (typeof window !== 'undefined') {
  // Browser environment - attach to global window
  window.DOCKER_ADDRESS_META = DOCKER_ADDRESS_META;
  window.ADDRESS_DOCKER_HANDLER = ADDRESS_DOCKER_HANDLER;
  window.ADDRESS_DOCKER_METHODS = ADDRESS_DOCKER_METHODS;
}
