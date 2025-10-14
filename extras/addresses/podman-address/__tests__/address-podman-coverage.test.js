/**
 * Additional Coverage Tests for ADDRESS PODMAN Handler
 * These tests target uncovered code paths to increase coverage
 */

const { createTestHandler } = require('./test-helper');
const { AddressPodmanHandler } = require('../podman-address');
const { validateBinaryPath } = require('../../_shared/provisioning-shared-utils');


describe('ADDRESS PODMAN Handler - Coverage Tests', () => {
  let containerCounter = 0;
  const getContainerName = () => `coverage-test-${containerCounter++}`;

  // Helper function to create a handler
  async function createHandler(config = {}) {
    return await createTestHandler(config);
  }

  describe('Initialization Edge Cases', () => {
    test('should handle initialization with all configuration options', async () => {
      const handler = await createHandler({
        securityMode: 'strict',
        maxContainers: 5,
        allowedImages: ['alpine:latest'],
        trustedBinaries: ['/opt/rexx-linux-x64'],
        defaultTimeout: 45000
      });
      
      expect(handler.securityMode).toBe('strict');
      expect(handler.maxContainers).toBe(5);
      expect(handler.defaultTimeout).toBe(45000);
      expect(handler.allowedImages.has('alpine:latest')).toBe(true);
      expect(handler.trustedBinaries.has('/opt/rexx-linux-x64')).toBe(true);
    });

    test('should handle configuration with arrays', async () => {
      const handler = await createHandler({
        allowedImages: ['debian:stable', 'ubuntu:latest'],
        trustedBinaries: ['/bin/rexx', '/usr/local/bin/rexx']
      });
      
      expect(handler.allowedImages.size).toBe(2);
      expect(handler.trustedBinaries.size).toBe(2);
    });
  });

  describe('Security Validation Edge Cases', () => {
    test('should validate binary paths in permissive mode', async () => {
      const handler = await createHandler({ securityMode: 'permissive' });
      
      const result = validateBinaryPath('/any/random/path', handler.securityMode, handler.trustedBinaries, handler.auditSecurityEvent.bind(handler));
      expect(result).toBe(true);
    });

    test('should validate binary paths in strict mode with empty trusted set', async () => {
      const handler = await createHandler({ securityMode: 'strict' });
      handler.trustedBinaries.clear();
      
      const result = validateBinaryPath('/untrusted/path', handler.securityMode, handler.trustedBinaries, handler.auditSecurityEvent.bind(handler));
      expect(result).toBe(false);
    });

    test('should validate binary paths in moderate mode with current directory', async () => {
      const handler = await createHandler({ securityMode: 'moderate' });
      const cwd = process.cwd();
      
      const result = validateBinaryPath(`${cwd}/rexx-binary`, handler.securityMode, handler.trustedBinaries, handler.auditSecurityEvent.bind(handler));
      expect(result).toBe(true);
    });

    test('should validate binary paths with rexx-linux pattern', async () => {
      const handler = await createHandler({ securityMode: 'moderate' });
      
      const result = validateBinaryPath('/some/path/rexx-linux-x64', handler.securityMode, handler.trustedBinaries, handler.auditSecurityEvent.bind(handler));
      expect(result).toBe(true);
    });
  });

  describe('Parameter Parsing Edge Cases', () => {
    test('should parse key-value strings correctly', async () => {
      const handler = await createHandler();
      
      const parsed = handler.parseKeyValueString('key1=value1 key2=123 key3=test');
      expect(parsed.key1).toBe('value1');
      expect(parsed.key2).toBe(123); // Should be parsed as number
      expect(parsed.key3).toBe('test');
    });

    test('should handle malformed key-value strings', async () => {
      const handler = await createHandler();
      
      const parsed = handler.parseKeyValueString('invalid malformed=');
      expect(Object.keys(parsed)).toHaveLength(0);
    });

    test('should parse checkpoint output correctly', async () => {
      const handler = await createHandler();
      let checkpointCalled = false;
      let capturedParams = null;
      
      const mockCallback = (checkpoint, params) => {
        checkpointCalled = true;
        capturedParams = params;
      };
      
      const output = "CHECKPOINT('PROGRESS', 'stage=processing item=5 percent=50')";
      handler.parseCheckpointOutput(output, mockCallback);
      
      expect(checkpointCalled).toBe(true);
      expect(capturedParams.stage).toBe('processing');
      expect(capturedParams.item).toBe(5);
      expect(capturedParams.percent).toBe(50);
    });
  });

  describe('Container Operations Edge Cases', () => {
    test('should handle container creation with invalid image in strict mode', async () => {
      const handler = await createHandler({ 
        securityMode: 'strict',
        allowedImages: ['debian:stable']
      });
      const containerName = getContainerName();
      
      const result = await handler.handleAddressCommand(`create image=unauthorized:latest name=${containerName}`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Image not allowed in strict mode');
    });

    test('should handle container operations on non-existent containers', async () => {
      const handler = await createHandler();
      
      const startResult = await handler.handleAddressCommand('start name=non-existent');
      expect(startResult.success).toBe(false);
      expect(startResult.error).toContain('Container not found');
      
      const stopResult = await handler.handleAddressCommand('stop name=non-existent');
      expect(stopResult.success).toBe(false);
      expect(stopResult.error).toContain('Container not found');
      
      const removeResult = await handler.handleAddressCommand('remove name=non-existent');
      expect(removeResult.success).toBe(false);
      expect(removeResult.error).toContain('Container not found');
    });

    test('should handle starting already running container', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      // Try to start again
      const result = await handler.handleAddressCommand(`start name=${containerName}`);
      expect(result.success).toBe(false);
      expect(result.error).toContain('is already running');
    });

    test('should handle stopping non-running container', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      
      // Try to stop without starting
      const result = await handler.handleAddressCommand(`stop name=${containerName}`);
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not running');
    });
  });

  describe('File Operations Edge Cases', () => {
    test('should handle copy operations with missing parameters', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      const copyToResult = await handler.handleAddressCommand(`copy_to container=${containerName}`);
      expect(copyToResult.success).toBe(false);
      expect(copyToResult.error).toContain('requires container, local, and remote');
      
      const copyFromResult = await handler.handleAddressCommand('copy_from local=/tmp/test');
      expect(copyFromResult.success).toBe(false);
      expect(copyFromResult.error).toContain('requires container, remote, and local');
    });

    test('should handle logs with invalid line count', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`logs container=${containerName} lines=invalid`);
      expect(result.success).toBe(true);
      expect(result.lines).toBe(NaN);
    });
  });

  describe('RexxJS Operations Edge Cases', () => {
    test('should handle deploy_rexx with missing binary file', async () => {
      const handler = await createHandler({ securityMode: 'permissive' });
      const containerName = getContainerName();
      
      // Mock fs.existsSync to return false for this test
      const fs = require('fs');
      const originalExistsSync = fs.existsSync;
      fs.existsSync = jest.fn().mockReturnValue(false);
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`deploy_rexx container=${containerName} rexx_binary=/nonexistent/path`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('RexxJS binary not found');

      // Restore original function
      fs.existsSync = originalExistsSync;
    });

    test('should handle execute_rexx with script file in mock mode', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const container = handler.activeContainers.get(containerName);
      container.rexxDeployed = true;
      container.rexxPath = '/usr/local/bin/rexx';
      
      // Mock fs.readFileSync
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockReturnValue('SAY "Hello from file"');
      
      const result = await handler.handleAddressCommand(`execute_rexx container=${containerName} script_file=/test/script.rexx`);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Hello from file');
      
      // Restore original function
      fs.readFileSync = originalReadFileSync;
    });

    test('should handle execute_rexx without script or script_file', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`execute_rexx container=${containerName}`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });
  });

  describe('Cleanup Operations Edge Cases', () => {
    test('should handle cleanup with mixed container states', async () => {
      const handler = await createHandler();
      const containerName1 = getContainerName();
      const containerName2 = getContainerName();
      const containerName3 = getContainerName();
      
      // Create containers in different states
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName1}`);
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName2}`);
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName3}`);
      
      await handler.handleAddressCommand(`start name=${containerName1}`);
      await handler.handleAddressCommand(`start name=${containerName2}`);
      await handler.handleAddressCommand(`stop name=${containerName2}`);
      // container3 remains in 'created' state
      
      const result = await handler.handleAddressCommand('cleanup');
      
      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(2); // container2 (stopped) and container3 (created)
      expect(result.remaining).toBe(1); // container1 still running
    });

    test('should handle cleanup all with force', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand('cleanup all=true');
      
      expect(result.success).toBe(true);
      expect(result.cleaned).toBe(1);
      expect(result.all).toBe(true);
    });
  });

  describe('Unknown Command Handling', () => {
    test('should handle unknown commands gracefully', async () => {
      const handler = await createHandler();
      
      const result = await handler.handleAddressCommand('unknown_command param1=value1');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown ADDRESS PODMAN command: unknown_command');
    });

    test('should handle malformed commands', async () => {
      const handler = await createHandler();
      
      const result = await handler.handleAddressCommand('');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown ADDRESS PODMAN command:');
    });
  });

  describe('Status and Information', () => {
    test('should return comprehensive status information', async () => {
      const handler = await createHandler();
      const containerName1 = getContainerName();
      const containerName2 = getContainerName();
      
      // Create some containers
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName1}`);
      await handler.handleAddressCommand(`create image=ubuntu:latest name=${containerName2}`);
      
      const result = await handler.handleAddressCommand('status');
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('status');
      expect(result.activeContainers).toBe(2);
      expect(result.securityMode).toBe('moderate');
      expect(result.runtime).toBe('podman');
    });
  });
});