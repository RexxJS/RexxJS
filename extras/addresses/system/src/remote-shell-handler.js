/**
 * Remote Shell Address Handler
 * Provides secure remote shell operations for RexxJS
 * 
 * Usage:
 * ADDRESS remote_shell
 * connect host="server.example.com" user="admin" key="/path/to/key"
 * execute command="ls -la /var/log"
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity } = require('../../../../core/src/address-handler-utils');

// Helper function for logging
function log(operation, details) {
  logActivity('REMOTE_SHELL', operation, details);
}

class RemoteShellHandler {
  constructor() {
    this.activeConnections = new Map();
    this.connectionCounter = 0;
    this.defaultTimeout = 30000; // 30 seconds
    this.maxConnections = 10;
    
    // Security settings
    this.allowedHosts = new Set();
    this.trustedKeyPaths = new Set();
    this.securityMode = 'strict'; // strict, moderate, permissive
  }

  /**
   * Initialize handler with security configuration
   */
  initialize(config = {}) {
    this.securityMode = config.securityMode || 'strict';
    this.allowedHosts = new Set(config.allowedHosts || []);
    this.trustedKeyPaths = new Set(config.trustedKeyPaths || []);
    this.maxConnections = config.maxConnections || 10;
    this.defaultTimeout = config.defaultTimeout || 30000;
    
    log('initialize', {
      securityMode: this.securityMode,
      allowedHosts: Array.from(this.allowedHosts),
      maxConnections: this.maxConnections
    });
  }

  /**
   * Handle ADDRESS remote_shell commands
   */
  async handleMessage(message, context) {
    try {
      const command = message.trim();
      const args = this.parseCommand(command);
      
      log('command', {
        command: command,
        args: args
      });

      switch (args.operation) {
        case 'connect':
          return await this.handleConnect(args, context);
        case 'execute':
          return await this.handleExecute(args, context);
        case 'upload':
          return await this.handleUpload(args, context);
        case 'download':
          return await this.handleDownload(args, context);
        case 'disconnect':
          return await this.handleDisconnect(args, context);
        case 'list_connections':
          return await this.handleListConnections(args, context);
        case 'set_timeout':
          return await this.handleSetTimeout(args, context);
        default:
          throw new Error(`Unknown remote shell operation: ${args.operation}`);
      }
    } catch (error) {
      log('error', {
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
    const parts = command.split(/\s+/);
    const operation = parts[0].toLowerCase();
    const args = { operation };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        args[key] = valueParts.join('=').replace(/^"(.*)"$/, '$1'); // Remove quotes
      }
    }

    return args;
  }

  /**
   * Handle connect command
   * connect host="server.com" user="admin" key="/path/to/key" [port=22] [alias="myserver"]
   */
  async handleConnect(args, context) {
    const { host, user, key, port = '22', alias, timeout } = args;

    if (!host || !user) {
      throw new Error('connect requires host and user parameters');
    }

    // Security validation
    if (!this.validateHost(host)) {
      throw new Error(`Host ${host} not allowed by security policy`);
    }

    if (key && !this.validateKeyPath(key)) {
      throw new Error(`SSH key path ${key} not trusted by security policy`);
    }

    // Check connection limits
    if (this.activeConnections.size >= this.maxConnections) {
      throw new Error(`Maximum connections (${this.maxConnections}) reached`);
    }

    // Interpolate variables
    const interpolatedHost = await interpolateMessage(host, context);
    const interpolatedUser = await interpolateMessage(user, context);
    const interpolatedKey = key ? await interpolateMessage(key, context) : null;

    const connectionId = alias || `conn_${++this.connectionCounter}`;
    const connectionTimeout = timeout ? parseInt(timeout) : this.defaultTimeout;

    const connectionInfo = {
      id: connectionId,
      host: interpolatedHost,
      user: interpolatedUser,
      port: parseInt(port),
      keyPath: interpolatedKey,
      timeout: connectionTimeout,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    // Test connection
    try {
      await this.testConnection(connectionInfo);
      this.activeConnections.set(connectionId, connectionInfo);
      
      log('connect_success', {
        action: 'connect_success',
        connectionId,
        host: interpolatedHost,
        user: interpolatedUser
      });

      return {
        success: true,
        connectionId,
        message: `Connected to ${interpolatedUser}@${interpolatedHost}:${port}`,
        host: interpolatedHost,
        user: interpolatedUser,
        port: parseInt(port)
      };
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Handle execute command
   * execute command="ls -la" [connection="myserver"] [timeout=30000] [working_dir="/tmp"]
   */
  async handleExecute(args, context) {
    const { command: cmd, connection, timeout, working_dir } = args;

    if (!cmd) {
      throw new Error('execute requires command parameter');
    }

    // Find connection
    const conn = this.getConnection(connection);
    const interpolatedCmd = await interpolateMessage(cmd, context);
    const interpolatedDir = working_dir ? await interpolateMessage(working_dir, context) : null;
    const execTimeout = timeout ? parseInt(timeout) : conn.timeout;

    log('execute_start', {
      connectionId: conn.id,
      command: interpolatedCmd,
      timeout: execTimeout
    });

    try {
      const result = await this.executeCommand(conn, interpolatedCmd, {
        timeout: execTimeout,
        workingDir: interpolatedDir
      });

      conn.lastUsed = new Date();

      log('connect_success', {
        action: 'execute_success',
        connectionId: conn.id,
        exitCode: result.exitCode,
        outputLength: result.stdout.length
      });

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        command: interpolatedCmd,
        connectionId: conn.id,
        duration: result.duration
      };
    } catch (error) {
      log('connect_success', {
        action: 'execute_error',
        connectionId: conn.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle upload command
   * upload local="/path/to/file" remote="/remote/path" [connection="myserver"] [mode="644"]
   */
  async handleUpload(args, context) {
    const { local, remote, connection, mode = '644' } = args;

    if (!local || !remote) {
      throw new Error('upload requires local and remote parameters');
    }

    const conn = this.getConnection(connection);
    const interpolatedLocal = await interpolateMessage(local, context);
    const interpolatedRemote = await interpolateMessage(remote, context);

    // Security check - validate local file path
    if (!this.validateLocalPath(interpolatedLocal)) {
      throw new Error(`Local path ${interpolatedLocal} not allowed by security policy`);
    }

    log('upload_start', {
      connectionId: conn.id,
      local: interpolatedLocal,
      remote: interpolatedRemote
    });

    try {
      const result = await this.uploadFile(conn, interpolatedLocal, interpolatedRemote, { mode });
      conn.lastUsed = new Date();

      return {
        success: true,
        localPath: interpolatedLocal,
        remotePath: interpolatedRemote,
        connectionId: conn.id,
        bytesTransferred: result.bytes,
        duration: result.duration
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Handle download command
   * download remote="/remote/path" local="/path/to/file" [connection="myserver"]
   */
  async handleDownload(args, context) {
    const { remote, local, connection } = args;

    if (!remote || !local) {
      throw new Error('download requires remote and local parameters');
    }

    const conn = this.getConnection(connection);
    const interpolatedRemote = await interpolateMessage(remote, context);
    const interpolatedLocal = await interpolateMessage(local, context);

    // Security check - validate local file path
    if (!this.validateLocalPath(interpolatedLocal)) {
      throw new Error(`Local path ${interpolatedLocal} not allowed by security policy`);
    }

    try {
      const result = await this.downloadFile(conn, interpolatedRemote, interpolatedLocal);
      conn.lastUsed = new Date();

      return {
        success: true,
        remotePath: interpolatedRemote,
        localPath: interpolatedLocal,
        connectionId: conn.id,
        bytesTransferred: result.bytes,
        duration: result.duration
      };
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Handle disconnect command
   * disconnect [connection="myserver"]
   */
  async handleDisconnect(args, context) {
    const { connection } = args;

    if (connection) {
      // Disconnect specific connection
      if (this.activeConnections.has(connection)) {
        this.activeConnections.delete(connection);
        return { success: true, message: `Disconnected from ${connection}` };
      } else {
        throw new Error(`Connection ${connection} not found`);
      }
    } else {
      // Disconnect all connections
      const count = this.activeConnections.size;
      this.activeConnections.clear();
      return { success: true, message: `Disconnected from ${count} connections` };
    }
  }

  /**
   * Handle list_connections command
   */
  async handleListConnections(args, context) {
    const connections = Array.from(this.activeConnections.values()).map(conn => ({
      id: conn.id,
      host: conn.host,
      user: conn.user,
      port: conn.port,
      createdAt: conn.createdAt.toISOString(),
      lastUsed: conn.lastUsed.toISOString()
    }));

    return {
      success: true,
      connections,
      count: connections.length
    };
  }

  /**
   * Handle set_timeout command
   * set_timeout value=60000 [connection="myserver"]
   */
  async handleSetTimeout(args, context) {
    const { value, connection } = args;

    if (!value) {
      throw new Error('set_timeout requires value parameter');
    }

    const timeout = parseInt(value);
    
    if (connection) {
      const conn = this.getConnection(connection);
      conn.timeout = timeout;
      return { success: true, message: `Timeout set to ${timeout}ms for ${connection}` };
    } else {
      this.defaultTimeout = timeout;
      return { success: true, message: `Default timeout set to ${timeout}ms` };
    }
  }

  /**
   * Get connection by ID (uses first connection if no ID specified)
   */
  getConnection(connectionId) {
    if (connectionId) {
      const conn = this.activeConnections.get(connectionId);
      if (!conn) {
        throw new Error(`Connection ${connectionId} not found`);
      }
      return conn;
    } else {
      // Use first available connection
      if (this.activeConnections.size === 0) {
        throw new Error('No active connections. Use connect command first.');
      }
      return this.activeConnections.values().next().value;
    }
  }

  /**
   * Validate host against security policy
   */
  validateHost(host) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    if (this.securityMode === 'strict') {
      return this.allowedHosts.has(host);
    }
    
    // Moderate mode: allow localhost and configured hosts
    return host === 'localhost' || host === '127.0.0.1' || this.allowedHosts.has(host);
  }

  /**
   * Validate SSH key path against security policy
   */
  validateKeyPath(keyPath) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    if (this.securityMode === 'strict') {
      return this.trustedKeyPaths.has(keyPath);
    }
    
    // Moderate mode: allow home directory keys
    const homeDir = require('os').homedir();
    return keyPath.startsWith(path.join(homeDir, '.ssh/')) || this.trustedKeyPaths.has(keyPath);
  }

  /**
   * Validate local file path against security policy
   */
  validateLocalPath(localPath) {
    if (this.securityMode === 'permissive') {
      return true;
    }
    
    // Block dangerous paths
    const dangerous = ['/etc/', '/bin/', '/sbin/', '/usr/bin/', '/usr/sbin/'];
    if (dangerous.some(d => localPath.startsWith(d))) {
      return false;
    }
    
    if (this.securityMode === 'strict') {
      // Only allow current working directory and subdirectories
      const cwd = process.cwd();
      return localPath.startsWith(cwd);
    }
    
    return true; // Moderate mode allows most paths except dangerous ones
  }

  /**
   * Test SSH connection
   */
  async testConnection(conn) {
    return new Promise((resolve, reject) => {
      const sshArgs = [
        '-o', 'ConnectTimeout=10',
        '-o', 'BatchMode=yes',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-p', conn.port.toString()
      ];

      if (conn.keyPath) {
        sshArgs.push('-i', conn.keyPath);
      }

      sshArgs.push(`${conn.user}@${conn.host}`, 'echo', 'connection_test');

      const ssh = spawn('ssh', sshArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      ssh.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ssh.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ssh.on('close', (code) => {
        if (code === 0 && stdout.includes('connection_test')) {
          resolve();
        } else {
          reject(new Error(`SSH connection test failed: ${stderr || 'Unknown error'}`));
        }
      });

      ssh.on('error', (error) => {
        reject(new Error(`SSH connection error: ${error.message}`));
      });

      setTimeout(() => {
        ssh.kill();
        reject(new Error('SSH connection test timeout'));
      }, 10000);
    });
  }

  /**
   * Execute command on remote host
   */
  async executeCommand(conn, command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const sshArgs = [
        '-o', 'ConnectTimeout=10',
        '-o', 'BatchMode=yes',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-p', conn.port.toString()
      ];

      if (conn.keyPath) {
        sshArgs.push('-i', conn.keyPath);
      }

      let remoteCommand = command;
      if (options.workingDir) {
        remoteCommand = `cd "${options.workingDir}" && ${command}`;
      }

      sshArgs.push(`${conn.user}@${conn.host}`, remoteCommand);

      const ssh = spawn('ssh', sshArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      ssh.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ssh.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ssh.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          exitCode: code,
          stdout,
          stderr,
          duration
        });
      });

      ssh.on('error', (error) => {
        reject(new Error(`SSH execution error: ${error.message}`));
      });

      const timeout = setTimeout(() => {
        ssh.kill();
        reject(new Error(`Command execution timeout after ${options.timeout}ms`));
      }, options.timeout || conn.timeout);

      ssh.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Upload file using SCP
   */
  async uploadFile(conn, localPath, remotePath, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Check if local file exists
      if (!fs.existsSync(localPath)) {
        reject(new Error(`Local file not found: ${localPath}`));
        return;
      }

      const scpArgs = [
        '-o', 'ConnectTimeout=10',
        '-o', 'BatchMode=yes',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-P', conn.port.toString()
      ];

      if (conn.keyPath) {
        scpArgs.push('-i', conn.keyPath);
      }

      scpArgs.push(localPath, `${conn.user}@${conn.host}:${remotePath}`);

      const scp = spawn('scp', scpArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';

      scp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      scp.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          const stats = fs.statSync(localPath);
          resolve({
            bytes: stats.size,
            duration
          });
        } else {
          reject(new Error(`SCP upload failed: ${stderr}`));
        }
      });

      scp.on('error', (error) => {
        reject(new Error(`SCP upload error: ${error.message}`));
      });

      setTimeout(() => {
        scp.kill();
        reject(new Error('SCP upload timeout'));
      }, conn.timeout);
    });
  }

  /**
   * Download file using SCP
   */
  async downloadFile(conn, remotePath, localPath) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const scpArgs = [
        '-o', 'ConnectTimeout=10',
        '-o', 'BatchMode=yes',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-P', conn.port.toString()
      ];

      if (conn.keyPath) {
        scpArgs.push('-i', conn.keyPath);
      }

      scpArgs.push(`${conn.user}@${conn.host}:${remotePath}`, localPath);

      const scp = spawn('scp', scpArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stderr = '';

      scp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      scp.on('close', (code) => {
        const duration = Date.now() - startTime;
        if (code === 0) {
          const stats = fs.statSync(localPath);
          resolve({
            bytes: stats.size,
            duration
          });
        } else {
          reject(new Error(`SCP download failed: ${stderr}`));
        }
      });

      scp.on('error', (error) => {
        reject(new Error(`SCP download error: ${error.message}`));
      });

      setTimeout(() => {
        scp.kill();
        reject(new Error('SCP download timeout'));
      }, conn.timeout);
    });
  }
}

module.exports = RemoteShellHandler;