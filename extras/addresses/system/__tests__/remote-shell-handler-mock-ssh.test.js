/**
 * Remote Shell Handler Mock Tests - SSH/SCP Integration
 * Tests remote shell operations with mocked SSH and SCP processes
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const RemoteShellHandler = require('../src/remote-shell-handler');

// Mock child_process and fs
jest.mock('child_process');
jest.mock('fs');

// Options every ssh/scp invocation made by the handler starts with
const SSH_OPTS = ['-o', 'ConnectTimeout=10', '-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new'];

describe('Remote Shell Handler - Mock SSH/SCP Tests', () => {
  let remoteHandler;
  let mockContext;
  let mockProcess;

  // Make mockProcess behave like a finished ssh/scp: emit the given
  // stdout/stderr, then close with the given exit code
  const scriptProcess = ({ stdout = '', stderr = '', code = 0 } = {}) => {
    mockProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data' && stdout) setImmediate(() => cb(Buffer.from(stdout)));
    });
    mockProcess.stderr.on.mockImplementation((event, cb) => {
      if (event === 'data' && stderr) setImmediate(() => cb(Buffer.from(stderr)));
    });
    mockProcess.on.mockImplementation((event, cb) => {
      if (event === 'close') setImmediate(() => setImmediate(() => cb(code)));
    });
  };

  // A process that never produces output or closes (a hung remote side)
  const hangingProcess = () => ({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
    kill: jest.fn()
  });

  // The spawn calls that were not the connection probe
  const nonProbeSpawns = () => spawn.mock.calls.filter(([, args]) => !args.includes('connection_test'));

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // The handler arms timeouts with setTimeout and (for the probe, upload
    // and download) never clears them; fake timers keep those from running
    // for real after a test ends. setImmediate stays real: the mock
    // processes below use it to emit their output.
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });

    // The handler logs every operation through console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});

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
    scriptProcess();

    // The handler checks a connection first (ssh ... echo connection_test):
    // that probe answers as a reachable host would; every other spawn is
    // the test's mockProcess
    spawn.mockImplementation((cmd, args = []) => {
      if (cmd === 'ssh' && args.includes('connection_test')) {
        return {
          stdout: { on: (event, cb) => { if (event === 'data') setImmediate(() => cb(Buffer.from('connection_test\n'))); } },
          stderr: { on: () => {} },
          on: (event, cb) => { if (event === 'close') setImmediate(() => setImmediate(() => cb(0))); },
          kill: () => {}
        };
      }
      return mockProcess;
    });

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

    // Mock context: interpolateMessage resolves {{name}} from the
    // context's own properties
    mockContext = {
      host_server: 'test.example.com',
      username: 'testuser',
      ssh_key: '~/.ssh/id_rsa',
      local_file: './test-file.txt',
      remote_file: '/tmp/test-file.txt'
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    console.log.mockRestore();
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
      expect(remoteHandler.trustedKeyPaths).toContain('/home/user/.ssh/trusted_key');
    });

    it('should default to strict mode with an empty allowlist', async () => {
      await remoteHandler.initialize();

      expect(remoteHandler.securityMode).toBe('strict');
      await expect(
        remoteHandler.handleMessage('connect host="localhost" user="test"', mockContext)
      ).rejects.toThrow('Host localhost not allowed by security policy');
      expect(spawn).not.toHaveBeenCalled();
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
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should validate SSH key paths in strict mode', async () => {
      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.com'],
        trustedKeyPaths: ['/approved/key']
      });

      await expect(
        remoteHandler.handleMessage(
          'connect host="trusted.com" user="test" key="/unapproved/key"',
          mockContext
        )
      ).rejects.toThrow('SSH key path /unapproved/key not trusted by security policy');
      expect(spawn).not.toHaveBeenCalled();

      const result = await remoteHandler.handleMessage(
        'connect host="trusted.com" user="test" key="/approved/key"',
        mockContext
      );
      expect(result.success).toBe(true);
    });

    it('should allow localhost and configured hosts in moderate mode', async () => {
      await remoteHandler.initialize({
        securityMode: 'moderate',
        allowedHosts: ['build.example.com']
      });

      await expect(
        remoteHandler.handleMessage('connect host="elsewhere.com" user="test"', mockContext)
      ).rejects.toThrow('Host elsewhere.com not allowed by security policy');

      expect((await remoteHandler.handleMessage('connect host="localhost" user="test"', mockContext)).success).toBe(true);
      expect((await remoteHandler.handleMessage('connect host="127.0.0.1" user="test"', mockContext)).success).toBe(true);
      expect((await remoteHandler.handleMessage('connect host="build.example.com" user="test"', mockContext)).success).toBe(true);
    });

    it('should only trust keys under ~/.ssh/ in moderate mode', async () => {
      await remoteHandler.initialize({ securityMode: 'moderate' });
      const homeKey = path.join(os.homedir(), '.ssh/id_ed25519');

      await expect(
        remoteHandler.handleMessage('connect host="localhost" user="test" key="/tmp/stolen_key"', mockContext)
      ).rejects.toThrow('SSH key path /tmp/stolen_key not trusted by security policy');

      const result = await remoteHandler.handleMessage(
        `connect host="localhost" user="test" key="${homeKey}"`,
        mockContext
      );
      expect(result.success).toBe(true);
      expect(spawn).toHaveBeenCalledWith('ssh', expect.arrayContaining(['-i', homeKey]), expect.any(Object));
    });
  });

  describe('SSH Connection Management', () => {
    beforeEach(async () => {
      // Setup permissive mode for easier testing
      await remoteHandler.initialize({
        securityMode: 'permissive',
        maxConnections: 10
      });
    });

    it('should establish SSH connection without a key', async () => {
      const result = await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="main"',
        mockContext
      );

      expect(result).toEqual({
        success: true,
        connectionId: 'main',
        message: 'Connected to testuser@test.example.com:22',
        host: 'test.example.com',
        user: 'testuser',
        port: 22
      });

      expect(spawn).toHaveBeenCalledWith('ssh', [
        ...SSH_OPTS, '-p', '22', 'testuser@test.example.com', 'echo', 'connection_test'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });

      expect(remoteHandler.activeConnections.has('main')).toBe(true);
      const connection = remoteHandler.activeConnections.get('main');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
      expect(connection.keyPath).toBeNull();
    });

    it('should establish SSH connection with key-based authentication and custom port', async () => {
      const result = await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" key="~/.ssh/id_rsa" port=2222 alias="keyauth"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.connectionId).toBe('keyauth');
      expect(result.port).toBe(2222);

      expect(spawn).toHaveBeenCalledWith('ssh', [
        ...SSH_OPTS, '-p', '2222', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com', 'echo', 'connection_test'
      ], expect.any(Object));

      const connection = remoteHandler.activeConnections.get('keyauth');
      expect(connection.keyPath).toBe('~/.ssh/id_rsa');
      expect(connection.port).toBe(2222);
    });

    it('should number connections without an alias', async () => {
      const first = await remoteHandler.handleMessage('connect host="h1.com" user="u"', mockContext);
      const second = await remoteHandler.handleMessage('connect host="h2.com" user="u"', mockContext);

      expect(first.connectionId).toBe('conn_1');
      expect(second.connectionId).toBe('conn_2');
    });

    it('should require host and user', async () => {
      await expect(
        remoteHandler.handleMessage('connect host="test.example.com"', mockContext)
      ).rejects.toThrow('connect requires host and user parameters');
    });

    it('should handle SSH connection failures', async () => {
      // The probe fails the way ssh does for an unreachable host
      const failingProbe = hangingProcess();
      failingProbe.stderr.on.mockImplementation((event, cb) => {
        if (event === 'data') setImmediate(() => cb(Buffer.from('ssh: connect to host unreachable.com port 22: Connection refused')));
      });
      failingProbe.on.mockImplementation((event, cb) => {
        if (event === 'close') setImmediate(() => setImmediate(() => cb(255)));
      });
      spawn.mockImplementationOnce(() => failingProbe);

      await expect(
        remoteHandler.handleMessage(
          'connect host="unreachable.com" user="testuser" alias="down"',
          mockContext
        )
      ).rejects.toThrow('Connection failed: SSH connection test failed: ssh: connect to host unreachable.com port 22: Connection refused');
      expect(remoteHandler.activeConnections.has('down')).toBe(false);
    });

    it('should reject a probe that exits 0 without echoing connection_test', async () => {
      const silentProbe = hangingProcess();
      silentProbe.on.mockImplementation((event, cb) => {
        if (event === 'close') setImmediate(() => cb(0));
      });
      spawn.mockImplementationOnce(() => silentProbe);

      await expect(
        remoteHandler.handleMessage('connect host="odd.com" user="testuser"', mockContext)
      ).rejects.toThrow('Connection failed: SSH connection test failed: Unknown error');
      expect(remoteHandler.activeConnections.size).toBe(0);
    });

    it('should time out a probe that never answers', async () => {
      const stuckProbe = hangingProcess();
      spawn.mockImplementationOnce(() => stuckProbe);

      const pending = remoteHandler.handleMessage('connect host="slow.com" user="testuser"', mockContext);
      const assertion = expect(pending).rejects.toThrow('Connection failed: SSH connection test timeout');
      await jest.advanceTimersByTimeAsync(10000);
      await assertion;

      expect(stuckProbe.kill).toHaveBeenCalled();
      expect(remoteHandler.activeConnections.size).toBe(0);
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
      spawn.mockClear();

      // Third connection should fail
      await expect(
        remoteHandler.handleMessage(
          'connect host="host3.com" user="user3" alias="conn3"',
          mockContext
        )
      ).rejects.toThrow('Maximum connections (2) reached');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should list active connections', async () => {
      await remoteHandler.handleMessage('connect host="host1.com" user="user1" alias="conn1"', mockContext);
      await remoteHandler.handleMessage('connect host="host2.com" user="user2" port=2200 alias="conn2"', mockContext);

      const result = await remoteHandler.handleMessage('list_connections', mockContext);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.connections).toEqual([
        expect.objectContaining({ id: 'conn1', host: 'host1.com', user: 'user1', port: 22 }),
        expect.objectContaining({ id: 'conn2', host: 'host2.com', user: 'user2', port: 2200 })
      ]);
      expect(typeof result.connections[0].createdAt).toBe('string');
      expect(typeof result.connections[0].lastUsed).toBe('string');
    });

    it('should set default and per-connection timeouts', async () => {
      await remoteHandler.handleMessage('connect host="host1.com" user="user1" alias="conn1"', mockContext);

      let result = await remoteHandler.handleMessage('set_timeout value=60000', mockContext);
      expect(result).toEqual({ success: true, message: 'Default timeout set to 60000ms' });
      expect(remoteHandler.defaultTimeout).toBe(60000);

      result = await remoteHandler.handleMessage('set_timeout value=5000 connection="conn1"', mockContext);
      expect(result).toEqual({ success: true, message: 'Timeout set to 5000ms for conn1' });
      expect(remoteHandler.activeConnections.get('conn1').timeout).toBe(5000);

      await expect(
        remoteHandler.handleMessage('set_timeout', mockContext)
      ).rejects.toThrow('set_timeout requires value parameter');
    });

    it('should reject unknown operations', async () => {
      await expect(
        remoteHandler.handleMessage('reboot host="test.example.com"', mockContext)
      ).rejects.toThrow('Unknown remote shell operation: reboot');
    });
  });

  describe('Remote Command Execution', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });

      // Establish a connection first
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" key="~/.ssh/id_rsa" alias="cmd_test"',
        mockContext
      );
      spawn.mockClear();
    });

    it('should execute remote commands successfully', async () => {
      scriptProcess({ stdout: 'total 24\ndrwxr-xr-x 2 testuser testuser 4096 Jan 15 10:00 .' });

      const result = await remoteHandler.handleMessage(
        'execute command="ls" connection="cmd_test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('drwxr-xr-x');
      expect(result.stderr).toBe('');
      expect(result.command).toBe('ls');
      expect(result.connectionId).toBe('cmd_test');
      expect(typeof result.duration).toBe('number');

      expect(spawn).toHaveBeenCalledWith('ssh', [
        ...SSH_OPTS, '-p', '22', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com', 'ls'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
    });

    it('should use the first connection when none is named', async () => {
      const result = await remoteHandler.handleMessage('execute command="hostname"', mockContext);

      expect(result.connectionId).toBe('cmd_test');
      expect(spawn).toHaveBeenCalledWith('ssh', expect.arrayContaining(['testuser@test.example.com', 'hostname']), expect.any(Object));
    });

    it('should time out a command that does not finish', async () => {
      scriptProcess({ code: null });
      mockProcess.on.mockImplementation(() => {}); // never closes

      const pending = remoteHandler.handleMessage(
        'execute command="sleep" timeout=1000 connection="cmd_test"',
        mockContext
      );
      const assertion = expect(pending).rejects.toThrow('Command execution timeout after 1000ms');
      await jest.advanceTimersByTimeAsync(1000);
      await assertion;

      expect(mockProcess.kill).toHaveBeenCalled();
    });

    it('should use the connection timeout when execute gives none', async () => {
      await remoteHandler.handleMessage('set_timeout value=2000 connection="cmd_test"', mockContext);
      mockProcess.on.mockImplementation(() => {}); // never closes

      const pending = remoteHandler.handleMessage('execute command="sleep"', mockContext);
      const assertion = expect(pending).rejects.toThrow('Command execution timeout after 2000ms');
      await jest.advanceTimersByTimeAsync(1999);
      expect(mockProcess.kill).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await assertion;

      expect(mockProcess.kill).toHaveBeenCalled();
    });

    it('should execute commands with working directory', async () => {
      await remoteHandler.handleMessage(
        'execute command="pwd" working_dir="/var/log" connection="cmd_test"',
        mockContext
      );

      expect(spawn).toHaveBeenCalledWith('ssh', [
        ...SSH_OPTS, '-p', '22', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com', 'cd "/var/log" && pwd'
      ], expect.any(Object));
    });

    it('should handle command execution errors', async () => {
      // Mock command failure
      scriptProcess({ stderr: 'bash: badcommand: command not found', code: 127 });

      const result = await remoteHandler.handleMessage(
        'execute command="badcommand" connection="cmd_test"',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(127);
      expect(result.stderr).toContain('command not found');
    });

    it('should report ssh spawn errors', async () => {
      mockProcess.on.mockImplementation((event, cb) => {
        if (event === 'error') setImmediate(() => cb(new Error('spawn ssh ENOENT')));
      });

      await expect(
        remoteHandler.handleMessage('execute command="ls" connection="cmd_test"', mockContext)
      ).rejects.toThrow('SSH execution error: spawn ssh ENOENT');
    });

    it('should require a command parameter', async () => {
      await expect(
        remoteHandler.handleMessage('execute connection="cmd_test"', mockContext)
      ).rejects.toThrow('execute requires command parameter');
    });

    it('should validate connection exists for command execution', async () => {
      await expect(
        remoteHandler.handleMessage(
          'execute command="ls" connection="nonexistent"',
          mockContext
        )
      ).rejects.toThrow('Connection nonexistent not found');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should require a connection before executing', async () => {
      await remoteHandler.handleMessage('disconnect', mockContext);

      await expect(
        remoteHandler.handleMessage('execute command="ls"', mockContext)
      ).rejects.toThrow('No active connections. Use connect command first.');
    });

    // KNOWN BUG: parseCommand splits on whitespace before stripping quotes,
    // so a quoted multi-word value is cut at its first space and keeps the
    // opening quote (command becomes '"ls'). Remove .failing once fixed.
    it('should keep a quoted multi-word command intact', async () => {
      const result = await remoteHandler.handleMessage(
        'execute command="ls -la /tmp" connection="cmd_test"',
        mockContext
      );

      expect(result.command).toBe('ls -la /tmp');
    });
  });

  describe('File Transfer Operations', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });

      // Establish connection
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" port=2222 alias="file_test"',
        mockContext
      );
      spawn.mockClear();
    });

    it('should upload files via SCP', async () => {
      const result = await remoteHandler.handleMessage(
        'upload local="./test-file.txt" remote="/tmp/test-file.txt" connection="file_test"',
        mockContext
      );

      expect(result).toEqual({
        success: true,
        localPath: './test-file.txt',
        remotePath: '/tmp/test-file.txt',
        connectionId: 'file_test',
        bytesTransferred: 1024,
        duration: expect.any(Number)
      });

      expect(spawn).toHaveBeenCalledWith('scp', [
        ...SSH_OPTS, '-P', '2222', './test-file.txt', 'testuser@test.example.com:/tmp/test-file.txt'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      expect(fs.statSync).toHaveBeenCalledWith('./test-file.txt');
    });

    it('should download files via SCP', async () => {
      fs.statSync.mockReturnValue({ isFile: () => true, size: 4096 });

      const result = await remoteHandler.handleMessage(
        'download remote="/tmp/remote-file.txt" local="./downloaded-file.txt" connection="file_test"',
        mockContext
      );

      expect(result).toEqual({
        success: true,
        remotePath: '/tmp/remote-file.txt',
        localPath: './downloaded-file.txt',
        connectionId: 'file_test',
        bytesTransferred: 4096,
        duration: expect.any(Number)
      });

      expect(spawn).toHaveBeenCalledWith('scp', [
        ...SSH_OPTS, '-P', '2222', 'testuser@test.example.com:/tmp/remote-file.txt', './downloaded-file.txt'
      ], { stdio: ['ignore', 'pipe', 'pipe'] });
      expect(fs.statSync).toHaveBeenCalledWith('./downloaded-file.txt');
    });

    it('should require local and remote parameters', async () => {
      await expect(
        remoteHandler.handleMessage('upload local="./a.txt"', mockContext)
      ).rejects.toThrow('upload requires local and remote parameters');
      await expect(
        remoteHandler.handleMessage('download remote="/tmp/a.txt"', mockContext)
      ).rejects.toThrow('download requires remote and local parameters');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should validate local file exists for upload', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(
        remoteHandler.handleMessage(
          'upload local="./nonexistent.txt" remote="/tmp/file.txt" connection="file_test"',
          mockContext
        )
      ).rejects.toThrow('Upload failed: Local file not found: ./nonexistent.txt');
      expect(spawn).not.toHaveBeenCalled();
    });

    it('should handle SCP upload failures', async () => {
      scriptProcess({ stderr: 'scp: /tmp/protected/test.txt: Permission denied', code: 1 });

      await expect(
        remoteHandler.handleMessage(
          'upload local="./test.txt" remote="/tmp/protected/test.txt" connection="file_test"',
          mockContext
        )
      ).rejects.toThrow('Upload failed: SCP upload failed: scp: /tmp/protected/test.txt: Permission denied');
    });

    it('should handle SCP download failures', async () => {
      scriptProcess({ stderr: 'scp: /tmp/missing.txt: No such file or directory', code: 1 });

      await expect(
        remoteHandler.handleMessage(
          'download remote="/tmp/missing.txt" local="./missing.txt" connection="file_test"',
          mockContext
        )
      ).rejects.toThrow('Download failed: SCP download failed: scp: /tmp/missing.txt: No such file or directory');
      expect(fs.statSync).not.toHaveBeenCalled();
    });

    it('should time out a stalled transfer', async () => {
      await remoteHandler.handleMessage('set_timeout value=3000 connection="file_test"', mockContext);
      mockProcess.on.mockImplementation(() => {}); // never closes

      const pending = remoteHandler.handleMessage(
        'upload local="./big.iso" remote="/tmp/big.iso" connection="file_test"',
        mockContext
      );
      const assertion = expect(pending).rejects.toThrow('Upload failed: SCP upload timeout');
      await jest.advanceTimersByTimeAsync(3000);
      await assertion;

      expect(mockProcess.kill).toHaveBeenCalled();
    });

    it('should refuse local paths outside the working directory in strict mode', async () => {
      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['test.example.com']
      });

      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="strict_test"',
        mockContext
      );
      spawn.mockClear();

      await expect(
        remoteHandler.handleMessage(
          'upload local="/home/other/secret.txt" remote="/tmp/secret.txt" connection="strict_test"',
          mockContext
        )
      ).rejects.toThrow('Local path /home/other/secret.txt not allowed by security policy');

      // Relative paths are not resolved, so they do not count as under cwd
      await expect(
        remoteHandler.handleMessage(
          'download remote="/tmp/x.txt" local="./x.txt" connection="strict_test"',
          mockContext
        )
      ).rejects.toThrow('Local path ./x.txt not allowed by security policy');
      expect(spawn).not.toHaveBeenCalled();

      const localPath = path.join(process.cwd(), 'test.txt');
      const result = await remoteHandler.handleMessage(
        `upload local="${localPath}" remote="/tmp/test.txt" connection="strict_test"`,
        mockContext
      );
      expect(result.success).toBe(true);
      expect(result.localPath).toBe(localPath);
    });

    it('should refuse system directories as local paths in moderate mode', async () => {
      await remoteHandler.initialize({ securityMode: 'moderate' });

      await remoteHandler.handleMessage(
        'connect host="localhost" user="testuser" alias="moderate_test"',
        mockContext
      );
      spawn.mockClear();

      for (const local of ['/etc/passwd', '/bin/sh', '/sbin/init', '/usr/bin/env', '/usr/sbin/sshd']) {
        await expect(
          remoteHandler.handleMessage(
            `download remote="/tmp/payload" local="${local}" connection="moderate_test"`,
            mockContext
          )
        ).rejects.toThrow(`Local path ${local} not allowed by security policy`);
      }
      expect(spawn).not.toHaveBeenCalled();

      const result = await remoteHandler.handleMessage(
        'download remote="/tmp/report.txt" local="/home/testuser/report.txt" connection="moderate_test"',
        mockContext
      );
      expect(result.success).toBe(true);
    });

    // KNOWN BUG: validateLocalPath checks the raw string with startsWith, so
    // '..' segments walk out of cwd (and past the system-directory blocklist).
    // Remove .failing once the path is resolved before checking.
    it('should refuse a strict-mode local path that climbs out of cwd', async () => {
      await remoteHandler.initialize({ securityMode: 'strict', allowedHosts: ['test.example.com'] });
      await remoteHandler.handleMessage('connect host="test.example.com" user="testuser" alias="strict_test"', mockContext);

      const escaping = `${process.cwd()}/../../../../../../etc/passwd`;
      await expect(
        remoteHandler.handleMessage(
          `download remote="/tmp/payload" local="${escaping}" connection="strict_test"`,
          mockContext
        )
      ).rejects.toThrow('not allowed by security policy');
    });
  });

  describe('Connection Management and Cleanup', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });
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

      expect(result).toEqual({ success: true, message: 'Disconnected from to_disconnect' });
      expect(remoteHandler.activeConnections.has('to_disconnect')).toBe(false);
    });

    it('should refuse to disconnect an unknown connection', async () => {
      await expect(
        remoteHandler.handleMessage('disconnect connection="ghost"', mockContext)
      ).rejects.toThrow('Connection ghost not found');
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

      const result = await remoteHandler.handleMessage('disconnect', mockContext);

      expect(result).toEqual({ success: true, message: 'Disconnected from 2 connections' });
      expect(remoteHandler.activeConnections.size).toBe(0);
    });
  });

  describe('Variable Interpolation', () => {
    beforeEach(async () => {
      await remoteHandler.initialize({ securityMode: 'permissive' });
    });

    it('should interpolate variables in host, user and key parameters', async () => {
      const result = await remoteHandler.handleMessage(
        'connect host="{{host_server}}" user="{{username}}" key="{{ssh_key}}" alias="interpolated"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.host).toBe('test.example.com');
      expect(result.user).toBe('testuser');
      expect(result.message).toBe('Connected to testuser@test.example.com:22');

      const connection = remoteHandler.activeConnections.get('interpolated');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
      expect(connection.keyPath).toBe('~/.ssh/id_rsa');
      expect(spawn).toHaveBeenCalledWith('ssh', [
        ...SSH_OPTS, '-p', '22', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com', 'echo', 'connection_test'
      ], expect.any(Object));
    });

    it('should interpolate variables in file paths', async () => {
      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="file_interp"',
        mockContext
      );

      const result = await remoteHandler.handleMessage(
        'upload local="{{local_file}}" remote="{{remote_file}}" connection="file_interp"',
        mockContext
      );

      expect(result.localPath).toBe('./test-file.txt');
      expect(result.remotePath).toBe('/tmp/test-file.txt');
      expect(spawn).toHaveBeenCalledWith('scp', [
        ...SSH_OPTS, '-P', '22', './test-file.txt', 'testuser@test.example.com:/tmp/test-file.txt'
      ], expect.any(Object));
    });

    it('should interpolate variables in commands and working directories', async () => {
      // Interpolation happens after parsing, so a variable can carry spaces
      mockContext.list_cmd = 'ls -la';
      mockContext.target_dir = '/var/log';

      await remoteHandler.handleMessage(
        'connect host="test.example.com" user="testuser" alias="cmd_interp"',
        mockContext
      );

      const result = await remoteHandler.handleMessage(
        'execute command="{{list_cmd}}" working_dir="{{target_dir}}" connection="cmd_interp"',
        mockContext
      );

      expect(result.command).toBe('ls -la');
      expect(spawn).toHaveBeenCalledWith('ssh', [
        ...SSH_OPTS, '-p', '22', 'testuser@test.example.com', 'cd "/var/log" && ls -la'
      ], expect.any(Object));
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
       * │   Key: ~/.ssh/id_rsa                        │
       * │   Port: 22                                  │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(remoteHandler.activeConnections.size).toBe(1);

      const connection = remoteHandler.activeConnections.get('workflow');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
      expect(connection.keyPath).toBe('~/.ssh/id_rsa');

      // INTERACTION: Execute remote command
      mockContext.uname_cmd = 'uname -a';
      scriptProcess({ stdout: 'Linux test 5.4.0 #1 SMP x86_64 GNU/Linux' });

      result = await remoteHandler.handleMessage(
        'execute command="{{uname_cmd}}" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Linux test');

      // INTERACTION: Upload file
      scriptProcess();
      result = await remoteHandler.handleMessage(
        'upload local="./test-script.rexx" remote="/tmp/script.rexx" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.remotePath).toBe('/tmp/script.rexx');

      // INTERACTION: Execute uploaded script
      mockContext.run_cmd = '/usr/local/bin/rexx /tmp/script.rexx';
      result = await remoteHandler.handleMessage(
        'execute command="{{run_cmd}}" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);

      // INTERACTION: Download results
      result = await remoteHandler.handleMessage(
        'download remote="/tmp/results.txt" local="./results.txt" connection="workflow"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.localPath).toBe('./results.txt');

      expect(nonProbeSpawns().map(([cmd, args]) => [cmd, args.slice(SSH_OPTS.length)])).toEqual([
        ['ssh', ['-p', '22', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com', 'uname -a']],
        ['scp', ['-P', '22', '-i', '~/.ssh/id_rsa', './test-script.rexx', 'testuser@test.example.com:/tmp/script.rexx']],
        ['ssh', ['-p', '22', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com', '/usr/local/bin/rexx /tmp/script.rexx']],
        ['scp', ['-P', '22', '-i', '~/.ssh/id_rsa', 'testuser@test.example.com:/tmp/results.txt', './results.txt']]
      ]);

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
       * │ Trusted Keys: [/keys/deploy]               │
       * │ Local Paths: under cwd, no system dirs     │
       * │ Active Connections: 0                       │
       * └─────────────────────────────────────────────┘
       */

      await remoteHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.com'],
        trustedKeyPaths: ['/keys/deploy']
      });

      // INTERACTION: Try untrusted host (should fail)
      await expect(
        remoteHandler.handleMessage(
          'connect host="malicious.com" user="hacker"',
          mockContext
        )
      ).rejects.toThrow('Host malicious.com not allowed by security policy');

      // INTERACTION: Try untrusted key on a trusted host (should fail)
      await expect(
        remoteHandler.handleMessage(
          'connect host="trusted.com" user="authorized" key="/tmp/other_key"',
          mockContext
        )
      ).rejects.toThrow('SSH key path /tmp/other_key not trusted by security policy');
      expect(spawn).not.toHaveBeenCalled();

      // INTERACTION: Connect to trusted host (should succeed)
      const result = await remoteHandler.handleMessage(
        'connect host="trusted.com" user="authorized" key="/keys/deploy" alias="secure"',
        mockContext
      );

      /*
       * AFTER TRUSTED CONNECTION: Secure connection established
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Security Mode: strict                       │
       * │ Allowed Hosts: [trusted.com]               │
       * │ Active Connections: 1                       │
       * │                                             │
       * │ > secure (trusted.com) ✓ verified          │
       * │   User: authorized                          │
       * │   Key: /keys/deploy                         │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(remoteHandler.activeConnections.size).toBe(1);

      // INTERACTION: Try a system file as the local side (should fail)
      await expect(
        remoteHandler.handleMessage(
          'upload local="/etc/passwd" remote="/tmp/passwd" connection="secure"',
          mockContext
        )
      ).rejects.toThrow('Local path /etc/passwd not allowed by security policy');

      // INTERACTION: Use a local path under the working directory (should succeed)
      const localPath = path.join(process.cwd(), 'test.txt');
      const uploadResult = await remoteHandler.handleMessage(
        `upload local="${localPath}" remote="/tmp/safe-file.txt" connection="secure"`,
        mockContext
      );

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.remotePath).toBe('/tmp/safe-file.txt');
      expect(spawn).toHaveBeenLastCalledWith('scp', [
        ...SSH_OPTS, '-P', '22', '-i', '/keys/deploy', localPath, 'authorized@trusted.com:/tmp/safe-file.txt'
      ], expect.any(Object));
    });
  });
});
