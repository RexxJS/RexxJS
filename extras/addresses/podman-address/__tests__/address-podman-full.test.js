/**
 * ADDRESS PODMAN Handler Tests - Complete Test Suite
 * Tests for all functionality with proper mock mode setup
 */

const { createTestHandler } = require('./test-helper');
const { parseCommand } = require('../../_shared/provisioning-shared-utils');

describe('ADDRESS PODMAN Handler - Full Suite', () => {

  // Helper function to create a properly initialized handler with mocked dependencies
  async function createMockHandler(config = {}) {
    return await createTestHandler(config);
  }

  describe('Initialization', () => {
    test('should initialize with default configuration', async () => {
      const handler = await createMockHandler();
      
      expect(handler.runtime).toBe('podman');
      expect(handler.securityMode).toBe('moderate');
      expect(handler.maxContainers).toBe(20);
    });

    test('should initialize with custom configuration', async () => {
      const handler = await createMockHandler({
        securityMode: 'strict',
        maxContainers: 10,
        allowedImages: ['ubuntu:20.04', 'alpine:3.14']
      });

      expect(handler.securityMode).toBe('strict');
      expect(handler.maxContainers).toBe(10);
      expect(handler.allowedImages.has('ubuntu:20.04')).toBe(true);
      expect(handler.allowedImages.has('alpine:3.14')).toBe(true);
    });
  });

  describe('Command Parsing', () => {
    test('should parse simple status command', async () => {
      const handler = await createMockHandler();
      const parsed = parseCommand('status');
      
      expect(parsed.operation).toBe('status');
      expect(parsed.params).toEqual({});
    });

    test('should parse create command with parameters', async () => {
      const handler = await createMockHandler();
      const parsed = parseCommand('create image=debian:stable name=test-container');
      
      expect(parsed.operation).toBe('create');
      expect(parsed.params.image).toBe('debian:stable');
      expect(parsed.params.name).toBe('test-container');
    });

    test('should parse parameters with quoted values', async () => {
      const handler = await createMockHandler();
      const parsed = parseCommand('create image="debian:stable" name="test container"');
      
      expect(parsed.operation).toBe('create');
      expect(parsed.params.image).toBe('debian:stable');
      expect(parsed.params.name).toBe('test container');
    });
  });

  describe('Status Operations', () => {
    test('should return status information', async () => {
      const handler = await createMockHandler();
      const result = await handler.handleAddressCommand('status');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('status');
      expect(result.runtime).toBe('podman');
      expect(result.activeContainers).toBe(0);
      expect(result.maxContainers).toBe(20);
      expect(result.securityMode).toBe('moderate');
    });

    test('should list empty containers initially', async () => {
      const handler = await createMockHandler();
      const result = await handler.handleAddressCommand('list');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('list');
      expect(result.containers).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('Container Lifecycle', () => {
    test('should create a container successfully', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=test-container');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.container).toBe('test-container');
      expect(result.image).toBe('debian:stable');
      expect(result.status).toBe('created');
      expect(result.output).toContain('created successfully');
    });

    test('should auto-generate container name if not provided', async () => {
      const handler = await createMockHandler();
      const result = await handler.handleAddressCommand('create image=debian:stable');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.container).toMatch(/^podman-container-\d+$/);
    });

    test('should start a container', async () => {
      const handler = await createMockHandler();
      
      // First create a container
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      
      // Then start it
      const result = await handler.handleAddressCommand('start name=test-container');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('start');
      expect(result.container).toBe('test-container');
      expect(result.status).toBe('running');
      expect(result.output).toContain('started successfully');
    });

    test('should stop a container', async () => {
      const handler = await createMockHandler();
      
      // Create and start container
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      // Stop it
      const result = await handler.handleAddressCommand('stop name=test-container');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('stop');
      expect(result.container).toBe('test-container');
      expect(result.status).toBe('stopped');
      expect(result.output).toContain('stopped successfully');
    });

    test('should remove a container', async () => {
      const handler = await createMockHandler();
      
      // Create container
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      
      // Remove it
      const result = await handler.handleAddressCommand('remove name=test-container');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('remove');
      expect(result.container).toBe('test-container');
      expect(result.output).toContain('removed successfully');
    });

    test('should list created containers', async () => {
      const handler = await createMockHandler();
      
      // Create some containers
      await handler.handleAddressCommand('create image=debian:stable name=container1');
      await handler.handleAddressCommand('create image=alpine:latest name=container2');
      
      const result = await handler.handleAddressCommand('list');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('list');
      expect(result.count).toBe(2);
      expect(result.containers).toHaveLength(2);
      
      const containerNames = result.containers.map(c => c.name);
      expect(containerNames).toContain('container1');
      expect(containerNames).toContain('container2');
    });
  });

  describe('Security and Validation', () => {
    test('should reject unauthorized images in strict mode', async () => {
      const handler = await createMockHandler({
        securityMode: 'strict',
        allowedImages: ['debian:stable']
      });

      const result = await handler.handleAddressCommand('create image=unauthorized:latest name=test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Image not allowed in strict mode');
    });

    test('should enforce container limits', async () => {
      const handler = await createMockHandler({ maxContainers: 1 });
      
      // Create first container (should succeed)
      await handler.handleAddressCommand('create image=debian:stable name=container1');
      
      // Try to create second container (should fail)
      const result = await handler.handleAddressCommand('create image=debian:stable name=container2');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum containers reached');
    });

    test('should handle missing required parameters', async () => {
      const handler = await createMockHandler();

      const result = await handler.handleAddressCommand('create name=test-container');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameter: image');
    });

    test('should handle operations on non-existent containers', async () => {
      const handler = await createMockHandler();

      const result = await handler.handleAddressCommand('start name=non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: non-existent');
    });
  });

  describe('File Operations and Management', () => {
    test('should copy file to container (mock mode)', async () => {
      const handler = await createMockHandler();
      
      // Create a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      
      const result = await handler.handleAddressCommand('copy_to container=test-container local=/host/file.txt remote=/container/file.txt');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('copy_to');
      expect(result.container).toBe('test-container');
      expect(result.localPath).toBe('/host/file.txt');
      expect(result.remotePath).toBe('/container/file.txt');
      expect(result.output).toContain('Copied');
    });

    test('should handle copy_to with missing parameters', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('copy_to container=test-container local=/host/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('copy_to requires container, local, and remote parameters');
    });

    test('should handle copy_to to non-existent container', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('copy_to container=non-existent local=/host/file.txt remote=/container/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: non-existent');
    });

    test('should copy file from container (mock mode)', async () => {
      const handler = await createMockHandler();
      
      // Create a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      
      const result = await handler.handleAddressCommand('copy_from container=test-container remote=/container/file.txt local=/host/file.txt');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('copy_from');
      expect(result.container).toBe('test-container');
      expect(result.remotePath).toBe('/container/file.txt');
      expect(result.localPath).toBe('/host/file.txt');
      expect(result.output).toContain('Copied');
    });

    test('should handle copy_from with missing parameters', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('copy_from container=test-container remote=/container/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('copy_from requires container, remote, and local parameters');
    });

    test('should handle copy_from from non-existent container', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('copy_from container=non-existent remote=/container/file.txt local=/host/file.txt');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: non-existent');
    });

    test('should get container logs (mock mode)', async () => {
      const handler = await createMockHandler();
      
      // Create a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      
      const result = await handler.handleAddressCommand('logs container=test-container');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('logs');
      expect(result.container).toBe('test-container');
      expect(result.lines).toBe(50); // default
      expect(result.output).toContain('Retrieved logs from');
    });

    test('should get container logs with custom line count', async () => {
      const handler = await createMockHandler();
      
      // Create a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      
      const result = await handler.handleAddressCommand('logs container=test-container lines=10');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('logs');
      expect(result.container).toBe('test-container');
      expect(result.lines).toBe(10);
      expect(result.logs).toBeDefined();
    });

    test('should handle logs with missing container parameter', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('logs lines=50');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('logs requires container parameter');
    });

    test('should handle logs from non-existent container', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('logs container=non-existent');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: non-existent');
    });

    test('should cleanup stopped containers only (mock mode)', async () => {
      const handler = await createMockHandler();
      
      // Create some containers with different states
      await handler.handleAddressCommand('create image=debian:stable name=container1');
      await handler.handleAddressCommand('create image=debian:stable name=container2');
      await handler.handleAddressCommand('start name=container1'); // running
      // container2 remains in 'created' state
      
      const result = await handler.handleAddressCommand('cleanup');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('cleanup');
      expect(result.cleaned).toBe(1); // only container2 (created state)
      expect(result.remaining).toBe(1); // container1 still running
      expect(result.all).toBe(false);
      expect(result.output).toContain('Cleaned up');
    });

    test('should cleanup all containers (mock mode)', async () => {
      const handler = await createMockHandler();
      
      // Create some containers
      await handler.handleAddressCommand('create image=debian:stable name=container1');
      await handler.handleAddressCommand('create image=debian:stable name=container2');
      await handler.handleAddressCommand('start name=container1'); // running
      
      const result = await handler.handleAddressCommand('cleanup all=true');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('cleanup');
      expect(result.cleaned).toBe(2); // both containers
      expect(result.remaining).toBe(0); // no containers left
      expect(result.all).toBe(true);
      expect(result.output).toContain('Cleaned up');
    });

    test('should handle cleanup with no containers', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('cleanup');

      expect(result.success).toBe(true);
      expect(result.operation).toBe('cleanup');
      expect(result.cleaned).toBe(0);
      expect(result.remaining).toBe(0);
      expect(result.all).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      const handler = await createMockHandler();

      const result = await handler.handleAddressCommand('unknown-command');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown ADDRESS PODMAN command: unknown-command');
    });

    test('should handle malformed commands', async () => {
      const handler = await createMockHandler();

      const result = await handler.handleAddressCommand('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown ADDRESS PODMAN command:');
    });

    test('should handle complex command parsing edge cases', async () => {
      const handler = await createMockHandler();
      
      // Test command with no operation
      const result1 = await handler.handleAddressCommand('  ');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Unknown ADDRESS PODMAN command:');
      
      // Test command with just spaces and equals
      const result2 = await handler.handleAddressCommand('   =  ');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Unknown ADDRESS PODMAN command:');
    });
  });

  describe('Container Management Edge Cases', () => {
    test('should handle container operations with exact status states', async () => {
      const handler = await createMockHandler();
      
      // Create a container and check its exact state
      const createResult = await handler.handleAddressCommand('create image=debian:stable name=state-test');
      expect(createResult.success).toBe(true);
      expect(createResult.status).toBe('created');
      
      // Check it shows up in list with correct state
      const listResult = await handler.handleAddressCommand('list');
      expect(listResult.containers[0].status).toBe('created');
      
      // Start container and verify state change
      const startResult = await handler.handleAddressCommand('start name=state-test');
      expect(startResult.success).toBe(true);
      expect(startResult.status).toBe('running');
      
      // Verify list shows updated state
      const listResult2 = await handler.handleAddressCommand('list');
      expect(listResult2.containers[0].status).toBe('running');
    });

    test('should handle complex quoted parameter parsing', async () => {
      const handler = await createMockHandler();
      
      // Test complex quoted string with spaces and special characters
      const result = await handler.handleAddressCommand('create image="debian:stable" name="test-container-123" env="PATH=/usr/bin:/bin HOME=/root"');
      
      expect(result.success).toBe(true);
      expect(result.container).toBe('test-container-123');
      expect(result.image).toBe('debian:stable');
    });

    test('should handle containers with underscore names', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=test_container_with_underscores');
      
      expect(result.success).toBe(true);
      expect(result.container).toBe('test_container_with_underscores');
    });

    test('should handle auto-generated names with consistent counter', async () => {
      const handler = await createMockHandler();
      
      // Create multiple containers without names
      const result1 = await handler.handleAddressCommand('create image=debian:stable');
      const result2 = await handler.handleAddressCommand('create image=debian:stable');
      const result3 = await handler.handleAddressCommand('create image=debian:stable');
      
      expect(result1.container).toBe('podman-container-1');
      expect(result2.container).toBe('podman-container-2');
      expect(result3.container).toBe('podman-container-3');
    });
  });

  describe('Advanced Command Operations', () => {
    test('should handle deploy_rexx command', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('deploy_rexx container=test-container rexx_binary=/path/to/rexx script=/path/to/script.rexx');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: test-container');
    });

    test('should validate binary path security with deploy_rexx', async () => {
      const handler = await createMockHandler();
      
      // Create and start a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      // Test security validation in strict mode
      handler.securityMode = 'strict';
      handler.trustedBinaries = new Set();
      
      const result = await handler.handleAddressCommand('deploy_rexx container=test-container rexx_binary=/untrusted/path/rexx-linux-x64');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not trusted by security policy');
    });

    test('should allow trusted binary in strict mode', async () => {
      const handler = await createMockHandler();
      
      // Test with trusted binary in strict mode
      handler.securityMode = 'strict';
      const trustedPath = '/trusted/rexx-linux-x64';
      handler.trustedBinaries = new Set([trustedPath]);
      
      // Create and start a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      // Mock fs.existsSync to return true for the trusted path
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      
      const result = await handler.handleAddressCommand(`deploy_rexx container=test-container rexx_binary=${trustedPath}`);
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('deploy_rexx');
      expect(result.binary).toBe(trustedPath);
      
      // Restore original function
      fs.existsSync = originalExistsSync;
    });

    test('should allow current directory binaries in moderate mode', async () => {
      const handler = await createMockHandler();
      
      // Test with current directory path in moderate mode
      handler.securityMode = 'moderate';
      const cwd = process.cwd();
      const moderatePath = `${cwd}/rexx-linux-x64`;
      
      // Create and start a container first
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      // Mock fs.existsSync to return true for the path
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(true);
      
      const result = await handler.handleAddressCommand(`deploy_rexx container=test-container rexx_binary=${moderatePath}`);
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('deploy_rexx');
      expect(result.binary).toBe(moderatePath);
      
      // Restore original function
      fs.existsSync = originalExistsSync;
    });

    test('should handle execute command', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('execute container=test-container command="echo hello"');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: test-container');
    });

    test('should handle execute_rexx command', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('execute_rexx container=test-container script=/path/to/script.rexx');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container not found: test-container');
    });

    test('should execute RexxJS script in mock mode', async () => {
      const handler = await createMockHandler();
      
      // Create, start container, and deploy rexx
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      // Mock deploy_rexx
      const container = handler.activeContainers.get('test-container');
      container.rexxDeployed = true;
      container.rexxPath = '/usr/local/bin/rexx';
      
      const result = await handler.handleAddressCommand('execute_rexx container=test-container script="SAY \'Hello from RexxJS!\'"');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('execute_rexx');
      expect(result.container).toBe('test-container');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Hello from RexxJS!');
    });

    test('should execute RexxJS script with progress monitoring', async () => {
      const handler = await createMockHandler();
      
      // Create, start container, and deploy rexx
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      const container = handler.activeContainers.get('test-container');
      container.rexxDeployed = true;
      container.rexxPath = '/usr/local/bin/rexx';
      
      const result = await handler.handleAddressCommand('execute_rexx container=test-container script="SAY \'Progress test\'" progress_callback=true');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('execute_rexx');
      expect(result.container).toBe('test-container');
      expect(result.exitCode).toBe(0);
    });

    test('should handle execute_rexx with script file', async () => {
      const handler = await createMockHandler();
      
      // Create, start container, and deploy rexx
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      const container = handler.activeContainers.get('test-container');
      container.rexxDeployed = true;
      container.rexxPath = '/usr/local/bin/rexx';
      
      // Mock file system for script file
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue('SAY "Hello from script file!"');
      
      const result = await handler.handleAddressCommand('execute_rexx container=test-container script_file=/path/to/test.rexx');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('execute_rexx');
      expect(result.stdout).toContain('Hello from script file!');
      
      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    test('should validate RexxJS deployment before execution', async () => {
      const handler = await createMockHandler();
      
      // Create and start container without deploying rexx
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      const result = await handler.handleAddressCommand('execute_rexx container=test-container script="SAY \'Should fail\'"');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('RexxJS binary not deployed');
      expect(result.error).toContain('Use deploy_rexx first');
    });

    test('should handle timeout parameter in execute_rexx', async () => {
      const handler = await createMockHandler();
      
      // Create, start container, and deploy rexx
      await handler.handleAddressCommand('create image=debian:stable name=test-container');
      await handler.handleAddressCommand('start name=test-container');
      
      const container = handler.activeContainers.get('test-container');
      container.rexxDeployed = true;
      container.rexxPath = '/usr/local/bin/rexx';
      
      const result = await handler.handleAddressCommand('execute_rexx container=test-container script="SAY \'Timeout test\'" timeout=5000');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('execute_rexx');
    });

    test('should create interactive container with resource limits', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=interactive-container interactive=true memory=1g cpus=2.0');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.container).toBe('interactive-container');
      expect(result.interactive).toBe(true);
      expect(result.memory).toBe('1g');
      expect(result.cpus).toBe('2.0');
    });

    test('should create container with volume mounts', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=volume-container volumes="/tmp/data:/container/data,/var/tmp/logs:/container/logs"');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.container).toBe('volume-container');
      expect(result.volumes).toBe('/tmp/data:/container/data,/var/tmp/logs:/container/logs');
    });

    test('should create container with environment variables', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=env-container environment="NODE_ENV=production,DEBUG=true,PORT=8080"');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.container).toBe('env-container');
      expect(result.environment).toBe('NODE_ENV=production,DEBUG=true,PORT=8080');
    });

    test('should create container with all advanced options', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=advanced-container interactive=true memory=512m cpus=1.5 volumes="/tmp:/app/data" environment="ENV=test,DEBUG=1"');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('create');
      expect(result.container).toBe('advanced-container');
      expect(result.interactive).toBe(true);
      expect(result.memory).toBe('512m');
      expect(result.cpus).toBe('1.5');
      expect(result.volumes).toBe('/tmp:/app/data');
      expect(result.environment).toBe('ENV=test,DEBUG=1');
    });

    test('should list containers with advanced properties', async () => {
      const handler = await createMockHandler();
      
      // Create containers with different properties
      await handler.handleAddressCommand('create image=debian:stable name=simple-container');
      await handler.handleAddressCommand('create image=ubuntu:latest name=interactive-container interactive=true memory=1g');
      
      const result = await handler.handleAddressCommand('list');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('list');
      expect(result.containers).toHaveLength(2);
      
      const simpleContainer = result.containers.find(c => c.name === 'simple-container');
      const interactiveContainer = result.containers.find(c => c.name === 'interactive-container');
      
      expect(simpleContainer.interactive).toBe(false);
      expect(interactiveContainer.interactive).toBe(true);
      expect(interactiveContainer.memory).toBe('1g');
    });
  });

  describe('Edge Cases and Complex Parsing', () => {
    test('should handle commands with special characters', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image="debian:stable" name="my-test-123_container"');
      
      expect(result.success).toBe(true);
      expect(result.container).toBe('my-test-123_container');
    });

    test('should handle commands with equals signs in values', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name=test env="PATH=/usr/bin:/bin"');
      
      expect(result.success).toBe(true);
      expect(result.container).toBe('test');
    });

    test('should handle mixed quoted and unquoted parameters', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image="debian:stable" name=simple-name port=8080');
      
      expect(result.success).toBe(true);
      expect(result.container).toBe('simple-name');
    });

    test('should handle empty parameter values', async () => {
      const handler = await createMockHandler();
      
      const result = await handler.handleAddressCommand('create image=debian:stable name= port=8080');
      
      expect(result.success).toBe(true);
      expect(result.container).toMatch(/^podman-container-\d+$/); // Should auto-generate
    });

    test('should validate security mode settings', async () => {
      const handler = await createMockHandler({ securityMode: 'permissive' });
      
      expect(handler.securityMode).toBe('permissive');
      
      const result = await handler.handleAddressCommand('create image=any:image name=test');
      expect(result.success).toBe(true); // Permissive mode allows any image
    });

    test('should handle container name conflicts', async () => {
      const handler = await createMockHandler();
      
      // Create first container
      await handler.handleAddressCommand('create image=debian:stable name=duplicate-name');
      
      // Try to create second container with same name
      const result = await handler.handleAddressCommand('create image=debian:stable name=duplicate-name');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Container name already exists: duplicate-name');
    });

    test('should handle context variable interpolation', async () => {
      const handler = await createMockHandler();
      const context = {
        imageName: 'debian:stable',
        containerName: 'interpolated-test'
      };
      
      const result = await handler.handleAddressCommand('create image={imageName} name={containerName}', context);
      
      expect(result.success).toBe(true);
      expect(result.container).toBe('interpolated-test');
      expect(result.image).toBe('debian:stable');
    });
  });

});