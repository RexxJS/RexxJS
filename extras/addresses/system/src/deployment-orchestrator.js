/**
 * SCRO (Source-Controlled Remote Orchestration) - Enhanced Infrastructure as Code
 * 
 * SCRO provides procedural orchestration of remote systems with:
 * - Minimal remote dependencies (50MB self-contained RexxJS binary)
 * - Bidirectional CHECKPOINT communication for real-time progress monitoring  
 * - Progressive orchestration with cross-system state coordination
 * - Clean deployment/cleanup cycle (deploy, execute, remove)
 * - Same runtime consistency across orchestrator and all remote systems
 * 
 * Key SCRO Enhancements over Traditional IaC:
 * - Built-in bidirectional progress communication
 * - Zero persistent remote dependencies
 * - Runtime consistency across all systems
 * - Self-contained orchestration logic
 * 
 * Usage:
 * ADDRESS scro
 * setup_container image="debian:stable" name="worker1" rexx_binary="./rexx-linux-x64" 
 * execute_remote script="data-processing.rexx" target="worker1" progress=true
 * setup_remote_shell host="server.com" user="admin" key="~/.ssh/id_rsa"
 * deploy_and_execute script="analysis.rexx" host="server.com" progress=true
 * 
 * CHECKPOINT Communication Pattern:
 * checkpoint_id = execute_remote script="worker.rexx" target="container1" progress=true
 * WAIT FOR CHECKPOINT checkpoint_id timeout=30000
 * LIST CHECKPOINTS  # Show all active remote orchestrations
 * 
 * Remote Rexx scripts use CHECKPOINT() calls which communicate back to the
 * orchestrator via WebSocket or HTTP polling for real-time progress monitoring.
 * 
 * Copyright (c) 2025 Paul Hammant  
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity } = require('../../../../core/src/address-handler-utils');

// Helper function for logging
function log(operation, details) {
  logActivity('DEPLOYMENT', operation, details);
}
const RemoteShellHandler = require('./remote-shell-handler');
// The container handler: podman-address's (it moved there in 320a693)
const { AddressPodmanHandler: PodmanHandler } = require('../../podman-address/podman-address.js');

class SCROOrchestrator {
  constructor() {
    this.remoteShell = new RemoteShellHandler();
    this.container = new PodmanHandler();
    this.deploymentCounter = 0;
    this.activeDeployments = new Map();
    this.defaultBinaryPath = null;
    this.progressCallbacks = new Map();
    
    // CHECKPOINT communication setup - bidirectional progress monitoring
    this.checkpointHandler = null;
    this.progressSocket = null;
    this.activeCheckpoints = new Map(); // Track ongoing checkpoints from remote scripts
    this.checkpointCounter = 0;
  }

  /**
   * Initialize deployment handler
   */
  async initialize(config = {}) {
    this.defaultBinaryPath = config.defaultBinaryPath || this.findRexxBinary();
    
    // Initialize sub-handlers
    await this.remoteShell.initialize(config.remoteShell || {});
    await this.container.initialize(config.container || {});
    
    // Setup CHECKPOINT communication if enabled
    if (config.enableProgressCallbacks) {
      this.setupCheckpointCommunication(config.progressConfig || {});
    }
    
    log('ADDRESS:DEPLOYMENT', {
      timestamp: new Date().toISOString(),
      action: 'initialize',
      defaultBinaryPath: this.defaultBinaryPath,
      progressEnabled: !!this.checkpointHandler
    });
  }

  /**
   * Handle ADDRESS deployment commands
   */
  async handleMessage(message, context) {
    try {
      const command = message.trim();
      const args = this.parseCommand(command);
      
      log('ADDRESS:DEPLOYMENT', {
        timestamp: new Date().toISOString(),
        action: 'command',
        command: command,
        args: args
      });

      switch (args.operation) {
        case 'setup_container':
          return await this.handleSetupContainer(args, context);
        case 'setup_remote_shell':
          return await this.handleSetupRemoteShell(args, context);
        case 'execute_remote':
          return await this.handleExecuteRemote(args, context);
        case 'deploy_and_execute':
          return await this.handleDeployAndExecute(args, context);
        case 'build_and_deploy':
          return await this.handleBuildAndDeploy(args, context);
        case 'monitor_deployment':
          return await this.handleMonitorDeployment(args, context);
        case 'cleanup_deployment':
          return await this.handleCleanupDeployment(args, context);
        case 'list_deployments':
          return await this.handleListDeployments(args, context);
        case 'checkpoint':
        case 'get_checkpoint':
        case 'poll_checkpoint':
          return this.getCheckpointStatus(args.checkpointId || args.checkpoint_id);
        case 'wait_for_checkpoint':
        case 'wait_checkpoint':
          return await this.waitForCheckpoint(args.checkpointId || args.checkpoint_id, args.timeout);
        case 'list_checkpoints':
          return this.listActiveCheckpoints();
        default:
          throw new Error(`Unknown deployment operation: ${args.operation}`);
      }
    } catch (error) {
      log('ADDRESS:DEPLOYMENT', {
        timestamp: new Date().toISOString(),
        action: 'error',
        error: error.message,
        command: message
      });
      throw error;
    }
  }

  /**
   * Parse command into operation and parameters
   */
  parseCommand(command) {
    const operation = command.split(/\s+/, 1)[0];
    const args = { operation: operation.toLowerCase() };

    // key=value pairs; a double-quoted value may contain spaces (scripts do)
    const pairPattern = /(\w+)=("[^"]*"|\S+)/g;
    const rest = command.slice(operation.length);
    let match;
    while ((match = pairPattern.exec(rest)) !== null) {
      args[match[1]] = match[2].replace(/^"(.*)"$/s, '$1');
    }

    return args;
  }

  /**
   * Handle setup_container command
   * setup_container image="debian:stable" name="worker1" rexx_binary="./rexx-linux-x64" [interactive=false]
   */
  async handleSetupContainer(args, context) {
    const { image, name, rexx_binary, interactive = 'false' } = args;

    if (!image || !name) {
      throw new Error('setup_container requires image and name parameters');
    }

    const deploymentId = `container_${name}_${++this.deploymentCounter}`;
    const binaryPath = rexx_binary || this.defaultBinaryPath;

    if (!binaryPath) {
      throw new Error('RexxJS binary path required (rexx_binary parameter or default)');
    }

    try {
      // Create container
      const createResult = await this.container.handleAddressCommand(
        `create image="${image}" name="${name}" interactive=${interactive}`,
        context
      );

      if (!createResult.success) {
        throw new Error(`Container creation failed: ${createResult.error}`);
      }

      // Start it: podman's create leaves it 'created', and deploy_rexx and
      // execute_rexx both need it 'running'
      const startResult = await this.container.handleAddressCommand(
        `start name="${name}"`,
        context
      );

      if (!startResult.success) {
        throw new Error(`Container start failed: ${startResult.error}`);
      }

      // Deploy RexxJS binary
      const deployResult = await this.container.handleAddressCommand(
        `deploy_rexx container="${name}" rexx_binary="${binaryPath}"`,
        context
      );

      if (!deployResult.success) {
        throw new Error(`RexxJS deployment failed: ${deployResult.error}`);
      }

      // Store deployment info
      const deployment = {
        id: deploymentId,
        type: 'container',
        target: name,
        image,
        binaryPath,
        createdAt: new Date(),
        status: 'ready',
        interactive: interactive === 'true'
      };

      this.activeDeployments.set(deploymentId, deployment);

      log('ADDRESS:DEPLOYMENT', {
        timestamp: new Date().toISOString(),
        action: 'setup_container_success',
        deploymentId,
        containerName: name,
        image
      });

      return {
        success: true,
        deploymentId,
        containerName: name,
        image,
        binaryPath,
        status: 'ready',
        message: `Container ${name} ready for RexxJS execution`
      };
    } catch (error) {
      throw new Error(`Container setup failed: ${error.message}`);
    }
  }

  /**
   * Handle setup_remote_shell command
   * setup_remote_shell host="server.com" user="admin" key="~/.ssh/id_rsa" [alias="server1"]
   */
  async handleSetupRemoteShell(args, context) {
    const { host, user, key, alias, rexx_binary } = args;

    if (!host || !user) {
      throw new Error('setup_remote_shell requires host and user parameters');
    }

    const deploymentId = `remote_${alias || host}_${++this.deploymentCounter}`;
    const connectionAlias = alias || `conn_${this.deploymentCounter}`;

    try {
      // Setup remote shell connection (key is optional: without one, ssh
      // uses its own default identities)
      const keyArg = key ? ` key="${key}"` : '';
      const connectResult = await this.remoteShell.handleMessage(
        `connect host="${host}" user="${user}"${keyArg} alias="${connectionAlias}"`,
        context
      );

      if (!connectResult.success) {
        throw new Error(`Remote connection failed: ${connectResult.message}`);
      }

      // Deploy RexxJS binary if specified
      let binaryDeployed = false;
      if (rexx_binary) {
        const binaryPath = await interpolateMessage(rexx_binary, context);
        
        try {
          // Upload binary
          await this.remoteShell.handleMessage(
            `upload local="${binaryPath}" remote="/tmp/rexx" connection="${connectionAlias}"`,
            context
          );

          // Make executable and move to /usr/local/bin
          await this.remoteShell.handleMessage(
            `execute command="sudo chmod +x /tmp/rexx && sudo mv /tmp/rexx /usr/local/bin/" connection="${connectionAlias}"`,
            context
          );

          binaryDeployed = true;
        } catch (error) {
          log('ADDRESS:DEPLOYMENT', {
            timestamp: new Date().toISOString(),
            action: 'binary_deploy_warning',
            deploymentId,
            error: error.message
          });
        }
      }

      // Store deployment info
      const deployment = {
        id: deploymentId,
        type: 'remote_shell',
        target: connectionAlias,
        host,
        user,
        createdAt: new Date(),
        status: 'ready',
        binaryDeployed
      };

      this.activeDeployments.set(deploymentId, deployment);

      log('ADDRESS:DEPLOYMENT', {
        timestamp: new Date().toISOString(),
        action: 'setup_remote_shell_success',
        deploymentId,
        host,
        user,
        binaryDeployed
      });

      return {
        success: true,
        deploymentId,
        connectionAlias,
        host,
        user,
        binaryDeployed,
        status: 'ready',
        message: `Remote shell ${host} ready for execution`
      };
    } catch (error) {
      throw new Error(`Remote shell setup failed: ${error.message}`);
    }
  }

  /**
   * Handle execute_remote command
   * execute_remote script="data-processing.rexx" target="worker1" [progress=false] [timeout=60000]
   */
  async handleExecuteRemote(args, context) {
    const { script, target, progress = 'false', timeout, script_file } = args;

    if (!target || (!script && !script_file)) {
      throw new Error('execute_remote requires target and (script or script_file) parameters');
    }

    const deployment = this.findDeployment(target);
    const enableProgress = progress === 'true';
    const execTimeout = timeout ? parseInt(timeout) : 60000;

    let rexxScript;
    if (script_file) {
      const scriptPath = await interpolateMessage(script_file, context);
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script file not found: ${scriptPath}`);
      }
      rexxScript = fs.readFileSync(scriptPath, 'utf8');
    } else {
      rexxScript = await interpolateMessage(script, context);
    }

    try {
      let result;

      if (deployment.type === 'container') {
        // Execute in container
        const command = `execute_rexx container="${deployment.target}" script="${rexxScript}" timeout=${execTimeout} progress_callback=${progress}`;
        result = await this.container.handleAddressCommand(command, context);
      } else if (deployment.type === 'remote_shell') {
        // Execute on remote shell
        if (enableProgress) {
          result = await this.executeRemoteWithProgress(deployment, rexxScript, { timeout: execTimeout, context });
        } else {
          result = await this.executeRemoteSimple(deployment, rexxScript, { timeout: execTimeout, context });
        }
      } else {
        throw new Error(`Unsupported deployment type: ${deployment.type}`);
      }

      deployment.lastExecution = new Date();
      deployment.lastResult = result;

      log('ADDRESS:DEPLOYMENT', {
        timestamp: new Date().toISOString(),
        action: 'execute_remote_success',
        deploymentId: deployment.id,
        target: deployment.target,
        exitCode: result.exitCode,
        duration: result.duration
      });

      return {
        ...result,
        deploymentId: deployment.id,
        target: deployment.target,
        deploymentType: deployment.type
      };
    } catch (error) {
      throw new Error(`Remote execution failed: ${error.message}`);
    }
  }

  /**
   * Handle deploy_and_execute command - One-shot deployment and execution
   * deploy_and_execute script="analysis.rexx" host="server.com" user="admin" key="~/.ssh/id_rsa" [progress=true]
   */
  async handleDeployAndExecute(args, context) {
    const { script, host, user, key, progress = 'false', timeout, image, script_file } = args;

    if (!script && !script_file) {
      throw new Error('deploy_and_execute requires script or script_file parameter');
    }

    const useContainer = !!image;
    const deploymentId = `oneshot_${++this.deploymentCounter}`;
    
    try {
      let setupResult;
      
      if (useContainer) {
        // Container-based deployment
        const containerName = `oneshot-${deploymentId}`;
        setupResult = await this.handleSetupContainer({
          operation: 'setup_container',
          image,
          name: containerName,
          rexx_binary: this.defaultBinaryPath
        }, context);
        
        if (!setupResult.success) {
          throw new Error(`Container setup failed: ${setupResult.message}`);
        }

        // Execute in container
        const executeResult = await this.handleExecuteRemote({
          operation: 'execute_remote',
          script,
          script_file,
          target: containerName,
          progress,
          timeout
        }, context);

        // Cleanup container
        await this.container.handleAddressCommand(`remove name="${containerName}" force=true`, context);

        return {
          ...executeResult,
          deploymentType: 'oneshot_container',
          cleanedUp: true
        };
      } else {
        // Remote shell deployment
        if (!host || !user) {
          throw new Error('deploy_and_execute requires host and user for remote shell deployment');
        }

        setupResult = await this.handleSetupRemoteShell({
          operation: 'setup_remote_shell',
          host,
          user,
          key,
          alias: `oneshot-${deploymentId}`,
          rexx_binary: this.defaultBinaryPath
        }, context);

        if (!setupResult.success) {
          throw new Error(`Remote shell setup failed: ${setupResult.message}`);
        }

        // Execute on remote
        const executeResult = await this.handleExecuteRemote({
          operation: 'execute_remote',
          script,
          script_file,
          target: setupResult.connectionAlias,
          progress,
          timeout
        }, context);

        // Cleanup connection
        await this.remoteShell.handleMessage(`disconnect connection="${setupResult.connectionAlias}"`, context);

        return {
          ...executeResult,
          deploymentType: 'oneshot_remote',
          cleanedUp: true
        };
      }
    } catch (error) {
      throw new Error(`Deploy and execute failed: ${error.message}`);
    }
  }

  /**
   * Handle build_and_deploy command - Build binary then deploy
   * build_and_deploy target="linux-x64" deploy_to="container" image="debian:stable" name="builder"
   */
  async handleBuildAndDeploy(args, context) {
    const { target = 'linux-x64', deploy_to, image, name, host, user, key } = args;

    if (!deploy_to || (deploy_to === 'container' && !image) || (deploy_to === 'remote' && (!host || !user))) {
      throw new Error('build_and_deploy requires valid deployment target configuration');
    }

    try {
      // Build binary
      const buildResult = await this.buildRexxBinary(target);
      
      if (!buildResult.success) {
        throw new Error(`Binary build failed: ${buildResult.message}`);
      }

      // Deploy based on target
      if (deploy_to === 'container') {
        return await this.handleSetupContainer({
          operation: 'setup_container',
          image,
          name,
          rexx_binary: buildResult.binaryPath
        }, context);
      } else if (deploy_to === 'remote') {
        return await this.handleSetupRemoteShell({
          operation: 'setup_remote_shell',
          host,
          user,
          key,
          rexx_binary: buildResult.binaryPath
        }, context);
      }
    } catch (error) {
      throw new Error(`Build and deploy failed: ${error.message}`);
    }
  }

  /**
   * Handle monitor_deployment command
   * monitor_deployment target="worker1" [interval=5000]
   */
  async handleMonitorDeployment(args, context) {
    const { target, interval = '5000' } = args;

    if (!target) {
      throw new Error('monitor_deployment requires target parameter');
    }

    const deployment = this.findDeployment(target);
    const monitorInterval = parseInt(interval);

    try {
      // Get current status
      let status;
      
      if (deployment.type === 'container') {
        const listResult = await this.container.handleAddressCommand('list', context);
        const containerInfo = listResult.containers.find(c => c.name === deployment.target);
        status = {
          target: deployment.target,
          type: 'container',
          status: containerInfo ? containerInfo.status : 'unknown',
          uptime: containerInfo ? Date.now() - new Date(containerInfo.created).getTime() : 0
        };
      } else if (deployment.type === 'remote_shell') {
        const connectionResult = await this.remoteShell.handleMessage('list_connections', context);
        const connectionInfo = connectionResult.connections.find(c => c.id === deployment.target);
        status = {
          target: deployment.target,
          type: 'remote_shell',
          status: connectionInfo ? 'connected' : 'disconnected',
          uptime: connectionInfo ? Date.now() - new Date(connectionInfo.createdAt).getTime() : 0
        };
      }

      return {
        success: true,
        deploymentId: deployment.id,
        status,
        lastExecution: deployment.lastExecution,
        lastResult: deployment.lastResult ? {
          exitCode: deployment.lastResult.exitCode,
          duration: deployment.lastResult.duration
        } : null
      };
    } catch (error) {
      throw new Error(`Deployment monitoring failed: ${error.message}`);
    }
  }

  /**
   * Handle cleanup_deployment command
   * cleanup_deployment target="worker1" [force=false]
   */
  async handleCleanupDeployment(args, context) {
    const { target, force = 'false' } = args;

    if (!target) {
      throw new Error('cleanup_deployment requires target parameter');
    }

    const deployment = this.findDeployment(target);

    try {
      if (deployment.type === 'container') {
        await this.container.handleAddressCommand(`remove name="${deployment.target}" force=${force}`, context);
      } else if (deployment.type === 'remote_shell') {
        await this.remoteShell.handleMessage(`disconnect connection="${deployment.target}"`, context);
      }

      this.activeDeployments.delete(deployment.id);

      return {
        success: true,
        deploymentId: deployment.id,
        target: deployment.target,
        message: `Deployment ${deployment.target} cleaned up`
      };
    } catch (error) {
      throw new Error(`Deployment cleanup failed: ${error.message}`);
    }
  }

  /**
   * Handle list_deployments command
   */
  async handleListDeployments(args, context) {
    const deployments = Array.from(this.activeDeployments.values()).map(deployment => ({
      id: deployment.id,
      type: deployment.type,
      target: deployment.target,
      status: deployment.status,
      createdAt: deployment.createdAt.toISOString(),
      lastExecution: deployment.lastExecution ? deployment.lastExecution.toISOString() : null
    }));

    return {
      success: true,
      deployments,
      count: deployments.length
    };
  }

  // Helper methods

  findDeployment(target) {
    // Find by target name
    for (const deployment of this.activeDeployments.values()) {
      if (deployment.target === target) {
        return deployment;
      }
    }
    
    // Find by deployment ID
    const deployment = this.activeDeployments.get(target);
    if (deployment) {
      return deployment;
    }
    
    throw new Error(`Deployment target ${target} not found`);
  }

  findRexxBinary() {
    // Look for RexxJS binary in common locations
    const candidates = [
      './rexx-linux-x64',
      '../rexx-linux-x64', 
      './pkg-build/rexx-linux-x64',
      '/usr/local/bin/rexx',
      process.env.REXX_BINARY
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return path.resolve(candidate);
      }
    }

    return null;
  }

  async buildRexxBinary(target) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Use the make-binary.sh script
      const buildScript = path.join(__dirname, '../../../make-binary.sh');
      
      if (!fs.existsSync(buildScript)) {
        reject(new Error('make-binary.sh script not found'));
        return;
      }

      const build = spawn('bash', [buildScript, target], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: path.dirname(buildScript)
      });

      let stdout = '';
      let stderr = '';

      build.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      build.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      build.on('close', (code) => {
        if (code === 0) {
          // Find the built binary
          const binaryPath = path.join(path.dirname(buildScript), `rexx-${target}`);
          if (fs.existsSync(binaryPath)) {
            resolve({
              success: true,
              binaryPath,
              target,
              output: stdout
            });
          } else {
            reject(new Error('Binary built but not found at expected location'));
          }
        } else {
          reject(new Error(`Binary build failed: ${stderr}`));
        }
      });

      build.on('error', (error) => {
        reject(new Error(`Build process error: ${error.message}`));
      });
    });
  }

  async executeRemoteSimple(deployment, script, options) {
    // Create temporary script file
    const tempScript = `/tmp/rexx_${Date.now()}.rexx`;
    
    // Upload script
    await this.remoteShell.handleMessage(
      `execute command="cat > ${tempScript}" connection="${deployment.target}"`,
      options.context
    );

    // Execute script  
    const result = await this.remoteShell.handleMessage(
      `execute command="/usr/local/bin/rexx ${tempScript}" connection="${deployment.target}" timeout=${options.timeout}`,
      options.context
    );

    // Cleanup
    await this.remoteShell.handleMessage(
      `execute command="rm -f ${tempScript}" connection="${deployment.target}"`,
      options.context
    );

    return result;
  }

  async executeRemoteWithProgress(deployment, script, options) {
    // Implement CHECKPOINT-based bidirectional progress monitoring
    // where remote Rexx script can CHECKPOINT back to originator
    const checkpointId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create checkpoint for this deployment execution
    const checkpoint = {
      id: checkpointId,
      deployment: deployment.name || deployment.id,
      script: script,
      status: 'executing',
      progress: { step: 0, total: options.expectedSteps || 1 },
      results: [],
      created: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
    
    this.activeCheckpoints.set(checkpointId, checkpoint);
    
    try {
      // Inject CHECKPOINT communication setup into the remote script
      const enhancedScript = this.injectCheckpointSupport(script, checkpointId);
      
      log('execute_remote_with_progress', { 
        checkpointId, 
        deployment: deployment.name,
        checkpointEnabled: true 
      });
      
      // Execute with checkpoint monitoring
      const result = await this.executeWithCheckpointMonitoring(
        deployment, 
        enhancedScript, 
        checkpointId,
        options
      );
      
      checkpoint.status = 'completed';
      checkpoint.lastUpdate = new Date().toISOString();
      checkpoint.finalResult = result;
      
      return {
        success: true,
        checkpointId,
        result,
        progressUpdates: checkpoint.results.length,
        message: `Remote execution completed with ${checkpoint.results.length} checkpoint updates`
      };
      
    } catch (error) {
      checkpoint.status = 'failed';
      checkpoint.error = error.message;
      checkpoint.lastUpdate = new Date().toISOString();
      
      throw error;
    }
  }

  setupCheckpointCommunication(config) {
    // Setup bidirectional communication channel for CHECKPOINT messages
    // Remote Rexx scripts can send progress updates back to originator
    this.checkpointConfig = {
      transportType: config.transportType || 'websocket', // websocket, http-polling, tcp
      port: config.port || 8080,
      endpoint: config.endpoint || '/checkpoints',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3
    };
    
    log('checkpoint_communication_setup', {
      transport: this.checkpointConfig.transportType,
      endpoint: this.checkpointConfig.endpoint,
      port: this.checkpointConfig.port
    });
    
    // Initialize the transport mechanism
    this.initializeCheckpointTransport();
  }
  
  initializeCheckpointTransport() {
    // Initialize WebSocket or HTTP server to receive CHECKPOINT messages
    // from remote Rexx scripts running on deployed systems
    if (this.checkpointConfig.transportType === 'websocket') {
      this.setupWebSocketServer();
    } else if (this.checkpointConfig.transportType === 'http-polling') {
      this.setupHTTPPollingEndpoint();
    }
    
    log('checkpoint_transport_initialized', {
      type: this.checkpointConfig.transportType,
      ready: true
    });
  }
  
  setupWebSocketServer() {
    // Setup WebSocket server to receive real-time CHECKPOINT updates
    // from remote Rexx scripts during execution
    log('websocket_server_setup', {
      port: this.checkpointConfig.port,
      note: 'Would setup WebSocket server for bidirectional CHECKPOINT communication'
    });
    
    // TODO: Implement actual WebSocket server
    // const WebSocket = require('ws');
    // this.progressSocket = new WebSocket.Server({ port: this.checkpointConfig.port });
  }
  
  setupHTTPPollingEndpoint() {
    // Setup HTTP endpoint for CHECKPOINT polling communication
    log('http_polling_setup', {
      endpoint: this.checkpointConfig.endpoint,
      note: 'Would setup HTTP endpoint for CHECKPOINT polling'
    });
    
    // TODO: Implement actual HTTP server endpoint
    // Would handle POST /checkpoints/:id with progress updates
  }
  
  injectCheckpointSupport(script, checkpointId) {
    // Inject CHECKPOINT communication setup into remote Rexx script
    // so it can send progress updates back to the originating script
    const checkpointSetup = `
/* CHECKPOINT Communication Setup - Generated by Deployment Handler */
checkpoint_id = "${checkpointId}"
checkpoint_endpoint = "${this.checkpointConfig.endpoint}"
checkpoint_transport = "${this.checkpointConfig.transportType}"

/* Enhanced CHECKPOINT function for remote->local communication */
CHECKPOINT_REMOTE = PROCEDURE EXPOSE checkpoint_id checkpoint_endpoint checkpoint_transport
  USE ARG key, value, progress_percent
  
  /* Create checkpoint message */
  checkpoint_data = JSON_ENCODE(JSON_SET("", "key", key, "value", value, "progress", progress_percent, "timestamp", DATETIME("ISO"), "checkpointId", checkpoint_id))
  
  /* Send via configured transport */
  IF checkpoint_transport = "websocket" THEN DO
    /* Send WebSocket message back to originator */
    CALL SEND_WEBSOCKET_MESSAGE checkpoint_endpoint, checkpoint_data
  END
  ELSE IF checkpoint_transport = "http-polling" THEN DO 
    /* POST checkpoint update to HTTP endpoint */
    CALL HTTP_POST checkpoint_endpoint "/" checkpoint_id, checkpoint_data
  END
  
  /* Also call local CHECKPOINT for immediate feedback */
  CHECKPOINT(key, value, progress_percent)
RETURN

/* Original script follows: */
${script}
`;
    
    return checkpointSetup;
  }
  
  async executeWithCheckpointMonitoring(deployment, enhancedScript, checkpointId, options) {
    // Execute script with real-time checkpoint monitoring
    // Listen for CHECKPOINT messages from remote script
    const checkpoint = this.activeCheckpoints.get(checkpointId);
    
    const executionPromise = deployment.type === 'container' 
      ? this.container.handleAddressCommand(`execute container="${deployment.name}" script="${enhancedScript}"`, {})
      : this.remoteShell.handleMessage(`execute host="${deployment.host}" script="${enhancedScript}"`, {});
    
    // Setup checkpoint listener for this execution
    this.setupCheckpointListener(checkpointId, checkpoint);
    
    try {
      const result = await executionPromise;
      
      // Wait a bit for any final checkpoint messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return result;
    } finally {
      // Cleanup checkpoint listener
      this.cleanupCheckpointListener(checkpointId);
    }
  }
  
  setupCheckpointListener(checkpointId, checkpoint) {
    // Setup listener for CHECKPOINT messages from remote script
    checkpoint.listener = (message) => {
      try {
        const messageData = JSON.parse(message);
        
        // Handle remote REQUIRE requests
        if (messageData.type === 'rexx-require' && messageData.subtype === 'require_request') {
          this.handleRemoteRequire(messageData.data, checkpoint);
          return;
        }
        
        // Handle regular checkpoint updates
        const checkpointData = messageData.checkpointId ? messageData : { checkpointId, ...messageData };
        if (checkpointData.checkpointId === checkpointId) {
          // Update checkpoint with remote progress
          checkpoint.results.push({
            key: checkpointData.key,
            value: checkpointData.value,
            progress: checkpointData.progress,
            timestamp: checkpointData.timestamp,
            source: 'remote'
          });
          
          checkpoint.progress.step = Math.max(checkpoint.progress.step, checkpointData.progress || 0);
          checkpoint.lastUpdate = new Date().toISOString();
          
          log('checkpoint_update_received', {
            checkpointId,
            key: checkpointData.key,
            progress: checkpointData.progress,
            totalUpdates: checkpoint.results.length
          });
          
          // Forward to local progress callback if configured
          if (this.progressCallbacks.has(checkpointId)) {
            this.progressCallbacks.get(checkpointId)(checkpointData);
          }
        }
      } catch (error) {
        log('checkpoint_message_parse_error', { error: error.message, checkpointId });
      }
    };
    
    // Register listener with transport
    if (this.progressSocket) {
      this.progressSocket.on('message', checkpoint.listener);
    }
  }
  
  async handleRemoteRequire(requireData, checkpoint) {
    // Handle remote REQUIRE request from remote script via CHECKPOINT channel
    const { libraryName, requireId } = requireData;
    
    log('remote_require_request', { libraryName, requireId });
    
    try {
      // Resolve library using orchestrator's local environment
      const libraryCode = await this.resolveLibraryForRemote(libraryName);
      
      // Send library code back to remote via CHECKPOINT response
      const response = {
        type: 'rexx-require-response',
        requireId: requireId,
        success: true,
        libraryCode: libraryCode,
        libraryName: libraryName,
        timestamp: Date.now()
      };
      
      // Send response via checkpoint transport
      this.sendCheckpointResponse(response, checkpoint);
      
      log('remote_require_fulfilled', { libraryName, requireId, codeLength: libraryCode.length });
      
    } catch (error) {
      // Send error response
      const errorResponse = {
        type: 'rexx-require-response',
        requireId: requireId,
        success: false,
        error: error.message,
        libraryName: libraryName,
        timestamp: Date.now()
      };
      
      this.sendCheckpointResponse(errorResponse, checkpoint);
      
      log('remote_require_failed', { libraryName, requireId, error: error.message });
    }
  }

  async resolveLibraryForRemote(libraryName) {
    // Resolve library code that will be sent to remote system
    
    // For local files, read and return content
    if (libraryName.startsWith('./') || libraryName.startsWith('../')) {
      const resolvedPath = path.resolve(libraryName);
      if (fs.existsSync(resolvedPath)) {
        return fs.readFileSync(resolvedPath, 'utf8');
      }
      throw new Error(`Local library file not found: ${libraryName}`);
    }
    
    // For Node.js modules, try to read the source file
    if (!libraryName.includes('/') && !libraryName.startsWith('http')) {
      try {
        const modulePath = require.resolve(libraryName);
        return fs.readFileSync(modulePath, 'utf8');
      } catch (error) {
        // If Node.js module not found, fall through to other methods
      }
    }
    
    // For GitHub or remote libraries, use existing library resolution
    const https = require('https');
    
    // Convert library name to GitHub URL if needed
    let libraryUrl;
    if (libraryName.startsWith('http')) {
      libraryUrl = libraryName;
    } else {
      // Assume GitHub repository format: user/repo or user/repo/path
      const githubBase = 'https://raw.githubusercontent.com/hammant/rexx-functions/main/';
      libraryUrl = `${githubBase}${libraryName}.js`;
    }
    
    return new Promise((resolve, reject) => {
      https.get(libraryUrl, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Failed to fetch ${libraryName}: HTTP ${response.statusCode}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Network error fetching ${libraryName}: ${error.message}`));
      });
    });
  }

  sendCheckpointResponse(response, checkpoint) {
    // Send response back to remote system via checkpoint transport
    const responseMessage = JSON.stringify(response);
    
    if (this.progressSocket) {
      // Send via WebSocket
      this.progressSocket.send(responseMessage);
    } else if (checkpoint.transport === 'http') {
      // Send via HTTP (would need HTTP endpoint setup)
      // For now, log that we'd send it
      log('checkpoint_response_http', { response: response });
    } else {
      // For testing, just log the response
      log('checkpoint_response_sent', { response: response });
    }
  }

  cleanupCheckpointListener(checkpointId) {
    // Cleanup checkpoint listener and resources
    const checkpoint = this.activeCheckpoints.get(checkpointId);
    if (checkpoint && checkpoint.listener) {
      if (this.progressSocket) {
        this.progressSocket.off('message', checkpoint.listener);
      }
      delete checkpoint.listener;
    }
    
    // Remove progress callback
    this.progressCallbacks.delete(checkpointId);
    
    log('checkpoint_listener_cleanup', { checkpointId });
  }
  
  // Public method to poll checkpoint status (for originating Rexx scripts)
  getCheckpointStatus(checkpointId) {
    const checkpoint = this.activeCheckpoints.get(checkpointId);
    if (!checkpoint) {
      return {
        success: false,
        error: `Checkpoint ${checkpointId} not found`,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      success: true,
      checkpointId,
      status: checkpoint.status,
      progress: checkpoint.progress,
      updates: checkpoint.results.length,
      lastUpdate: checkpoint.lastUpdate,
      results: checkpoint.results,
      timestamp: new Date().toISOString()
    };
  }
  
  // Public method for originating Rexx scripts to wait for checkpoint completion
  async waitForCheckpoint(checkpointId, timeout = 30000) {
    const checkpoint = this.activeCheckpoints.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }
    
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Checkpoint ${checkpointId} timeout after ${timeout}ms`));
      }, timeout);
      
      const checkStatus = () => {
        if (checkpoint.status === 'completed') {
          clearTimeout(timeoutHandle);
          resolve(this.getCheckpointStatus(checkpointId));
        } else if (checkpoint.status === 'failed') {
          clearTimeout(timeoutHandle);
          reject(new Error(`Checkpoint ${checkpointId} failed: ${checkpoint.error}`));
        } else {
          // Still processing, check again in 500ms
          setTimeout(checkStatus, 500);
        }
      };
      
      checkStatus();
    });
  }
  
  // Public method to list all active checkpoints
  listActiveCheckpoints() {
    const checkpoints = Array.from(this.activeCheckpoints.entries()).map(([id, checkpoint]) => ({
      checkpointId: id,
      status: checkpoint.status,
      deployment: checkpoint.deployment,
      created: checkpoint.created,
      lastUpdate: checkpoint.lastUpdate,
      progressUpdates: checkpoint.results.length,
      progress: checkpoint.progress
    }));
    
    return {
      success: true,
      activeCheckpoints: checkpoints.length,
      checkpoints,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SCROOrchestrator;