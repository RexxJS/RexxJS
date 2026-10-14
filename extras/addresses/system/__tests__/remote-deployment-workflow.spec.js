/**
 * Remote Deployment Workflow Tests
 * Tests the complete remote shell and container deployment system
 *
 * The real handlers run here (podman-address's container handler, the remote
 * shell handler, and the orchestrator over both); only the processes they
 * spawn (podman, ssh) are faked.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const RemoteShellHandler = require('../src/remote-shell-handler');
const { AddressPodmanHandler: PodmanHandler } = require('../../podman-address/podman-address.js');
const DeploymentOrchestrator = require('../src/deployment-orchestrator');

// Mock child_process for testing
jest.mock('child_process');
jest.mock('fs');

describe('Remote Deployment Workflow', () => {
  let orchestrator;
  let remoteShellHandler;
  let containerHandler;
  let mockContext;
  let spawn;

  // How each faked process ends: (command, args) => { code, stdout, stderr }
  let replyFor;
  // Every faked process, in spawn order
  let processes;

  const defaultReply = (command, args) => {
    if (command === 'ssh' && args[args.length - 1] === 'connection_test') {
      return { code: 0, stdout: 'connection_test\n' };
    }
    if (command === 'podman' && args[0] === 'create') {
      return { code: 0, stdout: `cid-${args[2]}\n` };
    }
    return { code: 0, stdout: '' };
  };

  const fakeProcess = (command, args) => {
    const reply = replyFor(command, args);
    const proc = new EventEmitter();
    proc.command = command;
    proc.args = args;
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.stdin = { write: jest.fn(), end: jest.fn() };
    proc.kill = jest.fn();
    // The handlers attach their listeners right after spawn returns
    setImmediate(() => {
      if (reply.stdout) proc.stdout.emit('data', Buffer.from(reply.stdout));
      if (reply.stderr) proc.stderr.emit('data', Buffer.from(reply.stderr));
      proc.emit('close', reply.code);
    });
    processes.push(proc);
    return proc;
  };

  const podmanCalls = () => processes.filter(p => p.command === 'podman').map(p => p.args);

  beforeEach(() => {
    // The handlers arm timeout timers they never clear (podman's 60s command
    // timeout, ssh's 10s connection-test timeout); fake timers keep those from
    // holding Jest open, while setImmediate (the fake processes) stays real
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask', 'Date'] });

    spawn = require('child_process').spawn;
    processes = [];
    replyFor = defaultReply;
    spawn.mockImplementation(fakeProcess);

    // Mock fs
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mocked file content');
    fs.statSync.mockReturnValue({ size: 1024 });

    // Initialize handlers
    orchestrator = new DeploymentOrchestrator();
    remoteShellHandler = new RemoteShellHandler();
    containerHandler = new PodmanHandler();

    // The handlers interpolate variables from a plain variable pool
    mockContext = {
      host_server: 'test.example.com',
      username: 'testuser',
      container_name: 'test-worker'
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Container Deployment Workflow', () => {
    it('should create container and deploy RexxJS binary', async () => {
      await containerHandler.initialize({
        securityMode: 'permissive',
        allowedImages: ['debian:stable']
      });

      const createResult = await containerHandler.handleAddressCommand(
        'create image="debian:stable" name="test-worker" interactive=false',
        mockContext
      );

      expect(createResult.success).toBe(true);
      expect(createResult.container).toBe('test-worker');
      expect(createResult.containerId).toBe('cid-test-worker');
      expect(createResult.image).toBe('debian:stable');

      // deploy_rexx needs the container running
      const startResult = await containerHandler.handleAddressCommand(
        'start name="test-worker"',
        mockContext
      );
      expect(startResult.status).toBe('running');

      const deployResult = await containerHandler.handleAddressCommand(
        'deploy_rexx container="test-worker" rexx_binary="/path/to/rexx-linux-x64"',
        mockContext
      );

      expect(deployResult.success).toBe(true);
      expect(deployResult.container).toBe('test-worker');
      expect(deployResult.target).toBe('/usr/local/bin/rexx');
      expect(podmanCalls()).toContainEqual(['cp', '/path/to/rexx-linux-x64', 'test-worker:/usr/local/bin/rexx']);
      expect(podmanCalls()).toContainEqual(['exec', 'test-worker', 'sh', '-c', 'chmod +x /usr/local/bin/rexx']);
    });

    it('should execute RexxJS script in container', async () => {
      await containerHandler.initialize({ securityMode: 'permissive' });

      // Setup container with RexxJS
      await containerHandler.handleAddressCommand(
        'create image="debian:stable" name="script-runner" interactive=false',
        mockContext
      );
      await containerHandler.handleAddressCommand('start name="script-runner"', mockContext);
      await containerHandler.handleAddressCommand(
        'deploy_rexx container="script-runner" rexx_binary="/path/to/rexx-linux-x64"',
        mockContext
      );

      replyFor = (command, args) => {
        if (args[0] === 'exec' && /^\/usr\/local\/bin\/rexx \/tmp\/rexx_script_\d+\.rexx$/.test(args[args.length - 1])) {
          return { code: 0, stdout: 'Hello from container\n' };
        }
        return defaultReply(command, args);
      };

      const executeResult = await containerHandler.handleAddressCommand(
        'execute_rexx container="script-runner" script="SAY \'Hello from container\'"',
        mockContext
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.container).toBe('script-runner');
      expect(executeResult.output).toBe('Hello from container');

      // The script went into the container over stdin
      const writer = processes.find(p => p.args[0] === 'exec' && p.args[1] === '-i');
      expect(writer.stdin.write).toHaveBeenCalledWith("SAY 'Hello from container'");
    });

    it('should demonstrate Ward Cunningham style container workflow', async () => {
      /*
       * BEFORE: No containers running
       * ┌─────────────────────────────────────────────┐
       * │ Container Runtime: podman                   │
       * │ Active Containers: 0                        │
       * │                                             │
       * │ Available Images:                           │
       * │   • debian:stable                           │
       * │   • ubuntu:latest                           │
       * └─────────────────────────────────────────────┘
       */

      await containerHandler.initialize({ securityMode: 'moderate' });
      expect(containerHandler.activeContainers.size).toBe(0);

      // INTERACTION: Create and start container
      await containerHandler.handleAddressCommand(
        'create image="debian:stable" name="rexx-worker"',
        mockContext
      );
      await containerHandler.handleAddressCommand('start name="rexx-worker"', mockContext);

      /*
       * AFTER: Container created and running
       * ┌─────────────────────────────────────────────┐
       * │ Container Runtime: podman                   │
       * │ Active Containers: 1                        │
       * │                                             │
       * │ > rexx-worker (debian:stable)               │
       * │   Status: running                           │
       * │   Created: 2025-01-15T10:00:00Z             │
       * └─────────────────────────────────────────────┘
       */

      expect(containerHandler.activeContainers.size).toBe(1);
      expect(containerHandler.activeContainers.has('rexx-worker')).toBe(true);

      const container = containerHandler.activeContainers.get('rexx-worker');
      expect(container.image).toBe('debian:stable');
      expect(container.status).toBe('running');
    });
  });

  describe('Remote Shell Deployment Workflow', () => {
    it('should establish secure shell connection', async () => {
      await remoteShellHandler.initialize({
        securityMode: 'permissive',
        allowedHosts: ['test.example.com']
      });

      const connectResult = await remoteShellHandler.handleMessage(
        'connect host="test.example.com" user="testuser" key="/path/to/key"',
        mockContext
      );

      expect(connectResult.success).toBe(true);
      expect(connectResult.host).toBe('test.example.com');
      expect(connectResult.user).toBe('testuser');
      expect(spawn).toHaveBeenCalledWith(
        'ssh',
        expect.arrayContaining(['-i', '/path/to/key', 'testuser@test.example.com', 'echo', 'connection_test']),
        expect.any(Object)
      );
    });

    it('should execute commands on remote host', async () => {
      await remoteShellHandler.initialize({ securityMode: 'permissive' });

      await remoteShellHandler.handleMessage(
        'connect host="test.example.com" user="testuser"',
        mockContext
      );

      replyFor = (command, args) => {
        if (command === 'ssh' && args[args.length - 1] === 'uptime') {
          return { code: 0, stdout: 'up 3 days\n' };
        }
        return defaultReply(command, args);
      };

      // A one-word command: the remote shell handler's parser splits values
      // on whitespace, quotes or not
      const executeResult = await remoteShellHandler.handleMessage(
        'execute command="uptime"',
        mockContext
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.command).toBe('uptime');
      expect(executeResult.stdout).toBe('up 3 days\n');
    });

    it('should demonstrate Ward Cunningham style remote workflow', async () => {
      /*
       * BEFORE: No remote connections
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Active Connections: 0                       │
       * │ Security Mode: permissive                   │
       * │                                             │
       * │ Allowed Hosts:                              │
       * │   • test.example.com                        │
       * │   • staging.example.com                     │
       * └─────────────────────────────────────────────┘
       */

      // Permissive: the handler checks the host against allowedHosts before
      // it interpolates {{host_server}}, so an allow-list would reject it
      await remoteShellHandler.initialize({
        securityMode: 'permissive',
        allowedHosts: ['test.example.com', 'staging.example.com']
      });
      expect(remoteShellHandler.activeConnections.size).toBe(0);

      // INTERACTION: Connect to remote server
      await remoteShellHandler.handleMessage(
        'connect host="{{host_server}}" user="{{username}}" alias="main"',
        mockContext
      );

      /*
       * AFTER: Connected to remote server
       * ┌─────────────────────────────────────────────┐
       * │ Remote Shell Handler                        │
       * │ Active Connections: 1                       │
       * │ Security Mode: permissive                   │
       * │                                             │
       * │ > main (test.example.com)                   │
       * │   User: testuser                            │
       * │   Status: connected                         │
       * │   Connected: 2025-01-15T10:00:00Z           │
       * └─────────────────────────────────────────────┘
       */

      expect(remoteShellHandler.activeConnections.size).toBe(1);
      expect(remoteShellHandler.activeConnections.has('main')).toBe(true);

      const connection = remoteShellHandler.activeConnections.get('main');
      expect(connection.host).toBe('test.example.com');
      expect(connection.user).toBe('testuser');
    });
  });

  describe('Unified Deployment Handler Workflow', () => {
    beforeEach(async () => {
      await orchestrator.initialize({
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64',
        container: { securityMode: 'permissive' },
        remoteShell: { securityMode: 'permissive' }
      });
    });

    it('should orchestrate complete container deployment', async () => {
      const setupResult = await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="orchestrated-worker"',
        mockContext
      );

      expect(setupResult.success).toBe(true);
      expect(setupResult.containerName).toBe('orchestrated-worker');
      expect(setupResult.status).toBe('ready');

      // The container really was created, started and given the binary
      expect(podmanCalls()).toContainEqual(['start', 'orchestrated-worker']);
      expect(podmanCalls()).toContainEqual(['cp', '/mock/path/to/rexx-linux-x64', 'orchestrated-worker:/usr/local/bin/rexx']);
      const container = orchestrator.container.activeContainers.get('orchestrated-worker');
      expect(container.status).toBe('running');
      expect(container.rexxDeployed).toBe(true);

      replyFor = (command, args) => {
        if (args[0] === 'exec' && /^\/usr\/local\/bin\/rexx \/tmp\/rexx_script_\d+\.rexx$/.test(args[args.length - 1])) {
          return { code: 0, stdout: 'Hello from orchestrated container\n' };
        }
        return defaultReply(command, args);
      };

      const executeResult = await orchestrator.handleMessage(
        'execute_remote script="SAY \'Hello from orchestrated container\'" target="orchestrated-worker"',
        mockContext
      );

      expect(executeResult.success).toBe(true);
      expect(executeResult.target).toBe('orchestrated-worker');
      expect(executeResult.output).toBe('Hello from orchestrated container');
    });

    it('should demonstrate one-shot deployment and execution', async () => {
      const result = await orchestrator.handleMessage(
        'deploy_and_execute script="SAY \'One-shot execution\'" image="debian:stable"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.deploymentType).toBe('oneshot_container');
      expect(result.cleanedUp).toBe(true);

      // The throwaway container is really gone afterwards
      expect(podmanCalls()).toContainEqual(['rm', '-f', 'oneshot-oneshot_1']);
      expect(orchestrator.container.activeContainers.size).toBe(0);
    });

    it('should demonstrate Ward Cunningham style orchestration workflow', async () => {
      /*
       * BEFORE: Clean deployment environment
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 0                       │
       * │ Default Binary: /path/to/rexx-linux-x64     │
       * │                                             │
       * │ Available Runtimes:                         │
       * │   • Container: podman                       │
       * │   • Remote Shell: ssh/scp                   │
       * └─────────────────────────────────────────────┘
       */

      expect(orchestrator.activeDeployments.size).toBe(0);

      // INTERACTION: Setup multiple deployment targets
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="worker1"',
        mockContext
      );
      await orchestrator.handleMessage(
        'setup_remote_shell host="server.example.com" user="admin" alias="server1"',
        mockContext
      );

      /*
       * AFTER: Multiple deployment targets ready
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 2                       │
       * │ Default Binary: /path/to/rexx-linux-x64     │
       * │                                             │
       * │ > worker1 (container)                       │
       * │   Image: debian:stable                      │
       * │   Status: ready                             │
       * │   RexxJS: deployed                          │
       * │                                             │
       * │ > server1 (remote_shell)                    │
       * │   Host: server.example.com                  │
       * │   User: admin                               │
       * │   Status: ready                             │
       * └─────────────────────────────────────────────┘
       */

      expect(orchestrator.activeDeployments.size).toBe(2);

      const deployments = Array.from(orchestrator.activeDeployments.values());
      expect(deployments.some(d => d.type === 'container')).toBe(true);
      expect(deployments.some(d => d.type === 'remote_shell')).toBe(true);

      // No key given, so ssh is not handed one
      const sshTest = processes.find(p => p.command === 'ssh');
      expect(sshTest.args).toContain('admin@server.example.com');
      expect(sshTest.args).not.toContain('-i');
      expect(orchestrator.remoteShell.activeConnections.has('server1')).toBe(true);
    });
  });

  describe('CHECKPOINT Communication Pattern', () => {
    it('should demonstrate progress callback workflow', async () => {
      /*
       * CHECKPOINT Communication Flow:
       * ┌─────────────┐    EXECUTE    ┌─────────────┐
       * │   Director  │──────────────►│   Worker    │
       * │ (Main RexxJS│               │(Container/  │
       * │  Process)   │               │ Remote)     │
       * │             │◄──────────────│             │
       * └─────────────┘   CHECKPOINT  └─────────────┘
       *                   PROGRESS
       *
       * Worker sends:
       * - CHECKPOINT("started", "Processing begins...")
       * - CHECKPOINT("progress", 50, 100)
       * - CHECKPOINT("completed", "Finished processing")
       */

      await orchestrator.initialize({
        enableProgressCallbacks: true,
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64',
        container: { securityMode: 'permissive' }
      });

      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="progress-worker"',
        mockContext
      );

      const progressScript = `
        SAY 'Starting data processing...'
        CALL CHECKPOINT 'started'
        DO i = 1 TO 100
          IF i // 10 = 0 THEN CALL CHECKPOINT 'progress', i
        END
        CALL CHECKPOINT 'completed'
      `;

      replyFor = (command, args) => {
        if (args[0] === 'exec' && args[1] === '-i' && /\/usr\/local\/bin\/rexx /.test(args[args.length - 1])) {
          return { code: 0, stdout: 'Starting data processing...\nAll done!\n' };
        }
        return defaultReply(command, args);
      };

      const result = await orchestrator.handleMessage(
        `execute_remote script="${progressScript}" target="progress-worker" progress=true`,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toContain('All done!');

      // With progress on, the script goes in wrapped with CHECKPOINT markers
      const writes = processes
        .filter(p => p.args[0] === 'exec' && p.args[1] === '-i')
        .flatMap(p => p.stdin.write.mock.calls.map(([content]) => content));
      const wrapped = writes.find(content => content.includes("CALL CHECKPOINT 'SCRIPT_START'"));
      expect(wrapped).toContain("CALL CHECKPOINT 'progress', i");
      expect(wrapped).toContain("CALL CHECKPOINT 'SCRIPT_END'");
    });
  });

  describe('Security and Error Handling', () => {
    it('should enforce security policies', async () => {
      await remoteShellHandler.initialize({
        securityMode: 'strict',
        allowedHosts: ['trusted.example.com']
      });

      await expect(
        remoteShellHandler.handleMessage(
          'connect host="untrusted.example.com" user="user"',
          mockContext
        )
      ).rejects.toThrow('Host untrusted.example.com not allowed by security policy');
      expect(spawn).not.toHaveBeenCalledWith('ssh', expect.anything(), expect.anything());
    });

    it('should handle deployment failures gracefully', async () => {
      replyFor = (command, args) => {
        if (command === 'podman' && args[0] === 'create') {
          return { code: 125, stderr: 'Error: nonexistent:image: image not known' };
        }
        return defaultReply(command, args);
      };

      await containerHandler.initialize({ securityMode: 'permissive' });

      // The container handler reports failures rather than throwing them
      const createResult = await containerHandler.handleAddressCommand(
        'create image="nonexistent:image" name="failed-container"',
        mockContext
      );

      expect(createResult.success).toBe(false);
      expect(createResult.error).toBe('Failed to create container: Error: nonexistent:image: image not known');
      expect(containerHandler.activeContainers.size).toBe(0);

      // ... and the orchestrator turns that report into a failed setup
      await orchestrator.initialize({
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64',
        container: { securityMode: 'permissive' }
      });

      await expect(
        orchestrator.handleMessage(
          'setup_container image="nonexistent:image" name="failed-container"',
          mockContext
        )
      ).rejects.toThrow('Container setup failed: Container creation failed: Failed to create container: Error: nonexistent:image: image not known');
      expect(orchestrator.activeDeployments.size).toBe(0);
    });
  });

  describe('Resource Management', () => {
    it('should enforce container limits', async () => {
      await containerHandler.initialize({
        maxContainers: 2,
        securityMode: 'permissive'
      });

      // Create maximum allowed containers
      await containerHandler.handleAddressCommand(
        'create image="debian:stable" name="container1"',
        mockContext
      );
      await containerHandler.handleAddressCommand(
        'create image="debian:stable" name="container2"',
        mockContext
      );

      // Try to exceed limit
      const result = await containerHandler.handleAddressCommand(
        'create image="debian:stable" name="container3"',
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum containers reached: 2');
      expect(containerHandler.activeContainers.has('container3')).toBe(false);
    });

    it('should cleanup resources properly', async () => {
      await orchestrator.initialize({
        defaultBinaryPath: '/mock/path/to/rexx-linux-x64',
        container: { securityMode: 'permissive' }
      });

      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="cleanup-test"',
        mockContext
      );

      expect(orchestrator.activeDeployments.size).toBe(1);
      expect(orchestrator.container.activeContainers.has('cleanup-test')).toBe(true);

      const cleanupResult = await orchestrator.handleMessage(
        'cleanup_deployment target="cleanup-test"',
        mockContext
      );

      expect(cleanupResult.success).toBe(true);
      expect(orchestrator.activeDeployments.size).toBe(0);
      expect(podmanCalls()).toContainEqual(['rm', 'cleanup-test']);
      expect(orchestrator.container.activeContainers.has('cleanup-test')).toBe(false);
    });
  });
});
