const { createTestHandler } = require('./test-helper');
const { parseMemoryLimit, validateCommand, validateVolumePath } = require('../../_shared/provisioning-shared-utils');

describe('ADDRESS PODMAN Handler - Security Tests', () => {
  let containerCounter = 0;
  const getContainerName = () => `security-test-${containerCounter++}`;

  async function createHandler(config = {}) {
    return await createTestHandler(config);
  }

  describe('Enhanced Security Validation', () => {
    test('should reject containers with excessive memory limits', async () => {
      const handler = await createHandler({ securityMode: 'strict' });
      const containerName = getContainerName();
      
      const result = await handler.handleAddressCommand(`create image=debian:stable name=${containerName} memory=10g`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Memory limit 10g exceeds maximum allowed 2g');
    });

    test('should reject containers with excessive CPU limits', async () => {
      const handler = await createHandler({ securityMode: 'strict' });
      const containerName = getContainerName();
      
      const result = await handler.handleAddressCommand(`create image=debian:stable name=${containerName} cpus=8.0`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CPU limit 8.0 exceeds maximum allowed 4.0');
    });

    test('should reject unauthorized volume paths', async () => {
      const handler = await createHandler({ securityMode: 'strict' });
      const containerName = getContainerName();
      
      const result = await handler.handleAddressCommand(`create image=debian:stable name=${containerName} volumes="/etc:/container-etc"`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Volume path /etc not allowed by security policy');
    });

    test('should allow authorized volume paths', async () => {
      const handler = await createHandler({ securityMode: 'moderate' });
      const containerName = getContainerName();
      
      const result = await handler.handleAddressCommand(`create image=debian:stable name=${containerName} volumes="/tmp:/container-tmp"`);
      
      expect(result.success).toBe(true);
      expect(result.volumes).toBe('/tmp:/container-tmp');
    });

    test('should reject privileged containers when not allowed', async () => {
      const handler = await createHandler({ securityMode: 'strict' });
      const containerName = getContainerName();
      
      const result = await handler.handleAddressCommand(`create image=debian:stable name=${containerName} privileged=true`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Privileged containers not allowed by security policy');
    });
  });

  describe('Command Security Validation', () => {
    test('should block dangerous rm commands', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`execute container=${containerName} command="rm -rf /usr"`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Command blocked by security policy');
      expect(result.error).toContain('dangerous pattern');
    });

    test('should block banned command patterns', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`execute container=${containerName} command="dd if=/dev/zero of=/dev/sda"`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Command blocked by security policy');
    });

    test('should allow safe commands', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`execute container=${containerName} command="echo hello"`);
      
      expect(result.success).toBe(true);
      expect(result.operation).toBe('execute');
    });

    test('should detect chained dangerous commands', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      const result = await handler.handleAddressCommand(`execute container=${containerName} command="echo test; rm /important/file"`);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Command blocked by security policy');
    });
  });

  describe('Security Audit Logging', () => {
    test('should log security events to audit log', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      // Trigger a security violation
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName} memory=10g`);
      
      const auditResult = await handler.handleAddressCommand('security_audit');
      
      expect(auditResult.success).toBe(true);
      expect(auditResult.operation).toBe('security_audit');
      expect(auditResult.events.length).toBeGreaterThan(0);
      expect(auditResult.securityMode).toBe('moderate');
      
      const violationEvent = auditResult.events.find(e => e.event === 'security_violation');
      expect(violationEvent).toBeDefined();
      expect(violationEvent.details.violations).toContain('Memory limit 10g exceeds maximum allowed 2g');
    });

    test('should track binary validation events', async () => {
      const handler = await createHandler({ securityMode: 'strict' });
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      // Trigger binary validation
      await handler.handleAddressCommand(`deploy_rexx container=${containerName} rexx_binary=/untrusted/path`);
      
      const auditResult = await handler.handleAddressCommand('security_audit');
      
      const binaryEvent = auditResult.events.find(e => e.event === 'binary_validation');
      expect(binaryEvent).toBeDefined();
      expect(binaryEvent.details.path).toBe('/untrusted/path');
    });

    test('should track blocked commands', async () => {
      const handler = await createHandler();
      const containerName = getContainerName();
      
      await handler.handleAddressCommand(`create image=debian:stable name=${containerName}`);
      await handler.handleAddressCommand(`start name=${containerName}`);
      
      // Try to execute dangerous command
      await handler.handleAddressCommand(`execute container=${containerName} command="rm -rf /"`);
      
      const auditResult = await handler.handleAddressCommand('security_audit');
      
      const commandEvent = auditResult.events.find(e => e.event === 'command_blocked');
      expect(commandEvent).toBeDefined();
      expect(commandEvent.details.command).toBe('rm -rf /');
    });

    test('should include security policies in audit response', async () => {
      const handler = await createHandler();
      
      const auditResult = await handler.handleAddressCommand('security_audit');
      
      expect(auditResult.policies).toBeDefined();
      expect(auditResult.policies.maxMemory).toBe('2g');
      expect(auditResult.policies.maxCpus).toBe('4.0');
      expect(auditResult.policies.allowPrivileged).toBe(false);
    });
  });

  describe('Memory Limit Parsing', () => {
    test('should parse memory limits correctly', async () => {
      expect(parseMemoryLimit('512m')).toBe(512 * 1024 * 1024);
      expect(parseMemoryLimit('2g')).toBe(2 * 1024 * 1024 * 1024);
      expect(parseMemoryLimit('1024k')).toBe(1024 * 1024);
      expect(parseMemoryLimit('1t')).toBe(1024 * 1024 * 1024 * 1024);
      expect(parseMemoryLimit('invalid')).toBe(0);
    });
  });

  describe('Volume Path Validation', () => {
    test('should validate volume paths in different security modes', async () => {
      const strictHandler = await createHandler({ securityMode: 'strict' });
      const moderateHandler = await createHandler({ securityMode: 'moderate' });
      const permissiveHandler = await createHandler({ securityMode: 'permissive' });
      
      // Test allowed path
      expect(validateVolumePath('/tmp', strictHandler.securityMode, strictHandler.securityPolicies.allowedVolumePaths)).toBe(true);
      expect(validateVolumePath('/tmp', moderateHandler.securityMode, moderateHandler.securityPolicies.allowedVolumePaths)).toBe(true);
      expect(validateVolumePath('/tmp', permissiveHandler.securityMode, permissiveHandler.securityPolicies.allowedVolumePaths)).toBe(true);
      
      // Test disallowed path in strict mode
      expect(validateVolumePath('/etc', strictHandler.securityMode, strictHandler.securityPolicies.allowedVolumePaths)).toBe(false);
      expect(validateVolumePath('/etc', permissiveHandler.securityMode, permissiveHandler.securityPolicies.allowedVolumePaths)).toBe(true);
      
      // Test current directory in moderate mode
      const cwd = process.cwd();
      expect(validateVolumePath(`${cwd}/data`, moderateHandler.securityMode, moderateHandler.securityPolicies.allowedVolumePaths)).toBe(true);
      expect(validateVolumePath(`${cwd}/data`, strictHandler.securityMode, strictHandler.securityPolicies.allowedVolumePaths)).toBe(false);
    });
  });

  describe('Security Mode Configuration', () => {
    test('should accept different security configurations', async () => {
      const customHandler = await createHandler({
        securityMode: 'strict',
        securityPolicies: {
          maxMemory: '1g',
          maxCpus: '2.0',
          allowedVolumePaths: ['/custom/path']
        }
      });
      
      // Test that configuration was applied (would need to be implemented)
      expect(customHandler.securityMode).toBe('strict');
    });
  });

  describe('Command Pattern Validation', () => {
    test('should validate various command patterns', async () => {
      const handler = await createHandler();
      
      // Safe commands should pass
      expect(validateCommand('ls -la', handler.securityPolicies.bannedCommands)).toHaveLength(0);
      expect(validateCommand('echo "hello world"', handler.securityPolicies.bannedCommands)).toHaveLength(0);
      expect(validateCommand('cat /etc/passwd', handler.securityPolicies.bannedCommands)).toHaveLength(0);
      
      // Dangerous commands should be blocked (may have multiple violations)
      expect(validateCommand('rm -rf /home', handler.securityPolicies.bannedCommands).length).toBeGreaterThan(0);
      expect(validateCommand('dd if=/dev/zero of=/dev/sda', handler.securityPolicies.bannedCommands).length).toBeGreaterThan(0);
      expect(validateCommand('echo test; rm important.txt', handler.securityPolicies.bannedCommands)).toHaveLength(1);
      expect(validateCommand('command > /dev/null &', handler.securityPolicies.bannedCommands).length).toBeGreaterThan(0);
    });
  });
});