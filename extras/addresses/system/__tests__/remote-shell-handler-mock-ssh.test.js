/**
 * Remote Shell Handler Mock Tests - SSH/SCP Integration
 * Tests remote shell operations with mocked SSH and SCP processes
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const RemoteShellHandler = require('../src/remote-shell-handler');

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs');

describe('Remote Shell Handler - Mock SSH/SCP Tests', () => {
  let remoteHandler;
  let mockContext;
  let mockProcess;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock process
    mockProcess = {
      stdout: {
        on: jest.fn(),
        pipe: jest.fn()
      },
      stderr: {
        on: jest.fn(),
        pipe: jest.fn()
      },
      stdin: {
        write: jest.fn(),
        end: jest.fn()
      },
      on: jest.fn(),
      kill: jest.fn()
    };

    spawn.mockReturnValue(mockProcess);

    // Setup fs mocks
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock file content');
    fs.writeFileSync.mockImplementation(() => {});
    fs.statSync.mockReturnValue({ 
      isFile: () => true,
      size: 1024 
    });

    // Initialize remote shell handler
    remoteHandler = new RemoteShellHandler();
    
    // Mock context
    mockContext = {
      variables: new Map([
        ['host_server', 'test.example.com'],
        ['username', 'testuser'],
        ['ssh_key', '~/.ssh/id_rsa'],
        ['local_file', './test-file.txt'],
        ['remote_file', '/tmp/test-file.txt']
      ])
    };
  });

  describe('Initialization and Security', () => {
    it('should initialize with permissive security mode', async () => {
      await remoteHandler.initialize({
        securityMode: 'permissive',
        maxConnections: 5
      });

      expect(remoteHandler.securityMode).toBe('permissive');
      expect(remoteHandler.maxConnections).toBe(5);
      expect(remoteHandler.activeConnections.size).toBe(0);
    });

    it('should initialize with strict security mode and allowed hosts', async () => {
      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted1.com', 'trusted2.com'],
        trustedKeyPaths: ['/home/user/.ssh/trusted_key']
      });

      expect(remoteHandler.securityMode).toBe('strict');
      expect(remoteHandler.allowedHosts).toContain('trusted1.com');
      expect(remoteHandler.allowedHosts).toContain('trusted2.com');
    });

    it('should validate host against security policy', async () => {
      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.com']
      });

      // Should reject untrusted host
      await expect(
        remoteHandler.handleMessage(
          'connect host="untrusted.com" user="test"',
          mockContext
        )
      ).rejects.toThrow('Host untrusted.com not allowed by security policy');
    });

    it('should validate SSH key paths in strict mode', async () => {
      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.com'],
        trustedKeyPaths: ['/approved/key']
      });

      fs.existsSync.mockReturnValue(false);

      await expect(
        remoteHandler.handleMessage(
          'connect host="trusted.com" user="test" key="/unapproved/key"',
          mockContext
        )
      ).rejects.toThrow('SSH key path /unapproved/key not trusted by security policy');
    });
  });

  describe('SSH Connection Management', () => {
    beforeEach(async () => {
      // Setup permissive mode for easier testing
      await remoteHandler.initialize({ 
        securityMode: 'permissive',
        maxConnections: 10 
      });

      // Mock successful SSH connection
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10); // Success exit code
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('SSH connection test successful'), 10);
        }
      });
    });

    it('should establish SSH connection with username/password', async () => {
      const result = await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="main"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('main');
      expect(result.host).toBe('test.example.com');
      expect(result.user).toBe('testuser');
      
      expect(remoteHandler.activeConnections.has('main')).toBe(true);
      const connection = remoteHandler.activeConnections.get('main');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
    });

    it('should establish SSH connection with key-based authentication', async () => {
      const result = await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" key="~/.ssh/id_rsa" alias="keyauth"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('keyauth');
      expect(result.authMethod).toBe('key');
      
      const connection = remoteHandler.activeConnections.get('keyauth');
      expect(connection.keyPath).toBe('~/.ssh/id_rsa');
    });

    it('should handle SSH connection failures', async () => {
      // Mock SSH connection failure
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(255), 10); // SSH failure exit code
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('ssh: connect to host failed: Connection refused'), 10);
        }
      });

      await expect(
        remoteHandler.handleMessage(
          'connect host="unreachable.com" user="testuser"',
          mockContext
        )
      ).rejects.toThrow('SSH connection failed');
    });

    it('should enforce connection limits', async () => {
      remoteHandler.maxConnections = 2;
      
      // Fill up connection slots
      await remoteHandler.handleMessage(
        'connect host="host1.com" user="user1" alias="conn1"',
        mockContext
      );
      await remoteHandler.handleMessage(
        'connect host="host2.com" user="user2" alias="conn2"',
        mockContext
      );

      // Third connection should fail
      await expect(
        remoteHandler.handleMessage(
          'connect host="host3.com" user="user3" alias="conn3"',
          mockContext
        )
      ).rejects.toThrow('Maximum connections (2) reached');
    });

    it('should reuse existing connections', async () => {
      // First connection
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="reused"',
        mockContext
      );

      const firstConnection = remoteHandler.activeConnections.get('reused');
      
      // Second connection with same parameters should reuse
      const result = await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="reused"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('reused');
      expect(result.reused).toBe(true);
      
      // Should be the same connection object
      const secondConnection = remoteHandler.activeConnections.get('reused');
      expect(secondConnection).toBe(firstConnection);
    });
  });

  describe('Remote Command Execution', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });
      
      // Establish a connection first
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="cmd_test"',
        mockContext
      );
    });

    it('should execute remote commands successfully', async () => {
      // Mock command execution
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('total 24\ndrwxr-xr-x 2 testuser testuser 4096 Jan 15 10:00 .'), 10);
        }
      });

      const result = await remoteHandler.handleMessage(
        'execute command="ls -la /tmp" connection="cmd_test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('drwxr-xr-x');
      expect(result.command).toBe('ls -la /tmp');
      
      expect(spawn).toHaveBeenCalledWith('ssh', expect.arrayContaining([
        'testuser@test.example.com', 'ls -la /tmp'
      ]), expect.any(Object));
    });

    it('should handle command execution with timeout', async () => {
      // Mock long-running command
      let timeoutId;
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          timeoutId = setTimeout(() => callback(0), 10000); // Long delay
        }
      });

      const startTime = Date.now();

      await expect(
        remoteHandler.handleMessage(
          'execute command="sleep 60" timeout=1000 connection="cmd_test"',
          mockContext
        )
      ).rejects.toThrow('Command execution timed out after 1000ms');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      
      if (timeoutId) clearTimeout(timeoutId);
    });

    it('should execute commands with working directory', async () => {
      const result = await remoteHandler.handleMessage(
        'execute command="pwd" working_dir="/var/log" connection="cmd_test"',
        mockContext
      );

      expect(spawn).toHaveBeenCalledWith('ssh', expect.arrayContaining([
        'testuser@test.example.com', 'cd /var/log && pwd'
      ]), expect.any(Object));
    });

    it('should handle command execution errors', async () => {
      // Mock command failure
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10); // Non-zero exit code
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('bash: badcommand: command not found'), 10);
        }
      });

      const result = await remoteHandler.handleMessage(
        'execute command="badcommand" connection="cmd_test"',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('command not found');
    });

    it('should validate connection exists for command execution', async () => {
      await expect(
        remoteHandler.handleMessage(
          'execute command="ls" connection="nonexistent"',
          mockContext
        )
      ).rejects.toThrow('Connection nonexistent not found');
    });
  });

  describe('File Transfer Operations', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });
      
      // Establish connection
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="file_test"',
        mockContext
      );
    });

    it('should upload files via SCP', async () => {
      const result = await remoteHandler.handleMessage(
        'upload local="./test-file.txt" remote="/tmp/test-file.txt" connection="file_test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.operation).toBe('upload');
      expect(result.local).toBe('./test-file.txt');
      expect(result.remote).toBe('/tmp/test-file.txt');
      
      expect(spawn).toHaveBeenCalledWith('scp', [
        './test-file.txt', 'testuser@test.example.com:/tmp/test-file.txt'
      ], expect.any(Object));
    });

    it('should upload files with specific mode', async () => {
      const result = await remoteHandler.handleMessage(
        'upload local="./script.sh" remote="/tmp/script.sh" mode="755" connection="file_test"',
        mockContext
      );

      expect(result.success).toBe(true);
      
      // Should call chmod after upload
      expect(spawn).toHaveBeenCalledWith('ssh', [
        'testuser@test.example.com', 'chmod 755 /tmp/script.sh'
      ], expect.any(Object));
    });

    it('should download files via SCP', async () => {
      const result = await remoteHandler.handleMessage(
        'download remote="/tmp/remote-file.txt" local="./downloaded-file.txt" connection="file_test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.operation).toBe('download');
      expect(result.remote).toBe('/tmp/remote-file.txt');
      expect(result.local).toBe('./downloaded-file.txt');
      
      expect(spawn).toHaveBeenCalledWith('scp', [
        'testuser@test.example.com:/tmp/remote-file.txt', './downloaded-file.txt'
      ], expect.any(Object));
    });

    it('should validate local file exists for upload', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(
        remoteHandler.handleMessage(
          'upload local="./nonexistent.txt" remote="/tmp/file.txt" connection="file_test"',
          mockContext
        )
      ).rejects.toThrow('Local file ./nonexistent.txt not found');
    });

    it('should handle SCP transfer failures', async () => {
      // Mock SCP failure
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10); // SCP error
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('scp: /tmp/protected: Permission denied'), 10);
        }
      });

      await expect(
        remoteHandler.handleMessage(
          'upload local="./test.txt" remote="/tmp/protected/test.txt" connection="file_test"',
          mockContext
        )
      ).rejects.toThrow('File transfer failed');
    });

    it('should validate file paths in strict security mode', async () => {
      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['test.example.com'],
        allowedPaths: ['/tmp/', '/home/testuser/']
      });

      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="strict_test"',
        mockContext
      );

      await expect(
        remoteHandler.handleMessage(
          'upload local="./test.txt" remote="/etc/passwd" connection="strict_test"',
          mockContext
        )
      ).rejects.toThrow('Remote path /etc/passwd not allowed by security policy');
    });
  });

  describe('Connection Management and Cleanup', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });
    });

    it('should disconnect specific connection', async () => {
      // Establish connection
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="to_disconnect"',
        mockContext
      );

      expect(remoteHandler.activeConnections.has('to_disconnect')).toBe(true);

      const result = await remoteHandler.handleMessage(
        'disconnect connection="to_disconnect"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('to_disconnect');
      expect(remoteHandler.activeConnections.has('to_disconnect')).toBe(false);
    });

    it('should disconnect all connections', async () => {
      // Establish multiple connections
      await remoteHandler.handleMessage(
        'connect host="host1.com" user="user1" alias="conn1"',
        mockContext
      );
      await remoteHandler.handleMessage(
        'connect host="host2.com" user="user2" alias="conn2"',
        mockContext
      );

      expect(remoteHandler.activeConnections.size).toBe(2);

      const result = await remoteHandler.handleMessage('disconnect_all', mockContext);

      expect(result.success).toBe(true);
      expect(result.disconnected).toBe(2);
      expect(remoteHandler.activeConnections.size).toBe(0);
    });

    it('should clean up stale connections', async () => {
      // Create connections with different last used times
      const now = Date.now();
      remoteHandler.activeConnections.set('fresh', {
        id: 'fresh',
        lastUsed: new Date(now - 1000) // 1 second ago
      });
      remoteHandler.activeConnections.set('stale', {
        id: 'stale', 
        lastUsed: new Date(now - 7200000) // 2 hours ago
      });

      const result = await remoteHandler.handleMessage(
        'cleanup max_idle=3600000', // 1 hour max idle
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.cleanedUp).toBe(1); // Only stale connection
      expect(remoteHandler.activeConnections.has('fresh')).toBe(true);
      expect(remoteHandler.activeConnections.has('stale')).toBe(false);
    });
  });

  describe('Variable Interpolation', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });
    });

    it('should interpolate variables in host and user parameters', async () => {
      const result = await remoteHandler.handleMessage(
        'connect host="{host_server}" user="{username}" alias="interpolated"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.host).toBe('test.example.com');
      expect(result.user).toBe('testuser');
      
      const connection = remoteHandler.activeConnections.get('interpolated');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
    });

    it('should interpolate variables in file paths', async () => {
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="file_interp"',
        mockContext
      );

      await remoteHandler.handleMessage(
        'upload local="{local_file}" remote="{remote_file}" connection="file_interp"',
        mockContext
      );

      expect(spawn).toHaveBeenCalledWith('scp', [
        './test-file.txt', 'testuser@test.example.com:/tmp/test-file.txt'
      ], expect.any(Object));
    });

    it('should interpolate variables in commands', async () => {
      mockContext.variables.set('target_dir', '/var/log');
      
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="cmd_interp"',
        mockContext
      );

      await remoteHandler.handleMessage(
        'execute command="ls -la {target_dir}" connection="cmd_interp"',
        mockContext
      );

      expect(spawn).toHaveBeenCalledWith('ssh', expect.arrayContaining([
        'testuser@test.example.com', 'ls -la /var/log'
      ]), expect.any(Object));
    });
  });

  describe('Ward Cunningham Style Test Scenarios', () => {
    it('should demonstrate complete remote workflow', async () => {
      /*
       * BEFORE: Clean remote shell environment
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Security Mode: permissive                   │
       * │ Active Connections: 0                       │
       * │ Max Connections: 10                         │
       * └─────────────────────────────────────────────┘
       */

      await remoteHandler.initialize({ securityMode: 'permissive' });
      expect(remoteHandler.activeConnections.size).toBe(0);
      expect(remoteHandler.securityMode).toBe('permissive');

      // INTERACTION: Establish SSH connection
      let result = await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" key="~/.ssh/id_rsa" alias="workflow"',
        mockContext
      );

      /*
       * AFTER CONNECT: SSH connection established
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Security Mode: permissive                   │
       * │ Active Connections: 1                       │
       * │                                             │
       * │ > workflow (test.example.com)               │
       * │   User: testuser                            │
       * │   Auth: key-based                           │
       * │   Status: connected                         │
       * │   Last Used: 2025-01-15T10:00:00Z          │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(remoteHandler.activeConnections.size).toBe(1);
      
      const connection = remoteHandler.activeConnections.get('workflow');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
      expect(connection.authMethod).toBe('key');

      // INTERACTION: Execute remote command
      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Linux test 5.4.0 #1 SMP x86_64 GNU/Linux'), 10);
        }
      });

      result = await remoteHandler.handleMessage(
        'execute command="uname -a" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Linux test');

      // INTERACTION: Upload file
      result = await remoteHandler.handleMessage(
        'upload local="./test-script.rexx" remote="/tmp/script.rexx" mode="755" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.operation).toBe('upload');

      // INTERACTION: Execute uploaded script
      result = await remoteHandler.handleMessage(
        'execute command="/usr/local/bin/rexx /tmp/script.rexx" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);

      // INTERACTION: Download results
      result = await remoteHandler.handleMessage(
        'download remote="/tmp/results.txt" local="./results.txt" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.operation).toBe('download');

      // INTERACTION: Cleanup connection
      result = await remoteHandler.handleMessage(
        'disconnect connection="workflow"',
        mockContext
      );

      /*
       * AFTER CLEANUP: Back to clean state  
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Security Mode: permissive                   │ 
       * │ Active Connections: 0                       │
       * │ Max Connections: 10                         │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(remoteHandler.activeConnections.size).toBe(0);
    });

    it('should demonstrate security policy enforcement', async () => {
      /*
       * BEFORE: Strict security configuration
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Security Mode: strict                       │
       * │ Allowed Hosts: [trusted.com]               │
       * │ Allowed Paths: [/tmp/, /home/user/]        │
       * │ Active Connections: 0                       │
       * └─────────────────────────────────────────────┘
       */

      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.com'],
        allowedPaths: ['/tmp/', '/home/user/']
      });

      // INTERACTION: Try untrusted host (should fail)
      await expect(
        remoteHandler.handleMessage(
          'connect host="malicious.com" user="hacker"',
          mockContext
        )
      ).rejects.toThrow('Host malicious.com not allowed by security policy');

      // INTERACTION: Connect to trusted host (should succeed)
      const result = await remoteHandler.handleMessage(
        'connect host="trusted.com" user="authorized" alias="secure"',
        mockContext
      );

      /*
       * AFTER TRUSTED CONNECTION: Secure connection established
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Security Mode: strict                       │
       * │ Allowed Hosts: [trusted.com]               │
       * │ Allowed Paths: [/tmp/, /home/user/]        │
       * │ Active Connections: 1                       │
       * │                                             │
       * │ > secure (trusted.com) ✓ verified          │
       * │   User: authorized                          │
       * │   Status: connected                         │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(remoteHandler.activeConnections.size).toBe(1);

      // INTERACTION: Try unauthorized path (should fail)
      await expect(
        remoteHandler.handleMessage(
          'upload local="./test.txt" remote="/etc/passwd" connection="secure"',
          mockContext
        )
      ).rejects.toThrow('Remote path /etc/passwd not allowed by security policy');

      // INTERACTION: Use authorized path (should succeed)
      const uploadResult = await remoteHandler.handleMessage(
        'upload local="./test.txt" remote="/tmp/safe-file.txt" connection="secure"',
        mockContext
      );

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.remote).toBe('/tmp/safe-file.txt');
    });
  });
});