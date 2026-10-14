/**
 * Deployment Orchestrator Mock Tests - Orchestration Integration
 * Tests high-level deployment orchestration with mocked container and remote shell handlers
 *
 * The orchestrator's two sub-handlers (podman-address's container handler and
 * the remote shell handler) are replaced with stubs, so these tests pin down
 * what the orchestrator asks of them and what it does with their answers.
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const DeploymentOrchestrator = require('../src/deployment-orchestrator');

// Nothing here may spawn a real process or touch the real file system
jest.mock('child_process');
jest.mock('fs');

describe('Deployment Orchestrator - Mock Orchestration Tests', () => {
  let orchestrator;
  let container;
  let remoteShell;
  let mockContext;

  // Answers the container stub gives, by operation (first word of the command)
  let containerReplies;
  // Answers the remote shell stub gives, by operation
  let remoteReplies;

  const operationOf = (command) => command.trim().split(/\s+/)[0];
  const containerCommands = () => container.handleAddressCommand.mock.calls.map(([command]) => command);
  const remoteCommands = () => remoteShell.handleMessage.mock.calls.map(([command]) => command);

  beforeEach(() => {
    jest.clearAllMocks();

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('mock rexx binary content');

    containerReplies = {
      create: { success: true, operation: 'create', status: 'created' },
      start: { success: true, operation: 'start', status: 'running' },
      deploy_rexx: { success: true, operation: 'deploy_rexx', target: '/usr/local/bin/rexx' },
      execute_rexx: { success: true, operation: 'execute_rexx', exitCode: 0, stdout: '', output: '' },
      remove: { success: true, operation: 'remove' },
      list: { success: true, operation: 'list', containers: [] }
    };
    remoteReplies = {
      connect: { success: true },
      upload: { success: true },
      execute: { success: true, exitCode: 0, stdout: '', stderr: '', duration: 5 },
      disconnect: { success: true },
      list_connections: { success: true, connections: [] }
    };

    orchestrator = new DeploymentOrchestrator();

    container = {
      initialize: jest.fn().mockResolvedValue(undefined),
      handleAddressCommand: jest.fn(async (command) => containerReplies[operationOf(command)])
    };
    remoteShell = {
      initialize: jest.fn(),
      handleMessage: jest.fn(async (command) => remoteReplies[operationOf(command)])
    };
    orchestrator.container = container;
    orchestrator.remoteShell = remoteShell;

    mockContext = {
      variables: new Map([
        ['target_image', 'debian:stable'],
        ['worker_name', 'deploy-worker'],
        ['host_server', 'deploy.example.com'],
        ['deploy_user', 'deployer'],
        ['binary_path', './rexx-linux-x64']
      ])
    };
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default binary path', async () => {
      await orchestrator.initialize({
        defaultBinaryPath: '/usr/local/bin/rexx-linux-x64',
        enableProgressCallbacks: true
      });

      expect(orchestrator.defaultBinaryPath).toBe('/usr/local/bin/rexx-linux-x64');
      // Progress callbacks on means the CHECKPOINT channel got configured
      expect(orchestrator.checkpointConfig.transportType).toBe('websocket');
      expect(orchestrator.activeDeployments.size).toBe(0);
    });

    it('should initialize underlying handlers', async () => {
      await orchestrator.initialize({
        container: { securityMode: 'moderate' },
        remoteShell: { securityMode: 'strict', maxConnections: 5 }
      });

      expect(container.initialize).toHaveBeenCalledWith({ securityMode: 'moderate' });
      expect(remoteShell.initialize).toHaveBeenCalledWith({ securityMode: 'strict', maxConnections: 5 });
      // No defaultBinaryPath given: the first candidate that exists is used
      expect(orchestrator.defaultBinaryPath).toBe(path.resolve('./rexx-linux-x64'));
    });

    it('should set up CHECKPOINT communication from the progress config', async () => {
      await orchestrator.initialize({
        enableProgressCallbacks: true,
        progressConfig: { transportType: 'http-polling', port: 9090, endpoint: '/progress' }
      });

      expect(orchestrator.checkpointConfig).toEqual({
        transportType: 'http-polling',
        port: 9090,
        endpoint: '/progress',
        timeout: 30000,
        retryAttempts: 3
      });
    });
  });

  describe('Container-based Deployments', () => {
    beforeEach(async () => {
      await orchestrator.initialize({
        defaultBinaryPath: './rexx-linux-x64'
      });
    });

    it('should setup container deployment successfully', async () => {
      const result = await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="test-deploy" rexx_binary="./rexx-linux-x64"',
        mockContext
      );

      // create, then start (deploy_rexx needs a running container), then deploy
      expect(containerCommands()).toEqual([
        'create image="debian:stable" name="test-deploy" interactive=false',
        'start name="test-deploy"',
        'deploy_rexx container="test-deploy" rexx_binary="./rexx-linux-x64"'
      ]);

      expect(result.success).toBe(true);
      expect(result.containerName).toBe('test-deploy');
      expect(result.deploymentId).toBe('container_test-deploy_1');
      expect(result.status).toBe('ready');

      const deployment = orchestrator.activeDeployments.get('container_test-deploy_1');
      expect(deployment.type).toBe('container');
      expect(deployment.target).toBe('test-deploy');
      expect(deployment.image).toBe('debian:stable');
      expect(deployment.status).toBe('ready');
    });

    it('should execute scripts on deployed container', async () => {
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="exec-test"',
        mockContext
      );

      containerReplies.execute_rexx = {
        success: true,
        exitCode: 0,
        stdout: 'Hello from RexxJS in container!',
        output: 'Hello from RexxJS in container!'
      };

      const result = await orchestrator.handleMessage(
        'execute_remote script="SAY \'Hello from RexxJS in container!\'" target="exec-test"',
        mockContext
      );

      // The whole quoted script reaches the container, spaces and all
      expect(containerCommands()).toContain(
        'execute_rexx container="exec-test" script="SAY \'Hello from RexxJS in container!\'" timeout=60000 progress_callback=false'
      );
      expect(result.success).toBe(true);
      expect(result.target).toBe('exec-test');
      expect(result.deploymentType).toBe('container');
      expect(result.output).toContain('Hello from RexxJS');
    });

    it('should handle one-shot container deployment', async () => {
      const oneShotScript = 'SAY \'One-shot execution\'\nresult = 42\nSAY \'Result: \' || result';

      containerReplies.execute_rexx = {
        success: true,
        exitCode: 0,
        output: 'One-shot execution\nResult: 42'
      };

      const result = await orchestrator.handleMessage(
        `deploy_and_execute script="${oneShotScript}" image="debian:stable"`,
        mockContext
      );

      // A throwaway container: created, started, deployed to, run in, removed
      expect(containerCommands()).toEqual([
        'create image="debian:stable" name="oneshot-oneshot_1" interactive=false',
        'start name="oneshot-oneshot_1"',
        'deploy_rexx container="oneshot-oneshot_1" rexx_binary="./rexx-linux-x64"',
        `execute_rexx container="oneshot-oneshot_1" script="${oneShotScript}" timeout=60000 progress_callback=false`,
        'remove name="oneshot-oneshot_1" force=true'
      ]);

      expect(result.success).toBe(true);
      expect(result.deploymentType).toBe('oneshot_container');
      expect(result.target).toBe('oneshot-oneshot_1');
      expect(result.output).toContain('One-shot execution');
      expect(result.output).toContain('Result: 42');
      expect(result.cleanedUp).toBe(true);
    });

    it('should pass the progress flag through to the container', async () => {
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="progress-test"',
        mockContext
      );

      await orchestrator.handleMessage(
        'execute_remote script="CHECKPOINT(\'progress\', 1, 5)" target="progress-test" progress=true timeout=5000',
        mockContext
      );

      expect(containerCommands()).toContain(
        'execute_rexx container="progress-test" script="CHECKPOINT(\'progress\', 1, 5)" timeout=5000 progress_callback=true'
      );
      expect(orchestrator.activeDeployments.get('container_progress-test_1').lastExecution).toBeInstanceOf(Date);
    });
  });

  describe('Remote Shell Deployments', () => {
    beforeEach(async () => {
      await orchestrator.initialize({
        defaultBinaryPath: './rexx-linux-x64'
      });
    });

    it('should setup remote shell deployment', async () => {
      const result = await orchestrator.handleMessage(
        'setup_remote_shell host="deploy.example.com" user="deployer" key="~/.ssh/deploy_key" alias="remote-deploy"',
        mockContext
      );

      expect(remoteCommands()).toEqual([
        'connect host="deploy.example.com" user="deployer" key="~/.ssh/deploy_key" alias="remote-deploy"'
      ]);

      expect(result.success).toBe(true);
      expect(result.connectionAlias).toBe('remote-deploy');
      expect(result.deploymentId).toBe('remote_remote-deploy_1');
      expect(result.binaryDeployed).toBe(false);
      expect(result.status).toBe('ready');

      const deployment = orchestrator.activeDeployments.get('remote_remote-deploy_1');
      expect(deployment.type).toBe('remote_shell');
      expect(deployment.target).toBe('remote-deploy');
      expect(deployment.host).toBe('deploy.example.com');
    });

    it('should deploy RexxJS binary to remote host', async () => {
      const result = await orchestrator.handleMessage(
        'setup_remote_shell host="deploy.example.com" user="deployer" alias="binary-deploy" rexx_binary="./rexx-linux-x64"',
        mockContext
      );

      // Upload to /tmp, then make it executable and move it onto the PATH
      expect(remoteCommands().slice(1)).toEqual([
        'upload local="./rexx-linux-x64" remote="/tmp/rexx" connection="binary-deploy"',
        'execute command="sudo chmod +x /tmp/rexx && sudo mv /tmp/rexx /usr/local/bin/" connection="binary-deploy"'
      ]);
      expect(result.success).toBe(true);
      expect(result.binaryDeployed).toBe(true);
    });

    it('should execute remote scripts', async () => {
      await orchestrator.handleMessage(
        'setup_remote_shell host="deploy.example.com" user="deployer" alias="remote-exec"',
        mockContext
      );

      remoteReplies.execute = {
        success: true,
        exitCode: 0,
        stdout: 'Remote RexxJS execution successful',
        stderr: '',
        duration: 12
      };

      const result = await orchestrator.handleMessage(
        'execute_remote script="SAY \'Remote RexxJS execution successful\'" target="remote-exec"',
        mockContext
      );

      // Without progress: write a temp script, run it with rexx, remove it
      const executes = remoteCommands().filter(command => command.startsWith('execute '));
      expect(executes).toHaveLength(3);
      expect(executes[0]).toMatch(/^execute command="cat > \/tmp\/rexx_\d+\.rexx" connection="remote-exec"$/);
      expect(executes[1]).toMatch(/^execute command="\/usr\/local\/bin\/rexx \/tmp\/rexx_\d+\.rexx" connection="remote-exec" timeout=60000$/);
      expect(executes[2]).toMatch(/^execute command="rm -f \/tmp\/rexx_\d+\.rexx" connection="remote-exec"$/);

      expect(result.success).toBe(true);
      expect(result.target).toBe('remote-exec');
      expect(result.deploymentType).toBe('remote_shell');
      expect(result.stdout).toContain('Remote RexxJS execution successful');
    });

    it('should handle remote deployment failures gracefully', async () => {
      remoteShell.handleMessage.mockRejectedValueOnce(
        new Error('Connection failed: ssh: connect to host failed: Connection refused')
      );

      await expect(
        orchestrator.handleMessage(
          'setup_remote_shell host="unreachable.com" user="deployer" alias="failed"',
          mockContext
        )
      ).rejects.toThrow('Remote shell setup failed: Connection failed: ssh: connect to host failed');
      expect(orchestrator.activeDeployments.size).toBe(0);
    });
  });

  describe('Multi-target Deployments', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should deploy to multiple targets simultaneously', async () => {
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="multi-container"',
        mockContext
      );
      await orchestrator.handleMessage(
        'setup_remote_shell host="multi.example.com" user="deployer" alias="multi-remote"',
        mockContext
      );

      expect(orchestrator.activeDeployments.size).toBe(2);

      const script = 'SAY \'Multi-target execution\'';

      const [containerResult, remoteResult] = await Promise.all([
        orchestrator.handleMessage(`execute_remote script="${script}" target="multi-container"`, mockContext),
        orchestrator.handleMessage(`execute_remote script="${script}" target="multi-remote"`, mockContext)
      ]);

      expect(containerResult.success).toBe(true);
      expect(containerResult.deploymentType).toBe('container');
      expect(containerResult.target).toBe('multi-container');

      expect(remoteResult.success).toBe(true);
      expect(remoteResult.deploymentType).toBe('remote_shell');
      expect(remoteResult.target).toBe('multi-remote');
    });
  });

  describe('Deployment Lifecycle Management', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should monitor deployment status', async () => {
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="monitor-test"',
        mockContext
      );

      containerReplies.list = {
        success: true,
        containers: [
          { name: 'other', status: 'stopped', created: new Date().toISOString() },
          { name: 'monitor-test', status: 'running', created: new Date(Date.now() - 60000).toISOString() }
        ]
      };

      const result = await orchestrator.handleMessage(
        'monitor_deployment target="monitor-test"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.deploymentId).toBe('container_monitor-test_1');
      expect(result.status.target).toBe('monitor-test');
      expect(result.status.type).toBe('container');
      expect(result.status.status).toBe('running');
      expect(result.status.uptime).toBeGreaterThanOrEqual(60000);
      expect(result.lastResult).toBeNull();
    });

    it('should monitor remote shell deployment status', async () => {
      await orchestrator.handleMessage(
        'setup_remote_shell host="mon.example.com" user="deployer" alias="remote-monitor"',
        mockContext
      );

      remoteReplies.execute = { success: true, exitCode: 0, stdout: 'done', stderr: '', duration: 42 };
      await orchestrator.handleMessage(
        'execute_remote script="SAY \'done\'" target="remote-monitor"',
        mockContext
      );

      remoteReplies.list_connections = {
        success: true,
        connections: [{ id: 'remote-monitor', createdAt: new Date().toISOString() }]
      };

      const result = await orchestrator.handleMessage(
        'monitor_deployment target="remote-monitor"',
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.status.type).toBe('remote_shell');
      expect(result.status.status).toBe('connected');
      expect(result.lastExecution).toBeInstanceOf(Date);
      expect(result.lastResult).toEqual({ exitCode: 0, duration: 42 });
    });

    it('should cleanup specific deployment', async () => {
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="cleanup-test"',
        mockContext
      );

      expect(orchestrator.activeDeployments.has('container_cleanup-test_1')).toBe(true);

      const result = await orchestrator.handleMessage(
        'cleanup_deployment target="cleanup-test"',
        mockContext
      );

      expect(containerCommands()).toContain('remove name="cleanup-test" force=false');
      expect(result.success).toBe(true);
      expect(result.target).toBe('cleanup-test');
      expect(result.deploymentId).toBe('container_cleanup-test_1');
      expect(orchestrator.activeDeployments.has('container_cleanup-test_1')).toBe(false);
    });

    it('should list deployments and clean each one up', async () => {
      await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="cleanup1"',
        mockContext
      );
      await orchestrator.handleMessage(
        'setup_remote_shell host="cleanup.example.com" user="deployer" alias="cleanup2"',
        mockContext
      );

      const listed = await orchestrator.handleMessage('list_deployments', mockContext);

      expect(listed.success).toBe(true);
      expect(listed.count).toBe(2);
      expect(listed.deployments.map(d => [d.type, d.target])).toEqual([
        ['container', 'cleanup1'],
        ['remote_shell', 'cleanup2']
      ]);

      for (const deployment of listed.deployments) {
        await orchestrator.handleMessage(`cleanup_deployment target="${deployment.id}"`, mockContext);
      }

      expect(containerCommands()).toContain('remove name="cleanup1" force=false');
      expect(remoteCommands()).toContain('disconnect connection="cleanup2"');
      expect(orchestrator.activeDeployments.size).toBe(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should handle deployment target not found', async () => {
      await expect(
        orchestrator.handleMessage(
          'execute_remote script="SAY \'test\'" target="nonexistent"',
          mockContext
        )
      ).rejects.toThrow('Deployment target nonexistent not found');
    });

    it('should handle invalid deployment commands', async () => {
      await expect(
        orchestrator.handleMessage('invalid_deployment_command', mockContext)
      ).rejects.toThrow('Unknown deployment operation: invalid_deployment_command');
    });

    it('should handle binary deployment failures', async () => {
      containerReplies.deploy_rexx = {
        success: false,
        operation: 'error',
        error: 'Failed to deploy RexxJS binary: RexxJS binary not found: ./nonexistent'
      };

      await expect(
        orchestrator.handleMessage(
          'setup_container image="debian:stable" name="binary-fail" rexx_binary="./nonexistent"',
          mockContext
        )
      ).rejects.toThrow('Container setup failed: RexxJS deployment failed: Failed to deploy RexxJS binary: RexxJS binary not found: ./nonexistent');
      expect(orchestrator.activeDeployments.size).toBe(0);
    });
  });

  describe('Ward Cunningham Style Integration Scenarios', () => {
    it('should demonstrate complete multi-environment deployment', async () => {
      /*
       * BEFORE: Clean deployment orchestrator
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 0                       │
       * │ Container Handler: initialized              │
       * │ Remote Shell Handler: initialized           │
       * │                                             │
       * │ Available Targets:                          │
       * │   • Container runtimes: podman              │
       * │   • SSH connectivity: available             │
       * └─────────────────────────────────────────────┘
       */

      await orchestrator.initialize({
        defaultBinaryPath: './rexx-linux-x64'
      });

      expect(orchestrator.activeDeployments.size).toBe(0);

      // INTERACTION: Setup development environment (container)
      let result = await orchestrator.handleMessage(
        'setup_container image="debian:stable" name="dev-env"',
        mockContext
      );

      /*
       * AFTER DEV SETUP: Development environment ready
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 1                       │
       * │                                             │
       * │ > dev-env (container)                       │
       * │   Image: debian:stable                      │
       * │   Status: ready                             │
       * │   RexxJS: deployed                          │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(orchestrator.activeDeployments.size).toBe(1);

      const devDeployment = orchestrator.activeDeployments.get(result.deploymentId);
      expect(devDeployment.type).toBe('container');
      expect(devDeployment.status).toBe('ready');

      // INTERACTION: Setup staging environment (remote)
      result = await orchestrator.handleMessage(
        'setup_remote_shell host="staging.example.com" user="staging" alias="staging-env"',
        mockContext
      );

      /*
       * AFTER STAGING SETUP: Multi-environment deployment active
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 2                       │
       * │                                             │
       * │ > dev-env (container)                       │
       * │   Image: debian:stable                      │
       * │   Status: ready                             │
       * │   RexxJS: deployed                          │
       * │                                             │
       * │ > staging-env (remote_shell)                │
       * │   Host: staging.example.com                 │
       * │   User: staging                             │
       * │   Status: ready                             │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(orchestrator.activeDeployments.size).toBe(2);

      const stagingDeployment = orchestrator.activeDeployments.get(result.deploymentId);
      expect(stagingDeployment.type).toBe('remote_shell');
      expect(stagingDeployment.status).toBe('ready');

      // INTERACTION: Deploy same application to both environments
      const appScript = 'SAY \'Application v1.0 deployed\'';

      const devResult = await orchestrator.handleMessage(
        `execute_remote script="${appScript}" target="dev-env"`,
        mockContext
      );
      const stagingResult = await orchestrator.handleMessage(
        `execute_remote script="${appScript}" target="staging-env"`,
        mockContext
      );

      expect(devResult.success).toBe(true);
      expect(devResult.deploymentType).toBe('container');

      expect(stagingResult.success).toBe(true);
      expect(stagingResult.deploymentType).toBe('remote_shell');

      // INTERACTION: Monitor both deployments
      const devMonitor = await orchestrator.handleMessage(
        'monitor_deployment target="dev-env"',
        mockContext
      );
      const stagingMonitor = await orchestrator.handleMessage(
        'monitor_deployment target="staging-env"',
        mockContext
      );

      expect(devMonitor.success).toBe(true);
      expect(devMonitor.lastExecution).toBeInstanceOf(Date);
      expect(stagingMonitor.success).toBe(true);
      expect(stagingMonitor.lastExecution).toBeInstanceOf(Date);

      // INTERACTION: Cleanup both environments
      await orchestrator.handleMessage('cleanup_deployment target="dev-env"', mockContext);
      await orchestrator.handleMessage('cleanup_deployment target="staging-env"', mockContext);

      /*
       * AFTER CLEANUP: Back to clean state
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 0                       │
       * │ Container Handler: initialized              │
       * │ Remote Shell Handler: initialized           │
       * │                                             │
       * │ Deployment History: 2 completed             │
       * └─────────────────────────────────────────────┘
       */

      expect(containerCommands()).toContain('remove name="dev-env" force=false');
      expect(remoteCommands()).toContain('disconnect connection="staging-env"');
      expect(orchestrator.activeDeployments.size).toBe(0);
    });

    it('should demonstrate progress monitoring workflow', async () => {
      /*
       * BEFORE: Progress monitoring setup
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Progress Callbacks: enabled                 │
       * │ Active Deployments: 0                       │
       * │                                             │
       * │ CHECKPOINT Communication Bus:               │
       * │   Director ←→ Worker                        │
       * │   Status: ready                             │
       * └─────────────────────────────────────────────┘
       */

      await orchestrator.initialize({
        enableProgressCallbacks: true,
        defaultBinaryPath: './rexx-linux-x64'
      });

      // INTERACTION: Deploy with progress monitoring
      await orchestrator.handleMessage(
        'setup_remote_shell host="worker.example.com" user="deployer" alias="progress-demo"',
        mockContext
      );

      const progressScript = 'CHECKPOINT(\'task_start\', \'Long-running task initiated\')';

      /*
       * DURING EXECUTION: Progress updates flowing
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 1                       │
       * │                                             │
       * │ > progress-demo (remote_shell)              │
       * │   Status: executing                         │
       * │                                             │
       * │ CHECKPOINT Flow:                            │
       * │   task_start ✓                             │
       * └─────────────────────────────────────────────┘
       */

      const result = await orchestrator.handleMessage(
        `execute_remote script="${progressScript}" target="progress-demo" progress=true`,
        mockContext
      );

      /*
       * AFTER EXECUTION: Progress monitoring completed
       * ┌─────────────────────────────────────────────┐
       * │ Deployment Orchestrator                     │
       * │ Active Deployments: 1                       │
       * │                                             │
       * │ > progress-demo (remote_shell)              │
       * │   Status: ready                             │
       * │   Last Execution: successful                │
       * │                                             │
       * │ Checkpoint: completed                       │
       * └─────────────────────────────────────────────┘
       */

      expect(result.success).toBe(true);
      expect(result.checkpointId).toMatch(/^deploy_\d+_/);

      // The script sent out carries the CHECKPOINT plumbing plus the original
      const sent = remoteCommands().find(command => command.includes('CHECKPOINT_REMOTE'));
      expect(sent).toContain(`checkpoint_id = "${result.checkpointId}"`);
      expect(sent).toContain(progressScript);

      const status = await orchestrator.handleMessage(
        `get_checkpoint checkpoint_id="${result.checkpointId}"`,
        mockContext
      );
      expect(status.success).toBe(true);
      expect(status.status).toBe('completed');

      const listed = await orchestrator.handleMessage('list_checkpoints', mockContext);
      expect(listed.activeCheckpoints).toBe(1);
      expect(listed.checkpoints[0].checkpointId).toBe(result.checkpointId);

      const deployment = orchestrator.activeDeployments.get('remote_progress-demo_1');
      expect(deployment.lastExecution).toBeInstanceOf(Date);
    });
  });
});
